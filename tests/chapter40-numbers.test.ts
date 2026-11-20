/**
 * Every number in the prose of chapter 40, recomputed from gsw-zero-coupon and fred-treasury-monthly through the
 * library and the widgets' sample helper. If the data or the library changes, this test fails before the chapter
 * drifts.
 */
import { describe, expect, test } from 'vitest';
import fred from '../src/data/series/fred-treasury-monthly.json';
import gsw from '../src/data/series/gsw-zero-coupon.json';
import { bondView, hindsight, inversions, meanExcessReturn, slopes, treasuryRow, type BondData } from '../src/components/plots/bondSample';
import { holdingReturns, logPrices, parYields, returnDecomposition } from '../src/lib/finance/bonds';

const view = bondView({ 'gsw-zero-coupon': gsw, 'fred-treasury-monthly': fred } as unknown as BondData);
const { curve } = view;
const T = curve.dates.length;
const pct = (v: number, digits = 2) => (v * 100).toFixed(digits);
const row = (month: string) => curve.dates.findIndex((d) => d.startsWith(month));
const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
const parts = (month: string, n: number) => {
  const r = returnDecomposition(curve, `${month}-01`, n)!;
  return [r.yield, r.rollDown, r.shift, r.r, r.rx, r.simple].map((v) => pct(v));
};

