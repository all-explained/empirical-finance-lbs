/**
 * Bond arithmetic for Part XI: zero-coupon prices and yields, forward rates, par yields, one-year holding-period
 * returns and the perfect-foresight yield of the expectations hypothesis.
 *
 * Units: decimal log rates per year. One period is one year; the data are observed every month, so "t + 1" is the
 * month twelve months after t. Rows are matched by calendar month, never by row offset: `gsw-zero-coupon` skips
 * eleven months (whose last trading day lacks a yield) and `fred-treasury-monthly` skips 1987-01 to 1993-09.
 *
 * Definitions follow Cochrane and Piazzesi (2005, AER 95(1), p. 141; pdf p. 4): the log forward rate
 * f^(n)_t = p^(n-1)_t - p^(n)_t, the log holding-period return r^(n)_{t+1} = p^(n-1)_{t+1} - p^(n)_t of buying an
 * n-year bond at t and selling it as an (n-1)-year bond at t + 1, and the log excess return
 * rx^(n)_{t+1} = r^(n)_{t+1} - y^(1)_t.
 */
import { getColumn, type ColumnName, type Series } from '../data/series';
import { gswYields } from '../stats/pca';

/** A zero-coupon curve on the integer maturities 1, …, N years. */
export interface YieldCurve {
  dates: string[];
  /** 1, 2, …, N. */
  maturities: number[];
  /** T × N: y[t][n - 1] is the log yield y^(n)_t. */
  y: number[][];
}

function checkCurve(curve: YieldCurve): void {
  if (!curve.maturities.every((m, i) => m === i + 1)) throw new RangeError('Maturities must be 1, 2, …, N');
  if (curve.y.length !== curve.dates.length || curve.y.some((row) => row.length !== curve.maturities.length)) {
    throw new RangeError('The yield matrix must have one row per date and one column per maturity');
  }
}

function checkMaturity(curve: YieldCurve, n: number, min: number): void {
  checkCurve(curve);
  if (!Number.isInteger(n) || n < min || n > curve.maturities.length) {
    throw new RangeError(`Maturity must be an integer from ${min} to ${curve.maturities.length}`);
  }
}

/** Months since year 0 of an ISO date: 2000-12-29 and 2000-12-01 are the same month. */
function monthNumber(date: string): number {
  return Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1;
}

/** For each row t, the row of the month `months` later, or undefined if the curve has no such month. */
function rowsLater(dates: readonly string[], months: number): (number | undefined)[] {
  const byMonth = new Map(dates.map((date, t) => [monthNumber(date), t]));
  return dates.map((date) => byMonth.get(monthNumber(date) + months));
}

/** `gsw-zero-coupon` as a curve: y^(n)_t is SVENY0n (continuously compounded, percent) over 100. */
export function gswCurve(series: Series<'gsw-zero-coupon'>): YieldCurve {
  const { dates, X } = gswYields(series);
  return { dates, maturities: X[0]?.map((_, i) => i + 1) ?? [], y: X };
}

/** Log prices p^(n)_t = -n y^(n)_t, T × N. */
export function logPrices(curve: YieldCurve): number[][] {
  checkCurve(curve);
  return curve.y.map((row) => row.map((y, i) => -(i + 1) * y));
}

/**
 * Log forward rates for a loan from t + n - 1 to t + n, T × N: f^(1)_t = y^(1)_t and f^(n)_t = p^(n-1)_t - p^(n)_t.
 * The sum telescopes, f^(1)_t + … + f^(n)_t = -p^(n)_t, so y^(n)_t is the mean of the first n forwards.
 */
export function forwardRates(curve: YieldCurve): number[][] {
  return logPrices(curve).map((p) => p.map((pn, i) => (i === 0 ? 0 : p[i - 1]) - pn));
}

/**
 * Discount factor of one date's curve at maturity m years: e^{-m y(m)}. On the integer grid y(m) is the curve's
 * own yield. Limit: between integer maturities y(m) is interpolated linearly in the log yield, and below one year it
 * is held flat at y^(1), because the GSW file has no shorter maturity. Half-year factors are approximate there.
 */
export function discountFactor(yields: readonly number[], m: number): number {
  if (!(m > 0 && m <= yields.length)) throw new RangeError(`Maturity must be in (0, ${yields.length}]`);
  const lo = Math.max(1, Math.floor(m));
  const hi = Math.ceil(m);
  const y = m <= 1 ? yields[0] : yields[lo - 1] + (m - lo) * (yields[hi - 1] - yields[lo - 1]);
  return Math.exp(-m * y);
}

