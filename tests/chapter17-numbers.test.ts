/**
 * Every number in the prose of chapter 17, recomputed from ff3-monthly and ff25-size-bm-monthly
 * through the library and the widgets' sample helpers. If the data or the library changes, this
 * test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff3Json from '../src/data/series/ff3-monthly.json';
import ff25Json from '../src/data/series/ff25-size-bm-monthly.json';
import type { Series } from '../src/lib/data/series';
import { crossSectionalRegression } from '../src/lib/finance/crossSection';
import { sampleCovariance, sampleMeans } from '../src/lib/finance/portfolio';
import { factorPanel, timeSeriesRegressions, type FactorModel } from '../src/lib/finance/timeSeriesTests';
import { invCdf } from '../src/lib/math/normal';
import { capmSample, PERIODS, smlView } from '../src/components/plots/capmSample';
import { famaMacBethMovie, twoPass } from '../src/components/plots/famaMacBethSample';

const ff3 = ff3Json as unknown as Series<'ff3-monthly'>;
const ff25 = ff25Json as unknown as Series<'ff25-size-bm-monthly'>;
const START = '1963-07-01';
const panel = (model: FactorModel, start = START) => factorPanel(ff3, ff25, { start, model });
const capm = panel('capm');
const ff3p = panel('ff3');
const capmMovie = famaMacBethMovie(capm);
const ff3Movie = famaMacBethMovie(ff3p);
/** Monthly decimal → % a year, rounded. */
const yearly = (v: number, digits = 1) => (v * 1200).toFixed(digits);
const percent = (v: number, digits = 1) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const month = (date: string) => capm.dates.indexOf(date);

