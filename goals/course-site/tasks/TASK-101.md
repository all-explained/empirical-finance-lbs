---
id: TASK-101
title: Raise the Vitest default timeout so load does not fail tests
milestone: M-8
state: approved
depends_on: []
delivery: pr
route: {platform: codex, model: gpt-6.1-sol, effort: high}
---

## Why

Fixes all-explained/empirical-finance-lbs#67. Slow seeded-simulation tests fail with "Test timed out in 5000ms" when many workers share the machine. Each test passes alone. The failures block read-through tasks such as TASK-100, whose acceptance needs a passing `npm test`.

## Scope

Add a `vitest.config.ts` at the repo root that sets `test.testTimeout` to 30000. Keep every other Vitest default as it is now. Check that Vitest finds the same test files as before. Remove per-test timeout overrides in `tests/` only if the new default makes them redundant. Change no test logic, no library maths and no chapter.

## Acceptance

- `vitest.config.ts` exists with `testTimeout: 30000`, and `npm test` still runs the same number of test files and tests as on `main`.
- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `git diff --name-only origin/main` lists only `vitest.config.ts`, optionally test files whose now-redundant timeout overrides you removed, and this task's outcome file.
- The PR description says `Fixes all-explained/empirical-finance-lbs#67`.

## Verify

npm ci
npm test
npm run build
git diff --name-only origin/main
