// The generalized method of moments: estimation, covariances, the J test and a seeded toy model.
// Every formula follows from the moment conditions E[g(x_t, θ₀)] = 0 and g_T(θ) = (1/T) Σ_t g(x_t, θ).

import { chiSquareSurvival } from '../math/distributions';
import { identity, inverse, matMul, solve, transpose } from '../math/linalg';
import { minimize } from '../math/optimize';
import { mulberry32, normalRng } from '../math/rng';
import { serialCovariance } from './ols';

type Matrix = readonly (readonly number[])[];

/** θ ↦ the T × L moment matrix, row t holding g(x_t, θ)'. */
export type MomentFn = (theta: readonly number[]) => Matrix;

export type GmmMethod = 'one-step' | 'two-step' | 'iterated' | 'cue';

export interface GmmOptions {
  method?: GmmMethod;
  /** The fixed weighting of 'one-step', and the first step of 'two-step', 'iterated' and 'cue'. */
  weighting?: 'identity' | Matrix;
  /** Newey–West lag length of Ŝ. */
  lags?: number;
  /** The moments are linear in θ, g_T(θ) = a - Dθ: each weighted step uses linearGmm. */
  linear?: boolean;
  /** Tolerance of the minimiser and of the 'iterated' loop. */
  tol?: number;
  /** Most estimation steps of 'iterated'. */
  maxIter?: number;
}

export interface GmmResult {
  theta: number[];
  /** g_T(θ̂). */
  gT: number[];
  /** Jacobian ∂g_T/∂θ' at θ̂ (L × dim θ), by central differences. */
  D: number[][];
  /** Ŝ: at θ̂ for 'one-step' and 'cue'; at the previous step's θ, so that W = Ŝ⁻¹, for 'two-step' and 'iterated'. */
  S: number[][];
  W: number[][];
  /** (1/T)(D'WD)⁻¹ D'WŜWD (D'WD)⁻¹. */
  covariance: number[][];
  /** (1/T)(D'Ŝ⁻¹D)⁻¹, the covariance with the efficient weighting; equal to covariance when W = Ŝ⁻¹. */
  efficientCovariance: number[][];
  standardErrors: number[];
  /** T g_T'Ŝ⁻¹g_T; null for 'one-step' and for a just-identified model. */
  J: number | null;
  /** L - dim θ. */
  df: number;
  pValue: number | null;
  /** Weighted estimation steps: 1 for 'one-step', 2 for 'two-step' and 'cue', the loop count for 'iterated'. */
  iterations: number;
  nobs: number;
}

function times(A: Matrix, v: readonly number[]): number[] {
  return A.map((row) => row.reduce((sum, value, j) => sum + value * v[j], 0));
}

function columnMeans(moments: Matrix): number[] {
  return moments[0].map((_, i) => moments.reduce((sum, row) => sum + row[i], 0) / moments.length);
}

/**
 * Ŝ = Γ̂₀ + Σ_{j=1}^{L} (1 - j/(L+1)) (Γ̂_j + Γ̂_j'), Γ̂_j = (1/T) Σ_{t=j+1}^{T} u_t u_{t-j}',
 * where u_t is row t of the T × (number of moments) matrix, minus its column means when demean is true.
 */
export function longRunCovariance(moments: Matrix, { lags = 0, demean = true }: { lags?: number; demean?: boolean } = {}): number[][] {
  const T = moments.length;
  if (T === 0 || moments.some((row) => row.length !== moments[0].length || !row.every(Number.isFinite))) {
    throw new RangeError('longRunCovariance: moments must be a non-empty matrix of finite numbers');
  }
  if (!Number.isInteger(lags) || lags < 0 || lags >= T) throw new RangeError('longRunCovariance: lags must be an integer from 0 to T - 1');
  const mean = demean ? columnMeans(moments) : moments[0].map(() => 0);
  const u = moments.map((row) => row.map((value, i) => value - mean[i]));
  return serialCovariance(u, lags, true).map((row) => row.map((value) => value / T));
}

/** g_T' W g_T. */
export function gmmObjective(gT: readonly number[], W: Matrix): number {
  const Wg = times(W, gT);
  return gT.reduce((sum, value, i) => sum + value * Wg[i], 0);
}

