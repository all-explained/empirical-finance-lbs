import { getColumn, type ColumnName, type Series } from '../data/series';
import { cdf } from '../math/normal';
import { ols } from '../stats/ols';
import { arithmeticMean, sampleVariance } from './returns';

export type GoyalWelchPredictorName =
  | 'dp' | 'dy' | 'ep' | 'de' | 'bm' | 'ntis' | 'tbl' | 'lty' | 'tms' | 'dfy' | 'infl' | 'svar';

export interface GoyalWelchPredictors {
  dates: string[];
  r: number[];
  predictors: Record<GoyalWelchPredictorName, (number | null)[]> & { cay?: (number | null)[] };
}

function requireFinite(values: readonly number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('Expected finite numbers');
}

function requireSameLength(...arrays: readonly (readonly number[])[]): void {
  if (arrays.some((values) => values.length !== arrays[0].length)) {
    throw new RangeError('Inputs must have equal lengths');
  }
  arrays.forEach(requireFinite);
}

function logRatio(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (numerator == null || denominator == null) return null;
  if (numerator <= 0 || denominator <= 0) throw new RangeError('Log ratio needs positive inputs');
  return Math.log(numerator) - Math.log(denominator);
}

function difference(a: number | null, b: number | null): number | null {
  return a == null || b == null ? null : a - b;
}

/** Goyal & Welch (2008, RFS 21, pp. 1457–1460) predictors, one row per period with a return.
 * Rows are the periods where CRSP_SPvw and Rfree exist (1926–2025 at both frequencies).
 * r[t] = log(1 + CRSP_SPvw[t]) - log(1 + Rfree[t]) is the log excess return earned DURING
 * period t, as in goyalWelchAnnualPredictors. Every predictor value at t is known at the end
 * of period t, so predictors.x[t] forecasts r[t+1], never r[t]. Definitions (p. 1457–1459):
 * dp = log D12 - log Index; dy = log D12 - log Index of the previous source period;
 * ep = log E12 - log Index; de = log D12 - log E12; bm = b/m (the source already uses
 * book value of an earlier year end, p. 1458); ntis, tbl, lty and svar are source columns;
 * tms = lty - tbl; dfy = BAA - AAA. Monthly inflation is released in the following month,
 * so monthly infl[t] is the source value of period t - 1 (p. 1459). The paper states this lag
 * for monthly regressions only, so annual infl[t] is the source value of year t.
 * cay (annual only) is the source column; p. 1460 notes that the Lettau–Ludvigson cay uses
 * full-sample coefficients, so it has look-ahead bias. Source gaps stay null.
 */
