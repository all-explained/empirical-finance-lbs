import { describe, expect, it } from 'vitest';
import { chiSquareSurvival } from '../math/distributions';
import { inverse, matMul, solve, symmetricEigen, transpose } from '../math/linalg';
import { normalRng } from '../math/rng';
import {
  gmm,
  gmmObjective,
  linearGmm,
  longRunCovariance,
  objectiveSurface,
  simulateJTest,
  simulateToySample,
  TOY_MEAN,
  TOY_VARIANCE,
  toyMoments,
  type GMMMethod,
} from './gmm';
import { excessKurtosis } from './moments';
import { ols } from './ols';

const METHODS: GMMMethod[] = ['one-step', 'two-step', 'iterated', 'cue'];

// A seeded regression world with serially correlated errors and two instruments for one endogenous regressor.
const T = 200;
const z = normalRng(11);
const z1 = Array.from({ length: T }, () => z());
const z2 = Array.from({ length: T }, () => z());
const u: number[] = [];
for (let t = 0; t < T; t++) u.push(0.5 * (u[t - 1] ?? 0) + z());
const x = z1.map((value, t) => 0.8 * value + 0.4 * z2[t] + 0.5 * u[t] + 0.3 * z());
const y = x.map((value, t) => 1 + 2 * value + u[t]);

// Moment matrices with rows w_t(y_t - x_t'θ) for instruments w_t and regressors x_t = (1, x_t).
const linearMoments = (instruments: number[][]) => (theta: number[]) =>
  y.map((value, t) => {
    const e = value - theta[0] - theta[1] * x[t];
    return instruments.map((column) => column[t] * e);
  });
const ones = y.map(() => 1);
const crossProduct = (A: number[][], B: number[][]) => A.map((a) => B.map((b) => a.reduce((s, v, t) => s + v * b[t], 0) / T));

describe('longRunCovariance', () => {
  it('matches hand-made cases', () => {
    // Scalar 1, 2, 3, 4 demeaned: Γ0 = 1.25, Γ1 = (0.75 - 0.25 + 0.75)/4 = 0.3125; S = 1.25 + (1/2)(2 · 0.3125).
    expect(longRunCovariance([[1], [2], [3], [4]], { lags: 1 })[0][0]).toBeCloseTo(1.5625, 14);
    // Rows (1, 0), (0, 1), (1, 0), not demeaned: Γ0 = diag(2, 1)/3, Γ1 + Γ1' = [[0, 2], [2, 0]]/3, weight 1/2.
    const S = longRunCovariance([[1, 0], [0, 1], [1, 0]], { lags: 1, demean: false });
    [[2 / 3, 1 / 3], [1 / 3, 1 / 3]].forEach((row, i) => row.forEach((v, j) => expect(S[i][j]).toBeCloseTo(v, 14)));
    const S0 = longRunCovariance([[1, 0], [0, 1], [1, 0]], { demean: false });
    [[2 / 3, 0], [0, 1 / 3]].forEach((row, i) => row.forEach((v, j) => expect(S0[i][j]).toBeCloseTo(v, 14)));
  });

  it('gives the Newey–West covariance inside ols: Var(β̂) = T (X\'X)⁻¹ Ŝ (X\'X)⁻¹ with Ŝ of x_t ε̂_t', () => {
    const fit = ols(y, [x], { errors: 'newey-west', lags: 4 });
    const S = longRunCovariance(fit.residuals.map((e, t) => [e, x[t] * e]), { lags: 4, demean: false });
    const XtXinv = inverse(crossProduct([ones, x], [ones, x]).map((row) => row.map((v) => v * T)));
    const covariance = matMul(matMul(XtXinv, S), XtXinv).map((row) => row.map((v) => v * T));
    covariance.forEach((row, i) => row.forEach((v, j) => expect(v / fit.covariance[i][j]).toBeCloseTo(1, 12)));
  });
});

describe('gmmObjective', () => {
  it("is g'Wg: g = (1, 2), W = [[2, 1], [1, 3]] gives 2 + 2·2 + 12 = 18", () => {
    expect(gmmObjective([1, 2], [[2, 1], [1, 3]])).toBe(18);
  });
});

describe('linearGmm', () => {
  it("gives just-identified IV, (Z'X)⁻¹Z'y", () => {
    const Z = [ones, z1];
    const theta = linearGmm(crossProduct(Z, [y]).map((r) => r[0]), crossProduct(Z, [ones, x]), [[1, 0], [0, 1]]);
    const iv = solve(crossProduct(Z, [ones, x]), crossProduct(Z, [y]).map((r) => r[0]));
    theta.forEach((v, i) => expect(v).toBeCloseTo(iv[i], 12));
  });

  it("gives two-stage least squares with W = (Z'Z/T)⁻¹", () => {
    const Z = [ones, z1, z2];
    const theta = linearGmm(crossProduct(Z, [y]).map((r) => r[0]), crossProduct(Z, [ones, x]), inverse(crossProduct(Z, Z)));
    const firstStage = ols(x, [z1, z2]).fitted;
    const tsls = ols(y, [firstStage]).coefficients;
    theta.forEach((v, i) => expect(v).toBeCloseTo(tsls[i], 11));
  });
});

