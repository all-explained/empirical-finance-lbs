/**
 * Every number in the prose of chapter 23 that comes from our data, recomputed from ff3-monthly,
 * mom-monthly, ff3-daily and mom-daily through the library and the widgets' sample helper.
 * If the data or the library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import mom from '../src/data/series/mom-monthly.json';
import ff3Daily from '../src/data/series/ff3-daily.json';
import momDaily from '../src/data/series/mom-daily.json';
import { capmAlpha, lambdaNeeded, quarterBetas, rollingView, SAMPLE, TRADING_DAYS, type ShortWindowData } from '../src/components/plots/shortWindowSample';
import { getColumn } from '../src/lib/data/series';
import { arithmeticMean, sampleVariance } from '../src/lib/finance/returns';
import { alphaBound, dailyFactorPanel, shortWindowRegressions } from '../src/lib/finance/shortWindow';

const data = { ff3, mom, ff3Daily, momDaily } as unknown as ShortWindowData;
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const hml = { q: quarterBetas(data, 'HML'), c: capmAlpha(data, 'HML') };
const mo = { q: quarterBetas(data, 'Mom'), c: capmAlpha(data, 'Mom') };

describe('chapter 23 prose numbers', () => {
  test('hook: unconditional CAPM alphas and betas, 1964-01 to 2026-06', () => {
    expect([SAMPLE.first, SAMPLE.last, hml.c.months, mo.c.months]).toEqual(['1964-01', '2026-06', 750, 750]);
    expect([percent(hml.c.alpha, 2), percent(hml.c.alphaSE, 2), fixed(hml.c.beta, 2)]).toEqual(['4.56', '1.29', '-0.14']);
    expect([percent(mo.c.alpha, 2), percent(mo.c.alphaSE, 2), fixed(mo.c.beta, 2)]).toEqual(['8.53', '1.83', '-0.16']);
    expect(Math.floor(750 / 12)).toBe(62);
    expect([percent(hml.c.alpha, 1), percent(mo.c.alpha, 1)]).toEqual(['4.6', '8.5']);
  });

  test('intuition: quarter lengths, rolling and quarterly betas, the first bound', () => {
    const panel = dailyFactorPanel(data.ff3Daily, data.momDaily, { start: SAMPLE.start, end: SAMPLE.end });
    const windows = shortWindowRegressions(panel.dates, panel.HML, panel['Mkt-RF'], { period: 'quarter', minObs: 40, lags: true });
    expect(Math.round(arithmeticMean(windows.map((w) => w.nobs)))).toBe(63);
    expect([fixed(rollingView(data, 'HML', 12).sigmaBeta, 2), fixed(rollingView(data, 'HML', 120).sigmaBeta, 2)]).toEqual(['0.31', '0.19']);
    const lo = Math.min(...mo.q.beta);
    const hi = Math.max(...mo.q.beta);
    expect([fixed(lo, 2), mo.q.period[mo.q.beta.indexOf(lo)], fixed(hi, 2), mo.q.period[mo.q.beta.indexOf(hi)]]).toEqual(['-1.97', '2009-Q2', '1.46', '1966-Q2']);
    expect(fixed(mo.q.sigmaBeta, 2)).toBe('0.54');
    expect(Math.round(-lo)).toBe(2);
    expect([fixed(hml.q.sigmaBeta, 1), fixed(mo.q.sigmaBeta, 1)]).toEqual(['0.3', '0.5']);
    expect(0.005 * 12).toBeCloseTo(0.06, 12);
    expect(percent(alphaBound(Number(fixed(hml.q.sigmaBeta, 2)), 0.06), 1)).toBe('1.9');
  });

  test('formalisation: squared Sharpe ratio, beta noise, implied beta volatility, conditional alphas', () => {
    const from = data.ff3.rows.findIndex(([date]) => date === SAMPLE.start);
    const market = getColumn(data.ff3, 'Mkt-RF').slice(from, from + 750).map((v) => (v as number) / 100);
    // λ̄²/σ²_M: the market's squared monthly Sharpe ratio.
    expect(fixed(arithmeticMean(market) ** 2 / sampleVariance(market), 3)).toBe('0.018');
    expect(0.005 ** 2).toBeCloseTo(0.000025, 15);
    expect([fixed(hml.q.meanBetaSE, 2), fixed(mo.q.meanBetaSE, 2)]).toEqual(['0.14', '0.17']);
    expect([fixed(hml.q.sigmaBeta, 2), fixed(hml.q.sigmaBetaTrue, 2)]).toEqual(['0.31', '0.27']);
    expect([fixed(mo.q.sigmaBeta, 2), fixed(mo.q.sigmaBetaTrue, 2)]).toEqual(['0.54', '0.51']);
    expect(TRADING_DAYS).toBe(21);
    expect([hml.q.period.length, mo.q.period.length]).toEqual([250, 250]);
    expect([percent(hml.q.alpha, 2), fixed(hml.q.alphaT, 2)]).toEqual(['3.89', '2.72']);
    expect([percent(mo.q.alpha, 2), fixed(mo.q.alphaT, 2)]).toEqual(['10.10', '6.18']);
  });

  test('playground: the bound at 6% a year, the premium it needs, and the two-sigma band', () => {
    const bound = { hml: alphaBound(hml.q.sigmaBeta, 0.06), mom: alphaBound(mo.q.sigmaBeta, 0.06) };
    expect([percent(bound.hml, 2), percent(bound.mom, 2)]).toEqual(['1.88', '3.27']);
    expect([percent(bound.hml / hml.c.alpha, 0), percent(bound.mom / mo.c.alpha, 0)]).toEqual(['41', '38']);
    expect([percent(lambdaNeeded(hml.c.alpha, hml.q.sigmaBeta), 1), percent(lambdaNeeded(mo.c.alpha, mo.q.sigmaBeta), 1)]).toEqual(['14.6', '15.7']);
    expect(percent(hml.c.premium, 2)).toBe('7.16');
    expect([percent(hml.c.premium - 2 * 0.15, 0), percent(hml.c.premium + 2 * 0.15, 0)]).toEqual(['-23', '37']);
  });

  test('quiz: the bound for given standard deviations, and the Mom conditional alpha', () => {
    expect(percent(alphaBound(0.4, 0.04), 1)).toBe('1.6');
    expect([hml.q.period.length, percent(mo.q.alpha, 1), fixed(mo.q.alphaT, 2)]).toEqual([250, '10.1', '6.18']);
  });
});
