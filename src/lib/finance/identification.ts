// Identification of risk premia (Chapter 27): useless factors in the two-pass regression, the rank test,
// and GRS-FAR tests and confidence sets that stay valid when betas are weak.
// KZ: Kleibergen & Zhan (2020), "Robust inference for consumption-based asset pricing", Journal of
// Finance 75(1), 507–550. GKR: Gospodinov, Kan & Robotti (2019), "Too good to be true? Fallacies in
// evaluating risk factor models", Journal of Financial Economics 132(2), 451–471; pages cite the
// Atlanta Fed working paper 2017-9.
// excess is T × N (one row per period), as in timeSeriesTests.ts. Every model here has a zero-beta rate
// λ_0: E[R^e_i] = λ_0 + β_i'λ.
import { inverse, solve } from '../math/linalg';
import { chiSquareSurvival, fSurvival } from '../math/distributions';
import { invCdf } from '../math/normal';
import { normalRng } from '../math/rng';
import { crossSectionalRegression, famaMacBeth, shankenCorrection } from './crossSection';
import { sampleMeans } from './portfolio';
import { timeSeriesRegressions } from './timeSeriesTests';

export interface UselessFactorSimulation {
  /** One entry per draw: the second-pass λ̂ on the simulated factor. */
  lambda: number[];
  /** λ̂ divided by its Fama–MacBeth standard error. */
  famaMacBethT: number[];
  /** λ̂ divided by its Shanken-corrected standard error. */
  shankenT: number[];
  /** Cross-sectional R² of the second pass, as in crossSectionalRegression. */
  r2: number[];
}

export interface RankTest {
  /** F form, KZ eq. (19): (T - N)/(N - 1) · Q̂_FF B̂'Σ̂⁻¹B̂ ~ F(N - 1, T - N) under B = 0. */
  statistic: number;
  pValue: number;
  /** N - 1. */
  df1: number;
  /** T - N. */
  df2: number;
  /** Wald form, KZ eq. (17): T · Q̂_FF B̂'Σ̂⁻¹B̂, compared with χ²_{N-1} (eq. 18). */
  wald: number;
  waldPValue: number;
}

export interface GrsFar {
  /** F-scaled GRS-FAR, KZ eq. (25): (T - K - N + 1)/(T(N - 1)) · GRS-FAR ~ F(N - 1, T - K - N + 1). */
  statistic: number;
  pValue: number;
  /** N - 1. */
  df1: number;
  /** T - K - N + 1. */
  df2: number;
  /** First form of KZ eq. (23), Kleibergen's (2009) FAR: T α̂(λ°)'Σ̂⁻¹α̂(λ°)/(1 - λ°'Q̂(λ°)⁻¹λ°). */
  farForm: number;
  /** Second form of KZ eq. (23), the Hotelling form: T (R̄ - B̂λ°)'Σ̂⁻¹(R̄ - B̂λ°)/(1 + λ°'Q̂_FF⁻¹λ°). */
  hotellingForm: number;
}

export interface FarConfidenceSet {
  /** Runs of accepted grid values, [first, last] each, in grid order. */
  intervals: [number, number][];
  /** The set reaches the first or the last grid value, so it may go on beyond the grid. */
  unbounded: boolean;
  /** No grid value is accepted. */
  empty: boolean;
}

export interface WaldInterval {
  se: number;
  lower: number;
  upper: number;
}

export interface WaldConfidenceSet {
  /** λ̂ from the two-pass regression with an intercept. */
  lambda: number;
  famaMacBeth: WaldInterval;
  shanken: WaldInterval;
}

export interface WeakIdentificationSimulation {
  /** True betas β_i, evenly spaced over [1 - betaSpread/2, 1 + betaSpread/2]. */
  beta: number[];
  /** One 95% Wald set per sample. */
  wald: WaldConfidenceSet[];
  /** One 95% GRS-FAR set per sample, on the grid. */
  far: FarConfidenceSet[];
  /** Share of samples whose 95% set contains the true λ. */
  coverage: { famaMacBeth: number; shanken: number; far: number };
}

