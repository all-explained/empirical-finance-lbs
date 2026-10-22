/**
 * Every number in the prose of chapter 6, recomputed from ff25-size-bm-monthly and
 * gsw-zero-coupon through the library. If the data or the library changes, this test
 * fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff25 from '../src/data/series/ff25-size-bm-monthly.json';
import gsw from '../src/data/series/gsw-zero-coupon.json';
import type { Series } from '../src/lib/data/series';
import { directionVariance, pca, reconstructionError, rotatePair } from '../src/lib/stats/pca';
import { PRESETS, presetPanel, type Preset } from '../src/components/plots/pcaSample';

const panelOf = (preset: Preset) => presetPanel(
  preset,
  ff25 as unknown as Series<'ff25-size-bm-monthly'>,
  gsw as unknown as Series<'gsw-zero-coupon'>,
);
const percent = (v: number, digits = 1) => (v * 100).toFixed(digits);
const fixed = (v: number, digits = 2) => v.toFixed(digits);
const signChanges = (q: number[]) => q.slice(1).filter((v, i) => Math.sign(v) !== Math.sign(q[i])).length;
const argmax = (q: number[]) => q.indexOf(Math.max(...q));
const argmin = (q: number[]) => q.indexOf(Math.min(...q));
const deg = (d: number) => (d * Math.PI) / 180;

const ff = panelOf('ff25');
const ffFit = pca(ff.X);
const late = panelOf('ff25-1963');
const lateFit = pca(late.X);
const yc = panelOf('gsw');
const ycFit = pca(yc.X);
const totalOf = (values: number[]) => values.reduce((s, v) => s + v, 0);
const leftShare = (X: number[][], fit: typeof ffFit, K: number) => reconstructionError(X, fit, K) / ((X.length - 1) * totalOf(fit.values));

function correlations(cov: number[][]): number[] {
  const out: number[] = [];
  for (let i = 0; i < cov.length; i++) for (let j = i + 1; j < cov.length; j++) out.push(cov[i][j] / Math.sqrt(cov[i][i] * cov[j][j]));
  return out;
}

/** The two-series cloud the widget opens on. */
function cloud(preset: Preset) {
  const [a, b] = PRESETS[preset].pair;
  const panel = panelOf(preset);
  const fit = pca(panel.X.map((row) => [row[a], row[b]]));
  const axisShare = (d: number) => directionVariance(fit.covariance, rotatePair(fit.loadings[0], fit.loadings[1], deg(d))[0]) / totalOf(fit.values);
  return { names: [panel.names[a], panel.names[b]], fit, axisShare };
}

