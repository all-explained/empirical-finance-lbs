---
id: TASK-019
title: 'Library: small linear algebra (inverse, eigen, matrix power)'
milestone: M-3
state: approved
depends_on: []
delivery: pr
---

## Why

SC-7. Chapters 5 (VAR forecasts), 6 (principal components) and 7 (mean–variance) all need small matrix routines. One tested library avoids three copies.

## Scope

Add `src/lib/math/linalg.ts` and `src/lib/math/linalg.test.ts`. Functions on plain `number[][]`: `matMul`, `transpose`, `identity`, `matPow(A, k)`, `solve(A, b)` and `inverse(A)` (Gaussian elimination with partial pivoting; throw on a singular matrix), and `symmetricEigen(A)` returning eigenvalues in descending order and unit eigenvectors (Jacobi rotations; fix the sign so the largest-magnitude entry of each vector is positive). Check `A = QΛQ'`, `A·inverse(A) = I` and `matPow` against repeated `matMul`. Check whether `src/lib/stats/ols.ts` already holds a solver and reuse it if it does. Put the maths in the file named below, with Vitest tests against reference values (hand-computed or from a trusted formula, stated in the test). Reuse `arithmeticMean` and `sampleVariance` from `src/lib/finance/returns.ts` and `ols` from `src/lib/stats/ols.ts` where they fit; do not copy them. Seed any random draw with `src/lib/math/rng.ts`. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance

- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/math/linalg.ts`, its test and this task's outcome file.

## Verify

```sh
npm ci
npm test
npm run build
git status --short
```
