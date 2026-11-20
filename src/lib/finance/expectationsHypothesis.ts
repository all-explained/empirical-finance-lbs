/**
 * Tests of the expectations hypothesis for Chapter 41: the Campbell–Shiller yield-change and perfect-foresight
 * regressions, the Fama–Bliss forward-spread regressions, and a seeded world where the hypothesis holds.
 *
 * Units and timing follow `bonds.ts`: decimal log rates per year, one period is one year, the data are monthly, so
 * "t + 1" is the month twelve months after t, found by calendar month. Consecutive monthly observations of a
 * one-year change overlap by eleven months. Standard errors are Hansen–Hodrick with 12 lags by default, as the
 * "HH, 12 lags" row of Cochrane and Piazzesi's Table 1 (2005, AER 95(1), p. 143; pdf p. 6), with Newey–West and 18
 * lags, their "NW, 18 lags" row, as the option. Limit: the lags count rows, and `gsw-zero-coupon` skips eleven
 * months, so a lag that spans a skipped month reaches one month further back than it says.
 *
 * The hypothesis, with a constant term premium tp^(n) for each maturity (Campbell and Shiller, 1991, RES, eq. 1;
 * working-paper pdf p. 6):
 *   y^(n)_t = (1/n) Σ_{j=0}^{n-1} E_t y^(1)_{t+j} + tp^(n).
 * Each regression below states the slope it implies. Campbell and Shiller test the first two (eq. 2, pdf p. 8, and
 * eq. 3, pdf pp. 8–9); Cochrane and Piazzesi update the third, after Fama and Bliss (1987) (pdf p. 8, Table 2).
 */
import { mulberry32, normalRng } from '../math/rng';
import { ols } from '../stats/ols';
import { quantile } from '../stats/stambaugh';
import { sampleCovariance } from './portfolio';
import { fitAR1 } from './predictive';
import { forwardRates, holdingReturns, perfectForesightYield, type YieldCurve } from './bonds';

export interface HypothesisOptions {
  /** Hansen–Hodrick (default) or Newey–West standard errors. */
  errors?: 'hansen-hodrick' | 'newey-west';
  /**
   * Lags of the standard errors. Default: the horizon in observations for Hansen–Hodrick (12 per year of horizon on
   * monthly data, Cochrane and Piazzesi's 12 for one year) and 1.5 times that for Newey–West (their 18).
   */
  lags?: number;
  /**
   * Keep only the observations dated in this calendar month (1–12): one per year, so one-year changes no longer
   * overlap. The default lags then count years. Left out, every month is used.
   */
  annualMonth?: number;
}

/** One maturity's regression y = a + b x + ε, with b the slope the hypothesis tests. */
export interface HypothesisRegression {
  /** Maturity in years. */
  n: number;
  slope: number;
  intercept: number;
  standardError: number;
  /** t-statistic of the slope against 0. */
  tStat: number;
  /** t-statistic of the slope against 1. */
  tStatOne: number;
  /** The slope the expectations hypothesis implies: 1 or 0. */
  hypothesis: number;
  r2: number;
  nobs: number;
  lags: number;
  /** Date t of each observation. */
  dates: string[];
  /** (x_t, y_{t+h}) for a scatter, in the order of `dates`. */
  points: { x: number; y: number }[];
}

interface Observation {
  date: string;
  x: number;
  y: number;
}

function checkPair(curve: YieldCurve, n: number): void {
  const N = curve.maturities.length;
  if (!Number.isInteger(n) || n < 2 || n > N) throw new RangeError(`Maturity must be an integer from 2 to ${N}`);
}

/** Row of each date. */
function rowOf(curve: YieldCurve): Map<string, number> {
  return new Map(curve.dates.map((date, t) => [date, t]));
}

/**
 * For each row, the row of the same calendar month `years` later, if the curve has it. Only that month is needed, not
 * the ones between. `bonds.ts` keeps its own month matching private, so this one shifts the year of "YYYY-MM".
 */
function yearsLater(curve: YieldCurve, years: number): Map<number, number> {
  const month = (date: string, shift: number) => `${Number(date.slice(0, 4)) + shift}${date.slice(4, 7)}`;
  const byMonth = new Map(curve.dates.map((date, t) => [month(date, 0), t]));
  const later = new Map<number, number>();
  curve.dates.forEach((date, t) => {
    const s = byMonth.get(month(date, years));
    if (s !== undefined) later.set(t, s);
  });
  return later;
}

