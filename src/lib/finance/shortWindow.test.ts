import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import { normalRng } from '../math/rng';
import { ols } from '../stats/ols';
import {
  alphaBound, conditionalAlphaSummary, dailyFactorPanel, rollingBetas, shortWindowRegressions, unconditionalAlpha,
  type ShortWindow,
} from './shortWindow';

const ff3Daily = await loadSeries('ff3-daily');
const momDaily = await loadSeries('mom-daily');
const ff3 = await loadSeries('ff3-monthly');
const momMonthly = await loadSeries('mom-monthly');

describe('dailyFactorPanel', () => {
  it('builds row 1964-01-02 from the raw percent cells, with an inclusive end', () => {
    const panel = dailyFactorPanel(ff3Daily, momDaily, { start: '1964-01-01', end: '1964-01-31' });
    const [mkt, smb, hml, rf] = ff3Daily.rows.find(([date]) => date === '1964-01-02')!.slice(1) as number[];
    const mom = momDaily.rows.find(([date]) => date === '1964-01-02')![1] as number;
    expect(panel.dates[0]).toBe('1964-01-02');
    expect(panel.dates.at(-1)).toBe('1964-01-31');
    expect([panel['Mkt-RF'][0], panel.SMB[0], panel.HML[0], panel.Mom[0], panel.RF[0]])
      .toEqual([mkt / 100, smb / 100, hml / 100, mom / 100, rf / 100]);
  });

  it('throws a RangeError when the dates do not line up', () => {
    const shifted = { ...momDaily, rows: momDaily.rows.filter(([date]) => date !== '1964-01-03') };
    expect(() => dailyFactorPanel(ff3Daily, shifted, { start: '1964-01-01', end: '1964-01-31' })).toThrow(RangeError);
  });
});

describe('rollingBetas', () => {
  // By hand. Window ending at t = 2: x = (0, 1, 2), y = (1, 3, 2), x̄ = 1, ȳ = 2, Sxy = 1, Sxx = 2,
  // β = 1/2, α = 2 - 1/2 = 3/2. Window ending at t = 3: x = (1, 2, 3), y = (3, 2, 5), x̄ = 2, ȳ = 10/3,
  // Sxy = 2, Sxx = 2, β = 1, α = 10/3 - 2 = 4/3.
  it('matches two windows of three by hand, NaN before the first full window', () => {
    const { alpha, beta } = rollingBetas([1, 3, 2, 5], [0, 1, 2, 3], 3);
    expect(alpha.slice(0, 2)).toEqual([NaN, NaN]);
    expect(beta.slice(0, 2)).toEqual([NaN, NaN]);
    expect(alpha[2]).toBeCloseTo(1.5, 12);
    expect(beta[2]).toBeCloseTo(0.5, 12);
    expect(alpha[3]).toBeCloseTo(4 / 3, 12);
    expect(beta[3]).toBeCloseTo(1, 12);
  });

  it('rejects a window that is too short or too long', () => {
    expect(() => rollingBetas([1, 2, 3], [0, 1, 2], 2)).toThrow(RangeError);
    expect(() => rollingBetas([1, 2, 3], [0, 1, 2], 4)).toThrow(RangeError);
  });
});

