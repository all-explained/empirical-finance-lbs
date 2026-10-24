# TASK-093 outcome: Library: GMM estimation, the J test and the chi-square distribution

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX
  macro check.
  Evidence: `npm test` on the rebased branch: 54 files, 572 tests passed, exit 0 (run twice in a row, both green;
  `tests/notation.test.ts` included). Reference values per export:
  `chiSquareCdf`/`chiSquareSurvival`: scipy 1.18.1 `chi2.ppf(0.95, 1) = 3.8414588206941205` and
  `chi2.ppf(0.95, 10) = 18.307038053275146` give 0.95 to 1e-13; three more scipy CDF values; the closed form
  $1 - e^{-x/2}$ for 2 df; `chi2.sf(150, 4) = 2.035764090974152e-31` to 11 relative digits.
  `minimize`: Rosenbrock from $(-1.2, 1)$ reaches $(1, 1)$ to 5e-9 with value below 1e-16; a shifted 3-D quadratic.
  `longRunCovariance`: two hand-made cases (scalar 1, 2, 3, 4 with one lag gives 1.5625; a 2 × 2 case), and equal to
  the Newey–West covariance inside `ols()` through $T(X'X)^{-1}\hat S(X'X)^{-1}$ to 12 relative digits.
  `gmmObjective`: $g = (1, 2)$, $W = [[2, 1], [1, 3]]$ gives 18.
  `linearGmm`: just-identified IV equals $(Z'X)^{-1}Z'y$; over-identified IV with $W = (Z'Z/T)^{-1}$ equals 2SLS
  built from two `ols()` calls.
  `gmm`: on $x_t(y_t - x_t'\theta)$ it reproduces `ols()` coefficients and Newey–West (3 lags) standard errors
  within 1e-8 under all four methods, in closed form and through Nelder–Mead; IV and 2SLS as above; $J = T \times$
  minimised objective with the χ² p-value; the efficient covariance equals $\tfrac1T(D'WD)^{-1}$ and $D$ equals the
  exact Jacobian $-\mathbb{E}_T[z_t x_t']$; `toyMoments` count 2 gives the sample mean and divisor-$T$ variance
  within 1e-8 under every method; one-step identity covariance minus two-step covariance is positive semi-definite
  (smallest eigenvalue ≥ 0) on a seeded fat-tailed sample.
  `objectiveSurface`: equals `gmmObjective` at a grid point; its grid minimum sits next to the estimate.
  `simulateToySample`: same seed, same draws; at $T = 200000$ the mean (0.5), variance (1) and excess kurtosis
  (0 normal, 6.75 fat) are within about 4 standard errors. `toyMoments`: $x = 2$, $\theta = (0.5, 1)$ gives
  $(1.5, 1.25, 3.375, 2.0625)$.
  `simulateJTest`: same seed, same output; with normal tails, $T = 500$, 400 samples, count 3, two-step, the
  rejection rate is 0.050, inside the band $5\% \pm 3.3$ points (3 simulation standard errors of 1.1 points).
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `Result (167 files): - 0 errors - 0 warnings`, `24 page(s) built`, `[build] Complete!`, exit 0.
- [x] `docs/STYLE_GUIDE.md` §3 has one Part VI block with the GMM, SDF and identification symbols, and the outcome
  lists each symbol with the clash it avoids.
  Evidence: the new table "Part VI: GMM, SDF estimation and identification (Chapters 24–27)" sits after TASK-081's
  Part V table; the existing $\theta$ row in "Probability and statistics" is extended, not duplicated. See the
  symbol list under Summary.
- [x] `git diff --stat origin/main -- src/lib/stats/ols.ts` shows a one-line change (the `export` keyword).
  Evidence: `src/lib/stats/ols.ts | 2 +-`, `1 file changed, 1 insertion(+), 1 deletion(-)`.
- [x] `git status --short` shows only the files named above and this task's outcome file.
  Evidence: the branch changes `docs/STYLE_GUIDE.md`, `src/lib/math/distributions.ts`,
  `src/lib/math/distributions.test.ts`, `src/lib/math/optimize.ts`, `src/lib/math/optimize.test.ts`,
  `src/lib/stats/gmm.ts`, `src/lib/stats/gmm.test.ts`, `src/lib/stats/ols.ts` and this file; `git status --short`
  is empty after the commit.

## Summary

**What.**
- `src/lib/math/distributions.ts`: `chiSquareCdf`, `chiSquareSurvival` through the regularized incomplete gamma
  function on the existing `logGamma` (series below $x/2 = a + 1$, Lentz continued fraction above). The survival
  function is computed directly in the upper tail, so tiny p-values keep their digits.
- `src/lib/math/optimize.ts`: `minimize(f, x0, { tol, maxIter, step })`, Nelder–Mead with standard coefficients.
  It returns `{ x, value, iterations, converged }`.
- `src/lib/stats/ols.ts`: `serialCovariance` is now exported (one keyword).
- `src/lib/stats/gmm.ts`: `longRunCovariance` (builds on `serialCovariance` by scaling rows by $1/\sqrt T$),
  `gmmObjective`, `linearGmm`, `gmm`, `objectiveSurface`, the toy model `simulateToySample`, `toyMoments`
  (with `TOY_MEAN = 0.5`, `TOY_VARIANCE = 1`), and `simulateJTest`.

**How `gmm` reports its results.** For the efficient methods, `S` is the $\hat S$ behind the last
$W = \hat S^{-1}$ (for two-step, $\hat S$ at the first-stage estimate). So $J = T \times$ the minimised
objective, the textbook J, and the covariance is $\tfrac1T(D'\hat S^{-1}D)^{-1}$. For one-step, `S` is
$\hat S(\hat\theta)$ and the covariance is the sandwich. $\hat S$ is demeaned. `linear: true` solves each stage
with `linearGmm` from the finite-difference Jacobian (exact for linear moments). CUE starts from the first-stage
estimate. A singular $\hat S(\theta)$ during the CUE search counts as $+\infty$. `converged` is false when a
minimisation hits its cap or iterated GMM stops at `maxIter`.

**Toy model.** $x_t$ i.i.d. with mean 0.5 and variance 1. Fat tails: variance 0.5 with probability 0.9 and 5.5
with probability 0.1. The total variance is still 1, the third central moment is 0, the fourth is 9.75 (normal: 3).
All moments are finite. `toyMoments(x, count)` returns the moment function $\theta \mapsto$ the $T \times$ count
matrix, so it plugs straight into `gmm`. Measured J-test size (two-step, normal tails, 400 samples, seed 1):
count 3, $T = 1000$: 5.75%. Count 4, $T = 1000$: 9.5%; $T = 100$: 15.75%. Count 4, iterated, $T = 2000$: 8.25%.
Count 4, CUE, $T = 1000$: 10%. The fourth-moment condition makes $J$ over-reject in finite samples, which is the
`JTestSim` story. One two-step estimate at $T = 500$ takes about 3 ms.

**Notation (Part VI block), each symbol with the clash it avoids.**
- $g(x_t, \theta)$, $g_T(\theta)$: moment function and its sample mean. Avoids the curriculum's $f(x_t, \theta)$,
  which clashes with factors $f_t$. $g$ always has an argument or the subscript $T$, so it is not the "$c$ or $g$"
  slope on characteristics named in the $\gamma$ row.
- $\dim g$, $\dim\theta$: number of moments and of parameters. Avoids the curriculum's $r - k$ (log return,
  factor index). **Deviation:** the spec proposed $L$ moments. $L$ is taken in §3 (entropy $L(X)$, $L_t$), and
  Chapter 4 already uses $L$ for the Newey–West lag count in $\hat S$, which Chapters 24–27 also need. So I used
  $\dim g$, parallel to $\dim\theta$. The code keeps `L` in comments for the moment count and `lags` for lags.
- $D$: Jacobian $\partial g_T/\partial\theta'$. Avoids the curriculum's $d$ (log dividend $d_t$). The dividend
  $D_t$ always carries its date; the row says so.
- $W$: weighting matrix. Avoids $w$ (portfolio weights). Chapter 14's wealth $W_t$ always carries its date.
- $S$, $\hat S$: long-run covariance and its Newey–West estimate. No clash: Chapter 4 uses $S$ and $\hat S$ for the
  same object.
- $\mathbb{E}_T[\cdot]$: sample mean of a product. The row says the subscript is the sample size, not a date as in
  $\mathbb{E}_t[\cdot]$.
- $\tilde f_t = f_t - \bar f$: demeaned factors (`\Factor` colour). Keeps $f_t$ for the raw factor.
- $\delta_{\text{HJ}}$: HJ distance, always with its subscript, so never the time-discount factor $\delta$.
- $\lambda^{\circ}$: hypothesised premium in GRS-FAR. Avoids KZ's $\lambda_{f,0}$, which clashes with the
  zero-beta rate $\lambda_0$ (Chapter 17).
- $\theta$, $\theta_0$, $\hat\theta$: the existing $\theta$ row now names the true value, the estimate and
  $J \sim \chi^2_{\dim g - \dim\theta}$. SDF symbols $M$, $b$, $\lambda$ already have rows; the Part VI block points
  to them through $\tilde f_t$ and the moment $g_T(b)$.

**Deviations.**
- $\dim g$ instead of $L$ (above).
- `objectiveSurface` takes a fixed $W$, as specified. A CUE surface for the Chapter 25 toggle needs $\hat S(\theta)$
  at each grid point; the widget task can map `gmmObjective(gT, inverse(longRunCovariance(...)))` over the grid,
  or extend the function.
- Sources: every GMM result is derived from the moment conditions in the doc comments. Nagel (2013), NBER WP 18554,
  printed pp. 20–21, is cited in the `gmm.ts` header for specification tests in the style of Hansen (1982) and the
  efficient weighting $S^{-1}$. Nothing is attributed to Cochrane (2005).

**Fixes found during verify.** The first full `npm test` run timed out the J-size test (8 s under parallel load)
and pushed the unrelated `tests/chapter18-numbers.test.ts` past its 5 s limit. Removing per-row array slicing and
`**` in `toyMoments` made one estimate three times faster (9.5 ms to 3.2 ms at $T = 500$); after that two
consecutive full runs passed.

**Verified revision.** Commit `1cb7e26`, rebased on `origin/main` `c7e441e` (merge of TASK-081). The rebase had one
conflict in `docs/STYLE_GUIDE.md`; both the Part V and the Part VI tables are kept. Verify ran after the rebase:
`npm ci` exit 0, `npm test` 572 passed, `npm run build` exit 0 with 0 errors.

**Follow-ups.**
- `docs/CURRICULUM.md` entries for Chapters 24–27 still write $f(x_t, \theta)$, $d$ and $\chi^2_{r-k}$. Chapter
  tasks should follow the style guide; a curriculum touch-up could align the text.
- If `JTestSim` needs more samples at large $T$ in the browser, a Gauss–Newton step after Nelder–Mead would cut
  the evaluations per estimate (about 270 now).
