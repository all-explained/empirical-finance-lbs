import { arithmeticMean } from '../../lib/finance/returns';
import { inverse } from '../../lib/math/linalg';
import {
  gmm, gmmObjective, longRunCovariance, objectiveSurface, simulateJTest, simulateToySample, toyMoments,
  type GMMMethod, type GMMResult,
} from '../../lib/stats/gmm';

/** The seeded toy sample of Chapters 24 and 25: T draws of x_t with mean 0.5 and variance 1, normal tails. */
export const DEFAULT_SEED = 1;
export const SAMPLE_T = 600;
export type MomentCount = 2 | 4;

/** The J-test simulation of Chapter 25: J_SAMPLES seeded samples of the toy model with all four moments, so J has
 * 4 - 2 = 2 degrees of freedom. It runs in J_CHUNKS chunks of J_CHUNK samples, so the widget can draw between them. */
export const J_SEED = 1;
export const J_DEFAULT_T = 100;
export const J_CHUNK = 50;
export const J_CHUNKS = 8;
export const J_SAMPLES = J_CHUNK * J_CHUNKS;
export const J_COUNT = 4;
export type Tails = 'normal' | 'fat';
export type EfficientMethod = Exclude<GMMMethod, 'one-step'>;

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

/** Chunk k of a seeded J simulation. Its seed is 1000·seed + k, so each chunk, and so each run, is reproducible. */
export function jTestChunk(seed: number, k: number, { T, method, tails }: { T: number; method: EfficientMethod; tails: Tails }) {
  return simulateJTest(1000 * seed + k, { T, samples: J_CHUNK, method, tails, count: J_COUNT });
}

/** All J_CHUNKS chunks: every J and the share rejected at 5%. Equal chunks make that share the mean of theirs. */
export function jTestRun(seed: number, options: { T: number; method: EfficientMethod; tails: Tails }) {
  const chunks = Array.from({ length: J_CHUNKS }, (_, k) => jTestChunk(seed, k, options));
  return {
    J: chunks.flatMap((c) => c.J),
    rejectionRate: chunks.reduce((sum, c) => sum + c.rejectionRate, 0) / J_CHUNKS,
  };
}