describe('shortWindowRegressions', () => {
  const dates = ['2020-03-27', '2020-03-30', '2020-03-31', '2020-04-01', '2020-04-02', '2020-04-03', '2020-04-06', '2020-07-01'];
  const x = [0, 1, 2, 1, 2, 3, 4, 0];
  const y = [1, 3, 2, 2, 4, 5, 9, 1];

  // By hand. 2020-Q1: x = (0, 1, 2), y = (1, 3, 2): β = 1/2, α = 3/2, residuals (-1/2, 1, -1/2),
  // s² = 1.5/(3 - 2) = 1.5, SE(β) = √(s²/Sxx) = √0.75, SE(α) = √(s²(1/3 + x̄²/Sxx)) = √1.25.
  // 2020-Q2: x = (1, 2, 3, 4), y = (2, 4, 5, 9): x̄ = 2.5, ȳ = 5, Sxy = 11, Sxx = 5, β = 2.2, α = -0.5.
  // 2020-Q3 has one day, below minObs = 3.
  it('fits each calendar quarter by hand and skips short windows', () => {
    const [q1, q2, ...rest] = shortWindowRegressions(dates, y, x, { period: 'quarter', minObs: 3 });
    expect(rest).toEqual([]);
    expect(q1).toMatchObject({ period: '2020-Q1', start: '2020-03-27', end: '2020-03-31', nobs: 3 });
    expect(q1.alpha).toBeCloseTo(1.5, 12);
    expect(q1.beta).toBeCloseTo(0.5, 12);
    expect(q1.betaSE).toBeCloseTo(Math.sqrt(0.75), 12);
    expect(q1.alphaSE).toBeCloseTo(Math.sqrt(1.25), 12);
    expect(q2).toMatchObject({ period: '2020-Q2', start: '2020-04-01', end: '2020-04-06', nobs: 4 });
    expect(q2.alpha).toBeCloseTo(-0.5, 12);
    expect(q2.beta).toBeCloseTo(2.2, 12);
  });

  // Three days in each month of 2020 and an exact line y = 0.01 + 2x: every window has α = 0.01, β = 2.
  it('labels months, quarters, halves and years', () => {
    const z = normalRng(7);
    const days = Array.from({ length: 36 }, (_, t) => `2020-${String(Math.floor(t / 3) + 1).padStart(2, '0')}-0${(t % 3) + 1}`);
    const xs = days.map(() => z());
    const ys = xs.map((value) => 0.01 + 2 * value);
    const fit = (period: 'month' | 'quarter' | 'half' | 'year') => shortWindowRegressions(days, ys, xs, { period, minObs: 3 });
    expect(fit('month').map((w) => w.period)).toEqual(days.filter((_, t) => t % 3 === 0).map((d) => d.slice(0, 7)));
    expect(fit('quarter').map((w) => [w.period, w.nobs])).toEqual([['2020-Q1', 9], ['2020-Q2', 9], ['2020-Q3', 9], ['2020-Q4', 9]]);
    expect(fit('half').map((w) => [w.period, w.nobs])).toEqual([['2020-H1', 18], ['2020-H2', 18]]);
    const [year] = fit('year');
    expect([year.period, year.nobs]).toEqual(['2020', 36]);
    expect(year.alpha).toBeCloseTo(0.01, 12);
    expect(year.beta).toBeCloseTo(2, 12);
  });

  // Exact Dimson relation (Lewellen & Nagel 2006, Eq. 7) with β0 = 0.8, β1 = 0.3, β2 = 0.6: summed beta 1.7,
  // α = 0.001. The fit is exact only if each quarter's lags reach back into the previous quarter.
  it('sums the Dimson slopes under lags and drops only the first four days', () => {
    const z = normalRng(11);
    const days = Array.from({ length: 24 }, (_, t) => `2021-${String(Math.floor(t / 6) * 3 + 1).padStart(2, '0')}-${String((t % 6) + 10)}`);
    const xs = days.map(() => 0.01 * z());
    const ys = xs.map((_, t) => (t < 4 ? 0 : 0.001 + 0.8 * xs[t] + 0.3 * xs[t - 1] + 0.6 * (xs[t - 2] + xs[t - 3] + xs[t - 4]) / 3));
    const windows = shortWindowRegressions(days, ys, xs, { period: 'quarter', minObs: 5, lags: true });
    expect(windows.map((w) => [w.period, w.nobs])).toEqual([['2021-Q2', 6], ['2021-Q3', 6], ['2021-Q4', 6]]);
    for (const w of windows) {
      expect(w.alpha).toBeCloseTo(0.001, 10);
      expect(w.beta).toBeCloseTo(1.7, 10);
    }
  });

  it('rejects unsorted dates and a minObs at or below the parameter count', () => {
    expect(() => shortWindowRegressions(['2020-01-02', '2020-01-01', '2020-01-03'], [1, 2, 3], [0, 1, 3], { period: 'month', minObs: 3 }))
      .toThrow(RangeError);
    expect(() => shortWindowRegressions(dates, y, x, { period: 'quarter', minObs: 2 })).toThrow(RangeError);
  });
});

