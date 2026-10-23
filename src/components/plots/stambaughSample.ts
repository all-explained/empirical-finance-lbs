import { useEffect, useState } from 'react';
import { loadSeries, type Series } from '../../lib/data/series';
import { goyalWelchAnnualPredictors } from '../../lib/finance/predictive';
import { predictiveSystem, simulateSlopes, type PredictiveSystemFit, type SimulatedSlope } from '../../lib/stats/stambaugh';

export const DEFAULT_SEED = 1;
export const SAMPLES = 1000;

// ponytail: simulatePredictive's default shock sizes, which simulateSlopes uses (TASK-048 outcome).
// Drop these once simulateSlopes takes or returns its scales.
const SIM_SIGMA_U = 0.045 * Math.sqrt(0.99);
const simSigmaV = (phi: number) => Math.sqrt(1 - phi * phi);

export interface DataFit extends PredictiveSystemFit {
  /** Year of the first and last dp used as a regressor. */
  first: number;
  last: number;
}

/** Both equations of the predictive system on goyal-welch-annual: dp at the end of year t, log excess return in t+1. */
export function dataFit(series: Series<'goyal-welch-annual'>): DataFit {
  const { dates, dp, r } = goyalWelchAnnualPredictors(series);
  return { ...predictiveSystem(r, dp), first: Number(dates[0].slice(0, 4)), last: Number(dates.at(-2)!.slice(0, 4)) };
}

export interface NullOptions {
  T: number;
  phi: number;
  corr: number;
  seed: number;
  /** Shock sizes of the return and the predictor; bHat is reported in their units. */
  sigmaU: number;
  sigmaV: number;
}

/** SAMPLES seeded samples under b = 0. bHat scales with sigmaU / sigmaV and t does not,
 * so rescaling bHat gives the samples of a system with these shock sizes.
 */
export function nullSlopes({ T, phi, corr, seed, sigmaU, sigmaV }: NullOptions): SimulatedSlope[] {
  const scale = (sigmaU / sigmaV) / (SIM_SIGMA_U / simSigmaV(phi));
  return simulateSlopes({ T, phi, corr, samples: SAMPLES, seed }).map((s) => ({ ...s, bHat: s.bHat * scale }));
}

/** Load goyal-welch-annual once and fit the predictive system; null while loading. */
export function useDataFit(): { fit: DataFit | null; failed: boolean } {
  const [fit, setFit] = useState<DataFit | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadSeries('goyal-welch-annual').then((series) => setFit(dataFit(series)), () => setFailed(true));
  }, []);
  return { fit, failed };
}
