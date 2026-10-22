---
id: TASK-006
title: 'Plan: decompose M-2'
milestone: M-2
state: approved
depends_on: [TASK-003, TASK-004, TASK-005, DEC-001, TASK-008]
delivery: pr
kind: plan
---

## Why

M-2 and SC-5. The reference chapters can be planned only once the curriculum, style guide, data and the chapter choice exist.

## Scope

Run the `goal-setup` skill in replan mode at the plan root. Read the merged `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md`, `docs/DATA.md`, the accepted DEC-001 and the list of files in `source/papers/`.

Add M-2 tasks, following options-explained's practice:
- Maths and statistics first, in `src/lib` with Vitest reference-value tests (for example OLS with Newey–West standard errors, predictive regressions, the Campbell–Shiller decomposition), one task per coherent library.
- Then one task per reference chapter: its widgets and its MDX, one PR per chapter. Each chapter spec names its papers in `source/papers/` by absolute path and requires: `npm test`, `npm run build`, `npm run screenshots <chapter>`, a Playwright click-through of every widget control, and a re-read against the style guide's voice section.
- A manual task: the owner reads both chapters and approves how they read (SC-5).

Keep the graph wide and shallow. Fill every spec; no template lines.

## Acceptance

- `goal check --json` reports no errors.
- `goal graph` shows the new M-2 tasks with library tasks before chapter tasks and the owner-review task last.

## Verify

```sh
goal check --json
goal graph
```
