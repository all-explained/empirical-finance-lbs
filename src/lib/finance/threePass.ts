// The three-pass estimator of Giglio & Xiu (2021, JPE 129) (Chapter 34): the risk premium of an observed
// factor χ_t when the model leaves out other priced factors. The returns follow a latent factor model,
// R^e_t = βλ + β(f_t - E f) + ε_t, and each observed factor loads on the latent factors with measurement
// error, χ_t = a + β_χ'f_t + ε_{χ,t} (eqs. 1–2, p. 1956). Its risk premium, the mean excess return
// of a portfolio with beta 1 on χ_t and 0 on everything else, is λ_χ = β_χ'λ. excess is T × N and observed
// has one column per observed factor, both in decimals.
//
// Every estimate on real data uses the whole sample: the principal components are chosen with the same
// returns they then price (Chapters 28 and 30 make this point).
import { matMul, solve, transpose } from '../math/linalg';
import { normalRng } from '../math/rng';
import { longRunCovariance } from '../stats/gmm';
import { ols } from '../stats/ols';
import { crossSectionalRegression, type CrossSectionalRegression } from './crossSection';
import { pcaFactors, rotateFactors } from './latentFactors';
import { sampleMeans } from './portfolio';
import { timeSeriesRegressions } from './timeSeriesTests';

export interface ThreePass {
  /** Step 1, T × K: row t is f̂_t', the first K principal components of pcaFactors (times H' with a rotation). */
  factors: number[][];
  /** Step 1, N × K: row i is β̂_i', the loadings of pcaFactors (times H⁻¹ with a rotation). */
  beta: number[][];
  /** Step 2: the OLS cross-sectional regression of R̄^e on β̂; its lambda are the latent premia λ̂. */
  latent: CrossSectionalRegression;
  /** Step 3, one row per observed factor: row j is β̂_χ', the time-series slopes of observed factor j on the f̂_t. */
  betaChi: number[][];
  /** Step 3: R² of each observed factor's regression on the f̂_t, the share of its variance they span. */
  r2: number[];
  /** λ̂_χ = β̂_χ'λ̂, one per observed factor. */
  lambda: number[];
  /** Standard error of each λ̂_χ from Theorem 1; only without a zero-beta rate (see threePass). */
  se?: number[];
}

export interface OmittedFactorSimulation {
  /** λ_χ = λ_1, the true premium of the observed proxy of the first factor. */
  truth: number;
  /** One estimate of λ_χ per sample, from twoPass with only χ_t. */
  twoPass: number[];
  /** One estimate of λ_χ per sample, from threePass with two principal components. */
  threePass: number[];
  /** Mean of estimate - truth over the samples. */
  bias: { twoPass: number; threePass: number };
  /** Root mean squared error over the samples. */
  rmse: { twoPass: number; threePass: number };
}

function dot(x: readonly number[], y: readonly number[]): number {
  return x.reduce((sum, value, i) => sum + value * y[i], 0);
}

function column(rows: readonly (readonly number[])[], j: number): number[] {
  return rows.map((row) => row[j]);
}

/**
 * The three passes of Giglio & Xiu (2021, p. 1959), with K principal components (the paper's p̂):
 * 1. PCA: f̂_t and β̂ from pcaFactors, whose normalisation (1/T) Σ_t f̂_t f̂_t' = I is the paper's eq. 7.
 * 2. Cross-section: OLS of R̄^e on β̂ gives the latent premia λ̂ = (β̂'β̂)⁻¹β̂'R̄^e.
 * 3. Time series: OLS of each observed factor on the f̂_t gives β̂_χ and the R².
 * Then λ̂_χ = β̂_χ'λ̂, the compact form of eq. 8. With zeroBeta, step 2 has an intercept, the zero-beta rate
 * λ̂_0 (eq. 9, p. 1960). A rotation H replaces (β̂, f̂_t) by (β̂H⁻¹, Hf̂_t) before steps 2 and 3: λ̂ becomes Hλ̂
 * and β̂_χ' becomes β̂_χ'H⁻¹, so λ̂_χ does not change (rotation invariance, pp. 1956–1957). The estimate stays
 * consistent when K is larger than the true number of factors (p. 1972).
 *
 * Standard error: Theorem 1 (p. 1964) gives √T(λ̂_χ - λ_χ) → N(0, Φ), and p. 1970 estimates Φ with
 * Newey–West blocks Π̂_11, Π̂_12, Π̂_22 of ε̂_{χ,t} f̂_t' and f̂_t, with q lags. Φ̂ is the long-run covariance of
 * ψ_t = ε̂_{χ,t} f̂_t'Σ̂_f⁻¹λ̂ + β̂_χ'f̂_t, with Σ̂_f = (1/T) Σ_t f̂_t f̂_t' (= I without a rotation): the first term
 * is the error from β̂_χ, the second from λ̂, and the paper's four blocks are the parts of that covariance.
 * The paper gives Φ only without a zero-beta rate (its online appendix I.2, not in the article, treats the
 * other case), so se is left out with zeroBeta.
 */
