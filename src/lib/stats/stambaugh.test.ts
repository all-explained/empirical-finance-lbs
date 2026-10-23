import { describe, expect, it } from 'vitest';
import { fitAR1, predictiveRegression, simulatePredictive } from '../finance/predictive';
import { arithmeticMean, sampleVariance } from '../finance/returns';
import { invCdf } from '../math/normal';
import { mulberry32 } from '../math/rng';
import {
  biasCorrectedSlope, kendallBias, predictiveSystem, quantile, rejectionRate,
  simulateSlopes, stambaughBias, upperCriticalValue,
} from './stambaugh';

describe('first-order bias formulas', () => {
  it('match hand values', () => {
    // -(1 + 3 * 0.9) / 100 = -0.037; -(1 + 0) / 50 = -0.02.
    expect(kendallBias(0.9, 100)).toBeCloseTo(-0.037, 15);
    expect(kendallBias(0, 50)).toBeCloseTo(-0.02, 15);
    // (-0.5 / 1) * -0.037 = 0.0185; (0.02 / 0.04) * -0.037 = -0.0185.
    expect(stambaughBias(-0.5, 1, 0.9, 100)).toBeCloseTo(0.0185, 15);
    expect(stambaughBias(0.02, 0.04, 0.9, 100)).toBeCloseTo(-0.0185, 15);
    expect(stambaughBias(0, 1, 0.9, 100)).toBeCloseTo(0, 15);
    // 0.1 - 0.0185 = 0.0815.
    expect(biasCorrectedSlope(0.1, 0.9, -0.5, 1, 100)).toBeCloseTo(0.0815, 15);
  });
});

describe('predictiveSystem', () => {
  it('recovers slopes and residual covariances of a built series', () => {
    // x cycles 1, 0, -1, 0, so on the 8 pairs (x[t], x[t+1]) the AR(1) fit is phi = 0,
    // intercept 0 and v = x[t+1] = [0,-1,0,1,0,-1,0,1]. With w = [1,-1,1,-1,...], which is
    // orthogonal to 1, x[t] and v, set u = v + w and r[t+1] = 2 + 0.5 x[t] + u.
    // Then bHat = 0.5; sigmaV2 = 4/6, sigmaUV = 4/6, sigmaUU = (4 + 8)/6 = 2 (divisor T - 2 = 6);
    // corr = (2/3)/sqrt(2 * 2/3) = 1/sqrt(3); se(bHat) = sqrt(2 / sum x[t]² = 4), tStat = 0.5/sqrt(0.5).
    const x = [1, 0, -1, 0, 1, 0, -1, 0, 1];
    const r = [100, 3.5, 0, 2.5, 2, 3.5, 0, 2.5, 2];
    const fit = predictiveSystem(r, x);
    expect(fit.T).toBe(8);
    expect(fit.bHat).toBeCloseTo(0.5, 12);
    expect(fit.tStat).toBeCloseTo(Math.sqrt(0.5), 12);
    expect(fit.phiHat).toBeCloseTo(0, 12);
    expect(fit.sigmaV2).toBeCloseTo(2 / 3, 12);
    expect(fit.sigmaUV).toBeCloseTo(2 / 3, 12);
    expect(fit.sigmaUU).toBeCloseTo(2, 12);
    expect(fit.corr).toBeCloseTo(1 / Math.sqrt(3), 12);
    // r[0] is never used.
    expect(predictiveSystem([-7, ...r.slice(1)], x)).toEqual(fit);
  });
});

describe('quantiles and test size', () => {
  it('match hand values', () => {
    // Type 7 on [1..5]: h = 4p; p = 0.1 -> 1 + 0.4 * (2 - 1) = 1.4.
    const values = Object.freeze([5, 3, 1, 4, 2]);
    expect(quantile(values, 0)).toBe(1);
    expect(quantile(values, 0.1)).toBeCloseTo(1.4, 15);
    expect(quantile(values, 0.25)).toBe(2);
    expect(quantile(values, 0.5)).toBe(3);
    expect(quantile(values, 1)).toBe(5);
    expect(quantile([7], 0.3)).toBe(7);
    expect(values).toEqual([5, 3, 1, 4, 2]);
    // Upper 10% of [1..5] is the 0.9 quantile: 1 + 3.6 = 4.6; 2 of 5 exceed 3.
    expect(upperCriticalValue(values, 0.1)).toBeCloseTo(4.6, 15);
    expect(rejectionRate(values, 3)).toBe(0.4);
    expect(rejectionRate(values, 5)).toBe(0);
    expect(() => quantile([], 0.5)).toThrow(RangeError);
    expect(() => quantile([1], 1.5)).toThrow(RangeError);
    expect(() => quantile([1], NaN)).toThrow(RangeError);
  });
});

