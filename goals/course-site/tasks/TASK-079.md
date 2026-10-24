---
id: TASK-079
title: Part IV fixes from the read-through
milestone: M-6
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-7 and M-6. The orchestrator's read-through of chapters 16–18 (`goals/course-site/tasks/TASK-066.outcome.md`, section Sign-off) listed five small changes. They must land before Part V copies the Part IV pattern.

## Scope

Make exactly these five changes. Read the Sign-off section of `TASK-066.outcome.md` on the PR branch `goal/course-site/task-066` (or in the merged outcome file) for the full wording of each.

1. `src/content/chapters/16-time-series-tests-and-grs.mdx` (where FF3 first appears, near line 27) and `src/content/chapters/17-cross-sectional-regressions-and-fama-macbeth.mdx` (the sentence that introduces FF3, near line 84): say in one sentence that SMB is the return of small minus big stocks, HML the return of high minus low book-to-market stocks, and that Chapter 19 builds both.
2. `src/content/chapters/18-errors-in-variables-and-shanken.mdx`, `src/components/plots/ShankenCorrection.tsx`, its test text and `docs/STYLE_GUIDE.md`: remove the clash on $c$. Rename the Shanken factor in the chapter and the widget readout (for example to $\kappa$) and add `src/lib/katexMacros.ts` entries only if the style guide requires them. Add the Shanken factor and the time-series intercept $a_i$ to the notation tables of `docs/STYLE_GUIDE.md` §3 in this PR. Keep `npm test` (including the style-guide notation check) green.
3. Chapter 18, section "When the correction matters": after the sentence with the monthly Sharpe ratio of 0.196, or 0.68 a year, add one sentence that Chapter 16 gives 0.65 for the same three factors because it uses their sample means, while here the factor uses the second-pass premia. Say that for traded factors the factor equals $SR_f^2$ of Chapter 16. Any number you add is read from library output and covered by `tests/chapter18-numbers.test.ts`.
4. Chapter 18 Hook (lines 26–27): replace "on ff3-monthly and ff25-size-bm-monthly" with "on Kenneth French's monthly factors and 25 size–book-to-market portfolios". Dataset IDs stay in the widget caption.
5. `docs/CURRICULUM.md` Chapter 16 entry (Readings): change "Gibbons, Ross & Shanken (1987)" to 1989, and fix the same year in `docs/READINGS.md` if it appears there.

Out of scope: any other chapter, widget behaviour, library maths, and the optional `SMLPlot.tsx` import change.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 16-time-series-tests`, `17-cross-sectional` and `18-errors-in-variables` pass, and `npm run clickthrough` passes for the same three chapters.
- `grep -rn "ff3-monthly" src/content/chapters/18-errors-in-variables-and-shanken.mdx` prints nothing in prose (the widget caption may keep it).
- `grep -n "1987" docs/CURRICULUM.md docs/READINGS.md` shows no Gibbons, Ross & Shanken entry dated 1987.
- `git diff --name-only origin/main` lists only files named in this scope and this task's outcome file.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 16-time-series-tests
npm run screenshots -- 17-cross-sectional
npm run screenshots -- 18-errors-in-variables
npm run clickthrough -- 16-time-series-tests
npm run clickthrough -- 17-cross-sectional
npm run clickthrough -- 18-errors-in-variables
grep -n "1987" docs/CURRICULUM.md docs/READINGS.md
git diff --name-only origin/main