/** θ̂ = (D'WD)⁻¹ D'W a, the minimiser of g_T'Wg_T for moments g_T(θ) = a - Dθ. */
export function linearGmm(a: readonly number[], D: Matrix, W: Matrix): number[] {
  const DtW = matMul(transpose(D), W);
  return solve(matMul(DtW, D), times(DtW, a));
}

function jacobian(gT: (theta: readonly number[]) => number[], theta: readonly number[]): number[][] {
  const columns = theta.map((value, k) => {
    const h = 1e-5 * Math.max(1, Math.abs(value));
    const up = gT(theta.map((v, j) => (j === k ? v + h : v)));
    const down = gT(theta.map((v, j) => (j === k ? v - h : v)));
    return up.map((u, i) => (u - down[i]) / (2 * h));
  });
  return transpose(columns);
}

/**
 * GMM estimate of θ from momentFn, which returns the T × L moment matrix at θ.
 * 'one-step' minimises g_T'Wg_T with the fixed weighting. 'two-step' re-estimates once with W = Ŝ⁻¹ at the
 * first-step θ. 'iterated' repeats that until θ moves less than tol·(1 + max|θ|), or for maxIter steps.
 * 'cue' minimises g_T(θ)'Ŝ(θ)⁻¹g_T(θ), starting from the one-step θ.
 */
export function gmm(momentFn: MomentFn, theta0: readonly number[], options: GmmOptions = {}): GmmResult {
  const { method = 'two-step', weighting = 'identity', lags = 0, linear = false, tol = 1e-10, maxIter = 100 } = options;
  if (!['one-step', 'two-step', 'iterated', 'cue'].includes(method)) throw new Error('gmm: unknown method');
  const first = momentFn(theta0);
  const T = first.length;
  const L = first[0]?.length ?? 0;
  const K = theta0.length;
  if (L < K) throw new RangeError('gmm: the model needs at least as many moments as parameters');
  const gT = (theta: readonly number[]) => columnMeans(momentFn(theta));
  const covarianceAt = (theta: readonly number[]) => longRunCovariance(momentFn(theta), { lags });

  // Linear moments: g_T(θ) = a - Dθ with D = -∂g_T/∂θ', exact from any starting point.
  const slope = linear ? jacobian(gT, theta0).map((row) => row.map((value) => -value)) : null;
  const intercept = slope ? gT(theta0).map((value, i) => value + times(slope, theta0)[i]) : null;
  const estimate = (W: Matrix, start: readonly number[]) =>
    slope && intercept ? linearGmm(intercept, slope, W) : minimize((theta) => gmmObjective(gT(theta), W), start, { tol }).x;

  let W: number[][] = weighting === 'identity' ? identity(L) : weighting.map((row) => [...row]);
  let theta = estimate(W, theta0);
  let S = covarianceAt(theta);
  let iterations = 1;
  if (method === 'two-step' || method === 'iterated') {
    for (;;) {
      W = inverse(S);
      const next = estimate(W, theta);
      iterations++;
      const scale = 1 + Math.max(...theta.map(Math.abs));
      const done = method === 'two-step' || iterations >= maxIter
        || next.every((value, k) => Math.abs(value - theta[k]) <= tol * scale);
      theta = next;
      if (done) break;
      S = covarianceAt(theta);
    }
  } else if (method === 'cue') {
    const objective = (candidate: readonly number[]) => {
      try {
        return gmmObjective(gT(candidate), inverse(covarianceAt(candidate)));
      } catch {
        return Infinity; // a singular Ŝ(θ)
      }
    };
    theta = minimize(objective, theta, { tol }).x;
    S = covarianceAt(theta);
    W = inverse(S);
    iterations = 2;
  }

  const g = gT(theta);
  const D = slope ? slope.map((row) => row.map((value) => -value)) : jacobian(gT, theta);
  const DtW = matMul(transpose(D), W);
  const bread = inverse(matMul(DtW, D));
  const meat = matMul(matMul(DtW, S), transpose(DtW));
  const covariance = matMul(matMul(bread, meat), bread).map((row) => row.map((value) => value / T));
  const efficientCovariance = inverse(matMul(matMul(transpose(D), inverse(S)), D)).map((row) => row.map((value) => value / T));
  const df = L - K;
  const J = method === 'one-step' || df === 0 ? null : T * gmmObjective(g, W);
  return {
    theta,
    gT: g,
    D,
    S,
    W,
    covariance,
    efficientCovariance,
    standardErrors: covariance.map((row, k) => Math.sqrt(row[k])),
    J,
    df,
    pValue: J === null ? null : chiSquareSurvival(J, df),
    iterations,
    nobs: T,
  };
}

