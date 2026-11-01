---
id: TASK-100
title: Orchestrator reads Part VI and signs it off
milestone: M-8
state: approved
depends_on: [TASK-096, TASK-097, TASK-098, TASK-099, TASK-110]
delivery: pr
kind: gate
blocked: null
---

## Why


SC-7 and M-8. The orchestrator judges how Part VI reads before the next Parts copy its pattern. No owner approval is needed (owner decision, 2026-10-23).

## Scope


A read-through of chapters 24–27 (GMM and tests of asset pricing models) on merged `main`, delivered as a report in this task's outcome. The worker changes no chapter, widget, library or doc; the only file in the PR is this task's outcome file under `goals/course-site/tasks/`.

1. Run the Verify commands and paste their tails in the outcome.
2. Read each chapter in the browser (`npm run dev`, then `http://localhost:4321/empirical-finance-lbs/`) in both themes at desktop and 360px width, and use every widget control.
3. Judge four things and write one short section on each: does the voice work for a reader who starts from zero, at the Part's ●●● level (`docs/STYLE_GUIDE.md` §1); does each widget teach what its caption says; do the chapters share one `GMMObjective`, the data helpers (`gmmSample.ts`, and `useConditionalData` from Part V) and the Part VI notation block of §3 (report any duplicate loading code or any symbol used two ways); does Part VI link the two-pass tests of Part IV and the conditional models of Part V to the factor zoo of Part VII, with every sentence about another chapter true of the merged site.
4. End with `## Sign-off`: either "Part VI reads well" or a numbered list of changes, each naming the chapter, the file and the fix.

The orchestrator reads the report and the chapters. It signs off by merging this PR. Each listed change becomes a new M-8 task routed to claude opus high, and the orchestrator merges this PR only after those changes are merged.

## Acceptance


- `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `24-generalized-method-of-moments`, `25-efficient-and-feasible-gmm`, `26-gmm-for-asset-pricing-models` and `27-weak-and-useless-factors`.
- The outcome holds the four judgements and a `## Sign-off` section with "Part VI reads well" or a numbered list of changes.
- `git diff --name-only origin/main` lists only this task's outcome file.

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 24-generalized-method-of-moments
npm run screenshots -- 25-efficient-and-feasible-gmm
npm run screenshots -- 26-gmm-for-asset-pricing-models
npm run screenshots -- 27-weak-and-useless-factors
npm run clickthrough -- 24-generalized-method-of-moments
npm run clickthrough -- 25-efficient-and-feasible-gmm
npm run clickthrough -- 26-gmm-for-asset-pricing-models
npm run clickthrough -- 27-weak-and-useless-factors
git diff --name-only origin/main
