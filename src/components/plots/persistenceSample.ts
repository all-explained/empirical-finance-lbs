import { useEffect, useState } from 'react';
import { getColumn, loadSeries, type Series } from '../../lib/data/series';
import { fitVAR1, forecastVAR1, type VAR1Fit } from '../../lib/stats/var';

export type Model = 'var' | 'ar';

/** Chapter 5: log dividend–price and log earnings–price ratios from shiller-monthly. */
export interface Valuation {
  dates: string[];
  /** Decimal year of each month, for a time axis: 1881-01 is 1881.0. */
  years: number[];
  dp: number[];
  ep: number[];
}

/** shiller-monthly keeps only complete rows (docs/DATA.md), so every month has a price, dividend and earnings. */
export function shillerValuation(series: Series<'shiller-monthly'>): Valuation {
  const price = getColumn(series, 'price') as number[];
  const dividend = getColumn(series, 'dividend') as number[];
  const earnings = getColumn(series, 'earnings') as number[];
  const dates = series.rows.map(([date]) => date);
  return {
    dates,
    years: dates.map((d) => Number(d.slice(0, 4)) + (Number(d.slice(5, 7)) - 1) / 12),
    dp: dividend.map((d, t) => Math.log(d) - Math.log(price[t])),
    ep: earnings.map((e, t) => Math.log(e) - Math.log(price[t])),
  };
}

/** Load shiller-monthly once; null while loading. */
export function useValuation(): { data: Valuation | null; failed: boolean } {
  const [data, setData] = useState<Valuation | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadSeries('shiller-monthly').then((series) => setData(shillerValuation(series)), () => setFailed(true));
  }, []);
  return { data, failed };
}

/** "June 2023" from "2023-06-01". */
export function monthName(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** The VAR(1) of z = (dp, ep) and, for comparison, one AR(1) per series (a VAR(1) with one variable). */
export function valuationModels(data: Valuation): { var: VAR1Fit; dp: VAR1Fit; ep: VAR1Fit } {
  return { var: fitVAR1([data.dp, data.ep]), dp: fitVAR1([data.dp]), ep: fitVAR1([data.ep]) };
}

/** Forecast of (dp, ep) k months after origin index t, by the joint VAR or by two separate AR(1)s. */
export function valuationForecast(models: ReturnType<typeof valuationModels>, data: Valuation, t: number, k: number, model: Model): [number, number] {
  if (model === 'var') {
    const [dp, ep] = forecastVAR1(models.var, [data.dp[t], data.ep[t]], k);
    return [dp, ep];
  }
  return [forecastVAR1(models.dp, [data.dp[t]], k)[0], forecastVAR1(models.ep, [data.ep[t]], k)[0]];
}
