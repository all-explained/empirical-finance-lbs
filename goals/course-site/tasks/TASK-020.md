---
id: TASK-020
title: 'Library: mean–variance portfolios and beta'
milestone: M-3
state: approved
depends_on: [TASK-019]
delivery: pr
---

## Why

SC-7. Chapter 7 needs the efficient frontier, the tangency portfolio and betas computed in `src/lib`, with tests.

## Scope

Add `src/lib/finance/portfolio.ts` and `src/lib/finance/portfolio.test.ts`, built on `src/lib/math/linalg.ts` from the task it depends on. Functions: sample mean vector and covariance matrix of a return matrix; `minVarianceWeights(mu, Sigma, target)`; `frontier(mu, Sigma, points)` (return, volatility, weights); `tangencyWeights(muExcess, Sigma)` with `maxSharpeSquared = muExcess'Σ⁻¹muExcess`; `betas(assetExcess, marketExcess)` through `ols`; and `securityMarketLine(betas, meanExcess)` returning the fitted slope and intercept. Test on a two-asset case solved by hand and on a three-asset case checked against the closed form. Put the maths in the file named below, with Vitest tests against reference values (hand-computed or from a trusted formula, stated in the test). Reuse `arithmeticMean` and `sampleVariance` from `src/lib/finance/returns.ts` and `ols` from `src/lib/stats/ols.ts` where they fit; do not copy them. Seed any random draw with `src/lib/math/rng.ts`. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance

- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/portfolio.ts`, its test and this task's outcome file.

## Verify

```sh
npm ci
npm test
npm run build
git status --short
```
