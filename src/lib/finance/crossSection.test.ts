import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import { inverse, matMul, transpose } from '../math/linalg';
import { normalRng } from '../math/rng';
import { ols } from '../stats/ols';
import { sampleCovariance, sampleMeans } from './portfolio';
import { crossSectionalRegression, famaMacBeth, shankenCorrection, simulateTwoPass } from './crossSection';
import { factorPanel, timeSeriesRegressions } from './timeSeriesTests';

const ff3 = await loadSeries('ff3-monthly');
const ff25 = await loadSeries('ff25-size-bm-monthly');

// Three assets, one factor: β = (0.5, 1, 1.5), R̄^e = (1, 2, 4), Σ_ε = diag(1, 2, 4).
// Spread of R̄^e around its average 7/3: Σ (R̄^e_i - 7/3)² = 14/3.
const beta3 = [[0.5], [1], [1.5]];
const mean3 = [1, 2, 4];
const sigma3 = [[1, 0, 0], [0, 2, 0], [0, 0, 4]];

// Seeded panel with K = 2 factors, N = 6 assets, T = 120 months.
function seededPanel(seed: number, T = 120, N = 6, K = 2) {
  const z = normalRng(seed);
  const factors = Array.from({ length: T }, () => Array.from({ length: K }, (_, k) => 0.005 + 0.003 * k + 0.04 * z()));
  const loadings = Array.from({ length: N }, () => Array.from({ length: K }, () => 0.5 + z()));
  const excess = factors.map((f) => loadings.map((b) => b.reduce((s, bk, k) => s + bk * f[k], 0) + 0.02 * z()));
  return { excess, factors };
}

function expectClose(actual: readonly number[], expected: readonly number[], digits: number) {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((value, i) => expect(actual[i]).toBeCloseTo(value, digits));
}

describe('crossSectionalRegression', () => {
  it('matches the hand-computed three-asset case with OLS', () => {
    // No intercept: λ̂ = Σβ R̄ / Σβ² = 8.5/3.5 = 17/7, α̂ = (-3/14, -3/7, 5/14), Σα̂² = 5/14,
    // R² = 1 - (5/14)/(14/3) = 181/196.
    const plain = crossSectionalRegression(beta3, mean3, { intercept: false, weighting: 'ols' });
    expectClose(plain.lambda, [17 / 7], 14);
    expect(plain.lambda0).toBeUndefined();
    expectClose(plain.alpha, [-3 / 14, -3 / 7, 5 / 14], 14);
    expectClose(plain.fitted, [17 / 14, 17 / 7, 51 / 14], 14);
    expect(plain.r2).toBeCloseTo(181 / 196, 14);
    // Intercept: slope Σ(β-1)(R̄-7/3)/Σ(β-1)² = 1.5/0.5 = 3, λ̂_0 = 7/3 - 3 = -2/3,
    // α̂ = (1/6, -1/3, 1/6), R² = 1 - (1/6)/(14/3) = 27/28, the usual centred R² of OLS.
    const withIntercept = crossSectionalRegression(beta3, mean3, { intercept: true, weighting: 'ols' });
    expectClose(withIntercept.lambda, [3], 14);
    expect(withIntercept.lambda0).toBeCloseTo(-2 / 3, 14);
    expectClose(withIntercept.alpha, [1 / 6, -1 / 3, 1 / 6], 14);
    expect(withIntercept.r2).toBeCloseTo(27 / 28, 14);
    expect(withIntercept.r2).toBeCloseTo(ols(mean3, [[0.5, 1, 1.5]]).r2, 14);
  });

  it('matches the hand-computed three-asset case with GLS', () => {
    // Weights w = (1, 1/2, 1/4). No intercept: λ̂ = Σwβ R̄ / Σwβ² = 3/(21/16) = 16/7.
    const plain = crossSectionalRegression(beta3, mean3, { intercept: false, weighting: 'gls', residualCovariance: sigma3 });
    expectClose(plain.lambda, [16 / 7], 14);
    // Intercept: weighted means β̄_w = 11/14, R̄_w = 12/7; slope (9/14)/(13/56) = 36/13,
    // λ̂_0 = 12/7 - (36/13)(11/14) = -6/13, α̂ = (1/13, -4/13, 4/13), R² = 1 - (33/169)/(14/3).
    const withIntercept = crossSectionalRegression(beta3, mean3, { intercept: true, weighting: 'gls', residualCovariance: sigma3 });
    expectClose(withIntercept.lambda, [36 / 13], 14);
    expect(withIntercept.lambda0).toBeCloseTo(-6 / 13, 14);
    expectClose(withIntercept.alpha, [1 / 13, -4 / 13, 4 / 13], 14);
    expect(withIntercept.r2).toBeCloseTo(1 - 99 / 2366, 14);
  });

  it('fails without a residual covariance for GLS or with fewer assets than coefficients', () => {
    expect(() => crossSectionalRegression(beta3, mean3, { intercept: false, weighting: 'gls' })).toThrow(RangeError);
    expect(() => crossSectionalRegression([[1]], [1], { intercept: true, weighting: 'ols' })).toThrow('singular');
  });
});

