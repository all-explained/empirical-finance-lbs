# TASK-056 outcome: Library: option strips, SVIX and the Martin lower bound

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes.
  Evidence: `src/lib/finance/optionBound.test.ts` has 12 tests. `blackScholes`: Hull's textbook point
  (S = 42, K = 40, r = 10%, σ = 20%, T = 0.5 gives call 4.76, put 0.81, worked by hand in the test) and
  put–call parity at K = 80, 102, 130. `smileVolatility`: three hand values, one at the floor.
  `seededSmile`: same seed gives the same smile, a different seed does not, 50 seeds stay in the
  documented ranges. `optionStrip`: put below F, call at or above F, prices equal Black–Scholes at the
  smile volatility. `svixSquared`: flat smile gives var*(R_T) = Rf²(e^{σ²T} - 1) within 1e-4 relative
  error, at T = 1 and T = 0.5. `vixSquared`: flat smile gives σ² within 1e-4 relative error.
  `martinLowerBound`: flat smile gives Rf(e^{σ²T} - 1) within 1e-4, and the bound rises with the level
  for a seeded smile. `entropy`: two-point X ∈ {1, 4} gives log 1.25; 200,000 seeded lognormal draws
  with σ = 0.3 give σ²/2 = 0.045 within 2e-3. `npm test`: 30 files, 326 tests passed.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `astro check` reported `0 errors`, `0 warnings`, `1 hint` (the hint is an unused import in
  `src/lib/finance/news.ts`, not in this task's files); the build printed `[build] Complete!`.
- [x] `git status --short` shows only `src/lib/finance/optionBound.ts`, its test and this task's outcome file.
  Evidence: `npm ci && npm test && npm run build && git status --short` exited 0, and `git status --short`
  was empty after the library commit; the PR diff holds exactly these three files.

## Summary

- **What.** `src/lib/finance/optionBound.ts` exports `blackScholes`, `smileVolatility`, `seededSmile`,
  `optionStrip`, `svixSquared`, `vixSquared`, `martinLowerBound` and `entropy`, plus the types
  `OptionKind`, `SmileParams` and `StripOption`. It reuses `cdf` from `src/lib/math/normal.ts` and
  `mulberry32` from `src/lib/math/rng.ts`.
- **How.** `Rf` is the gross risk-free rate over the horizon T, as the spec says (the style guide's
  `R^f` is a net per-period rate; the module header states the difference). The smile is
  σ(k) = max(floor, level + skew k + curvature k²) with k = log(K/F). `seededSmile` draws skew from
  [-0.25, -0.10] and curvature from [0.05, 0.20], with floor 0.05. The integrals use the trapezoid
  rule on the given strike grid. Tails beyond the grid are dropped, which only lowers SVIX, VIX and
  the bound (Martin 2017, p. 381).
- **Citations in doc comments (Martin 2017, QJE).** The bound E_t[R_T] - R^f ≥ var*_t(R_T)/R^f:
  eq. 5, p. 371, and its option form eq. 14, p. 382. SVIX² definition and scaling: eqs. 12–13, p. 382.
  VIX and entropy: eqs. 24–25, Result 3, p. 401. Lognormal values: Result 4, p. 402.
- **Gap between curriculum and paper (reported, as the spec asks).** The curriculum's Key math for
  chapter 15 writes SVIX²_t = 2/(R^f S_t²)[∫ put + ∫ call], with no 1/(T - t). Martin (2017, eq. 12,
  p. 382) divides by T - t, so SVIX² is annualised: SVIX² = var*(R_T/R^f)/(T - t). The library follows
  the paper. The curriculum's expression equals T · SVIX² (the per-period variance of R_T/R^f).
- **Choice on the bound's horizon.** `martinLowerBound` returns the bound over the horizon, not
  annualised (eq. 14): (2/S²)[∫ put + ∫ call] = Rf · T · SVIX². Divide by T for eq. 15's annual form.
- **Deviations.** None from the spec's function list or scope.
- **Verified revision.** Library commit `0126113`; this outcome is in the next commit on the same branch.
- **Proposed follow-ups.** Chapter 15 (TASK-059) should state that SVIX² is annualised and use
  `martinLowerBound(...) / T` when it shows an annual premium. A later docs task could align the
  curriculum's Key math with the paper's 1/(T - t) scaling.
