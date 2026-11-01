# TASK-110 outcome: Part VI prose and link fixes from the read-through (chapters 24, 26, 27)

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: on `170b800` (rebased on `origin/main` `509edf6`), `npm ci` exit 0; `npm test` exit 0,
  `Test Files 63 passed (63)`, `Tests 675 passed (675)`; `npm run build` exit 0, `- 0 errors`, `- 0 warnings`,
  `- 1 hint`, `28 page(s) built`, `[build] Complete!`. The hint is the unused `Matrix` import in
  `src/lib/finance/news.ts`, already reported as #88.
- [x] `npm run screenshots` and `npm run clickthrough` pass for `24-generalized-method-of-moments`,
  `26-gmm-for-asset-pricing-models` and `27-weak-and-useless-factors`.
  Evidence: each of the three `npm run screenshots -- <slug>` runs exited 0 with 4 captures (light and dark, desktop
  and phone). Each of the three `npm run clickthrough -- <slug>` runs exited 0: chapter 24 passed both widget
  checks with 5 actions at 1280px and 360px, chapter 26 passed both (1 and 5 actions), and chapter 27 passed both
  (6 actions each). Playwright crops of the six changed paragraphs, in both themes at 1280px and 360px, show the
  links and the inline math without errors or overflow.
- [x] `git diff --name-only origin/main` lists only the three chapter files named above and this task's outcome
  file.
  Evidence: `src/content/chapters/24-generalized-method-of-moments.mdx`,
  `src/content/chapters/26-gmm-for-asset-pricing-models.mdx`, `src/content/chapters/27-weak-and-useless-factors.mdx`
  and `goals/course-site/tasks/TASK-110.outcome.md`.

## Summary

What changed, by spec item:

1. Chapter 24: the text now names the widget's *minimum* dot as the lowest point of the curve, the estimate
   $\hat\theta$. The sentence on the $\theta_0$ dot stays.
2. Chapter 27: the Wald paragraph now says, in three short sentences, that the Wald set is always bounded, that
   the right answer for weak betas is "almost anything", and that the Wald set is therefore too narrow. The
   sentence on the normal approximation stays.
3. Links, in the `[Chapter N](/empirical-finance-lbs/chapters/NN-slug/)` style of chapters 13 to 15:
   chapter 26 links its first mentions of Chapters 24 and 25; chapter 27 links its first mention of Chapter 26;
   chapter 24 links "managed portfolio" to Chapter 22. Chapter 26 adds one sentence after the linear SDF equation:
   the scaled models of Chapter 22 are linear SDFs of this form, with the scaled factors as extra factors.

The build output has every new link target (`22-conditional-factor-models`, `24-generalized-method-of-moments`,
`25-efficient-and-feasible-gmm`, `26-gmm-for-asset-pricing-models`). No widget, library or doc changed.

Deviations: none. Verified revision: `170b800`. Proposed follow-ups: none.
