// Shrinkage estimates of an SDF on many assets at once, after Kozak, Nagel & Santosh (2020, JFE 135,
// 271–292; pages below are the journal's). The assets are zero-cost portfolios, so they are their own
// factors: returns is T × N decimal excess returns, M_t = 1 - b'(R^e_t - E[R^e]), and pricing the assets
// gives b = Σ⁻¹μ, estimated naively by b̂ = Σ̂⁻¹μ̄ (p. 276, eqs. 13–17). The paper's Σ̂ has the divisor T
// (eq. 14); here it is sampleCovariance, with T - 1. The paper uses daily returns; these are monthly.
//
// Penalties: penalty and l2 are the L2 penalty ν₂, l1 is the L1 penalty ν₁, priorScale is SR_prior, the
// root expected maximum squared Sharpe ratio under the prior (docs/STYLE_GUIDE.md §3, Part VII).
import { betweenDates, getColumn, type ColumnName, type Series } from '../data/series';
import { solve } from '../math/linalg';
import { pca } from '../stats/pca';
import { modelPanel } from './factors';
import { betas, sampleCovariance, sampleMeans } from './portfolio';
import { arithmeticMean, sampleVariance } from './returns';

type Rows = readonly (readonly number[])[];
export type AssetSet = 'ff' | 'osap';
export type AssetSpace = 'assets' | 'pcs';

export interface AssetPanel {
  dates: string[];
  names: string[];
  /** T × N decimal monthly excess returns after the paper's preprocessing. */
  returns: number[][];
}

/**
 * Sample windows. 'ff' starts when FF5 does and ends with the committed data. 'osap' keeps the 108
 * signals of osap-ls-monthly with no missing month from 1963-07 to its last month, 2024-12 (738 months).
 */
export const assetWindows = {
  ff: { start: '1963-07-01', end: '9999-12-31' },
  osap: { start: '1963-07-01', end: '2024-12-01' },
} as const;

export interface AssetSeries {
  ff3: Series<'ff3-monthly'>;
  ff5?: Series<'ff5-monthly'>;
  mom?: Series<'mom-monthly'>;
  ff25?: Series<'ff25-size-bm-monthly'>;
  osap?: Series<'osap-ls-monthly'>;
}

const dot = (x: readonly number[], y: readonly number[]) => x.reduce((sum, value, i) => sum + value * y[i], 0);
const columns = (rows: Rows) => rows[0].map((_, j) => rows.map((row) => row[j]));
const fromColumns = (cols: readonly (readonly number[])[]) => cols[0].map((_, t) => cols.map((col) => col[t]));
const percent = (cells: readonly (number | null)[], what: string) => cells.map((value) => {
  if (value === null) throw new RangeError(`assetPanel: missing ${what} return`);
  return value / 100;
});

// F_i = F̃_i - β_i R_m with full-sample betas (p. 280, fn. 9, for the FF25; p. 282–283 for the anomalies).
function removeMarket(cols: readonly (readonly number[])[], market: readonly number[]): number[][] {
  const slopes = betas(fromColumns(cols), market);
  return cols.map((col, i) => col.map((value, t) => value - slopes[i] * market[t]));
}

/**
 * The base assets of Chapter 30, market removed. 'ff': the 25 size–B/M portfolios (less RF) with SMB, HML,
 * RMW, CMA (ff5-monthly) and Mom as traded assets, 30 in all; Mkt-RF of ff5-monthly is the market, and each
 * asset is rescaled to the market's standard deviation, as the paper does for the FF25 (p. 280). 'osap': the
 * long–short predictors of assetWindows.osap against Mkt-RF of ff3-monthly; the paper does not rescale its
 * anomaly portfolios (p. 282–283). The betas, and so the rescaling, use the whole window: a split-sample test
 * on these returns sees the future through them (the paper re-estimates betas before 2005, p. 290, fn. 22).
 */
