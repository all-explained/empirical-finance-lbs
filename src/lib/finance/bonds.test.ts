import { describe, expect, test } from 'vitest';
import fred from '../../data/series/fred-treasury-monthly.json';
import gsw from '../../data/series/gsw-zero-coupon.json';
import { betweenDates, type Series } from '../data/series';
import {
  billBondEquivalent, discountFactor, forwardRates, gswCurve, holdingReturns, logPrices, parYields,
  perfectForesightYield, returnDecomposition, treasuryCurve, type YieldCurve,
} from './bonds';

const GSW = gsw as unknown as Series<'gsw-zero-coupon'>;
const FRED = fred as unknown as Series<'fred-treasury-monthly'>;
const curve = gswCurve(GSW);
const END_2000 = curve.dates.indexOf('2000-12-29');

/** Month-end-like dates from January 2000; `skip` leaves those month numbers (0 = 2000-01) out. */
function monthlyDates(count: number, skip: readonly number[] = []): string[] {
  return Array.from({ length: count }, (_, k) => k)
    .filter((k) => !skip.includes(k))
    .map((k) => `${2000 + Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}-${k % 2 ? 28 : 30}`);
}

/** A curve with the same yields `row` on every date. */
function stillCurve(row: readonly number[], dates: string[]): YieldCurve {
  return { dates, maturities: row.map((_, i) => i + 1), y: dates.map(() => [...row]) };
}

const FLAT = 0.04;
const flatRow = Array.from({ length: 10 }, () => FLAT);
const slopedRow = Array.from({ length: 10 }, (_, i) => 0.02 + 0.003 * (i + 1) - 0.0001 * (i + 1) ** 2);

describe('gswCurve and logPrices', () => {
  test('the committed curve: maturities 1–30 and the yields at the end of 2000', () => {
    expect([curve.dates.length, curve.maturities.length, curve.maturities[29], END_2000 >= 0]).toEqual([479, 30, 30, true]);
    // SVENY01, SVENY10 and SVENY30 on 2000-12-29: 5.4462, 5.3428 and 5.5569 percent.
    [[1, 0.054462], [10, 0.053428], [30, 0.055569]].forEach(([n, y]) => expect(curve.y[END_2000][n - 1]).toBeCloseTo(y, 12));
  });

  test('p^(n) = -n y^(n): the 10-year price on 2000-12-29 is -0.53428', () => {
    const p = logPrices(curve)[END_2000];
    expect(p[9]).toBeCloseTo(-0.53428, 12);
    expect(Math.exp(p[29])).toBeCloseTo(Math.exp(-30 * 0.055569), 12);
  });

  test('rejects a curve whose maturities are not 1, …, N', () => {
    expect(() => logPrices({ dates: ['2000-01-31'], maturities: [1, 3], y: [[0.01, 0.02]] })).toThrow(RangeError);
    expect(() => logPrices({ dates: ['2000-01-31'], maturities: [1, 2], y: [[0.01]] })).toThrow(RangeError);
  });
});

describe('forwardRates', () => {
  test('on a flat curve every forward rate equals the yield', () => {
    forwardRates(stillCurve(flatRow, monthlyDates(1)))[0].forEach((f) => expect(f).toBeCloseTo(FLAT, 15));
  });

  test('y^(n) is the mean of f^(1), …, f^(n) to 1e-14 on the committed data', () => {
    const f = forwardRates(curve);
    let worst = 0;
    curve.y.forEach((row, t) => {
      let sum = 0;
      row.forEach((y, i) => {
        sum += f[t][i];
        worst = Math.max(worst, Math.abs(sum / (i + 1) - y));
      });
    });
    expect(worst).toBeLessThan(1e-14);
  });

  test('pinned at 2000-12-29: f^(1) = 5.4462%, f^(10) = 10 y^(10) - 9 y^(9) = 5.8666%, f^(30) = 5.0958%', () => {
    const f = forwardRates(curve)[END_2000];
    expect(f[0]).toBeCloseTo(0.054462, 12);
    expect(f[9]).toBeCloseTo(0.058666, 12);
    expect(f[29]).toBeCloseTo(0.050958, 12);
  });
});

