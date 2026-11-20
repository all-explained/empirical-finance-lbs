import { describe, expect, test } from 'vitest';
import gsw from '../../data/series/gsw-zero-coupon.json';
import type { Series } from '../data/series';
import { mulberry32 } from '../math/rng';
import { gswCurve, type YieldCurve } from './bonds';
import {
  fitExpectationsWorld, forwardSpreadRegression, perfectForesightRegression, populationSlope, simulateExpectationsWorld,
  slopeDistribution, slopesByMaturity, yieldChangeRegression, type ExpectationsWorld,
} from './expectationsHypothesis';
import { fitAR1 } from './predictive';

const curve = gswCurve(gsw as unknown as Series<'gsw-zero-coupon'>);
const MONTHS = curve.dates.length;

/** A world with a less persistent short rate than the data's, so long-path slopes settle quickly. */
const world: ExpectationsWorld = {
  shortRate: { mean: 0.04, phi: 0.97, sigma: 0.003 },
  constantPremium: Array.from({ length: 10 }, (_, i) => 0.002 * (1 - 1 / (i + 1))),
};
const premiumWorld: ExpectationsWorld = { ...world, movingPremium: { phi: 0.95, sigma: 0.0015 } };
/** 7,500 years of months: the "very long seeded path". */
const LONG = 90_000;
const longPath = simulateExpectationsWorld(2026, world, { months: LONG });
const longPremiumPath = simulateExpectationsWorld(2026, premiumWorld, { months: LONG });

/**
 * Reference values from an independent Python (NumPy) script over `gsw-zero-coupon`, 1985-11 to 2026-09: each
 * regression built from the definitions with months matched by calendar, OLS with an intercept, and the
 * Hansen–Hodrick (12 lags per year of horizon) and Newey–West (18 per year) sandwich written out.
 */
const DATA = {
  yieldChange: {
    2: { slope: 0.468821, hh: 0.658263, nw: 0.590927, nobs: 455 },
    5: { slope: -0.323580, hh: 0.682930, nw: 0.613665, nobs: 455 },
    10: { slope: -1.251540, hh: 0.684820, nw: 0.643049, nobs: 455 },
  },
  perfectForesight: {
    2: { slope: 0.734410, hh: 0.329132, nw: 0.295463, nobs: 455 },
    5: { slope: 1.089023, hh: 0.344906, nw: 0.315197, nobs: 385 },
    // The Hansen–Hodrick variance with 108 lags is negative here, so `ols` reports NaN.
    10: { slope: 1.039856, hh: NaN, nw: 0.059708, nobs: 306 },
  },
  excessReturn: {
    2: { slope: 0.265590, hh: 0.329132, nw: 0.295463, nobs: 455 },
    5: { slope: 0.752687, hh: 0.377416, nw: 0.339829, nobs: 455 },
    10: { slope: 1.395218, hh: 0.496495, nw: 0.463664, nobs: 455 },
  },
  shortRateChange: {
    2: { slope: 0.734410, hh: 0.329132, nw: 0.295463, nobs: 455 },
    5: { slope: 0.993049, hh: 0.448718, nw: 0.414535, nobs: 420 },
    10: { slope: 0.844542, hh: 0.112279, nw: 0.104512, nobs: 366 },
  },
} as const;

type Name = keyof typeof DATA;
const NAMES = Object.keys(DATA) as Name[];

function pinned(name: Name, n: 2 | 5 | 10, errors?: 'newey-west') {
  return slopesByMaturity(curve, name, [n], errors ? { errors } : {})[0];
}

