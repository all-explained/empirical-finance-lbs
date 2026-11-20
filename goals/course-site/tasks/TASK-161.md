---
id: TASK-161
title: 'Library: spanning regressions of bond excess returns on yield components and macro variables, with the Bauer–Hamilton bootstrap'
milestone: M-14
state: approved
depends_on: [TASK-159, TASK-158]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-14. Chapter 45 asks whether anything outside the yield curve forecasts bond returns. In an invertible affine model the state is a function of yields, so the answer should be no; regressions say yes, but with persistent predictors and overlapping returns their size is wrong. The chapter needs the regressions, the bootstrap under the spanning null and a seeded version whose predictor persistence the reader can move. `stambaugh.ts` simulates one persistent predictor; nothing tests a block of them against yield components.

## Scope


Add `src/lib/finance/spanning.ts` and its test file. Read first: the entries of chapters 12, 43 and 45 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the "Bonds and the term structure" table with the rows of the earlier Part XII libraries, the predictability table, and the PCA rows with $Q$ for eigenvectors), the `gsw-zero-coupon` and `fred-macro-monthly` rows of `docs/DATA.md`, `src/lib/finance/affine.ts` (`invertState`, `simulateAffine`), `src/lib/finance/bonds.ts` (`holdingReturns`), `src/lib/stats/pca.ts` (`pca`, `scores`, `gswYields`), `src/lib/stats/ols.ts`, `src/lib/stats/var.ts` (`fitVAR1`), `src/lib/stats/stambaugh.ts` (`quantile`) and `src/lib/math/rng.ts`.

Readings. Open these PDFs with `pdftotext -layout` and cite pages in doc comments for anything you take from them:
- `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/BauerHamilton2018.pdf` (FRBSF working paper 2015-15, May 2017 version; cite the 2018 *Review of Financial Studies* article and name working-paper pdf pages): the spanning hypothesis, pdf p. 7; why the state may not be recoverable from yields (measurement error, hidden factors), pdf p. 8; the predictive regression and its null $\beta_2 = 0$, eq. (1), pdf p. 8; standard-error bias with persistent predictors and overlapping returns, pdf pp. 9–16, with the $R^2$ gain, eq. (13), pdf p. 16; the bootstrap under the null (three principal components, a VAR(1) for them and one for the other predictors, residuals drawn jointly, 5000 samples), pdf pp. 17–18; the growth and inflation predictors of Joslin, Priebsch & Singleton, the sample 1985–2008 and Table 2, pdf pp. 20–21.
- `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Duffee2013.pdf` (the January 2011 final version of "Information in (and not in) the term structure"; cite the 2011 *Review of Financial Studies* article, as `docs/READINGS.md` records, and name pdf pages): yields as an affine function of the state and when the state can be inferred from them, eqs. (12)–(13), pdf pp. 7–8; hidden factors, which move expected returns but not today's yields, pdf pp. 9–13; industrial production growth and CPI inflation, smoothed, as candidate macro drivers, pdf p. 40.
Joslin, Priebsch & Singleton (2014) and Ludvigson & Ng (2009) are not in `source/papers/`: name them only where an opened reading does, with its page, and take no fact from them. Their inflation measure is a survey forecast that is not public; say in a doc comment that ours is realised CPI inflation.

