/**
 * The Campbell–Cochrane external-habit model (Chapter 37): Campbell & Cochrane (1999, Journal of Political
 * Economy), cited by the pdf pages of the author manuscript of May 1998. Every rate is a decimal log rate per period;
 * a period is a month, as in the paper's simulations, unless an option says otherwise.
 *
 * Preferences (eq. 1, p. 4): E Σ_t δ^t [(C_t − X_t)^{1−γ} − 1]/(1 − γ), with habit X_t below consumption C_t.
 * The habit is external, set by aggregate consumption as in Abel's (1990) "catching up with the Joneses"
 * (named on p. 4), so a consumer takes it as given. The surplus consumption ratio is S_t = (C_t − X_t)/C_t and its
 * log s_t = log S_t follows (eqs. 2–3, p. 5)
 *   s_{t+1} = (1 − φ) s̄ + φ s_t + Λ(s_t)(Δc_{t+1} − μ_c),
 * with i.i.d. growth Δc_{t+1} ~ N(μ_c, σ_c²) (eq. 4, p. 5). The paper writes g for μ_c, σ for σ_c and λ(s_t) for
 * the sensitivity function Λ(s_t); here g is the GMM moment and λ a risk premium (style guide §3, Part X).
 * Marginal utility is (C_t − X_t)^{−γ} = S_t^{−γ} C_t^{−γ}, so the SDF is (eq. 5, p. 6)
 *   M_{t+1} = δ (S_{t+1} C_{t+1} / (S_t C_t))^{−γ},  log M_{t+1} = log δ − γ (Δc_{t+1} + s_{t+1} − s_t).
 * The local curvature of utility is γ/S_t (p. 5): a low surplus means high risk aversion.
 */
import { impliedRiskFree } from './consumptionPuzzle';
import { normalRng } from '../math/rng';
import { gaussHermite, normalExpectation } from '../math/quadrature';

/** Parameters per period. `mean`, `sd`, `gamma` and `delta` mean what they mean in `impliedRiskFree`. */
export interface HabitParams {
  /** μ_c, mean log consumption growth (the paper's g). */
  mean: number;
  /** σ_c, standard deviation of log consumption growth. */
  sd: number;
  /** φ, the AR(1) persistence of s_t, in (0, 1). */
  phi: number;
  /** γ, the curvature of utility over C_t − X_t. */
  gamma: number;
  /** δ, the subjective time-discount factor. */
  delta: number;
}

function requireFinite(...values: number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('Expected finite numbers');
}

function requireParams({ mean, sd, phi, gamma, delta }: HabitParams): void {
  requireFinite(mean, sd, phi, gamma, delta);
  if (!(sd > 0)) throw new RangeError('σ_c must be positive');
  if (!(phi > 0 && phi < 1)) throw new RangeError('φ must lie in (0, 1)');
  if (!(gamma > 0)) throw new RangeError('γ must be positive');
  if (!(delta > 0)) throw new RangeError('Time discount factor must be positive');
}

/**
 * Table 1 (p. 13), chosen in Section II.E (p. 12) to match postwar US data, as monthly values. The table
 * reports annual values of a model simulated monthly: 12 μ_c = 1.89%, √12 σ_c = 1.50%, 12 r^f = 0.94%,
 * φ^12 = 0.87 and γ = 2.00. δ is implied by the risk-free rate through eq. (12), as the paper picks δ to match
 * the T-bill rate (p. 12): δ^12 = 0.896, which Table 1 reports as 0.89. The table also reports S̄ = 0.057 and
 * S_max = 0.094.
 */
export const campbellCochraneParameters: Readonly<HabitParams> = (() => {
  const [mean, sd, riskFree, phi, gamma] = [0.0189 / 12, 0.015 / Math.sqrt(12), 0.0094 / 12, 0.87 ** (1 / 12), 2];
  return Object.freeze({ mean, sd, phi, gamma, delta: Math.exp(-riskFree + gamma * mean - (gamma * (1 - phi)) / 2) });
})();

/** S̄ = σ_c √(γ/(1 − φ)), eq. (9), p. 8. At one or above, the model has no room between s̄ and s_max. */
export function steadyStateSurplus(params: HabitParams): number {
  requireParams(params);
  const surplus = params.sd * Math.sqrt(params.gamma / (1 - params.phi));
  if (!(surplus < 1)) throw new RangeError('S̄ = σ_c √(γ/(1 − φ)) must be below one');
  return surplus;
}