describe('the four regressions on the committed data', () => {
  test.each(NAMES.flatMap((name) => ([2, 5, 10] as const).map((n) => [name, n] as const)))(
    '%s at n = %i: slope, Hansen–Hodrick and Newey–West errors match the Python script to 1e-6',
    (name, n) => {
      const reference = DATA[name][n];
      const hh = pinned(name, n);
      const nw = pinned(name, n, 'newey-west');
      expect(hh.slope).toBeCloseTo(reference.slope, 6);
      expect(hh.nobs).toBe(reference.nobs);
      if (Number.isNaN(reference.hh)) expect(hh.standardError).toBeNaN();
      else expect(hh.standardError).toBeCloseTo(reference.hh, 6);
      expect(nw.standardError).toBeCloseTo(reference.nw, 6);
      const horizon = name === 'perfectForesight' || name === 'shortRateChange' ? n - 1 : 1;
      expect([hh.lags, nw.lags]).toEqual([12 * horizon, 18 * horizon]);
    },
  );

  test('yieldChangeRegression: the t-statistics against 0 and 1, the dates and the scatter points', () => {
    const r = yieldChangeRegression(curve, 10);
    expect(r.tStat).toBeCloseTo(-1.251540 / 0.684820, 5);
    expect(r.tStatOne).toBeCloseTo(-2.251540 / 0.684820, 5);
    expect([r.n, r.hypothesis, r.dates[0], r.dates.at(-1), r.points.length]).toEqual([10, 1, '1985-11-29', '2025-09-30', 455]);
    // First point: x = (y^(10) - y^(1)) / 9 on 1985-11-29, y = y^(9) on 1986-11-28 minus y^(10) on 1985-11-29.
    const [t, s] = [curve.dates.indexOf('1985-11-29'), curve.dates.indexOf('1986-11-28')];
    expect(r.points[0].x).toBeCloseTo((curve.y[t][9] - curve.y[t][0]) / 9, 15);
    expect(r.points[0].y).toBeCloseTo(curve.y[s][8] - curve.y[t][9], 15);
  });

  test('perfectForesightRegression: slope 1 under the hypothesis, n - 1 years of lags', () => {
    const r = perfectForesightRegression(curve, 5);
    expect([r.hypothesis, r.lags, r.nobs, r.dates.at(-1)]).toEqual([1, 48, 385, '2022-09-30']);
  });

  test('annualMonth keeps one month a year; lags then count years (Python: December only)', () => {
    const r = yieldChangeRegression(curve, 2, { annualMonth: 12 });
    expect([r.nobs, r.lags, r.dates.every((d) => d.slice(5, 7) === '12')]).toEqual([38, 1, true]);
    expect(r.slope).toBeCloseTo(1.129013, 6);
    expect(r.standardError).toBeCloseTo(0.686662, 6);
    const pf = perfectForesightRegression(curve, 10, { annualMonth: 12 });
    expect([pf.nobs, pf.lags]).toEqual([24, 9]);
    expect(pf.slope).toBeCloseTo(1.049845, 6);
    expect(pf.standardError).toBeCloseTo(0.044109, 6);
  });

  test('rejects maturities outside 2…N, unknown errors and months', () => {
    expect(() => yieldChangeRegression(curve, 1)).toThrow(RangeError);
    expect(() => yieldChangeRegression(curve, 31)).toThrow(RangeError);
    expect(() => yieldChangeRegression(curve, 2, { errors: 'white' as never })).toThrow(RangeError);
    expect(() => yieldChangeRegression(curve, 2, { annualMonth: 13 })).toThrow(RangeError);
    expect(() => slopesByMaturity(curve, 'level' as never, [2])).toThrow(RangeError);
  });
});

describe('forwardSpreadRegression', () => {
  test('at n = 2 the excess-return and short-rate slopes sum to 1 to 1e-12 on the committed data', () => {
    const { excessReturn, shortRateChange } = forwardSpreadRegression(curve, 2);
    expect(excessReturn.dates).toEqual(shortRateChange.dates);
    expect(Math.abs(excessReturn.slope + shortRateChange.slope - 1)).toBeLessThan(1e-12);
    expect(Math.abs(excessReturn.intercept + shortRateChange.intercept)).toBeLessThan(1e-12);
  });

  test('hypothesis values 0 and 1; the short-rate change needs only the month n - 1 years later', () => {
    const { excessReturn, shortRateChange } = forwardSpreadRegression(curve, 5);
    expect([excessReturn.hypothesis, shortRateChange.hypothesis]).toEqual([0, 1]);
    // 420 months have a month four years later; 385 have all four one-year steps (the perfect-foresight sample).
    expect([shortRateChange.nobs, perfectForesightRegression(curve, 5).nobs]).toEqual([420, 385]);
  });
});

