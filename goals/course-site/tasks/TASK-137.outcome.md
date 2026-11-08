# TASK-137 outcome

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX
  macro check.
  Evidence: `src/lib/finance/longRunRisk.test.ts` tests every export: `byParameters` and `bkyParameters`
  (Beeler & Campbell's Table I, pdf p. 34), `epsteinZinTheta` (1 at γ = 1/ψ, −27 at the calibrations),
  `solveLongRunRisk` (power-utility limit equal to `impliedRiskFree` within 1e-10; A₁ = (1 − 1/ψ)/(1 − ρ_c φ_x);
  residuals below 1e-12; the closed forms of BKY eq. (11); E(rf) and the premium of Table V),
  `simulateLongRunRisk` (seeded, σ²_t > 0, x_t ≡ 0 with the same shocks, E[M e^r] = 1 within 1e-3 for BY
  and 2e-3 for BKY), `annualise` (hand computation; Table II), `lrrVarianceRatio` (direct sum; seeded path
  within 2% at 120 months), `consumptionPredictability` and `annualConsumptionPredictors` (pinned values at
  1, 3 and 5 years; Table VI over 1930–2006). `src/lib/stats/autocorr.test.ts` tests `varianceRatio` (hand
  computation; 100,000 white-noise draws within 0.05 of 1). `npm test`: 80 files, 885 tests passed;
  `tests/notation.test.ts` (the KaTeX macro check): 4 passed.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `Result (234 files): 0 errors, 0 warnings, 1 hint` (the hint is the existing issue #88 in
  `news.ts`); 37 pages built.
- [x] The outcome compares the library's moments with Beeler & Campbell's Table II (p. 35) for both
  calibrations.
  Evidence: the table under "Table II comparison" below.
- [x] `docs/STYLE_GUIDE.md` §3 has a Part X block with the long-run risks symbols, and the outcome lists each
  with the clash it avoids.
  Evidence: the block "Part X: habits, long-run risk and disasters (Chapters 37–39)" sits after the Part IX
  block, in one table with the Chapter 39 rows TASK-138 added; the list under "Symbols" below.
- [x] `git status --short` shows only the files the spec names.
  Evidence: before the commit it showed `M docs/STYLE_GUIDE.md`, `M src/lib/stats/autocorr.test.ts`,
  `M src/lib/stats/autocorr.ts`, `?? src/lib/finance/longRunRisk.test.ts`, `?? src/lib/finance/longRunRisk.ts`,
  plus this outcome file. `varianceRatio` was added to `autocorr.ts`, because `overlapMeanVariance` is the
  variance of a mean of overlapping sums, not a variance ratio.

## Table II comparison

Seed 1, 1,200,000 months (Beeler & Campbell's length), put through `annualise`: 99,999 years of growth.
Means and standard deviations in annual percent, except the log price–dividend ratio (log units).
"BC" is Table II (working paper, pdf p. 35); "lib" is this library.

| Moment | BY: BC | BY: lib | BKY: BC | BKY: lib |
|---|---|---|---|---|
| E(Δc) | 1.79 | 1.76 | 1.82 | 1.78 |
| σ(Δc) | 2.92 | 2.92 | 2.96 | 2.91 |
| AC1(Δc) | 0.51 | 0.51 | 0.44 | 0.44 |
| E(Δd) | 1.66 | 1.75 | 1.85 | 1.84 |
| σ(Δd) | 11.57 | 11.44 | 16.42 | 16.18 |
| AC1(Δd) | 0.40 | 0.40 | 0.29 | 0.28 |
| E(r) | 6.62 | 6.72 | 6.58 | 6.57 |
| σ(r) | 16.88 | 16.83 | 21.35 | 21.23 |
| AC1(r) | 0.03 | 0.03 | 0.02 | 0.01 |
| E(rf) | 2.56 | 2.56 | 0.99 | 0.99 |
| σ(rf) | 1.30 | 1.31 | 1.28 | 1.27 |
| AC1(rf) | 0.85 | 0.85 | 0.86 | 0.86 |
| E(pd) | 3.00 | 3.00 | 3.04 | 3.04 |
| σ(pd) | 0.16 | 0.16 | 0.26 | 0.26 |
| AC1(pd) | 0.77 | 0.78 | 0.95 | 0.95 |

The test checks E(Δc) within 0.06, σ(Δc) within 0.1, E(r) and E(r − rf) within 0.15, E(rf) within 0.05
(percentage points), and E(pd) within 0.02, σ(pd) within 0.01 and AC1(pd) within 0.02. The gaps that remain
are of the size of the sampling error of two independent long paths: x_t is persistent, so a 100,000-year
mean of Δc is uncertain to about 0.02 points per path, and of Δd to about 0.07. Table II's E(r) is the mean
log market return, not the excess return.

The analytical solution at σ²_t = σ̄²: BY gives E(rf) = 2.58% and the premium of BKY eq. (10) 5.54%
(Beeler & Campbell's Table V, pdf p. 39: 2.58 and 5.58); BKY gives 1.28% and 6.42%. In BKY the variance floor
binds in 1.1% of months and raises the mean of σ²_t from σ̄² = 5.18e-5 to 7.22e-5. The risk-free rate loads
−11.25 on σ²_t, so at that mean it is 1.00%, the simulated 0.99%.

## Symbols

The Part X block of `docs/STYLE_GUIDE.md` §3, each symbol with the papers' symbol and the clash it avoids:

- $\theta_{\text{EZ}}$ (papers: θ): the Epstein–Zin exponent. Bare θ is the GMM parameter vector.
- $x_t$ (papers: x_t): the persistent part of expected consumption growth. Kept as the papers' letter; it
  is a predictor in the §3 sense.
- $\sigma_t$, $\sigma^2_t$, $\bar\sigma$ (papers: the same): conditional volatility and its long-run level.
  Distinct from $\sigma_c$, the unconditional standard deviation of Δc; the bar marks a parameter, not a
  sample mean.
- $\sigma_w$ (papers: σ_w): the volatility of the variance shock. The subscript names the shock, never
  portfolio weights w or log wealth w_t.
- $\phi_x$ (papers: ρ): persistence of x_t. ρ is a Campbell–Shiller constant here.
- $\phi_\sigma$ (papers: ν, ν₁): persistence of σ²_t. ν₁, ν₂ are the shrinkage penalties of Chapter 30.
- $\varphi_e$, $\varphi_d$ (papers: φ_e, φ_d or φ): volatility multiples. Always subscripted, so never the
  NIPA filter weight φ (Chapter 36) or the normal PDF.
- $\mu_d$ (papers: μ_d): mean dividend growth, as $\mu_c$ (Part IX) is for consumption.
- $\beta_{d,x}$, $\beta_{d,\eta}$ (papers: φ; π or π_d): dividend leverage and exposure to the consumption
  shock. φ is AR(1) persistence and π a state probability here.
- $\eta_{t+1}$, $e_{t+1}$, $w_{t+1}$, $u_{t+1}$ (papers: the same): the four shocks, dated t+1, so η_{t+1}
  never reads as the conditional SDF intercept η_t (Chapter 22) and w_{t+1} never as weights or log wealth.
- $\lambda_\eta$, $\lambda_e$, $\lambda_w$ (papers: the same): prices of risk per unit of variance, always
  with a shock subscript, so never bare λ, a premium per unit of beta, or a factor index.
- $\beta_{m,\eta}$, $\beta_{m,e}$, $\beta_{m,w}$ (papers: β_{η,m} and so on): market loadings, asset first
  as in $\beta_{i,k}$.
- $r_{c,t+1}$, $pc_t$ (papers: r_c or r_a, z_t): the consumption claim's return and log price–consumption
  ratio. z_t is the Part V state variable and the human-capital gap of Chapter 14.
- $A_0$, $A_1$, $A_2$; $A_{0,m}$, $A_{1,m}$, $A_{2,m}$ (papers: the same): loadings of pc_t and pd_t.
  Always with a number in the subscript, so never the VAR coefficient matrix A.
- $\rho_c$, $\kappa_c$; $\rho_m$, $\kappa_m$ (papers: κ₁, κ₀; κ_{1,m}, κ_{0,m}): the Campbell–Shiller
  constants of each claim. They are the §3 ρ and κ, so they keep those letters with a claim subscript.
- $\mathit{VR}(k)$: the variance ratio. Italic letters, always with its horizon.

## Summary

What and how:

- `src/lib/finance/longRunRisk.ts` holds the two calibrations, `epsteinZinTheta`, `solveLongRunRisk`,
  `simulateLongRunRisk`, `annualise`, `lrrVarianceRatio`, `consumptionPredictability` and
  `annualConsumptionPredictors`. It reuses `linearisationConstants`, `goyalWelchAnnualPresentValue`,
  `horizonSlopes`, `bisection` and `normalRng`, and copies none of them.
- `solveLongRunRisk` solves each claim's fixed point mean = A₀ + A₂σ̄² by bisection to adjacent floating-point
  numbers, with ρ and κ from `linearisationConstants` at that mean, and reports the residual (below 7e-13 on
  both calibrations). The dividend claim's coefficients are derived in the doc comment from
  E_t[exp(m + r_m)] = 1. A claim with no finite price (Table V's NA cells) throws.
- `epsteinZinTheta` refuses ψ = 1, where θ_EZ is infinite and the solution divides by it.
- `simulateLongRunRisk` floors σ²_t at 1e-12, the "small positive number" Beeler & Campbell use (pdf pp. 6
  and 8). `persistent: false` solves the model with φ_e = 0 and uses the same draws, so x_t ≡ 0 and σ²_t is
  unchanged.
- `annualise` sums monthly levels to years, takes growth, then logs (Table II note, pdf p. 35); sums log
  returns within the year; and takes pd from the year's last month less log 12.
- `varianceRatio` in `src/lib/stats/autocorr.ts` uses the Bartlett-weighted sample autocorrelations.
  `lrrVarianceRatio` gives the exact ratio at constant volatility, derived in its doc comment.
- `annualConsumptionPredictors` aligns annual Δc and pd over the common years, 1930–2025 on the committed data.

Deviations:

- Table II does not say how the model's annual pd is scaled. Subtracting log 12 from the last month's monthly
  pd reproduces Table II's mean, standard deviation and AC1 for both calibrations; the doc comment says so.
- `consumptionPredictability` uses `horizonSlopes`' Newey–West standard errors with k lags; Beeler & Campbell
  use 2(k − 1). The doc comment names this limit. Slopes and R² do not depend on it.

Verified revision: the commit that adds this file, rebased on `origin/main` at `58aa962` (TASK-138 merged).
The Part X rows of both tasks share one table; every TASK-138 row is kept. Verify: `npm ci`, `npm test`
(885 passed), `npm run build` (0 errors) and `git status --short`, all exit 0.

Proposed follow-ups: none.
