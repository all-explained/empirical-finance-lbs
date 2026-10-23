/**
 * Cointegration tools: dynamic OLS (Stock and Watson, 1993) for a cointegrating vector,
 * its residual in full-sample and real-time form, and a seeded cointegrated pair.
 * Generic: no dataset. Lettau and Ludvigson (2001, JF) use this regression for cay (eq. 11, p. 822).
 */
import { normalRng } from '../math/rng';
import { ols } from './ols';
import { simulateAR1 } from './var';

export interface DynamicOLSOptions {
  /** Number of leads of the differences, Delta X_{t+1}..Delta X_{t+leads}. */
  leads?: number;
  /** Number of lags of the differences, Delta X_{t-1}..Delta X_{t-lags}. */
  lags?: number;
  /** Newey–West lag for the standard errors. Defaults to max(leads, lags). */
  neweyWestLags?: number;
}

export interface DynamicOLSResult {
  /** Constant of the cointegrating relation. */
  alpha: number;
  /** Level coefficients, in the column order of X. */
  beta: number[];
  /** Newey–West standard errors of beta. */
  standardErrors: number[];
  /** First and last regression rows (inclusive indices into y), and their count. */
  first: number;
  last: number;
  nobs: number;
}

function requireCount(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${name} must be a non-negative integer`);
}

/** y_t = alpha + beta' X_t + sum_j d_j' Delta X_{t+j} + e_t by OLS, j from −lags to +leads.
 * X holds one column per regressor. The contemporaneous Delta X_t enters whenever leads or lags is
 * positive, so leads = lags = k is Lettau–Ludvigson (2001) eq. (11), p. 822; they use k = 8 (p. 823, fn. 8).
 * leads = lags = 0 is the static levels regression on the full sample.
 * Rows run from t = lags + 1 (lags + 0 when there are no differences) to t = T − 1 − leads.
 */
export function dynamicOLS(
  y: readonly number[], X: readonly (readonly number[])[], options: DynamicOLSOptions = {},
): DynamicOLSResult {
  const { leads = 0, lags = 0 } = options;
  requireCount(leads, 'dynamicOLS: leads');
  requireCount(lags, 'dynamicOLS: lags');
  const { neweyWestLags = Math.max(leads, lags) } = options;
  if (X.length === 0) throw new RangeError('dynamicOLS: at least one regressor is required');
  if (X.some((column) => column.length !== y.length)) throw new RangeError('dynamicOLS: unequal lengths');
  const differences = leads + lags > 0;
  const first = differences ? lags + 1 : 0;
  const last = y.length - 1 - leads;
  if (last < first) throw new RangeError('dynamicOLS: too few observations for these leads and lags');
  const rows = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const columns = X.map((column) => rows.map((t) => column[t]));
  if (differences) {
    for (const column of X) {
      for (let j = -lags; j <= leads; j++) columns.push(rows.map((t) => column[t + j] - column[t + j - 1]));
    }
  }
  const fit = ols(rows.map((t) => y[t]), columns, { errors: 'newey-west', lags: neweyWestLags });
  const K = X.length;
  return {
    alpha: fit.coefficients[0],
    beta: fit.coefficients.slice(1, K + 1),
    standardErrors: fit.standardErrors.slice(1, K + 1),
    first, last, nobs: fit.nobs,
  };
}

/** y_t − alpha − beta' X_t at every date. */
export function cointegratingResidual(
  y: readonly number[], X: readonly (readonly number[])[], alpha: number, beta: readonly number[],
): number[] {
  if (beta.length !== X.length) throw new RangeError('cointegratingResidual: one beta per column of X');
  if (X.some((column) => column.length !== y.length)) throw new RangeError('cointegratingResidual: unequal lengths');
  return y.map((value, t) => value - alpha - X.reduce((sum, column, k) => sum + beta[k] * column[t], 0));
}

export interface RealTimeOptions extends DynamicOLSOptions {
  /** Observations known at the first estimation date, including that date. */
  minWindow: number;
}

export interface RealTimeResult {
  /** Index into y of the first residual: minWindow − 1. */
  first: number;
  /** residuals[i] is the residual at date first + i, from that date's estimate. */
  residuals: number[];
  alpha: number[];
  beta: number[][];
}

/** At each date t from minWindow − 1 on, run dynamicOLS on dates 0..t only, then return
 * y_t − alpha_t − beta_t' X_t. Leads: a regression row s needs Delta X up to s + leads, so at date t
 * the last usable row is t − leads. The most recent `leads` rows drop out of that date's estimate
 * rather than using data from after t. The residual at t itself needs only the levels at t.
 * Lettau–Ludvigson (2001) re-estimate cay this way each quarter (p. 832–833).
 */
export function realTimeResidual(
  y: readonly number[], X: readonly (readonly number[])[], options: RealTimeOptions,
): RealTimeResult {
  const { minWindow, ...dols } = options;
  if (!Number.isSafeInteger(minWindow) || minWindow < 1 || minWindow > y.length) {
    throw new RangeError('realTimeResidual: minWindow must be an integer from 1 to the sample length');
  }
  const result: RealTimeResult = { first: minWindow - 1, residuals: [], alpha: [], beta: [] };
  for (let t = minWindow - 1; t < y.length; t++) {
    const fit = dynamicOLS(y.slice(0, t + 1), X.map((column) => column.slice(0, t + 1)), dols);
    result.alpha.push(fit.alpha);
    result.beta.push(fit.beta);
    result.residuals.push(cointegratingResidual([y[t]], X.map((column) => [column[t]]), fit.alpha, fit.beta)[0]);
  }
  return result;
}

export interface CointegratedPairOptions {
  seed?: number;
  T?: number;
  beta?: number;
  /** Persistence of the stationary gap u. */
  phi?: number;
  /** Shock standard deviation of both x and u. */
  sigma?: number;
}

/** x_t = x_{t−1} + sigma e_t (a random walk from x_0 = sigma e_0) and y_t = beta x_t + u_t,
 * with u an AR(1) of persistence phi and shock sigma. The x shocks come from normalRng(seed);
 * u comes from simulateAR1 with seed + 1, so the two shock streams differ.
 */
export function simulateCointegratedPair(options: CointegratedPairOptions = {}): { x: number[]; y: number[] } {
  const { seed = 1, T = 200, beta = 1, phi = 0.8, sigma = 1 } = options;
  if (!Number.isFinite(beta)) throw new RangeError('simulateCointegratedPair: beta must be finite');
  const u = simulateAR1({ T, phi, sigma, seed: seed + 1 });
  const normal = normalRng(seed);
  const x: number[] = [];
  for (let t = 0; t < T; t++) x.push((t === 0 ? 0 : x[t - 1]) + sigma * normal());
  return { x, y: x.map((value, t) => beta * value + u[t]) };
}

/** y_t − w x_t: stationary only when w is the cointegrating weight. */
export function combination(y: readonly number[], x: readonly number[], w: number): number[] {
  if (x.length !== y.length) throw new RangeError('combination: unequal lengths');
  return y.map((value, t) => value - w * x[t]);
}
