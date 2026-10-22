---
id: TASK-029
title: Owner reads Part I and approves how it reads
milestone: M-3
state: approved
depends_on: [TASK-022, TASK-023, TASK-024, TASK-025, TASK-026, TASK-027, TASK-028]
delivery: manual
---

## Why

SC-7. The owner judges how Part I reads before the next Parts copy its pattern.

## Scope

The owner reads chapters 2–8 (Foundations), uses every widget, and tells the orchestrator "approved" or gives a list of changes. Each change becomes a new M-3 task routed to claude opus high, and this task stays open until the changed chapters are merged and approved. How to read: pull `main` in `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs`, run `npm ci && npm run dev` and open `http://localhost:4321/empirical-finance-lbs/`. Judge three things: does the voice work for a reader who starts from zero; does each widget teach what its caption says; does the order of Part I prepare Part II.

## Acceptance

- The owner states "approved" for Part I, or lists changes and later approves the revised chapters.

## Verify

No command. The orchestrator marks the task done with `goal done` after the owner approves.