describe('famaMacBeth', () => {
  for (const intercept of [false, true]) {
    it(`with constant betas equals the regression on mean returns (intercept: ${intercept})`, () => {
      // Exact identities: mean of b̂_t = (X'X)⁻¹X'R̄^e, se² = (1/T)(X'X)⁻¹X'Σ̂X(X'X)⁻¹ with divisor T.
      const { excess, factors } = seededPanel(62);
      const T = excess.length;
      const { beta } = timeSeriesRegressions(excess, factors);
      const fm = famaMacBeth(excess, beta, { intercept });
      const csr = crossSectionalRegression(beta, sampleMeans(excess), { intercept, weighting: 'ols' });
      csr.lambda.forEach((l, k) => expect(Math.abs(fm.lambda[k] - l)).toBeLessThan(1e-10));
      const X = beta.map((row) => (intercept ? [1, ...row] : row));
      const P = matMul(inverse(matMul(transpose(X), X)), transpose(X));
      const Sigma = sampleCovariance(excess).map((row) => row.map((v) => (v * (T - 1)) / T));
      const V = matMul(matMul(P, Sigma), transpose(P));
      const se = [...(fm.intercept ? [fm.intercept.se] : []), ...fm.se];
      se.forEach((s, j) => expect(Math.abs(s - Math.sqrt(V[j][j] / T))).toBeLessThan(1e-10));
      if (intercept) expect(Math.abs(fm.intercept!.mean - csr.lambda0!)).toBeLessThan(1e-10);
      // Running mean: first row is month 1, last row is the full mean. Fitted values rebuild month 5.
      expectClose(fm.runningMean[0], fm.monthly[0], 15);
      expectClose(fm.runningMean[T - 1], fm.lambda, 13);
      const b0 = fm.intercept ? fm.intercept.monthly[4] : 0;
      expectClose(fm.fitted[4], beta.map((row) => b0 + row.reduce((s, b, k) => s + b * fm.monthly[4][k], 0)), 14);
      fm.tStats.forEach((t, k) => expect(t).toBeCloseTo(fm.lambda[k] / fm.se[k], 12));
    });
  }
});

