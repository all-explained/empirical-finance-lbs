import { describe, expect, it } from 'vitest';
import { loadOsapSignals } from '../data/osap-signals';
import { loadSeries } from '../data/series';
import { countAbove, signalSummaries } from '../finance/zoo';
import {
  benjaminiHochberg, benjaminiHochbergYekutieli, bonferroni, discoveryCounts, holm, pValues,
  simulateStrategySearch, yekutieliConstant,
} from './multipleTesting';

// Harvey, Liu and Zhu (2016), Table 4 (p. 18): ten p-values in percent, in test order 1–10.
const table4 = [4.66, 0.85, 2.71, 0.05, 3.0, 0.84, 0.0, 0.0, 0.6, 1.28].map((p) => p / 100);
const tests = (rejected: boolean[]) => rejected.flatMap((r, i) => (r ? [i + 1] : []));

describe('pValues', () => {
  it('gives 0.05 at t = ±1.96 and 1 at t = 0', () => {
    const [plus, minus, zero] = pValues([1.96, -1.96, 0]);
    expect(plus).toBeCloseTo(0.05, 4);
    expect(minus).toBe(plus);
    expect(zero).toBe(1);
  });
});

describe('the three procedures on HLZ Table 4 at q = 5%', () => {
  // Worked by hand. Sorted: 0, 0, 0.05, 0.60, 0.84, 0.85, 1.28, 2.71, 3.00, 4.66 (%).
  it('Bonferroni keeps p ≤ 0.5%: tests 4, 7, 8', () => {
    const { rejected, count, tCutoff } = bonferroni(table4, 0.05);
    expect(tests(rejected)).toEqual([4, 7, 8]);
    expect(count).toBe(3);
    // Largest rejected p = 0.05%: Φ⁻¹(1 - 0.00025) = 3.4807564043462422 (Python statistics.NormalDist).
    expect(tCutoff).toBeCloseTo(3.4807564043462422, 10);
  });

  it('Holm stops at p_(5) = 0.84% > 5%/6 = 0.833%: tests 4, 7, 8, 9', () => {
    const { rejected, count, tCutoff } = holm(table4, 0.05);
    expect(tests(rejected)).toEqual([4, 7, 8, 9]);
    expect(count).toBe(4);
    expect(tCutoff).toBeCloseTo(2.747781385444993, 10); // p = 0.60%
  });

  it('BH (c = 1) keeps all ten: p_(j) ≤ j × 0.5% for every j', () => {
    const { count, tCutoff } = benjaminiHochberg(table4, 0.05);
    expect(count).toBe(10);
    expect(tCutoff).toBeCloseTo(1.989917720242046, 10); // p = 4.66%
  });

  it('BHY with c(10) = 2.929 keeps j ≤ 6, p_(6) = 0.85% ≤ 6 × 5% / 29.29 = 1.02%: tests 2, 4, 6, 7, 8, 9', () => {
    const { rejected, count, tCutoff } = benjaminiHochbergYekutieli(table4, 0.05);
    expect(tests(rejected)).toEqual([2, 4, 6, 7, 8, 9]);
    expect(count).toBe(6);
    expect(tCutoff).toBeCloseTo(2.6315354456974234, 10); // p = 0.85%
  });

  it('orders the counts: Bonferroni ≤ Holm ≤ BH and BHY ≤ BH', () => {
    const [b, h, bh, bhy] = [bonferroni, holm, benjaminiHochberg, benjaminiHochbergYekutieli].map((rule) => rule(table4, 0.05).count);
    expect(b).toBeLessThanOrEqual(h);
    expect(h).toBeLessThanOrEqual(bh);
    expect(bhy).toBeLessThanOrEqual(bh);
  });

  it('rejects nothing when every p-value is above the level, so the cut-off is null', () => {
    expect(holm([0.2, 0.5], 0.05)).toEqual({ rejected: [false, false], count: 0, tCutoff: null });
  });

  it('refuses a p-value outside [0, 1] and a level outside (0, 1)', () => {
    expect(() => bonferroni([1.2], 0.05)).toThrow(RangeError);
    expect(() => holm([0.01], 0)).toThrow(RangeError);
  });
});

