import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import { normalRng } from '../math/rng';
import { simulateAR1 } from '../stats/var';
import { arithmeticMean } from './returns';
import {
  approxLogReturn, exactLogReturn, goyalWelchAnnualPresentValue, impliedReturnSlope,
  linearisationConstants, longRunCoefficient, presentValueSlopes, varianceShares,
} from './presentValue';

describe('Campbell–Shiller linearisation', () => {
  it('gives rho = 30/31 and kappa = log 31 − (30/31) log 30 at mean pd = log 30', () => {
    const { rho, kappa } = linearisationConstants(Math.log(30));
    expect(rho).toBeCloseTo(30 / 31, 15);
    expect(kappa).toBeCloseTo(Math.log(31) - (30 / 31) * Math.log(30), 14);
    // At mean pd = 0: rho = 1/2 and kappa = log 2.
    expect(linearisationConstants(0)).toEqual({ rho: 0.5, kappa: Math.LN2 });
    expect(() => linearisationConstants(NaN)).toThrow(RangeError);
  });

  it('matches the exact return at pd_t = pd_{t+1} = mean pd, and differs away from it', () => {
    const meanPd = Math.log(30);
    const { rho, kappa } = linearisationConstants(meanPd);
    // Exact: log(1 + 30) + 0.02 − log 30 = log(31/30) + 0.02.
    expect(exactLogReturn(meanPd, meanPd, 0.02)).toBeCloseTo(Math.log(31 / 30) + 0.02, 15);
    expect(approxLogReturn(meanPd, meanPd, 0.02, rho, kappa)).toBeCloseTo(Math.log(31 / 30) + 0.02, 15);
    // By hand: kappa + rho·1 + 0.01 − 2 with rho = 1/2, kappa = log 2.
    expect(approxLogReturn(2, 1, 0.01, 0.5, Math.LN2)).toBeCloseTo(Math.LN2 - 1.49, 15);
    // The approximation is a tangent to the convex log(1 + e^pd), so it lies below the exact return.
    const pdNext = meanPd + 0.5;
    expect(approxLogReturn(meanPd, pdNext, 0, rho, kappa)).toBeLessThan(exactLogReturn(meanPd, pdNext, 0));
  });

  it('computes long-run and implied slopes by hand', () => {
    // 0.1/(1 − 0.96·0.9) = 0.1/0.136.
    expect(longRunCoefficient(0.1, 0.96, 0.9)).toBeCloseTo(0.1 / 0.136, 14);
    expect(longRunCoefficient(-0.02, 0.5, 0)).toBe(-0.02);
    // 1 − 0.96·0.9 + 0.01 = 0.146.
    expect(impliedReturnSlope(0.01, 0.96, 0.9)).toBeCloseTo(0.146, 14);
    expect(impliedReturnSlope(0, 1, 1)).toBe(0);
  });
});