/**
 * Par yields, T × N, as decimal coupon rates per year paid `frequency` times a year. A bond of maturity n pays c/k at
 * each of the k·n coupon dates j/k and 1 at n; it is priced at par when c = k (1 - d(n)) / Σ_{j=1}^{kn} d(j/k), with
 * d from `discountFactor`. It values the coupon bond as a portfolio of zero-coupon bonds, one per payment (Campbell
 * and Shiller, 1991, RES; working-paper pdf p. 15). With `frequency: 1` every date is on the integer grid, so it is
 * exact. With `frequency: 2`, the convention of the Treasury's constant-maturity yields, the half-year factors carry
 * the interpolation limit of `discountFactor`.
 */
export function parYields(curve: YieldCurve, frequency: 1 | 2): number[][] {
  checkCurve(curve);
  return curve.y.map((row) => {
    let annuity = 0;
    let next = 1;
    return row.map((_, i) => {
      const n = i + 1;
      for (; next <= frequency * n; next++) annuity += discountFactor(row, next / frequency);
      return (frequency * (1 - discountFactor(row, n))) / annuity;
    });
  });
}

export interface HoldingReturn {
  /** Purchase date t. */
  date: string;
  /** Sale date t + 1, twelve months later. */
  sold: string;
  /** Log holding-period return r^(n)_{t+1}. */
  r: number;
  /** Log excess return rx^(n)_{t+1}. */
  rx: number;
}

/**
 * One-year log holding-period returns of the n-year bond (2 ≤ n ≤ N) for every month t whose month twelve months
 * later is on the curve: r^(n)_{t+1} = p^(n-1)_{t+1} - p^(n)_t and rx^(n)_{t+1} = r^(n)_{t+1} - y^(1)_t. A month
 * with no sale month is left out. Consecutive observations overlap by eleven months, so they are not independent.
 */
export function holdingReturns(curve: YieldCurve, n: number): HoldingReturn[] {
  checkMaturity(curve, n, 2);
  const p = logPrices(curve);
  const sale = rowsLater(curve.dates, 12);
  return curve.dates.flatMap((date, t) => {
    const s = sale[t];
    if (s === undefined) return [];
    const r = p[s][n - 2] - p[t][n - 1];
    return [{ date, sold: curve.dates[s], r, rx: r - curve.y[t][0] }];
  });
}

export interface ReturnParts extends HoldingReturn {
  /** y^(n)_t: the return if the yield stays where it is. */
  yield: number;
  /** -(n - 1)(y^(n-1)_t - y^(n)_t): the gain from rolling down a curve that does not move. */
  rollDown: number;
  /** -(n - 1)(y^(n-1)_{t+1} - y^(n-1)_t): the gain or loss from the move of the curve. */
  shift: number;
  /** Simple holding-period return e^r - 1. */
  simple: number;
}

/**
 * The one-year return of the n-year bond bought in the month of `date`, split into three parts, or null if the
 * curve has no month twelve months later. Derivation: with p^(n)_t = -n y^(n)_t,
 *   r^(n)_{t+1} = -(n - 1) y^(n-1)_{t+1} + n y^(n)_t = y^(n)_t - (n - 1)(y^(n-1)_{t+1} - y^(n)_t),
 * and the yield change splits at y^(n-1)_t into y^(n-1)_t - y^(n)_t (along today's curve) plus
 * y^(n-1)_{t+1} - y^(n-1)_t (the curve's move). So r^(n)_{t+1} = yield + rollDown + shift exactly.
 */
export function returnDecomposition(curve: YieldCurve, date: string, n: number): ReturnParts | null {
  checkMaturity(curve, n, 2);
  const t = curve.dates.findIndex((d) => monthNumber(d) === monthNumber(date));
  if (t < 0) throw new RangeError(`No curve in the month of ${date}`);
  const s = rowsLater(curve.dates, 12)[t];
  if (s === undefined) return null;
  const [now, later] = [curve.y[t], curve.y[s]];
  const parts = {
    yield: now[n - 1],
    rollDown: -(n - 1) * (now[n - 2] - now[n - 1]),
    shift: -(n - 1) * (later[n - 2] - now[n - 2]),
  };
  const r = (n - 1) * -later[n - 2] - n * -now[n - 1]; // p^(n-1)_{t+1} - p^(n)_t
  return { date: curve.dates[t], sold: curve.dates[s], r, rx: r - now[0], ...parts, simple: Math.expm1(r) };
}

