import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import { inverse, matMul, transpose } from '../math/linalg';
import { quantile } from '../stats/stambaugh';
import { crossSectionalRegression } from './crossSection';
import { simulateUselessFactor } from './identification';
import { maxSharpeSquared, sampleCovariance, sampleMeans, tangencyWeights } from './portfolio';
import { glsR2, r2ConfidenceInterval, randomFactorFit, tradedFactorRestriction } from './skeptical';
import { factorPanel, timeSeriesRegressions } from './timeSeriesTests';

const [ff3, ff25] = await Promise.all([loadSeries('ff3-monthly'), loadSeries('ff25-size-bm-monthly')]);
// Monthly 25 size–B/M portfolios from 1963-07 to the last committed month (2026-08): T = 758, N = 25.
const capm = factorPanel(ff3, ff25, { start: '1963-07-01', model: 'capm' });
const ff3Panel = factorPanel(ff3, ff25, { start: '1963-07-01', model: 'ff3' });
const smb = ff3Panel.factors.map(([, s]) => s);
const hml = ff3Panel.factors.map(([, , h]) => h);
const T = capm.excess.length;
const mu = sampleMeans(capm.excess);
const Sigma = sampleCovariance(capm.excess).map((row) => row.map((v) => (v * (T - 1)) / T));
const dot = (x: readonly number[], y: readonly number[]) => x.reduce((sum, v, i) => sum + v * y[i], 0);
const portfolio = (w: readonly number[]) => capm.excess.map((row) => [dot(w, row)]);
const olsR2 = (excess: number[][], factors: number[][]) => crossSectionalRegression(
  timeSeriesRegressions(excess, factors).beta, sampleMeans(excess), { intercept: true, weighting: 'ols' },
).r2;

describe('glsR2', () => {
  it('is 1 when the factor is the in-sample tangency portfolio of the test assets (LNS Result 8)', () => {
    // The tangency portfolio is on the frontier, so its betas line up exactly with mean excess returns.
    const fit = glsR2(capm.excess, portfolio(tangencyWeights(mu, Sigma)));
    expect(fit.r2).toBeCloseTo(1, 10);
    expect(fit.zeroBeta).toBeCloseTo(0, 12);
  });

  it('leaves the gap between the squared Sharpe ratios of the tangency and the factor, at the GLS zero-beta rate', () => {
    // LNS Result 7: q = θ²_τ(z) - θ²_P(z). For the equal-weighted portfolio, the factor is its own mimicking portfolio.
    const w = mu.map(() => 1 / mu.length);
    const fit = glsR2(capm.excess, portfolio(w));
    const z = fit.zeroBeta;
    const tangency = maxSharpeSquared(mu.map((m) => m - z), Sigma);
    const factor = (dot(w, mu) - z) ** 2 / dot(w, Sigma.map((row) => dot(row, w)));
    expect(fit.unexplained).toBeCloseTo(tangency - factor, 12);
    expect(fit.r2).toBeCloseTo(1 - fit.unexplained / fit.total, 15);
  });

  it('has a denominator Q that depends only on the test assets (LNS Result 8)', () => {
    expect(glsR2(ff3Panel.excess, ff3Panel.factors).total).toBeCloseTo(glsR2(capm.excess, capm.factors).total, 14);
    // Q = μ'Σ⁻¹μ - (ι'Σ⁻¹μ)²/ι'Σ⁻¹ι, the squared slope of the frontier's asymptote.
    const precision = inverse(Sigma);
    const ones = mu.map(() => 1);
    const b = dot(ones, precision.map((row) => dot(row, mu)));
    const a = dot(ones, precision.map((row) => dot(row, ones)));
    expect(glsR2(capm.excess, capm.factors).total).toBeCloseTo(maxSharpeSquared(mu, Sigma) - (b * b) / a, 12);
  });

  it('pins the OLS and GLS R² of the CAPM and FF3 on the 25 portfolios from 1963-07', () => {
    // CAPM: OLS 0.0782, GLS 0.0613. FF3: OLS 0.6633, GLS 0.2043, a far lower hurdle than OLS suggests.
    expect(olsR2(capm.excess, capm.factors)).toBeCloseTo(0.0781830585, 9);
    expect(glsR2(capm.excess, capm.factors).r2).toBeCloseTo(0.0613469115, 9);
    expect(olsR2(ff3Panel.excess, ff3Panel.factors)).toBeCloseTo(0.6632929136, 9);
    expect(glsR2(ff3Panel.excess, ff3Panel.factors).r2).toBeCloseTo(0.2043441925, 9);
  });
});

