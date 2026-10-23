import { describe, expect, it } from 'vitest';
import { fitAR1 } from '../finance/predictive';
import {
  cointegratingResidual, combination, dynamicOLS, realTimeResidual, simulateCointegratedPair,
} from './cointegration';
import { ols } from './ols';

const pair = simulateCointegratedPair({ seed: 7, T: 2000, beta: 0.6, phi: 0.7, sigma: 1 });

describe('dynamicOLS', () => {
  it('with zero leads and lags equals ols on the levels, full sample', () => {
    const { x, y } = simulateCointegratedPair({ seed: 3, T: 120, beta: 0.6 });
    const z = x.map((value, t) => Math.sin(t) + 0.1 * value);
    const fit = dynamicOLS(y, [x, z]);
    const reference = ols(y, [x, z], { errors: 'newey-west', lags: 0 });
    expect(fit.alpha).toBeCloseTo(reference.coefficients[0], 12);
    expect(fit.beta[0]).toBeCloseTo(reference.coefficients[1], 12);
    expect(fit.beta[1]).toBeCloseTo(reference.coefficients[2], 12);
    expect(fit.standardErrors[0]).toBeCloseTo(reference.standardErrors[1], 12);
    expect(fit.standardErrors[1]).toBeCloseTo(reference.standardErrors[2], 12);
    expect([fit.first, fit.last, fit.nobs]).toEqual([0, 119, 120]);
  });

  it('with 1 lead and 2 lags equals ols on hand-built rows t = 3..T−2', () => {
    const { x, y } = simulateCointegratedPair({ seed: 5, T: 60 });
    const rows = Array.from({ length: 56 }, (_, i) => i + 3);
    const dx = (t: number) => x[t] - x[t - 1];
    // Regressors: x_t, then Delta x_{t-2}, Delta x_{t-1}, Delta x_t, Delta x_{t+1}.
    const columns = [rows.map((t) => x[t]), ...[-2, -1, 0, 1].map((j) => rows.map((t) => dx(t + j)))];
    const reference = ols(rows.map((t) => y[t]), columns, { errors: 'newey-west', lags: 4 });
    const fit = dynamicOLS(y, [x], { leads: 1, lags: 2, neweyWestLags: 4 });
    expect([fit.first, fit.last, fit.nobs]).toEqual([3, 58, 56]);
    expect(fit.alpha).toBeCloseTo(reference.coefficients[0], 12);
    expect(fit.beta[0]).toBeCloseTo(reference.coefficients[1], 12);
    expect(fit.standardErrors[0]).toBeCloseTo(reference.standardErrors[1], 12);
  });

  it('recovers beta = 0.6 within 0.02 on a seeded pair with T = 2000', () => {
    const fit = dynamicOLS(pair.y, [pair.x], { leads: 4, lags: 4 });
    expect(Math.abs(fit.beta[0] - 0.6)).toBeLessThan(0.02);
    expect(fit.standardErrors[0]).toBeGreaterThan(0);
  });

  it('rejects bad leads, lags and lengths', () => {
    expect(() => dynamicOLS([1, 2, 3], [[1, 2, 3]], { leads: -1 })).toThrow(RangeError);
    expect(() => dynamicOLS([1, 2, 3], [[1, 2, 3]], { lags: 1.5 })).toThrow(RangeError);
    expect(() => dynamicOLS([1, 2, 3], [[1, 2]])).toThrow(RangeError);
    expect(() => dynamicOLS([1, 2, 3], [[1, 2, 4]], { leads: 1, lags: 1 })).toThrow(RangeError);
  });
});

describe('cointegratingResidual', () => {
  it('is y − alpha − beta′X by hand', () => {
    // t=0: 5 − 1 − (2·1 + 0.5·2) = 1; t=1: 3 − 1 − (2·0 + 0.5·4) = 0.
    expect(cointegratingResidual([5, 3], [[1, 0], [2, 4]], 1, [2, 0.5])).toEqual([1, 0]);
    expect(() => cointegratingResidual([5, 3], [[1, 0]], 1, [2, 0.5])).toThrow(RangeError);
  });
});

describe('realTimeResidual', () => {
  const { x, y } = simulateCointegratedPair({ seed: 11, T: 150, beta: 0.6 });
  const options = { minWindow: 60, leads: 2, lags: 2 };
  const realTime = realTimeResidual(y, [x], options);

  it('at the last date equals the full-sample residual there', () => {
    const full = dynamicOLS(y, [x], options);
    const residual = cointegratingResidual(y, [x], full.alpha, full.beta);
    expect(realTime.first).toBe(59);
    expect(realTime.residuals).toHaveLength(91);
    expect(realTime.residuals.at(-1)).toBeCloseTo(residual.at(-1)!, 12);
    expect(realTime.beta.at(-1)![0]).toBeCloseTo(full.beta[0], 12);
  });

  it('at the first date equals dynamicOLS on dates 0..59 only, whatever comes later', () => {
    const prefix = dynamicOLS(y.slice(0, 60), [x.slice(0, 60)], options);
    expect(prefix.last).toBe(57); // two leads: the last row with known Delta x_{t+2}
    expect(realTime.residuals[0]).toBeCloseTo(y[59] - prefix.alpha - prefix.beta[0] * x[59], 12);
    const changedFuture = realTimeResidual(y.map((value, t) => (t > 59 ? value + 100 : value)), [x], options);
    expect(changedFuture.residuals[0]).toBe(realTime.residuals[0]);
  });

  it('rejects a window outside the sample', () => {
    expect(() => realTimeResidual(y, [x], { minWindow: 0 })).toThrow(RangeError);
    expect(() => realTimeResidual(y, [x], { minWindow: 151 })).toThrow(RangeError);
  });
});

describe('simulateCointegratedPair and combination', () => {
  it('is reproducible and has the requested length', () => {
    const again = simulateCointegratedPair({ seed: 7, T: 2000, beta: 0.6, phi: 0.7, sigma: 1 });
    expect(again).toEqual(pair);
    expect(pair.x).toHaveLength(2000);
    expect(simulateCointegratedPair({ seed: 8, T: 2000 }).x).not.toEqual(pair.x);
  });

  it('combination is y − w x by hand', () => {
    expect(combination([3, 5], [2, 4], 0.5)).toEqual([2, 3]);
    expect(() => combination([3], [2, 4], 0.5)).toThrow(RangeError);
  });

  it('at w = beta has the AR(1) persistence of u (0.7, within 0.05); at w = 0 it is above 0.95', () => {
    expect(Math.abs(fitAR1(combination(pair.y, pair.x, 0.6)).phi - 0.7)).toBeLessThan(0.05);
    expect(fitAR1(combination(pair.y, pair.x, 0)).phi).toBeGreaterThan(0.95);
  });
});
