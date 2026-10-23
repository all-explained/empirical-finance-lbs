/**
 * The consumption–wealth–income residual cay of Lettau and Ludvigson (2001, JF), "LL" below,
 * from the public `fred-cay-quarterly` columns, and quarterly market excess returns to predict.
 * Page numbers refer to the Journal of Finance 56, 815–849.
 */
import { getColumn, type ColumnName, type Series } from '../data/series';
import { cointegratingResidual, dynamicOLS, realTimeResidual } from '../stats/cointegration';

export interface CayInputs {
  /** Quarter start dates, as in `fred-cay-quarterly`. */
  dates: string[];
  /** Log real consumption per person, c_t. */
  c: number[];
  /** Log real asset wealth per person, a_t: net worth at the end of the previous quarter. */
  a: number[];
  /** Log real labour income per person, y_t. */
  y: number[];
}

function column(series: Series<'fred-cay-quarterly'>, name: ColumnName<'fred-cay-quarterly'>): number[] {
  return getColumn(series, name).map((value) => value as number);
}

/** Log real per-person c_t, a_t and y_t. Units are 2017 dollars per person; the base year moves only the constant.
 * - c_t: nondurables plus services, each deflated by its own chain-type price index, then added, as LL add
 *   chained-dollar components (p. 822, p. 845). LL also remove shoes and clothing; these public totals keep them.
 * - a_t: household and nonprofit net worth deflated by the PCE price index (LL, p. 845). Timing: LL's wealth
 *   W_t is held at the start of period t, before C_t is consumed (eq. 1, p. 818), so a_t is the end-of-quarter
 *   t − 1 value. The first quarter of the extract has no previous wealth and is dropped. The Z.1 series is not
 *   seasonally adjusted; LL's variables are seasonally adjusted (p. 822).
 * - y_t: compensation of employees plus transfer receipts minus contributions for social insurance, deflated by
 *   the PCE price index. LL also subtract a labour share of personal taxes (p. 845); this y_t is pre-tax.
 *   Compensation includes supplements, which covers LL's "other labor income". See docs/DATA.md.
 * Per person: divided by total population. LL use per capita values in 1992 dollars (p. 822).
 */
export function cayInputs(series: Series<'fred-cay-quarterly'>): CayInputs {
  const nondurables = column(series, 'PCND');
  const services = column(series, 'PCESV');
  const nondurablesPrice = column(series, 'DNDGRG3Q086SBEA');
  const servicesPrice = column(series, 'DSERRG3Q086SBEA');
  const netWorth = column(series, 'TNWBSHNO');
  const compensation = column(series, 'COE');
  const transfers = column(series, 'A577RC1Q027SBEA');
  const socialInsurance = column(series, 'A061RC1Q027SBEA');
  const price = column(series, 'PCECTPI');
  const population = column(series, 'B230RC0Q173SBEA');
  // Billions and millions of dollars over thousands of persons, in dollars per person.
  const perPerson = (dollars: number, t: number) => Math.log(dollars / (population[t] * 1e3));
  const c = series.rows.map((_, t) => perPerson(
    (nondurables[t] / nondurablesPrice[t] + services[t] / servicesPrice[t]) * 100 * 1e9, t));
  const a = series.rows.map((_, t) => perPerson((netWorth[t] * 1e6 * 100) / price[t], t));
  const y = series.rows.map((_, t) => perPerson(
    ((compensation[t] + transfers[t] - socialInsurance[t]) * 1e9 * 100) / price[t], t));
  return {
    dates: series.rows.slice(1).map(([date]) => date),
    c: c.slice(1),
    a: a.slice(0, -1),
    y: y.slice(1),
  };
}

export interface CayOptions {
  /** LL use 8 leads and 8 lags (p. 823, fn. 8). */
  leads?: number;
  lags?: number;
}

export interface FullSampleCay {
  dates: string[];
  /** c_t − alpha − omega a_t − betaY y_t at every date, with the full-sample weights. */
  cay: number[];
  alpha: number;
  omega: number;
  betaY: number;
  /** Newey–West standard errors of omega and betaY. */
  standardErrors: [number, number];
  /** First and last dates of the dynamic OLS regression. */
  sample: { start: string; end: string };
}

/** cay from one dynamic OLS on the whole sample. Every date uses weights estimated with later data:
 * this is the look-ahead that LL's out-of-sample tests address (p. 831). LL's 1952-Q4–1998-Q3 estimate is
 * c_t = 0.61 + 0.31 a_t + 0.59 y_t (eq. 12, p. 823).
 */
export function fullSampleCay(inputs: CayInputs, options: CayOptions = {}): FullSampleCay {
  const { leads = 8, lags = 8 } = options;
  const X = [inputs.a, inputs.y];
  const fit = dynamicOLS(inputs.c, X, { leads, lags });
  return {
    dates: inputs.dates,
    cay: cointegratingResidual(inputs.c, X, fit.alpha, fit.beta),
    alpha: fit.alpha,
    omega: fit.beta[0],
    betaY: fit.beta[1],
    standardErrors: [fit.standardErrors[0], fit.standardErrors[1]],
    sample: { start: inputs.dates[fit.first], end: inputs.dates[fit.last] },
  };
}

export interface RealTimeCayOptions extends CayOptions {
  /** Quarters in the first estimate. LL start with 1952-Q4–1968-Q1, 62 quarters (p. 833). */
  minWindow?: number;
}

/** cay_t from weights estimated only with data known at t, re-estimated each quarter (LL, p. 832–833).
 * omega[i] and betaY[i] are the weights used for dates[i]. See realTimeResidual for the leads.
 */
export function realTimeCay(inputs: CayInputs, options: RealTimeCayOptions = {}): {
  dates: string[]; cay: number[]; omega: number[]; betaY: number[];
} {
  const { leads = 8, lags = 8, minWindow = 62 } = options;
  const fit = realTimeResidual(inputs.c, [inputs.a, inputs.y], { leads, lags, minWindow });
  return {
    dates: inputs.dates.slice(fit.first),
    cay: fit.residuals,
    omega: fit.beta.map((beta) => beta[0]),
    betaY: fit.beta.map((beta) => beta[1]),
  };
}

/** Quarterly log excess return: the sum over the quarter's three months of log(1 + CRSP_SPvw) − log(1 + Rfree).
 * Each quarter carries the date of its first month, like `fred-cay-quarterly`: 2025-10-01 is 2025-Q4.
 * Only quarters with all three months present are kept.
 * Alignment: cay at date t (consumption and income of quarter t, wealth at its start) predicts the return
 * dated t + 1, the following quarter, as in LL's one-quarter-ahead regressions (p. 827–828).
 */
export function quarterlyExcessReturns(series: Series<'goyal-welch-monthly'>): { dates: string[]; r: number[] } {
  const market = getColumn(series, 'CRSP_SPvw');
  const riskFree = getColumn(series, 'Rfree');
  const quarters = new Map<string, number[]>();
  series.rows.forEach(([date], t) => {
    const m = market[t];
    const rf = riskFree[t];
    if (m == null || rf == null) return;
    const month = Number(date.slice(5, 7));
    const quarter = `${date.slice(0, 4)}-${String(month - ((month - 1) % 3)).padStart(2, '0')}-01`;
    quarters.set(quarter, [...(quarters.get(quarter) ?? []), Math.log1p(m) - Math.log1p(rf)]);
  });
  const dates = [...quarters.keys()].filter((quarter) => quarters.get(quarter)!.length === 3);
  return { dates, r: dates.map((quarter) => quarters.get(quarter)!.reduce((sum, value) => sum + value, 0)) };
}
