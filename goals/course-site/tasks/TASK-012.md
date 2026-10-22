---
id: TASK-012
title: 'Library: predictive regressions and AR(1) horizon slopes'
milestone: M-2
state: approved
depends_on: [TASK-011]
delivery: pr
route: {platform: codex, model: gpt-6.1-sol, effort: high}
---

## Why

SC-5. Chapter 9's two widgets (`PredictiveRegression`, `HorizonCurve`) need the horizon regressions, the AR(1) fit, the implied-slope formula and a seeded simulator. They must come from tested library code (style guide §5).

## Scope

Write `src/lib/finance/predictive.ts` and `src/lib/finance/predictive.test.ts`. Use `ols` from `src/lib/stats/ols.ts` (TASK-011) and `mulberry32` / `normalRng` from `src/lib/math/rng.ts`. Do not copy regression code.

Functions:
- `forwardSums(r, k)`: the overlapping k-period sum `r[t+1] + ... + r[t+k]` for every `t` that has k later values. Predictor value `x[t]` pairs with `forwardSums(r, k)[t]`. Document this alignment in one comment, with a small worked example in the test.
- `predictiveRegression(r, x, k, { errors })`: regress the k-period sum of log excess returns on `x[t]`. Return slope, intercept, standard error, t-statistic, `r2`, `nobs`. The default errors are Newey–West with `lags = k`; `'hansen-hodrick'` and `'classical'` are options.
- `horizonSlopes(r, x, horizons, options)`: the same for a list of horizons.
- `fitAR1(x)`: return `phi`, `intercept`, residual standard deviation, from OLS of `x[t+1]` on `x[t]`.
- `impliedHorizonSlope(b1, phi, k)` = `b1 (1 - phi^k) / (1 - phi)` (the curriculum's Key math; the case `phi = 1` is the limit `b1 * k`).
- `goyalWelchAnnualPredictors(series)`: from a loaded `goyal-welch-annual` series, return dates, the log dividend–price ratio `dp = log(D12) - log(Index)`, and the log excess return `log(1 + CRSP_SPvw) - log(1 + Rfree)`. Check the raw columns in `src/data/series/goyal-welch-annual.json` and `docs/DATA.md`: decide the timing of each column (year-end level or return over the year), skip rows with missing values, and state the alignment of `dp` at year `t` with the return of year `t+1` in a comment.
- `simulatePredictive({ T, b1, phi, sigmaR, sigmaX, corr, seed })`: seeded monthly simulation of a return `r[t+1] = a + b1 x[t] + e[t+1]` and an AR(1) predictor `x[t+1] = phi x[t] + u[t+1]`, with `corr(e, u)`. Defaults from style guide §5: `phi = 0.98`, market excess mean 0.5% a month, volatility 4.5% a month, `T = 600`. Choose `b1` so the one-month `R^2` is about 1%, and write the choice in a comment. The same seed must give the same series on every run.

Tests: reference values from an independent implementation, computed once in a throwaway Python environment kept outside the repository (as in TASK-011), for the `goyal-welch-annual` regression at horizons 1 and 5 years: slope, Newey–West t-statistic, `R^2`. Add: `forwardSums` on a short hand-checked array, `fitAR1` recovers `phi` from a long simulated series within 0.02, the average simulated horizon slope over many seeds is close to `impliedHorizonSlope` (state the tolerance), `impliedHorizonSlope` at `k = 1` equals `b1`, and equal seeds give equal output.

Out of scope: charts, components, chapter text, Stambaugh-bias corrections (curriculum chapter 12), out-of-sample tests.

## Acceptance

- `npm test` passes and includes the new tests.
- Every function listed above exists, and the real-data regression matches the independent reference values at horizons 1 and 5.
- No regression code is duplicated from `ols.ts`: `grep -n "inverse\|solve" src/lib/finance/predictive.ts` prints nothing.
- `npm run build` passes.

## Verify

```sh
npm ci
npm test
npm run build
grep -n "inverse\|solve" src/lib/finance/predictive.ts || echo "no duplicated solver"
git diff --stat origin/main...HEAD
```
