---
id: TASK-160
title: 'Library: the Adrian–Crump–Moench three-step estimator on GSW, with fitted yields and the term premium'
milestone: M-14
state: approved
depends_on: [TASK-159, TASK-157]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-14. Chapter 44 estimates an affine model with three sets of OLS regressions instead of maximum likelihood, and reads the history of the term premium it implies. It needs monthly yields at monthly maturities from the Svensson parameters, principal components of yields as the state, the three steps of Adrian, Crump & Moench, and the recursions of the affine library to turn the estimates into yields and term premia. `ols.ts` and `pca.ts` give the regressions and components; nothing chains them.

## Scope


Add `src/lib/finance/acm.ts` and its test file, and add `svenssonYield` and `gswMonthlyCurve` to `src/lib/finance/bonds.ts` with tests. Read first: the entries of chapters 43 and 44 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the "Bonds and the term structure" table, with the rows the affine library added), the `gsw-zero-coupon` and `gsw-svensson-parameters` rows and notes of `docs/DATA.md`, `src/lib/finance/affine.ts` (from the library task this task depends on), `src/lib/finance/bonds.ts`, `src/lib/stats/pca.ts` (`pca`, `scores`, `gswYields`), `src/lib/stats/ols.ts`, `src/lib/stats/var.ts` (`fitVAR1`) and `src/lib/math/linalg.ts`.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/AdrianCrumpMoench2013.pdf` (New York Fed Staff Report 340, revised April 2013; cite the 2013 *Journal of Financial Economics* article and name working-paper pdf pages; printed page = pdf page − 2) with `pdftotext -layout`, and cite pages in doc comments for anything you take from it: the return-generating process and its stacked form, eqs. (12)–(13), pdf p. 8; the three steps, eqs. (14)–(17), pdf p. 9; the asymptotic variance of $\hat\beta$, eqs. (19)–(20), pdf p. 10; the recursions and $\beta^{(n)\prime} = B_n'$, eqs. (25)–(28), pdf pp. 11–12; the data (GSW curves rebuilt from their parameters at 3 to 120 months, the one-month yield as the risk-free rate, excess returns at $n$ = 6, 18, 24, …, 60, 84 and 120 months, $N = 12$), pdf p. 16; the sample 1987-01 to 2011-12, $T = 300$, and $\delta_0$, $\delta_1$ from a regression of the short rate on the factors, pdf p. 17; five factors, pdf p. 19; $\mu = 0$ for demeaned components and the size of the yield pricing errors (Table 2), pdf p. 20; the prices of risk (Table 3), pdf p. 21; $\hat\beta^{(n)}$ against $B_n$ (Fig. 4), pdf pp. 24 and 61. Gürkaynak, Sack & Wright (2007) is the data citation, not a reading: state about it only what `docs/DATA.md` states.

Functions (one period is one month; decimal log rates per month inside, annualised by 12 on output):
- `svenssonYield(params, m)` in `bonds.ts`: the continuously compounded yield at maturity $m$ years from `BETA0`–`BETA3`, `TAU1`, `TAU2` (write the formula in the doc comment and say where it comes from as `docs/DATA.md` does). `gswMonthlyCurve(params, monthsList)`: the panel of log yields at the chosen maturities in months, on the dates of `gsw-svensson-parameters`. GSW fit coupon bonds, so the fitted curve is least reliable at the shortest maturities; name that limit in a code comment, and say where Adrian, Crump & Moench use it anyway.
- `acmInputs(params, options)`: the yields at 3 to 120 months, their first $K$ principal components (default 5) of demeaned yields as the state $X_t$, the one-month yield as the short rate, and the monthly log excess returns at the paper's 12 maturities, each from `gswMonthlyCurve` with $p^{(n-1)}_{t+1}$ read from the next month's curve; a date range option with the paper's sample (1987-01 to 2011-12) and ours (all months) as named presets.
- `acmEstimate(inputs)`: step 1, the VAR of the state by OLS, its residuals $\hat v_{t+1}$ and $\hat\Sigma$; step 2, each excess return on a constant, $\hat v_{t+1}$ and $X_t$, giving $\hat a$, $\hat\beta$, $\hat c$ and $\hat\sigma^2$; step 3, $\hat\lambda_0$ and $\hat\lambda_1$ from the cross-sectional regressions of eqs. (16)–(17); $\hat\delta_0$, $\hat\delta_1$ from the short rate on the state; and the model for `affine.ts` that these define. Standard errors of $\hat\beta$ from eq. (20); say in the doc comment that the paper's $\hat\lambda$ errors (its Appendix) are not computed.
- `acmStepRegressions(inputs, estimate, choice)`: the one-regressor scatter of each step for a `RegressionLab` view: a state component on its own lag (step 1), one maturity's excess return on one innovation (step 2), and, across the 12 maturities, $\hat c$ for one state component against $\hat\beta$ for the same component (step 3), each with its fitted line and the value the full estimate gives, so the chapter can say what a single regression shows and what it leaves out.
- `acmFit(inputs, estimate, maturities)`: fitted yields, risk-neutral yields and term premia from the affine recursions for every month; the yield pricing errors by maturity (mean and standard deviation in basis points, as Table 2); and $\hat\beta^{(n)}$ against $B_n$ (as Fig. 4).

Notation. Use the §3 symbols the affine library added for the state, its VAR, the short rate and the prices of risk. Add rows to the "Bonds and the term structure" table for the new ones: the exposures $\beta^{(n)}$ (a factor exposure, as $\beta$ is everywhere in §3, with the maturity superscript), the paper's $a$, $c$ and $e_{t+1}$ of step 2 ($a$ is an intercept here too; choose a symbol for $c$, which is log consumption, and for the return pricing error, which the paper writes $e_{t+1}$, a 2×3 residual in Chapter 19), its $\sigma^2$ (§3's $\sigma$ is a return's standard deviation; for example $\sigma^2_e$ or the symbol you choose for the error), $B^\star$ and $\iota$ (§3 writes the vector of ones $\mathbf{1}$), each with the clash it avoids and the paper's symbol. The other Part XII library tasks add rows to the same table; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: `svenssonYield` reproduces every committed `SVENY01`–`SVENY30` of `gsw-zero-coupon` within the rounding of the published values (state the largest gap; a larger one means GSW revised the curve, and the outcome must say so); on data simulated from a known affine model with `simulateAffine`, a long seeded sample recovers $\Phi$, $\beta$, $\lambda_0$ and $\lambda_1$ within stated bands, and the fitted yields equal the simulated ones to a stated tolerance; $\hat\beta^{(n)}$ is close to $B_n$ on our data (state the largest gap, as Fig. 4); step 3 equals eq. (18) computed directly, to 1e-10; and pinned values on the committed data for both presets: $\hat\lambda_0$, the diagonal of $\hat\lambda_1$, the yield pricing errors at 2 and 10 years, and the 10-year term premium at three named months. State the time one `acmEstimate` plus `acmFit` takes on the test machine; it must be low enough to run in a widget on load. Reuse `pca`, `scores`, `ols`, `fitVAR1` and the functions of `affine.ts` and `bonds.ts`; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

Where jobs run: the estimate runs in milliseconds on the committed files, on the MacBook. Nothing goes to the cluster or the CEMFI PC.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- The outcome compares, on the paper's sample preset, our yield pricing errors with Table 2 (pdf p. 20) and our $\hat\lambda_0$ and $\hat\lambda_1$ with Table 3 (pdf p. 21), marked as theirs, and says why they may differ (GSW vintage, our rebuild of the curve, sign and scale of the principal components).
- The outcome states the largest gap between `svenssonYield` and the committed GSW yields, and the measured time of one estimate and fit.
- `docs/STYLE_GUIDE.md` §3 "Bonds and the term structure" has rows for the new symbols, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/acm.ts`, its test, `src/lib/finance/bonds.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