export function goyalWelchPredictors(series: Series<'goyal-welch-annual'>, frequency: 'annual'): GoyalWelchPredictors;
export function goyalWelchPredictors(series: Series<'goyal-welch-monthly'>, frequency: 'monthly'): GoyalWelchPredictors;
export function goyalWelchPredictors(
  series: Series<'goyal-welch-annual'> | Series<'goyal-welch-monthly'>, frequency: 'annual' | 'monthly',
): GoyalWelchPredictors {
  if (series.frequency !== frequency) throw new RangeError(`Expected ${frequency} data, got ${series.frequency}`);
  // Both ids share these columns; the cast only widens the column-name type.
  const column = (name: ColumnName<'goyal-welch-monthly'>) =>
    getColumn(series as Series<'goyal-welch-monthly'>, name);
  const price = column('Index');
  const dividend = column('D12');
  const earnings = column('E12');
  const market = column('CRSP_SPvw');
  const riskFree = column('Rfree');
  const tbl = column('tbl');
  const lty = column('lty');
  const AAA = column('AAA');
  const BAA = column('BAA');
  const bm = column('b/m');
  const ntis = column('ntis');
  const infl = column('infl');
  const svar = column('svar');
  const cay = frequency === 'annual' ? getColumn(series as Series<'goyal-welch-annual'>, 'cay') : null;

  const result: GoyalWelchPredictors = {
    dates: [], r: [],
    predictors: {
      dp: [], dy: [], ep: [], de: [], bm: [], ntis: [], tbl: [], lty: [], tms: [], dfy: [], infl: [], svar: [],
      ...(cay ? { cay: [] } : {}),
    },
  };
  const { predictors } = result;
  series.rows.forEach(([date], t) => {
    const m = market[t];
    const rf = riskFree[t];
    if (m == null || rf == null) return;
    requireFinite([m, rf]);
    if (m <= -1 || rf <= -1) throw new RangeError(`Invalid log input at ${date}`);
    result.dates.push(date);
    result.r.push(Math.log1p(m) - Math.log1p(rf));
    predictors.dp.push(logRatio(dividend[t], price[t]));
    predictors.dy.push(t > 0 ? logRatio(dividend[t], price[t - 1]) : null);
    predictors.ep.push(logRatio(earnings[t], price[t]));
    predictors.de.push(logRatio(dividend[t], earnings[t]));
    predictors.bm.push(bm[t]);
    predictors.ntis.push(ntis[t]);
    predictors.tbl.push(tbl[t]);
    predictors.lty.push(lty[t]);
    predictors.tms.push(difference(lty[t], tbl[t]));
    predictors.dfy.push(difference(BAA[t], AAA[t]));
    predictors.infl.push(frequency === 'monthly' ? (t > 0 ? infl[t - 1] : null) : infl[t]);
    predictors.svar.push(svar[t]);
    if (cay) predictors.cay!.push(cay[t]);
  });
  return result;
}

export interface ExpandingOptions {
  /** Number of (x[s], r[s+1]) pairs in the first estimation window. */
  minWindow: number;
  /** +1 or -1: use the historical mean when the estimated slope has the other sign. */
  expectedSign?: 1 | -1;
  /** Replace a negative forecast by zero, after the sign restriction. */
  floorAtZero?: boolean;
}

export interface ExpandingForecasts {
  /** Position in r of each forecast return, so dates[index[i]] is the forecast period. */
  index: number[];
  actual: number[];
  forecast: number[];
  benchmark: number[];
  /** Unrestricted OLS slope of each window. */
  slope: number[];
}

/** Real-time forecasts from expanding windows; x[t] predicts r[t+1], equally spaced and finite.
 * At date t >= minWindow, OLS of r[s+1] on x[s] for s < t uses only data known at t; the
 * forecast of r[t+1] is a + b x[t]. The benchmark is the mean of the same r[1..t]. r[0] is unused.
 */
export function expandingForecasts(
  r: readonly number[], x: readonly number[], options: ExpandingOptions,
): ExpandingForecasts {
  const { minWindow, expectedSign, floorAtZero = false } = options;
  requireSameLength(r, x);
  // OLS with an intercept needs three pairs for positive residual degrees of freedom.
  if (!Number.isSafeInteger(minWindow) || minWindow < 3) throw new RangeError('minWindow must be an integer >= 3');
  if (expectedSign !== undefined && expectedSign !== 1 && expectedSign !== -1) {
    throw new RangeError('expectedSign must be 1 or -1');
  }
  const out: ExpandingForecasts = { index: [], actual: [], forecast: [], benchmark: [], slope: [] };
  for (let t = minWindow; t + 1 < r.length; t++) {
    const y = r.slice(1, t + 1);
    const fit = ols(y, [x.slice(0, t)]);
    const [a, b] = fit.coefficients;
    const mean = arithmeticMean(y);
    let forecast = expectedSign !== undefined && b * expectedSign < 0 ? mean : a + b * x[t];
    if (floorAtZero) forecast = Math.max(forecast, 0);
    out.index.push(t + 1);
    out.actual.push(r[t + 1]);
    out.forecast.push(forecast);
    out.benchmark.push(mean);
    out.slope.push(b);
  }
  return out;
}

