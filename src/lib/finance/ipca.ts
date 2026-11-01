// Instrumented principal components (IPCA) of Kelly, Pruitt & Su, "Characteristics Are Covariances",
// NBER Working Paper 24540 (April 2018; Journal of Financial Economics, 2019). Page and equation
// numbers are those of the working paper.
//
// Model (eq. 3, p. 9; pp. 10–12): R^e_{i,t+1} = α_{it} + β_{it}'f_{t+1} + ε_{i,t+1}, with α_{it} = z_{it}'Γ_α
// and β_{it} = Γ_β'z_{it}. z_{it} holds dim z characteristics of firm i known at t, a constant first;
// Γ_β is dim z × K and Γ_α a dim z-vector. Γ_α = 0 is the restricted model (eq. 4), in which
// characteristics move expected returns only through betas.
//
// Arrays: Z[t] is Z_t, the N × dim z matrix whose row i is z_{it}'. excess[t] is R^e_{t+1}, the N
// excess returns from t to t+1, so Z[t] and excess[t] share the index t. Returns are decimals.
import { inverse, matMul, solve, symmetricEigen, transpose, type Matrix } from '../math/linalg';
import { mulberry32, normalRng } from '../math/rng';
import { sampleCovariance, sampleMeans } from './portfolio';

export interface IpcaPanel {
  /** T matrices Z_t, each N × dim z; column 0 is the constant 1. */
  Z: Matrix[];
  /** T × N: row t is R^e_{t+1}. */
  excess: number[][];
}

export interface SimulatedIpcaPanel extends IpcaPanel {
  /** True Γ_β, dim z × K, with Γ_β'Γ_β = I. */
  gammaBeta: Matrix;
  /** True Γ_α, orthogonal to the columns of Γ_β; all zeros when alphaShare is 0. */
  gammaAlpha: number[];
  /** T × K: row t is the true f_{t+1}. */
  factors: number[][];
}

export interface ManagedPortfolios {
  /** T × dim z: row t is R^Z_{t+1} = Z_t'R^e_{t+1}. */
  returns: number[][];
  /** T matrices Z_t'Z_t, each dim z × dim z. */
  ZtZ: Matrix[];
}

export interface IpcaFit {
  /** Γ̂_β, dim z × K, normalised (p. 13): Γ̂_β'Γ̂_β = I, factor covariance diagonal and descending, factor means ≥ 0. */
  gammaBeta: Matrix;
  /** Γ̂_α, orthogonal to the columns of Γ̂_β; only with alpha: true. */
  gammaAlpha?: number[];
  /** T × K: row t is f̂_{t+1}. */
  factors: number[][];
  /** λ̂, the risk prices: the time-series means of the factors. */
  lambda: number[];
  /**
   * One entry per ALS iteration. objective[j] is the least-squares objective (5) after iteration j less
   * its constant Σ_t R^e_{t+1}'R^e_{t+1}, so the total R² of iteration j is -objective[j] / Σ_t R^e'R^e.
   * maxChange[j] is the largest absolute change in any element of Γ_α, Γ_β or the factors.
   */
  history: { objective: number[]; maxChange: number[] };
  /** False when maxIterations ran out before maxChange fell below the tolerance. */
  converged: boolean;
}

export interface AlphaTest {
  /** W_α = Γ̂_α'Γ̂_α. */
  wAlpha: number;
  /** Share of the bootstrap statistics that exceed W_α. */
  pValue: number;
  /** W̃_α of each bootstrap sample, simulated under Γ_α = 0. */
  bootstrap: number[];
}

