import { describe, expect, it } from 'vitest';
import { normalRng } from '../math/rng';
import { ols } from '../stats/ols';
import { arithmeticMean, sampleVariance } from './returns';
import {
  betaPricing, crraSdf, hjBoundSharpe, hjRegion, price, riskFreeRate, riskPremiumFromCovariance,
} from './sdf';

// Two equally likely states, solved by hand. Good state: M = 0.8, payoff 2. Bad state: M = 1.0, payoff 1.
// E[M] = 0.9, Var(M) = 0.01, σ(M) = 0.1. Price = 0.5 × 1.6 + 0.5 × 1.0 = 1.3.
// Gross R^f = 1/0.9 = 10/9. Gross return R = (2, 1)/1.3, E[R] = 15/13, σ(R) = 5/13.
// R^e = R - 10/9: E[R^e] = 15/13 - 10/9 = 5/117, Cov(M, R^e) = 1 - 0.9 × 15/13 = -1/26.
const probabilities = [0.5, 0.5];
const sdf = [0.8, 1.0];
const payoff = [2, 1];
const excess = payoff.map((x) => x / 1.3 - 10 / 9);

function moments(values: readonly number[], weights: readonly number[]) {
  const mean = values.reduce((sum, v, s) => sum + weights[s] * v, 0);
  const variance = values.reduce((sum, v, s) => sum + weights[s] * (v - mean) ** 2, 0);
  return { mean, std: Math.sqrt(variance) };
}

describe('SDF pricing', () => {
  it('builds the power-utility SDF', () => {
    // 0.96 × 1.2^-2 = 0.96 / 1.44 = 2/3; γ = 0 leaves M = β.
    expect(crraSdf(0.96, 2, 1.2)).toBeCloseTo(2 / 3, 14);
    expect(crraSdf(0.99, 0, 1.5)).toBe(0.99);
    expect(() => crraSdf(0.96, 2, 0)).toThrow(RangeError);
    expect(() => crraSdf(-1, 2, 1.1)).toThrow(RangeError);
  });

  it('prices payoffs as E[M x] in the two-state economy', () => {
    expect(price(payoff, sdf, probabilities)).toBeCloseTo(1.3, 14);
    // A unit riskless payoff costs E[M] = 0.9; any excess return costs zero.
    expect(price([1, 1], sdf, probabilities)).toBeCloseTo(0.9, 14);
    expect(price(excess, sdf, probabilities)).toBeCloseTo(0, 14);
    expect(() => price([1], sdf, probabilities)).toThrow(RangeError);
    expect(() => price(payoff, sdf, [0.5, 0.6])).toThrow(RangeError);
    expect(() => price(payoff, sdf, [1.5, -0.5])).toThrow(RangeError);
  });

  it('gives the net risk-free rate 1/E[M] - 1', () => {
    // 1/0.9 - 1 = 1/9.
    expect(riskFreeRate(sdf, probabilities)).toBeCloseTo(1 / 9, 14);
    expect(() => riskFreeRate([-1, -1], probabilities)).toThrow(RangeError);
  });

  it('gives the risk premium -(1 + R^f) Cov(M, R^e)', () => {
    // (10/9) × (1/26) = 5/117, which equals E[R^e] computed directly.
    expect(riskPremiumFromCovariance(sdf, excess, probabilities)).toBeCloseTo(5 / 117, 14);
    expect(moments(excess, probabilities).mean).toBeCloseTo(5 / 117, 14);
  });

  it('gives the beta and the price of risk λ_M', () => {
    // β = (-1/26) / 0.01 = -50/13; λ_M = -0.01/0.9 = -1/90; β λ_M = 5/117.
    const { beta, lambda } = betaPricing(sdf, excess, probabilities);
    expect(beta).toBeCloseTo(-50 / 13, 12);
    expect(lambda).toBeCloseTo(-1 / 90, 14);
    expect(beta * lambda).toBeCloseTo(5 / 117, 14);
    expect(() => betaPricing([1, 1], excess, probabilities)).toThrow(RangeError);
  });

  it('matches the OLS slope and sample moments with equally likely seeded states', () => {
    const z = normalRng(21);
    const n = 50;
    const m = Array.from({ length: n }, () => 0.95 + 0.1 * z());
    const re = m.map((value) => 0.05 - 0.4 * (value - 0.95) + 0.02 * z());
    const { beta, lambda } = betaPricing(m, re, Array(n).fill(1 / n));
    // OLS slope = sample Cov/sample Var; the n - 1 denominators cancel.
    expect(beta).toBeCloseTo(ols(re, [m]).coefficients[1], 12);
    // Population variance = sample variance × (n - 1)/n.
    expect(lambda).toBeCloseTo(-(sampleVariance(m) * (n - 1) / n) / arithmeticMean(m), 14);
  });
});