describe('present-value slopes and variance shares', () => {
  // dp_t = [0, 1, 2, 4]; r and dd have unused first entries, as in goyalWelchAnnualPresentValue.
  const dp = [0, 1, 2, 4];
  const r = [99, 2, 4, 6];
  const dd = [99, 0, 1, 3];

  it('regresses next-year values on dp by hand', () => {
    // x = [0, 1, 2]: dp next [1, 2, 4] gives phi = 3/2; r next [2, 4, 6] gives 2; dd next [0, 1, 3] gives 3/2.
    const fit = presentValueSlopes(dp, r, dd, 0.5);
    expect(fit.phi).toBeCloseTo(1.5, 13);
    expect(fit.br).toBeCloseTo(2, 13);
    expect(fit.bd).toBeCloseTo(1.5, 13);
    // 1 − rho·phi = 0.25: long-run slopes 2/0.25 = 8 and 1.5/0.25 = 6; gap 1 − (2 − 1.5 + 0.75) = −0.25.
    expect(fit.brLongRun).toBeCloseTo(8, 12);
    expect(fit.bdLongRun).toBeCloseTo(6, 12);
    expect(fit.gap).toBeCloseTo(-0.25, 13);
    expect(fit.nobs).toBe(3);
    expect(() => presentValueSlopes(dp, r.slice(1), dd, 0.5)).toThrow(RangeError);
    expect(() => presentValueSlopes(dp, r, [NaN, 0, 1, 3], 0.5)).toThrow(RangeError);
  });

  it('splits Var(dp) by hand at horizons 1 and 2', () => {
    // k = 1 repeats the one-year slopes: b_r, −b_d and rho·phi.
    const one = varianceShares(dp, r, dd, 0.5, 1);
    expect(one.returns).toBeCloseTo(2, 13);
    expect(one.dividends).toBeCloseTo(-1.5, 13);
    expect(one.future).toBeCloseTo(0.75, 13);
    // k = 2 on x = [0, 1]: Σ r = [2 + 0.5·4, 4 + 0.5·6] = [4, 7] gives 3;
    // Σ dd = [0.5, 2.5] gives 2, so −2; dp_{t+2} = [2, 4] gives 2, times 0.25 = 0.5.
    const two = varianceShares(dp, r, dd, 0.5, 2);
    expect(two.returns).toBeCloseTo(3, 13);
    expect(two.dividends).toBeCloseTo(-2, 13);
    expect(two.future).toBeCloseTo(0.5, 13);
    expect(() => varianceShares(dp, r, dd, 0.5, 3)).toThrow(RangeError);
    for (const k of [0, 1.5, NaN]) expect(() => varianceShares(dp, r, dd, 0.5, k)).toThrow(RangeError);
  });

  it('closes the identity exactly on a series built from the linear identity', () => {
    // dp_t is a seeded AR(1); dd_t is seeded noise; r_t = kappa + dp_{t−1} − rho dp_t + dd_t exactly.
    const rho = 0.96;
    const kappa = 0.16;
    const T = 300;
    const sim = simulateAR1({ T, phi: 0.9, sigma: 0.15, mean: -3.3, seed: 46 });
    const normal = normalRng(460);
    const growth = sim.map(() => 0.02 + 0.1 * normal());
    const returns = sim.map((value, t) => (t === 0 ? 0 : kappa + sim[t - 1] - rho * value + growth[t]));
    const fit = presentValueSlopes(sim, returns, growth, rho);
    expect(Math.abs(fit.gap)).toBeLessThan(1e-10);
    expect(fit.brLongRun - fit.bdLongRun).toBeCloseTo(1, 10);
    expect(fit.br).toBeCloseTo(impliedReturnSlope(fit.bd, rho, fit.phi), 10);
    for (let k = 1; k <= 40; k++) {
      const shares = varianceShares(sim, returns, growth, rho, k);
      expect(Math.abs(shares.returns + shares.dividends + shares.future - 1)).toBeLessThan(1e-10);
    }
  });
});

describe('Goyal–Welch annual present-value data', () => {
  it('pins the sample, rho and the largest linearisation error', async () => {
    const series = await loadSeries('goyal-welch-annual');
    const { dates, pd, dp, r, dd } = goyalWelchAnnualPresentValue(series);
    // 1871 is the first complete year; it supplies only P and D for the 1872 return.
    expect(dates).toEqual(Array.from({ length: 154 }, (_, t) => `${1872 + t}-01-01`));
    [pd, dp, r, dd].forEach((values) => expect(values).toHaveLength(154));
    expect(dp[0]).toBe(-pd[0]);
    // Reference values from an independent Python pass over the same JSON file.
    const { rho, kappa } = linearisationConstants(arithmeticMean(pd));
    expect(rho).toBeCloseTo(0.9635228477409029, 13);
    expect(kappa).toBeCloseTo(0.15658199539800677, 13);
    let worst = { error: 0, date: '' };
    for (let t = 1; t < dates.length; t++) {
      expect(r[t]).toBeCloseTo(exactLogReturn(pd[t - 1], pd[t], dd[t]), 13);
      const error = Math.abs(r[t] - approxLogReturn(pd[t - 1], pd[t], dd[t], rho, kappa));
      if (error > worst.error) worst = { error, date: dates[t] };
    }
    expect(worst.error).toBeCloseTo(0.023523414346445892, 12);
    expect(worst.date).toBe('1917-01-01');
  });

  it('keeps the latest run of consecutive complete years', async () => {
    const series = await loadSeries('goyal-welch-annual');
    const index = series.columns.findIndex((c) => c.name === 'D12');
    const rows = series.rows.map((row) => [...row] as [string, ...(number | null)[]]);
    rows[series.rows.findIndex(([date]) => date === '2000-01-01')][index] = null;
    expect(goyalWelchAnnualPresentValue({ ...series, rows }).dates[0]).toBe('2002-01-01');
    rows[3][index] = 0;
    expect(() => goyalWelchAnnualPresentValue({ ...series, rows })).toThrow(RangeError);
    expect(goyalWelchAnnualPresentValue({ ...series, rows: [] }).dates).toEqual([]);
  });
});
