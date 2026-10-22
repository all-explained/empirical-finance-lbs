# TASK-020 outcome

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test`
  passes. On implementation revision `ffcd652`, all 192 tests in 13 files passed,
  including 12 tests in `src/lib/finance/portfolio.test.ts`. Reference values, each
  stated in a test comment:
  - `sampleMeans`, `sampleCovariance`: a 3-period, 2-asset matrix solved by hand
    (means 0.03 and 0.01; variances 0.0004 and 0.0001; covariance −0.0001).
  - `minVarianceWeights`: two uncorrelated assets by hand (m = 0.15 gives (½, ½);
    m = 0.25 gives (−½, 3/2)); three correlated assets against the closed form
    σ²(m) = (A m² − 2Bm + C)/D (Merton, 1972), and the global minimum-variance
    portfolio Σ⁻¹1/A at m = B/A.
  - `frontier`: the two-asset volatilities 0.1, √0.0125 and √0.0925 by hand; the
    three-asset hyperbola at five targets against the same closed form.
  - `tangencyWeights`: the two-asset case Σ⁻¹μᵉ = (5, 2.5) → (2/3, 1/3) by hand.
  - `maxSharpeSquared`: 0.5 by hand for the two-asset case (two independent
    assets with SR² = 0.25 each). For three assets it equals the tangency
    portfolio's own SR², and 200 seeded random portfolios (`normalRng(20)`) never beat it.
  - `betas`: exact betas 1.5 and −0.5 of linear returns; on seeded noisy returns
    (`normalRng(7)`), Cov(Rᵉ_j, Rᵉ_m)/Var(Rᵉ_m) from `sampleCovariance`.
  - `securityMarketLine`: the exact line 0.01 + 0.04β, and a 4-point noisy fit
    solved by hand (slope 0.002/0.2 = 0.01, intercept 0.04).
  - Equal means, mismatched shapes, a singular Σ and a zero 1'Σ⁻¹μᵉ throw.
- [x] `npm run build` passes. `astro check` reported 0 errors, 0 warnings and
  0 hints, and the static build completed (3 pages).
- [x] `git status --short` shows only `src/lib/finance/portfolio.ts`, its test and
  this outcome file. After the library commit the working tree was clean; this
  outcome file is the only other change.

## Summary

What: `src/lib/finance/portfolio.ts` exports `sampleMeans`, `sampleCovariance`,
`minVarianceWeights`, `frontier`, `tangencyWeights`, `maxSharpeSquared`, `betas` and
`securityMarketLine`, plus the `FrontierPoint` and `SecurityMarketLine` types.

How:
- A return matrix is T × N: one row per period, one column per asset, like the
  rows of the data loaders.
- `sampleMeans` reuses `arithmeticMean` per column. `sampleCovariance` uses the
  T − 1 denominator and reuses `sampleVariance` for the diagonal.
- `minVarianceWeights` and `frontier` share one private helper. It inverts Σ once
  (`inverse` from `src/lib/math/linalg.ts`) and returns
  w = [(C − Bm)Σ⁻¹1 + (Am − B)Σ⁻¹μ]/D. Weights sum to one (risky assets only, no
  riskless asset). Equal means (D = 0) throw.
- `tangencyWeights` returns Σ⁻¹μᵉ / 1'Σ⁻¹μᵉ and throws when that sum is zero.
  `maxSharpeSquared` is a separate export: μᵉ'Σ⁻¹μᵉ.
- `betas` runs `ols` (with intercept) of each asset column on the market excess
  return. `securityMarketLine` runs `ols` of mean excess returns on betas and
  returns `{ intercept, slope }`.

Deviations / interpretations:
- `frontier(mu, Sigma, points)`: `points` is the list of target means, not a
  count. The widget in TASK-027 knows its own y-range, so it picks the targets.
- `maxSharpeSquared` is its own function rather than a field of `tangencyWeights`.
- `betas` returns slopes only (no alphas); `ols` gives them if a chapter needs them.

Verified revision: `ffcd652`. The full spec Verify sequence (`npm ci`, `npm test`,
`npm run build`, `git status --short`) exited 0.

Proposed follow-ups: none.
