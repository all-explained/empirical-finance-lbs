import { describe, expect, it } from 'vitest';
import { gaussHermite, normalExpectation } from './quadrature';

/** ∫ e^{−x²} x^k dx: zero for odd k, Γ((k + 1)/2) = √π (k − 1)!!/2^{k/2} for even k. */
function hermiteMoment(k: number): number {
  if (k % 2 === 1) return 0;
  let value = Math.sqrt(Math.PI);
  for (let j = 1; j < k; j += 2) value *= j / 2;
  return value;
}

describe('gaussHermite', () => {
  it('matches the closed-form rules of one and two nodes', () => {
    // n = 1: x = 0, w = √π. n = 2: x = ±1/√2, w = √π/2 (roots of H_2(x) = 4x² − 2).
    const one = gaussHermite(1);
    expect(one.nodes[0]).toBeCloseTo(0, 14);
    expect(one.weights[0]).toBeCloseTo(Math.sqrt(Math.PI), 14);
    const two = gaussHermite(2);
    expect(two.nodes[0]).toBeCloseTo(-Math.SQRT1_2, 14);
    expect(two.nodes[1]).toBeCloseTo(Math.SQRT1_2, 14);
    two.weights.forEach((w) => expect(w).toBeCloseTo(Math.sqrt(Math.PI) / 2, 14));
  });

  it('integrates every polynomial of degree up to 2n − 1 exactly', () => {
    for (const n of [1, 2, 3, 5, 8, 12, 20]) {
      const { nodes, weights } = gaussHermite(n);
      for (let k = 0; k <= 2 * n - 1; k++) {
        const sum = nodes.reduce((total, x, i) => total + weights[i] * x ** k, 0);
        // Relative to Σ w |x|^k, the size of the terms: odd moments are zero by cancelling terms near 1e10. At
        // n = 20 and k = 39 the outer nodes dominate, and their weights near 1e-13 carry the eigen-solver's rounding.
        const scale = nodes.reduce((total, x, i) => total + weights[i] * Math.abs(x) ** k, 0);
        expect(Math.abs(sum - hermiteMoment(k))).toBeLessThanOrEqual(1e-9 * scale);
      }
    }
  });

  it('is symmetric, ascending and its weights sum to √π', () => {
    const { nodes, weights } = gaussHermite(9);
    nodes.forEach((x, i) => expect(x + nodes[8 - i]).toBe(0));
    weights.forEach((w, i) => expect(w).toBe(weights[8 - i]));
    nodes.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(nodes[i]));
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(Math.sqrt(Math.PI), 13);
  });

  it('returns copies that callers may change', () => {
    gaussHermite(4).nodes[0] = 99;
    expect(gaussHermite(4).nodes[0]).toBeLessThan(0);
  });

  it('rejects a node count that is not a positive integer', () => {
    expect(() => gaussHermite(0)).toThrow(RangeError);
    expect(() => gaussHermite(2.5)).toThrow(RangeError);
  });
});

describe('normalExpectation', () => {
  it('gives E[e^{aZ}] = e^{a²/2} to 1e-10 with 20 nodes', () => {
    for (const a of [-1.5, -0.3, 0, 0.5, 1, 2, 3]) {
      expect(Math.abs(normalExpectation((z) => Math.exp(a * z), 20) / Math.exp(a ** 2 / 2) - 1)).toBeLessThan(1e-10);
    }
  });

  it('gives the moments of a standard normal exactly', () => {
    // E[Z²] = 1, E[Z⁴] = 3 and E[Z⁶] = 15 need 2n − 1 ≥ 6, so four nodes.
    expect(normalExpectation(() => 1, 1)).toBeCloseTo(1, 14);
    expect(normalExpectation((z) => z ** 2, 4)).toBeCloseTo(1, 13);
    expect(normalExpectation((z) => z ** 4, 4)).toBeCloseTo(3, 13);
    expect(normalExpectation((z) => z ** 6, 4)).toBeCloseTo(15, 12);
    expect(normalExpectation((z) => z ** 5, 4)).toBeCloseTo(0, 13);
  });
});
