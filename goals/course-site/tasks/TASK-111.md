---
id: TASK-111
title: 'Part VI widget cleanup: drop identification data aliases (chapter 27)'
milestone: M-8
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-7 and M-8. The orchestrator's read-through of chapters 24 to 27 (TASK-100) found that `useIdentificationData` and `IdentificationData` only re-export `useConditionalData` and `ConditionalData`. The aliases give one thing two names. TASK-100 stays open until this task is merged.

## Scope

Delete `useIdentificationData` and `IdentificationData` from `src/components/plots/identificationSample.ts` (lines 12-13). In `ConfidenceSet.tsx` and `UselessFactor.tsx`, import `useConditionalData` and `ConditionalData` directly. Run `git grep -n "useIdentificationData\|IdentificationData"` and update or delete every hit (code, tests, docs). Keep every other export of `identificationSample.ts`. Change no widget behaviour and no library maths.

Out of scope: chapters, other widgets and libraries.

## Acceptance

- `git grep -n "useIdentificationData\|IdentificationData"` prints nothing.
- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `27-weak-and-useless-factors`.
- `git diff --name-only origin/main` lists only files named in this scope and this task's outcome file.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 27-weak-and-useless-factors
npm run clickthrough -- 27-weak-and-useless-factors
git grep -n "useIdentificationData\|IdentificationData"
git diff --name-only origin/main
