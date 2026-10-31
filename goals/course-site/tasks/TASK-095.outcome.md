# TASK-095 outcome: Library: useless factors, the rank test and GRS-FAR confidence sets

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes.
  Evidence: `npm test` on `50069ad` (rebased on `origin/main` `4b20ed6`): 56 files, 597 tests passed, exit 0.
  `identification.test.ts` has 16 tests. Reference values per export:
  `rankTest`: with two assets the F form equals the squared classical OLS t-statistic of the slope of
  $R_1 - R_2$ on the factor (`ols()`), to 1e-12; Wald $= \tfrac{T}{T-2}F$; the Wald p-value equals
  `chiSquareSurvival`; the same statistic when another asset is subtracted (KZ, p. 518); pinned on the data
  (below).
  `grsFar`: the two forms of eq. (23) agree to 1e-10 (seeded two-factor panel and Δc on the data); the F-scaled
  statistic and p-value equal `grs` run on the $N - 1$ differences against $f_t - \bar f + \lambda^{\circ}$, with
  the same degrees of freedom, to 1e-10 (identity: `grs(R, f - f̄ + λ°).statistic` $= \tfrac{T-K-N+1}{T(N-1)}$
  GRS-FAR, eq. (25)); at $\lambda^{\circ} = 10^8$ it equals the rank test F and Wald to 1e-9 (KZ fn. 13, p. 528);
  it does not depend on which asset is subtracted.
  `farConfidenceSet`: pinned sets on the data; each end of the Δc set is accepted by `grsFar` and its outer
  grid neighbour is rejected; a short grid gives the unbounded flag; a non-increasing grid throws.
  `waldConfidenceSet`: $\hat\lambda$ equals the CCAPM slope of `conditionalModelFits` to 1e-14; the FM standard
  error equals `famaMacBeth`'s; the in-sample identity Shanken se² $= (1 + c)\,$FM se² $- c\hat\sigma^2_f/T$ holds
  to 1e-10; bounds are $\hat\lambda \pm 1.959963984540054\,$se.
  `simulateUselessFactor`: same seed, same output; draw 0 equals `waldConfidenceSet` and
  `crossSectionalRegression` on the hand-built factor, exactly; strength 0, 200 draws, seed 1: $|t_{FM}| > 1.96$
  in 33.5% of draws, far above 5%.
  `simulateWeakIdentification`: betas evenly spaced (N = 5, spread 1 gives 0.5, 0.75, 1, 1.25, 1.5); same seed,
  same output; size and coverage (below).
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `Result (172 files): - 0 errors - 0 warnings`, `24 page(s) built`, `[build] Complete!`, exit 0, on
  `50069ad`.
- [x] `git status --short` shows only `src/lib/finance/identification.ts`, its test and this task's outcome file.
  Evidence: the branch adds exactly `src/lib/finance/identification.ts`, `src/lib/finance/identification.test.ts`
  and this file; `git status --short` was empty after the code commit.

## Summary

**What.** `src/lib/finance/identification.ts` exports `simulateUselessFactor`, `rankTest`, `grsFar`,
`farConfidenceSet`, `waldConfidenceSet` and `simulateWeakIdentification`. It reuses `timeSeriesRegressions`,
`famaMacBeth`, `crossSectionalRegression`, `shankenCorrection`, `fSurvival`, `chiSquareSurvival`, `invCdf`,
`normalRng`, `inverse`, `solve` and `sampleMeans`. `grs` is the reference in the tests.

**How.**
- The $N - 1$ returns of KZ eqs. (15) and (21)–(22) are each of the first $N - 1$ assets minus the last one.
  Excess or raw returns give the same differences. Tests check that the statistics do not depend on which asset
  is last.
- `statistic` is always the F-distributed value, as in `grs`. The two forms of eq. (23) are `farForm`
  (Kleibergen 2009) and `hotellingForm` (Beaulieu, Dufour & Khalaf 2013), the paper's own labels. Both use the
  unrestricted $\hat\Sigma$ (divisor $T$). By Sherman–Morrison they are equal; the doc comment shows the steps.
  `farForm` loses digits at very large $\lambda^{\circ}$ (cancellation in $1 - \lambda^{\circ\prime}\hat Q(\lambda^{\circ})^{-1}\lambda^{\circ}$),
  so `statistic` and `pValue` use `hotellingForm`.
- Shanken with an intercept: `shankenCorrection` is written for the no-intercept case. By Frisch–Waugh–Lovell,
  the slope with an intercept is the no-intercept slope on the centred betas, so `shankenCorrection` on centred
  betas gives the right standard error. No formula is copied.