describe('the Hansen–Hodrick standard error by hand', () => {
  // 30 gap-free months of a three-maturity curve; t + 1 is twelve rows later.
  const fixture: YieldCurve = {
    dates: Array.from({ length: 30 }, (_, k) => `${2000 + Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}-28`),
    maturities: [1, 2, 3],
    y: Array.from({ length: 30 }, (_, k) => [
      0.03 + 0.01 * Math.sin(k / 3),
      0.035 + 0.008 * Math.sin(k / 4 + 1) + 0.001 * Math.cos(k),
      0.04 + 0.006 * Math.cos(k / 5),
    ]),
  };

  test('yieldChangeRegression at n = 3 with 3 lags equals (X\'X)⁻¹ [Σ_{|l|≤3} Σ_t x_t e_t e_{t-l} x_{t-l}\'] (X\'X)⁻¹', () => {
    const T = 18;
    const x = Array.from({ length: T }, (_, t) => (fixture.y[t][2] - fixture.y[t][0]) / 2);
    const y = Array.from({ length: T }, (_, t) => fixture.y[t + 12][1] - fixture.y[t][2]);
    const [mx, my] = [x, y].map((v) => v.reduce((a, b) => a + b, 0) / T);
    const sxx = x.reduce((a, v) => a + (v - mx) ** 2, 0);
    const b = x.reduce((a, v, t) => a + (v - mx) * (y[t] - my), 0) / sxx;
    const e = y.map((v, t) => v - (my - b * mx) - b * x[t]);
    // Scores (e_t, x_t e_t); the long-run sum S over lags -3…3 with weight 1; slope variance = [(X'X)⁻¹ S (X'X)⁻¹]_22.
    const scores = x.map((v, t) => [e[t], v * e[t]]);
    const S = [[0, 0], [0, 0]];
    for (let l = -3; l <= 3; l++) {
      for (let t = Math.max(0, l); t < T + Math.min(0, l); t++) {
        for (const i of [0, 1]) for (const j of [0, 1]) S[i][j] += scores[t][i] * scores[t - l][j];
      }
    }
    const sx = x.reduce((a, v) => a + v, 0);
    const sx2 = x.reduce((a, v) => a + v * v, 0);
    const det = T * sx2 - sx * sx;
    const inv = [[sx2 / det, -sx / det], [-sx / det, T / det]];
    const row = [inv[1][0], inv[1][1]];
    const variance = row.reduce((a, ri, i) => a + ri * row.reduce((c, rj, j) => c + S[i][j] * rj, 0), 0);
    const r = yieldChangeRegression(fixture, 3, { lags: 3 });
    expect(r.nobs).toBe(T);
    expect(r.slope).toBeCloseTo(b, 12);
    expect(r.standardError).toBeCloseTo(Math.sqrt(variance), 12);
  });
});

describe('slopesByMaturity', () => {
  test('one result per maturity, in order, each with its hypothesis value', () => {
    const results = slopesByMaturity(curve, 'excessReturn', [10, 2, 5]);
    expect(results.map((r) => [r.n, r.hypothesis])).toEqual([[10, 0], [2, 0], [5, 0]]);
    expect(results[1].slope).toBe(forwardSpreadRegression(curve, 2).excessReturn.slope);
  });
});

describe('fitExpectationsWorld', () => {
  test('the AR(1) of the monthly one-year yield from fitAR1, and tp^(n) = mean y^(n) - mean y^(1)', () => {
    const fitted = fitExpectationsWorld(curve);
    const ar = fitAR1(curve.y.map((row) => row[0]));
    expect(fitted.shortRate.phi).toBe(ar.phi);
    expect(fitted.shortRate.sigma).toBe(ar.residualStd);
    expect(fitted.shortRate.mean).toBeCloseTo(ar.intercept / (1 - ar.phi), 15);
    // φ_y = 0.99252 a month (0.914 a year), σ_y = 0.246%, μ_y = 2.593%; tp^(10) = 1.300% on 1985-11 to 2026-09.
    expect(fitted.shortRate.phi).toBeCloseTo(0.9925217, 7);
    expect(fitted.shortRate.sigma).toBeCloseTo(0.0024574, 7);
    expect(fitted.shortRate.mean).toBeCloseTo(0.0259323, 7);
    expect([fitted.constantPremium.length, fitted.constantPremium[0], fitted.movingPremium]).toEqual([30, 0, undefined]);
    expect(fitted.constantPremium[9]).toBeCloseTo(0.0129955, 7);
  });
});

