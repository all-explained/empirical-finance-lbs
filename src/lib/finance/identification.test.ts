import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import { chiSquareSurvival } from '../math/distributions';
import { normalRng } from '../math/rng';
import { ols } from '../stats/ols';
import { conditionalModelFits, quarterlyPanel } from './conditional';
import { crossSectionalRegression, famaMacBeth } from './crossSection';
import {
  farConfidenceSet, grsFar, rankTest, simulateUselessFactor, simulateWeakIdentification, waldConfidenceSet,
} from './identification';
import { sampleMeans } from './portfolio';
import { grs, timeSeriesRegressions } from './timeSeriesTests';

const [ff3, ff25, cay] = await Promise.all([
  loadSeries('ff3-monthly'), loadSeries('ff25-size-bm-monthly'), loadSeries('fred-cay-quarterly'),
]);
// Quarterly 25 size–B/M portfolios from 1963-Q3 to the last committed quarter (2026-Q2): T = 252, N = 25.
const panel = quarterlyPanel({ ff3, ff25, cay }, { start: '1963-07-01' });
const market = panel.factors.map(([m]) => m);
const column = (factor: readonly number[]) => factor.map((f) => [f]);

// Seeded panel: T = 80 periods, N = 6 assets, K = 2 factors with nonzero means, zero-beta rate 0.004.
function seededPanel(seed: number, T = 80, N = 6, K = 2) {
  const z = normalRng(seed);
  const factors = Array.from({ length: T }, () => Array.from({ length: K }, (_, k) => 0.01 - 0.005 * k + 0.04 * z()));
  const loadings = Array.from({ length: N }, () => Array.from({ length: K }, () => 0.8 + 0.5 * z()));
  const excess = factors.map((f) => loadings.map((b) => 0.004 + b.reduce((s, bk, k) => s + bk * f[k], 0) + 0.02 * z()));
  return { excess, factors };
}

// Same assets, another one last: KZ eq. (15) subtracts the last asset.
const lastFirst = (excess: readonly (readonly number[])[]) => excess.map((row) => [row[row.length - 1], ...row.slice(0, -1)]);
const relative = (actual: number, expected: number) => Math.abs(actual - expected) / Math.abs(expected);
const share = (values: readonly number[], test: (value: number) => boolean) => values.filter(test).length / values.length;

describe('rankTest', () => {
  it('with two assets equals the squared OLS t-statistic of the slope of R_1 - R_2 on the factor', () => {
    // N = 2: B̂ is one slope, Σ̂ = SSR/T, and (T - 2) Q̂_FF B̂²/Σ̂ = B̂²/(s²/(T Q̂_FF)) with s² = SSR/(T - 2).
    const { excess, factors } = seededPanel(1, 80, 2, 1);
    const factor = factors.map(([f]) => f);
    const { tStats } = ols(excess.map(([a, b]) => a - b), [factor]);
    const test = rankTest(excess, factor);
    expect(test.df1).toBe(1);
    expect(test.df2).toBe(78);
    expect(relative(test.statistic, tStats[1] ** 2)).toBeLessThan(1e-12);
    expect(relative(test.wald, (80 / 78) * test.statistic)).toBeLessThan(1e-12);
    expect(test.waldPValue).toBeCloseTo(chiSquareSurvival(test.wald, 1), 15);
  });

  it('does not depend on which asset is subtracted (KZ, p. 518)', () => {
    const { excess, factors } = seededPanel(2, 80, 6, 1);
    const factor = factors.map(([f]) => f);
    expect(relative(rankTest(lastFirst(excess), factor).statistic, rankTest(excess, factor).statistic)).toBeLessThan(1e-10);
  });

  it('pins the p-values for Δc and Mkt-RF on the quarterly 25 portfolios', () => {
    // Δc: betas differ across the 25 portfolios at the 5% level, barely. Mkt-RF: overwhelmingly.
    const dc = rankTest(panel.excess, panel.dc);
    expect([dc.df1, dc.df2]).toEqual([24, 227]);
    expect(dc.statistic).toBeCloseTo(1.6135741168, 9);
    expect(dc.pValue).toBeCloseTo(0.0394377172, 9);
    expect(dc.wald).toBeCloseTo(42.9907324153, 8);
    expect(dc.waldPValue).toBeCloseTo(0.0099713726, 9);
    const mkt = rankTest(panel.excess, market);
    expect(mkt.statistic).toBeCloseTo(9.2749103047, 9);
    expect(relative(mkt.pValue, 1.768286369e-22)).toBeLessThan(1e-8);
  });
});

