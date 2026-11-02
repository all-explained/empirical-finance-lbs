/**
 * How measured consumption differs from the consumption of the model (Chapter 36): averaging over a
 * period, the NIPA filter and its inverse, and fourth-quarter-to-fourth-quarter growth. Growth rates are
 * decimal log growth. The filter follows Kroencke (2017, Journal of Finance 72, 47–98), "Asset Pricing
 * without Garbage"; page numbers are those of the ZEW working paper 13-071 (2013), with the page of the pdf.
 *
 * Notation (docs/STYLE_GUIDE.md §3, Part IX): the filter weight is varphi, here `weight`, and a period
 * holds n_avg fine steps, here `stepsPerPeriod`. Kroencke's unfilter parameter is phi_K = 1 − varphi
 * (see `filterWeightFromKroencke`).
 */
import { normalRng } from '../math/rng';

function requireStepsPerPeriod(n: number, name: string): void {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError(`${name}: stepsPerPeriod must be a positive integer`);
}

function requireWeight(weight: number, name: string): void {
  if (!(weight >= 0 && weight < 1)) throw new RangeError(`${name}: weight must be in [0, 1)`);
}

function requireFinite(values: readonly number[], name: string): void {
  if (!values.every(Number.isFinite)) throw new RangeError(`${name}: expected finite numbers`);
}

export interface TimeAveragingOptions {
  /** Number of periods, at least 2. */
  periods?: number;
  /** Fine steps in one period, n_avg: for example about 90 days in a quarter. */
  stepsPerPeriod?: number;
  /** Mean log growth over one period; each step drifts by drift / stepsPerPeriod. */
  drift?: number;
  /** Standard deviation of log growth over one period; each step has volatility / sqrt(stepsPerPeriod). */
  volatility?: number;
}

export interface TimeAveraging {
  /** Log consumption at steps 0..periods × stepsPerPeriod; path[0] = 0. */
  path: number[];
  /** Mean of the log level over the steps of each period: period t holds steps t·n + 1 .. (t + 1)·n. */
  averages: number[];
  /** Growth of the period averages, averages[t + 1] − averages[t]: what an averaged measure reports. */
  averagedGrowth: number[];
  /** Growth of the end-of-period levels over the same periods: the point-to-point growth of the model. */
  endGrowth: number[];
}

/**
 * A seeded random walk in log consumption at a fine step, its average over each period, and the growth of
 * the averages next to the growth of the end-of-period levels (both of length periods − 1).
 * The same seed gives the same shocks for every drift and volatility.
 */
export function simulateTimeAveraging(seed: number, options: TimeAveragingOptions = {}): TimeAveraging {
  const { periods = 200, stepsPerPeriod = 90, drift = 0, volatility = 0.01 } = options;
  if (!Number.isSafeInteger(periods) || periods < 2) throw new RangeError('simulateTimeAveraging: periods must be an integer of at least 2');
  requireStepsPerPeriod(stepsPerPeriod, 'simulateTimeAveraging');
  requireFinite([seed, drift, volatility], 'simulateTimeAveraging');
  if (volatility < 0) throw new RangeError('simulateTimeAveraging: volatility must be nonnegative');
  const normal = normalRng(seed);
  const stepDrift = drift / stepsPerPeriod;
  const stepVolatility = volatility / Math.sqrt(stepsPerPeriod);
  const path = [0];
  const averages: number[] = [];
  for (let t = 0; t < periods; t++) {
    let sum = 0;
    for (let s = 0; s < stepsPerPeriod; s++) {
      const level = path[path.length - 1] + stepDrift + stepVolatility * normal();
      path.push(level);
      sum += level;
    }
    averages.push(sum / stepsPerPeriod);
  }
  const growth = (levels: number[]) => levels.slice(1).map((level, t) => level - levels[t]);
  const ends = averages.map((_, t) => path[(t + 1) * stepsPerPeriod]);
  return { path, averages, averagedGrowth: growth(averages), endGrowth: growth(ends) };
}

/*
 * Time averaging of a driftless random walk, n = stepsPerPeriod. The walk x_s = x_{s−1} + e_s has shocks of
 * variance s². Growth of the period averages, A_t − A_{t−1} = (1/n) Σ_{j=1..n} (x_{(t−1)n+j} − x_{(t−2)n+j}),
 * is a sum of the 2n − 1 shocks after step (t − 2)n + 1 with triangular weights 1, 2, …, n, …, 2, 1, all over n:
 *   Var = (s²/n²)(Σ_{i=1..n} i² + Σ_{i=1..n−1} i²) = s²(2n² + 1)/(3n).
 * Point-to-point growth over a period sums n shocks: Var = n s². The ratio is (2n² + 1)/(3n²) → 2/3.
 * Consecutive averaged growths share the n − 1 shocks of period t − 1 after its first step, the rising
 * weights of one meeting the falling weights of the other:
 *   Cov = (s²/n²) Σ_{i=1..n−1} i(n − i) = s²(n² − 1)/(6n),
 * so the first-order autocorrelation is (n² − 1)/(2(2n² + 1)) → 1/4. Growths two or more periods apart share
 * no shock, so higher autocorrelations are 0. A drift moves the mean only. Kroencke (wp p. 8, pdf p. 13)
 * reports the limits 2/3 and 1/4 from Working (1960) and Breeden, Gibbons & Litzenberger (1989).
 */

