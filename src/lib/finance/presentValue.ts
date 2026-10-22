import { getColumn, type Series } from '../data/series';
import { ols } from '../stats/ols';
import { arithmeticMean, sampleVariance } from './returns';

function requireFinite(values: readonly number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('Expected finite numbers');
}

function requireSameLength(...series: readonly (readonly number[])[]): void {
  if (series.some((values) => values.length !== series[0].length)) {
    throw new RangeError('Series must have equal lengths');
  }
}

/** Campbell–Shiller constants at the mean log price–dividend ratio. */
export function linearisationConstants(meanPd: number): { rho: number; kappa: number } {
  requireFinite([meanPd]);
  // 1/(1 + e^-pd) equals e^pd/(1 + e^pd) without overflow for large pd.
  const rho = 1 / (1 + Math.exp(-meanPd));
  return { rho, kappa: Math.log1p(Math.exp(meanPd)) - rho * meanPd };
}

/** r_{t+1} = log(1 + e^{pd_{t+1}}) + Δd_{t+1} − pd_t, with no approximation. */
export function exactLogReturn(pdNow: number, pdNext: number, dividendGrowth: number): number {
  return Math.log1p(Math.exp(pdNext)) + dividendGrowth - pdNow;
}

/** r_{t+1} ≈ κ + ρ pd_{t+1} + Δd_{t+1} − pd_t, the first-order expansion around the mean pd. */
export function approxLogReturn(
  pdNow: number, pdNext: number, dividendGrowth: number, rho: number, kappa: number,
): number {
  return kappa + rho * pdNext + dividendGrowth - pdNow;
}

/** Keep the latest run of consecutive years with Index and D12, then drop its first year.
 * Annual dates identify the year, despite the YYYY-01-01 encoding (docs/DATA.md).
 * Index is the year-end level P_t and D12 the dividends D_t paid during that year.
 * pd[t] = log(P_t/D_t) and dp[t] = −pd[t] at the end of year dates[t].
 * r[t] = log((P_t + D_t)/P_{t−1}) and dd[t] = log(D_t/D_{t−1}) are earned DURING
 * year dates[t], as in goyalWelchAnnualPredictors. Thus dp[t] predicts r[t+1] and dd[t+1],
 * and r[0], dd[0] (which use the dropped first year) pair with no dp in the output.
 * All four come from the same Index and D12 columns, so r[t] = exactLogReturn(pd[t−1], pd[t], dd[t])
 * holds up to rounding: the identity misses only by the linearisation error.
 * CRSP_SPvw is not used: it is CRSP's own value-weighted S&P return, with its own dividends and
 * timing, and starts only in 1926. With it, the identity gap would mix data mismatch with linearisation.
 * It is a total log return, not an excess return. The current sample is 1872–2025.
 */
export function goyalWelchAnnualPresentValue(series: Series<'goyal-welch-annual'>): {
  dates: string[]; pd: number[]; dp: number[]; r: number[]; dd: number[];
} {
  const prices = getColumn(series, 'Index');
  const dividends = getColumn(series, 'D12');
  let run: { date: string; p: number; d: number }[] = [];
  series.rows.forEach(([date], t) => {
    const p = prices[t];
    const d = dividends[t];
    if (p == null || d == null) return;
    requireFinite([p, d]);
    if (p <= 0 || d <= 0) throw new RangeError(`Invalid log input at ${date}`);
    const previous = run.at(-1);
    if (previous && Number(date.slice(0, 4)) !== Number(previous.date.slice(0, 4)) + 1) run = [];
    run.push({ date, p, d });
  });
  const kept = run.slice(1);
  const pd = kept.map(({ p, d }) => Math.log(p) - Math.log(d));
  return {
    dates: kept.map(({ date }) => date),
    pd,
    dp: pd.map((value) => -value),
    r: kept.map(({ p, d }, t) => Math.log(p + d) - Math.log(run[t].p)),
    dd: kept.map(({ d }, t) => Math.log(d) - Math.log(run[t].d)),
  };
}

/** Long-run coefficient b/(1 − ρφ) of a one-period slope b when dp follows an AR(1) with persistence φ. */
export function longRunCoefficient(b: number, rho: number, phi: number): number {
  return b / (1 - rho * phi);
}

/** The return slope that the identity 1 = b_r − b_d + ρφ implies. */
export function impliedReturnSlope(bd: number, rho: number, phi: number): number {
  return 1 - rho * phi + bd;
}

/** OLS slopes of r[t+1], dd[t+1] and dp[t+1] on dp[t], with an intercept, on the same T − 1 pairs.
 * Inputs follow goyalWelchAnnualPresentValue: r[0] and dd[0] are never used.
 * gap = 1 − (b_r − b_d + ρφ) is zero when the linear identity holds exactly.
 */
export function presentValueSlopes(
  dp: readonly number[], r: readonly number[], dd: readonly number[], rho: number,
): { br: number; bd: number; phi: number; brLongRun: number; bdLongRun: number; gap: number; nobs: number } {
  requireSameLength(dp, r, dd);
  requireFinite([...dp, ...r, ...dd, rho]);
  const x = [dp.slice(0, -1)];
  const slope = (y: readonly number[]) => ols(y.slice(1), x).coefficients[1];
  const br = slope(r);
  const bd = slope(dd);
  const phi = slope(dp);
  return {
    br, bd, phi,
    brLongRun: longRunCoefficient(br, rho, phi),
    bdLongRun: longRunCoefficient(bd, rho, phi),
    gap: 1 - (br - bd + rho * phi),
    nobs: dp.length - 1,
  };
}

/** Shares of Var(dp_t) from the k-year identity dp_t ≈ Σ ρ^{j−1}(r_{t+j} − Δd_{t+j}) + ρ^k dp_{t+k} + const.
 * All moments use the same T − k dates t, with n − 1 denominators. The shares sum to 1 up to the
 * linearisation error; `future` is the "bubble" term that must vanish as k grows if prices are not explosive.
 */
export function varianceShares(
  dp: readonly number[], r: readonly number[], dd: readonly number[], rho: number, horizon: number,
): { returns: number; dividends: number; future: number } {
  requireSameLength(dp, r, dd);
  requireFinite([...dp, ...r, ...dd, rho]);
  if (!Number.isSafeInteger(horizon) || horizon < 1) throw new RangeError('Horizon must be a positive integer');
  const n = dp.length - horizon;
  if (n < 2) throw new RangeError('Variance shares need at least two dates');
  const x = dp.slice(0, n);
  const discounted = (y: readonly number[]) => x.map((_, t) => {
    let sum = 0;
    for (let j = 1; j <= horizon; j++) sum += rho ** (j - 1) * y[t + j];
    return sum;
  });
  const meanX = arithmeticMean(x);
  const variance = sampleVariance(x);
  const share = (y: readonly number[]) => {
    const meanY = arithmeticMean(y);
    return y.reduce((sum, value, t) => sum + (x[t] - meanX) * (value - meanY), 0) / (n - 1) / variance;
  };
  return {
    returns: share(discounted(r)),
    dividends: -share(discounted(dd)),
    future: rho ** horizon * share(dp.slice(horizon)),
  };
}
