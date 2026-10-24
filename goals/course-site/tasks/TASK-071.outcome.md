# TASK-071 outcome: Library: conditional betas, scaled factors and the scaled CCAPM

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes.
  Evidence: `src/lib/finance/conditional.test.ts` has 11 tests covering all six exports
  (`betaPremiumDecomposition`, `simulateConditionalCapm`, `scaledFactors`, `managedPortfolios`,
  `quarterlyPanel`, `conditionalModelFits`). `npm test`: 42 files, 435 tests passed, exit 0.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `astro check` "Result (132 files): - 0 errors"; 18 pages built; exit 0.
- [x] `git status --short` shows only `src/lib/finance/conditional.ts`, its test and this task's outcome file.
  Evidence: the PR diff against `main` holds exactly these three files; `git status --short` is empty after commit.

## Summary

**What.** `src/lib/finance/conditional.ts`:

- `betaPremiumDecomposition(beta, lambda)`: mean of β_tλ_t = β̄λ̄ + Cov, divisor T.
- `simulateConditionalCapm(seed, …)`: stationary Gaussian AR(1) state z_t (`stateSd` is its
  unconditional sd), β_t = β_0 + b z_t, λ_t = λ_0 + l z_t, market R^e_{m,t+1} = λ_t + σ_m ε, asset
  R^e_{i,t+1} = β_t R^e_{m,t+1} + σ_ε ε. Returns the paths, the unconditional OLS alpha (with its
  classical se) and beta, and the decomposition. The doc comment derives the population
  unconditional alpha, α^u = b l σ_z² · [1 − λ_0² / (l²σ_z² + σ_m²)], which is zero when b = 0 or l = 0.
- `scaledFactors(factors, z)`: rows [f_{t+1}, z_t, z_t f_{t+1}]; `managedPortfolios(excess, z)`:
  R^e_{t+1} ⊗ (1, z_t). The managed-portfolio argument is derived from E_t[M R^e] = 0 in the doc comment;
  nothing is attributed to Cochrane (2005).
- `quarterlyPanel({ ff3, ff25, cay }, { start, end? })`: compounds French months into calendar quarters
  with `grossGrowth`, dated like `fred-cay-quarterly`; Δc_{t+1} from `cayInputs` and lagged cay_t from
  `fullSampleCay` (look-ahead noted in the doc comment).
- `conditionalModelFits(panel, models)`: `timeSeriesRegressions` then `crossSectionalRegression`
  (intercept, OLS) for `capm`, `ff3`, `ccapm`, `scaled-ccapm`.

Lettau & Ludvigson (2001, JPE) pages cited in doc comments: eq. 2 p. 1246, eq. 4 p. 1247, fn. 17 p. 1254,
sample and demeaning p. 1255, eq. 15 and timing p. 1260–1261, tables 1 and 3.

**Pinned results on LL's window 1963-Q3–1998-Q3 (141 quarters, as in LL).** Cross-sectional R²:
CAPM 0.021 (LL 0.01), FF3 0.815 (LL 0.80), CCAPM 0.073 (LL 0.16), scaled CCAPM 0.546 (LL 0.70).
The ranking matches LL. The gaps for the consumption models are expected: public consumption keeps
shoes and clothing, and full-sample cay here is estimated on 1952–2026, not on LL's sample.

**Deviations / choices.**

- SMB and HML are compounded as returns, ∏(1 + f) − 1; Mkt-RF is the compounded market return
  (Mkt-RF + RF) minus compounded RF.
- `scaled-ccapm` demeans cay over the panel, as LL do (p. 1255). This moves λ̂ on Δc only; a test
  checks that the fit is the same without demeaning.
- `simulateConditionalCapm` also returns `alphaSE`, so tests and widgets can state sampling error.

**Verified revision.** `ac772fa` (code) rebased on `origin/main` `fceeee7`, plus this outcome file.
`npm ci`, `npm test`, `npm run build` all exit 0.

**Proposed follow-ups.** None needed for TASK-076. A real-time cay variant (`realTimeCay`) could be added
later if a chapter wants to show the look-ahead effect on the scaled CCAPM.
