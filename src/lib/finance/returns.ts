import { getColumn, type Series } from '../data/series';

// All returns are decimals: 0.05 means 5%. Inputs are never mutated.
function requireFinite(value: number): void {
  if (!Number.isFinite(value)) throw new RangeError('Expected a finite number');
}

function requireSimple(value: number): void {
  requireFinite(value);
  if (value < -1) throw new RangeError('Simple returns must be at least -1');
}

/** Holding-period return, including any cash dividend. Starting price must be positive. */
export function simpleReturn(p0: number, p1: number, dividend = 0): number {
  [p0, p1, dividend].forEach(requireFinite);
  if (p0 <= 0) throw new RangeError('Starting price must be positive');
  return (p1 + dividend) / p0 - 1;
}

/** A total loss (-1) has log return -Infinity. */
export function logReturn(simple: number): number {
  requireSimple(simple);
  return Math.log1p(simple);
}

export function simpleFromLog(log: number): number {
  if (log !== -Infinity) requireFinite(log);
  return Math.expm1(log);
}

/** Difference between simple total return and the simple risk-free return. */
export function excessReturn(r: number, rf: number): number {
  [r, rf].forEach(requireFinite);
  return r - rf;
}

/** Final wealth per initial dollar; an empty list leaves wealth at one. */
export function grossGrowth(returns: readonly number[]): number {
  return returns.reduce((wealth, r) => {
    requireSimple(r);
    return wealth * (1 + r);
  }, 1);
}

/**
 * Wealth including the initial dollar (n + 1 values).
 * 'simple' takes simple returns; 'log' takes log returns, e.g. returns.map(logReturn).
 */
export function growthPath(returns: readonly number[], mode: 'simple' | 'log'): number[] {
  const path = [1];
  let cumulative = mode === 'simple' ? 1 : 0;
  for (const r of returns) {
    if (mode === 'simple') {
      requireSimple(r);
      cumulative *= 1 + r;
      path.push(cumulative);
    } else {
      if (r !== -Infinity) requireFinite(r);
      cumulative += r;
      path.push(Math.exp(cumulative));
    }
  }
  return path;
}

/**
 * Sum of k equal per-period returns, k × r. For a log return this is the exact
 * k-period log return; for a monthly mean with k = 12, the simple annual figure.
 */
export function repeatedSum(perPeriod: number, k: number): number {
  if (perPeriod !== -Infinity) requireFinite(perPeriod);
  if (!Number.isInteger(k) || k < 0) throw new RangeError('Periods must be a nonnegative integer');
  return k === 0 ? 0 : k * perPeriod;
}

/**
 * Wealth from adding, not compounding, the same simple return k times:
 * 1 + j × R for j = 0..k (k + 1 values). It is the wrong answer that
 * compounding corrects.
 */
export function addedPath(simple: number, k: number): number[] {
  requireSimple(simple);
  return Array.from({ length: k + 1 }, (_, j) => 1 + repeatedSum(simple, j));
}

/** Second-order approximation E[log(1 + R)] ≈ E[R] - Var(R) / 2. */
export function meanLogApprox(meanSimple: number, variance: number): number {
  [meanSimple, variance].forEach(requireFinite);
  if (variance < 0) throw new RangeError('Variance must be nonnegative');
  return meanSimple - variance / 2;
}

/** Arithmetic mean; requires at least one observation. */
export function arithmeticMean(values: readonly number[]): number {
  if (values.length === 0) throw new RangeError('Mean needs at least one observation');
  return values.reduce((sum, value) => {
    requireFinite(value);
    return sum + value;
  }, 0) / values.length;
}

/** Per-period simple return with the same gross growth; requires nonempty input. */
export function geometricMean(returns: readonly number[]): number {
  if (returns.length === 0) throw new RangeError('Mean needs at least one observation');
  return grossGrowth(returns) ** (1 / returns.length) - 1;
}

/** Variance with the n - 1 sample denominator; requires two observations. */
export function sampleVariance(values: readonly number[]): number {
  if (values.length < 2) throw new RangeError('Sample variance needs at least two observations');
  const mean = arithmeticMean(values);
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
}

/** Convert loaded FF3 percent observations to decimal total market and risk-free returns. */
export function ff3MarketReturns(series: Series<'ff3-monthly'>): {
  dates: string[];
  market: number[];
  rf: number[];
} {
  const premium = getColumn(series, 'Mkt-RF');
  const riskFree = getColumn(series, 'RF');
  const market: number[] = [];
  const rf: number[] = [];
  series.rows.forEach(([date], index) => {
    const m = premium[index];
    const r = riskFree[index];
    if (m == null || r == null) throw new RangeError(`Missing FF3 return at ${date}`);
    [m, r].forEach(requireFinite);
    market.push((m + r) / 100);
    rf.push(r / 100);
  });
  return { dates: series.rows.map(([date]) => date), market, rf };
}