describe('conditionalAlphaSummary', () => {
  const window = (alpha: number, beta: number, betaSE: number): ShortWindow => (
    { period: '', start: '', end: '', nobs: 63, alpha, alphaSE: 0, beta, betaSE });

  // By hand. Alphas (1, 2, 3, 6): mean 3, s² = (4 + 1 + 0 + 9)/3 = 14/3, SE = √(14/3/4) = √(7/6).
  // Betas (0, 1, 1, 2): mean 1, s² = 2/3; SE(β̂) = 0.1, so Var(true β) = 2/3 - 0.01.
  it('averages the window alphas and backs out the volatility of true betas', () => {
    const summary = conditionalAlphaSummary([window(1, 0, 0.1), window(2, 1, 0.1), window(3, 1, 0.1), window(6, 2, 0.1)]);
    expect(summary.windows).toBe(4);
    expect(summary.meanAlpha).toBeCloseTo(3, 12);
    expect(summary.alphaSE).toBeCloseTo(Math.sqrt(7 / 6), 12);
    expect(summary.alphaT).toBeCloseTo(3 / Math.sqrt(7 / 6), 12);
    expect(summary.meanBeta).toBeCloseTo(1, 12);
    expect(summary.sigmaBeta).toBeCloseTo(Math.sqrt(2 / 3), 12);
    expect(summary.sigmaBetaTrue).toBeCloseTo(Math.sqrt(2 / 3 - 0.01), 12);
  });

  it('returns NaN for the true-beta volatility when sampling error exceeds the beta variance', () => {
    expect(conditionalAlphaSummary([window(1, 0, 1), window(2, 1, 1)]).sigmaBetaTrue).toBeNaN();
  });
});

describe('unconditionalAlpha', () => {
  // By hand, two equally likely states. β = (0.5, 1.5), λ = (0, 0.01), σ² = 0.0024: β̄ = 1, λ̄ = 0.005,
  // Var(λ) = 0.000025, σ²_M = 0.002425, Cov(β, λ) = 0.0025, Cov(β, (λ - λ̄)²) = 0, Cov(β, σ²) = 0.
  // Eq. (3): α^u = (1 - λ̄²/σ²_M) Cov(β, λ) = 0.0025 (1 - 0.000025/0.002425).
  it('matches Eq. (3) by hand when beta moves with the premium', () => {
    const result = unconditionalAlpha([0.5, 1.5], [0, 0.01], 0.0024);
    expect(result.meanBeta).toBeCloseTo(1, 14);
    expect(result.covariance).toBeCloseTo(0.0025, 14);
    expect(result.unconditionalBeta).toBeCloseTo(1 + 0.005 * 0.0025 / 0.002425, 12);
    expect(result.alpha).toBeCloseTo(0.0025 * (1 - 0.000025 / 0.002425), 14);
    expect(result.approximation).toBeCloseTo(0.0025, 14);
  });

  // By hand. β = (0.5, 1.5), constant λ = 0.005, σ² = (0.001, 0.003): Cov(β, σ²) = 0.0005, σ²_M = 0.002,
  // β^u = 1 + 0.0005/0.002 = 1.25 and α^u = 0.005 (1 - 1.25) = -0.00125, which Eq. (4) also gives.
  it('lowers alpha when beta moves with market volatility', () => {
    const result = unconditionalAlpha([0.5, 1.5], [0.005, 0.005], [0.001, 0.003]);
    expect(result.unconditionalBeta).toBeCloseTo(1.25, 12);
    expect(result.alpha).toBeCloseTo(-0.00125, 14);
    expect(result.approximation).toBeCloseTo(-0.00125, 14);
  });

  // Seeded simulation of a conditional CAPM that holds every month: β_t = 1 + 0.5 z1, λ_t = 0.005 + 0.004
  // (0.8 z1 + 0.6 z2), σ_t = 0.04, R_M = λ_t + σ_t e1, R_i = β_t R_M + 0.02 e2. The OLS intercept of R_i on R_M
  // over 200,000 months has a standard error near 6e-5, so the tolerance 2e-4 is about three standard errors.
  it('matches the OLS alpha of a long seeded simulation with time-varying beta and premium', () => {
    const z = normalRng(2006);
    const T = 200_000;
    const beta: number[] = [];
    const premium: number[] = [];
    const market: number[] = [];
    const asset: number[] = [];
    for (let t = 0; t < T; t++) {
      const z1 = z();
      beta.push(1 + 0.5 * z1);
      premium.push(0.005 + 0.004 * (0.8 * z1 + 0.6 * z()));
      market.push(premium[t] + 0.04 * z());
      asset.push(beta[t] * market[t] + 0.02 * z());
    }
    const implied = unconditionalAlpha(beta, premium, 0.04 ** 2);
    const fit = ols(asset, [market]);
    expect(implied.alpha).toBeGreaterThan(0.0014);
    expect(Math.abs(fit.coefficients[0] - implied.alpha)).toBeLessThan(2e-4);
    expect(Math.abs(fit.coefficients[1] - implied.unconditionalBeta)).toBeLessThan(0.01);
  });
});