/** The observations a regression keeps under `annualMonth`. */
function select(observations: Observation[], annualMonth: number | undefined): Observation[] {
  if (annualMonth === undefined) return observations;
  if (!(Number.isInteger(annualMonth) && annualMonth >= 1 && annualMonth <= 12)) {
    throw new RangeError('annualMonth must be an integer from 1 to 12');
  }
  return observations.filter(({ date }) => Number(date.slice(5, 7)) === annualMonth);
}

/**
 * Each regression: its observations at maturity n, the horizon of its left-hand side in years, which sets the
 * default lags, and the slope the hypothesis implies.
 */
interface RegressionSpec {
  observations: (curve: YieldCurve, n: number) => Observation[];
  horizon: (n: number) => number;
  hypothesis: number;
}

/**
 * Yield change: y = y^(n-1)_{t+1} - y^(n)_t, x = sp^(n)_t / (n - 1), sp^(n)_t = y^(n)_t - y^(1)_t
 * (Campbell and Shiller, eq. 2, pdf p. 8; the curriculum's Key math). Why b_Δy = 1: the hypothesis at n and at n - 1
 * one year later gives n y^(n)_t - (n - 1) E_t y^(n-1)_{t+1} = y^(1)_t + n tp^(n) - (n - 1) tp^(n-1); subtract
 * (n - 1) y^(n)_t, divide by n - 1, and E_t y^(n-1)_{t+1} - y^(n)_t is sp^(n)_t / (n - 1) plus a constant. A high
 * spread means the long yield should rise, so that the capital loss offsets its higher yield.
 */
const yieldChange: RegressionSpec = {
  observations: (curve, n) => {
    const row = rowOf(curve);
    return holdingReturns(curve, n).map(({ date, sold }) => {
      const [now, later] = [curve.y[row.get(date) as number], curve.y[row.get(sold) as number]];
      return { date, x: (now[n - 1] - now[0]) / (n - 1), y: later[n - 2] - now[n - 1] };
    });
  },
  horizon: () => 1,
  hypothesis: 1,
};

/**
 * Perfect foresight: y = pfs^(n)_t = (1/n) Σ_{j=0}^{n-1} y^(1)_{t+j} - y^(1)_t, x = sp^(n)_t (Campbell and Shiller,
 * eq. 3, pdf pp. 8–9), with the realised short rates of `perfectForesightYield`; pfs^(n)_t = sp^(n)_t - tp^(n)_t ex
 * post. Under the hypothesis pfs^(n)_t - sp^(n)_t is a constant minus the error in forecasting the short rates, which
 * is not predictable at t, so b_pfs = 1. The left-hand side spans n - 1 years.
 */
const perfectForesight: RegressionSpec = {
  observations: (curve, n) => {
    const row = rowOf(curve);
    return perfectForesightYield(curve, n).map(({ date, y, perfectForesight: pf }) => {
      const short = curve.y[row.get(date) as number][0];
      return { date, x: y - short, y: pf - short };
    });
  },
  horizon: (n) => n - 1,
  hypothesis: 1,
};

/** f^(n)_t - y^(1)_t at each row. */
function forwardSpread(curve: YieldCurve, n: number): number[] {
  return forwardRates(curve).map((f, t) => f[n - 1] - curve.y[t][0]);
}

/**
 * Excess return: y = rx^(n)_{t+1}, x = f^(n)_t - y^(1)_t (Fama and Bliss, as updated by Cochrane and Piazzesi, pdf
 * p. 8, Table 2). Under the hypothesis E_t rx^(n)_{t+1} = n tp^(n) - (n - 1) tp^(n-1), a constant, so b_rx = 0.
 */
const excessReturn: RegressionSpec = {
  observations: (curve, n) => {
    const row = rowOf(curve);
    const spread = forwardSpread(curve, n);
    return holdingReturns(curve, n).map(({ date, rx }) => ({ date, x: spread[row.get(date) as number], y: rx }));
  },
  horizon: () => 1,
  hypothesis: 0,
};

/**
 * Short-rate change: y = y^(1)_{t+n-1} - y^(1)_t, x = f^(n)_t - y^(1)_t. Under the hypothesis
 * f^(n)_t = n y^(n)_t - (n - 1) y^(n-1)_t = E_t y^(1)_{t+n-1} + a constant, so b_Δy(1) = 1. It spans n - 1 years.
 */
