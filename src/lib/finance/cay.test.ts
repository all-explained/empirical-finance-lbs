import { describe, expect, it } from 'vitest';
import { betweenDates, loadSeries, type Series } from '../data/series';
import { cayInputs, fullSampleCay, quarterlyExcessReturns, realTimeCay } from './cay';

const cay = await loadSeries('fred-cay-quarterly');
const inputs = cayInputs(cay);

describe('cayInputs', () => {
  it('builds 1952-Q1 by hand from the raw cells, with wealth from 1951-Q4', () => {
    // fred-cay-quarterly rows 1951-10-01 and 1952-01-01 (docs/DATA.md column order).
    const c = Math.log(((94.762 / 17.285 + 87.431 / 8.467) * 100 * 1e9) / (155976 * 1e3));
    const a = Math.log((1280607 * 1e6 * 100) / 13.548 / (155344 * 1e3));
    const y = Math.log(((196.097 + 11.392 - 6.944) * 1e9 * 100) / 13.606 / (155976 * 1e3));
    expect(inputs.dates[0]).toBe('1952-01-01');
    expect(inputs.c[0]).toBeCloseTo(c, 12);
    expect(inputs.a[0]).toBeCloseTo(a, 12);
    expect(inputs.y[0]).toBeCloseTo(y, 12);
    expect([inputs.c.length, inputs.a.length, inputs.y.length]).toEqual([298, 298, 298]);
  });
});

describe('fullSampleCay', () => {
  it('pins the sample quarters and the weights on the committed data (8 leads and lags)', () => {
    // Reference: numpy least squares on the same regressors, 2026-10-23 extract.
    const fit = fullSampleCay(inputs);
    expect(fit.dates[0]).toBe('1952-01-01');
    expect(fit.dates.at(-1)).toBe('2026-04-01');
    expect(fit.sample).toEqual({ start: '1954-04-01', end: '2024-04-01' });
    expect(fit.alpha).toBeCloseTo(0.6026963116, 8);
    expect(fit.omega).toBeCloseTo(-0.0278946062, 8);
    expect(fit.betaY).toBeCloseTo(0.9764710490, 8);
    expect(fit.cay.at(-1)).toBeCloseTo(-0.0017053788, 8);
    expect(fit.standardErrors.every((se) => se > 0)).toBe(true);
  });

  it("is close to Lettau–Ludvigson's 0.31 and 0.59 (eq. 12) on their 1952-Q4–1998-Q3 sample", () => {
    // numpy on this window gives omega 0.39340366 and betaY 0.60503854.
    const fit = fullSampleCay(cayInputs(betweenDates(cay, '1952-07-01', '1998-07-01')));
    expect(fit.dates[0]).toBe('1952-10-01');
    expect(fit.omega).toBeCloseTo(0.39340366, 6);
    expect(fit.betaY).toBeCloseTo(0.60503854, 6);
    expect(Math.abs(fit.omega - 0.31)).toBeLessThan(0.1);
    expect(Math.abs(fit.betaY - 0.59)).toBeLessThan(0.05);
  });
});

describe('realTimeCay', () => {
  it('starts after a 62-quarter window and ends at the full-sample value', () => {
    const full = fullSampleCay(inputs);
    const realTime = realTimeCay(inputs);
    expect(realTime.dates[0]).toBe(inputs.dates[61]);
    expect(realTime.dates[0]).toBe('1967-04-01');
    expect(realTime.dates.at(-1)).toBe('2026-04-01');
    expect(realTime.cay).toHaveLength(237);
    expect(realTime.cay.at(-1)).toBeCloseTo(full.cay.at(-1)!, 10);
    expect(realTime.omega.at(-1)).toBeCloseTo(full.omega, 10);
    expect(realTime.betaY.at(-1)).toBeCloseTo(full.betaY, 10);
  });
});

describe('quarterlyExcessReturns', () => {
  it('sums three monthly log excess returns for 2025-Q4, by hand', async () => {
    const goyal = await loadSeries('goyal-welch-monthly');
    // goyal-welch-monthly rows 2025-10/11/12: CRSP_SPvw 0.023013, 0.002286, 0.000834; Rfree 0.0037, 0.003, 0.0034.
    const hand = Math.log(1.023013) + Math.log(1.002286) + Math.log(1.000834)
      - Math.log(1.0037) - Math.log(1.003) - Math.log(1.0034);
    expect(hand).toBeCloseTo(0.0157863242, 9);
    const { dates, r } = quarterlyExcessReturns(goyal);
    expect(dates.at(-1)).toBe('2025-10-01');
    expect(r.at(-1)).toBeCloseTo(hand, 12);
    expect(dates[0]).toBe('1926-01-01');
    expect(dates).toHaveLength(400);
    // Same date labels as fred-cay-quarterly, so cay[t] pairs with the return dated t + 1.
    expect(dates).toContain(inputs.dates[0]);
  });

  it('drops a quarter with a missing month', () => {
    const series = {
      columns: [{ name: 'date' }, { name: 'CRSP_SPvw' }, { name: 'Rfree' }],
      rows: [
        ['2000-01-01', 0.01, 0], ['2000-02-01', 0.02, 0], ['2000-03-01', 0.03, 0],
        ['2000-04-01', 0.01, 0], ['2000-05-01', null, 0], ['2000-06-01', 0.01, 0],
      ],
    } as unknown as Series<'goyal-welch-monthly'>;
    const { dates, r } = quarterlyExcessReturns(series);
    expect(dates).toEqual(['2000-01-01']);
    expect(r[0]).toBeCloseTo(Math.log(1.01 * 1.02 * 1.03), 12);
  });
});