export function assetPanel(set: AssetSet, { ff3, ff5, mom, ff25, osap }: AssetSeries): AssetPanel {
  const { start, end } = assetWindows[set];
  if (set === 'ff') {
    if (!ff5 || !mom || !ff25) throw new RangeError("assetPanel: 'ff' needs ff5-monthly, mom-monthly and ff25-size-bm-monthly");
    const five = modelPanel({ ff3, ff5 }, ff25, { start, end, model: 'ff5' });
    const carhart = modelPanel({ ff3, mom }, ff25, { start, end, model: 'carhart' });
    const market = five.factors.map((row) => row[0]);
    const raw = [...columns(five.excess), ...columns(five.factors).slice(1), carhart.factors.map((row) => row[3])];
    const sd = Math.sqrt(sampleVariance(market));
    const rescaled = removeMarket(raw, market).map((col) => col.map((value) => value * sd / Math.sqrt(sampleVariance(col))));
    return { dates: five.dates, names: [...five.names, ...five.factorNames.slice(1), 'Mom'], returns: fromColumns(rescaled) };
  }
  if (!osap) throw new RangeError("assetPanel: 'osap' needs osap-ls-monthly");
  const signals = betweenDates(osap, start, end);
  const marketRows = betweenDates(ff3, start, end).rows;
  const dates = signals.rows.map(([date]) => date);
  if (marketRows.length !== dates.length || marketRows.some(([date], t) => date !== dates[t])) {
    throw new RangeError('assetPanel: ff3-monthly dates do not line up with osap-ls-monthly');
  }
  const names = signals.columns.slice(1).map(({ name }) => name as ColumnName<'osap-ls-monthly'>)
    .filter((name) => getColumn(signals, name).every((value) => value !== null));
  const market = percent(getColumn(betweenDates(ff3, start, end), 'Mkt-RF'), 'market');
  const raw = names.map((name) => percent(getColumn(signals, name), name));
  return { dates, names, returns: fromColumns(removeMarket(raw, market)) };
}

function requirePenalty(value: number, name: string): void {
  if (!(Number.isFinite(value) && value >= 0)) throw new RangeError(`shrinkage: ${name} must be finite and non-negative`);
}

const plusDiagonal = (Sigma: Rows, value: number) => Sigma.map((row, i) => row.map((s, j) => s + (i === j ? value : 0)));
const trace = (Sigma: Rows) => Sigma.reduce((sum, row, i) => sum + row[i], 0);

/**
 * b̂ = (Σ + ν₂I)⁻¹μ̄, the posterior mean of b under the prior μ ~ N(0, (SR²_prior/tr Σ) Σ²) (p. 276, eq. 18,
 * with the power 2 on Σ chosen on p. 277; eq. 22). It also minimises the HJ distance plus ν₂b'b (p. 278, eq. 27).
 * Penalty 0 is the naive Σ⁻¹μ̄.
 */
export function ridgeSdf(mu: readonly number[], Sigma: Rows, penalty: number): number[] {
  requirePenalty(penalty, 'penalty');
  return solve(plusDiagonal(Sigma, penalty), mu);
}

/**
 * The L2 penalty of a prior scale: ν₂ = tr Σ / (SR²_prior T) (p. 277, below eq. 22), where SR²_prior = E[μ'Σ⁻¹μ] is the
 * expected maximum squared Sharpe ratio under the prior (p. 279, eq. 29), per month here.
 */
export function ridgePenalty(priorScale: number, Sigma: Rows, months: number): number {
  if (!(priorScale > 0) || !(months > 0)) throw new RangeError('ridgePenalty: priorScale and months must be positive');
  return trace(Sigma) / (priorScale ** 2 * months);
}

export interface ElasticNetSdf {
  b: number[];
  /** Number of b̂_i that are not exactly zero. */
  nonZero: number;
  /** False if maxSweeps ran out before the tolerance was met. */
  converged: boolean;
}

/**
 * argmin_b (μ̄ - Σb)'Σ⁻¹(μ̄ - Σb) + ν₂b'b + ν₁Σ_i|b_i| (p. 279, eq. 28). The objective equals
 * b'(Σ + ν₂I)b - 2μ̄'b + ν₁‖b‖₁ plus a constant, so each coordinate step is a soft threshold at ν₁/2.
 * Cyclic coordinate descent from b = 0 (the paper uses LARS-EN, p. 279, fn. 7) stops when no coordinate
 * moves by more than tolerance × max|b_i|. With ν₁ = 0 it is ridgeSdf with penalty ν₂.
 */