describe('gmm', () => {
  it('reproduces ols() coefficients and Newey–West standard errors to 1e-8 on the moments x_t(y_t - x_t\'θ)', () => {
    const fit = ols(y, [x], { errors: 'newey-west', lags: 3 });
    for (const method of METHODS) {
      for (const linear of [true, false]) {
        const result = gmm(linearMoments([ones, x]), [0, 0], { method, lags: 3, linear });
        result.theta.forEach((v, i) => expect(Math.abs(v - fit.coefficients[i])).toBeLessThan(1e-8));
        result.standardErrors.forEach((v, i) => expect(Math.abs(v - fit.standardErrors[i])).toBeLessThan(1e-8));
        expect(result).toMatchObject({ df: 0, J: null, pValue: null, converged: true, nobs: T });
      }
    }
  });

  it("gives (Z'X)⁻¹Z'y for just-identified IV and 2SLS for one-step over-identified IV with W = (Z'Z/T)⁻¹", () => {
    const iv = solve(crossProduct([ones, z1], [ones, x]), crossProduct([ones, z1], [y]).map((r) => r[0]));
    gmm(linearMoments([ones, z1]), [0, 0], { linear: true }).theta.forEach((v, i) => expect(v).toBeCloseTo(iv[i], 10));
    const Z = [ones, z1, z2];
    const tsls = ols(y, [ols(x, [z1, z2]).fitted]).coefficients;
    for (const linear of [true, false]) {
      const result = gmm(linearMoments(Z), [0, 0], { method: 'one-step', weighting: inverse(crossProduct(Z, Z)), linear });
      result.theta.forEach((v, i) => expect(Math.abs(v - tsls[i])).toBeLessThan(1e-8));
      expect(result).toMatchObject({ df: 1, J: null, pValue: null });
    }
  });

  it('gives J = T × the minimised objective with its χ² p-value, and the efficient covariance (1/T)(D\'WD)⁻¹', () => {
    for (const method of ['two-step', 'iterated', 'cue'] as const) {
      const result = gmm(linearMoments([ones, z1, z2]), [0, 0], { method, linear: method !== 'cue' });
      expect(result.df).toBe(1);
      expect(result.J).toBeCloseTo(T * gmmObjective(result.gT, result.W), 12);
      expect(result.pValue).toBeCloseTo(chiSquareSurvival(result.J as number, 1), 14);
      expect(result.W.flat().map((v, k) => v - inverse(result.S).flat()[k]).every((d) => Math.abs(d) < 1e-9)).toBe(true);
      const D = result.D;
      const efficient = inverse(matMul(matMul(transpose(D), result.W), D)).map((row) => row.map((v) => v / T));
      result.covariance.forEach((row, i) => row.forEach((v, j) => expect(v).toBeCloseTo(efficient[i][j], 14)));
      // The moments are linear: the Jacobian is -E_T[w_t x_t'].
      const exact = crossProduct([ones, z1, z2], [ones, x]);
      D.forEach((row, i) => row.forEach((v, j) => expect(v).toBeCloseTo(-exact[i][j], 9)));
    }
  });

  it('stops iterated GMM when the estimate settles', () => {
    const result = gmm(linearMoments([ones, z1, z2]), [0, 0], { method: 'iterated', lags: 2, linear: true });
    expect(result.converged).toBe(true);
    expect(result.iterations).toBeGreaterThan(2);
    expect(gmm(linearMoments([ones, z1, z2]), [0, 0], { method: 'iterated', lags: 2, linear: true, maxIter: 2 }))
      .toMatchObject({ iterations: 2, converged: false });
  });

  it('gives the sample mean and the divisor-T variance (the normal ML estimates) from toyMoments with count 2, under every method', () => {
    const sample = simulateToySample(5, { T: 300 });
    const mean = sample.reduce((s, v) => s + v, 0) / sample.length;
    const variance = sample.reduce((s, v) => s + (v - mean) ** 2, 0) / sample.length;
    for (const method of METHODS) {
      const result = gmm(toyMoments(sample, 2), [0, 0.5], { method });
      expect(Math.abs(result.theta[0] - mean)).toBeLessThan(1e-8);
      expect(Math.abs(result.theta[1] - variance)).toBeLessThan(1e-8);
    }
  });

  it('gives an efficient covariance no larger than the identity-weighted one (the difference is positive semi-definite)', () => {
    const sample = simulateToySample(8, { T: 500, tails: 'fat' });
    const identityWeighted = gmm(toyMoments(sample, 4), [0.4, 1.1], { method: 'one-step' }).covariance;
    const efficient = gmm(toyMoments(sample, 4), [0.4, 1.1], { method: 'two-step' }).covariance;
    const gap = identityWeighted.map((row, i) => row.map((v, j) => v - efficient[i][j]));
    expect(Math.min(...symmetricEigen(gap).values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...symmetricEigen(gap).values)).toBeGreaterThan(0);
  });

  it('rejects too few moments, an unknown method and a weighting of the wrong size', () => {
    expect(() => gmm(linearMoments([ones]), [0, 0])).toThrow('at least as many moments');
    expect(() => gmm(linearMoments([ones, x]), [0, 0], { method: 'ml' as GMMMethod })).toThrow('unknown method');
    expect(() => gmm(linearMoments([ones, x]), [0, 0], { weighting: [[1]] })).toThrow('L × L');
    expect(() => gmm(linearMoments([ones, x]), [0, 0], { method: 'iterated', maxIter: 1 })).toThrow('maxIter');
  });
});

