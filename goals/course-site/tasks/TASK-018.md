---
id: TASK-018
title: 'Library: sample moments and Sharpe ratio'
milestone: M-3
state: approved
depends_on: []
delivery: pr
---

## Why

SC-7. Chapter 2 (expected return and risk) needs the sample-moment maths in `src/lib`, with tests, before its widgets can use it.

## Scope

Add `src/lib/stats/moments.ts` and `src/lib/stats/moments.test.ts`. Functions: sample mean standard error `meanStandardError(values)` (= s/√T), Sharpe ratio `sharpeRatio(excess)`, annualisation `annualiseMean`, `annualiseVolatility`, `annualiseSharpe` for 12 periods a year, `skewness`, `excessKurtosis` (sample versions, state the divisor in a comment), and `histogram(values, bins)` returning bin edges and counts. Put the maths in the file named below, with Vitest tests against reference values (hand-computed or from a trusted formula, stated in the test). Reuse `arithmeticMean` and `sampleVariance` from `src/lib/finance/returns.ts` and `ols` from `src/lib/stats/ols.ts` where they fit; do not copy them. Seed any random draw with `src/lib/math/rng.ts`. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance

- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/stats/moments.ts`, its test and this task's outcome file.

## Verify

```sh
npm ci
npm test
npm run build
git status --short
```