export function elasticNetSdf(
  mu: readonly number[], Sigma: Rows,
  { l1, l2, tolerance = 1e-12, maxSweeps = 10000 }: { l1: number; l2: number; tolerance?: number; maxSweeps?: number },
): ElasticNetSdf {
  requirePenalty(l1, 'l1');
  requirePenalty(l2, 'l2');
  if (mu.length !== Sigma.length) throw new RangeError('elasticNetSdf: Σ must be N × N for N means');
  const A = plusDiagonal(Sigma, l2);
  if (!A.every((row, i) => row[i] > 0)) throw new RangeError('elasticNetSdf: Σ + ν₂I needs a positive diagonal');
  const b = mu.map(() => 0);
  let converged = false;
  for (let sweep = 0; sweep < maxSweeps && !converged; sweep++) {
    let change = 0;
    for (let i = 0; i < b.length; i++) {
      const r = mu[i] - dot(A[i], b) + A[i][i] * b[i];
      const excess = Math.abs(r) - l1 / 2;
      const next = excess > 0 ? Math.sign(r) * excess / A[i][i] : 0;
      change = Math.max(change, Math.abs(next - b[i]));
      b[i] = next;
    }
    converged = change <= tolerance * Math.max(...b.map(Math.abs));
  }
  return { b, nonZero: b.filter((value) => value !== 0).length, converged };
}

export interface PrincipalComponentAssets {
  /** T × N: q_j'R^e_t in column j, the returns of the PC portfolios, not demeaned. */
  returns: number[][];
  /** loadings[j] is q_j, the weights of PC portfolio j. */
  loadings: number[][];
  /** ℓ_j, the variance of PC portfolio j, descending. */
  values: number[];
}

/** The assets rotated onto their principal components, Σ̂ = QLQ' and returns Q'R^e_t (p. 276, eqs. 10–11). */
export function principalComponentAssets(returns: Rows): PrincipalComponentAssets {
  const { loadings, values } = pca(returns);
  return { returns: returns.map((row) => loadings.map((q) => dot(q, row))), loadings, values };
}

interface Moments { mu: number[]; Sigma: number[][] }
interface Fold { train: Moments; test: Moments }

const moments = (rows: Rows): Moments => ({ mu: sampleMeans(rows), Sigma: sampleCovariance(rows) });

// Fold k holds months floor(kT/K) to floor((k+1)T/K) - 1; the others are its training sample.
function foldMoments(returns: Rows, folds: number, space: AssetSpace): Fold[] {
  if (!Number.isInteger(folds) || folds < 2 || 2 * folds > returns.length) {
    throw new RangeError('crossValidatedR2: folds must be an integer from 2 to T/2');
  }
  const rows = space === 'pcs' ? principalComponentAssets(returns).returns : returns;
  return Array.from({ length: folds }, (_, k) => {
    const [from, to] = [Math.floor((k * rows.length) / folds), Math.floor(((k + 1) * rows.length) / folds)];
    return { train: moments([...rows.slice(0, from), ...rows.slice(to)]), test: moments(rows.slice(from, to)) };
  });
}

const estimate = ({ mu, Sigma }: Moments, penalty: number, l1: number) =>
  (l1 > 0 ? elasticNetSdf(mu, Sigma, { l1, l2: penalty }).b : ridgeSdf(mu, Sigma, penalty));

// R²_CV = mean over folds of 1 - ‖μ̄₂ - Σ₂b̂‖² / ‖μ̄₂‖², b̂ from the training months (p. 279, eq. 30).
function averageR2(folds: readonly Fold[], penalty: number, l1: number): number {
  return arithmeticMean(folds.map(({ train, test }) => {
    const b = estimate(train, penalty, l1);
    const errors = test.mu.map((m, i) => m - dot(test.Sigma[i], b));
    return 1 - dot(errors, errors) / dot(test.mu, test.mu);
  }));
}

