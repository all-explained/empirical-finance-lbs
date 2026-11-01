---
id: TASK-113
title: 'Library: instrumented PCA by alternating least squares, managed portfolios and the alpha test'
milestone: M-10
state: approved
depends_on: []
delivery: pr
---

## Why


SC-7 and M-10. Chapter 32 lets betas depend on firm characteristics, $\beta_{i,t} = z_{i,t}'\Gamma_\beta$, and estimates the model by alternating least squares, as Kelly, Pruitt & Su (2019) do. It needs a seeded characteristics panel, the managed portfolios $Z_t'r_{t+1}$, the ALS fit with its iteration history, the two $R^2$ measures of the paper and the bootstrap test of $\Gamma_\alpha = 0$. Nothing in `src/lib` does this.

## Scope


Add `src/lib/finance/ipca.ts` and `src/lib/finance/ipca.test.ts`. Read first: the entry of chapter 32 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (with the Part V block, where $z_t$ is a state variable, and the Part VII block), `src/lib/stats/pca.ts`, `src/lib/math/linalg.ts` (`symmetricEigen`, `solve`, `inverse`), `src/lib/finance/crossSection.ts` (`famaMacBeth`) and `src/lib/math/rng.ts`. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/KellyPruittSu2018.pdf` (Kelly, Pruitt & Su, NBER working paper of April 2018; published in the *Journal of Financial Economics* in 2019) with `pdftotext -layout` and cite working-paper pages in doc comments for the model (pp. 10–12), the first-order conditions (eqs. 6–7), the normalisation (p. 13), the managed portfolios and the start value (eq. 9, p. 14), the case $K = L$ (p. 15), the rank transform of characteristics, the total and predictive $R^2$ (eqs. 14–15), the ALS method of its Appendix A and the residual bootstrap of $W_\alpha$ (section 3.1). Where the paper differs from this spec, follow the paper and report the difference in the outcome.

Functions:
- `simulateIpcaPanel(seed, { N, T, L, K, alphaShare, noise })`: a seeded panel of $N$ firms over $T$ months with $L$ persistent characteristics (a constant included), rank-transformed each month to $[-0.5, 0.5]$ as the paper does, true $\Gamma_\beta$ ($L \times K$), true $\Gamma_\alpha$ (zero when `alphaShare` is 0), factors and returns. State every parameter's default in a doc comment and keep the defaults small enough for a widget.
- `managedPortfolios(Z, r)`: $x_{t+1} = Z_t'r_{t+1}$ and $W_t = Z_t'Z_t$ for every month (state whether you divide by the number of firms, as the paper does or does not).
- `ipcaFit(managed, { K, alpha, tolerance, maxIterations })`: alternating least squares on the managed portfolios and $W_t$ alone. The first-order conditions need only these two, because $\sum_t [Z_t \otimes f_t']'[Z_t \otimes f_t'] = \sum_t W_t \otimes f_t f_t'$ and $\sum_t [Z_t \otimes f_t']' r_t = \sum_t x_t \otimes f_t$; show this in a doc comment. Start from the first $K$ eigenvectors of $\sum_t x_t x_t'$, impose the paper's normalisation after convergence, and return $\Gamma_\beta$, $\Gamma_\alpha$ (when `alpha` is true), the factors, the risk-price estimate $\hat\lambda$ (the factor means) and the history of the objective and of the largest change per iteration, for the convergence animation.
- `ipcaR2(panel, fit)`: the total and predictive $R^2$ of the paper, on the firm-level panel.
- `alphaTest(seed, managed, fit, { bootstraps })`: $W_\alpha = \hat\Gamma_\alpha'\hat\Gamma_\alpha$ and its $p$-value from the paper's residual (wild) bootstrap of the managed portfolios under $\Gamma_\alpha = 0$. Keep the default `bootstraps` small enough that the unit tests finish in a few seconds (the paper uses 1,000); give long tests an explicit timeout (issue #67).

Notation. §3 uses $z_t$ for a state variable (Part V), $x_t$ for a predictor or signal and $W$ for a GMM weighting matrix. Choose symbols for the characteristics $z_{i,t}$ and $Z_t$, the managed portfolios, $\Gamma_\beta$, $\Gamma_\alpha$, the number of characteristics $L$ (§3 has $L$ for Newey–West lags and an eigenvalue matrix), the cross-product $Z_t'Z_t$ and the statistic $W_\alpha$; check each against §3, and add them to one "Part VIII" block of the §3 table, each with the clash it avoids. If the curriculum's letter is taken, keep it out of the code names too. The other three Part VIII library tasks add rows to the same block: whichever merges first creates the block heading; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: `managedPortfolios` matches a hand computation on a three-firm, two-characteristic case; with $K = L$ the IPCA factors equal the period-by-period Fama–MacBeth slopes of `famaMacBeth` on the same characteristics (p. 15); on a large seeded panel with known $\Gamma_\beta$ the fit recovers its column space (state the measure and the tolerance) and the objective never rises across iterations; the normalisation holds ($\Gamma_\beta'\Gamma_\beta = I$, diagonal factor covariance in descending order, non-negative factor means); `ipcaR2` is 1 on a noiseless panel; `alphaTest` gives the same output for the same seed, a large $p$-value when the true $\Gamma_\alpha$ is zero and a small one when `alphaShare` is large (state both). Reuse `symmetricEigen`, `solve`, `inverse`, `famaMacBeth` and the RNG helpers; do not copy them. Out of scope: chapters, widgets, real data, and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- `docs/STYLE_GUIDE.md` §3 has a Part VIII block with the IPCA symbols, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/ipca.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
