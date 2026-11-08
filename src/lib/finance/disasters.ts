/**
 * Rare disasters and the relative entropy estimator (Chapter 39). Every rate is a decimal log rate per year.
 *
 * Julliard & Ghosh (2012), *Review of Financial Studies*, cited by the pages of the working-paper pdf. When disasters
 * are rare, a sample can hold fewer of them than their true probability implies. Sample moments, which give every
 * year the weight 1/T, then credit the realised premium to a high risk aversion (p. 5). Their estimators let the
 * weights of the years differ from 1/T, as little as possible, so that the Euler equation holds (pp. 6–7). Fixing γ and
 * keeping only the weights is their calibration method (Section 1.2, p. 8).
 */
import { chiSquareSurvival } from '../math/distributions';
import { minimize } from '../math/optimize';
import { mulberry32, normalRng } from '../math/rng';
import { bisection, newton } from '../math/rootFind';
import type { ConsumptionSample } from './consumptionPuzzle';
import { arithmeticMean } from './returns';

function requireFinite(...values: number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('Expected finite numbers');
}

/** A claim priced by `disasterPricing`: its normal-times log return has standard deviation σ_i and covariance σ_ic
 * with Δc, and a disaster takes the fraction b_{D,i} of its value. */
export interface DisasterClaim {
  sd: number;
  cov: number;
  loss: number;
}

export interface DisasterParams {
  /** Time-discount factor δ. */
  delta: number;
  /** Relative risk aversion γ. */
  gamma: number;
  /** μ_c and σ_c: mean and standard deviation of log consumption growth in normal years. */
  mean: number;
  sd: number;
  /** π_D: chance of a disaster each year, in [0, 1). */
  probability: number;
  /** b_D: fraction of consumption a disaster takes, in [0, 1). */
  size: number;
  /** The claim to price; by default the consumption claim, σ_i = σ_c, σ_ic = σ_c² and b_{D,i} = b_D. */
  claim?: DisasterClaim;
}

function requireDisaster(params: DisasterParams): Required<DisasterParams> {
  const { delta, gamma, mean, sd, probability, size } = params;
  const claim = params.claim ?? { sd, cov: sd ** 2, loss: size };
  requireFinite(delta, gamma, mean, sd, probability, size, claim.sd, claim.cov, claim.loss);
  if (delta <= 0) throw new RangeError('Time discount factor must be positive');
  if (sd < 0 || claim.sd < 0) throw new RangeError('Standard deviations must be nonnegative');
  if (claim.cov ** 2 > (sd * claim.sd) ** 2 * (1 + 1e-12)) throw new RangeError('|σ_ic| cannot exceed σ_c σ_i');
  if (probability < 0 || probability >= 1) throw new RangeError('π_D must be in [0, 1)');
  if (size < 0 || size >= 1 || claim.loss >= 1) throw new RangeError('Disaster losses must be below 1');
  return { ...params, claim };
}

/** E[(1 − b_D)^{−γ 𝕀_D}(1 − b)^{𝕀_D}] for 𝕀_D ~ Bernoulli(π_D): 1 − π_D + π_D (1 − b_D)^{−γ}(1 − b). */
function disasterFactor({ gamma, probability, size }: DisasterParams, loss: number): number {
  return 1 - probability + probability * (1 - size) ** -gamma * (1 - loss);
}

export interface DisasterPricing {
  /** E[M]. */
  sdfMean: number;
  /** r^f = −log E[M]. */
  riskFree: number;
  /** log E[e^{r − r^f}] = log E[1 + R] − r^f of the claim, split as total = normal + disaster. */
  premium: { normal: number; disaster: number; total: number };
}

