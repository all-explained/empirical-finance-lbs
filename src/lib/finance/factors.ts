// Factor models beyond FF3 (Carhart, FF5), factors rebuilt from 2×3 sorts, the momentum
// formation signal, a bear-market regression for momentum crashes, and spanning regressions.
// Returns are decimals; French data are percent per month and are divided by 100 here.
import { betweenDates, getColumn, type Series } from '../data/series';
import { ols, type OLSResult } from '../stats/ols';
import { grossGrowth } from './returns';
import { factorPanel, grs, timeSeriesRegressions, type FactorModel, type FactorPanel, type GrsResult } from './timeSeriesTests';

export type Model = FactorModel | 'carhart' | 'ff5';
export type FactorName = 'Mkt-RF' | 'SMB' | 'HML' | 'RMW' | 'CMA' | 'Mom';

/** The FactorPanel of timeSeriesTests.ts, with every factor name of the four models. */
export interface ModelPanel extends Omit<FactorPanel, 'factorNames'> {
  factorNames: FactorName[];
}

const FF5_FACTORS = ['Mkt-RF', 'SMB', 'HML', 'RMW', 'CMA'] as const;

function decimal(cells: readonly (number | null)[]): number[] {
  return cells.map((value) => {
    if (value === null) throw new RangeError('factors: missing return');
    return value / 100;
  });
}

// The rows of source from start to end, which must be exactly the panel's dates.
function aligned<I extends 'ff5-monthly' | 'mom-monthly'>(source: Series<I>, start: string, end: string, dates: readonly string[]): Series<I> {
  if (source.rows.length === 0 || start < source.rows[0][0]) {
    throw new RangeError(`${source.id} starts ${source.rows[0]?.[0] ?? 'never'}, after ${start}`);
  }
  const slice = betweenDates(source, start, end);
  if (slice.rows.length !== dates.length || slice.rows.some(([date], t) => date !== dates[t])) {
    throw new RangeError(`${source.id} dates do not line up with ff3 and ff25`);
  }
  return slice;
}

/**
 * Decimal monthly excess returns of the 25 size–B/M portfolios and the factors of a model, from start to
 * end (inclusive). 'capm' and 'ff3' are factorPanel itself. 'carhart' adds Mom to FF3; 'ff5' takes
 * Mkt-RF, SMB, HML, RMW and CMA from ff5-monthly (its SMB differs from the FF3 one). Excess returns
 * always subtract the RF of ff3-monthly. Mom starts 1927-01 and FF5 1963-07; an earlier start throws.
 */
export function modelPanel(
  { ff3, ff5, mom }: { ff3: Series<'ff3-monthly'>; ff5?: Series<'ff5-monthly'>; mom?: Series<'mom-monthly'> },
  ff25: Series<'ff25-size-bm-monthly'>,
  { start, end = '9999-12-31', model }: { start: string; end?: string; model: Model },
): ModelPanel {
  if (model === 'capm' || model === 'ff3') return factorPanel(ff3, ff25, { start, end, model });
  const base = factorPanel(ff3, ff25, { start, end, model: 'ff3' });
  if (model === 'carhart') {
    if (!mom) throw new RangeError("modelPanel: 'carhart' needs mom-monthly");
    const momentum = decimal(getColumn(aligned(mom, start, end, base.dates), 'Mom'));
    return { ...base, factors: base.factors.map((row, t) => [...row, momentum[t]]), factorNames: [...base.factorNames, 'Mom'] };
  }
  if (!ff5) throw new RangeError("modelPanel: 'ff5' needs ff5-monthly");
  const slice = aligned(ff5, start, end, base.dates);
  const columns = FF5_FACTORS.map((name) => decimal(getColumn(slice, name)));
  return { ...base, factors: base.dates.map((_, t) => columns.map((values) => values[t])), factorNames: [...FF5_FACTORS] };
}

