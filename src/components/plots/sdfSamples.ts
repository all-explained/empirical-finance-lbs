import { useEffect, useState } from 'react';
import { betweenDates, dateRange, loadSeries, type Series } from '../../lib/data/series';
import { arithmeticMean, ff3MarketReturns, sampleVariance, simpleFromLog } from '../../lib/finance/returns';
import { crraSdf, hjBoundSharpe, riskFreeRate } from '../../lib/finance/sdf';
import { normalRng } from '../../lib/math/rng';
import { annualiseSharpe, meanStandardError, sharpeRatio } from '../../lib/stats/moments';

/** Two states of the world for SDFExplorer: state 1 is bad times, state 2 good times. */
export interface TwoStates {
  prob: number;
  sdf: [number, number];
  payoff: [number, number];
}

/** Three payoffs with the same expected value 1.05, priced by the same SDF. */
export const PAYOFFS = {
  stock: [0.8, 1.3],
  bond: [1.05, 1.05],
  insurance: [1.3, 0.8],
} as const satisfies Record<string, readonly [number, number]>;
export type PayoffName = keyof typeof PAYOFFS;

export const DEFAULT_STATES: TwoStates = { prob: 0.5, sdf: [1.1, 0.8], payoff: [...PAYOFFS.stock] };

export const probabilities = ({ prob }: TwoStates) => [prob, 1 - prob];

// The market's Sharpe ratio from ff3-monthly.
export const SAMPLE_STARTS = ['1926-07-01', '1963-07-01', '2000-01-01'] as const;
export type SampleStart = (typeof SAMPLE_STARTS)[number];

export interface MarketSharpe {
  start: string;
  end: string;
  months: number;
  /** Annualised Sharpe ratio of Mkt-RF, √12 × the monthly one. */
  sharpe: number;
  /** Annualised standard error of the Sharpe ratio, √12 × s.e.(mean)/sd ≈ √(12/T); it ignores the error in sd. */
  standardError: number;
}

export function marketSharpe(series: Series<'ff3-monthly'>, start: SampleStart): MarketSharpe {
  const sample = betweenDates(series, start, '9999-12-31');
  const { market, rf } = ff3MarketReturns(sample);
  const excess = market.map((m, t) => m - rf[t]);
  const range = dateRange(sample)!;
  return {
    start: range.start, end: range.end, months: excess.length,
    sharpe: annualiseSharpe(sharpeRatio(excess)),
    standardError: annualiseSharpe(meanStandardError(excess) / Math.sqrt(sampleVariance(excess))),
  };
}

/** Load ff3-monthly once, or report failure. */
export function useFF3(): { series: Series<'ff3-monthly'> | null; failed: boolean } {
  const [series, setSeries] = useState<Series<'ff3-monthly'> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadSeries('ff3-monthly').then(setSeries, () => setFailed(true));
  }, []);
  return { series, failed };
}

// A simulated (seeded) power-utility SDF, M = δ G^(−γ), one year ahead.
// ponytail: the consumption moments are an assumption, not data; Part IX measures them.
export const CONSUMPTION = { delta: 0.99, growthMean: 0.02, growthVol: 0.02, draws: 2000 } as const;
export const DEFAULT_SEED = 1;

export interface SdfMoments {
  mean: number;
  std: number;
  /** σ(M)/E[M], the highest Sharpe ratio this SDF can price. */
  maxSharpe: number;
  /** Net risk-free rate 1/E[M] − 1. */
  riskFree: number;
}

/** Draw log consumption growth, map each draw to M with crraSdf, and take moments over the equally likely draws. */
export function crraMoments(gamma: number, seed: number): SdfMoments {
  const z = normalRng(seed);
  const { delta, growthMean, growthVol, draws } = CONSUMPTION;
  const sdf = Array.from({ length: draws }, () => crraSdf(delta, gamma, 1 + simpleFromLog(growthMean + growthVol * z())));
  const mean = arithmeticMean(sdf);
  const std = Math.sqrt(sampleVariance(sdf));
  return { mean, std, maxSharpe: hjBoundSharpe(mean, std), riskFree: riskFreeRate(sdf, sdf.map(() => 1 / draws)) };
}