/** s_max = s̄ + (1 − S̄²)/2, eq. (11), p. 8, where the square root of Λ(s_t) reaches zero. */
export function maxSurplus(params: HabitParams): number {
  const surplus = steadyStateSurplus(params);
  return Math.log(surplus) + (1 - surplus ** 2) / 2;
}

/**
 * The sensitivity function Λ(s_t) = √(1 − 2(s_t − s̄))/S̄ − 1 for s_t ≤ s_max, and 0 above, eq. (10), p. 8.
 * It keeps the risk-free rate constant and the habit predetermined at and near the steady state (p. 8);
 * at s̄ it equals 1/S̄ − 1.
 */
export function sensitivity(s: number, params: HabitParams): number {
  requireFinite(s);
  const surplus = steadyStateSurplus(params);
  const sBar = Math.log(surplus);
  if (s >= sBar + (1 - surplus ** 2) / 2) return 0;
  return Math.sqrt(1 - 2 * (s - sBar)) / surplus - 1;
}

/** s_{t+1} from s_t and Δc_{t+1}, the law of motion of eq. (3), p. 5. */
function nextSurplus(s: number, dc: number, params: HabitParams): number {
  const sBar = Math.log(steadyStateSurplus(params));
  return (1 - params.phi) * sBar + params.phi * s + sensitivity(s, params) * (dc - params.mean);
}

/**
 * The constant log risk-free rate r^f = −log δ + γ μ_c − γ(1 − φ)/2, eq. (12), p. 8. It comes from eq. (8), p. 7,
 * r^f_t = −log δ + γ μ_c − γ(1 − φ)(s_t − s̄) − ½ γ² σ_c² (1 + Λ(s_t))², once eq. (10) gives
 * (1 + Λ(s_t))² = (1 − 2(s_t − s̄))/S̄² and eq. (9) gives γ² σ_c²/S̄² = γ(1 − φ): the two terms in s_t − s̄ cancel.
 * The rate holds for s_t ≤ s_max, where Λ(s_t) follows eq. (10).
 */
export function habitRiskFree(params: HabitParams): number {
  requireParams(params);
  return -Math.log(params.delta) + params.gamma * params.mean - (params.gamma * (1 - params.phi)) / 2;
}

/** Local curvature of utility γ/S_t at the surplus ratio S_t (p. 5); the paper writes η_t. */
export function localCurvature(surplus: number, gamma: number): number {
  requireFinite(surplus, gamma);
  if (!(surplus > 0 && surplus <= 1)) throw new RangeError('The surplus ratio must lie in (0, 1]');
  return gamma / surplus;
}

/** log M_{t+1} = log δ − γ(Δc_{t+1} + s_{t+1} − s_t), eq. (5), p. 6. With s_{t+1} = s_t it is power utility. */
export function habitLogSdf(s: number, sNext: number, dc: number, params: HabitParams): number {
  requireFinite(s, sNext, dc);
  requireParams(params);
  return Math.log(params.delta) - params.gamma * (dc + sNext - s);
}

/**
 * A seeded path of T periods. Dates run 0, …, T; s, S, c and X have T + 1 entries, one per date, and dc and logM
 * have T, where dc[t] = Δc_{t+1} = c_{t+1} − c_t and logM[t] = log M_{t+1}.
 */
export interface HabitPath {
  dc: number[];
  /** Log surplus ratio s_t, from s_0 = s̄. */
  s: number[];
  /** Surplus ratio S_t = e^{s_t}. */
  S: number[];
  /** Log consumption c_t, from c_0 = 0. */
  c: number[];
  /** Habit X_t = C_t (1 − S_t). */
  X: number[];
  logM: number[];
}

export interface HabitSimulationOptions {
  /** Number of periods T; 1200 months by default, a century. */
  periods?: number;
}

