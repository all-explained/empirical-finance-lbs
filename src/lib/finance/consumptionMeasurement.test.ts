import { describe, expect, it } from 'vitest';
import { normalRng } from '../math/rng';
import { autocorrelations } from '../stats/autocorr';
import { sampleAutocorrelation } from '../stats/var';
import {
  filterWeightFromKroencke, fourthQuarterGrowth, kroenckeUnfilterParameters, nipaFilter, simulateTimeAveraging,
  timeAveragedAutocorrelation, timeAveragedVarianceRatio, unfilter,
} from './consumptionMeasurement';
import { sampleVariance } from './returns';

const whiteNoise = (seed: number, T: number) => {
  const normal = normalRng(seed);
  return Array.from({ length: T }, () => normal());
};

describe('timeAveragedAutocorrelation and timeAveragedVarianceRatio', () => {
  it('give 0 and 1 for one step a period, and 1/6 and 3/4 for two', () => {
    expect(timeAveragedAutocorrelation(1)).toBe(0);
    expect(timeAveragedVarianceRatio(1)).toBe(1);
    // n = 2: (4 − 1)/(2 · 9) = 1/6 and (8 + 1)/12 = 3/4.
    expect(timeAveragedAutocorrelation(2)).toBeCloseTo(1 / 6, 15);
    expect(timeAveragedVarianceRatio(2)).toBeCloseTo(3 / 4, 15);
  });

  it('approach 1/4 and 2/3: within 1e-3 of 0.25 at 250 steps, within 1e-6 of 2/3 at 1,000', () => {
    expect(Math.abs(timeAveragedAutocorrelation(250) - 0.25)).toBeLessThan(1e-3);
    expect(Math.abs(timeAveragedVarianceRatio(1000) - 2 / 3)).toBeLessThan(1e-6);
  });

  it('match the moments of the triangular shock weights 1, 2, …, n, …, 2, 1 (over n) for n = 5', () => {
    const n = 5;
    const weights = Array.from({ length: 2 * n - 1 }, (_, i) => Math.min(i + 1, 2 * n - 1 - i) / n);
    const variance = weights.reduce((sum, w) => sum + w * w, 0);
    // The next period's growth uses the same weights shifted n shocks later.
    const covariance = weights.slice(n).reduce((sum, w, i) => sum + w * weights[i], 0);
    expect(timeAveragedAutocorrelation(n)).toBeCloseTo(covariance / variance, 14);
    expect(timeAveragedVarianceRatio(n)).toBeCloseTo(variance / n, 14);
  });

  it('reject a step count that is not a positive integer', () => {
    expect(() => timeAveragedAutocorrelation(0)).toThrow(RangeError);
    expect(() => timeAveragedVarianceRatio(2.5)).toThrow(RangeError);
  });
});

describe('simulateTimeAveraging', () => {
  it('averages the levels of each period and differences averages and period ends', () => {
    const { path, averages, averagedGrowth, endGrowth } = simulateTimeAveraging(7, { periods: 4, stepsPerPeriod: 3 });
    expect(path).toHaveLength(13);
    expect(path[0]).toBe(0);
    expect(averages[1]).toBeCloseTo((path[4] + path[5] + path[6]) / 3, 15);
    expect(averagedGrowth).toHaveLength(3);
    expect(averagedGrowth[0]).toBeCloseTo(averages[1] - averages[0], 15);
    expect(endGrowth).toEqual([path[6] - path[3], path[9] - path[6], path[12] - path[9]]);
    expect(simulateTimeAveraging(7, { periods: 4, stepsPerPeriod: 3 })).toEqual({ path, averages, averagedGrowth, endGrowth });
  });

  // 20,000 periods: the standard error of a first-order autocorrelation is about 1/sqrt(20,000) ≈ 0.007 and
  // that of a variance ratio about 0.01, so each band is about four standard errors.
  const long = simulateTimeAveraging(2026, { periods: 20000, stepsPerPeriod: 30, drift: 0.02, volatility: 0.01 });

  it('gives averaged growth the exact autocorrelation (n² − 1)/(2(2n² + 1)) ≈ 0.2496 at n = 30, within 0.03', () => {
    expect(Math.abs(sampleAutocorrelation(long.averagedGrowth, 1)[1] - timeAveragedAutocorrelation(30))).toBeLessThan(0.03);
    expect(Math.abs(sampleAutocorrelation(long.endGrowth, 1)[1])).toBeLessThan(0.03);
  });

  it('gives averaged growth (2n² + 1)/(3n²) ≈ 0.667 of the end-to-end variance at n = 30, within 0.03', () => {
    const ratio = sampleVariance(long.averagedGrowth) / sampleVariance(long.endGrowth);
    expect(Math.abs(ratio - timeAveragedVarianceRatio(30))).toBeLessThan(0.03);
  });

  it('scales drift and volatility per period: mean 0.02 within 5e-4, standard deviation 0.01 within 5e-4', () => {
    const mean = long.endGrowth.reduce((sum, g) => sum + g, 0) / long.endGrowth.length;
    expect(Math.abs(mean - 0.02)).toBeLessThan(5e-4);
    expect(Math.abs(Math.sqrt(sampleVariance(long.endGrowth)) - 0.01)).toBeLessThan(5e-4);
  });

  it('rejects fewer than two periods and a negative volatility', () => {
    expect(() => simulateTimeAveraging(1, { periods: 1 })).toThrow(RangeError);
    expect(() => simulateTimeAveraging(1, { volatility: -0.01 })).toThrow(RangeError);
  });
});