describe('shankenCorrection', () => {
  // β = (0.5, 1, 1.5), Σ_ε = diag(1, 2, 4), Σ_f = 0.5, T = 10.
  // OLS: AΣ_εA' = Σβ²σ²/(Σβ²)² = 11.25/12.25 = 45/49. GLS: (β'Σ_ε⁻¹β)⁻¹ = 1/1.3125 = 16/21.
  it('with λ = 0 gives c = 0 and adds only Σ_f/T', () => {
    const ols0 = shankenCorrection(beta3, sigma3, [[0.5]], [0], 10, { weighting: 'ols' });
    expect(ols0.c).toBe(0);
    expect(ols0.naive[0][0]).toBeCloseTo((45 / 49 + 0.5) / 10, 15);
    expect(ols0.corrected[0][0]).toBeCloseTo(ols0.naive[0][0], 15);
    expect(ols0.corrected[0][0] - 45 / 49 / 10).toBeCloseTo(0.5 / 10, 15);
    const gls0 = shankenCorrection(beta3, sigma3, [[0.5]], [0], 10, { weighting: 'gls' });
    expect(gls0.corrected[0][0]).toBeCloseTo((16 / 21 + 0.5) / 10, 15);
  });

  it('scales AΣ_εA\' by 1 + c with c = λ\'Σ_f⁻¹λ', () => {
    // λ = 1: c = 1/0.5 = 2.
    const fit = shankenCorrection(beta3, sigma3, [[0.5]], [1], 10, { weighting: 'ols' });
    expect(fit.c).toBeCloseTo(2, 15);
    expect(fit.corrected[0][0]).toBeCloseTo((3 * 45 / 49 + 0.5) / 10, 15);
    expect(fit.correctedSE[0]).toBeCloseTo(Math.sqrt((3 * 45 / 49 + 0.5) / 10), 15);
    expect(fit.naiveSE[0]).toBeCloseTo(Math.sqrt((45 / 49 + 0.5) / 10), 15);
    const gls = shankenCorrection(beta3, sigma3, [[0.5]], [1], 10, { weighting: 'gls' });
    expect(gls.corrected[0][0]).toBeCloseTo((3 * 16 / 21 + 0.5) / 10, 15);
  });
});

describe('simulateTwoPass', () => {
  const beta = Array.from({ length: 25 }, (_, i) => 0.5 + i / 24);

  it('gives the same output for the same seed', () => {
    const options = { N: 25, T: 60, beta, lambda: 0.005, factorSharpe: 0.5, residualSd: 0.03, replications: 5 };
    const a = simulateTwoPass(7, options);
    expect(simulateTwoPass(7, options)).toEqual(a);
    expect(simulateTwoPass(8, options).lambdaHat).not.toEqual(a.lambdaHat);
    expect(a.betaHat).toHaveLength(25);
    expect(a.lambdaHat).toHaveLength(5);
    expect(() => simulateTwoPass(7, { ...options, N: 24 })).toThrow(RangeError);
  });

  it('with a high factor Sharpe ratio, the corrected coverage is closer to 95% than the naive one', { timeout: 60000 }, () => {
    // Monthly SR 1.2 (c = 1.44), λ = 0.5% a month, residual sd 1.5%, T = 600, 1000 replications.
    // Seed 18 gives naive coverage 86.4% and corrected coverage 92.3%; the rest of the gap is the
    // errors-in-variables bias of λ̂, which the correction does not remove.
    const sim = simulateTwoPass(18, {
      N: 25, T: 600, beta, lambda: 0.005, factorSharpe: 1.2, residualSd: 0.015, replications: 1000,
    });
    expect(sim.naiveCoverage).toBeCloseTo(0.864, 10);
    expect(sim.correctedCoverage).toBeCloseTo(0.923, 10);
    expect(Math.abs(sim.correctedCoverage - 0.95)).toBeLessThan(Math.abs(sim.naiveCoverage - 0.95));
    sim.naiveSE.forEach((s, r) => expect(sim.correctedSE[r]).toBeGreaterThan(s));
  });
});

