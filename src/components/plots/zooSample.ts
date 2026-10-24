import { useEffect, useState } from 'react';
import { loadOsapSignals, type OsapSignal } from '../../lib/data/osap-signals';
import { betweenDates, getColumn, loadSeries, type Series } from '../../lib/data/series';
import { spanningTest, type FactorName } from '../../lib/finance/factors';
import { byPublicationYear, compareConstructions, constructionSeries, countAbove, signalSummaries, type Construction, type SignalSummary } from '../../lib/finance/zoo';

/** The constructions with committed data (only the original papers' today; see docs/DATA.md). */
export const CONSTRUCTIONS: { value: Construction; label: string }[] = [{ value: 'original', label: 'Original papers' }];
export const FACTORS: FactorName[] = ['Mkt-RF', 'SMB', 'HML', 'RMW', 'CMA', 'Mom'];
/** FF5 starts 1963-07, so that is the common sample of the six factors. */
export const SPANNING_START = '1963-07-01';
export type SpanningSample = 'full' | 'early' | 'late';
/** The full common sample and its two halves of about 31 years. */
export const SPANNING_SAMPLES: { value: SpanningSample; label: string; start: string; end: string }[] = [
  { value: 'full', label: '1963–2026', start: SPANNING_START, end: '9999-12-31' },
  { value: 'early', label: '1963–1993', start: SPANNING_START, end: '1993-12-01' },
  { value: 'late', label: '1994–2026', start: '1994-01-01', end: '9999-12-31' },
];

export interface ZooData {
  returns: Record<Construction, Series<(typeof constructionSeries)[Construction]>>;
  signals: readonly OsapSignal[];
  ff5: Series<'ff5-monthly'>;
  mom: Series<'mom-monthly'>;
}

export function zooSummaries(data: ZooData, construction: Construction): SignalSummary[] {
  return signalSummaries(data.returns[construction], data.signals, { construction });
}

export interface ZooCounts {
  total: number;
  /** Signals with |t| above the line in their original sample, and after it (of `withPost`). */
  inSample: number;
  post: number;
  withPost: number;
  /** The chosen construction against the original papers' at the same line. */
  versusOriginal: ReturnType<typeof compareConstructions>;
}

export function zooCounts(original: readonly SignalSummary[], chosen: readonly SignalSummary[], threshold: number): ZooCounts {
  return {
    total: chosen.length,
    inSample: countAbove(chosen, threshold, 'original'),
    post: countAbove(chosen, threshold, 'post'),
    withPost: chosen.filter((s) => s.post !== null).length,
    versusOriginal: compareConstructions(original, chosen, threshold),
  };
}

export { byPublicationYear };

export interface SpanningView {
  factor: FactorName;
  base: FactorName[];
  first: string;
  last: string;
  T: number;
  /** Monthly decimal α̂, its classical and White t-statistics, R², and β̂ on `base`. */
  alpha: number;
  alphaT: number;
  alphaTWhite: number;
  r2: number;
  beta: number[];
  /** The factor's monthly returns, and the part the base explains, β̂'f_t (the fitted value without α̂). */
  actual: number[];
  spanned: number[];
}

/** The six factors as decimal monthly returns on the dates ff5 and mom share, from start to end. */
function factorRows({ ff5, mom }: ZooData, start: string, end: string) {
  const momSlice = betweenDates(mom, start, end);
  const momentum = new Map(getColumn(momSlice, 'Mom').map((v, t) => [momSlice.rows[t][0], v]));
  const five = betweenDates(ff5, start, end);
  const columns = (['Mkt-RF', 'SMB', 'HML', 'RMW', 'CMA'] as const).map((name) => getColumn(five, name));
  const keep = five.rows.flatMap(([date], t) => (momentum.get(date) != null && columns.every((c) => c[t] !== null) ? [t] : []));
  return {
    dates: keep.map((t) => five.rows[t][0]),
    rows: keep.map((t) => [...columns.map((c) => (c[t] as number) / 100), (momentum.get(five.rows[t][0]) as number) / 100]),
  };
}

/** Spanning regression of one factor on the other five, from start (default 1963-07) to end. */
export function spanningView(data: ZooData, factor: FactorName, start = SPANNING_START, end = '9999-12-31'): SpanningView {
  const { dates, rows } = factorRows(data, start, end);
  const j = FACTORS.indexOf(factor);
  const base = FACTORS.filter((_, k) => k !== j);
  const baseRows = rows.map((row) => row.filter((_, k) => k !== j));
  const actual = rows.map((row) => row[j]);
  const fit = spanningTest(actual.map((v) => [v]), baseRows);
  const beta = fit.beta[0];
  return {
    factor, base,
    first: dates[0].slice(0, 7),
    last: dates.at(-1)!.slice(0, 7),
    T: dates.length,
    alpha: fit.alpha[0],
    alphaT: fit.alphaT[0],
    alphaTWhite: fit.alphaTWhite[0],
    r2: fit.r2[0],
    beta,
    actual,
    spanned: baseRows.map((row) => row.reduce((sum, f, k) => sum + beta[k] * f, 0)),
  };
}

/** Load the OSAP returns and documentation, ff5-monthly and mom-monthly once. */
export function useZooData(): { data: ZooData | null; failed: boolean } {
  const [data, setData] = useState<ZooData | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    Promise.all([loadSeries(constructionSeries.original), loadOsapSignals(), loadSeries('ff5-monthly'), loadSeries('mom-monthly')])
      .then(([original, docs, ff5, mom]) => setData({ returns: { original }, signals: docs.signals, ff5, mom }), () => setFailed(true));
  }, []);
  return { data, failed };
}
