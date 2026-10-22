---
id: TASK-021
title: 'Library: Euler equation, SDF and Hansen–Jagannathan bound'
milestone: M-3
state: approved
depends_on: []
delivery: pr
---

## Why

SC-7. Chapter 8 needs the SDF pricing maths and the Hansen–Jagannathan bound in `src/lib`, with tests.

## Scope

Add `src/lib/finance/sdf.ts` and `src/lib/finance/sdf.test.ts`. Functions: `crraSdf(beta, gamma, consumptionGrowth)`; `price(payoff, sdf, probabilities)` for a finite set of states (`p = E[mx]`); `riskFreeRate(sdf, probabilities)`; `riskPremiumFromCovariance(sdf, excessReturn, probabilities)` (= −R^f Cov(M, R^e)); `hjBoundSharpe(sdfMean, sdfStd)` (σ(M)/E[M]); `hjRegion(meanGrid, sharpe)` giving the lower bound of σ(M) for each E[M]; and `betaPricing(...)` giving the beta and the price of risk λ_M. Test with a two-state economy solved by hand, and check that the bound holds with equality for the SDF that is a linear function of the payoff. Put the maths in the file named below, with Vitest tests against reference values (hand-computed or from a trusted formula, stated in the test). Reuse `arithmeticMean` and `sampleVariance` from `src/lib/finance/returns.ts` and `ols` from `src/lib/stats/ols.ts` where they fit; do not copy them. Seed any random draw with `src/lib/math/rng.ts`. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance

- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/sdf.ts`, its test and this task's outcome file.

## Verify

```sh
npm ci
npm test
npm run build
git status --short
```
