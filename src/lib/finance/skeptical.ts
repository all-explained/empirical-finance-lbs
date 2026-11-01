// A skeptical look at asset pricing tests (Chapter 28): artificial factors that fit the 25 size–B/M
// portfolios, the GLS cross-sectional R², the restriction that a traded factor's premium is its mean, and
// bootstrap intervals for the cross-sectional R².
// LNS: Lewellen, Nagel & Shanken (2010), "A skeptical appraisal of asset pricing tests", Journal of Financial
// Economics 96(2), 175–194; pages cite the printed page numbers of NBER working paper 12360 (July 2006).
// excess is T × N and factors is T × K (one row per period), decimal excess returns, as in timeSeriesTests.ts.
// Every two-pass regression here has an intercept, the zero-beta rate λ_0: E[R^e_i] = λ_0 + β_i'λ.
import { inverse } from '../math/linalg';
import { mulberry32, normalRng } from '../math/rng';
import { quantile } from '../stats/stambaugh';
import { crossSectionalRegression, famaMacBeth, type Weighting } from './crossSection';
import { maxSharpeSquared, sampleCovariance, sampleMeans } from './portfolio';
import { timeSeriesRegressions } from './timeSeriesTests';

export interface GlsR2 {
  /** R²_GLS = 1 - unexplained/total. */
  r2: number;
  /** λ̂_0 of the GLS regression, the zero-beta excess return. */
  zeroBeta: number;
  /** λ̂ of the GLS regression, one per factor. */
  lambda: number[];
  /** α̂'Σ̂⁻¹α̂ with the GLS pricing errors α̂: SR²_tan(λ̂_0) - SR²_f(λ̂_0), the squared Sharpe ratio left unexplained. */
  unexplained: number;
  /** (R̄^e - μ_gmv ι)'Σ̂⁻¹(R̄^e - μ_gmv ι), what a model that explains nothing leaves unexplained. */
  total: number;
}

export interface RandomFactorFit {
  /** One entry per draw: the OLS cross-sectional R², as in crossSectionalRegression. */
  ols: number[];
  /** One entry per draw: R²_GLS, as in glsR2. */
  gls: number[];
  median: { ols: number; gls: number };
  /** Share of draws whose R² is above threshold. */
  shareAbove: { ols: number; gls: number };
}

export interface TradedFactorRestriction {
  /** λ̂, one per factor, from the OLS regression with the factors among the test assets. */
  lambda: number[];
  /** f̄, the factor means: the premia the restriction λ = E[f] predicts. */
  factorMean: number[];
  /** λ̂ - f̄, one per factor, with Shanken-corrected standard errors and t-statistics. */
  gap: number[];
  gapSE: number[];
  gapT: number[];
  /** λ̂_0, the zero-beta excess return, which is zero when the factors price the risk-free asset. */
  zeroBeta: number;
  zeroBetaSE: number;
  zeroBetaT: number;
}

export interface R2ConfidenceInterval {
  /** R² on the original sample. */
  estimate: number;
  lower: number;
  upper: number;
  /** One R² per bootstrap sample. */
  draws: number[];
}

function dot(x: readonly number[], y: readonly number[]): number {
  return x.reduce((sum, value, i) => sum + value * y[i], 0);
}

function times(A: readonly (readonly number[])[], x: readonly number[]): number[] {
  return A.map((row) => dot(row, x));
}

// Standardised to sample mean 0 and standard deviation 1 (divisor T).
function standardise(values: readonly number[]): number[] {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const sd = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
  return values.map((value) => (value - mean) / sd);
}

