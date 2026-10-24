# TASK-085 outcome: GMM estimation, the J test and the chi-square distribution

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
  Evidence: `npm test` reports 54 files and 574 tests passed, `tests/notation.test.ts` included. Each export and its reference:
  - `chiSquareCdf`, `chiSquareSurvival`: R `pchisq` at 3.841459 (1 df) and 18.307038 (10 df), which give 0.95. R `qchisq(0.95, ·)` gives a 0.05 tail. The closed form $1 - e^{-x/2}$ holds at 2 df. R values cover the series and the fraction, and fractional df. Tiny tails: R `pchisq(100, 1, lower.tail = FALSE)` $= 1.524\times10^{-23}$ and `pchisq(300, 40, …)` $= 1.496\times10^{-41}$, to 10 digits.
  - `minimize`: Rosenbrock from $(-1.2, 1)$ reaches $(1, 1)$ to 1e-8. A 3-D quadratic reaches $(1, -2, 3)$. The iteration cap and NaN handling are tested.
  - `serialCovariance` (now exported): a hand-made 4 × 2 case with Bartlett and flat weights.
  - `longRunCovariance`: the same hand-made case with 0 and 1 lags, and a one-column case ($\hat S = 0.75$). Demeaning is checked both ways. It equals the Newey–West covariance inside `ols` to 1e-14.
  - `gmm`: the OLS moments $x_t(y_t - x_t'\theta)$ reproduce `ols()` coefficients and Newey–West (4 lags) standard errors to 1e-8, one-step and two-step. Just-identified IV equals $(Z'X)^{-1}Z'y$. Over-identified IV with $W = (Z'Z/T)^{-1}$ equals 2SLS from two `ols` passes. Two-step $J$ equals $T\,g_T'\hat S^{-1}g_T$ with $\hat S$ at the first step. `toyMoments` count 2 gives the sample mean and divisor-$T$ variance to 1e-8 under all four methods. The efficient covariance is at most the identity-weighted one, on a seeded $T = 2000$ sample with count 4: the minimum eigenvalue of the difference is ≥ 0. Iterated GMM ends at a fixed point.
  - `linearGmm`: a 2 × 2 system solved by hand, $\theta = (0.8, 1.4)$. One parameter with $W = I$ gives the mean 7/3.
  - `gmmObjective`: $g = (1, 2)$, $W = [[2, 1], [1, 3]]$ gives 18.
  - `objectiveSurface`: the toy objective of $x = (1, 2, 3, 6)$ on a 2 × 2 grid, worked by hand.
  - `toyMoments`: all four rows of $x = (1, 2, 3, 6)$ at $\theta = (2, 3)$, worked by hand.
  - `simulateToySample`: at $T = 200000$, both tails give mean 1 and variance 4. Kurtosis is 3 (normal) and 9.75 (fat). The test states the bands and the standard errors. The same seed gives the same draws.
  - `simulateJTest`: the same seed gives the same output. With normal tails, $T = 1000$, 400 samples, two-step and count 3, the rejection rate is within $0.05 \pm 0.033$ (3 simulation errors of 0.0109). The run gave 0.0425. With fat tails and the fourth-moment condition ($T = 200$, 200 samples), it rejects more than 15% of samples.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `Result (167 files): - 0 errors`, then `24 page(s) built`, `[build] Complete!`.
- [x] `docs/STYLE_GUIDE.md` §3 has one Part VI block with the GMM, SDF and identification symbols, and the outcome lists each symbol with the clash it avoids.
  Evidence: the block is "### Part VI: GMM, linear SDF models and identification (Chapters 24–27)". The existing $\theta$ row is extended, with no second row. The symbols and the clashes they avoid are in the table below.
- [x] `git diff --stat origin/main -- src/lib/stats/ols.ts` shows a one-line change (the `export` keyword).
  Evidence: `src/lib/stats/ols.ts | 2 +-`, `1 file changed, 1 insertion(+), 1 deletion(-)`. The changed line is `export function serialCovariance(`.
- [x] `git status --short` shows only the files named above and this task's outcome file.
  Evidence: the branch changes `docs/STYLE_GUIDE.md`, `src/lib/math/distributions.ts` and its test, `src/lib/math/optimize.ts` and its test, `src/lib/stats/gmm.ts` and its test, `src/lib/stats/ols.ts` and this file. `git status --short` is empty after the commit.

### Part VI symbols and the clash each avoids

| Symbol | Clash it avoids |
|---|---|
| $g(x_t, \theta)$, $g_T(\theta)$ | The curriculum's $f(x_t, \theta)$ reads as the factors $f_t$. |
| $D = \partial g_T/\partial\theta'$ | The curriculum's $d$ is the log dividend $d_t$. |
| $W$ | $w$ is portfolio weights. |
| $S$, $\hat S$ | None. It keeps Chapter 4's letter for the long-run covariance. |
| $L$ moments, $\dim\theta$ parameters | The curriculum's $r - k$: $r$ is a log return and $k$ indexes factors. |
| $\mathbb{E}_T[\cdot]$ | A bar over a product is ambiguous. The capital $T$ keeps it apart from the conditional $\mathbb{E}_t$. |
| $\tilde f_t = f_t - \bar f$ | The SDF row's $f_{t+1} - \mathbb{E}f$ has the population mean, which is unknown in a sample. |
| $\delta_{\text{HJ}}$ | The time-discount factor $\delta$. |
| $\lambda^{\circ}$ | Kleibergen and Zhan's $\lambda_{f,0}$ reads as the zero-beta rate $\lambda_0$ of Chapter 17. |
| $\theta$, $\dim\theta$ (row extended) | One row only. It still names the Chapter 14 cointegrating weights. |