/** Draws Δc_{t+1} = μ_c + σ_c ε_{t+1} from `normalRng(seed)` and runs the law of motion of eq. (3) from s̄. */
export function simulateHabit(seed: number, params: HabitParams, options: HabitSimulationOptions = {}): HabitPath {
  const { periods = 1200 } = options;
  if (!Number.isSafeInteger(periods) || periods < 1) throw new RangeError('periods must be a positive integer');
  const sBar = Math.log(steadyStateSurplus(params));
  const draw = normalRng(seed);
  const path: HabitPath = { dc: [], s: [sBar], S: [Math.exp(sBar)], c: [0], X: [1 - Math.exp(sBar)], logM: [] };
  for (let t = 0; t < periods; t++) {
    const dc = params.mean + params.sd * draw();
    const s = nextSurplus(path.s[t], dc, params);
    const c = path.c[t] + dc;
    path.dc.push(dc);
    path.logM.push(habitLogSdf(path.s[t], s, dc, params));
    path.s.push(s);
    path.S.push(Math.exp(s));
    path.c.push(c);
    path.X.push(Math.exp(c) * (1 - Math.exp(s)));
  }
  return path;
}

export interface PriceConsumptionOptions {
  /** Grid points equally spaced in S, up to S_max; 100 by default. */
  gridSize?: number;
  /** Grid points in the tail of low s, below the points equally spaced in S; 100 by default. */
  tailSize?: number;
  /** Gauss–Hermite nodes per expectation; 20 by default. */
  nodes?: number;
  /** Relative size of the remaining sum at which the series stops; 1e-12 by default. */
  tolerance?: number;
  /** Most terms the series may take before it throws; 100 000 by default. */
  maxTerms?: number;
  /** false switches the habit off, S_t ≡ 1, which leaves power utility; true by default. */
  habit?: boolean;
}

/** The price–consumption ratio of a claim to consumption, on a grid of s and between its points. */
export interface HabitSolution {
  /** Grid of s, ascending, ending at s_max. */
  s: number[];
  /** P_t/C_t at each grid point, in periods of consumption. */
  pc: number[];
  /** Number of zero-coupon claims summed, n = 1, …, terms. */
  terms: number;
  /** The log risk-free rate of the model solved: eq. (12) with the habit, the power-utility rate without. */
  riskFree: number;
  /** P_t/C_t at any s, linear in s between grid points and flat beyond the ends of the grid. */
  evaluate: (s: number) => number;
}

/**
 * γσ_c(1 + Λ(s)) at the bottom of the grid. It is the standard deviation of log M_{t+1} given s_t = s, and
 * E[M_{t+1}] is E[e^{aZ}] times a constant with this a. Gauss–Hermite quadrature with 20 nodes gets E[e^{aZ}] right
 * to about 1e-11 for a up to 3, and to only 1e-5 at a = 4.8 (s ≈ −500 at Table 1's values), so the grid stops here.
 */
const TAIL_SDF_VOLATILITY = 3;

/**
 * The grid of `priceConsumptionRatio`: `gridSize` points equally spaced in S, S_i = S_max i/G for i = 1, …, G,
 * where P/C is close to linear in S (Figure 3, p. 15) and the points crowd towards s_max; below them `tailSize`
 * points whose distance s̄ − s grows geometrically, down to the s at which γσ_c(1 + Λ(s)) reaches
 * TAIL_SDF_VOLATILITY. From (1 + Λ(s))² = (1 − 2(s − s̄))/S̄² and S̄² = σ_c² γ/(1 − φ), that s is
 * s̄ − (a²/(γ(1 − φ)) − 1)/2 with a = TAIL_SDF_VOLATILITY: −197 at Table 1's values.
 */
function surplusGrid(params: HabitParams, gridSize: number, tailSize: number): number[] {
  const sBar = Math.log(steadyStateSurplus(params));
  const sMax = maxSurplus(params);
  const top = Array.from({ length: gridSize }, (_, i) => sMax + Math.log((i + 1) / gridSize));
  // top[0] = s_max − log G lies below s̄ for every G ≥ 2, since s_max − s̄ = (1 − S̄²)/2 < log 2.
  const [near, far] = [sBar - top[0], (TAIL_SDF_VOLATILITY ** 2 / (params.gamma * (1 - params.phi)) - 1) / 2];
  if (!(far > near)) return top;
  const ratio = (far / near) ** (1 / tailSize);
  const tail = Array.from({ length: tailSize }, (_, k) => sBar - near * ratio ** (tailSize - k));
  return [...tail, ...top];
}

