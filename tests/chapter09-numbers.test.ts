/**
 * Every number in the prose of chapter 9, recomputed from goyal-welch-annual through the
 * library. If the data or the library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import gw from '../src/data/series/goyal-welch-annual.json';
import type { Series } from '../src/lib/data/series';
import { horizonSlopes, impliedHorizonSlope, predictiveRegression } from '../src/lib/finance/predictive';
import { arithmeticMean, sampleVariance } from '../src/lib/finance/returns';
import { dataSample, simulatedSample, DEFAULT_SEED } from '../src/components/plots/predictiveSample';

const data = dataSample(gw as unknown as Series<'goyal-welch-annual'>);
const at = (year: number) => data.years.indexOf(year);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const tenYearsAfter = (year: number) => Math.exp(data.r.slice(at(year) + 1, at(year) + 11).reduce((s, v) => s + v, 0));

describe('chapter 9 prose numbers', () => {
  test('hook: dividend–price ratios and the decades after 1949 and 1999', () => {
    expect([data.years[0], data.years.at(-1), data.years.length]).toEqual([1926, 2025, 100]);
    expect(percent(Math.exp(data.dp[at(1931)]), 1)).toBe('10.1');
    expect(percent(Math.exp(data.dp[at(1999)]), 1)).toBe('1.1');
    expect(percent(Math.exp(data.dp[at(2025)]), 2)).toBe('1.15');
    expect(percent(Math.exp(data.dp[at(1949)]), 1)).toBe('6.8');
    expect(Math.min(...data.dp)).toBe(data.dp[at(1999)]);
    expect(fixed(tenYearsAfter(1949), 1)).toBe('4.8'); // stocks grew 4.8 times as much as T-bills
    expect(percent(1 - tenYearsAfter(1999), 0)).toBe('29'); // stocks ended 29% behind T-bills
  });

  test('regressions on the full sample', () => {
    const [h1, h5, h10] = horizonSlopes(data.r, data.dp, [1, 5, 10]);
    expect([fixed(h1.slope, 3), fixed(h1.tStat, 2), percent(h1.r2, 1), h1.nobs]).toEqual(['0.042', '0.94', '1.2', 99]);
    expect([fixed(h5.slope, 2), fixed(h5.tStat, 2), percent(h5.r2, 1)]).toEqual(['0.21', '1.66', '6.1']);
    expect([fixed(h10.slope, 2), fixed(h10.tStat, 2), percent(h10.r2, 1), h10.nobs]).toEqual(['0.39', '1.63', '11.8', 90]);
    const hh = predictiveRegression(data.r, data.dp, 10, { errors: 'hansen-hodrick' });
    const classical = predictiveRegression(data.r, data.dp, 10, { errors: 'classical' });
    expect([fixed(hh.tStat, 2), fixed(classical.tStat, 2)]).toEqual(['1.44', '3.43']);
    expect(Math.floor((data.r.length - 1) / 10)).toBe(9); // non-overlapping decades of returns 1927–2025
  });

  test('moments of returns and dp', () => {
    expect(percent(Math.sqrt(sampleVariance(data.r)), 1)).toBe('19.3');
    expect(percent(arithmeticMean(data.r), 1)).toBe('6.5');
    const sd = Math.sqrt(sampleVariance(data.dp));
    expect(fixed(sd, 2)).toBe('0.50');
    expect(percent(sd * data.b1, 1)).toBe('2.1');
  });

  test('AR(1) horizon link', () => {
    expect(fixed(data.phi, 2)).toBe('0.92');
    expect(fixed(data.phi ** 10, 2)).toBe('0.45');
    expect(fixed(impliedHorizonSlope(1, data.phi, 10), 1)).toBe('7.2');
    expect(fixed(impliedHorizonSlope(data.b1, data.phi, 10), 2)).toBe('0.30');
  });

  test('returns 1947–2009, the sample period of Cochrane (2011)', () => {
    // dp at the end of 1946–2008 forecasts the returns of 1947–2009.
    const fit = predictiveRegression(data.r.slice(at(1946), at(2009) + 1), data.dp.slice(at(1946), at(2009) + 1), 1);
    expect([fit.nobs, fixed(fit.slope, 2), fixed(fit.tStat, 2), percent(fit.r2, 1)]).toEqual([63, '0.12', '2.46', '10.1']);
  });

  test('seeded simulation', () => {
    const truth = fixed(impliedHorizonSlope(data.b1, data.phi, 10), 2);
    const s1 = simulatedSample(data, DEFAULT_SEED);
    const [h10] = horizonSlopes(s1.r, s1.dp, [10]);
    expect([DEFAULT_SEED, truth, fixed(h10.slope, 2), fixed(h10.tStat, 2)]).toEqual([1, '0.30', '0.63', '3.02']);
    const s5 = simulatedSample(data, 5);
    const [g10] = horizonSlopes(s5.r, s5.dp, [10]);
    expect([fixed(g10.slope, 2), fixed(g10.tStat, 2)]).toEqual(['-0.49', '-2.13']);
  });
});
