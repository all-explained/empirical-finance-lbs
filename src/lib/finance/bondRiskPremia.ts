/**
 * Bond risk premia for Chapter 42: the Cochrane–Piazzesi return-forecasting factor (the "tent"), the loadings of each
 * bond's excess return on it, and forecasts with principal components of yields.
 *
 * Source: Cochrane and Piazzesi (2005), "Bond Risk Premia", AER 95(1); pages are journal pages (pdf page + 137).
 * Annual holding periods on monthly observations, maturities 1–5 years, decimal log rates, as the paper (p. 141).
 * The paper reports rates in percent, so its constant γ_0 is 100 times ours; the other weights, the loadings and R²
 * do not depend on the unit. Notation (docs/STYLE_GUIDE.md §3): the paper's f_t, γ, b_n and the barred average
 * excess return are here the forward-rate vector 𝐟_t, the weights ϑ, the loadings b^(n) and rx^avg_{t+1}; the factor
 * γ'f_t is cp_t = ϑ'𝐟_t.
 *
 * Standard errors: Hansen–Hodrick with 12 lags by default, or Newey–West with 18 lags, as Table 1 (pp. 143–144). They
 * correct for the eleven-month overlap of annual returns sampled monthly. Limit: lags count rows, so across a month the
 * curve skips they reach one month further back than their number says.
 */
import { pca, scores } from '../stats/pca';
import { ols, type OLSOptions } from '../stats/ols';
import { forwardRates, holdingReturns, type YieldCurve } from './bonds';

/** The maturities whose excess returns the paper forecasts (p. 141). */
const MATURITIES = [2, 3, 4, 5] as const;

/** The first and last month of t, as 'YYYY-MM'. */
export interface MonthRange {
  first: string;
  last: string;
}

export interface NamedRange extends MonthRange {
  name: string;
}

export interface CPInputs {
  /** The curve's date in month t. */
  dates: string[];
  /** T × 6: the forward-rate vector 𝐟_t = [1, y^(1)_t, f^(2)_t, f^(3)_t, f^(4)_t, f^(5)_t]. */
  forwards: number[][];
  /** T × 4: rx^(n)_{t+1} for n = 2, 3, 4, 5. */
  rx: number[][];
  /** rx^avg_{t+1}, the mean of the four excess returns. */
  rxAvg: number[];
}

/**
 * The regression data of Cochrane and Piazzesi (p. 141) for each month t from `range.first` to `range.last` whose month
 * twelve months later is on the curve: the forward-rate vector with its intercept, the one-year excess returns
 * rx^(n)_{t+1} of the 2- to 5-year bonds (from `holdingReturns`) and their average across maturities.
 */
export function cpInputs(curve: YieldCurve, range: MonthRange): CPInputs {
  if (!/^\d{4}-\d{2}$/.test(range.first) || !/^\d{4}-\d{2}$/.test(range.last) || range.first > range.last) {
    throw new RangeError('A range is two months YYYY-MM, the first not after the last');
  }
  if (curve.maturities.length < 5) throw new RangeError('The curve needs maturities 1 to 5');
  const f = forwardRates(curve);
  const row = new Map(curve.dates.map((date, t) => [date, t]));
  const inRange = ({ date }: { date: string }) => date.slice(0, 7) >= range.first && date.slice(0, 7) <= range.last;
  const returns = MATURITIES.map((n) => holdingReturns(curve, n).filter(inRange));
  const dates = returns[0].map(({ date }) => date);
  const rx = dates.map((_, t) => returns.map((r) => r[t].rx));
  return {
    dates,
    forwards: dates.map((date) => [1, ...f[row.get(date) as number].slice(0, 5)]),
    rx,
    rxAvg: rx.map((r) => r.reduce((sum, v) => sum + v, 0) / r.length),
  };
}

export interface CPOptions {
  /** Hansen–Hodrick (default) or Newey–West. */
  errors?: 'hansen-hodrick' | 'newey-west';
  /** Defaults to 12 for Hansen–Hodrick and 18 for Newey–West. */
  lags?: number;
}

function olsOptions({ errors = 'hansen-hodrick', lags }: CPOptions, intercept: boolean): OLSOptions {
  return { intercept, errors, lags: lags ?? (errors === 'hansen-hodrick' ? 12 : 18) };
}

