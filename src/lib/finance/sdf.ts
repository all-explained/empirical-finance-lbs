// SDF pricing on a finite set of states. Each argument is a list with one value per
// state, weighted by the state probabilities. Moments are population moments, not
// sample estimates. Returns are decimals, and R^f is the net rate, as in the style guide.
function requireFinite(value: number): void {
  if (!Number.isFinite(value)) throw new RangeError('Expected a finite number');
}

function requireStates(probabilities: readonly number[], ...series: (readonly number[])[]): void {
  if (probabilities.length === 0) throw new RangeError('Need at least one state');
  if (series.some((values) => values.length !== probabilities.length)) {
    throw new RangeError('Every state needs one value and one probability');
  }
  series.flat().forEach(requireFinite);
  probabilities.forEach(requireFinite);
  if (probabilities.some((p) => p < 0)) throw new RangeError('Probabilities must be nonnegative');
  const total = probabilities.reduce((sum, p) => sum + p, 0);
  if (Math.abs(total - 1) > 1e-9) throw new RangeError('Probabilities must sum to one');
}

function expectation(values: readonly number[], probabilities: readonly number[]): number {
  return values.reduce((sum, value, s) => sum + probabilities[s] * value, 0);
}

function covariance(x: readonly number[], y: readonly number[], probabilities: readonly number[]): number {
  const meanX = expectation(x, probabilities);
  const meanY = expectation(y, probabilities);
  return expectation(x.map((value, s) => (value - meanX) * (y[s] - meanY)), probabilities);
}

/** Power-utility SDF M = β G^(-γ), where G = C_{t+1}/C_t is gross consumption growth. */
export function crraSdf(beta: number, gamma: number, consumptionGrowth: number): number {
  [beta, gamma, consumptionGrowth].forEach(requireFinite);
  if (beta <= 0) throw new RangeError('Time discount factor must be positive');
  if (consumptionGrowth <= 0) throw new RangeError('Gross consumption growth must be positive');
  return beta * consumptionGrowth ** -gamma;
}

/** Price p = E[M x] of a payoff x. */
export function price(payoff: readonly number[], sdf: readonly number[], probabilities: readonly number[]): number {
  requireStates(probabilities, payoff, sdf);
  return expectation(payoff.map((x, s) => x * sdf[s]), probabilities);
}

/** Net risk-free rate R^f = 1/E[M] - 1, since a riskless unit payoff costs E[M]. */
export function riskFreeRate(sdf: readonly number[], probabilities: readonly number[]): number {
  requireStates(probabilities, sdf);
  const meanSdf = expectation(sdf, probabilities);
  if (meanSdf <= 0) throw new RangeError('E[M] must be positive');
  return 1 / meanSdf - 1;
}

/** E[R^e] = -(1 + R^f) Cov(M, R^e), from 0 = E[M R^e]. */
export function riskPremiumFromCovariance(
  sdf: readonly number[], excessReturn: readonly number[], probabilities: readonly number[],
): number {
  const grossRiskFree = 1 + riskFreeRate(sdf, probabilities);
  requireStates(probabilities, excessReturn);
  return -grossRiskFree * covariance(sdf, excessReturn, probabilities);
}

/** Hansen–Jagannathan bound σ(M)/E[M]: no excess return has a larger |Sharpe ratio|. */
export function hjBoundSharpe(sdfMean: number, sdfStd: number): number {
  [sdfMean, sdfStd].forEach(requireFinite);
  if (sdfMean <= 0) throw new RangeError('E[M] must be positive');
  if (sdfStd < 0) throw new RangeError('σ(M) must be nonnegative');
  return sdfStd / sdfMean;
}

/** Lowest admissible σ(M) at each E[M] on the grid, E[M] |SR|, for an asset with Sharpe ratio SR. */
export function hjRegion(meanGrid: readonly number[], sharpe: number): number[] {
  requireFinite(sharpe);
  return meanGrid.map((sdfMean) => {
    requireFinite(sdfMean);
    if (sdfMean <= 0) throw new RangeError('E[M] must be positive');
    return sdfMean * Math.abs(sharpe);
  });
}

/**
 * Beta representation E[R^e] = β λ_M, with β = Cov(R^e, M)/Var(M) and the price of
 * risk λ_M = -Var(M)/E[M]. β is the slope of R^e on M; it is the same for R and R^e.
 */
export function betaPricing(
  sdf: readonly number[], excessReturn: readonly number[], probabilities: readonly number[],
): { beta: number; lambda: number } {
  requireStates(probabilities, sdf, excessReturn);
  const sdfVariance = covariance(sdf, sdf, probabilities);
  if (sdfVariance === 0) throw new RangeError('Beta needs an SDF that varies across states');
  const meanSdf = expectation(sdf, probabilities);
  if (meanSdf <= 0) throw new RangeError('E[M] must be positive');
  return { beta: covariance(excessReturn, sdf, probabilities) / sdfVariance, lambda: -sdfVariance / meanSdf };
}
