import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import { normalRng } from '../math/rng';
import { solve } from '../math/linalg';
import { ols } from '../stats/ols';
import { frontier, sampleMeans } from './portfolio';
import { factorPanel, grs, sharpeFrontiers, timeSeriesRegressions } from './timeSeriesTests';

const ff3 = await loadSeries('ff3-monthly');
const ff25 = await loadSeries('ff25-size-bm-monthly');

// Seeded panel: K = 2 factors, N = 5 assets with non-zero alphas, T = 120 months.
function seededPanel(seed: number, T = 120, N = 5, K = 2) {
  const z = normalRng(seed);
  const factors = Array.from({ length: T }, () => Array.from({ length: K }, (_, k) => 0.005 + 0.004 * k + 0.04 * z()));
  const loadings = Array.from({ length: N }, () => Array.from({ length: K }, () => 0.5 + z()));
  const excess = factors.map((f) => loadings.map((b, i) => 0.001 * (i - 2) + b.reduce((s, bk, k) => s + bk * f[k], 0) + 0.02 * z()));
  return { excess, factors };
}

describe('factorPanel', () => {
  it('builds row 1963-07 from the raw percent cells', () => {
    const panel = factorPanel(ff3, ff25, { start: '1963-07-01', model: 'ff3' });
    const [mkt, smb, hml, rf] =ff3.rows.find(([date]) => date === '1963-07-01')!.slice(1) as number[];
    const me1bm1 = ff25.rows.find(([date]) => date === '1963-07-01')![1] as number;
    expect(panel.factorNames).toEqual(['Mkt-RF', 'SMB', 'HML']);
    expect(panel.names[0]).toBe('ME1-BM1');
    expect(panel.names).toHaveLength(25);
    expect(panel.factors[0]).toEqual([mkt / 100, smb / 100, hml / 100]);
    expect(panel.excess[0][0]).toBeCloseTo(me1bm1 / 100 - rf / 100, 15);
  });

  it('keeps an inclusive end date and one factor for the CAPM', () => {
    const panel = factorPanel(ff3, ff25, { start: '1963-07-01', end: '1963-12-01', model: 'capm' });
    expect(panel.dates).toEqual(['1963-07-01', '1963-08-01', '1963-09-01', '1963-10-01', '1963-11-01', '1963-12-01']);
    expect(panel.factors.every((row) => row.length === 1)).toBe(true);
  });

  it('fails when the dates do not line up', () => {
    const shifted = { ...ff25, rows: ff25.rows.map(([date, ...rest]) => [date.replace('-01', '-02'), ...rest] as const) };
    expect(() => factorPanel(ff3, shifted, { start: '1963-07-01', model: 'capm' })).toThrow(RangeError);
    expect(() => factorPanel(ff3, ff25, { start: '2100-01-01', model: 'capm' })).toThrow(RangeError);
  });
});

describe('timeSeriesRegressions', () => {
  it('matches a hand-computed panel', () => {
    // f = (-2, -1, 0, 1, 2) has mean 0 and Σf² = 10, so α̂ = ȳ and β̂ = Σ f y / 10.
    // y1: α̂ 2, β̂ 1.3, ε̂ (0.6, 0.3, -1, -1.3, 1.4), SSR 5.1, s² = 5.1/3, se(α̂) = √(s²/5) = √0.34.
    // y2: α̂ 1, β̂ 0.5, ε̂ (1, -1.5, 1, -1.5, 1), SSR 7.5, se(α̂) = √0.5.
    const factors = [[-2], [-1], [0], [1], [2]];
    const excess = [[0, 1], [1, -1], [1, 2], [2, 0], [6, 3]];
    const fit = timeSeriesRegressions(excess, factors);
    expect(fit.alpha[0]).toBeCloseTo(2, 13);
    expect(fit.alpha[1]).toBeCloseTo(1, 13);
    expect(fit.beta[0][0]).toBeCloseTo(1.3, 13);
    expect(fit.beta[1][0]).toBeCloseTo(0.5, 13);
    expect(fit.alphaSE[0]).toBeCloseTo(Math.sqrt(0.34), 13);
    expect(fit.alphaSE[1]).toBeCloseTo(Math.sqrt(0.5), 13);
    expect(fit.alphaT[0]).toBeCloseTo(2 / Math.sqrt(0.34), 12);
    [0.6, 0.3, -1, -1.3, 1.4].forEach((e, t) => expect(fit.residuals[t][0]).toBeCloseTo(e, 13));
    // Divisor T = 5: Σ̂_ε = [[5.1, 2.5], [2.5, 7.5]] / 5, Σ̂_f = 10 / 5.
    const expected = [[1.02, 0.5], [0.5, 1.5]];
    expected.forEach((row, i) => row.forEach((v, j) => expect(fit.residualCovariance[i][j]).toBeCloseTo(v, 13)));
    expect(fit.factorMean[0]).toBeCloseTo(0, 15);
    expect(fit.factorCovariance[0][0]).toBeCloseTo(2, 13);
  });
});

