import { useEffect, useState } from 'react';
import { getColumn, loadSeries, type Series } from '../../lib/data/series';
import { modelPanel, sortFactors } from '../../lib/finance/factors';
import { sampleMeans } from '../../lib/finance/portfolio';
import { arithmeticMean, growthPath } from '../../lib/finance/returns';
import { grs, timeSeriesRegressions, type GrsResult } from '../../lib/finance/timeSeriesTests';
import { annualiseMean, meanStandardError } from '../../lib/stats/moments';
import { fCritical, useFactorData } from './factorTestSample';

export type GridModel = 'capm' | 'ff3' | 'ff5';
export const GRID_MODELS: { value: GridModel; label: string }[] = [
  { value: 'capm', label: 'CAPM' },
  { value: 'ff3', label: 'FF3' },
  { value: 'ff5', label: 'FF5' },
];
/** FF5 starts in 1963-07, so all three models share this sample. */
export const GRID_START = '1963-07-01';

type ModelData = { ff3: Series<'ff3-monthly'>; ff5: Series<'ff5-monthly'>; ff25: Series<'ff25-size-bm-monthly'> };

export interface GridView {
  first: string;
  last: string;
  T: number;
  N: number;
  K: number;
  /** ME1-BM1 … ME5-BM5: size quintile rises in groups of five, book-to-market inside each. */
  names: string[];
  factorNames: string[];
  /** Annualised mean excess returns (×12); the same for every model. */
  mean: number[];
  /** Annualised alphas (×12) and their classical t-statistics. */
  alpha: number[];
  alphaT: number[];
  /** N × K loadings, columns in factorNames order. */
  beta: number[][];
  grs: GrsResult;
  /** 5% critical value of F(N, T − N − K). */
  critical5: number;
}

/** Means, alphas, loadings and GRS of the 25 size–B/M portfolios on one model, from GRID_START to the end. */
export function gridView({ ff3, ff5, ff25 }: ModelData, model: GridModel): GridView {
  const panel = modelPanel({ ff3, ff5 }, ff25, { start: GRID_START, model });
  const fit = timeSeriesRegressions(panel.excess, panel.factors);
  const result = grs(panel.excess, panel.factors);
  return {
    first: panel.dates[0].slice(0, 7),
    last: panel.dates.at(-1)!.slice(0, 7),
    T: panel.dates.length,
    N: panel.names.length,
    K: panel.factorNames.length,
    names: panel.names,
    factorNames: panel.factorNames,
    mean: sampleMeans(panel.excess).map((m) => annualiseMean(m)),
    alpha: fit.alpha.map((a) => annualiseMean(a)),
    alphaT: fit.alphaT,
    beta: fit.beta,
    grs: result,
    critical5: fCritical(0.05, result.df1, result.df2),
  };
}

export type SortKind = 'size-value' | 'size-momentum';
type SixId = 'ff6-size-bm-monthly' | 'ff6-size-mom-monthly';

/** Presentation of each 2×3 sort. The weights only mark the long (+) and short (−) legs; sortFactors computes. */
export const SORTS = {
  'size-value': {
    six: 'ff6-size-bm-monthly',
    published: 'ff3-monthly',
    second: ['growth (low B/M)', 'neutral', 'value (high B/M)'],
    legs: ['SL', 'SM', 'SH', 'BL', 'BM', 'BH'],
    factors: {
      SMB: { name: 'small minus big', column: 'SMB', weights: [1 / 3, 1 / 3, 1 / 3, -1 / 3, -1 / 3, -1 / 3] },
      HML: { name: 'high minus low', column: 'HML', weights: [-1 / 2, 0, 1 / 2, -1 / 2, 0, 1 / 2] },
    },
  },
  'size-momentum': {
    six: 'ff6-size-mom-monthly',
    published: 'mom-monthly',
    second: ['losers', 'middle', 'winners'],
    legs: ['SL', 'SM', 'SW', 'BL', 'BM', 'BW'],
    factors: {
      UMD: { name: 'up minus down', column: 'Mom', weights: [-1 / 2, 0, 1 / 2, -1 / 2, 0, 1 / 2] },
    },
  },
} as const;

