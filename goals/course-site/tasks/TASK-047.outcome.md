# TASK-047 outcome

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test`
  passes. On implementation revision `429677e`, all 281 tests in 24 files passed,
  including 12 tests in `src/lib/finance/news.test.ts`. Reference values, each stated
  in a test comment:
  - `newsWeights`: for `A = [0 0.5; 0 0.5]` and `rho = 0.9`, solved by hand,
    `lambda_DR' = (0, 9/11)` and `lambda_CF' = (1, 9/11)`. The comment checks 9/11 by
    the geometric sum `0.45/0.55`. The same system with the return second
    (`returnIndex = 1`) gives `(9/11, 0)` and `(9/11, 1)`. With `A = 0` there is no
    discount-rate news: `lambda_DR' = 0` and `lambda_CF' = e_1'`.
  - `newsDecomposition`: on a seeded synthetic VAR(1) of `(r, x)` (400 periods),
    `N_CF − N_DR` equals the unexpected return to 1e-12 in every period, the three
    shares sum to 1 (to 1e-12), the unexpected return equals the `ols` residual of
    the return equation, and the weights equal `newsWeights` on the fitted `A`.
  - `simulateDogNull`: 2,000 samples of `T = 80` with `phi = 0.94`, `rho = 0.96`.
    Every draw satisfies `br − bd + rho phiHat = 1` to 1e-10. The covariance sets
    `cov(e^d, e^dp) = rho var(e^dp)`, so the return shock is uncorrelated with the dp
    shock and `br` has no small-sample bias. Its mean is then 0 within 4 Monte Carlo
    standard errors (observed mean 0.0008). The same seed gives equal draws; another seed does not.
    `abs(phi) ≥ 1` and a covariance that is not positive definite throw.
  - `dogTailShares`: four hand-made draws against a data estimate, hand-counted
    shares `{ br: 0.5, bd: 0.5, longRun: 0.25 }`, with ties counted as "at or above".
- [x] `npm run build` passes. `astro check` reported "Result (85 files)" with
  0 errors, and the static build completed (10 pages).
- [x] `git status --short` shows only `src/lib/finance/news.ts`, its test and this
  outcome file. Before the library commit it listed exactly
  `?? src/lib/finance/news.test.ts` and `?? src/lib/finance/news.ts`.

## Summary

What: `src/lib/finance/news.ts` adds `newsWeights`, `newsDecomposition`,
`simulateDogNull` and `dogTailShares`, with the types `NewsWeights`,
`NewsDecomposition`, `DogNullOptions`, `DogDraw` and `DogTailShares`.

How:
- `newsWeights(A, rho, returnIndex = 0)` returns `{ discountRate, cashFlow }`: row
  `returnIndex` of `rho A (I − rho A)^(-1)`, from `matMul`, `inverse` and `identity`,
  and that row plus `e_1'`.
- `newsDecomposition(series, rho, returnIndex = 0)` calls `fitVAR1(series)`, computes
  `epsilon_{t+1} = z_{t+1} − c − A z_t`, and returns per period `unexpected`,
  `cashFlow` and `discountRate`. It also returns `shares` (`cashFlow`, `discountRate`,
  `covariance` = `−2 Cov / Var`), `weights` and the `fit`. The variances use `T − 1`,
  which cancels in the shares.
- `simulateDogNull({ T, phi, rho, residualCov, samples, seed })` uses one
  `normalRng(seed)` stream for all samples. `residualCov` is the 2×2 covariance of
  `(epsilon^dp, epsilon^d)`, in that order. Shocks come from its 2×2 Cholesky factor.
  `dp_0` is a draw from the stationary distribution, then `T` steps give `T` regression
  observations. Returns come from the identity, and `br`, `bd`, `phi` are the `ols`
  slopes (with intercept) of `r_{t+1}`, `Δd_{t+1}` and `dp_{t+1}` on the same `dp_t`.
- `dogTailShares(draws, estimates, rho)` returns `{ br, bd, longRun }`, the shares of
  draws at or above the data's `br`, `bd` and `br / (1 − rho phi)`. `estimates` has the
  shape of one draw.

Sanity check (not committed): with uncorrelated shocks (`cov = 0`, same `T`, `phi`,
`rho`, seed 3), the mean `br` was 0.053 and the mean `phiHat` 0.886. That is the expected
upward bias of `br` and downward bias of `phiHat` in small samples.

Deviations and notes for TASK-050:
- The spec does not fix the order of `residualCov`. I chose `(epsilon^dp, epsilon^d)`,
  the order in which the spec states the two equations. The JSDoc says so.
- `T` counts regression observations, so each sample draws `T + 1` values of `dp`.
- A draw with `phiHat ≥ 1/rho` has a long-run slope of infinite or flipped sign.
  `dogTailShares` does not filter such draws. With realistic `phi` this is rare.
- No new symbol or colour. `rho` is only the Campbell–Shiller constant. No correlation
  appears in the code.

Verified revision: `429677e`. The full spec Verify sequence (`npm ci`, `npm test`,
`npm run build`, `git status --short`) exited 0.
