import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import { arithmeticMean, sampleVariance } from './returns';
import {
  fitAR1, forwardSums, goyalWelchAnnualPredictors, horizonSlopes,
  impliedHorizonSlope, predictiveRegression, simulatePredictive,
} from './predictive';

describe('forward alignment', () => {
  it('pairs x[t] with only the next k returns, without mutating inputs', () => {
    const r = Object.freeze([100, 1, 2, 4, 8]);
    const x = Object.freeze([0, 1, 2, 100, 200]);
    // k=2: x[0]=0 -> 1+2=3; x[1]=1 -> 2+4=6; x[2]=2 -> 4+8=12.
    expect(forwardSums(r, 2)).toEqual([3, 6, 12]);
    expect(forwardSums(r, 1)).toEqual([1, 2, 4, 8]);
    expect(forwardSums(r, 4)).toEqual([15]);
    expect(forwardSums(r, 5)).toEqual([]);
    expect(forwardSums([], 1)).toEqual([]);
    // Hand OLS of [3,6,12] on [0,1,2]: slope 4.5, intercept 2.5, SSE=1.5.
    const fit = predictiveRegression(r, x, 2, { errors: 'classical' });
    expect(fit.slope).toBeCloseTo(4.5, 12);
    expect(fit.intercept).toBeCloseTo(2.5, 12);
    expect(fit.standardError).toBeCloseTo(Math.sqrt(0.75), 12);
    expect(fit.tStat).toBeCloseTo(4.5 / Math.sqrt(0.75), 12);
    expect(fit.r2).toBeCloseTo(1 - 1.5 / 42, 12);
    expect(fit.nobs).toBe(3);
    expect(r).toEqual([100, 1, 2, 4, 8]);
    expect(x).toEqual([0, 1, 2, 100, 200]);
  });

  it.each([0, -1, 1.5, NaN, Infinity])('rejects invalid horizon %s', (k) => {
    expect(() => forwardSums([1, 2, 3], k)).toThrow(RangeError);
    expect(() => impliedHorizonSlope(1, 0.9, k)).toThrow(RangeError);
  });

  it('rejects invalid data and samples without residual degrees of freedom', () => {
    expect(() => forwardSums([0, NaN], 1)).toThrow();
    expect(() => predictiveRegression([1, 2], [1], 1)).toThrow();
    expect(() => predictiveRegression([1, 2, 3], [1, 2, 3], 1)).toThrow();
    expect(() => predictiveRegression([1, 2, 3, 4], [1, 1, 1, 1], 1)).toThrow();
    expect(() => predictiveRegression([1, 2, 3, 4], [1, 2, 3, Infinity], 1)).toThrow();
    expect(() => fitAR1([1, 2, 3])).toThrow();
    expect(() => fitAR1([1, 2, 3, NaN])).toThrow();
  });
});

/* Independent reference generation, entirely outside the repository.
 * Python 3.15.0, numpy 2.5.4, statsmodels 0.15.0; no finite-sample HAC correction.
 * Run from the repository root:
 * python3 -m venv /tmp/course-site-task-012-predictive-venv
 * /tmp/course-site-task-012-predictive-venv/bin/python3 -m pip install numpy==2.5.4 statsmodels==0.15.0
 * /tmp/course-site-task-012-predictive-venv/bin/python3 - <<'PY'
import json
import numpy as np
import statsmodels.api as sm
from statsmodels.stats.sandwich_covariance import cov_hac, weights_uniform
with open('src/data/series/goyal-welch-annual.json') as f:
    data = json.load(f)
names = [c['name'] for c in data['columns']]
indices = [names.index(n) for n in ['Index', 'D12', 'CRSP_SPvw', 'Rfree']]
rows = [row for row in data['rows'] if all(row[i] is not None for i in indices)]
p, d, m, rf = np.array([[row[i] for i in indices] for row in rows]).T
x, r = np.log(d) - np.log(p), np.log1p(m) - np.log1p(rf)
for k in [1,5]:
    y = np.array([sum(r[t+1:t+k+1]) for t in range(len(r)-k)])
    fit = sm.OLS(y, sm.add_constant(x[:-k])).fit()
    print(k, fit.nobs, fit.params.tolist(), fit.rsquared)
    for kind in ['newey-west','hansen-hodrick','classical']:
        cov = fit.cov_params() if kind == 'classical' else cov_hac(
            fit, nlags=k, use_correction=False,
            **({'weights_func': weights_uniform} if kind == 'hansen-hodrick' else {}))
        se = np.sqrt(cov[1,1])
        print(kind, se, fit.params[1]/se)
PY
 */

