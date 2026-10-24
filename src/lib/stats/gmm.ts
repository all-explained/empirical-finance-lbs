// The generalized method of moments: one-step, two-step, iterated and continuously updated estimates,
// their covariances and Hansen's J test, and the seeded toy model of Chapters 24 and 25.
// Every result here follows from the moment conditions E[g(x_t, θ0)] = 0 and a first-order expansion
// of g_T(θ) = (1/T) Σ_t g(x_t, θ) around θ0.
// Nagel (2013, NBER WP 18554), printed pp. 20–21: specification tests in the style of Hansen (1982), and the
// efficient weighting S⁻¹, which can put far more weight on some moments than the identity does.
import { chiSquareSurvival } from '../math/distributions';
import { identity, inverse, matMul, solve, transpose, type Matrix } from '../math/linalg';
import { minimize } from '../math/optimize';
import { mulberry32, normalRng } from '../math/rng';
import { serialCovariance } from './ols';

/** Returns the T × L matrix whose row t is g(x_t, θ)'. */
export type MomentFn = (theta: number[]) => number[][];
export type GMMMethod = 'one-step' | 'two-step' | 'iterated' | 'cue';

export interface GMMOptions {
  /** Defaults to 'two-step'. */
  method?: GMMMethod;
  /** The fixed weighting of 'one-step', and the first stage of the other methods. Defaults to 'identity'. */
  weighting?: 'identity' | Matrix;
  /** Newey–West lags in Ŝ. Defaults to zero. */
  lags?: number;
  /** The moments are linear in θ, g_T(θ) = a - Dθ: solve each stage in closed form with linearGmm. */
  linear?: boolean;
  /** 'iterated' stops when no parameter moves by more than tol (1 + |θ_i|). Defaults to 1e-8. */
  tol?: number;
  /** Cap on the estimation stages of 'iterated'. Defaults to 100. */
  maxIter?: number;
}

export interface GMMResult {
  theta: number[];
  /** g_T(θ̂). */
  gT: number[];
  /** Jacobian ∂g_T/∂θ' at θ̂, L × dim θ, by central differences. */
  D: Matrix;
  /** Long-run covariance of the moments. For the efficient methods it is the Ŝ behind W = Ŝ⁻¹
   * (at the first-stage estimate for 'two-step'); for 'one-step' it is Ŝ(θ̂). */
  S: Matrix;
  /** The weighting matrix of the last stage. */
  W: Matrix;
  /** (1/T)(D'WD)⁻¹D'WŜWD(D'WD)⁻¹ for 'one-step'; (1/T)(D'Ŝ⁻¹D)⁻¹ for the efficient methods. */
  covariance: Matrix;
  standardErrors: number[];
  /** T g_T'Ŝ⁻¹g_T, which is T times the minimised objective. null for 'one-step' and when df = 0. */
  J: number | null;
  /** Number of moments minus number of parameters. */
  df: number;
  /** P(χ²_df > J); null when J is. */
  pValue: number | null;
  /** Estimation stages run: 1 for 'one-step', 2 for 'two-step' and 'cue'. */
  iterations: number;
  /** Every minimisation met its tolerance, and 'iterated' stopped before maxIter. */
  converged: boolean;
  nobs: number;
}

function columnMeans(moments: readonly (readonly number[])[]): number[] {
  return moments[0].map((_, i) => moments.reduce((sum, row) => sum + row[i], 0) / moments.length);
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a.reduce((sum, value, i) => sum + value * b[i], 0);
}

/** Ŝ = Γ̂_0 + Σ_{j=1}^{lags} (1 - j/(lags+1)) (Γ̂_j + Γ̂_j'), Γ̂_j = (1/T) Σ_{t>j} g_t g_{t-j}', for the
 * T × L moment matrix g. With demean, g_t is replaced by g_t - g_T first. Newey–West weights keep Ŝ positive
 * semi-definite.
 */
export function longRunCovariance(
  moments: readonly (readonly number[])[],
  { lags = 0, demean = true }: { lags?: number; demean?: boolean } = {},
): Matrix {
  const T = moments.length;
  if (T === 0 || moments[0].length === 0) throw new Error('longRunCovariance: moments must be non-empty');
  if (!Number.isInteger(lags) || lags < 0 || lags >= T) throw new Error('longRunCovariance: lags must be an integer from 0 to T - 1');
  const mean = demean ? columnMeans(moments) : moments[0].map(() => 0);
  // Scaling each row by 1/√T turns the sums of serialCovariance into the divisor-T averages Γ̂_j.
  const scaled = moments.map((row) => row.map((value, i) => (value - mean[i]) / Math.sqrt(T)));
  return serialCovariance(scaled, lags, true);
}

