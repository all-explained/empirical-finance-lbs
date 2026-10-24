---
id: TASK-066
title: Orchestrator reads Part IV and signs it off
milestone: M-6
state: approved
depends_on: [TASK-063, TASK-064, TASK-065]
delivery: pr
kind: gate
---

## Why


SC-7 and M-6. The orchestrator judges how Part IV reads before the next Parts copy its pattern. No owner approval is needed (owner decision, 2026-10-23).

## Scope


A read-through of chapters 16–18 (Cross-sectional tests) on merged `main`, delivered as a report in this task's outcome. The worker changes no chapter, widget, library or doc; the only file in the PR is this task's outcome file under `goals/course-site/tasks/`.

1. Run the Verify commands and paste their tails in the outcome.
2. Read each chapter in the browser (`npm run dev`, then `http://localhost:4321/empirical-finance-lbs/`) in both themes at desktop and 360px width, and use every widget control.
3. Judge four things and write one short section on each: does the voice work for a reader who starts from zero (`docs/STYLE_GUIDE.md` §1); does each widget teach what its caption says; do the three chapters share one data helper (`src/components/plots/factorTestSample.ts`) and one notation (report any duplicate loading code or any symbol used two ways); does Part IV link the CAPM of chapter 7 to the factor models of Part V, with every sentence about another chapter true of the merged site.
4. End with `## Sign-off`: either "Part IV reads well" or a numbered list of changes, each naming the chapter, the file and the fix.

The orchestrator reads the report and the chapters. It signs off by merging this PR. Each listed change becomes a new M-6 task routed to claude opus high, and the orchestrator merges this PR only after those changes are merged.

## Acceptance


- `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `16-time-series-tests`, `17-cross-sectional` and `18-errors-in-variables`.
- The outcome holds the four judgements and a `## Sign-off` section with "Part IV reads well" or a numbered list of changes.
- `git diff --name-only origin/main` lists only this task's outcome file.

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 16-time-series-tests
npm run screenshots -- 17-cross-sectional
npm run screenshots -- 18-errors-in-variables
npm run clickthrough -- 16-time-series-tests
npm run clickthrough -- 17-cross-sectional
npm run clickthrough -- 18-errors-in-variables
git diff --name-only origin/main
