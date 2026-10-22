/**
 * Every number in the prose of chapter 2, recomputed from ff3-monthly and the seeded
 * simulation through the library. If the data or the library changes, this test fails
 * before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import type { Series } from '../src/lib/data/series';
import { arithmeticMean, sampleVariance } from '../src/lib/finance/returns';
import { cdf } from '../src/lib/math/normal';
import {
  annualiseMean, annualiseSharpe, annualiseVolatility, excessKurtosis, meanStandardError, sharpeRatio, skewness,
} from '../src/lib/stats/moments';
import {
  DEFAULT_SEED, SAMPLES, TRUE_MEAN, TRUE_VOL, marketExcess, sampleMoments, simulateSamples,
} from '../src/components/plots/meanSampling';

const { dates, excess } = marketExcess(ff3 as unknown as Series<'ff3-monthly'>);
const T = excess.length;
const mean = arithmeticMean(excess);
const sd = Math.sqrt(sampleVariance(excess));
const se = meanStandardError(excess);
const kurt = excessKurtosis(excess);
const pct = (v: number, digits: number) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const sub = (keep: (date: string) => boolean) => excess.filter((_, i) => keep(dates[i]));
const pre = sub((d) => d < '1947-01-01');
const post = sub((d) => d >= '1947-01-01');
// se(σ̂)/σ ≈ √((2 + excess kurtosis)/(4T)), from the Formalisation.
const relSeVol = (k: number) => Math.sqrt((2 + k) / (4 * T));

describe('chapter 2 prose numbers', () => {
  test('hook: the sample and the equity premium', () => {
    expect([dates[0], dates.at(-1), T]).toEqual(['1926-07-01', '2026-08-01', 1202]);
    expect(pct(mean, 2)).toBe('0.70');
    expect(pct(annualiseMean(mean), 1)).toBe('8.3');
    expect(pct(annualiseMean(se), 1)).toBe('1.8');
    expect(pct(annualiseMean(mean - 2 * se), 1)).toBe('4.7');
    expect(pct(annualiseMean(mean + 2 * se), 1)).toBe('12.0');
    expect(pct(annualiseVolatility(sd), 1)).toBe('18.4');
    // "give or take less than one percentage point", even with fat tails
    expect(annualiseVolatility(sd) * relSeVol(kurt)).toBeLessThan(0.01);
  });

  test('formalisation: standard errors and the Sharpe ratio', () => {
    expect(pct(sd, 2)).toBe('5.30');
    expect(pct(se, 2)).toBe('0.15');
    expect(fixed(mean / se, 1)).toBe('4.5');
    expect(fixed(T / 12, 0)).toBe('100');
    expect((annualiseVolatility(sd) / 0.01) ** 2).toBeCloseTo(340, -1); // years for a 1% standard error
    expect(pct(relSeVol(0), 1)).toBe('2.0'); // 1/√(2T)
    expect(pct(se / mean, 0)).toBe('22');
    const sr = sharpeRatio(excess);
    expect([fixed(sr, 2), fixed(annualiseSharpe(sr), 2)]).toEqual(['0.13', '0.45']);
    expect(fixed(annualiseMean(se) / annualiseVolatility(sd), 2)).toBe('0.10');
  });

  test('playground: fat tails and the subsamples', () => {
    expect([fixed(skewness(excess), 2), fixed(kurt, 1)]).toEqual(['0.15', '7.4']);
    const z = excess.map((v) => (v - mean) / sd);
    expect([z.filter((v) => v < -3).length, z.filter((v) => v > 3).length]).toEqual([11, 6]);
    expect(fixed(T * cdf(-3), 1)).toBe('1.6');
    const worst = excess.indexOf(Math.min(...excess));
    const best = excess.indexOf(Math.max(...excess));
    expect([dates[worst], pct(excess[worst], 1), fixed(z[worst], 1)]).toEqual(['1931-09-01', '-28.7', '-5.6']);
    expect([dates[best], pct(excess[best], 1), fixed(z[best], 1)]).toEqual(['1933-04-01', '38.8', '7.2']);
    expect(z.filter((v) => Math.abs(v) > 5).length).toBeGreaterThanOrEqual(3); // "several" five-SD months
    expect(pct(excess.filter((v) => v < 0).length / T, 0)).toBe('39');
    expect([fixed(skewness(pre), 2), fixed(skewness(post), 2), fixed(excessKurtosis(post), 1)]).toEqual(['0.49', '-0.49', '1.7']);
    expect([pct(annualiseVolatility(Math.sqrt(sampleVariance(pre))), 1), pct(annualiseVolatility(Math.sqrt(sampleVariance(post))), 1)])
      .toEqual(['28.1', '14.9']);
    expect(pct(relSeVol(kurt), 1)).toBe('4.4');
    expect(fixed(se / mean / relSeVol(kurt), 0)).toBe('5'); // "five times better than the mean"
  });

  test('intuition: the seeded simulation', () => {
    expect([DEFAULT_SEED, SAMPLES, pct(TRUE_MEAN, 1), pct(TRUE_VOL, 1)]).toEqual([1, 1000, '0.5', '4.5']);
    expect([pct(annualiseMean(TRUE_MEAN), 1), pct(annualiseVolatility(TRUE_VOL), 1)]).toEqual(['6.0', '15.6']);
    const samples = simulateSamples(DEFAULT_SEED);
    const spread = (n: number) => annualiseMean(Math.sqrt(sampleVariance(sampleMoments(samples, n).means)));
    const at600 = sampleMoments(samples, 600);
    const volSpread = annualiseVolatility(Math.sqrt(sampleVariance(at600.vols)));
    const relMean = spread(600) / annualiseMean(TRUE_MEAN);
    const relVol = volSpread / annualiseVolatility(TRUE_VOL);
    expect([pct(spread(600), 1), pct(spread(150), 1)]).toEqual(['2.2', '4.5']);
    expect(spread(150) / spread(600)).toBeCloseTo(2, 1); // "the spread doubles"
    expect([pct(relMean, 0), pct(relVol, 0)]).toEqual(['37', '3']);
    expect(relMean / relVol).toBeGreaterThan(10); // "more than ten times as precise"
    const at60 = sampleMoments(samples, 60).means;
    expect(pct(at60.filter((m) => m < 0).length / SAMPLES, 0)).toBe('21');
    // The market's ±2 s.e. bar over the last 600 months is about as wide as the simulated cloud.
    const market600 = annualiseMean(meanStandardError(excess.slice(-600)));
    expect(pct(market600, 1)).toBe(pct(spread(600), 1));
  });
});
