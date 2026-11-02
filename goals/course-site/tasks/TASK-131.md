---
id: TASK-131
title: Orchestrator reads Part IX and signs it off
milestone: M-11
state: approved
depends_on: [TASK-129, TASK-130]
delivery: pr
kind: gate
---

## Why


SC-7 and M-11. The orchestrator judges how Part IX reads before the next Parts copy its pattern. No owner approval is needed (owner decision, 2026-10-23).

## Scope


A read-through of chapters 35 and 36 (consumption data and the equity premium puzzle) on merged `main`, delivered as a report in this task's outcome. The worker changes no chapter, widget, library or doc; the only file in the PR is this task's outcome file under `goals/course-site/tasks/`.

1. Run the Verify commands and paste their tails in the outcome.
2. Read each chapter in the browser (`npm run dev`, then `http://localhost:4321/empirical-finance-lbs/`) in both themes at desktop and 360px width, and use every widget control.
3. Judge four things and write one short section on each: does the voice work for a reader who starts from zero, at the Part's ●● level (`docs/STYLE_GUIDE.md` §1); does each widget teach what its caption says; do the chapters reuse the shared widgets and libraries without forking them (one `HJBound` whose default view still renders chapter 8; consumption built once, through `cayInputs` and `annualConsumption`; implied risk aversion computed once, in `consumptionPuzzle.ts`) and share the Part IX notation block of §3 (report any duplicate loading code and any symbol used two ways, such as $\delta$ or $\phi$); does Part IX link the SDF of chapter 8 and the consumption models of Parts III and VI to the habits, long-run risk and disasters of Part X, with every sentence about another chapter true of the merged site.
4. End with `## Sign-off`: either "Part IX reads well" or a numbered list of changes, each naming the chapter, the file and the fix.

The orchestrator reads the report and the chapters. It signs off by merging this PR. Each listed change becomes a new M-11 task routed to claude opus high, and the orchestrator merges this PR only after those changes are merged.

## Acceptance


- `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `35-equity-premium-and-risk-free-rate-puzzles`, `36-measuring-consumption` and `08-euler-equation-and-sdf`.
- The outcome holds the four judgements and a `## Sign-off` section with "Part IX reads well" or a numbered list of changes.
- `git diff --name-only origin/main` lists only this task's outcome file.

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 35-equity-premium-and-risk-free-rate-puzzles
npm run screenshots -- 36-measuring-consumption
npm run screenshots -- 08-euler-equation-and-sdf
npm run clickthrough -- 35-equity-premium-and-risk-free-rate-puzzles
npm run clickthrough -- 36-measuring-consumption
npm run clickthrough -- 08-euler-equation-and-sdf
git diff --name-only origin/main
