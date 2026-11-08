---
id: TASK-142
title: Orchestrator reads Part X and signs it off
milestone: M-12
state: approved
depends_on: [TASK-139, TASK-140, TASK-141]
delivery: pr
kind: gate
---

## Why


SC-7 and M-12. The orchestrator judges how Part X reads before the next Parts copy its pattern. No owner approval is needed (owner decision, 2026-10-23).

## Scope


A read-through of chapters 37, 38 and 39 (habits, long-run risk and disasters) on merged `main`, delivered as a report in this task's outcome. The worker changes no chapter, widget, library or doc; the only file in the PR is this task's outcome file under `goals/course-site/tasks/`.

1. Run the Verify commands and paste their tails in the outcome.
2. Read each chapter in the browser (`npm run dev`, then `http://localhost:4321/empirical-finance-lbs/`) in both themes at desktop and 360px width, and use every widget control.
3. Judge four things and write one short section on each: does the voice work for a reader who starts from zero, at the Part's ●●● level (`docs/STYLE_GUIDE.md` §1); does each widget teach what its caption says; do the chapters reuse the shared widgets and libraries without forking them (one `PredictiveRegression` whose `dp` and `cay` views still render chapters 9 and 14; the annual sample built once, through `annualSample` of `consumptionPuzzle.ts`; Gauss–Hermite quadrature only in `quadrature.ts`) and share the Part X notation block of §3 (report any duplicate loading code and any symbol used two ways, such as $\theta$, $\rho$, $\phi$, $\lambda$, $\pi$ or $b$); does Part X answer the puzzles of chapter 35 in one voice and lead to the term structure of Part XI, with every sentence about another chapter true of the merged site (chapters 38 and 39 may name earlier Part X chapters by title where they were not merged when written: list each such place).
4. End with `## Sign-off`: either "Part X reads well" or a numbered list of changes, each naming the chapter, the file and the fix.

The orchestrator reads the report and the chapters. It signs off by merging this PR. Each listed change becomes a new M-12 task routed to claude opus high, and the orchestrator merges this PR only after those changes are merged.

## Acceptance


- `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `37-internal-and-external-habits`, `38-long-run-risk`, `39-rare-disasters-and-jump-risk`, `09-time-varying-expected-returns` and `14-consumption-wealth-ratio`.
- The outcome holds the four judgements and a `## Sign-off` section with "Part X reads well" or a numbered list of changes.
- `git diff --name-only origin/main` lists only this task's outcome file.

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 37-internal-and-external-habits
npm run screenshots -- 38-long-run-risk
npm run screenshots -- 39-rare-disasters-and-jump-risk
npm run screenshots -- 09-time-varying-expected-returns
npm run screenshots -- 14-consumption-wealth-ratio
npm run clickthrough -- 37-internal-and-external-habits
npm run clickthrough -- 38-long-run-risk
npm run clickthrough -- 39-rare-disasters-and-jump-risk
npm run clickthrough -- 09-time-varying-expected-returns
npm run clickthrough -- 14-consumption-wealth-ratio
git diff --name-only origin/main
