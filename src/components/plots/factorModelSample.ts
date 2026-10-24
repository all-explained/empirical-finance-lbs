import { getColumn, type ColumnName, type Series, type SeriesId } from '../../lib/data/series';
import {
  bearMarketRegression, modelPanel, sortFactors, spanningTest, windowBefore, worstMonths, type BearMarketRegression,
} from '../../lib/finance/factors';
import { arithmeticMean, grossGrowth, growthPath, sampleVariance } from '../../lib/finance/returns';
import { annualiseMean, annualiseSharpe, annualiseVolatility, sharpeRatio, skewness } from '../../lib/stats/moments';

export { useSeriesData } from './seriesSample';

// A percent column of series as decimals on the given dates; a missing date or value throws.
function onDates<I extends SeriesId>(series: Series<I>, name: ColumnName<NoInfer<I>>, dates: readonly string[]): number[] {
  const column = getColumn(series, name);
  const at = new Map(series.rows.map(([date], t) => [date, column[t]]));
  return dates.map((date) => {
    const value = at.get(date);
    if (value == null) throw new RangeError(`${series.id}: no ${name} on ${date}`);
    return value / 100;
  });
}

/** Decimal monthly Mom, market excess return (Mkt-RF) and RF on the months of mom-monthly (from 1927-01). */
export interface MomentumSample {
  dates: string[];
  mom: number[];
  market: number[];
  rf: number[];
}

export function momentumSample(ff3: Series<'ff3-monthly'>, mom: Series<'mom-monthly'>): MomentumSample {
  const dates = mom.rows.map(([date]) => date);
  return { dates, mom: onDates(mom, 'Mom', dates), market: onDates(ff3, 'Mkt-RF', dates), rf: onDates(ff3, 'RF', dates) };
}

/** The months of s from start to end (inclusive). */
export function sliceSample(s: MomentumSample, start: string, end = '9999-12-31'): MomentumSample {
  const keep = s.dates.map((date) => date >= start && date <= end);
  const pick = <T,>(values: T[]) => values.filter((_, t) => keep[t]);
  return { dates: pick(s.dates), mom: pick(s.mom), market: pick(s.market), rf: pick(s.rf) };
}

export interface Moments {
  /** Annualised mean (×12), volatility (×√12) and Sharpe ratio (×√12); monthly skewness. */
  mean: number;
  volatility: number;
  sharpe: number;
  skewness: number;
}

export function moments(excess: readonly number[]): Moments {
  return {
    mean: annualiseMean(arithmeticMean(excess)),
    volatility: annualiseVolatility(Math.sqrt(sampleVariance(excess))),
    sharpe: annualiseSharpe(sharpeRatio(excess)),
    skewness: skewness(excess),
  };
}

export const BEAR_LOOKBACK = 24;

export interface Crash {
  index: number;
  date: string;
  mom: number;
  market: number;
  /** I_{B,t-1}: 1 when the market excess return compounded over the 24 months before is negative; null before 1929-01. */
  bear: number | null;
  /** That compounded 24-month market excess return. */
  pastMarket: number | null;
  /** $1 compounded in Mkt-RF and in Mom over the months before the crash, then through the crash month. */
  window: { dates: string[]; market: number[]; mom: number[] };
}

/** The k worst months of Mom with the market's path before each, and the bear-market regression on the full sample. */
export function crashView(s: MomentumSample, k: number, before: number): { crashes: Crash[]; regression: BearMarketRegression } {
  const regression = bearMarketRegression(s.mom, s.market, { lookback: BEAR_LOOKBACK });
  const crashes = worstMonths(s.dates, s.mom, k).map(({ index, date, value }) => {
    const market = windowBefore(s.dates, s.market, date, before);
    const mom = windowBefore(s.dates, s.mom, date, before);
    const fitted = index >= BEAR_LOOKBACK;
    return {
      index, date, mom: value, market: s.market[index],
      bear: fitted ? regression.bear[index - BEAR_LOOKBACK] : null,
      pastMarket: fitted ? grossGrowth(s.market.slice(index - BEAR_LOOKBACK, index)) - 1 : null,
      window: {
        dates: [...market.dates, date],
        market: growthPath([...market.values, s.market[index]], 'simple'),
        mom: growthPath([...mom.values, value], 'simple'),
      },
    };
  });
  return { crashes, regression };
}

/**
 * Mom regressed on the FF3 factors from start: the spanning regression of factors.ts on the 'carhart' panel of
 * modelPanel. Alpha annualised (×12), with classical and White t-statistics.
 */
export function momentumAlpha(
  data: { ff3: Series<'ff3-monthly'>; mom: Series<'mom-monthly'>; ff25: Series<'ff25-size-bm-monthly'> }, start: string, end?: string,
) {
  const panel = modelPanel({ ff3: data.ff3, mom: data.mom }, data.ff25, { start, end, model: 'carhart' });
  const test = spanningTest(panel.factors.map((row) => [row[3]]), panel.factors.map((row) => row.slice(0, 3)));
  return {
    first: panel.dates[0].slice(0, 7), last: panel.dates.at(-1)!.slice(0, 7), T: panel.dates.length,
    alpha: annualiseMean(test.alpha[0]), alphaT: test.alphaT[0], alphaTWhite: test.alphaTWhite[0], beta: test.beta[0], r2: test.r2[0],
  };
}

