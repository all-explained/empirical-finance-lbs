/**
 * Cash-flow and discount-rate news from a VAR(1), and Cochrane's "dog that did not bark":
 * seeded samples under the null of no return predictability, with the identity
 * r_{t+1} = Δd_{t+1} − rho dp_{t+1} + dp_t holding exactly in every sample.
 * rho is the Campbell–Shiller constant and is always passed in.
 */
import { identity, inverse, matMul, type Matrix } from '../math/linalg';
import { normalRng } from '../math/rng';
import { ols } from '../stats/ols';
import { fitVAR1, type VAR1Fit } from '../stats/var';

function requireFinite(values: readonly number[], name: string): void {
  if (!values.every(Number.isFinite)) throw new RangeError(`${name}: expected finite numbers`);
}

function variance(x: readonly number[]): number {
  const mean = x.reduce((sum, value) => sum + value, 0) / x.length;
  return x.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (x.length - 1);
}

function covariance(x: readonly number[], y: readonly number[]): number {
  const mx = x.reduce((sum, value) => sum + value, 0) / x.length;
  const my = y.reduce((sum, value) => sum + value, 0) / y.length;
  return x.reduce((sum, value, t) => sum + (value - mx) * (y[t] - my), 0) / (x.length - 1);
}

const dot = (a: readonly number[], b: readonly number[]) => a.reduce((sum, value, i) => sum + value * b[i], 0);

export interface NewsWeights {
  /** lambda_DR' = e_1' rho A (I − rho A)^(-1): N_DR = lambda_DR' epsilon. */
  discountRate: number[];
  /** lambda_CF' = e_1' + lambda_DR': N_CF = lambda_CF' epsilon. */
  cashFlow: number[];
}

/** Row vectors that turn a VAR(1) shock epsilon_{t+1} into discount-rate and cash-flow news.
 * `returnIndex` is the position of the return in the VAR state (e_1 picks it).
 */
export function newsWeights(A: readonly (readonly number[])[], rho: number, returnIndex = 0): NewsWeights {
  const n = A.length;
  if (n === 0 || A.some((row) => row.length !== n)) throw new RangeError('newsWeights: A must be square');
  A.forEach((row) => requireFinite(row, 'newsWeights'));
  requireFinite([rho], 'newsWeights');
  if (!Number.isSafeInteger(returnIndex) || returnIndex < 0 || returnIndex >= n) {
    throw new RangeError('newsWeights: returnIndex out of range');
  }
  const rhoA = A.map((row) => row.map((value) => rho * value));
  const I = identity(n);
  const discountRate = matMul(rhoA, inverse(I.map((row, i) => row.map((value, j) => value - rhoA[i][j]))))[returnIndex];
  return { discountRate, cashFlow: discountRate.map((value, j) => value + I[returnIndex][j]) };
}

export interface NewsDecomposition {
  /** r_{t+1} − E_t r_{t+1}, one per period after the first. */
  unexpected: number[];
  cashFlow: number[];
  discountRate: number[];
  /** Var(N_CF), Var(N_DR) and −2 Cov(N_CF, N_DR) as shares of Var(unexpected); they sum to 1. */
  shares: { cashFlow: number; discountRate: number; covariance: number };
  weights: NewsWeights;
  fit: VAR1Fit;
}

/** Fit a VAR(1) with `fitVAR1` on equal-length columns (the return first by default) and split
 * each residual return into N_CF − N_DR.
 */
export function newsDecomposition(
  series: readonly (readonly number[])[], rho: number, returnIndex = 0,
): NewsDecomposition {
  const fit = fitVAR1(series);
  const weights = newsWeights(fit.A, rho, returnIndex);
  const residuals = series[0].slice(1).map((_, t) => series.map((column, i) => (
    column[t + 1] - fit.intercept[i] - fit.A[i].reduce((sum, a, j) => sum + a * series[j][t], 0)
  )));
  const unexpected = residuals.map((e) => e[returnIndex]);
  const cashFlow = residuals.map((e) => dot(weights.cashFlow, e));
  const discountRate = residuals.map((e) => dot(weights.discountRate, e));
  const total = variance(unexpected);
  return {
    unexpected, cashFlow, discountRate, weights, fit,
    shares: {
      cashFlow: variance(cashFlow) / total,
      discountRate: variance(discountRate) / total,
      covariance: -2 * covariance(cashFlow, discountRate) / total,
    },
  };
}

