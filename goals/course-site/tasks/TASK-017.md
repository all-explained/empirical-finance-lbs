---
id: TASK-017
title: Allow Part XVII in the chapter schema
milestone: M-2
state: approved
depends_on: []
delivery: pr
route: {platform: codex, model: gpt-6.1-sol, effort: high}
---

## Why

SC-5 and SC-6. `docs/CURRICULUM.md` has 17 parts, but the chapter schema stops at 16, so no chapter of Part XVII can build. Later goals write those chapters. Fixes all-explained/empirical-finance-lbs#5.

## Scope

Change the `part` field of the chapter schema in `src/content.config.ts` so that 17 is valid. Take the upper bound from the curriculum if `src/data/curriculum.ts` already exposes the number of parts. Otherwise use a positive integer with no fixed upper bound. Add a Vitest test that checks the schema accepts part 1 and part 17 and rejects 0 and 1.5. If the schema cannot be imported in a test without Astro, test a small exported schema object instead of copying the rule.

Out of scope: chapters, curriculum content, other schema fields.

## Acceptance

- The `part` field accepts 17 and rejects 0 and 1.5. A test shows it.
- `npm test` and `npm run build` pass.
- `git status --short` shows only `src/content.config.ts`, the new test and this task's outcome file.

## Verify

```sh
npm ci
npm test
npm run build
git status --short
```
