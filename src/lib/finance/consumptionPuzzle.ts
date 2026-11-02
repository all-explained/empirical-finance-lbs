/**
 * Consumption samples and the lognormal consumption CAPM behind the equity premium and risk-free rate puzzles
 * (Chapters 35–36). Every rate is a decimal log real rate per period: Δc_t, the market's r_t, r^f_t and r^e_t.
 * Consumption is NIPA nondurables and services, the measure of the classic Euler-equation tests
 * (Ludvigson 2013, working paper of January 2012, pdf p. 12).
 *
 * Lognormal pricing. Take M_{t+1} = δ e^{−γ Δc_{t+1}} and let Δc_{t+1} and the log return r_{i,t+1} be jointly
 * normal with constant moments: mean μ_c and variance σ_c² of Δc, variance σ_i² of r_i, covariance σ_ic.
 * For a normal x, E[e^x] = e^{E x + Var(x)/2}, so E_t[M_{t+1}(1 + R_{i,t+1})] = 1 becomes
 *   log δ − γ μ_c + E[r_i] + ½(γ² σ_c² + σ_i² − 2γ σ_ic) = 0.
 * A riskless asset has σ_i = σ_ic = 0, so r^f = −log δ + γ μ_c − ½ γ² σ_c².
 * Subtracting the two: E[r_i − r^f] + ½ σ_i² = γ σ_ic.
 * M itself is lognormal, so E[M] = δ e^{−γ μ_c + ½ γ² σ_c²} = e^{−r^f} and σ(M)/E[M] = √(e^{γ² σ_c²} − 1) ≈ γ σ_c.
 * The data replace the constant moments by sample moments. Ludvigson (2013, pdf p. 22) notes that consumption
 * and returns are not jointly lognormal in the data, so these formulas are an approximation.
 */
import { getColumn, type ColumnName, type Series } from '../data/series';
import { annualiseMean, annualiseSharpe, annualiseVolatility, sharpeRatio } from '../stats/moments';
import { cayInputs, quarterlyExcessReturns } from './cay';
import { sampleCovariance } from './portfolio';
import { arithmeticMean, sampleVariance } from './returns';

function requireFinite(...values: number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('Expected finite numbers');
}

/** Log real consumption per person c_t and its growth Δc_t = c_t − c_{t−1}, from the second year on. */
export interface Consumption {
  /** Year start dates, as in `fred-consumption-annual`. */
  dates: string[];
  c: number[];
  dc: number[];
}

/** c_t from `fred-consumption-annual`, built as `cayInputs` builds it from the quarterly data: nondurables and
 * services, each deflated by its own chain-type price index (2017 = 100), added, then divided by population.
 * Units are 2017 dollars per person. The first year has no growth and is dropped, so the extract gives 1930–2025.
 */
export function annualConsumption(series: Series<'fred-consumption-annual'>): Consumption {
  const column = (name: ColumnName<'fred-consumption-annual'>) =>
    getColumn(series, name).map((value) => value as number);
  const nondurables = column('PCNDA');
  const services = column('PCESVA');
  const nondurablesPrice = column('DNDGRG3A086NBEA');
  const servicesPrice = column('DSERRG3A086NBEA');
  const population = column('B230RC0A052NBEA');
  // Billions of dollars over thousands of persons, in dollars per person.
  const c = series.rows.map((_, t) => Math.log(
    ((nondurables[t] / nondurablesPrice[t] + services[t] / servicesPrice[t]) * 100 * 1e9) / (population[t] * 1e3)));
  return {
    dates: series.rows.slice(1).map(([date]) => date),
    c: c.slice(1),
    dc: c.slice(1).map((value, t) => value - c[t]),
  };
}

/** Matched series by period: consumption growth Δc, the log real market return r, the log real risk-free
 * rate r^f and the log excess return r^e = r − r^f. dates are the periods of the returns.
 */
export interface ConsumptionSample {
  dates: string[];
  dc: number[];
  r: number[];
  rf: number[];
  re: number[];
}

/** Which consumption growth goes with the return of year t. */
export type AnnualTiming = 'same-year' | 'next-year';

export interface AnnualSampleOptions {
  /** First return year; by default every common year. 1947 gives the postwar sample. */
  start?: number;
  timing?: AnnualTiming;
}

