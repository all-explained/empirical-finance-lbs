---
id: TASK-120
title: Orchestrator reads Part VIII and signs it off
milestone: M-10
state: approved
depends_on: [TASK-116, TASK-117, TASK-118, TASK-119]
delivery: pr
kind: gate
---

## Why


SC-7 and M-10. The orchestrator judges how Part VIII reads before the next Parts copy its pattern. No owner approval is needed (owner decision, 2026-10-23).

## Scope


A read-through of chapters 31–34 (latent factors and large cross-sections) on merged `main`, delivered as a report in this task's outcome. The worker changes no chapter, widget, library or doc; the only file in the PR is this task's outcome file under `goals/course-site/tasks/`.

1. Run the Verify commands and paste their tails in the outcome.
2. Read each chapter in the browser (`npm run dev`, then `http://localhost:4321/empirical-finance-lbs/`) in both themes at desktop and 360px width, and use every widget control.
3. Judge four things and write one short section on each: does the voice work for a reader who starts from zero, at the Part's ●●● level (`docs/STYLE_GUIDE.md` §1); does each widget teach what its caption says; do the chapters reuse the shared widgets without forking them (one `PCAExplorer` whose default views still render chapters 6 and 28, one `SortGrid` whose default views still render chapter 19) and share the Part VIII notation block of §3 (report any duplicate loading code, any symbol used two ways, and any rotation or PCA step written twice instead of reused from `latentFactors.ts`); does Part VIII link the factor zoo and shrinkage of Part VII to the consumption models of Part IX, with every sentence about another chapter true of the merged site.
4. End with `## Sign-off`: either "Part VIII reads well" or a numbered list of changes, each naming the chapter, the file and the fix.

The orchestrator reads the report and the chapters. It signs off by merging this PR. Each listed change becomes a new M-10 task routed to claude opus high, and the orchestrator merges this PR only after those changes are merged.

## Acceptance


- `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `31-latent-and-observable-factors`, `32-characteristics-are-covariances-ipca`, `33-characteristic-based-mimicking-portfolios`, `34-risk-premia-with-omitted-factors`, `06-principal-components`, `19-size-and-value` and `28-skeptical-look-at-asset-pricing-tests`.
- The outcome holds the four judgements and a `## Sign-off` section with "Part VIII reads well" or a numbered list of changes.
- `git diff --name-only origin/main` lists only this task's outcome file.

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 31-latent-and-observable-factors
npm run screenshots -- 32-characteristics-are-covariances-ipca
npm run screenshots -- 33-characteristic-based-mimicking-portfolios
npm run screenshots -- 34-risk-premia-with-omitted-factors
npm run screenshots -- 06-principal-components
npm run screenshots -- 19-size-and-value
npm run screenshots -- 28-skeptical-look-at-asset-pricing-tests
npm run clickthrough -- 31-latent-and-observable-factors
npm run clickthrough -- 32-characteristics-are-covariances-ipca
npm run clickthrough -- 33-characteristic-based-mimicking-portfolios
npm run clickthrough -- 34-risk-premia-with-omitted-factors
npm run clickthrough -- 06-principal-components
npm run clickthrough -- 19-size-and-value
npm run clickthrough -- 28-skeptical-look-at-asset-pricing-tests
git diff --name-only origin/main
