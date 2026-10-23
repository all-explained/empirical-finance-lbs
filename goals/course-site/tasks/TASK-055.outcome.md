# TASK-055 outcome: Library: cointegration, dynamic OLS and cay

PR: https://github.com/all-explained/empirical-finance-lbs/pull/43

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes.
  Evidence: `Test Files 34 passed (34)`, `Tests 371 passed (371)`. The two new files add 17 tests:
  - `dynamicOLS`: equals `ols` (Newey–West, 0 lags) on the levels with zero leads and lags; equals `ols` on
    hand-built rows `t = 3..T−2` with 1 lead and 2 lags; slope within 0.02 of 0.6 on a seeded pair, `T = 2000`.
  - `cointegratingResidual` and `combination`: hand values.
  - `realTimeResidual`: last date equals the full-sample residual; first date equals `dynamicOLS` on dates
    0..59 only, and is unchanged when later data change (no look-ahead).
  - `simulateCointegratedPair` + `combination`: `fitAR1` persistence at `w = β` is within 0.05 of `φ = 0.7`;
    at `w = 0` it is above 0.95; the same seed reproduces the pair.
  - `cayInputs`: 1952-Q1 `c`, `a`, `y` by hand from the raw cells of rows 1951-10-01 and 1952-01-01.
  - `fullSampleCay`: pins the sample quarters and the weights against a numpy least-squares reference
    (see below), and checks LL's own window against their eq. (12).
  - `realTimeCay`: starts after 62 quarters (1967-Q2) and ends at the full-sample value and weights.
  - `quarterlyExcessReturns`: 2025-Q4 by hand from three monthly rows; a quarter with a missing month is dropped.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `Result (111 files): - 0 errors - 0 warnings`, then `[build] Complete!`.
- [x] `git status --short` shows only the four files named above and this task's outcome file.
  Evidence: before the first commit it listed only `src/lib/finance/cay.ts`, `src/lib/finance/cay.test.ts`,
  `src/lib/stats/cointegration.ts` and `src/lib/stats/cointegration.test.ts`. This file is the fifth.

## Summary

**What.** `src/lib/stats/cointegration.ts` (generic): `dynamicOLS`, `cointegratingResidual`,
`realTimeResidual`, `simulateCointegratedPair`, `combination`. `src/lib/finance/cay.ts` (data): `cayInputs`,
`fullSampleCay`, `realTimeCay`, `quarterlyExcessReturns`. They reuse `ols`, `normalRng`, `simulateAR1`,
`getColumn`; tests reuse `fitAR1`.

**How (choices within scope).**
- `dynamicOLS` regressors: constant, levels `X_t`, and `ΔX_{t+j}` for `j = −lags..leads`. The contemporaneous
  `ΔX_t` enters whenever `leads + lags > 0`. So `leads = lags = k` is LL eq. (11), p. 822, and
  `leads = lags = 0` is the static levels regression, as the spec's test requires. Newey–West lag defaults to
  `max(leads, lags)` (option `neweyWestLags`). The result gives the constant, the level coefficients with
  their standard errors, and the sample as first/last row indices and `nobs`.
- Real time: at date `t` the regression uses dates `0..t`; rows need `ΔX` up to `s + leads`, so the last
  `leads` rows drop out instead of using the future. The residual at `t` needs only the levels at `t`.
- Pair: `x` is a random walk with shocks from `normalRng(seed)`; `u` is `simulateAR1(seed + 1)`, so the two
  shock streams differ. One `sigma` applies to both.
- cay defaults: 8 leads and lags (LL p. 823, fn. 8); real-time window 62 quarters, as LL's first estimate
  1952-Q4–1968-Q1 (p. 833).
- Timing of wealth: LL's `W_t` is held before `C_t` is consumed (eq. 1, p. 818), so `a_t` uses end-of-quarter
  `t − 1` net worth. The first extract quarter (1951-Q4) is dropped: inputs run 1952-Q1–2026-Q2, 298 quarters.
- Return alignment: quarters carry their first month's date, like `fred-cay-quarterly`. `cay_t` predicts the
  return dated `t + 1`.

**Differences from LL (2001), documented in `cayInputs`.** Consumption keeps shoes and clothing; nondurables
and services are each deflated by their own price index and added, as LL add chained-dollar parts. Labour
income is pre-tax: LL's labour share of personal taxes is not removed. Net worth is not seasonally adjusted.
Base year 2017, not 1992 (moves only the constant).

**Results on the committed data (2026-10-23 extract).** Full sample, DOLS sample 1954-Q2–2024-Q2:
`α̂ = 0.6027`, `ω̂ = −0.0279`, `β̂_y = 0.9765`. On LL's window 1952-Q4–1998-Q3 the same code gives
`ω̂ = 0.393`, `β̂_y = 0.605`, against LL's 0.31 and 0.59. The wealth weight falls as the sample grows:
0.17 to 2007-Q4, 0.09 to 2019-Q4, −0.03 to 2026-Q2. Chapter 14 should show this: it is the instability that
makes the real-time and full-sample cay differ.

**Reference values.** Pinned weights come from an independent numpy least-squares fit on the same regressors
(`uv run --with numpy`), and match the TypeScript to 1e-8.

**Verified revision.** Code commit on top of `34ab809`; Verify (`npm ci`, `npm test`, `npm run build`,
`git status --short`) exited 0.

**Not checked.** Screenshots and click-through: no page or widget changed.

**Proposed follow-ups.** TASK-058 may want a tax-adjusted labour income if a public quarterly personal tax
split is added to the data pipeline; with pre-tax income the full-sample wealth weight is near zero.