/** The tent function of grid point j at s: linear interpolation of values v on the grid is Σ_j tent(j, s) v_j. */
function tent(grid: readonly number[], j: number, s: number): number {
  const last = grid.length - 1;
  if (s <= grid[0]) return j === 0 ? 1 : 0;
  if (s >= grid[last]) return j === last ? 1 : 0;
  if (j > 0 && s > grid[j - 1] && s < grid[j]) return (s - grid[j - 1]) / (grid[j] - grid[j - 1]);
  if (j < last && s >= grid[j] && s < grid[j + 1]) return (grid[j + 1] - s) / (grid[j + 1] - grid[j]);
  return 0;
}

/** Index i of the grid interval [grid[i], grid[i + 1]) that holds s, clamped to the grid. */
function bracket(grid: readonly number[], s: number): number {
  let [lo, hi] = [0, grid.length - 1];
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (grid[mid] <= s) lo = mid;
    else hi = mid;
  }
  return lo;
}

function interpolate(grid: readonly number[], values: readonly number[], s: number): number {
  const last = grid.length - 1;
  if (s <= grid[0]) return values[0];
  if (s >= grid[last]) return values[last];
  const i = bracket(grid, s);
  const weight = (s - grid[i]) / (grid[i + 1] - grid[i]);
  return values[i] + weight * (values[i + 1] - values[i]);
}

/**
 * P_t/C_t as a function of s_t, by the series of zero-coupon claims to consumption. From the pricing of a
 * consumption claim (eq. 17, p. 11), F^(n)(s_t), the price of C_{t+n} over C_t, obeys
 *   F^(0) = 1,  F^(n)(s) = E[M_{t+1} e^{Δc_{t+1}} F^(n−1)(s_{t+1}) | s_t = s],  P_t/C_t = Σ_{n≥1} F^(n)(s_t).
 * The paper solves the same functional equation numerically on a grid of s_t, by numerical integration over the
 * normal shock (p. 11); the grid and the stopping rule here are our own.
 *
 * Grid. `surplusGrid`: by default 100 points equally spaced in S and 100 points in the tail below them, down to
 * s = −197 at Table 1's values. The values at the ends extend flat beyond them: s_{t+1} goes above s_max only in
 * discrete time (in the continuous-time limit it never does, p. 8).
 * Expectation. Linear interpolation makes F^(n−1)(s_{t+1}) = Σ_j tent_j(s_{t+1}) F^(n−1)_j, so F^(n) = K F^(n−1)
 * with K_ij = E[M_{t+1} e^{Δc_{t+1}} tent_j(s_{t+1}) | s_t = s_i], each one `normalExpectation` over the shock of
 * Δc_{t+1}. K is built once; every term is then a sparse product.
 * Stopping rule. With ρ_n = max_i F^(n)_i/F^(n−1)_i, which never rises with n because K is positive, the sum of the
 * terms after n is at most F^(n) ρ_n/(1 − ρ_n). The series stops after the first n at which ρ_n < 1 and that bound
 * is below `tolerance` times the sum so far at every grid point. It throws after `maxTerms` terms, as when the claim
 * has no finite price.
 * Accuracy and time. At Table 1's values the defaults sum about 3100 terms in about 35 ms (Node on an Apple
 * M-series laptop). P/C(s̄) is 1% above the value on 400 + 400 points, and a tail reaching γσ_c(1 + Λ) = 5, with
 * 40 nodes, lowers it by about 1% more: the defaults price the claim to about 2%.
 * Limit: prices here are set by rare paths on which s falls far below anything a simulation visits, because the
 * SDF S_{t+n}^{−γ} is huge there. A grid that stops at a moderate s misprices them, which is why the tail reaches
 * so low. The paper's grid, by its Figure 3 (p. 15), starts near S = 0.005, and its Table 2 (p. 20) reports a mean
 * price–dividend ratio of 18.3 years for the consumption claim; this solution gives about twice that, with the
 * same Sharpe ratio, about 0.45, and about half the paper's return volatility.
 */