describe('Hansen–Jagannathan bound', () => {
  it('computes σ(M)/E[M] and the frontier E[M] |SR|', () => {
    // 0.1 / 0.9 = 1/9; 0.9 × 1/9 = 0.1 and 1.0 × 1/9 = 1/9.
    expect(hjBoundSharpe(0.9, 0.1)).toBeCloseTo(1 / 9, 14);
    hjRegion([0.9, 1.0], 1 / 9).forEach((bound, i) => expect(bound).toBeCloseTo([0.1, 1 / 9][i], 14));
    expect(hjRegion([0.9], -0.5)[0]).toBeCloseTo(0.45, 14);
    expect(() => hjBoundSharpe(0, 0.1)).toThrow(RangeError);
    expect(() => hjBoundSharpe(0.9, -0.1)).toThrow(RangeError);
    expect(() => hjRegion([0.9, 0], 0.5)).toThrow(RangeError);
  });

  it('holds with equality in two states, where M is linear in the payoff', () => {
    // Sharpe ratio of R^e: (5/117) / (5/13) = 1/9 = σ(M)/E[M].
    const { mean, std } = moments(excess, probabilities);
    expect(mean / std).toBeCloseTo(1 / 9, 14);
    expect(hjBoundSharpe(0.9, 0.1)).toBeCloseTo(mean / std, 14);
  });

  it('is strict for a nonlinear SDF and tight for its linear projection on R^e', () => {
    const p = [0.2, 0.5, 0.3];
    const m = [1.2, 0.95, 0.7];
    const gross = [0.5, 1, 2].map((x) => x / price([0.5, 1, 2], m, p));
    const re = gross.map((r) => r - (1 + riskFreeRate(m, p)));
    const asset = moments(re, p);
    const nonlinear = moments(m, p);
    // By hand: E[M] = 0.925, σ(M) = 0.175, bound = 0.1892; the asset's Sharpe ratio is 0.1845.
    expect(hjBoundSharpe(nonlinear.mean, nonlinear.std)).toBeCloseTo(0.175 / 0.925, 14);
    expect(asset.mean / asset.std).toBeCloseTo(0.1845, 4);
    expect(asset.mean / asset.std).toBeLessThan(hjBoundSharpe(nonlinear.mean, nonlinear.std) - 0.004);
    // M* = E[M] + b (R^e - E[R^e]) with b = -E[M] E[R^e] / Var(R^e) has the same E[M] and prices R^e.
    const b = -nonlinear.mean * asset.mean / asset.std ** 2;
    const linear = re.map((r) => nonlinear.mean + b * (r - asset.mean));
    expect(price(re, linear, p)).toBeCloseTo(0, 14);
    const { mean, std } = moments(linear, p);
    expect(hjBoundSharpe(mean, std)).toBeCloseTo(asset.mean / asset.std, 12);
    expect(hjRegion([mean], asset.mean / asset.std)[0]).toBeCloseTo(std, 12);
  });
});
