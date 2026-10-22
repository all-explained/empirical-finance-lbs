/**
 * Every number in the prose of chapter 3, recomputed from ff3-monthly and ff25-size-bm-monthly through
 * the library. If the data or the library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import ff25 from '../src/data/series/ff25-size-bm-monthly.json';
import type { Series } from '../src/lib/data/series';
import { cdf, invCdf } from '../src/lib/math/normal';
import { ols } from '../src/lib/stats/ols';
import { DEFAULT_SEED, WINDOW, lastMonths, marketSample, simulatedSample, type RegressionSample } from '../src/components/plots/regressionSample';

const full = marketSample(ff3 as unknown as Series<'ff3-monthly'>, ff25 as unknown as Series<'ff25-size-bm-monthly'>);
const recent = lastMonths(full);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const both = (s: RegressionSample) => [ols(s.y, [s.x]), ols(s.y, [s.x], { errors: 'white' })];

describe('chapter 3 prose numbers', () => {
  test('samples', () => {
    expect([full.dates[0], full.dates.at(-1), full.dates.length]).toEqual(['1926-07-01', '2026-08-01', 1202]);
    expect([recent.dates[0], recent.dates.at(-1), WINDOW]).toEqual(['2021-09-01', '2026-08-01', 60]);
  });

  test('last five years: big value stocks on the market', () => {
    const [c, w] = both(recent);
    expect(fixed(c.coefficients[1], 2)).toBe('1.14');
    expect(percent(c.coefficients[0], 2)).toBe('1.33'); // intercept, % a month
    expect(fixed(c.tStats[0], 2)).toBe('2.05');
    expect(percent(c.r2, 1)).toBe('53.6');
    expect([fixed(c.standardErrors[1], 3), fixed(c.tStats[1], 2)]).toEqual(['0.140', '8.18']);
    expect([fixed(w.standardErrors[1], 3), fixed(w.tStats[1], 2)]).toEqual(['0.175', '6.53']);
    expect(fixed((c.coefficients[1] - 1) / c.standardErrors[1], 2)).toBe('1.02'); // t for beta = 1
    expect(fixed(c.coefficients[1] - 2 * c.standardErrors[1], 2)).toBe('0.86');
    expect(fixed(c.coefficients[1] + 2 * c.standardErrors[1], 2)).toBe('1.42');
  });

  test('all 1,202 months', () => {
    const [c, w] = both(full);
    expect([fixed(c.coefficients[1], 2), percent(c.r2, 1)]).toEqual(['1.30', '66.7']);
    expect([fixed(c.standardErrors[1], 3), fixed(w.standardErrors[1], 3)]).toEqual(['0.027', '0.069']);
    expect(fixed(w.standardErrors[1] / c.standardErrors[1], 1)).toBe('2.6');
    expect(fixed((c.coefficients[1] - 1) / c.standardErrors[1], 1)).toBe('11.5');
    expect(fixed((c.coefficients[1] - 1) / w.standardErrors[1], 1)).toBe('4.4');
    const big = full.dates.filter((_, t) => Math.abs(full.x[t]) > 0.25);
    expect(big.length).toBe(4); // market moves above 25% in a month
    expect(big.every((d) => d >= '1931-01-01' && d <= '1933-12-01')).toBe(true);
    const largest = full.dates.map((d, t) => [d, c.residuals[t] ** 2] as const).sort((p, q) => q[1] - p[1]).slice(0, 10);
    expect(largest.filter(([d]) => d.startsWith('193')).length).toBe(9);
  });

  test('normal approximations', () => {
    expect(fixed(invCdf(0.975), 2)).toBe('1.96');
    expect(percent(2 * cdf(2) - 1, 0)).toBe('95'); // estimate ± 2 se
  });

  test('seeded simulation, true beta 1.2', () => {
    expect(DEFAULT_SEED).toBe(1);
    const [ec, ew] = both(simulatedSample(DEFAULT_SEED, false));
    expect([fixed(ec.coefficients[1], 2), fixed(ec.standardErrors[1], 3), fixed(ew.standardErrors[1], 3)]).toEqual(['1.32', '0.121', '0.119']);
    const [fc, fw] = both(simulatedSample(DEFAULT_SEED, true));
    expect([fixed(fc.coefficients[1], 2), fixed(fc.standardErrors[1], 3), fixed(fw.standardErrors[1], 3)]).toEqual(['1.23', '0.111', '0.158']);
    expect(fixed(fw.standardErrors[1] / fc.standardErrors[1], 1)).toBe('1.4');
    const [gc, gw] = both(simulatedSample(4, true)); // three re-rolls of the fanning case
    expect([fixed(gc.coefficients[1], 2), fixed(gc.standardErrors[1], 3), fixed(gw.standardErrors[1], 3)]).toEqual(['1.56', '0.100', '0.189']);
    const band = (f: typeof gc) => [-2, 2].map((k) => fixed(f.coefficients[1] + k * f.standardErrors[1], 2));
    expect([band(gc), band(gw)]).toEqual([['1.36', '1.76'], ['1.18', '1.94']]);
    expect(simulatedSample(DEFAULT_SEED, true).x.length).toBe(60);
  });
});