/**
 * Power utility with i.i.d. consumption growth and rare disasters (the model of Rietz 1988 and Barro 2006, as
 * Julliard & Ghosh 2012 describe it, p. 2). Each year, with probability π_D, a disaster (𝕀_D = 1) cuts consumption by
 * the fraction b_D:
 *   Δc = μ_c + σ_c ε + 𝕀_D log(1 − b_D),   r = μ_r + σ_i η + 𝕀_D log(1 − b_{D,i}),   M = δ e^{−γ Δc},
 * with (ε, η) standard bivariate normal, σ_c σ_i corr(ε, η) = σ_ic, and 𝕀_D independent of both.
 *
 * Derivation. Write R^e = (1 + R) − (1 + R^f). E[M R^e] = 0 is E[M(1 + R)] = (1 + R^f) E[M], and the risk-free asset
 * prices to E[M](1 + R^f) = 1. For a normal x, E[e^x] = e^{E x + Var(x)/2}, and 𝕀_D factors out:
 *   E[M] = δ e^{−γ μ_c + ½ γ² σ_c²} A_0,   A_0 = 1 − π_D + π_D (1 − b_D)^{−γ},
 *   E[M(1 + R)] = δ e^{−γ μ_c + μ_r + ½(γ² σ_c² + σ_i² − 2γ σ_ic)} A_i = 1,   A_i = 1 − π_D + π_D (1 − b_D)^{−γ}(1 − b_{D,i}),
 *   E[1 + R] = e^{μ_r + ½ σ_i²}(1 − π_D b_{D,i}).
 * So r^f = −log δ + γ μ_c − ½ γ² σ_c² − log A_0, and dividing E[1 + R] by 1 + R^f = 1/E[M] gives
 *   log E[1 + R] − r^f = γ σ_ic + [log(1 − π_D b_{D,i}) + log A_0 − log A_i].
 * The first term is the normal-times premium of the lognormal model, E[r − r^f] + ½ σ_i² = γ σ_ic. The bracket is the
 * disaster premium, which the term π_D (1 − b_D)^{−γ}, the disaster state's marginal utility, drives. To first order
 * in π_D it is π_D b_{D,i} [(1 − b_D)^{−γ} − 1]: the chance of the disaster times the claim's loss in it, scaled by
 * how much more a unit of consumption is worth then. With π_D = 0 everything is the lognormal model of
 * `impliedRiskFree` and `crraSdfMoments`.
 */
export function disasterPricing(params: DisasterParams): DisasterPricing {
  const p = requireDisaster(params);
  const { delta, gamma, mean, sd, probability, claim } = p;
  const logA0 = Math.log(disasterFactor(p, 0));
  const riskFree = -Math.log(delta) + gamma * mean - (gamma * sd) ** 2 / 2 - logA0;
  const normal = gamma * claim.cov;
  const disaster = Math.log1p(-probability * claim.loss) + logA0 - Math.log(disasterFactor(p, claim.loss));
  return { sdfMean: Math.exp(-riskFree), riskFree, premium: { normal, disaster, total: normal + disaster } };
}

/**
 * The smallest π_D in [0, 1) at which `disasterPricing` gives the premium `target`, at the other parameters of
 * `params` (its probability is ignored); null when none does. With a = (1 − b_D)^{−γ}(1 − b_{D,i}), the premium's
 * derivative in π_D vanishes where (a − 1)π_D² + 2π_D − 1 = 0, at π* = 1/(1 + √a). The premium is the normal-times
 * part at π_D = 0 and at π_D = 1, so it is monotone on [0, π*] and retraces its path on [π*, 1): bisection on
 * [0, π*] finds the root when the target lies between the two ends.
 */
export function requiredDisasterProbability(target: number, params: DisasterParams): number | null {
  requireFinite(target);
  const p = requireDisaster({ ...params, probability: 0 });
  const peak = 1 / (1 + Math.sqrt((1 - p.size) ** -p.gamma * (1 - p.claim.loss)));
  const gap = (probability: number) => disasterPricing({ ...p, probability }).premium.total - target;
  const [atZero, atPeak] = [gap(0), gap(peak)];
  if (atZero * atPeak > 0) return null;
  return bisection(gap, 0, peak);
}

