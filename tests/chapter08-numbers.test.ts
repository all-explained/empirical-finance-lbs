/**
 * Every number in the prose of chapter 8, recomputed from ff3-monthly and the seeded
 * simulation through the library. If the data or the library changes, this test fails
 * before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import type { Series } from '../src/lib/data/series';
import { arithmeticMean, excessReturn, ff3MarketReturns, sampleVariance, simpleReturn } from '../src/lib/finance/returns';
import { betaPricing, crraSdf, hjRegion, price, riskFreeRate, riskPremiumFromCovariance } from '../src/lib/finance/sdf';
import { annualiseMean, annualiseVolatility } from '../src/lib/stats/moments';
import {
  CONSUMPTION, crraMoments, DEFAULT_SEED, DEFAULT_STATES, marketSharpe, PAYOFFS, probabilities,
} from '../src/components/plots/sdfSamples';

const series = ff3 as unknown as Series<'ff3-monthly'>;
const fixed = (v: number, digits: number) => v.toFixed(digits);
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const full = marketSharpe(series, '1926-07-01');
const { market, rf } = ff3MarketReturns(series);
const excess = market.map((m, t) => m - rf[t]);

const pi = probabilities(DEFAULT_STATES);
const sdf = DEFAULT_STATES.sdf;
const rfWidget = riskFreeRate(sdf, pi);
function priced(payoff: readonly number[]) {
  const p = price(payoff, sdf, pi);
  const meanPayoff = price(payoff, [1, 1], pi);
  const re = payoff.map((x) => excessReturn(simpleReturn(p, x), rfWidget));
  return { p, meanPayoff, expectedReturn: simpleReturn(p, meanPayoff), premium: riskPremiumFromCovariance(sdf, re, pi), ...betaPricing(sdf, re, pi) };
}
const lowestGamma = (seed: number) => {
  let gamma = 0;
  while (crraMoments(gamma, seed).maxSharpe < full.sharpe) gamma++;
  return gamma;
};

describe('chapter 8 prose numbers', () => {
  test('hook: the market excess return in ff3-monthly', () => {
    expect([full.start, full.end, full.months]).toEqual(['1926-07-01', '2026-08-01', 1202]);
    expect(percent(annualiseMean(arithmeticMean(excess)), 1)).toBe('8.3');
    expect(percent(annualiseVolatility(Math.sqrt(sampleVariance(excess))), 1)).toBe('18.4');
    expect(fixed(full.sharpe, 2)).toBe('0.45');
    expect(percent(full.sharpe, 0)).toBe('45'); // σ(M) at least 45% of its mean
  });

  test('intuition: the two-state widget', () => {
    expect([pi, sdf]).toEqual([[0.5, 0.5], [1.1, 0.8]]);
    const [stock, bond, insurance] = [PAYOFFS.stock, PAYOFFS.bond, PAYOFFS.insurance].map(priced);
    expect([stock, bond, insurance].map((a) => fixed(a.meanPayoff, 2))).toEqual(['1.05', '1.05', '1.05']);
    expect([fixed(stock.p, 3), fixed(bond.p, 3), fixed(insurance.p, 3)]).toEqual(['0.960', '0.998', '1.035']);
    expect([fixed(price([1, 1], sdf, pi), 2), percent(rfWidget, 1)]).toEqual(['0.95', '5.3']);
    expect(percent(bond.expectedReturn, 1)).toBe('5.3');
    expect([PAYOFFS.stock, PAYOFFS.insurance]).toEqual([[0.8, 1.3], [1.3, 0.8]]);
    expect([percent(stock.expectedReturn, 1), percent(stock.premium, 1)]).toEqual(['9.4', '4.1']);
    expect([percent(insurance.expectedReturn, 1), percent(insurance.premium, 1)]).toEqual(['1.4', '-3.8']);
    // The covariance premium equals E[R] − R^f, computed directly.
    expect(stock.premium).toBeCloseTo(stock.expectedReturn - rfWidget, 12);
  });

  test('formalisation: power utility and the beta form', () => {
    expect(fixed(crraSdf(0.99, 5, 1.02), 2)).toBe('0.90');
    expect(fixed(crraSdf(0.99, 5, 0.98), 2)).toBe('1.10');
    const stock = priced(PAYOFFS.stock);
    expect([fixed(stock.beta, 2), fixed(stock.lambda, 3), percent(stock.beta * stock.lambda, 1)]).toEqual(['-1.74', '-0.024', '4.1']);
  });

  test('playground: the seeded power-utility SDF', () => {
    expect([CONSUMPTION.delta, CONSUMPTION.draws, CONSUMPTION.growthMean, CONSUMPTION.growthVol, DEFAULT_SEED]).toEqual([0.99, 2000, 0.02, 0.02, 1]);
    expect(fixed(crraMoments(5, DEFAULT_SEED).maxSharpe, 2)).toBe('0.10');
    expect(lowestGamma(DEFAULT_SEED)).toBe(22);
    expect(lowestGamma(DEFAULT_SEED)).toBeGreaterThan(20); // "a risk aversion above 20"
    expect(percent(crraMoments(22, DEFAULT_SEED).riskFree, 1)).toBe('41.5');
    expect([1, 2, 3, 4, 5].map(lowestGamma)).toEqual([22, 22, 23, 23, 22]);
    // "far above any rate in the data": the highest monthly T-bill rate, annualised.
    expect(annualiseMean(Math.max(...rf))).toBeLessThan(0.2);
  });

  test('playground: limits of the estimated Sharpe ratio', () => {
    expect(fixed(full.standardError, 2)).toBe('0.10');
    expect(fixed(Math.sqrt(12 / full.months), 2)).toBe('0.10');
    expect([fixed(full.sharpe - 2 * full.standardError, 2), fixed(full.sharpe + 2 * full.standardError, 2)]).toEqual(['0.25', '0.65']);
    const since1963 = marketSharpe(series, '1963-07-01');
    const since2000 = marketSharpe(series, '2000-01-01');
    expect([fixed(since1963.sharpe, 2), fixed(since2000.sharpe, 2)]).toEqual(['0.47', '0.48']);
    expect([fixed(since1963.standardError, 2), fixed(since2000.standardError, 2)]).toEqual(['0.13', '0.19']);
    const meanRf = annualiseMean(arithmeticMean(rf));
    expect([percent(meanRf, 1), fixed(1 + meanRf, 3), fixed(1 / (1 + meanRf), 2)]).toEqual(['3.2', '1.032', '0.97']);
    expect(fixed(hjRegion([1 / (1 + meanRf)], full.sharpe)[0], 2)).toBe('0.44');
  });

  test('quizzes', () => {
    expect(fixed(price([2, 0], [1.2, 0.8], [0.5, 0.5]), 1)).toBe('1.2');
    expect(fixed(price([2, 0], [1, 1], [0.5, 0.5]), 1)).toBe('1.0');
    expect(fixed(hjRegion([0.97], 0.45)[0], 2)).toBe('0.44');
  });
});