describe('grs', () => {
  it("holds α̂'Σ̂_ε⁻¹α̂ = SR²_all - SR²_f in sample on a seeded panel", () => {
    const { excess, factors } = seededPanel(61);
    const fit = timeSeriesRegressions(excess, factors);
    const quadratic = fit.alpha.reduce((s, a, i) => s + a * solve(fit.residualCovariance, fit.alpha)[i], 0);
    const result = grs(excess, factors);
    expect(Math.abs(quadratic - (result.sharpeAll2 - result.sharpeFactors2))).toBeLessThan(1e-10);
    expect(result.statistic).toBeCloseTo((120 - 5 - 2) / 5 * quadratic / (1 + result.sharpeFactors2), 12);
    expect([result.df1, result.df2]).toEqual([5, 113]);
  });

  it('is zero when every alpha is zero', () => {
    // ε is the residual of noise on [1, f], so it is orthogonal to both and y = f β + ε has α̂ = 0 exactly.
    const { factors } = seededPanel(7, 60, 3, 2);
    const z = normalRng(8);
    const fCols = [0, 1].map((k) => factors.map((row) => row[k]));
    const eps = [0, 1, 2].map(() => ols(factors.map(() => z()), fCols).residuals);
    const excess = factors.map((f, t) => eps.map((e, i) => (i + 1) * f[0] - 0.5 * f[1] + e[t]));
    const result = grs(excess, factors);
    expect(Math.abs(result.statistic)).toBeLessThan(1e-20);
    expect(result.pValue).toBeCloseTo(1, 12);
  });

  it('equals the squared alpha t-statistic when N = 1', () => {
    // The paper's (T/N)(T-N-K)/(T-K-1) with the unbiased s² equals (T-N-K)/N with the divisor-T Σ̂_ε,
    // and (T-K-1)α̂²/(σ̂²_ML (1 + f̄'Σ̂_f⁻¹f̄)) is exactly t² of the classical OLS intercept.
    const { excess, factors } = seededPanel(3, 90, 1, 2);
    const result = grs(excess, factors);
    const t = timeSeriesRegressions(excess, factors).alphaT[0];
    expect(result.statistic).toBeCloseTo(t * t, 10);
    expect([result.df1, result.df2]).toEqual([1, 87]);
  });

  it('rejects the CAPM on the 25 size–B/M portfolios, 1963-07 to 2026-08', () => {
    // Reference: numpy least squares and scipy.stats.f.sf on the same panel (2026-10-22 extract).
    const panel = factorPanel(ff3, ff25, { start: '1963-07-01', model: 'capm' });
    expect([panel.dates[0], panel.dates.at(-1), panel.dates.length]).toEqual(['1963-07-01', '2026-08-01', 758]);
    const result = grs(panel.excess, panel.factors);
    expect(result.statistic).toBeCloseTo(4.196288229864006, 9);
    expect(result.pValue / 7.449207750512122e-11).toBeCloseTo(1, 6);
    expect(result.sharpeFactors2).toBeCloseTo(0.0182408782923226, 12);
    expect([result.df1, result.df2]).toEqual([25, 732]);
    const fit = timeSeriesRegressions(panel.excess, panel.factors);
    expect(fit.alpha[0]).toBeCloseTo(-0.00523213948968656, 12);
    expect(fit.alphaSE[0]).toBeCloseTo(0.0017787988186727494, 12);
  });

  it('rejects FF3 on the 25 size–B/M portfolios, 1963-07 to 2026-08', () => {
    const panel = factorPanel(ff3, ff25, { start: '1963-07-01', model: 'ff3' });
    expect([panel.dates[0], panel.dates.at(-1), panel.dates.length]).toEqual(['1963-07-01', '2026-08-01', 758]);
    const result = grs(panel.excess, panel.factors);
    expect(result.statistic).toBeCloseTo(3.6425630022229902, 9);
    expect(result.pValue / 8.300043963068039e-9).toBeCloseTo(1, 6);
    expect(result.sharpeFactors2).toBeCloseTo(0.03571613601359107, 12);
    expect([result.df1, result.df2]).toEqual([25, 730]);
    const fit = timeSeriesRegressions(panel.excess, panel.factors);
    expect(fit.alpha[0]).toBeCloseTo(-0.004646996173464719, 12);
    expect(fit.alphaSE[0]).toBeCloseTo(0.0009186914420821155, 12);
  });

  it('needs T > N + K', () => {
    const { excess, factors } = seededPanel(1, 7, 5, 2);
    expect(() => grs(excess, factors)).toThrow(RangeError);
  });
});

