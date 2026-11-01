import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import { identity } from '../math/linalg';
import { normalRng } from '../math/rng';
import { pca } from '../stats/pca';
import { crossSectionalRegression } from './crossSection';
import { canonicalCorrelations, latentRiskPremia, pcaFactors, rotateFactors } from './latentFactors';
import { sampleCovariance, sampleMeans } from './portfolio';
import { factorPanel, timeSeriesRegressions } from './timeSeriesTests';

// Reference values on real data come from numpy (SVD of the demeaned excess returns, QR-based canonical
// correlations, lstsq regressions) on the same committed files.
const [ff3, ff25] = await Promise.all([loadSeries('ff3-monthly'), loadSeries('ff25-size-bm-monthly')]);
// Monthly 25 size–B/M portfolios from 1963-07 to the last committed month (2026-08): T = 758, N = 25.
const panel = factorPanel(ff3, ff25, { start: '1963-07-01', model: 'ff3' });
const { excess } = panel;
const T = excess.length;
const N = excess[0].length;

const dot = (x: readonly number[], y: readonly number[]) => x.reduce((sum, v, i) => sum + v * y[i], 0);
const fitted = (beta: number[][], factors: number[][]) => factors.map((f) => beta.map((b) => dot(b, f)));
const maxGap = (A: number[][], B: number[][]) => Math.max(...A.flatMap((row, t) => row.map((v, i) => Math.abs(v - B[t][i]))));
const draws = (seed: number, rows: number, cols: number) => {
  const z = normalRng(seed);
  return Array.from({ length: rows }, () => Array.from({ length: cols }, z));
};
const corr = (x: number[], y: number[]) => {
  const S = sampleCovariance(x.map((v, t) => [v, y[t]]));
  return S[0][1] / Math.sqrt(S[0][0] * S[1][1]);
};
const column = (rows: number[][], j: number) => rows.map((row) => row[j]);

describe('pcaFactors', () => {
  it('with K = N reproduces the demeaned returns exactly', () => {
    const fit = pcaFactors(excess, N);
    const mean = sampleMeans(excess);
    expect(maxGap(fitted(fit.beta, fit.factors), excess.map((row) => row.map((v, i) => v - mean[i])))).toBeLessThan(1e-12);
    expect(Math.max(...fit.residuals.flat().map(Math.abs))).toBeLessThan(1e-12);
  });

  it('has variance shares equal to the eigenvalue shares of pca', () => {
    const { values } = pca(excess);
    const total = values.reduce((sum, v) => sum + v, 0);
    pcaFactors(excess, N).share.forEach((s, k) => expect(s).toBeCloseTo(values[k] / total, 14));
  });

  it('normalises the factors as Giglio & Xiu eq. 7: (1/T) Σ f_t f_t\' = I, loadings = time-series OLS betas', () => {
    const fit = pcaFactors(excess, 3);
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        expect(dot(column(fit.factors, j), column(fit.factors, k)) / T).toBeCloseTo(Number(j === k), 12);
      }
    }
    expect(maxGap(fit.beta, timeSeriesRegressions(excess, fit.factors).beta)).toBeLessThan(1e-12);
  });

  it('pins the variance shares of the first five PCs of the 25 portfolios from 1963-07', () => {
    // 83.3%, 6.3%, 3.5%, 1.3% and 0.7%: one level factor and a few small spreads.
    const reference = [0.8327177018, 0.0630353215, 0.035050571, 0.0134902216, 0.0072800043];
    pcaFactors(excess, 5).share.forEach((s, k) => expect(s).toBeCloseTo(reference[k], 9));
  });

  it('rejects K = 0', () => {
    expect(() => pcaFactors(excess, 0)).toThrow(RangeError);
  });
});

describe('rotateFactors', () => {
  it('leaves the fitted values βf_t unchanged to 1e-10 for a seeded random H', () => {
    const fit = pcaFactors(excess, 3);
    const rotated = rotateFactors(fit.beta, fit.factors, draws(112, 3, 3));
    expect(maxGap(fitted(rotated.beta, rotated.factors), fitted(fit.beta, fit.factors))).toBeLessThan(1e-10);
  });

  it('maps (β, f) to (βH⁻¹, Hf) for a hand-checked H', () => {
    // H = [[2, 1], [0, 1]], H⁻¹ = [[0.5, -0.5], [0, 1]].
    const rotated = rotateFactors([[1, 2], [3, 4]], [[1, 1], [2, -1]], [[2, 1], [0, 1]]);
    expect(rotated.beta).toEqual([[0.5, 1.5], [1.5, 2.5]]);
    expect(rotated.factors).toEqual([[3, 1], [3, -1]]);
  });
});

