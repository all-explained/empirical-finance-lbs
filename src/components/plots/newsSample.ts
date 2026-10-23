import { useEffect, useState } from 'react';
import { loadSeries, type Series } from '../../lib/data/series';
import { arithmeticMean } from '../../lib/finance/returns';
import { newsDecomposition, simulateDogNull } from '../../lib/finance/news';
import { goyalWelchAnnualPresentValue, linearisationConstants, presentValueSlopes } from '../../lib/finance/presentValue';
import { fitVAR1 } from '../../lib/stats/var';

/** First year of dp in the sample; returns start one year later. */
export type Period = '1926' | '1872';
export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '1926', label: '1926–2025' },
  { value: '1872', label: '1872–2025' },
];
export const DEFAULT_SEED = 1;
/** Simulated samples per draw of the dog test. ponytail: 2,000 keeps a re-roll under a second; Cochrane (2008) uses 50,000. */
export const DOG_SAMPLES = 2000;

export interface PresentValueSample {
  /** Year of each observation: dp at the end of the year, r and dd earned during it. */
  years: number[];
  dp: number[];
  r: number[];
  dd: number[];
  /** Campbell–Shiller rho at this sample's mean pd. */
  rho: number;
}

/** goyal-welch-annual from the end of `start` to 2025, through the present-value loader. */
export function presentValueSample(series: Series<'goyal-welch-annual'>, start: Period): PresentValueSample {
  const all = goyalWelchAnnualPresentValue(series);
  const years = all.dates.map((d) => Number(d.slice(0, 4)));
  const i0 = years.indexOf(Number(start));
  return {
    years: years.slice(i0), dp: all.dp.slice(i0), r: all.r.slice(i0), dd: all.dd.slice(i0),
    rho: linearisationConstants(arithmeticMean(all.pd.slice(i0))).rho,
  };
}

/** VAR(1) in (r, dp), return first; news[t] belongs to years[t + 1]. */
export function sampleNews(s: PresentValueSample) {
  return { years: s.years.slice(1), ...newsDecomposition([s.r, s.dp], s.rho) };
}

/** The data's slopes and the residual covariance of (dp, Δd) that calibrate the null. */
export function dogInputs(s: PresentValueSample) {
  return { estimates: presentValueSlopes(s.dp, s.r, s.dd, s.rho), residualCov: fitVAR1([s.dp, s.dd]).residualCovariance };
}

export function dogDraws(s: PresentValueSample, phi: number, seed: number) {
  const { estimates, residualCov } = dogInputs(s);
  return simulateDogNull({ T: estimates.nobs, phi, rho: s.rho, residualCov, samples: DOG_SAMPLES, seed });
}

/** Load goyal-welch-annual once; null while loading. */
export function usePresentValueSeries(): { series: Series<'goyal-welch-annual'> | null; failed: boolean } {
  const [series, setSeries] = useState<Series<'goyal-welch-annual'> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadSeries('goyal-welch-annual').then(setSeries, () => setFailed(true));
  }, []);
  return { series, failed };
}