Letters that §3 already uses in another sense. I kept the proposed letter each time, and the table row says how to tell them apart:
- $D$: §3 has the dividend $D_t$. The Jacobian $D$ never carries a date. I kept $D$ because the TASK-089 spec already writes $\tfrac1T(D'S^{-1}D)^{-1}$, and the curriculum writes $d$.
- $W$: §3 has total wealth $W_t$, with a date and in Chapter 14 only.
- $L$: §3 has the entropy $L(X)$, $L_t$, which always has an argument or a date. Chapter 4 calls the Newey–West lag length $L$, outside §3. The new row names that lag length $L_{\text{NW}}$ in Part VI. I kept $L$ because the TASK-089 spec writes $\chi^2_{L-\dim\theta}$.
- $g$: the $\gamma$ row allows $g$ as a slope on characteristics. The moment function always has its arguments or the subscript $T$.

## Summary

What. I added `chiSquareCdf` and `chiSquareSurvival` to `src/lib/math/distributions.ts`. They use a private regularized incomplete gamma built on `logGamma`: a series for $x < a + 1$, and a modified-Lentz continued fraction otherwise. The smaller tail is computed directly. `src/lib/math/optimize.ts` adds a Nelder–Mead `minimize`. It returns `{ x, value, iterations }`, with `tol` and `maxIter`. It treats a NaN as $+\infty$. `src/lib/stats/gmm.ts` adds `longRunCovariance`, `gmm`, `linearGmm`, `gmmObjective`, `objectiveSurface`, `simulateToySample`, `toyMoments` and `simulateJTest`, and the constants `TOY_MEAN = 1` and `TOY_VARIANCE = 4`. `serialCovariance` in `ols.ts` gains only the `export` keyword.

How. `longRunCovariance` demeans the columns (optional). It calls `serialCovariance` with Bartlett weights and divides by $T$. `gmm` works as follows:
- 'one-step' uses the fixed `weighting`.
- 'two-step' sets $W = \hat S(\theta_1)^{-1}$.
- 'iterated' repeats until $\theta$ moves less than `tol`·(1 + max|θ|), or for `maxIter` steps (default 100).
- 'cue' minimises $g_T'\hat S(\theta)^{-1}g_T$ from the one-step estimate.

With `linear: true`, each weighted step uses `linearGmm`. Its $a$ and $D$ come from one central-difference Jacobian, which is exact for linear moments. The result holds $\hat\theta$, $g_T$, $D$, $\hat S$, $W$, the sandwich covariance, the efficient form $\tfrac1T(D'\hat S^{-1}D)^{-1}$ and the standard errors. It also holds $J$, df $= L - \dim\theta$ and the p-value. $J$ and the p-value are `null` for one-step and for just-identified models. For two-step and iterated, $\hat S$ is the one that $W$ inverts, so $W = \hat S^{-1}$ exactly and the two covariances agree. The fat-tailed toy sample is a scale mixture: variance $0.5\sigma^2$ with probability 0.9, and $5.5\sigma^2$ with probability 0.1. It is symmetric, with kurtosis 9.75 and all moments finite. So with count 3 the $J$ test is valid in large samples. With count 4 the fourth-moment condition is false, which gives the test power. `simulateJTest` seeds sample $i$ from `mulberry32(seed)`, as `simulateSlopes` does. Each fit starts at the sample mean and variance and uses `tol: 1e-7`.

Deviations and choices.
- `efficientCovariance` is returned for every method, one-step too. There it is the covariance that efficient weighting would give at the same $D$ and $\hat S$, which the comparison test uses.
- `iterations` counts the weighted estimation steps.
- `regularizedGamma` is private, as `betaFraction` is.
- I took nothing from Nagel (2013): every result here follows from the moment conditions, so the doc comments cite no pages. Nothing is attributed to Cochrane (2005).
- No page changed, so I did not run `npm run screenshots`.

Verified revision: the code is commit `0b695a7`, rebased on `origin/main` `c7e441e` (TASK-081 merged). The commit that adds this file changes nothing else. TASK-081 added the Part V block in the same place in §3. I kept both blocks, Part V and then Part VI. On this revision, the full Verify chain (`npm ci`, `npm test`, `npm run build`, the `ols.ts` diff, `git status --short`) exits 0. `npm test` reports 54 files and 574 tests passed. On busy runs (load average 26–40), some slow chapter tests in other files timed out at 5 s. Issue all-explained/empirical-finance-lbs#67 already reports this. Those tests pass when the machine is less busy.

Proposed follow-ups.
- Speed. `simulateJTest` takes about 10 ms per sample at $T = 1000$ (400 samples in about 4.4 s), because Nelder–Mead needs a few hundred objective evaluations. If the `JTestSim` widget lags, a Gauss–Newton step $\theta \leftarrow \theta - (D'WD)^{-1}D'Wg_T$ after a short Nelder–Mead search would cut the evaluations by about ten times. A `ponytail:` comment in `simulateJTest` marks this.
- The test suite's $J$-size test takes about 4 s.
