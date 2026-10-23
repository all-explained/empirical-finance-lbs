---
id: TASK-053
title: 'Library: out-of-sample forecasts, Clark–West and certainty-equivalent gains'
milestone: M-5
state: approved
depends_on: []
delivery: pr
---

## Why

SC-7 and M-5. Chapter 13 needs real-time (expanding-window) forecasts, the out-of-sample $R^2$, the cumulative squared-error difference, the Clark–West test and the certainty-equivalent gain in `src/lib`, with tests.

## Scope

Add `src/lib/finance/outOfSample.ts` and `src/lib/finance/outOfSample.test.ts`. Read first: the entry of chapter 13 in `docs/CURRICULUM.md`, the notation table in `docs/STYLE_GUIDE.md` §3, the `goyal-welch-annual` and `goyal-welch-monthly` notes in `docs/DATA.md`, and `src/lib/finance/predictive.ts` (its `goyalWelchAnnualPredictors` shows how annual dates and columns line up; `dp[t]` predicts `r[t+1]`). Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GoyalWelch2008.pdf` with `pdftotext -layout` for the definition and timing of each predictor, and cite its page in a doc comment.

Functions:
- `goyalWelchPredictors(series, frequency)` for `goyal-welch-annual` and `goyal-welch-monthly`: returns `{ dates, r, predictors }`, where `r` is the log excess return as `goyalWelchAnnualPredictors` defines it and `predictors` maps a short name (`dp`, `dy`, `ep`, `de`, `bm`, `ntis`, `tbl`, `lty`, `tms`, `dfy`, `infl`, `svar`, and `cay` for annual data only) to its series. Build only predictors that the committed columns support, follow Goyal & Welch (2008) for timing (for example the publication lag of inflation), and keep source gaps as `null`. Document the alignment of `r[t]` with each predictor.
- `expandingForecasts(r, x, options)` with `options = { minWindow, expectedSign?, floorAtZero? }`: for each date after the first `minWindow` observations, the OLS forecast of the next return estimated only on data known at that date, and the historical-mean forecast on the same window. `expectedSign` sets the forecast to the historical mean when the slope has the wrong sign; `floorAtZero` floors a negative forecast at zero. Return `{ index, actual, forecast, benchmark, slope }`.
- `oosR2(actual, forecast, benchmark)` = $1 - \sum (r - \hat r)^2 / \sum (r - \bar r)^2$.
- `cumulativeSquaredErrorDifference(actual, forecast, benchmark)`: the running sum of $(r - \bar r)^2 - (r - \hat r)^2$, so a rising line means the predictor beats the historical mean.
- `clarkWest(actual, forecast, benchmark)` returns `{ statistic, pValue }`: the $t$-statistic of the mean of $f_t = (r - \bar r)^2 - [(r - \hat r)^2 - (\bar r - \hat r)^2]$ and its one-sided normal $p$-value.
- `meanVarianceWeight(forecast, variance, gamma, bounds)` = $\hat r / (\gamma \hat\sigma^2)$ clipped to `bounds`, and `certaintyEquivalentGain(actual, forecast, benchmark, variance, { gamma, bounds, periodsPerYear })`: the annualised difference in $\bar u = \text{mean} - \tfrac{\gamma}{2}\,\text{var}$ of the two portfolios' excess returns. Defaults $\gamma = 3$, bounds $[0, 1.5]$; say in a doc comment that these are teaching choices.

Tests against reference values, each stated in the test: `oosR2`, the cumulative difference and `clarkWest` on a six-point series computed by hand; `expandingForecasts` on a short series where each window's OLS slope is known by hand, including one date where the sign restriction binds and one where the floor binds; a forecast equal to the historical mean gives $R^2_{OS} = 0$, a zero cumulative difference and a zero Clark–West adjustment; `meanVarianceWeight` at and beyond both bounds; and one test per frequency on the committed data that pins the sample dates and the $R^2_{OS}$ of `dp` from a stated first forecast year. Reuse `ols` from `src/lib/stats/ols.ts`, `arithmeticMean` and `sampleVariance` from `src/lib/finance/returns.ts` and `cdf` from `src/lib/math/normal.ts`; do not copy them. Write a correlation as `corr`, never `rho`. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance

- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/outOfSample.ts`, its test and this task's outcome file.

## Verify

```sh
npm ci
npm test
npm run build
git status --short
```
