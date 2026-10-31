import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import { cdf } from '../math/normal';
import { normalRng } from '../math/rng';
import { quarterlyPanel } from './conditional';
import { crossSectionalRegression } from './crossSection';
import { maxSharpeSquared, sampleCovariance, sampleMeans } from './portfolio';
import { hjDistance, linearSdfGmm, sdfModelFits } from './sdfGmm';
import { timeSeriesRegressions } from './timeSeriesTests';

const [ff3, ff25, cay] = await Promise.all([
  loadSeries('ff3-monthly'), loadSeries('ff25-size-bm-monthly'), loadSeries('fred-cay-quarterly'),
]);
// Return quarters from 1963-Q3 to the last full quarter.
const panel = quarterlyPanel({ ff3, ff25, cay }, { start: '1963-07-01' });

// Two assets priced by one seeded factor, T = 120.
function twoAssets(seed: number) {
  const z = normalRng(seed);
  const factors = Array.from({ length: 120 }, () => [0.005 + 0.04 * z()]);
  const excess = factors.map(([f]) => [0.004 + 1.2 * f + 0.02 * z(), 0.002 + 0.6 * f + 0.03 * z()]);
  return { excess, factors };
}

const mean = (x: readonly number[]) => x.reduce((sum, value) => sum + value, 0) / x.length;

describe('linearSdfGmm', () => {
  it("with 'identity' weighting, is the OLS cross-sectional regression on full-sample betas with no intercept", () => {
    // D = E_T[R^e f̃'] = β̂Σ̂_f, so λ̂ = Σ̂_f(D'D)⁻¹D'R̄^e = (β̂'β̂)⁻¹β̂'R̄^e: first-stage GMM is a cross-sectional regression.
    const cases = [
      { excess: panel.excess, factors: panel.factors },
      { excess: panel.excess, factors: panel.dc.map((dc) => [dc]) },
      twoAssets(1),
    ];
    for (const { excess, factors } of cases) {
      const csr = crossSectionalRegression(timeSeriesRegressions(excess, factors).beta, sampleMeans(excess), { intercept: false, weighting: 'ols' });
      const fit = linearSdfGmm(excess, factors, { weighting: 'identity' });
      fit.lambda.forEach((value, k) => expect(Math.abs(value - csr.lambda[k])).toBeLessThan(1e-10));
      fit.pricingErrors.forEach((value, i) => expect(Math.abs(value - csr.alpha[i])).toBeLessThan(1e-10));
      fit.fitted.forEach((value, i) => expect(fit.actual[i] - value).toBeCloseTo(fit.pricingErrors[i], 14));
      expect(fit.J).toBeNull();
    }
  });

  it("with 'hj' weighting, finds the b that defines the HJ distance", () => {
    const fit = linearSdfGmm(panel.excess, panel.factors, { weighting: 'hj' });
    const hj = hjDistance(panel.excess, panel.factors);
    fit.b.forEach((value, k) => expect(value).toBeCloseTo(hj.b[k], 8));
    fit.pricingErrors.forEach((value, i) => expect(value).toBeCloseTo(hj.pricingErrors[i], 12));
  });

  it("matches a hand computation of b̂, its standard errors and the 'efficient' J on two seeded assets", () => {
    const { excess, factors } = twoAssets(7);
    const T = factors.length;
    const f = factors.map(([value]) => value);
    const fBar = mean(f);
    const tilde = f.map((value) => value - fBar);
    const r1 = excess.map(([r]) => r);
    const r2 = excess.map(([, r]) => r);
    const a = [mean(r1), mean(r2)];
    const d = [mean(r1.map((r, t) => r * tilde[t])), mean(r2.map((r, t) => r * tilde[t]))];
    const sigmaF = mean(tilde.map((x) => x * x));
    // First stage: b̂₁ = d'a / d'd. Ŝ: covariance (divisor T) of u_t = R^e_t(1 - f̃_t b̂₁), demeaned, no lags.
    const b1 = (d[0] * a[0] + d[1] * a[1]) / (d[0] ** 2 + d[1] ** 2);
    const u1 = r1.map((r, t) => r * (1 - tilde[t] * b1));
    const u2 = r2.map((r, t) => r * (1 - tilde[t] * b1));
    const [m1, m2] = [mean(u1), mean(u2)];
    const s11 = mean(u1.map((u) => (u - m1) ** 2));
    const s22 = mean(u2.map((u) => (u - m2) ** 2));
    const s12 = mean(u1.map((u, t) => (u - m1) * (u2[t] - m2)));
    // One-step sandwich with K = 1: Var(b̂₁) = d'Ŝd / (T (d'd)²).
    const dd = d[0] ** 2 + d[1] ** 2;
    const dSd = d[0] ** 2 * s11 + 2 * d[0] * d[1] * s12 + d[1] ** 2 * s22;
    const first = linearSdfGmm(excess, factors, { weighting: 'identity' });
    expect(first.b[0]).toBeCloseTo(b1, 8);
    expect(first.bSE[0]).toBeCloseTo(Math.sqrt(dSd / (T * dd * dd)), 8);
    expect(first.lambda[0]).toBeCloseTo(sigmaF * b1, 10);
    expect(first.lambdaSE[0]).toBeCloseTo(sigmaF * first.bSE[0], 12);
    // Second stage: W = Ŝ⁻¹ by the 2 × 2 inverse, b̂₂ = d'Wa / d'Wd, J = T g'Wg with g = a - d b̂₂, df = 1.
    const det = s11 * s22 - s12 * s12;
    const Wv = (x: number[]) => [(s22 * x[0] - s12 * x[1]) / det, (s11 * x[1] - s12 * x[0]) / det];
    const quad = (x: number[], y: number[]) => x[0] * Wv(y)[0] + x[1] * Wv(y)[1];
    const b2 = quad(d, a) / quad(d, d);
    const g = [a[0] - d[0] * b2, a[1] - d[1] * b2];
    const J = T * quad(g, g);
    const efficient = linearSdfGmm(excess, factors, { weighting: 'efficient' });
    expect(efficient.b[0]).toBeCloseTo(b2, 8);
    expect(efficient.bSE[0]).toBeCloseTo(Math.sqrt(1 / (T * quad(d, d))), 8);
    expect(efficient.pricingErrors[0]).toBeCloseTo(g[0], 12);
    expect(efficient.df).toBe(1);
    expect(efficient.J).toBeCloseTo(J, 8);
    // P(χ²₁ > J) = 2(1 - Φ(√J)).
    expect(efficient.pValue).toBeCloseTo(2 * (1 - cdf(Math.sqrt(J))), 8);
  });

  it('needs a factor', () => {
    expect(() => linearSdfGmm(panel.excess, panel.factors.map(() => []), { weighting: 'identity' })).toThrow(RangeError);
  });
});

