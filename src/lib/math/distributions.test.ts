import { describe, expect, it } from 'vitest';
import { chiSquareCdf, chiSquareSurvival, fCdf, fSurvival, logGamma, regularizedBeta } from './distributions';

describe('logGamma', () => {
  it('matches log Γ at 0.5, 1, 5 and 10.5', () => {
    // log √π; log 0! = 0; log 4! = log 24; Python math.lgamma(10.5) = 13.940625219403762.
    expect(logGamma(0.5)).toBeCloseTo(0.5 * Math.log(Math.PI), 13);
    expect(logGamma(1)).toBeCloseTo(0, 13);
    expect(logGamma(5)).toBeCloseTo(Math.log(24), 13);
    expect(logGamma(10.5)).toBeCloseTo(13.940625219403762, 12);
  });

  it('rejects non-positive arguments', () => {
    expect(() => logGamma(0)).toThrow(RangeError);
  });
});

describe('regularizedBeta', () => {
  it('matches scipy.special.betainc on both sides of the symmetry switch', () => {
    expect(regularizedBeta(0.3, 2.5, 3.5)).toBeCloseTo(0.2967529892956663, 13);
    expect(regularizedBeta(0.9, 0.5, 0.5)).toBeCloseTo(0.7951672353008665, 13);
    expect(regularizedBeta(0.4, 50, 60)).toBeCloseTo(0.12470685834310061, 12);
    // I_x(1, 1) = x, and the end points are exact.
    expect(regularizedBeta(0.37, 1, 1)).toBeCloseTo(0.37, 14);
    expect([regularizedBeta(0, 2, 3), regularizedBeta(1, 2, 3)]).toEqual([0, 1]);
  });
});

describe('fCdf and fSurvival', () => {
  it('give the tabulated quantiles', () => {
    // Standard F tables: F_0.95(2, 10) = 4.1028, F_0.99(5, 20) = 4.1027.
    // Large d2: scipy.stats.f.ppf(0.95, 25, 1000) = 1.5171299547023487.
    expect(fCdf(4.1028210151304, 2, 10)).toBeCloseTo(0.95, 12);
    expect(fCdf(4.102684630584731, 5, 20)).toBeCloseTo(0.99, 12);
    expect(fCdf(1.5171299547023487, 25, 1000)).toBeCloseTo(0.95, 11);
    expect(fCdf(1.3, 7, 15)).toBeCloseTo(0.684714768810958, 12);
  });

  it('keep a tiny upper tail: scipy.stats.f.sf(40, 25, 500) = 1.8521442693780627e-102', () => {
    expect(fSurvival(40, 25, 500) / 1.8521442693780627e-102).toBeCloseTo(1, 9);
  });

  it('add up to one', () => {
    for (const [x, d1, d2] of [[0.2, 1, 1], [1, 3, 7], [4.1028, 2, 10], [2.5, 25, 733], [12, 10, 40]]) {
      expect(fCdf(x, d1, d2) + fSurvival(x, d1, d2)).toBeCloseTo(1, 13);
    }
    expect([fCdf(0, 2, 3), fSurvival(0, 2, 3), fCdf(Infinity, 2, 3), fSurvival(Infinity, 2, 3)]).toEqual([0, 1, 1, 0]);
  });
});

// Reference values from scipy 1.18.1 (numpy 2.5.4): scipy.stats.chi2.ppf, .cdf and .sf.
describe('chiSquareCdf and chiSquareSurvival', () => {
  it('give the tabulated 5% critical values: chi2.ppf(0.95, 1) = 3.8414588206941205, chi2.ppf(0.95, 10) = 18.307038053275146', () => {
    expect(chiSquareCdf(3.8414588206941205, 1)).toBeCloseTo(0.95, 13);
    expect(chiSquareCdf(18.307038053275146, 10)).toBeCloseTo(0.95, 13);
    expect(chiSquareSurvival(3.841459, 1)).toBeCloseTo(0.05, 7);
    expect(chiSquareSurvival(18.307038, 10)).toBeCloseTo(0.05, 7);
  });

  it('match scipy on both sides of the series/continued-fraction switch', () => {
    // chi2.cdf(0.3, 5) = 0.0023569137394711423; chi2.cdf(7.5, 3) = 0.9424415480273636;
    // chi2.cdf(100.5, 90) = 0.7891156998339218.
    expect(chiSquareCdf(0.3, 5)).toBeCloseTo(0.0023569137394711423, 14);
    expect(chiSquareCdf(7.5, 3)).toBeCloseTo(0.9424415480273636, 13);
    expect(chiSquareCdf(100.5, 90)).toBeCloseTo(0.7891156998339218, 12);
  });

  it('equal the closed form 1 - exp(-x/2) with 2 degrees of freedom', () => {
    for (const x of [0.01, 0.5, 2, 2.9, 3.1, 10, 40]) {
      expect(chiSquareCdf(x, 2)).toBeCloseTo(1 - Math.exp(-x / 2), 14);
      expect(chiSquareSurvival(x, 2) / Math.exp(-x / 2)).toBeCloseTo(1, 12);
    }
  });

  it('keep a tiny upper tail: chi2.sf(150, 4) = 2.035764090974152e-31', () => {
    expect(chiSquareSurvival(150, 4) / 2.035764090974152e-31).toBeCloseTo(1, 11);
  });

  it('handle the end points and reject non-positive degrees of freedom', () => {
    expect([chiSquareCdf(0, 3), chiSquareSurvival(-1, 3), chiSquareCdf(Infinity, 3), chiSquareSurvival(Infinity, 3)]).toEqual([0, 1, 1, 0]);
    expect(() => chiSquareCdf(1, 0)).toThrow(RangeError);
  });
});
