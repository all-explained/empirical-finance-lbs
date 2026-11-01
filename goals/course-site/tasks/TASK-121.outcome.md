# TASK-121 outcome

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm test` printed `Test Files  66 passed (66)` and `Tests  693 passed (693)`.
  `npm run build` exited 0; `astro check` printed `Result (200 files): 0 errors, 0 warnings, 1 hint`
  (the hint is an unused import in `src/lib/finance/news.ts`, which this task does not touch), and the
  build ended `31 page(s) built` and `Complete!`.
- [x] `npm run screenshots` and `npm run clickthrough` pass for `28-skeptical-look-at-asset-pricing-tests`.
  Evidence: screenshots exited 0 with `✓` for dark and light at desktop and phone. Click-through exited 0:
  `PCAExplorer` 70 actions and `RandomFactorFit` 8 actions, each at 1280px and 360px. Element crops of every
  changed passage (the Chapter 27 sentence, the `G` derivation, the `\mathbf{1}` formulas, the traded-factor
  list and the first quiz's explanation) were inspected in dark desktop and light phone, with 0 KaTeX errors.
- [x] `git grep -n "\\\\iota" src/content/chapters/28-skeptical-look-at-asset-pricing-tests.mdx` prints nothing.
  Evidence: it printed nothing and exited 1. `git grep -n '\\iota' src/content` also prints nothing.
- [x] `git diff --name-only origin/main` lists only the chapter 28 file, `RandomFactorFit.tsx`,
  `tests/chapter28-numbers.test.ts`, `docs/STYLE_GUIDE.md` and this task's outcome file.
  Evidence: it lists `docs/STYLE_GUIDE.md`, `goals/course-site/tasks/TASK-121.outcome.md` and
  `src/content/chapters/28-skeptical-look-at-asset-pricing-tests.mdx`, a subset of the allowed files.

## Summary

What changed:

- Notation in chapter 28. The matrix that maps the true betas to the proposed ones is now `G`
  (`B_P = BG`, `\lambda_P = G^{-1}\lambda`), in the derivation, the traded-factor list and the first quiz.
  `git grep -n "\bG\b" src/content/chapters` found only "Gürkaynak" in chapter 6, so `G` is free.
  The ones vector is `\mathbf{1}`, as the style guide's conventions already say.
- Style guide §3, Part VII block. The `s` row now gives both meanings (chapter 28's noise share,
  chapter 30's `L^1` share). New rows: `B` (beta matrix in chapter 28, as in chapter 27; the band event
  `B_j` in chapter 29's proof), `f^P_t`, `B_P`, `\lambda_P`, `G`, `\vartheta` and the indicator
  `\mathbf{1}\{\cdot\}`. The `\iota` row is gone because no chapter uses `\iota` now; `\mu_{\text{gmv}}`
  keeps its own row, and the `R^2_{\text{GLS}}` formula uses `\mathbf{1}`.
- Prose. The traded-factor step that said "From step 2 above" now says "the matrix `G` of the first list
  in this section", which is the list that defines `G`. The weak-factor paragraph ends with one sentence that
  links [Chapter 27](/empirical-finance-lbs/chapters/27-weak-and-useless-factors/), in the inline link style
  of chapters 13 to 15.

Deviations: `RandomFactorFit.tsx` and `tests/chapter28-numbers.test.ts` contain no `Q` and no `\iota`
(their text uses only `s`, `f_{k,t}`, mix and noise), so the renames left them unchanged.

Verified revision: the Verify commands ran on `981d32e`. The branch was then rebased onto `origin/main`
as `2511bc1`; the rebase brought in only goal bookkeeping files, and `git diff 981d32e 2511bc1 -- src docs tests`
is empty.

Proposed follow-ups: none.
