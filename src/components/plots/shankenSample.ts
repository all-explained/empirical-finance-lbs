import type { Series } from '../../lib/data/series';
import { shankenCorrection, simulateTwoPass, crossSectionalRegression, type TwoPassSimulation } from '../../lib/finance/crossSection';
import { arithmeticMean, sampleVariance } from '../../lib/finance/returns';
import { factorPanel, timeSeriesRegressions } from '../../lib/finance/timeSeriesTests';
import { sampleMeans } from '../../lib/finance/portfolio';

export const DEFAULT_SEED = 18;
export const REPLICATIONS = 200;
export const N = 25;
/** True betas, evenly spaced from 0.5 to 1.5. */
export const TRUE_BETA = Array.from({ length: N }, (_, i) => 0.5 + i / (N - 1));
/** Monthly premium of the factor: 0.5% a month, 6% a year. */
export const LAMBDA = 0.005;
/** Monthly volatility of each asset's residual. */
export const RESIDUAL_SD = 0.015;
export const FF3_START = '1963-07-01';

export interface WorldOptions {
  /** Annualised Sharpe ratio of the factor; the simulation runs at the monthly SR/√12. */
  sharpe: number;
  T: number;
  seed: number;
}

export interface World extends TwoPassSimulation {
  /** True c = λ'Σ_f⁻¹λ, the squared monthly Sharpe ratio. */
  c: number;
  meanLambdaHat: number;
  /** Standard deviation of λ̂ across replications: its true sampling error. */
  sdLambdaHat: number;
  meanNaiveSE: number;
  meanCorrectedSE: number;
}

/** REPLICATIONS seeded two-pass samples of the one-factor world of simulateTwoPass. Monthly decimals. */
export function twoPassWorld({ sharpe, T, seed }: WorldOptions): World {
  const factorSharpe = sharpe / Math.sqrt(12);
  const sim = simulateTwoPass(seed, {
    N, T, beta: TRUE_BETA, lambda: LAMBDA, factorSharpe, residualSd: RESIDUAL_SD, replications: REPLICATIONS,
  });
  return {
    ...sim,
    c: factorSharpe ** 2,
    meanLambdaHat: arithmeticMean(sim.lambdaHat),
    sdLambdaHat: Math.sqrt(sampleVariance(sim.lambdaHat)),
    meanNaiveSE: arithmeticMean(sim.naiveSE),
    meanCorrectedSE: arithmeticMean(sim.correctedSE),
  };
}

export interface FF3Shanken {
  first: string;
  last: string;
  T: number;
  factorNames: string[];
  /** OLS second pass on the 25 portfolios, no intercept: λ̂ per factor, monthly. */
  lambda: number[];
  c: number;
  naiveSE: number[];
  correctedSE: number[];
}

/** Two-pass FF3 on the 25 size–B/M portfolios from FF3_START: λ̂ with naive and Shanken standard errors. */
export function ff3Shanken({ ff3, ff25 }: { ff3: Series<'ff3-monthly'>; ff25: Series<'ff25-size-bm-monthly'> }): FF3Shanken {
  const panel = factorPanel(ff3, ff25, { start: FF3_START, model: 'ff3' });
  const fit = timeSeriesRegressions(panel.excess, panel.factors);
  const { lambda } = crossSectionalRegression(fit.beta, sampleMeans(panel.excess), { intercept: false, weighting: 'ols' });
  const T = panel.dates.length;
  const s = shankenCorrection(fit.beta, fit.residualCovariance, fit.factorCovariance, lambda, T, { weighting: 'ols' });
  return {
    first: panel.dates[0].slice(0, 7),
    last: panel.dates.at(-1)!.slice(0, 7),
    T,
    factorNames: panel.factorNames,
    lambda,
    c: s.c,
    naiveSE: s.naiveSE,
    correctedSE: s.correctedSE,
  };
}
