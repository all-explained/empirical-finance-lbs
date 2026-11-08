/** Sample autocorrelations rho_0..rho_maxLag, rho_j = sum_{t>j} (x_t - xbar)(x_{t-j} - xbar) / sum_t (x_t - xbar)².
 * The common full-sample denominator keeps the sequence positive semi-definite.
 */
export function autocorrelations(x: readonly number[], maxLag: number): number[] {
  if (!x.every(Number.isFinite)) throw new RangeError('autocorrelations: expected finite numbers');
  if (!Number.isInteger(maxLag) || maxLag < 0 || maxLag >= x.length) {
    throw new RangeError('autocorrelations: maxLag must be an integer from 0 to length - 1');
  }
  const mean = x.reduce((sum, value) => sum + value, 0) / x.length;
  const d = x.map((value) => value - mean);
  const total = d.reduce((sum, value) => sum + value * value, 0);
  if (total === 0) throw new RangeError('autocorrelations: series has zero variance');
  return Array.from({ length: maxLag + 1 }, (_, j) => {
    let sum = 0;
    for (let t = j; t < d.length; t++) sum += d[t] * d[t - j];
    return sum / total;
  });
}

/** Newey–West (Bartlett) weights w_0..w_L, w_j = 1 - j/(L+1); the same weights as ols(..., 'newey-west'). */
export function bartlettWeights(L: number): number[] {
  if (!Number.isInteger(L) || L < 0) throw new RangeError('bartlettWeights: L must be a nonnegative integer');
  return Array.from({ length: L + 1 }, (_, j) => 1 - j / (L + 1));
}

/** Correlation of two k-period sums of i.i.d. returns that start j periods apart: max(k - |j|, 0)/k. */
export function overlapCorrelation(k: number, j: number): number {
  if (!Number.isInteger(k) || k < 1 || !Number.isInteger(j)) {
    throw new RangeError('overlapCorrelation: k must be a positive integer and j an integer');
  }
  return Math.max(k - Math.abs(j), 0) / k;
}

/** Exact variance of the mean of n overlapping k-period sums of i.i.d. shocks with variance sigma2:
 * (sigma2/n²) sum_{|j|<min(k,n)} (n - |j|)(k - |j|). About k² sigma2/n when n is much larger than k.
 */
export function overlapMeanVariance(k: number, n: number, sigma2: number): number {
  if (!Number.isInteger(k) || k < 1 || !Number.isInteger(n) || n < 1) {
    throw new RangeError('overlapMeanVariance: k and n must be positive integers');
  }
  if (!(sigma2 >= 0)) throw new RangeError('overlapMeanVariance: sigma2 must be nonnegative');
  let sum = n * k;
  for (let j = 1; j < Math.min(k, n); j++) sum += 2 * (n - j) * (k - j);
  return (sigma2 / n ** 2) * sum;
}

/** Variance ratio VR(k) = Var(x_{t+1} + … + x_{t+k}) / (k Var(x_t)) of a stationary series, for k ≥ 1.
 * For any covariance-stationary x it equals Σ_{|j|<k} (1 − |j|/k) ρ_j = 1 + 2 Σ_{j=1}^{k−1} (1 − j/k) ρ_j,
 * the Bartlett weights with L = k − 1 on the autocorrelations. This estimator plugs in the sample ρ_j, so it
 * differs from the ratio of the sample variances of overlapping k-sums only by end effects of order k/n.
 * VR is 1 for white noise, above 1 when positive autocorrelations pile up at long horizons, below 1 under mean
 * reversion. overlapMeanVariance does not give it: that is the variance of a mean of overlapping sums.
 */
export function varianceRatio(x: readonly number[], horizon: number): number {
  if (!Number.isInteger(horizon) || horizon < 1 || horizon > x.length) {
    throw new RangeError('varianceRatio: horizon must be an integer from 1 to length');
  }
  const rho = autocorrelations(x, horizon - 1);
  return bartlettWeights(horizon - 1).reduce((sum, w, j) => sum + (j === 0 ? 1 : 2) * w * rho[j], 0);
}
