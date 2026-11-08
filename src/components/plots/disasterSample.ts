import { useMemo } from 'react';
import type { Series } from '../../lib/data/series';
import { annualConsumption, annualSample, type ConsumptionSample } from '../../lib/finance/consumptionPuzzle';
import {
  disasterPricing, entropyProfile, simulateDisasterCentury, type DisasterParams, type EntropyProfile,
} from '../../lib/finance/disasters';
import { DEFAULT_DELTA } from './puzzleSample';
import { useSeriesData } from './seriesSample';

/**
 * DisasterLottery: a claim on stocks in an economy whose normal years have μ_c = σ_c = 2%, round numbers of our own.
 * In normal years the stock's log return has volatility 16% (the style guide's default) and no covariance with Δc,
 * so its whole premium comes from disasters. A disaster takes the same fraction b_D of the stock as of consumption.
 */
export const LOTTERY = { delta: DEFAULT_DELTA, mean: 0.02, sd: 0.02, stockSd: 0.16, years: 100 };
/** γ = 4 and π_D = 1.7%: the "standard calibration" as Julliard & Ghosh (2012, p. 16) describe it. b_D = 0.4 is ours. */
export const LOTTERY_DEFAULTS = { gamma: 4, probability: 0.017, size: 0.4 };
/** A seed whose century holds two disasters at the default π_D. */
export const DEFAULT_CENTURY_SEED = 2;

export function lotteryParams(gamma: number, probability: number, size: number): DisasterParams {
  const { delta, mean, sd, stockSd } = LOTTERY;
  return { delta, gamma, mean, sd, probability, size, claim: { sd: stockSd, cov: 0, loss: size } };
}

/** The closed forms and one seeded century, with log consumption since year 0 for the plot. */
export function disasterLottery(seed: number, params: DisasterParams) {
  const century = simulateDisasterCentury(seed, params, LOTTERY.years);
  const level = [0];
  century.dc.forEach((dc) => level.push(level.at(-1)! + dc));
  const disasterYears = century.disaster.flatMap((hit, t) => (hit ? [t + 1] : []));
  return { pricing: disasterPricing(params), century, level, disasterYears };
}

/** Share of the centuries with seeds 1 to `centuries` that hold no disaster. */
export function emptyCenturyShare(params: DisasterParams, centuries: number): number {
  let empty = 0;
  for (let seed = 1; seed <= centuries; seed++) {
    if (simulateDisasterCentury(seed, params, LOTTERY.years).disasters === 0) empty += 1;
  }
  return empty / centuries;
}

/** EntropyReweighting: γ from 0 to 50 in steps of 0.5. */
export const ENTROPY_GAMMAS = Array.from({ length: 101 }, (_, k) => k / 2);
/** The last year of Julliard & Ghosh's (2012) baseline sample, 1929–2009 (p. 8). */
export const JG_LAST_YEAR = 2009;
export const ENTROPY_SAMPLES = ['full', 'jg'] as const;
export type EntropySampleName = (typeof ENTROPY_SAMPLES)[number];

export interface EntropyView {
  sample: ConsumptionSample;
  years: number[];
  profile: EntropyProfile;
}

const IDS = ['fred-consumption-annual', 'goyal-welch-annual'] as const;
export type DisasterData = { [K in (typeof IDS)[number]]: Series<K> };

/** The years of a sample up to and including `last`. */
export function sampleThrough(sample: ConsumptionSample, last: number): ConsumptionSample {
  const n = sample.dates.filter((date) => Number(date.slice(0, 4)) <= last).length;
  const head = (values: number[]) => values.slice(0, n);
  return { dates: sample.dates.slice(0, n), dc: head(sample.dc), r: head(sample.r), rf: head(sample.rf), re: head(sample.re) };
}

function entropyView(sample: ConsumptionSample): EntropyView {
  return {
    sample,
    years: sample.dates.map((date) => Number(date.slice(0, 4))),
    profile: entropyProfile(sample, ENTROPY_GAMMAS),
  };
}

/** The annual sample of Chapter 35 from 1930, in full and cut at the end of Julliard & Ghosh's sample. */
export function entropyViews(data: DisasterData): Record<EntropySampleName, EntropyView> {
  const full = annualSample(annualConsumption(data['fred-consumption-annual']), data['goyal-welch-annual']);
  return { full: entropyView(full), jg: entropyView(sampleThrough(full, JG_LAST_YEAR)) };
}

/** Load the two annual series once and build both samples. */
export function useEntropyViews(): { views: Record<EntropySampleName, EntropyView> | null; failed: boolean } {
  const { data, failed } = useSeriesData(IDS);
  const views = useMemo(() => (data ? entropyViews(data) : null), [data]);
  return { views, failed };
}
