---
id: TASK-128
title: 'Library: time averaging, the NIPA filter and its inverse'
milestone: M-11
state: approved
depends_on: []
delivery: pr
---

## Why


SC-7 and M-11. Chapter 36 shows how the way NIPA builds consumption smooths it: averaging a random walk over a period makes its growth autocorrelated, and a filter on the reported series hides part of its volatility. Kroencke (2017) inverts the filter to recover an unfiltered series, which raises the volatility of consumption growth and its covariance with returns. Nothing in `src/lib` does this. The maths needs no dataset, so this task starts at once.

## Scope


Add `src/lib/finance/consumptionMeasurement.ts` and `src/lib/finance/consumptionMeasurement.test.ts`. Read first: the entry of chapter 36 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the SDF and consumption table, the predictability table where $\phi$ is AR(1) persistence, and the Part VI to Part VIII blocks), `src/lib/stats/var.ts` (`sampleAutocorrelation`, `simulateAR1`), `src/lib/stats/autocorr.ts` (`autocorrelations`) and `src/lib/math/rng.ts`.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Kroencke2017.pdf` (Kroencke, "Asset Pricing Without Garbage", ZEW working paper dated 2013; cite the 2017 *Journal of Finance* article and name working-paper pages) with `pdftotext -layout`, and cite pages in doc comments for anything you take from it: the filter model and its inverse (eq. 9, pdf page 14), the split of the unfilter parameter into time aggregation and filtering (his $\phi = \alpha \times \nu$, pdf pages 13–14), and the values of the parameter he recommends (pdf page 15). He credits the time-averaging result to Working (1960) and Breeden, Gibbons & Litzenberger (1989), which are not in `source/papers/`: derive the result in a doc comment and cite it only as Kroencke reports it.

Functions (decimal log growth rates):
- `simulateTimeAveraging(seed, options)`: a seeded random walk in log consumption at a fine step (for example daily, with drift and volatility options), the level averaged over each period of `stepsPerPeriod` steps, and the growth of the averages next to the growth of the end-of-period levels.
- `timeAveragedAutocorrelation(stepsPerPeriod)` and `timeAveragedVarianceRatio(stepsPerPeriod)`: the exact first-order autocorrelation of the growth of period averages of a driftless random walk, $(n^2 - 1)/(2(2n^2 + 1))$ for $n$ steps a period, which tends to $1/4$, and the ratio of its variance to the variance of point-to-point growth, which tends to $2/3$. Derive both in a doc comment.
- `nipaFilter(trueGrowth, weight)`: the curriculum's filter $\Delta c^{\text{NIPA}}_t = (1 - \varphi)\Delta c_t + \varphi\,\Delta c^{\text{NIPA}}_{t-1}$, with a stated start value; and `unfilter(nipaGrowth, weight)`, its inverse $\Delta c_t = (\Delta c^{\text{NIPA}}_t - \varphi\,\Delta c^{\text{NIPA}}_{t-1})/(1 - \varphi)$, which loses the first observation.
- `fourthQuarterGrowth(dates, c)`: annual growth from the fourth quarter of one year to the fourth quarter of the next, from quarterly log consumption such as `cayInputs(...).c`, the Q4-Q4 measure that Kroencke compares with annual averages.

Notation. §3 gives $\phi$ to AR(1) persistence. Choose the symbol for the filter weight (for example $\varphi$; check that §3 leaves it free and that it renders apart from $\phi$ in KaTeX at the site's font size, or choose another), and add it, with the averaging period length, to the "Part IX" block of the §3 table, each with the clash it avoids. The two parameterisations differ: Kroencke's unfilter parameter is one minus the curriculum's weight (his $\Delta\hat y_t = [\Delta\hat c_t - (1 - \phi)\Delta\hat c_{t-1}]/\phi$). Use the curriculum's weight in the code, state the mapping in a doc comment and in the §3 row, and give a function or constant that converts Kroencke's recommended values. The other Part IX library task adds rows to the same block: whichever merges first creates the block heading; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: `timeAveragedAutocorrelation` is 0 for one step a period and within 1e-3 of 0.25 for 250; the sample autocorrelation and variance ratio of `simulateTimeAveraging` over a long seeded path lie within stated bands of the exact values; `unfilter(nipaFilter(x, w), w)` returns `x` to 1e-12 after the first observation for several weights; `nipaFilter` with weight 0 is the identity; the variance of filtered white noise is $(1 - \varphi)/(1 + \varphi)$ times the original (state the band on a seeded path); the Kroencke conversion maps his recommended values to the curriculum's weights; and `fourthQuarterGrowth` on a hand-built quarterly path. Reuse `sampleAutocorrelation`, `autocorrelations` and the RNG helpers of `src/lib/math/rng.ts`; do not copy them. Out of scope: chapters, widgets, data loading and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- `docs/STYLE_GUIDE.md` §3 has a Part IX block with the filter-weight symbol and its mapping to Kroencke's parameter, and the outcome lists each new symbol with the clash it avoids.
- `git status --short` shows only `src/lib/finance/consumptionMeasurement.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