describe('discountFactor and parYields', () => {
  test('discount factors: exact on the grid, linear in the yield between, flat below one year', () => {
    const row = [0.01, 0.02, 0.04];
    expect(discountFactor(row, 2)).toBeCloseTo(Math.exp(-0.04), 15);
    expect(discountFactor(row, 2.5)).toBeCloseTo(Math.exp(-2.5 * 0.03), 15);
    expect(discountFactor(row, 0.5)).toBeCloseTo(Math.exp(-0.005), 15);
    expect(() => discountFactor(row, 0)).toThrow(RangeError);
    expect(() => discountFactor(row, 3.5)).toThrow(RangeError);
  });

  test('flat curve: the annual par yield is e^y - 1 and the semi-annual one is 2(e^{y/2} - 1)', () => {
    const flat = stillCurve(flatRow, monthlyDates(1));
    parYields(flat, 1)[0].forEach((c) => expect(c).toBeCloseTo(Math.expm1(FLAT), 14));
    parYields(flat, 2)[0].forEach((c) => expect(c).toBeCloseTo(2 * Math.expm1(FLAT / 2), 14));
  });

  test('a par bond priced with the curve’s discount factors is worth 1 to 1e-12, at every date and maturity', () => {
    for (const k of [1, 2] as const) {
      const par = parYields(curve, k);
      let worst = 0;
      curve.y.forEach((row, t) => row.forEach((_, i) => {
        const n = i + 1;
        let price = discountFactor(row, n);
        for (let j = 1; j <= k * n; j++) price += (par[t][i] / k) * discountFactor(row, j / k);
        worst = Math.max(worst, Math.abs(price - 1));
      }));
      expect(worst).toBeLessThan(1e-12);
    }
  });

  test('pinned annual par yields at 2000-12-29: 5.5972%, 5.4433% and 5.6668% at 1, 10 and 30 years', () => {
    const par = parYields(curve, 1)[END_2000];
    expect(par[0]).toBeCloseTo(Math.expm1(0.054462), 14); // one payment: e^{y^(1)} - 1
    expect(par[0]).toBeCloseTo(0.0559723487, 10);
    expect(par[9]).toBeCloseTo(0.0544334787, 10);
    expect(par[29]).toBeCloseTo(0.0566679714, 10);
  });

  // FRED's constant-maturity yields are monthly averages of daily yields; GSW's are the last trading day of the
  // month, so the two differ by the move of the curve within the month as well as by the fitting method.
  // Measured over the 388 months of 1993-10 to 2026-09 on both files: 9.63, 11.31 and 14.13 basis points.
  test('GSW semi-annual par yields against FRED constant-maturity yields, 1993-10 to 2026-09', () => {
    const g = gswCurve(betweenDates(GSW, '1993-10-01', '2026-09-30'));
    const tr = treasuryCurve(betweenDates(FRED, '1993-10-01', '2026-09-30'));
    const par = parYields(g, 2);
    const byMonth = new Map(g.dates.map((date, t) => [date.slice(0, 7), t]));
    const pairs = tr.dates.flatMap((date, i) => {
      const t = byMonth.get(date.slice(0, 7));
      return t === undefined ? [] : [[t, i]];
    });
    expect([tr.dates.length, pairs.length]).toEqual([396, 388]);
    const gap = (n: number) => {
      const column = tr.maturities.indexOf(n);
      return pairs.reduce((sum, [t, i]) => sum + Math.abs(par[t][n - 1] - tr.par[i][column]), 0) / pairs.length;
    };
    [[2, 9.63, 10], [5, 11.31, 12], [10, 14.13, 15]].forEach(([n, measured, bound]) => {
      expect(gap(n) * 1e4).toBeLessThan(bound);
      expect(gap(n) * 1e4).toBeCloseTo(measured, 2);
    });
  });
});

describe('holdingReturns', () => {
  test('on a flat curve that never moves, every one-year return is the yield and every excess return is 0', () => {
    const still = stillCurve(flatRow, monthlyDates(36));
    for (let n = 2; n <= 10; n++) {
      const obs = holdingReturns(still, n);
      expect(obs.length).toBe(24);
      obs.forEach(({ r, rx }) => {
        expect(r).toBeCloseTo(FLAT, 14);
        expect(rx).toBeCloseTo(0, 14);
      });
    }
  });

  test('the sale is twelve calendar months later: nothing across a missing month', () => {
    // Months 0–35 without month 15 (2001-04): purchase month 3 (2000-04) has no sale, and month 15 has no purchase.
    const gappy = stillCurve(slopedRow, monthlyDates(36, [15]));
    const obs = holdingReturns(gappy, 5);
    expect(obs.length).toBe(22);
    expect(obs.map((o) => o.date.slice(0, 7))).not.toContain('2000-04');
    obs.forEach((o) => expect(Number(o.sold.slice(0, 4)) * 12 + Number(o.sold.slice(5, 7)))
      .toBe(Number(o.date.slice(0, 4)) * 12 + Number(o.date.slice(5, 7)) + 12));
  });

  test('on the committed data: 455 observations, and 2000-12-29 to 2001-12-31 by hand', () => {
    const obs = holdingReturns(curve, 10);
    expect(obs.length).toBe(455);
    const o = obs.find((x) => x.date === '2000-12-29');
    // p^(9) on 2001-12-31 minus p^(10) on 2000-12-29; SVENY09 was 5.3850 percent on 2001-12-31.
    expect(o?.sold).toBe('2001-12-31');
    expect(o?.r).toBeCloseTo(0.53428 - 9 * 0.05385, 12);
    expect(o?.rx).toBeCloseTo(0.53428 - 9 * 0.05385 - 0.054462, 12);
    expect(() => holdingReturns(curve, 1)).toThrow(RangeError);
    expect(() => holdingReturns(curve, 31)).toThrow(RangeError);
  });
});