export const WINDOWS = [
  { value: 'all', label: 'all months', start: '1926-07-01', end: '9999-12-31' },
  { value: 'pre1963', label: '1926-07 to 1963-06', start: '1926-07-01', end: '1963-06-30' },
  { value: 'ff1992', label: '1963-07 to 1990-12', start: '1963-07-01', end: '1990-12-31' },
  { value: 'post1990', label: '1991-01 to the end', start: '1991-01-01', end: '9999-12-31' },
  { value: 'post2006', label: '2007-01 to the end', start: '2007-01-01', end: '9999-12-31' },
] as const;
export type Window = (typeof WINDOWS)[number]['value'];

export interface SortData {
  six: Series<SixId>;
  /** The published series with the factor columns: ff3-monthly or mom-monthly. */
  published: Series<'ff3-monthly'> | Series<'mom-monthly'>;
}

export interface BuildView {
  first: string;
  last: string;
  T: number;
  /** Annualised mean return of each of the six legs, in SORTS[kind].legs order. */
  legMean: number[];
  dates: string[];
  /** Wealth paths of $1 in the rebuilt and the published factor (T + 1 values each). */
  rebuiltPath: number[];
  publishedPath: number[];
  /** Largest absolute monthly gap between rebuilt and published factor (decimal), and its month. */
  gap: number;
  gapDate: string;
  /** Annualised mean of the rebuilt factor and the t-statistic of its monthly mean. */
  mean: number;
  meanT: number;
}

/** Rebuild one factor from the six portfolios over a window and compare it with the published factor. */
export function buildView({ six, published }: SortData, kind: SortKind, factor: string, window: Window): BuildView {
  const sort = SORTS[kind];
  const spec = (sort.factors as Record<string, { column: string }>)[factor];
  if (!spec) throw new RangeError(`buildView: no factor ${factor} in ${kind}`);
  const built = kind === 'size-value'
    ? sortFactors(six as Series<'ff6-size-bm-monthly'>, kind)
    : sortFactors(six as Series<'ff6-size-mom-monthly'>, kind);
  const rebuilt = (built.factors as Record<string, number[]>)[factor];
  const publishedColumn = getColumn(published as Series, spec.column as never);
  const publishedAt = new Map(published.rows.map(([date], t) => [date, publishedColumn[t]]));
  const { start, end } = WINDOWS.find((w) => w.value === window)!;
  // Months inside the window that both files have.
  const months = built.dates.flatMap((date, t) => (date >= start && date <= end && publishedAt.get(date) != null ? [t] : []));
  const ours = months.map((t) => rebuilt[t]);
  const theirs = months.map((t) => (publishedAt.get(built.dates[t]) as number) / 100);
  const gaps = ours.map((v, s) => Math.abs(v - theirs[s]));
  const worst = gaps.indexOf(Math.max(...gaps));
  const legs = sort.legs.map((leg) => (built.legs as Record<string, number[]>)[leg]);
  return {
    first: built.dates[months[0]].slice(0, 7),
    last: built.dates[months.at(-1)!].slice(0, 7),
    T: months.length,
    legMean: legs.map((values) => annualiseMean(arithmeticMean(months.map((t) => values[t])))),
    dates: months.map((t) => built.dates[t]),
    rebuiltPath: growthPath(ours, 'simple'),
    publishedPath: growthPath(theirs, 'simple'),
    gap: gaps[worst],
    gapDate: built.dates[months[worst]].slice(0, 7),
    mean: annualiseMean(arithmeticMean(ours)),
    meanT: arithmeticMean(ours) / meanStandardError(ours),
  };
}

/** Load ff3-monthly and ff25-size-bm-monthly through factorTestSample, and ff5-monthly. */
export function useModelData(): { data: ModelData | null; failed: boolean } {
  const base = useFactorData();
  const [ff5, setFf5] = useState<Series<'ff5-monthly'> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadSeries('ff5-monthly').then(setFf5, () => setFailed(true));
  }, []);
  return { data: base.data && ff5 ? { ...base.data, ff5 } : null, failed: failed || base.failed };
}

/** Load the six portfolios of one sort and the file with its published factors. */
export function useSortData(kind: SortKind): { data: SortData | null; failed: boolean } {
  const [data, setData] = useState<SortData | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const { six, published } = SORTS[kind];
    Promise.all([loadSeries(six), loadSeries(published)])
      .then(([s, p]) => setData({ six: s, published: p as SortData['published'] }), () => setFailed(true));
  }, [kind]);
  return { data, failed };
}
