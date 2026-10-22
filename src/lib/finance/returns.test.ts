import { describe, expect, it } from 'vitest';
import { betweenDates, loadSeries } from '../data/series';
import { normalRng } from '../math/rng';
import {
  addedPath, arithmeticMean, excessReturn, ff3MarketReturns, geometricMean, grossGrowth,
  growthPath, logReturn, meanLogApprox, repeatedSum, sampleVariance, simpleFromLog, simpleReturn,
} from './returns';

describe('return arithmetic', () => {
  it('includes cash dividends and defaults to a zero dividend', () => {
    // (110 + 2) / 100 - 1 = 0.12; 110 / 100 - 1 = 0.10.
    expect(simpleReturn(100, 110, 2)).toBeCloseTo(0.12, 14);
    expect(simpleReturn(100, 110)).toBeCloseTo(0.10, 14);
    expect(simpleReturn(100, 0)).toBe(-1);
    expect(() => simpleReturn(0, 110)).toThrow(RangeError);
    expect(() => simpleReturn(-100, 110)).toThrow(RangeError);
    expect(() => simpleReturn(100, NaN)).toThrow(RangeError);
  });

  it('converts simple and log returns, including tiny returns and a total loss', () => {
    // ln(1.5) = 0.4054651081081644; exp(ln(1.5)) - 1 = 0.5.
    expect(logReturn(0.5)).toBeCloseTo(0.4054651081081644, 14);
    expect(simpleFromLog(0.4054651081081644)).toBeCloseTo(0.5, 14);
    expect(logReturn(1e-16)).toBeCloseTo(1e-16, 30);
    expect(simpleFromLog(1e-16)).toBeCloseTo(1e-16, 30);
    expect(logReturn(-1)).toBe(-Infinity);
    expect(simpleFromLog(-Infinity)).toBe(-1);
    expect(() => logReturn(-1.01)).toThrow(RangeError);
    expect(() => simpleFromLog(NaN)).toThrow(RangeError);
  });

  it('subtracts the simple risk-free return', () => {
    // 0.12 - 0.03 = 0.09 (a 9 percentage point excess return).
    expect(excessReturn(0.12, 0.03)).toBeCloseTo(0.09, 14);
    expect(excessReturn(-0.1, 0.02)).toBeCloseTo(-0.12, 14);
    expect(() => excessReturn(Infinity, 0)).toThrow(RangeError);
  });

  it('compounds +50% then -50% and agrees with the log wealth path', () => {
    const returns = Object.freeze([0.5, -0.5]);
    // 1.5 * 0.5 = 0.75; ln(1.5) + ln(0.5) = ln(0.75).
    expect(grossGrowth(returns)).toBe(0.75);
    expect(logReturn(0.5) + logReturn(-0.5)).toBeCloseTo(-0.2876820724517809, 14);
    const simplePath = growthPath(returns, 'simple');
    const logPath = growthPath(returns.map(logReturn), 'log');
    expect(simplePath).toEqual([1, 1.5, 0.75]);
    simplePath.forEach((value, i) => expect(Math.abs(value - logPath[i])).toBeLessThan(1e-12));
    expect(returns).toEqual([0.5, -0.5]);
  });

  it('adds equal returns over k periods and builds the wrong added path', () => {
    // 10 * ln(1.1) = 0.9531017980432486 = ln(1.1^10); 12 * 0.0097 = 0.1164.
    expect(repeatedSum(logReturn(0.1), 10)).toBeCloseTo(0.9531017980432486, 14);
    expect(repeatedSum(logReturn(0.1), 10)).toBeCloseTo(logReturn(grossGrowth(Array(10).fill(0.1)) - 1), 14);
    expect(repeatedSum(0.0097, 12)).toBeCloseTo(0.1164, 14);
    expect(repeatedSum(-Infinity, 0)).toBe(0);
    expect(repeatedSum(-Infinity, 3)).toBe(-Infinity);
    expect(() => repeatedSum(0.1, 1.5)).toThrow(RangeError);
    expect(() => repeatedSum(NaN, 2)).toThrow(RangeError);
    // 1 + j * 0.1 for j = 0..3, against compounding 1.1^3 = 1.331.
    const added = addedPath(0.1, 3);
    [1, 1.1, 1.2, 1.3].forEach((v, j) => expect(added[j]).toBeCloseTo(v, 14));
    expect(growthPath([0.1, 0.1, 0.1], 'simple')[3]).toBeCloseTo(1.331, 14);
    // Adding a -50% return three times gives -0.5, below zero: impossible wealth.
    expect(addedPath(-0.5, 3)[3]).toBe(-0.5);
    expect(() => addedPath(-1.5, 2)).toThrow(RangeError);
  });

  it('preserves the starting dollar with no returns and zero wealth after a total loss', () => {
    expect(grossGrowth([])).toBe(1);
    expect(growthPath([], 'simple')).toEqual([1]);
    expect(growthPath([], 'log')).toEqual([1]);
    // 1 * 0 * 1.5 = 0; no later percentage gain recovers a total loss.
    expect(grossGrowth([-1, 0.5])).toBe(0);
    expect(growthPath([-1, 0.5], 'simple')).toEqual([1, 0, 0]);
    expect(growthPath([-Infinity, logReturn(0.5)], 'log')).toEqual([1, 0, 0]);
    expect(() => grossGrowth([-1.1])).toThrow(RangeError);
    expect(() => growthPath([-1.1], 'simple')).toThrow(RangeError);
    expect(() => growthPath([NaN], 'log')).toThrow(RangeError);
  });

  it('distinguishes arithmetic and geometric means and uses sample variance', () => {
    // (0.5 - 0.5) / 2 = 0; sqrt(0.75) - 1 = -0.1339745962155614.
    // [(0.5 - 0)^2 + (-0.5 - 0)^2] / (2 - 1) = 0.5.
    const returns = Object.freeze([0.5, -0.5]);
    expect(arithmeticMean(returns)).toBe(0);
    expect(geometricMean(returns)).toBeCloseTo(-0.1339745962155614, 14);
    expect(sampleVariance(returns)).toBe(0.5);
    expect(arithmeticMean([0.12])).toBe(0.12);
    expect(geometricMean([0.12])).toBeCloseTo(0.12, 14);
    expect(geometricMean([-1, 0.5])).toBe(-1);
    expect(sampleVariance([0.1, 0.1, 0.1])).toBeCloseTo(0, 14);
    expect(() => arithmeticMean([])).toThrow(RangeError);
    expect(() => geometricMean([])).toThrow(RangeError);
    expect(() => sampleVariance([])).toThrow(RangeError);
    expect(() => sampleVariance([0.1])).toThrow(RangeError);
    expect(() => arithmeticMean([NaN])).toThrow(RangeError);
  });

  it('approximates the mean log return with half the variance drag', () => {
    // 0.01 - 0.04 / 2 = -0.01.
    expect(meanLogApprox(0.01, 0.04)).toBe(-0.01);
    expect(() => meanLogApprox(0.01, -0.04)).toThrow(RangeError);
    // Small returns R = 0.001 + 0.01 Z keep higher-order Taylor terms small.
    // Compare to the actual mean ln(1 + R), not another copy of the approximation.
    const normal = normalRng(42);
    const returns = Array.from({ length: 100_000 }, () => 0.001 + 0.01 * normal());
    const actual = arithmeticMean(returns.map(logReturn));
    const approximate = meanLogApprox(arithmeticMean(returns), sampleVariance(returns));
    // Allow 1e-6 for the omitted mean^2 / 2 (about 5e-7) and higher-order terms.
    // This is much smaller than the variance / 2 adjustment (about 5e-5).
    expect(Math.abs(approximate - actual)).toBeLessThan(1e-6);
  });
});

