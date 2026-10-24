import { describe, expect, it } from 'vitest';
import { inverse, matMul, solve, symmetricEigen, transpose } from '../math/linalg';
import { normalRng } from '../math/rng';
import {
  TOY_MEAN, TOY_VARIANCE, gmm, gmmObjective, linearGmm, longRunCovariance, objectiveSurface, simulateJTest,
  simulateToySample, toyMoments,
} from './gmm';
import { ols, serialCovariance } from './ols';

// Hand-made moments with zero column means: Γ̂₀ = [[1.5, 1.25], [1.25, 1.5]], Γ̂₁ + Γ̂₁' = [[-1, -0.5], [-0.5, -0.5]].
const U = [[1, 0], [0, 1], [1, 1], [-2, -2]];

function expectMatrixClose(actual: number[][], expected: number[][], digits: number) {
  actual.forEach((row, i) => row.forEach((value, j) => expect(value).toBeCloseTo(expected[i][j], digits)));
}

function minEigenvalue(A: number[][]): number {
  return Math.min(...symmetricEigen(A).values);
}

// y_t = 0.5 + 1.2 x_t + e_t with AR(1) x and e, and an instrument z2 correlated with x; seeded.
function regressionSample(T: number) {
  const z = normalRng(85);
  const x: number[] = [];
  const e: number[] = [];
  const z1: number[] = [];
  const z2: number[] = [];
  for (let t = 0; t < T; t++) {
    z1.push(z());
    z2.push(z());
    x.push((t ? 0.5 * x[t - 1] : 0) + 0.8 * z1[t] + 0.4 * z2[t] + 0.3 * z());
    e.push((t ? 0.4 * e[t - 1] : 0) + z() + 0.5 * (x[t] - 0.8 * z1[t] - 0.4 * z2[t]));
  }
  const y = x.map((value, t) => 0.5 + 1.2 * value + e[t]);
  return { y, x, z1, z2 };
}

// Moments z_t (y_t - x_t'θ) for instrument rows z_t and regressor rows x_t (OLS when z = x).
function ivMoments(y: number[], X: number[][], Z: number[][]) {
  return (theta: readonly number[]) => y.map((value, t) => {
    const residual = value - X[t].reduce((sum, v, k) => sum + v * theta[k], 0);
    return Z[t].map((v) => v * residual);
  });
}

describe('serialCovariance (exported from ols)', () => {
  it('sums the hand-made products with Bartlett or flat weights, with no divisor', () => {
    // T Ŝ with lag 1: 4([[1.5, 1.25], [1.25, 1.5]] + 1/2 [[-1, -0.5], [-0.5, -0.5]]) = [[4, 4], [4, 5]].
    expectMatrixClose(serialCovariance(U, 1, true), [[4, 4], [4, 5]], 14);
    // Flat (Hansen–Hodrick) weight 1: [[6, 5], [5, 6]] + [[-4, -2], [-2, -2]].
    expectMatrixClose(serialCovariance(U, 1, false), [[2, 3], [3, 4]], 14);
  });
});

describe('longRunCovariance', () => {
  it('matches the hand-made case with 0 and 1 lags', () => {
    expectMatrixClose(longRunCovariance(U), [[1.5, 1.25], [1.25, 1.5]], 14);
    expectMatrixClose(longRunCovariance(U, { lags: 1 }), [[1, 1], [1, 1.25]], 14);
    // One column: x = (1, -1, 2, -2), Γ̂₀ = 2.5, Γ̂₁ = -7/4, Ŝ = 2.5 + (1/2)(2)(-7/4) = 0.75.
    expect(longRunCovariance([[1], [-1], [2], [-2]], { lags: 1 })[0][0]).toBeCloseTo(0.75, 14);
  });

  it('removes column means unless demean is false', () => {
    const shifted = U.map(([a, b]) => [a + 3, b - 1]);
    expectMatrixClose(longRunCovariance(shifted, { lags: 1 }), [[1, 1], [1, 1.25]], 13);
    // Without demeaning, Γ̂₀ gains the outer product of the means, (3, -1)(3, -1)'.
    expectMatrixClose(longRunCovariance(shifted, { demean: false }), [[10.5, -1.75], [-1.75, 2.5]], 13);
  });

  it('equals the Newey–West covariance inside ols: (X\'X)⁻¹ T Ŝ (X\'X)⁻¹ with scores x_t ε̂_t', () => {
    const { y, x } = regressionSample(300);
    const fit = ols(y, [x], { errors: 'newey-west', lags: 4 });
    const X = x.map((value) => [1, value]);
    const scores = X.map((row, t) => row.map((v) => v * fit.residuals[t]));
    const S = longRunCovariance(scores, { lags: 4, demean: false });
    const XtXinv = inverse(matMul(transpose(X), X));
    const expected = matMul(matMul(XtXinv, S.map((row) => row.map((v) => v * y.length))), XtXinv);
    expectMatrixClose(fit.covariance, expected, 14);
  });

  it('rejects a lag length outside 0 to T - 1', () => {
    expect(() => longRunCovariance(U, { lags: 4 })).toThrow(RangeError);
  });
});

