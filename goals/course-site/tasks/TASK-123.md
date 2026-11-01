---
id: TASK-123
title: 'Part VII fixes: chapter 30 prose, formatter and comment'
milestone: M-9
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-7 and M-9. The orchestrator's read-through of chapters 28 to 30 (TASK-109) listed small changes to chapter 30 and its widgets. TASK-109 stays open until they are merged.

## Scope

1. `src/content/chapters/30-shrinking-the-cross-section.mdx`:
   - Link Chapter 28 in the prerequisite box (link style of chapters 13 to 15).
   - Line 341: put the "Next up" chapter title in italics, as the other chapters do.
   - Line 301: replace "a handful ... a handful" with the numbers the chapter's tests pin (14 principal components at 0.44 and 20 anomalies at 0.29). Check them against `tests/chapter30-numbers.test.ts`.
   - Add the end of the anomaly sample (December 2024) to the Hook, as read from the data.
2. `ShrinkagePath.tsx` has a local formatter `sci` for the penalty, and `FrontierBuilder.tsx` has none. Move the formatter to `src/components/plots/format.ts`, use it in both the `ShrinkagePath` and the `FrontierBuilder` penalty slider, and delete the local copy.
3. `src/components/plots/shrinkageSample.ts` line 99: fix the stale comment.

Out of scope: library maths, other chapters, the look-ahead caveats (TASK-124 handles them).

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `30-shrinking-the-cross-section` and `07-mean-variance`.
- `git grep -n "const sci" src/components` prints nothing.
- `git diff --name-only origin/main` lists only files named in this scope and this task's outcome file.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 30-shrinking-the-cross-section
npm run screenshots -- 07-mean-variance
npm run clickthrough -- 30-shrinking-the-cross-section
npm run clickthrough -- 07-mean-variance
git grep -n "const sci" src/components
git diff --name-only origin/main
