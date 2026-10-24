# TASK-070 outcome: Library: anomaly t-statistics across the factor zoo

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes.
  Evidence: `src/lib/finance/zoo.test.ts` has 9 tests covering all four functions
  (`signalSummaries`, `countAbove`, `compareConstructions`, `byPublicationYear`), each on a hand-made
  three-signal case with values stated in the test, and pinned values on the committed data that were
  cross-checked with an independent Python script. `npm test`: 44 files, 473 tests passed, exit 0.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `astro check` "0 errors, 0 warnings"; 18 pages built; exit 0.
- [x] `git status --short` shows only `src/lib/finance/zoo.ts`, its test and this task's outcome file.
  Evidence: before commit, `git status --short` listed only `zoo.ts` and `zoo.test.ts`; the PR diff
  against `main` holds exactly these two files plus this outcome file.

## Summary

**What.** `src/lib/finance/zoo.ts`:

- `signalSummaries(returns, signals, { construction })`: for each OSAP signal, its acronym, publication
  year, and for the original sample (January of `sampleStartYear` to December of `sampleEndYear`) and the
  months after it: `months`, `mean` (decimal per month, OSAP percent / 100) and `t` = r̄ / (s/√T) via
  `meanStandardError`. Null months are skipped; fewer than 24 months gives `null` for that window.
- `countAbove(summaries, threshold, window)`: signals with |t| strictly above the threshold.
- `compareConstructions(a, b, threshold)`: over signals with an original-sample summary in both,
  `common`, `crossedBelow` (|t| above the line under `a`, not under `b`) and `medianMeanRatio`
  (median of mean_b / mean_a; `null` if none are common).
- `byPublicationYear(summaries)`: `{ year, acronyms, cumulative }`, ascending, years with signals only.

Doc comments cite Harvey, Liu and Zhu (2016, RFS 29), t > 3.0 (abstract, p. 5), and Hou, Xue and Zhang
(2020, RFS 33), microcaps below the NYSE 20th percentile and 65% of 452 anomalies failing |t| ≥ 1.96
(p. 2020).

**Pinned results on the committed data (October 2025 OSAP, 1963-01 to 2024-12).** 165 signals, all
with an original-sample summary. Original sample: 158 with |t| > 1.96, 107 with |t| > 3. After the
sample: 66 with |t| > 1.96, 31 with |t| > 3. BM (Stattman 1980, sample 1962–1976 cut to 1963):
168 months, t = 3.650 in sample and 3.225 after. Publication years 1973 to 2016 (34 distinct years).

**Deviations / choices.**

- `construction` accepts only `'original'`. The value-weighted and NYSE 20th-percentile variants were
  measured by TASK-068 but not committed (docs/DATA.md), as the spec allows ("only those the data task
  committed"). So the "number that fall below 1.96 for each committed variant" has no variant to pin;
  the test pins `compareConstructions(zoo, zoo)` = 165 common, 0 crossed, ratio 1 instead.
  `signalSummaries` throws if `returns.id` is not the construction's series.
- `compareConstructions` compares the original-sample window, the in-sample test of Hou, Xue and Zhang.
- Original samples that start before 1963 are truncated to the data's 1963-01 start.
- t uses the classical i.i.d. standard error (`meanStandardError`), as the spec asks; HXZ use Newey–West.

**Verified revision.** `e6fb28f` (code) rebased on `origin/main` `f662533`, plus this outcome file.
`npm ci`, `npm test`, `npm run build`, `git status --short` all exit 0.

**Proposed follow-ups.** When a data task commits the OSAP `VWforce` and `ME_gt_NYSE20pct` variants,
add them to `constructionSeries` and pin the count that fall below 1.96 under each.
