export type CovarianceType = 'classical' | 'white' | 'newey-west' | 'hansen-hodrick';

export interface OLSOptions {
  intercept?: boolean;
  errors?: CovarianceType;
  /** HC1 instead of HC0, for errors: 'white' only. */
  hc1?: boolean;
  /** Maximum lag for either serial-correlation estimator. Defaults to zero. */
  lags?: number;
}

export interface OLSResult {
  /** Intercept first when present, then coefficients in input-column order. */
  coefficients: number[];
  standardErrors: number[];
  tStats: number[];
  residuals: number[];
  fitted: number[];
  /** Centered with an intercept; uncentered otherwise. NaN if total variation is zero. */
  r2: number;
  adjR2: number;
  nobs: number;
  covariance: number[][];
}

function norm(values: readonly number[]): number {
  return values.reduce((length, value) => Math.hypot(length, value), 0);
}

function backSolve(R: number[][], rhs: number[]): number[] {
  const result = [...rhs];
  for (let j = rhs.length - 1; j >= 0; j--) {
    for (let i = j + 1; i < rhs.length; i++) result[j] -= R[j][i] * result[i];
    result[j] /= R[j][j];
  }
  return result;
}

// Householder QR on scaled columns: X = Q R diag(scales). No X'X is formed.
function fitQR(y: readonly number[], columns: readonly (readonly number[])[]) {
  const T = y.length;
  const K = columns.length;
  const scales = columns.map((column) => column.reduce((scale, value) => Math.max(scale, Math.abs(value)), 0));
  if (scales.some((scale) => scale === 0)) throw new Error("ols: singular X'X (zero regressor)");
  const R = y.map((_, t) => columns.map((column, j) => column[t] / scales[j]));
  const qty = [...y];
  const reflectors: number[][] = [];
  for (let j = 0; j < K; j++) {
    const v = R.slice(j).map((row) => row[j]);
    const length = norm(v);
    const columnLength = norm(columns[j].map((value) => value / scales[j]));
    if (length <= 8 * Number.EPSILON * T * columnLength) {
      throw new Error("ols: singular X'X (linearly dependent regressors)");
    }
    v[0] += (v[0] >= 0 ? 1 : -1) * length;
    const vLength = norm(v);
    for (let t = 0; t < v.length; t++) v[t] /= vLength;
    reflectors.push(v);
    for (let i = j; i < K; i++) {
      const projection = 2 * v.reduce((sum, value, t) => sum + value * R[t + j][i], 0);
      for (let t = 0; t < v.length; t++) R[t + j][i] -= projection * v[t];
    }
    const projection = 2 * v.reduce((sum, value, t) => sum + value * qty[t + j], 0);
    for (let t = 0; t < v.length; t++) qty[t + j] -= projection * v[t];
  }
  const coefficients = backSolve(R, qty.slice(0, K)).map((value, j) => value / scales[j]);
  // Build thin Q by applying the reflectors in reverse order to its K basis vectors.
  const Q = Array.from({ length: K }, (_, i) => {
    const column = Array.from({ length: T }, (_, t) => Number(t === i));
    for (let j = K - 1; j >= 0; j--) {
      const v = reflectors[j];
      const projection = 2 * v.reduce((sum, value, t) => sum + value * column[t + j], 0);
      for (let t = 0; t < v.length; t++) column[t + j] -= projection * v[t];
    }
    return column;
  });
  // Each row holds d_t = (X'X)^(-1) x_t, obtained through triangular solves.
  const influence = y.map((_, t) => backSolve(R, Q.map((column) => column[t])).map((value, j) => value / scales[j]));
  return { coefficients, influence };
}

function matrix(K: number): number[][] {
  return Array.from({ length: K }, () => Array(K).fill(0));
}

/** Var(beta-hat) = s² (X'X)^(-1), s² = sum_t epsilon-hat_t² / (T-K). */
function classical(influence: number[][], residuals: number[], K: number): number[][] {
  const variance = residuals.reduce((sum, value) => sum + value * value, 0) / (residuals.length - K);
  const covariance = matrix(K);
  for (const d of influence) {
    for (let i = 0; i < K; i++) {
      for (let j = 0; j < K; j++) covariance[i][j] += variance * d[i] * d[j];
    }
  }
  return covariance;
}

