# TASK-124 outcome

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  `npm test`: 73 files, 767 tests passed. `npm run build`: `astro check` "Result (216 files): 0 errors, 0 warnings,
  1 hint", then "[build] Complete!".
- [x] Every number in chapter 30 prose maps to a test in `tests/chapter30-numbers.test.ts`.
  The changed numbers (0.84, 1.65, 0.58, 2.33) replace the old ones in the same assertions. The rewritten Hook and
  Callout add no new number. The test file passes.
- [x] `npm run screenshots` and `npm run clickthrough` pass for `30-shrinking-the-cross-section` and `07-mean-variance`.
  All four commands exit 0. Screenshots: both themes at desktop and phone sizes for each page. Click-through: both
  chapter 30 widgets and both chapter 7 widgets at 1280px and 360px. In the built page, the FrontierBuilder readout
  shows 1.84 (frontier), 1.84 (in sample) and 0.84 (out of sample), as the prose says.
- [x] The outcome file states the old and new split-sample numbers. See the table below.

## Split-sample numbers

Annual Sharpe ratios of the tangency portfolio estimated on 1963-07 to 2004-12. "Old" removes the market (and, for
FF, rescales) with betas from the whole window. "New" estimates the betas and scales on the months before 2005 only.

| Set | Penalty ν₂ | In sample, old → new | Out of sample, old → new | Chapter prose |
|---|---|---|---|---|
| 30 FF portfolios | 0 | 1.8358 → 1.8447 | 0.8202 → 0.8415 | 1.84 / 0.82 → 1.84 / 0.84 |
| 30 FF portfolios | 10⁻³ | 1.6436 → 1.6536 | 0.5491 → 0.5764 | 1.64 / 0.55 → 1.65 / 0.58 |
| 108 anomalies | 0 | 8.8522 → 8.8452 | 2.1827 → 2.1786 | 8.85 / 2.18 (unchanged) |
| 108 anomalies | 10⁻³ | 6.6365 → 6.6294 | 2.3623 → 2.3316 | 2.36 → 2.33 out of sample |

Library pins in `src/lib/finance/shrinkage.test.ts` (monthly Sharpe ratios, split at 2005-01):

| Set | Naive in / out, old → new | At the best R²_CV penalty in / out, old → new |
|---|---|---|
| FF | 0.529950 / 0.236763 → 0.532520 / 0.242931 | 0.261963 / 0.022318 → 0.271365 / 0.039040 |
| OSAP | 2.555409 / 0.630102 → 2.553388 / 0.628921 | 1.330832 / 0.630282 → 1.323400 / 0.634406 |

## Summary

**What.** `assetPanel(set, series, { estimateBefore })` in `src/lib/finance/shrinkage.ts` takes an optional date. The
market betas, and for the FF set the rescaling to the market's volatility, come from the months before that date.
They are then applied to every month. Without the option, the whole window is used, as before. This follows Kozak,
Nagel & Santosh (2020, p. 290, fn. 22).

**How.** `shrinkageData` in `src/components/plots/shrinkageSample.ts` builds both panels per set. The whole-window
`returns` still feed Σ̂, the PCs and the cross-validated path. The new `splitReturns` (betas and scales before
`SPLIT_DATE`) feed `shrunkTangency`, so no split-sample estimate uses a month after 2004. The library tests add a
hand-checked four-month case (β = 1.2 on all months, β = 1 on the first three). They check that the pre-2005 panels
have zero betas and the market's variance in the months before 2005. The split-sample pins now use those panels.

Chapter 30: the Hook now says that everything is estimated with the months up to December 2004, and drops its
caveat. The warning Callout keeps the caveat that is still true: the R²_CV values use whole-sample betas and scales.
It now says that the Sharpe ratios before and after 2005 do not have this leak. The FrontierBuilder caption drops
"full-sample beta" and its look-ahead sentence. The ShrinkagePath caption keeps "full-sample beta", which is still
true for R²_CV.

**Deviations.** None. `estimateBefore` needs at least three months, because the beta regression has an intercept.

**Verified revision.** The commit that adds this file. The code was verified at `cdd4560`; this commit adds only
this file.

**Follow-ups.** None.
