# TASK-005 outcome

## Acceptance

Verified locally on 2026-10-22 on branch `goal/course-site/task-005`.

- [x] `npm test` passes, including the curriculum sync test.
  Evidence: exit 0; Vitest reports `Test Files 2 passed (2)` and `Tests 11 passed (11)`.
  `tests/curriculum.test.ts` reads the `## Part` and `### N.` headings in
  `docs/CURRICULUM.md` and compares the complete ordered structure with `parts`.
  This covers part numbers, Roman numerals, titles, difficulty, chapter numbers,
  chapter titles, and chapter membership. A temporary chapter-title mismatch made
  the sync test fail with exit 1; the original data was restored before verification.
- [x] `npm run build` and `npm run screenshots` pass; the index lists all parts and chapters.
  Evidence: both commands exit 0. Astro checks 25 files with 0 errors, 0 warnings,
  and 0 hints, then builds `/index.html` and reports `1 page(s) built`.
  A Playwright DOM comparison of `dist/index.html` against the curriculum headings
  confirms all 17 parts and 66 chapters, including titles, Roman numerals, and difficulty.
  All 66 unpublished chapters retain the existing `soon` styling and have no dead links.
  Screenshots pass for `home-dark-desktop.png`, `home-dark-phone.png`,
  `home-light-desktop.png`, and `home-light-phone.png`, with no console, KaTeX,
  or horizontal overflow errors. All four captures were visually inspected.
  Desktop size is 1280 × 900; phone size is 375 × 800. Captures remain ignored.

Verify output tails:

```text
$ npm test
 Test Files  2 passed (2)
      Tests  11 passed (11)
exit 0

$ npm run build
[build] 1 page(s) built in 664ms
[build] Complete!
exit 0

$ npm run screenshots
✓ home-dark-desktop.png
✓ home-dark-phone.png
✓ home-light-desktop.png
✓ home-light-phone.png
exit 0
```

## Summary

Filled `src/data/curriculum.ts` from the merged curriculum without changing `PartInfo`.
The existing index and navigation now consume all 17 parts and 66 chapters.
Unpublished chapters keep the scaffold's existing coming-soon behavior.
Added the curriculum sync test and the `@types/node` development dependency required
for its filesystem import to pass Astro's TypeScript check.

No curriculum mismatches or scope deviations remain. No chapter content, task specs,
decisions, or goal configuration were changed.

Verified implementation revision: `b03b64074a2e9c2c66c30158240ed491cf381954`.
The outcome-only commit adds this evidence without changing the verified implementation.
The branch was rebased onto `origin/main` without conflicts before final verification.

Delivery PR: https://github.com/all-explained/empirical-finance-lbs/pull/6, into `main`,
with marker `Goal-Task: course-site/TASK-005` and label `goal:course-site`.
GitHub Actions was not read, run, or used as a delivery gate. The PR is not merged.

Proposed follow-up: the existing chapter schema rejects Part XVII because its upper
bound is 16. This separate bug does not affect the index or these acceptance checks.
It was reproduced and reported without changing the schema:
https://github.com/all-explained/empirical-finance-lbs/issues/5.
