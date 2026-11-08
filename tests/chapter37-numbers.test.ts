/**
 * Every number in the prose of chapter 37, recomputed from the habit library on seeded simulations and from
 * goyal-welch-annual (with chapter 35's samples) through the library and the widgets' sample helpers.
 * If the data or the library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import consumption from '../src/data/series/fred-consumption-annual.json';
import cay from '../src/data/series/fred-cay-quarterly.json';
import ff3 from '../src/data/series/ff3-monthly.json';
import goyalWelchAnnual from '../src/data/series/goyal-welch-annual.json';
import goyalWelchMonthly from '../src/data/series/goyal-welch-monthly.json';
import type { Series } from '../src/lib/data/series';
import { impliedRiskFree, impliedTimeDiscount } from '../src/lib/finance/consumptionPuzzle';
import {
  campbellCochraneParameters as P, habitClaimReturns, habitMarginalUtility, habitRiskFree, localCurvature, maxSurplus,
  sensitivity, simulateHabit,
} from '../src/lib/finance/habit';
import { predictiveRegression } from '../src/lib/finance/predictive';
import { arithmeticMean, sampleVariance } from '../src/lib/finance/returns';
import { sharpeRatio } from '../src/lib/stats/moments';
import { halfLife } from '../src/lib/stats/var';
import {
  HABIT_SEED, TABLE1_PHI_ANNUAL, habitModel, habitPredictiveSample, habitView, priceDividendSample, table1Solution,
} from '../src/components/plots/habitSample';
import { dataSample } from '../src/components/plots/predictiveSample';
import { DEFAULT_DELTA, powerUtilityPath, puzzleViews, type PuzzleData } from '../src/components/plots/puzzleSample';
import { marketSharpe, SAMPLE_STARTS } from '../src/components/plots/sdfSamples';

const pct = (v: number, digits: number) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const sd = (values: number[]) => Math.sqrt(sampleVariance(values));

const puzzle = puzzleViews({
  'fred-consumption-annual': consumption, 'goyal-welch-annual': goyalWelchAnnual,
  'fred-cay-quarterly': cay, 'goyal-welch-monthly': goyalWelchMonthly,
} as unknown as PuzzleData).annual;
const market = marketSharpe(ff3 as unknown as Series<'ff3-monthly'>, SAMPLE_STARTS[0]);
const lowest = powerUtilityPath(puzzle.moments.mean.dc, puzzle.moments.sd.dc, market.sharpe).lowest!;
const pd = priceDividendSample(dataSample(goyalWelchAnnual as unknown as Series<'goyal-welch-annual'>, 'dp'));

const table1 = habitModel(P.gamma, TABLE1_PHI_ANNUAL);
const sBar = Math.log(table1.steady);
const century = habitView(table1, HABIT_SEED);
const trough = century.path.S.indexOf(Math.min(...century.path.S));
// 5,000 seeded years, monthly, summed to years as in Table 2 (pdf p. 20).
const long = habitClaimReturns(simulateHabit(HABIT_SEED, P, { periods: 60_000 }), table1Solution(), { annual: true });
const model = habitPredictiveSample(HABIT_SEED);
const annualRate = (perMonth: number) => 12 * perMonth;

describe('chapter 37 prose numbers', () => {
  test('hook: the numbers of chapters 35 and 9', () => {
    expect(fixed(market.sharpe, 2)).toBe('0.45');
    expect(fixed(lowest.gamma, 1)).toBe('20.0');
    expect(pct(impliedRiskFree(DEFAULT_DELTA, lowest.gamma, puzzle.moments.mean.dc, puzzle.moments.sd.dc), 1)).toBe('28.2');
    expect(pct(puzzle.moments.mean.rf, 2)).toBe('0.24');
    expect(pct(predictiveRegression(pd.r, pd.dp, 10).r2, 1)).toBe('11.8');
  });

  test('intuition: the surplus, internal against external habits, Table 1', () => {
    expect([pct(1 - table1.steady, 1), pct(table1.steady, 1)]).toEqual(['94.3', '5.7']);
    // A 1% fall in C with X fixed takes 0.01 C from a surplus of S̄ C.
    expect(pct(0.01 / table1.steady, 1)).toBe('17.5');
    const path = simulateHabit(HABIT_SEED, P, { periods: 1200 });
    const range = (h: number) => {
      const { internal, external } = habitMarginalUtility(path, { h });
      const ratio = internal.map((v, i) => v / external[i]);
      return [fixed(Math.min(...ratio), 2), fixed(Math.max(...ratio), 2)];
    };
    expect(range(0.5)).toEqual(['0.49', '0.52']);
    expect(range(0.8)).toEqual(['0.11', '0.29']);
    expect([pct(annualRate(P.mean), 2), pct(P.sd * Math.sqrt(12), 2), fixed(P.gamma, 0)]).toEqual(['1.89', '1.50', '2']);
    expect(fixed(table1.steady, 3)).toBe('0.057');
  });

  test('intuition: the widget at its defaults, and at γ = 4', () => {
    expect(fixed(century.years[trough], 1)).toBe('56.5');
    expect(fixed(century.path.S[trough], 3)).toBe('0.019');
    expect(fixed(localCurvature(century.path.S[trough], P.gamma), 1)).toBe('106.8');
    expect([fixed(century.pcYears[trough], 1), fixed(century.meanPc, 1)]).toEqual(['26.3', '35.8']);
    const steep = habitModel(4, TABLE1_PHI_ANNUAL);
    expect([fixed(steep.steady, 3), fixed(localCurvature(steep.steady, 4), 1)]).toEqual(['0.081', '49.6']);
    expect(fixed(habitView(steep, HABIT_SEED).meanPc, 1)).toBe('27.8');
  });

  test('formalisation: curvature, persistence, the price of risk and the rate', () => {
    expect(fixed(localCurvature(table1.steady, P.gamma), 1)).toBe('35.1');
    expect(fixed(TABLE1_PHI_ANNUAL, 2)).toBe('0.87');
    expect(fixed(halfLife(TABLE1_PHI_ANNUAL), 1)).toBe('5.0');
    // Eq. (7): γσ_c(1 + Λ(s̄)) a month, times √12; power utility drops Λ.
    expect(fixed(P.gamma * P.sd * (1 + sensitivity(sBar, P)) * Math.sqrt(12), 2)).toBe('0.53');
    expect(fixed(P.gamma * P.sd * Math.sqrt(12), 2)).toBe('0.03');
    expect([fixed(maxSurplus(P), 2), fixed(table1.max, 3)]).toEqual(['-2.37', '0.094']);
    const evaluate = (s: number) => fixed(table1.solution.evaluate(s) / 12, 1);
    expect([evaluate(maxSurplus(P)), evaluate(sBar), evaluate(Math.log(0.01))]).toEqual(['41.6', '34.1', '24.0']);
  });

  test('formalisation: the answer to chapter 35', () => {
    expect(fixed(Math.exp(arithmeticMean(long.pc)), 1)).toBe('35.1');
    expect(long.pc.length).toBe(5000);
    expect([fixed(DEFAULT_DELTA, 2), fixed(P.delta ** 12, 3)]).toEqual(['0.99', '0.896']);
    expect(pct(annualRate(habitRiskFree(P)), 2)).toBe('0.94');
    expect(fixed(sharpeRatio(long.re), 2)).toBe('0.47');
    expect(fixed(impliedTimeDiscount(puzzle.moments.mean.rf, puzzle.gamma.fromSharpe, puzzle.moments.mean.dc, puzzle.moments.sd.dc), 3)).toBe('1.245');
    // The three terms of eq. (12), a year.
    const terms = [-annualRate(Math.log(P.delta)), annualRate(P.gamma * P.mean), annualRate((P.gamma * (1 - P.phi)) / 2)];
    expect([pct(terms[0], 1), pct(terms[1], 2), pct(terms[2], 2)]).toEqual(['11.0', '3.78', '13.85']);
    expect(pct(terms[0] + terms[1] - terms[2], 2)).toBe('0.94');
    expect([pct(arithmeticMean(long.re), 2), pct(sd(long.re), 1)]).toEqual(['3.85', '8.2']);
  });

  test('playground: data and model regressions, and the long-run slopes', () => {
    const one = { data: predictiveRegression(pd.r, pd.dp, 1), model: predictiveRegression(model.r, model.dp, 1) };
    expect([fixed(one.data.slope, 3), fixed(one.data.tStat, 2)]).toEqual(['-0.042', '-0.94']);
    expect([fixed(one.model.slope, 3), fixed(one.model.tStat, 2), pct(one.model.r2, 1)]).toEqual(['-0.233', '-3.35', '10.2']);
    expect(pct(predictiveRegression(model.r, model.dp, 10).r2, 1)).toBe('41.4');
    const slopes = [1, 2, 3, 5, 7].map((k) => fixed(10 * predictiveRegression(long.re, long.pc, k).slope, 1));
    expect(slopes).toEqual(['-1.6', '-3.0', '-4.1', '-5.9', '-7.3']);
    expect([fixed(sd(long.pc), 2), fixed(sd(pd.dp), 2)]).toEqual(['0.13', '0.50']);
  });

  test('quiz: local curvature', () => {
    expect([fixed(localCurvature(0.057, 2), 0), fixed(localCurvature(0.02, 2), 0)]).toEqual(['35', '100']);
  });
});
