import { useEffect, useMemo, useState } from 'react';
import { getColumn, loadSeries, type Series } from '../../lib/data/series';
import { logReturn, simpleReturn } from '../../lib/finance/returns';
import { forwardSums, simulatePredictive } from '../../lib/finance/predictive';
import { autocorrelations } from '../../lib/stats/autocorr';
import { ols } from '../../lib/stats/ols';

export type Source = 'data' | 'sim';
export const DEFAULT_SEED = 1;
/** Longest lag the HAC widget shows. */
export const MAX_LAG = 24;
/** Months in the simulated sample: the style-guide default T. */
export const SIM_MONTHS = 600;
/** Monthly volatility of the simulated returns. */
export const SIM_SIGMA = 0.045;

/** Monthly log returns of the S&P composite, price plus one-twelfth of the annual dividend rate.
 * dates[t] is the month in which r[t] ends.
 */
export function shillerLogReturns(series: Series<'shiller-monthly'>): { dates: string[]; r: number[] } {
  const price = getColumn(series, 'price');
  const dividend = getColumn(series, 'dividend');
  const dates: string[] = [];
  const r: number[] = [];
  for (let t = 1; t < series.rows.length; t++) {
    const p0 = price[t - 1];
    const p1 = price[t];
    const d = dividend[t];
    if (p0 == null || p1 == null || d == null) throw new RangeError(`Missing Shiller value at ${series.rows[t][0]}`);
    dates.push(series.rows[t][0]);
    r.push(logReturn(simpleReturn(p0, p1, d / 12)));
  }
  return { dates, r };
}

/** Seeded i.i.d. monthly log returns at the style-guide default: mean 0.5%, volatility 4.5%. */
export function simulatedLogReturns(seed: number): number[] {
  return simulatePredictive({ T: SIM_MONTHS, b1: 0, sigmaR: SIM_SIGMA, seed }).r;
}

export interface HACPath {
  /** Overlapping k-month log returns, one per starting month. */
  y: number[];
  mean: number;
  /** Residual autocorrelations at lags 0..MAX_LAG. */
  rho: number[];
  /** Newey–West standard error of the mean for L = 0..MAX_LAG. */
  se: number[];
}

/** Overlapping k-month log returns, one per starting month: r[0..k-1], r[1..k], ...
 * forwardSums treats entry 0 as a predictor date and skips it; a leading 0 keeps every return.
 */
export function overlappingSums(r: readonly number[], k: number): number[] {
  return forwardSums([0, ...r], k);
}

/** Regress k-month returns on a constant and read the residual ACF and the Newey–West SE at every L. */
export function hacPath(r: readonly number[], k: number): HACPath {
  const y = overlappingSums(r, k);
  const fits = Array.from({ length: MAX_LAG + 1 }, (_, L) => ols(y, [], { errors: 'newey-west', lags: L }));
  return {
    y, mean: fits[0].coefficients[0],
    rho: autocorrelations(fits[0].residuals, MAX_LAG),
    se: fits.map((fit) => fit.standardErrors[0]),
  };
}

/** Load shiller-monthly once; return the chosen monthly log returns, or null while loading. */
export function useMonthlyReturns(source: Source, seed: number): { r: number[] | null; label: string; failed: boolean } {
  const [data, setData] = useState<{ dates: string[]; r: number[] } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadSeries('shiller-monthly').then((series) => setData(shillerLogReturns(series)), () => setFailed(true));
  }, []);
  const r = useMemo(() => (source === 'sim' ? simulatedLogReturns(seed) : data?.r ?? null), [data, source, seed]);
  const label = source === 'sim'
    ? `simulation with seed ${seed}`
    : data ? `shiller-monthly, ${data.dates[0].slice(0, 7)} to ${data.dates.at(-1)!.slice(0, 7)}` : 'shiller-monthly';
  return { r, label, failed };
}
