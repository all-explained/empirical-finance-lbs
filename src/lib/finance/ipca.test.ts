import { describe, expect, it } from 'vitest';
import { identity, matMul, symmetricEigen, transpose } from '../math/linalg';
import { famaMacBeth } from './crossSection';
import { alphaTest, ipcaFit, ipcaR2, managedPortfolios, simulateIpcaPanel, type IpcaFit } from './ipca';
import { sampleCovariance } from './portfolio';

const dot = (a: readonly number[], b: readonly number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);

function expectMatrixClose(actual: readonly (readonly number[])[], expected: readonly (readonly number[])[], digits: number) {
  expect(actual.length).toBe(expected.length);
  actual.forEach((row, i) => row.forEach((v, j) => expect(v).toBeCloseTo(expected[i][j], digits)));
}

// A large seeded panel: 1,000 firms, 240 months, 6 characteristics (the constant included), 2 factors.
const large = simulateIpcaPanel(1, { N: 1000, T: 240, dimZ: 6, K: 2 });
const largeManaged = managedPortfolios(large.Z, large.excess);
const largeFit = ipcaFit(largeManaged, { K: 2, alpha: false });

describe('simulateIpcaPanel', () => {
  const panel = simulateIpcaPanel(7, { N: 50, T: 12, dimZ: 3, K: 1, alphaShare: 0.3 });

  it('gives the same panel for the same seed', () => {
    expect(simulateIpcaPanel(7, { N: 50, T: 12, dimZ: 3, K: 1, alphaShare: 0.3 })).toEqual(panel);
  });

  it('puts a constant first and rank-transforms each characteristic each month to {1/N, 2/N, …, 1} - 0.5', () => {
    const grid = Array.from({ length: 50 }, (_, r) => (r + 1) / 50 - 0.5);
    panel.Z.forEach((Zt) => {
      expect(Zt.every((row) => row[0] === 1)).toBe(true);
      [1, 2].forEach((l) => expect(Zt.map((row) => row[l]).sort((a, b) => a - b)).toEqual(grid));
    });
  });

  it('draws an orthonormal Γ_β, a Γ_α orthogonal to it, and an alpha term with the requested share of squares', () => {
    expectMatrixClose(matMul(transpose(panel.gammaBeta), panel.gammaBeta), identity(1), 12);
    expect(dot(panel.gammaAlpha, panel.gammaBeta.map(([b]) => b))).toBeCloseTo(0, 12);
    // alphaShare = Σ(z'Γ_α)² / [Σ(z'Γ_α)² + Σ(R^e - z'Γ_α)²] = 0.3 exactly, by construction.
    let [alphaSquares, restSquares] = [0, 0];
    panel.Z.forEach((Zt, t) => Zt.forEach((z, i) => {
      const a = dot(z, panel.gammaAlpha);
      alphaSquares += a * a;
      restSquares += (panel.excess[t][i] - a) ** 2;
    }));
    expect(alphaSquares / (alphaSquares + restSquares)).toBeCloseTo(0.3, 12);
  });

  it('has Γ_α = 0 when alphaShare is 0 (the default)', () => {
    expect(simulateIpcaPanel(7, { N: 50, T: 12, dimZ: 3, K: 1 }).gammaAlpha).toEqual([0, 0, 0]);
  });
});

describe('managedPortfolios', () => {
  it('matches a hand computation with three firms and two characteristics (the constant and one more)', () => {
    const Z = [
      [[1, -0.5], [1, 0], [1, 0.5]],
      [[1, 0.2], [1, -0.4], [1, 0.3]],
    ];
    const excess = [[0.01, 0.02, 0.06], [-0.02, 0.04, 0.01]];
    const { returns, ZtZ } = managedPortfolios(Z, excess);
    // Month 0: R^Z = [0.01 + 0.02 + 0.06, -0.005 + 0 + 0.03]; Z'Z = [[3, 0], [0, 0.25 + 0 + 0.25]].
    // Month 1: R^Z = [-0.02 + 0.04 + 0.01, -0.004 - 0.016 + 0.003]; Z'Z = [[3, 0.1], [0.1, 0.04 + 0.16 + 0.09]].
    expectMatrixClose(returns, [[0.09, 0.025], [0.03, -0.017]], 15);
    expectMatrixClose(ZtZ[0], [[3, 0], [0, 0.5]], 15);
    expectMatrixClose(ZtZ[1], [[3, 0.1], [0.1, 0.29]], 15);
  });
});

