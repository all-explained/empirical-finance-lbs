/**
 * Every number in the prose of chapter 15 that is not quoted from Martin (2017), recomputed
 * through src/lib/finance/optionBound.ts, src/lib/finance/sdf.ts and the widget's sample helper.
 * If the library or the simulated market changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import { DEFAULT_LEVEL, DEFAULT_SEED, flatSmile, FORWARD, GROSS_RF, MARKET, STRIKES, stripBound } from '../src/components/plots/optionStripSample';
import { price, riskFreeRate } from '../src/lib/finance/sdf';
import { PAYOFFS, DEFAULT_STATES, probabilities } from '../src/components/plots/sdfSamples';

const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const vol = (v2: number, digits: number) => percent(Math.sqrt(v2), digits);
const seeded = (level: number) => stripBound(level, DEFAULT_SEED);

/** Chapter 8's two-state world: premium, risk-neutral variance bound and risk-neutral odds. */
function twoState(payoff: readonly number[]) {
  const pi = probabilities(DEFAULT_STATES);
  const M = DEFAULT_STATES.sdf;
  const rf = riskFreeRate(M, pi);
  const gross = payoff.map((x) => x / price(payoff, M, pi));
  const premium = gross.reduce((s, g, i) => s + pi[i] * g, 0) - (1 + rf);
  // Var*(R) = (1 + R^f) E[M (1 + R)²] - (1 + R^f)², from E*[X] = (1 + R^f) E[M X].
  const varStar = (1 + rf) * price(gross.map((g) => g * g), M, pi) - (1 + rf) ** 2;
  return { pi, piStar: pi.map((p, i) => p * M[i] * (1 + rf)), premium, bound: varStar / (1 + rf) };
}

describe('chapter 15 prose numbers', () => {
  test('hook: the ratio of the two bounds quoted from Martin (2017, p. 385)', () => {
    expect((55.0 / 1.86).toFixed(1)).toBe('29.6'); // "a factor of almost thirty"
  });

  test('the simulated market of the widget and the caption', () => {
    expect([MARKET.S, MARKET.tau, MARKET.rfAnnual, GROSS_RF]).toEqual([100, 1, 0.03, 1.03]);
    expect(FORWARD.toFixed(0)).toBe('103');
    expect([STRIKES[0], STRIKES.at(-1), STRIKES[1] - STRIKES[0]]).toEqual([30, 300, 1]);
    expect([DEFAULT_LEVEL, DEFAULT_SEED]).toEqual([0.2, 1]);
    expect(flatSmile(0.2).floor).toBe(0.05); // the 5% floor in the caption
  });

  test('intuition: the bound at 20% and at 40%, and the quiz ratio', () => {
    const calm = seeded(0.2);
    const stressed = seeded(0.4);
    expect([percent(calm.bound, 2), percent(stressed.bound, 2)]).toEqual(['4.21', '16.47']);
    expect((stressed.bound / calm.bound).toFixed(1)).toBe('3.9'); // "almost four times"
  });

  test('step 1: risk-neutral odds in chapter 8’s two-state world', () => {
    const { pi, piStar } = twoState(PAYOFFS.stock);
    expect([pi[0], piStar[0].toFixed(3)]).toEqual([0.5, '0.579']);
  });

  test('step 4: the condition fails for the insurance and the stock of chapter 8', () => {
    const insurance = twoState(PAYOFFS.insurance);
    expect([percent(insurance.premium, 1), percent(insurance.bound, 1)]).toEqual(['-3.8', '5.4']);
    const stock = twoState(PAYOFFS.stock);
    expect([percent(stock.premium, 1), percent(stock.bound, 1)]).toEqual(['4.1', '6.3']);
    expect(stock.bound).toBeGreaterThan(stock.premium); // the bound overstates: the covariance is positive
  });

  test('step 5: SVIX² and the bound in the widget', () => {
    const b = seeded(0.2);
    expect([b.svix2.toFixed(4), percent(b.bound, 2)]).toEqual(['0.0409', '4.21']);
    expect(b.bound).toBeCloseTo(GROSS_RF * b.svix2, 12); // bound = (1 + R^f) SVIX² when τ = 1
  });

  test('step 6: VIX against SVIX, and the VIX-based number', () => {
    const b = seeded(0.2);
    expect([vol(b.vix2, 1), vol(b.svix2, 1)]).toEqual(['21.8', '20.2']);
    expect([b.vix2.toFixed(4), percent(GROSS_RF * b.vix2, 2)]).toEqual(['0.0477', '4.91']);
  });

  test('playground: crisis, calm and new draws', () => {
    expect(percent(seeded(0.45).bound, 2)).toBe('20.87');
    expect(percent(seeded(0.1).bound, 2)).toBe('1.08');
    const draws = Array.from({ length: 10 }, (_, i) => stripBound(0.2, i + 1));
    const bounds = draws.map((d) => d.bound);
    const vixes = draws.map((d) => Math.sqrt(d.vix2));
    expect([percent(Math.min(...bounds), 2), percent(Math.max(...bounds), 2)]).toEqual(['4.21', '4.84']);
    expect([percent(Math.min(...vixes), 1), percent(Math.max(...vixes), 1)]).toEqual(['21.6', '27.4']);
  });

  test('playground: the flat (lognormal) smile', () => {
    const flat = stripBound(0.2, DEFAULT_SEED, flatSmile(0.2));
    expect([vol(flat.vix2, 1), vol(flat.svix2, 1), percent(flat.bound, 2)]).toEqual(['20.0', '20.2', '4.21']);
    expect(flat.svix2).toBeGreaterThan(flat.vix2); // SVIX just above VIX, as under lognormality
    expect(percent(Math.sqrt(Math.exp(0.04) - 1), 1)).toBe('20.2');
  });
});
