/**
 * Every number in the prose of chapter 13, recomputed from goyal-welch-annual and
 * goyal-welch-monthly through the library and the widget's sample helper. If the data or
 * the library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import gwa from '../src/data/series/goyal-welch-annual.json';
import gwm from '../src/data/series/goyal-welch-monthly.json';
import type { Series } from '../src/lib/data/series';
import { ols } from '../src/lib/stats/ols';
import { PREDICTORS, predictorRun, predictorsFromSeries, race, type Restrictions } from '../src/components/plots/oosSample';

const annual = predictorsFromSeries(gwa as unknown as Series<'goyal-welch-annual'>);
const monthly = predictorsFromSeries(gwm as unknown as Series<'goyal-welch-monthly'>);
const none: Restrictions = { slope: false, floor: false };
const both: Restrictions = { slope: true, floor: true };
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const dpRun = predictorRun(annual, 'dp', 'annual', none);
const dp1965 = race(dpRun, 1965, 'annual');
const gainAt = (year: number) => dp1965.gain[dp1965.x.indexOf(year)];
const winners = (restrictions: Restrictions) => PREDICTORS
  .filter((p) => race(predictorRun(annual, p.key, 'annual', restrictions), 1965, 'annual').r2 > 0)
  .map((p) => p.key);

describe('chapter 13 prose numbers', () => {
  test('hook: the in-sample regression of chapter 9 and the real-time race', () => {
    const fit = ols(annual.r.slice(1), [annual.predictors.dp.slice(0, -1) as number[]]);
    expect([annual.dates[0].slice(0, 4), annual.dates.at(-1)!.slice(0, 4)]).toEqual(['1926', '2025']);
    expect([fixed(fit.coefficients[1], 3), percent(fit.r2, 1)]).toEqual(['0.042', '1.2']);
    expect([dp1965.x.length, dp1965.first.slice(0, 4), dp1965.last.slice(0, 4)]).toEqual([61, '1965', '2025']);
    expect(percent(dp1965.r2, 1)).toBe('-3.1');
    expect(PREDICTORS.length).toBe(12);
    expect(winners(none)).toEqual([]);
  });

  test('intuition: the shape of the dp line', () => {
    expect(fixed(gainAt(1975), 3)).toBe('0.094');
    expect(fixed(gainAt(1994), 3)).toBe('0.096');
    expect(gainAt(1997)).toBeGreaterThan(0);
    expect(gainAt(1998)).toBeLessThan(0);
    expect(fixed(dp1965.gain.at(-1)!, 3)).toBe('-0.052');
    const i = dpRun.dates.findIndex((d) => d.startsWith('1996'));
    expect([percent(dpRun.forecast[i], 1), percent(dpRun.benchmark[i], 1)]).toEqual(['-2.7', '6.0']);
  });

  test('formalisation: the running score, Clark–West and the restrictions', () => {
    // The mean's sum of squared errors: CSED at the last date over R²_OS.
    expect(fixed(dp1965.gain.at(-1)! / dp1965.r2, 2)).toBe('1.68');
    expect([fixed(dp1965.clarkWest.statistic, 2), fixed(dp1965.clarkWest.pValue, 2)]).toEqual(['0.72', '0.23']);
    const dy1947 = race(predictorRun(annual, 'dy', 'annual', none), 1947, 'annual');
    expect([percent(dy1947.r2, 1), fixed(dy1947.clarkWest.statistic, 2), fixed(dy1947.clarkWest.pValue, 3)])
      .toEqual(['-17.1', '1.31', '0.095']);
    const from1965 = dpRun.dates.findIndex((d) => d.startsWith('1965'));
    expect(dpRun.forecast.slice(from1965).filter((f) => f < 0).length).toBe(14);
    expect(percent(race(predictorRun(annual, 'dp', 'annual', both), 1965, 'annual').r2, 1)).toBe('-1.0');
    expect(winners(both)).toEqual(['tbl', 'lty', 'svar']);
    expect(percent(dp1965.ceGain, 2)).toBe('-0.50');
  });

  test('playground: lty on monthly data with both restrictions', () => {
    const lty = race(predictorRun(monthly, 'lty', 'monthly', both), 1965, 'monthly');
    expect(lty.x.length).toBe(732);
    expect([percent(lty.r2, 2), fixed(lty.clarkWest.statistic, 2), fixed(lty.clarkWest.pValue, 3), percent(lty.ceGain, 2)])
      .toEqual(['0.41', '1.82', '0.035', '0.20']);
  });
});