export interface SortFactors<L extends string, F extends string> {
  dates: string[];
  /** The six value-weighted legs as decimal returns: S/B for small/big, then the second sort. */
  legs: Record<L, number[]>;
  factors: Record<F, number[]>;
}
type ValueLeg = 'SL' | 'SM' | 'SH' | 'BL' | 'BM' | 'BH';
type MomentumLeg = 'SL' | 'SM' | 'SW' | 'BL' | 'BM' | 'BW';

/**
 * Long–short factors from the 2×3 sorts of the Kenneth French Data Library. Size-value
 * (https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/Data_Library/six_portfolios.html,
 * https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/Data_Library/f-f_factors.html):
 * SMB = (SL + SM + SH)/3 - (BL + BM + BH)/3 and HML = (SH + BH)/2 - (SL + BL)/2, with L, M, H the
 * low, middle and high book-to-market thirds. Size-momentum
 * (https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/Data_Library/det_6_port_form_sz_pr_12_2.html,
 * https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/Data_Library/det_mom_factor.html):
 * UMD = (SW + BW)/2 - (SL + BL)/2, winners minus losers on the return from t-12 to t-2.
 */
export function sortFactors(six: Series<'ff6-size-bm-monthly'>, kind: 'size-value'): SortFactors<ValueLeg, 'SMB' | 'HML'>;
export function sortFactors(six: Series<'ff6-size-mom-monthly'>, kind: 'size-momentum'): SortFactors<MomentumLeg, 'UMD'>;
export function sortFactors(
  six: Series<'ff6-size-bm-monthly'> | Series<'ff6-size-mom-monthly'>, kind: 'size-value' | 'size-momentum',
): SortFactors<ValueLeg, 'SMB' | 'HML'> | SortFactors<MomentumLeg, 'UMD'> {
  const expected = kind === 'size-value' ? 'ff6-size-bm-monthly' : 'ff6-size-mom-monthly';
  if (six.id !== expected) throw new RangeError(`sortFactors: '${kind}' needs ${expected}`);
  const dates = six.rows.map(([date]) => date);
  // Columns 1-6 are small low, middle, high, then big low, middle, high, in both files.
  const [SL, SM, S3, BL, BM, B3] = [1, 2, 3, 4, 5, 6].map((j) => decimal(six.rows.map((row) => row[j] as number | null)));
  const spread = (a: number[], b: number[], c: number[], d: number[]) => a.map((_, t) => (a[t] + b[t]) / 2 - (c[t] + d[t]) / 2);
  if (kind === 'size-momentum') {
    return { dates, legs: { SL, SM, SW: S3, BL, BM, BW: B3 }, factors: { UMD: spread(S3, B3, SL, BL) } };
  }
  return {
    dates,
    legs: { SL, SM, SH: S3, BL, BM, BH: B3 },
    factors: {
      SMB: SL.map((_, t) => (SL[t] + SM[t] + S3[t]) / 3 - (BL[t] + BM[t] + B3[t]) / 3),
      HML: spread(S3, B3, SL, BL),
    },
  };
}

/**
 * The formation signal r_{t-12→t-2}: the compounded return over months t - lookback to t - skip - 1,
 * i.e. returns[t - lookback] through returns[t - skip - 1]. The skipped month is t - 1.
 */
export function formationReturn(
  returns: readonly number[], t: number, { lookback = 12, skip = 1 }: { lookback?: number; skip?: number } = {},
): number {
  if (![t, lookback, skip].every(Number.isInteger) || skip < 0 || lookback <= skip) {
    throw new RangeError('formationReturn: needs integers with 0 ≤ skip < lookback');
  }
  if (t - lookback < 0 || t - skip > returns.length) throw new RangeError('formationReturn: window lies outside the returns');
  return grossGrowth(returns.slice(t - lookback, t - skip)) - 1;
}

export interface BearMarketRegression {
  /** I_{B,t-1} for the fitted months t = lookback, …, T - 1 (aligned with wml.slice(lookback)). */
  bear: number[];
  coefficients: { alpha0: number; alphaB: number; beta0: number; betaB: number };
  /** White (HC0) t-statistics, same keys. */
  tStats: { alpha0: number; alphaB: number; beta0: number; betaB: number };
  /** The ols fit, regressors in the order I_{B,t-1}, R^e_{m,t}, I_{B,t-1}·R^e_{m,t}, after the intercept. */
  fit: OLSResult;
}

