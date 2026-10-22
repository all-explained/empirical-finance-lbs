---
id: TASK-046
title: 'Library: Campbell–Shiller log-linearisation and variance shares'
milestone: M-4
state: approved
depends_on: []
delivery: pr
---

## Why

SC-7 and M-4. Chapters 10 and 11 need the Campbell–Shiller log-linearisation, the present-value identity and the variance shares of the dividend–price ratio in `src/lib`, with tests.

## Scope

Add `src/lib/finance/presentValue.ts` and `src/lib/finance/presentValue.test.ts`. Read first: the entries of chapters 10 and 11 in `docs/CURRICULUM.md`, the notation table in `docs/STYLE_GUIDE.md` §3 ($dp_t$, $pd_t$, $\rho$, $\kappa$, $\Delta d_{t+1}$, $\phi$), the `goyal-welch-annual` notes in `docs/DATA.md`, and `src/lib/finance/predictive.ts` (its `goyalWelchAnnualPredictors` shows how annual dates and columns line up).

Functions:
- `linearisationConstants(meanPd)` returns `{ rho, kappa }`: $\rho = e^{\overline{pd}}/(1 + e^{\overline{pd}})$ and $\kappa = \log(1 + e^{\overline{pd}}) - \rho\,\overline{pd}$.
- `exactLogReturn(pdNow, pdNext, dividendGrowth)` = $\log(1 + e^{pd_{t+1}}) + \Delta d_{t+1} - pd_t$, and `approxLogReturn(pdNow, pdNext, dividendGrowth, rho, kappa)` = $\kappa + \rho\,pd_{t+1} + \Delta d_{t+1} - pd_t$.
- `goyalWelchAnnualPresentValue(series)` returns `{ dates, pd, dp, r, dd }` for consecutive retained years: the log price–dividend ratio, its negative, the log total return and log dividend growth. Build all of them from the same `Index` and `D12` columns, so that the identity holds up to the linearisation error alone; say in a doc comment why `CRSP_SPvw` (another index) is not used here. Document how `r[t]` and `dd[t]` line up with `dp[t]`, as `goyalWelchAnnualPredictors` does.
- `presentValueSlopes(dp, r, dd, rho)` returns the OLS slopes $b_r$, $b_d$ and $\phi$ of $r_{t+1}$, $\Delta d_{t+1}$ and $dp_{t+1}$ on $dp_t$ on one common sample, the long-run coefficients, and the identity gap $1 - (b_r - b_d + \rho\phi)$.
- `longRunCoefficient(b, rho, phi)` = $b/(1 - \rho\phi)$, and `impliedReturnSlope(bd, rho, phi)` = $1 - \rho\phi + b_d$.
- `varianceShares(dp, r, dd, rho, horizon)` returns `{ returns, dividends, future }`: $\operatorname{Cov}(dp_t, \sum_{j=1}^{k} \rho^{j-1} r_{t+j})/\operatorname{Var}(dp_t)$, $-\operatorname{Cov}(dp_t, \sum_{j=1}^{k} \rho^{j-1} \Delta d_{t+j})/\operatorname{Var}(dp_t)$ and $\rho^k \operatorname{Cov}(dp_t, dp_{t+k})/\operatorname{Var}(dp_t)$, on one common sample. They sum to 1 up to the linearisation error; `future` is the "bubble" term of chapter 10.

Tests against reference values, each stated in the test: the constants at $\overline{pd} = \log 30$ by hand; exact and approximate returns agree at $pd_t = pd_{t+1} = \overline{pd}$; a synthetic series built to satisfy the linear identity exactly, on which the identity gap is below 1e-10 and the three shares sum to 1 at every horizon; `longRunCoefficient` and `impliedReturnSlope` by hand; and one test on the committed `goyal-welch-annual` data that pins the sample years, $\rho$ and the largest absolute linearisation error that the code reports. Reuse `ols` from `src/lib/stats/ols.ts` and `arithmeticMean` and `sampleVariance` from `src/lib/finance/returns.ts`; do not copy them. Write a correlation as `corr`, never `rho`, in names and comments. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance

- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/presentValue.ts`, its test and this task's outcome file.

## Verify

```sh
npm ci
npm test
npm run build
git status --short
```