/** values[i][j] = g_T'Wg_T at θ = (grid1[i], grid2[j]), for a model with two parameters. */
export function objectiveSurface(momentFn: MomentFn, W: Matrix, grid1: readonly number[], grid2: readonly number[]): number[][] {
  return grid1.map((a) => grid2.map((b) => gmmObjective(columnMeans(momentFn([a, b])), W)));
}

/** True mean and variance of every toy sample. */
export const TOY_MEAN = 1;
export const TOY_VARIANCE = 4;

/**
 * T i.i.d. draws with mean TOY_MEAN and variance TOY_VARIANCE. 'normal': normal. 'fat': a scale mixture of
 * two normals with the same variance, variance 0.5·TOY_VARIANCE with probability 0.9 and 5.5·TOY_VARIANCE
 * with probability 0.1. It is symmetric with kurtosis 3(0.9·0.5² + 0.1·5.5²) = 9.75, and every moment is finite.
 */
export function simulateToySample(seed: number, { T, tails = 'normal' }: { T: number; tails?: 'normal' | 'fat' }): number[] {
  if (!Number.isSafeInteger(T) || T < 1) throw new RangeError('simulateToySample: T must be a positive integer');
  const seeds = mulberry32(seed);
  const z = normalRng(Math.floor(seeds() * 2 ** 32));
  const regime = mulberry32(Math.floor(seeds() * 2 ** 32));
  return Array.from({ length: T }, () => {
    const scale = tails === 'normal' ? 1 : Math.sqrt(regime() < 0.9 ? 0.5 : 5.5);
    return TOY_MEAN + Math.sqrt(TOY_VARIANCE) * scale * z();
  });
}

/**
 * The moment function of the toy model, θ = (μ, σ²): the first count of x_t - μ, (x_t - μ)² - σ²,
 * (x_t - μ)³ and (x_t - μ)⁴ - 3σ⁴, which hold for a normal x_t. count 2 is just identified.
 */
export function toyMoments(x: readonly number[], count: 2 | 3 | 4): MomentFn {
  if (![2, 3, 4].includes(count)) throw new RangeError('toyMoments: count must be 2, 3 or 4');
  return ([mu, variance]) => x.map((value) => {
    const e = value - mu;
    return [e, e * e - variance, e ** 3, e ** 4 - 3 * variance ** 2].slice(0, count);
  });
}

export interface JTestSimulation {
  /** J of each sample. */
  J: number[];
  df: number;
  /** Share of samples with p-value at most 5%. */
  rejectionRate: number;
}

/**
 * J statistics of seeded toy samples. Sample i draws from a seed that depends only on seed and i, so moving T,
 * tails, method or count reshapes the same samples. Each fit starts from the sample mean and variance.
 */
export function simulateJTest(
  seed: number,
  { T, samples, method = 'two-step', tails = 'normal', count = 3 }:
    { T: number; samples: number; method?: Exclude<GmmMethod, 'one-step'>; tails?: 'normal' | 'fat'; count?: 3 | 4 },
): JTestSimulation {
  if (!Number.isSafeInteger(samples) || samples < 1) throw new RangeError('simulateJTest: samples must be a positive integer');
  const seeds = mulberry32(seed);
  const fits = Array.from({ length: samples }, () => {
    const x = simulateToySample(Math.floor(seeds() * 2 ** 32), { T, tails });
    const mean = x.reduce((sum, value) => sum + value, 0) / T;
    const variance = x.reduce((sum, value) => sum + (value - mean) ** 2, 0) / T;
    // ponytail: Nelder–Mead costs about 10 ms per sample at T = 1000; a Gauss–Newton step would cut it if a widget lags.
    return gmm(toyMoments(x, count), [mean, variance], { method, tol: 1e-7 });
  });
  return {
    J: fits.map((fit) => fit.J as number),
    df: count - 2,
    rejectionRate: fits.filter((fit) => (fit.pValue as number) <= 0.05).length / samples,
  };
}
