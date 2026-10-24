// Conditional CAPM tests from short windows, after Lewellen & Nagel (2006, Journal of Financial
// Economics 82, 289–314). Page numbers below are journal pages. The paper writes the market risk
// premium as γ_t; this site writes it λ_t (docs/STYLE_GUIDE.md §3). Returns are decimals per period.
import { betweenDates, getColumn, type Series } from '../data/series';
import { ols } from '../stats/ols';
import { meanStandardError } from '../stats/moments';
import { arithmeticMean, sampleVariance } from './returns';

export interface DailyFactorPanel {
  dates: string[];
  'Mkt-RF': number[];
  SMB: number[];
  HML: number[];
  Mom: number[];
  RF: number[];
}

/**
 * Decimal daily Fama–French factors and momentum from start to end (inclusive; end defaults to the
 * last day). French data are percent per trading day. Throws a RangeError when the dates differ.
 */
export function dailyFactorPanel(
  ff3Daily: Series<'ff3-daily'>,
  momDaily: Series<'mom-daily'>,
  { start, end = '9999-12-31' }: { start: string; end?: string },
): DailyFactorPanel {
  const f = betweenDates(ff3Daily, start, end);
  const m = betweenDates(momDaily, start, end);
  const dates = f.rows.map(([date]) => date);
  if (dates.length === 0 || m.rows.length !== dates.length || m.rows.some(([date], t) => date !== dates[t])) {
    throw new RangeError('ff3-daily and mom-daily dates do not line up');
  }
  const decimal = (cells: readonly (number | null)[]): number[] => cells.map((value) => {
    if (value === null) throw new RangeError('dailyFactorPanel: missing return');
    return value / 100;
  });
  return {
    dates,
    'Mkt-RF': decimal(getColumn(f, 'Mkt-RF')),
    SMB: decimal(getColumn(f, 'SMB')),
    HML: decimal(getColumn(f, 'HML')),
    Mom: decimal(getColumn(m, 'Mom')),
    RF: decimal(getColumn(f, 'RF')),
  };
}

function requirePair(y: readonly number[], x: readonly number[]): void {
  if (y.length !== x.length) throw new RangeError('y and x need the same length');
}

/**
 * OLS y_s = α_t + β_t x_s + ε_s over the `window` periods s = t - window + 1, …, t.
 * Entry t holds the window that ends at t; the first window - 1 entries are NaN.
 * Needs 3 ≤ window ≤ T.
 */
export function rollingBetas(
  y: readonly number[], x: readonly number[], window: number,
): { alpha: number[]; beta: number[] } {
  requirePair(y, x);
  if (!Number.isInteger(window) || window < 3 || window > y.length) {
    throw new RangeError('rollingBetas: window must be an integer from 3 to the number of periods');
  }
  const alpha = y.map(() => NaN);
  const beta = y.map(() => NaN);
  for (let t = window - 1; t < y.length; t++) {
    const [a, b] = ols(y.slice(t - window + 1, t + 1), [x.slice(t - window + 1, t + 1)]).coefficients;
    alpha[t] = a;
    beta[t] = b;
  }
  return { alpha, beta };
}

export type WindowPeriod = 'month' | 'quarter' | 'half' | 'year';

export interface ShortWindow {
  /** Calendar label: '1964-01', '1964-Q1', '1964-H1' or '1964'. */
  period: string;
  /** First and last dates used in the regression. */
  start: string;
  end: string;
  /** Number of days (observations) in the regression. */
  nobs: number;
  /** α̂_iq, the intercept, per period of the input (per day for daily data). */
  alpha: number;
  alphaSE: number;
  /** β̂_iq; with lags, the summed Dimson beta β_0 + β_1 + β_2. */
  beta: number;
  betaSE: number;
}

function periodLabel(date: string, period: WindowPeriod): string {
  const year = date.slice(0, 4);
  const month = Number(date.slice(5, 7));
  if (period === 'month') return date.slice(0, 7);
  if (period === 'quarter') return `${year}-Q${Math.ceil(month / 3)}`;
  if (period === 'half') return `${year}-H${month <= 6 ? 1 : 2}`;
  return year;
}