/**
 * Year-by-year Δc, r = log(1 + CRSP_SPvw) − log(1 + infl), r^f = log(1 + Rfree) − log(1 + infl) and
 * r^e = r − r^f, over the years both extracts cover.
 *
 * Timing. NIPA consumption of year t is the average flow over the year, so c_t sits near the middle of year t,
 * while the return of year t runs from the end of year t − 1 to the end of year t. Δc_t spans the middle of
 * t − 1 to the middle of t, and Δc_{t+1} the middle of t to the middle of t + 1: each overlaps half the return year.
 * - 'same-year', the default, pairs the return of year t with Δc_t. It dates consumption of year t at the end of
 *   the year, as the Euler equation dates R_{t+1} and Δc_{t+1} together, and it is the pairing of
 *   `quarterlySample` and of the quarterly panel of Chapters 22, 26 and 33.
 * - 'next-year' pairs it with Δc_{t+1}, dating consumption of year t at its start.
 * On the committed data both use Δc of 1930–2025: 'same-year' with the returns of 1930–2025, 'next-year' with
 * those of 1929–2024. 'next-year' raises the correlation of Δc with r from 0.07 to 0.53, which cuts the
 * covariance-implied γ from about 270 to about 36.
 */
export function annualSample(
  consumption: Consumption, goyalWelch: Series<'goyal-welch-annual'>, options: AnnualSampleOptions = {},
): ConsumptionSample {
  const { start = -Infinity, timing = 'same-year' } = options;
  const growth = new Map(consumption.dates.map((date, t) => [Number(date.slice(0, 4)), consumption.dc[t]]));
  const market = getColumn(goyalWelch, 'CRSP_SPvw');
  const riskFree = getColumn(goyalWelch, 'Rfree');
  const inflation = getColumn(goyalWelch, 'infl');
  const sample: ConsumptionSample = { dates: [], dc: [], r: [], rf: [], re: [] };
  goyalWelch.rows.forEach(([date], t) => {
    const year = Number(date.slice(0, 4));
    const dc = growth.get(timing === 'same-year' ? year : year + 1);
    const [m, rf, infl] = [market[t], riskFree[t], inflation[t]];
    if (year < start || dc === undefined || m == null || rf == null || infl == null) return;
    sample.dates.push(date);
    sample.dc.push(dc);
    sample.r.push(Math.log1p(m) - Math.log1p(infl));
    sample.rf.push(Math.log1p(rf) - Math.log1p(infl));
    sample.re.push(Math.log1p(m) - Math.log1p(rf));
  });
  return sample;
}

/**
 * The same four series by quarter: Δc_t = c_t − c_{t−1} from `cayInputs`, paired with the returns of quarter t,
 * from 1952-Q2 (`cayInputs` starts in 1952-Q1, the first growth is the next quarter) to the last quarter both
 * extracts cover. r^e is `quarterlyExcessReturns`, the quarter's sum of log(1 + CRSP_SPvw) − log(1 + Rfree).
 * r^f is the same function fed Rfree in place of CRSP_SPvw and infl in place of Rfree, so it sums
 * log(1 + Rfree) − log(1 + infl) over the quarter's three months; r = r^e + r^f.
 */
export function quarterlySample(cay: Series<'fred-cay-quarterly'>, goyalWelch: Series<'goyal-welch-monthly'>): ConsumptionSample {
  const inputs = cayInputs(cay);
  const excess = quarterlyExcessReturns(goyalWelch);
  const index = (name: string) => goyalWelch.columns.findIndex((column) => column.name === name);
  const [market, riskFree, inflation] = [index('CRSP_SPvw'), index('Rfree'), index('infl')];
  const realRiskFree = quarterlyExcessReturns({
    ...goyalWelch,
    rows: goyalWelch.rows.map((row) => row.map((value, j) => (
      j === market ? row[riskFree] : j === riskFree ? row[inflation] : value)) as unknown as typeof row),
  });
  const re = new Map(excess.dates.map((date, t) => [date, excess.r[t]]));
  const rf = new Map(realRiskFree.dates.map((date, t) => [date, realRiskFree.r[t]]));
  const sample: ConsumptionSample = { dates: [], dc: [], r: [], rf: [], re: [] };
  inputs.dates.forEach((date, j) => {
    const [e, f] = [re.get(date), rf.get(date)];
    if (j === 0 || e === undefined || f === undefined) return;
    sample.dates.push(date);
    sample.dc.push(inputs.c[j] - inputs.c[j - 1]);
    sample.r.push(e + f);
    sample.rf.push(f);
    sample.re.push(e);
  });
  return sample;
}

type SampleSeries = 'dc' | 'r' | 'rf' | 're';

export interface PuzzleMoments {
  /** Sample means: mean.dc is μ_c, mean.rf the mean real risk-free rate, mean.re the equity premium E[r − r^f]. */
  mean: Record<SampleSeries, number>;
  /** Standard deviations (divisor T − 1): sd.dc is σ_c, sd.r is σ_i of the market. */
  sd: Record<SampleSeries, number>;
  /** σ_ic = Cov(r, Δc), divisor T − 1. */
  sigmaIC: number;
  /** Correlation of Δc with r; the same per period and annualised. */
  correlation: number;
  /** Sharpe ratio of the log excess return, mean.re / sd.re. */
  sharpe: number;
}

