import { describe, expect, test } from 'vitest';
import { fitAR1 } from '../finance/predictive';
import { sampleVariance } from '../finance/returns';
import { normalRng } from '../math/rng';
import {
  ar1Autocorrelation, ar1Forecast, ar1Variance, fitVAR1, forecastVAR1, halfLife,
  sampleAutocorrelation, simulateAR1,
} from './var';

describe('AR(1) formulas', () => {
  test('variance sigma²/(1 − phi²)', () => {
    expect(ar1Variance(0.5, 1)).toBeCloseTo(4 / 3, 14);
    expect(ar1Variance(0, 0.2)).toBeCloseTo(0.04, 14);
    expect(() => ar1Variance(1, 1)).toThrow(RangeError);
  });

  test('autocorrelation phi^k', () => {
    expect(ar1Autocorrelation(0.9, 0)).toBe(1);
    expect(ar1Autocorrelation(0.9, 2)).toBeCloseTo(0.81, 14);
    expect(() => ar1Autocorrelation(0.9, 1.5)).toThrow(RangeError);
  });

  test('half-life log(1/2)/log(phi)', () => {
    expect(halfLife(0.5)).toBeCloseTo(1, 14);
    expect(halfLife(0.25)).toBeCloseTo(0.5, 14);
    // 0.98^34.3096 = 1/2, the style guide's default monthly predictor.
    expect(halfLife(0.98)).toBeCloseTo(34.3096, 4);
    expect(0.98 ** halfLife(0.98)).toBeCloseTo(0.5, 12);
    expect(halfLife(0)).toBe(0);
    expect(() => halfLife(1)).toThrow(RangeError);
    expect(() => halfLife(-0.1)).toThrow(RangeError);
  });

  test('forecast mean + phi^k (x_t − mean)', () => {
    expect(ar1Forecast(2, 0, 0.5, 3)).toBeCloseTo(0.25, 14);
    expect(ar1Forecast(5, 1, 0.9, 0)).toBe(5);
    expect(ar1Forecast(5, 1, 0.9, 1)).toBeCloseTo(1 + 0.9 * 4, 14);
  });
});

describe('simulateAR1', () => {
  test('phi = 0 returns the seeded normal draws, scaled and shifted', () => {
    const draw = normalRng(7);
    const expected = Array.from({ length: 5 }, () => 3 + 2 * draw());
    simulateAR1({ T: 5, phi: 0, sigma: 2, mean: 3, seed: 7 }).forEach((v, t) => expect(v).toBeCloseTo(expected[t], 14));
  });

  test('the recursion holds with the same shocks for every phi', () => {
    const shocks = normalRng(3);
    const e = Array.from({ length: 4 }, () => shocks());
    const path = simulateAR1({ T: 4, phi: 0.9, sigma: 0.5, mean: 1, seed: 3 });
    expect(path[0]).toBeCloseTo(1 + 0.5 / Math.sqrt(1 - 0.81) * e[0], 14);
    for (let t = 1; t < 4; t++) expect(path[t]).toBeCloseTo(1 + 0.9 * (path[t - 1] - 1) + 0.5 * e[t], 14);
  });

  test('a long path matches the population moments', () => {
    const path = simulateAR1({ T: 200_000, phi: 0.5, sigma: 1, seed: 11 });
    expect(sampleVariance(path) / (4 / 3)).toBeCloseTo(1, 1);
    expect(fitAR1(path).phi).toBeCloseTo(0.5, 2);
    expect(sampleAutocorrelation(path, 2)[2]).toBeCloseTo(0.25, 2);
  });

  test('zero shocks stay at the mean; bad inputs throw', () => {
    expect(simulateAR1({ T: 3, sigma: 0, mean: 2 })).toEqual([2, 2, 2]);
    expect(() => simulateAR1({ phi: 1 })).toThrow(RangeError);
    expect(() => simulateAR1({ T: 0 })).toThrow(RangeError);
    expect(() => simulateAR1({ sigma: -1 })).toThrow(RangeError);
  });
});

