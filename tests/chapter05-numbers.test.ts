/**
 * Every number in the prose of chapter 5, recomputed from shiller-monthly through the
 * library. If the data or the library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import sh from '../src/data/series/shiller-monthly.json';
import type { Series } from '../src/lib/data/series';
import { fitAR1 } from '../src/lib/finance/predictive';
import { arithmeticMean, sampleVariance } from '../src/lib/finance/returns';
import { matPow } from '../src/lib/math/linalg';
import {
  ar1Variance, fitVAR1, forecastVAR1, halfLife, sampleAutocorrelation, simulateAR1,
} from '../src/lib/stats/var';
import { DEFAULT_AR1 } from '../src/components/plots/AR1Simulator';
import { ORIGINS } from '../src/components/plots/VARForecast';
import { shillerValuation, valuationForecast, valuationModels } from '../src/components/plots/persistenceSample';

const data = shillerValuation(sh as unknown as Series<'shiller-monthly'>);
const at = (date: string) => data.dates.indexOf(date);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const ratio = (logValue: number, digits: number) => percent(Math.exp(logValue), digits);
const years = (months: number, digits = 1) => (months / 12).toFixed(digits);
const ar = fitAR1(data.dp);
const se = fitVAR1([data.dp]).standardErrors[0][0];

describe('chapter 5 prose numbers', () => {
  test('hook: the dividend–price ratio from 1881 to 2023', () => {
    expect([data.dates[0], data.dates.at(-1), data.dates.length]).toEqual(['1881-01-01', '2023-06-01', 1710]);
    expect(ratio(data.dp[at('1932-06-01')], 1)).toBe('13.8');
    expect(Math.max(...data.dp)).toBe(data.dp[at('1932-06-01')]);
    expect(ratio(data.dp[at('2000-08-01')], 1)).toBe('1.1');
    expect(Math.min(...data.dp)).toBe(data.dp[at('2000-08-01')]); // "its lowest month"
    expect(ratio(data.dp[at('2023-06-01')], 2)).toBe('1.58');
    expect(ratio(arithmeticMean(data.dp), 1)).toBe('3.8'); // typical level: exp of the mean log ratio
    expect(Math.floor(data.dates.length / 12)).toBe(142); // "these 142 years"
  });

  test('intuition: half-lives in the widget', () => {
    expect([DEFAULT_AR1.phi, DEFAULT_AR1.sigma, DEFAULT_AR1.T, DEFAULT_AR1.seed]).toEqual([0.98, 0.04, 600, 1]);
    expect([fixed(halfLife(0.98), 0), years(halfLife(0.98))]).toEqual(['34', '2.9']);
    expect(halfLife(0.5)).toBeCloseTo(1, 12);
    expect(years(halfLife(0.999), 0)).toBe('58');
    // The dp preset rounds the estimates to the slider step of 0.001.
    expect([fixed(ar.phi, 3), fixed(ar.residualStd, 3), fixed(ar.phi, 4)]).toEqual(['0.997', '0.043', '0.9966']);
    expect([fixed(halfLife(ar.phi), 0), years(halfLife(ar.phi))]).toEqual(['205', '17.1']);
  });

  test('formalisation: variance, standard error and its range', () => {
    expect(fixed(Math.sqrt(ar1Variance(ar.phi, ar.residualStd)), 2)).toBe('0.52');
    expect(fixed(Math.sqrt(sampleVariance(data.dp)), 2)).toBe('0.45');
    expect(fixed(se, 4)).toBe('0.0023');
    expect([fixed(ar.phi - 2 * se, 4), years(halfLife(ar.phi - 2 * se))]).toEqual(['0.9921', '7.3']);
    expect(fixed(ar.phi + 2 * se, 4)).toBe('1.0012');
  });

  test('formalisation: subsamples', () => {
    const split = at('1952-01-01');
    const early = fitAR1(data.dp.slice(0, split));
    const late = fitAR1(data.dp.slice(split));
    expect([data.dates[split - 1], fixed(early.phi, 3), years(halfLife(early.phi))]).toEqual(['1951-12-01', '0.979', '2.7']);
    expect([fixed(late.phi, 3), years(halfLife(late.phi))]).toEqual(['0.995', '12.7']);
  });

  test('formalisation: sample autocorrelations and their small-sample fall', () => {
    const acf = sampleAutocorrelation(data.dp, 120);
    expect([fixed(ar.phi ** 12, 3), fixed(acf[12], 3)]).toEqual(['0.960', '0.892']);
    expect([fixed(ar.phi ** 120, 3), fixed(acf[120], 3)]).toEqual(['0.666', '0.556']);
    let below = 0;
    let sum = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const lag120 = sampleAutocorrelation(simulateAR1({ T: 1710, phi: 0.9966, sigma: 0.043, seed }), 120)[120];
      if (lag120 < 0.9966 ** 120) below++;
      sum += lag120;
    }
    expect([below, fixed(sum / 200, 2)]).toEqual([188, '0.39']);
  });

  test('formalisation: the VAR(1) of dp and ep', () => {
    const { A, standardErrors } = fitVAR1([data.dp, data.ep]);
    expect(A.flat().map((v) => fixed(v, 3))).toEqual(['0.989', '0.012', '-0.007', '0.997']);
    expect([fixed(standardErrors[0][1], 4), fixed(A[0][1] / standardErrors[0][1], 1)]).toEqual(['0.0038', '3.2']);
    expect([fixed(standardErrors[1][0], 4), fixed(A[1][0] / standardErrors[1][0], 1)]).toEqual(['0.0040', '-1.7']);
  });

  test('playground: forecasts from June 2023 and December 1999', () => {
    const models = valuationModels(data);
    expect(ORIGINS.slice(0, 2)).toEqual(['2023-06-01', '1999-12-01']);
    const t = at('2023-06-01');
    expect(ratio(valuationForecast(models, data, t, 120, 'var')[0], 2)).toBe('2.64');
    expect(ratio(valuationForecast(models, data, t, 120, 'ar')[0], 2)).toBe('1.99');
    expect(ratio(data.dp[t] - data.ep[t], 0)).toBe('38'); // payout: dividends over earnings
    expect(ratio(models.var.mean[0] - models.var.mean[1], 0)).toBe('54');
    const s = at('1999-12-01');
    const [varDp, varEp] = valuationForecast(models, data, s, 120, 'var');
    const [arDp] = valuationForecast(models, data, s, 120, 'ar');
    expect(data.dates[s + 120]).toBe('2009-12-01');
    expect([ratio(data.dp[s + 120], 2), ratio(varDp, 2), ratio(arDp, 2)]).toEqual(['2.02', '2.32', '1.63']);
    expect([ratio(varEp, 2), ratio(data.ep[s + 120], 2)]).toEqual(['7.11', '4.59']);
    expect([ratio(models.var.mean[0], 2), ratio(models.dp.mean[0], 2)]).toEqual(['3.57', '3.17']);
    const j = at('1932-06-01');
    expect([data.dates[j + 12], ratio(data.dp[j + 12], 1)]).toEqual(['1933-06-01', '4.5']);
  });

  test('check yourself', () => {
    expect(fixed(halfLife(0.9), 1)).toBe('6.6');
    expect([fixed(Math.log(0.5), 3), fixed(Math.log(0.9), 3)]).toEqual(['-0.693', '-0.105']);
    expect(fixed(Math.sqrt(ar1Variance(0.8, 0.06)), 2)).toBe('0.10');
    const A = [[0.5, 0], [0.5, 0.5]];
    expect(matPow(A, 2)).toEqual([[0.25, 0], [0.5, 0.25]]);
    expect(forecastVAR1({ A, mean: [0, 0] }, [1, 0], 2)).toEqual([0.25, 0.5]);
  });
});