describe('gmmObjective, linearGmm and objectiveSurface', () => {
  it('gmmObjective: g = (1, 2), W = [[2, 1], [1, 3]] gives 2 + 4 + 12 = 18', () => {
    expect(gmmObjective([1, 2], [[2, 1], [1, 3]])).toBe(18);
  });

  it('linearGmm: a just-identified system solves D θ = a; with W = I it is least squares', () => {
    // D = [[2, 1], [1, 3]], a = (3, 5): θ = (0.8, 1.4).
    const theta = linearGmm([3, 5], [[2, 1], [1, 3]], [[1, 0], [0, 1]]);
    expect(theta[0]).toBeCloseTo(0.8, 14);
    expect(theta[1]).toBeCloseTo(1.4, 14);
    // One parameter, a = (1, 2, 4), D = (1, 1, 1), W = I: the mean 7/3.
    expect(linearGmm([1, 2, 4], [[1], [1], [1]], [[1, 0, 0], [0, 1, 0], [0, 0, 1]])[0]).toBeCloseTo(7 / 3, 14);
  });

  it('objectiveSurface: the toy objective of x = (1, 2, 3, 6), count 2, W = I, worked by hand', () => {
    // (μ, σ²) = (2, 3): g = (1, 1.5) → 3.25; (2, 4): (1, 0.5) → 1.25; (3, 3): (0, 0.5) → 0.25; (3, 4): (0, -0.5) → 0.25.
    const surface = objectiveSurface(toyMoments([1, 2, 3, 6], 2), [[1, 0], [0, 1]], [2, 3], [3, 4]);
    expectMatrixClose(surface, [[3.25, 1.25], [0.25, 0.25]], 14);
  });
});

describe('toyMoments and simulateToySample', () => {
  it('toyMoments: the rows of x = (1, 2, 3, 6) at θ = (2, 3), worked by hand', () => {
    // x - μ = (-1, 0, 1, 4); (x - μ)² - 3; (x - μ)³; (x - μ)⁴ - 3·9.
    expect(toyMoments([1, 2, 3, 6], 4)([2, 3])).toEqual([[-1, -2, -1, -26], [0, -3, 0, -27], [1, -2, 1, -26], [4, 13, 64, 229]]);
    expect(toyMoments([1, 2, 3, 6], 2)([2, 3])[3]).toEqual([4, 13]);
  });

  it('simulateToySample: mean 1 and variance 4 for both tails; kurtosis 3 and 9.75', () => {
    const T = 200000;
    for (const [tails, kurtosis] of [['normal', 3], ['fat', 9.75]] as const) {
      const x = simulateToySample(3, { T, tails });
      const mean = x.reduce((s, v) => s + v, 0) / T;
      const variance = x.reduce((s, v) => s + (v - mean) ** 2, 0) / T;
      const m4 = x.reduce((s, v) => s + (v - mean) ** 4, 0) / T;
      // Standard errors at T = 200000: mean 0.0045; variance 0.013 (normal) and 0.026 (fat); kurtosis 0.011 and 0.22.
      expect(Math.abs(mean - TOY_MEAN)).toBeLessThan(0.02);
      expect(Math.abs(variance - TOY_VARIANCE)).toBeLessThan(0.1);
      expect(Math.abs(m4 / variance ** 2 - kurtosis)).toBeLessThan(0.8);
    }
    expect(simulateToySample(3, { T: 5 })).toEqual(simulateToySample(3, { T: 5 }));
  });
});

