# TASK-021 outcome: Library: Euler equation, SDF and Hansen–Jagannathan bound

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes. On revision
  `a3a800f`, `npm test` passed 10 files and 156 tests, including the 9 tests in
  `src/lib/finance/sdf.test.ts`. The table below maps all 7 exports to their references.
- [x] `npm run build` passes. `astro check` reports 0 errors, 0 warnings and 0 hints (45 files), and the static
  build completes.
- [x] `git status --short` shows only `src/lib/finance/sdf.ts`, its test and this outcome file. Before the
  first commit it listed only `?? src/lib/finance/sdf.test.ts` and `?? src/lib/finance/sdf.ts`. This outcome is
  the only other change in the PR.

| Function | Reference evidence in `sdf.test.ts` |
| --- | --- |
| `crraSdf` | `0.96 × 1.2^-2 = 2/3`; with `γ = 0`, `M = β`. |
| `price` | Two-state economy: `0.5 × 0.8 × 2 + 0.5 × 1.0 × 1 = 1.3`; a unit riskless payoff costs `E[M] = 0.9`; an excess return costs 0. |
| `riskFreeRate` | `1/0.9 - 1 = 1/9`. |
| `riskPremiumFromCovariance` | `(10/9) × (1/26) = 5/117`, equal to `E[R^e] = 15/13 - 10/9` computed directly. |
| `hjBoundSharpe` | `0.1/0.9 = 1/9`, equal to the two-state Sharpe ratio `(5/117)/(5/13)`. Three-state case: `0.175/0.925`, strictly above the asset's Sharpe ratio `0.1845`. |
| `hjRegion` | `0.9 × 1/9 = 0.1` and `1.0 × 1/9`; a negative Sharpe ratio uses its absolute value. The linear projection SDF lies exactly on the frontier. |
| `betaPricing` | `β = (-1/26)/0.01 = -50/13`, `λ_M = -0.01/0.9 = -1/90`, `β λ_M = 5/117`. With 50 equally likely seeded states (`normalRng(21)`), `β` equals the `ols` slope and `λ_M` equals `-sampleVariance × (n-1)/n / arithmeticMean`. |

## Summary

What: `src/lib/finance/sdf.ts` holds pure functions for SDF pricing on a finite set of states. Each list has
one value per state. Moments are probability-weighted population moments. The probabilities must be
nonnegative and sum to one; invalid input raises `RangeError`, as in `returns.ts`.

How: `price` is `E[Mx]`. `riskPremiumFromCovariance` uses `E[R^e] = -(1 + R^f) Cov(M, R^e)`. `hjRegion` gives
`E[M] |SR|`, the lower bound of `σ(M)` at each `E[M]` for one asset with Sharpe ratio `SR`. `betaPricing` returns
`β = Cov(R^e, M)/Var(M)` and `λ_M = -Var(M)/E[M]`.

The equality check has two parts. In two states every SDF is linear in a non-constant payoff, so the bound is
tight. In a three-state economy with a nonlinear SDF, the bound is strict. The SDF's projection on the excess
return, `M* = E[M] + b (R^e - E[R^e])`, prices the asset and meets the bound with equality.

Deviations:

- `riskFreeRate` returns the net rate `1/E[M] - 1`. The style guide defines `R^f` as a net rate
  (`R^e = R - R^f`, `r^f = log(1 + R^f)`). The spec's `-R^f Cov(M, R^e)` uses the gross rate, so the code
  writes it as `-(1 + R^f) Cov(M, R^e)`.
- `betaPricing(sdf, excessReturn, probabilities)` takes an excess return. Its beta is the same as for the
  gross return, because `R^f` is a constant.
- `crraSdf` takes one scalar growth rate. A chapter maps it over the states.
- The library does not call `arithmeticMean`, `sampleVariance` or `ols`. Those are equal-weight sample
  estimators, and this library needs probability-weighted population moments. The tests use all three as
  independent references for `betaPricing`.

Verified revision: `a3a800f`, rebased on `origin/main` (`c1d853d`). Local Verify: `npm ci`, `npm test` and
`npm run build` exit 0. GitHub Actions were not read or used.

Proposed follow-ups: none.
