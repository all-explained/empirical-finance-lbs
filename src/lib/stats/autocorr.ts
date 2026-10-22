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
