import { arithmeticMean } from '../finance/returns';
import { cdf, invCdf } from '../math/normal';
import { normalRng } from '../math/rng';
import { meanStandardError } from './moments';

// Multiple testing: n tests with p-values p_i, ordered p_(1) ≤ … ≤ p_(n), at level q (STYLE_GUIDE §3, Part VII).
// Procedures follow Harvey, Liu and Zhu (2016), "… and the Cross-Section of Expected Returns", RFS 29, 5–68,
// Section 3.4 (pp. 17–21). They argue that a new factor needs t > 3.0 (abstract, p. 5): the BHY cut-off at
// q = 5% is 2.78 when every tried factor is published (p. 26) and 3.18 once unpublished tries are added (p. 28).

/** Two-sided normal p-values, p_i = 2 Φ(-|t_i|). */
export function pValues(t: readonly number[]): number[] {
  return t.map((ti) => {
    if (Number.isNaN(ti)) throw new RangeError('pValues: t-statistics must be numbers');
    return 2 * cdf(-Math.abs(ti));
  });
}

export interface TestResult {
  /** One flag per test, in input order: true if its null is rejected (a discovery). */
  rejected: boolean[];
  count: number;
  /** Smallest rejected |t|, read off the largest rejected p-value as Φ⁻¹(1 - p/2); Infinity if that p is 0, null if none is rejected. */
  tCutoff: number | null;
}

function requireInputs(p: readonly number[], q: number): void {
  if (p.length === 0) throw new RangeError('Multiple testing needs at least one p-value');
  if (p.some((pi) => !(pi >= 0 && pi <= 1))) throw new RangeError('p-values must lie in [0, 1]');
  if (!(q > 0 && q < 1)) throw new RangeError('The level q must lie in (0, 1)');
}

/** Rejects the k smallest p-values (ties keep input order). */
function rejectSmallest(p: readonly number[], order: readonly number[], k: number): TestResult {
  const rejected = p.map(() => false);
  for (const i of order.slice(0, k)) rejected[i] = true;
  return { rejected, count: k, tCutoff: k === 0 ? null : invCdf(1 - p[order[k - 1]] / 2) };
}

function ascending(p: readonly number[]): number[] {
  return p.map((_, i) => i).sort((i, j) => p[i] - p[j]);
}

/** Bonferroni: reject when p_i ≤ q/n. Controls the family-wise error rate under any dependence (HLZ p. 17–18). */
export function bonferroni(p: readonly number[], q: number): TestResult {
  requireInputs(p, q);
  const order = ascending(p);
  return rejectSmallest(p, order, order.filter((i) => p[i] <= q / p.length).length);
}

/** Holm's step-down rule: reject p_(1), …, p_(k-1), where k is the first j with p_(j) > q/(n + 1 - j).
 * Controls the family-wise error rate and rejects every test Bonferroni rejects (HLZ pp. 19–20). */
export function holm(p: readonly number[], q: number): TestResult {
  requireInputs(p, q);
  const order = ascending(p);
  const n = p.length;
  let k = 0;
  while (k < n && p[order[k]] <= q / (n - k)) k++;
  return rejectSmallest(p, order, k);
}

/** Step-up rule: reject p_(1), …, p_(k), k the largest j with p_(j) ≤ j q / (n c). */
function stepUp(p: readonly number[], q: number, c: number): TestResult {
  requireInputs(p, q);
  const order = ascending(p);
  const n = p.length;
  let k = n;
  while (k > 0 && p[order[k - 1]] > (k * q) / (n * c)) k--;
  return rejectSmallest(p, order, k);
}

/** Benjamini–Hochberg (1995): the step-up rule with c = 1. Controls the false discovery rate when the tests are
 * independent or positively dependent (HLZ p. 21). */
export function benjaminiHochberg(p: readonly number[], q: number): TestResult {
  return stepUp(p, q, 1);
}

