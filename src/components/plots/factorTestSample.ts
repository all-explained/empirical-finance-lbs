import type { Series } from '../../lib/data/series';
import { sampleCovariance, sampleMeans } from '../../lib/finance/portfolio';
import { factorPanel, grs, sharpeFrontiers, timeSeriesRegressions, type FactorModel, type GrsResult } from '../../lib/finance/timeSeriesTests';
import { solve } from '../../lib/math/linalg';
import { fSurvival } from '../../lib/math/distributions';
import { invCdf } from '../../lib/math/normal';
import { bisection } from '../../lib/math/rootFind';
import { annualiseMean, annualiseSharpe, annualiseVolatility } from '../../lib/stats/moments';

export { useCapmData as useFactorData } from './capmSample';

export const MODELS: { value: FactorModel; label: string }[] = [
  { value: 'capm', label: 'CAPM' },
  { value: 'ff3', label: 'Fama–French 3' },
];
export const STARTS = [
  { value: '1926-07-01', label: '1926-07' },
  { value: '1963-07-01', label: '1963-07' },
  { value: '1990-01-01', label: '1990-01' },
  { value: '2015-01-01', label: '2015-01' },
] as const;
export type Start = (typeof STARTS)[number]['value'];
export const DEFAULT_START: Start = '1963-07-01';

type Data = { ff3: Series<'ff3-monthly'>; ff25: Series<'ff25-size-bm-monthly'> };

/** The x with P(F(df1, df2) > x) = q. */
export function fCritical(q: number, df1: number, df2: number): number {
  return bisection((x) => fSurvival(x, df1, df2) - q, 1e-9, 100);
}

export interface FactorTest {
  first: string;
  last: string;
  T: number;
  N: number;
  K: number;
  names: string[];
  /** Annualised alphas (×12), their 95% half-widths (1.96 classical s.e., ×12) and t-statistics. */
  alpha: number[];
  half: number[];
  alphaT: number[];
  /** Annualised residual volatility of each portfolio (√Σ̂_ε,ii × √12). */
  residualVol: number[];
  grs: GrsResult;
  /** 5% critical value of F(N, T − N − K). */
  critical5: number;
  /** Monthly α̂'Σ̂_ε⁻¹α̂, computed from the alphas themselves (the left side of the Sharpe identity). */
  alphaQuadratic: number;
}

/** Time-series regressions and GRS for the 25 size–B/M portfolios on one model, from start to the end. */
export function factorTest({ ff3, ff25 }: Data, model: FactorModel, start: string): FactorTest {
  const panel = factorPanel(ff3, ff25, { start, model });
  const fit = timeSeriesRegressions(panel.excess, panel.factors);
  const result = grs(panel.excess, panel.factors);
  const z = invCdf(0.975);
  const T = panel.dates.length;
  const N = panel.names.length;
  const K = panel.factorNames.length;
  return {
    first: panel.dates[0].slice(0, 7),
    last: panel.dates.at(-1)!.slice(0, 7),
    T, N, K,
    names: panel.names,
    alpha: fit.alpha.map((a) => annualiseMean(a)),
    half: fit.alphaSE.map((se) => z * annualiseMean(se)),
    alphaT: fit.alphaT,
    residualVol: fit.residualCovariance.map((row, i) => annualiseVolatility(Math.sqrt(row[i]))),
    grs: result,
    critical5: fCritical(0.05, result.df1, result.df2),
    alphaQuadratic: solve(fit.residualCovariance, fit.alpha).reduce((sum, w, i) => sum + w * fit.alpha[i], 0),
  };
}

export interface FrontierPicture {
  /** Grid of annualised volatilities. */
  sd: number[];
  /** Annualised upper and lower frontier branches (NaN where unreachable); one point when there is one factor. */
  factors: { upper: number[]; lower: number[]; point: { sd: number; mean: number } };
  all: { upper: number[]; lower: number[] };
  /** Annualised maximum Sharpe ratios, the slopes of the two tangent lines. */
  sharpeFactors: number;
  sharpeAll: number;
  /** Annualised mean excess return and volatility of each test asset and each factor. */
  assets: { sd: number; mean: number }[];
  factorPoints: { name: string; sd: number; mean: number }[];
}

/** The two frontiers of sharpeFrontiers in annual units, with the assets and factors as points. */
export function frontierPicture({ ff3, ff25 }: Data, model: FactorModel, start: string, sdGrid: readonly number[]): FrontierPicture {
  const panel = factorPanel(ff3, ff25, { start, model });
  const monthly = sdGrid.map((sd) => sd / annualiseVolatility(1));
  const f = sharpeFrontiers(panel.excess, panel.factors, monthly);
  const yearly = (values: number[]) => values.map((m) => (Number.isFinite(m) ? annualiseMean(m) : NaN));
  const points = (rows: number[][]) => {
    const mean = sampleMeans(rows);
    return sampleCovariance(rows).map((row, i) => ({ sd: annualiseVolatility(Math.sqrt(row[i])), mean: annualiseMean(mean[i]) }));
  };
  return {
    sd: [...sdGrid],
    factors: {
      upper: yearly(f.factors.upper),
      lower: yearly(f.factors.lower),
      point: { sd: annualiseVolatility(f.factors.minVariance.sd), mean: annualiseMean(f.factors.minVariance.mean) },
    },
    all: { upper: yearly(f.all.upper), lower: yearly(f.all.lower) },
    sharpeFactors: annualiseSharpe(f.factors.sharpe),
    sharpeAll: annualiseSharpe(f.all.sharpe),
    assets: points(panel.excess),
    factorPoints: points(panel.factors).map((p, k) => ({ name: panel.factorNames[k], ...p })),
  };
}