describe('Goyal–Welch annual data', () => {
  const references = [
    {
      k: 1, nobs: 99, intercept: 0.2102464589056763, slope: 0.042294881064367545,
      r2: 0.01172402548041096,
      uncertainty: {
        'newey-west': [0.044778550525706715, 0.9445343935393056],
        'hansen-hodrick': [0.04780997052261025, 0.88464562102931],
        classical: [0.03942781252572033, 1.072716906036238],
      },
    },
    {
      k: 5, nobs: 95, intercept: 1.0264169731014985, slope: 0.210234901023516,
      r2: 0.0610034035169259,
      uncertainty: {
        'newey-west': [0.1268557467739484, 1.6572753412436707],
        'hansen-hodrick': [0.14370886629077434, 1.462922270906624],
        classical: [0.08552996938143377, 2.458026146203114],
      },
    },
  ];

  it.each(references)('matches independent statsmodels references at k=$k', async (reference) => {
    const { r, dp } = goyalWelchAnnualPredictors(await loadSeries('goyal-welch-annual'));
    for (const errors of ['newey-west', 'hansen-hodrick', 'classical'] as const) {
      const fit = predictiveRegression(r, dp, reference.k, { errors });
      expect(fit.slope).toBeCloseTo(reference.slope, 11);
      expect(fit.intercept).toBeCloseTo(reference.intercept, 11);
      expect(fit.r2).toBeCloseTo(reference.r2, 11);
      expect(fit.nobs).toBe(reference.nobs);
      expect(fit.standardError).toBeCloseTo(reference.uncertainty[errors][0], 11);
      expect(fit.tStat).toBeCloseTo(reference.uncertainty[errors][1], 11);
    }
    expect(predictiveRegression(r, dp, reference.k)).toEqual(predictiveRegression(r, dp, reference.k, { errors: 'newey-west' }));
  });

  it('preserves requested horizon order and forwards the error choice', async () => {
    const { r, dp } = goyalWelchAnnualPredictors(await loadSeries('goyal-welch-annual'));
    const fits = horizonSlopes(r, dp, [5, 1, 5], { errors: 'hansen-hodrick' });
    expect(fits.map(({ k }) => k)).toEqual([5, 1, 5]);
    expect(fits[0]).toEqual({ k: 5, ...predictiveRegression(r, dp, 5, { errors: 'hansen-hodrick' }) });
    expect(fits[2]).toEqual(fits[0]);
    expect(horizonSlopes(r, dp, [])).toEqual([]);
  });

  it('uses year-end levels and same-year returns, dropping only incomplete rows', async () => {
    const series = await loadSeries('goyal-welch-annual');
    const { dates, dp, r } = goyalWelchAnnualPredictors(series);
    expect(dates).toHaveLength(100);
    expect(dates).toEqual(Array.from({ length: 100 }, (_, t) => `${1926 + t}-01-01`));
    // 1926 year-end D12=0.69, Index=13.49; the return is earned during 1926.
    expect(dp[0]).toBeCloseTo(Math.log(0.69 / 13.49), 14);
    expect(r[0]).toBeCloseTo(Math.log1p(0.1220046) - Math.log1p(0.03289757), 14);
    const first = series.rows.findIndex(([date]) => date === dates[0]);
    const rows = series.rows.slice(first, first + 4).map((row) => [...row] as [string, ...(number | null)[]]);
    rows[1][series.columns.findIndex((c) => c.name === 'Rfree')] = null;
    rows[2][series.columns.findIndex((c) => c.name === 'D12')] = null;
    expect(goyalWelchAnnualPredictors({ ...series, rows }).dates).toEqual([dates[0], dates[3]]);
    rows[0][series.columns.findIndex((c) => c.name === 'Index')] = 0;
    expect(() => goyalWelchAnnualPredictors({ ...series, rows })).toThrow(RangeError);
    expect(goyalWelchAnnualPredictors({ ...series, rows: [] })).toEqual({ dates: [], dp: [], r: [] });
  });
});

