import { useEffect, useState } from 'react';
import { betweenDates, loadSeries, type Series } from '../../lib/data/series';
import { cayInputs, fullSampleCay, quarterlyExcessReturns, realTimeCay } from '../../lib/finance/cay';
import { fitAR1, predictiveRegression } from '../../lib/finance/predictive';
import { combination, dynamicOLS, simulateCointegratedPair } from '../../lib/stats/cointegration';

/** CointegrationDemo: y_t = 0.6 x_t + u_t, with a random walk x and an AR(1) gap u of persistence 0.5. */
export const PAIR = { T: 300, beta: 0.6, phi: 0.5 };
export const DEFAULT_PAIR_SEED = 2;
/** Leads and lags of the demo's dynamic OLS: a short simulated sample needs fewer than LL's 8. */
export const PAIR_LEADS = 2;

export function pairSample(seed: number) {
  const { x, y } = simulateCointegratedPair({ ...PAIR, seed });
  return { x, y, estimate: dynamicOLS(y, [x], { leads: PAIR_LEADS, lags: PAIR_LEADS }).beta[0] };
}

/** y − w x and its AR(1) persistence. */
export function pairCombination(pair: { x: number[]; y: number[] }, w: number) {
  const z = combination(pair.y, pair.x, w);
  return { z, persistence: fitAR1(z).phi };
}

/** CayLookAhead: the last quarter of the full-sample estimate. 1998-Q3 is the end of LL's sample (p. 822). */
export const SAMPLE_ENDS = ['1998-07-01', '2019-10-01', '2026-04-01'] as const;
export type SampleEnd = (typeof SAMPLE_ENDS)[number];
export const quarterName = (date: string) => `${date.slice(0, 4)}-Q${(Number(date.slice(5, 7)) + 2) / 3}`;

export interface LookAheadData {
  series: Series<'fred-cay-quarterly'>;
  /** Real-time cay does not depend on the sample end: each date uses only the data up to it. */
  realTime: { dates: string[]; cay: number[] };
  /** Quarterly log excess return, by the quarter it is earned in. */
  returns: Map<string, number>;
}

export function lookAheadData(
  series: Series<'fred-cay-quarterly'>, monthly: Series<'goyal-welch-monthly'>,
): LookAheadData {
  const { dates, r } = quarterlyExcessReturns(monthly);
  return { series, realTime: realTimeCay(cayInputs(series)), returns: new Map(dates.map((d, i) => [d, r[i]])) };
}

/** Both cay series from the first real-time quarter to the sample end, and the regression of
 * next quarter's log excess return on each (Newey–West, 1 lag). */
export function lookAhead(data: LookAheadData, end: SampleEnd) {
  const full = fullSampleCay(cayInputs(betweenDates(data.series, data.series.rows[0][0], end)));
  const fullAt = new Map(full.dates.map((d, i) => [d, full.cay[i]]));
  const realAt = new Map(data.realTime.dates.map((d, i) => [d, data.realTime.cay[i]]));
  // Consecutive quarters: real-time cay has no gaps, and returns cover every quarter from 1926.
  const dates = data.realTime.dates.filter((d) => d <= end && data.returns.has(d));
  const r = dates.map((d) => data.returns.get(d)!);
  const fullCay = dates.map((d) => fullAt.get(d)!);
  const realCay = dates.map((d) => realAt.get(d)!);
  return {
    dates, fullCay, realCay,
    omega: full.omega, betaY: full.betaY, start: full.dates[0],
    fullFit: predictiveRegression(r, fullCay, 1),
    realFit: predictiveRegression(r, realCay, 1),
  };
}

/** Load both series once and build the real-time cay (about 240 regressions); null while working. */
export function useLookAheadData(): { data: LookAheadData | null; failed: boolean } {
  const [data, setData] = useState<LookAheadData | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    Promise.all([loadSeries('fred-cay-quarterly'), loadSeries('goyal-welch-monthly')]).then(([series, monthly]) => {
      // Let the loading message paint before the regressions block the thread.
      timer = window.setTimeout(() => !cancelled && setData(lookAheadData(series, monthly)), 0);
    }, () => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);
  return { data, failed };
}
