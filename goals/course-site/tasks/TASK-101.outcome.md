# TASK-101 outcome

## Acceptance

- [x] `vitest.config.ts` sets `test.testTimeout: 30000`.
  The main baseline at `a051159f269ae434dbfddf01f5d85efbb5a74913` ran 60 test
  files and 624 tests. Two tests hit its existing 5000 ms default under load.
  This branch passed the same 60 files and 624 tests in 16.59 seconds.
  A Vitest API assertion confirmed the 30000 ms default and identical discovery
  include/exclude patterns against that baseline.
- [x] `npm ci`, `npm test`, and `npm run build` exited 0 in this session.
  Astro checked 185 files: 0 errors, 0 warnings, and 1 existing unused-import hint.
  The static build produced 28 pages.
  `npm run screenshots` exited 0: all 112 page/theme/viewport checks passed.
- [x] `git diff --name-only origin/main` lists exactly:
  `vitest.config.ts`, `src/lib/finance/predictive.test.ts`, and
  `goals/course-site/tasks/TASK-101.outcome.md`.
  The only test change removes its redundant 15000 ms timeout.
- [x] PR #87 contains `Fixes all-explained/empirical-finance-lbs#67`
  and `Goal-Task: course-site/TASK-101`.
  It targets `main`, is open and non-draft, and carries `goal:course-site`.
  The PR had no review threads, reviews, or comments when inspected in this session.
  The task resume note's timeout feedback is addressed by the test change.

## Summary

Raised the shared default timeout from 5 to 30 seconds. Removed the sole shorter
per-test timeout in `src/lib/finance/predictive.test.ts` so the shared default
governs. Overrides of 30 seconds or longer remain unchanged.

The resume note explicitly requested checking both `src/` and `tests/` for shorter
overrides. No test logic, library maths, chapters, dependencies, or task specs changed.
No further follow-up is needed for this fix.

Verified executable revision: `2b36689f30492b67e19229e2043bd2e79ea9529f`.
The branch was rebased onto `origin/main` at `a051159` without conflicts.
The following outcome-only commit changes no executable files.

Existing notices remain outside this task: npm audit findings, a large build chunk,
and the unused `Matrix` import hint already tracked in
[issue #88](https://github.com/all-explained/empirical-finance-lbs/issues/88).

PR: https://github.com/all-explained/empirical-finance-lbs/pull/87
GitHub Actions were not inspected. No merge was performed.