export function threePass(
  excess: readonly (readonly number[])[],
  observed: readonly (readonly number[])[],
  { factors: K, zeroBeta = false, rotation, lags = 0 }: {
    factors: number; zeroBeta?: boolean; rotation?: readonly (readonly number[])[]; lags?: number;
  },
): ThreePass {
  if (observed.length !== excess.length) throw new RangeError('threePass: excess and observed need the same periods');
  const pca = pcaFactors(excess, K);
  const { beta, factors } = rotation ? rotateFactors(pca.beta, pca.factors, rotation) : pca;
  const latent = crossSectionalRegression(beta, pca.mean, { intercept: zeroBeta, weighting: 'ols' });
  const regressors = factors[0].map((_, k) => column(factors, k));
  const fits = observed[0].map((_, j) => ols(column(observed, j), regressors));
  const betaChi = fits.map((fit) => fit.coefficients.slice(1));
  const result: ThreePass = {
    factors, beta, latent, betaChi, r2: fits.map((fit) => fit.r2), lambda: betaChi.map((b) => dot(b, latent.lambda)),
  };
  if (zeroBeta) return result;
  const T = excess.length;
  const weights = solve(matMul(transpose(factors), factors).map((row) => row.map((v) => v / T)), latent.lambda);
  const psi = factors.map((f, t) => fits.map((fit, j) => fit.residuals[t] * dot(f, weights) + dot(betaChi[j], f)));
  const Phi = longRunCovariance(psi, { lags });
  return { ...result, se: Phi.map((row, j) => Math.sqrt(row[j] / T)) };
}

/**
 * The usual two-pass estimate with only the observed factors: their time-series betas from
 * timeSeriesRegressions, then the OLS cross-sectional regression of R̄^e on them, with an intercept
 * (the zero-beta rate) under zeroBeta. When the observed factors leave out a priced factor, or measure
 * one with error, both passes are biased (Giglio & Xiu 2021, §II, pp. 1953–1956).
 */
export function twoPass(
  excess: readonly (readonly number[])[],
  observed: readonly (readonly number[])[],
  { zeroBeta = false }: { zeroBeta?: boolean } = {},
): CrossSectionalRegression {
  const { beta } = timeSeriesRegressions(excess, observed);
  return crossSectionalRegression(beta, sampleMeans(excess), { intercept: zeroBeta, weighting: 'ols' });
}

// The seeded economy's fixed parameters, per month: both factors have premium 0.5% and volatility 4%,
// and each asset has an idiosyncratic volatility of 3%.
const PREMIUM = 0.005;
const FACTOR_SD = 0.04;
const RESIDUAL_SD = 0.03;

/**
 * A seeded version of the two-factor economy of Giglio & Xiu (2021, §II, pp. 1953–1956). Two independent
 * factors f_{1,t}, f_{2,t} with premia λ_1 = λ_2 = 0.5% and volatility 4% per month, and
 * R^e_{i,t} = β_i'(λ + f_t) + ε_{i,t} with idiosyncratic volatility 3%. The loadings are drawn anew in each
 * sample: β_{i,1} = a_i and β_{i,2} = strength · (correlation · a_i + √(1 - correlation²) b_i), with a_i, b_i
 * standard normal, so the cross-sectional correlation of the two loadings is `correlation`. The observed
 * factor is a noisy proxy of the first, χ_t = f_{1,t} + noise · e_t with e_t standard normal, so λ_χ = λ_1.
 * twoPass on χ_t alone tends to (λ_1 + strength · correlation · λ_2)(1 + noise²/0.04²): the omitted factor
 * biases the cross-sectional step, and the noise attenuates the first-pass betas. threePass with two
 * principal components removes both biases as N and T grow.
 */
export function simulateOmittedFactor(
  seed: number,
  { N, T, strength, correlation, noise, samples = 20 }: {
    N: number; T: number; strength: number; correlation: number; noise: number; samples?: number;
  },
): OmittedFactorSimulation {
  if (!(N >= 3 && T > N && strength >= 0 && Math.abs(correlation) <= 1 && noise >= 0 && samples >= 1)) {
    throw new RangeError('simulateOmittedFactor needs N ≥ 3, T > N, strength ≥ 0, |correlation| ≤ 1, noise ≥ 0 and samples ≥ 1');
  }
  const z = normalRng(seed);
  const spread = Math.sqrt(1 - correlation ** 2);
  const out: OmittedFactorSimulation = {
    truth: PREMIUM, twoPass: [], threePass: [], bias: { twoPass: 0, threePass: 0 }, rmse: { twoPass: 0, threePass: 0 },
  };
  for (let s = 0; s < samples; s++) {
    const beta = Array.from({ length: N }, () => {
      const a = z();
      return [a, strength * (correlation * a + spread * z())];
    });
    const factors = Array.from({ length: T }, () => [FACTOR_SD * z(), FACTOR_SD * z()]);
    const excess = factors.map((f) => beta.map(([b1, b2]) => b1 * (PREMIUM + f[0]) + b2 * (PREMIUM + f[1]) + RESIDUAL_SD * z()));
    const observed = factors.map(([f1]) => [f1 + noise * z()]);
    out.twoPass.push(twoPass(excess, observed).lambda[0]);
    out.threePass.push(threePass(excess, observed, { factors: 2 }).lambda[0]);
  }
  const summary = (estimates: number[]) => ({
    bias: estimates.reduce((sum, v) => sum + v - PREMIUM, 0) / samples,
    rmse: Math.sqrt(estimates.reduce((sum, v) => sum + (v - PREMIUM) ** 2, 0) / samples),
  });
  const two = summary(out.twoPass);
  const three = summary(out.threePass);
  out.bias = { twoPass: two.bias, threePass: three.bias };
  out.rmse = { twoPass: two.rmse, threePass: three.rmse };
  return out;
}
