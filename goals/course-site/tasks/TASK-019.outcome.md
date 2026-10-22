# TASK-019 outcome

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test`
  passes. On implementation revision `dd05649`, all 164 tests in ten files passed,
  including 17 tests in `src/lib/math/linalg.test.ts`. Reference values, each stated
  in a test comment:
  - `identity`, `transpose`: exact small matrices.
  - `matMul`: hand-computed 2×2 and 2×3·3×1 products.
  - `matPow`: Fibonacci identity `[1 1; 1 0]^10 = [89 55; 55 34]`, and agreement with
    repeated `matMul` for k = 0 to 12 on a seeded 3×3 matrix.
  - `solve`: Cramer's rule for a 2×2 system, the textbook 3×3 system with solution
    (2, 3, −1), and a zero first pivot that needs a row swap.
  - `inverse`: the closed-form 2×2 inverse, the integer inverse of the 3×3 Hilbert
    matrix, and `A·inverse(A) = I` for a seeded 5×5 matrix.
  - `symmetricEigen`: the closed form `(7 ± √5)/2` with its eigenvectors for
    `[4 1; 1 3]`, the closed form `2 ± √2, 2` for the 3×3 second-difference matrix,
    and `A = QΛQ'` with `Q'Q = I` for a seeded 6×6 covariance matrix.
  - Singular, non-square, non-symmetric and non-finite inputs throw.
- [x] `npm run build` passes. `astro check` reported 0 errors, 0 warnings and 0 hints,
  and the static build completed (3 pages).
- [x] `git status --short` shows only `src/lib/math/linalg.ts`, its test and this
  outcome file. Before the library commit it listed exactly
  `?? src/lib/math/linalg.test.ts` and `?? src/lib/math/linalg.ts`.

## Summary

What: `src/lib/math/linalg.ts` adds `identity`, `transpose`, `matMul`, `matPow`,
`solve`, `inverse` and `symmetricEigen` on plain `number[][]`. Functions never
mutate their inputs and reject empty, ragged or non-finite matrices with `RangeError`.

How:
- `matPow(A, k)` uses repeated squaring for integer `k ≥ 0`; `A^0 = I`.
- `solve` and `inverse` share one Gaussian elimination with partial pivoting on
  `[A | B]`. A pivot at or below `n · ε · max|A|` throws `Error('… matrix is singular')`.
- `symmetricEigen` uses cyclic Jacobi rotations (Numerical Recipes §11.1) until the
  off-diagonal norm falls below `ε · ‖A‖_F`. It returns eigenvalues in descending order
  and `vectors[i]`, the unit eigenvector for `values[i]`, with its largest-magnitude
  entry positive. So `Q = transpose(vectors)` gives `A = QΛQ'`. A matrix that is not
  symmetric to a relative `1e-10` throws.

Reuse check: `src/lib/stats/ols.ts` holds only private Householder QR helpers for
regressions and exports no general solver, so nothing could be reused without editing
it (out of scope). `arithmeticMean`, `sampleVariance` and `ols` do not fit these
routines. Random test matrices come from `normalRng` in `src/lib/math/rng.ts`.

Deviations: none. Verified revision: `dd05649`. The full spec Verify sequence
(`npm ci`, `npm test`, `npm run build`, `git status --short`) exited 0.

Proposed follow-ups: none. Later tasks (TASK-020, TASK-025, TASK-026) can import
these functions directly.
