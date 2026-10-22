import { useEffect, useState } from 'react';
import { getColumn, loadSeries, type ColumnName, type Series } from '../../lib/data/series';
import { betas, frontier, maxSharpeSquared, sampleCovariance, sampleMeans, securityMarketLine, tangencyWeights, type FrontierPoint } from '../../lib/finance/portfolio';
import { arithmeticMean, excessReturn, sampleVariance } from '../../lib/finance/returns';
import { annualiseMean, annualiseVolatility, meanStandardError } from '../../lib/stats/moments';
import { ols } from '../../lib/stats/ols';

export type Portfolio = ColumnName<'ff25-size-bm-monthly'>;
export type Period = 'full' | 'post1963';
export const PERIODS: Record<Period, { start: string; label: string }> = {
  full: { start: '1926-07-01', label: '1926–2026' },
  post1963: { start: '1963-07-01', label: '1963–2026' },
};

/** Monthly decimal excess returns of the 25 portfolios and the market from one start date to the end. */
export interface CapmSample {
  dates: string[];
  names: Portfolio[];
  /** T × 25 excess returns, R_i − R^f. */
  assets: number[][];
  market: number[];
  rf: number[];
}

export function capmSample(ff3: Series<'ff3-monthly'>, ff25: Series<'ff25-size-bm-monthly'>, start: string): CapmSample {
  const names = ff25.columns.slice(1).map((c) => c.name as Portfolio);
  const first = ff3.rows.findIndex(([date]) => date >= start);
  if (first < 0 || ff25.rows[first]?.[0] !== ff3.rows[first][0]) throw new RangeError('ff3 and ff25 dates do not line up');
  const rf = getColumn(ff3, 'RF').slice(first).map((v) => (v as number) / 100);
  const market = getColumn(ff3, 'Mkt-RF').slice(first).map((v) => (v as number) / 100);
  const columns = names.map((name) => getColumn(ff25, name).slice(first));
  const assets = rf.map((r, t) => columns.map((col) => excessReturn((col[t] as number) / 100, r)));
  return { dates: ff3.rows.slice(first).map(([date]) => date), names, assets, market, rf };
}

/** Annualised betas, mean excess returns and CAPM alphas of the 25 portfolios, and the fitted SML. */
export function smlView(s: CapmSample) {
  const beta = betas(s.assets, s.market);
  const meanExcess = sampleMeans(s.assets).map((m) => annualiseMean(m));
  const meanSE = s.names.map((_, j) => annualiseMean(meanStandardError(s.assets.map((row) => row[j]))));
  // The CAPM alpha is the intercept of each time-series regression on the market.
  const fits = s.names.map((_, j) => ols(s.assets.map((row) => row[j]), [s.market]));
  const alpha = fits.map((f) => annualiseMean(f.coefficients[0]));
  const alphaT = fits.map((f) => f.tStats[0]);
  const premium = annualiseMean(arithmeticMean(s.market));
  return { beta, meanExcess, meanSE, alpha, alphaT, premium, fit: securityMarketLine(beta, meanExcess) };
}

/** Annual moments of a few portfolios: mean total return, excess mean, and the covariance of excess returns. */
export function annualMoments(s: CapmSample, picks: readonly Portfolio[]) {
  const idx = picks.map((name) => s.names.indexOf(name));
  const excess = s.assets.map((row) => idx.map((j) => row[j]));
  const rf = annualiseMean(arithmeticMean(s.rf));
  const meanExcess = sampleMeans(excess).map((m) => annualiseMean(m));
  // Under i.i.d. months a covariance scales with the horizon, like a mean.
  const Sigma = sampleCovariance(excess).map((row) => row.map((c) => annualiseMean(c)));
  const marketSd = annualiseVolatility(Math.sqrt(sampleVariance(s.market)));
  const marketMean = rf + annualiseMean(arithmeticMean(s.market));
  return { rf, mean: meanExcess.map((m) => rf + m), Sigma, market: { mean: marketMean, volatility: marketSd } };
}

export interface FrontierView {
  /** Minimum-variance frontier of the risky assets; empty when it is a single point. */
  curve: FrontierPoint[];
  /** Tangency portfolio, or null when 1'Σ⁻¹μᵉ ≤ 0 and no risky portfolio touches the upper CML. */
  tangency: (FrontierPoint & { sharpe: number }) | null;
}

/** Frontier over the target means, and the tangency portfolio, for total means `mean` and riskless rate rf. */
export function frontierView(mean: readonly number[], Sigma: readonly (readonly number[])[], rf: number, targets: readonly number[]): FrontierView {
  const muExcess = mean.map((m) => excessReturn(m, rf));
  let curve: FrontierPoint[] = [];
  // ponytail: one asset or equal means make the frontier a single point; draw no curve then.
  try { curve = frontier(mean, Sigma, targets); } catch { curve = []; }
  let weights: number[];
  try { weights = tangencyWeights(muExcess, Sigma); } catch { return { curve, tangency: null }; }
  const tMean = weights.reduce((sum, w, i) => sum + w * mean[i], 0);
  if (!(tMean > rf)) return { curve, tangency: null };
  const volatility = Math.sqrt(weights.reduce((sum, w, i) => sum + w * Sigma[i].reduce((acc, c, j) => acc + c * weights[j], 0), 0));
  return { curve, tangency: { mean: tMean, volatility, weights, sharpe: Math.sqrt(maxSharpeSquared(muExcess, Sigma)) } };
}

/** Load ff3-monthly and ff25-size-bm-monthly once. */
export function useCapmData(): { data: { ff3: Series<'ff3-monthly'>; ff25: Series<'ff25-size-bm-monthly'> } | null; failed: boolean } {
  const [data, setData] = useState<{ ff3: Series<'ff3-monthly'>; ff25: Series<'ff25-size-bm-monthly'> } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    Promise.all([loadSeries('ff3-monthly'), loadSeries('ff25-size-bm-monthly')])
      .then(([ff3, ff25]) => setData({ ff3, ff25 }), () => setFailed(true));
  }, []);
  return { data, failed };
}