- `farConfidenceSet` evaluates GRS-FAR from one time-series fit, $O(N^2)$ per grid point. It accepts
  $\lambda^{\circ}$ when the p-value is at least $q$ (KZ eq. 27). Intervals are runs of accepted grid values.
- `simulateUselessFactor`: $m_t$ is the equal-weighted average of the $N$ excess returns, standardised to mean 0
  and standard deviation 1 (divisor $T$). The noise $e_t$ is standard normal.
- `simulateWeakIdentification`: $R^e_{i,t} = \beta_i(\lambda + f_t) + u_{i,t}$, $u$ i.i.d. N(0, 1), betas evenly
  spaced over $[1 - s/2, 1 + s/2]$, zero-beta rate 0, factor $f_t = z_t - \bar z$ demeaned in each sample (fixed
  factors, under which eq. (25) is exact). The sets are 95%. GRS-FAR coverage is checked by the test at the true
  $\lambda$, so it does not depend on the grid.

**Pinned values** (quarterly 25 portfolios of `quarterlyPanel` from 1963-Q3 to 2026-Q2, $T = 252$, $N = 25$).
- Δc: rank F = 1.6135741168 on (24, 227), p = 0.0394; Wald 42.99, p = 0.0100. 95% GRS-FAR set on a grid of
  step 0.001 over $[-1, 1]$: $[0.006, 0.432]$, bounded. Wald sets: $\hat\lambda = 0.00886$, FM se 0.00379,
  Shanken se 0.00521.
- Mkt-RF: rank F = 9.2749, p = 1.77e-22. The 95% GRS-FAR set is empty: the largest p-value is 2.6e-5, at 0.

**Simulations.**
- Useless factor, strength 0, 200 draws, seed 1: $|t_{FM}| > 1.96$ in 33.5% of draws, Shanken in 5.0%. Median
  $R^2$ 0.116; 83% of draws beat the CAPM's $R^2$ of 0.008 on the same assets.
- Weak identification, $T = 60$, $N = 10$, $\lambda = 1$, 600 samples, seed 7. GRS-FAR rejects at the true
  $\lambda$ in 32/600 = 5.3% of samples at every spread (band $5\% \pm 3$ simulation standard errors,
  [2.3%, 7.7%]). With one seed the rate is the same number at every spread: the statistic at the true $\lambda$
  does not depend on B. 95% Wald coverage (FM, Shanken): spread 4: 100%, 100%; spread 1: 90.2%, 93.2%;
  spread 0.25: 38.3%, 41.0%; spread 0: 22.2%, 23.5%.

**Deviations and findings.**
- With fixed factors, the $\hat\Sigma_f/T$ part of both Wald variances has nothing to measure, so at a wide
  spread the Wald sets over-cover (100% at spread 4). Random factors would give about 95% there, but then
  GRS-FAR is no longer exact and over-rejects when B is large. The spec's size test needs fixed factors, so the
  simulation uses them and the doc comment says so. The `ConfidenceSet` widget should keep the spread slider in
  the range where this does not show (about 0 to 1).
- The Shanken t does not over-reject for the useless factor on these data (5.0%), because $c = \hat\lambda^2/\hat\sigma^2_f$
  grows with $\hat\lambda^2$. The FM t does (33.5%). Chapter 27 should say which t it shows.
- GKR is cited only for what it states: for the OLS two-pass, the estimate on a spurious factor diverges
  (fn. 13, p. 12, working-paper pages), and for invariant estimators $R^2 \to 1$ (Theorem 1, p. 11). Nothing is
  attributed to Kan & Zhang (1999).
- `simulateUselessFactor` costs about 6.5 ms per draw on the 252 × 25 panel. 500 draws take about 3 s in a test
  runner. The widget may want 200 to 300 draws.

**Verified revision.** `50069ad`, rebased on `origin/main` `4b20ed6` (merge of TASK-094). `npm ci` exit 0,
`npm test` 597 passed, `npm run build` exit 0 with 0 errors. One earlier full run, before the rebase, had two
unrelated tests (`cay.test.ts`, `tests/chapter14-numbers.test.ts`) time out at 5 s at a machine load average
of 38 on 12 cores. They pass alone, and two later full runs passed.

**Follow-ups.**
- `docs/READINGS.md` still says "owner to supply" for Kleibergen & Zhan; the PDF is in `source/papers/`.
  A docs task (or Chapter 27) can update it.
