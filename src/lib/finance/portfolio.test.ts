import { describe, expect, it } from 'vitest';
import { inverse } from '../math/linalg';
import { normalRng } from '../math/rng';
import {
  betas, frontier, maxSharpeSquared, minVarianceWeights, sampleCovariance, sampleMeans, securityMarketLine,
  tangencyWeights,
} from './portfolio';

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
const dot = (x: readonly number[], y: readonly number[]) => sum(x.map((value, i) => value * y[i]));
const times = (A: readonly (readonly number[])[], x: readonly number[]) => A.map((row) => dot(row, x));

// Two uncorrelated assets, solved by hand: σ = (0.1, 0.2), so Σ = diag(0.01, 0.04).
const mu2 = [0.1, 0.2];
const Sigma2 = [[0.01, 0], [0, 0.04]];

// Three correlated assets, checked against the closed form of Merton (1972):
// σ_p²(m) = (A m² - 2 B m + C) / D with A = 1'Σ⁻¹1, B = 1'Σ⁻¹μ, C = μ'Σ⁻¹μ, D = AC - B².
const mu3 = [0.08, 0.12, 0.15];
const Sigma3 = [[0.04, 0.006, 0.002], [0.006, 0.09, 0.009], [0.002, 0.009, 0.16]];
const inv3 = inverse(Sigma3);
const ones3 = [1, 1, 1];
const A = dot(ones3, times(inv3, ones3));
const B = dot(ones3, times(inv3, mu3));
const C = dot(mu3, times(inv3, mu3));
const D = A * C - B * B;

describe('sample moments of a return matrix', () => {
  // Three periods, two assets. Means (0.03, 0.01); deviations (-0.02, 0, 0.02) and (0.01, -0.01, 0).
  // Var = 0.0008/2 and 0.0002/2; Cov = (-0.0002)/2.
  const returns = [[0.01, 0.02], [0.03, 0.0], [0.05, 0.01]];

  it('gives the mean of each column', () => {
    const means = sampleMeans(returns);
    expect(means[0]).toBeCloseTo(0.03, 15);
    expect(means[1]).toBeCloseTo(0.01, 15);
    expect(() => sampleMeans([])).toThrow(RangeError);
    expect(() => sampleMeans([[1, 2], [3]])).toThrow(RangeError);
  });

  it('gives the T - 1 covariance matrix', () => {
    const S = sampleCovariance(returns);
    expect(S[0][0]).toBeCloseTo(0.0004, 15);
    expect(S[1][1]).toBeCloseTo(0.0001, 15);
    expect(S[0][1]).toBeCloseTo(-0.0001, 15);
    expect(S[1][0]).toBe(S[0][1]);
    expect(() => sampleCovariance([[0.01, 0.02]])).toThrow(RangeError);
  });
});

describe('minimum-variance weights', () => {
  it('solves the two-asset case by hand', () => {
    // With two assets the constraints fix w: w₁ = (μ₂ - m)/(μ₂ - μ₁).
    const half = minVarianceWeights(mu2, Sigma2, 0.15);
    expect(half[0]).toBeCloseTo(0.5, 14);
    expect(half[1]).toBeCloseTo(0.5, 14);
    const levered = minVarianceWeights(mu2, Sigma2, 0.25);
    expect(levered[0]).toBeCloseTo(-0.5, 14);
    expect(levered[1]).toBeCloseTo(1.5, 14);
  });

  it('matches the three-asset closed form', () => {
    const target = 0.11;
    const w = minVarianceWeights(mu3, Sigma3, target);
    expect(sum(w)).toBeCloseTo(1, 14);
    expect(dot(w, mu3)).toBeCloseTo(target, 14);
    expect(dot(w, times(Sigma3, w))).toBeCloseTo((A * target ** 2 - 2 * B * target + C) / D, 14);
    // At m = B/A the frontier is the global minimum-variance portfolio Σ⁻¹1 / A.
    const gmv = minVarianceWeights(mu3, Sigma3, B / A);
    times(inv3, ones3).forEach((value, i) => expect(gmv[i]).toBeCloseTo(value / A, 14));
  });

  it('rejects equal means and mismatched shapes', () => {
    expect(() => minVarianceWeights([0.1, 0.1], Sigma2, 0.1)).toThrow(RangeError);
    expect(() => minVarianceWeights(mu3, Sigma2, 0.1)).toThrow(RangeError);
    expect(() => minVarianceWeights(mu2, [[0.01, 0.01], [0.01, 0.01]], 0.1)).toThrow(/singular/);
  });
});

