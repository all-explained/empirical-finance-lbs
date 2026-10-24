# TASK-069 outcome

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes.
  Evidence: `src/lib/finance/factors.test.ts` has 21 tests over the seven exported functions (table below).
  `npm test`: 42 test files and 467 tests passed, exit 0.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `astro check` "Result (132 files): 0 errors, 0 warnings, 1 hint"; 18 pages built; exit 0.
- [x] `git status --short` shows only `src/lib/finance/factors.ts`, its test and this task's outcome file.
  Evidence: before the commits it listed only `?? src/lib/finance/factors.test.ts` and `?? src/lib/finance/factors.ts`.
  After the commits it prints nothing. The branch diff against `origin/main` has exactly these three files.

| Function | Reference value in the test |
| --- | --- |
| `modelPanel` | `toEqual(factorPanel(...))` for CAPM and FF3 (starts 1926-07, 1963-07, and a 1990s window). Carhart row 1963-07 = FF3 row plus `Mom/100`; FF5 row 1963-07 = the five `ff5-monthly` cells / 100. `RangeError` for FF5 from 1963-06, Carhart from 1926-12, a missing source, and a Mom series with a month removed. |
| `sortFactors` | Hand-made row (percent) SL 1, SM 2, SH 3, BL 0.5, BM 1, BH 2.5: SMB = 2/3 %, HML = 2 %, UMD = 2 %. On the committed data: rebuilt SMB and HML match `ff3-monthly` in all 1,202 months, largest gap 0.005 percentage points. Rebuilt UMD matches `Mom` in all 1,195 months from 1927-01 to 2026-07, largest gap 0.01 points. 2026-08 differs by 0.10 points (see Summary). |
| `formationReturn` | 1.01^11 − 1 = 0.1156683467 with a 50 % month at t − 1 skipped; (1.1)(1.2) − 1 = 0.32 and, with `skip: 0`, −0.34. |
| `bearMarketRegression` | Hand-computed indicator `[1, 0, 1, 1, 0, 0]` for lookback 2. Seeded (`normalRng(20)`, T = 3000) series with α₀ = 0.01, α_B = −0.02, β₀ = 0.1, β_B = −0.8: exact recovery to 1e-12 with no noise, and close recovery with noise. |
| `worstMonths` | Hand case with a tie. On `mom-monthly`: worst month 1932-08 (−52.61 %), then 1932-07. |
| `windowBefore` | Hand case, a window clipped at the first month, and a `RangeError` for an unknown date. |
| `spanningTest` | α = 0, R² = 1 and β = (0.5, −0.2) for f = 0.5 f₁ − 0.2 f₂. With two new factors, `grs` equals `grs(...)`. Mom on FF3 from 1963-07 (T = 758): α̂ = 0.0081673 (0.82 % a month), classical t = 5.465, White t = 5.583, R² = 0.0799. |

Pinned GRS statistics of the 25 size–B/M portfolios from 1963-07 to 2026-08 (T = 758), p < 1e-6 for each:

| Model | GRS | df |
| --- | ---: | --- |
| CAPM | 4.1963 | F(25, 732) |
| FF3 | 3.6426 | F(25, 730) |
| Carhart | 3.2190 | F(25, 729) |
| FF5 | 3.2270 | F(25, 728) |

## Summary

**What.** `src/lib/finance/factors.ts` adds the library for chapters 19 to 21:

1. `modelPanel` returns the `FactorPanel` shape with a wider `FactorName` type, through `ModelPanel`. `timeSeriesTests.ts` is unchanged. CAPM and FF3 call `factorPanel` directly.
2. `sortFactors` builds SMB, HML or UMD from the six value-weighted legs. Its doc comment cites the French library pages.
3. `formationReturn`, `bearMarketRegression`, `worstMonths`, `windowBefore` and `spanningTest`.

**How.** The code reuses `factorPanel`, `timeSeriesRegressions`, `grs`, `ols` (White errors) and `grossGrowth`. It does not copy them.

**Choices the spec left open.**

- FF5 uses `Mkt-RF`, `SMB`, `HML`, `RMW` and `CMA` from `ff5-monthly`. The FF5 SMB differs from the FF3 SMB.
- Excess returns always subtract the RF of `ff3-monthly`. It equals the RF of `ff5-monthly` in every month (checked).
- The start check applies only to the extra sources of Carhart and FF5. For CAPM and FF3, `modelPanel` behaves like `factorPanel`.
- `windowBefore` excludes the given date. It returns fewer months when the data start sooner.
- `bearMarketRegression` compounds the market excess return over months t − lookback to t − 1. It fits months lookback to T − 1.
- `spanningTest` gives classical t-statistics from `timeSeriesRegressions`, and White t-statistics and R² from `ols`. It runs `grs` only when there are two or more new factors.

No reading in `source/papers/` was used. Only the factor names are attributed to the original papers.

**Data finding.** Mom rebuilt from `ff6-size-mom-monthly` matches `mom-monthly` to 0.01 points up to 2026-07. In 2026-08 the gap is 0.10 points (−5.60 vs −5.70). The six-portfolio file (retrieved 2026-10-24) already has 2026-09. So it is a later French release than `mom-monthly` (retrieved 2026-10-22). The test states this gap and allows it. Reported as https://github.com/all-explained/empirical-finance-lbs/issues/57.

**Verified revision.** `edff6228f0334ba98c386f3e8b7ad6364cb0aef2` (library and tests), rebased on `origin/main`. This outcome-only commit follows it.

**Not checked.** No screenshots or Playwright: the task adds no page or widget. GitHub Actions were not read.

**Proposed follow-up.** Refresh all French monthly files on one day (issue #57).
