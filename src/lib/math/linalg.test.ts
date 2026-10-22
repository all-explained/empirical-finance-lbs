import { describe, expect, it } from 'vitest';
import { identity, inverse, matMul, matPow, solve, symmetricEigen, transpose } from './linalg';
import { normalRng } from './rng';

function expectMatrixClose(actual: number[][], expected: number[][], digits: number) {
  expect(actual.length).toBe(expected.length);
  actual.forEach((row, i) => {
    expect(row.length).toBe(expected[i].length);
    row.forEach((value, j) => expect(value).toBeCloseTo(expected[i][j], digits));
  });
}

function randomMatrix(seed: number, rows: number, cols: number): number[][] {
  const draw = normalRng(seed);
  return Array.from({ length: rows }, () => Array.from({ length: cols }, draw));
}

describe('matrix basics', () => {
  it('builds the identity', () => {
    expect(identity(1)).toEqual([[1]]);
    expect(identity(3)).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    expect(() => identity(0)).toThrow(RangeError);
    expect(() => identity(2.5)).toThrow(RangeError);
  });

  it('transposes a rectangular matrix', () => {
    expect(transpose([[1, 2, 3], [4, 5, 6]])).toEqual([[1, 4], [2, 5], [3, 6]]);
    expect(transpose([[7]])).toEqual([[7]]);
    expect(() => transpose([[1, 2], [3]])).toThrow(RangeError);
    expect(() => transpose([])).toThrow(RangeError);
  });

  it('multiplies matrices by hand-computed reference values', () => {
    // [1 2; 3 4][5 6; 7 8] = [1·5+2·7, 1·6+2·8; 3·5+4·7, 3·6+4·8] = [19 22; 43 50].
    expect(matMul([[1, 2], [3, 4]], [[5, 6], [7, 8]])).toEqual([[19, 22], [43, 50]]);
    // (2×3)(3×1): [1·1+2·0+3·(-1); 4·1+5·0+6·(-1)] = [-2; -2].
    expect(matMul([[1, 2, 3], [4, 5, 6]], [[1], [0], [-1]])).toEqual([[-2], [-2]]);
    expect(() => matMul([[1, 2]], [[1, 2]])).toThrow(RangeError);
    expect(() => matMul([[NaN]], [[1]])).toThrow(RangeError);
  });

  it('leaves its inputs unchanged', () => {
    const A = Object.freeze([Object.freeze([2, 1]), Object.freeze([1, 3])]);
    expect(() => {
      matMul(A, A);
      matPow(A, 5);
      solve(A, Object.freeze([1, 2]));
      inverse(A);
      symmetricEigen(A);
    }).not.toThrow();
  });
});

describe('matPow', () => {
  it('reproduces Fibonacci numbers', () => {
    // [1 1; 1 0]^k = [F(k+1) F(k); F(k) F(k-1)], and F(9), F(10), F(11) = 34, 55, 89.
    expect(matPow([[1, 1], [1, 0]], 10)).toEqual([[89, 55], [55, 34]]);
    expect(matPow([[1, 1], [1, 0]], 1)).toEqual([[1, 1], [1, 0]]);
    expect(matPow([[1, 1], [1, 0]], 0)).toEqual(identity(2));
  });

  it('matches repeated matMul for k = 0 to 12', () => {
    const A = randomMatrix(19, 3, 3).map((row) => row.map((value) => 0.4 * value));
    let repeated = identity(3);
    for (let k = 0; k <= 12; k++) {
      expectMatrixClose(matPow(A, k), repeated, 12);
      repeated = matMul(repeated, A);
    }
  });

  it('rejects a non-square matrix or a bad exponent', () => {
    expect(() => matPow([[1, 2]], 2)).toThrow(RangeError);
    expect(() => matPow([[1]], -1)).toThrow(RangeError);
    expect(() => matPow([[1]], 1.5)).toThrow(RangeError);
  });
});