describe('frontier', () => {
  it('traces the two-asset frontier by hand', () => {
    // m = 0.1: all in asset 1, σ = 0.1. m = 0.15: σ² = 0.25 × 0.01 + 0.25 × 0.04 = 0.0125.
    // m = 0.25: σ² = 0.25 × 0.01 + 2.25 × 0.04 = 0.0925.
    const points = frontier(mu2, Sigma2, [0.1, 0.15, 0.25]);
    expect(points.map((p) => p.mean)).toEqual([0.1, 0.15, 0.25]);
    expect(points[0].volatility).toBeCloseTo(0.1, 14);
    expect(points[1].volatility).toBeCloseTo(Math.sqrt(0.0125), 14);
    expect(points[2].volatility).toBeCloseTo(Math.sqrt(0.0925), 14);
    expect(points[1].weights[0]).toBeCloseTo(0.5, 14);
  });

  it('matches the three-asset closed-form hyperbola', () => {
    const targets = [0, 0.05, 0.1, 0.15, 0.2];
    for (const { mean, volatility, weights } of frontier(mu3, Sigma3, targets)) {
      expect(volatility).toBeCloseTo(Math.sqrt((A * mean ** 2 - 2 * B * mean + C) / D), 14);
      expect(dot(weights, mu3)).toBeCloseTo(mean, 14);
    }
    expect(frontier(mu3, Sigma3, [])).toEqual([]);
  });
});

describe('tangency portfolio', () => {
  // Excess means (0.05, 0.10) with Σ = diag(0.01, 0.04): Σ⁻¹μᵉ = (5, 2.5), which sums to 7.5.
  const excess2 = [0.05, 0.1];

  it('solves the two-asset case by hand', () => {
    const w = tangencyWeights(excess2, Sigma2);
    expect(w[0]).toBeCloseTo(2 / 3, 14);
    expect(w[1]).toBeCloseTo(1 / 3, 14);
    expect(() => tangencyWeights([0.05, -0.2], Sigma2)).toThrow(RangeError);
  });

  it('gives the squared Sharpe ratio μᵉ\'Σ⁻¹μᵉ', () => {
    // 0.05 × 5 + 0.10 × 2.5 = 0.5: two independent assets each with SR² = 0.25.
    expect(maxSharpeSquared(excess2, Sigma2)).toBeCloseTo(0.5, 14);
    // Three assets: the tangency portfolio's own SR² equals μᵉ'Σ⁻¹μᵉ, and no random portfolio beats it.
    const excess3 = mu3.map((m) => m - 0.03);
    const w = tangencyWeights(excess3, Sigma3);
    const best = maxSharpeSquared(excess3, Sigma3);
    expect(best).toBeCloseTo(dot(excess3, times(inv3, excess3)), 14);
    expect(dot(w, excess3) ** 2 / dot(w, times(Sigma3, w))).toBeCloseTo(best, 14);
    const draw = normalRng(20);
    for (let k = 0; k < 200; k++) {
      const v = [draw(), draw(), draw()];
      expect(dot(v, excess3) ** 2 / dot(v, times(Sigma3, v))).toBeLessThanOrEqual(best + 1e-12);
    }
  });
});

describe('betas and the security market line', () => {
  it('recovers exact betas of linear returns', () => {
    const market = [0.02, -0.01, 0.03, 0.0, -0.02];
    const assets = market.map((m) => [0.001 + 1.5 * m, -0.5 * m]);
    const [b1, b2] = betas(assets, market);
    expect(b1).toBeCloseTo(1.5, 12);
    expect(b2).toBeCloseTo(-0.5, 12);
    expect(() => betas(assets, market.slice(1))).toThrow(RangeError);
  });

  it('matches Cov(R^e_j, R^e_m) / Var(R^e_m) on seeded noisy returns', () => {
    const draw = normalRng(7);
    const market = Array.from({ length: 240 }, () => 0.005 + 0.045 * draw());
    const assets = market.map((m) => [0.8 * m + 0.02 * draw(), 1.2 * m + 0.03 * draw()]);
    const S = sampleCovariance(market.map((m, t) => [m, ...assets[t]]));
    betas(assets, market).forEach((beta, j) => expect(beta).toBeCloseTo(S[0][j + 1] / S[0][0], 12));
  });

  it('fits the security market line', () => {
    // Exact line E[R^e] = 0.01 + 0.04 β.
    const exact = securityMarketLine([0.5, 1, 1.5], [0.03, 0.05, 0.07]);
    expect(exact.intercept).toBeCloseTo(0.01, 14);
    expect(exact.slope).toBeCloseTo(0.04, 14);
    // β = (0.7, 0.9, 1.1, 1.3), means (0.05, 0.04, 0.06, 0.05). Deviations: β (-0.3, -0.1, 0.1, 0.3),
    // means (0, -0.01, 0.01, 0). Slope = 0.002/0.2 = 0.01; intercept = 0.05 - 0.01 × 1.0 = 0.04.
    const noisy = securityMarketLine([0.7, 0.9, 1.1, 1.3], [0.05, 0.04, 0.06, 0.05]);
    expect(noisy.slope).toBeCloseTo(0.01, 14);
    expect(noisy.intercept).toBeCloseTo(0.04, 14);
  });
});
