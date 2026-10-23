---
id: TASK-060
title: Owner reads Part III and approves how it reads
milestone: M-5
state: approved
depends_on: [TASK-057, TASK-058, TASK-059]
delivery: manual
---

## Why

SC-7 and M-5. The owner judges how Part III reads before the next Parts copy its pattern.

## Scope

The owner reads chapters 13–15 (Return predictability: out of sample and beyond), uses every widget, and tells the orchestrator "approved" or gives a list of changes. Each change becomes a new M-5 task routed to claude opus high, and this task stays open until the changed chapters are merged and approved. How to read: pull `main` in `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs`, run `npm ci && npm run dev` and open `http://localhost:4321/empirical-finance-lbs/`. Judge three things: does the voice work for a reader who starts from zero; does each widget teach what its caption says; does Part III close the predictability story of Part II and prepare Part IV.

## Acceptance

- The owner states "approved" for Part III, or lists changes and later approves the revised chapters.

## Verify

No command. The orchestrator marks the task done with `goal done` after the owner approves.
