import { useEffect, useState } from 'react';
import { loadSeries, type Series } from '../../lib/data/series';
import { modelPanel } from '../../lib/finance/factors';
import { sampleMeans } from '../../lib/finance/portfolio';
import { grs, timeSeriesRegressions, type GrsResult } from '../../lib/finance/timeSeriesTests';
import { annualiseMean } from '../../lib/stats/moments';
import { fCritical, useFactorData } from './factorTestSample';

export type GridModel = 'capm' | 'ff3' | 'ff5';
export const GRID_MODELS: { value: GridModel; label: string }[] = [
  { value: 'capm', label: 'CAPM' },
  { value: 'ff3', label: 'FF3' },
  { value: 'ff5', label: 'FF5' },
];
/** FF5 starts in 1963-07, so all three models share this sample. */
export const GRID_START = '1963-07-01';

type ModelData = { ff3: Series<'ff3-monthly'>; ff5: Series<'ff5-monthly'>; ff25: Series<'ff25-size-bm-monthly'> };

export interface GridView {
  first: string;
  last: string;
  T: number;
  N: number;
  K: number;
  /** ME1-BM1 … ME5-BM5: size quintile rises in groups of five, book-to-market inside each. */
  names: string[];
  factorNames: string[];
  /** Annualised mean excess returns (×12); the same for every model. */
  mean: number[];
  /** Annualised alphas (×12) and their classical t-statistics. */
  alpha: number[];
  alphaT: number[];
  /** N × K loadings, columns in factorNames order. */
  beta: number[][];
  grs: GrsResult;
  /** 5% critical value of F(N, T − N − K). */
  critical5: number;
}

/** Means, alphas, loadings and GRS of the 25 size–B/M portfolios on one model, from GRID_START to the end. */
export function gridView({ ff3, ff5, ff25 }: ModelData, model: GridModel): GridView {
  const panel = modelPanel({ ff3, ff5 }, ff25, { start: GRID_START, model });
  const fit = timeSeriesRegressions(panel.excess, panel.factors);
  const result = grs(panel.excess, panel.factors);
  return {
    first: panel.dates[0].slice(0, 7),
    last: panel.dates.at(-1)!.slice(0, 7),
    T: panel.dates.length,
    N: panel.names.length,
    K: panel.factorNames.length,
    names: panel.names,
    factorNames: panel.factorNames,
    mean: sampleMeans(panel.excess).map((m) => annualiseMean(m)),
    alpha: fit.alpha.map((a) => annualiseMean(a)),
    alphaT: fit.alphaT,
    beta: fit.beta,
    grs: result,
    critical5: fCritical(0.05, result.df1, result.df2),
  };
}

/** Load ff3-monthly and ff25-size-bm-monthly through factorTestSample, and ff5-monthly. */
export function useModelData(): { data: ModelData | null; failed: boolean } {
  const base = useFactorData();
  const [ff5, setFf5] = useState<Series<'ff5-monthly'> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadSeries('ff5-monthly').then(setFf5, () => setFailed(true));
  }, []);
  return { data: base.data && ff5 ? { ...base.data, ff5 } : null, failed: failed || base.failed };
}