export interface PerfectForesight {
  date: string;
  /** y^(n)_t. */
  y: number;
  /** (1/n) Σ_{j=0}^{n-1} y^(1)_{t+j}: the mean of the one-year yields realised j years later. */
  perfectForesight: number;
  /** Ex post term premium tp^(n)_t = y^(n)_t minus the perfect-foresight yield. */
  termPremium: number;
}

/**
 * The yield the expectations hypothesis would set with perfect foresight of the short rate. The hypothesis says the
 * n-period yield is a constant plus the average of the expected one-period yields over the bond's life (Campbell and
 * Shiller, 1991, RES, eq. 1; working-paper pdf p. 6). Replacing expectations by realised yields gives the
 * perfect-foresight yield, as their perfect-foresight spread, eq. 3, does for the spread (pdf pp. 8–9). The gap is
 * the ex post term premium. A month is left out when any of the n one-year yields is not on the curve, which
 * includes the last n - 1 years of the sample.
 */
export function perfectForesightYield(curve: YieldCurve, n: number): PerfectForesight[] {
  checkMaturity(curve, n, 1);
  const ahead = Array.from({ length: n }, (_, j) => rowsLater(curve.dates, 12 * j));
  return curve.dates.flatMap((date, t) => {
    const rows = ahead.map((later) => later[t]);
    if (rows.some((s) => s === undefined)) return [];
    const perfectForesight = rows.reduce((sum: number, s) => sum + curve.y[s as number][0], 0) / n;
    const y = curve.y[t][n - 1];
    return [{ date, y, perfectForesight, termPremium: y - perfectForesight }];
  });
}

/**
 * Bond-equivalent yield of a Treasury bill quoted at the decimal discount rate d with `days` to maturity. A bill
 * paying 1 costs P = 1 - d·days/360. Its simple return (1 - P)/P, scaled to a 365-day year, is
 *   (d·days/360) / (1 - d·days/360) · 365/days = 365 d / (360 - d·days).
 * The formula holds for bills of half a year or less, which have no coupon date inside their life.
 */
export function billBondEquivalent(discountRate: number, days: number): number {
  if (!Number.isFinite(discountRate) || !(days > 0 && days <= 182)) throw new RangeError('Days must be in (0, 182]');
  if (discountRate * days >= 360) throw new RangeError('The bill price must be positive');
  return (365 * discountRate) / (360 - discountRate * days);
}

const treasuryColumns = ['GS1', 'GS2', 'GS3', 'GS5', 'GS7', 'GS10', 'GS20', 'GS30'] as const;

export interface TreasuryCurve {
  /** First day of each month, as in `fred-treasury-monthly`. The rows skip 1987-01 to 1993-09. */
  dates: string[];
  maturities: number[];
  /** T × 8 decimal par yields with semi-annual coupons. */
  par: number[][];
  /** Three-month bill yield, bond-equivalent, from TB3MS. */
  bill: number[];
}

/**
 * The constant-maturity yields of `fred-treasury-monthly` (percent over 100): par yields of the 1-, 2-, 3-, 5-, 7-,
 * 10-, 20- and 30-year Treasury with semi-annual coupons. They are monthly averages of daily yields, while GSW is
 * observed at the end of the month. Dates are kept as they are: the missing months are never filled.
 * Limit: TB3MS is a monthly average of discount rates, converted with the 91 days of a 13-week bill.
 */
export function treasuryCurve(series: Series<'fred-treasury-monthly'>): TreasuryCurve {
  const decimal = (name: ColumnName<'fred-treasury-monthly'>) => getColumn(series, name).map((v, t) => {
    if (v == null || !Number.isFinite(v)) throw new RangeError(`Missing ${name} at ${series.rows[t][0]}`);
    return v / 100;
  });
  const columns = treasuryColumns.map(decimal);
  return {
    dates: series.rows.map(([date]) => date),
    maturities: [1, 2, 3, 5, 7, 10, 20, 30],
    par: series.rows.map((_, t) => columns.map((column) => column[t])),
    bill: decimal('TB3MS').map((d) => billBondEquivalent(d, 91)),
  };
}