describe('alphaBound', () => {
  // Lewellen & Nagel (2006, p. 290): σ(β) = 0.3, σ(λ) = 0.5% a month gives at most 0.15% a month;
  // Table 1 (p. 295) peaks at σ(β) = 0.7, σ(λ) = 0.5%: 0.35%.
  it('multiplies the two standard deviations, by hand', () => {
    expect(alphaBound(0.3, 0.005)).toBeCloseTo(0.0015, 15);
    expect(alphaBound(0.7, 0.005)).toBeCloseTo(0.0035, 15);
    expect(() => alphaBound(-0.1, 0.005)).toThrow(RangeError);
  });
});

// Pinned on the committed French data, 1964-01 to 2026-06: quarterly regressions on daily returns with
// the Dimson lags of Eq. (7), as in Table 3 (p. 301), at least 40 days a quarter. Daily alphas times 21
// are percent monthly (p. 299). The unconditional CAPM alpha uses monthly returns, and the bound uses
// the implied volatility of true betas with σ(λ) = 0.5% a month, the largest value in Table 1.
describe('Lewellen–Nagel on the French data from 1964', () => {
  const panel = dailyFactorPanel(ff3Daily, momDaily, { start: '1964-01-01', end: '2026-06-30' });
  const monthlyStart = ff3.rows.findIndex(([date]) => date === '1964-01-01');
  const monthly = ff3.rows.slice(monthlyStart, monthlyStart + 750);
  const mkt = monthly.map((row) => (row[1] as number) / 100);
  const momRows = momMonthly.rows.filter(([date]) => date >= '1964-01-01' && date <= '2026-06-01');

  it('keeps 750 aligned months for the unconditional regressions', () => {
    expect(monthly.at(-1)![0]).toBe('2026-06-01');
    expect(momRows.map(([date]) => date)).toEqual(monthly.map(([date]) => date));
  });

  it.each([
    // [factor, σ(β̂), implied σ(β), mean alpha × 21, t, unconditional alpha, bound]
    ['HML', 0.31307, 0.26737, 0.0032404, 2.7200, 0.0037979, 0.0013368],
    ['Mom', 0.54471, 0.50585, 0.0084163, 6.1814, 0.0071067, 0.0025293],
  ] as const)('%s: 250 quarters, σ(β̂), the average conditional alpha and the bound', (name, sigma, sigmaTrue, alpha21, t, uncond, bound) => {
    const windows = shortWindowRegressions(panel.dates, panel[name], panel['Mkt-RF'], { period: 'quarter', minObs: 40, lags: true });
    const summary = conditionalAlphaSummary(windows);
    expect(summary.windows).toBe(250);
    expect(windows[0].period).toBe('1964-Q1');
    expect(windows.at(-1)!.period).toBe('2026-Q2');
    expect(summary.sigmaBeta).toBeCloseTo(sigma, 4);
    expect(summary.sigmaBetaTrue).toBeCloseTo(sigmaTrue, 4);
    expect(21 * summary.meanAlpha).toBeCloseTo(alpha21, 6);
    expect(summary.alphaT).toBeCloseTo(t, 3);
    const y = name === 'HML' ? monthly.map((row) => (row[3] as number) / 100) : momRows.map((row) => (row[1] as number) / 100);
    expect(ols(y, [mkt]).coefficients[0]).toBeCloseTo(uncond, 6);
    expect(alphaBound(summary.sigmaBetaTrue, 0.005)).toBeCloseTo(bound, 6);
  });
});