export interface CrossValidationOptions {
  /** K_CV, the number of folds; the paper's choice is 3 (p. 279). */
  folds?: number;
  /** ν₁; 0 gives ridgeSdf. */
  l1?: number;
  /** 'pcs' estimates on principalComponentAssets, rotated once on the whole sample. */
  space?: AssetSpace;
}

/**
 * Cross-validated out-of-sample cross-sectional R² (p. 279, eq. 30): split the months into `folds`
 * contiguous blocks, estimate b̂ on all blocks but one, score it on the one withheld, and average.
 * The L2 penalty ν₂ stays fixed across folds. Ridge results are the same in both spaces: R² is rotation-invariant.
 */
export function crossValidatedR2(
  returns: Rows, { penalty, folds = 3, l1 = 0, space = 'assets' }: CrossValidationOptions & { penalty: number },
): number {
  return averageR2(foldMoments(returns, folds, space), penalty, l1);
}

export interface ShrinkagePath {
  penalties: number[];
  /** SR_prior = √(tr Σ / (ν₂T)) of each penalty on the whole sample; Infinity at ν₂ = 0. */
  priorScales: number[];
  /** b̂ on the whole sample at each penalty, in the chosen space. */
  coefficients: number[][];
  /** crossValidatedR2 at each penalty. */
  r2: number[];
}

/** Prior scales SR_prior = 10^-2 to 10^1 per month, 21 points; shrinkagePath maps them to penalties. */
export const defaultPriorScales = Array.from({ length: 21 }, (_, i) => 10 ** (-2 + 0.15 * i));

/** b̂ and R²_CV along a grid of L2 penalties, by default the ridgePenalty of each defaultPriorScales entry. */
export function shrinkagePath(
  returns: Rows, { penalties, folds = 3, l1 = 0, space = 'assets' }: CrossValidationOptions & { penalties?: readonly number[] } = {},
): ShrinkagePath {
  const rows = space === 'pcs' ? principalComponentAssets(returns).returns : returns;
  const full = moments(rows);
  const grid = penalties ? [...penalties] : defaultPriorScales.map((scale) => ridgePenalty(scale, full.Sigma, rows.length));
  const cv = foldMoments(rows, folds, 'assets');
  return {
    penalties: grid,
    priorScales: grid.map((penalty) => Math.sqrt(trace(full.Sigma) / (penalty * rows.length))),
    coefficients: grid.map((penalty) => estimate(full, penalty, l1)),
    r2: grid.map((penalty) => averageR2(cv, penalty, l1)),
  };
}

export interface PortfolioMoments {
  /** Monthly mean and standard deviation of b̂'R^e_t, decimal. */
  mean: number;
  volatility: number;
  /** mean / volatility, monthly. */
  sharpe: number;
}

export interface SplitSampleSharpe {
  /** b̂ = ridgeSdf on the first `split` months: the weights of the shrunk tangency portfolio (p. 290). */
  weights: number[];
  inSample: PortfolioMoments;
  outOfSample: PortfolioMoments;
}

function portfolioMoments(rows: Rows, weights: readonly number[]): PortfolioMoments {
  const series = rows.map((row) => dot(weights, row));
  const [mean, volatility] = [arithmeticMean(series), Math.sqrt(sampleVariance(series))];
  return { mean, volatility, sharpe: mean / volatility };
}

/**
 * The paper's pure out-of-sample test (p. 289–290) with a given penalty: b̂ from the first `split` months,
 * then the portfolio b̂'R^e_t in those months and in the rest. b̂ ∝ Σ̂⁻¹μ̄ at penalty 0, the tangency direction.
 * Weights are not rescaled to sum to one, because zero-cost assets can have 1'b̂ near zero.
 */
export function splitSampleSharpe(returns: Rows, { split, penalty = 0 }: { split: number; penalty?: number }): SplitSampleSharpe {
  if (!Number.isInteger(split) || split < 2 || split > returns.length - 2) {
    throw new RangeError('splitSampleSharpe: split must leave at least two months on each side');
  }
  const [before, after] = [returns.slice(0, split), returns.slice(split)];
  const { mu, Sigma } = moments(before);
  const weights = ridgeSdf(mu, Sigma, penalty);
  return { weights, inSample: portfolioMoments(before, weights), outOfSample: portfolioMoments(after, weights) };
}
