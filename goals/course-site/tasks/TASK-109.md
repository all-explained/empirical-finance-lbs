---
id: TASK-109
title: Orchestrator reads Part VII and signs it off
milestone: M-9
state: approved
depends_on: [TASK-106, TASK-107, TASK-108]
delivery: pr
kind: gate
---

## Why


SC-7 and M-9. The orchestrator judges how Part VII reads before the next Parts copy its pattern. No owner approval is needed (owner decision, 2026-10-23).

## Scope


A read-through of chapters 28–30 (the factor zoo and shrinkage) on merged `main`, delivered as a report in this task's outcome. The worker changes no chapter, widget, library or doc; the only file in the PR is this task's outcome file under `goals/course-site/tasks/`.

1. Run the Verify commands and paste their tails in the outcome.
2. Read each chapter in the browser (`npm run dev`, then `http://localhost:4321/empirical-finance-lbs/`) in both themes at desktop and 360px width, and use every widget control.
3. Judge four things and write one short section on each: does the voice work for a reader who starts from zero, at the Part's ●●● level (`docs/STYLE_GUIDE.md` §1); does each widget teach what its caption says; do the chapters reuse the shared widgets without forking them (`PCAExplorer` and `ZooChart` unchanged, one `FrontierBuilder` whose default still renders chapter 7) and share the Part VII notation block of §3 (report any duplicate loading code or any symbol used two ways); does Part VII link the identification problems of Part VI to the latent factors of Part VIII, with every sentence about another chapter true of the merged site.
4. End with `## Sign-off`: either "Part VII reads well" or a numbered list of changes, each naming the chapter, the file and the fix.

The orchestrator reads the report and the chapters. It signs off by merging this PR. Each listed change becomes a new M-9 task routed to claude opus high, and the orchestrator merges this PR only after those changes are merged.

## Acceptance


- `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `28-skeptical-look-at-asset-pricing-tests`, `29-multiple-testing`, `30-shrinking-the-cross-section` and `07-mean-variance`.
- The outcome holds the four judgements and a `## Sign-off` section with "Part VII reads well" or a numbered list of changes.
- `git diff --name-only origin/main` lists only this task's outcome file.

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 28-skeptical-look-at-asset-pricing-tests
npm run screenshots -- 29-multiple-testing
npm run screenshots -- 30-shrinking-the-cross-section
npm run screenshots -- 07-mean-variance
npm run clickthrough -- 28-skeptical-look-at-asset-pricing-tests
npm run clickthrough -- 29-multiple-testing
npm run clickthrough -- 30-shrinking-the-cross-section
npm run clickthrough -- 07-mean-variance
git diff --name-only origin/main