const dot = (a: readonly number[], b: readonly number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const matVec = (A: readonly (readonly number[])[], v: readonly number[]) => A.map((row) => dot(row, v));

function maxAbsDiff(A: readonly (readonly number[])[], B: readonly (readonly number[])[]): number {
  return A.reduce((m, row, i) => row.reduce((r, v, j) => Math.max(r, Math.abs(v - B[i][j])), m), 0);
}

// A^p = Σ_k s_k^p v_k v_k' for a symmetric positive definite A with eigenpairs (s_k, v_k).
function symmetricPower(A: readonly (readonly number[])[], p: number): Matrix {
  const { values, vectors } = symmetricEigen(A);
  return A.map((_, i) => A.map((__, j) => values.reduce((sum, s, k) => sum + s ** p * vectors[k][i] * vectors[k][j], 0)));
}

// Columns of M rotated to an orthonormal basis of the same column space: M (M'M)^{-1/2}.
function orthonormalise(M: Matrix): Matrix {
  return matMul(M, symmetricPower(matMul(transpose(M), M), -0.5));
}

// Ranks each characteristic across firms, divided by N, less 0.5: values in [-0.5, 0.5] (pp. 23–24).
function rankTransform(raw: readonly number[]): number[] {
  const N = raw.length;
  const ranked = new Array<number>(N);
  raw.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).forEach(([, i], rank) => (ranked[i] = (rank + 1) / N - 0.5));
  return ranked;
}

/**
 * A seeded IPCA world, in the spirit of the simulation of Appendix B (pp. 52–53). Defaults:
 * N = 200 firms, T = 120 months, dimZ = 4 characteristics (the constant and three others), K = 2 factors,
 * alphaShare = 0, noise = 0.1.
 * - Each raw characteristic is a stationary AR(1) per firm with persistence 0.95, rank-transformed
 *   across firms each month to [-0.5, 0.5] as the paper does (pp. 23–24).
 * - Γ_β is a random orthonormal dim z × K matrix. Factor k has standard deviation 0.05/(k + 1) a month,
 *   mean 0.2 times that (a monthly Sharpe ratio of 0.2) and is independent of the others, so the
 *   true values satisfy the paper's normalisation in population.
 * - Γ_α is a random direction orthogonal to the columns of Γ_β, as in Appendix B, scaled so that the
 *   alpha term z_{it}'Γ_α makes up alphaShare (in [0, 1)) of the panel's sum of squared returns: its
 *   sum of squares over that of everything else in R^e_{i,t+1}, cross term ignored.
 * - R^e_{i,t+1} = z_{it}'Γ_α + z_{it}'Γ_β f_{t+1} + noise · ε_{i,t+1}, with ε standard normal.
 */
