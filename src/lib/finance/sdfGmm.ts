// Linear SDF models estimated by GMM on excess returns, and the Hansen–Jagannathan distance.
// The SDF is M_{t+1} = 1 - b'f̃_{t+1} with f̃ = f - f̄, the factors demeaned in sample. Pricing excess
// returns, E[M R^e] = 0, gives one moment per asset, R^e_t(1 - f̃_t'b), with sample mean
// g_T(b) = E_T[R^e] - E_T[R^e f̃']b: linear in b. excess is T × N, factors T × K; returns are decimals.
// Nagel (2013, NBER WP 18554), printed p. 13, eq. (16): the linearised SDF normalised to mean 1; fn. 5
// there: under misspecification, tests depend on that normalisation. Printed p. 21: GMM of the linearised
// SDF on excess returns, where identity weighting can ignore a moment that efficient weighting enforces.
// Gospodinov, Kan & Robotti (2019, JFE 132, 451–471), manuscript p. 8, eq. (1): the SDF linear in the
// factors; p. 23: the HJ distance is a non-invariant estimator, so it moves with the normalisation.
import { chiSquareSurvival } from '../math/distributions';
import { identity, inverse, matMul, transpose, type Matrix } from '../math/linalg';
import { gmmObjective, linearGmm, longRunCovariance } from '../stats/gmm';
import type { QuarterlyPanel } from './conditional';
import { sampleCovariance, sampleMeans } from './portfolio';

export type SdfWeighting = 'identity' | 'hj' | 'efficient';

export interface LinearSdfGmm {
  /** b̂, one SDF loading per factor. */
  b: number[];
  bSE: number[];
  /** λ̂ = Σ̂_f b̂, the premia of the beta form E[R^e] = βλ; Σ̂_f has the divisor T. */
  lambda: number[];
  lambdaSE: number[];
  /** g_T(b̂) = actual - fitted, one per asset. */
  pricingErrors: number[];
  /** E_T[R^e]. */
  actual: number[];
  /** E_T[R^e f̃']b̂. */
  fitted: number[];
  /** T g_T'Ŝ⁻¹g_T for 'efficient' with N > K; null otherwise. */
  J: number | null;
  /** N - K. */
  df: number;
  /** P(χ²_df > J); null when J is. */
  pValue: number | null;
}

export interface HjDistance {
  /** δ_HJ = √(min_b g_T(b)'E_T[R^e R^e']⁻¹g_T(b)). */
  distance: number;
  /** The minimising b; empty with no factors. */
  b: number[];
  /** g_T at that b; E_T[R^e] with no factors. */
  pricingErrors: number[];
}

export type SdfModel = 'capm' | 'ccapm' | 'ff3';

export interface SdfModelFit {
  factorNames: string[];
  firstStage: LinearSdfGmm;
  hj: LinearSdfGmm;
  hjDistance: number;
  /** Second-stage (efficient) J, its degrees of freedom N - K and p-value. */
  J: number;
  df: number;
  pValue: number;
  /** The 25 pricing errors at the b that defines δ_HJ. */
  pricingErrors: number[];
}

function requireSample(excess: readonly (readonly number[])[], factors: readonly (readonly number[])[]): void {
  if (excess.length === 0 || excess.length !== factors.length) throw new RangeError('sdfGmm: excess and factors need the same, non-zero number of periods');
  if (excess.some((row) => row.length !== excess[0].length) || factors.some((row) => row.length !== factors[0].length)) {
    throw new RangeError('sdfGmm: every period needs one value per asset and per factor');
  }
}

/** E_T[x y'] = (1/T) Σ_t x_t y_t'. */
function crossMoment(x: readonly (readonly number[])[], y: readonly (readonly number[])[]): Matrix {
  return matMul(transpose(x), y).map((row) => row.map((value) => value / x.length));
}

function demean(rows: readonly (readonly number[])[]): number[][] {
  const mean = sampleMeans(rows);
  return rows.map((row) => row.map((value, k) => value - mean[k]));
}

/**
 * GMM estimate of b in M_{t+1} = 1 - b'f̃_{t+1}, solved in closed form by linearGmm.
 * 'identity' is first-stage GMM: b̂ = (D'D)⁻¹D'E_T[R^e] with D = E_T[R^e f̃'] = Cov_T(R^e, f) = β̂Σ̂_f,
 * so λ̂ = Σ̂_f b̂ = (β̂'β̂)⁻¹β̂'E_T[R^e]: an OLS cross-sectional regression of mean excess returns on
 * full-sample betas, with no intercept. 'hj' weights by E_T[R^e R^e']⁻¹. 'efficient' is two-step GMM with
 * W = Ŝ⁻¹, Ŝ the Newey–West long-run covariance (lags, demeaned moments) at the first-stage b̂.
 * Standard errors come from the GMM sandwich (for 'efficient', (1/T)(D'Ŝ⁻¹D)⁻¹) and treat the factor
 * means f̄ and Σ̂_f as known: they ignore the sampling error of the demeaning and of λ̂ = Σ̂_f b̂.
 */
