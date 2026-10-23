/**
 * Every number in the prose of chapter 10, recomputed from goyal-welch-annual through the
 * library and the widgets' sample helpers. If the data or the library changes, this test
 * fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import gw from '../src/data/series/goyal-welch-annual.json';
import type { Series } from '../src/lib/data/series';
import { linearisationConstants, presentValueSlopes } from '../src/lib/finance/presentValue';
import { logLinearRows, presentValueData, sampleData, sharesAt } from '../src/components/plots/presentValueSample';

const full = presentValueData(gw as unknown as Series<'goyal-welch-annual'>);
const postwar = sampleData(full, 'postwar');
const at = (year: number) => full.years.indexOf(year);
const ratio = (year: number) => Math.exp(full.pd[at(year)]).toFixed(1);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const worst = (error: number[], years: number[]) => {
  const abs = error.map(Math.abs);
  const i = abs.indexOf(Math.max(...abs));
  return [percent(abs[i], 1), years[i]];
};
const slopes = (d: typeof full) => presentValueSlopes(d.dp, d.r, d.dd, linearisationConstants(d.meanPd).rho);
const shares = (d: typeof full, k: number) => {
  const s = sharesAt(d, k);
  return [percent(s.returns, 0), percent(s.dividends, 0), percent(s.future, 0)];
};

describe('chapter 10 prose numbers', () => {
  test('hook: price–dividend ratios since 1872', () => {
    expect([full.years[0], full.years.at(-1)]).toEqual([1872, 2025]);
    expect([ratio(2025), fixed(Math.exp(full.pd[at(2025)]), 0)]).toEqual(['86.7', '87']); // "87 times dividends"
    expect(fixed(Math.exp(full.meanPd), 1)).toBe('26.4');
    expect([ratio(1999), ratio(1917)]).toEqual(['88.0', '9.9']);
    const sorted = [...full.pd].sort((a, b) => b - a);
    expect([sorted[0], sorted[1], sorted.at(-1)]).toEqual([full.pd[at(1999)], full.pd[at(2025)], full.pd[at(1917)]]);
  });

  test('linearisation constants and error at the mean', () => {
    const rows = logLinearRows(full, 0);
    expect(rows.years[0]).toBe(1873);
    expect([fixed(rows.rho, 3), fixed(Math.exp(full.meanPd) / (1 + Math.exp(full.meanPd)), 3), fixed(rows.kappa, 3)]).toEqual(['0.964', '0.964', '0.157']);
    expect(fixed(Math.exp(full.meanPd) + 1, 1)).toBe('27.4');
    expect(percent(rows.error.reduce((s, v) => s + Math.abs(v), 0) / rows.error.length, 2)).toBe('0.39');
    expect(worst(rows.error, rows.years)).toEqual(['2.4', 1917]);
    expect(Math.min(...rows.error)).toBeGreaterThanOrEqual(0); // the tangent never lies above the curve
  });

  test('moving the expansion point', () => {
    const low = logLinearRows(full, -1);
    const high = logLinearRows(full, 1);
    expect([fixed(Math.exp(low.point), 1), ...worst(low.error, low.years)]).toEqual(['9.7', '11.9', 1999]);
    expect([fixed(Math.exp(high.point), 1), ...worst(high.error, high.years)]).toEqual(['71.8', '5.6', 1917]);
  });

  test('one-year and long-run slopes', () => {
    const s = slopes(full);
    expect([s.nobs, full.years.at(-2)]).toEqual([153, 2024]);
    expect([fixed(s.br, 3), fixed(s.bd, 3), fixed(s.phi, 2), fixed(s.gap, 3)]).toEqual(['0.024', '-0.088', '0.92', '0.003']);
    expect([fixed(s.brLongRun, 2), fixed(s.bdLongRun, 2)]).toEqual(['0.21', '-0.76']);
    const p = slopes(postwar);
    expect(postwar.years[0]).toBe(1946);
    expect([fixed(p.brLongRun, 2), fixed(p.bdLongRun, 2)]).toEqual(['1.11', '0.10']);
  });

  test('variance shares in the playground', () => {
    expect(percent(sharesAt(full, 1).future, 0)).toBe('89');
    expect(shares(full, 15)).toEqual(['25', '41', '31']);
    expect(shares(postwar, 15)).toEqual(['74', '6', '19']);
    const s20 = sharesAt(full, 20);
    expect([percent(s20.returns + s20.dividends + s20.future, 0), percent(s20.future, 0), fixed(s20.rho ** 20, 2)]).toEqual(['97', '27', '0.48']);
  });
});
