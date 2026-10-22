# TASK-011 outcome

## Acceptance

- [x] `npm test` passes and includes the new tests. On implementation revision
  `5d30657`, all 100 tests in five files passed, including 43 tests in
  `src/lib/stats/ols.test.ts`.
- [x] All four covariance choices and the intercept switch have independent
  reference tests. Twenty cases compare coefficients, full covariance matrices,
  standard errors, t statistics and fit statistics against statsmodels 0.15.0
  with numpy 2.5.4. The fixed dataset has 40 observations. Cases cover classical,
  HC0, HC1, Newey–West with four lags, and Hansen–Hodrick with four lags, each
  with one regressor, two regressors, no intercept, and an intercept-only fit.
  The test comment contains the complete reproduction command and versions.
  Rerunning that program reproduced all pasted reference values exactly.
- [x] No new runtime dependency. `git diff origin/main...HEAD -- package.json
  package-lock.json` produced no output. The reference environment is outside
  the repository at `/tmp/course-site-task-011-ols-venv`; no Python environment
  or reference-generation artifact is included in the change.
- [x] `npm run build` passes. Astro reported zero errors, warnings or hints in
  its type check and built the static site successfully. The existing empty
  chapter collection emits informational build warnings.

## Summary

Added `src/lib/stats/ols.ts`, a pure TypeScript OLS implementation with an
optional intercept. It returns coefficients, standard errors, t statistics,
residuals, fitted values, R squared, adjusted R squared, observation count,
and the coefficient covariance matrix.

Column scaling and Householder QR avoid forming or inverting `X'X`.
Triangular solves supply the covariance calculations. Comments document
classical, White HC0/HC1, Bartlett-weighted Newey–West and equal-weight
Hansen–Hodrick formulas. Inputs are checked for length, finite values,
positive residual degrees of freedom, rank and valid lag counts.

Tests also check zero-lag equivalence with HC0, residual orthogonality,
the intercept-only mean and standard error, the correlation identity for
R squared, different regressor scales, a nearly constant regressor,
input immutability, invalid inputs and negative Hansen–Hodrick variances.

Verified implementation revision: `5d30657`. The complete spec Verify sequence
(`npm ci`, `npm test`, `npm run build`, and both git diff commands) exited 0.
`npm run screenshots` also exited 0 for dark/light themes at desktop/phone sizes.
Only the library, its tests and this outcome are changed. No scope deviations,
decision requests or follow-up work are required.
