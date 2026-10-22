import { describe, expect, test } from 'vitest';
import ff25 from '../../data/series/ff25-size-bm-monthly.json';
import gsw from '../../data/series/gsw-zero-coupon.json';
import type { Series } from '../data/series';
import { normalRng } from '../math/rng';
import {
  covarianceMatrix, directionVariance, ff25Returns, gswYieldChanges, pca, projectOnDirection, reconstruct, reconstructionError,
  rotatePair, scores,
} from './pca';

// Hand example: mean zero, sample covariance [[10/3, 8/3], [8/3, 10/3]] with divisor T - 1 = 3.
// Eigenvalues 10/3 ± 8/3 = 6 and 2/3, eigenvectors (1, 1)/√2 and (1, -1)/√2 (or its negative).
const HAND = [[2, 1], [-2, -1], [1, 2], [-1, -2]];

/** A seeded T × 5 panel with correlated columns: one common shock plus noise. */
function seededPanel(T = 200, seed = 7): number[][] {
  const z = normalRng(seed);
  return Array.from({ length: T }, () => {
    const common = z();
    return [1, 0.8, 0.6, 0.4, 0.2].map((b, i) => b * common + (0.3 + 0.1 * i) * z() + i);
  });
}

describe('covarianceMatrix', () => {
  test('hand example', () => {
    const S = covarianceMatrix(HAND);
    expect(S[0][0]).toBeCloseTo(10 / 3, 12);
    expect(S[1][1]).toBeCloseTo(10 / 3, 12);
    expect(S[0][1]).toBeCloseTo(8 / 3, 12);
    expect(S[1][0]).toBe(S[0][1]);
  });

  test('rejects short, ragged and non-finite panels', () => {
    expect(() => covarianceMatrix([[1, 2]])).toThrow(RangeError);
    expect(() => covarianceMatrix([[1, 2], [3]])).toThrow(RangeError);
    expect(() => covarianceMatrix([[1, NaN], [3, 4]])).toThrow(RangeError);
  });
});