export interface DisasterCentury {
  /** Δc_t, the claim's log return r_t, the constant r^f and r^e_t = r_t − r^f, one entry per year. */
  dc: number[];
  r: number[];
  rf: number[];
  re: number[];
  /** Whether year t holds a disaster, and how many do. */
  disaster: boolean[];
  disasters: number;
  /** Sample premium log(mean_t e^{r^e_t}), the sample version of `disasterPricing`'s premium.total. */
  premium: number;
}

/**
 * `years` seeded years of the model of `disasterPricing`. Disasters are mulberry32(seed) uniforms below π_D; ε and
 * η come from normalRng(seed + 1), with σ_i η = (σ_ic/σ_c) ε + √(σ_i² − σ_ic²/σ_c²) ξ. μ_r is the mean log return
 * at which the claim prices to E[M(1 + R)] = 1. With π_D = 0.02, a century holds no disaster with chance
 * 0.98^100 ≈ 13%, and then its premium is near the normal-times part alone.
 */
export function simulateDisasterCentury(seed: number, params: DisasterParams, years: number): DisasterCentury {
  const p = requireDisaster(params);
  if (!Number.isInteger(years) || years < 1) throw new RangeError('years must be a positive integer');
  const { delta, gamma, mean, sd, probability, size, claim } = p;
  const { riskFree } = disasterPricing(p);
  const meanLogReturn = -Math.log(delta) + gamma * mean
    - ((gamma * sd) ** 2 + claim.sd ** 2 - 2 * gamma * claim.cov) / 2 - Math.log(disasterFactor(p, claim.loss));
  const slope = sd > 0 ? claim.cov / sd : 0;
  const idiosyncratic = Math.sqrt(Math.max(claim.sd ** 2 - slope ** 2, 0));
  const uniform = mulberry32(seed);
  const normal = normalRng(seed + 1);
  const century: DisasterCentury = { dc: [], r: [], rf: [], re: [], disaster: [], disasters: 0, premium: 0 };
  for (let t = 0; t < years; t++) {
    const hit = uniform() < probability;
    const [e, xi] = [normal(), normal()];
    const r = meanLogReturn + slope * e + idiosyncratic * xi + (hit ? Math.log1p(-claim.loss) : 0);
    century.dc.push(mean + sd * e + (hit ? Math.log1p(-size) : 0));
    century.r.push(r);
    century.rf.push(riskFree);
    century.re.push(r - riskFree);
    century.disaster.push(hit);
    if (hit) century.disasters += 1;
  }
  century.premium = Math.log(arithmeticMean(century.re.map(Math.exp)));
  return century;
}

/**
 * The Euler moment of the excess return at each date, g_t(γ) = e^{−γ Δc_t} R^e_t (Julliard & Ghosh 2012, eq. (1),
 * p. 4, with δ dropped because it scales every g_t alike). R^e_t = e^{r_t} − e^{r^f_t} is the gross excess return, the
 * real return of the market less the real risk-free rate, rebuilt from the log rates of a `ConsumptionSample`.
 */
export function eulerMoments(sample: Pick<ConsumptionSample, 'dc' | 'r' | 'rf'>, gamma: number): number[] {
  requireFinite(gamma);
  if (sample.r.length !== sample.dc.length || sample.rf.length !== sample.dc.length) {
    throw new RangeError('Every year needs Δc, r and r^f');
  }
  return sample.dc.map((dc, t) => Math.exp(-gamma * dc) * (Math.exp(sample.r[t]) - Math.exp(sample.rf[t])));
}

/** g/max|g| and the scale, or null unless some g_t < 0 < some g_s, when no positive weights give Σ π_t g_t = 0. */
function scaledMoments(g: readonly number[]): { x: number[]; scale: number } | null {
  requireFinite(...g);
  if (g.length < 2) throw new RangeError('Need at least two moments');
  if (!(Math.min(...g) < 0 && Math.max(...g) > 0)) return null;
  const scale = Math.max(...g.map(Math.abs));
  return { x: g.map((value) => value / scale), scale };
}

