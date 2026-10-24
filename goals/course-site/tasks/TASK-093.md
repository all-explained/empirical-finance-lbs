---
id: TASK-093
title: 'Library: GMM estimation, the J test and the chi-square distribution'
milestone: M-8
state: approved
depends_on: []
delivery: pr
---

## Why


SC-7 and M-8. Chapters 24 and 25 need a general GMM estimator (one-step, two-step, iterated and continuously updated), its sandwich and efficient covariances, the J test with chi-square p-values, and a seeded toy model whose objective surface a widget can draw. Chapters 26 and 27 build on the same code. Nothing in `src/lib` does GMM yet, and `src/lib/math/distributions.ts` has the F distribution but no chi-square.

## Scope


Add `src/lib/stats/gmm.ts` with `src/lib/stats/gmm.test.ts`, `src/lib/math/optimize.ts` with `src/lib/math/optimize.test.ts`, and the chi-square distribution in `src/lib/math/distributions.ts` with tests in `src/lib/math/distributions.test.ts`. Read first: the entries of chapters 24–27 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3, `src/lib/stats/ols.ts` (its private `serialCovariance`, the Newey–West sum), `src/lib/math/distributions.ts`, `src/lib/math/linalg.ts` and `src/lib/math/rng.ts`. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Nagel2013.pdf` (Nagel (2013), NBER working-paper version) with `pdftotext -layout` and cite pages in doc comments for anything you take from it. Cochrane (2005), Ch. 10–11, is a book the owner has not supplied: derive every result from the moment conditions and attribute nothing to it.

Functions:
- `chiSquareCdf(x, df)` and `chiSquareSurvival(x, df)`, through the regularized lower incomplete gamma function built on the existing `logGamma` (series for small $x$, continued fraction for large $x$).
- `minimize(f, x0, options)` in `src/lib/math/optimize.ts`: one small general minimiser (Nelder–Mead is enough for the two or three parameters the chapters use), with a tolerance and an iteration cap, returning the minimiser, the value and the iteration count.
- `longRunCovariance(moments, { lags = 0, demean = true })`: $\hat S = \hat\Gamma_0 + \sum_{j=1}^{L}\big(1 - \tfrac{j}{L+1}\big)(\hat\Gamma_j + \hat\Gamma_j')$ with divisor $T$, for a $T \times$ (number of moments) matrix. Export `serialCovariance` from `src/lib/stats/ols.ts` (add the `export` keyword only; no behaviour change) and build on it rather than copy the sum.
- `gmm(momentFn, theta0, { method, weighting, lags })` with `method` `'one-step'` (fixed `weighting`: `'identity'` or a matrix), `'two-step'`, `'iterated'` (to a tolerance, with an iteration cap) or `'cue'` (the objective $g_T(\theta)'\hat S(\theta)^{-1}g_T(\theta)$). `momentFn(theta)` returns the $T \times L$ moment matrix. Return $\hat\theta$, $g_T(\hat\theta)$, the Jacobian $D = \partial g_T/\partial\theta'$ (central differences), $\hat S$, $W$, the covariance $\tfrac1T (D'WD)^{-1}D'W\hat S W D(D'WD)^{-1}$, its efficient form $\tfrac1T(D'\hat S^{-1}D)^{-1}$ when $W = \hat S^{-1}$, standard errors, and for the efficient methods $J = T\,g_T'\hat S^{-1}g_T$ with its degrees of freedom $L - \dim\theta$ and chi-square p-value (`null` for one-step and for a just-identified model).
- `linearGmm(a, D, W)` for moments linear in the parameters, $g_T(\theta) = a - D\theta$: the closed form $\hat\theta = (D'WD)^{-1}D'Wa$. `gmm` uses it when the caller marks the moments as linear; chapter 26 uses it directly.
- `gmmObjective(gT, W)` and `objectiveSurface(momentFn, W, grid1, grid2)`: the values of $g_T'Wg_T$ on a two-parameter grid, for the widget.
- The toy model of chapters 24 and 25: `simulateToySample(seed, { T, tails })` draws i.i.d. $x_t$ with a fixed mean and variance (state them), normal for `tails: 'normal'`, or a seeded scale mixture of two normals with the same variance for `'fat'`, so every moment the $J$ test needs is finite. `toyMoments(x, count)` gives the moment matrix for $\theta = (\mu, \sigma^2)$ with `count` 2, 3 or 4 of $x_t - \mu$, $(x_t-\mu)^2 - \sigma^2$, $(x_t-\mu)^3$ and $(x_t-\mu)^4 - 3\sigma^4$.
- `simulateJTest(seed, { T, samples, method, tails, count })`: the $J$ statistic of each seeded sample and the rejection rate at 5%, for the `JTestSim` widget.

Notation. Add a "Part VI" block to the `docs/STYLE_GUIDE.md` §3 table now, so chapters 24–27 share one notation from the start (earlier Parts left their candidate symbols to later fix tasks). Proposed symbols, each chosen to avoid a §3 clash: the moment function $g(x_t, \theta)$ with $g_T(\theta) = \tfrac1T\sum_t g(x_t, \theta)$ (the curriculum's $f(x_t,\theta)$ clashes with the factors $f_t$); the Jacobian $D$ (the curriculum's $d$ clashes with the log dividend $d_t$); the weighting matrix $W$ ($w$ is portfolio weights); the long-run covariance $S$; $L$ moments and $\dim\theta$ parameters (the curriculum's $r - k$ clashes with a log return and a factor index); $\mathbb{E}_T[\cdot]$ for a sample mean of a product; demeaned factors $\tilde f_t = f_t - \bar f$; the HJ distance $\delta_{\text{HJ}}$ (with its subscript, so it never reads as the time-discount factor $\delta$); and, for chapter 27, the hypothesised premium $\lambda^{\circ}$ in the GRS-FAR statistic (KZ's $\lambda_{f,0}$ clashes with the zero-beta rate $\lambda_0$ of chapter 17). Extend the existing $\theta$ row rather than adding a second one. If a proposed letter is taken in §3 when you start, choose another, and say so in the outcome. TASK-081 (Part V notation) also adds rows to §3: rebase on `origin/main` before you finish and keep both blocks. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: `chiSquareCdf` at known quantiles (for example 3.841459 with 1 df and 18.307038 with 10 df give 0.95) and the closed form $1 - e^{-x/2}$ for 2 df; `minimize` on the Rosenbrock function; `longRunCovariance` on a hand-made case and equal to the Newey–West covariance inside `ols`; `gmm` on the OLS moments $x_t(y_t - x_t'\theta)$ reproduces `ols()` coefficients and its Newey–West standard errors to 1e-8; just-identified IV equals $(Z'X)^{-1}Z'y$, and over-identified IV with $W = (Z'Z/T)^{-1}$ equals two-stage least squares; `toyMoments` with `count` 2 gives the sample mean and the divisor-$T$ variance (the normal ML estimates) under every method; the efficient covariance is no larger than the identity-weighted one on a seeded sample; `simulateJTest` gives the same output for the same seed, and with normal tails and large $T$ its rejection rate is within simulation error of 5% (state $T$, the sample count and the band). Reuse `ols`, `solve`, `inverse`, `logGamma`, `regularizedBeta` and the RNG helpers; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- `docs/STYLE_GUIDE.md` §3 has one Part VI block with the GMM, SDF and identification symbols, and the outcome lists each symbol with the clash it avoids.
- `git diff --stat origin/main -- src/lib/stats/ols.ts` shows a one-line change (the `export` keyword).
- `git status --short` shows only the files named above and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git diff --stat origin/main -- src/lib/stats/ols.ts
git status --short