describe('grsFar', () => {
  const { excess, factors } = seededPanel(3);
  const lambdaNull = [0.012, -0.02];

  it('gives the two forms of eq. (23) equal to 1e-10', () => {
    const test = grsFar(excess, factors, lambdaNull);
    expect(relative(test.farForm, test.hotellingForm)).toBeLessThan(1e-10);
    const dc = grsFar(panel.excess, column(panel.dc), [0.02]);
    expect(relative(dc.farForm, dc.hotellingForm)).toBeLessThan(1e-10);
    expect(dc.hotellingForm).toBeCloseTo(26.3033156939, 9);
    expect(dc.pValue).toBeCloseTo(0.4840556653, 9);
  });

  it('equals grs on the regressions of eq. (21): the N - 1 differences on a constant and f_t - f̄ + λ°', () => {
    // Identity tested: grs(R, f - f̄ + λ°).statistic = (T - K - N + 1)/(T(N - 1)) · GRS-FAR(λ°), eq. (25),
    // with the same p-value and degrees of freedom. KZ (p. 526) define GRS-FAR as exactly this GRS test.
    const R = excess.map((row) => row.slice(0, -1).map((r) => r - row[row.length - 1]));
    const mean = sampleMeans(factors);
    const shifted = factors.map((row) => row.map((f, k) => f - mean[k] + lambdaNull[k]));
    const reference = grs(R, shifted);
    const test = grsFar(excess, factors, lambdaNull);
    expect(relative(test.statistic, reference.statistic)).toBeLessThan(1e-10);
    expect(relative(test.pValue, reference.pValue)).toBeLessThan(1e-9);
    expect([test.df1, test.df2]).toEqual([reference.df1, reference.df2]);
    expect([test.df1, test.df2]).toEqual([5, 80 - 2 - 6 + 1]);
  });

  it('tends to the rank test as λ° grows without bound (KZ fn. 13, p. 528)', () => {
    const dc = grsFar(panel.excess, column(panel.dc), [1e8]);
    const rank = rankTest(panel.excess, panel.dc);
    expect(relative(dc.statistic, rank.statistic)).toBeLessThan(1e-9);
    expect(relative(dc.hotellingForm, rank.wald)).toBeLessThan(1e-9);
  });

  it('does not depend on which asset is subtracted', () => {
    const a = grsFar(excess, factors, lambdaNull);
    const b = grsFar(lastFirst(excess), factors, lambdaNull);
    expect(relative(b.statistic, a.statistic)).toBeLessThan(1e-10);
    expect(relative(b.farForm, a.farForm)).toBeLessThan(1e-10);
  });
});

