# TASK-123 outcome: Part VII fixes: chapter 30 prose, formatter and comment

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: after `npm ci`, `npm test`: 69 files, 737 tests passed. `npm run build`:
  `Result (206 files): - 0 errors - 0 warnings`, `[build] Complete!`.
- [x] `npm run screenshots` and `npm run clickthrough` pass for `30-shrinking-the-cross-section` and
  `07-mean-variance`.
  Evidence: screenshots `✓` for dark and light at desktop and phone sizes for both chapters. Clickthrough `✓`
  for all widgets: chapter 30, 3 and 3 actions (1280px and 360px) on the shrunk frontier, 10 and 10 on the
  shrinkage path; chapter 7, 14 and 14 on the frontier builder, 27 and 27 on the beta test. A Playwright check
  at 1280px and 360px found the five chapter links at `/empirical-finance-lbs/chapters/...`, the Next up title
  in `<em>`, no horizontal overflow and no console errors. After 12 steps right, the frontier slider reads
  `5.0 × 10⁻⁵` (its aria label too) and the shrinkage-path penalty reads `1.9 × 10⁰`.
- [x] `git grep -n "const sci" src/components` prints nothing.
  Evidence: the command prints no lines.
- [x] `git diff --name-only origin/main` lists only files named in this scope and this task's outcome file.
  Evidence: after a rebase on `origin/main` `c7662ef`, it lists `FrontierBuilder.tsx`, `ShrinkagePath.tsx`,
  `format.ts` and `shrinkageSample.ts` in `src/components/plots/`, the chapter 30 file,
  `tests/chapter30-numbers.test.ts` and this file.

## Summary

**What.**

1. Chapter 30 (`src/content/chapters/30-shrinking-the-cross-section.mdx`):
   - The prerequisite box links Chapter 28.
   - The Next up title is in italics.
   - The key callout gives the pinned numbers: an elastic net that keeps 14 principal components reaches
     $R^2_{CV}$ 0.44, one that keeps 20 anomalies reaches 0.29.
   - The Hook says the anomaly data end in December 2024.
2. `ShrinkagePath.tsx` loses its local `sci` and `power`. They live in `src/components/plots/format.ts` as
   `scientific` and `power`. `FrontierBuilder.tsx` uses `scientific` for its penalty slider (it showed `10^x`)
   and its aria label (it used `toPrecision(2)`).
3. `shrinkageSample.ts`: the `inSample` comment says the portfolio is scaled to the volatility `target`, not
   to the market's volatility.

**How.** The numbers 14, 0.44, 20 and 0.29 come from the assertions in `tests/chapter30-numbers.test.ts`
(lines 74 and 75). The end month comes from `shrunkTangency(data.osap, ...).last`; a new assertion in that
test pins it at `2024-12`, so the Hook cannot drift from the data. `scientific` moves the exponent up when the
mantissa would round to 10.0, so 9.96 × 10⁻⁴ prints as 1.0 × 10⁻³.

**Deviations.** "Link style of chapters 13 to 15" means absolute links
(`/empirical-finance-lbs/chapters/NN-slug/`), as TASK-121 used in chapter 28. Chapter 30 used relative
`../NN-slug/` links. All five chapter links in chapter 30 now use the absolute form, so the prerequisite box
uses one style. The box lines were rewrapped to keep their width. Chapters 2 and 4 to 7 still have relative
links; that is outside this scope.

**Verified revision.** `6575bfe`, rebased on `origin/main` `c7662ef`.

**Follow-ups.** None.
