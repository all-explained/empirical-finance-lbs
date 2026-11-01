/**
 * Every number in the prose of chapter 31, recomputed from ff25-size-bm-monthly and ff3-monthly
 * through the library and the widget's sample helper. If the data or the library changes,
 * this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import ff25 from '../src/data/series/ff25-size-bm-monthly.json';
import type { Series } from '../src/lib/data/series';
import { crossSectionalRegression } from '../src/lib/finance/crossSection';
import { latentRiskPremia, pcaFactors } from '../src/lib/finance/latentFactors';
import { sampleMeans } from '../src/lib/finance/portfolio';
import { timeSeriesRegressions } from '../src/lib/finance/timeSeriesTests';
import { factorComparison, latentPanel } from '../src/components/plots/latentSample';

const series = { ff3: ff3 as unknown as Series<'ff3-monthly'>, ff25: ff25 as unknown as Series<'ff25-size-bm-monthly'> };
const panel = latentPanel(series.ff3, series.ff25, 'ff25-1963');
const from1926 = latentPanel(series.ff3, series.ff25, 'ff25');
const fixed = (values: number[], digits: number) => values.map((v) => v.toFixed(digits));
const percent = (v: number) => (v * 100).toFixed(1);
const degrees = (d: number) => (d * Math.PI) / 180;
const r2 = (K: number) => latentRiskPremia(panel.excess, K).withIntercept.r2.toFixed(3);

describe('chapter 31 prose numbers', () => {
  test('hook: the sample, the share of three components and their plain correlations', () => {
    expect([panel.dates[0].slice(0, 7), panel.dates.at(-1)!.slice(0, 7), panel.dates.length]).toEqual(['1963-07', '2026-08', 758]);
    const { share, correlations } = factorComparison(panel, 3, 0, false);
    expect(percent(share)).toBe('93.1');
    expect(fixed(correlations[0], 2)).toEqual(['0.93', '0.58', '-0.07']);
    expect(fixed(correlations[1], 2)).toEqual(['-0.13', '0.62', '-0.65']);
    expect(fixed(correlations[2], 2)).toEqual(['0.30', '-0.44', '-0.72']);
  });

  test('intuition: canonical correlations, and a 45° turn that moves only the plain ones', () => {
    expect(fixed(factorComparison(panel, 3, 0, false).canonical, 3)).toEqual(['0.995', '0.972', '0.931']);
    const turned = factorComparison(panel, 3, degrees(45), false);
    expect(fixed(turned.canonical, 3)).toEqual(['0.995', '0.972', '0.931']);
    expect(fixed(turned.correlations[0].slice(0, 2), 2)).toEqual(['0.56', '0.85']);
  });

  test('formalisation: cross-sectional R² of the components and of FF3, and the share of component 3', () => {
    expect([1, 2, 3, 4, 5].map(r2)).toEqual(['0.002', '0.282', '0.640', '0.703', '0.791']);
    expect(r2(24)).toBe('1.000');
    const { beta } = timeSeriesRegressions(panel.excess, panel.factors);
    expect(crossSectionalRegression(beta, sampleMeans(panel.excess), { intercept: true, weighting: 'ols' }).r2.toFixed(3)).toBe('0.663');
    expect(percent(pcaFactors(panel.excess, 3).share[2])).toBe('3.5');
  });

  test('playground: K = 1 and K = 5, the sign flip, and the sample from 1926', () => {
    expect(fixed(factorComparison(panel, 1, 0, false).canonical, 3)).toEqual(['0.994']);
    const five = factorComparison(panel, 5, 0, false);
    expect(fixed(five.canonical, 3)).toEqual(['0.996', '0.985', '0.976']);
    expect(percent(five.share)).toBe('95.2');
    const flipped = factorComparison(panel, 3, 0, true);
    expect(fixed(flipped.canonical, 3)).toEqual(['0.995', '0.972', '0.931']);
    expect(flipped.correlations[0][0].toFixed(2)).toBe('-0.93');
    expect(fixed(factorComparison(from1926, 3, 0, false).canonical, 3)).toEqual(['0.995', '0.919', '0.467']);
    expect(factorComparison(from1926, 4, 0, false).canonical[2].toFixed(3)).toBe('0.894');
  });
});
