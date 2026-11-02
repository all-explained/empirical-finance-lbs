# TASK-128 outcome: time averaging, the NIPA filter and its inverse

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
  Evidence: `npm test` gives 74 test files and 786 tests passed. `tests/notation.test.ts` passes all 4 checks. The 19 tests in `src/lib/finance/consumptionMeasurement.test.ts` cover every export:
  - `timeAveragedAutocorrelation`: 0 for 1 step, 1/6 for 2 steps, within 1e-3 of 0.25 for 250 steps, and equal to the triangular-weight moments for 5 steps.
  - `timeAveragedVarianceRatio`: 1 for 1 step, 3/4 for 2 steps, within 1e-6 of 2/3 for 1,000 steps, and equal to the triangular-weight moments for 5 steps.
  - `simulateTimeAveraging`: structure checked by hand. On 20,000 periods of 30 steps, the sample autocorrelation (`sampleAutocorrelation`) is 0.2546 against an exact 0.2496 (band 0.03). The variance ratio is 0.6660 against an exact 0.6670 (band 0.03). The end-to-end mean and standard deviation match the drift and volatility options to 5e-4.
  - `nipaFilter` and `unfilter`: a worked example ([1, 2, 3] with weight 1/2). Weight 0 is the identity. `unfilter(nipaFilter(x, w), w)` returns `x` after the first observation to 1e-12 for w = 0.2, 0.4, 0.6 and 0.9. On 100,000 seeded draws of white noise, the filtered variance ratio is 0.6658 against (1 − w)/(1 + w) = 2/3 at w = 0.2, and 0.2489 against 0.25 at w = 0.6. The lag-1 autocorrelation (`autocorrelations`) is within 0.01 of w. All bands are 0.01.
  - `filterWeightFromKroencke` and `kroenckeUnfilterParameters`: Kroencke's 0.80 and 0.40 map to 0.20 and 0.60.
  - `fourthQuarterGrowth`: a hand-built quarterly path gives [0.2, 0.4] and skips a year whose previous Q4 is missing.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `astro check` gives `Result (218 files): 0 errors, 0 warnings, 1 hint`. The hint is the unused `Matrix` import in `src/lib/finance/news.ts`, already reported as all-explained/empirical-finance-lbs#88. Static build: `[build] Complete!`.
- [x] `docs/STYLE_GUIDE.md` §3 has a Part IX block with the filter-weight symbol and its mapping to Kroencke's parameter, and the outcome lists each new symbol with the clash it avoids.
  Evidence: the new block is "### Part IX: consumption data and the equity premium puzzle (Chapters 35–36)". Its symbols are in the table below.
- [x] `git status --short` shows only `src/lib/finance/consumptionMeasurement.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.
  Evidence: `git diff --name-only origin/main` lists exactly these four files. `git status --short` is empty after the commit.

### New symbols and the clash each avoids

| Symbol | Meaning | Clash it avoids |
|---|---|---|
| $\varphi$ | Weight of the NIPA filter, from 0 up to (not including) 1. Kroencke's unfilter parameter is $\phi = 1 - \varphi$. | The curriculum writes $\phi$, but §3 gives $\phi$ to AR(1) persistence. In KaTeX at the prose size (1.15rem × 1.08em), $\phi$ is drawn as the closed, stroked ϕ (U+03D5) and $\varphi$ as the open, looped φ (U+03C6). I checked this in a Playwright render with the KaTeX fonts loaded. §3 also uses $\varphi(\cdot)$ for the normal PDF, but that symbol always has an argument and the weight never does. The row says so. |
| $n_{\text{avg}}$ | Number of fine steps averaged into one period. | Bare $n$ is the number of tests (Chapter 29). A maturity $n$ is a superscript in parentheses, and log asset wealth $n_t$ carries a date. The label follows the pattern of $K_{CV}$ and $T_{OS}$. |

## Summary

**What.** `src/lib/finance/consumptionMeasurement.ts` has these exports:
- `simulateTimeAveraging(seed, options)`: a seeded random walk at a fine step. Drift and volatility are given per period and scaled to each step. The function returns the path, the period averages, and the growth of the averages next to the growth of the end-of-period levels.
- `timeAveragedAutocorrelation` and `timeAveragedVarianceRatio`: the exact values $(n^2 - 1)/(2(2n^2 + 1))$ and $(2n^2 + 1)/(3n^2)$. A doc comment derives both from the triangular shock weights.
- `nipaFilter` and `unfilter`, which use the curriculum's weight. The filter's start value is $\Delta c^{\text{NIPA}}_0 = \Delta c_0$. The inverse drops the first observation.
- `kroenckeUnfilterParameters` (0.80 and 0.40) and `filterWeightFromKroencke` ($\varphi = 1 - \phi$).
- `fourthQuarterGrowth(dates, c)`, which reads quarter start dates as in `cayInputs(...).c`.

**Readings.** I cite Kroencke (2017, *Journal of Finance* 72, 47–98) with the pages of ZEW working paper 13-071 (2013):
- eq. 6 (filter): wp p. 7, pdf p. 12.
- the 2/3 and 1/4 limits, as he reports them from Working (1960) and Breeden, Gibbons & Litzenberger (1989): wp p. 8, pdf p. 13.
- eq. 9, $\phi = \alpha \times \nu$, and $\alpha = 0.80$ (note 10): wp p. 9, pdf p. 14.
- the recommended values and $\nu = 1/2$ (note 11): wp p. 10, pdf p. 15.

No text is copied. The time-averaging result is derived in a doc comment.

**Reuse.** The simulation uses `normalRng` from `src/lib/math/rng.ts`. The tests use `sampleAutocorrelation`, `autocorrelations` and `sampleVariance` and do not copy them.

**Deviations.** None from the scope. I did not add rows for Kroencke's $\alpha$ and $\nu$, because the library uses only their product. The $\varphi$ row explains that product in words. Chapter 36 can add rows for $\alpha$ and $\nu$ if it writes them.

**Verified revision.** The Verify commands (`npm ci`, `npm test`, `npm run build`, `git status --short`) ran on the branch rebased onto `origin/main` 317f036.

**Proposed follow-ups.** None.