export interface EntropyWeights {
  /** π_t, positive and summing to 1. */
  weights: number[];
  /** Relative entropy KL = Σ_t π_t log(T π_t) of the weights from equal weights 1/T; 0 only at π_t = 1/T. */
  entropy: number;
  /** Dual multiplier ℓ: π_t ∝ e^{ℓ g_t}. */
  multiplier: number;
}

/**
 * The weights closest to equal weights in relative entropy that price the moments: min Σ_t π_t log(T π_t) s.t.
 * Σ_t π_t = 1 and Σ_t π_t g_t = 0 (Julliard & Ghosh 2012, eq. (6), p. 7, the exponentially tilted weights of
 * BETEL). The convex dual gives π_t = e^{ℓ g_t}/Σ_s e^{ℓ g_s}, with ℓ the minimiser of Σ_t e^{ℓ g_t}
 * (Appendix A.1.2, eqs. (17)–(18), p. 32). `newton` solves its first-order condition Σ_t g_t e^{ℓ g_t} = 0 from
 * ℓ = 0, on g/max|g| so that ℓ is of order one. Null unless some g_t < 0 < some g_s.
 */
export function entropyWeights(g: readonly number[]): EntropyWeights | null {
  const scaled = scaledMoments(g);
  if (!scaled) return null;
  const { x, scale } = scaled;
  // Dividing by e^{max_t ℓ x_t} keeps every exponential at most 1; it cancels in Newton's ratio.
  const tilts = (l: number) => {
    const top = Math.max(...x.map((value) => l * value));
    return x.map((value) => Math.exp(l * value - top));
  };
  const l = newton(
    (value) => tilts(value).reduce((sum, w, t) => sum + w * x[t], 0),
    (value) => tilts(value).reduce((sum, w, t) => sum + w * x[t] ** 2, 0),
    0,
  );
  if (!Number.isFinite(l)) throw new Error('entropyWeights: Newton did not converge');
  const tilted = tilts(l);
  const total = tilted.reduce((sum, w) => sum + w, 0);
  const weights = tilted.map((w) => w / total);
  const entropy = weights.reduce((sum, w) => sum + w * Math.log(g.length * w), 0);
  return { weights, entropy, multiplier: l / scale };
}

export interface LikelihoodWeights {
  /** π_t = 1/(T(1 + ℓ g_t)), positive and summing to 1. */
  weights: number[];
  /** Dual multiplier ℓ. */
  multiplier: number;
  /** Nonparametric log-likelihood Σ_t log π_t; −T log T at equal weights. */
  logLikelihood: number;
  /** Likelihood-ratio statistic LR = −2(Σ_t log π_t + T log T) = 2 Σ_t log(1 + ℓ g_t), and its χ²(1) p-value. */
  statistic: number;
  pValue: number;
}

/**
 * Empirical likelihood weights: max Σ_t log π_t s.t. Σ_t π_t = 1 and Σ_t π_t g_t = 0 (Julliard & Ghosh 2012, eq. (3),
 * p. 6). Its dual gives π_t = 1/(T(1 + ℓ g_t)) (Appendix A.1.2, eqs. (15)–(16), p. 32), with ℓ the root of
 * Σ_t g_t/(1 + ℓ g_t) = 0. That sum falls in ℓ, and at the root every π_t ≤ 1, so 1 + ℓ g_t ≥ 1/T: bisection
 * brackets it on the ℓ where this holds for every t. The statistic tests the moment at this γ, with a χ²(1) limit
 * (p. 7). Null unless some g_t < 0 < some g_s.
 */