describe('solve and inverse', () => {
  it('solves systems with hand-computed solutions', () => {
    // Cramer: det = 2·3 - 1·1 = 5, x = (3·3 - 1·5)/5 = 0.8, y = (2·5 - 1·3)/5 = 1.4.
    const x = solve([[2, 1], [1, 3]], [3, 5]);
    expect(x[0]).toBeCloseTo(0.8, 14);
    expect(x[1]).toBeCloseTo(1.4, 14);
    // Standard textbook system: 2x + y - z = 8, -3x - y + 2z = -11, -2x + y + 2z = -3 → (2, 3, -1).
    const y = solve([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3]);
    [2, 3, -1].forEach((value, i) => expect(y[i]).toBeCloseTo(value, 13));
  });

  it('pivots past a zero on the diagonal', () => {
    // Without a row swap the first pivot would be 0: [0 1; 1 0] x = [2; 3] → x = [3; 2].
    expect(solve([[0, 1], [1, 0]], [2, 3])).toEqual([3, 2]);
  });

  it('inverts matrices with known inverses', () => {
    // [4 7; 2 6]⁻¹ = (1/10)[6 -7; -2 4], since det = 24 - 14 = 10.
    expectMatrixClose(inverse([[4, 7], [2, 6]]), [[0.6, -0.7], [-0.2, 0.4]], 14);
    // The 3×3 Hilbert matrix H_ij = 1/(i+j-1) has the integer inverse below.
    const hilbert = [[1, 1 / 2, 1 / 3], [1 / 2, 1 / 3, 1 / 4], [1 / 3, 1 / 4, 1 / 5]];
    expectMatrixClose(inverse(hilbert), [[9, -36, 30], [-36, 192, -180], [30, -180, 180]], 10);
  });

  it('gives A · inverse(A) = I and agrees with solve for a random 5×5 matrix', () => {
    const A = randomMatrix(7, 5, 5);
    const Ainv = inverse(A);
    expectMatrixClose(matMul(A, Ainv), identity(5), 12);
    expectMatrixClose(matMul(Ainv, A), identity(5), 12);
    const b = [1, -2, 0.5, 3, 0];
    const x = solve(A, b);
    expectMatrixClose([x], transpose(matMul(Ainv, b.map((value) => [value]))), 12);
  });

  it('throws on a singular matrix and on bad shapes', () => {
    // The second row is twice the first.
    expect(() => solve([[1, 2], [2, 4]], [1, 2])).toThrow(/singular/);
    expect(() => inverse([[1, 2], [2, 4]])).toThrow(/singular/);
    expect(() => inverse([[0, 0], [0, 0]])).toThrow(/singular/);
    // Rank 2: row 3 = row 1 + row 2, in floating point.
    expect(() => inverse([[0.1, 0.2, 0.3], [0.4, 0.5, 0.6], [0.5, 0.7, 0.9]])).toThrow(/singular/);
    expect(() => solve([[1, 0], [0, 1]], [1])).toThrow(RangeError);
    expect(() => inverse([[1, 2, 3], [4, 5, 6]])).toThrow(RangeError);
  });
});

describe('symmetricEigen', () => {
  it('matches the closed form for a 2×2 matrix', () => {
    // [4 1; 1 3]: λ = (7 ± √5)/2. From (4 - λ)v₁ + v₂ = 0, v ∝ [1, λ - 4].
    const { values, vectors } = symmetricEigen([[4, 1], [1, 3]]);
    const root5 = Math.sqrt(5);
    expect(values[0]).toBeCloseTo((7 + root5) / 2, 14);
    expect(values[1]).toBeCloseTo((7 - root5) / 2, 14);
    const unit = (v: number[]) => v.map((value) => value / Math.hypot(...v));
    // Signs follow the rule: the largest-magnitude entry is positive.
    expectMatrixClose(vectors, [unit([1, (root5 - 1) / 2]), unit([(root5 - 1) / 2, -1]).map((value) => -value)], 14);
  });

  it('matches the closed form for the tridiagonal [2 -1 0; -1 2 -1; 0 -1 2]', () => {
    // Eigenvalues 2 + √2, 2, 2 - √2 with vectors [1, -√2, 1]/2, [1, 0, -1]/√2, [1, √2, 1]/2.
    const { values, vectors } = symmetricEigen([[2, -1, 0], [-1, 2, -1], [0, -1, 2]]);
    const r2 = Math.SQRT2;
    [2 + r2, 2, 2 - r2].forEach((value, i) => expect(values[i]).toBeCloseTo(value, 14));
    expectMatrixClose([vectors[0]], [[-0.5, r2 / 2, -0.5]], 14);
    expectMatrixClose([vectors[2]], [[0.5, r2 / 2, 0.5]], 14);
    // [1, 0, -1]/√2 has a tie for the largest entry, so check it only up to sign.
    expect(Math.abs(vectors[1][0] * Math.SQRT1_2 - vectors[1][2] * Math.SQRT1_2)).toBeCloseTo(1, 14);
  });

  it('sorts a diagonal matrix and handles repeated eigenvalues', () => {
    expect(symmetricEigen([[1, 0, 0], [0, 3, 0], [0, 0, 2]])).toEqual({
      values: [3, 2, 1],
      vectors: [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
    });
    expect(symmetricEigen(identity(3))).toEqual({ values: [1, 1, 1], vectors: identity(3) });
    expect(symmetricEigen([[0, 0], [0, 0]]).values).toEqual([0, 0]);
  });

  it('reconstructs a random 6×6 covariance matrix as Q Λ Q′ with orthonormal Q', () => {
    const B = randomMatrix(42, 6, 6);
    const A = matMul(B, transpose(B));
    const { values, vectors } = symmetricEigen(A);
    const Q = transpose(vectors);
    const Lambda = values.map((value, i) => values.map((_, j) => (i === j ? value : 0)));
    expectMatrixClose(matMul(matMul(Q, Lambda), vectors), A, 11);
    expectMatrixClose(matMul(vectors, Q), identity(6), 13);
    // B B′ is positive definite; eigenvalues sum to the trace and come in descending order.
    values.forEach((value, i) => {
      expect(value).toBeGreaterThan(0);
      if (i > 0) expect(value).toBeLessThanOrEqual(values[i - 1]);
    });
    expect(values.reduce((sum, value) => sum + value, 0)).toBeCloseTo(A.reduce((sum, row, i) => sum + row[i], 0), 11);
    vectors.forEach((v) => {
      const largest = v.reduce((best, value) => (Math.abs(value) > Math.abs(best) ? value : best), 0);
      expect(largest).toBeGreaterThan(0);
    });
  });

  it('rejects a non-symmetric or non-square matrix', () => {
    expect(() => symmetricEigen([[1, 2], [3, 4]])).toThrow(RangeError);
    expect(() => symmetricEigen([[1, 2, 3]])).toThrow(RangeError);
  });
});
