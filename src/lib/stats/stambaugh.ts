import { fitAR1, predictiveRegression, simulatePredictive } from '../finance/predictive';
import { arithmeticMean } from '../finance/returns';
import { mulberry32 } from '../math/rng';

// Model: r[t+1] = a + b x[t] + u[t+1], x[t+1] = mu_x + phi x[t] + v[t+1].

/** Kendall's first-order bias of the OLS AR(1) slope: E[phiHat - phi] ≈ -(1 + 3 phi) / T. */
export function kendallBias(phi: number, T: number): number {
  return -(1 + 3 * phi) / T;
}

/** Stambaugh's first-order bias E[bHat - b] = (sigmaUV / sigmaV2) E[phiHat - phi], with the Kendall term. */
export function stambaughBias(sigmaUV: number, sigmaV2: number, phi: number, T: number): number {
  return (sigmaUV / sigmaV2) * kendallBias(phi, T);
}

/** Plug-in correction bHat - (sigmaUV / sigmaV2) kendallBias(phiHat, T).
 * First order only, and it evaluates the Kendall term at the biased phiHat, not the true phi,
 * so it under-corrects when phi is near one.
 */
export function biasCorrectedSlope(
  bHat: number, phiHat: number, sigmaUV: number, sigmaV2: number, T: number,
): number {
  return bHat - stambaughBias(sigmaUV, sigmaV2, phiHat, T);
}

export interface PredictiveSystemFit {
  bHat: number;
  /** Classical (homoskedastic) t-statistic of bHat. */
  tStat: number;
  phiHat: number;
  sigmaUU: number;
  sigmaUV: number;
  sigmaV2: number;
  corr: number;
  /** Common sample size: pairs (x[t], r[t+1], x[t+1]). */
  T: number;
}

/** Fit both equations on the same T = length - 1 pairs. r[0] is never used.
 * Residual (co)variances divide by T - 2, as in fitAR1.
 */
export function predictiveSystem(r: readonly number[], x: readonly number[]): PredictiveSystemFit {
  const fit = predictiveRegression(r, x, 1, { errors: 'classical' });
  const ar = fitAR1(x);
  const T = fit.nobs;
  const u = x.slice(0, -1).map((value, t) => r[t + 1] - fit.intercept - fit.slope * value);
  const v = x.slice(0, -1).map((value, t) => x[t + 1] - ar.intercept - ar.phi * value);
  const cross = (a: number[], b: number[]) => a.reduce((sum, value, t) => sum + value * b[t], 0) / (T - 2);
  const sigmaUU = cross(u, u);
  const sigmaUV = cross(u, v);
  const sigmaV2 = cross(v, v);
  return {
    bHat: fit.slope, tStat: fit.tStat, phiHat: ar.phi,
    sigmaUU, sigmaUV, sigmaV2, corr: sigmaUV / Math.sqrt(sigmaUU * sigmaV2), T,
  };
}

export interface SimulatedSlope {
  bHat: number;
  tStat: number;
  phiHat: number;
}

export interface SimulateSlopesOptions {
  /** Regression sample size; each sample simulates T + 1 periods. */
  T: number;
  phi: number;
  /** corr(u, v) of same-period shocks. */
  corr: number;
  samples: number;
  seed: number;
}

/** Seeded samples under b = 0 from simulatePredictive, at its default shock scales.
 * Sample i draws its shocks from a seed that depends only on seed and i, so moving phi,
 * corr or T reshapes the same samples instead of drawing new ones.
 */
export function simulateSlopes({ T, phi, corr, samples, seed }: SimulateSlopesOptions): SimulatedSlope[] {
  if (!Number.isSafeInteger(samples) || samples < 1) throw new RangeError('samples must be a positive integer');
  const seeds = mulberry32(seed);
  return Array.from({ length: samples }, () => {
    const { r, x } = simulatePredictive({ T: T + 1, b1: 0, phi, corr, seed: Math.floor(seeds() * 2 ** 32) });
    const fit = predictiveRegression(r, x, 1, { errors: 'classical' });
    return { bHat: fit.slope, tStat: fit.tStat, phiHat: fitAR1(x).phi };
  });
}

/** Linearly interpolated sample quantile (R type 7, NumPy's default); p in [0, 1]. */
export function quantile(values: readonly number[], p: number): number {
  if (values.length === 0) throw new RangeError('quantile needs at least one value');
  if (!(p >= 0 && p <= 1)) throw new RangeError('p must lie in [0, 1]');
  const sorted = [...values].sort((a, b) => a - b);
  const h = (sorted.length - 1) * p;
  const lo = Math.floor(h);
  return lo + 1 < sorted.length ? sorted[lo] + (h - lo) * (sorted[lo + 1] - sorted[lo]) : sorted[lo];
}

/** One-sided critical value for the alternative b > 0: the (1 - size) quantile of simulated t-statistics. */
export function upperCriticalValue(tStats: readonly number[], size: number): number {
  return quantile(tStats, 1 - size);
}

/** Share of t-statistics strictly above the critical value. */
export function rejectionRate(tStats: readonly number[], critical: number): number {
  return arithmeticMean(tStats.map((t) => Number(t > critical)));
}
