import { useMemo } from 'react';
import type { Series } from '../../lib/data/series';
import {
  annualConsumption, annualSample, crraHjPath, impliedRiskAversion, puzzleMoments, quarterlySample,
  type ConsumptionSample, type PuzzleMoments,
} from '../../lib/finance/consumptionPuzzle';
import { hjBoundSharpe } from '../../lib/finance/sdf';
import { quarterName } from './caySample';
import { useSeriesData } from './seriesSample';

/** The three consumption samples of Chapter 35: annual from 1930, its postwar part, and quarterly from 1952. */
export const PUZZLE_SAMPLES = ['annual', 'postwar', 'quarterly'] as const;
export type PuzzleSampleName = (typeof PUZZLE_SAMPLES)[number];
export const POSTWAR_START = 1947;

/** The style guide's default time-discount factor, a year. */
export const DEFAULT_DELTA = 0.99;

export interface PuzzleView {
  first: string;
  last: string;
  observations: number;
  periodsPerYear: number;
  /** Annualised moments: means and σ_ic ×k, standard deviations and the Sharpe ratio ×√k. */
  moments: PuzzleMoments;
  /** γ from σ_ic and from SR/σ_c. */
  gamma: { fromCovariance: number; fromSharpe: number };
}

const IDS = ['fred-consumption-annual', 'goyal-welch-annual', 'fred-cay-quarterly', 'goyal-welch-monthly'] as const;
export type PuzzleData = { [K in (typeof IDS)[number]]: Series<K> };

function view(sample: ConsumptionSample, periodsPerYear: number, label: (date: string) => string): PuzzleView {
  const { observations, annual } = puzzleMoments(sample, periodsPerYear);
  return {
    first: label(sample.dates[0]),
    last: label(sample.dates.at(-1)!),
    observations,
    periodsPerYear,
    moments: annual,
    gamma: impliedRiskAversion(annual),
  };
}

/** The moments of each sample, annualised. */
export function puzzleViews(data: PuzzleData): Record<PuzzleSampleName, PuzzleView> {
  const consumption = annualConsumption(data['fred-consumption-annual']);
  const year = (date: string) => date.slice(0, 4);
  return {
    annual: view(annualSample(consumption, data['goyal-welch-annual']), 1, year),
    postwar: view(annualSample(consumption, data['goyal-welch-annual'], { start: POSTWAR_START }), 1, year),
    quarterly: view(quarterlySample(data['fred-cay-quarterly'], data['goyal-welch-monthly']), 4, quarterName),
  };
}

/** γ from 0 to 50 in steps of 0.1, for the power-utility curve. */
export const HJ_GAMMAS = Array.from({ length: 501 }, (_, k) => k / 10);

/**
 * The power-utility curve (E[M], σ(M)) of μ_c and σ_c, a year, as γ rises (`crraHjPath`), and the lowest γ
 * on it whose σ(M)/E[M] reaches the market's Sharpe ratio; undefined if none up to 50 does.
 */
export function powerUtilityPath(mean: number, sd: number, sharpe: number, delta = DEFAULT_DELTA) {
  const path = crraHjPath(HJ_GAMMAS, delta, mean, sd);
  const lowest = path.find((point) => hjBoundSharpe(point.mean, point.sd) >= sharpe);
  return { path, lowest };
}

/** Load the four series once and build the three samples. */
export function usePuzzleViews(): { views: Record<PuzzleSampleName, PuzzleView> | null; failed: boolean } {
  const { data, failed } = useSeriesData(IDS);
  const views = useMemo(() => (data ? puzzleViews(data) : null), [data]);
  return { views, failed };
}
