import { useEffect, useMemo, useState } from 'react';
import { loadSeries, type Series } from '../../lib/data/series';
import { arithmeticMean, sampleVariance } from '../../lib/finance/returns';
import {
  fitAR1, forwardSums, goyalWelchAnnualPredictors, simulatePredictive,
} from '../../lib/finance/predictive';
import { ols } from '../../lib/stats/ols';

export type Source = 'data' | 'sim';
export const DEFAULT_SEED = 1;

export interface PredictiveSample {
  /** Year label of each dp observation (dp at the end of that year). */
  years: number[];
  dp: number[];
  /** Log excess return earned during each year. */
  r: number[];
  /** AR(1) persistence of dp: estimated on the data, true in the simulation. */
  phi: number;
  /** One-year slope behind the implied curve: estimated on the data, true in the simulation. */
  b1: number;
}

/** The annual data and the AR(1) fit that calibrates the simulation. */
export function dataSample(series: Series<'goyal-welch-annual'>): PredictiveSample {
  const { dates, dp, r } = goyalWelchAnnualPredictors(series);
  const fit = ols(forwardSums(r, 1), [dp.slice(0, -1)]);
  return { years: dates.map((d) => Number(d.slice(0, 4))), dp, r, phi: fitAR1(dp).phi, b1: fit.coefficients[1] };
}

/** An annual world where the AR(1) story is true: same length, slope, persistence and shock sizes as the data.
 * ponytail: shocks are independent (corr = 0); a later chapter adds the correlation.
 */
export function simulatedSample(data: PredictiveSample, seed: number): PredictiveSample {
  const fit = ols(forwardSums(data.r, 1), [data.dp.slice(0, -1)]);
  const ar = fitAR1(data.dp);
  const sim = simulatePredictive({
    T: data.dp.length, b1: data.b1, phi: data.phi,
    sigmaR: Math.sqrt(sampleVariance(fit.residuals)), sigmaX: ar.residualStd, corr: 0, seed,
  });
  // Centre the simulated predictor on the data's mean so both scatters share an axis; slopes are unchanged.
  const centre = arithmeticMean(data.dp);
  return { years: data.years, dp: sim.x.map((x) => x + centre), r: sim.r, phi: data.phi, b1: data.b1 };
}

/** Load goyal-welch-annual once; return the chosen sample, or null while loading. */
export function usePredictiveSample(source: Source, seed: number): { sample: PredictiveSample | null; failed: boolean } {
  const [data, setData] = useState<PredictiveSample | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadSeries('goyal-welch-annual').then((series) => setData(dataSample(series)), () => setFailed(true));
  }, []);
  const sample = useMemo(
    () => (data && source === 'sim' ? simulatedSample(data, seed) : data),
    [data, source, seed],
  );
  return { sample, failed };
}