const shortRateChange: RegressionSpec = {
  observations: (curve, n) => {
    const spread = forwardSpread(curve, n);
    const later = yearsLater(curve, n - 1);
    return curve.dates.flatMap((date, t) => {
      const s = later.get(t);
      return s === undefined ? [] : [{ date, x: spread[t], y: curve.y[s][0] - curve.y[t][0] }];
    });
  },
  horizon: (n) => n - 1,
  hypothesis: 1,
};

export type HypothesisRegressionName = 'yieldChange' | 'perfectForesight' | 'excessReturn' | 'shortRateChange';

const SPECS: Record<HypothesisRegressionName, RegressionSpec> = {
  yieldChange, perfectForesight, excessReturn, shortRateChange,
};

function specOf(regression: HypothesisRegressionName): RegressionSpec {
  const spec = SPECS[regression];
  if (!spec) throw new RangeError(`Unknown regression ${String(regression)}`);
  return spec;
}

/** OLS of y on x with an intercept and the standard errors of `options`. */
function regress(
  spec: RegressionSpec, curve: YieldCurve, n: number, options: HypothesisOptions,
): HypothesisRegression {
  checkPair(curve, n);
  const { errors = 'hansen-hodrick', annualMonth } = options;
  if (errors !== 'hansen-hodrick' && errors !== 'newey-west') throw new RangeError('Unknown standard errors');
  const kept = select(spec.observations(curve, n), annualMonth);
  const perYear = annualMonth === undefined ? 12 : 1;
  const lags = options.lags ?? Math.round(spec.horizon(n) * perYear * (errors === 'newey-west' ? 1.5 : 1));
  const fit = ols(kept.map(({ y }) => y), [kept.map(({ x }) => x)], { errors, lags });
  const [intercept, slope] = fit.coefficients;
  const standardError = fit.standardErrors[1];
  return {
    n, slope, intercept, standardError, tStat: slope / standardError, tStatOne: (slope - 1) / standardError,
    hypothesis: spec.hypothesis, r2: fit.r2, nobs: fit.nobs, lags,
    dates: kept.map(({ date }) => date), points: kept.map(({ x, y }) => ({ x, y })),
  };
}

/**
 * The yield change of the n-year bond over a year on its predicted change, slope 1 under the hypothesis
 * (Campbell and Shiller, eq. 2):
 *   y^(n-1)_{t+1} - y^(n)_t = a + b_Δy sp^(n)_t / (n - 1) + ε_{t+1}.
 */
export function yieldChangeRegression(curve: YieldCurve, n: number, options: HypothesisOptions = {}): HypothesisRegression {
  return regress(yieldChange, curve, n, options);
}

/**
 * The perfect-foresight spread on the actual spread, slope 1 under the hypothesis (Campbell and Shiller, eq. 3):
 *   pfs^(n)_t = a + b_pfs sp^(n)_t + ε.
 * Its left-hand side spans n - 1 years, so the default lags are those of an (n - 1)-year horizon.
 */
export function perfectForesightRegression(
  curve: YieldCurve, n: number, options: HypothesisOptions = {},
): HypothesisRegression {
  return regress(perfectForesight, curve, n, options);
}

export interface ForwardSpreadRegressions {
  /** rx^(n)_{t+1} on f^(n)_t - y^(1)_t: slope 0 under the hypothesis. */
  excessReturn: HypothesisRegression;
  /** y^(1)_{t+n-1} - y^(1)_t on f^(n)_t - y^(1)_t: slope 1 under the hypothesis. */
  shortRateChange: HypothesisRegression;
}

/**
 * The two Fama–Bliss regressions on the forward spread:
 *   rx^(n)_{t+1} = a + b_rx (f^(n)_t - y^(1)_t) + ε,   y^(1)_{t+n-1} - y^(1)_t = a + b_Δy(1) (f^(n)_t - y^(1)_t) + ε.
 *
 * For n = 2 the slopes sum to 1: f^(2)_t = 2 y^(2)_t - y^(1)_t and rx^(2)_{t+1} = 2 y^(2)_t - y^(1)_{t+1} - y^(1)_t, so
 *   rx^(2)_{t+1} + (y^(1)_{t+1} - y^(1)_t) = f^(2)_t - y^(1)_t
 * on the same months. OLS is linear in the left-hand side, so the two slopes add up to the slope of the regressor on
 * itself, 1, whatever the data. For n > 2 the change spans n - 1 years and the identity does not hold.
 */
