# TASK-151 outcome: Part X sign-off fixes

## Acceptance

Verified revision: `fa3e945` (the chapter commit), rebased onto `origin/main` `bec5525`, after TASK-152 (#143)
merged. The rebase had one conflict, the Chapter 39 Hook sentence that both tasks rewrote; it keeps TASK-152's
version, which `tests/chapter39-numbers.test.ts` pins. The outcome commit adds only this file.

- [x] The four changes are made as stated.
  Evidence, against the `## Sign-off` of the TASK-142 outcome (PR #136):
  1. Numbers. Both sentences are fixed on `main` by earlier tasks, so this branch leaves them as they are. Chapter
     39's Hook (TASK-152) says power utility "reaches the market's Sharpe ratio of 0.45 only at a risk aversion
     $\gamma = 20.0$", the same figure as Chapter 37's Hook. Chapter 37's $\delta$ sentence (TASK-150, then
     TASK-152) says "$\delta = 1.245$ even at $\gamma = 15.0$, the lower bound $SR/\sigma_c$ in Chapter 35's table"
     (lines 280–281).
  2. Widget label. The first `HabitSimulator` slider is "Utility curvature $\gamma$"; the readout stays "Local
     curvature $\gamma/S_t$". No test or script named the old label: `git grep` for "Curvature $\gamma$" outside
     `goals/` prints nothing.
  3. Wording. Chapter 37 now gives the slopes the widget shows, −0.16, −0.30, −0.41, −0.59 and −0.73, against
     −0.20 to −0.94 in the paper's Table 5, "which prints ten times each slope". `tests/chapter37-numbers.test.ts`
     pins the five slopes at two decimals. Chapter 39's Table 1 sentence is now three sentences, with the test
     stated as "A test of $\gamma = 10$ gives 4.31 ($p$-value 0.038)"; the numbers are unchanged and the long
     source lines are wrapped.
  4. Links and bridge. Chapter 37's Next up links Chapter 38; Chapter 38's callout links Chapter 37 and its Next up
     links Chapter 39; Chapter 39's Hook links Chapters 37 and 38. Each link has the chapter number and the italic
     title. Chapter 36's Next up was skipped: TASK-150 already links Chapters 37–39 there. Chapter 39's "Recap &
     next up" adds "Part X in three lines" (habits, long-run risk, disasters: what the premium needs and what the
     data say) and a Next up that leads to Part XI, Chapter 40 *Yields, forwards and bond returns* (the facts of
     bond prices), and Part XII (the models). Chapter 40 is plain text: it is not on `main` (`git ls-tree
     origin/main src/content/chapters/` ends at Chapter 39) and TASK-146 has no merged PR.
- [x] The slider label and the Chapter 37 prompt agree, and clickthrough for Chapter 37 passes.
  Evidence: the slider reads "Utility curvature $\gamma$" and the "Try this" prompt says "raise the utility
  curvature $\gamma$ to 4", the words of the quiz answer at line 314. `npm run clickthrough --
  37-internal-and-external-habits` exits 0 and lists `slider "Utility curvature γ"`, 10 actions at 1280px and at
  360px; the predictive-regression widget passes with 9 actions at each width.
- [x] Every number in the new bridge is true of the merged site.
  Evidence: each number is already printed, and pinned by tests, in the chapter it summarises.
  - Habits: $\gamma/\bar S = 35.1$ is Chapter 37, line 109. "Prices forecast returns, but more weakly than the
    model": the data's one-year slope is −0.042 ($t = -0.94$, $R^2$ 1.2%) against the model's −0.233 ($t = -3.35$,
    $R^2$ 10.2%), Chapter 37's Playground.
  - Long-run risk: BKY's 6.42% is Chapter 38, lines 227 and 321; "rejects a visible part but cannot reject a faint
    one" is its Recap bullet on BY and BKY.
  - Disasters: 2.72% with $b_D = 0.4$ to earn 6.28% is Chapter 39, lines 185–186; $\gamma = 42.8$ is line 287 and
    the Recap.
  - Part XI and Part XII: `docs/CURRICULUM.md` names Part XI "The term structure: facts", opening with Chapter 40
    *Yields, forwards and bond returns*, and Part XII "Term structure models".
- [x] Build passes.
  Evidence, after the rebase: `npm ci` exit 0. `npm run build` exit 0, `Result (252 files): 0 errors, 0 warnings, 1
  hint` (the known #88), 40 pages built. `npm test` exit 0: 87 files, 1003 tests passed. `npm run screenshots` exits 0 for chapters 37, 38, 39 and 36, four `✓` images each, with no console, KaTeX or
  overflow error. `npm run clickthrough` exits 0 for the same four chapters (37: 10 and 9 actions; 38: 9; 39: 10
  and 5; 36: 4 and 6, at both 1280px and 360px). Every new link points to a page in `dist/chapters/`.

## Summary

What: the four Part X sign-off changes of TASK-142, adjusted for TASK-150 and TASK-152, which merged first.

How: edits to Chapters 37, 38 and 39, one label in `HabitSimulator.tsx`, and one test line pair in
`tests/chapter37-numbers.test.ts` that now checks the slopes the prose prints. I read the changed regions as built
pages in both themes at 1280px and 360px with a Playwright probe kept out of the repo: the Chapter 37 "Try this" box
and slider panel, and Chapter 39's Table 1 paragraph, bridge list and Next up. Each wraps cleanly with no overflow.

Deviations: none beyond the items the spec says to skip when an earlier task had done them: the two sentences of
change 1 and Chapter 36's Next up.

Proposed follow-ups: when Chapter 40 is on the site, link it in Chapter 39's Next up.
