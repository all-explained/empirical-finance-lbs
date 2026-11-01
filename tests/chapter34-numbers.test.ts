/**
 * Every number in the prose of chapter 34, recomputed from ff25-size-bm-monthly, ff3-monthly and
 * ff30-industry-monthly, and from the seeded economy of the widget, through the library and the widget's
 * sample helper. If the data or the library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import ff25 from '../src/data/series/ff25-size-bm-monthly.json';
import ff30 from '../src/data/series/ff30-industry-monthly.json';
import type { Series } from '../src/lib/data/series';
import { sampleMeans } from '../src/lib/finance/portfolio';
import { threePass, twoPass } from '../src/lib/finance/threePass';
import { skepticalPanel } from '../src/components/plots/skepticalSample';
import { ECONOMY, OMITTED_SEED, omittedEconomy } from '../src/components/plots/threePassSample';

const panel = skepticalPanel({
  ff3: ff3 as unknown as Series<'ff3-monthly'>,
  ff25: ff25 as unknown as Series<'ff25-size-bm-monthly'>,
  ff30: ff30 as unknown as Series<'ff30-industry-monthly'>,
});
const factors = panel.factors.ff3;
const alone = (excess: number[][], j: number) => twoPass(excess, factors.map((row) => [row[j]])).lambda[0];
/** Monthly decimals → % a month, as the prose writes them. */
const monthly = (values: number[], digits = 3) => values.map((v) => (v * 100).toFixed(digits));
/** Monthly decimals → % a year, as the widget's readout writes them. */
const yearly = (v: number) => (v * 1200).toFixed(2);
const means = sampleMeans(factors);
const economy = (strength: number, correlation: number) => {
  const sim = omittedEconomy(strength, correlation, OMITTED_SEED);
  return { bias: [yearly(sim.bias.twoPass), yearly(sim.bias.threePass)], rmse: [yearly(sim.rmse.twoPass), yearly(sim.rmse.threePass)] };
};

describe('chapter 34 prose numbers', () => {
  test('hook: the sample, the factor means and the two-pass premia, alone and together', () => {
    expect([panel.first, panel.last, panel.excess.ff25.length]).toEqual(['1963-07', '2026-08', 758]);
    expect(monthly(means)).toEqual(['0.602', '0.147', '0.294']);
    expect(monthly([0, 1, 2].map((j) => alone(panel.excess.ff25, j)))).toEqual(['0.687', '0.640', '-0.140']);
    expect(alone(panel.excess.ff25, 1) / means[1]).toBeGreaterThan(4);
    expect(monthly(twoPass(panel.excess.ff25, factors).lambda)).toEqual(['0.560', '0.144', '0.353']);
  });

  test('intuition and formalisation: the default economy and its predicted bias', () => {
    const sim = omittedEconomy(1, 0.5, OMITTED_SEED);
    expect([ECONOMY.N, ECONOMY.T, ECONOMY.samples, yearly(sim.truth)]).toEqual([25, 600, 100, '6.00']);
    expect(economy(1, 0.5)).toEqual({ bias: ['2.77', '-0.27'], rmse: ['3.65', '1.88'] });
    // The two-pass bias s·c·λ_2 at s = 1, c = 0.5, with λ_2 = λ_1 = the true premium.
    expect(yearly(1 * 0.5 * sim.truth)).toBe('3.00');
  }, 60000);

  test('playground: the try-this settings', () => {
    expect(economy(1, 0)).toEqual({ bias: ['-0.21', '-0.32'], rmse: ['2.23', '1.89'] });
    expect(economy(0, 0.5).rmse).toEqual(['1.93', '1.90']);
    expect(economy(1, -0.5)).toEqual({ bias: ['-3.18', '-0.47'], rmse: ['3.90', '1.91'] });
    expect(economy(2, 0.9)).toEqual({ bias: ['10.58', '-0.51'], rmse: ['11.33', '1.89'] });
  }, 120000);

  test('our data: three-pass premia on the 25 portfolios, their standard errors and the step-3 R²', () => {
    const five = threePass(panel.excess.ff25, factors, { factors: 5 });
    expect(monthly(five.lambda)).toEqual(['0.538', '0.186', '0.320']);
    expect(monthly(five.se!)).toEqual(['0.160', '0.109', '0.106']);
    expect(five.r2.map((v) => v.toFixed(2))).toEqual(['0.98', '0.99', '0.95']);
    five.lambda.forEach((l, j) => expect(Math.abs(l - means[j]) / five.se![j]).toBeLessThan(0.5));
    expect(monthly(threePass(panel.excess.ff25, factors, { factors: 3 }).lambda)).toEqual(['0.549', '0.153', '0.340']);
    const one = threePass(panel.excess.ff25, factors, { factors: 1 });
    expect([monthly(one.lambda)[2], one.r2[2].toFixed(2)]).toEqual(['-0.030', '0.01']);
    expect(monthly(threePass(panel.excess.ff25, factors, { factors: 2 }).lambda)[2]).toBe('0.174');
  });

  test('our data: each added component adds one term; the seventh moves Mkt-RF', () => {
    const six = threePass(panel.excess.ff25, factors, { factors: 6 });
    const seven = threePass(panel.excess.ff25, factors, { factors: 7 });
    const term = seven.betaChi[0][6] * seven.latent.lambda[6];
    expect(seven.lambda[0] - six.lambda[0]).toBeCloseTo(term, 12);
    expect(monthly([six.lambda[0], seven.lambda[0], term])).toEqual(['0.536', '0.611', '0.075']);
    expect(term / seven.se![0]).toBeLessThan(0.5);
  });

  test('our data: the 25 portfolios with the 30 industries', () => {
    expect(panel.excess.ff55[0].length).toBe(55);
    expect(monthly([alone(panel.excess.ff55, 2)])).toEqual(['-0.512']);
    const five = threePass(panel.excess.ff55, factors, { factors: 5 });
    expect(monthly(five.lambda)).toEqual(['0.582', '0.138', '0.106']);
    expect(((means[2] - five.lambda[2]) / five.se![2]).toFixed(1)).toBe('1.9');
    expect((five.r2[2] * 100).toFixed(0)).toBe('84');
  });
});
