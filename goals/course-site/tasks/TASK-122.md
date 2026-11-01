---
id: TASK-122
title: 'Part VII fixes: chapter 29 prose'
milestone: M-9
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-7 and M-9. The orchestrator's read-through of chapters 28 to 30 (TASK-109) found two unclear passages in chapter 29. TASK-109 stays open until they are fixed.

## Scope

Prose only, in `src/content/chapters/29-multiple-testing.mdx`:

1. Lines 113-115: a sentence is a tautology. Reword it so that it says something the reader can check.
2. Line 130 says the Bonferroni bar is 3.76, but the snapped line on the widget reads 3.71. Find which number the library and the widget compute (see `src/lib/stats/multipleTesting.ts` and `tests/chapter29-numbers.test.ts`), and write the text so that it agrees with the widget. If the two numbers differ for a real reason, such as snapping to a grid, say so in one sentence.

Out of scope: widgets, libraries, every other chapter, and `docs/`.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `29-multiple-testing`.
- `git diff --name-only origin/main` lists only the chapter 29 file and this task's outcome file.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 29-multiple-testing
npm run clickthrough -- 29-multiple-testing
git diff --name-only origin/main
