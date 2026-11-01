import { useMemo } from 'react';
import type { Series } from '../../lib/data/series';
import { quarterlyPanel } from '../../lib/finance/conditional';
import { ff25Characteristics, mimickingPortfolio, slopeWeights, sortWeights } from '../../lib/finance/mimicking';
import { sampleCovariance } from '../../lib/finance/portfolio';
import { arithmeticMean } from '../../lib/finance/returns';
import { factorPanel } from '../../lib/finance/timeSeriesTests';
import { matMul, transpose } from '../../lib/math/linalg';
import { annualiseMean, meanStandardError } from '../../lib/stats/moments';
import { quarterLabel, useConditionalData, WINDOWS, type ConditionalData } from './conditionalSample';
import { GRID_START } from './sizeValueSample';

export type Characteristic = 'size' | 'bm';
export type Method = 'sort' | 'regression';
export const CHARACTERISTICS: { value: Characteristic; label: string; factor: 'SMB' | 'HML' }[] = [
  { value: 'size', label: 'Size', factor: 'SMB' },
  { value: 'bm', label: 'Book-to-market', factor: 'HML' },
];
export const METHODS: { value: Method; label: string }[] = [
  { value: 'sort', label: 'Sort' },
  { value: 'regression', label: 'Regression' },
];

/**
 * Z of the 25 size–B/M portfolios: a constant, a size score and a B/M score, each from −2 to 2. The size score is
 * 3 minus the size quintile, so small stocks score +2 and a unit exposure to it is small minus big, as SMB is.
 */
export const SCORES = ff25Characteristics().map(([one, size, bm]) => [one, -size, bm]);
const COLUMN: Record<Characteristic, number> = { size: 1, bm: 2 };

const corr = (x: readonly number[], y: readonly number[]) => {
  const [[vx, cxy], [, vy]] = sampleCovariance(x.map((value, t) => [value, y[t]]));
  return cxy / Math.sqrt(vx * vy);
};
/** The return w'R^e_t of each period, for weights w on the columns of a T × N panel. */
const portfolioReturns = (panel: readonly (readonly number[])[], w: readonly number[]) => matMul(panel, transpose([w])).map(([r]) => r);

export interface CharacteristicPortfolio {
  /** One weight per portfolio, in the column order of ff25-size-bm-monthly. */
  weights: number[];
  /** Exposures w'z to the size score and to the B/M score: 1 to its own, 0 to the other. */
  exposures: [number, number];
  /** Sum of squared weights w'w. */
  squaredWeights: number;
  /** Mean return, ×12, its t-statistic (mean over its standard error) and the correlation with SMB or HML. */
  mean: number;
  t: number;
  correlation: number;
}

export interface CharacteristicView {
  first: string;
  last: string;
  T: number;
  portfolios: Record<Characteristic, Record<Method, CharacteristicPortfolio>>;
}

/**
 * The long–short sort (top quintile score minus bottom, divided by 4) and the cross-sectional slope portfolio
 * (a row of (Z'Z)⁻¹Z') on each score, with their monthly returns from 1963-07.
 */
export function characteristicView({ ff3, ff25 }: { ff3: Series<'ff3-monthly'>; ff25: Series<'ff25-size-bm-monthly'> }): CharacteristicView {
  const panel = factorPanel(ff3, ff25, { start: GRID_START, model: 'ff3' });
  const slope = slopeWeights(SCORES);
  const build = (c: Characteristic, weights: number[]): CharacteristicPortfolio => {
    const returns = portfolioReturns(panel.excess, weights);
    const factor = panel.factors.map((f) => f[panel.factorNames.indexOf(CHARACTERISTICS.find((x) => x.value === c)!.factor)]);
    const [[size, bm]] = matMul([weights], SCORES.map(([, s, b]) => [s, b]));
    return {
      weights,
      exposures: [size, bm],
      squaredWeights: weights.reduce((sum, w) => sum + w * w, 0),
      mean: annualiseMean(arithmeticMean(returns)),
      t: arithmeticMean(returns) / meanStandardError(returns),
      correlation: corr(returns, factor),
    };
  };
  const both = (c: Characteristic) => ({
    sort: build(c, sortWeights(SCORES.map((z) => z[COLUMN[c]]), { long: 2, short: -2 })),
    regression: build(c, slope[COLUMN[c]]),
  });
  return {
    first: panel.dates[0].slice(0, 7),
    last: panel.dates.at(-1)!.slice(0, 7),
    T: panel.dates.length,
    portfolios: { size: both('size'), bm: both('bm') },
  };
}

export type Base = 'ff25' | 'ff3';
export const BASES: { value: Base; label: string }[] = [
  { value: 'ff25', label: '25 portfolios' },
  { value: 'ff3', label: 'FF3 factors' },
];

export interface MimickingFit {
  /** a + w'R^e_t in every quarter, in decimals a quarter. */
  fitted: number[];
  weights: number[];
  /** corr(Δc_t, w'R^e_t) over the quarters the weights were estimated on. */
  correlation: number;
}

export interface MimickingView {
  dates: string[];
  first: string;
  last: string;
  names: string[];
  dc: number[];
  inSample: MimickingFit;
  /** Weights from the quarters before the split; laterCorrelation is corr(Δc_t, w'R^e_t) from the split on. */
  split: MimickingFit & { index: number; label: string; laterCorrelation: number };
}

/** The projection of consumption growth on the base assets, over all quarters and over those before the split. */
export function mimickingView(data: ConditionalData, base: Base, splitDate: string): MimickingView {
  const panel = quarterlyPanel(data, WINDOWS.full);
  const assets = base === 'ff25' ? panel.excess : panel.factors;
  const index = panel.dates.indexOf(splitDate);
  if (index < 0) throw new RangeError(`mimickingView: no quarter ${splitDate}`);
  const fit = (T: number): MimickingFit => {
    const { intercept, weights, correlation } = mimickingPortfolio(panel.dc.slice(0, T), assets.slice(0, T));
    return { fitted: portfolioReturns(assets, weights).map((r) => intercept + r), weights, correlation };
  };
  const { outOfSample } = mimickingPortfolio(panel.dc, assets, { split: index });
  return {
    dates: panel.dates,
    first: quarterLabel(panel.dates[0]),
    last: quarterLabel(panel.dates.at(-1)!),
    names: base === 'ff25' ? panel.names : panel.factorNames,
    dc: panel.dc,
    inSample: fit(panel.dates.length),
    split: { ...fit(index), index, label: quarterLabel(splitDate), laterCorrelation: outOfSample!.correlation },
  };
}

/** Load the quarterly panel's series once (through useConditionalData) and project consumption growth. */
export function useMimickingView(base: Base, splitDate: string): { view: MimickingView | null; failed: boolean } {
  const { data, failed } = useConditionalData();
  const view = useMemo(() => (data ? mimickingView(data, base, splitDate) : null), [data, base, splitDate]);
  return { view, failed };
}
