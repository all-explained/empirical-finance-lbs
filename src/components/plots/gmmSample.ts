import { arithmeticMean } from '../../lib/finance/returns';
import { inverse } from '../../lib/math/linalg';
import {
  gmm, gmmObjective, longRunCovariance, objectiveSurface, simulateToySample, toyMoments,
  type GMMMethod, type GMMResult,
} from '../../lib/stats/gmm';

/** The seeded toy sample of Chapters 24 and 25: T draws of x_t with mean 0.5 and variance 1, normal tails. */
export const DEFAULT_SEED = 1;
export const SAMPLE_T = 600;
export type MomentCount = 2 | 4;

export function toySample(seed = DEFAULT_SEED): number[] {
  return simulateToySample(seed, { T: SAMPLE_T });
}

/** GMM on the first count toy moments, starting at the sample mean and the divisor-T variance. */
export function fitToy(x: readonly number[], count: MomentCount, method: GMMMethod): GMMResult {
  const mean = arithmeticMean(x);
  return gmm(toyMoments(x, count), [mean, arithmeticMean(x.map((v) => (v - mean) ** 2))], { method });
}

/** The objective each method minimises, at θ = (mu[i], variance[j]): g_T'Wg_T with the fit's last-stage W,
 * or, for 'cue', g_T(θ)'Ŝ(θ)⁻¹g_T(θ) with Ŝ recomputed at every θ.
 */
export function objectiveGrid(
  x: readonly number[], count: MomentCount, method: GMMMethod, fit: GMMResult, mu: number[], variance: number[],
): number[][] {
  const moments = toyMoments(x, count);
  if (method !== 'cue') return objectiveSurface(moments, fit.W, mu, variance);
  return mu.map((m) => variance.map((v) => {
    const rows = moments([m, v]);
    const gT = rows[0].map((_, i) => arithmeticMean(rows.map((row) => row[i])));
    return gmmObjective(gT, inverse(longRunCovariance(rows)));
  }));
}
