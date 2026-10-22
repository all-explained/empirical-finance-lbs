# TASK-010 outcome: Library: return arithmetic

## Acceptance

- [x] `npm test` passes and includes the new tests. Local Vitest run: 5 files and 67 tests passed, including all 10 tests in `src/lib/finance/returns.test.ts`.
- [x] Every requested function exists and has a reference-value test. The table below maps all 11 exports to references. The seeded simulation also tests `meanLogApprox`, and both wealth paths agree within `1e-12`.
- [x] No file outside `src/lib/finance/` changes, except this outcome. `git diff --name-only origin/main...HEAD` lists only `returns.ts`, `returns.test.ts`, and this outcome after its commit.
- [x] `npm run build` passes. `astro check` reports 0 errors, 0 warnings and 0 hints; Astro builds the static site successfully.

| Function | Reference evidence in `returns.test.ts` |
| --- | --- |
| `simpleReturn` | `(110 + 2) / 100 - 1 = 0.12`; omitted dividend gives `0.10`. |
| `logReturn` | `ln(1.5) = 0.4054651081081644`. |
| `simpleFromLog` | `exp(0.4054651081081644) - 1 = 0.5`. |
| `excessReturn` | `0.12 - 0.03 = 0.09`. |
| `grossGrowth` | `1.5 * 0.5 = 0.75`; 2020 market growth is `1.2406619295233049`. |
| `growthPath` | Simple and log inputs both give `[1, 1.5, 0.75]`, within `1e-12`. |
| `meanLogApprox` | `0.01 - 0.04 / 2 = -0.01`; actual mean log return of 100,000 seeded simulated returns agrees within `1e-6`. |
| `arithmeticMean` | `(0.5 - 0.5) / 2 = 0`. |
| `geometricMean` | `sqrt(0.75) - 1 = -0.1339745962155614`. |
| `sampleVariance` | `(0.5^2 + (-0.5)^2) / (2 - 1) = 0.5`. |
| `ff3MarketReturns` | July 1926 market `(2.89 + 0.22) / 100 = 0.0311`; risk-free `0.22 / 100 = 0.0022`. |

## Summary

Added pure functions in `src/lib/finance/returns.ts`, with tests beside the library. All return inputs use decimals. The FF3 adapter uses the existing typed `Series<'ff3-monthly'>` and `getColumn` helpers to convert market premiums and risk-free rates from percent units.

Wealth paths include the initial dollar and accept simple or log inputs according to the selected mode. Empty paths preserve the initial dollar. Means require observations; sample variance uses the `n - 1` denominator and requires two observations. Invalid numeric inputs raise `RangeError`. Total loss is represented as simple return `-1`, log return `-Infinity`, and zero wealth.

Tests include hand-worked arithmetic, total loss, missing FF3 values, and small-return precision. The real-data reference uses January–December 2020 from the committed JSON. Independent Python decimal arithmetic gives `1.240661929523304908485547259381015497364`; the reproducible `python3` command is in the test comment. The approximation test uses `normalRng(42)` and accounts for omitted mean-square and higher-order terms.

Verified implementation revision: `b3ac3ab02037a22d3111b7e1a9e703152170d09a`, rebased onto `origin/main` without conflicts. This outcome is the only subsequent task change.

Local Verify commands:

```sh
npm ci
npm test
npm run build
git diff --stat origin/main...HEAD
```

The local commands pass. The build also logs notices about the existing empty chapter collection. GitHub Actions were not read or used as a delivery gate.

Deviations: none. Proposed follow-ups: none.
