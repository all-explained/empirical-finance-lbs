import { useMemo } from 'react';
import { quarterlyPanel } from '../../lib/finance/conditional';
import { sampleCovariance } from '../../lib/finance/portfolio';
import { hjDistance, sdfModelFits, type SdfModel, type SdfModelFit } from '../../lib/finance/sdfGmm';
import { annualiseMean } from '../../lib/stats/moments';
import { quarterLabel, useConditionalData, WINDOWS, type ConditionalData } from './conditionalSample';

export const MODELS: { value: SdfModel; label: string }[] = [
  { value: 'capm', label: 'CAPM' },
  { value: 'ccapm', label: 'CCAPM' },
  { value: 'ff3', label: 'FF3' },
];

export interface SdfView {
  first: string;
  last: string;
  quarters: number;
  names: string[];
  /** Per model: first-stage and HJ-weighted GMM, δ_HJ and the second-stage J (decimal per quarter). */
  fits: Record<SdfModel, SdfModelFit>;
  /** E_T[R^e f̃] with f the market, and E_T[R^e], both ×4: the x and y of first-stage GMM as a regression. */
  marketCovariance: number[];
  meanExcess: number[];
  /** Var_T of the market with the divisor T, ×4: λ̂ = Σ̂_f b̂ for the CAPM. */
  marketVariance: number;
  /** δ_HJ of M = 1, the model with no factors: the benchmark every model should beat. */
  noFactorDistance: number;
}

/** The SDF fits of the CAPM, CCAPM and FF3 on the quarterly 25 size–B/M portfolios, 1963-Q3 to the last full quarter. */
export function sdfView(data: ConditionalData): SdfView {
  const panel = quarterlyPanel(data, WINDOWS.full);
  const T = panel.dates.length;
  // Cov_T with the divisor T is E_T[R^e f̃], the Jacobian of the CAPM's moments; the market is the last column.
  const covariance = sampleCovariance(panel.excess.map((row, t) => [...row, panel.factors[t][0]]))
    .map((row) => annualiseMean((row.at(-1)! * (T - 1)) / T, 4));
  const fits = sdfModelFits(panel, MODELS.map((m) => m.value));
  return {
    first: quarterLabel(panel.dates[0]),
    last: quarterLabel(panel.dates.at(-1)!),
    quarters: T,
    names: panel.names,
    fits,
    marketCovariance: covariance.slice(0, -1),
    meanExcess: fits.capm.firstStage.actual.map((v) => annualiseMean(v, 4)),
    marketVariance: covariance.at(-1)!,
    noFactorDistance: hjDistance(panel.excess, panel.excess.map(() => [])).distance,
  };
}

/** Load the quarterly panel's series once (through useConditionalData) and fit the three SDF models. */
export function useSdfView(): { view: SdfView | null; failed: boolean } {
  const { data, failed } = useConditionalData();
  const view = useMemo(() => (data ? sdfView(data) : null), [data]);
  return { view, failed };
}