describe('gmm', () => {
  it('on the OLS moments x_t(y_t - x_t\'θ) reproduces ols() and its Newey–West standard errors to 1e-8', () => {
    const { y, x } = regressionSample(300);
    const fit = ols(y, [x], { errors: 'newey-west', lags: 4 });
    const X = x.map((value) => [1, value]);
    for (const method of ['one-step', 'two-step'] as const) {
      const result = gmm(ivMoments(y, X, X), [0, 0], { method, lags: 4, linear: true });
      result.theta.forEach((value, k) => expect(Math.abs(value - fit.coefficients[k])).toBeLessThan(1e-8));
      result.standardErrors.forEach((value, k) => expect(Math.abs(value - fit.standardErrors[k])).toBeLessThan(1e-8));
      expect(result.J).toBeNull();
      expect(result.df).toBe(0);
    }
  });

  it('just-identified IV equals (Z\'X)⁻¹Z\'y', () => {
    const { y, x, z1 } = regressionSample(300);
    const X = x.map((value) => [1, value]);
    const Z = z1.map((value) => [1, value]);
    const expected = solve(matMul(transpose(Z), X), matMul(transpose(Z), y.map((v) => [v])).map((row) => row[0]));
    const result = gmm(ivMoments(y, X, Z), [0, 0], { method: 'one-step', linear: true });
    result.theta.forEach((value, k) => expect(value).toBeCloseTo(expected[k], 10));
  });

  it('over-identified IV with W = (Z\'Z/T)⁻¹ equals two-stage least squares', () => {
    const { y, x, z1, z2 } = regressionSample(300);
    const T = y.length;
    const X = x.map((value) => [1, value]);
    const Z = z1.map((value, t) => [1, value, z2[t]]);
    const W = inverse(matMul(transpose(Z), Z).map((row) => row.map((v) => v / T)));
    // 2SLS by two OLS passes: x on (1, z1, z2), then y on the fitted x.
    const tsls = ols(y, [ols(x, [z1, z2]).fitted]).coefficients;
    const result = gmm(ivMoments(y, X, Z), [0, 0], { method: 'one-step', weighting: W, linear: true });
    result.theta.forEach((value, k) => expect(value).toBeCloseTo(tsls[k], 10));
    expect(result.df).toBe(1);
    expect(result.J).toBeNull();
  });

  it('two-step J equals T g_T\'Ŝ⁻¹g_T with Ŝ at the first step, and its p-value is the chi-square tail', () => {
    const { y, x, z1, z2 } = regressionSample(300);
    const X = x.map((value) => [1, value]);
    const Z = z1.map((value, t) => [1, value, z2[t]]);
    const moments = ivMoments(y, X, Z);
    const first = gmm(moments, [0, 0], { method: 'one-step', linear: true });
    const second = gmm(moments, [0, 0], { method: 'two-step', linear: true });
    const S = longRunCovariance(moments(first.theta));
    expectMatrixClose(second.S, S, 12);
    expect(second.J).toBeCloseTo(300 * gmmObjective(second.gT, inverse(S)), 10);
    expect(second.pValue).toBeGreaterThan(0);
    // With W = Ŝ⁻¹ the sandwich collapses to the efficient form.
    expectMatrixClose(second.covariance, second.efficientCovariance, 12);
  });

  it('toyMoments with count 2 gives the sample mean and divisor-T variance (normal ML) under every method', () => {
    const x = simulateToySample(11, { T: 500 });
    const mean = x.reduce((s, v) => s + v, 0) / x.length;
    const variance = x.reduce((s, v) => s + (v - mean) ** 2, 0) / x.length;
    for (const method of ['one-step', 'two-step', 'iterated', 'cue'] as const) {
      const result = gmm(toyMoments(x, 2), [0, 1], { method });
      expect(Math.abs(result.theta[0] - mean)).toBeLessThan(1e-8);
      expect(Math.abs(result.theta[1] - variance)).toBeLessThan(1e-8);
      expect(result.J).toBeNull();
    }
  });

  it('efficient covariance is no larger than the identity-weighted one on a seeded sample', () => {
    const x = simulateToySample(12, { T: 2000 });
    const moments = toyMoments(x, 4);
    const identityFit = gmm(moments, [1, 4], { method: 'one-step' });
    const efficientFit = gmm(moments, [1, 4], { method: 'two-step' });
    const difference = (A: number[][], B: number[][]) => A.map((row, i) => row.map((v, j) => v - B[i][j]));
    // At the same D and Ŝ the gap is positive semi-definite by algebra; across the two fits, on this sample.
    expect(minEigenvalue(difference(identityFit.covariance, identityFit.efficientCovariance))).toBeGreaterThan(-1e-12);
    expect(minEigenvalue(difference(identityFit.covariance, efficientFit.covariance))).toBeGreaterThan(0);
    expect(identityFit.J).toBeNull();
    expect(efficientFit.df).toBe(2);
  });

  it('iterated GMM stops at a fixed point: one more step does not move θ', () => {
    const x = simulateToySample(13, { T: 1000 });
    const result = gmm(toyMoments(x, 3), [1, 4], { method: 'iterated' });
    expect(result.iterations).toBeLessThan(100);
    const again = gmm(toyMoments(x, 3), result.theta, { method: 'one-step', weighting: result.W });
    again.theta.forEach((value, k) => expect(value).toBeCloseTo(result.theta[k], 8));
  });
});

describe('simulateJTest', () => {
  it('gives the same output for the same seed', () => {
    const run = () => simulateJTest(5, { T: 100, samples: 5, method: 'cue' });
    expect(run()).toEqual(run());
    expect(run().df).toBe(1);
  });

  it('with normal tails and T = 1000, 400 samples reject at 5% within 3 simulation errors (5% ± 3.3%)', () => {
    // Standard error of a rejection rate of 0.05 over 400 samples: √(0.05·0.95/400) = 0.0109.
    const { rejectionRate, J } = simulateJTest(7, { T: 1000, samples: 400, method: 'two-step', tails: 'normal', count: 3 });
    expect(J).toHaveLength(400);
    expect(Math.abs(rejectionRate - 0.05)).toBeLessThan(0.033);
  }, 30000);

  it('rejects far more often with fat tails and the fourth-moment condition, which they violate', () => {
    expect(simulateJTest(7, { T: 200, samples: 200, tails: 'fat', count: 4 }).rejectionRate).toBeGreaterThan(0.15);
  }, 30000);
});
