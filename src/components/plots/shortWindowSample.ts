import { getColumn, loadSeries, type Series } from '../../lib/data/series';
import { arithmeticMean, sampleVariance } from '../../lib/finance/returns';
import { conditionalAlphaSummary, dailyFactorPanel, rollingBetas, shortWindowRegressions } from '../../lib/finance/shortWindow';
import { invCdf } from '../../lib/math/normal';
import { annualiseMean } from '../../lib/stats/moments';
import { ols } from '../../lib/stats/ols';
import { useLoaded } from './seriesSample';

export type Factor = 'HML' | 'Mom';
export const FACTORS: { value: Factor; label: string }[] = [
  { value: 'HML', label: 'HML (value)' },
  { value: 'Mom', label: 'Mom (momentum)' },
];
/** Whole calendar quarters of the daily files: 250 quarters, 750 months. */
export const SAMPLE = { start: '1964-01-01', end: '2026-06-30', first: '1964-01', last: '2026-06' } as const;
/** Daily alphas times 21 are monthly (Lewellen & Nagel 2006, p. 299). */
export const TRADING_DAYS = 21;
/** The Dimson-lag quarterly regressions of Lewellen & Nagel (2006, Eq. 7), with at least 40 days a quarter. */
const WINDOWS = { period: 'quarter', minObs: 40, lags: true } as const;

export type ShortWindowData = {
  ff3: Series<'ff3-monthly'>;
  mom: Series<'mom-monthly'>;
  ff3Daily: Series<'ff3-daily'>;
  momDaily: Series<'mom-daily'>;
};

/** Monthly decimal Mkt-RF, HML and Mom on the dates where all three exist. */
function monthlyPanel({ ff3, mom }: ShortWindowData) {
  const first = mom.rows[0][0];
  const f = ff3.rows.findIndex(([date]) => date === first);
  const rows = ff3.rows.slice(f, f + mom.rows.length);
  if (f < 0 || rows.some(([date], t) => date !== mom.rows[t][0])) throw new RangeError('ff3-monthly and mom-monthly dates do not line up');
  const decimal = (cells: readonly (number | null)[]) => cells.map((v) => (v as number) / 100);
  return {
    dates: rows.map(([date]) => date),
    market: decimal(getColumn(ff3, 'Mkt-RF').slice(f, f + rows.length)),
    HML: decimal(getColumn(ff3, 'HML').slice(f, f + rows.length)),
    Mom: decimal(getColumn(mom, 'Mom')),
  };
}

const decimalYear = (date: string) => Number(date.slice(0, 4)) + (Number(date.slice(5, 7)) - 1) / 12;

export interface QuarterBetas {
  /** Quarter labels and mid-quarter dates in decimal years. */
  period: string[];
  x: number[];
  beta: number[];
  /** σ(β̂_iq), the sample standard deviation of the quarterly betas. */
  sigmaBeta: number;
  /** Implied σ of true betas, after removing the average sampling variance. */
  sigmaBetaTrue: number;
  meanBeta: number;
  /** Average conditional alpha in decimal a year (daily × 21 × 12), its standard error and t. */
  alpha: number;
  alphaSE: number;
  alphaT: number;
  /** 95% half-width of the average conditional alpha, decimal a year. */
  alphaHalf: number;
  /** Mean classical standard error of one quarterly beta. */
  meanBetaSE: number;
}

/** Quarterly CAPM regressions of the factor on Mkt-RF from daily data, over SAMPLE. */
export function quarterBetas({ ff3Daily, momDaily }: ShortWindowData, factor: Factor): QuarterBetas {
  const panel = dailyFactorPanel(ff3Daily, momDaily, { start: SAMPLE.start, end: SAMPLE.end });
  const windows = shortWindowRegressions(panel.dates, panel[factor], panel['Mkt-RF'], WINDOWS);
  const s = conditionalAlphaSummary(windows);
  const yearly = (daily: number) => annualiseMean(TRADING_DAYS * daily);
  return {
    period: windows.map((w) => w.period),
    x: windows.map((w) => Number(w.period.slice(0, 4)) + (Number(w.period.slice(6)) - 0.5) / 4),
    beta: windows.map((w) => w.beta),
    sigmaBeta: s.sigmaBeta,
    sigmaBetaTrue: s.sigmaBetaTrue,
    meanBeta: s.meanBeta,
    alpha: yearly(s.meanAlpha),
    alphaSE: yearly(s.alphaSE),
    alphaT: s.alphaT,
    alphaHalf: invCdf(0.975) * yearly(s.alphaSE),
    meanBetaSE: arithmeticMean(windows.map((w) => w.betaSE)),
  };
}

export interface RollingView {
  /** Window end in decimal years, and the rolling beta, for every month of SAMPLE. */
  x: number[];
  beta: number[];
  /** Sample standard deviation of the rolling betas over SAMPLE. */
  sigmaBeta: number;
}

/**
 * Rolling monthly CAPM betas of the factor on Mkt-RF. The windows may reach back before SAMPLE
 * (mom-monthly starts in 1927-01), so every month of SAMPLE has a beta for windows up to 37 years.
 */
export function rollingView(data: ShortWindowData, factor: Factor, window: number): RollingView {
  const m = monthlyPanel(data);
  const { beta } = rollingBetas(m[factor], m.market, window);
  const from = m.dates.indexOf(SAMPLE.start);
  const to = m.dates.indexOf(`${SAMPLE.last}-01`) + 1;
  const kept = beta.slice(from, to);
  return { x: m.dates.slice(from, to).map(decimalYear), beta: kept, sigmaBeta: Math.sqrt(sampleVariance(kept)) };
}

export interface CapmAlpha {
  months: number;
  /** Unconditional CAPM alpha and beta from monthly data over SAMPLE; alpha in decimal a year. */
  alpha: number;
  alphaSE: number;
  beta: number;
  /** Average market excess return over SAMPLE, decimal a year. */
  premium: number;
}

export function capmAlpha(data: ShortWindowData, factor: Factor): CapmAlpha {
  const m = monthlyPanel(data);
  const from = m.dates.indexOf(SAMPLE.start);
  const to = m.dates.indexOf(`${SAMPLE.last}-01`) + 1;
  const market = m.market.slice(from, to);
  const fit = ols(m[factor].slice(from, to), [market]);
  return {
    months: to - from,
    alpha: annualiseMean(fit.coefficients[0]),
    alphaSE: annualiseMean(fit.standardErrors[0]),
    beta: fit.coefficients[1],
    premium: annualiseMean(arithmeticMean(market)),
  };
}

/** The σ(λ_t), decimal a year, at which the bound reaches the actual alpha. */
export const lambdaNeeded = (alpha: number, sigmaBeta: number) => Math.abs(alpha) / sigmaBeta;

const loadShortWindowData = () => Promise.all([loadSeries('ff3-monthly'), loadSeries('mom-monthly'), loadSeries('ff3-daily'), loadSeries('mom-daily')])
  .then(([ff3, mom, ff3Daily, momDaily]) => ({ ff3, mom, ff3Daily, momDaily }));

/** Load the four French files once. */
export function useShortWindowData(): { data: ShortWindowData | null; failed: boolean } {
  return useLoaded(loadShortWindowData);
}