export function priceConsumptionRatio(params: HabitParams, options: PriceConsumptionOptions = {}): HabitSolution {
  const { gridSize = 100, tailSize = 100, nodes = 20, tolerance = 1e-12, maxTerms = 100_000, habit = true } = options;
  if (!Number.isSafeInteger(gridSize) || gridSize < 2) throw new RangeError('gridSize must be an integer of at least 2');
  if (!Number.isSafeInteger(tailSize) || tailSize < 1) throw new RangeError('tailSize must be a positive integer');
  if (!(tolerance > 0)) throw new RangeError('tolerance must be positive');
  const grid = surplusGrid(params, gridSize, tailSize);
  const size = grid.length;
  const step = (s: number, dc: number) => (habit ? nextSurplus(s, dc, params) : s);
  const zs = gaussHermite(nodes).nodes.map((x) => Math.SQRT2 * x);
  // s_{t+1} rises with the shock, so the extreme nodes bound the grid points each row of K touches.
  const rows = grid.map((s) => {
    const [first, last] = [zs[0], zs[nodes - 1]].map((z) => bracket(grid, step(s, params.mean + params.sd * z)));
    const columns: number[] = [];
    const values: number[] = [];
    for (let j = first; j <= Math.min(last + 1, size - 1); j++) {
      columns.push(j);
      values.push(normalExpectation((z) => {
        const dc = params.mean + params.sd * z;
        const sNext = step(s, dc);
        return Math.exp(habitLogSdf(s, sNext, dc, params) + dc) * tent(grid, j, sNext);
      }, nodes));
    }
    return { columns, values };
  });

  let previous = new Float64Array(size).fill(1);
  const sum = new Float64Array(size);
  for (let n = 1; n <= maxTerms; n++) {
    const current = new Float64Array(size);
    let ratio = 0;
    rows.forEach(({ columns, values }, i) => {
      let value = 0;
      for (let k = 0; k < columns.length; k++) value += values[k] * previous[columns[k]];
      // Deep in the tail F^(n) underflows. Below 1e-300 it is flushed to zero, because subnormal numbers lose
      // their digits and their ratio could stick at one; a zero point no longer bounds the rate of decay.
      current[i] = value < 1e-300 ? 0 : value;
      sum[i] += current[i];
      if (previous[i] > 0) ratio = Math.max(ratio, current[i] / previous[i]);
    });
    if (ratio < 1 && current.every((value, i) => value === 0 || ((value / sum[i]) * ratio) / (1 - ratio) <= tolerance)) {
      const pc = Array.from(sum);
      return {
        s: grid,
        pc,
        terms: n,
        riskFree: habit ? habitRiskFree(params) : impliedRiskFree(params.delta, params.gamma, params.mean, params.sd),
        evaluate: (s) => interpolate(grid, pc, s),
      };
    }
    previous = current;
  }
  throw new Error(`priceConsumptionRatio: the series did not converge in ${maxTerms} terms`);
}

export interface HabitClaimReturnOptions {
  /** true sums each year of periods into one observation; false by default. */
  annual?: boolean;
  /** Periods in a year when annual is true; 12 by default. */
  periodsPerYear?: number;
}

/** Log price–consumption ratio pc, log return r and log excess return re of the consumption claim, by date. */
export interface HabitClaimReturns {
  pc: number[];
  r: number[];
  re: number[];
}

/**
 * The consumption claim along a path, for predictive regressions on model data: pc[i] and the returns r[i] and
 * re[i] that end on the same date, as `predictiveRegression` pairs them. Per period, dates run 1, …, T, with
 *   pc_t = log(P_t/C_t),  r_t = log((P_t/C_t + 1)/(P_{t−1}/C_{t−1})) + Δc_t,  re_t = r_t − r^f,
 * since R_t = (P_t + C_t)/P_{t−1}. The risk-free rate is constant, so re_t only shifts r_t.
 * Annual, as the paper's statistics are computed from time-averaged annual data (Table 2, p. 20): year y ends at
 * date y k, with k = periodsPerYear, and the last T − k⌊T/k⌋ periods are dropped. r and re add up the year's k
 * periods, and pc is the log of the price at the end of the year over the year's consumption,
 * pc_y = log(P_{yk}/C_{yk}) − log Σ_{j=0}^{k−1} e^{c_{yk−j} − c_{yk}}, a ratio in years of consumption.
 */
