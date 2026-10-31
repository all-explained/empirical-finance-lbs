# TASK-094 outcome: Library: linear SDF models by GMM and the Hansen–Jagannathan distance

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes.
  Evidence: `npm test`: 55 files, 581 tests passed, exit 0 (9 of them in `src/lib/finance/sdfGmm.test.ts`).
  Reference values per export:
  `linearSdfGmm`: with `'identity'`, $\hat\lambda$ and the pricing errors equal $\hat\lambda$ and $\hat\alpha$ of
  `crossSectionalRegression` (no intercept, OLS) on the full-sample betas of `timeSeriesRegressions`, within 1e-10,
  for FF3 and the CCAPM on the quarterly panel and for a seeded two-asset case. On that seeded case (one factor,
  $T = 120$), $\hat b$, its standard error, $\hat\lambda$ and its standard error for `'identity'`, and $\hat b$, its
  standard error, the pricing errors, $J$ (df 1) and the p-value $2(1 - \Phi(\sqrt J))$ for `'efficient'` match a
  scalar hand computation (first-stage $\hat b$, demeaned divisor-$T$ $\hat S$, its 2 × 2 inverse, second-stage
  $\hat b$, $J = T g'\hat S^{-1}g$). With `'hj'`, $\hat b$ and the pricing errors equal those of `hjDistance`.
  `hjDistance`: with no factors, $\delta_{\text{HJ}}^2 = SR^2/(1 + SR^2)$ to 1e-12, where $SR^2$ is
  `maxSharpeSquared` of the 25 portfolios with the divisor-$T$ covariance (`sampleCovariance` × $(T-1)/T$);
  $b$ is empty and the pricing errors are the sample means. With the test assets as their own factors,
  $\delta_{\text{HJ}} < 10^{-12}$ and every pricing error is below 1e-14 in absolute value.
  `sdfModelFits`: the panel holds the 252 quarters 1963-07-01 (1963-Q3) to 2026-04-01 (2026-Q2), the last full
  quarter. Pinned values (decimal per quarter) for the 25 size–B/M portfolios:

  | Model | first-stage $\hat\lambda$ | HJ-weighted $\hat\lambda$ | $\delta_{\text{HJ}}$ | $J$ (df) | p-value |
  |---|---|---|---|---|---|
  | CAPM | 0.0210814969 | 0.0147837588 | 0.5130061039 | 91.2483347756 (24) | 8.949e-10 |
  | CCAPM | 0.0286782297 | 0.0064635856 | 0.4702841944 | 13.0106371812 (24) | 0.9659448214 |
  | FF3 | 0.0181847433, 0.0048233368, 0.0108921642 | 0.0153060369, 0.0040696870, 0.0067165568 | 0.4880035171 | 67.7015879676 (22) | 1.513e-6 |

  It also checks the factor names, 25 pricing errors equal to those of `hjDistance`, and the first-stage fit equal
  to `linearSdfGmm` with `'identity'`.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `Result (170 files): - 0 errors - 0 warnings`, `24 page(s) built`, `[build] Complete!`, exit 0.
- [x] `git status --short` shows only `src/lib/finance/sdfGmm.ts`, its test and this task's outcome file.
  Evidence: the branch adds exactly these three files; `git status --short` is empty after the commit.

## Summary

**What.** `src/lib/finance/sdfGmm.ts`:
- `linearSdfGmm(excess, factors, { weighting, lags })` for $M = 1 - b'\tilde f$ with in-sample demeaned factors.
  `'identity'` (first stage), `'hj'` ($W = \mathbb{E}_T[R^eR^{e\prime}]^{-1}$) and `'efficient'` (two-step,
  $W = \hat S^{-1}$ from `longRunCovariance` at the first-stage $\hat b$). It returns $\hat b$, $\hat\lambda =
  \hat\Sigma_f\hat b$ (divisor $T$), their sandwich standard errors, the pricing errors, actual and fitted mean
  excess returns, and for `'efficient'` $J$ with $N - K$ degrees of freedom and its p-value. The doc comment says
  that the standard errors treat $\bar f$ and $\hat\Sigma_f$ as known.
- `hjDistance(excess, factors)`: $\delta_{\text{HJ}}$, the minimising $b$ and the pricing errors; zero factor
  columns give $b = []$ and $g_T = \mathbb{E}_T[R^e]$.
- `sdfModelFits(panel, models)` on a `QuarterlyPanel` for `'capm'`, `'ccapm'` and `'ff3'`: first-stage and
  HJ-weighted fits, $\delta_{\text{HJ}}$, the second-stage $J$, df and p-value (no Newey–West lags), and the 25
  pricing errors at the $b$ that defines $\delta_{\text{HJ}}$.

**Deviation: `linearGmm` on the exact $D$, not `gmm`.** The spec lists `gmm` among the functions to reuse. Through
`gmm(..., { linear: true })`, the first-stage $\hat\lambda$ differed from `crossSectionalRegression` by 4e-10,
above the spec's 1e-10. The cause is `gmm`'s central-difference Jacobian. The moments are linear in $b$, so
$D = \mathbb{E}_T[R^e\tilde f']$ is known exactly. Each stage is now solved with `linearGmm` on that $D$, and the
covariance is the GMM sandwich with $\hat S$ from `longRunCovariance`, $J$ uses `gmmObjective` and the p-value
`chiSquareSurvival`. The exact $D$ also moved the CCAPM $J$ by 3e-7 (its $\hat b \approx 75$ magnifies the
difference error).

**Sources.** Nagel (2013, NBER WP 18554): printed p. 13, eq. (16) and fn. 5 (the linearised SDF normalised to
mean 1; under misspecification tests depend on the normalisation); printed p. 21 (GMM of the linearised SDF on
excess returns; identity weighting can ignore a moment that efficient weighting enforces). Gospodinov, Kan &
Robotti (2019, JFE 132, 451–471), manuscript p. 8, eq. (1) (the SDF linear in the factors) and p. 23 (the HJ
distance is a non-invariant estimator). The first-stage-equals-CSR result, $\lambda = \Sigma_f b$, and
$\delta_{\text{HJ}}^2 = SR^2/(1+SR^2)$ are derived in the doc comments from the moment conditions and
Sherman–Morrison. Nothing is attributed to Cochrane (2005) or Hansen & Jagannathan (1997).

**Verify notes.** `tests/chapter14-numbers.test.ts` timed out at its 5 s limit in three full runs while the
machine load average was 16–19 from other sessions. It passes alone in 2.4 s, and it ran 4.1–5.3 s in the full
suite; the nine new tests take about 0.3 s together. This is the existing issue
all-explained/empirical-finance-lbs#67. The next full run passed (above).

**Verified revision.** The commit that adds this file, on `origin/main` `9d5f0b0`: `npm ci` exit 0, `npm test` 581 passed
(exit 0), `npm run build` exit 0 with 0 errors and 0 warnings.

**Follow-ups.** For Chapter 26: on 1963-Q3–2026-Q2 the CCAPM has the smallest $\delta_{\text{HJ}}$ (0.470) and is
not rejected by $J$ (p = 0.97), with $\hat b \approx 75$. That looks like the weak-factor pattern of Chapter 27 (a
factor with tiny covariances fits with a huge $b$), so the chapter should not present it as a win for the CCAPM.
