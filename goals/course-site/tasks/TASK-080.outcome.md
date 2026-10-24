# TASK-080 outcome: Part III fixes from the read-through

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence (after the rebase on `origin/main`): `npm ci` exit 0. The first `npm test` run under machine load had
  3 timeouts at 5000 ms (chapter 11 tail shares, chapter 14 playground, `cay.test.ts` real-time window) and
  538 of 541 passed. `npx vitest run --testTimeout=60000`: 51 files, 541 tests passed, exit 0. A second
  `npm test`: 51 files, 541 tests passed, exit 0. `npm run build`: astro check "Result (160 files)" with 0 errors
  and 0 warnings, 23 pages built, exit 0.
- [x] `npm run screenshots` and `npm run clickthrough` pass for `13-out-of-sample`, `14-consumption`,
  `15-expected-returns` and `09-time-varying`.
  Evidence: all eight runs exit 0 (the first chapter 14 clickthrough stopped with "preview server did not
  start" before any widget ran; the rerun passed). Clickthrough: chapter 13 one widget (21 actions at 1280px and 360px),
  chapter 14 three widgets (4, 9 and 3 actions; the slider is now "Weight θ"), chapter 15 one widget
  (6 actions), chapter 9 two widgets (9 and 5 actions). Element captures of every changed paragraph and of
  both chapter 14 widgets were inspected in dark (1280px) and light (360px): $n_t$, $\hat\theta_n$,
  $\hat\theta_y$, $y_t - \theta\,x_t$, $A$ and $B$ render cleanly, with no overflow.
- [x] `grep -n "goyal-welch-annual" src/content/chapters/13-out-of-sample-predictability.mdx` prints nothing.
  Evidence: empty output. The Hook and the Recap now say "Goyal and Welch's annual data (1926 to 2025)".
- [x] `grep -rn "Welch and Goyal" src/content/chapters` prints nothing.
  Evidence: empty output (exit 1).
- [x] `git diff --name-only origin/main` lists only files named in this scope and this outcome file.
  Evidence: `docs/STYLE_GUIDE.md`, `src/components/plots/CayLookAhead.tsx`,
  `src/components/plots/CointegrationDemo.tsx`, chapters 09, 13, 14 and 15, `tests/chapter14-numbers.test.ts`,
  and this file.

## Summary

**What.** The seven read-through fixes for chapters 13–15:

1. Chapter 14 Hook: "from 1952 to 2025" is now "from 1952-Q1 to 2026-Q2", the span of the full-sample
   weights. The hook test in `tests/chapter14-numbers.test.ts` now also pins those dates.
2. Chapter 13 Hook and Recap: "goyal-welch-annual" is now "Goyal and Welch's annual data (1926 to 2025)".
   The years are the rows the chapter uses (CRSP returns), as the existing chapter 13 test checks. The JSON
   file itself starts in 1871, but the race has no returns before 1926.
3. Chapter 14 symbols. Log asset wealth $a_t$ is now $n_t$ (the households' net worth); the chapter says in
   words that the paper writes $a_t$ and that the name $cay$ keeps the paper's letters. The cointegrating
   weights $\beta_a, \beta_y$ are now $\theta_n, \theta_y$, and the subscripts follow ($r_{n,t}$, $d_{n,j}$,
   $\Delta n_{t+j}$). The chapter now says that $w_t = \log W_t$ is log total wealth, not a portfolio weight.
   The cointegration demo's weight $w$ is now $\theta$, so the chapter uses $w$ only for log wealth. Widget
   labels changed in `CointegrationDemo.tsx` (slider, legend, readout, caption) and `CayLookAhead.tsx`
   (readout, caption). No variable, prop or behaviour changed.
4. `docs/STYLE_GUIDE.md` §3 has a new "Part III" table with every listed symbol, plus $n_t$,
   $\theta_n, \theta_y; \theta$ and the reuse of $w_t$. It notes that $K$ is a strike in chapter 15, that the
   Prob colour token colours $\pi^*$, that $\tau$ is a date in chapter 13, and that Part VI reuses $\theta$.
   The KaTeX macro check stays green (only `\Signal` and `\Prob` are named).
5. Chapter 15 Step 3: the covariance pair is now $A = M(1 + R)$ and $B = 1 + R$.
6. Naming: chapter 9 "Welch and Goyal (2008)" is now "Goyal & Welch (2008)", and chapter 14 uses
   "Stock & Watson (1993)" and "Campbell & Mankiw (1989)", in the prose and in Further reading.
7. Links: "Chapter 14" in the chapter 13 Next up, "Chapter 9" in the chapter 15 Hook and "Chapter 16" in the
   chapter 15 Next up.

**Deviations.**
- Chapter 9 had a second "Welch and Goyal" in the prose (line 206), not only line 261. Both are changed,
  because the acceptance grep covers the whole chapter.
- The spec suggested $\theta_a, \theta_y$. Because log asset wealth is renamed to $n_t$, the weights are
  $\theta_n, \theta_y$, so each subscript names its own series.
- $A$ and $B$ in chapter 15 are local names inside one step and are not added to the style guide, because
  item 4 says to leave other symbols alone.

**Verified revision.** The commit that adds this file on `goal/course-site/task-080`.

**Proposed follow-ups.** None.
