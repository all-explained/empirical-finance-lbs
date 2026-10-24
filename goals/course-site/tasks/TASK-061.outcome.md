# TASK-061 outcome: Library: the F distribution, time-series factor regressions and GRS

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes.
  Evidence: `npm test` printed `Test Files  37 passed (37)` and `Tests  394 passed (394)`, including the
  19 new tests. Reference per export:
  - `logGamma`: log √π at 0.5, 0 at 1, log 24 at 5, Python `math.lgamma(10.5) = 13.940625219403762`.
  - `regularizedBeta`: `scipy.special.betainc` at (0.3; 2.5, 3.5), (0.9; 0.5, 0.5), (0.4; 50, 60); $I_x(1,1) = x$.
  - `fCdf`: tabulated $F_{0.95}(2, 10) = 4.1028$, $F_{0.99}(5, 20) = 4.1027$, and
    `scipy.stats.f.ppf(0.95, 25, 1000) = 1.5171299547`; `fCdf + fSurvival = 1` to 1e-13 on five cases.
  - `fSurvival`: `scipy.stats.f.sf(40, 25, 500) = 1.85214e-102` to 9 significant digits.
  - `factorPanel`: row 1963-07 rebuilt from the raw percent cells; inclusive end date; `RangeError` on shifted dates
    and on an empty window.
  - `timeSeriesRegressions`: a hand-computed T = 5, N = 2, K = 1 panel (alphas, betas, alpha standard errors,
    t-statistics, residuals, $\hat\Sigma_\varepsilon$ and $\hat\Sigma_f$ with divisor $T$).
  - `grs`: $\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha = SR^2_{\text{all}} - SR^2_f$ to 1e-10 on a seeded
    panel (`normalRng(61)`); statistic below 1e-20 and p-value 1 when every alpha is exactly zero; with N = 1 the
    statistic equals the squared alpha t-statistic to 1e-10; on the committed data, one test per model pins the
    dates (1963-07-01 to 2026-08-01, T = 758) and the statistic and p-value against numpy least squares plus
    `scipy.stats.f.sf`: CAPM 4.196288229864 (p = 7.449e-11, df 25 and 732); FF3 3.642563002223
    (p = 8.300e-9, df 25 and 730).
  - `sharpeFrontiers`: every grid point (upper and lower branch) and the minimum-variance point lie on
    `frontier` from `portfolio.ts` for the same moments, to 1e-12; the squared tangent slopes equal `grs`'s
    `sharpeFactors2` and `sharpeAll2`; one factor gives the single point $(\sigma_f, \bar f)$ by hand.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `npm run build` printed `Result (118 files):`, `- 0 errors`, `- 0 warnings`, `- 1 hint` (the unused
  `Matrix` import in `src/lib/finance/news.ts`, not in this task's files), then `15 page(s) built` and `Complete!`.
  The whole chain `npm ci && npm test && npm run build && git status --short` exited 0.
- [x] `git status --short` shows only the four files named and this task's outcome file.
  Evidence: before the first commit it printed only
  `?? src/lib/finance/timeSeriesTests.test.ts`, `?? src/lib/finance/timeSeriesTests.ts`,
  `?? src/lib/math/distributions.test.ts`, `?? src/lib/math/distributions.ts`. This outcome file is the fifth.

## Summary

**What.** `src/lib/math/distributions.ts` adds `logGamma` (Lanczos, g = 7), `regularizedBeta` (continued fraction
by the modified Lentz method, Numerical Recipes §6.4, with the symmetry switch), `fCdf` and `fSurvival` (the upper
tail is computed directly as $I_{d_2/(d_2 + d_1 x)}(d_2/2, d_1/2)$, so tiny GRS p-values keep their digits).
`src/lib/finance/timeSeriesTests.ts` adds `factorPanel`, `timeSeriesRegressions`, `grs` and `sharpeFrontiers`.

**How.** Each regression is `ols` with classical errors (alpha standard error with $s^2$ divisor $T-K-1$).
$\hat\Sigma_\varepsilon$ and $\hat\Sigma_f$ use the maximum-likelihood divisor $T$: `sampleCovariance` times
$(T-1)/T$. The GRS doc comment cites Gibbons, Ross & Shanken (1989), Econometrica 57, p. 1146 (the L-portfolio
statistic, F(N, T−N−L)) and p. 1124 (eqs. 4–6, one portfolio). It explains that the paper's factor
$(T/N)(T-N-K)/(T-K-1)$ with the unbiased residual covariance equals $(T-N-K)/N$ with the ML one. `grs` uses `solve`
for $\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha$ and `maxSharpeSquared` for both squared Sharpe ratios.
`factorPanel` uses `betweenDates` on both series and fails with a `RangeError` unless their dates match month by month.

**Deviations.**
- `sharpeFrontiers` takes a grid of standard deviations, but `frontier` takes target means. So it inverts the same
  frontier in closed form, $m = [B \pm \sqrt{D(A\sigma^2 - 1)}]/A$, with $A$ and $B$ from `solve` and $C$ from
  `maxSharpeSquared`. The test checks every point against `frontier`. It returns both branches, the
  minimum-variance point and the maximum Sharpe ratio (the slope of the tangent line from the origin) for each set.
  With one factor (CAPM) the factors-only frontier is one point; the branches are then NaN and `minVariance` holds it.
- With N = 1 the "divisor scaling" between GRS and the squared alpha t-statistic is exactly 1, and the test says why.

**Verified revision.** `cb7b4de` (the library commit); this outcome adds no code.

**Notes.** The machine load average was about 40 during Verify. One run had four unrelated slow tests
(`tests/chapter04-numbers`, `chapter11-numbers`, `chapter12-numbers`, `cay.test.ts`) pass the 5 s Vitest timeout;
the rerun of the full chain passed with no change.

**Proposed follow-ups.** None needed for TASK-063: chapter 16 can call `factorPanel`, `timeSeriesRegressions`
(for `AlphaBars`), `grs` and `sharpeFrontiers` (for `GRSGeometry`) directly.