// GLS fit of R̄^e on [1 β̂] with weight Σ̂⁻¹, Σ̂ the divisor-T return covariance. crossSectionalRegression
// accepts Σ̂ in place of Σ̂_ε (the two give the same b̂ in sample); its r2 is the unweighted one, so the
// weighted R² is computed here.
function glsFit(beta: readonly (readonly number[])[], meanExcess: readonly number[], covariance: readonly (readonly number[])[]): GlsR2 {
  const fit = crossSectionalRegression(beta, meanExcess, { intercept: true, weighting: 'gls', residualCovariance: covariance });
  const precision = inverse(covariance);
  const ones = meanExcess.map(() => 1);
  const gmvMean = dot(ones, times(precision, meanExcess)) / dot(ones, times(precision, ones));
  const centred = meanExcess.map((r) => r - gmvMean);
  const unexplained = dot(fit.alpha, times(precision, fit.alpha));
  const total = dot(centred, times(precision, centred));
  return { r2: 1 - unexplained / total, zeroBeta: fit.lambda0 as number, lambda: fit.lambda, unexplained, total };
}

function covarianceT(excess: readonly (readonly number[])[]): number[][] {
  const scale = (excess.length - 1) / excess.length;
  return sampleCovariance(excess).map((row) => row.map((value) => value * scale));
}

// The two-pass regression with an intercept: first-pass betas, then the OLS or GLS cross-sectional R².
function twoPassR2(excess: readonly (readonly number[])[], factors: readonly (readonly number[])[], weighting: Weighting): number {
  const { beta } = timeSeriesRegressions(excess, factors);
  const meanExcess = sampleMeans(excess);
  return weighting === 'ols'
    ? crossSectionalRegression(beta, meanExcess, { intercept: true, weighting: 'ols' }).r2
    : glsFit(beta, meanExcess, covarianceT(excess)).r2;
}

/**
 * The GLS cross-sectional R² of LNS (Prescription 3, pp. 18–19; Appendix A, Result 8, p. 33): first-pass betas
 * from timeSeriesRegressions, then the GLS regression of R̄^e on [1 β̂] weighted by Σ̂⁻¹, with Σ̂ the return
 * covariance (divisor T), and R²_GLS = 1 - α̂'Σ̂⁻¹α̂ / (R̄^e - μ_gmv ι)'Σ̂⁻¹(R̄^e - μ_gmv ι), where
 * μ_gmv = ι'Σ̂⁻¹R̄^e / ι'Σ̂⁻¹ι is the mean of the global minimum-variance portfolio (the GLS fit on a constant).
 *
 * Mean–variance reading (LNS Results 7–8, p. 33). Let SR²(λ_0) be a squared Sharpe ratio measured against the
 * zero-beta excess return λ_0, (mean - λ_0)²/variance, for a portfolio whose weights sum to one (LNS write θ²).
 * At the GLS λ̂_0, unexplained = SR²_tan(λ̂_0) - SR²_f(λ̂_0): the highest one among the test assets minus the
 * highest one among the factors' mimicking portfolios. total is the same gap for factors whose mimicking
 * portfolios all have mean μ_gmv: the squared slope of the asymptote of the minimum-variance frontier. So
 * R²_GLS = 1 when some mix of the mimicking portfolios lies on the frontier (for a traded factor that is a
 * test-asset portfolio, when the factor is a frontier portfolio) and 0 when they all sit at μ_gmv
 * (Kandel & Stambaugh, 1995). The OLS R² has no such link to the frontier (LNS, pp. 18–19).
 */
export function glsR2(excess: readonly (readonly number[])[], factors: readonly (readonly number[])[]): GlsR2 {
  return glsFit(timeSeriesRegressions(excess, factors).beta, sampleMeans(excess), covarianceT(excess));
}

