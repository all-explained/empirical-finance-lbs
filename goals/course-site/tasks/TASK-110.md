---
id: TASK-110
title: Part VI prose and link fixes from the read-through (chapters 24, 26, 27)
milestone: M-8
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-7 and M-8. The orchestrator's read-through of chapters 24 to 27 (TASK-100) listed three prose or link changes. They must land before Part VII copies the Part VI pattern. TASK-100 stays open until this task is merged.

## Scope

Prose only: change no widget behaviour and no library maths.

1. `src/content/chapters/24-generalized-method-of-moments.mdx` lines 42-43: the text says the dots are labelled $\hat\theta$ and $\theta_0$, but the widget labels read "minimum" and "true θ₀". Say that the dot labelled *minimum* is the lowest point of the curve, the estimate $\hat\theta$, and keep the true-value dot as it is.
2. `src/content/chapters/27-weak-and-useless-factors.mdx` lines 209-211: the sentence "so it can never give the right answer for weak betas: 'almost anything'" is unclear. Say that the Wald set is always bounded, that with weak betas the right answer is "almost anything", and that the Wald set is therefore too narrow. Keep the sentence on the normal approximation.
3. Links across chapters. In chapter 26 (line 72), link the first mention of Chapters 24 and 25. In chapter 27 (line 80), link the first mention of Chapter 26. In chapter 24, link "managed portfolio" to Chapter 22. In chapter 26, after the linear SDF is introduced, add one sentence that the scaled models of Chapter 22 are linear SDFs with extra factors. Copy the link style of chapters 13 to 15.

Out of scope: every other chapter, widgets, libraries and `docs/`.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `24-generalized-method-of-moments`, `26-gmm-for-asset-pricing-models` and `27-weak-and-useless-factors`.
- `git diff --name-only origin/main` lists only the three chapter files named above and this task's outcome file.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 24-generalized-method-of-moments
npm run screenshots -- 26-gmm-for-asset-pricing-models
npm run screenshots -- 27-weak-and-useless-factors
npm run clickthrough -- 24-generalized-method-of-moments
npm run clickthrough -- 26-gmm-for-asset-pricing-models
npm run clickthrough -- 27-weak-and-useless-factors
git diff --name-only origin/main
