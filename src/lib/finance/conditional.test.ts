import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import { normalRng } from '../math/rng';
import { cayInputs, fullSampleCay } from './cay';
import {
  betaPremiumDecomposition, conditionalModelFits, managedPortfolios, quarterlyPanel, scaledFactors,
  simulateConditionalCapm,
} from './conditional';
import { crossSectionalRegression } from './crossSection';
import { timeSeriesRegressions } from './timeSeriesTests';

const [ff3, ff25, cay] = await Promise.all([
  loadSeries('ff3-monthly'), loadSeries('ff25-size-bm-monthly'), loadSeries('fred-cay-quarterly'),
]);
// Lettau–Ludvigson's sample, 1963-Q3 to 1998-Q3 (JPE, p. 1255).
const panel = quarterlyPanel({ ff3, ff25, cay }, { start: '1963-07-01', end: '1998-07-01' });

const world = {
  T: 200_000, beta0: 1, betaSlope: 0.5, lambda0: 0.006, lambdaSlope: 0.01,
  stateRho: 0.9, stateSd: 1, marketSd: 0.045, residualSd: 0.03,
};

describe('betaPremiumDecomposition', () => {
  it('splits a hand-made case', () => {
    // β = (1, 2, 3), λ = (1, 1, 4): mean βλ = 15/3 = 5, β̄ λ̄ = 2·2 = 4, Cov = (1 + 0 + 2)/3 = 1.
    const d = betaPremiumDecomposition([1, 2, 3], [1, 1, 4]);
    expect(d).toEqual({ meanProduct: 5, meanBeta: 2, meanLambda: 2, product: 4, covariance: 1 });
  });

  it('holds to 1e-12 on seeded paths', () => {
    const z = normalRng(3);
    const beta = Array.from({ length: 500 }, () => 1 + 0.4 * z());
    const lambda = beta.map((b) => 0.005 + 0.01 * (b - 1) + 0.002 * z());
    const d = betaPremiumDecomposition(beta, lambda);
    expect(Math.abs(d.meanProduct - d.product - d.covariance)).toBeLessThan(1e-12);
    expect(d.covariance).toBeGreaterThan(0);
  });
});

describe('simulateConditionalCapm', () => {
  it('gives the same output for the same seed', () => {
    const small = { ...world, T: 50 };
    expect(simulateConditionalCapm(11, small)).toEqual(simulateConditionalCapm(11, small));
    expect(simulateConditionalCapm(12, small).asset).not.toEqual(simulateConditionalCapm(11, small).asset);
  });

  it('builds β_t, λ_t and the asset from z_t, and the decomposition from those paths', () => {
    const s = simulateConditionalCapm(5, { ...world, T: 50 });
    s.z.forEach((z, t) => {
      expect(s.beta[t]).toBeCloseTo(1 + 0.5 * z, 14);
      expect(s.lambda[t]).toBeCloseTo(0.006 + 0.01 * z, 14);
    });
    expect(s.decomposition).toEqual(betaPremiumDecomposition(s.beta, s.lambda));
  });

  it('has an unconditional alpha near Cov(β, λ)·[1 - E[R^e_m]²/Var(R^e_m)] when both move', () => {
    // b l σ_z² = 0.005, Var(R^e_m) = 0.01² + 0.045² = 0.002125, so α^u = 0.005·(1 - 0.006²/0.002125) = 0.00491529.
    // Seed 7, T = 200000: α̂ = 0.0048723 with se 0.0000868, half a standard error away.
    const s = simulateConditionalCapm(7, world);
    const theory = 0.005 * (1 - 0.006 ** 2 / 0.002125);
    expect(theory).toBeCloseTo(0.0049152941, 9);
    expect(s.unconditional.alpha).toBeCloseTo(0.0048722942, 9);
    expect(Math.abs(s.unconditional.alpha - theory)).toBeLessThan(2 * s.unconditional.alphaSE);
    expect(s.decomposition.covariance).toBeCloseTo(0.0050616969, 9);
  });

  it('has an unconditional alpha within two standard errors of zero when b = 0 or l = 0', () => {
    // Seed 7, T = 200000. b = 0: α̂ = -0.0000636, se 0.0000678 (0.94 se). l = 0: α̂ = -0.0000970, se 0.0000852 (1.14 se).
    const flatBeta = simulateConditionalCapm(7, { ...world, betaSlope: 0 }).unconditional;
    const flatPremium = simulateConditionalCapm(7, { ...world, lambdaSlope: 0 }).unconditional;
    expect(flatBeta.alpha).toBeCloseTo(-0.0000636223, 9);
    expect(flatBeta.alphaSE).toBeCloseTo(0.0000677571, 9);
    expect(flatPremium.alpha).toBeCloseTo(-0.0000970047, 9);
    expect(flatPremium.alphaSE).toBeCloseTo(0.0000852195, 9);
    expect(Math.abs(flatBeta.alpha)).toBeLessThan(2 * flatBeta.alphaSE);
    expect(Math.abs(flatPremium.alpha)).toBeLessThan(2 * flatPremium.alphaSE);
    expect(flatBeta.beta).toBeCloseTo(1, 2);
  });
});

describe('scaledFactors and managedPortfolios', () => {
  it('scales a hand-made case', () => {
    // Rows [f_{t+1} | z_t | z_t f_{t+1}].
    expect(scaledFactors([[1, 2], [3, 4]], [10, -1])).toEqual([[1, 2, 10, 10, 20], [3, 4, -1, -3, -4]]);
    // R^e ⊗ (1, z): [R_1, z R_1, R_2, z R_2].
    expect(managedPortfolios([[1, 2], [3, 4]], [0.5, 2])).toEqual([[1, 0.5, 2, 1], [3, 6, 4, 8]]);
  });
});

