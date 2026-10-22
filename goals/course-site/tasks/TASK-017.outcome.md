# TASK-017 outcome

## Acceptance

- [x] The `part` field accepts 1 and 17 and rejects 0 and 1.5.
  `tests/content-config.test.ts` tests the production schema with Astro's real
  collection helper. It also checks rejection above the curriculum limit.
  Before the fix, only the part 17 case failed (1 failed, 4 passed).
  After the fix, all five cases pass in the full test suite.
- [x] `npm test` and `npm run build` pass. The complete Verify sequence
  (`npm ci`, `npm test`, `npm run build`, `git status --short`) exited 0.
  Vitest reports 9 files and 147 tests passed. `astro check` reports 0 errors,
  0 warnings and 0 hints; the static build produces 3 pages.
- [x] `git status --short` shows only `src/content.config.ts`,
  `tests/content-config.test.ts` and this outcome file. The final lines of
  Verify, before committing, are:

  ```text
   M src/content.config.ts
  ?? goals/course-site/tasks/TASK-017.outcome.md
  ?? tests/content-config.test.ts
  ```

## Summary

What: replace the fixed chapter-part limit of 16 with `parts.length` from the
existing curriculum. The current curriculum has 17 parts. Keep the positive
integer rule and all other chapter fields unchanged.

How: test the actual collection schema. The test resolves the `astro:content`
virtual module to Astro's real `astro/content/config` helper. No validation
rule is copied into the test and no additional production module is needed.

Deviations: none. Fixes all-explained/empirical-finance-lbs#5.

Verified revision: the schema and regression test in this PR. Verification
ran on this branch's complete code patch before committing the outcome.

Proposed follow-ups: none.