/**
 * Seeded artificial factors that fit the 25 size–B/M portfolios. LNS (p. 2) note that almost any factor fits
 * these portfolios if it correlates with SMB or HML; their Figure 1 (pp. 8–10) draws random factors from the
 * 25 portfolios themselves, and their Figure 2 (pp. 11–13) adds noise worth 3/4 of a factor's variance. Here
 * each draw builds `factors` factors, each one
 *   f_t = √(1 - s)·g_t + √s·e_t,   g_t = std(a·SMB~_t + b·HML~_t),
 * where SMB~ and HML~ are SMB and HML standardised to sample mean 0 and standard deviation 1 (divisor T),
 * (a, b) is a seeded standard normal pair (so the direction is uniform on the circle), std(·) standardises
 * again, e_t is seeded standard normal noise and s = noiseShare is the share of the factor's variance
 * that is noise. s = 1 gives a useless factor, as in simulateUselessFactor (Chapter 27). Each draw runs
 * the two-pass regression with an intercept and keeps its OLS R² (crossSectionalRegression) and R²_GLS
 * (glsR2). threshold defaults to 1/2: LNS (p. 8) count the artificial models that explain more than half
 * of the cross-sectional variation. With noiseShare 0 every factor lies in the span of SMB and HML, so at
 * most two factors are allowed.
 */
export function randomFactorFit(
  seed: number,
  excess: readonly (readonly number[])[],
  smb: readonly number[],
  hml: readonly number[],
  { samples, factors, noiseShare, threshold = 0.5 }: { samples: number; factors: number; noiseShare: number; threshold?: number },
): RandomFactorFit {
  const T = excess.length;
  if (smb.length !== T || hml.length !== T) throw new RangeError('randomFactorFit: smb and hml need one value per period');
  if (!(Number.isSafeInteger(samples) && samples >= 1)) throw new RangeError('randomFactorFit: samples must be a positive integer');
  if (!(Number.isSafeInteger(factors) && factors >= 1)) throw new RangeError('randomFactorFit: factors must be a positive integer');
  if (!(noiseShare >= 0 && noiseShare <= 1)) throw new RangeError('randomFactorFit: noiseShare must lie in [0, 1]');
  if (noiseShare === 0 && factors > 2) throw new RangeError('randomFactorFit: without noise at most two factors are independent');
  const [s, h] = [standardise(smb), standardise(hml)];
  const z = normalRng(seed);
  const [signal, noise] = [Math.sqrt(1 - noiseShare), Math.sqrt(noiseShare)];
  const covariance = covarianceT(excess);
  const meanExcess = sampleMeans(excess);
  const out: RandomFactorFit = { ols: [], gls: [], median: { ols: 0, gls: 0 }, shareAbove: { ols: 0, gls: 0 } };
  for (let draw = 0; draw < samples; draw++) {
    const columns = Array.from({ length: factors }, () => {
      const [a, b] = [z(), z()];
      return standardise(s.map((value, t) => a * value + b * h[t])).map((g) => signal * g + noise * z());
    });
    const { beta } = timeSeriesRegressions(excess, excess.map((_, t) => columns.map((column) => column[t])));
    out.ols.push(crossSectionalRegression(beta, meanExcess, { intercept: true, weighting: 'ols' }).r2);
    out.gls.push(glsFit(beta, meanExcess, covariance).r2);
  }
  out.median = { ols: quantile(out.ols, 0.5), gls: quantile(out.gls, 0.5) };
  out.shareAbove = {
    ols: out.ols.filter((r2) => r2 > threshold).length / samples,
    gls: out.gls.filter((r2) => r2 > threshold).length / samples,
  };
  return out;
}

/**
 * LNS Prescriptions 2 and 4 (pp. 17, 21) for traded factors: the premium on a factor portfolio should be its
 * mean excess return, λ = E[f], and with excess returns the zero-beta rate should be zero. The factors join
 * the test assets (N + K assets, factors last), so the regression must price them too; their betas are the
 * unit vectors and their residuals zero. First-pass betas come from timeSeriesRegressions, λ̂ and λ̂_0 from
 * the OLS regression with an intercept, as famaMacBeth's mean (it equals crossSectionalRegression's b̂).
 * (With GLS, λ̂ = f̄ - λ̂_0 exactly: the factors get infinite weight, LNS p. 21.)
 *
 * Standard errors. Write b̂_t = A R^e_t for the month's OLS slopes, A = (X'X)⁻¹X', X = [1 β]. Under the
 * restriction, R^e_t = βλ + β(f_t - E f) + ε_t with λ = E f, so the slope part of b̂_t - [0; f_t] is A ε_t:
 * the factor shock cancels. With known betas, Var(λ̂ - f̄) and Var(λ̂_0) are the diagonal of AΣ_εA'/T,
 * which is what the Fama–MacBeth standard errors of λ̂_t - f_t and λ̂_{0t} measure (in sample they are equal,
 * because the first pass makes Σ̂ = β̂Σ̂_fβ̂' + Σ̂_ε and Aβ̂ stacks a zero row on I_K). Estimated betas add
 * the Shanken term (see shankenCorrection), which scales both variances by 1 + c, c = f̄'Σ̂_f⁻¹f̄,
 * the squared highest Sharpe ratio of the factors (λ = f̄ under the restriction).
 */
