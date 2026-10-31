---
id: TASK-104
title: 'Library: Bonferroni, Holm and Benjamini–Hochberg–Yekutieli, and seeded strategy searches'
milestone: M-9
state: approved
depends_on: []
delivery: pr
---

## Why


SC-7 and M-9. Chapter 29 explains why $t > 2$ is too low a bar after hundreds of tries: it controls the family-wise error rate (Bonferroni, Holm) and the false discovery rate (Benjamini–Hochberg–Yekutieli), counts true and false discoveries in a seeded search, and applies the rules to the published predictors that chapter 21 already loads. Nothing in `src/lib` does multiple testing yet.

## Scope


Add `src/lib/stats/multipleTesting.ts` and `src/lib/stats/multipleTesting.test.ts`. Read first: the entry of chapter 29 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the rows for $q$, $\alpha$, $M$ and $N$), `src/lib/math/normal.ts`, `src/lib/stats/moments.ts`, `src/lib/finance/zoo.ts` (`signalSummaries`: one $t$-statistic per published signal and window) and `src/lib/math/rng.ts`. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/HarveyLiuZhu2016.pdf` (Harvey, Liu & Zhu (2016), published version) with `pdftotext -layout` and cite pages in doc comments for each procedure you take from it (Bonferroni, Holm, BHY, and the case for a cut-off near $t = 3$).

Functions ($p$-values in $[0, 1]$, two-sided unless stated):
- `pValues(t)`: two-sided normal $p$-values from $t$-statistics, through `cdf` in `normal.ts`.
- `bonferroni(p, q)`, `holm(p, q)`, `benjaminiHochberg(p, q)` and `benjaminiHochbergYekutieli(p, q)`: for each, the rejected set (a boolean per test, in input order), the number rejected and the implied $t$ cut-off (the smallest $|t|$ that is rejected, or `null`). BHY uses the constant $c(n) = \sum_{j=1}^{n} 1/j$, as the paper gives it.
- `simulateStrategySearch(seed, { count, trueShare, sharpe, T })`: `count` seeded strategies, a share `trueShare` of them with a true annualised Sharpe ratio `sharpe` and the rest with none, each with $T$ months of i.i.d. normal returns (state the volatility); return each strategy's $t$-statistic and whether its alpha is true.
- `discoveryCounts(t, isTrue, cutoff)`: true and false discoveries, misses, the false discovery proportion and the expected number of false discoveries under the null, (number of null strategies) × (the test size implied by `cutoff`).

Notation. §3 says $\alpha$ is never a significance level and $M$ is the SDF; $q$ is already the significance level or false discovery rate, and $p$ is a log price. Choose a symbol for the number of tests and one for a $p$-value (for example $p_i$ with a row that says so, as chapter 27 used $p(\lambda^{\circ})$), check each against §3, and add them to one "Part VII" block of the §3 table, each with the clash it avoids. The other two Part VII library tasks add rows to the same block: whichever merges first creates the block heading; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: `pValues` at $t = 1.96$ gives 0.05 to 1e-4; each procedure on a small hand-made list of $p$-values gives the rejected sets you work out by hand (Holm rejects at least as many as Bonferroni; BH at least as many as Holm; BHY no more than BH); `benjaminiHochbergYekutieli` with $n = 1$ equals a single test at level $q$; `simulateStrategySearch` gives the same output for the same seed, and with `trueShare` 0 the share of $|t| > 1.96$ is within simulation error of 5% (state the band); and pinned values on the committed `osap-ls-monthly` data: for the original-sample $t$-statistics of `signalSummaries`, the number of signals, and the number that survive $|t| > 1.96$, $|t| > 3$, Bonferroni, Holm and BHY at $q = 0.05$. Reuse `cdf`, `invCdf`, `signalSummaries` and the RNG helpers; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- `docs/STYLE_GUIDE.md` §3 has a Part VII block with the symbols for the number of tests and a $p$-value, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/stats/multipleTesting.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
