import { simulateOmittedFactor, type OmittedFactorSimulation } from '../../lib/finance/threePass';

export const OMITTED_SEED = 2021;

/**
 * The seeded economy of Chapter 34: the style guide's default N = 25 assets and T = 600 months, an observed
 * factor measured without error, and 100 samples per setting.
 */
export const ECONOMY = { N: 25, T: 600, noise: 0, samples: 100 } as const;

/** Two-pass and three-pass (with K principal components) estimates of λ_χ in the seeded economy. */
export function omittedEconomy(strength: number, correlation: number, factors: number, seed: number): OmittedFactorSimulation {
  return simulateOmittedFactor(seed, { ...ECONOMY, strength, correlation, factors });
}