describe('farConfidenceSet', () => {
  const grid = Array.from({ length: 2001 }, (_, j) => -1 + j * 0.001);

  it('pins the 95% set for Δc: bounded, [0.006, 0.432] on a grid of step 0.001 over [-1, 1]', () => {
    const set = farConfidenceSet(panel.excess, panel.dc, { grid, q: 0.05 });
    expect(set.intervals).toHaveLength(1);
    expect(set.intervals[0][0]).toBeCloseTo(0.006, 12);
    expect(set.intervals[0][1]).toBeCloseTo(0.432, 12);
    expect(set.unbounded).toBe(false);
    expect(set.empty).toBe(false);
    // Each end is accepted and its outer neighbour is rejected.
    const p = (lambdaNull: number) => grsFar(panel.excess, column(panel.dc), [lambdaNull]).pValue;
    for (const inside of [0.006, 0.432]) expect(p(inside)).toBeGreaterThanOrEqual(0.05);
    for (const outside of [0.005, 0.433]) expect(p(outside)).toBeLessThan(0.05);
  });

  it('flags an unbounded set when it reaches an end of the grid', () => {
    const short = Array.from({ length: 41 }, (_, j) => j * 0.001);
    const set = farConfidenceSet(panel.excess, panel.dc, { grid: short, q: 0.05 });
    expect(set.unbounded).toBe(true);
    expect(set.intervals).toHaveLength(1);
    expect(set.intervals[0][0]).toBeCloseTo(0.006, 12);
    expect(set.intervals[0][1]).toBeCloseTo(0.04, 12);
  });

  it('pins the 95% set for Mkt-RF: empty, since GRS-FAR rejects at every λ°', () => {
    const set = farConfidenceSet(panel.excess, market, { grid, q: 0.05 });
    expect(set).toEqual({ intervals: [], unbounded: false, empty: true });
    // The largest p-value on the grid is 2.6e-5, at λ° = 0.
    expect(grsFar(panel.excess, column(market), [0]).pValue).toBeCloseTo(2.64559e-5, 9);
  });

  it('rejects a grid that is not increasing', () => {
    expect(() => farConfidenceSet(panel.excess, panel.dc, { grid: [0, 0], q: 0.05 })).toThrow(RangeError);
  });
});

describe('waldConfidenceSet', () => {
  it('builds λ̂ ± 1.96·se for Δc from the two-pass pieces', () => {
    const set = waldConfidenceSet(panel.excess, panel.dc, { q: 0.05 });
    // λ̂ is the CCAPM slope of conditionalModelFits; the FM standard error is famaMacBeth's.
    const { lambda: [ccapm], beta } = conditionalModelFits(panel, ['ccapm']).ccapm;
    expect(set.lambda).toBeCloseTo(ccapm, 14);
    expect(set.famaMacBeth.se).toBeCloseTo(famaMacBeth(panel.excess, beta, { intercept: true }).se[0], 15);
    // In sample FM se² = (AΣ̂_εA' + σ̂²_f)/T and Shanken se² = (AΣ̂_εA'(1 + c) + σ̂²_f)/T, c = λ̂²/σ̂²_f,
    // so Shanken se² = (1 + c)·FM se² - c·σ̂²_f/T.
    const T = panel.dc.length;
    const factorVariance = timeSeriesRegressions(panel.excess, column(panel.dc)).factorCovariance[0][0];
    const c = set.lambda ** 2 / factorVariance;
    expect(relative(set.shanken.se ** 2, (1 + c) * set.famaMacBeth.se ** 2 - c * factorVariance / T)).toBeLessThan(1e-10);
    const z = 1.959963984540054;
    expect(set.famaMacBeth.lower).toBeCloseTo(set.lambda - z * set.famaMacBeth.se, 14);
    expect(set.shanken.upper).toBeCloseTo(set.lambda + z * set.shanken.se, 14);
    expect(set.lambda).toBeCloseTo(0.0088641531, 9);
    expect(set.famaMacBeth.se).toBeCloseTo(0.0037945283, 9);
    expect(set.shanken.se).toBeCloseTo(0.0052115455, 9);
  });
});