/** Yekutieli's constant c(n) = Σ_{j=1}^{n} 1/j (HLZ eq. 1, p. 20). */
export function yekutieliConstant(n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('The number of tests must be a positive integer');
  let c = 0;
  for (let j = 1; j <= n; j++) c += 1 / j;
  return c;
}

/** Benjamini–Hochberg–Yekutieli: the step-up rule with c(n). Controls the false discovery rate under any
 * dependence (HLZ pp. 20–21). */
export function benjaminiHochbergYekutieli(p: readonly number[], q: number): TestResult {
  return stepUp(p, q, yekutieliConstant(p.length));
}

/** Annualised volatility of every simulated strategy. The t-statistic does not depend on it. */
export const strategyVolatility = 0.15;

export interface StrategySearch {
  /** t-statistic of each strategy's mean monthly return, r̄ / (s/√T). */
  t: number[];
  /** True for the strategies whose alpha is real. They come first. */
  isTrue: boolean[];
}

/** `count` strategies with T months of i.i.d. normal returns, annualised volatility `strategyVolatility`.
 * The first round(count × trueShare) have annualised Sharpe ratio `sharpe`; the rest have mean zero. */
export function simulateStrategySearch(
  seed: number,
  { count, trueShare, sharpe, T }: { count: number; trueShare: number; sharpe: number; T: number },
): StrategySearch {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('count must be a positive integer');
  if (!(trueShare >= 0 && trueShare <= 1)) throw new RangeError('trueShare must lie in [0, 1]');
  if (!Number.isFinite(sharpe)) throw new RangeError('sharpe must be finite');
  if (!Number.isInteger(T) || T < 2) throw new RangeError('T must be an integer of at least 2');
  const z = normalRng(seed);
  const sd = strategyVolatility / Math.sqrt(12);
  const trueCount = Math.round(count * trueShare);
  const isTrue = Array.from({ length: count }, (_, i) => i < trueCount);
  const t = isTrue.map((real) => {
    const mean = real ? (sharpe / Math.sqrt(12)) * sd : 0;
    const r = Array.from({ length: T }, () => mean + sd * z());
    return arithmeticMean(r) / meanStandardError(r);
  });
  return { t, isTrue };
}

export interface DiscoveryCounts {
  /** |t| > cutoff and the alpha is real. */
  trueDiscoveries: number;
  /** |t| > cutoff and the alpha is zero. */
  falseDiscoveries: number;
  /** |t| ≤ cutoff although the alpha is real. */
  misses: number;
  /** False discoveries over all discoveries; 0 when there are none. */
  falseDiscoveryProportion: number;
  /** n_0 × 2Φ(-cutoff): null strategies times the two-sided test size the cutoff implies. */
  expectedFalseDiscoveries: number;
}

/** Counts discoveries at a two-sided cut-off on |t|, the rule `countAbove` in zoo.ts uses. */
export function discoveryCounts(t: readonly number[], isTrue: readonly boolean[], cutoff: number): DiscoveryCounts {
  if (t.length !== isTrue.length) throw new RangeError('discoveryCounts: t and isTrue differ in length');
  if (!(cutoff >= 0)) throw new RangeError('The cut-off must be nonnegative');
  let trueDiscoveries = 0;
  let falseDiscoveries = 0;
  let misses = 0;
  t.forEach((ti, i) => {
    const found = Math.abs(ti) > cutoff;
    if (found && isTrue[i]) trueDiscoveries++;
    else if (found) falseDiscoveries++;
    else if (isTrue[i]) misses++;
  });
  const discoveries = trueDiscoveries + falseDiscoveries;
  const nulls = isTrue.filter((real) => !real).length;
  return {
    trueDiscoveries,
    falseDiscoveries,
    misses,
    falseDiscoveryProportion: discoveries === 0 ? 0 : falseDiscoveries / discoveries,
    expectedFalseDiscoveries: nulls * 2 * cdf(-cutoff),
  };
}
