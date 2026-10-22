# TASK-012 outcome

## Acceptance

- [x] `npm test` passes and includes the new tests. All 135 tests in seven
  files pass, including 25 tests in `src/lib/finance/predictive.test.ts`.
- [x] All seven requested functions exist: `forwardSums`,
  `predictiveRegression`, `horizonSlopes`, `fitAR1`, `impliedHorizonSlope`,
  `goyalWelchAnnualPredictors` and `simulatePredictive`. Independent Python
  statsmodels references match slope, intercept, standard error, t-statistic,
  R² and observation count at horizons 1 and 5, within 5e-12. References cover
  Newey–West (the default, k lags), Hansen–Hodrick (k lags) and classical errors.
- [x] No regression code is copied from `ols.ts`. Both regression functions
  call `ols`. `grep -n "inverse\|solve" src/lib/finance/predictive.ts`
  prints nothing; the Verify fallback prints `no duplicated solver`.
- [x] `npm run build` passes. Astro reports zero errors, warnings and hints
  during type checking and completes the static build. The existing empty
  chapter collection emits informational build warnings.

## Summary

Added only the requested library, its tests and this outcome. The library
aligns `x[t]` with `r[t+1] + ... + r[t+k]`, delegates estimation and covariance
to shared OLS, fits AR(1) persistence, and computes the implied horizon slope
including phi = 1 and values near one.

The annual data helper treats `Index` as a year-end level and `D12` as trailing
dividends through that year-end. `CRSP_SPvw` and `Rfree` are returns during the
labelled year. January dates label years, not the observation time of the
year-end levels. The helper skips incomplete rows and returns the complete,
consecutive 1926–2025 sample. Predictor years 1926–2024 pair with returns
1927–2025 at horizon 1; there are 99 observations. Horizon 5 has 95 observations.
If another extract has interior missing years, callers must select a
consecutive retained sample before passing arrays to the regression functions.

Independent references were computed once in the throwaway environment
`/tmp/course-site-task-012-predictive-venv`, outside the repository, using
Python 3.15.0, numpy 2.5.4 and statsmodels 0.15.0. The tests contain the complete
reproduction command. No reference environment or new dependency is committed.

| Horizon (years) | Slope | Newey–West t-statistic | R² |
| --- | --- | --- | --- |
| 1 | 0.042294881064367545 | 0.9445343935393056 | 0.01172402548041096 |
| 5 | 0.210234901023516 | 1.6572753412436707 | 0.0610034035169259 |

The monthly simulator starts from a stationary predictor draw and uses the
shared seeded normal generator. Defaults are T = 600, phi = 0.98, intercept
0.005, b1 = 0.0045, predictor innovation standard deviation sqrt(1 - phi²),
return innovation standard deviation 0.045 sqrt(0.99), and shock correlation 0.
These give population return volatility 0.045 and one-month R² = 0.01.
Custom shock correlations couple shocks in the same month.

Tests include a hand-computed alignment example, equal-seed identity,
persistence recovery within 0.02 from 60,000 observations, innovation and
return moments, shock correlation, and average horizon slopes across 200
seeds with 8,000 observations each. The latter uses absolute tolerance 0.003
at horizons 1, 6 and 12. Domain checks and input immutability are also covered.

Verified implementation revision: `1005daf`. The final Verify sequence is
`npm ci`, `npm test`, `npm run build`, the duplication grep with its fallback,
and `git diff --stat origin/main...HEAD`; it exits 0. The outcome-only commit
does not change the verified implementation. Rebase onto `origin/main`
completed without conflicts. No scope deviations, decision requests or
follow-up work are required. GitHub Actions were not inspected or used.
