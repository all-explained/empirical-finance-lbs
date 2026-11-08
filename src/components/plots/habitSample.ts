import { useMemo } from 'react';
import { arithmeticMean } from '../../lib/finance/returns';
import {
  campbellCochraneParameters, habitClaimReturns, habitRiskFree, maxSurplus, priceConsumptionRatio, simulateHabit,
  steadyStateSurplus, type HabitParams, type HabitPath, type HabitSolution,
} from '../../lib/finance/habit';
import { DEFAULT_SEED, usePredictiveSample, type PredictiveSample, type Predictor, type Source } from './predictiveSample';

/** The model runs in months, as in Campbell & Cochrane's simulations. */
export const MONTHS_PER_YEAR = 12;
/** A seeded century: the length of the HabitSimulator path and of the simulated side of the habit regression. */
export const HABIT_YEARS = 100;
export const HABIT_SEED = DEFAULT_SEED;
/** Table 1's γ, and its φ a year, φ^12 = 0.87. */
export const TABLE1_GAMMA = campbellCochraneParameters.gamma;
export const TABLE1_PHI_ANNUAL = Number((campbellCochraneParameters.phi ** MONTHS_PER_YEAR).toFixed(2));

/**
 * Table 1's parameters with γ and the annual persistence φ^12 replaced, and δ chosen again so that the risk-free
 * rate stays at Table 1's 0.94% a year, as the paper chooses δ to match the T-bill rate (p. 12).
 * In eq. (12) δ enters only as −log δ, so δ = exp(r^f at δ = 1 − r^f of Table 1).
 */
export function habitParams(gamma: number, phiAnnual: number): HabitParams {
  const shape = { ...campbellCochraneParameters, gamma, phi: phiAnnual ** (1 / MONTHS_PER_YEAR), delta: 1 };
  return { ...shape, delta: Math.exp(habitRiskFree(shape) - habitRiskFree(campbellCochraneParameters)) };
}

/** The model solved at (γ, φ^12): its parameters, S̄, S_max and the price–consumption ratio on the grid. */
export interface HabitModel {
  params: HabitParams;
  solution: HabitSolution;
  steady: number;
  max: number;
}

/** One `priceConsumptionRatio` solve: 20–180 ms over the slider ranges, so widgets run it once a slider rests. */
export function habitModel(gamma: number, phiAnnual: number): HabitModel {
  const params = habitParams(gamma, phiAnnual);
  return {
    params,
    solution: priceConsumptionRatio(params),
    steady: steadyStateSurplus(params),
    max: Math.exp(maxSurplus(params)),
  };
}

export interface HabitView {
  path: HabitPath;
  /** Years since the start, one per date of the path. */
  years: number[];
  /** P_t/C_t along the path, in years of consumption. */
  pcYears: number[];
  /** Mean of P_t/C_t along the path, in years. */
  meanPc: number;
}

/** A seeded century of monthly dates of a solved model, and its price–consumption ratio at each date. */
export function habitView(model: HabitModel, seed: number, years = HABIT_YEARS): HabitView {
  const path = simulateHabit(seed, model.params, { periods: years * MONTHS_PER_YEAR });
  const pcYears = path.s.map((s) => model.solution.evaluate(s) / MONTHS_PER_YEAR);
  return { path, years: path.s.map((_, t) => t / MONTHS_PER_YEAR), pcYears, meanPc: arithmeticMean(pcYears) };
}

let table1: HabitSolution | null = null;
/** The solution at Table 1's parameters, solved once. */
export function table1Solution(): HabitSolution {
  table1 ??= priceConsumptionRatio(campbellCochraneParameters);
  return table1;
}

/**
 * The habit model as a PredictiveSample: a seeded century simulated monthly at Table 1's parameters and summed to
 * years by `habitClaimReturns`. The predictor is the log price–consumption ratio pc of the consumption claim at the
 * end of each year, and the return is the claim's log excess return during each year. The model has no calendar,
 * so years run 1, …, 100. phi and b1 calibrate only the AR(1) simulation of PredictiveRegression, which this view
 * does not use, so they are NaN.
 */
export function habitPredictiveSample(seed: number, years = HABIT_YEARS): PredictiveSample {
  const path = simulateHabit(seed, campbellCochraneParameters, { periods: years * MONTHS_PER_YEAR });
  const { pc, re } = habitClaimReturns(path, table1Solution(), { annual: true, periodsPerYear: MONTHS_PER_YEAR });
  return { years: pc.map((_, i) => i + 1), dp: pc, r: re, phi: NaN, b1: NaN };
}

/** The dividend–price data of Chapter 9 as the log price–dividend ratio pd = −dp, to sit next to the model's pc. */
export function priceDividendSample(data: PredictiveSample): PredictiveSample {
  return { ...data, dp: data.dp.map((v) => -v) };
}

/** The views of PredictiveRegression: dp (Chapter 9), cay (Chapter 14) and habit (Chapter 37). */
export type PredictiveView = Predictor | 'habit';

/**
 * The sample of each PredictiveRegression view. For dp and cay it is `usePredictiveSample` unchanged. For habit it
 * is the goyal-welch-annual data of Chapter 9 as pd, loaded through `usePredictiveSample`, or a seeded century of
 * the habit model. Every view calls the same hooks in the same order.
 */
export function useHabitPredictiveSample(
  source: Source, seed: number, view: PredictiveView,
): { sample: PredictiveSample | null; failed: boolean } {
  const habit = view === 'habit';
  const { sample: base, failed } = usePredictiveSample(habit ? 'data' : source, seed, habit ? 'dp' : view);
  const sample = useMemo(() => {
    if (!habit) return base;
    return source === 'sim' ? habitPredictiveSample(seed) : base && priceDividendSample(base);
  }, [habit, base, source, seed]);
  return { sample, failed };
}
