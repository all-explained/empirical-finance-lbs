import { useEffect, useMemo, useState } from 'react';
import { loadSeries, type Series } from '../../lib/data/series';
import { canonicalCorrelations, pcaFactors, rotateFactors } from '../../lib/finance/latentFactors';
import { sampleCovariance } from '../../lib/finance/portfolio';
import { factorPanel, type FactorPanel } from '../../lib/finance/timeSeriesTests';
import { usePcaData, type Preset } from './pcaSample';

/** Most PCs the factors view compares with Mkt-RF, SMB and HML. */
export const MAX_K = 5;

/** First month of the excess-return panel behind each preset of the 25 portfolios. */
export const FACTOR_START: Record<Exclude<Preset, 'gsw'>, string> = { ff25: '1926-07-01', 'ff25-1963': '1963-07-01' };

export interface LatentData {
  ff25: Series<'ff25-size-bm-monthly'>;
  gsw: Series<'gsw-zero-coupon'>;
  /** Only loaded when the factors view is on. */
  ff3: Series<'ff3-monthly'> | null;
}

/** The data of usePcaData, plus ff3-monthly when withFactors is true (Chapter 31). */
export function useLatentData(withFactors: boolean): { data: LatentData | null; failed: boolean } {
  const base = usePcaData();
  const [ff3, setFf3] = useState<Series<'ff3-monthly'> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (withFactors) loadSeries('ff3-monthly').then(setFf3, () => setFailed(true));
  }, [withFactors]);
  const data = useMemo(
    () => (base.data && (!withFactors || ff3) ? { ...base.data, ff3 } : null),
    [base.data, ff3, withFactors],
  );
  return { data, failed: base.failed || failed };
}

/** The 25 portfolios in excess of RF, with Mkt-RF, SMB and HML, from the preset's first month to the last. */
export function latentPanel(ff3: Series<'ff3-monthly'>, ff25: Series<'ff25-size-bm-monthly'>, preset: Exclude<Preset, 'gsw'>): FactorPanel {
  return factorPanel(ff3, ff25, { start: FACTOR_START[preset], model: 'ff3' });
}

export interface FactorComparison {
  /** cc_1 ≥ … ≥ cc_m, m = min(K, 3), of the K PCs with Mkt-RF, SMB and HML. */
  canonical: number[];
  /** K × 3: corr(PC k, factor j), after the rotation. */
  correlations: number[][];
  /** Variance share of the K PCs together; no rotation inside them changes it. */
  share: number;
}

/**
 * The first K PCs of the excess returns (pcaFactors), turned by H: PCs 1 and 2 by ω inside their plane, as
 * rotatePair turns q_1 and q_2, and every PC times -1 when flipped. With K = 1 there is no plane, so only the
 * flip applies. Then the canonical and the plain correlations of the turned PCs with the three factors.
 */
export function factorComparison(panel: FactorPanel, K: number, omega: number, flipped: boolean): FactorComparison {
  const pcs = pcaFactors(panel.excess, K);
  const sign = flipped ? -1 : 1;
  const [c, s] = K >= 2 ? [Math.cos(omega), Math.sin(omega)] : [1, 0];
  const H = Array.from({ length: K }, (_, j) => Array.from({ length: K }, (_, k) => {
    if (j < 2 && k < 2) return sign * (j === k ? c : j === 0 ? s : -s);
    return j === k ? sign : 0;
  }));
  const { factors } = rotateFactors(pcs.beta, pcs.factors, H);
  const S = sampleCovariance(factors.map((f, t) => [...f, ...panel.factors[t]]));
  const correlations = factors[0].map((_, k) => panel.factorNames.map((_, j) => S[k][K + j] / Math.sqrt(S[k][k] * S[K + j][K + j])));
  return {
    canonical: canonicalCorrelations(factors, panel.factors).correlations,
    correlations,
    share: pcs.share.reduce((sum, v) => sum + v, 0),
  };
}