describe('objectiveSurface', () => {
  it("gives g_T'Wg_T at every grid point, smallest at the sample mean and variance for count 2", () => {
    const sample = simulateToySample(3, { T: 200 });
    const moments = toyMoments(sample, 2);
    const W = [[1, 0], [0, 1]];
    const grid1 = [0.3, 0.4, 0.5, 0.6, 0.7];
    const grid2 = [0.8, 0.9, 1, 1.1, 1.2];
    const surface = objectiveSurface(moments, W, grid1, grid2);
    expect(surface.length).toBe(5);
    const g = (theta: number[]) => moments(theta)[0].map((_, i) => moments(theta).reduce((s, row) => s + row[i], 0) / sample.length);
    expect(surface[1][3]).toBeCloseTo(gmmObjective(g([0.4, 1.1]), W), 14);
    const best = surface.flat().indexOf(Math.min(...surface.flat()));
    const theta = gmm(moments, [0.5, 1], { method: 'one-step' }).theta;
    expect(Math.abs(grid1[Math.floor(best / 5)] - theta[0])).toBeLessThanOrEqual(0.05);
    expect(Math.abs(grid2[best % 5] - theta[1])).toBeLessThanOrEqual(0.05);
  });
});

describe('simulateToySample and toyMoments', () => {
  it('draws the same sample for the same seed', () => {
    expect(simulateToySample(42, { T: 50, tails: 'fat' })).toEqual(simulateToySample(42, { T: 50, tails: 'fat' }));
    expect(simulateToySample(42, { T: 50 })).not.toEqual(simulateToySample(43, { T: 50 }));
  });

  it('has mean 0.5, variance 1 and, with fat tails, excess kurtosis 9.75 - 3 = 6.75 (within 4 standard errors at T = 200000)', () => {
    for (const tails of ['normal', 'fat'] as const) {
      const sample = simulateToySample(1, { T: 200000, tails });
      const mean = sample.reduce((s, v) => s + v, 0) / sample.length;
      const variance = sample.reduce((s, v) => s + (v - mean) ** 2, 0) / sample.length;
      // Standard errors: √(1/T) ≈ 0.0022 for the mean; √((κ - 1)/T) ≤ 0.0066 for the variance.
      expect(Math.abs(mean - TOY_MEAN)).toBeLessThan(0.009);
      expect(Math.abs(variance - TOY_VARIANCE)).toBeLessThan(0.027);
      expect(Math.abs(excessKurtosis(sample) - (tails === 'fat' ? 6.75 : 0))).toBeLessThan(tails === 'fat' ? 0.6 : 0.05);
    }
  });

  it('gives the four moment conditions at a hand-made point: x = 2, θ = (0.5, 1) → (1.5, 1.25, 3.375, 2.0625)', () => {
    expect(toyMoments([2], 4)([0.5, 1])).toEqual([[1.5, 1.25, 3.375, 2.0625]]);
    expect(toyMoments([2], 2)([0.5, 1])).toEqual([[1.5, 1.25]]);
  });
});

describe('simulateJTest', () => {
  it('gives the same output for the same seed', () => {
    const options = { T: 60, samples: 20, count: 4 } as const;
    expect(simulateJTest(9, options)).toEqual(simulateJTest(9, options));
    expect(simulateJTest(9, options).J).toHaveLength(20);
  });

  it('rejects about 5% of correct models with normal tails at T = 500 (400 samples, count 3, two-step)', () => {
    // Simulation standard error √(0.05 · 0.95/400) ≈ 0.011; the band is 5% ± 3 standard errors.
    const { rejectionRate, df, J } = simulateJTest(1, { T: 500, samples: 400, count: 3 });
    expect(df).toBe(1);
    expect(rejectionRate).toBe(J.filter((v) => v > 3.8414588206941205).length / 400);
    expect(Math.abs(rejectionRate - 0.05)).toBeLessThan(0.033);
  });
});