export function simulateIpcaPanel(
  seed: number,
  { N = 200, T = 120, dimZ = 4, K = 2, alphaShare = 0, noise = 0.1 }: {
    N?: number; T?: number; dimZ?: number; K?: number; alphaShare?: number; noise?: number;
  } = {},
): SimulatedIpcaPanel {
  if (![N, T, dimZ, K].every((n) => Number.isInteger(n) && n >= 1) || N < dimZ || T < 2 || dimZ < 2 || K > dimZ) {
    throw new RangeError('simulateIpcaPanel: need integers N ≥ dimZ ≥ 2, T ≥ 2 and 1 ≤ K ≤ dimZ');
  }
  if (!(alphaShare >= 0 && alphaShare < 1 && noise >= 0)) {
    throw new RangeError('simulateIpcaPanel: alphaShare must be in [0, 1) and noise non-negative');
  }
  const normal = normalRng(seed);
  const persistence = 0.95;
  const shock = Math.sqrt(1 - persistence ** 2);
  let raw = Array.from({ length: N }, () => Array.from({ length: dimZ - 1 }, () => normal()));
  const Z: Matrix[] = [];
  for (let t = 0; t < T; t++) {
    if (t > 0) raw = raw.map((row) => row.map((c) => persistence * c + shock * normal()));
    Z.push(transpose(transpose(raw).map(rankTransform)).map((row) => [1, ...row]));
  }
  const gammaBeta = orthonormalise(Array.from({ length: dimZ }, () => Array.from({ length: K }, () => normal())));
  const sd = Array.from({ length: K }, (_, k) => 0.05 / (k + 1));
  const factors = Array.from({ length: T }, () => sd.map((s) => s * (0.2 + normal())));
  const rest = Z.map((Zt, t) => matVec(Zt, matVec(gammaBeta, factors[t])).map((b) => b + noise * normal()));
  // Direction orthogonal to Γ_β: (I - Γ_βΓ_β')y for a normal y (Γ_β'Γ_β = I), then unit length.
  const y = Array.from({ length: dimZ }, () => normal());
  const loadings = matVec(transpose(gammaBeta), y);
  const direction = y.map((v, l) => v - dot(gammaBeta[l], loadings));
  const length = Math.hypot(...direction);
  let gammaAlpha = direction.map(() => 0);
  if (alphaShare > 0) {
    if (!(length > 1e-12)) throw new RangeError('simulateIpcaPanel: alphaShare > 0 needs K < dimZ');
    const unit = direction.map((v) => v / length);
    const alphaSquares = Z.reduce((sum, Zt) => sum + matVec(Zt, unit).reduce((s, a) => s + a * a, 0), 0);
    const restSquares = rest.reduce((sum, row) => sum + dot(row, row), 0);
    const scale = Math.sqrt((alphaShare * restSquares) / ((1 - alphaShare) * alphaSquares));
    gammaAlpha = unit.map((v) => scale * v);
  }
  const excess = Z.map((Zt, t) => matVec(Zt, gammaAlpha).map((a, i) => a + rest[t][i]));
  return { Z, excess, gammaBeta, gammaAlpha, factors };
}

/**
 * Characteristic-managed portfolios (eq. 9, p. 14): R^Z_{t+1} = Z_t'R^e_{t+1}, whose l-th entry weights
 * each firm's return by its l-th characteristic, and the cross-products Z_t'Z_t. Like eq. 9, it does
 * not divide by the number of firms. With the same N every month, dividing would change neither Γ̂ nor f̂.
 */
export function managedPortfolios(Z: readonly (readonly (readonly number[])[])[], excess: readonly (readonly number[])[]): ManagedPortfolios {
  if (Z.length === 0 || Z.length !== excess.length || Z.some((Zt, t) => Zt.length !== excess[t].length)) {
    throw new RangeError('managedPortfolios: need one Z_t and one return per firm for every month');
  }
  return {
    returns: Z.map((Zt, t) => matVec(transpose(Zt), excess[t])),
    ZtZ: Z.map((Zt) => matMul(transpose(Zt), Zt)),
  };
}

