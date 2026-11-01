import { mulberry32 } from '../../lib/math/rng';
import {
  benjaminiHochbergYekutieli, bonferroni, holm, pValues, simulateStrategySearch, type StrategySearch,
} from '../../lib/stats/multipleTesting';

// Settings that the MultipleTesting widget and tests/chapter29-numbers.test.ts share.
export const DEFAULT_SEED = 1;
export const DEFAULT_COUNT = 300;
export const DEFAULT_TRUE_SHARE = 0.1;
export const COUNT_RANGE: [number, number] = [20, 1000];
export const TRUE_SHARE_RANGE: [number, number] = [0, 0.5];
/** Annualised Sharpe ratio of every strategy with a true alpha, and months of returns per strategy. */
export const TRUE_SHARPE = 0.5;
export const MONTHS = 600;
/** Level of the Bonferroni, Holm and BHY rules: the family-wise error rate or the false discovery rate. */
export const Q = 0.05;

export type Rule = 'single' | 'three' | 'bonferroni' | 'holm' | 'bhy';
export const RULES: { value: Rule; label: string }[] = [
  { value: 'single', label: '|t| = 1.96' },
  { value: 'three', label: '|t| = 3' },
  { value: 'bonferroni', label: 'Bonferroni' },
  { value: 'holm', label: 'Holm' },
  { value: 'bhy', label: 'BHY' },
];
const PROCEDURES = { bonferroni, holm, bhy: benjaminiHochbergYekutieli } as const;

export interface Search extends StrategySearch {
  /** A seeded height in [0, 1) for each strategy, to spread the points of a strip plot. */
  jitter: number[];
}

export function strategySearch(seed: number, count: number, trueShare: number): Search {
  const search = simulateStrategySearch(seed, { count, trueShare, sharpe: TRUE_SHARPE, T: MONTHS });
  const uniform = mulberry32(seed + 1);
  return { ...search, jitter: search.t.map(() => uniform()) };
}

/** The line on |t| that a rule draws. A fixed line is its value. For Bonferroni, Holm and BHY at level Q, it is the
 * midpoint of the gap between the largest |t| the rule keeps and the smallest |t| it rejects, so the strategies with
 * |t| above it are exactly the rule's discoveries. */
export function ruleLine(t: readonly number[], rule: Rule): number {
  if (rule === 'single') return 1.96;
  if (rule === 'three') return 3;
  const { rejected } = PROCEDURES[rule](pValues(t), Q);
  const size = t.map(Math.abs);
  const kept = size.filter((_, i) => !rejected[i]);
  const found = size.filter((_, i) => rejected[i]);
  const lo = kept.length ? Math.max(...kept) : 0;
  const hi = found.length ? Math.min(...found) : lo;
  return (lo + hi) / 2;
}
