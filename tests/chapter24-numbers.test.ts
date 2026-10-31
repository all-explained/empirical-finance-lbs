/**
 * Every number in the prose of chapter 24, recomputed from the seeded toy sample of gmm.ts through the
 * widget's sample helper. If the library or the sample changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import { arithmeticMean } from '../src/lib/finance/returns';
import { gmmObjective, TOY_MEAN, TOY_VARIANCE } from '../src/lib/stats/gmm';
import { DEFAULT_SEED, fitToy, objectiveGrid, SAMPLE_T, toySample } from '../src/components/plots/gmmSample';

const fixed = (v: number, digits = 3) => v.toFixed(digits);
const x = toySample(DEFAULT_SEED);
const mean = arithmeticMean(x);
const central = (k: number) => arithmeticMean(x.map((v) => (v - mean) ** k));
const just = fitToy(x, 2, 'one-step');
const oneStep = fitToy(x, 4, 'one-step');
const twoStep = fitToy(x, 4, 'two-step');

describe('chapter 24 prose numbers', () => {
  test('hook: the sample and its moments', () => {
    expect([SAMPLE_T, x.length, TOY_MEAN, TOY_VARIANCE]).toEqual([600, 600, 0.5, 1]);
    expect([fixed(mean), fixed(central(2)), fixed(central(4))]).toEqual(['0.496', '1.025', '3.547']);
    expect(fixed(Math.sqrt(central(4) / 3))).toBe('1.087');
  });

  test('intuition: the three estimates, the objective and the standard errors', () => {
    expect(just.theta.map((v) => fixed(v))).toEqual(['0.496', '1.025']);
    expect(gmmObjective(just.gT, just.W)).toBeLessThan(1e-10);
    expect(oneStep.theta.map((v) => fixed(v))).toEqual(['0.501', '1.086']);
    expect(gmmObjective(oneStep.gT, oneStep.W)).toBeGreaterThan(1e-4);
    expect(twoStep.theta.map((v) => fixed(v))).toEqual(['0.488', '1.005']);
    // d(3σ⁴)/dσ² = 6σ², about 6 near σ² = 1.
    expect(6 * TOY_VARIANCE).toBe(6);
    expect(just.standardErrors.map((v) => fixed(v))).toEqual(['0.041', '0.064']);
    expect(oneStep.standardErrors.map((v) => fixed(v))).toEqual(['0.060', '0.087']);
    expect(twoStep.standardErrors.map((v) => fixed(v))).toEqual(['0.041', '0.061']);
  });

  test('formalisation: the just-identified estimate is the sample mean, the divisor-T variance and normal ML', () => {
    expect(just.theta[0]).toBeCloseTo(mean, 8);
    expect(just.theta[1]).toBeCloseTo(central(2), 8);
    expect(fixed(just.standardErrors[0])).toBe(fixed(Math.sqrt(central(2) / SAMPLE_T)));
    expect(just.standardErrors[1]).toBeCloseTo(Math.sqrt((central(4) - central(2) ** 2) / SAMPLE_T), 6);
    expect(fixed(Math.sqrt((2 * central(2) ** 2) / SAMPLE_T))).toBe('0.059');
  });

  test('playground: with 2 moments the weighting never moves the estimate and the objective is 0', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const sample = toySample(seed);
      const [a, b] = [fitToy(sample, 2, 'one-step'), fitToy(sample, 2, 'two-step')];
      a.theta.forEach((v, i) => expect(v).toBeCloseTo(b.theta[i], 8));
      for (const fit of [a, b]) expect(gmmObjective(fit.gT, fit.W)).toBeLessThan(1e-10);
    }
  });

  test('widget: the objective grid agrees with each fit at its estimate', () => {
    for (const method of ['one-step', 'two-step', 'cue'] as const) {
      const fit = fitToy(x, 4, method);
      const [[value]] = objectiveGrid(x, 4, method, fit, [fit.theta[0]], [fit.theta[1]]);
      expect(value).toBeCloseTo(gmmObjective(fit.gT, fit.W), 10);
    }
  });
});
