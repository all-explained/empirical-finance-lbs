import { useEffect, useState } from 'react';
import { loadSeries, type Series } from '../../lib/data/series';
import { arithmeticMean, excessReturn, ff3MarketReturns, sampleVariance } from '../../lib/finance/returns';
import { normalRng } from '../../lib/math/rng';

export const DEFAULT_SEED = 1;
export const SAMPLES = 1000;
export const MAX_T = 1200;
/** Style guide default market excess return: 0.5% mean, 4.5% volatility a month. */
export const TRUE_MEAN = 0.005;
export const TRUE_VOL = 0.045;

/** Monthly market excess returns (decimals) from ff3-monthly: (Mkt-RF + RF) − RF. */
export function marketExcess(series: Series<'ff3-monthly'>): { dates: string[]; excess: number[] } {
  const { dates, market, rf } = ff3MarketReturns(series);
  return { dates, excess: market.map((m, i) => excessReturn(m, rf[i])) };
}

/** Load ff3-monthly once and return its market excess returns, or null while loading. */
export function useMarketExcess(): { data: ReturnType<typeof marketExcess> | null; failed: boolean } {
  const [data, setData] = useState<ReturnType<typeof marketExcess> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadSeries('ff3-monthly').then((series) => setData(marketExcess(series)), () => setFailed(true));
  }, []);
  return { data, failed };
}

/**
 * SAMPLES seeded samples of MAX_T monthly returns, independent and normal with the true mean and
 * volatility. A sample of T months is the first T draws of a row, so a longer sample extends a shorter one.
 */
export function simulateSamples(seed: number): number[][] {
  const z = normalRng(seed);
  return Array.from({ length: SAMPLES }, () => Array.from({ length: MAX_T }, () => TRUE_MEAN + TRUE_VOL * z()));
}

/** Sample mean and sample volatility of the first T months of every simulated sample. */
export function sampleMoments(samples: number[][], T: number): { means: number[]; vols: number[] } {
  const firstT = samples.map((row) => row.slice(0, T));
  return { means: firstT.map(arithmeticMean), vols: firstT.map((x) => Math.sqrt(sampleVariance(x))) };
}
