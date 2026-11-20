---
id: TASK-167
title: Orchestrator reads Part XII and signs it off
milestone: M-14
state: approved
depends_on: [TASK-164, TASK-165, TASK-166]
delivery: pr
kind: gate
---

## Why


SC-7 and M-14. The orchestrator judges how Part XII reads before Part XIII builds on it. No owner approval is needed (owner decision, 2026-10-23).

## Scope


A read-through of chapters 43, 44, 45 and 46 (affine models, the regression estimator, spanning and the convenience yield) on merged `main`, delivered as a report in this task's outcome. The worker changes no chapter, widget, library or doc; the only file in the PR is this task's outcome file under `goals/course-site/tasks/`.

1. Run the Verify commands and paste their tails in the outcome.
2. Read each chapter in the browser (`npm run dev`, then `http://localhost:4321/empirical-finance-lbs/`) in both themes at desktop and 360px width, and use every widget control.
3. Judge four things and write one short section on each: does the voice work for a reader who starts from zero, at the Part's ●●● level (`docs/STYLE_GUIDE.md` §1); does each widget teach what its caption says; do the chapters reuse the shared widgets and libraries without forking them (the recursions only in `affine.ts`; the Svensson formula only in `bonds.ts`; one hook per dataset; the `TermPremium` preset leaves chapter 43 as it was; the `RegressionLab` presets leave chapters 3 and 26 as they were) and share the bond rows of §3 (report any duplicate loading code and any symbol used two ways, such as $X_t$, $\Phi$ or $A$, $\Sigma$, $\delta$, $\lambda$, $B$, $\beta$ or $z_t$); does Part XII read in one voice, follow from Part XI and lead to Part XIII, with every sentence about another chapter true of the merged site (chapters may name earlier Part XII chapters by title where they were not merged when written: list each such place).
4. End with `## Sign-off`: either "Part XII reads well" or a numbered list of changes, each naming the chapter, the file and the fix.

The orchestrator reads the report and the chapters. It signs off by merging this PR. Each listed change becomes a new M-14 task routed to claude opus high, and the orchestrator merges this PR only after those changes are merged.

Where jobs run: build, screenshots and click-through on the MacBook; nothing reads CRSP, option or tick data.

## Acceptance


- `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `43-affine-term-structure-models`, `44-pricing-the-term-structure-with-linear-regressions`, `45-spanned-and-unspanned-factors`, `46-the-convenience-yield-of-treasuries`, `03-regression-and-standard-errors` and `26-gmm-for-asset-pricing-models`.
- The outcome holds the four judgements and a `## Sign-off` section with "Part XII reads well" or a numbered list of changes.
- `git diff --name-only origin/main` lists only this task's outcome file.

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 43-affine-term-structure-models
npm run screenshots -- 44-pricing-the-term-structure-with-linear-regressions
npm run screenshots -- 45-spanned-and-unspanned-factors
npm run screenshots -- 46-the-convenience-yield-of-treasuries
npm run screenshots -- 03-regression-and-standard-errors
npm run screenshots -- 26-gmm-for-asset-pricing-models
npm run clickthrough -- 43-affine-term-structure-models
npm run clickthrough -- 44-pricing-the-term-structure-with-linear-regressions
npm run clickthrough -- 45-spanned-and-unspanned-factors
npm run clickthrough -- 46-the-convenience-yield-of-treasuries
npm run clickthrough -- 03-regression-and-standard-errors
npm run clickthrough -- 26-gmm-for-asset-pricing-models
git diff --name-only origin/main
