// The factor zoo: each published predictor's mean long–short return and t-statistic in its original
// sample and after it, counts above a significance line, and how a change of portfolio construction
// moves them. OSAP returns (Chen and Zimmermann 2022) are percent per month; outputs are decimals.
//
// Thresholds the chapter draws: |t| = 1.96 is the single-test 5% cutoff; Harvey, Liu and Zhu (2016,
// RFS 29, 5–68) argue that a new factor needs t > 3.0 (abstract, p. 5). Hou, Xue and Zhang (2020,
// RFS 33, 2019–2133) find that 65% of 452 anomalies fail |t| ≥ 1.96 once microcaps, stocks below
// the NYSE 20th size percentile, are controlled with NYSE breakpoints and value weights (p. 2020).
import type { OsapSignal } from '../data/osap-signals';
import type { Series } from '../data/series';
import { arithmeticMean } from './returns';
import { meanStandardError } from '../stats/moments';

/** Portfolio constructions with committed data. OSAP's value-weighted and NYSE-20th-percentile
 * variants were measured but not committed (docs/DATA.md), so only the original papers' remain. */
export const constructionSeries = { original: 'osap-ls-monthly' } as const;
export type Construction = keyof typeof constructionSeries;
export type ZooWindow = 'original' | 'post';

/** A window needs at least this many non-null months for a mean and t-statistic. */
export const minimumMonths = 24;

export interface WindowSummary {
  months: number;
  /** Decimal per month. */
  mean: number;
  /** r̄ / (s / √T), s the n - 1 sample standard deviation. */
  t: number;
}

export interface SignalSummary {
  acronym: string;
  publicationYear: number;
  /** January of sampleStartYear to December of sampleEndYear, cut to the data's 1963-01 start. */
  original: WindowSummary | null;
  /** Months after December of sampleEndYear. */
  post: WindowSummary | null;
}

function summarise(percent: number[]): WindowSummary | null {
  if (percent.length < minimumMonths) return null;
  const decimal = percent.map((r) => r / 100);
  const mean = arithmeticMean(decimal);
  return { months: decimal.length, mean, t: mean / meanStandardError(decimal) };
}

/** One summary per signal, in the order of `signals`. Null months are skipped. */
export function signalSummaries(
  returns: Series<(typeof constructionSeries)[Construction]>,
  signals: readonly OsapSignal[],
  { construction }: { construction: Construction },
): SignalSummary[] {
  if (returns.id !== constructionSeries[construction]) throw new RangeError(`signalSummaries: ${returns.id} is not the ${construction} construction`);
  return signals.map(({ acronym, publicationYear, sampleStartYear, sampleEndYear }) => {
    const index = returns.columns.findIndex(({ name }) => name === acronym);
    if (index < 1) throw new RangeError(`signalSummaries: no return column for ${acronym}`);
    const original: number[] = [];
    const post: number[] = [];
    for (const row of returns.rows) {
      const value = row[index] as number | null;
      if (value === null) continue;
      const year = Number(row[0].slice(0, 4));
      if (year > sampleEndYear) post.push(value);
      else if (year >= sampleStartYear) original.push(value);
    }
    return { acronym, publicationYear, original: summarise(original), post: summarise(post) };
  });
}

/** Signals with |t| strictly above the threshold in the window; null windows do not count. */
export function countAbove(summaries: readonly SignalSummary[], threshold: number, window: ZooWindow): number {
  return summaries.filter((s) => { const w = s[window]; return w !== null && Math.abs(w.t) > threshold; }).length;
}

function median(values: number[]): number {
  const sorted = [...values].sort((x, y) => x - y);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface ConstructionComparison {
  /** Signals with an original-sample summary under both constructions. */
  common: number;
  /** Of those, how many have |t| above the threshold under a and not under b. */
  crossedBelow: number;
  /** Median of mean_b / mean_a over the common signals; null if there are none. */
  medianMeanRatio: number | null;
}

/** Compares original-sample results, matching signals by acronym (HXZ's in-sample test). */
export function compareConstructions(a: readonly SignalSummary[], b: readonly SignalSummary[], threshold: number): ConstructionComparison {
  const inB = new Map(b.map((s) => [s.acronym, s.original]));
  const pairs = a.flatMap((s) => {
    const other = inB.get(s.acronym);
    return s.original && other ? [[s.original, other] as const] : [];
  });
  return {
    common: pairs.length,
    crossedBelow: pairs.filter(([x, y]) => Math.abs(x.t) > threshold && Math.abs(y.t) <= threshold).length,
    medianMeanRatio: pairs.length ? median(pairs.map(([x, y]) => y.mean / x.mean)) : null,
  };
}

export interface PublicationYear {
  year: number;
  acronyms: string[];
  /** Signals published in this year or earlier. */
  cumulative: number;
}

/** Years with at least one signal, ascending; acronyms keep their input order. */
export function byPublicationYear(summaries: readonly SignalSummary[]): PublicationYear[] {
  const groups = new Map<number, string[]>();
  for (const { publicationYear, acronym } of summaries) groups.set(publicationYear, [...(groups.get(publicationYear) ?? []), acronym]);
  let cumulative = 0;
  return [...groups].sort(([x], [y]) => x - y).map(([year, acronyms]) => ({ year, acronyms, cumulative: (cumulative += acronyms.length) }));
}