/** HC0 = sum_t epsilon-hat_t² d_t d_t'; HC1 multiplies HC0 by T/(T-K). */
function white(scores: number[][], hc1: boolean): number[][] {
  const K = scores[0].length;
  const covariance = matrix(K);
  const scale = hc1 ? scores.length / (scores.length - K) : 1;
  for (const score of scores) {
    for (let i = 0; i < K; i++) {
      for (let j = 0; j < K; j++) covariance[i][j] += scale * score[i] * score[j];
    }
  }
  return covariance;
}

/** HC0 + sum_{l=1}^L w_l sum_{t=l+1}^T epsilon-hat_t epsilon-hat_{t-l}
 * (d_t d_{t-l}' + d_{t-l} d_t'), where d_t = (X'X)^(-1) x_t.
 * Newey–West: w_l = 1-l/(L+1). Hansen–Hodrick: w_l = 1.
 */
export function serialCovariance(scores: number[][], lags: number, bartlett: boolean): number[][] {
  const covariance = white(scores, false);
  const K = scores[0].length;
  for (let lag = 1; lag <= lags; lag++) {
    const weight = bartlett ? 1 - lag / (lags + 1) : 1;
    for (let t = lag; t < scores.length; t++) {
      for (let i = 0; i < K; i++) {
        for (let j = 0; j < K; j++) {
          covariance[i][j] += weight * (scores[t][i] * scores[t - lag][j] + scores[t - lag][i] * scores[t][j]);
        }
      }
    }
  }
  return covariance;
}

/** Ordinary least squares. X contains regressor columns, in time order.
 * Requires T > K, including the optional intercept, for residual degrees of freedom.
 * Robust estimators use no finite-sample correction except the explicit White HC1 option.
 * Hansen–Hodrick can have negative diagonal variances; their standard errors are NaN.
 */
export function ols(y: readonly number[], X: readonly (readonly number[])[], options: OLSOptions = {}): OLSResult {
  const { intercept = true, errors = 'classical', hc1 = false, lags = 0 } = options;
  if (!['classical', 'white', 'newey-west', 'hansen-hodrick'].includes(errors)) {
    throw new Error('ols: unknown covariance estimator');
  }
  if (X.some((column) => column.length !== y.length)) throw new Error('ols: unequal lengths of y and X columns');
  if (!y.every(Number.isFinite) || X.some((column) => !column.every(Number.isFinite))) {
    throw new Error('ols: y and X must contain only finite numbers');
  }
  const columns = intercept ? [y.map(() => 1), ...X] : [...X];
  const T = y.length;
  const K = columns.length;
  if (K === 0) throw new Error('ols: at least one parameter is required');
  if (T <= K) throw new Error('ols: observations must exceed parameters (positive residual degrees of freedom)');
  if ((errors === 'newey-west' || errors === 'hansen-hodrick') && (!Number.isInteger(lags) || lags < 0 || lags >= T)) {
    throw new Error('ols: lags must be an integer from 0 to nobs - 1');
  }
  const { coefficients, influence } = fitQR(y, columns);
  const fitted = y.map((_, t) => columns.reduce((sum, column, j) => sum + column[t] * coefficients[j], 0));
  const residuals = y.map((value, t) => value - fitted[t]);
  const scores = influence.map((d, t) => d.map((value) => value * residuals[t]));
  const covariance = errors === 'classical' ? classical(influence, residuals, K)
    : errors === 'white' ? white(scores, hc1)
      : serialCovariance(scores, lags, errors === 'newey-west');
  const standardErrors = covariance.map((row, j) => Math.sqrt(row[j]));
  const tStats = coefficients.map((value, j) => value / standardErrors[j]);
  const mean = intercept ? y.reduce((sum, value) => sum + value, 0) / T : 0;
  const total = y.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  const sse = residuals.reduce((sum, value) => sum + value * value, 0);
  const r2 = total === 0 ? NaN : 1 - sse / total;
  const adjR2 = 1 - (1 - r2) * (T - Number(intercept)) / (T - K);
  return { coefficients, standardErrors, tStats, residuals, fitted, r2, adjR2, nobs: T, covariance };
}