export function empiricalLikelihoodWeights(g: readonly number[]): LikelihoodWeights | null {
  const scaled = scaledMoments(g);
  if (!scaled) return null;
  const { x, scale } = scaled;
  const T = x.length;
  const floor = 1 - 1 / T;
  const l = bisection(
    (value) => x.reduce((sum, v) => sum + v / (1 + value * v), 0),
    -floor / Math.max(...x), floor / -Math.min(...x),
    // ℓ is of order one on g/max|g|, so this stops within a few ulps of the root.
    { tol: 1e-15 },
  );
  const weights = x.map((value) => 1 / (T * (1 + l * value)));
  const logLikelihood = weights.reduce((sum, w) => sum + Math.log(w), 0);
  const statistic = Math.max(-2 * (logLikelihood + T * Math.log(T)), 0);
  return { weights, multiplier: l / scale, logLikelihood, statistic, pValue: chiSquareSurvival(statistic, 1) };
}

export interface EntropyProfilePoint {
  gamma: number;
  /** `entropyWeights` at this γ: the relative entropy and the weights π_t. */
  entropy: number;
  weights: number[];
  /** Share of the weight on the `worstYears` years with the largest consumption falls; worstYears/T at equal weights. */
  worstWeight: number;
  /** `empiricalLikelihoodWeights` at this γ: LR and its χ²(1) p-value. */
  statistic: number;
  pValue: number;
}

export interface EntropyProfile {
  /** One point per γ at which both estimators have weights; a γ with one-signed g_t is left out. */
  points: EntropyProfilePoint[];
  /** Indices of the `worstYears` years with the most negative Δc_t. */
  worstYears: number[];
  /** The γ that minimises each criterion: the grid's best point, refined by `minimize`. */
  best: { entropy: number; statistic: number };
}

/**
 * Both estimators across a grid of γ (Julliard & Ghosh 2012, pp. 10–12): the BETEL weights minimise the relative
 * entropy, the EL weights the statistic, and each criterion's minimiser estimates γ. `worstYears` (by default 4;
 * on the annual sample they are 1930, 1932, 1933 and 2020) sets how many of the largest consumption falls the
 * worst-year weight adds up.
 */
export function entropyProfile(
  sample: Pick<ConsumptionSample, 'dc' | 'r' | 'rf'>, gammas: readonly number[], { worstYears = 4 } = {},
): EntropyProfile {
  if (gammas.length === 0) throw new RangeError('Need at least one γ');
  if (!Number.isInteger(worstYears) || worstYears < 1 || worstYears > sample.dc.length) {
    throw new RangeError('worstYears must count between 1 and T years');
  }
  const worst = sample.dc.map((dc, t) => ({ dc, t })).sort((a, b) => a.dc - b.dc).slice(0, worstYears)
    .map(({ t }) => t).sort((a, b) => a - b);
  const points: EntropyProfilePoint[] = [];
  for (const gamma of gammas) {
    const g = eulerMoments(sample, gamma);
    const [tilted, likelihood] = [entropyWeights(g), empiricalLikelihoodWeights(g)];
    if (!tilted || !likelihood) continue;
    points.push({
      gamma,
      entropy: tilted.entropy,
      weights: tilted.weights,
      worstWeight: worst.reduce((sum, t) => sum + tilted.weights[t], 0),
      statistic: likelihood.statistic,
      pValue: likelihood.pValue,
    });
  }
  if (points.length === 0) throw new RangeError('No γ in the grid gives g_t of both signs');
  const refine = (criterion: (g: number[]) => number, key: 'entropy' | 'statistic') => {
    const start = points.reduce((best, point) => (point[key] < best[key] ? point : best)).gamma;
    const step = gammas.length > 1 ? Math.abs(gammas[1] - gammas[0]) : 1;
    return minimize(([gamma]) => criterion(eulerMoments(sample, gamma)), [start], { step }).x[0];
  };
  return {
    points,
    worstYears: worst,
    best: {
      entropy: refine((g) => entropyWeights(g)?.entropy ?? Infinity, 'entropy'),
      statistic: refine((g) => empiricalLikelihoodWeights(g)?.statistic ?? Infinity, 'statistic'),
    },
  };
}