describe('AR(1) horizon model', () => {
  it('handles one period, the unit-root limit, and persistence near one', () => {
    for (const phi of [-0.8, 0, 0.98, 1, 1 + 1e-12]) {
      expect(impliedHorizonSlope(0.0045, phi, 1)).toBeCloseTo(0.0045, 14);
    }
    expect(impliedHorizonSlope(0.0045, 1, 120)).toBeCloseTo(0.54, 14);
    expect(impliedHorizonSlope(2, 0.5, 3)).toBe(3.5);
    expect(impliedHorizonSlope(2, -0.5, 3)).toBe(1.5);
    expect(impliedHorizonSlope(0.0045, 1 - 1e-12, 120)).toBeCloseTo(0.54, 10);
    expect(() => impliedHorizonSlope(NaN, 0.9, 1)).toThrow();
  });

  it('is repeatable and defaults to 600 monthly observations', () => {
    const sample = simulatePredictive();
    expect(sample.r).toHaveLength(600);
    expect(sample.x).toHaveLength(600);
    expect(sample).toEqual(simulatePredictive({ seed: 42 }));
    expect(sample).not.toEqual(simulatePredictive({ seed: 43 }));
  });

  it('recovers persistence, innovation scale, return moments and shock correlation', () => {
    const { r, x } = simulatePredictive({ T: 60_000, corr: -0.6, seed: 19 });
    const ar = fitAR1(x);
    expect(Math.abs(ar.phi - 0.98)).toBeLessThan(0.02);
    expect(Math.abs(ar.intercept)).toBeLessThan(0.003);
    expect(Math.abs(ar.residualStd - Math.sqrt(1 - 0.98 ** 2))).toBeLessThan(0.003);
    expect(Math.abs(arithmeticMean(r) - 0.005)).toBeLessThan(0.001);
    expect(Math.abs(Math.sqrt(sampleVariance(r)) - 0.045)).toBeLessThan(0.001);
    const fit = predictiveRegression(r, x, 1, { errors: 'classical' });
    expect(Math.abs(fit.r2 - 0.01)).toBeLessThan(0.003);
    // Reconstruct model shocks from the returned arrays to check their timing and correlation.
    const e = r.slice(1).map((value, t) => value - 0.005 - 0.0045 * x[t]);
    const u = x.slice(1).map((value, t) => value - 0.98 * x[t]);
    const em = arithmeticMean(e);
    const um = arithmeticMean(u);
    const covariance = e.reduce((sum, value, t) => sum + (value - em) * (u[t] - um), 0) / (e.length - 1);
    expect(Math.abs(covariance / Math.sqrt(sampleVariance(e) * sampleVariance(u)) + 0.6)).toBeLessThan(0.015);
  });

  it('averages simulated horizon slopes near their population values', () => {
    const horizons = [1, 6, 12];
    const means = [0, 0, 0];
    const seeds = 200;
    for (let seed = 0; seed < seeds; seed++) {
      const { r, x } = simulatePredictive({ T: 8000, b1: 0.04, phi: 0.8, sigmaR: 0.12, sigmaX: 0.6, seed });
      horizonSlopes(r, x, horizons, { errors: 'classical' }).forEach((fit, j) => { means[j] += fit.slope / seeds; });
    }
    // Absolute tolerance 0.003: at most 7.5% of b1, across 200 independent 8000-month samples.
    means.forEach((mean, j) => expect(Math.abs(mean - impliedHorizonSlope(0.04, 0.8, horizons[j]))).toBeLessThan(0.003));
  });

  it.each([
    { T: 0 }, { T: 1.5 }, { phi: 1 }, { phi: -1 }, { sigmaR: -1 },
    { sigmaX: -1 }, { corr: 1.1 }, { seed: NaN }, { b1: Infinity },
  ])('rejects invalid simulation options %j', (options) => {
    expect(() => simulatePredictive(options)).toThrow(RangeError);
  });

  it('allows perfect shock correlations and zero innovation scales', () => {
    for (const corr of [-1, 1]) {
      expect(simulatePredictive({ T: 4, corr }).r.every(Number.isFinite)).toBe(true);
    }
    const deterministic = simulatePredictive({ T: 4, sigmaX: 0, sigmaR: 0 });
    expect(deterministic.x.every((value) => value === 0)).toBe(true);
    expect(deterministic.r).toEqual([0.005, 0.005, 0.005, 0.005]);
  });
});