export function habitClaimReturns(
  path: HabitPath, solution: HabitSolution, options: HabitClaimReturnOptions = {},
): HabitClaimReturns {
  const { annual = false, periodsPerYear = 12 } = options;
  const ratio = path.s.map((s) => solution.evaluate(s));
  const monthly: HabitClaimReturns = { pc: [], r: [], re: [] };
  for (let t = 1; t < path.s.length; t++) {
    const r = Math.log((ratio[t] + 1) / ratio[t - 1]) + path.dc[t - 1];
    monthly.pc.push(Math.log(ratio[t]));
    monthly.r.push(r);
    monthly.re.push(r - solution.riskFree);
  }
  if (!annual) return monthly;
  const k = periodsPerYear;
  if (!Number.isSafeInteger(k) || k < 1) throw new RangeError('periodsPerYear must be a positive integer');
  const years: HabitClaimReturns = { pc: [], r: [], re: [] };
  const add = (values: readonly number[], end: number) => values.slice(end - k, end).reduce((a, b) => a + b, 0);
  for (let end = k; end < path.s.length; end += k) {
    let flow = 0;
    for (let j = 0; j < k; j++) flow += Math.exp(path.c[end - j] - path.c[end]);
    years.pc.push(Math.log(ratio[end]) - Math.log(flow));
    // monthly entry i ends at date i + 1, so the year ending at date `end` is entries end − k, …, end − 1.
    years.r.push(add(monthly.r, end));
    years.re.push(add(monthly.re, end));
  }
  return years;
}

export interface MarginalUtilityOptions {
  /** h in X_t = h C_{t−1}, in [0, 1). */
  h: number;
  /** γ, δ, μ_c and σ_c; Campbell & Cochrane's by default. */
  params?: HabitParams;
  /** Gauss–Hermite nodes for the expectation; 20 by default. */
  nodes?: number;
}

/**
 * Marginal utility of C_t at dates 1, …, T of a path of log consumption c_0, …, c_T, with the simple habit
 * X_t = h C_{t−1} and u(C_t − X_t) = (C_t − X_t)^{1−γ}/(1 − γ).
 * External: the habit is everyone else's past consumption, so MU_t = (C_t − h C_{t−1})^{−γ}.
 * Internal: C_t also sets the consumer's own habit X_{t+1} = h C_t, so differentiating
 * Σ_t δ^t u(C_t − h C_{t−1}) in C_t adds the next period's term:
 *   MU_t = (C_t − h C_{t−1})^{−γ} − δ h E_t[(C_{t+1} − h C_t)^{−γ}],
 * and with C_{t+1} = C_t e^{Δc_{t+1}}, i.i.d. N(μ_c, σ_c²) growth, E_t[(C_{t+1} − h C_t)^{−γ}] =
 * C_t^{−γ} E[(e^{Δc} − h)^{−γ}], by `normalExpectation`. Campbell & Cochrane compare the two in their model
 * (Section IV.C, p. 37): consumption today raises future habits and lowers marginal utility, but prices depend on
 * ratios of marginal utilities, so the two specifications differ only as much as that ratio moves over time.
 * With h = 0 both are power utility, C_t^{−γ}.
 * Limit: under exact normality e^{Δc} falls below h with positive probability and the expectation is not finite;
 * the quadrature uses only its nodes, so it needs e^{μ_c + σ_c z} > h at the lowest node z and throws otherwise.
 */
export function habitMarginalUtility(
  path: { c: readonly number[] }, options: MarginalUtilityOptions,
): { external: number[]; internal: number[] } {
  const { h, params = campbellCochraneParameters, nodes = 20 } = options;
  requireParams(params);
  requireFinite(h, ...path.c);
  if (!(h >= 0 && h < 1)) throw new RangeError('h must lie in [0, 1)');
  const { gamma, delta, mean, sd } = params;
  const lowest = mean + sd * Math.SQRT2 * gaussHermite(nodes).nodes[0];
  if (h > 0 && !(Math.exp(lowest) > h)) throw new RangeError('h must stay below the lowest quadrature growth e^{μ_c + σ_c z}');
  const next = h > 0 ? normalExpectation((z) => (Math.exp(mean + sd * z) - h) ** -gamma, nodes) : 0;
  const external: number[] = [];
  const internal: number[] = [];
  for (let t = 1; t < path.c.length; t++) {
    const [consumption, surplus] = [Math.exp(path.c[t]), Math.exp(path.c[t]) - h * Math.exp(path.c[t - 1])];
    if (!(surplus > 0)) throw new RangeError('Consumption fell to or below the habit h C_{t−1}');
    external.push(surplus ** -gamma);
    internal.push(surplus ** -gamma - delta * h * consumption ** -gamma * next);
  }
  return { external, internal };
}
