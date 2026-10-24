---
id: TASK-072
title: 'Library: rolling and short-window betas and the Lewellen–Nagel alpha bound'
milestone: M-7
state: approved
depends_on: [TASK-067]
delivery: pr
---

## Why


SC-7 and M-7. Chapter 23 needs rolling betas, betas and alphas from within-quarter regressions on daily returns, the average conditional alpha, and the largest alpha that beta timing can create, in `src/lib`, with tests.

## Scope


Add `src/lib/finance/shortWindow.ts` and `src/lib/finance/shortWindow.test.ts`. Read first: the entry of chapter 23 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3, the French notes in `docs/DATA.md` (including the daily files), `src/lib/stats/ols.ts` and `src/lib/finance/timeSeriesTests.ts`. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/LewellenNagel2006.pdf` with `pdftotext -layout`: follow its short-window method, its formula for the unconditional alpha implied by a conditional CAPM, and its bound, and cite each page in a doc comment.

Functions:
- `dailyFactorPanel(ff3Daily, momDaily, { start, end? })`: aligned decimal daily `Mkt-RF`, `SMB`, `HML`, `Mom` and `RF`; throw a `RangeError` when dates do not line up.
- `rollingBetas(y, x, window)`: the OLS alpha and beta of $y$ on $x$ for each window of `window` periods, ending at each date.
- `shortWindowRegressions(dates, y, x, { period, minObs, lags? })` with `period` `'month'`, `'quarter'`, `'half'` or `'year'`: for each calendar window the OLS $R^e_{it} = \alpha_{iq} + \beta_{iq} R^e_{mt} + \varepsilon_{it}$, its number of days, and, if the paper adds lagged market returns for nonsynchronous trading, the summed beta under `lags`.
- `conditionalAlphaSummary(windows)`: the average conditional alpha with its $t$-statistic from the time series of window alphas, and $\sigma(\hat\beta_{iq})$.
- `unconditionalAlpha(...)` and `alphaBound(sigmaBeta, sigmaLambda)`: the paper's expression for $\alpha^u_i$ in terms of $\mathrm{Cov}(\beta_{it}, \lambda_t)$ and the bound $|\mathrm{Cov}(\beta_{it}, \lambda_t)| \le \sigma(\beta_{it})\,\sigma(\lambda_t)$, with every term defined in a doc comment.

Tests against reference values, each stated in the test: `rollingBetas` and `shortWindowRegressions` on hand-computed short series (one window by hand); `alphaBound` by hand; `unconditionalAlpha` matches a long seeded simulation with time-varying beta and premium within a stated tolerance (seed with `src/lib/math/rng.ts`); and pinned values on the committed daily data from 1964-01 for HML and Mom (or WML): the number of quarters, $\sigma(\hat\beta_{iq})$, the average conditional alpha and its $t$-statistic, the unconditional CAPM alpha from monthly data, and the bound for a stated $\sigma(\lambda_t)$. Reuse `ols` and the RNG helpers; do not copy them. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/shortWindow.ts`, its test and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
