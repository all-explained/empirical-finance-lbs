import { describe, expect, it } from 'vitest';
import { minimize } from './optimize';

describe('minimize', () => {
  it('finds the minimum of the Rosenbrock function, (1, 1) with value 0, from (-1.2, 1)', () => {
    const rosenbrock = ([x, y]: number[]) => 100 * (y - x * x) ** 2 + (1 - x) ** 2;
    const result = minimize(rosenbrock, [-1.2, 1]);
    expect(result.converged).toBe(true);
    expect(result.x[0]).toBeCloseTo(1, 8);
    expect(result.x[1]).toBeCloseTo(1, 8);
    expect(result.value).toBeLessThan(1e-16);
    expect(result.iterations).toBeGreaterThan(0);
  });

  // Near a minimum value of 7, f cannot tell x apart below about √ε·√7 ≈ 4e-8.
  it('finds the centre of a shifted three-dimensional quadratic', () => {
    const result = minimize(([a, b, c]) => (a - 1) ** 2 + 2 * (b + 3) ** 2 + 0.5 * (c - 0.25) ** 2 + 7, [0, 0, 0]);
    [1, -3, 0.25].forEach((value, i) => expect(result.x[i]).toBeCloseTo(value, 6));
    expect(result.value).toBeCloseTo(7, 14);
  });

  it('reports the iteration cap when it stops early', () => {
    const result = minimize(([x, y]) => 100 * (y - x * x) ** 2 + (1 - x) ** 2, [-1.2, 1], { maxIter: 5 });
    expect(result).toMatchObject({ iterations: 5, converged: false });
  });
});