/** The regressor columns y^(1), f^(2), …, f^(5) of 𝐟_t; `ols` adds the intercept. */
function forwardColumns(inputs: CPInputs): number[][] {
  return [1, 2, 3, 4, 5].map((j) => inputs.forwards.map((row) => row[j]));
}

/** Centred R² = 1 - SSE / Σ (y - ȳ)², also for a fit without an intercept, whose `ols` R² is uncentred. */
function centredR2(y: readonly number[], residuals: readonly number[]): number {
  const mean = y.reduce((sum, v) => sum + v, 0) / y.length;
  const total = y.reduce((sum, v) => sum + (v - mean) ** 2, 0);
  return 1 - residuals.reduce((sum, e) => sum + e * e, 0) / total;
}

export interface TentFactor {
  /** ϑ_0, …, ϑ_5: the paper's γ (Table 1A, p. 143). ϑ_0 is in decimals. */
  weights: number[];
  standardErrors: number[];
  r2: number;
  /** cp_t = ϑ'𝐟_t, one per month of the inputs. */
  cp: number[];
  nobs: number;
}

/**
 * The first step of the paper's two-step estimate, eq. (3), p. 142: the regression of the average excess return on the
 * forward-rate vector, rx^avg_{t+1} = ϑ'𝐟_t + ε_{t+1}. Its fitted value is the factor cp_t. Over 1964–2003 the weights
 * on f^(1), …, f^(5) form a tent (Figure 1, p. 140).
 */
export function tentFactor(inputs: CPInputs, options: CPOptions = {}): TentFactor {
  const fit = ols(inputs.rxAvg, forwardColumns(inputs), olsOptions(options, true));
  return { weights: fit.coefficients, standardErrors: fit.standardErrors, r2: fit.r2, cp: fit.fitted, nobs: fit.nobs };
}

export interface MaturityLoading {
  n: number;
  /** b^(n), the slope of rx^(n)_{t+1} on cp_t with no intercept (Table 1B, p. 143). */
  b: number;
  /** Treats cp_t as data: it ignores that ϑ is estimated. */
  standardError: number;
  /** Centred R² of the restricted regression. */
  r2: number;
  /** b^(n) ϑ: the coefficients on 𝐟_t the single factor implies (Figure 1, bottom panel, p. 140). */
  restricted: number[];
  /** The unrestricted coefficients on 𝐟_t, eq. (1), p. 142 (Figure 1, top panel). */
  unrestricted: number[];
  unrestrictedR2: number;
}

/**
 * The second step, eq. (2), p. 142: rx^(n)_{t+1} = b^(n) cp_t + ε^(n)_{t+1} for n = 2, …, 5, next to the unrestricted
 * regressions of each rx^(n)_{t+1} on all of 𝐟_t, eq. (1). The single-factor model restricts the 4 × 6 unrestricted
 * coefficients to b^(n) ϑ'.
 *
 * With the weights of `tentFactor` on the same inputs, the four loadings average to 1. Without an intercept,
 * b^(n) = Σ_t cp_t rx^(n)_{t+1} / Σ_t cp_t², so their mean is Σ_t cp_t rx^avg_{t+1} / Σ_t cp_t². Write
 * rx^avg_{t+1} = cp_t + ε_{t+1}. The residuals ε of the first step are orthogonal to every column of 𝐟_t, so also to
 * cp_t = ϑ'𝐟_t; hence Σ_t cp_t rx^avg_{t+1} = Σ_t cp_t² and the mean is 1. This is the paper's normalisation (p. 142).
 */
export function singleFactorLoadings(
  inputs: CPInputs,
  weights: readonly number[],
  options: CPOptions = {},
): MaturityLoading[] {
  if (weights.length !== 6) throw new RangeError('The weights are ϑ_0, …, ϑ_5');
  const cp = inputs.forwards.map((row) => row.reduce((sum, v, j) => sum + v * weights[j], 0));
  const columns = forwardColumns(inputs);
  return MATURITIES.map((n, i) => {
    const rx = inputs.rx.map((row) => row[i]);
    const restricted = ols(rx, [cp], olsOptions(options, false));
    const unrestricted = ols(rx, columns, olsOptions(options, true));
    const b = restricted.coefficients[0];
    return {
      n,
      b,
      standardError: restricted.standardErrors[0],
      r2: centredR2(rx, restricted.residuals),
      restricted: weights.map((w) => b * w),
      unrestricted: unrestricted.coefficients,
      unrestrictedR2: unrestricted.r2,
    };
  });
}

