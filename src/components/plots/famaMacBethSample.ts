import { crossSectionalRegression, famaMacBeth, type Weighting } from '../../lib/finance/crossSection';
import { sampleMeans } from '../../lib/finance/portfolio';
import { timeSeriesRegressions, type FactorPanel } from '../../lib/finance/timeSeriesTests';

/** Months before the running standard error is drawn: one month has no spread. */
export const BAND_START = 12;

/**
 * Chapter 17: first-pass betas on the whole sample, then Fama–MacBeth with an intercept each month.
 * runningSE[t] is the Fama–MacBeth standard error of the market slope over months 1 to t + 1.
 */
export function famaMacBethMovie(panel: FactorPanel) {
  const { beta } = timeSeriesRegressions(panel.excess, panel.factors);
  const fm = famaMacBeth(panel.excess, beta, { intercept: true });
  // ponytail: one famaMacBeth per month, O(T²) work; fine at T ≈ 760, use a running variance if T grows.
  const runningSE = panel.excess.map((_, t) => (t + 1 < BAND_START
    ? NaN
    : famaMacBeth(panel.excess.slice(0, t + 1), beta, { intercept: true }).se[0]));
  return { beta, fm, runningSE };
}

/** The second pass on mean excess returns, with first-pass betas and residual covariance. */
export function twoPass(panel: FactorPanel, { intercept, weighting }: { intercept: boolean; weighting: Weighting }) {
  const first = timeSeriesRegressions(panel.excess, panel.factors);
  const meanExcess = sampleMeans(panel.excess);
  const second = crossSectionalRegression(first.beta, meanExcess, {
    intercept, weighting, residualCovariance: first.residualCovariance,
  });
  return { ...second, beta: first.beta, meanExcess, factorMean: first.factorMean };
}
