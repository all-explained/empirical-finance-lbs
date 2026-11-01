/**
 * Every number in the prose of chapter 30, recomputed from ff25-size-bm-monthly, ff5-monthly, mom-monthly,
 * ff3-monthly and osap-ls-monthly through assetPanel and the widgets' sample helper. If the data or the
 * library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import ff5 from '../src/data/series/ff5-monthly.json';
import mom from '../src/data/series/mom-monthly.json';
import ff25 from '../src/data/series/ff25-size-bm-monthly.json';
import osap from '../src/data/series/osap-ls-monthly.json';
import type { Series } from '../src/lib/data/series';
import { principalComponentAssets, ridgePenalty, shrinkagePath } from '../src/lib/finance/shrinkage';
import { annualiseSharpe } from '../src/lib/stats/moments';
import { bestIndex, pathPoint, PRIOR_SCALES, shrinkageData, shrunkTangency } from '../src/components/plots/shrinkageSample';

const data = shrinkageData({
  ff3: ff3 as unknown as Series<'ff3-monthly'>,
  ff5: ff5 as unknown as Series<'ff5-monthly'>,
  mom: mom as unknown as Series<'mom-monthly'>,
  ff25: ff25 as unknown as Series<'ff25-size-bm-monthly'>,
  osap: osap as unknown as Series<'osap-ls-monthly'>,
});
const fixed = (v: number, digits: number) => v.toFixed(digits);
const TARGET = 0.1; // FrontierBuilder's TARGET_VOL; Sharpe ratios do not depend on it
const varianceShare = (returns: number[][], k: number) => {
  const { values } = principalComponentAssets(returns);
  return values.slice(0, k).reduce((a, b) => a + b, 0) / values.reduce((a, b) => a + b, 0);
};
const ridge = PRIOR_SCALES.map((scale) => pathPoint(data.osap, scale, 0, 'assets'));
const best = bestIndex(ridge);

describe('chapter 30 prose numbers', () => {
  test('hook: naive tangency portfolio before and after 2005', () => {
    expect([data.ff.names.length, data.osap.names.length]).toEqual([30, 108]);
    const ff = shrunkTangency(data.ff, 0, TARGET);
    expect([ff.first, ff.splitMonth, ff.last]).toEqual(['1963-07', '2005-01', '2026-08']);
    expect([fixed(ff.frontierSharpe, 2), fixed(ff.inSample.sharpe, 2), fixed(ff.outOfSample.sharpe, 2)]).toEqual(['1.84', '1.84', '0.84']);
    const anomalies = shrunkTangency(data.osap, 0, TARGET);
    expect(anomalies.last).toBe('2024-12');
    expect([fixed(anomalies.inSample.sharpe, 2), fixed(anomalies.outOfSample.sharpe, 2)]).toEqual(['8.85', '2.18']);
  });

  test('intuition: variance of the PCs and the shrunk tangency portfolio at 10^-3', () => {
    expect(fixed(varianceShare(data.ff.returns, 3) * 100, 1)).toBe('70.5');
    const ff = shrunkTangency(data.ff, 1e-3, TARGET);
    expect([fixed(ff.inSample.sharpe, 2), fixed(ff.outOfSample.sharpe, 2)]).toEqual(['1.65', '0.58']);
    expect(fixed(shrunkTangency(data.osap, 1e-3, TARGET).outOfSample.sharpe, 2)).toBe('2.33');
  });

  test('formalisation: shrink factors of the ridge at the best penalty on the anomalies', () => {
    const { values } = principalComponentAssets(data.osap.returns);
    const nu = ridge[best].penalty;
    expect([0, 4, 9, values.length - 1].map((j) => fixed(values[j] / (values[j] + nu), 3))).toEqual(['0.835', '0.383', '0.216', '0.002']);
  });

  test('playground: the ridge path on the anomalies', () => {
    expect([PRIOR_SCALES.length, fixed(PRIOR_SCALES[0], 2), fixed(PRIOR_SCALES.at(-1)!, 2)]).toEqual([15, '0.01', '1.26']);
    expect([fixed(ridge[best].r2, 3), fixed(ridge[best].priorScale, 3), fixed(annualiseSharpe(ridge[best].priorScale), 2)]).toEqual(['0.520', '0.158', '0.55']);
    const top = ridge[best].b.reduce((m, v, i, b) => (Math.abs(v) > Math.abs(b[m]) ? i : m), 0);
    expect(data.osap.names[top]).toBe('STreversal');
    expect(fixed(ridge.at(-1)!.r2, 2)).toBe('-1.38');
    expect(fixed(varianceShare(data.osap.returns, 5) * 100, 1)).toBe('61.7');
    const pcs = pathPoint(data.osap, PRIOR_SCALES[best], 0, 'pcs').b;
    const largest = pcs.map((v, j) => [Math.abs(v), j]).sort((a, b) => b[0] - a[0]).slice(0, 5).map(([, j]) => j + 1);
    expect(Math.max(...largest)).toBeLessThanOrEqual(15);
  });

  test('playground: the elastic net with L1 share 0.9, in assets and in PCs', () => {
    const step = best - 1;
    expect(fixed(PRIOR_SCALES[step], 3)).toBe('0.112');
    const assets = pathPoint(data.osap, PRIOR_SCALES[step], 0.9, 'assets');
    const pcs = pathPoint(data.osap, PRIOR_SCALES[step], 0.9, 'pcs');
    expect([assets.nonZero, fixed(assets.r2, 2)]).toEqual([20, '0.29']);
    expect([pcs.nonZero, fixed(pcs.r2, 2)]).toEqual([14, '0.44']);
    const path = PRIOR_SCALES.map((scale) => pathPoint(data.osap, scale, 0.9, 'assets'));
    const top = path[bestIndex(path)];
    expect([fixed(top.r2, 3), top.nonZero]).toEqual(['0.485', 44]);
  }, 120000);

  test('playground: the FF set and the number of folds', () => {
    const ff = PRIOR_SCALES.map((scale) => pathPoint(data.ff, scale, 0, 'assets'));
    expect(ff.every((p) => p.r2 < 0)).toBe(true);
    expect([bestIndex(ff), fixed(ff[0].r2, 3), fixed(ff.at(-1)!.r2, 2)]).toEqual([0, '-0.006', '-3.52']);
    const penalties = PRIOR_SCALES.map((scale) => ridgePenalty(scale, data.osap.Sigma, data.osap.returns.length));
    const byFolds = [3, 5, 10].map((folds) => {
      const { r2 } = shrinkagePath(data.osap.returns, { penalties, folds });
      const k = r2.indexOf(Math.max(...r2));
      return [fixed(PRIOR_SCALES[k], 3), fixed(r2[k], 2)];
    });
    expect(byFolds).toEqual([['0.158', '0.52'], ['0.079', '0.21'], ['0.112', '0.24']]);
  }, 120000);

  test('quiz: the shrink factor of a component with variance 4ν₂', () => {
    expect(4 / (4 + 1)).toBe(0.8);
  });
});