Functions (annual holding periods on monthly observations unless stated; decimal log rates; Hansen–Hodrick standard errors with 12 lags by default, as Part XI):
- `macroPredictors(series)`: from `fred-macro-monthly`, growth as the three-month average of CFNAI (Bauer & Hamilton, pdf p. 20) or, if the data task dropped CFNAI, twelve-month industrial production growth (Duffee, pdf p. 40), and inflation as twelve-month CPI inflation; name the choice in the doc comment.
- `spanningInputs(curve, macro, options)`: for each month, a constant and the first three principal components of yield levels (from `pca` on `gswYields`), the macro predictors, and the excess returns $rx^{(n)}_{t+1}$ at $n$ = 2, 5 and 10 years from `holdingReturns` and their average; the sample from 1985-11 and the months it shares with Bauer & Hamilton's (to 2008-12) as named presets.
- `spanningRegression(inputs, n, options)`: excess returns on the components alone and with the macro predictors added; the slopes, standard errors, the Wald statistic for the null that the macro slopes are 0 with its asymptotic $p$-value, both $R^2$ and adjusted $R^2$, and the gain.
- `spanningBootstrap(seed, inputs, n, options)`: Bauer & Hamilton's bootstrap under the null, as their pdf pp. 17–18 describe; the bootstrap distribution of the $R^2$ gain and of the Wald statistic, the share of samples at or above the data's values (the bootstrap $p$-value), and the size of the asymptotic test at 5%. Option for the number of samples; state the default and the time one call takes on the test machine.
- `simulatedSpanning(seed, params, options)`: a seeded world for the widget in which a macro variable $z_t$ (or the §3 symbol) is an AR(1) with persistence the reader sets, independent of bond returns, and returns are overlapping annual sums of monthly shocks with the persistence of the yield components fitted to our data; the distribution of the $R^2$ gain across samples as long as ours, and its 95th percentile; fast enough to redraw on a slider move (state what you measured).
- `hiddenFactorDemo(seed, options)`: built on `simulateAffine`, a three-factor model whose third factor has (almost) no loading on yields but moves the prices of risk (Duffee, pdf pp. 9–13): the state recovered with `invertState` from noisy yields, its error for the hidden factor, and the share of expected-return variance that the yield components miss.

Notation. §3 has $z_t$ for the state variable of Chapters 22–23 and the human-capital gap of Chapter 14, $x_t$ for a predictor, $Q$ for orthonormal eigenvectors (Bauer & Hamilton write $\hat W$, the GMM weighting matrix here) and $\beta$ only for exposures (Bauer & Hamilton write $\beta_1$, $\beta_2$ for predictive slopes; §3 uses $b$). Choose symbols for the macro predictors, the yield components (the curriculum writes $PC_t$), the $R^2$ gain and the bootstrap draws, and write the curriculum's $b_1$, $b_2$ so they do not read as SDF loadings (as Part XI did with subscripts). Add each to the "Bonds and the term structure" table of §3 with the clash it avoids and the papers' symbol. The other Part XII library tasks add rows to the same table; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: on data simulated under the null, the asymptotic test rejects more than 5% when the predictor is persistent and the returns overlap, and the bootstrap test rejects close to 5% (state the bands and the number of samples); under an alternative where the macro variable enters returns, the bootstrap rejects in most samples; `spanningRegression`'s Wald statistic and $R^2$ match a hand computation on a small fixture; the bootstrap and `simulatedSpanning` are reproducible from their seeds; with no measurement error `hiddenFactorDemo` recovers the two visible factors to 1e-10; and pinned values on the committed data for both presets at $n$ = 2 and 10 (the $R^2$ with and without macro, the Wald $p$-value and the bootstrap $p$-value). Reuse `holdingReturns`, `pca`, `scores`, `ols`, `fitVAR1`, `quantile`, the functions of `affine.ts` and the RNG helpers; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

Where jobs run: the bootstrap runs on the committed files in seconds, on the MacBook; size the default number of samples so `npm test` stays under 2 minutes on one core. Nothing goes to the cluster or the CEMFI PC.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- The outcome sets our $R^2$ with and without macro, and our asymptotic and bootstrap $p$-values, next to Bauer & Hamilton's Table 2 (pdf p. 21), marked as theirs, and says why they differ (predictors, sample, GSW against their yields).
- The outcome states the default number of bootstrap samples and the measured time of `spanningBootstrap` and of `simulatedSpanning`.
- `docs/STYLE_GUIDE.md` §3 "Bonds and the term structure" has rows for the new symbols, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/spanning.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