export type SortKind = 'size-value' | 'size-momentum';
export const SORT_SERIES = {
  'size-value': ['ff3-monthly', 'ff6-size-bm-monthly'],
  'size-momentum': ['ff3-monthly', 'mom-monthly', 'ff6-size-mom-monthly'],
} as const;
export type SortData = Partial<{
  'ff3-monthly': Series<'ff3-monthly'>;
  'mom-monthly': Series<'mom-monthly'>;
  'ff6-size-bm-monthly': Series<'ff6-size-bm-monthly'>;
  'ff6-size-mom-monthly': Series<'ff6-size-mom-monthly'>;
}>;

export interface RebuiltFactor {
  name: string;
  /** The published series it is checked against. */
  published: string;
  /** Leg weights: +1/2 or +1/3 for long legs, negative for short legs, 0 for legs left out. */
  weights: Record<string, number>;
  rebuilt: number[];
  publishedReturns: number[];
  /** Annualised means (×12) of the rebuilt and published factor. */
  mean: { rebuilt: number; published: number };
  /** $1 in T-bills plus the factor, compounded monthly: rebuilt and published. */
  growth: { rebuilt: number[]; published: number[] };
  /** Largest |rebuilt − published| in one month. */
  gap: { date: string; value: number };
}

export interface SortView {
  dates: string[];
  /** The six legs in grid order (small row, then big row; low, middle, high second sort). */
  legs: { name: string; mean: number }[];
  factors: RebuiltFactor[];
}

const LEG_WEIGHTS = {
  SMB: { SL: 1 / 3, SM: 1 / 3, SH: 1 / 3, BL: -1 / 3, BM: -1 / 3, BH: -1 / 3 },
  HML: { SL: -1 / 2, SM: 0, SH: 1 / 2, BL: -1 / 2, BM: 0, BH: 1 / 2 },
  UMD: { SL: -1 / 2, SM: 0, SW: 1 / 2, BL: -1 / 2, BM: 0, BW: 1 / 2 },
} as const;

function rebuilt(
  name: 'SMB' | 'HML' | 'UMD', published: string, factor: number[], publishedReturns: number[], rf: number[], dates: string[],
): RebuiltFactor {
  const gaps = factor.map((v, t) => Math.abs(v - publishedReturns[t]));
  const worst = gaps.reduce((best, g, t) => (g > gaps[best] ? t : best), 0);
  return {
    name, published, weights: LEG_WEIGHTS[name], rebuilt: factor, publishedReturns,
    mean: { rebuilt: annualiseMean(arithmeticMean(factor)), published: annualiseMean(arithmeticMean(publishedReturns)) },
    growth: {
      rebuilt: growthPath(factor.map((v, t) => v + rf[t]), 'simple'),
      published: growthPath(publishedReturns.map((v, t) => v + rf[t]), 'simple'),
    },
    gap: { date: dates[worst], value: gaps[worst] },
  };
}

/** The legs of a 2×3 sort and the factors rebuilt from them by sortFactors, against the published factors. */
export function sortView(kind: SortKind, data: SortData): SortView {
  const ff3 = data['ff3-monthly']!;
  const six = kind === 'size-value' ? data['ff6-size-bm-monthly']! : data['ff6-size-mom-monthly']!;
  const published = kind === 'size-value' ? ff3 : data['mom-monthly']!;
  // Months present in the six portfolios and the published factor.
  const months = new Set(published.rows.map(([date]) => date));
  const keep = six.rows.map(([date]) => months.has(date));
  const pick = (values: readonly number[]) => values.filter((_, t) => keep[t]);
  const sort = kind === 'size-value'
    ? sortFactors(six as Series<'ff6-size-bm-monthly'>, 'size-value')
    : sortFactors(six as Series<'ff6-size-mom-monthly'>, 'size-momentum');
  const dates = sort.dates.filter((_, t) => keep[t]);
  const rf = onDates(ff3, 'RF', dates);
  const legs = Object.entries(sort.legs as Record<string, number[]>).map(([name, values]) => ({ name, mean: annualiseMean(arithmeticMean(pick(values))) }));
  const factors = kind === 'size-value'
    ? (['SMB', 'HML'] as const).map((name) => rebuilt(name, name, pick((sort.factors as Record<string, number[]>)[name]), onDates(ff3, name, dates), rf, dates))
    : [rebuilt('UMD', 'Mom', pick((sort.factors as Record<string, number[]>).UMD), onDates(published as Series<'mom-monthly'>, 'Mom', dates), rf, dates)];
  return { dates, legs, factors };
}
