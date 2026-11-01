// Latent factors (Chapters 31 and 34): principal components of excess returns as factors in
// R^e_t - R̄^e = β f_t + ε_t, their rotations, canonical correlations between two sets of factors,
// and the risk premia of latent factors. excess is T × N, factors T × K, beta N × K (row i is β_i').
// Returns are decimals.
//
// Every estimate here uses the whole sample: the components are chosen with the same returns they
// then price, so an in-sample fit flatters them (Chapters 28 and 30 make this point).
import { inverse, matMul, symmetricEigen, transpose } from '../math/linalg';
import { pca, scores } from '../stats/pca';
import { crossSectionalRegression, type CrossSectionalRegression } from './crossSection';
import { sampleCovariance } from './portfolio';

export interface PcaFactors {
  /** R̄^e, the sample mean of each asset's excess return. */
  mean: number[];
  /** T × K: row t is f_t'. The factors have mean zero and (1/T) Σ_t f_t f_t' = I_K. */
  factors: number[][];
  /** N × K: row i is β_i'. Column k is √(ℓ_k (T - 1)/T) q_k. */
  beta: number[][];
  /** Share of total variance each factor explains, ℓ_k / Σ_j ℓ_j. */
  share: number[];
  /** T × N: ε_t = R^e_t - R̄^e - β f_t. With K = N they are zero. */
  residuals: number[][];
}

export interface CanonicalCorrelations {
  /** cc_1 ≥ … ≥ cc_m ≥ 0, with m = min(K_X, K_Y). */
  correlations: number[];
  /** m × K_X: row k is w^X_k. The variate X w^X_k has unit sample variance. */
  xWeights: number[][];
  /** m × K_Y: row k is w^Y_k, with corr(X w^X_k, Y w^Y_k) = cc_k and unit sample variance. */
  yWeights: number[][];
}

export interface LatentRiskPremia {
  /** R̄^e = λ_0 + β λ + α. */
  withIntercept: CrossSectionalRegression;
  /** R̄^e = β λ + α, as the APT has it with the risk-free rate as the zero-beta rate. */
  withoutIntercept: CrossSectionalRegression;
}

function dot(x: readonly number[], y: readonly number[]): number {
  return x.reduce((sum, value, i) => sum + value * y[i], 0);
}

function times(A: readonly (readonly number[])[], x: readonly number[]): number[] {
  return A.map((row) => dot(row, x));
}

/**
 * The first K principal components of the demeaned excess returns as factors, with
 * R^e_t - R̄^e = β f_t + ε_t. With q_k and ℓ_k the eigenvectors and eigenvalues of `pca`, and
 * s_{k,t} = q_k'(R^e_t - R̄^e) the scores, the normalisation is unit factor variances:
 * f_{k,t} = s_{k,t}/c_k and β_{·k} = c_k q_k with c_k = √(ℓ_k (T - 1)/T), so (1/T) Σ_t f_t f_t' = I_K.
 * This is the normalisation of Giglio & Xiu (2021, JPE 129, eq. 7, p. 1959): their factors are √T
 * times unit eigenvectors of the T × T matrix of demeaned returns, which are the scores scaled to
 * (1/T) Σ_t f_t² = 1, and their loadings β̂ = (1/T) Σ_t (R^e_t - R̄^e) f_t' are these β. The same β are the
 * OLS slopes of each asset on the factors, because the factors are demeaned and orthonormal in sample.
 * The factors are fixed only up to a rotation (see rotateFactors). Needs 1 ≤ K ≤ N with ℓ_K > 0.
 */
export function pcaFactors(excess: readonly (readonly number[])[], K: number): PcaFactors {
  const fit = pca(excess);
  const s = scores(excess, fit, K);
  if (K < 1 || !(fit.values[K - 1] > 0)) throw new RangeError('pcaFactors needs K ≥ 1 components with positive variance');
  const T = excess.length;
  const c = fit.values.slice(0, K).map((l) => Math.sqrt((l * (T - 1)) / T));
  const factors = s.map((row) => row.map((v, k) => v / c[k]));
  const beta = fit.mean.map((_, i) => c.map((ck, k) => ck * fit.loadings[k][i]));
  const residuals = excess.map((row, t) => row.map((v, i) => v - fit.mean[i] - dot(beta[i], factors[t])));
  return { mean: fit.mean, factors, beta, share: fit.share.slice(0, K), residuals };
}

