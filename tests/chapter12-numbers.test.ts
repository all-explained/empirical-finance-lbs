/**
 * Every number in the prose of chapter 12, recomputed from goyal-welch-annual and the seeded
 * simulation of the StambaughBias widget. If the data or the library changes, this test fails
 * before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import gw from '../src/data/series/goyal-welch-annual.json';
import type { Series } from '../src/lib/data/series';
import { arithmeticMean } from '../src/lib/finance/returns';
import { invCdf } from '../src/lib/math/normal';
import {
  biasCorrectedSlope, kendallBias, rejectionRate, stambaughBias, upperCriticalValue,
} from '../src/lib/stats/stambaugh';
import { dataFit, DEFAULT_SEED, nullSlopes, SAMPLES } from '../src/components/plots/stambaughSample';

const fit = dataFit(gw as unknown as Series<'goyal-welch-annual'>);
const sigmaU = Math.sqrt(fit.sigmaUU);
const sigmaV = Math.sqrt(fit.sigmaV2);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);

/** What the widget shows for these sliders, at its default seed. */
function world(T: number, phi: number, corr: number) {
  const s = nullSlopes({ T, phi, corr, seed: DEFAULT_SEED, sigmaU, sigmaV });
  const b = s.map((x) => x.bHat);
  const t = s.map((x) => x.tStat);
  return {
    bias: stambaughBias(corr * sigmaU * sigmaV, fit.sigmaV2, phi, T),
    meanB: arithmeticMean(b),
    phiGap: arithmeticMean(s.map((x) => x.phiHat)) - phi,
    critical: upperCriticalValue(t, 0.05),
    size: rejectionRate(t, 1.645),
    aboveB: rejectionRate(b, fit.bHat),
    aboveT: rejectionRate(t, fit.tStat),
  };
}

describe('chapter 12 prose numbers', () => {
  test('data: the predictive system on goyal-welch-annual', () => {
    expect([fit.first, fit.last, fit.T]).toEqual([1926, 2024, 99]); // dp 1926–2024, returns 1927–2025
    expect([fixed(fit.bHat, 3), fixed(fit.tStat, 2)]).toEqual(['0.042', '1.07']);
    expect([fixed(fit.phiHat, 2), fixed(fit.corr, 2), fixed(fit.sigmaUV / fit.sigmaV2, 2)]).toEqual(['0.92', '-0.86', '-0.78']);
    expect(fixed(kendallBias(fit.phiHat, fit.T), 3)).toBe('-0.038');
    const bias = stambaughBias(fit.sigmaUV, fit.sigmaV2, fit.phiHat, fit.T);
    expect(fixed(bias, 3)).toBe('0.030');
    expect(percent(bias / fit.bHat, 0)).toBe('70');
    expect(fixed(biasCorrectedSlope(fit.bHat, fit.phiHat, fit.sigmaUV, fit.sigmaV2, fit.T), 3)).toBe('0.013');
  });

  test('simulation setup', () => {
    expect([SAMPLES, DEFAULT_SEED]).toEqual([1000, 1]);
  });

  test('hook and playground: the world calibrated to the data', () => {
    const w = world(fit.T, fit.phiHat, fit.corr);
    // The widget's theory line equals the data's bias: corr * sigmaU * sigmaV is the data's sigmaUV.
    expect(fixed(w.bias, 3)).toBe('0.030');
    expect([fixed(w.meanB, 3), percent(w.aboveB, 1), percent(w.aboveT, 1)]).toEqual(['0.033', '36.1', '31.6']);
    expect(w.aboveB > 1 / 3).toBe(true); // "more than a third"
    expect([fixed(w.phiGap, 3), fixed(w.critical, 2), percent(w.size, 1)]).toEqual(['-0.041', '2.17', '15.9']);
    expect(w.size / 0.05 > 3).toBe(true); // "more than three times as large"
  });

  test('intuition: the widget opens at phi = 0.95, T = 100, corr = 0, then corr = -0.90', () => {
    const w0 = world(100, 0.95, 0);
    expect([fixed(w0.meanB, 3), percent(w0.size, 1)]).toEqual(['0.001', '5.7']);
    const w9 = world(100, 0.95, -0.9);
    expect([fixed(w9.meanB, 3), percent(w9.size, 1)]).toEqual(['0.036', '18.1']);
  });

  test('playground: phi = 0.99, T = 500, corr = +0.86', () => {
    const high = world(fit.T, 0.99, fit.corr);
    expect([percent(high.size, 1), fixed(high.critical, 2)]).toEqual(['25.9', '2.56']);
    const long = world(500, fit.phiHat, fit.corr);
    expect([fixed(long.bias, 3), percent(long.size, 1)]).toEqual(['0.006', '9.8']);
    expect(world(fit.T, fit.phiHat, 0.86).bias < 0).toBe(true);
  });

  test('textbook cut-offs: one-sided 5% and two-sided 5% normal quantiles', () => {
    expect([fixed(invCdf(0.95), 3), fixed(invCdf(0.975), 2)]).toEqual(['1.645', '1.96']);
  });

  test('quiz 3: a t-statistic of 1.9 does not pass the simulated cut-off', () => {
    expect(world(fit.T, fit.phiHat, fit.corr).critical > 1.9).toBe(true);
  });

  test('quiz: sigmaUV / sigmaV2 = -0.8, phi = 0.9, T = 100', () => {
    expect(fixed(kendallBias(0.9, 100), 3)).toBe('-0.037');
    expect(fixed(stambaughBias(-0.8, 1, 0.9, 100), 4)).toBe('0.0296');
  });
});
