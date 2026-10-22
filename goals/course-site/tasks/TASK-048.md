---
id: TASK-048
title: 'Library: Stambaugh bias and simulated test size'
milestone: M-4
state: approved
depends_on: []
delivery: pr
---

## Why

SC-7 and M-4. Chapter 12 needs the small-sample bias of a predictive slope with a persistent predictor, its correction, and simulated critical values in `src/lib`, with tests.

## Scope

Add `src/lib/stats/stambaugh.ts` and `src/lib/stats/stambaugh.test.ts`. Read first: the entry of chapter 12 in `docs/CURRICULUM.md`, the notation table in `docs/STYLE_GUIDE.md` §3, and `src/lib/finance/predictive.ts` (`simulatePredictive`, `predictiveRegression`, `fitAR1`, `goyalWelchAnnualPredictors`). The model is $r_{t+1} = a + b x_t + u_{t+1}$, $x_{t+1} = \mu_x + \phi x_t + v_{t+1}$.

Functions:
- `kendallBias(phi, T)` = $-(1 + 3\phi)/T$, the first-order bias of $\hat\phi$.
- `stambaughBias(sigmaUV, sigmaV2, phi, T)` = $(\sigma_{uv}/\sigma_v^2)\,\mathbb{E}[\hat\phi - \phi]$ with the Kendall term.
- `biasCorrectedSlope(bHat, phiHat, sigmaUV, sigmaV2, T)`: the plug-in correction $\hat b - (\sigma_{uv}/\sigma_v^2)\,\text{kendallBias}(\hat\phi, T)$. Say in the doc comment that it is first order and uses the biased $\hat\phi$.
- `predictiveSystem(r, x)` fits both equations on one common sample and returns $\hat b$, its $t$-statistic, $\hat\phi$, $\sigma_{uu}$, $\sigma_{uv}$, $\sigma_v^2$, $\operatorname{corr}(u, v)$ and $T$. The chapter applies it to `goyalWelchAnnualPredictors`.
- `simulateSlopes({ T, phi, corr, samples, seed })` draws seeded samples under $b = 0$ with `simulatePredictive`, and returns per sample $\hat b$, its classical $t$-statistic and $\hat\phi$. Derive each sample's seed from `seed` so that one seed gives the same shocks for every $\phi$, `corr` and $T$; then a slider moves one set of samples instead of drawing new ones.
- `quantile(values, p)`, `upperCriticalValue(tStats, size)` (one-sided, for the alternative $b > 0$) and `rejectionRate(tStats, critical)`.

Tests against reference values, each stated in the test: `kendallBias` and `stambaughBias` by hand; `quantile` on a small sorted list; `predictiveSystem` on a series built so that the slopes and the residual covariance are known; with `corr = 0` the mean simulated $\hat b$ is within two Monte Carlo standard errors of 0; with $\phi = 0.98$, `corr` $= -0.9$ and $T = 100$, the mean simulated $\hat b$ is positive and within a stated tolerance of `stambaughBias`, and the nominal 5% $t$-test rejects more than 5% of the time; the same seed gives the same draws. Reuse `simulatePredictive`, `predictiveRegression` and `fitAR1` from `src/lib/finance/predictive.ts`, `ols` from `src/lib/stats/ols.ts` and `arithmeticMean` from `src/lib/finance/returns.ts`; do not copy them. Seed any random draw with `src/lib/math/rng.ts`. Write a correlation as `corr`, never `rho`. Keep 2,000 samples of $T = 600$ fast enough for a widget (state the time in the outcome). Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance

- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/stats/stambaugh.ts`, its test and this task's outcome file.

## Verify

```sh
npm ci
npm test
npm run build
git status --short
```