describe('tradedFactorRestriction', () => {
  // Three test assets: two portfolios plus the factor. f = 0.01 ± 0.02 and e = (1, 1, -1, -1) is orthogonal to it, so
  // R_1 = 0.002 + 0.5 f + 0.01 e and R_2 = 0.006 + 1.5 f - 0.02 e have betas 0.5 and 1.5 exactly.
  const f = [0.03, -0.01, 0.03, -0.01];
  const e = [1, 1, -1, -1];
  const excess = f.map((ft, t) => [0.002 + 0.5 * ft + 0.01 * e[t], 0.006 + 1.5 * ft - 0.02 * e[t]]);
  const factors = f.map((ft) => [ft]);

  it('matches a hand computation on a three-asset case', () => {
    // Means 0.007, 0.021, 0.01 on betas 0.5, 1.5, 1 (mean 1): slope = Σ(β - 1)R̄ / Σ(β - 1)² = 0.007/0.5 = 0.014,
    // λ̂_0 = 0.038/3 - 0.014 = -0.004/3, gap = 0.014 - 0.01 = 0.004.
    const test = tradedFactorRestriction(excess, factors);
    expect(test.lambda[0]).toBeCloseTo(0.014, 14);
    expect(test.factorMean[0]).toBeCloseTo(0.01, 14);
    expect(test.gap[0]).toBeCloseTo(0.004, 14);
    expect(test.zeroBeta).toBeCloseTo(-0.004 / 3, 14);
    // se² = (1 + c)[AΣ̂_εA']/T, A = (X'X)⁻¹X', X = [1 β], Σ̂_ε (divisor T) = diag block [[1, -2], [-2, 4]]·1e-4 and 0,
    // c = f̄²/σ̂²_f = 0.01²/0.02² = 0.25.
    const X = [[1, 0.5], [1, 1.5], [1, 1]];
    const A = matMul(inverse(matMul(transpose(X), X)), transpose(X));
    const residual = [[1e-4, -2e-4, 0], [-2e-4, 4e-4, 0], [0, 0, 0]];
    const core = matMul(matMul(A, residual), transpose(A));
    expect(test.gapSE[0]).toBeCloseTo(Math.sqrt((1.25 * core[1][1]) / 4), 14);
    expect(test.zeroBetaSE).toBeCloseTo(Math.sqrt((1.25 * core[0][0]) / 4), 14);
    expect(test.gapT[0]).toBeCloseTo(test.gap[0] / test.gapSE[0], 12);
  });

  it('gives the OLS slope of crossSectionalRegression with the factors among the test assets', () => {
    const assets = ff3Panel.excess.map((row, t) => [...row, ...ff3Panel.factors[t]]);
    const fit = crossSectionalRegression(
      timeSeriesRegressions(assets, ff3Panel.factors).beta, sampleMeans(assets), { intercept: true, weighting: 'ols' },
    );
    const test = tradedFactorRestriction(ff3Panel.excess, ff3Panel.factors);
    test.lambda.forEach((lambda, k) => expect(lambda).toBeCloseTo(fit.lambda[k], 14));
    expect(test.zeroBeta).toBeCloseTo(fit.lambda0 as number, 14);
  });

  it('pins FF3 on the 25 portfolios plus the three factors from 1963-07', () => {
    // The market premium is 0.077% a month below the market's mean (t = -2.72), and the zero-beta rate is
    // 0.052% a month above zero (t = 2.76): FF3 fails both restrictions of LNS Prescription 2.
    const test = tradedFactorRestriction(ff3Panel.excess, ff3Panel.factors);
    expect(test.gap[0]).toBeCloseTo(-0.000765845, 9);
    expect(test.gapT[0]).toBeCloseTo(-2.7223629807, 8);
    expect(test.gapT[1]).toBeCloseTo(-0.6538544265, 8);
    expect(test.gapT[2]).toBeCloseTo(1.5516068786, 8);
    expect(test.zeroBeta).toBeCloseTo(0.0005181156, 9);
    expect(test.zeroBetaT).toBeCloseTo(2.7640886130, 8);
  });
});

