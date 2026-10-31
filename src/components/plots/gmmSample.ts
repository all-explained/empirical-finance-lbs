// The seeded toy samples of Part VI (Chapters 24 and 25), shared by the GMMObjective and JTestSim widgets and by
// the chapters' numbers tests, so a figure the prose describes is the figure the reader sees.
import { inverse } from '../../lib/math/linalg';
import {
  gmm, longRunCovariance, objectiveSurface, simulateJTest, simulateToySample, toyMoments,
  type GMMMethod, type GMMResult,
} from '../../lib/stats/gmm';

export const OBJECTIVE_SEED = 1;
export const OBJECTIVE_T = 200;
/** Grid of the objective surface: μ and σ² around the true θ0 = (0.5, 1). */
export const MU_RANGE: [number, number] = [0.1, 0.9];
export const VARIANCE_RANGE: [number, number] = [0.5, 1.5];
export const GRID = 30;

export const J_SEED = 1;
export const J_DEFAULT_T = 100;
/** The J simulation runs in chunks of J_CHUNK samples, so the widget can draw between them. */
export const J_CHUNK = 50;
export const J_CHUNKS = 8;
export const J_SAMPLES = J_CHUNK * J_CHUNKS;
/** Every J simulation uses all four moments, so J has 4 - 2 = 2 degrees of freedom. */
export const J_COUNT = 4;

export type MomentCount = 2 | 4;
export type Tails = 'normal' | 'fat';
export type EfficientMethod = Exclude<GMMMethod, 'one-step'>;

/** The toy sample behind the objective surface. */
export function objectiveSample(seed = OBJECTIVE_SEED): number[] {
  return simulateToySample(seed, { T: OBJECTIVE_T });
}

/** GMM estimate of θ = (μ, σ²) on the sample x. Each search starts at the sample mean and the divisor-T variance,
 * as in simulateJTest. */
export function toyEstimate(x: readonly number[], count: MomentCount, method: GMMMethod): GMMResult {
  const mean = x.reduce((sum, value) => sum + value, 0) / x.length;
  const variance = x.reduce((sum, value) => sum + (value - mean) ** 2, 0) / x.length;
  return gmm(toyMoments(x, count), [mean, variance], { method });
}

export const gridPoints = ([lo, hi]: [number, number]) => Array.from({ length: GRID + 1 }, (_, i) => lo + ((hi - lo) * i) / GRID);

/** values[i][j] is the objective of the estimate's last stage at (μ_i, σ²_j). It uses the fixed W of the estimate,
 * except for CUE, whose weighting Ŝ(θ)⁻¹ moves with θ. A θ with a singular Ŝ(θ) gets +∞. */
export function surface(x: readonly number[], count: MomentCount, method: GMMMethod, estimate: GMMResult): number[][] {
  const moments = toyMoments(x, count);
  const mus = gridPoints(MU_RANGE);
  const variances = gridPoints(VARIANCE_RANGE);
  if (method !== 'cue') return objectiveSurface(moments, estimate.W, mus, variances);
  return mus.map((mu) => variances.map((variance) => {
    try {
      return objectiveSurface(moments, inverse(longRunCovariance(moments([mu, variance]))), [mu], [variance])[0][0];
    } catch {
      return Infinity;
    }
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