describe('yekutieliConstant and BHY with one test', () => {
  it('c(1) = 1 and c(10) = 7381/2520 = 2.9289682539682538', () => {
    expect(yekutieliConstant(1)).toBe(1);
    expect(yekutieliConstant(10)).toBeCloseTo(7381 / 2520, 14);
  });

  it('equals a single test at level q when n = 1', () => {
    expect(benjaminiHochbergYekutieli([0.05], 0.05).count).toBe(1);
    expect(benjaminiHochbergYekutieli([0.0501], 0.05).count).toBe(0);
  });
});

describe('simulateStrategySearch', () => {
  const settings = { count: 5000, trueShare: 0, sharpe: 0.5, T: 240 };

  it('gives the same output for the same seed and another for another seed', () => {
    const run = simulateStrategySearch(7, { ...settings, count: 50, trueShare: 0.2 });
    expect(simulateStrategySearch(7, { ...settings, count: 50, trueShare: 0.2 })).toEqual(run);
    expect(simulateStrategySearch(8, { ...settings, count: 50, trueShare: 0.2 }).t).not.toEqual(run.t);
    expect(run.isTrue.filter(Boolean)).toHaveLength(10);
  });

  it('with no true alpha, about 5% of |t| exceed 1.96', () => {
    // Band 0.05 ± 0.012: the exact size of |t_239| > 1.96 is 0.0512, and three binomial standard errors
    // for 5000 draws are 3 √(0.05 × 0.95 / 5000) = 0.0092.
    const { t } = simulateStrategySearch(2016, settings);
    const share = t.filter((ti) => Math.abs(ti) > 1.96).length / t.length;
    expect(Math.abs(share - 0.05)).toBeLessThan(0.012);
  });

  it('true strategies have mean t near SR √(T/12) = 0.5 √20 = 2.236', () => {
    // Each t has standard deviation about 1, so the mean of 2000 t-statistics is within 3/√2000 = 0.07.
    const { t, isTrue } = simulateStrategySearch(29, { ...settings, count: 2000, trueShare: 1 });
    expect(isTrue.every(Boolean)).toBe(true);
    expect(Math.abs(t.reduce((a, b) => a + b, 0) / t.length - 0.5 * Math.sqrt(20))).toBeLessThan(0.07);
  });
});

describe('discoveryCounts', () => {
  it('counts a hand-made case at |t| > 1.96', () => {
    // Real: 3, -2.5 found; 1 missed. Null: 2.2 found (false), 0.5 not. Expected false = 2 × 2Φ(-1.96).
    const counts = discoveryCounts([3, -2.5, 1, 2.2, 0.5], [true, true, true, false, false], 1.96);
    expect(counts).toMatchObject({ trueDiscoveries: 2, falseDiscoveries: 1, misses: 1 });
    expect(counts.falseDiscoveryProportion).toBeCloseTo(1 / 3, 14);
    expect(counts.expectedFalseDiscoveries).toBeCloseTo(2 * 0.04999579029644086, 10);
  });

  it('sets the proportion to 0 when nothing is discovered', () => {
    expect(discoveryCounts([0.1], [false], 1.96).falseDiscoveryProportion).toBe(0);
  });
});

describe('the published predictors in osap-ls-monthly', () => {
  it('pins the counts that survive each rule at q = 5%', async () => {
    // Reference: a separate Python script (statistics.NormalDist, the same rules written out) on the same JSON.
    const [returns, { signals }] = await Promise.all([loadSeries('osap-ls-monthly'), loadOsapSignals()]);
    const zoo = signalSummaries(returns, signals, { construction: 'original' });
    const t = zoo.flatMap(({ original }) => (original ? [original.t] : []));
    const p = pValues(t);
    expect(t).toHaveLength(165);
    expect(countAbove(zoo, 1.96, 'original')).toBe(158);
    expect(countAbove(zoo, 3, 'original')).toBe(107);
    const bonf = bonferroni(p, 0.05);
    const h = holm(p, 0.05);
    const bhy = benjaminiHochbergYekutieli(p, 0.05);
    expect([bonf.count, h.count, bhy.count]).toEqual([81, 88, 123]);
    expect(bonf.tCutoff).toBeCloseTo(3.6426325185082247, 8);
    expect(h.tCutoff).toBeCloseTo(3.4529736252637506, 8);
    expect(bhy.tCutoff).toBeCloseTo(2.7250835536035725, 8);
  });
});