describe('chapter 17 prose numbers', () => {
  test('hook: the sample, the chapter 7 line and the Fama–MacBeth slope', () => {
    expect([capm.dates[0], capm.dates.at(-1), capm.dates.length]).toEqual(['1963-07-01', '2026-08-01', 758]);
    const sml = smlView(capmSample(ff3, ff25, PERIODS.post1963.start));
    expect([percent(sml.premium), percent(sml.fit.slope)]).toEqual(['7.2', '-4.3']);
    const { fm } = capmMovie;
    expect([yearly(fm.lambda[0]), yearly(fm.se[0]), fixed(fm.tStats[0], 2)]).toEqual(['-4.3', '4.8', '-0.91']);
  });

  test('intuition: October 1987 and the spread of the monthly slopes', () => {
    const t = month('1987-10-01');
    expect([percent(capm.factors[t][0]), percent(capmMovie.fm.monthly[t][0])]).toEqual(['-23.2', '-27.7']);
    const slopes = capmMovie.fm.monthly.map((row) => row[0]);
    const sd = Math.sqrt(slopes.reduce((s, v) => s + (v - capmMovie.fm.lambda[0]) ** 2, 0) / slopes.length);
    expect(percent(sd)).toBe('10.9');
    expect(fixed((slopes.filter((v) => v < 0).length / slopes.length) * 100, 0)).toBe('52');
    // The movie ends at the full-sample estimate, with a band of ±1.96 standard errors.
    const last = capm.dates.length - 1;
    expect(yearly(capmMovie.fm.runningMean[last][0])).toBe('-4.3');
    expect(yearly(invCdf(0.975) * capmMovie.runningSE[last])).toBe('9.3');
    expect(capmMovie.runningSE[last]).toBeCloseTo(capmMovie.fm.se[0], 14);
    // The 7.2% CAPM slope lies above the band.
    const mean = capm.factors.reduce((s, f) => s + f[0], 0) / capm.factors.length;
    expect(capmMovie.fm.lambda[0] + invCdf(0.975) * capmMovie.fm.se[0]).toBeLessThan(mean);
    expect([yearly(ff3Movie.fm.lambda[0]), fixed(ff3Movie.fm.tStats[0], 2)]).toEqual(['-6.6', '-1.80']);
  });

  test('formalisation: OLS and GLS second passes against the factor means', () => {
    const capmOLS = twoPass(capm, { intercept: false, weighting: 'ols' });
    const capmGLS = twoPass(capm, { intercept: false, weighting: 'gls' });
    expect([yearly(capmOLS.lambda[0]), yearly(capmGLS.lambda[0]), yearly(capmOLS.factorMean[0])]).toEqual(['8.2', '7.5', '7.2']);
    const ols = twoPass(ff3p, { intercept: false, weighting: 'ols' });
    const gls = twoPass(ff3p, { intercept: false, weighting: 'gls' });
    expect(ols.lambda.map((v) => yearly(v))).toEqual(['6.7', '1.7', '4.2']);
    expect(gls.lambda.map((v) => yearly(v))).toEqual(['7.5', '1.8', '3.6']);
    expect(ols.factorMean.map((v) => yearly(v))).toEqual(['7.2', '1.8', '3.5']);
    // "For the market and HML, GLS lands closer to them."
    for (const k of [0, 2]) {
      expect(Math.abs(gls.lambda[k] - gls.factorMean[k])).toBeLessThan(Math.abs(ols.lambda[k] - ols.factorMean[k]));
    }
    // Weighting by the return covariance gives the same GLS estimate as the residual covariance.
    const first = timeSeriesRegressions(ff3p.excess, ff3p.factors);
    const withSigma = crossSectionalRegression(first.beta, sampleMeans(ff3p.excess), {
      intercept: false, weighting: 'gls', residualCovariance: sampleCovariance(ff3p.excess),
    });
    withSigma.lambda.forEach((v, k) => expect(v).toBeCloseTo(gls.lambda[k], 10));
    // λ̂ = f̄ + (β'Wβ)⁻¹β'W â: the first pass fits each mean exactly.
    const meanExcess = sampleMeans(ff3p.excess);
    meanExcess.forEach((m, i) => {
      const fit = first.beta[i].reduce((s, b, k) => s + b * first.factorMean[k], 0);
      expect(m).toBeCloseTo(first.alpha[i] + fit, 12);
    });
  });

  test('formalisation: the Fama–MacBeth table and the equality with the two-pass estimate', () => {
    const c = capmMovie.fm;
    expect([yearly(c.lambda[0]), fixed(c.tStats[0], 2), yearly(c.intercept!.mean), fixed(c.intercept!.tStat, 2)])
      .toEqual(['-4.3', '-0.91', '13.9', '3.13']);
    const f = ff3Movie.fm;
    expect(f.lambda.map((v) => yearly(v))).toEqual(['-6.6', '1.4', '3.9']);
    expect(f.tStats.map((v) => fixed(v, 2))).toEqual(['-1.80', '1.04', '2.95']);
    expect([yearly(f.intercept!.mean), fixed(f.intercept!.tStat, 2)]).toEqual(['13.9', '4.50']);
    // "Only HML has a premium more than two standard errors from zero."
    expect([...c.tStats, ...f.tStats].map((t) => Math.abs(t) > 2)).toEqual([false, false, false, true]);
    for (const [p, movie] of [[capm, capmMovie], [ff3p, ff3Movie]] as const) {
      const two = twoPass(p, { intercept: true, weighting: 'ols' });
      const gaps = [two.lambda0! - movie.fm.intercept!.mean, ...two.lambda.map((v, k) => v - movie.fm.lambda[k])];
      gaps.forEach((g) => expect(Math.abs(g)).toBeLessThan(1e-14));
    }
  });

  test('formalisation: the cross-sectional R²', () => {
    expect(fixed(twoPass(ff3p, { intercept: true, weighting: 'ols' }).r2, 2)).toBe('0.66');
    expect(fixed(twoPass(ff3p, { intercept: false, weighting: 'ols' }).r2, 2)).toBe('0.48');
    expect(fixed(twoPass(ff3p, { intercept: false, weighting: 'gls' }).r2, 2)).toBe('0.36');
    expect(fixed(twoPass(capm, { intercept: false, weighting: 'ols' }).r2, 2)).toBe('-0.59');
  });

  test('playground: fitted against actual', () => {
    const c = twoPass(capm, { intercept: false, weighting: 'ols' });
    expect([yearly(Math.min(...c.fitted)), yearly(Math.max(...c.fitted))]).toEqual(['7.1', '11.7']);
    expect([yearly(Math.min(...c.meanExcess)), yearly(Math.max(...c.meanExcess))]).toEqual(['4.0', '13.4']);
    const f = twoPass(ff3p, { intercept: false, weighting: 'ols' });
    const sg = ff3p.names.indexOf('ME1-BM1');
    expect([yearly(f.fitted[sg]), yearly(f.meanExcess[sg]), yearly(f.alpha[sg])]).toEqual(['8.8', '4.0', '-4.8']);
    expect(Math.max(...f.alpha.map(Math.abs))).toBe(Math.abs(f.alpha[sg]));
    const full = panel('ff3', PERIODS.full.start);
    expect(full.dates[0]).toBe('1926-07-01');
    expect(fixed(twoPass(full, { intercept: false, weighting: 'ols' }).r2, 2)).toBe('0.30');
  });

  test('quiz: the standard error of an average slope', () => {
    const se = 0.05 / Math.sqrt(600);
    expect([percent(se, 2), fixed(0.005 / se, 2)]).toEqual(['0.20', '2.45']);
  });
});
