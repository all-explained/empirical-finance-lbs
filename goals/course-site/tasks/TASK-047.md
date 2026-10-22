---
id: TASK-047
title: 'Library: VAR news decomposition and the dog test'
milestone: M-4
state: approved
depends_on: [TASK-025]
delivery: pr
---

## Why

SC-7 and M-4. Chapter 11 needs the VAR split of unexpected returns into cash-flow and discount-rate news, and Cochrane's "dog that did not bark" simulation, in `src/lib`, with tests.

## Scope

Add `src/lib/finance/news.ts` and `src/lib/finance/news.test.ts`. Read first: the entry of chapter 11 in `docs/CURRICULUM.md`, the notation table in `docs/STYLE_GUIDE.md` §3 ($N_{CF}$, $N_{DR}$, $\rho$, $\phi$, $A$), and `src/lib/stats/var.ts` as merged by TASK-025 (`fitVAR1`, `forecastVAR1`). Build on that merged code; if its names differ from the ones below, use the merged ones.

Functions:
- `newsWeights(A, rho, returnIndex = 0)` returns the row vectors $\lambda_{DR}' = e_1'\rho A(I - \rho A)^{-1}$ and $\lambda_{CF}' = e_1' + \lambda_{DR}'$, where $e_1$ picks the return equation.
- `newsDecomposition(series, rho, returnIndex = 0)` fits a VAR(1) with `fitVAR1` on equal-length columns (the return first), computes the residuals $\varepsilon_{t+1} = z_{t+1} - c - A z_t$, and returns per period the unexpected return, $N_{CF}$ and $N_{DR}$, with $r_{t+1} - \mathbb{E}_t r_{t+1} = N_{CF} - N_{DR}$, plus the shares $\operatorname{Var}(N_{CF})$, $\operatorname{Var}(N_{DR})$ and $-2\operatorname{Cov}(N_{CF}, N_{DR})$ of the unexpected-return variance.
- `simulateDogNull({ T, phi, rho, residualCov, samples, seed })` draws seeded samples under the null of no return predictability: $dp_{t+1} = \phi\,dp_t + \varepsilon^{dp}_{t+1}$ and $\Delta d_{t+1} = (\rho\phi - 1)\,dp_t + \varepsilon^{d}_{t+1}$, with jointly normal shocks of covariance `residualCov`, and returns from the identity $r_{t+1} = \Delta d_{t+1} - \rho\,dp_{t+1} + dp_t$, so each sample satisfies it exactly. For each sample it returns the OLS slopes $\hat b_r$, $\hat b_d$ and $\hat\phi$ on $dp_t$.
- `dogTailShares(draws, estimates, rho)` returns the share of samples with $\hat b_r$ at or above the data's, with $\hat b_d$ at or above the data's, and with the long-run return slope $\hat b_r/(1 - \rho\hat\phi)$ at or above the data's.

`rho` is an argument everywhere: the chapter computes it with TASK-046's `linearisationConstants`, so this library does not import that file. Tests against reference values, each stated in the test: news weights for a 2×2 $A$ solved by hand; on a synthetic VAR, $N_{CF} - N_{DR}$ equals the unexpected return to 1e-12 and the three shares sum to 1; with $A = 0$ there is no discount-rate news; every draw of `simulateDogNull` satisfies $\hat b_r - \hat b_d + \rho\hat\phi = 1$ to 1e-10 when the regressions share one sample, and the mean $\hat b_r$ under the null is near 0 within a stated Monte Carlo tolerance; the same seed gives the same draws. Seed every draw with `normalRng` from `src/lib/math/rng.ts`; use `inverse`, `matMul` and `identity` from `src/lib/math/linalg.ts` and `ols` from `src/lib/stats/ols.ts`; do not copy them. Write a correlation as `corr`, never `rho`. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance

- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/news.ts`, its test and this task's outcome file.

## Verify

```sh
npm ci
npm test
npm run build
git status --short
```
