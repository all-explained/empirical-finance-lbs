/**
 * Every number in the prose of chapter 19, recomputed from ff25-size-bm-monthly, ff3-monthly, ff5-monthly and
 * ff6-size-bm-monthly through the library and the widgets' sample helper. If the data or the library changes,
 * this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import ff5 from '../src/data/series/ff5-monthly.json';
import ff25 from '../src/data/series/ff25-size-bm-monthly.json';
import ff6 from '../src/data/series/ff6-size-bm-monthly.json';
import type { Series } from '../src/lib/data/series';
import { modelPanel } from '../src/lib/finance/factors';
import { arithmeticMean } from '../src/lib/finance/returns';
import { annualiseMean, meanStandardError } from '../src/lib/stats/moments';
import { sortView } from '../src/components/plots/factorModelSample';
import { GRID_START, gridView } from '../src/components/plots/sizeValueSample';

const data = {
  ff3: ff3 as unknown as Series<'ff3-monthly'>,
  ff5: ff5 as unknown as Series<'ff5-monthly'>,
  ff25: ff25 as unknown as Series<'ff25-size-bm-monthly'>,
};
const sorts = sortView('size-value', { 'ff3-monthly': data.ff3, 'ff6-size-bm-monthly': ff6 as unknown as Series<'ff6-size-bm-monthly'> });
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const scientific = (p: number) => p.toExponential(1);
const capm = gridView(data, 'capm');
const ff = gridView(data, 'ff3');
const five = gridView(data, 'ff5');
const SG = capm.names.indexOf('ME1-BM1');
const SV = capm.names.indexOf('ME1-BM5');
const BG = capm.names.indexOf('ME5-BM1');
const BV = capm.names.indexOf('ME5-BM5');
const meanAbs = (v: typeof capm) => v.alpha.reduce((sum, a) => sum + Math.abs(a), 0) / v.N;
const significant = (v: typeof capm) => v.alphaT.filter((t) => Math.abs(t) > 1.96).length;
const average = (js: number[]) => js.reduce((sum, j) => sum + capm.mean[j], 0) / js.length;
const range5 = [0, 1, 2, 3, 4];

describe('chapter 19 prose numbers', () => {
  test('hook: small growth against small value from 1963-07', () => {
    expect([capm.first, capm.last, capm.T]).toEqual(['1963-07', '2026-08', 758]);
    expect([fixed(capm.beta[SG][0], 2), percent(capm.mean[SG], 2)]).toEqual(['1.42', '3.96']);
    expect([fixed(capm.beta[SV][0], 2), percent(capm.mean[SV], 2)]).toEqual(['1.06', '13.37']);
    expect(percent(capm.mean[SV] - capm.mean[SG], 2)).toBe('9.41');
  });

  test('intuition: the grid, the two spreads and the CAPM alphas', () => {
    expect([percent(capm.mean[BG], 2), percent(capm.mean[BV], 2)]).toEqual(['7.38', '9.57']);
    // Value spread: value column minus growth column, averaged over the five size rows; size spread likewise.
    const value = average(range5.map((r) => r * 5 + 4)) - average(range5.map((r) => r * 5));
    const size = average(range5) - average(range5.map((c) => 20 + c));
    expect([percent(value, 2), percent(size, 2)]).toEqual(['4.94', '1.98']);
    expect([percent(capm.alpha[SG], 2), percent(capm.alpha[SV], 2)]).toEqual(['-6.28', '5.69']);
    const betas = capm.beta.map((b) => b[0]);
    expect([fixed(Math.min(...betas), 2), fixed(Math.max(...betas), 2)]).toEqual(['0.86', '1.42']);
  });

  test('formalisation: factor means, FF3 loadings and fit', () => {
    const panel = modelPanel(data, data.ff25, { start: GRID_START, model: 'ff3' });
    const factor = (k: number) => panel.factors.map((row) => row[k]);
    const meanT = (v: number[]) => [percent(annualiseMean(arithmeticMean(v)), 2), fixed(arithmeticMean(v) / meanStandardError(v), 2)];
    expect(meanT(factor(1))).toEqual(['1.77', '1.35']);
    expect(meanT(factor(2))).toEqual(['3.53', '2.72']);
    expect(ff.factorNames).toEqual(['Mkt-RF', 'SMB', 'HML']);
    expect(ff.beta[SV].map((b) => fixed(b, 2))).toEqual(['0.95', '1.10', '0.69']);
    expect(ff.beta[SG].map((b) => fixed(b, 2))).toEqual(['1.11', '1.40', '-0.26']);
    expect([percent(meanAbs(capm), 2), percent(meanAbs(ff), 2)]).toEqual(['2.36', '1.04']);
    expect([percent(ff.alpha[SV], 2), percent(ff.alpha[SG], 2), fixed(ff.alphaT[SG], 2)]).toEqual(['2.16', '-5.58', '-5.06']);
    expect(significant(ff)).toBe(6);
    expect([fixed(ff.grs.statistic, 2), scientific(ff.grs.pValue)]).toEqual(['3.64', '8.3e-9']);
  });

  test('formalisation: FF5', () => {
    expect(five.factorNames).toEqual(['Mkt-RF', 'SMB', 'HML', 'RMW', 'CMA']);
    expect([percent(five.alpha[SG], 2), fixed(five.alphaT[SG], 2), fixed(five.beta[SG][3], 2)]).toEqual(['-3.30', '-3.23', '-0.50']);
    expect(percent(meanAbs(five), 2)).toBe('1.05');
    expect(significant(five)).toBe(7);
    expect([fixed(five.grs.statistic, 2), scientific(five.grs.pValue)]).toEqual(['3.23', '2.6e-7']);
  });

  test('playground: rebuilt HML and the sample', () => {
    const [smb, hml] = sorts.factors;
    expect([smb.name, hml.name]).toEqual(['SMB', 'HML']);
    expect([sorts.dates[0].slice(0, 7), sorts.dates.at(-1)!.slice(0, 7), sorts.dates.length]).toEqual(['1926-07', '2026-08', 1202]);
    // The widget's readout shows the gap with two decimals.
    expect([(hml.gap.value * 100).toFixed(2), (smb.gap.value * 100).toFixed(2)]).toEqual(['0.01', '0.01']);
    const window = (start: string, end = '9999-12-31') => hml.rebuilt.filter((_, t) => sorts.dates[t] >= start && sorts.dates[t] <= end);
    const mean = (v: number[]) => percent(annualiseMean(arithmeticMean(v)), 2);
    const t = (v: number[]) => fixed(arithmeticMean(v) / meanStandardError(v), 2);
    expect(mean(window('1926-07-01', '1963-06-30'))).toBe('5.40');
    expect(mean(window('1963-07-01', '1990-12-31'))).toBe('5.10');
    const recent = window('1991-01-01');
    expect([mean(recent), t(recent)]).toEqual(['2.32', '1.23']);
    const since2007 = window('2007-01-01');
    expect([mean(since2007), t(since2007), since2007.length]).toEqual(['-1.30', '-0.50', 236]);
    expect([fixed(ff.critical5, 2), fixed(five.critical5, 2)]).toEqual(['1.52', '1.52']);
  });
});
