import { useMemo } from 'react';
import type { Series } from '../../lib/data/series';
import { annualConsumption } from '../../lib/finance/consumptionPuzzle';
import {
  annualConsumptionPredictors, annualise, bkyParameters, byParameters, simulateLongRunRisk, solveLongRunRisk,
  type LongRunRiskParameters, type LongRunRiskSolution,
} from '../../lib/finance/longRunRisk';
import { varianceRatio } from '../../lib/stats/autocorr';
import { useSeriesData } from './seriesSample';

/** The two calibrations of Chapter 38, monthly. */
export const CALIBRATIONS = { bky: bkyParameters, by: byParameters } as const;
export type CalibrationName = keyof typeof CALIBRATIONS;
export const CALIBRATION_NAMES: Record<CalibrationName, string> = { bky: 'BKY', by: 'BY' };

export const DEFAULT_SEED = 1;
/** The path the widget draws: 100 years of months. */
export const PATH_MONTHS = 1200;
/** The model's own variance ratios come from one long seeded path: 10,000 years of months. */
export const LONG_MONTHS = 120_000;
/** Horizons of the variance ratio, in years. */
export const VR_HORIZONS = Array.from({ length: 10 }, (_, k) => k + 1);

export const varianceRatios = (dc: readonly number[]) => VR_HORIZONS.map((k) => varianceRatio(dc, k));

/**
 * The consumption dynamics of params, with every claim priced so that simulateLongRunRisk always runs.
 * Consumption growth, x_t and σ²_t depend only on μ_c, φ_x, φ_e, σ̄, φ_σ, σ_w and the shocks, so the paths
 * match those of params draw for draw. simulateLongRunRisk solves prices before it simulates, and two cases
 * have none: ψ = 1, and BKY's dividend claim once φ_e = 0 (with BKY's φ_σ = 0.999 its log-linear solution
 * diverges). So this keeps the calibration's ψ of 1.5 and makes the dividend equal to consumption.
 * Limit: the prices of these paths are not those of params, and nothing here reads them.
 */
function consumptionOnly(params: LongRunRiskParameters): LongRunRiskParameters {
  return { ...params, psi: 1.5, muD: params.muC, betaDX: 1, betaDEta: 1, varphiD: 0 };
}

/** Log consumption less its trend μ_c t, from monthly growth, starting at 0. */
function detrended(dc: readonly number[], muC: number): number[] {
  let level = 0;
  return [0, ...dc.map((g) => (level += g - muC))];
}

/**
 * Chapter 38's seeded century: detrended log consumption with and without x_t from the same shocks, and the
 * variance ratios of the century's annual growth, time-aggregated by annualise as the data are.
 */
export function consumptionCentury(params: LongRunRiskParameters, seed: number) {
  const p = consumptionOnly(params);
  const withX = simulateLongRunRisk(seed, p, { months: PATH_MONTHS });
  const withoutX = simulateLongRunRisk(seed, p, { months: PATH_MONTHS, persistent: false });
  return {
    withX: detrended(withX.dc, params.muC),
    withoutX: detrended(withoutX.dc, params.muC),
    ratios: varianceRatios(annualise(withX).dc),
  };
}

/** The model's variance ratios of annual growth, from LONG_MONTHS of one seeded path (seed DEFAULT_SEED). */
export function modelVarianceRatios(params: LongRunRiskParameters): number[] {
  return varianceRatios(annualise(simulateLongRunRisk(DEFAULT_SEED, consumptionOnly(params), { months: LONG_MONTHS })).dc);
}

export type Pricing =
  | { kind: 'solved'; solution: LongRunRiskSolution }
  | { kind: 'psi-one' }
  | { kind: 'no-price' };

/** solveLongRunRisk, or why it has no answer: ψ = 1 makes θ_EZ infinite, and some parameters give no finite price. */
export function pricing(params: LongRunRiskParameters): Pricing {
  if (params.psi === 1) return { kind: 'psi-one' };
  try {
    return { kind: 'solved', solution: solveLongRunRisk(params) };
  } catch (error) {
    if (error instanceof RangeError) return { kind: 'no-price' };
    throw error;
  }
}

const IDS = ['fred-consumption-annual', 'goyal-welch-annual'] as const;
export type LongRunRiskData = { [K in (typeof IDS)[number]]: Series<K> };

/** Annual Δc and pd over their common years (1930–2025 on the committed data), and the variance ratios of Δc. */
export function annualData(data: LongRunRiskData) {
  const inputs = annualConsumptionPredictors(annualConsumption(data['fred-consumption-annual']), data['goyal-welch-annual']);
  return {
    ...inputs,
    first: inputs.dates[0].slice(0, 4),
    last: inputs.dates.at(-1)!.slice(0, 4),
    ratios: varianceRatios(inputs.dc),
  };
}

/** Load the two annual series once. */
export function useLongRunRiskData(): { view: ReturnType<typeof annualData> | null; failed: boolean } {
  const { data, failed } = useSeriesData(IDS);
  const view = useMemo(() => (data ? annualData(data) : null), [data]);
  return { view, failed };
}
