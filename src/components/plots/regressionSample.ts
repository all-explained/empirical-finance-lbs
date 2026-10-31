import { useEffect, useState } from 'react';
import { getColumn, loadSeries, type Series } from '../../lib/data/series';
import { normalRng } from '../../lib/math/rng';

/** 'gmm' (Chapter 26) is the cross-section of first-stage GMM: one dot per quarterly portfolio, see sdfGmmSample. */
export type Source = 'data' | 'even' | 'fan' | 'gmm';
export const DEFAULT_SEED = 1;
/** Months in the widget's sample: few enough to drag, the shortest T in the style guide. */
export const WINDOW = 60;
/** The French portfolio that stands in for "a stock": the biggest, highest book-to-market quintile. */
export const PORTFOLIO = 'ME5-BM5';

export interface RegressionSample {
  /** ISO month of each observation (empty for a simulation). */
  dates: string[];
  /** Market excess return, decimal per month. */
  x: number[];
  /** Portfolio (or simulated stock) excess return, decimal per month. */
  y: number[];
}

/** Big value stocks' excess return and the market excess return, every month both files share. */
export function marketSample(ff3: Series<'ff3-monthly'>, ff25: Series<'ff25-size-bm-monthly'>): RegressionSample {
  const mkt = getColumn(ff3, 'Mkt-RF');
  const rf = getColumn(ff3, 'RF');
  const month = new Map(ff3.rows.map(([date], i) => [date, i]));
  const portfolio = getColumn(ff25, PORTFOLIO);
  const out: RegressionSample = { dates: [], x: [], y: [] };
  ff25.rows.forEach(([date], j) => {
    const i = month.get(date);
    const p = portfolio[j];
    if (i === undefined || p === null || mkt[i] === null || rf[i] === null) return;
    out.dates.push(date);
    out.x.push((mkt[i] as number) / 100);
    out.y.push((p - (rf[i] as number)) / 100);
  });
  return out;
}

export const lastMonths = (s: RegressionSample, n = WINDOW): RegressionSample =>
  ({ dates: s.dates.slice(-n), x: s.x.slice(-n), y: s.y.slice(-n) });

/** Style-guide market (mean 0.5%, volatility 4.5% a month) and a stock with beta 1.2 and 4% noise.
 * 'fan': the noise is zero on an average month and grows with the size of the market's surprise,
 * with the same average variance as 'even'. Both use the same draws for a given seed.
 */
export function simulatedSample(seed: number, fan: boolean, T = WINDOW): RegressionSample {
  const z = normalRng(seed);
  const x: number[] = [];
  const y: number[] = [];
  for (let t = 0; t < T; t++) {
    const shock = z();
    const noise = 0.04 * (fan ? Math.abs(shock) : 1) * z();
    x.push(0.005 + 0.045 * shock);
    y.push(1.2 * x[t] + noise);
  }
  return { dates: [], x, y };
}

/** Load ff3-monthly and ff25-size-bm-monthly once; null while loading. */
export function useMarketSample(): { data: RegressionSample | null; failed: boolean } {
  const [data, setData] = useState<RegressionSample | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    Promise.all([loadSeries('ff3-monthly'), loadSeries('ff25-size-bm-monthly')])
      .then(([ff3, ff25]) => setData(lastMonths(marketSample(ff3, ff25))), () => setFailed(true));
  }, []);
  return { data, failed };
}
