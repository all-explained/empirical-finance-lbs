export interface MinimizeOptions {
  /** Stop when every vertex is within tol of the best one, in both x and f. */
  tol?: number;
  maxIter?: number;
  /** Edge of the starting simplex along each axis. Defaults to 5% of |x0_i|, or 0.00025 when x0_i = 0. */
  step?: number;
}

export interface MinimizeResult {
  x: number[];
  value: number;
  iterations: number;
  converged: boolean;
}

/** Nelder–Mead simplex search for a minimum of f, with the standard coefficients
 * (reflection 1, expansion 2, contraction 1/2, shrink 1/2). No derivatives; enough for two or three parameters.
 */
export function minimize(
  f: (x: number[]) => number,
  x0: readonly number[],
  { tol = 1e-10, maxIter = 2000, step }: MinimizeOptions = {},
): MinimizeResult {
  const n = x0.length;
  if (n === 0) throw new Error('minimize: x0 must have at least one entry');
  const value = (x: number[]) => {
    const fx = f(x);
    return Number.isNaN(fx) ? Infinity : fx;
  };
  const along = (from: number[], to: number[], t: number) => from.map((v, i) => v + t * (to[i] - v));
  let simplex = [[...x0], ...x0.map((v, i) => {
    const x = [...x0];
    x[i] += step ?? (v === 0 ? 0.00025 : 0.05 * Math.abs(v));
    return x;
  })].map((x) => ({ x, f: value(x) }));
  for (let iteration = 0; iteration < maxIter; iteration++) {
    simplex.sort((p, q) => p.f - q.f);
    const best = simplex[0];
    const worst = simplex[n];
    const spread = Math.max(...simplex.map((p) => Math.max(Math.abs(p.f - best.f), ...p.x.map((v, i) => Math.abs(v - best.x[i])))));
    if (spread <= tol) return { x: best.x, value: best.f, iterations: iteration, converged: true };
    const centroid = best.x.map((_, i) => simplex.slice(0, n).reduce((sum, p) => sum + p.x[i], 0) / n);
    const reflected = along(centroid, worst.x, -1);
    const fr = value(reflected);
    if (fr < best.f) {
      const expanded = along(centroid, worst.x, -2);
      const fe = value(expanded);
      simplex[n] = fe < fr ? { x: expanded, f: fe } : { x: reflected, f: fr };
    } else if (fr < simplex[n - 1].f) {
      simplex[n] = { x: reflected, f: fr };
    } else {
      // Contract outside when the reflection beat the worst vertex, inside otherwise.
      const contracted = fr < worst.f ? along(centroid, reflected, 0.5) : along(centroid, worst.x, 0.5);
      const fc = value(contracted);
      if (fc < Math.min(fr, worst.f)) {
        simplex[n] = { x: contracted, f: fc };
      } else {
        // Shrink every vertex halfway towards the best one.
        simplex = simplex.map((p, k) => {
          if (k === 0) return p;
          const x = along(best.x, p.x, 0.5);
          return { x, f: value(x) };
        });
      }
    }
  }
  simplex.sort((p, q) => p.f - q.f);
  return { x: simplex[0].x, value: simplex[0].f, iterations: maxIter, converged: false };
}
