// Mean–variance portfolios and CAPM betas. A return matrix has one row per period and one
// column per asset (T × N), like the rows of the data loaders. Returns are decimals.
// Weights are fully invested in the risky assets: they sum to one.
import { inverse, matMul } from '../math/linalg';
import { ols } from '../stats/ols';
import { arithmeticMean, sampleVariance } from './returns';

export interface FrontierPoint {
  /** Target expected return μ_p = w'μ. */
  mean: number;
  /** σ_p = √(w'Σw). */
  volatility: number;
  weights: number[];
}

export interface SecurityMarketLine {
  intercept: number;
  slope: number;
}

function requireReturns(returns: readonly (readonly number[])[]): void {
  if (returns.length === 0 || returns[0].length === 0) throw new RangeError('Return matrix must be non-empty');
  if (returns.some((row) => row.length !== returns[0].length)) {
    throw new RangeError('Every period needs one return per asset');
  }
}

function column(returns: readonly (readonly number[])[], j: number): number[] {
  return returns.map((row) => row[j]);
}

function dot(x: readonly number[], y: readonly number[]): number {
  return x.reduce((sum, value, i) => sum + value * y[i], 0);
}

function timesVector(A: readonly (readonly number[])[], x: readonly number[]): number[] {
  return matMul(A, x.map((value) => [value])).map((row) => row[0]);
}

function requireMoments(mu: readonly number[], Sigma: readonly (readonly number[])[]): void {
  if (mu.length === 0 || Sigma.length !== mu.length) throw new RangeError('Σ must be N × N for N means');
  if (!mu.every(Number.isFinite)) throw new RangeError('Means must be finite');
}

/** Sample mean of each asset, μ̂_j = (1/T) Σ_t R_tj. */
export function sampleMeans(returns: readonly (readonly number[])[]): number[] {
  requireReturns(returns);
  return returns[0].map((_, j) => arithmeticMean(column(returns, j)));
}

/** Sample covariance matrix with the T - 1 denominator; its diagonal is each asset's sampleVariance. */
export function sampleCovariance(returns: readonly (readonly number[])[]): number[][] {
  requireReturns(returns);
  const columns = returns[0].map((_, j) => column(returns, j));
  const means = sampleMeans(returns);
  return columns.map((x, i) => columns.map((y, j) => (i === j
    ? sampleVariance(x)
    : x.reduce((sum, value, t) => sum + (value - means[i]) * (y[t] - means[j]), 0) / (returns.length - 1))));
}

// With A = 1'Σ⁻¹1, B = 1'Σ⁻¹μ, C = μ'Σ⁻¹μ and D = AC - B², the variance-minimising weights
// with w'1 = 1 and w'μ = m are w = [(C - Bm) Σ⁻¹1 + (Am - B) Σ⁻¹μ] / D (Merton, 1972).
function frontierWeights(mu: readonly number[], Sigma: readonly (readonly number[])[]) {
  requireMoments(mu, Sigma);
  const SigmaInv = inverse(Sigma);
  const invOnes = SigmaInv.map((row) => row.reduce((sum, value) => sum + value, 0));
  const invMu = timesVector(SigmaInv, mu);
  const A = invOnes.reduce((sum, value) => sum + value, 0);
  const B = dot(invOnes, mu);
  const C = dot(invMu, mu);
  const D = A * C - B * B;
  // D = 0 when every mean is equal: then only m = μ is reachable and the frontier is one point.
  if (!(D > 1e-12 * A * C)) throw new RangeError('Frontier needs assets with different means');
  return (target: number): number[] => {
    if (!Number.isFinite(target)) throw new RangeError('Target mean must be finite');
    return invOnes.map((value, i) => ((C - B * target) * value + (A * target - B) * invMu[i]) / D);
  };
}

/** Fully invested weights with the least variance w'Σw among portfolios with mean w'μ = target. */
export function minVarianceWeights(mu: readonly number[], Sigma: readonly (readonly number[])[], target: number): number[] {
  return frontierWeights(mu, Sigma)(target);
}

/** The minimum-variance frontier at each target mean in points. */
export function frontier(
  mu: readonly number[], Sigma: readonly (readonly number[])[], points: readonly number[],
): FrontierPoint[] {
  const weightsAt = frontierWeights(mu, Sigma);
  return points.map((mean) => {
    const weights = weightsAt(mean);
    return { mean, volatility: Math.sqrt(dot(weights, timesVector(Sigma, weights))), weights };
  });
}

/**
 * Tangency weights Σ⁻¹μᵉ / 1'Σ⁻¹μᵉ: the risky portfolio with the highest Sharpe ratio.
 * If 1'Σ⁻¹μᵉ < 0 the same formula gives the lowest Sharpe ratio (a short tangency portfolio).
 */
export function tangencyWeights(muExcess: readonly number[], Sigma: readonly (readonly number[])[]): number[] {
  requireMoments(muExcess, Sigma);
  const raw = timesVector(inverse(Sigma), muExcess);
  const total = raw.reduce((sum, value) => sum + value, 0);
  if (Math.abs(total) <= 1e-12 * raw.reduce((sum, value) => sum + Math.abs(value), 0)) {
    throw new RangeError('Tangency portfolio does not exist: 1\'Σ⁻¹μᵉ is zero');
  }
  return raw.map((value) => value / total);
}

/** Squared Sharpe ratio of the tangency portfolio, μᵉ'Σ⁻¹μᵉ. */
export function maxSharpeSquared(muExcess: readonly number[], Sigma: readonly (readonly number[])[]): number {
  requireMoments(muExcess, Sigma);
  return dot(muExcess, timesVector(inverse(Sigma), muExcess));
}

/** Time-series beta of each asset: slope of R^e_j on R^e_m with an intercept, by OLS. */
export function betas(assetExcess: readonly (readonly number[])[], marketExcess: readonly number[]): number[] {
  requireReturns(assetExcess);
  if (assetExcess.length !== marketExcess.length) throw new RangeError('Assets and market need the same periods');
  return assetExcess[0].map((_, j) => ols(column(assetExcess, j), [marketExcess]).coefficients[1]);
}

/** Cross-sectional OLS fit of mean excess returns on betas: E[R^e_j] = intercept + slope β_j. */
export function securityMarketLine(betaValues: readonly number[], meanExcess: readonly number[]): SecurityMarketLine {
  const [intercept, slope] = ols(meanExcess, [betaValues]).coefficients;
  return { intercept, slope };
}
