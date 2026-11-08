import type { Series } from '../../lib/data/series';
import { cayInputs } from '../../lib/finance/cay';
import { fourthQuarterGrowth, simulateTimeAveraging, unfilter } from '../../lib/finance/consumptionMeasurement';
import {
  annualConsumption, annualSample, impliedRiskAversion, puzzleMoments, type ConsumptionSample,
} from '../../lib/finance/consumptionPuzzle';
import { sampleVariance } from '../../lib/finance/returns';
import { sampleAutocorrelation } from '../../lib/stats/var';
import { useSeriesData } from './seriesSample';

/** TimeAveraging: 400 quarters, so the sample autocorrelation has a standard error near 0.05. */
export const AVERAGING = { periods: 400, volatility: 0.01 };
export const DEFAULT_AVERAGING_SEED = 36;

export function averagingSimulation(seed: number, stepsPerPeriod: number) {
  const sim = simulateTimeAveraging(seed, { ...AVERAGING, stepsPerPeriod });
  return {
    ...sim,
    autocorrelation: sampleAutocorrelation(sim.averagedGrowth, 1)[1],
    varianceRatio: sampleVariance(sim.averagedGrowth) / sampleVariance(sim.endGrowth),
  };
}

export interface ConsumptionData {
  consumption: Series<'fred-consumption-annual'>;
  goyalWelch: Series<'goyal-welch-annual'>;
  cay: Series<'fred-cay-quarterly'>;
}

const IDS = ['fred-consumption-annual', 'goyal-welch-annual', 'fred-cay-quarterly'] as const;

/** Load the annual consumption, the annual returns and the quarterly consumption once. */
export function useConsumptionData(): { data: ConsumptionData | null; failed: boolean } {
  const { data, failed } = useSeriesData(IDS);
  return {
    data: data && {
      consumption: data['fred-consumption-annual'],
      goyalWelch: data['goyal-welch-annual'],
      cay: data['fred-cay-quarterly'],
    },
    failed,
  };
}

const year = (date: string) => Number(date.slice(0, 4));

/** The rows of a sample whose years have a growth in `growth`, with that growth in place of Δc. */
function withGrowth(sample: ConsumptionSample, growth: Map<number, number>): ConsumptionSample {
  const rows = sample.dates.flatMap((date, t) => (growth.has(year(date)) ? [t] : []));
  return {
    dates: rows.map((t) => sample.dates[t]),
    dc: rows.map((t) => growth.get(year(sample.dates[t]))!),
    r: rows.map((t) => sample.r[t]),
    rf: rows.map((t) => sample.rf[t]),
    re: rows.map((t) => sample.re[t]),
  };
}

export type Measure = 'annual' | 'q4' | 'unfiltered';

/**
 * Three measures of annual consumption growth, each paired with the returns of the same year (the default
 * timing of `annualSample`), from `start` on: annual averages as NIPA reports them, fourth quarter to fourth
 * quarter from `fred-cay-quarterly` (from 1953), and annual averages unfiltered with weight φ (from 1931,
 * because the inverse needs the previous year).
 */
export function consumptionMeasures(data: ConsumptionData, weight: number, start = 1931): Record<Measure, ConsumptionSample> {
  const consumption = annualConsumption(data.consumption);
  const annual = annualSample(consumption, data.goyalWelch, { start });
  const quarterly = cayInputs(data.cay);
  const q4 = fourthQuarterGrowth(quarterly.dates, quarterly.c);
  const unfiltered = unfilter(consumption.dc, weight);
  return {
    annual,
    q4: withGrowth(annual, new Map(q4.dates.map((date, t) => [year(date), q4.growth[t]]))),
    unfiltered: withGrowth(annual, new Map(consumption.dates.slice(1).map((date, t) => [year(date), unfiltered[t]]))),
  };
}

/** Volatility, first-order autocorrelation, correlation with the log real market return, and γ of Chapter 35. */
export function measureStats(sample: ConsumptionSample) {
  const { annual, observations } = puzzleMoments(sample, 1);
  return {
    first: year(sample.dates[0]),
    last: year(sample.dates[sample.dates.length - 1]),
    observations,
    mean: annual.mean.dc,
    sd: annual.sd.dc,
    autocorrelation: sampleAutocorrelation(sample.dc, 1)[1],
    correlation: annual.correlation,
    gamma: impliedRiskAversion(annual).fromCovariance,
  };
}