describe('pca', () => {
  test('hand example: eigenvalues, loadings and shares', () => {
    const fit = pca(HAND);
    expect(fit.values[0]).toBeCloseTo(6, 10);
    expect(fit.values[1]).toBeCloseTo(2 / 3, 10);
    expect(fit.loadings[0][0]).toBeCloseTo(Math.SQRT1_2, 10);
    expect(fit.loadings[0][1]).toBeCloseTo(Math.SQRT1_2, 10);
    expect(Math.abs(fit.loadings[1][0])).toBeCloseTo(Math.SQRT1_2, 10);
    expect(fit.loadings[1][0] * fit.loadings[1][1]).toBeCloseTo(-0.5, 10);
    expect(fit.share[0]).toBeCloseTo(0.9, 10); // 6 / (6 + 2/3)
    expect(fit.cumulativeShare[1]).toBeCloseTo(1, 12);
  });

  test('hand example: scores, reconstruction and error', () => {
    const fit = pca(HAND);
    const s = scores(HAND, fit, 1).map(([v]) => v);
    [3, -3, 3, -3].forEach((v, t) => expect(s[t]).toBeCloseTo(v / Math.SQRT2, 10));
    const fitted = reconstruct(HAND, fit, 1);
    [[1.5, 1.5], [-1.5, -1.5], [1.5, 1.5], [-1.5, -1.5]].forEach((row, t) => row.forEach((v, i) => expect(fitted[t][i]).toBeCloseTo(v, 10)));
    expect(reconstructionError(HAND, fit, 1)).toBeCloseTo(2, 10); // (T - 1) ℓ_2 = 3 × 2/3
    expect(reconstructionError(HAND, fit, 0)).toBeCloseTo(3 * (6 + 2 / 3), 10);
  });

  test('seeded panel: Σ = QLQ\', orthonormal loadings, trace = Σ ℓ', () => {
    const X = seededPanel();
    const fit = pca(X);
    const n = fit.values.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const rebuilt = fit.values.reduce((s, l, k) => s + l * fit.loadings[k][i] * fit.loadings[k][j], 0);
        expect(rebuilt).toBeCloseTo(fit.covariance[i][j], 10);
        const dot = fit.loadings[i].reduce((s, v, k) => s + v * fit.loadings[j][k], 0);
        expect(dot).toBeCloseTo(i === j ? 1 : 0, 10);
      }
    }
    const trace = fit.covariance.reduce((s, row, i) => s + row[i], 0);
    expect(fit.values.reduce((s, v) => s + v, 0)).toBeCloseTo(trace, 10);
    expect(fit.cumulativeShare.at(-1)).toBeCloseTo(1, 12);
    fit.loadings.forEach((q, k) => expect(directionVariance(fit.covariance, q)).toBeCloseTo(fit.values[k], 10));
  });

  test('seeded panel: scores are uncorrelated with variances ℓ_k', () => {
    const X = seededPanel();
    const fit = pca(X);
    const S = covarianceMatrix(scores(X, fit, 5));
    S.forEach((row, i) => row.forEach((v, j) => expect(v).toBeCloseTo(i === j ? fit.values[i] : 0, 10)));
  });

  test('seeded panel: error is (T - 1) Σ_{k>K} ℓ_k, and no unit direction beats q_1', () => {
    const X = seededPanel();
    const fit = pca(X);
    for (let K = 0; K <= 5; K++) {
      const tail = fit.values.slice(K).reduce((s, v) => s + v, 0);
      expect(reconstructionError(X, fit, K)).toBeCloseTo((X.length - 1) * tail, 8);
    }
    const best = reconstructionError(X, fit, 1);
    const z = normalRng(11);
    for (let draw = 0; draw < 200; draw++) {
      const w = Array.from({ length: 5 }, () => z());
      const norm = Math.hypot(...w);
      const u = w.map((v) => v / norm);
      const error = X.reduce((sum, row) => {
        const d = row.map((v, i) => v - fit.mean[i]);
        const s = d.reduce((acc, v, i) => acc + v * u[i], 0);
        return sum + d.reduce((acc, v, i) => acc + (v - s * u[i]) ** 2, 0);
      }, 0);
      expect(error).toBeGreaterThanOrEqual(best - 1e-9);
    }
  });

  test('rotatePair keeps the total variance of the pair; projectOnDirection matches reconstruct', () => {
    const fit = pca(HAND);
    const [w1, w2] = rotatePair(fit.loadings[0], fit.loadings[1], Math.PI / 4);
    // Rotating (1, 1)/√2 and (1, -1)/√2 by 45° gives (1, 0) and (0, -1) up to sign.
    expect(Math.abs(w1[0])).toBeCloseTo(1, 12);
    expect(Math.abs(w2[1])).toBeCloseTo(1, 12);
    expect(directionVariance(fit.covariance, w1)).toBeCloseTo(10 / 3, 10);
    expect(directionVariance(fit.covariance, w1) + directionVariance(fit.covariance, w2)).toBeCloseTo(6 + 2 / 3, 10);
    const fitted = reconstruct(HAND, fit, 1);
    HAND.forEach((z, t) => projectOnDirection(z, fit.mean, fit.loadings[0]).forEach((v, i) => expect(v).toBeCloseTo(fitted[t][i], 12)));
    expect(() => rotatePair([1], [0, 1], 0)).toThrow(RangeError);
  });

  test('rejects bad K and constant panels', () => {
    const fit = pca(HAND);
    expect(() => scores(HAND, fit, 3)).toThrow(RangeError);
    expect(() => scores(HAND, fit, 0.5)).toThrow(RangeError);
    expect(() => pca([[1, 1], [1, 1]])).toThrow(RangeError);
    expect(() => directionVariance(fit.covariance, [1])).toThrow(RangeError);
  });
});

describe('data panels', () => {
  test('ff25Returns: decimal returns in column order', () => {
    const p = ff25Returns(ff25 as unknown as Series<'ff25-size-bm-monthly'>);
    expect([p.X.length, p.names.length, p.dates[0], p.names[0], p.names[24]]).toEqual([1202, 25, '1926-07-01', 'ME1-BM1', 'ME5-BM5']);
    const raw = (ff25 as unknown as Series<'ff25-size-bm-monthly'>).rows[0];
    p.X[0].forEach((v, i) => expect(v).toBeCloseTo((raw[i + 1] as number) / 100, 12));
  });

  test('gswYieldChanges: first monthly change of every maturity', () => {
    const s = gsw as unknown as Series<'gsw-zero-coupon'>;
    const p = gswYieldChanges(s);
    expect([p.X.length, p.names.length, p.dates[0]]).toEqual([s.rows.length - 1, 30, s.rows[1][0]]);
    p.X[0].forEach((v, i) => expect(v).toBeCloseTo(((s.rows[1][i + 1] as number) - (s.rows[0][i + 1] as number)) / 100, 12));
  });
});
