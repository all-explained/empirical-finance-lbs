---
id: TASK-061
title: 'Library: the F distribution, time-series factor regressions and GRS'
milestone: M-6
state: approved
depends_on: []
delivery: pr
---

## Why


SC-7 and M-6. Chapter 16 needs the factor panel of the 25 size–B/M portfolios, asset-by-asset time-series regressions with alpha standard errors, the GRS statistic with its F p-value, and the Sharpe-ratio reading of GRS in `src/lib`, with tests. Chapters 17 and 18 reuse the panel and the first pass through the two-pass library.

## Scope


Add `src/lib/math/distributions.ts`, `src/lib/finance/timeSeriesTests.ts` and their `.test.ts` files. Read first: the entry of chapter 16 in `docs/CURRICULUM.md`, the notation table in `docs/STYLE_GUIDE.md` §3 (subsection "Factor models and tests"), the French notes in `docs/DATA.md` (returns and factors are percent per month; divide by 100), `src/components/plots/capmSample.ts` (how chapter 7 lines up `ff3-monthly` and `ff25-size-bm-monthly`), `src/lib/stats/ols.ts`, `src/lib/finance/portfolio.ts` and `src/lib/math/linalg.ts`. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GibbonsRossShanken1987.pdf` (Gibbons, Ross & Shanken, Econometrica 1989) with `pdftotext -layout` for the statistic and its finite-sample F distribution, and cite its page in a doc comment.

Functions in `src/lib/math/distributions.ts`:
- `logGamma(x)` and `regularizedBeta(x, a, b)` (the regularized incomplete beta $I_x(a, b)$, by a continued fraction).
- `fCdf(x, d1, d2)` and `fSurvival(x, d1, d2)`, the F distribution's CDF and upper tail.

Functions in `src/lib/finance/timeSeriesTests.ts`:
- `factorPanel(ff3, ff25, { start, end?, model })` with `model` `'capm'` (Mkt-RF) or `'ff3'` (Mkt-RF, SMB, HML): returns `{ dates, names, excess, factors, factorNames }` as decimal monthly values, `excess` a T × 25 matrix of $R^e_{i,t} = R_{i,t} - R^f_t$, `factors` a T × K matrix. Fail with a `RangeError` when the two series' dates do not line up, as `capmSample` does.
- `timeSeriesRegressions(excess, factors)`: for each asset the OLS fit of $R^e_{i,t} = \alpha_i + \beta_i' f_t + \varepsilon_{i,t}$, returning `{ alpha, alphaSE, alphaT, beta, residuals, residualCovariance, factorMean, factorCovariance }`. State in a doc comment which divisor each covariance uses (GRS uses the maximum-likelihood divisor $T$).
- `grs(excess, factors)` returns `{ statistic, pValue, df1, df2, sharpeAll2, sharpeFactors2 }` with $GRS = \tfrac{T-N-K}{N}\big(1 + \bar f'\hat\Sigma_f^{-1}\bar f\big)^{-1}\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha$, `df1` $= N$, `df2` $= T-N-K$, and the two squared maximum Sharpe ratios, so that $\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha = SR^2_{\text{all}} - SR^2_f$ can be shown. Use the notation of `docs/STYLE_GUIDE.md` §3 in comments ($\Sigma_f$, $\Sigma_\varepsilon$), not the curriculum's $\Omega$, $\Sigma$.
- `sharpeFrontiers(excess, factors, sdGrid)`: the mean–standard deviation frontier of the factors alone and of factors plus test assets on a common grid, for chapter 16's `GRSGeometry`.

Tests against reference values, each stated in the test: `logGamma` at 0.5, 1, 5 and 10.5; `fCdf` at tabulated quantiles (for example $F_{0.95}(2, 10) = 4.1028$, $F_{0.99}(5, 20) = 4.1027$, and one case with $d_2 \ge 500$), with `fCdf + fSurvival = 1`; `timeSeriesRegressions` on a small hand-computed panel; the in-sample identity $\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha = SR^2_{\text{all}} - SR^2_f$ to 1e-10 on a seeded panel; `grs` equal to zero when every alpha is zero; with $N = 1$, GRS equals the squared alpha $t$-statistic up to the stated divisor scaling; and one test per model (`capm`, `ff3`) on the committed data that pins the sample dates (from 1963-07) and the GRS statistic and p-value. Reuse `ols`, `sampleMeans`, `sampleCovariance`, `maxSharpeSquared`, `frontier`, `inverse` and `solve`; do not copy them. Seed any simulation with `src/lib/math/rng.ts`. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only the four files named and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