/** Level of the sets in simulateWeakIdentification: 95% sets. */
const LEVEL = 0.05;

function dot(x: readonly number[], y: readonly number[]): number {
  return x.reduce((sum, value, i) => sum + value * y[i], 0);
}

function times(A: readonly (readonly number[])[], x: readonly number[]): number[] {
  return A.map((row) => dot(row, x));
}

function column(factor: readonly number[]): number[][] {
  return factor.map((f) => [f]);
}

/**
 * KZ eq. (15), p. 518: the N - 1 returns R_t = (R_{1t}, …, R_{N-1,t})' - ι R_{Nt}, each of the first N - 1
 * assets minus the last one. This removes the zero-beta rate λ_0, so B = (β_1, …, β_{N-1})' - ι β_N' and
 * E[R_t] = Bλ. The risk-free rate cancels too, so excess and raw returns give the same R_t. KZ prove that
 * their statistics do not depend on which asset is subtracted.
 */
function lastDifferences(excess: readonly (readonly number[])[]): number[][] {
  if (excess.length === 0 || excess[0].length < 2) throw new RangeError('Need at least two assets');
  return excess.map((row) => row.slice(0, -1).map((r) => r - row[row.length - 1]));
}

/**
 * GRS-FAR as a function of λ° from one time-series fit, so a grid costs O(N²) per point.
 * Hotelling form of KZ eq. (23) with B̂, Σ̂ (divisor T) and Q̂_FF = Σ̂_f (divisor T) from timeSeriesRegressions.
 */
function farTest(excess: readonly (readonly number[])[], factors: readonly (readonly number[])[]) {
  const R = lastDifferences(excess);
  const T = R.length;
  const df1 = R[0].length;
  const K = factors[0]?.length ?? 0;
  const df2 = T - K - df1;
  if (df2 <= 0) throw new RangeError('GRS-FAR needs T > N + K - 1');
  const fit = timeSeriesRegressions(R, factors);
  const meanR = sampleMeans(R);
  const residualPrecision = inverse(fit.residualCovariance);
  return (lambdaNull: readonly number[]) => {
    if (lambdaNull.length !== K) throw new RangeError('One hypothesised premium per factor');
    const error = meanR.map((r, i) => r - dot(fit.beta[i], lambdaNull));
    const hotellingForm = T * dot(error, times(residualPrecision, error))
      / (1 + dot(lambdaNull, solve(fit.factorCovariance, lambdaNull)));
    const statistic = df2 / (T * df1) * hotellingForm;
    return { statistic, pValue: fSurvival(statistic, df1, df2), df1, df2, hotellingForm };
  };
}

/**
 * The grid values of λ° whose test p-value is at least q, as runs of consecutive grid values (KZ eq. 27,
 * p. 528: accept when the F-scaled statistic is at most the upper-q critical value).
 */
function acceptedSet(grid: readonly number[], q: number, pValue: (lambdaNull: number) => number): FarConfidenceSet {
  if (grid.length === 0 || grid.some((value, j) => j > 0 && !(value > grid[j - 1]))) {
    throw new RangeError('The grid must be non-empty and increasing');
  }
  const accepted = grid.map((lambdaNull) => pValue(lambdaNull) >= q);
  const intervals: [number, number][] = [];
  accepted.forEach((ok, j) => {
    if (!ok) return;
    if (j > 0 && accepted[j - 1]) intervals[intervals.length - 1][1] = grid[j];
    else intervals.push([grid[j], grid[j]]);
  });
  return { intervals, unbounded: accepted[0] || accepted[accepted.length - 1], empty: intervals.length === 0 };
}

/**
 * Two-pass regression with an intercept on one factor: first-pass betas (timeSeriesRegressions), then the OLS
 * cross-sectional regression of mean excess returns on [1 β̂]. λ̂ and its standard error come from
 * famaMacBeth, R² from crossSectionalRegression. By Frisch–Waugh–Lovell the slope with an intercept is the
 * no-intercept slope on the centred betas β̂_i - mean β̂, so shankenCorrection on the centred betas gives the
 * Shanken standard error of λ̂ with an intercept, with c = λ̂²/σ̂²_f at the estimate.
 */