/**
 * IPCA by alternating least squares (Appendix A, p. 52) on the managed portfolios alone.
 *
 * Objective (5), p. 12: min Σ_t (R^e_{t+1} - Z_tΓ̃f̃_{t+1})'(R^e_{t+1} - Z_tΓ̃f̃_{t+1}), with Γ̃ = Γ_β and
 * f̃ = f in the restricted model, and Γ̃ = [Γ_α, Γ_β], f̃ = [1, f']' with alpha: true (p. 16).
 * Its first-order conditions are eq. 6 (eq. 11 with alpha), a cross-sectional regression each month,
 *   f_{t+1} = (Γ_β'Z_t'Z_tΓ_β)⁻¹ Γ_β'(R^Z_{t+1} - Z_t'Z_tΓ_α),
 * and eq. 7, a pooled regression of returns on characteristics interacted with factors,
 *   vec(Γ̃') = (Σ_t [Z_t ⊗ f̃'_{t+1}]'[Z_t ⊗ f̃'_{t+1}])⁻¹ Σ_t [Z_t ⊗ f̃'_{t+1}]'R^e_{t+1}.
 * Eq. 7 needs only R^Z and Z'Z. By the mixed-product rule (A ⊗ B)(C ⊗ D) = AC ⊗ BD,
 *   [Z_t ⊗ f̃']'[Z_t ⊗ f̃'] = (Z_t' ⊗ f̃)(Z_t ⊗ f̃') = Z_t'Z_t ⊗ f̃f̃',
 *   [Z_t ⊗ f̃']'R^e_{t+1} = (Z_t' ⊗ f̃)(R^e_{t+1} ⊗ 1) = Z_t'R^e_{t+1} ⊗ f̃ = R^Z_{t+1} ⊗ f̃.
 * The objective is also Σ_t R^e'R^e + Σ_t [g_t'Z_t'Z_t g_t - 2 R^Z_{t+1}'g_t] with g_t = Γ̃f̃_{t+1}.
 *
 * Start (p. 14, Appendix A): Γ_β is the first K eigenvectors of Σ_t R^Z_{t+1}R^Z_{t+1}', and Γ_α = 0.
 * Each iteration solves eq. 7 given the factors, then eq. 6 or 11 given Γ̃, so the objective never
 * rises. It stops when no element of Γ̃ or the factors moves by tolerance or more (10⁻⁶ in Appendix A).
 * After convergence it imposes the normalisation of p. 13: Γ_β'Γ_β = I_K, a diagonal factor
 * covariance with descending entries, and non-negative factor means.
 *
 * With alpha: true the fit is unchanged by Γ_α → Γ_α + Γ_βc, f → f - c, so each iteration projects
 * Γ_α off the columns of Γ_β. The paper does not state this condition; its simulation (Appendix B,
 * p. 53) draws Γ_α orthogonal to Γ_β. W_α then measures only alphas that no beta can absorb.
 */