/** The GMM objective g_T'Wg_T. */
export function gmmObjective(gT: readonly number[], W: readonly (readonly number[])[]): number {
  return dot(gT, W.map((row) => dot(row, gT)));
}

/** For moments linear in θ, g_T(θ) = a - Dθ, the minimiser of g_T'Wg_T: θ̂ = (D'WD)⁻¹D'Wa. */
export function linearGmm(a: readonly number[], D: readonly (readonly number[])[], W: readonly (readonly number[])[]): number[] {
  const DtW = matMul(transpose(D), W);
  return solve(matMul(DtW, D), DtW.map((row) => dot(row, a)));
}

function jacobian(gT: (theta: number[]) => number[], theta: readonly number[]): Matrix {
  const columns = theta.map((value, k) => {
    // h ≈ ε^(1/3) balances the truncation and rounding errors of a central difference.
    const h = 6e-6 * Math.max(1, Math.abs(value));
    const up = [...theta];
    const down = [...theta];
    up[k] += h;
    down[k] -= h;
    const gUp = gT(up);
    const gDown = gT(down);
    return gUp.map((v, i) => (v - gDown[i]) / (2 * h));
  });
  return transpose(columns);
}

/** GMM estimate of θ from the moment conditions E[g(x_t, θ)] = 0, starting the search at theta0. */
export function gmm(momentFn: MomentFn, theta0: readonly number[], options: GMMOptions = {}): GMMResult {
  const { method = 'two-step', weighting = 'identity', lags = 0, linear = false, tol = 1e-8, maxIter = 100 } = options;
  if (!['one-step', 'two-step', 'iterated', 'cue'].includes(method)) throw new Error('gmm: unknown method');
  if (!Number.isInteger(maxIter) || maxIter < 2) throw new Error('gmm: maxIter must be an integer of at least 2');
  const first = momentFn([...theta0]);
  const T = first.length;
  const L = first[0]?.length ?? 0;
  const K = theta0.length;
  if (K === 0) throw new Error('gmm: theta0 must have at least one entry');
  if (L < K) throw new Error('gmm: there must be at least as many moments as parameters');
  const gT = (theta: number[]) => columnMeans(momentFn(theta));
  const longRun = (theta: number[]) => longRunCovariance(momentFn(theta), { lags });
  let converged = true;
  const estimate = (W: Matrix, start: number[]): number[] => {
    if (linear) {
      // g_T(θ) = g_T(start) + D(θ - start) = a - (-D)θ.
      const D = jacobian(gT, start);
      const g = gT(start);
      return linearGmm(g.map((value, i) => value - dot(D[i], start)), D.map((row) => row.map((v) => -v)), W);
    }
    const result = minimize((theta) => gmmObjective(gT(theta), W), start);
    converged &&= result.converged;
    return result.x;
  };

  let W = weighting === 'identity' ? identity(L) : weighting.map((row) => [...row]);
  if (W.length !== L || W.some((row) => row.length !== L)) throw new Error('gmm: weighting must be L × L');
  let theta = estimate(W, [...theta0]);
  let S: Matrix = W;
  let iterations = 1;
  if (method === 'two-step') {
    S = longRun(theta);
    W = inverse(S);
    theta = estimate(W, theta);
    iterations = 2;
  } else if (method === 'iterated') {
    let moved = true;
    while (moved && iterations < maxIter) {
      S = longRun(theta);
      W = inverse(S);
      const next = estimate(W, theta);
      moved = next.some((value, i) => Math.abs(value - theta[i]) > tol * (1 + Math.abs(value)));
      theta = next;
      iterations++;
    }
    converged &&= !moved;
  } else if (method === 'cue') {
    // Ŝ(θ) moves with θ, so a singular Ŝ(θ) is a point the search must avoid.
    const objective = (t: number[]) => {
      try {
        return gmmObjective(gT(t), inverse(longRun(t)));
      } catch {
        return Infinity;
      }
    };
    const result = minimize(objective, theta);
    converged &&= result.converged;
    theta = result.x;
    S = longRun(theta);
    W = inverse(S);
    iterations = 2;
  }

  const g = gT(theta);
  const D = jacobian(gT, theta);
  const Dt = transpose(D);
  const bread = inverse(matMul(matMul(Dt, W), D));
  let covariance: Matrix;
  if (method === 'one-step') {
    S = longRun(theta);
    const WD = matMul(W, D);
    const sandwich = matMul(bread, matMul(matMul(transpose(WD), matMul(S, WD)), bread));
    covariance = sandwich.map((row) => row.map((value) => value / T));
  } else {
    covariance = bread.map((row) => row.map((value) => value / T));
  }
  const df = L - K;
  const J = method === 'one-step' || df === 0 ? null : T * gmmObjective(g, W);
  return {
    theta,
    gT: g,
    D,
    S,
    W,
    covariance,
    standardErrors: covariance.map((row, i) => Math.sqrt(row[i])),
    J,
    df,
    pValue: J === null ? null : chiSquareSurvival(J, df),
    iterations,
    converged,
    nobs: T,
  };
}