describe('quarterlyPanel', () => {
  it("compounds 1963-Q3 by hand from the committed French cells and pairs it with Δc and lagged cay", () => {
    // ff3 1963-07/08/09: Mkt-RF -0.39, 5.08, -1.57; SMB -0.57, -0.95, -0.25; HML -0.84, 1.72, -0.02; RF 0.27, 0.25, 0.27.
    // ff25 ME1-BM1 1.1287, 4.2396, -1.7343; ME5-BM5 -1.1045, 6.3984, -3.5033 (percent).
    const rf = 1.0027 * 1.0025 * 1.0027;
    expect(panel.dates[0]).toBe('1963-07-01');
    expect(panel.excess[0][0]).toBeCloseTo(1.011287 * 1.042396 * 0.982657 - rf, 14);
    expect(panel.excess[0][24]).toBeCloseTo(0.988955 * 1.063984 * 0.964967 - rf, 14);
    expect(panel.excess[0][0]).toBeCloseTo(0.0279583921, 9);
    expect(panel.factors[0][0]).toBeCloseTo(0.9988 * 1.0533 * 0.987 - rf, 14);
    expect(panel.factors[0][1]).toBeCloseTo(0.9943 * 0.9905 * 0.9975 - 1, 14);
    expect(panel.factors[0][2]).toBeCloseTo(0.9916 * 1.0172 * 0.9998 - 1, 14);
    // Δc over the return quarter, cay from the quarter before (1963-04-01).
    const inputs = cayInputs(cay);
    const j = inputs.dates.indexOf('1963-07-01');
    expect(panel.dc[0]).toBeCloseTo(inputs.c[j] - inputs.c[j - 1], 14);
    expect(panel.cay[0]).toBeCloseTo(fullSampleCay(inputs).cay[j - 1], 14);
    expect(panel.dc[0]).toBeCloseTo(0.0108507805, 9);
    expect(panel.cay[0]).toBeCloseTo(0.0018817307, 9);
  });

  it("matches Lettau–Ludvigson's 141 quarters and lines up with the cay dates", () => {
    expect(panel.dates).toHaveLength(141);
    expect(panel.dates.at(-1)).toBe('1998-07-01');
    const cayDates = cayInputs(cay).dates;
    expect(panel.dates.every((date) => cayDates.includes(date))).toBe(true);
    expect([panel.excess, panel.factors, panel.dc, panel.cay].every((x) => x.length === 141)).toBe(true);
    // Whole sample: the first return quarter needs a previous cay quarter (cay inputs start 1952-Q1);
    // the last is the last full French quarter, 2026-Q2.
    const all = quarterlyPanel({ ff3, ff25, cay }, { start: '1900-01-01' });
    expect([all.dates.length, all.dates[0], all.dates.at(-1)]).toEqual([297, '1952-04-01', '2026-04-01']);
  });
});

describe('conditionalModelFits', () => {
  const fits = conditionalModelFits(panel, ['capm', 'ff3', 'ccapm', 'scaled-ccapm']);

  it('pins λ̂ and the cross-sectional R² of each model on 1963-Q3–1998-Q3 (decimal per quarter)', () => {
    // Pinned on the committed extract (French to 2026-08, fred-cay-quarterly 2026-10-23).
    // Lettau–Ludvigson's R²: CAPM 0.01, FF3 0.80 (table 1), CCAPM 0.16, scaled CCAPM 0.70 (table 3).
    const expected = {
      capm: { lambda0: 0.0278179793, lambda: [-0.0049084631], r2: 0.0207231695 },
      ff3: { lambda0: -0.0010038586, lambda: [0.0175002527, 0.0040830975, 0.0149598891], r2: 0.8153263516 },
      ccapm: { lambda0: 0.0166591831, lambda: [0.0015338098], r2: 0.0732407505 },
      'scaled-ccapm': { lambda0: 0.0356680575, lambda: [0.0000970772, -0.0024550860, 0.0001523802], r2: 0.5462244686 },
    };
    for (const [model, want] of Object.entries(expected)) {
      const fit = fits[model as keyof typeof expected];
      expect(fit.lambda0).toBeCloseTo(want.lambda0, 9);
      expect(fit.lambda).toHaveLength(want.lambda.length);
      want.lambda.forEach((value, k) => expect(fit.lambda[k]).toBeCloseTo(value, 9));
      expect(fit.r2).toBeCloseTo(want.r2, 9);
      expect(fit.actual).toHaveLength(25);
      fit.fitted.forEach((value, i) => expect(fit.actual[i] - value).toBeCloseTo(fit.alpha[i], 14));
    }
    expect(fits['scaled-ccapm'].factorNames).toEqual(['Δc', 'cay', 'cay·Δc']);
    expect(fits.ff3.r2).toBeGreaterThan(fits['scaled-ccapm'].r2);
    expect(fits['scaled-ccapm'].r2).toBeGreaterThan(fits.ccapm.r2);
  });

  it('gives the same scaled-CCAPM fit with cay not demeaned', () => {
    // Demeaning z replaces z Δc by z Δc - z̄ Δc, a linear recombination of the factors: same fit.
    const factors = scaledFactors(panel.dc.map((dc) => [dc]), panel.cay);
    const { beta } = timeSeriesRegressions(panel.excess, factors);
    const raw = crossSectionalRegression(beta, fits.ccapm.actual, { intercept: true, weighting: 'ols' });
    expect(raw.r2).toBeCloseTo(fits['scaled-ccapm'].r2, 10);
    raw.fitted.forEach((value, i) => expect(value).toBeCloseTo(fits['scaled-ccapm'].fitted[i], 12));
  });
});
