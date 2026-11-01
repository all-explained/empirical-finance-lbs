import { useMemo } from 'react';
import { sampleCovariance } from '../../lib/finance/portfolio';
import {
  assetPanel, defaultPriorScales, principalComponentAssets, ridgePenalty, shrinkagePath, splitSampleSharpe,
  type AssetPanel, type AssetSeries, type AssetSet, type AssetSpace, type PortfolioMoments,
} from '../../lib/finance/shrinkage';
import { annualiseMean, annualiseSharpe, annualiseVolatility } from '../../lib/stats/moments';
import { useSeriesData } from './seriesSample';
import { useZooData } from './zooSample';

export const ASSET_SETS: { value: AssetSet; label: string }[] = [
  { value: 'osap', label: '108 anomalies' },
  { value: 'ff', label: '30 FF portfolios' },
];
export const SPACES: { value: AssetSpace; label: string }[] = [
  { value: 'assets', label: 'Assets' },
  { value: 'pcs', label: 'PCs' },
];

/**
 * The prior scales of the widgets: defaultPriorScales from 0.01 up to 10^0.1 ≈ 1.26 a month (4.4 a year).
 * Larger ones expect Sharpe ratios no data come near, and they are where the elastic net converges slowly.
 */
export const PRIOR_SCALES = defaultPriorScales.slice(0, 15);

/** The paper's withheld sample starts in 2005 (Kozak, Nagel & Santosh 2020, p. 289). */
export const SPLIT_DATE = '2005-01-01';

export interface ShrinkageSet extends AssetPanel {
  /** Σ̂ of the whole window, for ridgePenalty (its trace is the same in both spaces). */
  Sigma: number[][];
  /** The returns rotated once onto their principal components, as shrinkagePath's 'pcs' space does. */
  pcReturns: number[][];
}
export type ShrinkageData = Record<AssetSet, ShrinkageSet>;

const withMoments = (panel: AssetPanel): ShrinkageSet => ({
  ...panel, Sigma: sampleCovariance(panel.returns), pcReturns: principalComponentAssets(panel.returns).returns,
});
const FRENCH = ['ff3-monthly', 'ff25-size-bm-monthly'] as const;

/** Both asset sets of assetPanel, with Σ̂ and the PC returns. */
export function shrinkageData(series: Required<AssetSeries>): ShrinkageData {
  return { ff: withMoments(assetPanel('ff', series)), osap: withMoments(assetPanel('osap', series)) };
}

/** Both asset sets of assetPanel: ff3 and ff25 by loadSeries, ff5, mom and the OSAP returns by the zoo hook. */
export function useShrinkageData(): { data: ShrinkageData | null; failed: boolean } {
  const zoo = useZooData();
  const french = useSeriesData(FRENCH);
  const data = useMemo(() => {
    if (!zoo.data || !french.data) return null;
    const { ff5, mom, returns } = zoo.data;
    return shrinkageData({ ff3: french.data['ff3-monthly'], ff5, mom, ff25: french.data['ff25-size-bm-monthly'], osap: returns.original });
  }, [zoo.data, french.data]);
  return { data, failed: zoo.failed || french.failed };
}

export interface PathPoint {
  priorScale: number;
  /** ν₂ + ν₁ = tr Σ / (SR²_prior T), with ν₁ = s(ν₂ + ν₁) for the L1 share s. */
  penalty: number;
  l2: number;
  l1: number;
  /** b̂ on the whole window, in the chosen space. */
  b: number[];
  nonZero: number;
  /** R²_CV with K_CV = 3. */
  r2: number;
}

/** One point of the widget's shrinkage path. Share 0 is ridge. */
export function pathPoint(set: ShrinkageSet, priorScale: number, share: number, space: AssetSpace): PathPoint {
  const penalty = ridgePenalty(priorScale, set.Sigma, set.returns.length);
  const [l2, l1] = [(1 - share) * penalty, share * penalty];
  // ponytail: rotating once per set, not once per point, keeps the 15-point path of 108 PCs to a few seconds.
  const path = shrinkagePath(space === 'pcs' ? set.pcReturns : set.returns, { penalties: [l2], l1 });
  const b = path.coefficients[0];
  return { priorScale, penalty, l2, l1, b, nonZero: b.filter((v) => v !== 0).length, r2: path.r2[0] };
}

/** Index of the largest R²_CV. */
export const bestIndex = (points: readonly PathPoint[]) => points.reduce((best, p, i) => (p.r2 > points[best].r2 ? i : best), 0);

export interface AnnualMoments { mean: number; volatility: number; sharpe: number }
const annual = (m: PortfolioMoments, scale: number): AnnualMoments => ({
  mean: annualiseMean(m.mean * scale),
  volatility: annualiseVolatility(m.volatility * scale),
  sharpe: annualiseSharpe(m.sharpe),
});

export interface ShrunkTangency {
  split: number;
  first: string;
  splitMonth: string;
  last: string;
  /** Annual Sharpe ratio of the naive tangency portfolio in its own months: the slope of the in-sample frontier. */
  frontierSharpe: number;
  /** The shrunk tangency portfolio, scaled to the in-sample volatility of the market, before and after the split. */
  inSample: AnnualMoments;
  outOfSample: AnnualMoments;
}

/**
 * The shrunk tangency portfolio b̂ = (Σ̂ + ν₂I)⁻¹μ̄ from the months before SPLIT_DATE, held after it. Its scale is
 * free, so it is set to the volatility `target` (annual, decimal) in the first months.
 */
export function shrunkTangency(set: ShrinkageSet, penalty: number, target: number): ShrunkTangency {
  const split = set.dates.indexOf(SPLIT_DATE);
  const naive = splitSampleSharpe(set.returns, { split });
  const shrunk = splitSampleSharpe(set.returns, { split, penalty });
  const scale = target / annualiseVolatility(shrunk.inSample.volatility);
  return {
    split,
    first: set.dates[0].slice(0, 7),
    splitMonth: SPLIT_DATE.slice(0, 7),
    last: set.dates.at(-1)!.slice(0, 7),
    frontierSharpe: annualiseSharpe(naive.inSample.sharpe),
    inSample: annual(shrunk.inSample, scale),
    outOfSample: annual(shrunk.outOfSample, scale),
  };
}