describe('ipcaFit', () => {
  function expectNormalised(fit: IpcaFit) {
    const K = fit.lambda.length;
    expectMatrixClose(matMul(transpose(fit.gammaBeta), fit.gammaBeta), identity(K), 12);
    const covariance = sampleCovariance(fit.factors);
    covariance.forEach((row, i) => row.forEach((v, j) => {
      if (i !== j) expect(Math.abs(v)).toBeLessThan(1e-12 * covariance[0][0]);
    }));
    covariance.slice(1).forEach((row, k) => expect(row[k + 1]).toBeLessThan(covariance[k][k]));
    fit.lambda.forEach((mean) => expect(mean).toBeGreaterThanOrEqual(0));
  }

  it('with K = dim z gives Γ̂_β f̂_{t+1} equal to the month-by-month Fama–MacBeth slopes on Z_t (p. 15)', () => {
    // With K = L the paper sets Γ_β = I_L, so f̂_{t+1} is the slope vector (Z_t'Z_t)⁻¹Z_t'R^e_{t+1};
    // under the normalisation of p. 13 the factors are that vector rotated by Γ̂_β'.
    const panel = simulateIpcaPanel(3, { N: 60, T: 24, dimZ: 3, K: 2 });
    const fit = ipcaFit(managedPortfolios(panel.Z, panel.excess), { K: 3, alpha: false });
    panel.Z.forEach((Zt, t) => {
      const [slopes] = famaMacBeth([panel.excess[t]], Zt, { intercept: false }).monthly;
      const rotated = fit.gammaBeta.map((row) => dot(row, fit.factors[t]));
      rotated.forEach((v, l) => expect(v).toBeCloseTo(slopes[l], 9));
    });
  });

  it('recovers the column space of the true Γ_β on a large seeded panel', () => {
    // C = Γ̂_β'Γ_β has the cosines of the principal angles between the two column spaces as its
    // singular values. Its smallest squared singular value is 0.99826 here, so the test asks for ≥ 0.995:
    // the largest angle between the two planes is below 4.1°.
    const C = matMul(transpose(largeFit.gammaBeta), large.gammaBeta);
    expect(Math.min(...symmetricEigen(matMul(transpose(C), C)).values)).toBeGreaterThanOrEqual(0.995);
    expect(largeFit.converged).toBe(true);
  });

  it('never raises the objective from one iteration to the next, and stops once nothing moves by 10⁻⁶', () => {
    const { objective, maxChange } = largeFit.history;
    expect(objective.length).toBeGreaterThan(2);
    objective.slice(1).forEach((value, j) => expect(value).toBeLessThanOrEqual(objective[j]));
    expect(maxChange.at(-1)).toBeLessThan(1e-6);
    maxChange.slice(0, -1).forEach((change) => expect(change).toBeGreaterThanOrEqual(1e-6));
  });

  it('imposes the normalisation of p. 13 on restricted and unrestricted fits, with Γ̂_α orthogonal to Γ̂_β', () => {
    expectNormalised(largeFit);
    expect(largeFit.gammaAlpha).toBeUndefined();
    const panel = simulateIpcaPanel(2, { K: 2, alphaShare: 0.01 });
    const fit = ipcaFit(managedPortfolios(panel.Z, panel.excess), { K: 2, alpha: true });
    expectNormalised(fit);
    transpose(fit.gammaBeta).forEach((column) => expect(dot(column, fit.gammaAlpha!)).toBeCloseTo(0, 12));
  });
});

describe('ipcaR2', () => {
  it('is 1 (total) on noiseless panels, restricted and unrestricted', () => {
    const restricted = simulateIpcaPanel(4, { noise: 0 });
    expect(ipcaR2(restricted, ipcaFit(managedPortfolios(restricted.Z, restricted.excess), { K: 2, alpha: false })).total)
      .toBeCloseTo(1, 9);
    const unrestricted = simulateIpcaPanel(4, { noise: 0, alphaShare: 0.2 });
    expect(ipcaR2(unrestricted, ipcaFit(managedPortfolios(unrestricted.Z, unrestricted.excess), { K: 2, alpha: true })).total)
      .toBeCloseTo(1, 9);
  });

  it('gives a total R² equal to -objective / Σ R^e² of the last ALS iteration, and pins both R² of the large panel', () => {
    const squares = large.excess.reduce((sum, r) => sum + dot(r, r), 0);
    const r2 = ipcaR2(large, largeFit);
    expect(r2.total).toBeCloseTo(-largeFit.history.objective.at(-1)! / squares, 12);
    expect(r2.total).toBeCloseTo(0.1263558044, 9);
    expect(r2.predictive).toBeCloseTo(0.0071427728, 9);
  });
});

describe('alphaTest', () => {
  const fitFor = (alphaShare: number) => {
    const panel = simulateIpcaPanel(1, { alphaShare });
    const managed = managedPortfolios(panel.Z, panel.excess);
    return { managed, fit: ipcaFit(managed, { K: 2, alpha: true }) };
  };

  it('gives the same output for the same seed, with W_α = Γ̂_α\'Γ̂_α', () => {
    const { managed, fit } = fitFor(0);
    const first = alphaTest(5, managed, fit, { bootstraps: 20 });
    expect(alphaTest(5, managed, fit, { bootstraps: 20 })).toEqual(first);
    expect(first.wAlpha).toBeCloseTo(dot(fit.gammaAlpha!, fit.gammaAlpha!), 15);
    expect(first.pValue).toBe(first.bootstrap.filter((w) => w > first.wAlpha).length / 20);
  });

  it('does not reject when the true Γ_α is zero: p = 0.685 with 200 bootstraps', () => {
    const { managed, fit } = fitFor(0);
    expect(alphaTest(1, managed, fit).pValue).toBeCloseTo(0.685, 12);
  }, 60000);

  it('rejects when alphas carry 2% of the sum of squared returns: no bootstrap W̃_α reaches W_α, so p = 0', () => {
    const { managed, fit } = fitFor(0.02);
    expect(alphaTest(1, managed, fit).pValue).toBe(0);
  }, 60000);
});
