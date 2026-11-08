---
id: TASK-149
title: Orchestrator reads Part XI and signs it off
milestone: M-13
state: approved
depends_on: [TASK-146, TASK-147, TASK-148]
delivery: pr
kind: gate
---

## Why


SC-7 and M-13. The orchestrator judges how Part XI reads before Part XII builds term structure models on it. No owner approval is needed (owner decision, 2026-10-23).

## Scope


A read-through of chapters 40, 41 and 42 (yields and returns, the expectations hypothesis, and bond risk premia) on merged `main`, delivered as a report in this task's outcome. The worker changes no chapter, widget, library or doc; the only file in the PR is this task's outcome file under `goals/course-site/tasks/`.

1. Run the Verify commands and paste their tails in the outcome.
2. Read each chapter in the browser (`npm run dev`, then `http://localhost:4321/empirical-finance-lbs/`) in both themes at desktop and 360px width, and use every widget control.
3. Judge four things and write one short section on each: does the voice work for a reader who starts from zero, at the Part's ●● level (`docs/STYLE_GUIDE.md` §1); does each widget teach what its caption says; do the chapters reuse the shared widgets and libraries without forking them (yield, forward and return arithmetic only in `bonds.ts`; one `bondSample.ts` hook; the `spread` views of `PredictiveRegression` and `HorizonCurve` leave chapters 9, 14 and 37 as they were; the `gsw-levels` preset leaves chapters 6, 28 and 31 as they were) and share the bond rows of §3 (report any duplicate loading code and any symbol used two ways, such as $\gamma$, $b$, $f_t$, $s$, $S$ or a bar for a mean); does Part XI read in one voice and lead to the affine models of Part XII, with every sentence about another chapter true of the merged site (chapters 41 and 42 may name earlier Part XI chapters by title where they were not merged when written: list each such place).
4. End with `## Sign-off`: either "Part XI reads well" or a numbered list of changes, each naming the chapter, the file and the fix.

The orchestrator reads the report and the chapters. It signs off by merging this PR. Each listed change becomes a new M-13 task routed to claude opus high, and the orchestrator merges this PR only after those changes are merged.

## Acceptance


- `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `40-yields-forwards-and-bond-returns`, `41-testing-the-expectations-hypothesis`, `42-level-slope-curvature-and-bond-risk-premia`, `09-time-varying-expected-returns` and `06-principal-components`.
- The outcome holds the four judgements and a `## Sign-off` section with "Part XI reads well" or a numbered list of changes.
- `git diff --name-only origin/main` lists only this task's outcome file.

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 40-yields-forwards-and-bond-returns
npm run screenshots -- 41-testing-the-expectations-hypothesis
npm run screenshots -- 42-level-slope-curvature-and-bond-risk-premia
npm run screenshots -- 09-time-varying-expected-returns
npm run screenshots -- 06-principal-components
npm run clickthrough -- 40-yields-forwards-and-bond-returns
npm run clickthrough -- 41-testing-the-expectations-hypothesis
npm run clickthrough -- 42-level-slope-curvature-and-bond-risk-premia
npm run clickthrough -- 09-time-varying-expected-returns
npm run clickthrough -- 06-principal-components
git diff --name-only origin/main