/** Puzzle moments per period and annualised: means and σ_ic times k, standard deviations and the Sharpe ratio
 * times √k, with k = periodsPerYear (1 for annual data, 4 for quarterly).
 */
export function puzzleMoments(sample: ConsumptionSample, periodsPerYear: number): {
  observations: number; perPeriod: PuzzleMoments; annual: PuzzleMoments;
} {
  const keys: SampleSeries[] = ['dc', 'r', 'rf', 're'];
  const map = (f: (key: SampleSeries) => number) =>
    Object.fromEntries(keys.map((key) => [key, f(key)])) as Record<SampleSeries, number>;
  const mean = map((key) => arithmeticMean(sample[key]));
  const sd = map((key) => Math.sqrt(sampleVariance(sample[key])));
  const sigmaIC = sampleCovariance(sample.dc.map((dc, t) => [dc, sample.r[t]]))[0][1];
  const perPeriod: PuzzleMoments = {
    mean, sd, sigmaIC, correlation: sigmaIC / (sd.dc * sd.r), sharpe: sharpeRatio(sample.re),
  };
  return {
    observations: sample.dates.length,
    perPeriod,
    annual: {
      // A covariance, like a mean, adds up over the k periods of a year.
      mean: map((key) => annualiseMean(mean[key], periodsPerYear)),
      sd: map((key) => annualiseVolatility(sd[key], periodsPerYear)),
      sigmaIC: annualiseMean(sigmaIC, periodsPerYear),
      correlation: perPeriod.correlation,
      sharpe: annualiseSharpe(perPeriod.sharpe, periodsPerYear),
    },
  };
}

/**
 * Risk aversion that prices the equity premium, two ways; both are the same per period and annualised.
 * - fromCovariance: γ = (E[r − r^f] + ½ σ_i²)/σ_ic, the lognormal Euler equation of the market.
 * - fromSharpe: γ ≈ SR/σ_c. The HJ bound SR ≤ σ(M)/E[M] ≈ γ σ_c holds with equality when Δc and r are perfectly
 *   correlated, so this is the lowest γ that power utility can work with. Campbell (2014, working paper,
 *   pdf p. 10) puts the market SR at 0.4 and σ_c near 0.01, which needs γ on the order of 40.
 */
export function impliedRiskAversion(moments: PuzzleMoments): { fromCovariance: number; fromSharpe: number } {
  return {
    fromCovariance: (moments.mean.re + moments.sd.r ** 2 / 2) / moments.sigmaIC,
    fromSharpe: moments.sharpe / moments.sd.dc,
  };
}

function requireLognormal(gamma: number, mean: number, sd: number): void {
  requireFinite(gamma, mean, sd);
  if (sd < 0) throw new RangeError('σ_c must be nonnegative');
}

/** Log risk-free rate r^f = −log δ + γ μ_c − ½ γ² σ_c², per period of δ, μ_c and σ_c. */
export function impliedRiskFree(delta: number, gamma: number, mean: number, sd: number): number {
  requireLognormal(gamma, mean, sd);
  requireFinite(delta);
  if (delta <= 0) throw new RangeError('Time discount factor must be positive');
  return -Math.log(delta) + gamma * mean - (gamma * sd) ** 2 / 2;
}

/** The δ that gives the log risk-free rate r^f: δ = e^{−r^f + γ μ_c − ½ γ² σ_c²}. Above one is the risk-free rate puzzle. */
export function impliedTimeDiscount(riskFree: number, gamma: number, mean: number, sd: number): number {
  requireLognormal(gamma, mean, sd);
  requireFinite(riskFree);
  return Math.exp(-riskFree + gamma * mean - (gamma * sd) ** 2 / 2);
}

/** Exact E[M], σ(M) and σ(M)/E[M] = √(e^{γ² σ_c²} − 1) of M = δ e^{−γ Δc} with Δc ~ N(μ_c, σ_c²). */
export function crraSdfMoments(delta: number, gamma: number, mean: number, sd: number): {
  mean: number; sd: number; ratio: number;
} {
  const sdfMean = Math.exp(-impliedRiskFree(delta, gamma, mean, sd));
  const ratio = Math.sqrt(Math.expm1((gamma * sd) ** 2));
  return { mean: sdfMean, sd: sdfMean * ratio, ratio };
}

/** The curve (E[M], σ(M)) of power utility as γ runs over gammas, for the `HJBound` preset of Chapter 35. */
export function crraHjPath(gammas: readonly number[], delta: number, mean: number, sd: number): {
  gamma: number; mean: number; sd: number;
}[] {
  return gammas.map((gamma) => {
    const moments = crraSdfMoments(delta, gamma, mean, sd);
    return { gamma, mean: moments.mean, sd: moments.sd };
  });
}
