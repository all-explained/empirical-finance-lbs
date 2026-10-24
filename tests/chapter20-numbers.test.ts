/**
 * Every number in the prose of chapter 20, recomputed from mom-monthly, ff3-monthly, ff25-size-bm-monthly and
 * ff6-size-mom-monthly through the library and the widgets' sample helper. If the data or the library changes,
 * this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff3Json from '../src/data/series/ff3-monthly.json';
import ff25Json from '../src/data/series/ff25-size-bm-monthly.json';
import sixJson from '../src/data/series/ff6-size-mom-monthly.json';
import sixBmJson from '../src/data/series/ff6-size-bm-monthly.json';
import momJson from '../src/data/series/mom-monthly.json';
import type { Series } from '../src/lib/data/series';
import { formationReturn } from '../src/lib/finance/factors';
import { growthPath } from '../src/lib/finance/returns';
import { BEAR_LOOKBACK, crashView, momentumAlpha, momentumSample, moments, sliceSample, sortView } from '../src/components/plots/factorModelSample';

const ff3 = ff3Json as unknown as Series<'ff3-monthly'>;
const mom = momJson as unknown as Series<'mom-monthly'>;
const ff25 = ff25Json as unknown as Series<'ff25-size-bm-monthly'>;
const six = sixJson as unknown as Series<'ff6-size-mom-monthly'>;
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const s = momentumSample(ff3, mom);
const all = moments(s.mom);
const market = moments(s.market);
const calm = sliceSample(s, '1945-01-01', '2008-12-31');
const { crashes, regression } = crashView(s, 10, BEAR_LOOKBACK);
const c = regression.coefficients;
const t = regression.tStats;
const crash = (date: string) => crashes.find((k) => k.date === date)!;
const fitted = (k: { market: number }) => c.alpha0 + c.alphaB + (c.beta0 + c.betaB) * k.market;
const alpha = momentumAlpha({ ff3, mom, ff25 }, '1927-01-01');

describe('chapter 20 prose numbers', () => {
  test('hook: the sample, the means, the Sharpe ratios and the alpha', () => {
    expect([s.dates[0].slice(0, 7), s.dates.at(-1)!.slice(0, 7), s.dates.length]).toEqual(['1927-01', '2026-08', 1196]);
    expect([percent(all.mean, 2), percent(all.volatility, 1)]).toEqual(['7.35', '16.3']);
    expect([percent(market.mean, 2), percent(market.volatility, 1)]).toEqual(['8.31', '18.4']);
    expect([fixed(all.sharpe, 2), fixed(market.sharpe, 2)]).toEqual(['0.45', '0.45']);
    expect(alpha.beta[0]).toBeLessThan(0);
    expect(alpha.beta[2]).toBeLessThan(0);
    expect([percent(alpha.alpha, 1), fixed(alpha.alphaT, 2)]).toEqual(['11.2', '7.77']);
    expect([crashes[0].date, percent(crashes[0].mom, 1), percent(crashes[0].market, 1)]).toEqual(['1932-08-01', '-52.6', '37.1']);
    const gfc = crash('2009-04-01');
    expect([percent(gfc.mom, 1), percent(gfc.market, 1)]).toEqual(['-34.4', '10.2']);
  });

  test('intuition: growth of a dollar, skewness and the calm sample', () => {
    // CompoundingPath with momentum from 1927: market = Mkt-RF + RF, momentum = RF + Mom.
    const end = (r: number[]) => growthPath(r.map((v, i) => v + s.rf[i]), 'simple').at(-1)!;
    expect([Math.round(end(s.market)), Math.round(end(s.mom))]).toEqual([17985, 8231]);
    // The two summer months of 1932 together take away more than half of the momentum dollar.
    expect((1 + crash('1932-07-01').mom) * (1 + crash('1932-08-01').mom)).toBeLessThan(0.5);
    expect([fixed(market.skewness, 2), fixed(all.skewness, 2)]).toEqual(['0.15', '-3.02']);
    const m = moments(calm.mom);
    expect([calm.dates.length, fixed(m.sharpe, 2), fixed(m.skewness, 2)]).toEqual([768, '0.82', '-0.60']);
    expect(percent(moments(sliceSample(s, '2009-01-01').mom).mean, 2)).toBe('-0.84');
  });

  test('formalisation: the signal, the 2×3 sort and the FF3 alpha', () => {
    // 2% in months t-12 … t-2, then −5% in month t−1: the signal ignores the last month.
    const returns = [...Array(11).fill(0.02), -0.05];
    expect(percent(formationReturn(returns, 12), 1)).toBe('24.3');
    const view = sortView('size-momentum', { 'ff3-monthly': ff3, 'mom-monthly': mom, 'ff6-size-mom-monthly': six });
    const leg = Object.fromEntries(view.legs.map((l) => [l.name, percent(l.mean, 1)]));
    expect([leg.SW, leg.SL, leg.BW, leg.BL]).toEqual(['18.8', '10.0', '14.6', '8.7']);
    const umd = view.factors[0];
    expect(percent(umd.mean.rebuilt, 2)).toBe('7.35');
    expect([Math.round(umd.growth.rebuilt.at(-1)!), Math.round(umd.growth.published.at(-1)!)]).toEqual([8239, 8231]);
    expect([percent(umd.gap.value, 2), umd.gap.date]).toEqual(['0.10', '2026-08-01']);
    expect(alpha.beta.map((b) => fixed(b, 2))).toEqual(['-0.22', '-0.06', '-0.46']);
    const predicted = all.mean - alpha.alpha;
    expect(percent(predicted, 2)).toBe('-3.89');
    expect(alpha.alpha).toBeCloseTo(all.mean - predicted, 12);
    expect([fixed(alpha.alphaTWhite, 2), percent(alpha.r2, 0)]).toEqual(['8.13', '23']);
    const late = momentumAlpha({ ff3, mom, ff25 }, '1963-07-01');
    expect([late.first, percent(late.alpha, 2), fixed(late.alphaT, 2)]).toEqual(['1963-07', '9.80', '5.47']);
  });

  test('formalisation: the bear-market regression', () => {
    expect([regression.bear.length, regression.bear.reduce((a, b) => a + b, 0)]).toEqual([1172, 275]);
    expect(s.dates[BEAR_LOOKBACK].slice(0, 7)).toBe('1929-01');
    expect([fixed(c.beta0, 2), fixed(t.beta0, 2), fixed(c.betaB, 2), fixed(t.betaB, 2)]).toEqual(['0.04', '1.18', '-0.69', '-6.84']);
    expect(fixed(c.beta0 + c.betaB, 2)).toBe('-0.64');
    expect([percent(c.alpha0, 2), fixed(t.alpha0, 2), percent(c.alphaB, 2), fixed(t.alphaB, 2)]).toEqual(['0.78', '7.05', '-0.40', '-1.19']);
    expect(percent(fitted(crash('2009-04-01')), 1)).toBe('-6.2');
    expect(percent(fitted(crash('1932-08-01')), 1)).toBe('-23.5');
  });

  test('playground: the ten worst months and their bear markets', () => {
    const gfc = crash('2009-04-01');
    const dotcom = crash('2001-01-01');
    expect([gfc.bear, crash('1932-08-01').bear, dotcom.bear]).toEqual([1, 1, 1]);
    expect(gfc.pastMarket!).toBeLessThan(0);
    expect([percent(dotcom.pastMarket!, 1), percent(dotcom.market, 1)]).toEqual(['-0.1', '3.3']);
    expect(crashes.every((k) => k.bear === 1)).toBe(true);
    expect(275 / 1172).toBeLessThan(0.25);
    expect(s.dates.length).toBe(1196);
  });

  test('quiz: alpha from the mean, and the rally after a bear market', () => {
    expect(fixed(7.35 - -3.89, 2)).toBe('11.24');
    expect(fixed(0.78 - 0.40 + (0.04 - 0.69) * 20, 2)).toBe('-12.62');
  });
});

// Not a prose number: FactorBuilder's size-value form (for chapter 19) rebuilds SMB and HML of ff3-monthly to rounding.
test('sortView size-value matches the published SMB and HML', () => {
  const view = sortView('size-value', { 'ff3-monthly': ff3, 'ff6-size-bm-monthly': sixBmJson as unknown as Series<'ff6-size-bm-monthly'> });
  expect(view.factors.map((f) => f.name)).toEqual(['SMB', 'HML']);
  for (const f of view.factors) expect(f.gap.value).toBeLessThan(0.001);
});