/**
 * Rotate latent factors: (β, f_t) → (β H⁻¹, H f_t) for an invertible K × K matrix H. The fitted
 * values β H⁻¹ H f_t = β f_t do not change, so the data cannot tell the two sets apart. Giglio & Xiu
 * (2021, pp. 1956–1957) use this to show that PCA recovers the factors only up to such an H.
 */
export function rotateFactors(
  beta: readonly (readonly number[])[], factors: readonly (readonly number[])[], H: readonly (readonly number[])[],
): { beta: number[][]; factors: number[][] } {
  return { beta: matMul(beta, inverse(H)), factors: matMul(factors, transpose(H)) };
}

// S^{-1/2} = Q L^{-1/2} Q' for a symmetric positive definite S = QLQ'.
function inverseRoot(S: readonly (readonly number[])[]): number[][] {
  const { values, vectors } = symmetricEigen(S);
  if (!(values[values.length - 1] > 0)) throw new RangeError('The columns of a block are collinear');
  return S.map((_, i) => S.map((_, j) => vectors.reduce((sum, q, k) => sum + (q[i] * q[j]) / Math.sqrt(values[k]), 0)));
}

/**
 * Canonical correlations of two blocks of series, X (T × K_X) and Y (T × K_Y): cc_1 is the highest
 * correlation of any combination X w^X with any combination Y w^Y, and each later cc_k is the highest
 * one among combinations uncorrelated with the earlier ones. The cc_k² are the eigenvalues of
 * Σ_XX⁻¹ Σ_XY Σ_YY⁻¹ Σ_YX, found here with symmetricEigen on the symmetric form BB', with
 * B = Σ_XX^{-1/2} Σ_XY Σ_YY^{-1/2}. Its eigenvectors e_k give w^X_k = Σ_XX^{-1/2} e_k and
 * w^Y_k = Σ_YY⁻¹ Σ_YX w^X_k / cc_k (undefined when cc_k = 0). Replacing X by X G' for any invertible G
 * (a rotation of the block) leaves the cc_k unchanged, so they compare two factor sets that are known
 * only up to a rotation. Needs columns that are not collinear within either block.
 */
export function canonicalCorrelations(
  X: readonly (readonly number[])[], Y: readonly (readonly number[])[],
): CanonicalCorrelations {
  if (X.length !== Y.length) throw new RangeError('Both blocks need the same periods');
  const kx = X[0].length;
  const S = sampleCovariance(X.map((row, t) => [...row, ...Y[t]]));
  const Sxx = S.slice(0, kx).map((row) => row.slice(0, kx));
  const Sxy = S.slice(0, kx).map((row) => row.slice(kx));
  const Syy = S.slice(kx).map((row) => row.slice(kx));
  const xRoot = inverseRoot(Sxx);
  const yRoot = inverseRoot(Syy);
  // BB' is symmetric to the last bit, however badly scaled the blocks are.
  const B = matMul(matMul(xRoot, Sxy), yRoot);
  const eig = symmetricEigen(matMul(B, transpose(B)));
  const m = Math.min(kx, Syy.length);
  const correlations = eig.values.slice(0, m).map((v) => Math.sqrt(Math.max(v, 0)));
  const xWeights = eig.vectors.slice(0, m).map((e) => times(xRoot, e));
  const projection = matMul(matMul(yRoot, yRoot), transpose(Sxy));
  const yWeights = xWeights.map((w, k) => times(projection, w).map((v) => v / correlations[k]));
  return { correlations, xWeights, yWeights };
}

/**
 * Risk premia of the first K principal components: the OLS cross-sectional regression of mean excess
 * returns on the loadings of pcaFactors, with and without an intercept. These loadings are the
 * first-pass time-series betas on the factors, so this is the two-pass estimate. The OLS R² is the
 * cross-sectional R² of Chapter 28. The APT says that if a few factors drive most of the comovement,
 * mean returns must line up with the loadings on them, or a near-arbitrage opens; a good fit on the
 * 25 size–B/M portfolios is therefore what their factor structure implies, not a test of any economic
 * story (Nagel 2013, NBER WP 18554, pp. 14–15 and §3.4, pp. 18–20).
 */
export function latentRiskPremia(excess: readonly (readonly number[])[], K: number): LatentRiskPremia {
  const { mean, beta } = pcaFactors(excess, K);
  return {
    withIntercept: crossSectionalRegression(beta, mean, { intercept: true, weighting: 'ols' }),
    withoutIntercept: crossSectionalRegression(beta, mean, { intercept: false, weighting: 'ols' }),
  };
}