describe('chapter 40 prose numbers', () => {
  test('hook: the 2021 loss and the slope of the curve', () => {
    expect(parts('2021-12', 10).at(-1)).toBe('-17.16');
    expect(parts('2021-12', 30).at(-1)).toBe('-42.67');
    expect(pct(curve.y[row('2021-12')][9])).toBe('1.59');
    expect([T, curve.dates[0].slice(0, 7), curve.dates[T - 1].slice(0, 7)]).toEqual([479, '1985-11', '2026-09']);
    const s = slopes(curve.y);
    expect([s.filter((v) => v > 0).length, pct(s.filter((v) => v > 0).length / T, 1), s.filter((v) => v < 0).length]).toEqual([417, '87.1', 62]);
    expect(pct(mean(s))).toBe('1.30');
  });

  test('intuition: the try-this months and the inversion spells', () => {
    expect([pct(curve.y[0][0]), pct(curve.y[0][9])]).toEqual(['7.79', '9.79']);
    expect(pct(curve.y[row('2021-04')][0])).toBe('0.07');
    const s = slopes(curve.y);
    const deepest = s.indexOf(Math.min(...s));
    expect([curve.dates[deepest].slice(0, 7), pct(curve.y[deepest][0]), pct(curve.y[deepest][9]), pct(s[deepest])]).toEqual(['2023-06', '5.38', '3.83', '-1.55']);
    expect(inversions(curve)).toEqual([
      { first: '1989-01', last: '1989-06', months: 6 },
      { first: '1989-08', last: '1989-09', months: 2 },
      { first: '2000-03', last: '2000-12', months: 10 },
      { first: '2006-02', last: '2006-02', months: 1 },
      { first: '2006-06', last: '2007-05', months: 12 },
      { first: '2019-05', last: '2019-05', months: 1 },
      { first: '2019-07', last: '2019-09', months: 3 },
      { first: '2022-07', last: '2024-09', months: 26 },
      { first: '2024-11', last: '2024-11', months: 1 },
    ]);
  });

  test('formalisation: prices, yields and forward rates in 2026-09', () => {
    const t = T - 1;
    expect([pct(curve.y[t][9]), logPrices(curve)[t][9].toFixed(3), Math.exp(-10 * curve.y[t][9]).toFixed(3), Math.exp(-30 * curve.y[t][29]).toFixed(3)]).toEqual(['5.28', '-0.528', '0.590', '0.183']);
    expect([pct(curve.y[t][0]), pct(curve.y[t][1]), pct(view.forwards[t][1])]).toEqual(['4.56', '4.84', '5.12']);
    expect([pct(view.forwards[t][9]), pct(curve.y[t][9]), pct(view.forwards[t][29]), pct(curve.y[t][29])]).toEqual(['5.84', '5.28', '4.90', '5.66']);
    expect(curve.y[t][28]).toBeGreaterThan(curve.y[t][29]);
  });

  test('formalisation: par yields against zero yields and FRED', () => {
    const t = T - 1;
    expect([pct(view.par[t][9]), pct(parYields(curve, 1)[t][9])]).toEqual(['5.31', '5.38']);
    const zeroPar = curve.y.map((y, s) => Math.abs(y[9] - view.par[s][9]));
    expect([pct(mean(zeroPar)), pct(Math.max(...zeroPar))]).toEqual(['0.06', '0.29']);
    const fredGap = curve.dates.flatMap((d, s) => {
      const r = treasuryRow(view.treasury, d);
      return r ? [Math.abs(view.par[s][9] - r[5])] : [];
    });
    expect([fredGap.length, pct(mean(fredGap)), pct(Math.max(...fredGap))]).toEqual([402, '0.15', '0.91']);
  });

  test('formalisation: the Hook bond split into its three parts', () => {
    expect(parts('2021-12', 10)).toEqual(['1.59', '0.41', '-20.82', '-18.82', '-19.24', '-17.16']);
    const [t, s] = [row('2021-12'), row('2022-12')];
    expect([pct(curve.y[t][8]), pct(curve.y[s][8]), pct(curve.y[s][8] - curve.y[t][8], 1), pct(curve.y[t][0])]).toEqual(['1.54', '3.86', '2.3', '0.42']);
  });

  test('formalisation: mean excess returns since 1985 and the help from the shift', () => {
    const buys = holdingReturns(curve, 2);
    expect([buys.length, buys[0].date.slice(0, 7), buys.at(-1)!.date.slice(0, 7)]).toEqual([455, '1985-11', '2025-09']);
    const table = [2, 5, 10, 20, 30].map((n) => {
      const m = meanExcessReturn(curve, n);
      return [m.months, pct(m.mean), pct(m.se), (m.mean / m.se).toFixed(2), pct(m.sd)];
    });
    expect(table).toEqual([
      [455, '0.46', '0.24', '1.93', '1.31'],
      [455, '1.74', '0.71', '2.44', '4.37'],
      [455, '3.04', '1.21', '2.50', '8.24'],
      [455, '3.87', '2.01', '1.92', '14.86'],
      [455, '4.30', '2.71', '1.59', '21.30'],
    ]);
    const tenYear = holdingReturns(curve, 10).map((h) => returnDecomposition(curve, h.date, 10)!);
    expect(['r', 'yield', 'rollDown', 'shift'].map((k) => pct(mean(tenYear.map((p) => p[k as 'r'])))))
      .toEqual(['6.54', '4.81', '0.84', '0.89']);
  });

  test('formalisation: the perfect-foresight yield, in hindsight', () => {
    const ten = hindsight(curve, 10);
    expect([ten.points.length, ten.points[0].date.slice(0, 7), ten.points.at(-1)!.date.slice(0, 7)]).toEqual([306, '1985-11', '2017-09']);
    expect([pct(ten.points[0].y), pct(ten.points[0].perfectForesight)]).toEqual(['9.79', '6.36']);
    const june2007 = ten.points.find((p) => p.date.startsWith('2007-06'))!;
    expect([pct(june2007.y), pct(june2007.perfectForesight)]).toEqual(['5.07', '0.97']);
    expect([pct(ten.meanTermPremium), ten.points.filter((p) => p.termPremium > 0).length]).toEqual(['2.26', 290]);
    const five = hindsight(curve, 5);
    expect([pct(five.meanTermPremium), five.points.filter((p) => p.termPremium > 0).length, five.points.length]).toEqual(['0.92', 308, 385]);
  });

  test('playground: the try-this prompts and the losing years', () => {
    expect(parts('2021-12', 30)).toEqual(['2.06', '0.35', '-58.06', '-55.64', '-56.06', '-42.67']);
    const october2023 = parts('2023-10', 10);
    expect([october2023[0], october2023[1], october2023[2], october2023[3], october2023[5]]).toEqual(['4.96', '0.41', '5.81', '11.17', '11.82']);
    expect([10, 30].map((n) => holdingReturns(curve, n).filter((h) => h.r < 0).length)).toEqual([104, 158]);
  });

  test('check yourself: the forward-rate quiz', () => {
    expect(pct(2 * 0.05 - 0.04, 0)).toBe('6');
  });

  test('widgets: the movie axis holds every curve and every FRED yield shown', () => {
    const shown = [...curve.y, ...view.forwards, ...view.par, ...curve.dates.flatMap((d) => treasuryRow(view.treasury, d) ?? [])].flat();
    expect(Math.min(...shown)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...shown)).toBeLessThanOrEqual(0.12);
  });
});
