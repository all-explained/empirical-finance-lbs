import { describe, expect, test } from 'vitest';
import gsw from '../../data/series/gsw-zero-coupon.json';
import type { Series } from '../data/series';
import { normalRng } from '../math/rng';
import { ols } from '../stats/ols';
import { gswCurve } from './bonds';
import {
  cpInputs, defaultRanges, singleFactorLoadings, subsampleTents, tentFactor, yieldFactorForecasts, type CPInputs,
} from './bondRiskPremia';

const curve = gswCurve(gsw as unknown as Series<'gsw-zero-coupon'>);
const FULL = cpInputs(curve, defaultRanges[0]);

// A tent like Cochrane and Piazzesi's Table 1A (p. 143), with the constant in decimals.
const TENT = [-0.0324, -2.14, 0.81, 3.0, 0.8, -2.08];
// Loadings that average to 1, close to their Table 1B.
const LOADINGS = [0.47, 0.87, 1.24, 1.42];

/**
 * Seeded inputs whose excess returns are exact functions of the forward rates plus noise: rx^(n) = b^(n) ϑ'𝐟_t + 0.002 z.
 * Each forward is a common level plus its own shock, so the five regressors are far from collinear.
 */
function simulated(T = 600, seed = 11): CPInputs {
  const z = normalRng(seed);
  const forwards = Array.from({ length: T }, () => {
    const level = 0.05 + 0.02 * z();
    return [1, ...[0, 1, 2, 3, 4].map((j) => level + 0.002 * j + 0.01 * z())];
  });
  const rx = forwards.map((f) => {
    const x = f.reduce((sum, v, j) => sum + v * TENT[j], 0);
    return LOADINGS.map((b) => b * x + 0.002 * z());
  });
  const dates = forwards.map((_, t) => `${2000 + Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}-28`);
  return { dates, forwards, rx, rxAvg: rx.map((r) => r.reduce((sum, v) => sum + v, 0) / 4) };
}

describe('cpInputs', () => {
  test('the committed curve: 455 months from 1985-11 to 2025-09, and the row of 2000-12-29', () => {
    expect([FULL.dates.length, FULL.dates[0], FULL.dates.at(-1)]).toEqual([455, '1985-11-29', '2025-09-30']);
    const t = FULL.dates.indexOf('2000-12-29');
    // SVENY01–05 on 2000-12-29: 5.4462, 5.1458, 5.0326, 5.0145, 5.0442; on 2001-12-31: 2.0841, 3.0627, 3.7433, 4.2103.
    // f^(n) = n y^(n) - (n - 1) y^(n-1), and rx^(n) = -(n - 1) y^(n-1)_{t+1} + n y^(n)_t - y^(1)_t.
    const f = [1, 0.054462, 2 * 0.051458 - 0.054462, 3 * 0.050326 - 2 * 0.051458, 4 * 0.050145 - 3 * 0.050326,
      5 * 0.050442 - 4 * 0.050145];
    f.forEach((v, j) => expect(FULL.forwards[t][j]).toBeCloseTo(v, 14));
    const rx = [-0.020841 + 2 * 0.051458, -2 * 0.030627 + 3 * 0.050326, -3 * 0.037433 + 4 * 0.050145,
      -4 * 0.042103 + 5 * 0.050442].map((r) => r - 0.054462);
    rx.forEach((v, i) => expect(FULL.rx[t][i]).toBeCloseTo(v, 14));
    expect(FULL.rxAvg[t]).toBeCloseTo((0.027613 + 0.035262 + 0.033819 + 0.029336) / 4, 14);
  });

  test('a month whose sale month is missing is left out; ranges are inclusive months', () => {
    // GSW has no 1991-03, so t = 1990-03 has no one-year return.
    const inputs = cpInputs(curve, { first: '1990-01', last: '1990-06' });
    expect(inputs.dates).toEqual(['1990-01-31', '1990-02-28', '1990-04-30', '1990-05-31', '1990-06-29']);
  });

  test('rejects malformed ranges and short curves', () => {
    expect(() => cpInputs(curve, { first: '1990-1', last: '1990-06' })).toThrow(RangeError);
    expect(() => cpInputs(curve, { first: '1991-01', last: '1990-06' })).toThrow(RangeError);
    const short = { dates: curve.dates, maturities: [1, 2, 3, 4], y: curve.y.map((row) => row.slice(0, 4)) };
    expect(() => cpInputs(short, defaultRanges[0])).toThrow(RangeError);
  });
});

