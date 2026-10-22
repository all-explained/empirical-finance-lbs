import { describe, expect, it } from 'vitest';
import { forwardSums, simulatePredictive } from '../finance/predictive';
import { autocorrelations, bartlettWeights, overlapCorrelation, overlapMeanVariance } from './autocorr';
import { ols } from './ols';

describe('autocorrelations', () => {
  it('matches a hand computation', () => {
    // x = 1..5: deviations -2,-1,0,1,2 with sum of squares 10.
    // Lag 1: 2+0+0+2 = 4; lag 2: 0-1+0 = -1; lag 3: -2-2 = -4; lag 4: -4.
    const rho = autocorrelations([1, 2, 3, 4, 5], 4);
    [1, 0.4, -0.1, -0.4, -0.4].forEach((value, j) => expect(rho[j]).toBeCloseTo(value, 14));
  });

  it('rejects bad input', () => {
    expect(() => autocorrelations([1, 2, 3], 3)).toThrow(RangeError);
    expect(() => autocorrelations([1, 2, 3], -1)).toThrow(RangeError);
    expect(() => autocorrelations([2, 2, 2], 1)).toThrow(RangeError);
    expect(() => autocorrelations([1, NaN, 3], 1)).toThrow(RangeError);
  });

  it('recovers the 1 - j/k triangle of overlapping sums of i.i.d. shocks', () => {
    const { r } = simulatePredictive({ T: 40000, b1: 0, sigmaR: 0.045, seed: 7 });
    const rho = autocorrelations(forwardSums(r, 12), 14);
    for (let j = 0; j <= 14; j++) expect(Math.abs(rho[j] - overlapCorrelation(12, j))).toBeLessThan(0.03);
  });
});

describe('bartlettWeights', () => {
  it('falls linearly from one', () => {
    expect(bartlettWeights(0)).toEqual([1]);
    expect(bartlettWeights(3)).toEqual([1, 0.75, 0.5, 0.25]);
    expect(() => bartlettWeights(-1)).toThrow(RangeError);
    expect(() => bartlettWeights(1.5)).toThrow(RangeError);
  });

  it('reproduces the Newey–West variance of a mean from ols', () => {
    // With x_t = 1: Var = (sum u²/T²)(1 + 2 sum_{j=1}^L w_j rho_j).
    const y = forwardSums(simulatePredictive({ T: 300, b1: 0, sigmaR: 0.045, seed: 3 }).r, 6);
    const T = y.length;
    const mean = y.reduce((s, v) => s + v, 0) / T;
    const sumSq = y.reduce((s, v) => s + (v - mean) ** 2, 0);
    for (const L of [0, 1, 5, 12]) {
      const rho = autocorrelations(y, L);
      const w = bartlettWeights(L);
      const longRun = 1 + 2 * rho.slice(1).reduce((s, value, i) => s + w[i + 1] * value, 0);
      const fit = ols(y, [], { errors: 'newey-west', lags: L });
      expect(fit.standardErrors[0] ** 2).toBeCloseTo((sumSq / T ** 2) * longRun, 14);
    }
  });
});

describe('overlapCorrelation', () => {
  it('counts shared periods', () => {
    expect(overlapCorrelation(12, 0)).toBe(1);
    expect(overlapCorrelation(12, 1)).toBeCloseTo(11 / 12, 15);
    expect(overlapCorrelation(12, -3)).toBeCloseTo(9 / 12, 15);
    expect(overlapCorrelation(12, 12)).toBe(0);
    expect(overlapCorrelation(12, 20)).toBe(0);
    expect(overlapCorrelation(1, 1)).toBe(0);
    expect(() => overlapCorrelation(0, 1)).toThrow(RangeError);
    expect(() => overlapCorrelation(12, 0.5)).toThrow(RangeError);
  });
});

describe('overlapMeanVariance', () => {
  it('matches hand cases and the k² limit', () => {
    expect(overlapMeanVariance(1, 10, 2)).toBeCloseTo(0.2, 15); // sigma2/n
    // n = 2 sums of k = 2: mean = (e1 + 2 e2 + e3)/2, variance (1 + 4 + 1)/4 = 1.5.
    expect(overlapMeanVariance(2, 2, 1)).toBeCloseTo(1.5, 15);
    // n = 1: one k-sum has variance k sigma2.
    expect(overlapMeanVariance(12, 1, 1)).toBe(12);
    expect(overlapMeanVariance(12, 1e6, 1) * 1e6 / 144).toBeCloseTo(1, 4);
    expect(() => overlapMeanVariance(0, 5, 1)).toThrow(RangeError);
    expect(() => overlapMeanVariance(3, 5, -1)).toThrow(RangeError);
  });

  it('agrees with a Monte Carlo of seeded samples', () => {
    const means = Array.from({ length: 400 }, (_, seed) => {
      const y = forwardSums(simulatePredictive({ T: 60, b1: 0, sigmaR: 1, seed: seed + 1 }).r, 6);
      return y.reduce((s, v) => s + v, 0) / y.length;
    });
    const m = means.reduce((s, v) => s + v, 0) / means.length;
    const v = means.reduce((s, x) => s + (x - m) ** 2, 0) / (means.length - 1);
    // forwardSums(r, 6) on 60 draws gives n = 54 sums; Monte Carlo error is about 7% with 400 draws.
    expect(v / overlapMeanVariance(6, 54, 1)).toBeGreaterThan(0.8);
    expect(v / overlapMeanVariance(6, 54, 1)).toBeLessThan(1.2);
  });
});