function twoPass(excess: readonly (readonly number[])[], factor: readonly number[]) {
  const fit = timeSeriesRegressions(excess, column(factor));
  const { lambda: [lambda], se: [famaMacBethSE] } = famaMacBeth(excess, fit.beta, { intercept: true });
  const { r2 } = crossSectionalRegression(fit.beta, sampleMeans(excess), { intercept: true, weighting: 'ols' });
  const meanBeta = fit.beta.reduce((sum, [b]) => sum + b, 0) / fit.beta.length;
  const { correctedSE: [shankenSE] } = shankenCorrection(
    fit.beta.map(([b]) => [b - meanBeta]), fit.residualCovariance, fit.factorCovariance, [lambda], excess.length,
    { weighting: 'ols' },
  );
  return { lambda, famaMacBethSE, shankenSE, r2 };
}

/**
 * Seeded factors f_t = s·m_t + e_t on real returns, run through the two-pass regression with an intercept.
 * m_t is the equal-weighted average of the N excess returns in `excess`, standardised to sample mean 0 and
 * standard deviation 1 (divisor T); it is the same in every draw. e_t are seeded standard normal draws, new in
 * each draw. strength s = 0 gives a useless factor: its true betas are zero, yet the second pass divides by
 * β̂ that are pure noise. With a misspecified model, the estimate on such a factor diverges at rate √T for
 * the OLS two-pass (GKR, fn. 13, p. 12), so its t-statistic rejects far too often, and for invariant
 * estimators the R² tends to one (GKR, Theorem 1, p. 11).
 */
export function simulateUselessFactor(
  seed: number,
  excess: readonly (readonly number[])[],
  { samples, strength }: { samples: number; strength: number },
): UselessFactorSimulation {
  if (!(samples >= 1)) throw new RangeError('simulateUselessFactor: samples must be at least 1');
  const T = excess.length;
  const average = excess.map((row) => row.reduce((sum, r) => sum + r, 0) / row.length);
  const mean = average.reduce((sum, value) => sum + value, 0) / T;
  const sd = Math.sqrt(average.reduce((sum, value) => sum + (value - mean) ** 2, 0) / T);
  const m = average.map((value) => (value - mean) / sd);
  const z = normalRng(seed);
  const out: UselessFactorSimulation = { lambda: [], famaMacBethT: [], shankenT: [], r2: [] };
  for (let draw = 0; draw < samples; draw++) {
    const { lambda, famaMacBethSE, shankenSE, r2 } = twoPass(excess, m.map((value) => strength * value + z()));
    out.lambda.push(lambda);
    out.famaMacBethT.push(lambda / famaMacBethSE);
    out.shankenT.push(lambda / shankenSE);
    out.r2.push(r2);
  }
  return out;
}

/**
 * KZ Section C.1, pp. 518–519: with one factor and a zero-beta rate, identification needs (ι_N, β) of full
 * rank, that is B ≠ 0 in the N - 1 differenced returns of eq. (15), so not all betas equal. The rank test of
 * H0: B = 0 uses B̂ (N - 1 slopes on the factor), Q̂_FF the sample variance of the factor, and Σ̂ the residual
 * covariance, all with divisor T. The F form is exact under i.i.d. normal errors and fixed factors.
 */
export function rankTest(excess: readonly (readonly number[])[], factor: readonly number[]): RankTest {
  const R = lastDifferences(excess);
  const T = R.length;
  const df1 = R[0].length;
  const df2 = T - df1 - 1;
  if (df2 <= 0) throw new RangeError('rankTest needs T > N');
  const fit = timeSeriesRegressions(R, column(factor));
  const B = fit.beta.map(([b]) => b);
  const quadratic = fit.factorCovariance[0][0] * dot(B, solve(fit.residualCovariance, B));
  const statistic = df2 / df1 * quadratic;
  return {
    statistic, pValue: fSurvival(statistic, df1, df2), df1, df2,
    wald: T * quadratic, waldPValue: chiSquareSurvival(T * quadratic, df1),
  };
}

