# TASK-079 outcome: Part IV fixes from the read-through

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm test`: 46 files, 511 tests passed, exit 0. `npm run build`: astro check
  "Result (140 files): - 0 errors - 0 warnings", 18 pages built, exit 0.
- [x] `npm run screenshots -- 16-time-series-tests`, `17-cross-sectional` and `18-errors-in-variables` pass,
  and `npm run clickthrough` passes for the same three chapters.
  Evidence: all six runs exit 0. Clickthrough: chapter 16 two widgets (6 actions at 1280px and 360px each),
  chapter 17 two widgets (8 and 29 actions), chapter 18 `ShankenCorrection` (7 actions). Element captures of
  the changed paragraphs and both chapter 18 readouts were inspected in dark (1280px) and light (360px):
  KaTeX renders $\zeta$, $SR^2_f$ and $\hat\lambda$ cleanly, no overflow.
- [x] `grep -rn "ff3-monthly" src/content/chapters/18-errors-in-variables-and-shanken.mdx` prints nothing.
  Evidence: empty output. The Hook and the Intuition "Try this" both now say "Kenneth French's monthly …".
  The widget caption in `ShankenCorrection.tsx` keeps the dataset IDs.
- [x] `grep -n "1987" docs/CURRICULUM.md docs/READINGS.md` shows no Gibbons, Ross & Shanken entry dated 1987.
  Evidence: no hit in `docs/CURRICULUM.md`. `docs/READINGS.md` hits only the citation key
  `GibbonsRossShanken1987`; its entry is already dated 1989 and line 143 notes the outline's wrong year.
- [x] `git diff --name-only origin/main` lists only files named in this scope and this outcome file.
  Evidence: `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md`, `src/components/plots/ShankenCorrection.tsx`,
  the three chapter MDX files, `tests/chapter18-numbers.test.ts`, and this file.

## Summary

**What.** The five read-through fixes from the TASK-066 sign-off:

1. Chapters 16 (Hook) and 17 (where FF3 is introduced): one sentence defining SMB and HML and pointing to
   Chapter 19.
2. The Shanken factor is renamed from $c$ to $\zeta$ in Chapter 18 (prose, display maths, quizzes, recap) and
   in both `ShankenCorrection` readout labels. `docs/STYLE_GUIDE.md` §3 gains rows for $a_i$ (first-pass
   intercept) and $\zeta$. No KaTeX macro is needed: neither symbol has one in the table.
3. Chapter 18 "When the correction matters": a sentence that Chapter 16 gives 0.65 a year for the same three
   factors (sample means), while $\zeta$ uses the second-pass premia, and that for traded factors $\zeta$ is
   Chapter 16's $SR^2_f$. The 0.65 is pinned in `tests/chapter18-numbers.test.ts` from `factorTest(…, 'ff3',
   '1963-07-01').grs.sharpeFactors2`, the same code path Chapter 16 uses.
4. Chapter 18 Hook: dataset IDs replaced by "Kenneth French's monthly data". The same ID in the Intuition
   "Try this" was replaced too, so the acceptance grep is empty.
5. `docs/CURRICULUM.md` Chapter 16 readings: Gibbons, Ross & Shanken dated 1989.

**Deviations / choices.**

- The spec suggested $\kappa$ for the Shanken factor. $\kappa$ is already the Campbell–Shiller constant in the
  style guide, so this PR uses $\zeta$, which is unused elsewhere. The style-guide row says so.
- Hook wording is "the 25 size–book-to-market portfolios, on Kenneth French's monthly data", which avoids
  saying "25 size–book-to-market portfolios" twice in one sentence.
- The library field `c` in `shankenCorrection` keeps its name; library maths is out of scope.
- `READINGS.md` was not changed: its entry is already 1989, and renaming the citation key could break links.

**Verified revision.** Task commits rebased on `origin/main` `100d099`; every Verify command above was re-run on that revision.

**Proposed follow-ups.** None.
