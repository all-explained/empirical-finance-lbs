import { useMemo } from 'react';
import { betweenDates, getColumn, type ColumnName, type Series } from '../../lib/data/series';
import { crossSectionalRegression } from '../../lib/finance/crossSection';
import { sampleMeans } from '../../lib/finance/portfolio';
import { excessReturn } from '../../lib/finance/returns';
import { glsR2, randomFactorFit, type RandomFactorFit } from '../../lib/finance/skeptical';
import { factorPanel, timeSeriesRegressions } from '../../lib/finance/timeSeriesTests';
import { rejectionRate } from '../../lib/stats/stambaugh';
import { useFactorData } from './factorTestSample';
import { useSeriesData } from './seriesSample';

/** First month of every panel in Chapter 28; it runs to the last month of ff3-monthly. */
export const START = '1963-07-01';
export const RANDOM_SEED = 2010;
/** Draws per random-factor simulation. */
export const RANDOM_SAMPLES = 200;
/** Factors per artificial model: SMB and HML span the size–B/M cross-section, so two is enough. */
export const RANDOM_FACTORS = 2;

export type Assets = 'ff25' | 'ff55';
export const ASSETS: { value: Assets; label: string }[] = [
  { value: 'ff25', label: '25 portfolios' },
  { value: 'ff55', label: '25 + 30 industries' },
];
export type Model = 'capm' | 'ff3';

export interface SkepticalData {
  ff3: Series<'ff3-monthly'>;
  ff25: Series<'ff25-size-bm-monthly'>;
  ff30: Series<'ff30-industry-monthly'>;
}

const INDUSTRIES = ['ff30-industry-monthly'] as const;

/** Load ff3-monthly, ff25-size-bm-monthly and ff30-industry-monthly once. */
export function useSkepticalData(): { data: SkepticalData | null; failed: boolean } {
  const base = useFactorData();
  const industries = useSeriesData(INDUSTRIES);
  const data = useMemo(
    () => (base.data && industries.data ? { ...base.data, ff30: industries.data['ff30-industry-monthly'] } : null),
    [base.data, industries.data],
  );
  return { data, failed: base.failed || industries.failed };
}

export interface SkepticalPanel {
  first: string;
  last: string;
  /** Monthly decimal excess returns, T × 25 (size–B/M) and T × 55 (size–B/M, then the 30 industries). */
  excess: Record<Assets, number[][]>;
  /** T × K factors of each model: Mkt-RF for the CAPM; Mkt-RF, SMB and HML for FF3. */
  factors: Record<Model, number[][]>;
  smb: number[];
  hml: number[];
}

/** The 25 size–B/M and 30 industry portfolios in excess of RF, with the FF3 factors, from START. */
export function skepticalPanel({ ff3, ff25, ff30 }: SkepticalData): SkepticalPanel {
  const panel = factorPanel(ff3, ff25, { start: START, model: 'ff3' });
  const end = panel.dates.at(-1)!;
  const industry = betweenDates(ff30, START, end);
  if (industry.rows.length !== panel.dates.length || industry.rows.some(([date], t) => date !== panel.dates[t])) {
    throw new RangeError('ff30 and ff3 dates do not line up');
  }
  const rf = getColumn(betweenDates(ff3, START, end), 'RF');
  const columns = industry.columns.slice(1).map((c) => getColumn(industry, c.name as ColumnName<'ff30-industry-monthly'>));
  const industries = panel.dates.map((_, t) => columns.map((column) => {
    const value = column[t];
    if (value === null || rf[t] === null) throw new RangeError('skepticalPanel: missing return');
    return excessReturn(value / 100, (rf[t] as number) / 100);
  }));
  return {
    first: panel.dates[0].slice(0, 7),
    last: end.slice(0, 7),
    excess: { ff25: panel.excess, ff55: panel.excess.map((row, t) => [...row, ...industries[t]]) },
    factors: { capm: panel.factors.map(([market]) => [market]), ff3: panel.factors },
    smb: panel.factors.map(([, smb]) => smb),
    hml: panel.factors.map(([, , hml]) => hml),
  };
}

export interface ModelR2 { ols: number; gls: number }

/** OLS and GLS cross-sectional R² of the two-pass regression with an intercept, for one model and asset set. */
export function modelR2(panel: SkepticalPanel, assets: Assets, model: Model): ModelR2 {
  const excess = panel.excess[assets];
  const factors = panel.factors[model];
  const { beta } = timeSeriesRegressions(excess, factors);
  return {
    ols: crossSectionalRegression(beta, sampleMeans(excess), { intercept: true, weighting: 'ols' }).r2,
    gls: glsR2(excess, factors).r2,
  };
}

export interface RandomView {
  fit: RandomFactorFit;
  /** Share of draws whose R² is above FF3's on the same assets, OLS and GLS. */
  beatFF3: ModelR2;
}

/** RANDOM_SAMPLES seeded two-factor models that mix SMB, HML and a noise share, on one asset set. */
export function randomView(panel: SkepticalPanel, assets: Assets, noiseShare: number, seed: number, ff3: ModelR2): RandomView {
  const fit = randomFactorFit(seed, panel.excess[assets], panel.smb, panel.hml, {
    samples: RANDOM_SAMPLES, factors: RANDOM_FACTORS, noiseShare,
  });
  return { fit, beatFF3: { ols: rejectionRate(fit.ols, ff3.ols), gls: rejectionRate(fit.gls, ff3.gls) } };
}