/**
 * KZ Section D, pp. 526–527: the GRS-FAR test of H0: λ = λ°, at hypothesised premia λ° (one per factor).
 * Returns are the N - 1 differences R_t of eq. (15): each of the first N - 1 assets minus the last.
 * Under H0, eq. (21) writes R_t = α(λ°) + B(f_t - f̄ + λ°) + u_t, and eq. (22) says α(λ°) = 0. So GRS-FAR is
 * the GRS test of zero intercepts in the regressions of R_t on a constant and f_t - f̄ + λ°.
 * Eq. (23) gives two equal forms, both with the unrestricted Σ̂ (divisor T) of the regression of R_t on f_t:
 * - farForm: α̂(λ°) = R̄ - B̃(λ°)λ° (eq. 24), with B̃(λ°) the least-squares slope of R_t on f_t - f̄ + λ°
 *   without a constant, and Q̂(λ°) = (1/T) Σ_t (f_t - f̄ + λ°)(f_t - f̄ + λ°)';
 * - hotellingForm: R̄ - B̂λ°, with B̂ the slope of R_t on a constant and f_t, and Q̂_FF = Σ̂_f.
 * They agree because Q̂(λ°) = Q̂_FF + λ°λ°' and, by Sherman–Morrison, α̂(λ°) = (R̄ - B̂λ°)/(1 + λ°'Q̂_FF⁻¹λ°)
 * and 1 - λ°'Q̂(λ°)⁻¹λ° = 1/(1 + λ°'Q̂_FF⁻¹λ°). The F scaling of eq. (25) is exact under i.i.d. normal errors
 * and fixed factors, whatever B is; the χ²_{N-1} limit of eq. (26) is chiSquareSurvival(hotellingForm, df1).
 * statistic and pValue use hotellingForm. farForm loses digits when λ°'Q̂_FF⁻¹λ° is large, because
 * 1 - λ°'Q̂(λ°)⁻¹λ° then cancels.
 */
export function grsFar(
  excess: readonly (readonly number[])[], factors: readonly (readonly number[])[], lambdaNull: readonly number[],
): GrsFar {
  const result = farTest(excess, factors)(lambdaNull);
  const R = lastDifferences(excess);
  const T = R.length;
  const factorMean = sampleMeans(factors);
  const x = factors.map((row) => row.map((f, k) => f - factorMean[k] + lambdaNull[k]));
  const Q = lambdaNull.map((_, j) => lambdaNull.map((__, k) => x.reduce((sum, row) => sum + row[j] * row[k], 0) / T));
  const restrictedAlpha = sampleMeans(R).map((meanR, i) => {
    const cross = lambdaNull.map((_, k) => R.reduce((sum, row, t) => sum + row[i] * x[t][k], 0) / T);
    return meanR - dot(solve(Q, cross), lambdaNull);
  });
  const fit = timeSeriesRegressions(R, factors);
  const farForm = T * dot(restrictedAlpha, solve(fit.residualCovariance, restrictedAlpha))
    / (1 - dot(lambdaNull, solve(Q, lambdaNull)));
  return { ...result, farForm };
}

/**
 * The 100(1 - q)% GRS-FAR confidence set for the premium on one factor (KZ eq. 27, p. 528): the grid values λ°
 * that grsFar does not reject at level q. The set may be bounded, unbounded (it reaches an end of the grid) or
 * empty, and an unbounded set signals a small B (KZ, p. 528). As λ° grows without bound the statistic tends
 * to the rank test (KZ fn. 13, p. 528), so a factor that fails the rank test gives an unbounded set.
 */
export function farConfidenceSet(
  excess: readonly (readonly number[])[], factor: readonly number[], { grid, q }: { grid: readonly number[]; q: number },
): FarConfidenceSet {
  const test = farTest(excess, column(factor));
  return acceptedSet(grid, q, (lambdaNull) => test([lambdaNull]).pValue);
}

