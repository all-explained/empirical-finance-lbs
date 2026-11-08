---
id: TASK-145
title: 'Library: the Cochrane–Piazzesi tent factor, its single-factor loadings and forecasts with yield principal components'
milestone: M-13
state: approved
depends_on: [TASK-143]
delivery: pr
---

## Why


SC-7 and M-13. Chapter 42 shows that one combination of forward rates, shaped like a tent, forecasts the excess returns of bonds of every maturity, and that level, slope and curvature miss most of it. It needs the Cochrane–Piazzesi regressions, the single-factor loadings, forecasts with principal components of yield levels, and the tent on subsamples. `pca.ts` has principal components but only of yield changes; nothing runs the regressions. It needs the curve arithmetic of the bond library.

## Scope


Add `src/lib/finance/bondRiskPremia.ts` and its test file, and add `gswYieldLevels` to `src/lib/stats/pca.ts` with its test. Read first: the entry of chapter 42 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the "Bonds and the term structure" table, the Factor models table, where $f_t$ is a factor, and the Probability and statistics table), `src/lib/finance/bonds.ts` (from the library task this task depends on), `src/lib/stats/pca.ts` (`pca`, `scores`, `gswYieldChanges`), `src/lib/stats/ols.ts` and `src/lib/math/linalg.ts`.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CochranePiazzesi2005.pdf` (the published *American Economic Review* article; journal page = pdf page + 137; cite journal pages) with `pdftotext -layout`, and cite pages in doc comments for anything you take from it: notation, the forward-rate vector with its intercept and the average excess return across maturities 2–5, p. 141; the unrestricted regressions, eq. (1), the single-factor model, eq. (2), and the two-step estimate, p. 142; Table 1 (the factor, its standard errors and $R^2$, and the loadings $b_n$), p. 143; the tent in Figure 1, p. 140; the Fama–Bliss data of one- to five-year zero-coupon bonds, 1964–2003, p. 142 and the note of Table 1; principal components of yields and forecasts with them, Figure 2, p. 141, and Table 4 with the variance shares of the five components, p. 147; measurement error, pp. 151–153. The paper's Appendix, which it cites for subsample stability (p. 159), is not in `source/papers/`: take no fact from it.

Functions (annual holding periods on monthly observations, maturities 1–5 years as in the paper, decimal log rates; Hansen–Hodrick standard errors with 12 lags by default, with Newey–West with 18 lags as an option, as Table 1):
- `cpInputs(curve, range)`: for each month, the forward-rate vector $[1, y^{(1)}_t, f^{(2)}_t, \dots, f^{(5)}_t]$, the excess returns $rx^{(n)}_{t+1}$ for $n = 2, \dots, 5$ from `holdingReturns`, and their average across maturities.
- `tentFactor(inputs, options)`: the weights of the regression of the average excess return on the forward-rate vector, their standard errors, $R^2$, and the factor series (the weights times the vector).
- `singleFactorLoadings(inputs, weights)`: the loadings $b_n$ from regressions of each $rx^{(n)}_{t+1}$ on the factor, their standard errors and $R^2$, against the unrestricted regressions on all forward rates (Figure 1, p. 140); the four loadings average to 1 (derive why in a doc comment).
- `gswYieldLevels(series, maturities)` in `pca.ts`: the panel of yield levels, decimal, next to `gswYieldChanges`, through the same private helper.
- `yieldFactorForecasts(inputs, curve)`: the principal components of the 1- to 5-year yield levels with `pca`, their variance shares, and the $R^2$ of the average excess return on the level, on level and slope, on level, slope and curvature, and on all five (which equals the tent's), as Table 4 (p. 147); the share of the factor's variance the first three components explain.
- `subsampleTents(curve, ranges)`: `tentFactor` on named date ranges. Default ranges: the full sample from 1985-11, the months it shares with the paper's sample (to 2003-12), and the months after the paper's sample (from 2004-01). Each range is stated by its first and last month of $t$.

Notation. §3 keeps $\gamma$ for risk aversion only, $b$ for SDF loadings, $f_t$ for a vector of factors and a bar for a sample mean. The paper writes $\gamma$ for the tent weights, $f_t$ for the forward-rate vector, $b_n$ for the loadings and $\overline{rx}_{t+1}$ for the average excess return. Choose a symbol for each that avoids those clashes (for example $\vartheta$ for the weights, a bold or upright symbol for the forward-rate vector, $b^{(n)}$ with the maturity superscript, and an italic name such as $\mathit{cp}_t$ in the `\Signal` colour for the factor), and write the average excess return so it does not read as a sample mean. Add each to the "Bonds and the term structure" table of §3, with the clash it avoids and the paper's symbol. The other two Part XI library tasks add rows to the same table; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: on simulated data whose average excess return is an exact linear function of the forward rates plus seeded noise, `tentFactor` recovers the weights within a stated band; when every $rx^{(n)}$ is $b_n$ times one factor plus noise, `singleFactorLoadings` recovers $b_n$ and the restricted and unrestricted $R^2$ are close; the loadings average to 1 to 1e-12 on the committed data; the five-component $R^2$ equals the tent's $R^2$ to 1e-10; the variance shares sum to 1; `gswYieldLevels` differenced equals `gswYieldChanges` to 1e-14; and pinned values on the committed `gsw-zero-coupon` for the weights, $R^2$ and loadings on each default range. Reuse `holdingReturns`, `forwardRates`, `pca`, `scores` and `ols`; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- The outcome compares the weights, $R^2$ and loadings on each default range with Cochrane & Piazzesi's Table 1 (p. 143), marked as theirs, says whether our weights are tent-shaped, and says why they may differ (sample years, GSW fitted curves against Fama–Bliss prices).
- `docs/STYLE_GUIDE.md` §3 "Bonds and the term structure" has rows for the new symbols, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/bondRiskPremia.ts`, its test, `src/lib/stats/pca.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
