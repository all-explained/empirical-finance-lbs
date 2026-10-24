// Two-pass tests of factor models. First pass: the time-series betas β̂_i, Σ̂_ε and Σ̂_f from
// timeSeriesRegressions. Second pass: regress mean excess returns (or each month's excess returns)
// across assets on the betas, so the slopes are risk premia λ in E[R^e_i] = β_i'λ.
// beta is N × K (row i is β_i'), excess is T × N. Returns are decimals.
import { inverse, matMul, solve, transpose } from '../math/linalg';
import { invCdf } from '../math/normal';
import { normalRng } from '../math/rng';
import { sampleMeans } from './portfolio';
import { timeSeriesRegressions } from './timeSeriesTests';

export type Weighting = 'ols' | 'gls';

export interface CrossSectionalRegression {
  /** λ̂, one per factor. */
  lambda: number[];
  /** λ̂_0, the intercept (zero-beta excess return), only with intercept: true. */
  lambda0?: number;
  /** Pricing errors α̂_i = R̄^e_i - λ̂_0 - β_i'λ̂. */
  alpha: number[];
  /** Fitted mean excess returns λ̂_0 + β_i'λ̂. */
  fitted: number[];
  /** Cross-sectional R², see crossSectionalRegression. */
  r2: number;
}

export interface FamaMacBeth {
  /** T × K: row t is the month's slope vector λ̂_t. */
  monthly: number[][];
  /** λ̂ = (1/T) Σ_t λ̂_t. */
  lambda: number[];
  /** se(λ̂_k) = σ(λ̂_{k,t})/√T, with σ² = (1/T) Σ_t (λ̂_{k,t} - λ̂_k)². */
  se: number[];
  tStats: number[];
  /** T × K: row t is the mean of λ̂_1, …, λ̂_t, for a frame-by-frame figure. */
  runningMean: number[][];
  /** T × N: the month's fitted excess returns λ̂_{0t} + β_i'λ̂_t. */
  fitted: number[][];
  /** With intercept: true, the monthly λ̂_{0t}, their mean, standard error and t-statistic. */
  intercept?: { monthly: number[]; mean: number; se: number; tStat: number };
}

export interface ShankenCorrection {
  /** K × K (1/T)[AΣ_εA' + Σ_f]: betas treated as known. */
  naive: number[][];
  /** K × K (1/T)[AΣ_εA'(1 + c) + Σ_f]. */
  corrected: number[][];
  naiveSE: number[];
  correctedSE: number[];
  /** c = λ'Σ_f⁻¹λ. */
  c: number;
}

export interface TwoPassSimulation {
  /** First replication: β̂_i, one per asset, to scatter around the true β_i. */
  betaHat: number[];
  /** One entry per replication. */
  lambdaHat: number[];
  naiveSE: number[];
  correctedSE: number[];
  /** Share of replications whose 95% interval λ̂ ± 1.96·se contains the true λ. */
  naiveCoverage: number;
  correctedCoverage: number;
}

function design(beta: readonly (readonly number[])[], intercept: boolean): number[][] {
  return beta.map((row) => (intercept ? [1, ...row] : [...row]));
}

