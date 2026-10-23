# TASK-053 outcome: Library: out-of-sample forecasts, Clark–West and certainty-equivalent gains

PR: https://github.com/all-explained/empirical-finance-lbs/pull/40

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes.
  Evidence: `src/lib/finance/outOfSample.test.ts` states each reference value in the test.
  `oosR2`, `cumulativeSquaredErrorDifference` and `clarkWest` on a six-point series by hand:
  R²_OS = 1 - 5/8 = 0.375; running sum [1, 1, 1, 1, 4, 3]; f = [2, 0, 0, 0, 4, 0], statistic
  1/sqrt(2.8/6) = 1.46385, p = 0.07162. A forecast equal to the historical mean gives R²_OS = 0,
  a zero running sum and a zero Clark–West adjustment (statistic 0, p = 0.5).
  `expandingForecasts` on a 6-point series with hand OLS slopes -0.03 and 0.05; the sign restriction
  binds at the first date (forecast = mean 0.01) and the zero floor at the second (-0.06 → 0).
  `meanVarianceWeight` at and beyond both bounds (0, -0.1 → 0, 1.5, 2 → 1.5, and [-1, 1]).
  `certaintyEquivalentGain` by hand: 0.043359375 per year at periodsPerYear 1, 0.5203125 at 12.
  `goyalWelchPredictors`: annual 1926–2025 (100 rows) and monthly 1926-01–2025-12 (1200 rows),
  1926 values of r, dp, dy, ep, de, tms, dfy, infl, cay checked against the source cells, and the
  monthly one-month inflation lag. R²_OS of `dp` against an independent plain-Python OLS on the
  committed JSON: annual, first forecast 1965 (minWindow 38, 61 forecasts), -0.031074; monthly,
  first forecast 1965-01 (minWindow 467, 732 forecasts), -0.0033784.
  `npm test`: `Test Files 30 passed (30)`, `Tests 329 passed (329)`.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `Result (102 files): - 0 errors - 0 warnings - 1 hint` (the hint is in `news.ts`),
  then `13 page(s) built`, `[build] Complete!`, exit 0.
- [x] `git status --short` shows only `src/lib/finance/outOfSample.ts`, its test and this task's outcome file.
  Evidence: after `npm ci`, `npm test` and `npm run build` it showed only
  `?? src/lib/finance/outOfSample.test.ts` and `?? src/lib/finance/outOfSample.ts`; the PR diff holds
  those two files and this outcome file.

## Summary

**What.** `src/lib/finance/outOfSample.ts` adds `goyalWelchPredictors`, `expandingForecasts`, `oosR2`,
`cumulativeSquaredErrorDifference`, `clarkWest`, `meanVarianceWeight` and `certaintyEquivalentGain`.

**How.** `goyalWelchPredictors` keeps the rows where `CRSP_SPvw` and `Rfree` exist (1926 onward at both
frequencies; no interior gaps). `r[t]` is the log excess return earned during period t, as in
`goyalWelchAnnualPredictors`, and every predictor at t is known at the end of t, so it forecasts `r[t+1]`.
Definitions and timing follow Goyal and Welch (2008, pp. 1457–1460): `dy` uses the previous source
period's index, `tms = lty - tbl`, `dfy = BAA - AAA`, and monthly `infl[t]` is the source value of
t - 1 because CPI is released a month later. The paper states that lag for monthly regressions only,
so annual `infl` is not lagged. `cay` is the source column; the doc comment notes the paper's warning
that full-sample cay has look-ahead bias. Lags reach back into source rows before 1926, so the first
row has `dy` and monthly `infl`. Gaps stay `null`.
`expandingForecasts` regresses `r[s+1]` on `x[s]` for s < t with `ols`, so the window at date t holds
t pairs and the benchmark is the mean of the same `r[1..t]`. `index` is the position in `r` of the
forecast return. The sign restriction applies first, then the zero floor; `slope` is unrestricted.
`clarkWest`, `certaintyEquivalentGain` reuse `arithmeticMean`, `sampleVariance` (n - 1) and `cdf`.

**Deviations.**
- `minWindow` must be at least 3, because `ols` with an intercept needs positive residual degrees of freedom.
- `clarkWest` returns statistic 0 and p = 0.5 when every f is zero (forecast always equal to the
  mean, which a sign restriction can cause). Otherwise 0/0 would give NaN.
- `periodsPerYear` has no default, so annual data cannot be annualised by 12 by mistake.
  γ = 3 and bounds [0, 1.5] are defaults and are called teaching choices in the doc comment.
- `certaintyEquivalentGain` uses `w_t × actual_t` as the portfolio excess return. The doc comment
  says this is exact for simple excess returns and an approximation for log excess returns.

**Timing.** Node on Apple Silicon: the monthly `dp` run takes about 360 ms (733 windows, each
a full `ols` with standard errors); annual takes about 4 ms.

**Verified revision.** Library commit 8a5c4e5 on `goal/course-site/task-053`, with `npm ci`,
`npm test` and `npm run build` run locally.

**Proposed follow-ups.**
- TASK-057 (`OOSRace`): 12 monthly predictors take about 4 s. Precompute at build time, use annual
  data, or add a running-sums slope path; the forecasts need only the slope and intercept, not
  the standard errors that `ols` builds.
- TASK-057: to pass a predictor to `expandingForecasts`, slice to the span where it has no `null`
  (for example `cay` from 1945, monthly `ntis` from 1926-12).
