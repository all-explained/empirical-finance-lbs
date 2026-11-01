import { quarterlyPanel } from '../../lib/finance/conditional';
import { crossSectionalRegression } from '../../lib/finance/crossSection';
import {
  farConfidenceSet, rankTest, simulateUselessFactor, simulateWeakIdentification, waldConfidenceSet,
  type FarConfidenceSet, type RankTest, type UselessFactorSimulation, type WaldConfidenceSet, type WeakIdentificationSimulation,
} from '../../lib/finance/identification';
import { sampleMeans } from '../../lib/finance/portfolio';
import { factorPanel, timeSeriesRegressions } from '../../lib/finance/timeSeriesTests';
import { quantile, rejectionRate } from '../../lib/stats/stambaugh';
import { quarterLabel, WINDOWS, type ConditionalData, type Window } from './conditionalSample';

/** First month of the monthly panel; it runs to the end of the data. */
export const START = '1963-07-01';
export const USELESS_SEED = 1;
/** Draws per useless-factor simulation: about 20 ms each on the monthly panel. */
export const USELESS_SAMPLES = 200;
export const T_CUTOFF = 1.96;

export interface MonthlySample {
  first: string;
  last: string;
  excess: number[][];
  /** Cross-sectional R² of the CAPM two-pass with an intercept on the same portfolios. */
  capmR2: number;
}

/** The 25 size–B/M portfolios, monthly decimal excess returns from START, and the market's two-pass R². */
export function monthlySample({ ff3, ff25 }: ConditionalData): MonthlySample {
  const panel = factorPanel(ff3, ff25, { start: START, model: 'capm' });
  const { beta } = timeSeriesRegressions(panel.excess, panel.factors);
  const { r2 } = crossSectionalRegression(beta, sampleMeans(panel.excess), { intercept: true, weighting: 'ols' });
  return { first: panel.dates[0].slice(0, 7), last: panel.dates.at(-1)!.slice(0, 7), excess: panel.excess, capmR2: r2 };
}

export interface UselessView {
  sim: UselessFactorSimulation;
  /** Share of draws with |t| > T_CUTOFF, Fama–MacBeth and Shanken. */
  rejectFM: number;
  rejectShanken: number;
  medianR2: number;
  /** Share of draws whose R² beats the CAPM's. */
  beatCapm: number;
}

/** USELESS_SAMPLES seeded factors of the given strength (0 is useless) on the monthly 25 portfolios. */
export function uselessView(sample: MonthlySample, strength: number, seed: number): UselessView {
  const sim = simulateUselessFactor(seed, sample.excess, { samples: USELESS_SAMPLES, strength });
  return {
    sim,
    rejectFM: rejectionRate(sim.famaMacBethT.map(Math.abs), T_CUTOFF),
    rejectShanken: rejectionRate(sim.shankenT.map(Math.abs), T_CUTOFF),
    medianR2: quantile(sim.r2, 0.5),
    beatCapm: rejectionRate(sim.r2, sample.capmR2),
  };
}

/** The seeded weak-identification world: T periods, N assets, true premium λ = 1, 95% sets. */
export const WEAK = { T: 60, N: 10, lambda: 1, samples: 600 } as const;
export const WEAK_SEED = 7;
/** λ° grid of the simulated GRS-FAR sets; a set that touches an end is unbounded. */
export const WEAK_GRID = Array.from({ length: 1001 }, (_, j) => -4 + j / 100);

export function weakWorld(betaSpread: number, seed: number): WeakIdentificationSimulation {
  return simulateWeakIdentification(seed, { ...WEAK, betaSpread, grid: WEAK_GRID });
}

/** λ° grid for consumption growth, decimal per quarter: [-1, 1] in steps of 0.001. */
export const DC_GRID = Array.from({ length: 2001 }, (_, j) => -1 + j / 1000);

export interface ConsumptionSets {
  first: string;
  last: string;
  quarters: number;
  rank: RankTest;
  wald: WaldConfidenceSet;
  far95: FarConfidenceSet;
  far99: FarConfidenceSet;
}

/** The rank test, the 95% Wald sets and the 95% and 99% GRS-FAR sets for Δc on the quarterly 25 portfolios. */
export function consumptionSets(data: ConditionalData, window: Window = 'full'): ConsumptionSets {
  const panel = quarterlyPanel(data, WINDOWS[window]);
  return {
    first: quarterLabel(panel.dates[0]),
    last: quarterLabel(panel.dates.at(-1)!),
    quarters: panel.dates.length,
    rank: rankTest(panel.excess, panel.dc),
    wald: waldConfidenceSet(panel.excess, panel.dc, { q: 0.05 }),
    far95: farConfidenceSet(panel.excess, panel.dc, { grid: DC_GRID, q: 0.05 }),
    far99: farConfidenceSet(panel.excess, panel.dc, { grid: DC_GRID, q: 0.01 }),
  };
}