describe('randomFactorFit', () => {
  it('without noise, two factors span SMB and HML, so every draw has the R² of the SMB–HML model (LNS Result 5)', () => {
    const fit = randomFactorFit(5, ff3Panel.excess, smb, hml, { samples: 10, factors: 2, noiseShare: 0 });
    const smbHml = ff3Panel.factors.map(([, s, h]) => [s, h]);
    const ols = olsR2(ff3Panel.excess, smbHml);
    const gls = glsR2(ff3Panel.excess, smbHml).r2;
    fit.ols.forEach((r2) => expect(r2).toBeCloseTo(ols, 10));
    fit.gls.forEach((r2) => expect(r2).toBeCloseTo(gls, 10));
  });

  it('with noiseShare 1 behaves like a useless factor', { timeout: 30_000 }, () => {
    // Median OLS R² 0.074 for pure noise here and 0.066 for simulateUselessFactor (strength 0), 30 draws each;
    // median GLS R² 0.019; only 2 of the 30 draws explain more than half the spread.
    const fit = randomFactorFit(28, ff3Panel.excess, smb, hml, { samples: 30, factors: 1, noiseShare: 1 });
    const useless = simulateUselessFactor(28, ff3Panel.excess, { samples: 30, strength: 0 });
    expect(fit.median.ols).toBeCloseTo(0.0743269352, 9);
    expect(quantile(useless.r2, 0.5)).toBeCloseTo(0.0658567340, 9);
    expect(fit.median.gls).toBeCloseTo(0.0188005563, 9);
    expect(fit.shareAbove).toEqual({ ols: 2 / 30, gls: 0 });
  });

  it('with noiseShare near 0 gives a median OLS R² far above the CAPM', { timeout: 30_000 }, () => {
    // Two factors with 1% noise: median OLS R² 0.624 against 0.078 for the CAPM, and every draw is above 1/2.
    // The median GLS R² is 0.133: the GLS hurdle is far harder to clear (LNS, p. 19).
    const fit = randomFactorFit(28, ff3Panel.excess, smb, hml, { samples: 100, factors: 2, noiseShare: 0.01 });
    expect(fit.median.ols).toBeCloseTo(0.6240405872, 9);
    expect(fit.median.gls).toBeCloseTo(0.1330545889, 9);
    expect(fit.shareAbove).toEqual({ ols: 1, gls: 0 });
    expect(fit.median.ols).toBeGreaterThan(5 * olsR2(capm.excess, capm.factors));
  });

  it('rejects a third noiseless factor', () => {
    expect(() => randomFactorFit(1, ff3Panel.excess, smb, hml, { samples: 1, factors: 3, noiseShare: 0 })).toThrow(RangeError);
  });
});

describe('r2ConfidenceInterval', () => {
  it('gives the same output for the same seed, and its estimate is the two-pass R²', { timeout: 30_000 }, () => {
    const first = r2ConfidenceInterval(3, capm.excess, capm.factors, { samples: 10, weighting: 'gls' });
    expect(r2ConfidenceInterval(3, capm.excess, capm.factors, { samples: 10, weighting: 'gls' })).toEqual(first);
    expect(r2ConfidenceInterval(4, capm.excess, capm.factors, { samples: 10, weighting: 'gls' }).draws).not.toEqual(first.draws);
    expect(first.estimate).toBeCloseTo(glsR2(capm.excess, capm.factors).r2, 14);
    // With OLS weighting the estimate is crossSectionalRegression's r2 on the first-pass betas.
    expect(r2ConfidenceInterval(3, capm.excess, capm.factors, { samples: 1 }).estimate)
      .toBe(olsR2(capm.excess, capm.factors));
  });

  it('pins the 95% interval for the FF3 OLS R² from 1963-07 and contains the estimate', { timeout: 30_000 }, () => {
    // 100 bootstrap samples of months: [0.367, 0.838] around the sample R² 0.663.
    const ci = r2ConfidenceInterval(2010, ff3Panel.excess, ff3Panel.factors);
    expect(ci.draws).toHaveLength(100);
    expect(ci.lower).toBeCloseTo(0.3665881493, 9);
    expect(ci.upper).toBeCloseTo(0.8377061374, 9);
    expect(ci.lower).toBeLessThan(ci.estimate);
    expect(ci.upper).toBeGreaterThan(ci.estimate);
  });
});