export function forwardSpreadRegression(
  curve: YieldCurve, n: number, options: HypothesisOptions = {},
): ForwardSpreadRegressions {
  return {
    excessReturn: regress(excessReturn, curve, n, options),
    shortRateChange: regress(shortRateChange, curve, n, options),
  };
}

/** One regression at each maturity, in the order given; each result carries the slope the hypothesis implies. */
export function slopesByMaturity(
  curve: YieldCurve, regression: HypothesisRegressionName, maturities: readonly number[],
  options: HypothesisOptions = {},
): HypothesisRegression[] {
  const spec = specOf(regression);
  return maturities.map((n) => regress(spec, curve, n, options));
}

/** A zero-mean monthly AR(1), z_{t+1} = φ z_t + σ ε_{t+1}. */
export interface MonthlyAR1 {
  phi: number;
  sigma: number;
}

/**
 * A world where long yields are priced from a monthly AR(1) short rate. With the weight
 * φ̄^(n)_y = (1/n) Σ_{j=0}^{n-1} φ_y^{12j} = (1 - φ_y^{12n}) / (n (1 - φ_y^12)), the n-year yield is
 *   y^(n)_t = μ_y + φ̄^(n)_y (y^(1)_t - μ_y) + tp^(n) + (1 - 1/n) tp_t,
 * where tp^(n) is the constant term premium and tp_t its moving part, zero when `movingPremium` is left out. The
 * weight 1 - 1/n keeps the one-year yield free of the moving premium.
 */
export interface ExpectationsWorld {
  /** μ_y, φ_y, σ_y: the one-year yield follows y^(1)_{t+1} - μ_y = φ_y (y^(1)_t - μ_y) + σ_y ε_{t+1}, monthly. */
  shortRate: MonthlyAR1 & { mean: number };
  /** tp^(1), …, tp^(N): the constant term premium of each maturity, with tp^(1) = 0. Its length sets N. */
  constantPremium: number[];
  /** φ_tp, σ_tp of tp_t, independent of the short rate. Left out, the hypothesis holds exactly. */
  movingPremium?: MonthlyAR1;
}

/**
 * The world fitted to a curve: the AR(1) of the monthly one-year yield from `fitAR1`, μ_y = intercept / (1 - φ_y),
 * and tp^(n) = mean y^(n)_t - mean y^(1)_t over the curve's dates. No moving premium. Limit: `fitAR1` pairs
 * consecutive rows, so across a skipped month of `gsw-zero-coupon` it pairs months two apart.
 */
export function fitExpectationsWorld(curve: YieldCurve): ExpectationsWorld {
  checkPair(curve, 2);
  const { phi, intercept, residualStd } = fitAR1(curve.y.map((row) => row[0]));
  const mean = (n: number) => curve.y.reduce((sum, row) => sum + row[n - 1], 0) / curve.y.length;
  return {
    shortRate: { mean: intercept / (1 - phi), phi, sigma: residualStd },
    constantPremium: curve.maturities.map((n) => mean(n) - mean(1)),
  };
}

function checkWorld(world: ExpectationsWorld): void {
  const { shortRate, constantPremium, movingPremium } = world;
  for (const ar of movingPremium ? [shortRate, movingPremium] : [shortRate]) {
    if (!(Math.abs(ar.phi) < 1) || !(ar.sigma >= 0)) throw new RangeError('Each AR(1) needs |φ| < 1 and σ ≥ 0');
  }
  if (constantPremium.length < 2 || constantPremium[0] !== 0) {
    throw new RangeError('constantPremium needs at least two maturities and tp^(1) = 0');
  }
}

/** φ̄^(n)_y = (1/n) Σ_{j=0}^{n-1} a^j with a = φ_y^12: the weight of today's short-rate deviation in the n-year yield. */
function averageWeight(a: number, n: number): number {
  return (1 - a ** n) / (n * (1 - a));
}

/** Synthetic month-end dates from 2000-01; only their calendar months matter. */
const FIRST_YEAR = 2000;
const MAX_MONTHS = (10000 - FIRST_YEAR) * 12;
const syntheticDates: string[] = [];

