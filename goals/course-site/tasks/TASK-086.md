---
id: TASK-086
title: 'Library: linear SDF models by GMM and the Hansen–Jagannathan distance'
milestone: M-8
state: cancelled
depends_on: [TASK-085]
delivery: pr
route: {platform: claude, model: opus, effort: high}
reason: 'duplicate of TASK-093..100: proposal TASK-034 was applied twice'
---

## Why


SC-7 and M-8. Chapter 26 estimates linear SDF models by GMM, shows that first-stage GMM is a cross-sectional regression, maps SDF loadings $b$ to premia $\lambda$, and ranks CAPM, the CCAPM and FF3 on the 25 portfolios by their Hansen–Jagannathan distance. It needs these functions in `src/lib`, with tests, on top of `gmm.ts`.

## Scope


Add `src/lib/finance/sdfGmm.ts` and `src/lib/finance/sdfGmm.test.ts`. Read first: the entry of chapter 26 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the Part VI block from the library task this task depends on), `docs/DATA.md` (French and cay notes), `src/lib/stats/gmm.ts`, `src/lib/finance/conditional.ts` (`quarterlyPanel`), `src/lib/finance/crossSection.ts`, `src/lib/finance/timeSeriesTests.ts` and `src/lib/finance/portfolio.ts`. Open these PDFs with `pdftotext -layout` and cite pages in doc comments: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Nagel2013.pdf` (Nagel (2013): the linearised SDF and the GMM estimator for excess returns) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GospodinovKanRobotti2019.pdf` (Gospodinov, Kan & Robotti (2019): the SDF form and the HJ distance). Cochrane (2005), Ch. 13, and Hansen & Jagannathan (1997) are not in `source/papers/`: derive the results from the moment conditions and attribute nothing to them.

Functions (decimal excess returns, $T \times N$, and factors, $T \times K$):
- `linearSdfGmm(excess, factors, { weighting, lags })` for $M_{t+1} = 1 - b'\tilde f_{t+1}$ with $\tilde f = f - \bar f$ (demeaned in sample), moments $R^e_t(1 - \tilde f_t'b)$, so $g_T(b) = \mathbb{E}_T[R^e] - \mathbb{E}_T[R^e\tilde f']\,b$. `weighting` is `'identity'` (first stage), `'hj'` ($W = \mathbb{E}_T[R^eR^{e\prime}]^{-1}$) or `'efficient'` (second stage, $W = \hat S^{-1}$ from `longRunCovariance`). Solve with `linearGmm`. Return $\hat b$, $\hat\lambda = \hat\Sigma_f\hat b$ (divisor $T$), the pricing errors $g_T(\hat b)$, actual and fitted mean excess returns, standard errors of $b$ and $\lambda$ from the GMM sandwich, and for `'efficient'` the $J$ statistic with $N - K$ degrees of freedom. Say in a doc comment that the standard errors treat the factor means as known.
- `hjDistance(excess, factors)`: $\delta_{\text{HJ}} = \sqrt{\min_b g_T(b)'\,\mathbb{E}_T[R^eR^{e\prime}]^{-1}g_T(b)}$, with the minimising $b$ and the pricing errors; `factors` may have zero columns ($b$ is empty and $g_T = \mathbb{E}_T[R^e]$).
- `sdfModelFits(panel, models)` on the `QuarterlyPanel` of `quarterlyPanel` for `'capm'` (Mkt-RF), `'ccapm'` ($\Delta c$) and `'ff3'`: for each model the first-stage and HJ-weighted fits, $\delta_{\text{HJ}}$, the second-stage $J$ and p-value, and the 25 pricing errors.

Tests against reference values, each stated in the test: with `'identity'`, $\hat\lambda$ equals the $\hat\lambda$ of `crossSectionalRegression` on the full-sample betas of `timeSeriesRegressions` with no intercept and OLS weighting, to 1e-10 (first-stage GMM is a cross-sectional regression); with no factors, $\delta_{\text{HJ}}^2 = SR^2/(1 + SR^2)$, where $SR^2$ is `maxSharpeSquared` of the test assets with the same covariance divisor (state it); when the test assets are the factors themselves, the pricing errors and $\delta_{\text{HJ}}$ are 0; the `'efficient'` $J$ matches a hand computation on a two-asset seeded case; and pinned values on the committed data: the quarters of the panel from 1963-Q3 to its last full quarter, and $\hat\lambda$, $\delta_{\text{HJ}}$ and $J$ of each model. Reuse `gmm`, `linearGmm`, `longRunCovariance`, `chiSquareSurvival`, `quarterlyPanel`, `timeSeriesRegressions`, `crossSectionalRegression`, `sampleMeans`, `sampleCovariance` and `maxSharpeSquared`; do not copy them. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/sdfGmm.ts`, its test and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
