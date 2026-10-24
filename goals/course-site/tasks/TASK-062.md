---
id: TASK-062
title: 'Library: two-pass regressions, Fama–MacBeth and the Shanken correction'
milestone: M-6
state: approved
depends_on: [TASK-061]
delivery: pr
---

## Why


SC-7 and M-6. Chapters 17 and 18 need the cross-sectional regression of mean returns on betas (OLS and GLS), monthly Fama–MacBeth slopes with their standard errors, the cross-sectional R², the Shanken correction and a seeded errors-in-variables simulation in `src/lib`, with tests.

## Scope


Add `src/lib/finance/crossSection.ts` and `src/lib/finance/crossSection.test.ts`. Read first: the entries of chapters 17 and 18 in `docs/CURRICULUM.md`, the notation table in `docs/STYLE_GUIDE.md` §3, and `src/lib/finance/timeSeriesTests.ts` (from the library task this task depends on): take the first-pass betas, residual covariance and factor moments from `timeSeriesRegressions` and the data from `factorPanel`; do not refit them. No reading in `source/papers/` gives these formulas: Cochrane (2005), Ch. 12, is a book the owner has not supplied, and Fama & MacBeth (1973) and Shanken (1992) are not in `source/papers/`. Derive each formula in a doc comment from the model, and attribute nothing to those works beyond the names of the methods.

Functions:
- `crossSectionalRegression(beta, meanExcess, { intercept, weighting, residualCovariance? })` with `weighting` `'ols'` or `'gls'` (weights $\Sigma_\varepsilon^{-1}$): returns `{ lambda, lambda0?, alpha, fitted, r2 }`, with $\hat\lambda = (\hat\beta'\hat\beta)^{-1}\hat\beta'\bar R^e$ for OLS. Define the cross-sectional $R^2$ in a doc comment (with and without intercept) and use that one definition everywhere.
- `famaMacBeth(excess, beta, { intercept })`: the slopes $\hat\lambda_t$ of each month's cross-sectional OLS regression, their mean, $\mathrm{se}(\hat\lambda) = \sigma(\hat\lambda_t)/\sqrt{T}$, the $t$-statistics, the running mean of $\hat\lambda_t$ for a frame-by-frame figure, and the monthly fitted values.
- `shankenCorrection(beta, residualCovariance, factorCovariance, lambda, T, { weighting })`: the naive and the corrected covariance of $\hat\lambda$, $\mathrm{Var}(\hat\lambda) = \tfrac1T\big[(\beta'\beta)^{-1}\beta'\Sigma_\varepsilon\beta(\beta'\beta)^{-1}(1 + c) + \Sigma_f\big]$ with $c = \lambda'\Sigma_f^{-1}\lambda$, the GLS version, and $c$ itself. Write the formula with §3 notation ($\Sigma_\varepsilon$, $\Sigma_f$) and say in a doc comment that $c$ is a squared Sharpe ratio.
- `simulateTwoPass(seed, { N, T, beta, lambda, factorSharpe, residualSd, replications })`: a seeded one-factor world; for each replication the estimated betas, $\hat\lambda$, and the naive and Shanken standard errors; returns the draws of the first replication (for a scatter of $\hat\beta_i$ around $\beta_i$) and the coverage of the naive and corrected 95% intervals over all replications.

Tests against reference values, each stated in the test: `crossSectionalRegression` on a hand-computed three-asset case, OLS and GLS; with constant betas, the Fama–MacBeth mean slope equals the cross-sectional regression on mean returns, and the Fama–MacBeth standard error equals $\sqrt{\tfrac1T(\beta'\beta)^{-1}\beta'\hat\Sigma\beta(\beta'\beta)^{-1}}$ with the divisor-$T$ return covariance (exact identities, to 1e-10); `shankenCorrection` with $\lambda = 0$ gives $c = 0$ and adds only $\Sigma_f/T$; GLS with a traded factor included as a test asset gives $\hat\lambda$ equal to the factor's sample mean; `simulateTwoPass` gives the same output for the same seed, and with many replications and a high factor Sharpe ratio the corrected coverage is closer to 95% than the naive one (state the numbers); and one test on the committed data (FF3 on the 25 portfolios from 1963-07) that pins $\hat\lambda$, the Fama–MacBeth $t$-statistics, the cross-sectional $R^2$ and the naive and corrected standard errors. Reuse `ols`, `inverse`, `solve`, `transpose`, `matMul` and the RNG helpers; do not copy them. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/crossSection.ts`, its test and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