describe('simulateExpectationsWorld', () => {
  const path = simulateExpectationsWorld(7, world, { months: 120 });

  test('a curve in the shape of gswCurve, reproducible from its seed', () => {
    expect([path.dates.length, path.maturities, path.y[0].length]).toEqual([120, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10]);
    expect([path.dates[0], path.dates[11], path.dates[119]]).toEqual(['2000-01-28', '2000-12-28', '2009-12-28']);
    expect(simulateExpectationsWorld(7, world, { months: 120 })).toEqual(path);
    expect(simulateExpectationsWorld(8, world, { months: 120 }).y[0][0]).not.toBe(path.y[0][0]);
  });

  test('every yield is the closed form μ_y + φ̄^(n)_y (y^(1)_t - μ_y) + tp^(n), with φ̄^(n)_y = (1/n) Σ φ_y^{12j} summed term by term', () => {
    const a = world.shortRate.phi ** 12;
    path.y.forEach((row) => row.forEach((value, i) => {
      const n = i + 1;
      let weight = 0;
      for (let j = 0; j < n; j++) weight += a ** j / n;
      const expected = world.shortRate.mean + weight * (row[0] - world.shortRate.mean) + world.constantPremium[i];
      expect(Math.abs(value - expected)).toBeLessThan(1e-15);
    }));
  });

  test('the moving premium leaves the short-rate path unchanged and adds (1 - 1/n) tp_t to each yield', () => {
    const moved = simulateExpectationsWorld(7, premiumWorld, { months: 120 });
    expect(moved.y.map((row) => row[0])).toEqual(path.y.map((row) => row[0]));
    moved.y.forEach((row, t) => {
      const tp = (row[9] - path.y[t][9]) / 0.9;
      row.forEach((value, i) => expect(value - path.y[t][i]).toBeCloseTo((1 - 1 / (i + 1)) * tp, 15));
    });
  });

  test('rejects a non-stationary AR(1), tp^(1) ≠ 0 and too many months', () => {
    expect(() => simulateExpectationsWorld(1, { ...world, shortRate: { ...world.shortRate, phi: 1 } }, { months: 12 })).toThrow(RangeError);
    expect(() => simulateExpectationsWorld(1, { ...world, constantPremium: [0.001, 0.002] }, { months: 12 })).toThrow(RangeError);
    expect(() => simulateExpectationsWorld(1, world, { months: 96_001 })).toThrow(RangeError);
  });
});

describe('a very long path of the world (90,000 months)', () => {
  // Each band is three Hansen–Hodrick standard errors on this path, which are about 0.05 for the yield change, 0.025
  // for the other three regressions without the premium and at most 0.05 with it.
  test.each([2, 5, 10])('without the moving premium, n = %i: b_Δy and b_pfs within 0.15 and 0.08 of 1, b_rx within 0.08 of 0', (n) => {
    expect(Math.abs(yieldChangeRegression(longPath, n).slope - 1)).toBeLessThan(0.15);
    expect(Math.abs(perfectForesightRegression(longPath, n).slope - 1)).toBeLessThan(0.08);
    const { excessReturn, shortRateChange } = forwardSpreadRegression(longPath, n);
    expect(Math.abs(excessReturn.slope)).toBeLessThan(0.08);
    expect(Math.abs(shortRateChange.slope - 1)).toBeLessThan(0.08);
  });

  test.each([2, 5, 10])('with the moving premium, n = %i: b_Δy within 0.15 of populationSlope', (n) => {
    expect(Math.abs(yieldChangeRegression(longPremiumPath, n).slope - populationSlope(premiumWorld, n))).toBeLessThan(0.15);
  });
});