describe('FF3 decimal returns', () => {
  it('adds RF to the market premium and converts percent units once', async () => {
    const series = betweenDates(await loadSeries('ff3-monthly'), '1926-07-01', '1926-08-01');
    const { dates, market, rf } = ff3MarketReturns(series);
    expect(dates).toEqual(['1926-07-01', '1926-08-01']);
    // July: (2.89 + 0.22) / 100 = 0.0311; August: (2.64 + 0.25) / 100 = 0.0289.
    expect(market[0]).toBeCloseTo(0.0311, 14);
    expect(market[1]).toBeCloseTo(0.0289, 14);
    expect(rf).toEqual([0.0022, 0.0025]);
    expect(series.rows[0][1]).toBe(2.89);
    expect(ff3MarketReturns({ ...series, rows: [] })).toEqual({ dates: [], market: [], rf: [] });
  });

  it('matches independently computed market growth for January–December 2020', async () => {
    /* Reference from committed JSON, independent Python decimal arithmetic:
     * python3 - <<'PY'
     * import json, math
     * from decimal import Decimal, getcontext
     * getcontext().prec = 40
     * with open('src/data/series/ff3-monthly.json') as f:
     *     data = json.load(f, parse_float=Decimal)
     * rows = [r for r in data['rows'] if '2020-01-01' <= r[0] <= '2020-12-31']
     * print(math.prod(Decimal(1) + (r[1] + r[4]) / 100 for r in rows))
     * PY
     * Product of the 12 monthly gross returns = 1.240661929523304908485547259381015497364.
     */
    const series = betweenDates(await loadSeries('ff3-monthly'), '2020-01-01', '2020-12-31');
    const { dates, market } = ff3MarketReturns(series);
    expect(dates).toHaveLength(12);
    expect(dates[0]).toBe('2020-01-01');
    expect(dates.at(-1)).toBe('2020-12-01');
    expect(grossGrowth(market)).toBeCloseTo(1.2406619295233049, 12);
    const simplePath = growthPath(market, 'simple');
    const logPath = growthPath(market.map(logReturn), 'log');
    simplePath.forEach((value, i) => expect(Math.abs(value - logPath[i])).toBeLessThan(1e-12));
  });

  it('rejects missing or nonfinite market and risk-free values instead of treating them as zero', async () => {
    const series = await loadSeries('ff3-monthly');
    for (const row of [
      ['2020-01-01', null, 0, 0, 0.1],
      ['2020-01-01', 1, 0, 0, null],
      ['2020-01-01', 1, 0, 0, NaN],
    ] as const) {
      expect(() => ff3MarketReturns({ ...series, rows: [row] })).toThrow(RangeError);
    }
  });
});
