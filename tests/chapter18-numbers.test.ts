/**
 * Every number in the prose of chapter 18, recomputed from ff3-monthly and ff25-size-bm-monthly
 * and from the widget's seeded simulation, through the library and the widget's sample helper.
 * If the data, the seed or the library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import ff25 from '../src/data/series/ff25-size-bm-monthly.json';
import type { Series } from '../src/lib/data/series';
import { shankenCorrection } from '../src/lib/finance/crossSection';
import { factorPanel } from '../src/lib/finance/timeSeriesTests';
import { sharpeRatio, annualiseSharpe } from '../src/lib/stats/moments';
import {
  DEFAULT_SEED, ff3Shanken, LAMBDA, N, REPLICATIONS, TRUE_BETA, twoPassWorld,
} from '../src/components/plots/shankenSample';

const data = ff3Shanken({ ff3: ff3 as unknown as Series<'ff3-monthly'>, ff25: ff25 as unknown as Series<'ff25-size-bm-monthly'> });
const year = (monthly: number, digits: number) => (monthly * 1200).toFixed(digits);
const pct = (v: number, digits: number) => (v * 100).toFixed(digits);
const world = (sharpe: number, T: number) => twoPassWorld({ sharpe, T, seed: DEFAULT_SEED });
const high = world(5, 600);

describe('chapter 18 prose numbers', () => {
  test('hook: FF3 market premium and its two standard errors', () => {
    expect([data.first, data.last, data.T]).toEqual(['1963-07', '2026-08', 758]);
    expect(data.factorNames).toEqual(['Mkt-RF', 'SMB', 'HML']);
    expect(year(data.lambda[0], 2)).toBe('6.72');
    expect([year(data.naiveSE[0], 3), year(data.correctedSE[0], 3)]).toEqual(['1.970', '1.971']);
  });

  test("intuition: the market's Sharpe ratio since 1963-07", () => {
    const panel = factorPanel(ff3 as unknown as Series<'ff3-monthly'>, ff25 as unknown as Series<'ff25-size-bm-monthly'>, { start: '1963-07-01', model: 'capm' });
    expect(annualiseSharpe(sharpeRatio(panel.factors.map(([m]) => m))).toFixed(2)).toBe('0.47');
  });

  test('the simulated world: 25 betas from 0.5 to 1.5, a 6% premium, 200 samples', () => {
    expect([N, TRUE_BETA[0], TRUE_BETA.at(-1), REPLICATIONS, year(LAMBDA, 0)]).toEqual([25, 0.5, 1.5, 200, '6']);
  });

  test('hook, intuition and formalisation: Sharpe ratio 5 a year, T = 600', () => {
    expect([pct(high.naiveCoverage, 1), pct(high.correctedCoverage, 1)]).toEqual(['83.5', '93.5']);
    expect(high.c.toFixed(2)).toBe('2.08');
    expect([year(high.meanNaiveSE, 3), year(high.meanCorrectedSE, 3), year(high.sdLambdaHat, 3)]).toEqual(['0.218', '0.293', '0.279']);
    // "about a fifth too small"
    expect((1 - high.meanNaiveSE / high.sdLambdaHat).toFixed(2)).toBe('0.22');
    expect(year(high.meanLambdaHat, 2)).toBe('5.85');
  });

  test('formalisation: when the correction matters on FF3', () => {
    expect(data.c.toFixed(4)).toBe('0.0386');
    expect([Math.sqrt(data.c).toFixed(3), Math.sqrt(12 * data.c).toFixed(2)]).toEqual(['0.196', '0.68']);
    // Corrected/naive variance = 1 + c·s, so s = (ratio² − 1)/c.
    const ratio = data.correctedSE[0] / data.naiveSE[0];
    expect(pct((ratio ** 2 - 1) / data.c, 1)).toBe('2.8');
    expect(pct(ratio - 1, 2)).toBe('0.05');
  });

  test('playground: the default world and a short sample', () => {
    const base = world(0.4, 600);
    expect(base.c.toFixed(3)).toBe('0.013');
    expect([pct(base.naiveCoverage, 1), pct(base.correctedCoverage, 1)]).toEqual(['97.0', '97.0']);
    const short = world(5, 120);
    expect([pct(short.naiveCoverage, 1), pct(short.correctedCoverage, 1), year(short.meanLambdaHat, 2)]).toEqual(['62.5', '78.0', '5.27']);
  });

  test('quiz: a monthly Sharpe ratio of 0.2 gives c = 0.04', () => {
    const { c } = shankenCorrection([[1]], [[1]], [[1]], [0.2], 100, { weighting: 'ols' });
    expect((1 + c).toFixed(2)).toBe('1.04');
  });
});