describe('tentFactor', () => {
  test('seeded data: recovers the tent within 0.02 (constant within 0.002), and cp_t = ϑ\'𝐟_t', () => {
    const inputs = simulated();
    const tent = tentFactor(inputs);
    TENT.forEach((w, j) => expect(Math.abs(tent.weights[j] - w)).toBeLessThan(j === 0 ? 0.002 : 0.02));
    inputs.forwards.forEach((f, t) => {
      expect(tent.cp[t]).toBeCloseTo(f.reduce((sum, v, j) => sum + v * tent.weights[j], 0), 14);
    });
    expect(tent.nobs).toBe(600);
  });

  test('Hansen–Hodrick with 12 lags by default, Newey–West with 18 as the option; the weights do not change', () => {
    const columns = [1, 2, 3, 4, 5].map((j) => FULL.forwards.map((f) => f[j]));
    const hh = ols(FULL.rxAvg, columns, { errors: 'hansen-hodrick', lags: 12 });
    const nw = ols(FULL.rxAvg, columns, { errors: 'newey-west', lags: 18 });
    expect(tentFactor(FULL).standardErrors).toEqual(hh.standardErrors);
    expect(tentFactor(FULL, { errors: 'newey-west' }).standardErrors).toEqual(nw.standardErrors);
    expect(tentFactor(FULL, { errors: 'newey-west', lags: 6 }).weights).toEqual(hh.coefficients);
  });

  test('the committed curve, 1985-11 to 2025-09: Hansen–Hodrick standard errors (an independent numpy run agrees)', () => {
    const se = tentFactor(FULL).standardErrors;
    [1.533, 1.409, 8.595, 22.808, 26.382, 11.096].forEach((v, j) => expect(j === 0 ? 100 * se[0] : se[j]).toBeCloseTo(v, 2));
  });
});

describe('singleFactorLoadings', () => {
  test('seeded data: recovers b^(n) within 0.02; restricted and unrestricted R² within 0.01', () => {
    const inputs = simulated();
    const loadings = singleFactorLoadings(inputs, tentFactor(inputs).weights);
    expect(loadings.map(({ n }) => n)).toEqual([2, 3, 4, 5]);
    loadings.forEach(({ b, r2, unrestrictedR2, restricted }, i) => {
      expect(Math.abs(b - LOADINGS[i])).toBeLessThan(0.02);
      expect(Math.abs(r2 - unrestrictedR2)).toBeLessThan(0.01);
      expect(unrestrictedR2).toBeGreaterThanOrEqual(r2);
      restricted.forEach((v, j) => expect(Math.abs(v - LOADINGS[i] * TENT[j])).toBeLessThan(0.05));
    });
  });

  test('the loadings average to 1 to 1e-12 on every default range of the committed curve', () => {
    for (const range of defaultRanges) {
      const inputs = cpInputs(curve, range);
      const loadings = singleFactorLoadings(inputs, tentFactor(inputs).weights);
      expect(Math.abs(loadings.reduce((sum, { b }) => sum + b, 0) / 4 - 1)).toBeLessThan(1e-12);
    }
  });

  test('restricted R² is centred: 1 - SSE / Σ(rx - mean)², not the uncentred R² of a fit without intercept', () => {
    const { weights, cp } = tentFactor(FULL);
    const [two] = singleFactorLoadings(FULL, weights);
    const rx = FULL.rx.map((r) => r[0]);
    const fit = ols(rx, [cp], { intercept: false });
    const mean = rx.reduce((sum, v) => sum + v, 0) / rx.length;
    const sse = fit.residuals.reduce((sum, e) => sum + e * e, 0);
    expect(two.r2).toBeCloseTo(1 - sse / rx.reduce((sum, v) => sum + (v - mean) ** 2, 0), 14);
    expect(two.r2).toBeLessThan(fit.r2);
    expect(() => singleFactorLoadings(FULL, weights.slice(1))).toThrow(RangeError);
  });
});