export function tradedFactorRestriction(
  excess: readonly (readonly number[])[], factors: readonly (readonly number[])[],
): TradedFactorRestriction {
  const assets = excess.map((row, t) => [...row, ...factors[t]]);
  const fit = timeSeriesRegressions(assets, factors);
  const fm = famaMacBeth(assets, fit.beta, { intercept: true });
  const intercept = fm.intercept as NonNullable<typeof fm.intercept>;
  const T = excess.length;
  const shanken = Math.sqrt(1 + maxSharpeSquared(fit.factorMean, fit.factorCovariance));
  const gap = fm.lambda.map((lambda, k) => lambda - fit.factorMean[k]);
  const gapSE = gap.map((mean, k) => {
    const squares = fm.monthly.reduce((sum, row, t) => sum + (row[k] - factors[t][k] - mean) ** 2, 0);
    return shanken * Math.sqrt(squares / T / T);
  });
  const zeroBetaSE = shanken * intercept.se;
  return {
    lambda: fm.lambda,
    factorMean: fit.factorMean,
    gap,
    gapSE,
    gapT: gap.map((value, k) => value / gapSE[k]),
    zeroBeta: intercept.mean,
    zeroBetaSE,
    zeroBetaT: intercept.mean / zeroBetaSE,
  };
}

/**
 * A seeded bootstrap interval for the cross-sectional R² of the two-pass regression with an intercept
 * (OLS, as in crossSectionalRegression, or GLS, as in glsR2). LNS (Prescription 5, pp. 21–22) bootstrap
 * months: each sample draws T months with replacement from the history, returns and factors together, and
 * reruns both passes (p. 13), so first-pass error in the betas is part of the spread. The interval is the
 * percentile one, the (1 - level)/2 and (1 + level)/2 quantiles of the draws (type 7, as quantile).
 * LNS go one step further (pp. 21–22 and fn. 8, p. 27): they simulate the sample R² for each candidate true
 * R², with expected returns rebuilt to have that R², and keep the true values whose 5th–95th percentile
 * band holds the sample R². That interval is for the true R²; the percentile interval here is centred on
 * the sample R², which LNS (p. 21) show is biased up, so read it as the sampling spread, not a range for the
 * true R².
 */
export function r2ConfidenceInterval(
  seed: number,
  excess: readonly (readonly number[])[],
  factors: readonly (readonly number[])[],
  { samples = 100, level = 0.95, weighting = 'ols' }: { samples?: number; level?: number; weighting?: Weighting } = {},
): R2ConfidenceInterval {
  if (!(Number.isSafeInteger(samples) && samples >= 1)) throw new RangeError('r2ConfidenceInterval: samples must be a positive integer');
  if (!(level > 0 && level < 1)) throw new RangeError('r2ConfidenceInterval: level must lie in (0, 1)');
  const T = excess.length;
  const uniform = mulberry32(seed);
  const draws = Array.from({ length: samples }, () => {
    const months = Array.from({ length: T }, () => Math.floor(uniform() * T));
    return twoPassR2(months.map((t) => excess[t]), months.map((t) => factors[t]), weighting);
  });
  return {
    estimate: twoPassR2(excess, factors, weighting),
    lower: quantile(draws, (1 - level) / 2),
    upper: quantile(draws, (1 + level) / 2),
    draws,
  };
}
