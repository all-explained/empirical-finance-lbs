---
id: TASK-005
title: Sync src/data/curriculum.ts with the curriculum
milestone: M-1
state: approved
depends_on: [TASK-001, TASK-002]
delivery: pr
---

## Why

SC-2. The site navigation and index must show the planned course, as in options-explained.

## Scope

Fill `src/data/curriculum.ts` from the merged `docs/CURRICULUM.md`: every part (number, roman numeral, title, difficulty) and every chapter (number, title). Keep the `PartInfo` shape from TASK-001. Chapters without an MDX file show as "coming soon", as in options-explained.

Add a Vitest test that parses `docs/CURRICULUM.md` (`## Part` and `### N.` headings) and fails if `curriculum.ts` differs in parts, chapter numbers or titles.

Out of scope: chapter content, changes to `docs/CURRICULUM.md` (report mismatches in the outcome instead).

## Acceptance

- `npm test` passes, including the curriculum sync test.
- `npm run build` and `npm run screenshots` pass; the index lists all parts and chapters.

## Verify

```sh
npm test
npm run build
npm run screenshots
```
