/**
 * Every number in the prose of chapter 4, recomputed from shiller-monthly and the seeded
 * simulation through the library. If the data or the library changes, this test fails
 * before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import shiller from '../src/data/series/shiller-monthly.json';
import type { Series } from '../src/lib/data/series';
import { arithmeticMean } from '../src/lib/finance/returns';
import { autocorrelations, bartlettWeights, overlapCorrelation, overlapMeanVariance } from '../src/lib/stats/autocorr';
import { ols } from '../src/lib/stats/ols';
import {
  DEFAULT_SEED, hacPath, MAX_LAG, overlappingSums, shillerLogReturns, SIM_MONTHS, SIM_SIGMA, simulatedLogReturns,
} from '../src/components/plots/hacSample';

const data = shillerLogReturns(shiller as unknown as Series<'shiller-monthly'>);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const pp = (v: number, digits: number) => (v * 100).toFixed(digits);
const trueSE = (n: number) => Math.sqrt(overlapMeanVariance(12, n, SIM_SIGMA ** 2));

describe('chapter 4 prose numbers', () => {
  test('hook: overlapping and non-overlapping 12-month returns', () => {
    expect([data.dates[0], data.dates.at(-1), data.r.length]).toEqual(['1881-02-01', '2023-06-01', 1709]);
    const h = hacPath(data.r, 12);
    expect(h.y.length).toBe(1698);
    expect(pp(h.mean, 1)).toBe('8.7');
    // Classical OLS and Newey–West with L = 0 agree to the reported digits.
    const classical = ols(h.y, []);
    expect([pp(classical.standardErrors[0], 2), fixed(classical.tStats[0], 1)]).toEqual(['0.44', '19.7']);
    expect([pp(h.se[0], 2), fixed(h.mean / h.se[0], 1)]).toEqual(['0.44', '19.7']);
    // 142 separate 12-month blocks from February 1881.
    const blocks: number[] = [];
    for (let s = 0; s + 12 <= data.r.length; s += 12) blocks.push(data.r.slice(s, s + 12).reduce((a, b) => a + b, 0));
    const fit = ols(blocks, []);
    expect([blocks.length, pp(fit.coefficients[0], 1), pp(fit.standardErrors[0], 2), fixed(fit.tStats[0], 1)])
      .toEqual([142, '8.7', '1.45', '6.0']);
    expect(Math.round(fit.standardErrors[0] / h.se[0])).toBe(3); // "three times more precise"
  });

  test('intuition: shared months and the seeded OverlapDemo', () => {
    expect(fixed(overlapCorrelation(12, 1), 2)).toBe('0.92');
    expect(overlapCorrelation(12, 12)).toBe(0);
    const y = overlappingSums(simulatedLogReturns(DEFAULT_SEED), 12);
    expect(fixed(autocorrelations(y, 1)[1], 2)).toBe('0.91');
  });

  test('formalisation: MA(k-1) algebra and Bartlett weights', () => {
    // S = k² sigma²: overlapMeanVariance(k, n, 1) * n tends to k² for long samples.
    expect(overlapMeanVariance(12, 1e7, 1) * 1e7).toBeCloseTo(144, 2);
    expect(fixed(Math.sqrt(12), 2)).toBe('3.46');
    expect(bartlettWeights(11)[6]).toBe(0.5);
    expect([overlapCorrelation(12, 1), overlapCorrelation(12, 11)]).toEqual([11 / 12, 1 / 12]);
  });

  test('playground: shiller-monthly, 12-month and 1-month returns', () => {
    const h = hacPath(data.r, 12);
    expect([fixed(h.rho[1], 2), fixed(h.rho[11], 2)]).toEqual(['0.95', '0.07']);
    expect([pp(h.se[12], 2), fixed(h.mean / h.se[12], 1)]).toEqual(['1.30', '6.7']);
    expect([pp(h.se[24], 2), fixed(h.mean / h.se[24], 1)]).toEqual(['1.38', '6.3']);
    expect(MAX_LAG).toBe(24);
    expect(fixed(h.se[24] / h.se[0], 1)).toBe('3.1');
    expect(pp(2 * h.se[24], 1)).toBe('2.8');
    const m = hacPath(data.r, 1);
    expect([pp(m.se[0] * 12, 2), fixed(m.rho[1], 2), pp(m.se[24] * 12, 2)]).toEqual(['1.19', '0.26', '1.49']);
    expect(pp(arithmeticMean(data.r) * 12, 1)).toBe('8.7');
  });

  test('playground: seeded simulation', () => {
    expect([SIM_MONTHS / 12, pp(0.005 * 12, 0), DEFAULT_SEED]).toEqual([50, '6', 1]);
    const s1 = hacPath(simulatedLogReturns(DEFAULT_SEED), 12);
    expect(pp(trueSE(s1.y.length), 2)).toBe('2.22');
    expect([pp(s1.se[0], 2), fixed(s1.mean / s1.se[0], 1), pp(s1.se[24], 2)]).toEqual(['0.66', '7.9', '1.97']);
    // Re-roll adds 1 to the seed: three presses from seed 1 reach seed 4.
    const s4 = hacPath(simulatedLogReturns(DEFAULT_SEED + 3), 12);
    expect(pp(s4.mean, 1)).toBe('-0.6');
    expect(0.06 - s4.mean).toBeGreaterThan(0.06); // misses the true 6% by more than six points
  });

  test('playground: Newey–West understates on average in the simulation', () => {
    const seeds = Array.from({ length: 200 }, (_, i) => i + 1);
    const se24 = seeds.map((seed) => hacPath(simulatedLogReturns(seed), 12).se[24]);
    const average = arithmeticMean(se24);
    expect(pp(average, 2)).toBe('2.00');
    expect(average).toBeLessThan(trueSE(SIM_MONTHS - 11));
  });
});
