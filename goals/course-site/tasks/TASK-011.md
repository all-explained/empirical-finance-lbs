---
id: TASK-011
title: 'Library: OLS with White and Newey–West standard errors'
milestone: M-2
state: approved
depends_on: []
delivery: pr
route: {platform: codex, model: gpt-6.1-sol, effort: high}
---

## Why

SC-5. Chapter 9 runs regressions of future returns on the dividend–price ratio with overlapping horizons. The curriculum's Part I teaches OLS and Newey–West standard errors, and later chapters reuse them. One tested library serves them all.

## Scope

Write `src/lib/stats/ols.ts` and `src/lib/stats/ols.test.ts`. Pure TypeScript; no new runtime dependency.

`ols(y, X, options)`:
- `y` is an array of numbers. `X` is an array of regressor columns. An intercept is added by default (`intercept: false` turns it off).
- Return `coefficients`, `standardErrors`, `tStats`, `residuals`, `fitted`, `r2`, `adjR2`, `nobs`, `covariance`.
- `options.errors` selects the covariance: `'classical'` (default), `'white'` (HC0, with `hc1: true` for the `n/(n-k)` scale), `'newey-west'` with `lags` L and the Bartlett weights `1 - l/(L+1)`, and `'hansen-hodrick'` with `lags` L and equal weights (the "overlapping horizons" estimator). Document each formula in a short comment above its function, in the notation of `docs/STYLE_GUIDE.md`.
- Newey–West with `lags: 0` must equal White (HC0). Test this.
- Reject inputs that cannot work with a clear error: unequal lengths, fewer observations than parameters, a singular `X'X`.
- Solve the normal equations with a numerically stable method (QR or Cholesky), not an explicit inverse of `X'X` where it can be avoided.

Tests: reference values from an independent implementation. Compute them once in a throwaway Python virtual environment kept outside the repository (for example under `/tmp`) with numpy and statsmodels. Paste the numbers into the test with a comment that says the exact command and library versions. Cover at least: classical, HC0, HC1, Newey–West with 4 lags, Hansen–Hodrick with 4 lags, on one fixed dataset of about 40 rows with one regressor, and one with two regressors. Add identity checks: residuals are orthogonal to the regressors, the intercept-only fit returns the mean and `se = s/sqrt(n)`, and `r2` equals the squared correlation for one regressor.

Out of scope: predictive-regression helpers (TASK-012), any chart, any chapter text, GMM.

## Acceptance

- `npm test` passes and includes the new tests.
- The four covariance choices and the intercept switch each have a test with an independently computed reference value.
- `package.json` has no new entry under `dependencies` (the Python environment is never committed).
- `npm run build` passes.

## Verify

```sh
npm ci
npm test
npm run build
git diff --stat origin/main...HEAD
git diff origin/main...HEAD -- package.json package-lock.json
```