describe('sharpeFrontiers', () => {
  const { excess, factors } = seededPanel(61);
  const sd = [0.01, 0.03, 0.05, 0.08];
  const result = sharpeFrontiers(excess, factors, sd);

  it('puts every grid point on the portfolio.ts frontier of the same moments', () => {
    // Divisor-T moments: Σ = (T-1)/T × sampleCovariance, built here from the raw rows.
    for (const [rows, curve] of [[factors, result.factors], [factors.map((f, t) => [...f, ...excess[t]]), result.all]] as const) {
      const mu = sampleMeans(rows);
      const Sigma = mu.map((mi, i) => mu.map((mj, j) => rows.reduce((s, r) => s + (r[i] - mi) * (r[j] - mj), 0) / rows.length));
      sd.forEach((s, g) => {
        if (Number.isNaN(curve.upper[g])) {
          expect(s).toBeLessThan(curve.minVariance.sd);
          return;
        }
        const [up, low] = frontier(mu, Sigma, [curve.upper[g], curve.lower[g]]);
        expect(up.volatility).toBeCloseTo(s, 12);
        expect(low.volatility).toBeCloseTo(s, 12);
      });
      expect(frontier(mu, Sigma, [curve.minVariance.mean])[0].volatility).toBeCloseTo(curve.minVariance.sd, 12);
    }
    expect(result.all.upper.filter(Number.isFinite).length).toBeGreaterThan(0);
  });

  it('has the GRS Sharpe ratios as its tangent slopes', () => {
    const g = grs(excess, factors);
    expect(result.factors.sharpe ** 2).toBeCloseTo(g.sharpeFactors2, 13);
    expect(result.all.sharpe ** 2).toBeCloseTo(g.sharpeAll2, 13);
    expect(result.sd).toEqual(sd);
  });

  it('reduces one factor to a single point (σ_f, f̄)', () => {
    // f = (-2, -1, 0, 1, 2) + 1: mean 1, divisor-T variance 2.
    const one = sharpeFrontiers([[0, 1], [1, -1], [1, 2], [2, 0], [6, 3]], [[-1], [0], [1], [2], [3]], [1, 2]);
    expect(one.factors.minVariance.mean).toBeCloseTo(1, 13);
    expect(one.factors.minVariance.sd).toBeCloseTo(Math.sqrt(2), 13);
    expect(one.factors.upper.every(Number.isNaN)).toBe(true);
    expect(one.factors.sharpe).toBeCloseTo(1 / Math.sqrt(2), 13);
  });
});
