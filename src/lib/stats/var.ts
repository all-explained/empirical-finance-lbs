/**
 * AR(1) and VAR(1) tools: persistence, half-life, autocorrelation, seeded simulation,
 * and a VAR(1) estimated equation by equation with OLS and forecast with A^k.
 * An AR(1) is a VAR(1) with one variable; the scalar helpers keep the chapter's formulas readable.
 */
import { identity, matPow, solve, type Matrix } from '../math/linalg';
import { normalRng } from '../math/rng';
import { ols } from './ols';

function requireFinite(values: readonly number[], name: string): void {
  if (!values.every(Number.isFinite)) throw new RangeError(`${name}: expected finite numbers`);
}

function requireStationary(phi: number, name: string): void {
  requireFinite([phi], name);
  if (Math.abs(phi) >= 1) throw new RangeError(`${name}: requires abs(phi) < 1`);
}

/** Unconditional variance of a stationary AR(1): sigma² / (1 − phi²). */
export function ar1Variance(phi: number, sigma: number): number {
  requireStationary(phi, 'ar1Variance');
  requireFinite([sigma], 'ar1Variance');
  return (sigma * sigma) / (1 - phi * phi);
}

/** Population autocorrelation at lag k ≥ 0: phi^k. */
export function ar1Autocorrelation(phi: number, k: number): number {
  requireFinite([phi], 'ar1Autocorrelation');
  if (!Number.isSafeInteger(k) || k < 0) throw new RangeError('ar1Autocorrelation: k must be a non-negative integer');
  return phi ** k;
}

/** Periods until a gap from the mean is expected to halve: log(1/2) / log(phi), for 0 ≤ phi < 1.
 * phi = 0 gives 0: the gap is gone after one period.
 */
export function halfLife(phi: number): number {
  requireFinite([phi], 'halfLife');
  if (phi < 0 || phi >= 1) throw new RangeError('halfLife: requires 0 <= phi < 1');
  return phi === 0 ? 0 : Math.log(0.5) / Math.log(phi);
}

/** E_t[x_{t+k}] = mean + phi^k (x_t − mean). */
export function ar1Forecast(xt: number, mean: number, phi: number, k: number): number {
  requireFinite([xt, mean], 'ar1Forecast');
  return mean + ar1Autocorrelation(phi, k) * (xt - mean);
}

export interface AR1SimulationOptions {
  T?: number;
  phi?: number;
  /** Shock standard deviation, not the unconditional one. */
  sigma?: number;
  mean?: number;
  seed?: number;
}

/** T values of x_{t+1} = mean + phi (x_t − mean) + sigma e_{t+1}, starting from a stationary draw.
 * The same seed gives the same shocks e for every phi and sigma, so a slider morphs one path.
 */
export function simulateAR1(options: AR1SimulationOptions = {}): number[] {
  const { T = 600, phi = 0.98, sigma = 1, mean = 0, seed = 1 } = options;
  if (!Number.isSafeInteger(T) || T < 1) throw new RangeError('simulateAR1: T must be a positive integer');
  requireStationary(phi, 'simulateAR1');
  requireFinite([sigma, mean, seed], 'simulateAR1');
  if (sigma < 0) throw new RangeError('simulateAR1: sigma must be nonnegative');
  const normal = normalRng(seed);
  let x = mean + Math.sqrt(ar1Variance(phi, sigma)) * normal();
  const path = [x];
  for (let t = 1; t < T; t++) {
    x = mean + phi * (x - mean) + sigma * normal();
    path.push(x);
  }
  return path;
}

/** Sample autocorrelations at lags 0..maxLag, each sum divided by the lag-0 sum (the usual biased form). */
export function sampleAutocorrelation(x: readonly number[], maxLag: number): number[] {
  requireFinite(x, 'sampleAutocorrelation');
  if (!Number.isSafeInteger(maxLag) || maxLag < 0 || maxLag >= x.length) {
    throw new RangeError('sampleAutocorrelation: maxLag must be an integer from 0 to length − 1');
  }
  const mean = x.reduce((sum, value) => sum + value, 0) / x.length;
  const d = x.map((value) => value - mean);
  const c0 = d.reduce((sum, value) => sum + value * value, 0);
  if (c0 === 0) throw new RangeError('sampleAutocorrelation: series is constant');
  return Array.from({ length: maxLag + 1 }, (_, k) => {
    let ck = 0;
    for (let t = k; t < d.length; t++) ck += d[t] * d[t - k];
    return ck / c0;
  });
}

export interface VAR1Fit {
  /** A[i][j]: effect of variable j at t on variable i at t+1. */
  A: Matrix;
  /** c in z_{t+1} = c + A z_t + e_{t+1}. */
  intercept: number[];
  /** Unconditional mean (I − A)^(-1) c. */
  mean: number[];
  /** Classical OLS standard errors of A, same layout. */
  standardErrors: Matrix;
  /** Residual covariance with T − 1 − n − 1 degrees of freedom per equation. */
  residualCovariance: Matrix;
  nobs: number;
}

/** VAR(1) by OLS, one equation per variable, each with an intercept and all lagged variables.
 * `series` holds one equally spaced, equal-length column per variable.
 */
export function fitVAR1(series: readonly (readonly number[])[]): VAR1Fit {
  if (series.length === 0) throw new RangeError('fitVAR1: at least one variable is required');
  if (series.some((column) => column.length !== series[0].length)) throw new RangeError('fitVAR1: unequal lengths');
  const lagged = series.map((column) => column.slice(0, -1));
  const fits = series.map((column) => ols(column.slice(1), lagged));
  const A = fits.map((fit) => fit.coefficients.slice(1));
  const intercept = fits.map((fit) => fit.coefficients[0]);
  const n = series.length;
  const I = identity(n);
  const mean = solve(I.map((row, i) => row.map((value, j) => value - A[i][j])), intercept);
  const dof = fits[0].nobs - n - 1;
  const residualCovariance = fits.map((fi) => fits.map((fj) => (
    fi.residuals.reduce((sum, value, t) => sum + value * fj.residuals[t], 0) / dof
  )));
  return {
    A, intercept, mean, residualCovariance, nobs: fits[0].nobs,
    standardErrors: fits.map((fit) => fit.standardErrors.slice(1)),
  };
}

/** E_t[z_{t+k}] = mean + A^k (z_t − mean). */
export function forecastVAR1(fit: Pick<VAR1Fit, 'A' | 'mean'>, zt: readonly number[], k: number): number[] {
  if (zt.length !== fit.mean.length) throw new RangeError('forecastVAR1: z_t has the wrong length');
  requireFinite(zt, 'forecastVAR1');
  const Ak = matPow(fit.A, k);
  return fit.mean.map((m, i) => m + Ak[i].reduce((sum, a, j) => sum + a * (zt[j] - fit.mean[j]), 0));
}