describe('canonicalCorrelations', () => {
  const pcs = pcaFactors(excess, 3).factors;

  it('of a block with itself is all ones', () => {
    canonicalCorrelations(panel.factors, panel.factors).correlations.forEach((cc) => expect(cc).toBeCloseTo(1, 10));
  });

  it('of two independent seeded blocks is near zero: every cc_k below 0.05 with T = 10000', () => {
    // Under independence cc_1 is of order (√K_X + √K_Y)/√T ≈ 0.035 for two blocks of three.
    const { correlations } = canonicalCorrelations(draws(1, 10000, 3), draws(2, 10000, 3));
    expect(correlations).toHaveLength(3);
    correlations.forEach((cc) => expect(cc).toBeLessThan(0.05));
  });

  it('equals the absolute correlation when K_X = K_Y = 1', () => {
    const market = column(panel.factors, 0);
    const smallGrowth = column(excess, 0);
    const hml = column(panel.factors, 2);
    expect(canonicalCorrelations(market.map((v) => [v]), smallGrowth.map((v) => [v])).correlations[0])
      .toBeCloseTo(Math.abs(corr(market, smallGrowth)), 12);
    expect(corr(market, hml)).toBeLessThan(0);
    expect(canonicalCorrelations(market.map((v) => [v]), hml.map((v) => [v])).correlations[0])
      .toBeCloseTo(Math.abs(corr(market, hml)), 12);
  });

  it('is unchanged to 1e-10 when either block is rotated', () => {
    // Seeded H with condition numbers 2.4 (seed 112) and 7.6 (seed 7). A near-singular H loses digits
    // in the block's covariance matrix, as it would in any method built on it.
    const base = canonicalCorrelations(pcs, panel.factors).correlations;
    const rotate = (rows: number[][], seed: number) => rotateFactors(identity(3), rows, draws(seed, 3, 3)).factors;
    [canonicalCorrelations(rotate(pcs, 112), panel.factors), canonicalCorrelations(pcs, rotate(panel.factors, 7))]
      .forEach(({ correlations }) => correlations.forEach((cc, k) => expect(Math.abs(cc - base[k])).toBeLessThan(1e-10)));
  });

  it('returns weights whose variates have unit variance and correlation cc_k', () => {
    const { correlations, xWeights, yWeights } = canonicalCorrelations(pcs, panel.factors);
    correlations.forEach((cc, k) => {
      const u = pcs.map((row) => dot(row, xWeights[k]));
      const v = panel.factors.map((row) => dot(row, yWeights[k]));
      const S = sampleCovariance(u.map((x, t) => [x, v[t]]));
      expect(S[0][0]).toBeCloseTo(1, 10);
      expect(S[1][1]).toBeCloseTo(1, 10);
      expect(S[0][1]).toBeCloseTo(cc, 10);
    });
  });

  it('gives min(K_X, K_Y) correlations for blocks of different widths', () => {
    expect(canonicalCorrelations(pcaFactors(excess, 5).factors, panel.factors).correlations).toHaveLength(3);
    expect(canonicalCorrelations(panel.factors, pcaFactors(excess, 5).factors).correlations).toHaveLength(3);
  });

  it('pins the canonical correlations of the first three PCs with Mkt-RF, SMB and HML from 1963-07', () => {
    // 0.995, 0.972 and 0.931: the two sets of three factors span nearly the same space.
    const reference = [0.9949789121, 0.971665956, 0.9305292549];
    canonicalCorrelations(pcs, panel.factors).correlations.forEach((cc, k) => expect(cc).toBeCloseTo(reference[k], 9));
  });
});

describe('latentRiskPremia', () => {
  const mean = sampleMeans(excess);
  const olsR2 = (factors: number[][]) => crossSectionalRegression(
    timeSeriesRegressions(excess, factors).beta, mean, { intercept: true, weighting: 'ols' },
  ).r2;

  it('gives the same λ̂ as crossSectionalRegression on the factors\' own time-series betas', () => {
    const premia = latentRiskPremia(excess, 3);
    const { beta } = timeSeriesRegressions(excess, pcaFactors(excess, 3).factors);
    for (const intercept of [true, false]) {
      const direct = crossSectionalRegression(beta, mean, { intercept, weighting: 'ols' });
      const fit = intercept ? premia.withIntercept : premia.withoutIntercept;
      fit.lambda.forEach((l, k) => expect(l).toBeCloseTo(direct.lambda[k], 14));
      expect(fit.r2).toBeCloseTo(direct.r2, 12);
    }
    expect(premia.withIntercept.lambda0).toBeCloseTo(crossSectionalRegression(beta, mean, { intercept: true, weighting: 'ols' }).lambda0!, 14);
  });

  it('pins the cross-sectional R² with an intercept for K = 1, …, 5 PCs, CAPM and FF3 from 1963-07', () => {
    // The level factor alone prices nothing (0.2%); three PCs reach 64%, near FF3's 66%; five reach 79%.
    const reference = [0.0020481201, 0.281512916, 0.6395681462, 0.7033656302, 0.7905830553];
    reference.forEach((r2, k) => expect(latentRiskPremia(excess, k + 1).withIntercept.r2).toBeCloseTo(r2, 9));
    expect(olsR2(panel.factors.map(([m]) => [m]))).toBeCloseTo(0.0781830585, 9);
    expect(olsR2(panel.factors)).toBeCloseTo(0.6632929136, 9);
  });
});