describe('simulateSlopes', () => {
  const nominal = invCdf(0.95); // one-sided 5% normal critical value, 1.645

  it('is centred on zero when the shocks are uncorrelated', () => {
    const bHat = simulateSlopes({ T: 100, phi: 0.98, corr: 0, samples: 2000, seed: 7 }).map((s) => s.bHat);
    const mcse = Math.sqrt(sampleVariance(bHat) / bHat.length);
    expect(Math.abs(arithmeticMean(bHat))).toBeLessThan(2 * mcse);
  });

  it('shows the Stambaugh bias and over-rejection with a persistent predictor', () => {
    const phi = 0.98;
    const corr = -0.9;
    const T = 100;
    const draws = simulateSlopes({ T, phi, corr, samples: 2000, seed: 7 });
    const bHat = draws.map((s) => s.bHat);
    const tStats = draws.map((s) => s.tStat);
    // simulatePredictive defaults: sigma_u = 0.045 sqrt(0.99), sigma_v = sqrt(1 - phi²).
    const sigmaU = 0.045 * Math.sqrt(0.99);
    const sigmaV = Math.sqrt(1 - phi * phi);
    const theory = stambaughBias(corr * sigmaU * sigmaV, sigmaV * sigmaV, phi, T); // 0.00798
    const mean = arithmeticMean(bHat); // 0.00916 at seed 7
    expect(mean).toBeGreaterThan(0);
    // First order understates the bias near a unit root, and the intercept adds to it:
    // mean phiHat - phi is -0.045 here, against Kendall's -0.039. Tolerance: 20% of the theory.
    expect(Math.abs(mean - theory)).toBeLessThan(0.2 * theory);
    // The exact identity bHat - b = (sigmaUV/sigmaV2)(phiHat - phi) + noise ties the two means closely.
    const phiBias = arithmeticMean(draws.map((s) => s.phiHat)) - phi;
    expect(mean).toBeCloseTo(corr * sigmaU / sigmaV * phiBias, 3);
    // Nominal 5% rejects 23% here; the simulated critical value is 2.53.
    expect(rejectionRate(tStats, nominal)).toBeGreaterThan(0.15);
    expect(upperCriticalValue(tStats, 0.05)).toBeGreaterThan(2.2);
    expect(rejectionRate(tStats, upperCriticalValue(tStats, 0.05))).toBeCloseTo(0.05, 2);
  });

  it('reuses the same shocks for every phi, corr and T', () => {
    const options = { T: 60, phi: 0.9, corr: -0.5, samples: 20, seed: 3 };
    const draws = simulateSlopes(options);
    expect(simulateSlopes(options)).toEqual(draws);
    expect(simulateSlopes({ ...options, seed: 4 })).not.toEqual(draws);
    // Sample 0 uses the first derived seed, whatever phi, corr and T are.
    const sampleSeed = Math.floor(mulberry32(3)() * 2 ** 32);
    for (const [phi, corr, T] of [[0.9, -0.5, 60], [0.5, 0.3, 200]]) {
      const { r, x } = simulatePredictive({ T: T + 1, b1: 0, phi, corr, seed: sampleSeed });
      const [first] = simulateSlopes({ ...options, phi, corr, T });
      expect(first).toEqual({
        bHat: predictiveRegression(r, x, 1, { errors: 'classical' }).slope,
        tStat: predictiveRegression(r, x, 1, { errors: 'classical' }).tStat,
        phiHat: fitAR1(x).phi,
      });
    }
    // A small step in corr moves the same samples a little: slopes stay almost perfectly correlated.
    const a = simulateSlopes({ ...options, samples: 200 }).map((s) => s.bHat);
    const b = simulateSlopes({ ...options, samples: 200, corr: -0.6 }).map((s) => s.bHat);
    const ma = arithmeticMean(a);
    const mb = arithmeticMean(b);
    const cov = arithmeticMean(a.map((v, i) => (v - ma) * (b[i] - mb)));
    const corrAB = cov / Math.sqrt(arithmeticMean(a.map((v) => (v - ma) ** 2)) * arithmeticMean(b.map((v) => (v - mb) ** 2)));
    expect(corrAB).toBeGreaterThan(0.95);
  });

  it('rejects an invalid sample count', () => {
    expect(() => simulateSlopes({ T: 50, phi: 0.9, corr: 0, samples: 0, seed: 1 })).toThrow(RangeError);
  });
});
