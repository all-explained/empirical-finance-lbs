/**
 * Gauss–Hermite quadrature: integrals against the weight e^{−x²}, and expectations of functions of a standard
 * normal variable. An n-point rule integrates every polynomial of degree up to 2n − 1 exactly.
 */
import { symmetricEigen } from './linalg';

export interface QuadratureRule {
  /** Nodes x_i in ascending order. */
  nodes: number[];
  /** Weights w_i, so ∫ e^{−x²} f(x) dx ≈ Σ_i w_i f(x_i); they sum to √π. */
  weights: number[];
}

const rules = new Map<number, QuadratureRule>();

/** The rule of size n, computed once and shared. Callers must not change it. */
function rule(n: number): QuadratureRule {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError('Number of nodes must be a positive integer');
  const cached = rules.get(n);
  if (cached) return cached;
  // Golub–Welsch: the nodes are the eigenvalues of the symmetric tridiagonal Jacobi matrix of the Hermite
  // recurrence, with off-diagonal entries √(k/2), k = 1, …, n − 1, and w_i = √π v_{i,0}², where v_{i,0} is the
  // first entry of the unit eigenvector of x_i. The Jacobi eigen-solver keeps this to n of a few dozen.
  const jacobi = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (
    Math.abs(i - j) === 1 ? Math.sqrt(Math.max(i, j) / 2) : 0)));
  const { values, vectors } = symmetricEigen(jacobi);
  const order = values.map((_, i) => values.length - 1 - i);
  // The rule is symmetric about zero, so the nodes are mirrored exactly.
  const nodes = order.map((i) => values[i]).map((x, i, xs) => (x - xs[n - 1 - i]) / 2);
  const weights = order.map((i) => Math.sqrt(Math.PI) * vectors[i][0] ** 2).map((w, i, ws) => (w + ws[n - 1 - i]) / 2);
  const result = { nodes, weights };
  rules.set(n, result);
  return result;
}

/** Nodes and weights of n-point Gauss–Hermite quadrature, ∫ e^{−x²} f(x) dx ≈ Σ_i w_i f(x_i). */
export function gaussHermite(n: number): QuadratureRule {
  const { nodes, weights } = rule(n);
  return { nodes: [...nodes], weights: [...weights] };
}

/**
 * E[f(Z)] for Z ~ N(0, 1) by n-point Gauss–Hermite quadrature. The substitution z = √2 x turns the normal
 * density into the weight e^{−x²}: E[f(Z)] = π^{−1/2} ∫ e^{−x²} f(√2 x) dx ≈ π^{−1/2} Σ_i w_i f(√2 x_i).
 */
export function normalExpectation(f: (z: number) => number, n: number): number {
  const { nodes, weights } = rule(n);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += weights[i] * f(Math.SQRT2 * nodes[i]);
  return sum / Math.sqrt(Math.PI);
}