describe('hjDistance', () => {
  it('with no factors, is SR²/(1 + SR²) of the test assets, with the divisor-T covariance', () => {
    // E_T[R^e R^e'] = Σ + μμ', so μ'(Σ + μμ')⁻¹μ = SR²/(1 + SR²) by Sherman–Morrison, SR² = μ'Σ⁻¹μ.
    const T = panel.excess.length;
    const sigma = sampleCovariance(panel.excess).map((row) => row.map((value) => (value * (T - 1)) / T));
    const sr2 = maxSharpeSquared(sampleMeans(panel.excess), sigma);
    const hj = hjDistance(panel.excess, panel.excess.map(() => []));
    expect(hj.b).toEqual([]);
    expect(hj.pricingErrors).toEqual(sampleMeans(panel.excess));
    expect(hj.distance ** 2).toBeCloseTo(sr2 / (1 + sr2), 12);
  });

  it('is zero, with zero pricing errors, when the test assets are the factors themselves', () => {
    const { excess } = twoAssets(3);
    const hj = hjDistance(excess, excess);
    expect(hj.distance).toBeLessThan(1e-12);
    hj.pricingErrors.forEach((value) => expect(Math.abs(value)).toBeLessThan(1e-14));
  });
});

describe('sdfModelFits', () => {
  const fits = sdfModelFits(panel, ['capm', 'ccapm', 'ff3']);

  it('uses the 252 quarters from 1963-Q3 to the last full quarter, 2026-Q2', () => {
    expect([panel.dates.length, panel.dates[0], panel.dates.at(-1)]).toEqual([252, '1963-07-01', '2026-04-01']);
  });

  it('pins λ̂, δ_HJ and J of each model (decimal per quarter)', () => {
    const want = {
      capm: { first: [0.0210814969], hj: [0.0147837588], distance: 0.5130061039, J: 91.2483347756, df: 24 },
      ccapm: { first: [0.0286782297], hj: [0.0064635856], distance: 0.4702841944, J: 13.0106371812, df: 24 },
      ff3: {
        first: [0.0181847433, 0.0048233368, 0.0108921642],
        hj: [0.0153060369, 0.0040696870, 0.0067165568],
        distance: 0.4880035171,
        J: 67.7015879676,
        df: 22,
      },
    };
    for (const model of ['capm', 'ccapm', 'ff3'] as const) {
      const fit = fits[model];
      want[model].first.forEach((value, k) => expect(fit.firstStage.lambda[k]).toBeCloseTo(value, 9));
      want[model].hj.forEach((value, k) => expect(fit.hj.lambda[k]).toBeCloseTo(value, 9));
      expect(fit.hjDistance).toBeCloseTo(want[model].distance, 9);
      expect(fit.J).toBeCloseTo(want[model].J, 7);
      expect(fit.df).toBe(want[model].df);
      expect(fit.pricingErrors).toHaveLength(25);
    }
    // CAPM and FF3 are rejected at 1%; the CCAPM is not.
    expect(fits.capm.pValue).toBeCloseTo(8.949121e-10, 15);
    expect(fits.ccapm.pValue).toBeCloseTo(0.9659448214, 9);
    expect(fits.ff3.pValue).toBeCloseTo(1.5134074e-6, 13);
  });

  it('reports the pricing errors and fits of the parts it is built from', () => {
    const fit = fits.ff3;
    expect(fit.factorNames).toEqual(['Mkt-RF', 'SMB', 'HML']);
    expect(fit.pricingErrors).toEqual(hjDistance(panel.excess, panel.factors).pricingErrors);
    expect(fit.firstStage).toEqual(linearSdfGmm(panel.excess, panel.factors, { weighting: 'identity' }));
    expect(fits.ccapm.factorNames).toEqual(['Δc']);
  });
});
