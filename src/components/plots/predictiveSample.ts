import { useEffect, useMemo, useState } from 'react';
import { loadSeries, type Series } from '../../lib/data/series';
import { arithmeticMean, sampleVariance } from '../../lib/finance/returns';
import { goyalWelchPredictors } from '../../lib/finance/outOfSample';
import {
  fitAR1, forwardSums, goyalWelchAnnualPredictors, simulatePredictive,
} from '../../lib/finance/predictive';
import { ols } from '../../lib/stats/ols';

export type Source = 'data' | 'sim';
/** dp (chapter 9) or the published annual cay of Lettau and Ludvigson (chapter 14). */
export type Predictor = 'dp' | 'cay';
export const DEFAULT_SEED = 1;

export interface PredictiveSample {
  /** Year label of each dp observation (dp at the end of that year). */
  years: number[];
  /** The predictor: dp, or cay when that predictor is chosen. */
  dp: number[];
  /** Log excess return earned during each year. */
  r: number[];
  /** AR(1) persistence of dp: estimated on the data, true in the simulation. */
  phi: number;
  /** One-year slope behind the implied curve: estimated on the data, true in the simulation. */
  b1: number;
}

/** The annual data and the AR(1) fit that calibrates the simulation.
 * cay starts in 1945; the years before it have no value and are dropped.
 */
export function dataSample(series: Series<'goyal-welch-annual'>, predictor: Predictor = 'dp'): PredictiveSample {
  const { dates, dp, r } = predictor === 'dp' ? goyalWelchAnnualPredictors(series) : cayPredictor(series);
  const fit = ols(forwardSums(r, 1), [dp.slice(0, -1)]);
  return { years: dates.map((d) => Number(d.slice(0, 4))), dp, r, phi: fitAR1(dp).phi, b1: fit.coefficients[1] };
}

function cayPredictor(series: Series<'goyal-welch-annual'>): { dates: string[]; dp: number[]; r: number[] } {
  const all = goyalWelchPredictors(series, 'annual');
  const cay = all.predictors.cay!;
  const start = cay.findIndex((v) => v != null);
  const x = cay.slice(start);
  // Source gaps sit only at the start (docs/DATA.md); a later gap would be a data change.
  if (x.some((v) => v == null)) throw new RangeError('cay has an interior gap');
  return { dates: all.dates.slice(start), dp: x as number[], r: all.r.slice(start) };
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
export function usePredictiveSample(
  source: Source, seed: number, predictor: Predictor = 'dp',
): { sample: PredictiveSample | null; failed: boolean } {
  const [data, setData] = useState<PredictiveSample | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadSeries('goyal-welch-annual').then((series) => setData(dataSample(series, predictor)), () => setFailed(true));
  }, [predictor]);
  const sample = useMemo(
    () => (data && source === 'sim' ? simulatedSample(data, seed) : data),
    [data, source, seed],
  );
  return { sample, failed };
}
