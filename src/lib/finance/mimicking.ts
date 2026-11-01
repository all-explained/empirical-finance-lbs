// Characteristic portfolios and factor-mimicking portfolios (Chapter 33). A cross-sectional regression of returns on
// characteristics has slopes that are themselves portfolio returns, and a non-traded factor projected on traded
// returns gives a portfolio that tracks it. Z is N × dim z (row i is z_i', a constant first); a panel is T × N.
// Returns are decimals.
import { inverse, matMul, transpose, type Matrix } from '../math/linalg';
import { seriesColumns } from '../data/series';
import { ols } from '../stats/ols';
import { sampleCovariance } from './portfolio';

type Rows = readonly (readonly number[])[];

const dot = (x: readonly number[], y: readonly number[]) => x.reduce((sum, value, i) => sum + value * y[i], 0);

/**
 * The slope-weight portfolios: the rows of (Z'Z)⁻¹Z', a dim z × N matrix. The OLS slopes of a cross-sectional
 * regression of R on Z are ξ̂ = (Z'Z)⁻¹Z'R, so slope j is the return of the portfolio in row j. Because
 * (Z'Z)⁻¹Z'Z = I, row j has exposure 1 to characteristic j and 0 to every other column of Z. With a constant
 * column, the constant's row sums to one and every other row sums to zero: a long–short portfolio.
 * Kelly, Pruitt & Su (2018, NBER WP 24540, p. 15) read period-by-period Fama–MacBeth slopes on characteristics
 * this way, as returns on characteristic-managed portfolios.
 */
export function slopeWeights(Z: Rows): Matrix {
  if (Z.length <= Z[0].length) throw new RangeError('slopeWeights: needs more assets than characteristics');
  const Zt = transpose(Z);
  return matMul(inverse(matMul(Zt, Z)), Zt);
}

/**
 * The cross-sectional slopes ξ̂_t = (Z'Z)⁻¹Z'R_t of every period, T × dim z; row t is the return of each
 * slope-weight portfolio. These are the monthly Fama–MacBeth slopes of Fama & French (1992, J. Finance 47,
 * pp. 430 and 438–439), who regress each month's stock returns on β, ln(ME) and ln(BE/ME), here on the 25
 * size–B/M portfolios instead of stocks. With characteristics that change over time, pass one Z per period:
 * Z[t] must be known before returns[t], the characteristics at t for the return at t + 1, as managedPortfolios
 * of conditional.ts dates z.
 */
export function slopePortfolios(returns: Rows, Z: Rows | readonly Rows[]): Matrix {
  const varying = Array.isArray(Z[0]?.[0]);
  if (varying && Z.length !== returns.length) throw new RangeError('slopePortfolios: one Z per period');
  const fixed = varying ? null : slopeWeights(Z as Rows);
  return returns.map((r, t) => (fixed ?? slopeWeights((Z as readonly Rows[])[t])).map((w) => dot(w, r)));
}

/**
 * The characteristics of the 25 size–B/M portfolios, in the column order of `ff25-size-bm-monthly`: a constant,
 * the size quintile and the B/M quintile read from the names ME1-BM1 … ME5-BM5, each centred at 3 (so −2 … 2).
 * The scores rank portfolios; they are not the portfolios' ln(ME) and ln(BE/ME).
 */
export function ff25Characteristics(): Matrix {
  return seriesColumns['ff25-size-bm-monthly'].map((name) => {
    const [, size, bm] = /^ME(\d)-BM(\d)$/.exec(name)!;
    return [1, Number(size) - 3, Number(bm) - 3];
  });
}

/**
 * A long–short sort on one score: equal weights on the assets whose score is `long`, minus equal weights on those
 * whose score is `short` (with B/M quintile scores, long 2 and short −2 is value minus growth). The weights are
 * divided by long − short, so they sum to zero and have exposure 1 to the score, like the score's row of
 * slopeWeights. Multiply by long − short for the plain value-minus-growth portfolio.
 */
export function sortWeights(scores: readonly number[], { long, short }: { long: number; short: number }): number[] {
  const nLong = scores.filter((s) => s === long).length;
  const nShort = scores.filter((s) => s === short).length;
  if (long === short || nLong === 0 || nShort === 0) throw new RangeError('sortWeights: needs assets on both legs');
  const spread = long - short;
  return scores.map((s) => (s === long ? 1 / nLong : s === short ? -1 / nShort : 0) / spread);
}

export interface MimickingPortfolio {
  /** a, the intercept of f_t = a + w'R^e_t + ε_t. */
  intercept: number;
  /** w, one weight per base asset. On excess returns the weights need not sum to one. */
  weights: number[];
  /** The mimicking return w'R^e_t, one per period. */
  mimicking: number[];
  /** corr(f_t, w'R^e_t) in sample, the square root of the projection's R². */
  correlation: number;
  /** With split: w estimated on the first `split` periods, and corr(f_t, w'R^e_t) on the periods after them. */
  outOfSample?: { split: number; weights: number[]; correlation: number };
}

function correlation(x: readonly number[], y: readonly number[]): number {
  const [[vx, cxy], [, vy]] = sampleCovariance(x.map((value, t) => [value, y[t]]));
  return cxy / Math.sqrt(vx * vy);
}

function project(factor: readonly number[], baseExcess: Rows) {
  const { coefficients: [intercept, ...weights] } = ols(factor, transpose(baseExcess));
  return { intercept, weights };
}

/**
 * Projects a factor on the excess returns of base assets by OLS, f_t = a + w'R^e_t + ε_t. w'R^e_t is the traded
 * portfolio most correlated with f_t, so its mean estimates the factor's risk premium. Giglio & Xiu (2021, JPE
 * 129, pp. 1954–1955) show that this estimate is biased when the base assets omit portfolios needed to span the
 * risk factors; their example is a consumption-growth mimicking portfolio built on four size–B/M portfolios.
 * The opposite problem is overfitting: 25 base assets on a few hundred quarters let the projection fit noise, so the
 * in-sample correlation overstates the fit. `split` measures it: weights from the first `split` periods, correlation
 * on the rest.
 */
export function mimickingPortfolio(
  factor: readonly number[], baseExcess: Rows, { split }: { split?: number } = {},
): MimickingPortfolio {
  if (factor.length !== baseExcess.length) throw new RangeError('mimickingPortfolio: one factor value per period');
  const { intercept, weights } = project(factor, baseExcess);
  const mimicking = baseExcess.map((r) => dot(weights, r));
  const result: MimickingPortfolio = { intercept, weights, mimicking, correlation: correlation(factor, mimicking) };
  if (split === undefined) return result;
  if (split <= baseExcess[0].length + 1 || split > factor.length - 3) {
    throw new RangeError('mimickingPortfolio: split must leave enough periods on both sides');
  }
  const early = project(factor.slice(0, split), baseExcess.slice(0, split));
  const later = baseExcess.slice(split).map((r) => dot(early.weights, r));
  return { ...result, outOfSample: { split, weights: early.weights, correlation: correlation(factor.slice(split), later) } };
}