/**
 * Lewellen & Nagel (2006, pp. 296–297): estimate R^e_{it} = α_iq + β_iq R^e_{mt} + ε_it separately in
 * every calendar window q, so each window gives a direct estimate of the conditional alpha and beta.
 * Classical OLS standard errors. Windows with fewer than minObs days are skipped. Dates are ISO and sorted.
 *
 * lags: true adds lagged market returns for nonsynchronous trading, as the paper does for daily data
 * (p. 298, Eq. 7, after Dimson 1979):
 * R_it = α_i + β_i0 R_{M,t} + β_i1 R_{M,t-1} + β_i2 (R_{M,t-2} + R_{M,t-3} + R_{M,t-4})/3 + ε_it,
 * with beta β_i0 + β_i1 + β_i2 and alpha still the intercept. A lag at the start of a window is the
 * previous trading day of the series, so only the first four days of the whole series drop out.
 */
export function shortWindowRegressions(
  dates: readonly string[], y: readonly number[], x: readonly number[],
  { period, minObs, lags = false }: { period: WindowPeriod; minObs: number; lags?: boolean },
): ShortWindow[] {
  requirePair(y, x);
  if (dates.length !== y.length) throw new RangeError('dates and returns need the same length');
  if (dates.some((date, t) => t > 0 && date <= dates[t - 1])) throw new RangeError('dates must be sorted and unique');
  if (!['month', 'quarter', 'half', 'year'].includes(period)) throw new RangeError('unknown window period');
  const K = lags ? 3 : 1;
  if (!Number.isInteger(minObs) || minObs <= K + 1) throw new RangeError('minObs must be an integer above the number of parameters');
  const regressors = (t: number): number[] => (lags ? [x[t], x[t - 1], (x[t - 2] + x[t - 3] + x[t - 4]) / 3] : [x[t]]);
  const groups = new Map<string, number[]>();
  for (let t = lags ? 4 : 0; t < dates.length; t++) {
    const label = periodLabel(dates[t], period);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(t);
  }
  return [...groups].filter(([, days]) => days.length >= minObs).map(([label, days]) => {
    const rows = days.map(regressors);
    const fit = ols(days.map((t) => y[t]), rows[0].map((_, k) => rows.map((row) => row[k])));
    // Var(Σ_k β̂_k) = Σ_j Σ_k Cov(β̂_j, β̂_k), over the slope block of the OLS covariance.
    const slopeVariance = fit.covariance.slice(1).reduce((sum, row) => sum + row.slice(1).reduce((s, v) => s + v, 0), 0);
    return {
      period: label,
      start: dates[days[0]],
      end: dates[days[days.length - 1]],
      nobs: days.length,
      alpha: fit.coefficients[0],
      alphaSE: fit.standardErrors[0],
      beta: fit.coefficients.slice(1).reduce((sum, b) => sum + b, 0),
      betaSE: Math.sqrt(slopeVariance),
    };
  });
}

export interface ConditionalAlphaSummary {
  /** Number of windows. */
  windows: number;
  /** Average conditional alpha, (1/Q) Σ_q α̂_iq, per period of the regressions. */
  meanAlpha: number;
  /** s(α̂_iq)/√Q, from the time series of window alphas. */
  alphaSE: number;
  alphaT: number;
  meanBeta: number;
  /** σ(β̂_iq), the n - 1 sample standard deviation of the estimated betas. */
  sigmaBeta: number;
  /** Implied σ(β_iq) of true betas, √(Var(β̂_iq) - mean SE(β̂_iq)²); NaN when that variance is negative. */
  sigmaBetaTrue: number;
}

/**
 * Lewellen & Nagel (2006): the average conditional alpha, with its standard error from the sample
 * variability of the window alphas (p. 302: "the standard deviation of the 148 quarterly estimates
 * divided by the square root of 148"). The implied volatility of true betas uses
 * Var(β̂_t) = Var(β_t) + Var(e_t), with Var(e_t) the average sampling variance from the windows (p. 303).
 * The paper reports daily alphas in percent monthly, multiplied by 21 trading days (p. 299).
 */
export function conditionalAlphaSummary(windows: readonly ShortWindow[]): ConditionalAlphaSummary {
  if (windows.length < 2) throw new RangeError('conditionalAlphaSummary: needs at least two windows');
  const alphas = windows.map((w) => w.alpha);
  const betas = windows.map((w) => w.beta);
  const meanAlpha = arithmeticMean(alphas);
  const alphaSE = meanStandardError(alphas);
  const variance = sampleVariance(betas);
  const trueVariance = variance - arithmeticMean(windows.map((w) => w.betaSE ** 2));
  return {
    windows: windows.length,
    meanAlpha,
    alphaSE,
    alphaT: meanAlpha / alphaSE,
    meanBeta: arithmeticMean(betas),
    sigmaBeta: Math.sqrt(variance),
    sigmaBetaTrue: trueVariance >= 0 ? Math.sqrt(trueVariance) : NaN,
  };
}

