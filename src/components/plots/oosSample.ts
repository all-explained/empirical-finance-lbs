import { useEffect, useState } from 'react';
import { loadSeries, type Series } from '../../lib/data/series';
import {
  certaintyEquivalentGain, clarkWest, cumulativeSquaredErrorDifference, expandingForecasts, goyalWelchPredictors,
  oosR2, type GoyalWelchPredictorName, type GoyalWelchPredictors,
} from '../../lib/finance/outOfSample';
import { sampleVariance } from '../../lib/finance/returns';

export type Frequency = 'annual' | 'monthly';
export const PERIODS_PER_YEAR: Record<Frequency, number> = { annual: 1, monthly: 12 };
/** Goyal & Welch (2008, p. 1464) start forecasting 20 years after a predictor's data begin. */
export const MIN_YEARS = 20;
/** Every predictor has a forecast from this year on, at both frequencies (monthly ntis starts in 1926-12). */
export const FIRST_YEAR_MIN = 1947;
export const FIRST_YEAR_MAX = 2000;
/** Goyal & Welch (2008, p. 1464) also start the forecasts in 1965. */
export const DEFAULT_FIRST_YEAR = 1965;

/** The 12 predictors of goyalWelchPredictors. `sign` is the slope sign the economic story expects:
 * our teaching choice, used only by the slope restriction.
 */
export const PREDICTORS: readonly { key: GoyalWelchPredictorName; name: string; sign: 1 | -1 }[] = [
  { key: 'dp', name: 'dividend–price ratio (dp)', sign: 1 },
  { key: 'dy', name: 'dividend yield (dy)', sign: 1 },
  { key: 'ep', name: 'earnings–price ratio (ep)', sign: 1 },
  { key: 'de', name: 'payout ratio (de)', sign: 1 },
  { key: 'bm', name: 'book-to-market (bm)', sign: 1 },
  { key: 'ntis', name: 'net equity issues (ntis)', sign: -1 },
  { key: 'tbl', name: 'T-bill rate (tbl)', sign: -1 },
  { key: 'lty', name: 'long-term yield (lty)', sign: -1 },
  { key: 'tms', name: 'term spread (tms)', sign: 1 },
  { key: 'dfy', name: 'default spread (dfy)', sign: 1 },
  { key: 'infl', name: 'inflation (infl)', sign: -1 },
  { key: 'svar', name: 'stock variance (svar)', sign: 1 },
];

export interface Restrictions {
  /** Use the historical mean when the slope has the wrong sign. */
  slope: boolean;
  /** Replace a negative forecast by zero. */
  floor: boolean;
}

export interface Run {
  /** Date of each forecast return (the period it is earned in). */
  dates: string[];
  actual: number[];
  forecast: number[];
  benchmark: number[];
  /** Sample variance of the same returns as the benchmark mean, known before the forecast period. */
  variance: number[];
}

export function predictorsFromSeries(
  series: Series<'goyal-welch-annual'> | Series<'goyal-welch-monthly'>,
): GoyalWelchPredictors {
  return series.frequency === 'annual'
    ? goyalWelchPredictors(series as Series<'goyal-welch-annual'>, 'annual')
    : goyalWelchPredictors(series as Series<'goyal-welch-monthly'>, 'monthly');
}

/** Expanding-window forecasts of one predictor over the span where it has data. */
export function predictorRun(
  data: GoyalWelchPredictors, key: GoyalWelchPredictorName, frequency: Frequency, restrictions: Restrictions,
): Run {
  const all = data.predictors[key];
  const start = all.findIndex((v) => v != null);
  const x = all.slice(start);
  // Source gaps sit only at the start (docs/DATA.md); a later gap would be a data change.
  if (x.some((v) => v == null)) throw new RangeError(`${key} has an interior gap`);
  const r = data.r.slice(start);
  const sign = PREDICTORS.find((p) => p.key === key)!.sign;
  const f = expandingForecasts(r, x as number[], {
    minWindow: MIN_YEARS * PERIODS_PER_YEAR[frequency],
    expectedSign: restrictions.slope ? sign : undefined,
    floorAtZero: restrictions.floor,
  });
  return {
    dates: f.index.map((i) => data.dates[start + i]),
    actual: f.actual,
    forecast: f.forecast,
    benchmark: f.benchmark,
    // The benchmark of the forecast at index i is the mean of r[1..i-1].
    variance: f.index.map((i) => sampleVariance(r.slice(1, i))),
  };
}

