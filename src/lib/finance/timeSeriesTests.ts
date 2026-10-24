// Time-series tests of factor models: asset-by-asset regressions R^e_{i,t} = α_i + β_i' f_t + ε_{i,t}
// and the joint GRS test that every α_i is zero. A matrix has one row per period: excess is T × N,
// factors is T × K. Returns are decimals.
import { betweenDates, getColumn, type ColumnName, type Series } from '../data/series';
import { solve } from '../math/linalg';
import { fSurvival } from '../math/distributions';
import { ols } from '../stats/ols';
import { maxSharpeSquared, sampleCovariance, sampleMeans } from './portfolio';

export type FactorModel = 'capm' | 'ff3';

const MODEL_FACTORS = { capm: ['Mkt-RF'], ff3: ['Mkt-RF', 'SMB', 'HML'] } as const;

export interface FactorPanel {
  dates: string[];
  /** The 25 size–B/M portfolios, ME1-BM1 to ME5-BM5. */
  names: ColumnName<'ff25-size-bm-monthly'>[];
  /** T × 25 excess returns R^e_{i,t} = R_{i,t} - R^f_t. */
  excess: number[][];
  /** T × K factor returns, columns in factorNames order. */
  factors: number[][];
  factorNames: ('Mkt-RF' | 'SMB' | 'HML')[];
}

export interface TimeSeriesRegressions {
  /** α̂_i, one per asset. */
  alpha: number[];
  /** Classical OLS standard error of α̂_i, with s² = Σ_t ε̂²_{i,t}/(T - K - 1). */
  alphaSE: number[];
  alphaT: number[];
  /** N × K: row i is β̂_i'. */
  beta: number[][];
  /** T × N residuals ε̂_{i,t}. */
  residuals: number[][];
  /** N × N Σ̂_ε = (1/T) Σ_t ε̂_t ε̂_t', the maximum-likelihood divisor T. */
  residualCovariance: number[][];
  /** f̄, the K sample means of the factors. */
  factorMean: number[];
  /** K × K Σ̂_f = (1/T) Σ_t (f_t - f̄)(f_t - f̄)', the maximum-likelihood divisor T. */
  factorCovariance: number[][];
}

export interface GrsResult {
  statistic: number;
  pValue: number;
  /** N. */
  df1: number;
  /** T - N - K. */
  df2: number;
  /** Squared maximum Sharpe ratio of factors and test assets together, SR²_all. */
  sharpeAll2: number;
  /** Squared maximum Sharpe ratio of the factors alone, SR²_f = f̄'Σ̂_f⁻¹f̄. */
  sharpeFactors2: number;
}

export interface FrontierCurve {
  /** Upper branch: the highest mean at each standard deviation; NaN where none is reachable. */
  upper: number[];
  /** Lower branch: the lowest mean at each standard deviation; NaN where none is reachable. */
  lower: number[];
  /** Global minimum-variance portfolio; with one asset it is the whole frontier. */
  minVariance: { sd: number; mean: number };
  /** Slope √(μ'Σ⁻¹μ) of the tangent line from the origin, the maximum Sharpe ratio. */
  sharpe: number;
}

function requirePanel(excess: readonly (readonly number[])[], factors: readonly (readonly number[])[]): void {
  if (excess.length !== factors.length) throw new RangeError('Excess returns and factors need the same periods');
  if (excess.length === 0 || excess[0].length === 0 || factors[0].length === 0) {
    throw new RangeError('Excess returns and factors must be non-empty');
  }
  if (factors.some((row) => row.length !== factors[0].length)) throw new RangeError('Every period needs one value per factor');
}

function column(rows: readonly (readonly number[])[], j: number): number[] {
  return rows.map((row) => row[j]);
}

function dot(x: readonly number[], y: readonly number[]): number {
  return x.reduce((sum, value, i) => sum + value * y[i], 0);
}

// sampleCovariance divides by T - 1; GRS and the Sharpe-ratio identity use the divisor T.
function mlCovariance(rows: readonly (readonly number[])[]): number[][] {
  const scale = (rows.length - 1) / rows.length;
  return sampleCovariance(rows).map((row) => row.map((value) => value * scale));
}

/**
 * Decimal monthly excess returns of the 25 size–B/M portfolios and the factors of a model,
 * from start to end (inclusive; end defaults to the last month). French data are percent per month.
 */
export function factorPanel(
  ff3: Series<'ff3-monthly'>,
  ff25: Series<'ff25-size-bm-monthly'>,
  { start, end = '9999-12-31', model }: { start: string; end?: string; model: FactorModel },
): FactorPanel {
  const f = betweenDates(ff3, start, end);
  const p = betweenDates(ff25, start, end);
  const dates = f.rows.map(([date]) => date);
  if (dates.length === 0 || p.rows.length !== dates.length || p.rows.some(([date], t) => date !== dates[t])) {
    throw new RangeError('ff3 and ff25 dates do not line up');
  }
  const decimal = (cells: readonly (number | null)[]): number[] => cells.map((value) => {
    if (value === null) throw new RangeError('factorPanel: missing return');
    return value / 100;
  });
  const names = ff25.columns.slice(1).map((c) => c.name as ColumnName<'ff25-size-bm-monthly'>);
  const factorNames = [...MODEL_FACTORS[model]];
  const rf = decimal(getColumn(f, 'RF'));
  const portfolios = names.map((name) => decimal(getColumn(p, name)));
  const factorColumns = factorNames.map((name) => decimal(getColumn(f, name)));
  return {
    dates,
    names,
    excess: rf.map((r, t) => portfolios.map((returns) => returns[t] - r)),
    factors: rf.map((_, t) => factorColumns.map((values) => values[t])),
    factorNames,
  };
}

