import { getColumn, seriesColumns, type Series } from '../data/series';
import { sampleCovariance, sampleMeans } from '../finance/portfolio';
import { symmetricEigen, type Matrix } from '../math/linalg';

/**
 * Principal components of a panel X with T rows (dates) and N columns (series).
 * Covariances use the n - 1 sample divisor, so loadings and eigenvalues match
 * numpy.linalg.eigh(np.cov(X, rowvar=False)) up to the sign of each loading vector.
 */
export interface PCA {
  /** Sample mean of each column. */
  mean: number[];
  /** N × N sample covariance matrix. */
  covariance: Matrix;
  /** Eigenvalues ℓ_1 ≥ … ≥ ℓ_N: the variance of each component. */
  values: number[];
  /** loadings[k] is the unit vector q_k; its largest-magnitude entry is positive. */
  loadings: number[][];
  /** Share of total variance, ℓ_k / Σ_j ℓ_j. */
  share: number[];
  /** Share explained by the first k + 1 components together. */
  cumulativeShare: number[];
}

/** Eigen-decomposition Σ = QLQ' (L = diag ℓ) of the sample covariance, with variance shares. */
export function pca(X: readonly (readonly number[])[]): PCA {
  const covariance = sampleCovariance(X);
  const { values, vectors } = symmetricEigen(covariance);
  const total = values.reduce((sum, v) => sum + v, 0);
  if (!(total > 0)) throw new RangeError('PCA needs series that are not all constant');
  const share = values.map((v) => v / total);
  let running = 0;
  const cumulativeShare = share.map((s) => (running += s));
  return { mean: sampleMeans(X), covariance, values, loadings: vectors, share, cumulativeShare };
}

/** Variance of the combination w'x: w'Σw. For a unit w it is the variance along direction w. */
export function directionVariance(covariance: readonly (readonly number[])[], w: readonly number[]): number {
  if (w.length !== covariance.length) throw new RangeError('Direction and covariance sizes differ');
  return w.reduce((sum, wi, i) => sum + wi * covariance[i].reduce((s, c, j) => s + c * w[j], 0), 0);
}

/**
 * Rotate two orthonormal directions by an angle ω (radians) inside the plane they span:
 * w_1 = cos ω q_1 + sin ω q_2 and w_2 = -sin ω q_1 + cos ω q_2. The plane, and so the
 * fit of the pair, is the same for every ω.
 */
export function rotatePair(q1: readonly number[], q2: readonly number[], omega: number): [number[], number[]] {
  if (q1.length !== q2.length) throw new RangeError('Directions must have the same length');
  const [c, s] = [Math.cos(omega), Math.sin(omega)];
  return [q1.map((v, i) => c * v + s * q2[i]), q1.map((v, i) => -s * v + c * q2[i])];
}

/** The point on the line through `mean` along the unit vector w that is closest to z: mean + w w'(z - mean). */
export function projectOnDirection(z: readonly number[], mean: readonly number[], w: readonly number[]): number[] {
  const s = w.reduce((sum, wi, i) => sum + wi * (z[i] - mean[i]), 0);
  return mean.map((m, i) => m + s * w[i]);
}

function checkK(fit: PCA, K: number): void {
  if (!Number.isInteger(K) || K < 0 || K > fit.values.length) throw new RangeError('K must be an integer from 0 to N');
}

/** T × K scores: s_{k,t} = q_k'(x_t - x̄), the value of component k at date t. */
export function scores(X: readonly (readonly number[])[], fit: PCA, K: number): number[][] {
  checkK(fit, K);
  return X.map((row) => fit.loadings.slice(0, K).map((q) => q.reduce((s, qi, i) => s + qi * (row[i] - fit.mean[i]), 0)));
}

/** Rebuild each observation from its first K components: x̂_t = x̄ + Σ_{k≤K} q_k s_{k,t}. */
export function reconstruct(X: readonly (readonly number[])[], fit: PCA, K: number): number[][] {
  return scores(X, fit, K).map((s) => fit.mean.map((m, i) => s.reduce((sum, sk, k) => sum + fit.loadings[k][i] * sk, m)));
}

/** Σ_t ‖x_t - x̂_t‖² with K components. It equals (T - 1) Σ_{k>K} ℓ_k. */
export function reconstructionError(X: readonly (readonly number[])[], fit: PCA, K: number): number {
  const fitted = reconstruct(X, fit, K);
  return X.reduce((sum, row, t) => sum + row.reduce((s, v, i) => s + (v - fitted[t][i]) ** 2, 0), 0);
}

export interface Panel {
  dates: string[];
  names: string[];
  /** T × N, decimal units. */
  X: number[][];
}

function panel<I extends 'ff25-size-bm-monthly' | 'gsw-zero-coupon'>(series: Series<I>): Panel {
  const names = [...seriesColumns[series.id]] as string[];
  const columns = names.map((name) => getColumn(series, name as never));
  const X = series.rows.map(([date], t) => columns.map((column) => {
    const v = column[t];
    if (v == null || !Number.isFinite(v)) throw new RangeError(`Missing ${series.id} value at ${date}`);
    return v / 100;
  }));
  return { dates: series.rows.map(([date]) => date), names, X };
}

/** The 25 size–value portfolios' monthly returns, percent converted to decimals. */
export function ff25Returns(series: Series<'ff25-size-bm-monthly'>): Panel {
  return panel(series);
}

/** Monthly changes of the 1- to 30-year GSW zero-coupon yields, in decimals (0.0001 = 1 basis point). */
export function gswYieldChanges(series: Series<'gsw-zero-coupon'>): Panel {
  const levels = panel(series);
  return {
    dates: levels.dates.slice(1),
    names: levels.names,
    X: levels.X.slice(1).map((row, t) => row.map((v, i) => v - levels.X[t][i])),
  };
}