describe('simulateUselessFactor', () => {
  it('gives the same output for the same seed and reruns draw 0 through the two-pass pieces', () => {
    const a = simulateUselessFactor(5, panel.excess, { samples: 3, strength: 0.5 });
    expect(simulateUselessFactor(5, panel.excess, { samples: 3, strength: 0.5 })).toEqual(a);
    // Draw 0 by hand: m_t is the standardised equal-weighted average return, f_t = 0.5 m_t + e_t.
    const average = panel.excess.map((row) => row.reduce((s, r) => s + r, 0) / row.length);
    const mean = average.reduce((s, v) => s + v, 0) / average.length;
    const sd = Math.sqrt(average.reduce((s, v) => s + (v - mean) ** 2, 0) / average.length);
    const z = normalRng(5);
    const factor = average.map((v) => 0.5 * (v - mean) / sd + z());
    const set = waldConfidenceSet(panel.excess, factor, { q: 0.05 });
    const { beta } = timeSeriesRegressions(panel.excess, column(factor));
    const { r2 } = crossSectionalRegression(beta, sampleMeans(panel.excess), { intercept: true, weighting: 'ols' });
    expect(a.lambda[0]).toBe(set.lambda);
    expect(a.famaMacBethT[0]).toBe(set.lambda / set.famaMacBeth.se);
    expect(a.shankenT[0]).toBe(set.lambda / set.shanken.se);
    expect(a.r2[0]).toBe(r2);
  });

  it('makes a useless factor look priced: |t_FM| > 1.96 in far more than 5% of draws', () => {
    // 200 draws, strength 0, seed 1, on the quarterly 25 portfolios: |t_FM| > 1.96 in 33.5% of draws.
    // The Shanken t rejects in 5.0%, since its c = λ̂²/σ̂²_f grows with λ̂². The median R² is 0.116, and 83% of
    // draws beat the CAPM's R² of 0.008 on the same assets.
    const sim = simulateUselessFactor(1, panel.excess, { samples: 200, strength: 0 });
    const capm = conditionalModelFits(panel, ['capm']).capm.r2;
    expect(capm).toBeCloseTo(0.0081340007, 9);
    expect(share(sim.famaMacBethT, (t) => Math.abs(t) > 1.96)).toBeCloseTo(0.335, 10);
    expect(share(sim.shankenT, (t) => Math.abs(t) > 1.96)).toBeCloseTo(0.05, 10);
    expect([...sim.r2].sort((x, y) => x - y)[100]).toBeCloseTo(0.116, 3);
    expect(share(sim.r2, (r2) => r2 > capm)).toBeCloseTo(0.83, 10);
  }, 30_000);
});

describe('simulateWeakIdentification', () => {
  const grid = Array.from({ length: 41 }, (_, j) => -4 + j * 0.2);

  it('spaces the true betas evenly and gives the same output for the same seed', () => {
    const options = { T: 40, N: 5, betaSpread: 1, lambda: 1, samples: 5, grid };
    const a = simulateWeakIdentification(4, options);
    expect(a.beta).toEqual([0.5, 0.75, 1, 1.25, 1.5]);
    expect(simulateWeakIdentification(4, options)).toEqual(a);
    expect(a.wald).toHaveLength(5);
    expect(a.far).toHaveLength(5);
  });

  it('keeps GRS-FAR at 5% size at every beta spread while Wald coverage collapses as the spread goes to 0', () => {
    // T = 60, N = 10, λ = 1, 600 samples, seed 7. One simulation standard error of a 5% rate is 0.89 points;
    // the band is 5% ± 3 standard errors, [2.3%, 7.7%]. With the same seed the GRS-FAR statistic at the true λ is
    // the same at every spread (it does not depend on B), so the rate is 32/600 = 5.3% each time.
    // 95% Wald coverage (FM, Shanken): spread 4: 100%, 100% (fixed factors, see the doc comment);
    // spread 1: 90.2%, 93.2%; spread 0.25: 38.3%, 41.0%; spread 0: 22.2%, 23.5%.
    const run = (betaSpread: number) => simulateWeakIdentification(7, { T: 60, N: 10, betaSpread, lambda: 1, samples: 600, grid });
    const coverage = [4, 1, 0.25, 0].map((spread) => run(spread).coverage);
    for (const { far } of coverage) {
      expect(1 - far).toBeGreaterThan(0.023);
      expect(1 - far).toBeLessThan(0.077);
      expect(far).toBe(coverage[0].far);
    }
    expect(coverage[0].far).toBeCloseTo(568 / 600, 12);
    expect(coverage.map((c) => c.famaMacBeth)).toEqual([600, 541, 230, 133].map((n) => expect.closeTo(n / 600, 12)));
    expect(coverage.map((c) => c.shanken)).toEqual([600, 559, 246, 141].map((n) => expect.closeTo(n / 600, 12)));
  }, 30_000);
});
