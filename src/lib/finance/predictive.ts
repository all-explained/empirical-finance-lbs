import { getColumn, type Series } from '../data/series';
import { normalRng } from '../math/rng';
import { ols } from '../stats/ols';

export interface PredictiveOptions {
  errors?: 'newey-west' | 'hansen-hodrick' | 'classical';
}

export interface PredictiveResult {
  slope: number;
  intercept: number;
  standardError: number;
  tStat: number;
  r2: number;
  nobs: number;
}

function requireHorizon(k: number): void {
  if (!Number.isSafeInteger(k) || k < 1) throw new RangeError('Horizon must be a positive integer');
}

function requireFinite(values: readonly number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('Expected finite numbers');
}

/** Equally spaced log returns; empty output when there are no complete horizons. */
export function forwardSums(r: readonly number[], k: number): number[] {
  requireHorizon(k);
  requireFinite(r);
  // x[t] pairs with output[t] = r[t+1] + ... + r[t+k]; r[0] is never a future return.
  const sums: number[] = [];
  if (k >= r.length) return sums;
  let sum = 0;
  for (let j = 1; j <= k; j++) sum += r[j];
  for (let t = 0; t < r.length - k; t++) {
    sums.push(sum);
    if (t + k + 1 < r.length) sum += r[t + k + 1] - r[t + 1];
  }
  return sums;
}

/** Overlapping future log excess returns on today's predictor, with an intercept.
 * Both serial-correlation estimators use k lags and no finite-sample correction.
 * Inputs must be equally spaced, finite and of equal length. OLS checks sample size.
 */
export function predictiveRegression(
  r: readonly number[], x: readonly number[], k: number, options: PredictiveOptions = {},
): PredictiveResult {
  if (r.length !== x.length) throw new RangeError('Returns and predictors must have equal lengths');
  requireFinite(x);
  const y = forwardSums(r, k);
  const fit = ols(y, [x.slice(0, y.length)], { errors: options.errors ?? 'newey-west', lags: k });
  return {
    slope: fit.coefficients[1], intercept: fit.coefficients[0],
    standardError: fit.standardErrors[1], tStat: fit.tStats[1], r2: fit.r2, nobs: fit.nobs,
  };
}

/** Results retain the requested horizon order, including repeated horizons. */
export function horizonSlopes(
  r: readonly number[], x: readonly number[], horizons: readonly number[], options: PredictiveOptions = {},
): (PredictiveResult & { k: number })[] {
  return horizons.map((k) => ({ k, ...predictiveRegression(r, x, k, options) }));
}

/** x[t+1] on x[t]; residualStd uses the nobs - 2 residual degrees of freedom. */
export function fitAR1(x: readonly number[]): { phi: number; intercept: number; residualStd: number } {
  const fit = ols(x.slice(1), [x.slice(0, -1)]);
  const variance = fit.residuals.reduce((sum, value) => sum + value * value, 0) / (fit.nobs - 2);
  return { phi: fit.coefficients[1], intercept: fit.coefficients[0], residualStd: Math.sqrt(variance) };
}

/** Population slope b1 * (1 + phi + ... + phi^(k-1)), including the unit-root limit. */
export function impliedHorizonSlope(b1: number, phi: number, k: number): number {
  requireFinite([b1, phi]);
  requireHorizon(k);
  if (phi === 1) return b1 * k;
  // expm1/log1p preserve precision when positive phi is close to one.
  const factor = phi > 0 ? -Math.expm1(k * Math.log1p(phi - 1)) / (1 - phi)
    : (1 - phi ** k) / (1 - phi);
  return b1 * factor;
}

/** Keep complete rows and their original year labels; no imputation.
 * Annual dates identify the year, despite the YYYY-01-01 encoding (docs/DATA.md).
 * Index is the year-end level; D12 is trailing dividends through that year-end.
 * CRSP_SPvw and Rfree are decimal returns earned DURING that year, not forward returns.
 * Thus dp[t] predicts r[t+1], not r[t]. Before regression, select consecutive retained
 * years if a different extract has interior missing rows. The current sample is 1926–2025.
 */
export function goyalWelchAnnualPredictors(series: Series<'goyal-welch-annual'>): {
  dates: string[]; dp: number[]; r: number[];
} {
  const prices = getColumn(series, 'Index');
  const dividends = getColumn(series, 'D12');
  const market = getColumn(series, 'CRSP_SPvw');
  const riskFree = getColumn(series, 'Rfree');
  const dates: string[] = [];
  const dp: number[] = [];
  const r: number[] = [];
  series.rows.forEach(([date], t) => {
    const p = prices[t];
    const d = dividends[t];
    const m = market[t];
    const rf = riskFree[t];
    if (p == null || d == null || m == null || rf == null) return;
    requireFinite([p, d, m, rf]);
    if (p <= 0 || d <= 0 || m <= -1 || rf <= -1) throw new RangeError(`Invalid log input at ${date}`);
    dates.push(date);
    dp.push(Math.log(d) - Math.log(p));
    r.push(Math.log1p(m) - Math.log1p(rf));
  });
  return { dates, dp, r };
}

export interface PredictiveSimulationOptions {
  T?: number;
  b1?: number;
  phi?: number;
  /** Return innovation standard deviation, not unconditional return volatility. */
  sigmaR?: number;
  /** Predictor innovation standard deviation. Defaults to unit stationary predictor variance. */
  sigmaX?: number;
  corr?: number;
  seed?: number;
}

/** Monthly log excess returns and a zero-mean stationary AR(1) predictor.
 * At the defaults Var(x)=1, b1=0.0045 and sigmaR=0.045*sqrt(0.99), so
 * Var(r)=0.045² and population one-month R²=0.01. The intercept is 0.005.
 * corr couples same-month shocks e[t] and u[t], preserving x[t-1] -> r[t].
 */
export function simulatePredictive(options: PredictiveSimulationOptions = {}): { r: number[]; x: number[] } {
  const {
    T = 600, b1 = 0.0045, phi = 0.98, sigmaR = 0.045 * Math.sqrt(0.99),
    sigmaX = Math.sqrt(1 - phi * phi), corr = 0, seed = 42,
  } = options;
  if (!Number.isSafeInteger(T) || T < 1) throw new RangeError('T must be a positive integer');
  requireFinite([b1, phi, sigmaR, sigmaX, corr, seed]);
  if (Math.abs(phi) >= 1) throw new RangeError('Simulation requires abs(phi) < 1');
  if (sigmaR < 0 || sigmaX < 0) throw new RangeError('Shock standard deviations must be nonnegative');
  if (Math.abs(corr) > 1) throw new RangeError('Shock correlation must lie in [-1, 1]');
  const normal = normalRng(seed);
  let previousX = sigmaX / Math.sqrt(1 - phi * phi) * normal();
  const r: number[] = [];
  const x: number[] = [];
  for (let t = 0; t < T; t++) {
    const e = normal();
    const u = corr * e + Math.sqrt(1 - corr * corr) * normal();
    r.push(0.005 + b1 * previousX + sigmaR * e);
    x.push(phi * previousX + sigmaX * u);
    previousX = x[t];
  }
  return { r, x };
}
