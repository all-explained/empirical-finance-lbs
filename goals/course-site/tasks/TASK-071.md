---
id: TASK-071
title: 'Library: conditional betas, scaled factors and the scaled CCAPM'
milestone: M-7
state: approved
depends_on: []
delivery: pr
---

## Why


SC-7 and M-7. Chapter 22 needs a seeded world where a conditional CAPM holds and the unconditional one fails, the decomposition E[R] = E[β]E[λ] + Cov(β, λ), scaled factors and managed portfolios, and a quarterly panel that fits CAPM, FF3, the CCAPM and the cay-scaled CCAPM on the 25 portfolios, in `src/lib`, with tests.

## Scope


Add `src/lib/finance/conditional.ts` and `src/lib/finance/conditional.test.ts`. Read first: the entry of chapter 22 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3, `docs/DATA.md` (French and cay notes), `src/lib/finance/cay.ts` (`cayInputs`, `fullSampleCay`), `src/lib/finance/timeSeriesTests.ts` and `src/lib/finance/crossSection.ts`. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/LettauLudvigson2001b.pdf` (Lettau & Ludvigson (2001, JPE)) with `pdftotext -layout` for the scaled CCAPM and its timing, and cite pages in doc comments. Cochrane (2005), Ch. 8, is a book the owner has not supplied: derive the managed-portfolio argument from the model and attribute nothing to it.

Functions:
- `simulateConditionalCapm(seed, { T, beta0, betaSlope, lambda0, lambdaSlope, stateRho, stateSd, marketSd, residualSd })`: a seeded state $z_t$ (AR(1)), $\beta_t = \beta_0 + b\,z_t$, $\lambda_t = \lambda_0 + l\,z_t$, market excess returns with conditional mean $\lambda_t$, and an asset with $\mathbb{E}_t[R^e_{i,t+1}] = \beta_{it}\lambda_t$. Returns the paths, the unconditional OLS alpha and beta, and the parts $\overline{\beta}\,\overline{\lambda}$ and $\widehat{\mathrm{Cov}}(\beta_t, \lambda_t)$.
- `betaPremiumDecomposition(beta, lambda)`: $\overline{\beta\lambda} = \overline{\beta}\,\overline{\lambda} + \widehat{\mathrm{Cov}}(\beta, \lambda)$ with the divisor $T$, so the identity is exact in sample.
- `scaledFactors(factors, z)`: the columns $f_{t+1}$, $z_t$ and $z_t f_{t+1}$ (state the timing); `managedPortfolios(excess, z)`: $R^e_{t+1} \otimes (1, z_t)$.
- `quarterlyPanel({ ff3, ff25, cay }, { start, end? })`: compound the monthly French returns into calendar quarters, align them with the quarter dates of `fred-cay-quarterly`, and return quarterly decimal excess returns of the 25 portfolios, the quarterly factors, log consumption growth $\Delta c_{t+1}$ from `cayInputs`, and $cay_t$ from `fullSampleCay`. Say in a doc comment that full-sample $cay$ uses future data, as the paper's does.
- `conditionalModelFits(panel, models)` for `'capm'`, `'ff3'`, `'ccapm'` ($\Delta c$) and `'scaled-ccapm'` ($cay_t$, $\Delta c_{t+1}$, $cay_t \Delta c_{t+1}$): first-pass betas with `timeSeriesRegressions`, second pass with `crossSectionalRegression` (intercept, OLS), returning $\hat\lambda$, fitted and actual mean returns and the cross-sectional $R^2$.

Tests against reference values, each stated in the test: `simulateConditionalCapm` gives the same output for the same seed; with $b = 0$ or $l = 0$ the unconditional alpha is within sampling error of zero for large $T$ (state the numbers); `betaPremiumDecomposition` holds to 1e-12; `scaledFactors` and `managedPortfolios` on a hand-made case; `quarterlyPanel` compounds one quarter by hand from the committed data and lines up with the cay dates; and pinned values on the committed data: the sample quarters, and $\hat\lambda$ and the cross-sectional $R^2$ of each model. Reuse `timeSeriesRegressions`, `crossSectionalRegression`, `cayInputs`, `fullSampleCay`, `grossGrowth`, `ols` and the RNG helpers; do not copy them. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/conditional.ts`, its test and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