describe('nipaFilter and unfilter', () => {
  it('filter and unfilter [1, 2, 3] with weight 1/2 by hand: [1, 1.5, 2.25] and back to [2, 3]', () => {
    // 1 (start value); 0.5 · 2 + 0.5 · 1 = 1.5; 0.5 · 3 + 0.5 · 1.5 = 2.25.
    expect(nipaFilter([1, 2, 3], 0.5)).toEqual([1, 1.5, 2.25]);
    expect(unfilter([1, 1.5, 2.25], 0.5)).toEqual([2, 3]);
  });

  it('weight 0 is the identity', () => {
    const x = whiteNoise(3, 50);
    expect(nipaFilter(x, 0)).toEqual(x);
    expect(unfilter(x, 0)).toEqual(x.slice(1));
  });

  it('unfilter(nipaFilter(x, w), w) returns x after the first observation, to 1e-12', () => {
    const x = whiteNoise(11, 500).map((z) => 0.02 + 0.01 * z);
    for (const w of [0.2, 0.4, 0.6, 0.9]) {
      const back = unfilter(nipaFilter(x, w), w);
      expect(back).toHaveLength(x.length - 1);
      expect(Math.max(...back.map((value, t) => Math.abs(value - x[t + 1])))).toBeLessThan(1e-12);
    }
  });

  // 100,000 draws: the sample variance ratio has a standard error of at most 0.003 and the autocorrelation
  // about 0.003, so a band of 0.01 is more than three standard errors.
  it('turns white noise into an AR(1) with persistence w and (1 − w)/(1 + w) of its variance, within 0.01', () => {
    const x = whiteNoise(29, 100000);
    for (const w of [0.2, 0.6]) {
      const filtered = nipaFilter(x, w);
      expect(Math.abs(sampleVariance(filtered) / sampleVariance(x) - (1 - w) / (1 + w))).toBeLessThan(0.01);
      expect(Math.abs(autocorrelations(filtered, 1)[1] - w)).toBeLessThan(0.01);
    }
  });

  it('reject a weight outside [0, 1)', () => {
    expect(() => nipaFilter([1, 2], 1)).toThrow(RangeError);
    expect(() => unfilter([1, 2], -0.1)).toThrow(RangeError);
  });
});

describe('filterWeightFromKroencke', () => {
  it("maps Kroencke's recommended 0.80 and 0.40 to the weights 0.20 and 0.60", () => {
    expect(filterWeightFromKroencke(kroenckeUnfilterParameters.timeAveraged)).toBeCloseTo(0.2, 15);
    expect(filterWeightFromKroencke(kroenckeUnfilterParameters.timeAveragedAndFiltered)).toBeCloseTo(0.6, 15);
  });

  it('weight 0.20 leaves (1 − w)/(1 + w) = 2/3 of the variance, the time-averaging ratio', () => {
    const w = filterWeightFromKroencke(kroenckeUnfilterParameters.timeAveraged);
    expect((1 - w) / (1 + w)).toBeCloseTo(2 / 3, 14);
  });

  it('rejects a parameter outside (0, 1]', () => {
    expect(() => filterWeightFromKroencke(0)).toThrow(RangeError);
    expect(() => filterWeightFromKroencke(1.2)).toThrow(RangeError);
  });
});

describe('fourthQuarterGrowth', () => {
  it('differences fourth quarters a year apart on a hand-built path and skips a year with no Q4 before it', () => {
    const dates = [
      '2000-01-01', '2000-04-01', '2000-07-01', '2000-10-01',
      '2001-01-01', '2001-04-01', '2001-07-01', '2001-10-01',
      '2002-01-01', '2002-04-01', '2002-07-01', '2002-10-01',
      '2004-10-01',
    ];
    const c = [1.0, 1.1, 1.2, 1.3, 1.35, 1.4, 1.45, 1.5, 1.6, 1.7, 1.8, 1.9, 2.5];
    const { dates: years, growth } = fourthQuarterGrowth(dates, c);
    // 2001: 1.5 − 1.3 = 0.2; 2002: 1.9 − 1.5 = 0.4; 2004 has no 2003-Q4.
    expect(years).toEqual(['2001-10-01', '2002-10-01']);
    expect(growth[0]).toBeCloseTo(0.2, 14);
    expect(growth[1]).toBeCloseTo(0.4, 14);
  });

  it('rejects dates and values of different lengths', () => {
    expect(() => fourthQuarterGrowth(['2000-10-01'], [1, 2])).toThrow(RangeError);
  });
});
