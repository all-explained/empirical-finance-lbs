---
id: TASK-070
title: 'Library: anomaly t-statistics across the factor zoo'
milestone: M-7
state: approved
depends_on: [TASK-068]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-7. Chapter 21 needs, for each published predictor, its mean long–short return and t-statistic in and after its original sample, under each portfolio construction, and counts of how many clear a given t-statistic, in `src/lib`, with tests.

## Scope


Add `src/lib/finance/zoo.ts` and `src/lib/finance/zoo.test.ts`. Read first: the entry of chapter 21 in `docs/CURRICULUM.md`, the OSAP notes in `docs/DATA.md` and the loaders the data task added (`src/lib/data/series.ts` and the signal documentation loader in `src/lib/data/`), `src/lib/stats/moments.ts` (`meanStandardError`). Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/HarveyLiuZhu2016.pdf` and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/HouXueZhang2018.pdf` (published 2020) with `pdftotext -layout` for the $t$-statistic thresholds and the microcap point, and cite pages in doc comments.

Functions:
- `signalSummaries(returns, signals, { construction })` with `construction` `'original'`, `'vw'` or `'exmicro'` (only those the data task committed): for each signal its acronym, publication year, mean and $t$-statistic over its original sample, the same after the sample ends, and the number of months in each. Months with `null` are skipped; a signal with fewer than 24 months in a window gets `null` for that window. OSAP units are percent per month; return decimals.
- `countAbove(summaries, threshold, window)`: how many signals have $|t|$ above the threshold, for a draggable significance line.
- `compareConstructions(a, b, threshold)`: for signals in both, how many cross below the threshold when moving from `a` to `b`, and the median ratio of their mean returns.
- `byPublicationYear(summaries)`: signals grouped by year with cumulative counts, for the zoo's time axis.

Tests against reference values, each stated in the test: every function on a hand-made three-signal case; `signalSummaries` $t$ equals $\bar r / (s/\sqrt{T})$ by hand; and pinned values on the committed data: number of signals, number with original-sample $|t| > 1.96$ and $> 3$, and, for each committed variant, the number that fall below 1.96. Reuse `meanStandardError`; do not copy it. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/zoo.ts`, its test and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
