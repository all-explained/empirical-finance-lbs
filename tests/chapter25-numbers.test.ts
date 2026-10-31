/**
 * Every number in the prose of chapter 25, recomputed from the seeded toy samples of the GMMObjective and JTestSim
 * widgets and from a seeded estimator study. If the library or the settings change, this test fails before the
 * chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import { chiSquareSurvival } from '../src/lib/math/distributions';
import { bisection } from '../src/lib/math/rootFind';
import { simulateToySample, TOY_MEAN, TOY_VARIANCE } from '../src/lib/stats/gmm';
import {
  DEFAULT_SEED, fitToy, J_CHUNKS, J_COUNT, J_DEFAULT_T, J_SAMPLES, J_SEED, jTestRun, SAMPLE_T, toySample,
  type EfficientMethod, type Tails,
} from '../src/components/plots/gmmSample';

const fixed = (v: number, digits: number) => v.toFixed(digits);
const percent = (v: number) => (v * 100).toFixed(1);
const x = toySample();
const identity = fitToy(x, 4, 'one-step');
const twoStep = fitToy(x, 4, 'two-step');
const iterated = fitToy(x, 4, 'iterated');
const cue = fitToy(x, 4, 'cue');
const size = (T: number, method: EfficientMethod, tails: Tails = 'normal') =>
  percent(jTestRun(J_SEED, { T, method, tails }).rejectionRate);

/** Root mean squared error of σ̂² and the mean reported standard error, over seeded samples 1001 to 1300. */
function study(T: number) {
  const N = 300;
  const out = { identity: 0, twoStep: 0, reportedSE: 0 };
  for (let s = 1; s <= N; s++) {
    const y = simulateToySample(1000 + s, { T });
    const a = fitToy(y, 4, 'one-step');
    const b = fitToy(y, 4, 'two-step');
    out.identity += (a.theta[1] - TOY_VARIANCE) ** 2 / N;
    out.twoStep += (b.theta[1] - TOY_VARIANCE) ** 2 / N;
    out.reportedSE += b.standardErrors[1] / N;
  }
  return { identity: Math.sqrt(out.identity), twoStep: Math.sqrt(out.twoStep), reportedSE: out.reportedSE };
}

describe('chapter 25 prose numbers', () => {
  test('settings: 600 draws with mean 0.5 and variance 1; 400 J samples of 100 draws, four moments', () => {
    expect([SAMPLE_T, DEFAULT_SEED, TOY_MEAN, TOY_VARIANCE]).toEqual([600, 1, 0.5, 1]);
    expect([J_SAMPLES, J_CHUNKS, J_DEFAULT_T, J_SEED, J_COUNT]).toEqual([400, 8, 100, 1, 4]);
  });

  test('hook and intuition: four weightings of four moments on the 600 draws', () => {
    expect(identity.theta.map((v) => fixed(v, 3))).toEqual(['0.501', '1.086']);
    expect(twoStep.theta.map((v) => fixed(v, 3))).toEqual(['0.488', '1.005']);
    expect([fixed(identity.standardErrors[1], 3), fixed(twoStep.standardErrors[1], 3)]).toEqual(['0.087', '0.061']);
    // Ŝ behind the two-step weighting: the variance of the first and the fourth moment.
    expect([fixed(twoStep.S[0][0], 2), fixed(twoStep.S[3][3], 2)]).toEqual(['1.03', '194.35']);
    expect([fixed(twoStep.W[0][0], 2), fixed(twoStep.W[1][1], 2), fixed(twoStep.W[3][3], 3)]).toEqual(['2.50', '1.76', '0.028']);
  });

  test('intuition: with two moments every weighting gives the sample mean and variance', () => {
    for (const method of ['one-step', 'two-step', 'iterated', 'cue'] as const) {
      expect(fitToy(x, 2, method).theta.map((v) => fixed(v, 3))).toEqual(['0.496', '1.025']);
    }
  });

  test('formalisation: the three feasible estimators, J and the 5% cut-off of chi-square with 2 df', () => {
    expect([twoStep, iterated, cue].map((e) => fixed(e.theta[0], 3))).toEqual(['0.488', '0.488', '0.488']);
    expect([twoStep, iterated, cue].map((e) => fixed(e.theta[1], 3))).toEqual(['1.005', '1.006', '1.006']);
    expect(twoStep.standardErrors.map((v) => fixed(v, 3))).toEqual(['0.041', '0.061']);
    expect([twoStep.df, fixed(twoStep.J as number, 2), fixed(twoStep.pValue as number, 2)]).toEqual([2, '2.22', '0.33']);
    expect(fixed(bisection((v) => chiSquareSurvival(v, 2) - 0.05, 0, 100), 2)).toBe('5.99');
  });

  test('formalisation: a fixed weighting wins at T = 50 and loses at T = 1000', () => {
    const short = study(50);
    expect([fixed(short.identity, 3), fixed(short.twoStep, 3), fixed(short.reportedSE, 3)]).toEqual(['0.210', '0.254', '0.144']);
    const long = study(1000);
    expect([fixed(long.identity, 3), fixed(long.twoStep, 3)]).toEqual(['0.051', '0.049']);
  }, 60_000);

  test('formalisation and quiz: counts and the quiz J of 6.5', () => {
    expect((4 * 5) / 2).toBe(10); // distinct entries of a symmetric 4 × 4 Ŝ
    expect(6 - 2).toBe(4); // quiz 1: 6 moments, 2 parameters
    expect(6.5 > bisection((v) => chiSquareSurvival(v, 2) - 0.05, 0, 100)).toBe(true); // quiz 3: just above 5.99
  });

  test('playground: the fat-tailed fourth central moment is 3(0.9·0.5² + 0.1·5.5²) = 9.75', () => {
    expect(3 * (0.9 * 0.5 ** 2 + 0.1 * 5.5 ** 2)).toBeCloseTo(9.75, 12);
  });

  test('hook, playground and quiz: size of the 5% J test under normal tails', () => {
    expect([size(100, 'two-step'), size(50, 'two-step'), size(1000, 'two-step')]).toEqual(['13.3', '18.0', '7.5']);
    expect([size(100, 'iterated'), size(100, 'cue')]).toEqual(['13.5', '13.5']);
  }, 120_000);

  test('playground: power of the 5% J test under fat tails', () => {
    expect([size(100, 'two-step', 'fat'), size(100, 'iterated', 'fat'), size(100, 'cue', 'fat')]).toEqual(['12.0', '2.3', '2.3']);
    expect([size(500, 'two-step', 'fat'), size(500, 'cue', 'fat')]).toEqual(['66.0', '56.3']);
  }, 120_000);
});
