import { describe, expect, it } from 'vitest';
import { fCdf, fSurvival, logGamma, regularizedBeta } from './distributions';

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