function times(A: readonly (readonly number[])[], x: readonly number[]): number[] {
  return A.map((row) => row.reduce((sum, value, j) => sum + value * x[j], 0));
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Cross-sectional regression of mean excess returns on betas, R̄^e = X b + α with X = β
 * (or [1 β] with an intercept), estimated by weighted least squares: b̂ = (X'WX)⁻¹X'W R̄^e.
 * OLS takes W = I, so without an intercept λ̂ = (β'β)⁻¹β'R̄^e. GLS takes W = Σ_ε⁻¹ and needs
 * residualCovariance. In sample, the time-series fit makes the return covariance Σ = βΣ_fβ' + Σ_ε,
 * and the Woodbury identity gives Σ⁻¹X = Σ_ε⁻¹X M for an invertible M, so W = Σ⁻¹ gives the same b̂.
 * Pass Σ when Σ_ε is singular, as when a traded factor is itself a test asset.
 *
 * Cross-sectional R², one definition for every case (intercept or not, OLS or GLS):
 * R² = 1 - Σ_i α̂_i² / Σ_i (R̄^e_i - m)², with m the plain average of R̄^e_i across assets.
 * It is the share of the cross-sectional spread of mean returns that the fitted values explain.
 * With an intercept and OLS, the α̂_i average to zero and it is the usual centred R². Without an
 * intercept it can be negative: the model then prices worse than a constant.
 */
export function crossSectionalRegression(
  beta: readonly (readonly number[])[],
  meanExcess: readonly number[],
  { intercept, weighting, residualCovariance }: {
    intercept: boolean; weighting: Weighting; residualCovariance?: readonly (readonly number[])[];
  },
): CrossSectionalRegression {
  if (beta.length !== meanExcess.length) throw new RangeError('One beta row per mean return');
  const X = design(beta, intercept);
  let XtW = transpose(X);
  if (weighting === 'gls') {
    if (!residualCovariance) throw new RangeError('GLS needs residualCovariance');
    XtW = matMul(XtW, inverse(residualCovariance));
  }
  const b = solve(matMul(XtW, X), times(XtW, meanExcess));
  const fitted = times(X, b);
  const alpha = meanExcess.map((r, i) => r - fitted[i]);
  const m = sum(meanExcess) / meanExcess.length;
  const r2 = 1 - sum(alpha.map((a) => a * a)) / sum(meanExcess.map((r) => (r - m) ** 2));
  return intercept
    ? { lambda: b.slice(1), lambda0: b[0], alpha, fitted, r2 }
    : { lambda: b, alpha, fitted, r2 };
}

/**
 * Fama–MacBeth: each month an OLS cross-sectional regression of R^e_{i,t} on the fixed betas,
 * R^e_t = X b_t + α_t, so b̂_t = (X'X)⁻¹X'R^e_t. The estimate is the time average of b̂_t and its
 * standard error treats the b̂_t as an i.i.d. sample: σ(b̂_t)/√T, with the divisor T in σ².
 * Because b̂_t is linear in R^e_t with fixed betas, the mean of b̂_t is the cross-sectional OLS
 * regression on R̄^e, and se² = (1/T)(X'X)⁻¹X'Σ̂X(X'X)⁻¹ with Σ̂ the divisor-T return covariance.
 */
export function famaMacBeth(
  excess: readonly (readonly number[])[], beta: readonly (readonly number[])[], { intercept }: { intercept: boolean },
): FamaMacBeth {
  if (excess.length === 0 || excess.some((row) => row.length !== beta.length)) {
    throw new RangeError('famaMacBeth: every month needs one excess return per beta row');
  }
  const X = design(beta, intercept);
  const Xt = transpose(X);
  const projection = matMul(inverse(matMul(Xt, X)), Xt);
  const coefficients = matMul(excess, transpose(projection));
  const T = excess.length;
  const series = transpose(coefficients);
  const mean = series.map((b) => sum(b) / T);
  const se = series.map((b, j) => Math.sqrt(sum(b.map((v) => (v - mean[j]) ** 2)) / T / T));
  const k0 = intercept ? 1 : 0;
  const monthly = coefficients.map((row) => row.slice(k0));
  const totals = mean.slice(k0).map(() => 0);
  const runningMean = monthly.map((row, t) => row.map((v, k) => (totals[k] += v) / (t + 1)));
  return {
    monthly,
    lambda: mean.slice(k0),
    se: se.slice(k0),
    tStats: mean.slice(k0).map((m, k) => m / se[k + k0]),
    runningMean,
    fitted: matMul(coefficients, Xt),
    ...(intercept && { intercept: { monthly: series[0], mean: mean[0], se: se[0], tStat: mean[0] / se[0] } }),
  };
}

/**
 * Covariance of the second-pass λ̂ = A R̄^e (no intercept), A = (β'β)⁻¹β' for OLS or
 * (β'Σ_ε⁻¹β)⁻¹β'Σ_ε⁻¹ for GLS. Derivation, with i.i.d. errors independent of the factors:
 * R^e_t = βλ + β(f_t - E f) + ε_t, so with known betas λ̂ - λ = (f̄ - E f) + A ε̄ and
 * Var(λ̂) = (1/T)[AΣ_εA' + Σ_f], the naive covariance (what Fama–MacBeth gives with fixed betas).
 * With first-pass betas, β̂ - β = (1/T) Σ_t ε_t (f_t - f̄)'Σ_f⁻¹, which adds -A(β̂ - β)λ to λ̂ - λ.
 * That term is uncorrelated with ε̄ and f̄ and has covariance (1/T) AΣ_εA' · λ'Σ_f⁻¹λ, so
 * Var(λ̂) = (1/T)[AΣ_εA'(1 + c) + Σ_f], c = λ'Σ_f⁻¹λ (the Shanken correction).
 * For GLS, AΣ_εA' = (β'Σ_ε⁻¹β)⁻¹. c is a squared Sharpe ratio: for traded factors λ = E f, so
 * c = E f'Σ_f⁻¹E f, the squared maximum Sharpe ratio of the factors.
 */
export function shankenCorrection(
  beta: readonly (readonly number[])[],
  residualCovariance: readonly (readonly number[])[],
  factorCovariance: readonly (readonly number[])[],
  lambda: readonly number[],
  T: number,
  { weighting }: { weighting: Weighting },
): ShankenCorrection {
  const Bt = transpose(beta);
  let core: number[][];
  if (weighting === 'gls') {
    core = inverse(matMul(matMul(Bt, inverse(residualCovariance)), beta));
  } else {
    const A = matMul(inverse(matMul(Bt, beta)), Bt);
    core = matMul(matMul(A, residualCovariance), transpose(A));
  }
  const scaled = solve(factorCovariance, lambda);
  const c = sum(lambda.map((l, k) => l * scaled[k]));
  const naive = core.map((row, i) => row.map((v, j) => (v + factorCovariance[i][j]) / T));
  const corrected = core.map((row, i) => row.map((v, j) => (v * (1 + c) + factorCovariance[i][j]) / T));
  return {
    naive,
    corrected,
    naiveSE: naive.map((row, k) => Math.sqrt(row[k])),
    correctedSE: corrected.map((row, k) => Math.sqrt(row[k])),
    c,
  };
}

/**
 * A seeded one-factor world: f_t = λ + (λ/SR) z_t, a traded factor with mean λ and Sharpe ratio SR,
 * and R^e_{i,t} = β_i f_t + residualSd · z_{i,t}, so α = 0 and c = SR². Each replication runs the
 * first pass (timeSeriesRegressions), the OLS cross-sectional regression of R̄^e on β̂ without an
 * intercept, and shankenCorrection at the estimated λ̂, Σ̂_ε and Σ̂_f.
 */
export function simulateTwoPass(
  seed: number,
  { N, T, beta, lambda, factorSharpe, residualSd, replications }: {
    N: number; T: number; beta: readonly number[]; lambda: number; factorSharpe: number;
    residualSd: number; replications: number;
  },
): TwoPassSimulation {
  if (beta.length !== N) throw new RangeError('simulateTwoPass: beta needs N entries');
  if (!(lambda > 0 && factorSharpe > 0 && residualSd > 0 && replications >= 1)) {
    throw new RangeError('simulateTwoPass: lambda, factorSharpe, residualSd and replications must be positive');
  }
  const z = normalRng(seed);
  const factorSd = lambda / factorSharpe;
  const critical = invCdf(0.975);
  const out: TwoPassSimulation = {
    betaHat: [], lambdaHat: [], naiveSE: [], correctedSE: [], naiveCoverage: 0, correctedCoverage: 0,
  };
  for (let r = 0; r < replications; r++) {
    const factors = Array.from({ length: T }, () => [lambda + factorSd * z()]);
    const excess = factors.map(([f]) => beta.map((b) => b * f + residualSd * z()));
    const fit = timeSeriesRegressions(excess, factors);
    const [lambdaHat] = crossSectionalRegression(fit.beta, sampleMeans(excess), { intercept: false, weighting: 'ols' }).lambda;
    const { naiveSE: [naive], correctedSE: [corrected] } = shankenCorrection(
      fit.beta, fit.residualCovariance, fit.factorCovariance, [lambdaHat], T, { weighting: 'ols' },
    );
    if (r === 0) out.betaHat = fit.beta.map(([b]) => b);
    out.lambdaHat.push(lambdaHat);
    out.naiveSE.push(naive);
    out.correctedSE.push(corrected);
    if (Math.abs(lambdaHat - lambda) <= critical * naive) out.naiveCoverage++;
    if (Math.abs(lambdaHat - lambda) <= critical * corrected) out.correctedCoverage++;
  }
  out.naiveCoverage /= replications;
  out.correctedCoverage /= replications;
  return out;
}
