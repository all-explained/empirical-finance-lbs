---
id: TASK-055
title: 'Library: cointegration, dynamic OLS and cay'
milestone: M-5
state: approved
depends_on: [TASK-054]
delivery: pr
---

## Why

SC-7 and M-5. Chapter 14 needs dynamic OLS for a cointegrating vector, the $cay$ residual in full-sample and real-time form, quarterly market returns to predict, and a seeded cointegrated pair for its demo, in `src/lib`, with tests.

## Scope

Add `src/lib/stats/cointegration.ts` with `src/lib/stats/cointegration.test.ts`, and `src/lib/finance/cay.ts` with `src/lib/finance/cay.test.ts`. Read first: the entry of chapter 14 in `docs/CURRICULUM.md`, the notation table in `docs/STYLE_GUIDE.md` §3, the `fred-cay-quarterly` and `goyal-welch-monthly` notes in `docs/DATA.md` (the first comes from TASK-054, which this task depends on), `src/lib/stats/ols.ts`, `src/lib/stats/var.ts` and `src/lib/math/rng.ts`. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/LettauLudvigson2001a.pdf` (Lettau & Ludvigson (2001, JF)) with `pdftotext -layout` for the data definitions, the timing of wealth and the number of leads and lags, and cite its pages in doc comments.

`src/lib/stats/cointegration.ts` (generic, no dataset):
- `dynamicOLS(y, X, { leads, lags })`: regress $y_t$ on a constant, the levels $X_t$ and the leads and lags of $\Delta X_t$; return the constant, the level coefficients with Newey–West standard errors, and the sample used.
- `cointegratingResidual(y, X, alpha, beta)` = $y_t - \alpha - \beta' X_t$.
- `realTimeResidual(y, X, { minWindow, leads, lags })`: at each date, estimate `dynamicOLS` only on data known at that date and return that date's residual. Say in a doc comment how leads are handled when the future is not yet known.
- `simulateCointegratedPair({ seed, T, beta, phi, sigma })`: $x_t$ a random walk, $y_t = \beta x_t + u_t$ with $u_t$ an AR(1) with persistence $\phi$, seeded with `normalRng`; and `combination(y, x, w)` = $y_t - w\,x_t$.

`src/lib/finance/cay.ts` (data):
- `cayInputs(series)` for `fred-cay-quarterly`: log real per-person consumption $c_t$, asset wealth $a_t$ and labour income $y_t$, with the deflator, timing and income definition of Lettau & Ludvigson (2001, JF) as far as the public columns allow; document every difference.
- `fullSampleCay(inputs, options)` and `realTimeCay(inputs, options)`: the residual $c_t - \hat\omega a_t - \hat\beta_y y_t$ from `dynamicOLS` on the whole sample and in real time, with the estimated weights.
- `quarterlyExcessReturns(series)` for `goyal-welch-monthly`: quarterly log excess returns of `CRSP_SPvw` over `Rfree`, dated to match `fred-cay-quarterly`, with the alignment ($cay_t$ predicts the return of quarter $t+1$) in a doc comment.

Tests against reference values, each stated in the test: `dynamicOLS` with zero leads and lags equals `ols` on the levels; on a seeded pair with $T = 2000$ and $\beta = 0.6$ the DOLS slope is within 0.02 of 0.6; `realTimeResidual` at the last date equals the full-sample residual there; `combination` at $w = \beta$ has the AR(1) persistence of $u$ (within 0.05, via `fitAR1` or `sampleAutocorrelation`) while $w = 0$ gives persistence above 0.95; `quarterlyExcessReturns` for one quarter computed by hand from three monthly rows; and one test on the committed data that pins the sample quarters and the estimated weights $\hat\omega$ and $\hat\beta_y$. Reuse `ols`, `normalRng` and the AR(1) helpers; do not copy them. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance

- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only the four files named above and this task's outcome file.

## Verify

```sh
npm ci
npm test
npm run build
git status --short
```
