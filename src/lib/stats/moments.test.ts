import { describe, expect, it } from 'vitest';
import { normalRng } from '../math/rng';
import { ols } from './ols';
import {
  annualiseMean, annualiseSharpe, annualiseVolatility, excessKurtosis, histogram, meanStandardError,
  sharpeRatio, skewness,
} from './moments';

/* Hand-worked sample x = [1, 2, 3, 4, 10], checked with exact Python fractions:
 * mean 4, deviations [-3, -2, -1, 0, 6], sum of squares 50, s² = 50 / 4 = 12.5.
 * Divisor-T central moments: m2 = 50/5 = 10, m3 = 180/5 = 36, m4 = 1394/5 = 278.8.
 */
const x = Object.freeze([1, 2, 3, 4, 10]);

describe('sample moments', () => {
  it('gives the standard error of the mean, s / √T, equal to the intercept-only OLS standard error', () => {
    // √(12.5 / 5) = √2.5 = 1.5811388300841898.
    expect(meanStandardError(x)).toBeCloseTo(1.5811388300841898, 14);
    expect(meanStandardError(x)).toBeCloseTo(ols([...x], []).standardErrors[0], 12);
    expect(() => meanStandardError([1])).toThrow(RangeError);
  });

  it('divides the mean excess return by its sample standard deviation', () => {
    // 4 / √12.5 = 1.131370849898476.
    expect(sharpeRatio(x)).toBeCloseTo(1.131370849898476, 14);
    expect(sharpeRatio([-1, -3])).toBeCloseTo(-2 / Math.SQRT2, 14);
    expect(() => sharpeRatio([0.01, 0.01])).toThrow(RangeError);
  });

  it('annualises monthly figures: mean × 12, volatility and Sharpe × √12', () => {
    // 0.01 × 12 = 0.12; 0.04 × √12 = 0.13856406460551018; 0.25 × √12 = 0.8660254037844386.
    expect(annualiseMean(0.01)).toBeCloseTo(0.12, 14);
    expect(annualiseVolatility(0.04)).toBeCloseTo(0.13856406460551018, 14);
    expect(annualiseSharpe(0.25)).toBeCloseTo(0.8660254037844386, 14);
    // Annualising mean and volatility separately gives the annualised Sharpe ratio: √12 × 1.1313... = 3.919183588453085.
    expect(annualiseMean(4) / annualiseVolatility(Math.sqrt(12.5))).toBeCloseTo(annualiseSharpe(sharpeRatio(x)), 14);
    expect(annualiseSharpe(sharpeRatio(x))).toBeCloseTo(3.919183588453085, 14);
    expect(annualiseMean(0.001, 252)).toBeCloseTo(0.252, 14);
    expect(() => annualiseMean(0.01, 0)).toThrow(RangeError);
    expect(() => annualiseVolatility(-0.04)).toThrow(RangeError);
    expect(() => annualiseSharpe(NaN)).toThrow(RangeError);
  });

  it('computes divisor-T skewness and excess kurtosis', () => {
    // g1 = 36 / 10^1.5 = 1.1384199576606167; g2 = 278.8 / 100 - 3 = -0.212.
    expect(skewness(x)).toBeCloseTo(1.1384199576606167, 14);
    expect(excessKurtosis(x)).toBeCloseTo(-0.212, 14);
    // Two points: symmetric (g1 = 0), m4 / m2² = 1 so g2 = -2.
    expect(skewness([0, 1])).toBe(0);
    expect(excessKurtosis([0, 1])).toBeCloseTo(-2, 14);
    // Mirroring the sample flips the sign of skewness only.
    expect(skewness(x.map((v) => -v))).toBeCloseTo(-1.1384199576606167, 14);
    expect(() => skewness([2, 2, 2])).toThrow(RangeError);
    expect(() => excessKurtosis([1])).toThrow(RangeError);
  });

  it('is near zero for many seeded normal draws', () => {
    const z = normalRng(7);
    const draws = Array.from({ length: 200_000 }, () => z());
    // Standard errors are about √(6/T) = 0.0055 and √(24/T) = 0.011.
    expect(Math.abs(skewness(draws))).toBeLessThan(0.03);
    expect(Math.abs(excessKurtosis(draws))).toBeLessThan(0.06);
  });
});

describe('histogram', () => {
  it('uses numpy.histogram equal-width bins with the last bin closed', () => {
    // Range [1, 10] in 3 bins of width 3: [1, 4) holds 1, 2, 3; [4, 7) holds 4; [7, 10] holds 10.
    expect(histogram(x, 3)).toEqual({ edges: [1, 4, 7, 10], counts: [3, 1, 1] });
    // All equal: numpy uses value ± 0.5.
    expect(histogram([2, 2], 2)).toEqual({ edges: [1.5, 2, 2.5], counts: [0, 2] });
    expect(() => histogram([], 3)).toThrow(RangeError);
    expect(() => histogram(x, 0)).toThrow(RangeError);
    expect(() => histogram([1, NaN], 2)).toThrow(RangeError);
  });

  it('puts every seeded draw inside its own bin edges', () => {
    const z = normalRng(11);
    const draws = Array.from({ length: 10_000 }, () => z());
    const { edges, counts } = histogram(draws, 37);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(draws.length);
    expect(edges.length).toBe(38);
    const recount = Array(37).fill(0);
    for (const v of draws) recount[edges.findIndex((e, i) => i === 36 ? v <= edges[37] : v >= e && v < edges[i + 1])]++;
    expect(recount).toEqual(counts);
  });
});