describe('chapter 6 prose numbers', () => {
  test('hook: the 25 portfolios and the yield curve', () => {
    expect([ff.names.length, ff.dates[0], ff.dates.at(-1), ff.X.length]).toEqual([25, '1926-07-01', '2026-08-01', 1202]);
    expect((25 * 24) / 2).toBe(300); // separate covariances
    const r = correlations(ffFit.covariance);
    expect(r.length).toBe(300);
    expect(fixed(r.reduce((s, v) => s + v, 0) / r.length)).toBe('0.84');
    expect(fixed(Math.min(...r))).toBe('0.63');
    expect(percent(ffFit.share[0])).toBe('83.8');
    expect([yc.names.length, yc.dates[0], yc.dates.at(-1), yc.X.length]).toEqual([30, '1985-12-31', '2026-09-30', 478]);
    expect(percent(ycFit.cumulativeShare[2])).toBe('98.9');
  });

  test('intuition: the cloud of largest growth against smallest value', () => {
    const c = cloud('ff25');
    expect(c.names).toEqual(['ME5-BM1', 'ME1-BM5']);
    const cov = c.fit.covariance;
    expect(fixed(cov[0][1] / Math.sqrt(cov[0][0] * cov[1][1]))).toBe('0.67');
    expect(fixed((Math.atan2(c.fit.loadings[0][1], c.fit.loadings[0][0]) * 180) / Math.PI, 0)).toBe('65');
    expect(percent(c.axisShare(0))).toBe('88.1');
    expect(percent(c.axisShare(30))).toBe('69.0');
    expect(percent(c.axisShare(45), 0)).toBe('50');
  });

  test('formalisation: shares and what three components leave out', () => {
    expect(ffFit.share.slice(0, 3).map((s) => percent(s))).toEqual(['83.8', '4.4', '3.1']);
    expect(percent(ffFit.cumulativeShare[2])).toBe('91.2');
    expect(percent(leftShare(ff.X, ffFit, 3))).toBe('8.8');
    expect(percent(leftShare(yc.X, ycFit, 3))).toBe('1.1');
  });

  test('playground: loadings of the 25 portfolios', () => {
    const [q1, q2, q3] = ffFit.loadings;
    expect(q1.every((v) => v > 0)).toBe(true);
    expect([fixed(Math.min(...q1)), fixed(Math.max(...q1))]).toEqual(['0.13', '0.28']);
    expect([ff.names[argmax(q2)], ff.names[argmin(q2)]]).toEqual(['ME1-BM1', 'ME5-BM5']);
    expect(q2.slice(0, 5).every((v) => v > 0) && q2.slice(20).every((v) => v < 0)).toBe(true); // small positive, big negative
    expect(q2[0]).toBeGreaterThan(q2[4]); // growth tilt among the smallest stocks
    const byMagnitude = q3.map((v, i) => [Math.abs(v), i]).sort((a, b) => b[0] - a[0]);
    expect([byMagnitude[0][1], byMagnitude[1][1]].sort((a, b) => a - b)).toEqual([0, 24]); // the two corners
    expect([percent(ffFit.share[2]), percent(ffFit.share[3])]).toEqual(['3.1', '2.6']);
  });

  test('playground: the sample from July 1963', () => {
    expect([late.dates[0], late.dates.at(-1)]).toEqual(['1963-07-01', '2026-08-01']);
    expect(lateFit.share.slice(0, 3).map((s) => percent(s))).toEqual(['83.2', '6.3', '3.5']);
    const q3 = lateFit.loadings[2];
    for (let size = 0; size < 5; size++) {
      const row = q3.slice(5 * size, 5 * size + 5);
      row.slice(1).forEach((v, i) => expect(v).toBeLessThan(row[i])); // falls from growth to value
    }
  });

  test('playground: level, slope and curvature of the yield curve', () => {
    expect(ycFit.share.slice(0, 3).map((s) => percent(s))).toEqual(['89.0', '7.7', '2.2']);
    const [q1, q2, q3] = ycFit.loadings;
    expect(q1.every((v) => v > 0)).toBe(true);
    expect([fixed(Math.min(...q1)), fixed(Math.max(...q1))]).toEqual(['0.12', '0.20']);
    expect([fixed(q2[0]), fixed(q2[29]), signChanges(q2)]).toEqual(['0.38', '-0.15', 1]);
    expect([q3[0] > 0, q3[29] > 0, q3[14] < 0, signChanges(q3)]).toEqual([true, true, true, 2]);
  });

  test('playground: rotating components 1 and 2 of the portfolios by 30°', () => {
    const total = totalOf(ffFit.values);
    const [w1, w2] = rotatePair(ffFit.loadings[0], ffFit.loadings[1], deg(30));
    const [s1, s2] = [w1, w2].map((w) => directionVariance(ffFit.covariance, w) / total);
    expect([percent(s1), percent(s2), percent(s1 + s2)]).toEqual(['63.9', '24.2', '88.1']);
    expect(percent(ffFit.share[1])).toBe('4.4');
    expect(percent(ffFit.cumulativeShare[1])).toBe('88.1');
  });

  test('quiz: eigenvalues 6, 3 and 1', () => {
    expect(6 / (6 + 3 + 1)).toBe(0.6);
  });
});