/**
 * WML_t = α_0 + α_B I_{B,t-1} + (β_0 + β_B I_{B,t-1}) R^e_{m,t} + ε_t, with I_{B,t-1} = 1 when the compounded
 * market excess return over months t - lookback to t - 1 is negative. White (HC0) standard errors.
 * wml and market are aligned decimal monthly returns; the first lookback months only feed the indicator.
 */
export function bearMarketRegression(
  wml: readonly number[], market: readonly number[], { lookback = 24 }: { lookback?: number } = {},
): BearMarketRegression {
  if (wml.length !== market.length) throw new RangeError('bearMarketRegression: wml and market need the same months');
  if (!Number.isInteger(lookback) || lookback < 1) throw new RangeError('bearMarketRegression: lookback must be a positive integer');
  const months = market.map((_, t) => t).slice(lookback);
  const bear = months.map((t) => Number(grossGrowth(market.slice(t - lookback, t)) < 1));
  const mkt = months.map((t) => market[t]);
  const fit = ols(months.map((t) => wml[t]), [bear, mkt, bear.map((b, s) => b * mkt[s])], { errors: 'white' });
  const named = ([alpha0, alphaB, beta0, betaB]: number[]) => ({ alpha0, alphaB, beta0, betaB });
  return { bear, coefficients: named(fit.coefficients), tStats: named(fit.tStats), fit };
}

export interface Observation {
  index: number;
  date: string;
  value: number;
}

/** The k lowest values, worst first; ties keep date order. */
export function worstMonths(dates: readonly string[], values: readonly number[], k: number): Observation[] {
  if (dates.length !== values.length) throw new RangeError('worstMonths: dates and values need the same length');
  return values.map((value, index) => ({ index, date: dates[index], value }))
    .sort((a, b) => a.value - b.value || a.index - b.index)
    .slice(0, k);
}

/** The `months` observations just before date (date itself excluded), fewer if the data start sooner. */
export function windowBefore(
  dates: readonly string[], values: readonly number[], date: string, months: number,
): { dates: string[]; values: number[] } {
  if (dates.length !== values.length) throw new RangeError('windowBefore: dates and values need the same length');
  const end = dates.indexOf(date);
  if (end < 0) throw new RangeError(`windowBefore: no observation on ${date}`);
  const start = Math.max(0, end - months);
  return { dates: dates.slice(start, end), values: values.slice(start, end) };
}

export interface SpanningTest {
  /** One entry per new factor. */
  alpha: number[];
  /** Classical OLS t-statistic of α̂ (timeSeriesRegressions). */
  alphaT: number[];
  /** White (HC0) t-statistic of α̂. */
  alphaTWhite: number[];
  /** M × K: row j is β̂_j'. */
  beta: number[][];
  r2: number[];
  /** GRS test that every α is zero; only with two or more new factors. */
  grs?: GrsResult;
}

/**
 * Spanning regressions f_{new,t} = α + β' f_t + ε_t of each new factor on the base factors. A new factor
 * adds to the base only if α ≠ 0. newFactors is T × M, baseFactors T × K, decimal returns.
 */
export function spanningTest(newFactors: readonly (readonly number[])[], baseFactors: readonly (readonly number[])[]): SpanningTest {
  const fit = timeSeriesRegressions(newFactors, baseFactors);
  const base = baseFactors[0].map((_, k) => baseFactors.map((row) => row[k]));
  const white = newFactors[0].map((_, j) => ols(newFactors.map((row) => row[j]), base, { errors: 'white' }));
  return {
    alpha: fit.alpha,
    alphaT: fit.alphaT,
    alphaTWhite: white.map((w) => w.tStats[0]),
    beta: fit.beta,
    r2: white.map((w) => w.r2),
    ...(newFactors[0].length > 1 ? { grs: grs(newFactors, baseFactors) } : {}),
  };
}
