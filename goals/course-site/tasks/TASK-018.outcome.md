# TASK-018 outcome: Library: sample moments and Sharpe ratio

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes. Local Vitest run: 10 files and 154 tests passed, including all 7 tests in `src/lib/stats/moments.test.ts`. The table below maps the 8 exports to references.
- [x] `npm run build` passes. `astro check` reports 0 errors, 0 warnings and 0 hints (45 files); Astro builds 3 pages.
- [x] `git status --short` shows only `src/lib/stats/moments.ts`, its test and this outcome file. After the code commit `cb8c9ee`, the Verify run left `git status --short` empty; `git diff --name-only origin/main...HEAD` lists only those three files after this outcome's commit.

| Function | Reference evidence in `moments.test.ts` |
| --- | --- |
| `meanStandardError` | x = [1, 2, 3, 4, 10]: √(12.5 / 5) = 1.5811388300841898; equals the intercept-only `ols` standard error. |
| `sharpeRatio` | 4 / √12.5 = 1.131370849898476; [-1, -3] gives -2 / √2. |
| `annualiseMean` | 0.01 × 12 = 0.12; 0.001 × 252 = 0.252. |
| `annualiseVolatility` | 0.04 × √12 = 0.13856406460551018. |
| `annualiseSharpe` | 0.25 × √12 = 0.8660254037844386; √12 × 1.1313… = 3.919183588453085, equal to annualised mean over annualised volatility. |
| `skewness` | m3 / m2^1.5 = 36 / 10^1.5 = 1.1384199576606167; [0, 1] gives 0; near 0 for 200,000 `normalRng(7)` draws. |
| `excessKurtosis` | m4 / m2² - 3 = 278.8 / 100 - 3 = -0.212; [0, 1] gives -2; near 0 for the same normal draws. |
| `histogram` | x in 3 bins: edges [1, 4, 7, 10], counts [3, 1, 1] (numpy.histogram convention); [2, 2] gives edges [1.5, 2, 2.5]; every `normalRng(11)` draw lies inside its own bin edges. |

Reference moments of x were checked with exact Python `fractions` arithmetic (m2 = 10, m3 = 36, m4 = 1394/5, s² = 25/2).

## Summary

What: `src/lib/stats/moments.ts` adds the sample-moment maths that chapter 2 needs, with tests beside it.

How:
- `meanStandardError` and `sharpeRatio` reuse `sampleVariance` (n - 1 divisor) and `arithmeticMean` from `src/lib/finance/returns.ts`. `ols` is not needed in the library; the test uses it as an independent check of s / √T.
- `annualiseMean` reuses `repeatedSum` (k × mean). `annualiseVolatility` and `annualiseSharpe` multiply by √k. All three default to 12 periods a year and accept another positive integer (for example 252).
- `skewness` and `excessKurtosis` use divisor-T central moments (g1, g2; scipy `bias=True`). The comment in the code states the divisor.
- `histogram(values, bins)` returns `{ edges, counts }` with equal-width bins from min to max. Each bin is [left, right), except the last, which includes max. Equal values use the range value ± 0.5, as numpy does.
- Invalid input raises `RangeError`: too few observations, zero dispersion, non-finite values, or a bad bin or period count.
- Seeded draws use `normalRng` from `src/lib/math/rng.ts`.

Deviations: none. The annualisation functions take an optional `periodsPerYear` (default 12) so that daily data can reuse them.

Verified revision: `cb8c9ee594ee56b824d6c8530aa8ece5b28b0506`. This outcome is the only later change.

Local Verify (exit 0):

```sh
npm ci
npm test
npm run build
git status --short
```

GitHub Actions were not read or used as a delivery gate.

Proposed follow-ups: none.
