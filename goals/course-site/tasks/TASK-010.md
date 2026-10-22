---
id: TASK-010
title: 'Library: return arithmetic'
milestone: M-2
state: approved
depends_on: []
delivery: pr
route: {platform: codex, model: gpt-6.1-sol, effort: high}
---

## Why

SC-5. Chapter 1 explains simple, log and excess returns and compounding. Its widgets must compute these with tested library code and never re-implement a formula in a component (style guide §5).

## Scope

Write `src/lib/finance/returns.ts` and `src/lib/finance/returns.test.ts` (tests sit beside the code, as in `src/lib/data/`). Pure functions on plain numbers and arrays, written in decimals (0.05 is 5%). No dependency on React.

Functions (names may be improved, but keep one name for each thing):
- `simpleReturn(p0, p1, dividend = 0)`: `(p1 + dividend) / p0 - 1`.
- `logReturn(simple)` and `simpleFromLog(log)`.
- `excessReturn(r, rf)`, for simple returns.
- `grossGrowth(returns)`: the product of `1 + R`. `growthPath(returns, mode)` gives the path of one dollar, for `mode` `'simple'` (compound the simple returns) or `'log'` (exponentiate the running sum of log returns). The two paths must agree.
- `meanLogApprox(meanSimple, variance)`: `mean - variance / 2`, the approximation in the curriculum's Key math.
- `arithmeticMean`, `geometricMean` (per-period, from the gross growth) and `sampleVariance`.
- `ff3MarketReturns(series)`: from a loaded `ff3-monthly` series, return `{ dates, market, rf }`. Market total return is `(Mkt-RF + RF) / 100`, `rf` is `RF / 100`. Use the typed loaders in `src/lib/data/series.ts`, and keep the dataset's percent units out of the rest of the library.

Tests: reference values computed by hand and written in a comment with their arithmetic, for example `100 -> 110` with a dividend of `2` gives `12%`, `+50%` then `-50%` gives growth `0.75` and a mean simple return of `0`, the log returns sum to `ln(0.75)`, and the two growth paths agree to 1e-12. Add one real-data reference value: the growth of one dollar in the `ff3-monthly` market over a fixed window, computed independently with `python3` from the committed JSON (state the command in a comment). Test `meanLogApprox` against a simulated sample from `src/lib/math/rng.ts`.

Out of scope: any chart, any component, any chapter text.

## Acceptance

- `npm test` passes and includes the new tests.
- Every function listed above exists and is covered by at least one test with a reference value.
- No file outside `src/lib/finance/` changes, except this task's outcome file.
- `npm run build` passes.

## Verify

```sh
npm ci
npm test
npm run build
git diff --stat origin/main...HEAD
```
