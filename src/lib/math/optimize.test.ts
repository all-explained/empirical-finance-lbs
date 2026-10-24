import { describe, expect, it } from 'vitest';
import { minimize } from './optimize';

describe('minimize', () => {
  it('finds the Rosenbrock minimum f(1, 1) = 0 from the classic start (-1.2, 1)', () => {
    const rosenbrock = ([x, y]: readonly number[]) => 100 * (y - x * x) ** 2 + (1 - x) ** 2;
    const { x, value, iterations } = minimize(rosenbrock, [-1.2, 1]);
    expect(x[0]).toBeCloseTo(1, 8);
    expect(x[1]).toBeCloseTo(1, 8);
    expect(value).toBeLessThan(1e-16);
    expect(iterations).toBeGreaterThan(0);
    expect(iterations).toBeLessThan(5000);
  });

  it('finds the minimum (1, -2, 3) of a three-dimensional quadratic with cross terms', () => {
    const f = ([a, b, c]: readonly number[]) => (a - 1) ** 2 + 2 * (b + 2) ** 2 + 3 * (c - 3) ** 2 + (a - 1) * (b + 2);
    const { x, value } = minimize(f, [0, 0, 0]);
    [1, -2, 3].forEach((target, i) => expect(x[i]).toBeCloseTo(target, 8));
    expect(value).toBeLessThan(1e-16);
  });

  it('stops at the iteration cap and treats NaN as +Infinity', () => {
    expect(minimize(([x]) => (x - 5) ** 2, [0], { maxIter: 3 }).iterations).toBe(3);
    // f is undefined below zero; the minimum of (x - 2)² on x ≥ 0 is at 2.
    const { x } = minimize(([v]) => (v < 0 ? NaN : (v - 2) ** 2), [0.5]);
    expect(x[0]).toBeCloseTo(2, 8);
  });
});
