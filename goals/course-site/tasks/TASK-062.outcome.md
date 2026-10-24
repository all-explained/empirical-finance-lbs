# TASK-062 outcome: Library: two-pass regressions, Fama–MacBeth and the Shanken correction

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes.
  Evidence: `npm test` printed `Test Files  38 passed (38)` and `Tests  405 passed (405)`, including the
  11 new tests in `src/lib/finance/crossSection.test.ts`. Reference per export:
  - `crossSectionalRegression`: a hand-computed three-asset case ($\beta = (0.5, 1, 1.5)$, $\bar R^e = (1, 2, 4)$,
    $\Sigma_\varepsilon = \mathrm{diag}(1, 2, 4)$). OLS: $\hat\lambda = 17/7$ and $R^2 = 181/196$ without an intercept;
    $\hat\lambda = 3$, $\hat\lambda_0 = -2/3$, $R^2 = 27/28$ (equal to `ols(...).r2`) with one. GLS: $\hat\lambda = 16/7$
    without an intercept; $\hat\lambda = 36/13$, $\hat\lambda_0 = -6/13$, $R^2 = 1 - 99/2366$ with one. Alphas and fitted
    values are checked too. On the data, GLS with the 25 portfolios plus the three traded factors as test assets gives
    $\hat\lambda = \bar f$ to 1e-10.
  - `famaMacBeth`: on a seeded panel (`normalRng(62)`, T = 120, N = 6, K = 2), with and without an intercept, the mean
    slope equals `crossSectionalRegression` on mean returns and the standard error equals
    $\sqrt{\tfrac1T(X'X)^{-1}X'\hat\Sigma X(X'X)^{-1}}$ with the divisor-$T$ return covariance, both to 1e-10. The
    running mean, monthly fitted values and t-statistics are checked as well.
  - `shankenCorrection`: by hand with $\Sigma_f = 0.5$, $T = 10$: $AΣ_εA' = 45/49$ (OLS), $16/21$ (GLS). With
    $\lambda = 0$, $c = 0$ and the corrected covariance is $AΣ_εA'/T + \Sigma_f/T$; with $\lambda = 1$, $c = 2$ and
    the corrected variance is $(3 \cdot 45/49 + 0.5)/10$ (GLS: $(3 \cdot 16/21 + 0.5)/10$).
  - `simulateTwoPass`: same seed gives the same output, another seed differs. Seed 18, N = 25 betas from 0.5 to 1.5,
    T = 600, $\lambda$ = 0.5% a month, monthly factor Sharpe 1.2 ($c = 1.44$), residual sd 1.5%, 1000 replications:
    naive coverage 86.4%, corrected coverage 92.3% (the rest of the gap is the errors-in-variables bias of $\hat\lambda$).
  - Committed data, FF3 on the 25 portfolios, 1963-07-01 to 2026-08-01 (T = 758), against an independent numpy
    computation (`numpy.linalg.lstsq` first pass, `numpy.linalg.solve` second pass):
    OLS $\hat\lambda$ = (0.005604000578696, 0.00144438887634, 0.003531771728333), $R^2$ = 0.4752784814581994
    (with intercept: $\hat\lambda_0$ = 0.011600167328949, $R^2$ = 0.6632929135961495); Fama–MacBeth t = (3.4138, 1.2848,
    3.1929), with intercept t = 4.5023 (intercept), −1.8039, 1.0398, 2.9534; $c$ = 0.0385874; naive SE = (0.00164157,
    0.00112417, 0.00110615), corrected SE = (0.00164246, 0.00112536, 0.00110721); the naive SE equals the Fama–MacBeth SE
    to 1e-12. GLS $\hat\lambda$, $c$ and corrected SE are pinned as well.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `npm run build` printed `Result (120 files):`, `- 0 errors`, `- 0 warnings`, then `15 page(s) built` and
  `Complete!`. The whole chain `npm ci && npm test && npm run build && git status --short` exited 0.
- [x] `git status --short` shows only `src/lib/finance/crossSection.ts`, its test and this task's outcome file.
  Evidence: at the end of the Verify chain it printed only `?? src/lib/finance/crossSection.test.ts` and
  `?? src/lib/finance/crossSection.ts`. This outcome file is the third.

## Summary

**What.** `src/lib/finance/crossSection.ts` adds `crossSectionalRegression`, `famaMacBeth`, `shankenCorrection` and
`simulateTwoPass`. Each doc comment derives its formula from the model; the method names are the only attribution.

**How.**
- One weighted-least-squares path, $\hat b = (X'WX)^{-1}X'W\bar R^e$ with $W = I$ (OLS) or $\Sigma_\varepsilon^{-1}$ (GLS),
  built from `transpose`, `matMul`, `inverse` and `solve`.
- Cross-sectional $R^2 = 1 - \sum_i \hat\alpha_i^2 / \sum_i (\bar R^e_i - m)^2$ in every case. It is the usual centred
  $R^2$ for OLS with an intercept, and it can be negative without one.
- `famaMacBeth` builds the projection $(X'X)^{-1}X'$ once and applies it to every month. Its standard error uses
  the divisor $T$, so it matches the identity in the spec exactly.
- `shankenCorrection` returns the naive covariance $\tfrac1T[AΣ_εA' + Σ_f]$ (what Fama–MacBeth gives with fixed betas)
  and the corrected one $\tfrac1T[AΣ_εA'(1 + c) + Σ_f]$, with $c = \lambda'\Sigma_f^{-1}\lambda$, their standard errors,
  and $c$.
- `simulateTwoPass` uses `normalRng`, `timeSeriesRegressions` for the first pass, `sampleMeans`, and `invCdf(0.975)`
  for the 95% interval. The factor is traded with mean $\lambda$ and sd $\lambda/SR$, so $c = SR^2$.

**Deviations.**
- GLS with a traded factor as a test asset: that factor's residual is zero, so $\hat\Sigma_\varepsilon$ is singular.
  The doc comment shows (Woodbury identity) that weighting by the return covariance $\hat\Sigma$ gives the same
  $\hat\lambda$, because $\hat\Sigma = \hat\beta\hat\Sigma_f\hat\beta' + \hat\Sigma_\varepsilon$ in sample. The test passes $\hat\Sigma$ in
  `residualCovariance` for that case, and first checks on the 25 portfolios that both weightings agree to 1e-12.
- `shankenCorrection` has no intercept option, as in the spec's signature and formula.
- `simulateTwoPass` takes `beta` as the N true betas and throws a `RangeError` if its length is not `N`.
- The simulation runs about 10 ms per replication at N = 25, T = 600 (first pass by `ols`, as the spec asks). The
  coverage test takes about 10 s and has a 60 s timeout. A widget should use a few hundred replications.

**Verified revision.** `a40e6dd` (the library commit); this outcome adds no code.

**Follow-ups.** None needed for chapters 17 and 18. If chapter 18 wants Shanken standard errors with an intercept,
a later task can add an `intercept` option to `shankenCorrection`.