/** values[i][j] = g_T(θ)'Wg_T(θ) at θ = (grid1[i], grid2[j]), for a two-parameter model. */
export function objectiveSurface(
  momentFn: MomentFn,
  W: readonly (readonly number[])[],
  grid1: readonly number[],
  grid2: readonly number[],
): number[][] {
  return grid1.map((a) => grid2.map((b) => gmmObjective(columnMeans(momentFn([a, b])), W)));
}

/** The toy model's true θ0 = (μ, σ²): x_t has mean 0.5 and variance 1. */
export const TOY_MEAN = 0.5;
export const TOY_VARIANCE = 1;

/** T i.i.d. draws of x_t with mean TOY_MEAN and variance TOY_VARIANCE. 'normal' tails: x_t is normal.
 * 'fat' tails: a scale mixture of two normals, variance 0.5 with probability 0.9 and 5.5 with probability 0.1.
 * Its variance is still 0.9·0.5 + 0.1·5.5 = 1, its third central moment is 0 and its fourth is
 * 3(0.9·0.5² + 0.1·5.5²) = 9.75 instead of 3. Every moment is finite, so Ŝ exists for every count.
 */
export function simulateToySample(seed: number, { T, tails = 'normal' }: { T: number; tails?: 'normal' | 'fat' }): number[] {
  if (!Number.isInteger(T) || T < 1) throw new Error('simulateToySample: T must be a positive integer');
  const seeds = mulberry32(seed);
  const z = normalRng(Math.floor(seeds() * 2 ** 32));
  const regime = mulberry32(Math.floor(seeds() * 2 ** 32));
  return Array.from({ length: T }, () => {
    const scale = tails === 'normal' ? 1 : Math.sqrt(regime() < 0.9 ? 0.5 : 5.5);
    return TOY_MEAN + Math.sqrt(TOY_VARIANCE) * scale * z();
  });
}

/** Moment matrix for θ = (μ, σ²): the first count of x_t - μ, (x_t - μ)² - σ², (x_t - μ)³ and
 * (x_t - μ)⁴ - 3σ⁴. All four have mean zero under normality; count 2 is just identified.
 */
export function toyMoments(x: readonly number[], count: 2 | 3 | 4): (theta: number[]) => number[][] {
  if (![2, 3, 4].includes(count)) throw new Error('toyMoments: count must be 2, 3 or 4');
  return ([mu, variance]) => x.map((value) => {
    const e = value - mu;
    const e2 = e * e;
    if (count === 2) return [e, e2 - variance];
    if (count === 3) return [e, e2 - variance, e2 * e];
    return [e, e2 - variance, e2 * e, e2 * e2 - 3 * variance * variance];
  });
}

export interface JTestSimulation {
  /** J statistic of each seeded sample. */
  J: number[];
  df: number;
  /** Share of samples whose J exceeds the 5% critical value of χ²_df. */
  rejectionRate: number;
}

/** The J test of the toy model across seeded samples. Sample i depends only on seed and i, and each
 * search starts at the sample mean and the divisor-T variance.
 */
export function simulateJTest(
  seed: number,
  { T, samples, method = 'two-step', tails = 'normal', count = 4 }:
    { T: number; samples: number; method?: Exclude<GMMMethod, 'one-step'>; tails?: 'normal' | 'fat'; count?: 3 | 4 },
): JTestSimulation {
  if (count !== 3 && count !== 4) throw new Error('simulateJTest: count must be 3 or 4, so the model is over-identified');
  if (method === ('one-step' as GMMMethod)) throw new Error('simulateJTest: J needs an efficient method');
  const seeds = mulberry32(seed);
  const J = Array.from({ length: samples }, () => {
    const x = simulateToySample(Math.floor(seeds() * 2 ** 32), { T, tails });
    const mean = x.reduce((sum, value) => sum + value, 0) / T;
    const variance = x.reduce((sum, value) => sum + (value - mean) ** 2, 0) / T;
    return gmm(toyMoments(x, count), [mean, variance], { method }).J as number;
  });
  const df = count - 2;
  return { J, df, rejectionRate: J.filter((value) => chiSquareSurvival(value, df) < 0.05).length / samples };
}
