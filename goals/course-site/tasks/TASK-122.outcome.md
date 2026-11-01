# TASK-122 outcome: Part VII fixes: chapter 29 prose

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: after `npm ci`, `npm test`: 66 files, 693 tests passed. `npm run build`:
  `Result (200 files): - 0 errors - 0 warnings`, `31 page(s) built`, `[build] Complete!`.
- [x] `npm run screenshots` and `npm run clickthrough` pass for `29-multiple-testing`.
  Evidence: screenshots `✓` for dark and light at desktop and phone sizes. Clickthrough `✓` for both widgets,
  15 actions at 1280px and 15 at 360px for the strategy search, 6 and 6 for the factor zoo. A Playwright check
  at 1280px and 360px snapped the strategy-search line to "Bonferroni": the plot label and readout show
  `|t| = 3.71`, with 12 of 30 true and 0 of 270 false discoveries, as the new text says. Both changed
  paragraphs were inspected by eye at desktop and phone widths; the KaTeX renders and the lines wrap cleanly.
- [x] `git diff --name-only origin/main` lists only the chapter 29 file and this task's outcome file.
  Evidence: after a rebase on `origin/main` `ba1b102`, it lists `src/content/chapters/29-multiple-testing.mdx`
  and this file.

## Summary

**What.** Two prose fixes in `src/content/chapters/29-multiple-testing.mdx`, section "The family-wise error rate
and Bonferroni".

1. The argument for $\mathbf{1}\{n_{\text{false}} \ge 1\} \le n_{\text{false}}$ said "when it is at least 1, it
   is at least 1". It now compares the indicator with $n_{\text{false}}$ case by case: both are 0 when
   $n_{\text{false}} = 0$; when $n_{\text{false}} \ge 1$, the indicator is 1 and $n_{\text{false}}$ is a whole
   number of at least 1.
2. The text keeps 3.76 as the rule's bar and adds one sentence: the snapped widget line reads 3.71 because the
   widget draws it halfway between the smallest $|t|$ the rule rejects (3.79) and the largest it keeps (3.64),
   and any line in that gap gives the same 12 discoveries.

**How.** The two numbers come from different places. `invCdf(1 - q/(2n))` at $n = 300$, $q = 5\%$ gives the
bar 3.76, which `tests/chapter29-numbers.test.ts` already asserts. `ruleLine` in
`src/components/plots/multipleTestingSample.ts` draws the midpoint of the gap in the seeded sample. A temporary
Vitest probe on the default seed printed the line 3.714 and the sorted $|t|$ values: the 12th is 3.791 and the
13th is 3.637. The probe was deleted afterwards.

**Deviations.** None. No widget, library, test or doc changed.

**Verified revision.** `ae8cd93`, rebased on `origin/main` `ba1b102`.

**Proposed follow-ups.** None.