/**
 * The first `months` synthetic dates. The strings are built once and shared by every path, which keeps the
 * calendar matching of `bonds.ts` fast in `slopeDistribution`: a string reused as a key keeps its cached hash.
 */
function datesFor(months: number): string[] {
  for (let t = syntheticDates.length; t < months; t++) {
    syntheticDates.push(`${FIRST_YEAR + Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}-28`);
  }
  return syntheticDates.slice(0, months);
}

export interface SimulationOptions {
  /** Number of monthly dates, at most 96,000 (dates run to the year 9999). */
  months: number;
}

/**
 * A seeded monthly path of the world's curve on maturities 1, …, N, in the shape `gswCurve` returns, so every
 * regression above runs on it unchanged. The short rate and tp_t start from their stationary distributions; the
 * moving premium draws from its own stream, `normalRng(seed + 1)`, so turning it on leaves the short-rate path as
 * it was. E_t y^(1)_{t+j} = μ_y + φ_y^{12j} (y^(1)_t - μ_y) for j years ahead gives the closed form of
 * `ExpectationsWorld`. With a moving premium the hypothesis fails: the expected excess return moves with tp_t.
 */
export function simulateExpectationsWorld(
  seed: number, world: ExpectationsWorld, options: SimulationOptions,
): YieldCurve {
  checkWorld(world);
  const { months } = options;
  if (!Number.isInteger(months) || months < 2 || months > MAX_MONTHS) {
    throw new RangeError(`months must be an integer from 2 to ${MAX_MONTHS}`);
  }
  const { shortRate, constantPremium, movingPremium = { phi: 0, sigma: 0 } } = world;
  const a = shortRate.phi ** 12;
  const weights = constantPremium.map((_, i) => averageWeight(a, i + 1));
  const shocks = normalRng(seed);
  const premiumShocks = normalRng(seed + 1);
  let s = (shortRate.sigma / Math.sqrt(1 - shortRate.phi ** 2)) * shocks();
  let tp = (movingPremium.sigma / Math.sqrt(1 - movingPremium.phi ** 2)) * premiumShocks();
  const y: number[][] = [];
  for (let t = 0; t < months; t++) {
    if (t > 0) {
      s = shortRate.phi * s + shortRate.sigma * shocks();
      tp = movingPremium.phi * tp + movingPremium.sigma * premiumShocks();
    }
    y.push(weights.map((A, i) => shortRate.mean + A * s + constantPremium[i] + (1 - 1 / (i + 1)) * tp));
  }
  return { dates: datesFor(months), maturities: constantPremium.map((_, i) => i + 1), y };
}

/**
 * The population slope b_Δy of `yieldChangeRegression` in the world. From the closed form of `ExpectationsWorld`, up
 * to constants, with ỹ_t = y^(1)_t - μ_y:
 *   (n - 1) x_t = (φ̄^(n)_y - 1) ỹ_t + (1 - 1/n) tp_t,
 *   y_{t+1}     = φ̄^(n-1)_y ỹ_{t+1} - φ̄^(n)_y ỹ_t + (1 - 1/(n - 1)) tp_{t+1} - (1 - 1/n) tp_t.
 * A year apart, Cov(ỹ_{t+1}, ỹ_t) = φ_y^12 Var(ỹ_t) and Cov(tp_{t+1}, tp_t) = φ_tp^12 Var(tp_t), the two independent,
 * with Var(ỹ_t) = σ_y² / (1 - φ_y²) and Var(tp_t) = σ_tp² / (1 - φ_tp²). So b_Δy = (n - 1) Cov / Var with
 *   Cov = (φ_y^12 φ̄^(n-1)_y - φ̄^(n)_y)(φ̄^(n)_y - 1) Var(ỹ_t) + (φ_tp^12 (1 - 1/(n - 1)) - (1 - 1/n))(1 - 1/n) Var(tp_t),
 *   Var = (φ̄^(n)_y - 1)² Var(ỹ_t) + (1 - 1/n)² Var(tp_t).
 * Without the moving premium Var(tp_t) = 0, and n φ̄^(n)_y = 1 + φ_y^12 (n - 1) φ̄^(n-1)_y gives
 * (n - 1)(φ_y^12 φ̄^(n-1)_y - φ̄^(n)_y) = φ̄^(n)_y - 1, so b_Δy = 1. The premium adds a negative term to Cov: the slope
 * falls below 1, and it turns negative when tp_t moves enough relative to the short rate (it tends to -1 at n = 2).
 */