export interface YieldFactorForecasts {
  /** q_1, …, q_5: loadings of level, slope, curvature and the last two components on y^(1), …, y^(5). */
  loadings: number[][];
  /** ℓ_k / Σ_j ℓ_j: the share of the variance of yields each component explains. */
  varianceShares: number[];
  /** R² of rx^avg_{t+1} on the scores of the first 1, 2, 3 and all 5 components. The last is the tent's R². */
  r2: { level: number; levelSlope: number; levelSlopeCurvature: number; all: number };
  /** The share of the variance of cp_t each component explains; the five sum to 1. */
  factorShares: number[];
  /** The sum of the first three factor shares. */
  factorShareFirstThree: number;
}

/**
 * Forecasts of rx^avg_{t+1} with principal components of the 1- to 5-year yield levels in the months of the inputs, as
 * Table 4 and the text beside it (pp. 146–147). Over 1964–2003 the paper finds variance shares 98.6, 1.4, 0.03, 0.02
 * and 0.01 percent, and R² of 0.26 with level, slope and curvature against the tent's 0.35.
 *
 * Five components span the five yields, and the forward-rate vector is a linear function of the yields
 * (f^(n) = n y^(n) - (n - 1) y^(n-1)), so with all five the R² is the tent's. The same span gives
 * cp_t = const + Σ_k a_k s_{k,t} exactly, and the scores s_k are uncorrelated in sample, so
 * Var(cp) = Σ_k a_k² ℓ_k with a_k = Cov(cp, s_k) / ℓ_k. The share of component k is a_k² ℓ_k / Var(cp), which is
 * corr(cp, s_k)²; the paper reports 9.1, 58.7, 7.6, 24.3 and 0.3 percent (p. 147).
 */
export function yieldFactorForecasts(inputs: CPInputs, curve: YieldCurve): YieldFactorForecasts {
  const row = new Map(curve.dates.map((date, t) => [date, t]));
  const yields = inputs.dates.map((date) => {
    const t = row.get(date);
    if (t === undefined) throw new RangeError(`The curve has no date ${date}`);
    return curve.y[t].slice(0, 5);
  });
  const fit = pca(yields);
  const s = scores(yields, fit, 5);
  const component = (k: number) => s.map((v) => v[k]);
  const r2 = (K: number) => ols(inputs.rxAvg, [0, 1, 2, 3, 4].slice(0, K).map(component)).r2;
  const { cp } = tentFactor(inputs);
  const cpMean = cp.reduce((sum, v) => sum + v, 0) / cp.length;
  const cpVariance = cp.reduce((sum, v) => sum + (v - cpMean) ** 2, 0) / (cp.length - 1);
  const factorShares = fit.values.map((l, k) => {
    const covariance = s.reduce((sum, v, t) => sum + v[k] * (cp[t] - cpMean), 0) / (cp.length - 1);
    return covariance ** 2 / (l * cpVariance);
  });
  return {
    loadings: fit.loadings,
    varianceShares: fit.share,
    r2: { level: r2(1), levelSlope: r2(2), levelSlopeCurvature: r2(3), all: r2(5) },
    factorShares,
    factorShareFirstThree: factorShares[0] + factorShares[1] + factorShares[2],
  };
}

/**
 * The default ranges of t on `gsw-zero-coupon`: the whole sample, the months it shares with the paper's sample of
 * 1964–2003 (Table 1 note, p. 143), and the months after it. The last month, 2025-09, is the last t whose return ends
 * on the committed curve; stating it keeps these ranges, and the pinned tests, fixed when the data are extended.
 */
export const defaultRanges: readonly NamedRange[] = [
  { name: 'Full sample', first: '1985-11', last: '2025-09' },
  { name: 'Shared with Cochrane–Piazzesi', first: '1985-11', last: '2003-12' },
  { name: 'After Cochrane–Piazzesi', first: '2004-01', last: '2025-09' },
];

export interface SubsampleTent extends NamedRange {
  tent: TentFactor;
}

/** `tentFactor` on each named range of t, to see how stable the tent is. */
export function subsampleTents(
  curve: YieldCurve,
  ranges: readonly NamedRange[] = defaultRanges,
  options: CPOptions = {},
): SubsampleTent[] {
  return ranges.map((range) => ({ ...range, tent: tentFactor(cpInputs(curve, range), options) }));
}
