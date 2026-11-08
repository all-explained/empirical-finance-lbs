/**
 * Every number in the prose of chapter 36, recomputed from fred-consumption-annual, goyal-welch-annual and
 * fred-cay-quarterly, and from the seeded time-averaging simulation, through the library and the widgets'
 * sample helper. If the data or the library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import cay from '../src/data/series/fred-cay-quarterly.json';
import consumption from '../src/data/series/fred-consumption-annual.json';
import goyalWelch from '../src/data/series/goyal-welch-annual.json';
import type { Series } from '../src/lib/data/series';
import {
  filterWeightFromKroencke, kroenckeUnfilterParameters, nipaFilter, timeAveragedAutocorrelation,
  timeAveragedVarianceRatio,
} from '../src/lib/finance/consumptionMeasurement';
import {
  annualConsumption, annualSample, puzzleMoments, type ConsumptionSample,
} from '../src/lib/finance/consumptionPuzzle';
import { sampleVariance } from '../src/lib/finance/returns';
import {
  AVERAGING, averagingSimulation, consumptionMeasures, DEFAULT_AVERAGING_SEED, measureStats,
} from '../src/components/plots/consumptionSample';
import { normalRng } from '../src/lib/math/rng';

const data = {
  consumption: consumption as unknown as Series<'fred-consumption-annual'>,
  goyalWelch: goyalWelch as unknown as Series<'goyal-welch-annual'>,
  cay: cay as unknown as Series<'fred-cay-quarterly'>,
};
const pct = (v: number) => (v * 100).toFixed(2);
const fixed = (v: number, digits = 2) => v.toFixed(digits);
const row = (s: ReturnType<typeof measureStats>) => [pct(s.sd), fixed(s.autocorrelation), fixed(s.correlation), s.gamma.toFixed(0)];
const through = (sample: ConsumptionSample, end: number): ConsumptionSample => {
  const k = sample.dates.filter((d) => Number(d.slice(0, 4)) <= end).length;
  return { dates: sample.dates.slice(0, k), dc: sample.dc.slice(0, k), r: sample.r.slice(0, k), rf: sample.rf.slice(0, k), re: sample.re.slice(0, k) };
};
const [low, high] = [kroenckeUnfilterParameters.timeAveraged, kroenckeUnfilterParameters.timeAveragedAndFiltered].map(filterWeightFromKroencke);
const full = { low: consumptionMeasures(data, low), high: consumptionMeasures(data, high) };
const postwar = { low: consumptionMeasures(data, low, 1953), high: consumptionMeasures(data, high, 1953) };

describe('chapter 36 prose numbers', () => {
  test('hook and playground: measured consumption, 1931–2025', () => {
    const s = measureStats(full.high.annual);
    expect([s.first, s.last, s.observations]).toEqual([1931, 2025, 95]);
    expect(row(s)).toEqual(['2.08', '0.32', '0.03', '849']);
  });

  test('intuition: exact autocorrelations and the default simulation', () => {
    expect([1, 2, 3, 10, 90].map((n) => fixed(timeAveragedAutocorrelation(n), 3))).toEqual(['0.000', '0.167', '0.211', '0.246', '0.250']);
    expect(fixed(timeAveragedVarianceRatio(90), 3)).toBe('0.667');
    expect(DEFAULT_AVERAGING_SEED).toBe(36);
    const sim = averagingSimulation(DEFAULT_AVERAGING_SEED, 90);
    expect([sim.averagedGrowth.length, AVERAGING.periods - 1]).toEqual([399, 399]);
    expect([fixed(sim.autocorrelation, 3), fixed(sim.varianceRatio, 3)]).toEqual(['0.288', '0.610']);
  });

  test('formalisation: the filter facts, Kroencke\'s weights and the 1/5 that matches averaging', () => {
    expect([fixed(low), fixed(high)]).toEqual(['0.20', '0.60']);
    expect([kroenckeUnfilterParameters.timeAveraged * 0.5, kroenckeUnfilterParameters.timeAveragedAndFiltered]).toEqual([0.4, 0.4]);
    // A weight of 1/5 keeps (1 − φ)/(1 + φ) = 2/3 of the variance, the share that averaging keeps.
    expect((1 - 0.2) / (1 + 0.2)).toBeCloseTo(2 / 3, 12);
    expect(fixed(1 / (1 - high), 1)).toBe('2.5');
    // Fact 1 and fact 2 on seeded white noise.
    const normal = normalRng(36);
    const white = Array.from({ length: 100_000 }, () => normal());
    const filtered = nipaFilter(white, 0.5);
    expect(sampleVariance(filtered) / sampleVariance(white)).toBeCloseTo(1 / 3, 2);
  });

  test('formalisation: three measures on 1953–2025', () => {
    const annual = measureStats(postwar.high.annual);
    expect([annual.first, annual.last, annual.observations]).toEqual([1953, 2025, 73]);
    expect(row(annual)).toEqual(['1.50', '0.12', '0.01', '2313']);
    const q4 = measureStats(postwar.high.q4);
    expect([q4.first, q4.observations]).toEqual([1953, 73]);
    expect(row(q4)).toEqual(['1.54', '0.07', '0.30', '100']);
    expect(row(measureStats(postwar.low.unfiltered))).toEqual(['1.86', '-0.09', '0.08', '313']);
    expect(row(measureStats(postwar.high.unfiltered))).toEqual(['4.13', '-0.38', '0.19', '59']);
    expect(data.cay.rows[0][0]).toBe('1951-10-01');
  });

  test('formalisation: the 1930 start, the sample to 2019 and the timing', () => {
    const c = annualConsumption(data.consumption);
    const from1930 = annualSample(c, data.goyalWelch);
    expect(from1930.dates[0]).toBe('1930-01-01');
    expect(measureStats(from1930).gamma.toFixed(0)).toBe('271');
    expect(fixed(measureStats(through(postwar.high.annual, 2019)).autocorrelation)).toBe('0.47');
    const unfiltered2019 = measureStats(through(postwar.high.unfiltered, 2019));
    expect([fixed(unfiltered2019.autocorrelation), fixed(unfiltered2019.correlation), unfiltered2019.gamma.toFixed(0)]).toEqual(['-0.10', '0.23', '71']);
    const nextYear = annualSample(c, data.goyalWelch, { timing: 'next-year' });
    expect(fixed(puzzleMoments(nextYear, 1).annual.correlation)).toBe('0.53');
    expect(fixed(measureStats(from1930).correlation)).toBe('0.07');
  });

  test('playground: Kroencke\'s two weights on 1931–2025', () => {
    expect(row(measureStats(full.high.unfiltered))).toEqual(['5.02', '-0.25', '0.15', '58']);
    expect(row(measureStats(full.low.unfiltered))).toEqual(['2.45', '0.11', '0.07', '260']);
    const annual = measureStats(full.high.annual);
    expect(annual.gamma / measureStats(full.high.unfiltered).gamma).toBeGreaterThan(10);
    expect(measureStats(postwar.high.annual).gamma / measureStats(postwar.high.unfiltered).gamma).toBeGreaterThan(10);
    const extreme = measureStats(consumptionMeasures(data, 0.8).unfiltered);
    // "Try this too": a volatility of about 11% a year.
    expect(pct(extreme.sd)).toBe('10.82');
    expect(extreme.autocorrelation).toBeLessThan(-0.3);
    expect(Math.max(...consumptionMeasures(data, 0.8).unfiltered.dc.map(Math.abs))).toBeGreaterThan(0.2);
    // A correlation of 0.15 over 95 years is about 1.5 standard errors (1/√T) from zero.
    expect(fixed(measureStats(full.high.unfiltered).correlation * Math.sqrt(95), 1)).toBe('1.5');
  });
});
