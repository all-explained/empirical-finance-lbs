import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import {
  certaintyEquivalentGain, clarkWest, cumulativeSquaredErrorDifference, expandingForecasts,
  goyalWelchPredictors, meanVarianceWeight, oosR2,
} from './outOfSample';

// Six-point series by hand: r - r̄ = [1,-1,1,-1,2,0], so Σ(r - r̄)² = 8;
// r - r̂ = [0,-1,1,-1,1,1], so Σ(r - r̂)² = 5; r̄ - r̂ = [-1,0,0,0,-1,1].
const actual = [1, -1, 2, 0, 3, 1];
const forecast = [1, 0, 1, 1, 2, 0];
const benchmark = [0, 0, 1, 1, 1, 1];

describe('forecast evaluation on a six-point series', () => {
  it('gives R²_OS = 1 - 5/8', () => {
    expect(oosR2(actual, forecast, benchmark)).toBeCloseTo(0.375, 14);
  });

  it('accumulates (r - r̄)² - (r - r̂)² = [1,0,0,0,3,-1]', () => {
    expect(cumulativeSquaredErrorDifference(actual, forecast, benchmark)).toEqual([1, 1, 1, 1, 4, 3]);
  });

  it('computes Clark–West from f = [2,0,0,0,4,0]', () => {
    // mean 1, sample variance 14/5, so statistic = 1 / sqrt(2.8 / 6) and p = 1 - N(statistic).
    const { statistic, pValue } = clarkWest(actual, forecast, benchmark);
    expect(statistic).toBeCloseTo(1.4638501094227998, 12);
    expect(pValue).toBeCloseTo(0.07161745376233486, 9);
  });

  it('scores a forecast equal to the historical mean as no gain', () => {
    // r̄ - r̂ = 0, so the Clark–West adjustment is zero and every f is zero.
    expect(oosR2(actual, benchmark, benchmark)).toBe(0);
    expect(cumulativeSquaredErrorDifference(actual, benchmark, benchmark)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(clarkWest(actual, benchmark, benchmark)).toEqual({ statistic: 0, pValue: 0.5 });
  });

  it('rejects unequal lengths and non-finite values', () => {
    expect(() => oosR2([1, 2], [1], [1, 2])).toThrow(RangeError);
    expect(() => clarkWest([1, NaN], [1, 2], [1, 2])).toThrow(RangeError);
  });
});

describe('expanding-window forecasts', () => {
  // x = [0,1,1,2,-1,0]; r[0] = 0.5 is never a target and never enters the mean.
  // t=3: pairs (0, 0.03), (1, -0.01), (1, 0.01): the line passes through 0.03 at x=0 and the
  //      mean 0 at x=1, so b = -0.03, a = 0.03, forecast at x=2 is -0.03, historical mean 0.01.
  // t=4: adds (2, 0.13): x̄ = 1, Σ(x - x̄)² = 2, Σ(x - x̄)(r - r̄) = 0.13 - 0.03, so b = 0.05;
  //      historical mean 0.04, a = 0.04 - 0.05 = -0.01, forecast at x=-1 is -0.06.
  const r = [0.5, 0.03, -0.01, 0.01, 0.13, 0.02];
  const x = [0, 1, 1, 2, -1, 0];

  it('uses only data known at each date', () => {
    const out = expandingForecasts(r, x, { minWindow: 3 });
    expect(out.index).toEqual([4, 5]);
    expect(out.actual).toEqual([0.13, 0.02]);
    expect(out.slope[0]).toBeCloseTo(-0.03, 14);
    expect(out.slope[1]).toBeCloseTo(0.05, 14);
    expect(out.forecast[0]).toBeCloseTo(-0.03, 14);
    expect(out.forecast[1]).toBeCloseTo(-0.06, 14);
    expect(out.benchmark[0]).toBeCloseTo(0.01, 14);
    expect(out.benchmark[1]).toBeCloseTo(0.04, 14);
  });

  it('applies the sign restriction at t=3 and the zero floor at t=4', () => {
    const out = expandingForecasts(r, x, { minWindow: 3, expectedSign: 1, floorAtZero: true });
    // t=3: b < 0 has the wrong sign, so the forecast is the historical mean 0.01.
    expect(out.forecast[0]).toBeCloseTo(0.01, 14);
    // t=4: b > 0 is allowed, but -0.06 is floored at zero.
    expect(out.forecast[1]).toBe(0);
    expect(out.slope[0]).toBeCloseTo(-0.03, 14);
  });

  it('rejects invalid options', () => {
    expect(() => expandingForecasts(r, x, { minWindow: 2 })).toThrow(RangeError);
    expect(() => expandingForecasts(r, x.slice(1), { minWindow: 3 })).toThrow(RangeError);
  });
});

describe('mean–variance weights and certainty-equivalent gains', () => {
  it('clips r̂ / (γ σ²) at and beyond both bounds', () => {
    // γσ² = 3 × 0.04 = 0.12.
    expect(meanVarianceWeight(0.06, 0.04)).toBeCloseTo(0.5, 14);
    expect(meanVarianceWeight(0, 0.04)).toBe(0);
    expect(meanVarianceWeight(-0.012, 0.04)).toBe(0);
    expect(meanVarianceWeight(0.18, 0.04)).toBeCloseTo(1.5, 14);
    expect(meanVarianceWeight(0.24, 0.04)).toBe(1.5);
    expect(meanVarianceWeight(0.24, 0.04, 2, [-1, 1])).toBe(1);
    expect(meanVarianceWeight(-0.24, 0.04, 2, [-1, 1])).toBe(-1);
    expect(() => meanVarianceWeight(0.1, 0)).toThrow(RangeError);
  });

  it('annualises the difference in mean - (γ/2) var', () => {
    // σ² = 1/3 and γ = 3, so w = forecast: model w = [1, 0, 1.5 (clipped from 2), 1], mean w = 0.5.
    // Model portfolio [0.1, 0, 0.3, 0]: mean 0.1, var 0.02, ū = 0.07.
    // Mean portfolio [0.05, -0.025, 0.1, 0]: mean 0.03125, var 0.00921875 / 3, ū = 0.026640625.
    const r = [0.1, -0.05, 0.2, 0];
    const variance = [1 / 3, 1 / 3, 1 / 3, 1 / 3];
    const args = [r, [1, 0, 2, 1], [0.5, 0.5, 0.5, 0.5], variance] as const;
    expect(certaintyEquivalentGain(...args, { periodsPerYear: 1 })).toBeCloseTo(0.043359375, 14);
    expect(certaintyEquivalentGain(...args, { periodsPerYear: 12 })).toBeCloseTo(0.5203125, 13);
    expect(certaintyEquivalentGain(r, [0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5], variance, { periodsPerYear: 12 }))
      .toBe(0);
  });
});

describe('Goyal–Welch predictors', () => {
  it('builds annual predictors with return-year alignment', async () => {
    const { dates, r, predictors } = goyalWelchPredictors(await loadSeries('goyal-welch-annual'), 'annual');
    expect(dates.length).toBe(100);
    expect([dates[0], dates.at(-1)]).toEqual(['1926-01-01', '2025-01-01']);
    // 1926 source row: Index 13.49, D12 0.69, E12 1.24, 1925 Index 12.46, tbl 0.0307, lty 0.0354,
    // AAA 0.0468, BAA 0.0568, infl -0.01117318 (annual infl is not lagged), CRSP_SPvw 0.1220046, Rfree 0.03289757.
    expect(r[0]).toBeCloseTo(Math.log(1.1220046) - Math.log(1.03289757), 14);
    expect(predictors.dp[0]).toBeCloseTo(Math.log(0.69 / 13.49), 14);
    expect(predictors.dy[0]).toBeCloseTo(Math.log(0.69 / 12.46), 14);
    expect(predictors.ep[0]).toBeCloseTo(Math.log(1.24 / 13.49), 14);
    expect(predictors.de[0]).toBeCloseTo(Math.log(0.69 / 1.24), 14);
    expect(predictors.tms[0]).toBeCloseTo(0.0047, 14);
    expect(predictors.dfy[0]).toBeCloseTo(0.01, 14);
    expect(predictors.infl[0]).toBe(-0.01117318);
    expect(predictors.cay?.[0]).toBeNull();
    expect(predictors.cay?.[dates.indexOf('1965-01-01')]).toBe(-0.00936367);
  });

  it('pins the annual R²_OS of dp from 1965', async () => {
    const { dates, r, predictors } = goyalWelchPredictors(await loadSeries('goyal-welch-annual'), 'annual');
    const x = predictors.dp as number[];
    // 38 pairs (dp 1926 → r 1927, …, dp 1963 → r 1964) before the first forecast of 1965.
    const out = expandingForecasts(r, x, { minWindow: 38 });
    expect(dates[out.index[0]]).toBe('1965-01-01');
    expect(out.index.length).toBe(61);
    // Independent plain-Python OLS on the committed JSON: R²_OS = -3.1074%.
    expect(oosR2(out.actual, out.forecast, out.benchmark)).toBeCloseTo(-0.031073890505585844, 12);
  });

  it('builds monthly predictors with a one-month inflation lag', async () => {
    const { dates, r, predictors } = goyalWelchPredictors(await loadSeries('goyal-welch-monthly'), 'monthly');
    expect(dates.length).toBe(1200);
    expect([dates[0], dates.at(-1)]).toEqual(['1926-01-01', '2025-12-01']);
    // 1926-01 row: infl is the 1925-12 value -0.00555556; ntis starts in 1926-12.
    expect(predictors.infl[0]).toBe(-0.00555556);
    expect(predictors.dy[0]).toBeCloseTo(Math.log(0.6075 / 12.46), 14);
    expect(predictors.ntis[0]).toBeNull();
    expect('cay' in predictors).toBe(false);
    expect(r[0]).toBeCloseTo(Math.log(1 - 0.001783) - Math.log(1.002925), 14);
  });

  it('pins the monthly R²_OS of dp from 1965-01', async () => {
    const { dates, r, predictors } = goyalWelchPredictors(await loadSeries('goyal-welch-monthly'), 'monthly');
    const out = expandingForecasts(r, predictors.dp as number[], { minWindow: 467 });
    expect(dates[out.index[0]]).toBe('1965-01-01');
    expect(out.index.length).toBe(732);
    // Independent plain-Python OLS on the committed JSON: R²_OS = -0.3378%.
    expect(oosR2(out.actual, out.forecast, out.benchmark)).toBeCloseTo(-0.0033784268919425653, 12);
  });

  it('rejects a frequency that does not match the series', async () => {
    const series = await loadSeries('goyal-welch-annual');
    expect(() => goyalWelchPredictors(series as never, 'monthly')).toThrow(RangeError);
  });
});
