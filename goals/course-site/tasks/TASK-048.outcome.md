# TASK-048 outcome: Library: Stambaugh bias and simulated test size

PR: https://github.com/all-explained/empirical-finance-lbs/pull/33

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes.
  Evidence: `src/lib/stats/stambaugh.test.ts` states each reference value in the test.
  `kendallBias`, `stambaughBias` and `biasCorrectedSlope` by hand (-0.037, 0.0185, 0.0815).
  `quantile`, `upperCriticalValue` and `rejectionRate` on `[5, 3, 1, 4, 2]` (1.4, 3, 4.6, 0.4).
  `predictiveSystem` on a built 8-pair series with bHat = 0.5, phiHat = 0, sigmaV2 = sigmaUV = 2/3,
  sigmaUU = 2, corr = 1/sqrt(3), tStat = sqrt(0.5).
  `simulateSlopes`: with `corr = 0` the mean bHat is within 2 Monte Carlo standard errors of 0;
  with phi = 0.98, `corr` = -0.9, T = 100 the mean bHat is 0.00916 > 0 and within 20% of
  `stambaughBias` = 0.00798, and the nominal one-sided 5% test (1.645) rejects 23% of the time;
  the same seed gives the same draws, and sample i uses the same derived seed for every phi, `corr` and T.
  `npm test`: `Test Files 24 passed (24)`, `Tests 276 passed (276)`.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `Result (85 files): - 0 errors`, then `[build] Complete!`, exit 0.
- [x] `git status --short` shows only `src/lib/stats/stambaugh.ts`, its test and this task's outcome file.
  Evidence: before the first commit it showed only `?? src/lib/stats/stambaugh.test.ts` and
  `?? src/lib/stats/stambaugh.ts`; the PR diff holds those two files and this outcome file.

## Summary

**What.** `src/lib/stats/stambaugh.ts` adds the first-order Kendall and Stambaugh biases, the plug-in
bias-corrected slope, `predictiveSystem` (both equations on one common sample of T = length - 1 pairs,
classical t-statistic, residual (co)variances over T - 2 as in `fitAR1`), `simulateSlopes`, and the
quantile, one-sided critical value and rejection-rate helpers.

**How.** `predictiveSystem` and `simulateSlopes` call `predictiveRegression(r, x, 1, { errors: 'classical' })`
and `fitAR1`; residuals come from their intercepts and slopes, so no OLS code is copied.
`simulateSlopes` draws one seed per sample from `mulberry32(seed)` and passes it to
`simulatePredictive({ T: T + 1, b1: 0, phi, corr })`. The seed of sample i does not depend on phi, `corr`
or T, and `simulatePredictive` draws its normals in the same order for any phi and `corr`, so a slider
reshapes one fixed set of samples. T is the regression sample size, so each sample simulates T + 1 periods.

**Timing.** 2,000 samples on Node 26, Apple Silicon: about 1.3 s at T = 600 and 0.31 s at T = 100.
About 95% of this is the two `ols` calls per sample (QR plus the influence rows they build for
standard errors); the simulation itself is about 0.1 s. This is fine for a computation on slider release
or in a Web Worker, but too slow to recompute on every slider tick at T = 600.

**Deviations.** None from the spec. `simulateSlopes` uses `simulatePredictive`'s default shock scales
(sigma_u = 0.045 sqrt(0.99), sigma_v = sqrt(1 - phi^2)), since the spec's options carry no scales; the
test states these to compute `stambaughBias`. The t-statistic is scale-free, so test size does not depend on them.

**Verified revision.** Library commit 5267322 on `goal/course-site/task-048`, with `npm ci`, `npm test`
and `npm run build` run locally.

**Proposed follow-ups.**
- Before TASK-051: if the widget must recompute on every slider tick at T = 600, add a fast path to
  `ols` for one regressor with classical errors (skip the influence rows), or recompute on slider
  release, or cap the samples. This change is outside this task's files.
- TASK-051 needs sigma_uv / sigma_v^2 for the theory line. A later edit could have `simulateSlopes`
  return it, instead of the widget repeating `simulatePredictive`'s default scales.