describe('sampleAutocorrelation', () => {
  test('hand-computed values for 1..5', () => {
    // Deviations −2..2: c0 = 10, c1 = 4, c2 = −1.
    const acf = sampleAutocorrelation([1, 2, 3, 4, 5], 2);
    expect(acf[0]).toBe(1);
    expect(acf[1]).toBeCloseTo(0.4, 14);
    expect(acf[2]).toBeCloseTo(-0.1, 14);
  });

  test('bad inputs throw', () => {
    expect(() => sampleAutocorrelation([1, 2, 3], 3)).toThrow(RangeError);
    expect(() => sampleAutocorrelation([2, 2, 2], 1)).toThrow(RangeError);
  });
});

describe('VAR(1)', () => {
  const A = [[0.5, 0.1], [0.2, 0.3]];
  const c = [1, 2];

  test('a one-variable VAR(1) is the AR(1) fit', () => {
    const x = simulateAR1({ T: 300, phi: 0.8, sigma: 1, mean: 2, seed: 5 });
    const fit = fitVAR1([x]);
    const ar = fitAR1(x);
    expect(fit.A[0][0]).toBeCloseTo(ar.phi, 12);
    expect(fit.intercept[0]).toBeCloseTo(ar.intercept, 12);
    expect(fit.mean[0]).toBeCloseTo(ar.intercept / (1 - ar.phi), 12);
    expect(fit.residualCovariance[0][0]).toBeCloseTo(ar.residualStd ** 2, 12);
    expect(fit.nobs).toBe(299);
  });

  test('recovers A, c, the mean and the shock covariance from a long seeded simulation', () => {
    const draw = normalRng(21);
    const z = [[0], [0]];
    for (let t = 1; t < 50_000; t++) {
      const e1 = draw();
      const e2 = 0.5 * e1 + Math.sqrt(0.75) * draw();
      z[0].push(c[0] + A[0][0] * z[0][t - 1] + A[0][1] * z[1][t - 1] + e1);
      z[1].push(c[1] + A[1][0] * z[0][t - 1] + A[1][1] * z[1][t - 1] + e2);
    }
    const fit = fitVAR1(z);
    fit.A.flat().forEach((a, i) => expect(a).toBeCloseTo(A.flat()[i], 1));
    // (I − A)^(-1) c = [0.9, 1.2] / 0.33.
    expect(fit.mean[0]).toBeCloseTo(0.9 / 0.33, 1);
    expect(fit.mean[1]).toBeCloseTo(1.2 / 0.33, 1);
    expect(fit.residualCovariance[0][1]).toBeCloseTo(0.5, 1);
    expect(fit.residualCovariance[1][1]).toBeCloseTo(1, 1);
    expect(fit.standardErrors[0][0]).toBeGreaterThan(0);
  });

  test('forecast mean + A^k (z_t − mean)', () => {
    const fit = { A, mean: [0, 0] };
    expect(forecastVAR1(fit, [1, 1], 0)).toEqual([1, 1]);
    // A² = [0.27 0.08; 0.16 0.11].
    const two = forecastVAR1(fit, [1, 1], 2);
    expect(two[0]).toBeCloseTo(0.35, 14);
    expect(two[1]).toBeCloseTo(0.27, 14);
    const shifted = forecastVAR1({ A, mean: [10, 20] }, [11, 21], 2);
    expect(shifted[0]).toBeCloseTo(10.35, 12);
    expect(shifted[1]).toBeCloseTo(20.27, 12);
    expect(() => forecastVAR1(fit, [1], 1)).toThrow(RangeError);
  });

  test('bad inputs throw', () => {
    expect(() => fitVAR1([])).toThrow(RangeError);
    expect(() => fitVAR1([[1, 2, 3, 4], [1, 2, 3]])).toThrow(RangeError);
  });
});
