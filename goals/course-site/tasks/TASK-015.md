---
id: TASK-015
title: Owner reads both reference chapters and approves how they read
milestone: M-2
state: approved
depends_on: [TASK-013, TASK-014]
delivery: manual
---

## Why

SC-5. The goal ends when the owner approves how the two reference chapters read. Only the owner can judge the voice and the explanations for a reader new to the subject.

## Scope

After TASK-013 and TASK-014 merge, the owner reads chapter 1 (Returns) and chapter 9 (Time-varying expected returns), uses every widget, and tells the orchestrator one of two things: "approved", or a list of changes. Each requested change becomes a new M-2 task, routed to claude opus high, and this task stays open until the changed chapters are merged and the owner approves again.

How to read them: pull `main` in `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs`, run `npm ci && npm run dev`, and open `http://localhost:4321/empirical-finance-lbs/`. The orchestrator can also run `npm run build && npm run preview`.

Judge three things: does the voice work for a reader who starts from zero; does each widget teach what its caption says; is the real-data pattern in chapter 9 the one later chapters should copy.

## Acceptance

- The owner states "approved" for both chapters, or lists changes and later approves the revised chapters.