/** R²_OS = 1 - Σ(r - r̂)² / Σ(r - r̄)²; NaN when the benchmark has zero squared error. */
export function oosR2(actual: readonly number[], forecast: readonly number[], benchmark: readonly number[]): number {
  requireSameLength(actual, forecast, benchmark);
  let model = 0;
  let mean = 0;
  actual.forEach((value, t) => {
    model += (value - forecast[t]) ** 2;
    mean += (value - benchmark[t]) ** 2;
  });
  return mean === 0 ? NaN : 1 - model / mean;
}

/** Running Σ[(r - r̄)² - (r - r̂)²]: a rising line means the predictor beats the historical mean. */
export function cumulativeSquaredErrorDifference(
  actual: readonly number[], forecast: readonly number[], benchmark: readonly number[],
): number[] {
  requireSameLength(actual, forecast, benchmark);
  let sum = 0;
  return actual.map((value, t) => (sum += (value - benchmark[t]) ** 2 - (value - forecast[t]) ** 2));
}

/** Clark & West (2007): t-statistic of the mean of f = (r - r̄)² - [(r - r̂)² - (r̄ - r̂)²],
 * with the n - 1 sample variance, and its one-sided normal p-value (H1: the model forecasts better).
 * When every f is zero (the forecast always equals the benchmark), statistic 0 and p-value 0.5.
 */
export function clarkWest(
  actual: readonly number[], forecast: readonly number[], benchmark: readonly number[],
): { statistic: number; pValue: number } {
  requireSameLength(actual, forecast, benchmark);
  const f = actual.map((value, t) =>
    (value - benchmark[t]) ** 2 - ((value - forecast[t]) ** 2 - (benchmark[t] - forecast[t]) ** 2));
  const mean = arithmeticMean(f);
  const variance = sampleVariance(f);
  const statistic = mean === 0 && variance === 0 ? 0 : mean / Math.sqrt(variance / f.length);
  return { statistic, pValue: 1 - cdf(statistic) };
}

function requireBounds(bounds: readonly [number, number]): void {
  requireFinite(bounds);
  if (bounds[0] > bounds[1]) throw new RangeError('Lower bound must not exceed upper bound');
}

/** Mean–variance weight r̂ / (γ σ̂²) on the risky asset, clipped to bounds.
 * γ = 3 and bounds [0, 1.5] (no short sales, at most 50% leverage) are teaching choices.
 */
export function meanVarianceWeight(
  forecast: number, variance: number, gamma = 3, bounds: readonly [number, number] = [0, 1.5],
): number {
  requireFinite([forecast, variance, gamma]);
  requireBounds(bounds);
  if (variance <= 0 || gamma <= 0) throw new RangeError('Variance and gamma must be positive');
  return Math.min(Math.max(forecast / (gamma * variance), bounds[0]), bounds[1]);
}

export interface CertaintyEquivalentOptions {
  /** Teaching default 3. */
  gamma?: number;
  /** Teaching default [0, 1.5]. */
  bounds?: readonly [number, number];
  periodsPerYear: number;
}

/** Annualised gain periodsPerYear × (ū_model - ū_mean), with ū = mean - (γ/2) var (n - 1) of the
 * portfolio excess returns w_t × actual_t. Each w_t uses the forecast and variance[t] known before
 * period t. actual should be the excess return the investor earns: a simple excess return makes
 * w × actual exact, a log excess return makes it an approximation.
 */
export function certaintyEquivalentGain(
  actual: readonly number[], forecast: readonly number[], benchmark: readonly number[],
  variance: readonly number[], options: CertaintyEquivalentOptions,
): number {
  const { gamma = 3, bounds = [0, 1.5], periodsPerYear } = options;
  requireSameLength(actual, forecast, benchmark, variance);
  if (!(periodsPerYear > 0)) throw new RangeError('periodsPerYear must be positive');
  const utility = (signal: readonly number[]) => {
    const portfolio = actual.map((value, t) => meanVarianceWeight(signal[t], variance[t], gamma, bounds) * value);
    return arithmeticMean(portfolio) - gamma / 2 * sampleVariance(portfolio);
  };
  return periodsPerYear * (utility(forecast) - utility(benchmark));
}