export function linearSdfGmm(
  excess: readonly (readonly number[])[],
  factors: readonly (readonly number[])[],
  { weighting, lags = 0 }: { weighting: SdfWeighting; lags?: number },
): LinearSdfGmm {
  requireSample(excess, factors);
  const K = factors[0].length;
  if (K === 0) throw new RangeError('linearSdfGmm: needs at least one factor');
  const T = factors.length;
  const N = excess[0].length;
  const tilde = demean(factors);
  const actual = sampleMeans(excess);
  // The exact D = E_T[R^e f̃'] (g_T = actual - Db). gmm's central-difference Jacobian is off by about 4e-10 in λ̂.
  const D = crossMoment(excess, tilde);
  const longRun = (b: readonly number[]) => longRunCovariance(excess.map((row, t) => {
    const m = 1 - tilde[t].reduce((sum, value, k) => sum + value * b[k], 0);
    return row.map((r) => r * m);
  }), { lags });
  const Dt = transpose(D);
  const scale = (A: Matrix) => A.map((row) => row.map((value) => value / T));

  let W = weighting === 'hj' ? inverse(crossMoment(excess, excess)) : identity(N);
  let b = linearGmm(actual, D, W);
  let covariance: Matrix;
  if (weighting === 'efficient') {
    W = inverse(longRun(b));
    b = linearGmm(actual, D, W);
    covariance = scale(inverse(matMul(matMul(Dt, W), D)));
  } else {
    // (1/T)(D'WD)⁻¹D'WŜWD(D'WD)⁻¹ with Ŝ at b̂.
    const bread = inverse(matMul(matMul(Dt, W), D));
    const WD = matMul(W, D);
    covariance = scale(matMul(matMul(bread, matMul(matMul(transpose(WD), longRun(b)), WD)), bread));
  }
  const fitted = D.map((row) => row.reduce((sum, value, k) => sum + value * b[k], 0));
  const pricingErrors = actual.map((value, i) => value - fitted[i]);
  const df = N - K;
  const J = weighting === 'efficient' && df > 0 ? T * gmmObjective(pricingErrors, W) : null;
  const SigmaF = sampleCovariance(factors).map((row) => row.map((value) => (value * (T - 1)) / T));
  const lambdaCovariance = matMul(matMul(SigmaF, covariance), SigmaF);
  return {
    b,
    bSE: covariance.map((row, k) => Math.sqrt(row[k])),
    lambda: SigmaF.map((row) => row.reduce((sum, value, k) => sum + value * b[k], 0)),
    lambdaSE: lambdaCovariance.map((row, k) => Math.sqrt(row[k])),
    pricingErrors,
    actual,
    fitted,
    J,
    df,
    pValue: J === null ? null : chiSquareSurvival(J, df),
  };
}

/**
 * Hansen–Jagannathan distance of M = 1 - b'f̃: the pricing errors g_T(b), weighted by the inverse second
 * moment of the test assets, at the b that minimises them. With W = E_T[R^e R^e']⁻¹ fixed, the minimiser
 * is linear GMM. factors may have zero columns: then M = 1 and g_T = E_T[R^e]. With μ = E_T[R^e] and
 * E_T[R^e R^e'] = Σ + μμ' (Σ with the divisor T), Sherman–Morrison gives δ_HJ² = SR²/(1 + SR²) with
 * SR² = μ'Σ⁻¹μ, the squared maximum Sharpe ratio of the test assets.
 */
export function hjDistance(excess: readonly (readonly number[])[], factors: readonly (readonly number[])[]): HjDistance {
  requireSample(excess, factors);
  const W = inverse(crossMoment(excess, excess));
  const mean = sampleMeans(excess);
  let b: number[] = [];
  let pricingErrors = mean;
  if (factors[0].length > 0) {
    const D = crossMoment(excess, demean(factors));
    b = linearGmm(mean, D, W);
    pricingErrors = mean.map((value, i) => value - D[i].reduce((sum, d, k) => sum + d * b[k], 0));
  }
  return { distance: Math.sqrt(gmmObjective(pricingErrors, W)), b, pricingErrors };
}

function modelFactors(panel: QuarterlyPanel, model: SdfModel): { names: string[]; factors: number[][] } {
  switch (model) {
    case 'capm': return { names: ['Mkt-RF'], factors: panel.factors.map(([market]) => [market]) };
    case 'ccapm': return { names: ['Δc'], factors: panel.dc.map((dc) => [dc]) };
    case 'ff3': return { names: [...panel.factorNames], factors: panel.factors.map((row) => [...row]) };
  }
}

/**
 * SDF fits of the CAPM (Mkt-RF), the CCAPM (Δc) and FF3 on the quarterly 25 size–B/M portfolios of
 * quarterlyPanel: first-stage and HJ-weighted GMM, δ_HJ, and the second-stage J with no Newey–West lags.
 * δ_HJ ranks the models on one scale, since every model is judged with the same W = E_T[R^e R^e']⁻¹.
 */
export function sdfModelFits<M extends SdfModel>(panel: QuarterlyPanel, models: readonly M[]): Record<M, SdfModelFit> {
  return Object.fromEntries(models.map((model) => {
    const { names, factors } = modelFactors(panel, model);
    const efficient = linearSdfGmm(panel.excess, factors, { weighting: 'efficient' });
    const hj = hjDistance(panel.excess, factors);
    return [model, {
      factorNames: names,
      firstStage: linearSdfGmm(panel.excess, factors, { weighting: 'identity' }),
      hj: linearSdfGmm(panel.excess, factors, { weighting: 'hj' }),
      hjDistance: hj.distance,
      J: efficient.J as number,
      df: efficient.df,
      pValue: efficient.pValue as number,
      pricingErrors: hj.pricingErrors,
    }];
  })) as Record<M, SdfModelFit>;
}