describe('yieldFactorForecasts', () => {
  const forecasts = yieldFactorForecasts(FULL, curve);

  test('five components give the tent\'s R² to 1e-10; both sets of shares sum to 1', () => {
    expect(Math.abs(forecasts.r2.all - tentFactor(FULL).r2)).toBeLessThan(1e-10);
    expect(Math.abs(forecasts.varianceShares.reduce((sum, v) => sum + v, 0) - 1)).toBeLessThan(1e-12);
    expect(Math.abs(forecasts.factorShares.reduce((sum, v) => sum + v, 0) - 1)).toBeLessThan(1e-10);
    expect(forecasts.factorShareFirstThree).toBeCloseTo(forecasts.factorShares.slice(0, 3).reduce((s, v) => s + v, 0), 14);
  });

  test('the committed curve, 1985-11 to 2025-09: shares and R² (an independent numpy run agrees)', () => {
    // Percent of the variance of yields: 98.8174, 1.1566, 0.0255, 0.0005 and 0.0000.
    [98.8174, 1.1566, 0.0255, 0.0005].forEach((v, k) => expect(100 * forecasts.varianceShares[k]).toBeCloseTo(v, 3));
    const { level, levelSlope, levelSlopeCurvature, all } = forecasts.r2;
    [[level, 0.0422], [levelSlope, 0.1028], [levelSlopeCurvature, 0.1335], [all, 0.1349]].forEach(([v, ref]) => {
      expect(v).toBeCloseTo(ref, 3);
    });
    [31.31, 44.85, 22.79, 0.1, 0.95].forEach((v, k) => expect(100 * forecasts.factorShares[k]).toBeCloseTo(v, 1));
  });

  test('level loads on every yield with one sign; the curve must hold every month of the inputs', () => {
    expect(forecasts.loadings[0].every((q) => q > 0.4 && q < 0.5)).toBe(true);
    const gap = { ...curve, dates: curve.dates.slice(1), y: curve.y.slice(1) };
    expect(() => yieldFactorForecasts(FULL, gap)).toThrow(RangeError);
  });
});

describe('subsampleTents', () => {
  // Pinned on the committed curve; an independent numpy run gives the same to 4 decimals. ϑ_0 is in percent.
  const pinned = [
    { nobs: 455, weights: [-1.5215, 0.3221, 0.6659, -6.9869, 9.4594, -3.0184], r2: 0.1349, b: [0.4393, 0.8282, 1.1941, 1.5384] },
    { nobs: 205, weights: [0.9524, -1.0395, 2.0677, -16.1088, 35.3403, -20.1222], r2: 0.1377, b: [0.4705, 0.8565, 1.1914, 1.4817] },
    { nobs: 250, weights: [-2.4433, 0.4985, 3.4984, -15.5914, 17.3496, -5.0449], r2: 0.2167, b: [0.348, 0.7656, 1.2145, 1.6719] },
  ];

  test('default ranges: weights, R² and loadings', () => {
    const tents = subsampleTents(curve);
    expect(tents.map(({ name, first, last }) => [name, first, last])).toEqual(defaultRanges.map((r) => [r.name, r.first, r.last]));
    tents.forEach(({ tent, ...range }, i) => {
      expect(tent.nobs).toBe(pinned[i].nobs);
      pinned[i].weights.forEach((w, j) => expect(j === 0 ? 100 * tent.weights[0] : tent.weights[j]).toBeCloseTo(w, 3));
      expect(tent.r2).toBeCloseTo(pinned[i].r2, 3);
      const loadings = singleFactorLoadings(cpInputs(curve, range), tent.weights);
      pinned[i].b.forEach((b, k) => expect(loadings[k].b).toBeCloseTo(b, 3));
    });
  });

  test('a custom range is tentFactor on its inputs, with the options passed on', () => {
    const range = { name: '1990s', first: '1990-01', last: '1999-12' };
    const [tent] = subsampleTents(curve, [range], { errors: 'newey-west' });
    expect(tent.tent).toEqual(tentFactor(cpInputs(curve, range), { errors: 'newey-west' }));
  });
});
