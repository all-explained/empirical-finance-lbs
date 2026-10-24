export interface MinimizeOptions {
  /** Stop when every vertex is within tol·(1 + |x|) of the best in each coordinate and within
   * tol·(1 + |f|) of the best value. */
  tol?: number;
  maxIter?: number;
}

export interface MinimizeResult {
  x: number[];
  value: number;
  iterations: number;
}

/**
 * Nelder–Mead simplex search for an unconstrained minimum, with the standard coefficients
 * (reflection 1, expansion 2, contraction and shrink 1/2). A NaN value counts as +Infinity, so the
 * simplex moves away from points where f is undefined.
 * ponytail: derivative-free and slow in many dimensions; fine for the two or three GMM parameters.
 */
export function minimize(
  f: (x: readonly number[]) => number,
  x0: readonly number[],
  { tol = 1e-10, maxIter = 5000 }: MinimizeOptions = {},
): MinimizeResult {
  if (x0.length === 0 || !x0.every(Number.isFinite)) throw new RangeError('minimize: x0 must be a finite, non-empty vector');
  const n = x0.length;
  const evaluate = (x: number[]) => {
    const value = f(x);
    return Number.isNaN(value) ? Infinity : value;
  };
  // Start from x0 and n points that each move one coordinate by 5% (or 0.00025 from zero).
  let simplex = [[...x0], ...x0.map((_, i) => x0.map((v, j) => (j !== i ? v : v !== 0 ? 1.05 * v : 0.00025)))]
    .map((x) => ({ x, value: evaluate(x) }));
  const toward = (from: readonly number[], to: readonly number[], t: number) => from.map((v, i) => v + t * (to[i] - v));
  let iterations = 0;
  for (; iterations < maxIter; iterations++) {
    simplex.sort((a, b) => a.value - b.value);
    const best = simplex[0];
    const converged = simplex.every(({ x, value }) =>
      Math.abs(value - best.value) <= tol * (1 + Math.abs(best.value))
      && x.every((v, i) => Math.abs(v - best.x[i]) <= tol * (1 + Math.abs(best.x[i]))));
    if (converged) break;
    const worst = simplex[n];
    const centroid = Array.from({ length: n }, (_, i) => simplex.slice(0, n).reduce((sum, p) => sum + p.x[i], 0) / n);
    const reflect = toward(centroid, worst.x, -1);
    const fReflect = evaluate(reflect);
    if (fReflect < best.value) {
      const expand = toward(centroid, worst.x, -2);
      const fExpand = evaluate(expand);
      simplex[n] = fExpand < fReflect ? { x: expand, value: fExpand } : { x: reflect, value: fReflect };
      continue;
    }
    if (fReflect < simplex[n - 1].value) {
      simplex[n] = { x: reflect, value: fReflect };
      continue;
    }
    // Contract outside when the reflection beat the worst point, inside otherwise.
    const outside = fReflect < worst.value;
    const contract = toward(centroid, outside ? reflect : worst.x, 0.5);
    const fContract = evaluate(contract);
    if (fContract < (outside ? fReflect : worst.value)) {
      simplex[n] = { x: contract, value: fContract };
      continue;
    }
    simplex = simplex.map((p, i) => {
      if (i === 0) return p;
      const x = toward(best.x, p.x, 0.5);
      return { x, value: evaluate(x) };
    });
  }
  simplex.sort((a, b) => a.value - b.value);
  return { x: simplex[0].x, value: simplex[0].value, iterations };
}
