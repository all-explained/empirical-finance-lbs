/**
 * Small dense linear algebra on plain number[][] (rows of columns).
 * Meant for the 2×2 to 20×20 matrices of VAR forecasts, principal components and
 * mean–variance weights. Every function returns new arrays and leaves its inputs alone.
 */
export type Matrix = number[][];

export interface SymmetricEigen {
  /** Eigenvalues in descending order. */
  values: number[];
  /** vectors[i] is the unit eigenvector of values[i]; its largest-magnitude entry is positive. */
  vectors: number[][];
}

function checkMatrix(A: readonly (readonly number[])[], name: string): void {
  if (A.length === 0 || A[0].length === 0) throw new RangeError(`${name}: matrix must be non-empty`);
  for (const row of A) {
    if (row.length !== A[0].length) throw new RangeError(`${name}: rows must have equal length`);
    if (!row.every(Number.isFinite)) throw new RangeError(`${name}: entries must be finite`);
  }
}

function checkSquare(A: readonly (readonly number[])[], name: string): void {
  checkMatrix(A, name);
  if (A.length !== A[0].length) throw new RangeError(`${name}: matrix must be square`);
}

function maxAbs(A: readonly (readonly number[])[]): number {
  return A.reduce((m, row) => row.reduce((r, value) => Math.max(r, Math.abs(value)), m), 0);
}

export function identity(n: number): Matrix {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('identity: n must be a positive integer');
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => Number(i === j)));
}

export function transpose(A: readonly (readonly number[])[]): Matrix {
  checkMatrix(A, 'transpose');
  return A[0].map((_, j) => A.map((row) => row[j]));
}

export function matMul(A: readonly (readonly number[])[], B: readonly (readonly number[])[]): Matrix {
  checkMatrix(A, 'matMul');
  checkMatrix(B, 'matMul');
  if (A[0].length !== B.length) throw new RangeError('matMul: columns of A must equal rows of B');
  return A.map((row) => B[0].map((_, j) => row.reduce((sum, a, k) => sum + a * B[k][j], 0)));
}

/** A^k for an integer k ≥ 0 by repeated squaring; A^0 = I. */
export function matPow(A: readonly (readonly number[])[], k: number): Matrix {
  checkSquare(A, 'matPow');
  if (!Number.isInteger(k) || k < 0) throw new RangeError('matPow: k must be a non-negative integer');
  let result = identity(A.length);
  let base = A.map((row) => [...row]);
  for (let e = k; e > 0; e = Math.floor(e / 2)) {
    if (e % 2 === 1) result = matMul(result, base);
    if (e > 1) base = matMul(base, base);
  }
  return result;
}

// Gaussian elimination with partial pivoting on [A | B]; returns X with A X = B.
function eliminate(A: readonly (readonly number[])[], B: readonly (readonly number[])[], name: string): Matrix {
  const n = A.length;
  const M = A.map((row, i) => [...row, ...B[i]]);
  const width = M[0].length;
  // A pivot below this, relative to the largest entry of A, means A is singular to working precision.
  const tol = n * Number.EPSILON * maxAbs(A);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    if (Math.abs(M[pivot][col]) <= tol) throw new Error(`${name}: matrix is singular`);
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / M[col][col];
      for (let c = col; c < width; c++) M[r][c] -= factor * M[col][c];
    }
  }
  const X = B.map((row) => row.map(() => 0));
  for (let i = n - 1; i >= 0; i--) {
    for (let c = 0; c < width - n; c++) {
      let sum = M[i][n + c];
      for (let j = i + 1; j < n; j++) sum -= M[i][j] * X[j][c];
      X[i][c] = sum / M[i][i];
    }
  }
  return X;
}

/** x with A x = b. Throws on a singular A. */
export function solve(A: readonly (readonly number[])[], b: readonly number[]): number[] {
  checkSquare(A, 'solve');
  if (b.length !== A.length || !b.every(Number.isFinite)) {
    throw new RangeError('solve: b must be finite with one entry per row of A');
  }
  return eliminate(A, b.map((value) => [value]), 'solve').map((row) => row[0]);
}

/** A⁻¹. Throws on a singular A. */
export function inverse(A: readonly (readonly number[])[]): Matrix {
  checkSquare(A, 'inverse');
  return eliminate(A, identity(A.length), 'inverse');
}

/**
 * Eigen-decomposition of a symmetric matrix by cyclic Jacobi rotations: A = Q Λ Q',
 * where column i of Q is vectors[i]. Each rotation zeroes one off-diagonal pair.
 */
export function symmetricEigen(A: readonly (readonly number[])[]): SymmetricEigen {
  checkSquare(A, 'symmetricEigen');
  const n = A.length;
  const scale = maxAbs(A);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(A[i][j] - A[j][i]) > 1e-10 * scale) throw new RangeError('symmetricEigen: matrix must be symmetric');
    }
  }
  const a = A.map((row, i) => row.map((_, j) => 0.5 * (A[i][j] + A[j][i])));
  const V = identity(n);
  const frobenius = Math.hypot(...a.flat());
  for (let sweep = 0; ; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off = Math.hypot(off, a[p][q]);
    if (off <= Number.EPSILON * frobenius) break;
    if (sweep === 100) throw new Error('symmetricEigen: Jacobi sweeps did not converge');
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (a[p][q] === 0) continue;
        // Rotation angle that zeroes a[p][q] (Numerical Recipes, section 11.1).
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.hypot(theta, 1));
        const c = 1 / Math.hypot(t, 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const [akp, akq] = [a[k][p], a[k][q]];
          a[k][p] = c * akp - s * akq;
          a[k][q] = s * akp + c * akq;
          const [vkp, vkq] = [V[k][p], V[k][q]];
          V[k][p] = c * vkp - s * vkq;
          V[k][q] = s * vkp + c * vkq;
        }
        for (let k = 0; k < n; k++) {
          const [apk, aqk] = [a[p][k], a[q][k]];
          a[p][k] = c * apk - s * aqk;
          a[q][k] = s * apk + c * aqk;
        }
      }
    }
  }
  const order = a.map((_, i) => i).sort((i, j) => a[j][j] - a[i][i]);
  const vectors = order.map((i) => {
    const v = V.map((row) => row[i]);
    const largest = v.reduce((best, value) => (Math.abs(value) > Math.abs(best) ? value : best), 0);
    return largest < 0 ? v.map((value) => -value) : v;
  });
  return { values: order.map((i) => a[i][i]), vectors };
}
