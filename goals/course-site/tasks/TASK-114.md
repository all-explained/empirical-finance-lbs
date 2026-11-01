---
id: TASK-114
title: 'Library: characteristic portfolios from cross-sectional regressions, and factor-mimicking portfolios'
milestone: M-10
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-10. Chapter 33 turns a characteristic into a tradable portfolio, by sorting or by a cross-sectional regression whose slope is itself a portfolio return, and builds a portfolio that mimics a non-traded factor (consumption growth) by projecting it on the 25 size–value portfolios. `src/lib` has Fama–MacBeth slopes and a quarterly panel with consumption growth, but not the slope weights, sort weights or the mimicking projection.

## Scope


Add `src/lib/finance/mimicking.ts` and `src/lib/finance/mimicking.test.ts`. Read first: the entry of chapter 33 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (with the Part V and Part VII blocks), `docs/DATA.md`, `src/lib/finance/crossSection.ts` (`famaMacBeth`), `src/lib/stats/ols.ts`, `src/lib/finance/conditional.ts` (`quarterlyPanel`: quarterly excess returns of the 25 portfolios, FF3 and consumption growth `dc`, the series chapters 22 and 26 use), `src/lib/finance/factors.ts`, `src/lib/finance/timeSeriesTests.ts` (`factorPanel`) and `src/components/plots/sizeValueSample.ts` (the 5×5 grid of chapter 19). Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/FamaFrench1992.pdf` (Fama & French (1992), published version) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/KellyPruittSu2018.pdf` (Kelly, Pruitt & Su, NBER working paper of 2018) with `pdftotext -layout` and cite pages in doc comments for the Fama–MacBeth regressions on size and book-to-market and for the reading of cross-sectional slopes as managed portfolios. Giglio & Xiu (2021) discuss the omitted-variable bias of mimicking portfolios built on a few base assets (`/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GiglioXiu2021.pdf`, pp. 1954–1955); cite it where a doc comment makes that point.

Functions:
- `slopeWeights(Z)`: for an $N \times L$ characteristics matrix with a constant, the rows of $(Z'Z)^{-1}Z'$; each row is a portfolio with unit exposure to its own characteristic and zero exposure to the others.
- `slopePortfolios(returns, Z)`: the per-period cross-sectional slopes, which equal the slope-weight portfolio returns; with time-varying $Z_t$ use the characteristics known at $t$ for the return at $t+1$.
- `ff25Characteristics()`: the size and book-to-market quintile scores of the 25 portfolios, read from the column names (`ME1 BM1`, …), centred, with a constant, in the column order of `ff25-size-bm-monthly`.
- `sortWeights(scores, { long, short })`: the weights of a long–short sort on one score (for example the value column minus the growth column, each equally weighted), so the chapter can set them next to `slopeWeights`.
- `mimickingPortfolio(factor, baseExcess, { split })`: the projection $f_t = c + w'R^e_t + e_t$ by OLS, with the weights $w$, the mimicking return $w'R^e_t$, its correlation with the factor in sample, and, when `split` is set, the correlation on the later months of weights estimated on the earlier ones (say in the doc comment that 25 regressors on a few hundred quarters overfit).
Real data: the 25 portfolios monthly from 1963-07 for the slope portfolios, and `quarterlyPanel` (from 1963-Q3) for the consumption-growth projection. The curriculum's data line names `fred-consumption-quarterly`; use the `dc` of `quarterlyPanel` instead, so chapters 22, 26 and 33 show one consumption series, and report the mismatch in the outcome.

Notation. The curriculum writes $\hat\gamma_t$ for the slopes, $Z_t$ for characteristics and $c$, $w$, $e_t$ for the projection; §3 has $\gamma$ as risk aversion, $c_t$ as log consumption, $e$ as a chapter 19 residual and $w$ as portfolio weights. Use the Part VIII symbols for the characteristics if the IPCA library has merged (rebase first); otherwise choose them. Choose free letters for the slopes and the projection, check each against §3, and add them to one "Part VIII" block of the §3 table, each with the clash it avoids. The other three Part VIII library tasks add rows to the same block: whichever merges first creates the block heading; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: `slopeWeights(Z)` times $Z$ is the identity; `slopePortfolios` equals the slopes of `famaMacBeth` on the same panel to 1e-10; `ff25Characteristics` gives the scores of a hand-written table for four corner portfolios; `sortWeights` sums to zero and has unit exposure to its score; `mimickingPortfolio` on a factor that is an exact portfolio of the base assets returns those weights and a correlation of 1; and pinned values on the committed data: the correlation of the book-to-market slope portfolio with HML (monthly, 1963-07 on) and its mean and $t$-statistic, the in-sample correlation of `dc` with its mimicking portfolio on the 25 portfolios, the same with the three FF3 factors as base assets, and the split-sample correlation (state the split). Reuse `famaMacBeth`, `ols`, `quarterlyPanel`, `factorPanel`, `sampleMeans` and `sampleCovariance`; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- `docs/STYLE_GUIDE.md` §3 has a Part VIII block with the slope and projection symbols, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/mimicking.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