/**
 * OLS of each asset's excess return on a constant and the factors. Needs T > K + 1.
 * The alpha standard errors are the classical OLS ones (divisor T - K - 1);
 * Σ̂_ε and Σ̂_f use the maximum-likelihood divisor T, as GRS does.
 */
export function timeSeriesRegressions(
  excess: readonly (readonly number[])[], factors: readonly (readonly number[])[],
): TimeSeriesRegressions {
  requirePanel(excess, factors);
  const factorColumns = factors[0].map((_, k) => column(factors, k));
  const fits = excess[0].map((_, i) => ols(column(excess, i), factorColumns));
  const residuals = excess.map((_, t) => fits.map((fit) => fit.residuals[t]));
  return {
    alpha: fits.map((fit) => fit.coefficients[0]),
    alphaSE: fits.map((fit) => fit.standardErrors[0]),
    alphaT: fits.map((fit) => fit.tStats[0]),
    beta: fits.map((fit) => fit.coefficients.slice(1)),
    residuals,
    residualCovariance: mlCovariance(residuals),
    factorMean: sampleMeans(factors),
    factorCovariance: mlCovariance(factors),
  };
}

/**
 * Gibbons, Ross & Shanken (1989, Econometrica 57, p. 1146; p. 1124 for one factor):
 * GRS = (T-N-K)/N · (1 + f̄'Σ̂_f⁻¹f̄)⁻¹ α̂'Σ̂_ε⁻¹α̂ ~ F(N, T-N-K) under α = 0 with normal i.i.d. errors.
 * The paper writes it with the unbiased residual covariance and the factor (T/N)(T-N-K)/(T-K-1);
 * with the maximum-likelihood Σ̂_ε used here the factor is (T-N-K)/N. Needs T > N + K.
 * In sample, α̂'Σ̂_ε⁻¹α̂ = SR²_all - SR²_f, both from moments with the divisor T.
 */
export function grs(excess: readonly (readonly number[])[], factors: readonly (readonly number[])[]): GrsResult {
  requirePanel(excess, factors);
  const T = excess.length;
  const N = excess[0].length;
  const K = factors[0].length;
  if (T <= N + K) throw new RangeError('grs: needs more periods than assets plus factors');
  const fit = timeSeriesRegressions(excess, factors);
  const alphaQuadratic = dot(fit.alpha, solve(fit.residualCovariance, fit.alpha));
  const sharpeFactors2 = maxSharpeSquared(fit.factorMean, fit.factorCovariance);
  const all = factors.map((row, t) => [...row, ...excess[t]]);
  const sharpeAll2 = maxSharpeSquared(sampleMeans(all), mlCovariance(all));
  const statistic = (T - N - K) / N * alphaQuadratic / (1 + sharpeFactors2);
  return { statistic, pValue: fSurvival(statistic, N, T - N - K), df1: N, df2: T - N - K, sharpeAll2, sharpeFactors2 };
}

// Fully invested frontier: σ² = (A m² - 2B m + C)/D with A = 1'Σ⁻¹1, B = 1'Σ⁻¹μ, C = μ'Σ⁻¹μ,
// D = AC - B², so m = [B ± √(D(Aσ² - 1))]/A for σ ≥ 1/√A (the portfolio.ts frontier, inverted).
function curve(rows: readonly (readonly number[])[], sdGrid: readonly number[]): FrontierCurve {
  const mu = sampleMeans(rows);
  const Sigma = mlCovariance(rows);
  const C = maxSharpeSquared(mu, Sigma);
  const invOnes = solve(Sigma, mu.map(() => 1));
  const A = invOnes.reduce((sum, value) => sum + value, 0);
  const B = dot(invOnes, mu);
  const D = A * C - B * B;
  const minVariance = { sd: 1 / Math.sqrt(A), mean: B / A };
  // D = 0 with one asset (or equal means): only the minimum-variance point is reachable.
  const half = sdGrid.map((sd) => (D > 1e-12 * A * C && sd >= minVariance.sd ? Math.sqrt(D * (A * sd * sd - 1)) / A : NaN));
  return {
    upper: half.map((h) => minVariance.mean + h),
    lower: half.map((h) => minVariance.mean - h),
    minVariance,
    sharpe: Math.sqrt(C),
  };
}

/**
 * Mean–standard deviation frontiers of excess returns on a common grid of standard deviations:
 * the factors alone and the factors plus the test assets. Moments use the divisor T, so
 * all.sharpe² - factors.sharpe² is the α̂'Σ̂_ε⁻¹α̂ inside GRS.
 */
export function sharpeFrontiers(
  excess: readonly (readonly number[])[], factors: readonly (readonly number[])[], sdGrid: readonly number[],
): { sd: number[]; factors: FrontierCurve; all: FrontierCurve } {
  requirePanel(excess, factors);
  return {
    sd: [...sdGrid],
    factors: curve(factors, sdGrid),
    all: curve(factors.map((row, t) => [...row, ...excess[t]]), sdGrid),
  };
}