/**
 * The usual 100(1 - q)% Wald sets λ̂ ± z·se for the premium on one factor, z = Φ⁻¹(1 - q/2), with λ̂ from the
 * two-pass regression with an intercept and the Fama–MacBeth or the Shanken standard error (see twoPass).
 * They rely on the normal approximation, which fails when B is close to zero (KZ, pp. 515–516).
 */
export function waldConfidenceSet(
  excess: readonly (readonly number[])[], factor: readonly number[], { q }: { q: number },
): WaldConfidenceSet {
  const { lambda, famaMacBethSE, shankenSE } = twoPass(excess, factor);
  const z = invCdf(1 - q / 2);
  const interval = (se: number): WaldInterval => ({ se, lower: lambda - z * se, upper: lambda + z * se });
  return { lambda, famaMacBeth: interval(famaMacBethSE), shanken: interval(shankenSE) };
}

/**
 * A seeded one-factor world with a known premium λ and zero-beta rate 0:
 * R^e_{i,t} = β_i(λ + f_t) + u_{i,t}, with u_{i,t} i.i.d. N(0, 1) (returns are in units of the residual
 * standard deviation) and β_i evenly spaced over [1 - betaSpread/2, 1 + betaSpread/2]. The factor is
 * f_t = z_t - z̄ with z_t i.i.d. N(0, 1): it is demeaned in each sample, so f̄ = 0 is its mean and
 * E[R^e_i] = β_i λ holds in sample. These are the fixed factors under which KZ's eq. (25) is exact. Then the
 * GRS-FAR statistic at the true λ does not depend on the betas at all: R̄ - B̂λ = ū - (B̂ - B)λ.
 * Each sample gets the 95% Wald sets and the 95% GRS-FAR set on the grid. A GRS-FAR set covers λ when the test
 * at λ itself does not reject, so coverage does not depend on how fine the grid is. With fixed factors the
 * Σ_f/T part of both Wald variances has nothing to measure, so with a wide beta spread the Wald sets cover
 * more than 95%; as the spread goes to 0 they cover far less.
 */
export function simulateWeakIdentification(
  seed: number,
  { T, N, betaSpread, lambda, samples, grid }: {
    T: number; N: number; betaSpread: number; lambda: number; samples: number; grid: readonly number[];
  },
): WeakIdentificationSimulation {
  if (!(N >= 2 && T > N && samples >= 1)) throw new RangeError('simulateWeakIdentification: needs N ≥ 2, T > N and samples ≥ 1');
  const beta = Array.from({ length: N }, (_, i) => 1 + betaSpread * (i / (N - 1) - 0.5));
  const z = normalRng(seed);
  const out: WeakIdentificationSimulation = { beta, wald: [], far: [], coverage: { famaMacBeth: 0, shanken: 0, far: 0 } };
  for (let s = 0; s < samples; s++) {
    const draws = Array.from({ length: T }, () => z());
    const mean = draws.reduce((sum, value) => sum + value, 0) / T;
    const factor = draws.map((value) => value - mean);
    const excess = factor.map((f) => beta.map((b) => b * (lambda + f) + z()));
    const wald = waldConfidenceSet(excess, factor, { q: LEVEL });
    const test = farTest(excess, column(factor));
    out.wald.push(wald);
    out.far.push(acceptedSet(grid, LEVEL, (lambdaNull) => test([lambdaNull]).pValue));
    if (wald.famaMacBeth.lower <= lambda && lambda <= wald.famaMacBeth.upper) out.coverage.famaMacBeth++;
    if (wald.shanken.lower <= lambda && lambda <= wald.shanken.upper) out.coverage.shanken++;
    if (test([lambda]).pValue >= LEVEL) out.coverage.far++;
  }
  out.coverage.famaMacBeth /= samples;
  out.coverage.shanken /= samples;
  out.coverage.far /= samples;
  return out;
}
