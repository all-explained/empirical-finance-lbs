/**
 * Every number in the prose of chapter 27, recomputed from ff25-size-bm-monthly, ff3-monthly and
 * fred-cay-quarterly and from the seeded simulations, through the widgets' helper. Numbers quoted from
 * Gospodinov, Kan & Robotti (2019) and Kleibergen & Zhan (2020) are cited in the prose with their pages and are
 * not recomputed here.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import ff25 from '../src/data/series/ff25-size-bm-monthly.json';
import cay from '../src/data/series/fred-cay-quarterly.json';
import type { Series } from '../src/lib/data/series';
import { quarterlyPanel } from '../src/lib/finance/conditional';
import { farConfidenceSet, rankTest } from '../src/lib/finance/identification';
import {
  consumptionSets, DC_GRID, monthlySample, START, USELESS_SAMPLES, USELESS_SEED, uselessView, WEAK, WEAK_SEED, weakWorld,
  type IdentificationData,
} from '../src/components/plots/identificationSample';

const data: IdentificationData = {
  ff3: ff3 as unknown as Series<'ff3-monthly'>,
  ff25: ff25 as unknown as Series<'ff25-size-bm-monthly'>,
  cay: cay as unknown as Series<'fred-cay-quarterly'>,
};
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const sample = monthlySample(data);
const full = consumptionSets(data);
const ll = consumptionSets(data, 'll');
// 200 two-pass draws on 758 months take about 3 s, so the simulation tests get a longer timeout.
const SLOW = 60_000;

describe('chapter 27 prose numbers', () => {
  test('hook and intuition: useless factors on the monthly 25 portfolios', () => {
    expect([sample.first, sample.last, sample.excess.length]).toEqual(['1963-07', '2026-08', 758]);
    expect([USELESS_SAMPLES, USELESS_SEED]).toEqual([200, 1]);
    const useless = uselessView(sample, 0, USELESS_SEED);
    expect([percent(useless.rejectFM, 1), percent(useless.rejectShanken, 1)]).toEqual(['28.0', '7.5']);
    expect([fixed(useless.medianR2, 3), fixed(sample.capmR2, 3)]).toEqual(['0.070', '0.078']);
    expect(percent(useless.beatCapm, 1)).toBe('46.5');
    expect(fixed(Math.max(...useless.sim.r2), 3)).toBe('0.625');
  }, SLOW);

  test('try this: strength 0.25', () => {
    const real = uselessView(sample, 0.25, USELESS_SEED);
    expect([real.rejectFM, real.rejectShanken]).toEqual([0, 0]);
    expect(fixed(real.medianR2, 3)).toBe('0.009');
  }, SLOW);

  test('formalisation: the rank test and the empty market set', () => {
    expect([full.first, full.last, full.quarters]).toEqual(['1963-Q3', '2026-Q2', 252]);
    expect([full.rank.df1, full.rank.df2, fixed(full.rank.statistic, 2), fixed(full.rank.pValue, 3)]).toEqual([24, 227, '1.61', '0.039']);
    const panel = quarterlyPanel(data, { start: START });
    const market = panel.factors.map(([m]) => m);
    const marketRank = rankTest(panel.excess, market);
    expect([fixed(marketRank.statistic, 2), marketRank.pValue.toExponential(1)]).toEqual(['9.27', '1.8e-22']);
    expect(farConfidenceSet(panel.excess, market, { grid: DC_GRID, q: 0.05 }).empty).toBe(true);
  });

  test('playground: coverage in the weak-identification world', () => {
    expect([WEAK.N, WEAK.lambda, WEAK.samples]).toEqual([10, 1, 600]);
    const cover = (spread: number) => {
      const w = weakWorld(spread, WEAK_SEED);
      return [w.coverage.famaMacBeth, w.coverage.shanken, w.coverage.far, w.far.filter((f) => f.unbounded).length / WEAK.samples]
        .map((v) => percent(v, 1));
    };
    expect(cover(1).slice(0, 3)).toEqual(['90.2', '93.2', '94.7']);
    expect(cover(0.25)).toEqual(['38.3', '41.0', '94.7', '86.8']);
    expect(cover(0)).toEqual(['22.2', '23.5', '94.7', '97.7']);
  }, SLOW);

  test('what our data show: consumption growth, 1963-Q3 to 2026-Q2', () => {
    const { wald, far95, far99 } = full;
    expect(percent(wald.lambda, 2)).toBe('0.89');
    expect([percent(wald.famaMacBeth.lower, 2), percent(wald.famaMacBeth.upper, 2)]).toEqual(['0.14', '1.63']);
    expect([percent(wald.shanken.lower, 2), percent(wald.shanken.upper, 2)]).toEqual(['-0.14', '1.91']);
    expect(far95.unbounded).toBe(false);
    expect(far95.intervals.map(([lo, hi]) => [percent(lo, 1), percent(hi, 1)])).toEqual([['0.6', '43.2']]);
    const [[lo, hi]] = far95.intervals;
    expect(fixed((hi - lo) / (wald.famaMacBeth.upper - wald.famaMacBeth.lower), 0)).toBe('29');
    expect(full.rank.pValue > 0.01 && full.rank.pValue < 0.05).toBe(true);
    expect(far99.unbounded).toBe(true);
    expect(far99.intervals.map(([a, b]) => [a, b].map((v) => percent(v, 1)))).toEqual([['-100.0', '-8.6'], ['0.5', '100.0']]);
  });

  test("what our data show: Lettau and Ludvigson's window", () => {
    expect([ll.first, ll.last, ll.quarters]).toEqual(['1963-Q3', '1998-Q3', 141]);
    expect(fixed(ll.rank.pValue, 3)).toBe('0.120');
    expect(ll.far95.unbounded).toBe(true);
    expect(ll.far95.intervals.map(([a, b]) => [a, b].map((v) => percent(v, 1)))).toEqual([['-100.0', '-0.6'], ['0.7', '100.0']]);
  });
});