describe('returnDecomposition', () => {
  test('yield + roll-down + shift = r to 1e-14, at every date and maturity, and r matches holdingReturns', () => {
    let worst = 0;
    for (let n = 2; n <= 30; n++) {
      holdingReturns(curve, n).forEach((o) => {
        const parts = returnDecomposition(curve, o.date, n);
        if (!parts) throw new Error('expected a sale month');
        worst = Math.max(worst, Math.abs(parts.yield + parts.rollDown + parts.shift - parts.r), Math.abs(parts.r - o.r));
      });
    }
    expect(worst).toBeLessThan(1e-14);
  });

  test('on a curve that never moves, the return beyond the yield is the roll-down alone', () => {
    // The shift is 0, so r - y^(n) = rollDown, and rx = f^(n) - y^(1): the forward spread is earned exactly.
    const still = stillCurve(slopedRow, monthlyDates(24));
    const f = forwardRates(still)[0];
    for (let n = 2; n <= 10; n++) {
      const parts = returnDecomposition(still, still.dates[0], n);
      expect(parts?.shift).toBeCloseTo(0, 15);
      expect((parts?.r ?? NaN) - slopedRow[n - 1]).toBeCloseTo(parts?.rollDown ?? NaN, 15);
      expect(parts?.rx).toBeCloseTo(f[n - 1] - slopedRow[0], 15);
    }
  });

  test('pinned: the 10-year bond bought on 2000-12-29', () => {
    const parts = returnDecomposition(curve, '2000-12', 10);
    expect(parts?.date).toBe('2000-12-29');
    expect(parts?.yield).toBeCloseTo(0.053428, 12);
    expect(parts?.rollDown).toBeCloseTo(-9 * (0.052846 - 0.053428), 12); // SVENY09 = 5.2846 on 2000-12-29
    expect(parts?.shift).toBeCloseTo(-9 * (0.05385 - 0.052846), 12);
    expect(parts?.r).toBeCloseTo(0.04963, 12);
    expect(parts?.simple).toBeCloseTo(Math.expm1(0.04963), 12);
    expect(parts?.rx).toBeCloseTo(-0.004832, 12);
    expect(returnDecomposition(curve, '2026-09-30', 10)).toBeNull();
    expect(() => returnDecomposition(curve, '1980-01-31', 10)).toThrow(RangeError);
  });
});

describe('perfectForesightYield', () => {
  test('a constant short rate is its own perfect-foresight yield', () => {
    const still = stillCurve(slopedRow, monthlyDates(60));
    const obs = perfectForesightYield(still, 5);
    expect(obs.length).toBe(12); // the last 4 years lack one of the five short rates
    obs.forEach((o) => {
      expect(o.perfectForesight).toBeCloseTo(slopedRow[0], 15);
      expect(o.termPremium).toBeCloseTo(slopedRow[4] - slopedRow[0], 15);
    });
  });

  test('averages the short rates j years later by month, and skips a chain with a missing month', () => {
    // y^(1) = 1%, 2%, 3% in years 0, 1 and 2, with month 14 (2001-03) missing.
    const dates = monthlyDates(36, [14]);
    const y = dates.map((date) => {
      const short = 0.01 * (Number(date.slice(0, 4)) - 1999);
      return [short, 0.05, 0.05];
    });
    const obs = perfectForesightYield({ dates, maturities: [1, 2, 3], y }, 3);
    expect(obs.map((o) => o.date.slice(0, 7))).toEqual(['2000-01', '2000-02', '2000-04', '2000-05', '2000-06', '2000-07',
      '2000-08', '2000-09', '2000-10', '2000-11', '2000-12']);
    obs.forEach((o) => {
      expect(o.perfectForesight).toBeCloseTo(0.02, 15);
      expect(o.termPremium).toBeCloseTo(0.03, 15);
    });
  });
});

describe('Treasury constant-maturity yields', () => {
  test('billBondEquivalent: 5% discount, 91 days is 365 × 0.05 / (360 − 4.55) = 5.1343%', () => {
    expect(billBondEquivalent(0.05, 91)).toBeCloseTo(18.25 / 355.45, 15);
    expect(billBondEquivalent(0.05, 91)).toBeCloseTo(0.051343, 6);
    expect(billBondEquivalent(0, 91)).toBe(0);
    expect(() => billBondEquivalent(0.05, 200)).toThrow(RangeError);
    expect(() => billBondEquivalent(4, 91)).toThrow(RangeError);
  });

  test('treasuryCurve: December 2000, and the gap from 1987-01 to 1993-09 kept as it is', () => {
    const tr = treasuryCurve(FRED);
    expect(tr.maturities).toEqual([1, 2, 3, 5, 7, 10, 20, 30]);
    const t = tr.dates.indexOf('2000-12-01');
    [0.056, 0.0535, 0.0526, 0.0517, 0.0528, 0.0524, 0.0564, 0.0549].forEach((v, i) => expect(tr.par[t][i]).toBeCloseTo(v, 14));
    expect(tr.bill[t]).toBeCloseTo((365 * 0.0577) / (360 - 0.0577 * 91), 14); // TB3MS = 5.77
    const gap = tr.dates.indexOf('1986-12-01');
    expect([tr.dates.length, tr.dates[gap + 1]]).toEqual([515, '1993-10-01']);
  });
});
