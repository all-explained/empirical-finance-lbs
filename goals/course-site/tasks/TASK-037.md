---
id: TASK-037
title: 'Plan: decompose M-11'
milestone: M-11
state: approved
depends_on: [TASK-036, TASK-116]
delivery: pr
kind: plan
---

## Why

SC-7 and M-11. Part IX (Consumption: data and the equity premium puzzle) is planned only after the earlier Part has shown the chapter pattern, so each Part learns from the one before (rolling wave).

## Scope

Run the `goal-setup` skill in replan mode at the plan root. Read `docs/CURRICULUM.md` (Part IX, chapters 35, 36, and the Shared components and Data wanted later sections), `docs/STYLE_GUIDE.md`, `docs/DATA.md`, `docs/READINGS.md`, the list of PDFs in `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/`, the merged chapters and libraries in `src/`, the outcomes of the earlier chapter tasks (what went wrong and what the reviews asked for), and the goal README (CRSP rule, missing readings).

Add M-11 tasks, following the Part I pattern (TASK-018 to TASK-029):
- Libraries first: the maths a chapter needs, in `src/lib` with Vitest reference-value tests, one task per coherent library. Reuse what exists. Route: claude opus high.
- Data tasks only where a chapter needs a dataset that is not built. Public sources only, or small aggregate series from the CRSP file named in the README. Route each with `goal route <id> codex gpt-6.1-sol high`. Where the data is licensed and not supplied, the chapter uses a seeded simulation, as `docs/CURRICULUM.md` says; add no task.
- One task per chapter (35, 36): its MDX, widgets and number tests, one PR per chapter. Copy the spec shape of TASK-022 to TASK-028. Name the papers that exist in `source/papers/` by absolute path; for a reading that is missing, say so and allow no fact from it. Depend only on the library or data task the chapter uses.
- One manual task: the owner reads Part IX and approves how it reads (set `delivery: manual` as TASK-029 does).

Keep the graph wide and shallow. Fill every spec; leave no template lines. Routes: chapters, widgets and their maths libraries to claude opus high; data downloads, scaffolding and fixes to codex gpt-6.1-sol high.

Pacing. After you add this Part's chapter tasks, link `Plan: decompose M-12` after this Part's first chapter task, with `goal link <plan-task> --after <chapter-task>`, so the next Part is planned once this Part has proved the pattern.

## Acceptance

- `goal check --json` reports no errors.
- `goal graph` shows the new M-11 tasks with library and data tasks before chapter tasks and the owner-review task last.
- Every chapter of Part IX (35, 36) has exactly one chapter task.

## Verify

```sh
goal check --json
goal graph
```