export function populationSlope(world: ExpectationsWorld, n: number): number {
  checkWorld(world);
  if (!Number.isInteger(n) || n < 2) throw new RangeError('Maturity must be an integer of at least 2');
  const { shortRate, movingPremium = { phi: 0, sigma: 0 } } = world;
  const [a, c] = [shortRate.phi ** 12, movingPremium.phi ** 12];
  const varShort = shortRate.sigma ** 2 / (1 - shortRate.phi ** 2);
  const varPremium = movingPremium.sigma ** 2 / (1 - movingPremium.phi ** 2);
  const [weight, weightPrev] = [averageWeight(a, n), averageWeight(a, n - 1)];
  const [loading, loadingPrev] = [1 - 1 / n, 1 - 1 / (n - 1)];
  const covariance = (a * weightPrev - weight) * (weight - 1) * varShort + (c * loadingPrev - loading) * loading * varPremium;
  return ((n - 1) * covariance) / ((weight - 1) ** 2 * varShort + loading ** 2 * varPremium);
}

export interface SlopeDistributionOptions {
  /** Months in each sample: the length of the data. */
  months: number;
  /**
   * Number of samples. Default 500: one call on samples of our 479 months takes about 0.14 s on an Apple M2 Pro,
   * fast enough for a widget button. Campbell and Shiller ran 1,000.
   */
  samples?: number;
  /** The regression to repeat. Default 'yieldChange'. */
  regression?: HypothesisRegressionName;
  /** As in `HypothesisOptions`: one observation per year, in this calendar month. */
  annualMonth?: number;
  /** The slope in the data; its share is reported when it is given. */
  observed?: number;
}

export interface SlopeDistribution {
  /** One slope per sample, in draw order. */
  slopes: number[];
  /** Type-7 quantiles of the slopes at p = 0.05, 0.25, 0.5, 0.75, 0.95. */
  quantiles: { p: number; value: number }[];
  /** Share of samples whose slope is at or below `observed`, or null without it. */
  shareAtOrBelow: number | null;
}

const PROBABILITIES = [0.05, 0.25, 0.5, 0.75, 0.95];

/**
 * The slopes of `samples` seeded samples of the world, each `months` long, as Campbell and Shiller's Monte Carlo
 * (pdf pp. 20–22): artificial data that obey the hypothesis in population but not in each sample, and the share of
 * runs whose slope is at or below the data's. For a data slope below 1 that is their first number under each slope
 * in Table 1a (pdf pp. 28–29), the share of runs further from 1 in the same direction. They feed a VAR fitted to
 * the data; here the world is the AR(1) of `ExpectationsWorld`. Each sample
 * simulates only the maturities up to n and computes only the slope, Cov(x, y) / Var(x) from `sampleCovariance`, the
 * OLS slope of the regression's own observations without its standard errors. Sample i draws from a seed that
 * depends only on `seed` and i, so changing the world reshapes the same samples.
 */
export function slopeDistribution(
  seed: number, world: ExpectationsWorld, n: number, options: SlopeDistributionOptions,
): SlopeDistribution {
  const { months, samples = 500, regression = 'yieldChange', annualMonth, observed } = options;
  if (!Number.isSafeInteger(samples) || samples < 1) throw new RangeError('samples must be a positive integer');
  if (!Number.isInteger(n) || n < 2 || n > world.constantPremium.length) {
    throw new RangeError(`Maturity must be an integer from 2 to ${world.constantPremium.length}`);
  }
  const spec = specOf(regression);
  const truncated = { ...world, constantPremium: world.constantPremium.slice(0, n) };
  const seeds = mulberry32(seed);
  const slopes = Array.from({ length: samples }, () => {
    const curve = simulateExpectationsWorld(Math.floor(seeds() * 2 ** 32), truncated, { months });
    const [[varX, covXY]] = sampleCovariance(select(spec.observations(curve, n), annualMonth).map(({ x, y }) => [x, y]));
    return covXY / varX;
  });
  return {
    slopes,
    quantiles: PROBABILITIES.map((p) => ({ p, value: quantile(slopes, p) })),
    shareAtOrBelow: observed === undefined ? null : slopes.filter((b) => b <= observed).length / samples,
  };
}
