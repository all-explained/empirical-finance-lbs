# TASK-046 outcome: Library: Campbell–Shiller log-linearisation and variance shares

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes. `npm test` passed
  24 files and 277 tests, including the 8 tests in `src/lib/finance/presentValue.test.ts`. The table below maps
  all 8 exports to their references.
- [x] `npm run build` passes. `astro check` reports `Result (85 files): 0 errors, 0 warnings, 0 hints`, and the
  static build prints `Complete!`.
- [x] `git status --short` shows only `src/lib/finance/presentValue.ts`, its test and this outcome file. Before
  the first commit it listed only `?? src/lib/finance/presentValue.test.ts` and `?? src/lib/finance/presentValue.ts`.
  `git diff --stat origin/main` shows those two files plus this outcome.

| Function | Reference evidence in `presentValue.test.ts` |
| --- | --- |
| `linearisationConstants` | At `log 30`: `ρ = 30/31`, `κ = log 31 − (30/31) log 30`. At 0: `ρ = 1/2`, `κ = log 2`. |
| `exactLogReturn` | At `pd_t = pd_{t+1} = log 30`, `Δd = 0.02`: `log(31/30) + 0.02`. Equals the data's `r[t]` every year. |
| `approxLogReturn` | Agrees with the exact return at the mean. Hand case `log 2 − 1.49`. Lies below the exact return off the mean (tangent to a convex function). |
| `longRunCoefficient` | `0.1/0.136`; `−0.02` when `φ = 0`. |
| `impliedReturnSlope` | `1 − 0.96·0.9 + 0.01 = 0.146`; `0` at `ρ = φ = 1`, `b_d = 0`. |
| `presentValueSlopes` | Hand OLS on `dp = [0,1,2,4]`: `φ = 1.5`, `b_r = 2`, `b_d = 1.5`, long-run 8 and 6, gap `−0.25`. On a seeded series built from the linear identity, `|gap| < 1e-10`. |
| `varianceShares` | Hand values at `k = 1` (2, −1.5, 0.75) and `k = 2` (3, −2, 0.5). On the synthetic series the three shares sum to 1 within 1e-10 for every `k` from 1 to 40. |
| `goyalWelchAnnualPresentValue` | Years 1872–2025 (154). At the sample mean pd, `ρ = 0.9635228477409029`, `κ = 0.15658199539800677`. Largest absolute linearisation error `0.023523414346445892`, in 1917. Reference values from an independent Python pass over the same JSON file. |

## Summary

What: `src/lib/finance/presentValue.ts` holds the Campbell–Shiller maths for chapters 10 and 11.

How:

- `linearisationConstants` computes `ρ` as `1/(1 + e^{−pd})`, which equals `e^{pd}/(1 + e^{pd})` and does not
  overflow. `κ` uses `log1p`.
- `goyalWelchAnnualPresentValue` takes the latest run of consecutive years with `Index` and `D12`, then drops its
  first year. `pd[t]` and `dp[t]` are year-end values. `r[t] = log((P_t + D_t)/P_{t−1})` and `dd[t]` are earned
  during year `dates[t]`, as in `goyalWelchAnnualPredictors`. So `dp[t]` predicts `r[t+1]`, and `r[0]`, `dd[0]`
  are never used by the slopes. All series come from `Index` and `D12`, so the exact identity holds to 1e-13 and
  the only gap is the linearisation error. The doc comment says why `CRSP_SPvw` is not used: it is a different
  index, with its own dividends, and starts in 1926.
- `presentValueSlopes` runs `ols` of `r[t+1]`, `dd[t+1]` and `dp[t+1]` on `dp[t]` on the same `T − 1` pairs.
- `varianceShares` uses the same `T − k` dates for all three terms. It reuses `arithmeticMean` and
  `sampleVariance` (n − 1 denominators) for the covariance and variance.

Deviations:

- `presentValueSlopes` returns `{ br, bd, phi, brLongRun, bdLongRun, gap, nobs }`. The spec did not fix the field
  names for the long-run coefficients.
- `r` is the total log return, not an excess return, because the identity is in total returns.

Verified revision: the PR head, rebased on `origin/main` (`b6ddc2d`). Local Verify: `npm ci`, `npm test` and
`npm run build` exit 0. GitHub Actions were not read or used.

Proposed follow-ups: none.
