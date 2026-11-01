---
id: TASK-121
title: 'Part VII fixes: chapter 28 notation, style guide rows and prose'
milestone: M-9
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-7 and M-9. The orchestrator's read-through of chapters 28 to 30 (TASK-109) listed changes that must land before later Parts copy the Part VII pattern. TASK-109 stays open until they are merged.

## Scope

1. Notation. In `src/content/chapters/28-skeptical-look-at-asset-pricing-tests.mdx` (uses at lines 83-85, 88, 179 and 262) rename the matrix `Q` to `G`, because `Q` is the PCA eigenvector matrix in `docs/STYLE_GUIDE.md` §3 (line 218). Write the ones vector as `\mathbf{1}` instead of `\iota` (lines 114-136), and keep the `\iota` row in §3 only if another chapter still uses it. Make the same renames in `src/components/plots/RandomFactorFit.tsx` labels and in `tests/chapter28-numbers.test.ts` text. Before you choose `G`, run `git grep -n "\bG\b" src/content/chapters` and confirm it clashes with nothing; pick another free letter if it does.
2. Style guide. Add to `docs/STYLE_GUIDE.md` §3, in the Part VII block, rows for the symbols chapters 28 and 29 use and the table lacks: the several meanings of `s`, `B`, `f^P`, `B_P`, `\lambda_P`, `\vartheta` and the indicator `\mathbf{1}\{\cdot\}`. Read the two chapters for the exact meaning of each, and add no symbol they do not use. Keep the KaTeX macro check green.
3. Prose. At line 179 of the chapter 28 file, replace "From step 2 above" with a reference that is correct where it stands. At line 52, add one sentence that links the weak-factor problem to Chapter 27, using the link style of chapters 13 to 15.

Out of scope: every other chapter, widget behaviour and library maths.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots` and `npm run clickthrough` pass for `28-skeptical-look-at-asset-pricing-tests`.
- `git grep -n "\\\\iota" src/content/chapters/28-skeptical-look-at-asset-pricing-tests.mdx` prints nothing.
- `git diff --name-only origin/main` lists only the chapter 28 file, `RandomFactorFit.tsx`, `tests/chapter28-numbers.test.ts`, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 28-skeptical-look-at-asset-pricing-tests
npm run clickthrough -- 28-skeptical-look-at-asset-pricing-tests
git diff --name-only origin/main
