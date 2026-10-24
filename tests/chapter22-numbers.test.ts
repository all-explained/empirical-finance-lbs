/**
 * Every number in the prose of chapter 22, recomputed from the seeded conditional-CAPM world and from
 * ff25-size-bm-monthly, ff3-monthly and fred-cay-quarterly through the library and the widgets' helper.
 * Numbers quoted from Lettau & Ludvigson (2001, JPE) and Jagannathan & Wang (1996) are cited in the prose
 * with their pages and are not recomputed here.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import ff25 from '../src/data/series/ff25-size-bm-monthly.json';
import cay from '../src/data/series/fred-cay-quarterly.json';
import type { Series } from '../src/lib/data/series';
import { cayInputs } from '../src/lib/finance/cay';
import { simulateConditionalCapm } from '../src/lib/finance/conditional';
import { annualiseMean } from '../src/lib/stats/moments';
import {
  conditionalWorld, DEFAULT_SEED, managedCapm, scaledView, WORLD, type ConditionalData,
} from '../src/components/plots/conditionalSample';

const data: ConditionalData = {
  ff3: ff3 as unknown as Series<'ff3-monthly'>,
  ff25: ff25 as unknown as Series<'ff25-size-bm-monthly'>,
  cay: cay as unknown as Series<'fred-cay-quarterly'>,
};
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const ll = scaledView(data, 'll');
const full = scaledView(data, 'full');
const r2 = (v: typeof ll) => [v.fits.capm.r2, v.fits.ccapm.r2, v.fits['scaled-ccapm'].r2, v.fits.ff3.r2].map((x) => fixed(x, 2));
const world = conditionalWorld(DEFAULT_SEED, WORLD.betaSlope, WORLD.lambdaSlope);

// Population unconditional alpha in the widget's world (derived in the Formalisation), monthly decimals.
const covariance = WORLD.betaSlope * WORLD.lambdaSlope * WORLD.stateSd ** 2;
const marketVariance = WORLD.lambdaSlope ** 2 * WORLD.stateSd ** 2 + WORLD.marketSd ** 2;
const populationAlpha = covariance * (1 - WORLD.lambda0 ** 2 / marketVariance);

describe('chapter 22 prose numbers', () => {
  test('hook and playground: the four fits over 1963-Q3 to 1998-Q3', () => {
    expect([ll.first, ll.last, ll.quarters, ll.names.length]).toEqual(['1963-Q3', '1998-Q3', 141, 25]);
    expect(r2(ll)).toEqual(['0.02', '0.07', '0.55', '0.82']);
    expect([ll.fits.capm.meanAbsAlpha, ll.fits['scaled-ccapm'].meanAbsAlpha, ll.fits.ff3.meanAbsAlpha].map((v) => percent(v, 2)))
      .toEqual(['2.37', '1.67', '0.92']);
  });

  test('playground: the sample to the end of the data', () => {
    expect([full.first, full.last, full.quarters]).toEqual(['1963-Q3', '2026-Q2', 252]);
    expect(r2(full)).toEqual(['0.01', '0.36', '0.61', '0.69']);
  });

  test('limits: the scaled constant, the cay sample, and managed portfolios', () => {
    const scaled = ll.fits['scaled-ccapm'];
    expect(percent(scaled.lambda0, 1)).toBe('14.3');
    expect([percent(Math.min(...scaled.actual), 1), percent(Math.max(...scaled.actual), 1)]).toEqual(['3.5', '14.2']);
    const { dates } = cayInputs(data.cay);
    expect([dates[0].slice(0, 4), dates.at(-1)!.slice(0, 4)]).toEqual(['1952', '2026']);
    expect(scaled.factorNames.length + 1).toBe(4);
    const managed = managedCapm(data, 'll');
    expect(managed.plainBeta.length + managed.managedBeta.length).toBe(50);
    expect(fixed(managed.r2, 2)).toBe('0.62');
    expect([Math.min(...managed.plainBeta), Math.max(...managed.plainBeta)].map((v) => fixed(v, 2))).toEqual(['0.79', '1.61']);
    expect([Math.min(...managed.managedBeta), Math.max(...managed.managedBeta)].map((v) => fixed(v, 2))).toEqual(['-0.60', '-0.15']);
  });

  test('intuition: the two-state toy world', () => {
    const good = { beta: 0.5, lambda: 0.04 };
    const bad = { beta: 1.5, lambda: 0.08 };
    expect([good.beta * good.lambda, bad.beta * bad.lambda].map((v) => percent(v, 0))).toEqual(['2', '12']);
    const meanProduct = (good.beta * good.lambda + bad.beta * bad.lambda) / 2;
    const product = ((good.beta + bad.beta) / 2) * ((good.lambda + bad.lambda) / 2);
    expect([percent(meanProduct, 0), (good.beta + bad.beta) / 2, percent(product, 0), percent(meanProduct - product, 0)])
      .toEqual(['7', 1, '6', '1']);
  });

  test('intuition: the seeded world at the defaults and the try-this moves', () => {
    expect([WORLD.T, WORLD.T / 12]).toEqual([600, 50]);
    expect([percent(world.meanProduct, 2), percent(world.product, 2), percent(world.covariance, 2)]).toEqual(['6.99', '5.28', '1.72']);
    expect(world.meanProduct).toBeCloseTo(world.product + world.covariance, 12);
    expect([percent(world.alphaU, 2), percent(world.alphaUSE, 2), fixed(world.alphaUT, 2)]).toEqual(['1.38', '1.72', '0.80']);
    expect([percent(world.alphaC, 2), percent(world.alphaCSE, 2)]).toEqual(['-0.18', '1.50']);
    const flat = conditionalWorld(DEFAULT_SEED, 0, WORLD.lambdaSlope);
    expect([flat.covariance, percent(flat.alphaU, 2)]).toEqual([0, '-0.07']);
    const opposite = conditionalWorld(DEFAULT_SEED, -0.4, WORLD.lambdaSlope);
    expect([percent(opposite.covariance, 2), percent(opposite.alphaU, 2)]).toEqual(['-1.72', '-1.51']);
  });

  test('formalisation: the population alpha and the sample length to detect it', () => {
    expect([WORLD.betaSlope, percent(annualiseMean(WORLD.lambdaSlope), 1)]).toEqual([0.4, '4.8']);
    expect(percent(annualiseMean(covariance), 2)).toBe('1.92');
    expect(percent(annualiseMean(populationAlpha), 2)).toBe('1.90');
    // A long seeded path agrees with the formula.
    const long = simulateConditionalCapm(DEFAULT_SEED, { ...WORLD, T: 200_000 });
    expect(Math.abs(annualiseMean(long.unconditional.alpha - populationAlpha))).toBeLessThan(0.002);
    // t = 2 on the population alpha needs the standard error to shrink to α/2; it shrinks with √T.
    const years = (WORLD.T / 12) * ((2 * world.alphaUSE) / annualiseMean(populationAlpha)) ** 2;
    expect(Math.round(years / 10) * 10).toBe(160);
  });

  test('quiz: the decomposition', () => {
    expect(fixed(1.2 * 5 + 0.5, 1)).toBe('6.5');
  });
});