export function ipcaFit(
  managed: ManagedPortfolios,
  { K, alpha, tolerance = 1e-6, maxIterations = 1000 }: { K: number; alpha: boolean; tolerance?: number; maxIterations?: number },
): IpcaFit {
  const { returns, ZtZ } = managed;
  const T = returns.length;
  const dimZ = returns[0]?.length ?? 0;
  if (T < 2 || ZtZ.length !== T || !Number.isInteger(K) || K < 1 || K > dimZ) {
    throw new RangeError('ipcaFit: need T ≥ 2 months of managed portfolios and an integer K from 1 to dim z');
  }
  if (!(tolerance > 0) || !(maxIterations >= 1)) throw new RangeError('ipcaFit: tolerance and maxIterations must be positive');

  const factorStep = (gammaBeta: Matrix, gammaAlpha: number[] | undefined) => returns.map((rz, t) => {
    const target = gammaAlpha ? rz.map((v, l) => v - dot(ZtZ[t][l], gammaAlpha)) : rz;
    return solve(matMul(matMul(transpose(gammaBeta), ZtZ[t]), gammaBeta), matVec(transpose(gammaBeta), target));
  });

  const m = K + (alpha ? 1 : 0);
  const gammaStep = (factors: number[][]) => {
    const size = dimZ * m;
    const A = Array.from({ length: size }, () => new Array<number>(size).fill(0));
    const b = new Array<number>(size).fill(0);
    factors.forEach((f, t) => {
      const ft = alpha ? [1, ...f] : f;
      for (let l = 0; l < dimZ; l++) {
        for (let a = 0; a < m; a++) {
          b[l * m + a] += returns[t][l] * ft[a];
          for (let k = 0; k < dimZ; k++) for (let c = 0; c < m; c++) A[l * m + a][k * m + c] += ZtZ[t][l][k] * ft[a] * ft[c];
        }
      }
    });
    const v = solve(A, b);
    const gamma = Array.from({ length: dimZ }, (_, l) => v.slice(l * m, (l + 1) * m));
    const gammaBeta = gamma.map((row) => row.slice(m - K));
    if (!alpha) return { gammaBeta, gammaAlpha: undefined };
    // Γ_α ← (I - Γ_β(Γ_β'Γ_β)⁻¹Γ_β')Γ_α.
    const coefficients = matVec(inverse(matMul(transpose(gammaBeta), gammaBeta)), matVec(transpose(gammaBeta), gamma.map((row) => row[0])));
    return { gammaBeta, gammaAlpha: gamma.map((row, l) => row[0] - dot(gammaBeta[l], coefficients)) };
  };

  const objective = (gammaBeta: Matrix, gammaAlpha: number[] | undefined, factors: number[][]) => factors.reduce((sum, f, t) => {
    const g = matVec(gammaBeta, f).map((v, l) => v + (gammaAlpha ? gammaAlpha[l] : 0));
    return sum + dot(g, matVec(ZtZ[t], g)) - 2 * dot(returns[t], g);
  }, 0);

  const second = returns[0].map((_, i) => returns[0].map((__, j) => returns.reduce((sum, rz) => sum + rz[i] * rz[j], 0)));
  let gammaBeta = transpose(symmetricEigen(second).vectors.slice(0, K));
  let gammaAlpha = alpha ? new Array<number>(dimZ).fill(0) : undefined;
  let factors = factorStep(gammaBeta, gammaAlpha);
  const history = { objective: [] as number[], maxChange: [] as number[] };
  let converged = false;
  while (!converged && history.objective.length < maxIterations) {
    const next = gammaStep(factors);
    const nextFactors = factorStep(next.gammaBeta, next.gammaAlpha);
    const change = Math.max(
      maxAbsDiff(next.gammaBeta, gammaBeta),
      maxAbsDiff(nextFactors, factors),
      gammaAlpha && next.gammaAlpha ? maxAbsDiff([next.gammaAlpha], [gammaAlpha]) : 0,
    );
    ({ gammaBeta, gammaAlpha } = next);
    factors = nextFactors;
    history.objective.push(objective(gammaBeta, gammaAlpha, factors));
    history.maxChange.push(change);
    converged = change < tolerance;
  }

  // Normalisation (p. 13). Each step maps Γ_β → Γ_βG and f → G⁻¹f, so Γ_βf, Γ_α and the fit stay the same.
  // 1. Γ_β'Γ_β = I with G = (Γ_β'Γ_β)^{-1/2}.
  const root = symmetricPower(matMul(transpose(gammaBeta), gammaBeta), 0.5);
  gammaBeta = matMul(gammaBeta, inverse(root));
  factors = factors.map((f) => matVec(root, f));
  // 2. Diagonal factor covariance, descending: G = V, the eigenvectors of the factors' covariance.
  const { vectors } = symmetricEigen(sampleCovariance(factors));
  gammaBeta = matMul(gammaBeta, transpose(vectors));
  factors = factors.map((f) => vectors.map((v) => dot(v, f)));
  // 3. Non-negative factor means: flip the sign of factor k and of column k of Γ_β where needed.
  const signs = sampleMeans(factors).map((mean) => (mean < 0 ? -1 : 1));
  gammaBeta = gammaBeta.map((row) => row.map((v, k) => signs[k] * v));
  factors = factors.map((f) => f.map((v, k) => signs[k] * v));

  return {
    gammaBeta,
    ...(gammaAlpha && { gammaAlpha }),
    factors,
    lambda: sampleMeans(factors),
    history,
    converged,
  };
}

/**
 * The two R² of eqs. 14–15 (p. 24), over all firms and months of the firm-level panel:
 *   total R² = 1 - Σ_{i,t} (R^e_{i,t+1} - z_{it}'(Γ̂_α + Γ̂_β f̂_{t+1}))² / Σ_{i,t} (R^e_{i,t+1})²,
 *   predictive R² = 1 - Σ_{i,t} (R^e_{i,t+1} - z_{it}'(Γ̂_α + Γ̂_β λ̂))² / Σ_{i,t} (R^e_{i,t+1})²,
 * with Γ̂_α = 0 for a restricted fit. Both use raw, not demeaned, sums of squares.
 */
