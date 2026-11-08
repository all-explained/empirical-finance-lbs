# TASK-134 outcome: Part VIII wording fixes in chapters 32 and 34

## Acceptance

- [x] The four sentences read as stated.
  Evidence: the tag-stripped text of the built pages contains each new phrase, and none of the old ones.
  Chapter 32: "first story in three words" (line 39) and "reaches 0.29% in the library, a number the widget
  does not show" (lines 310–311). Chapter 34: "the too-few case of step 5 above shows" (line 255) and
  "Now add Kenneth French's 30 industry portfolios" (line 261). A search for "four words",
  "ff30-industry-monthly" and "bias of the last step" in the two built pages finds nothing.
- [x] No other change in the diff.
  Evidence: `git diff --name-only origin/main` lists only the two chapter files, plus this outcome file once it is
  committed. `git diff` shows four changed sentences and nothing else. In Chapter 32 the longer sentence wraps onto
  one added source line.

## Summary

**What.** Four wording fixes from the TASK-120 sign-off. Chapter 32 now counts the title as three words, and it says
that the 0.29% unrestricted fit comes from the library, not the widget. Chapter 34 names Kenneth French's 30 industry
portfolios instead of a dataset id, and it points at step 5 for the too-few case.

**How.** Each phrase is replaced in place. No other line is reflowed.

**Deviations.** None.

**Verified revision.** `npm ci`, `npm test` (78 files, 841 tests passed), `npm run build` (`astro check` 0 errors,
`[build] Complete!`), and `npm run screenshots` and `npm run clickthrough` for chapters 32 and 34 all exit 0. They
report no console errors, KaTeX errors or overflow. I checked crops of the changed paragraphs at 360px (dark) and
1280px (light): the text and math render correctly.

**Proposed follow-ups.** None.