export interface DogNullOptions {
  /** Regression observations per sample: dp_0 … dp_T are drawn. */
  T: number;
  /** Persistence of dp under the null, abs(phi) < 1. */
  phi: number;
  rho: number;
  /** 2×2 covariance of (epsilon^dp, epsilon^d), in that order. */
  residualCov: readonly (readonly number[])[];
  samples: number;
  seed: number;
}

export interface DogDraw {
  /** OLS slopes on dp_t of r_{t+1}, Δd_{t+1} and dp_{t+1}, each with an intercept, on one sample. */
  br: number;
  bd: number;
  phi: number;
}

/** Seeded samples under the null of no return predictability:
 * dp_{t+1} = phi dp_t + epsilon^dp, Δd_{t+1} = (rho phi − 1) dp_t + epsilon^d, and
 * r_{t+1} = Δd_{t+1} − rho dp_{t+1} + dp_t. dp_0 is a stationary draw.
 * Because the three regressions share one sample, br − bd + rho phiHat = 1 in every draw.
 */
export function simulateDogNull(options: DogNullOptions): DogDraw[] {
  const { T, phi, rho, residualCov: S, samples, seed } = options;
  if (!Number.isSafeInteger(T) || T < 3) throw new RangeError('simulateDogNull: T must be an integer of at least 3');
  if (!Number.isSafeInteger(samples) || samples < 1) throw new RangeError('simulateDogNull: samples must be a positive integer');
  requireFinite([phi, rho, seed], 'simulateDogNull');
  if (Math.abs(phi) >= 1) throw new RangeError('simulateDogNull: requires abs(phi) < 1');
  if (S.length !== 2 || S.some((row) => row.length !== 2)) throw new RangeError('simulateDogNull: residualCov must be 2×2');
  S.forEach((row) => requireFinite(row, 'simulateDogNull'));
  if (S[0][1] !== S[1][0]) throw new RangeError('simulateDogNull: residualCov must be symmetric');
  // 2×2 Cholesky: epsilon^dp = l11 u, epsilon^d = l21 u + l22 v.
  const l11 = Math.sqrt(S[0][0]);
  const l21 = l11 > 0 ? S[1][0] / l11 : 0;
  const l22sq = S[1][1] - l21 * l21;
  if (!(S[0][0] > 0) || l22sq < -1e-12 * S[1][1]) throw new RangeError('simulateDogNull: residualCov must be positive definite in dp');
  const l22 = Math.sqrt(Math.max(l22sq, 0));
  const normal = normalRng(seed);
  const sdStationary = l11 / Math.sqrt(1 - phi * phi);
  return Array.from({ length: samples }, () => {
    const dp = [sdStationary * normal()];
    const dd: number[] = [];
    const r: number[] = [];
    for (let t = 0; t < T; t++) {
      const u = normal();
      const v = normal();
      dp.push(phi * dp[t] + l11 * u);
      dd.push((rho * phi - 1) * dp[t] + l21 * u + l22 * v);
      r.push(dd[t] - rho * dp[t + 1] + dp[t]);
    }
    const x = [dp.slice(0, -1)];
    return {
      br: ols(r, x).coefficients[1],
      bd: ols(dd, x).coefficients[1],
      phi: ols(dp.slice(1), x).coefficients[1],
    };
  });
}

export interface DogTailShares {
  /** Share of draws with br at or above the data's. */
  br: number;
  /** Share of draws with bd at or above the data's. */
  bd: number;
  /** Share of draws with br / (1 − rho phi) at or above the data's. */
  longRun: number;
}

/** One-sided tail shares of the null draws against the data's estimates. */
export function dogTailShares(draws: readonly DogDraw[], estimates: DogDraw, rho: number): DogTailShares {
  if (draws.length === 0) throw new RangeError('dogTailShares: no draws');
  requireFinite([estimates.br, estimates.bd, estimates.phi, rho], 'dogTailShares');
  const longRun = (d: DogDraw) => d.br / (1 - rho * d.phi);
  const share = (hit: (d: DogDraw) => boolean) => draws.filter(hit).length / draws.length;
  return {
    br: share((d) => d.br >= estimates.br),
    bd: share((d) => d.bd >= estimates.bd),
    longRun: share((d) => longRun(d) >= longRun(estimates)),
  };
}