describe('populationSlope', () => {
  test('1 to 1e-12 at every maturity without the moving premium', () => {
    for (let n = 2; n <= 30; n++) expect(Math.abs(populationSlope(world, n) - 1)).toBeLessThan(1e-12);
  });

  test('at n = 2 it is [((φ_y^12 - 1)/2)² Var(y^(1)) - Var(tp)/4] / [((φ_y^12 - 1)/2)² Var(y^(1)) + Var(tp)/4]', () => {
    const { shortRate, movingPremium } = premiumWorld as Required<ExpectationsWorld>;
    const a = shortRate.phi ** 12;
    const varShort = shortRate.sigma ** 2 / (1 - shortRate.phi ** 2);
    const varPremium = movingPremium.sigma ** 2 / (1 - movingPremium.phi ** 2);
    const short = ((a - 1) / 2) ** 2 * varShort;
    expect(populationSlope(premiumWorld, 2)).toBeCloseTo((short - varPremium / 4) / (short + varPremium / 4), 14);
    // -0.2357, 0.0422, -0.0855 at 2, 5 and 10 years: below 1, negative at 2 and 10.
    expect([2, 5, 10].map((n) => populationSlope(premiumWorld, n))).toEqual([
      expect.closeTo(-0.2357, 4), expect.closeTo(0.0422, 4), expect.closeTo(-0.0855, 4),
    ]);
  });

  test('rejects n < 2', () => {
    expect(() => populationSlope(world, 1)).toThrow(RangeError);
  });
});

describe('slopeDistribution', () => {
  const fitted = fitExpectationsWorld(curve);
  /**
   * Seed 144, 500 samples of 479 months at n = 2. The median sits far above 1: over 40 years the annual
   * autocorrelation of the short rate is estimated too low by about (1 + 3 φ_y^12) / 40 ≈ 0.09 (Kendall's bias), and
   * the slope divides that error by 1 - φ̄^(2)_y ≈ 0.043, which gives about 3.2.
   */
  const MEDIAN_AT_2 = 3.135938;
  const SHARE_AT_2 = 0.068;

  test('reproducible from its seed, and sample i is the regression on the path from the i-th seed', () => {
    const options = { months: MONTHS, samples: 20 };
    const first = slopeDistribution(41, fitted, 5, options);
    expect(slopeDistribution(41, fitted, 5, options)).toEqual(first);
    expect(slopeDistribution(42, fitted, 5, options).slopes).not.toEqual(first.slopes);
    const seeds = mulberry32(41);
    const truncated = { ...fitted, constantPremium: fitted.constantPremium.slice(0, 5) };
    first.slopes.slice(0, 3).forEach((slope) => {
      const path = simulateExpectationsWorld(Math.floor(seeds() * 2 ** 32), truncated, { months: MONTHS });
      expect(slope).toBeCloseTo(yieldChangeRegression(path, 5).slope, 12);
    });
    expect(first.shareAtOrBelow).toBeNull();
  });

  test('the median lies within 0.1 of 1 for samples of 400 years', () => {
    const { quantiles } = slopeDistribution(144, world, 5, { months: 4800, samples: 200 });
    expect(quantiles.map(({ p }) => p)).toEqual([0.05, 0.25, 0.5, 0.75, 0.95]);
    expect(Math.abs(quantiles[2].value - 1)).toBeLessThan(0.1);
  });

  test('in the fitted world at our length the slopes centre well above 1, and few fall at or below the data\'s', () => {
    const observed = yieldChangeRegression(curve, 2).slope;
    const { slopes, quantiles, shareAtOrBelow } = slopeDistribution(144, fitted, 2, { months: MONTHS, observed });
    expect(slopes.length).toBe(500);
    expect(shareAtOrBelow).toBe(slopes.filter((b) => b <= observed).length / 500);
    expect(quantiles[2].value).toBeCloseTo(MEDIAN_AT_2, 3);
    expect(shareAtOrBelow).toBeCloseTo(SHARE_AT_2, 10);
  });

  test('other regressions and annual observations run through the same samples', () => {
    const pf = slopeDistribution(3, fitted, 2, { months: MONTHS, samples: 5, regression: 'perfectForesight' });
    const fb = slopeDistribution(3, fitted, 2, { months: MONTHS, samples: 5, regression: 'excessReturn' });
    pf.slopes.forEach((b, i) => expect(b + fb.slopes[i]).toBeCloseTo(1, 12));
    const annual = slopeDistribution(3, fitted, 2, { months: MONTHS, samples: 5, annualMonth: 12 });
    expect(annual.slopes).not.toEqual(slopeDistribution(3, fitted, 2, { months: MONTHS, samples: 5 }).slopes);
  });

  test('rejects zero samples and a maturity the world does not price', () => {
    expect(() => slopeDistribution(1, world, 2, { months: MONTHS, samples: 0 })).toThrow(RangeError);
    expect(() => slopeDistribution(1, world, 11, { months: MONTHS })).toThrow(RangeError);
  });
});