/** First-order autocorrelation of the growth of period averages of a driftless random walk with n steps a
 * period, (n² − 1)/(2(2n² + 1)): 0 for n = 1, tending to 1/4. Derivation above.
 */
export function timeAveragedAutocorrelation(stepsPerPeriod: number): number {
  requireStepsPerPeriod(stepsPerPeriod, 'timeAveragedAutocorrelation');
  const n2 = stepsPerPeriod ** 2;
  return (n2 - 1) / (2 * (2 * n2 + 1));
}

/** Variance of the growth of period averages over the variance of point-to-point growth, (2n² + 1)/(3n²):
 * 1 for n = 1, tending to 2/3. Derivation above.
 */
export function timeAveragedVarianceRatio(stepsPerPeriod: number): number {
  requireStepsPerPeriod(stepsPerPeriod, 'timeAveragedVarianceRatio');
  const n2 = stepsPerPeriod ** 2;
  return (2 * n2 + 1) / (3 * n2);
}

/**
 * The NIPA filter Δc^NIPA_t = (1 − varphi) Δc_t + varphi Δc^NIPA_{t−1}, Kroencke's eq. 6 (wp p. 7, pdf p. 12)
 * with his nu = 1 − varphi. Start value: Δc^NIPA_0 = Δc_0, as if the filter had always seen the first
 * growth. On white noise the output is an AR(1) with persistence varphi and (1 − varphi)/(1 + varphi) of
 * the input's variance. varphi = 0 returns the input.
 */
export function nipaFilter(trueGrowth: readonly number[], weight: number): number[] {
  requireWeight(weight, 'nipaFilter');
  requireFinite(trueGrowth, 'nipaFilter');
  const out: number[] = [];
  trueGrowth.forEach((g, t) => out.push(t === 0 ? g : (1 - weight) * g + weight * out[t - 1]));
  return out;
}

/**
 * The inverse of `nipaFilter`, Δc_t = (Δc^NIPA_t − varphi Δc^NIPA_{t−1})/(1 − varphi): Kroencke's eq. 9
 * (wp p. 9, pdf p. 14) with phi_K = 1 − varphi. It needs the previous value, so it returns one fewer
 * observation: entry t − 1 is Δc_t for t = 1..length − 1.
 */
export function unfilter(nipaGrowth: readonly number[], weight: number): number[] {
  requireWeight(weight, 'unfilter');
  requireFinite(nipaGrowth, 'unfilter');
  return nipaGrowth.slice(1).map((g, t) => (g - weight * nipaGrowth[t]) / (1 - weight));
}

/**
 * Kroencke's recommended unfilter parameter phi_K = alpha × nu (wp pp. 9–10, pdf pp. 14–15): alpha = 0.80
 * undoes time averaging (it matches the 2/3 variance ratio, wp p. 9 note 10) and nu = 1/2 undoes the filter
 * (wp p. 10 note 11). Convert with `filterWeightFromKroencke`: 0.80 and 0.40 become varphi = 0.20 and 0.60.
 */
export const kroenckeUnfilterParameters = { timeAveraged: 0.8, timeAveragedAndFiltered: 0.4 } as const;

/** The curriculum's filter weight from Kroencke's unfilter parameter: varphi = 1 − phi_K, for 0 < phi_K ≤ 1. */
export function filterWeightFromKroencke(kroenckePhi: number): number {
  if (!(kroenckePhi > 0 && kroenckePhi <= 1)) throw new RangeError('filterWeightFromKroencke: phi must be in (0, 1]');
  return 1 - kroenckePhi;
}

/**
 * Annual growth from the fourth quarter of one year to the fourth quarter of the next, c_{Q4,y} − c_{Q4,y−1},
 * from quarterly log consumption with quarter start dates (2025-10-01 is 2025-Q4), such as
 * `cayInputs(...).c`. Each entry carries the Q4 date of its second year; years without both fourth quarters
 * are skipped. Kroencke (wp p. 8, pdf p. 13) compares this measure with annual averages.
 */
export function fourthQuarterGrowth(dates: readonly string[], c: readonly number[]): { dates: string[]; growth: number[] } {
  if (dates.length !== c.length) throw new RangeError('fourthQuarterGrowth: dates and c must have the same length');
  requireFinite(c, 'fourthQuarterGrowth');
  const q4 = new Map<number, number>();
  dates.forEach((date, t) => {
    if (date.slice(5, 7) === '10') q4.set(Number(date.slice(0, 4)), c[t]);
  });
  const out = { dates: [] as string[], growth: [] as number[] };
  [...q4.keys()].sort((a, b) => a - b).forEach((year) => {
    if (!q4.has(year - 1)) return;
    out.dates.push(`${year}-10-01`);
    out.growth.push(q4.get(year)! - q4.get(year - 1)!);
  });
  return out;
}
