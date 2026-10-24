/**
 * Every number in the prose of chapter 14, recomputed from fred-cay-quarterly, goyal-welch-annual and
 * goyal-welch-monthly through the library and the widgets' sample helpers. If the data or the library
 * changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import fred from '../src/data/series/fred-cay-quarterly.json';
import gwa from '../src/data/series/goyal-welch-annual.json';
import gwm from '../src/data/series/goyal-welch-monthly.json';
import { betweenDates, type Series } from '../src/lib/data/series';
import { cayInputs, fullSampleCay, quarterlyExcessReturns } from '../src/lib/finance/cay';
import { fitAR1, predictiveRegression } from '../src/lib/finance/predictive';
import { sampleVariance } from '../src/lib/finance/returns';
import { DEFAULT_PAIR_SEED, lookAhead, lookAheadData, pairCombination, pairSample } from '../src/components/plots/caySample';
import { dataSample } from '../src/components/plots/predictiveSample';

const cay = fred as unknown as Series<'fred-cay-quarterly'>;
const annual = gwa as unknown as Series<'goyal-welch-annual'>;
const monthly = gwm as unknown as Series<'goyal-welch-monthly'>;
const fixed = (v: number, digits: number) => v.toFixed(digits);
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);

// Quarterly: cay at t (from weights on the given window) against the log excess return of quarter t + 1.
const returns = quarterlyExcessReturns(monthly);
const returnAt = new Map(returns.dates.map((d, i) => [d, returns.r[i]]));
const quarterly = (start: string, end: string) => {
  const fit = fullSampleCay(cayInputs(betweenDates(cay, start, end)));
  const dates = fit.dates.filter((d) => returnAt.has(d));
  const x = dates.map((d) => fit.cay[fit.dates.indexOf(d)]);
  return { fit, dates, x, reg: predictiveRegression(dates.map((d) => returnAt.get(d)!), x, 1) };
};
const llWindow = quarterly('1952-07-01', '1998-07-01');
const allData = quarterly('1951-10-01', '2026-04-01');

describe('chapter 14 prose numbers', () => {
  test('hook: one quarter ahead, on the paper sample and on all our data (1952-Q1 to 2026-Q2)', () => {
    const dp = dataSample(annual);
    expect(percent(predictiveRegression(dp.r, dp.dp, 1).r2, 1)).toBe('1.2'); // chapter 9's one-year R²
    expect([llWindow.dates[0], llWindow.dates.at(-1)]).toEqual(['1952-10-01', '1998-07-01']);
    expect([percent(llWindow.reg.r2, 1), fixed(llWindow.reg.tStat, 2)]).toEqual(['7.6', '3.96']);
    expect([allData.fit.dates[0], allData.fit.dates.at(-1)]).toEqual(['1952-01-01', '2026-04-01']);
    expect([allData.dates[0], allData.dates.at(-1)]).toEqual(['1952-01-01', '2025-10-01']);
    expect([percent(allData.reg.r2, 2), fixed(allData.reg.tStat, 2)]).toEqual(['0.07', '0.38']);
  });

  test('intuition: the cointegration demo at its default seed', () => {
    expect(DEFAULT_PAIR_SEED).toBe(2);
    const pair = pairSample(DEFAULT_PAIR_SEED);
    const at = (theta: number) => fixed(pairCombination(pair, theta).persistence, 3);
    expect([at(0), at(0.6), at(1.2)]).toEqual(['0.980', '0.492', '0.979']);
    expect(Math.abs(pair.estimate - 0.6)).toBeLessThan(0.01);
    // "Press New draw a few times": on the slider grid, the lowest persistence stays near 0.6.
    for (let seed = DEFAULT_PAIR_SEED; seed < DEFAULT_PAIR_SEED + 5; seed++) {
      const draw = pairSample(seed);
      const grid = Array.from({ length: 25 }, (_, i) => i * 0.05);
      const best = grid.reduce((a, b) => (pairCombination(draw, b).persistence < pairCombination(draw, a).persistence ? b : a));
      expect(Math.abs(best - 0.6)).toBeLessThanOrEqual(0.1);
      expect(Math.abs(draw.estimate - 0.6)).toBeLessThan(0.05);
    }
  });

  test('formalisation: dynamic OLS weights θ_n and θ_y', () => {
    // The library calls θ_n (on log asset wealth n_t) omega and θ_y (on log labour income y_t) betaY.
    const ll = llWindow.fit;
    expect(ll.dates[0]).toBe('1952-10-01');
    expect([fixed(ll.omega, 2), fixed(ll.standardErrors[0], 3), fixed(ll.betaY, 2), fixed(ll.standardErrors[1], 3)])
      .toEqual(['0.39', '0.034', '0.61', '0.032']);
    const all = allData.fit;
    expect([all.dates[0], all.dates.at(-1)]).toEqual(['1952-01-01', '2026-04-01']);
    expect([fixed(all.omega, 2), fixed(all.standardErrors[0], 3), fixed(all.betaY, 2), fixed(all.standardErrors[1], 3)])
      .toEqual(['-0.03', '0.053', '0.98', '0.058']);
  });

  test('formalisation: size of the quarterly slope and persistence of the annual series', () => {
    const sd = Math.sqrt(sampleVariance(llWindow.fit.cay));
    expect([fixed(llWindow.reg.slope, 2), fixed(sd, 3), percent(llWindow.reg.slope * sd, 1)]).toEqual(['1.14', '0.019', '2.2']);
    const c = dataSample(annual, 'cay');
    const dp = dataSample(annual);
    const from = dp.years.indexOf(c.years[0]);
    expect([c.years[0], c.years.at(-1)]).toEqual([1945, 2025]);
    expect([fixed(c.phi, 2), fixed(fitAR1(dp.dp.slice(from)).phi, 2)]).toEqual(['0.73', '0.95']);
  });

  test('formalisation: the PredictiveRegression widget with the published annual cay', () => {
    const c = dataSample(annual, 'cay');
    const one = predictiveRegression(c.r, c.dp, 1);
    const three = predictiveRegression(c.r, c.dp, 3);
    expect([fixed(one.slope, 3), fixed(one.tStat, 2), percent(one.r2, 1)]).toEqual(['0.418', '0.69', '0.8']);
    expect([fixed(three.slope, 3), fixed(three.tStat, 2), percent(three.r2, 1)]).toEqual(['1.464', '1.15', '4.0']);
    const low = Math.min(...c.dp);
    expect([c.years[c.dp.indexOf(low)], fixed(low, 3)]).toEqual([2020, '-0.137']);
    expect(fixed(-low / Math.sqrt(sampleVariance(c.dp)), 1)).toBe('3.9'); // "almost four standard deviations"
    const to1998 = c.years.indexOf(1998) + 1;
    const r = c.r.slice(0, to1998);
    const x = c.dp.slice(0, to1998);
    const a = predictiveRegression(r, x, 1);
    const b = predictiveRegression(r, x, 3);
    expect([percent(a.r2, 1), fixed(a.tStat, 2), percent(b.r2, 1), fixed(b.tStat, 2)]).toEqual(['9.8', '2.18', '37.7', '4.85']);
  });

  test('playground: full-sample against real-time weights', () => {
    const data = lookAheadData(cay, monthly);
    expect([data.realTime.dates[0], cayInputs(cay).dates[0]]).toEqual(['1967-04-01', '1952-01-01']);
    expect(cayInputs(cay).dates.indexOf('1967-04-01') + 1).toBe(62); // first window: 62 quarters
    const ll = lookAhead(data, '1998-07-01');
    expect(ll.realFit.nobs).toBe(125);
    expect([fixed(ll.fullFit.slope, 2), fixed(ll.fullFit.tStat, 2), percent(ll.fullFit.r2, 1)]).toEqual(['0.90', '2.99', '5.8']);
    expect([fixed(ll.realFit.slope, 2), fixed(ll.realFit.tStat, 2), percent(ll.realFit.r2, 1)]).toEqual(['0.35', '1.05', '0.9']);
    // The wealth weight θ_n in the CayLookAhead readout.
    const weights = (['1998-07-01', '2019-10-01', '2026-04-01'] as const).map((end) => fixed(lookAhead(data, end).omega, 2));
    expect(weights).toEqual(['0.39', '0.09', '-0.03']);
    const all = lookAhead(data, '2026-04-01');
    expect([fixed(all.fullFit.slope, 2), fixed(all.fullFit.tStat, 2)]).toEqual(['0.01', '0.09']);
  });
});