export function ipcaR2(panel: IpcaPanel, fit: IpcaFit): { total: number; predictive: number } {
  const { Z, excess } = panel;
  if (Z.length !== fit.factors.length || excess.length !== Z.length) throw new RangeError('ipcaR2: panel and fit must have the same months');
  const alphaPart = (l: number) => fit.gammaAlpha?.[l] ?? 0;
  const predicted = matVec(fit.gammaBeta, fit.lambda).map((v, l) => v + alphaPart(l));
  let [total, predictive, squares] = [0, 0, 0];
  excess.forEach((r, t) => {
    const g = matVec(fit.gammaBeta, fit.factors[t]).map((v, l) => v + alphaPart(l));
    r.forEach((ri, i) => {
      total += (ri - dot(Z[t][i], g)) ** 2;
      predictive += (ri - dot(Z[t][i], predicted)) ** 2;
      squares += ri * ri;
    });
  });
  return { total: 1 - total / squares, predictive: 1 - predictive / squares };
}

/**
 * Test of Γ_α = 0 (section 3.1, pp. 17–19) from an unrestricted fit. W_α = Γ̂_α'Γ̂_α. Residual (wild)
 * bootstrap of the managed portfolios, eq. 12: with d̂_{t+1} = R^Z_{t+1} - Z_t'Z_t(Γ̂_α + Γ̂_β f̂_{t+1}),
 * each sample is R̃^Z_{t+1} = Z_t'Z_tΓ̂_β f̂_{t+1} + q d̂_{s+1}, so Γ_α = 0 holds by construction. For each
 * month, s is a month drawn uniformly (mulberry32(seed)) and q a Student t with 5 degrees of freedom
 * scaled to unit variance (normalRng(seed + 1)). Each sample is refitted with K factors and alpha
 * at the default tolerance, and the p-value is the share of its W̃_α that exceed W_α.
 * The paper uses 1,000 samples; the default here is 200, so a unit test runs in seconds.
 */
export function alphaTest(
  seed: number, managed: ManagedPortfolios, fit: IpcaFit, { bootstraps = 200 }: { bootstraps?: number } = {},
): AlphaTest {
  const { gammaAlpha, gammaBeta, factors } = fit;
  if (!gammaAlpha) throw new RangeError('alphaTest: needs a fit with alpha: true');
  if (!Number.isInteger(bootstraps) || bootstraps < 1) throw new RangeError('alphaTest: bootstraps must be a positive integer');
  const { returns, ZtZ } = managed;
  const T = returns.length;
  const nullPart = factors.map((f, t) => matVec(ZtZ[t], matVec(gammaBeta, f)));
  const residuals = returns.map((rz, t) => rz.map((v, l) => v - nullPart[t][l] - dot(ZtZ[t][l], gammaAlpha)));
  const uniform = mulberry32(seed);
  const normal = normalRng(seed + 1);
  // t_5 = u / √(χ²_5/5) has variance 5/3, so q = t_5 √(3/5) = u √(3/χ²_5).
  const studentT = () => {
    const u = normal();
    let chiSquare = 0;
    for (let j = 0; j < 5; j++) chiSquare += normal() ** 2;
    return u * Math.sqrt(3 / chiSquare);
  };
  const K = gammaBeta[0].length;
  const bootstrap = Array.from({ length: bootstraps }, () => {
    const sample = nullPart.map((n) => {
      const d = residuals[Math.floor(uniform() * T)];
      const q = studentT();
      return n.map((v, l) => v + q * d[l]);
    });
    const refit = ipcaFit({ returns: sample, ZtZ }, { K, alpha: true });
    return dot(refit.gammaAlpha!, refit.gammaAlpha!);
  });
  const wAlpha = dot(gammaAlpha, gammaAlpha);
  return { wAlpha, pValue: bootstrap.filter((w) => w > wAlpha).length / bootstraps, bootstrap };
}