export interface UnconditionalAlpha {
  /** α^u_i, Eq. (3). */
  alpha: number;
  /** β^u_i, Eq. (2). */
  unconditionalBeta: number;
  /** β̄_i = E[β_it]. */
  meanBeta: number;
  /** Cov(β_it, λ_t), the first-order approximation to α^u_i when market volatility is constant. */
  covariance: number;
  /** Eq. (4): Cov(β_it, λ_t) - (λ̄/σ²_M) Cov(β_it, σ²_t). */
  approximation: number;
}

function covariance(a: readonly number[], b: readonly number[]): number {
  const ma = arithmeticMean(a);
  const mb = arithmeticMean(b);
  return a.reduce((sum, value, t) => sum + (value - ma) * (b[t] - mb), 0) / a.length;
}

/**
 * Lewellen & Nagel (2006, p. 293, Eqs. 1–3): the unconditional CAPM alpha implied by a conditional CAPM
 * that holds every period, E_{t-1}[R_it] = β_it λ_t. Inputs are the paths of
 * - β_it, asset i's conditional beta on the market for period t,
 * - λ_t, the market's conditional risk premium E_{t-1}[R^e_{Mt}] (the paper's γ_t),
 * - σ²_t, the market's conditional variance (one number when constant).
 * Moments are over those paths with divisor T: β̄ = E[β_it], λ̄ = E[λ_t],
 * σ²_M = E[σ²_t] + Var(λ_t) is the unconditional market variance, and
 *   β^u = β̄ + (λ̄/σ²_M) Cov(β_t, λ_t) + (1/σ²_M) Cov(β_t, (λ_t - λ̄)²) + (1/σ²_M) Cov(β_t, σ²_t),   (2)
 *   α^u = λ̄ (β̄ - β^u) + Cov(β_t, λ_t)                                                              (1)
 *       = (1 - λ̄²/σ²_M) Cov(β_t, λ_t) - (λ̄/σ²_M) Cov(β_t, (λ_t - λ̄)²) - (λ̄/σ²_M) Cov(β_t, σ²_t).   (3)
 * Eq. (4), p. 294, drops the two small terms: α^u ≈ Cov(β_t, λ_t) - (λ̄/σ²_M) Cov(β_t, σ²_t).
 */
export function unconditionalAlpha(
  beta: readonly number[], premium: readonly number[], variance: number | readonly number[],
): UnconditionalAlpha {
  requirePair(beta, premium);
  const sigma2 = typeof variance === 'number' ? beta.map(() => variance) : [...variance];
  requirePair(beta, sigma2);
  if (sigma2.some((value) => !(value >= 0))) throw new RangeError('Conditional variances must be nonnegative');
  const meanBeta = arithmeticMean(beta);
  const meanPremium = arithmeticMean(premium);
  const marketVariance = arithmeticMean(sigma2) + covariance(premium, premium);
  const covBetaPremium = covariance(beta, premium);
  const covBetaSquare = covariance(beta, premium.map((value) => (value - meanPremium) ** 2));
  const covBetaVariance = covariance(beta, sigma2);
  const unconditionalBeta = meanBeta
    + (meanPremium * covBetaPremium + covBetaSquare + covBetaVariance) / marketVariance;
  return {
    alpha: meanPremium * (meanBeta - unconditionalBeta) + covBetaPremium,
    unconditionalBeta,
    meanBeta,
    covariance: covBetaPremium,
    approximation: covBetaPremium - meanPremium / marketVariance * covBetaVariance,
  };
}

/**
 * Lewellen & Nagel (2006, p. 290 and p. 294): with constant market volatility, α^u ≈ Cov(β_it, λ_t)
 * = ρ σ(β_it) σ(λ_t), so |α^u| ≤ σ(β_it) σ(λ_t), reached only when beta and the premium are perfectly
 * correlated (ρ = ±1). σ(β_it) is the time-series standard deviation of the true conditional beta and
 * σ(λ_t) that of the market risk premium, per period; the bound is in the units of σ(λ_t).
 */
export function alphaBound(sigmaBeta: number, sigmaLambda: number): number {
  if (!(sigmaBeta >= 0) || !(sigmaLambda >= 0) || !Number.isFinite(sigmaBeta * sigmaLambda)) {
    throw new RangeError('alphaBound: standard deviations must be finite and nonnegative');
  }
  return sigmaBeta * sigmaLambda;
}
