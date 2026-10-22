import { arithmeticMean, repeatedSum, sampleVariance } from '../finance/returns';

// Returns are decimals per period. Annualisation defaults to monthly data (12 periods a year).

/** Standard error of the sample mean, s / √T, with s² the n - 1 sample variance. */
export function meanStandardError(values: readonly number[]): number {
  return Math.sqrt(sampleVariance(values) / values.length);
}

/** Per-period Sharpe ratio: mean excess return over its n - 1 sample standard deviation. */
export function sharpeRatio(excess: readonly number[]): number {
  const sd = Math.sqrt(sampleVariance(excess));
  if (sd === 0) throw new RangeError('Sharpe ratio needs a nonzero standard deviation');
  return arithmeticMean(excess) / sd;
}

function requirePeriods(periodsPerYear: number): void {
  if (!Number.isInteger(periodsPerYear) || periodsPerYear < 1) throw new RangeError('Periods per year must be a positive integer');
}

/** Annual mean = k × per-period mean (simple, not compounded). */
export function annualiseMean(mean: number, periodsPerYear = 12): number {
  requirePeriods(periodsPerYear);
  return repeatedSum(mean, periodsPerYear);
}

/** Annual volatility = √k × per-period volatility, which assumes uncorrelated returns. */
export function annualiseVolatility(volatility: number, periodsPerYear = 12): number {
  requirePeriods(periodsPerYear);
  if (!(volatility >= 0) || !Number.isFinite(volatility)) throw new RangeError('Volatility must be nonnegative');
  return Math.sqrt(periodsPerYear) * volatility;
}

/** Annual Sharpe ratio = k × mean / (√k × sd) = √k × per-period Sharpe ratio. */
export function annualiseSharpe(sharpe: number, periodsPerYear = 12): number {
  requirePeriods(periodsPerYear);
  if (!Number.isFinite(sharpe)) throw new RangeError('Expected a finite number');
  return Math.sqrt(periodsPerYear) * sharpe;
}

// Central moments m_k = Σ (x_t - x̄)^k / T, with divisor T (not T - 1): the plain
// moment estimators g1 and g2, as in scipy.stats with bias=True.
function centralMoments(values: readonly number[]): { m2: number; m3: number; m4: number } {
  if (values.length < 2) throw new RangeError('Higher moments need at least two observations');
  const mean = arithmeticMean(values);
  const sums = values.reduce(([s2, s3, s4], value) => {
    const d = value - mean;
    return [s2 + d * d, s3 + d * d * d, s4 + d * d * d * d];
  }, [0, 0, 0]);
  const [m2, m3, m4] = sums.map((sum) => sum / values.length);
  if (m2 === 0) throw new RangeError('Higher moments need values that are not all equal');
  return { m2, m3, m4 };
}

/** Sample skewness g1 = m3 / m2^(3/2), divisor T in every moment. */
export function skewness(values: readonly number[]): number {
  const { m2, m3 } = centralMoments(values);
  return m3 / m2 ** 1.5;
}

/** Sample excess kurtosis g2 = m4 / m2² - 3, divisor T in every moment; 0 for a normal. */
export function excessKurtosis(values: readonly number[]): number {
  const { m2, m4 } = centralMoments(values);
  return m4 / (m2 * m2) - 3;
}

/**
 * Equal-width bins from min to max (numpy.histogram convention): bins + 1 edges,
 * each bin [left, right) except the last, which also includes max.
 * If all values are equal, the range is value ± 0.5.
 */
export function histogram(values: readonly number[], bins: number): { edges: number[]; counts: number[] } {
  if (!Number.isInteger(bins) || bins < 1) throw new RangeError('Bins must be a positive integer');
  if (values.length === 0) throw new RangeError('Histogram needs at least one observation');
  if (!values.every(Number.isFinite)) throw new RangeError('Expected finite numbers');
  // reduce, not Math.min(...values), which overflows the stack on long series.
  let lo = values.reduce((a, b) => Math.min(a, b));
  let hi = values.reduce((a, b) => Math.max(a, b));
  if (lo === hi) [lo, hi] = [lo - 0.5, hi + 0.5];
  const edges = Array.from({ length: bins + 1 }, (_, i) => (i === bins ? hi : lo + (hi - lo) * i / bins));
  const counts: number[] = Array(bins).fill(0);
  for (const value of values) {
    let i = Math.min(bins - 1, Math.floor((value - lo) / (hi - lo) * bins));
    // Rounding can put a value just outside its computed bin; the edges decide.
    if (value < edges[i]) i--;
    else if (i < bins - 1 && value >= edges[i + 1]) i++;
    counts[i]++;
  }
  return { edges, counts };
}
