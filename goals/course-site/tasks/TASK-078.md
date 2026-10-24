---
id: TASK-078
title: Orchestrator reads Part V and signs it off
milestone: M-7
state: approved
depends_on: [TASK-073, TASK-074, TASK-075, TASK-076, TASK-077, TASK-081, TASK-082, TASK-083]
delivery: pr
kind: gate
---

## Why


SC-7 and M-7. The orchestrator judges how Part V reads before the next Parts copy its pattern. No owner approval is needed (owner decision, 2026-10-23).

## Scope


A read-through of chapters 19–23 (Factors, anomalies and conditional models) on merged `main`, delivered as a report in this task's outcome. The worker changes no chapter, widget, library or doc; the only file in the PR is this task's outcome file under `goals/course-site/tasks/`.

1. Run the Verify commands and paste their tails in the outcome.
2. Read each chapter in the browser (`npm run dev`, then `http://localhost:4321/empirical-finance-lbs/`) in both themes at desktop and 360px width, and use every widget control.
3. Judge four things and write one short section on each: does the voice work for a reader who starts from zero (`docs/STYLE_GUIDE.md` §1); does each widget teach what its caption says; do the chapters share their data helpers (`factorModelSample.ts`, and `factorTestSample.ts` from Part IV) and one notation, with one `FactorBuilder` (report any duplicate loading code or any symbol used two ways); does Part V link the tests of Part IV to the GMM of Part VI, with every sentence about another chapter true of the merged site.
4. End with `## Sign-off`: either "Part V reads well" or a numbered list of changes, each naming the chapter, the file and the fix.

The orchestrator reads the report and the chapters. It signs off by merging this PR. Each listed change becomes a new M-7 task routed to claude opus high, and the orchestrator merges this PR only after those changes are merged.

## Acceptance


- `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `19-size-and-value`, `20-momentum`, `21-anomalies`, `22-conditional` and `23-does-the-conditional`.
- The outcome holds the four judgements and a `## Sign-off` section with "Part V reads well" or a numbered list of changes.
- `git diff --name-only origin/main` lists only this task's outcome file.

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 19-size-and-value
npm run screenshots -- 20-momentum
npm run screenshots -- 21-anomalies
npm run screenshots -- 22-conditional
npm run screenshots -- 23-does-the-conditional
npm run clickthrough -- 19-size-and-value
npm run clickthrough -- 20-momentum
npm run clickthrough -- 21-anomalies
npm run clickthrough -- 22-conditional
npm run clickthrough -- 23-does-the-conditional
git diff --name-only origin/main