describe('two-pass tests on the committed data', () => {
  // FF3 on the 25 size–B/M portfolios, 1963-07 to 2026-08 (T = 758). References: numpy least squares
  // for the first pass, then the same second-pass formulas (np.linalg.solve, divisor-T moments).
  const panel = factorPanel(ff3, ff25, { start: '1963-07-01', model: 'ff3' });
  const fit = timeSeriesRegressions(panel.excess, panel.factors);
  const mean = sampleMeans(panel.excess);
  const T = panel.excess.length;

  it('pins λ̂, the Fama–MacBeth t-statistics, the R² and the naive and corrected standard errors', () => {
    expect(T).toBe(758);
    const csr = crossSectionalRegression(fit.beta, mean, { intercept: false, weighting: 'ols' });
    expectClose(csr.lambda, [0.005604000578696, 0.00144438887634, 0.003531771728333], 13);
    expect(csr.r2).toBeCloseTo(0.4752784814581994, 12);
    const csrIntercept = crossSectionalRegression(fit.beta, mean, { intercept: true, weighting: 'ols' });
    expect(csrIntercept.lambda0).toBeCloseTo(0.011600167328949, 13);
    expect(csrIntercept.r2).toBeCloseTo(0.6632929135961495, 12);

    const fm = famaMacBeth(panel.excess, fit.beta, { intercept: false });
    expectClose(fm.tStats, [3.413809191507073, 1.284847092816201, 3.192860420012014], 10);
    const fmIntercept = famaMacBeth(panel.excess, fit.beta, { intercept: true });
    expect(fmIntercept.intercept!.tStat).toBeCloseTo(4.502322754193241, 10);
    expectClose(fmIntercept.tStats, [-1.803932803409898, 1.039794628170112, 2.953395586090585], 10);

    const shanken = shankenCorrection(fit.beta, fit.residualCovariance, fit.factorCovariance, csr.lambda, T, { weighting: 'ols' });
    expect(shanken.c).toBeCloseTo(0.038587446410962165, 12);
    expectClose(shanken.naiveSE, [0.001641568190934, 0.001124171805669, 0.001106146609541], 14);
    expectClose(shanken.correctedSE, [0.001642456333937, 0.001125359862603, 0.001107214351979], 14);
    // In sample Σ̂ = β̂Σ̂_fβ̂' + Σ̂_ε, so the naive standard error is the Fama–MacBeth one.
    shanken.naiveSE.forEach((s, k) => expect(Math.abs(s - fm.se[k])).toBeLessThan(1e-12));

    const gls = crossSectionalRegression(fit.beta, mean, { intercept: false, weighting: 'gls', residualCovariance: fit.residualCovariance });
    expectClose(gls.lambda, [0.006270003883632, 0.001508102691812, 0.003008001625517], 13);
    const shankenGls = shankenCorrection(fit.beta, fit.residualCovariance, fit.factorCovariance, gls.lambda, T, { weighting: 'gls' });
    expect(shankenGls.c).toBeCloseTo(0.03821447444034094, 12);
    expectClose(shankenGls.correctedSE, [0.001625735452613, 0.001098970406702, 0.001089974325616], 14);
  });

  it('GLS with the traded factors among the test assets gives λ̂ = f̄', () => {
    // A factor's own residual is zero, so Σ̂_ε is singular: weight by the return covariance Σ̂,
    // which gives the same λ̂ as Σ̂_ε (checked first on the 25 portfolios alone).
    const Sigma = sampleCovariance(panel.excess).map((row) => row.map((v) => (v * (T - 1)) / T));
    const byResidual = crossSectionalRegression(fit.beta, mean, { intercept: false, weighting: 'gls', residualCovariance: fit.residualCovariance });
    const byReturns = crossSectionalRegression(fit.beta, mean, { intercept: false, weighting: 'gls', residualCovariance: Sigma });
    byResidual.lambda.forEach((l, k) => expect(Math.abs(byReturns.lambda[k] - l)).toBeLessThan(1e-12));

    const all = panel.excess.map((row, t) => [...row, ...panel.factors[t]]);
    const allFit = timeSeriesRegressions(all, panel.factors);
    const allSigma = sampleCovariance(all).map((row) => row.map((v) => (v * (T - 1)) / T));
    const withFactors = crossSectionalRegression(allFit.beta, sampleMeans(all), { intercept: false, weighting: 'gls', residualCovariance: allSigma });
    expectClose(fit.factorMean, [0.006017810026385, 0.001474142480211, 0.002939577836412], 14);
    withFactors.lambda.forEach((l, k) => expect(Math.abs(l - fit.factorMean[k])).toBeLessThan(1e-10));
  });
});