/** Calendar position of a date for the x-axis: the year, plus the month as a fraction. */
export const yearPosition = (date: string) => Number(date.slice(0, 4)) + (Number(date.slice(5, 7)) - 1) / 12;

export interface Race {
  x: number[];
  /** Running Σ[(r − r̄)² − (r − r̂)²] from the first forecast year. */
  gain: number[];
  r2: number;
  clarkWest: { statistic: number; pValue: number };
  /** Certainty-equivalent gain in log-return units per year (γ = 3, weights in [0, 1.5]). */
  ceGain: number;
  first: string;
  last: string;
}

/** The statistics of one run over the forecasts from firstYear on. */
export function race(run: Run, firstYear: number, frequency: Frequency): Race {
  const from = run.dates.findIndex((d) => Number(d.slice(0, 4)) >= firstYear);
  if (from < 0) throw new RangeError(`No forecasts from ${firstYear}`);
  const cut = (values: number[]) => values.slice(from);
  const [actual, forecast, benchmark, variance] = [run.actual, run.forecast, run.benchmark, run.variance].map(cut);
  const dates = cut(run.dates);
  return {
    x: dates.map(yearPosition),
    gain: cumulativeSquaredErrorDifference(actual, forecast, benchmark),
    r2: oosR2(actual, forecast, benchmark),
    clarkWest: clarkWest(actual, forecast, benchmark),
    ceGain: certaintyEquivalentGain(actual, forecast, benchmark, variance, { periodsPerYear: PERIODS_PER_YEAR[frequency] }),
    first: dates[0],
    last: dates.at(-1)!,
  };
}

const runCache = new Map<string, Run>();
const dataCache = new Map<Frequency, Promise<GoyalWelchPredictors>>();
const runKey = (frequency: Frequency, r: Restrictions, key: string) => `${frequency}|${r.slope}|${r.floor}|${key}`;

/**
 * Runs of all 12 predictors, computed one predictor per task so the page stays responsive
 * (a monthly predictor takes about half a second). runs is null until all 12 are ready.
 */
export function useRuns(frequency: Frequency, restrictions: Restrictions) {
  const { slope, floor } = restrictions;
  const [state, setState] = useState<{ id: string; runs: Run[] | null; done: number; failed: boolean }>(
    { id: '', runs: null, done: 0, failed: false },
  );
  useEffect(() => {
    const id = `${frequency}|${slope}|${floor}`;
    let cancelled = false;
    let timer = 0;
    const r = { slope, floor };
    if (!dataCache.has(frequency)) {
      dataCache.set(frequency, loadSeries(frequency === 'annual' ? 'goyal-welch-annual' : 'goyal-welch-monthly')
        .then(predictorsFromSeries));
    }
    setState({ id, runs: null, done: 0, failed: false });
    dataCache.get(frequency)!.then((data) => {
      const step = (i: number) => {
        if (cancelled) return;
        if (i === PREDICTORS.length) {
          setState({ id, runs: PREDICTORS.map((p) => runCache.get(runKey(frequency, r, p.key))!), done: i, failed: false });
          return;
        }
        const key = runKey(frequency, r, PREDICTORS[i].key);
        const cached = runCache.has(key);
        if (!cached) runCache.set(key, predictorRun(data, PREDICTORS[i].key, frequency, r));
        setState((s) => ({ ...s, done: i + 1 }));
        // Yield to the browser only after real work, so cached runs appear at once.
        if (cached) step(i + 1); else timer = window.setTimeout(() => step(i + 1), 0);
      };
      step(0);
    }, () => !cancelled && setState({ id, runs: null, done: 0, failed: true }));
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [frequency, slope, floor]);
  return state;
}
