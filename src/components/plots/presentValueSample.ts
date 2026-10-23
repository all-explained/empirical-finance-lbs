import { useEffect, useState } from 'react';
import { loadSeries, type Series } from '../../lib/data/series';
import {
  approxLogReturn, exactLogReturn, goyalWelchAnnualPresentValue, linearisationConstants, varianceShares,
} from '../../lib/finance/presentValue';
import { arithmeticMean } from '../../lib/finance/returns';

export type Sample = 'full' | 'postwar';
/** The post-war sample starts with dp at the end of this year, so its first return is 1947's. */
export const POSTWAR_START = 1946;

export interface PresentValueData {
  /** Year of each pd observation (pd at the end of that year). */
  years: number[];
  pd: number[];
  dp: number[];
  /** Total log return and log dividend growth earned during each year. */
  r: number[];
  dd: number[];
  meanPd: number;
}

export function presentValueData(series: Series<'goyal-welch-annual'>): PresentValueData {
  const { dates, pd, dp, r, dd } = goyalWelchAnnualPresentValue(series);
  return { years: dates.map((d) => Number(d.slice(0, 4))), pd, dp, r, dd, meanPd: arithmeticMean(pd) };
}

/** Exact and linearised returns for years[1..], expanding at meanPd + shift. error = exact − approx. */
export function logLinearRows(data: PresentValueData, shift: number) {
  const point = data.meanPd + shift;
  const { rho, kappa } = linearisationConstants(point);
  const years = data.years.slice(1);
  const exact = years.map((_, i) => exactLogReturn(data.pd[i], data.pd[i + 1], data.dd[i + 1]));
  const approx = years.map((_, i) => approxLogReturn(data.pd[i], data.pd[i + 1], data.dd[i + 1], rho, kappa));
  const error = exact.map((v, i) => v - approx[i]);
  return { point, rho, kappa, years, exact, approx, error };
}

/** The data from POSTWAR_START on, or all of it; ρ always sits at the chosen sample's mean pd. */
export function sampleData(data: PresentValueData, sample: Sample): PresentValueData {
  if (sample === 'full') return data;
  const start = data.years.indexOf(POSTWAR_START);
  const cut = (values: number[]) => values.slice(start);
  const pd = cut(data.pd);
  return { years: cut(data.years), pd, dp: cut(data.dp), r: cut(data.r), dd: cut(data.dd), meanPd: arithmeticMean(pd) };
}

export function sharesAt(data: PresentValueData, horizon: number) {
  const { rho } = linearisationConstants(data.meanPd);
  return { rho, ...varianceShares(data.dp, data.r, data.dd, rho, horizon) };
}

/** Load goyal-welch-annual once; null while loading. */
export function usePresentValueData(): { data: PresentValueData | null; failed: boolean } {
  const [data, setData] = useState<PresentValueData | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadSeries('goyal-welch-annual').then((series) => setData(presentValueData(series)), () => setFailed(true));
  }, []);
  return { data, failed };
}
