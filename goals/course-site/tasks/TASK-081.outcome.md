# TASK-081 outcome: Part V notation, guide rows and Part VI bridge

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm test` under machine load timed out in slow simulation tests outside this task (first run: 4 files,
  e.g. `cay.test.ts`, `predictive.test.ts`, chapters 4, 11, 12, 14, "Test timed out in 15000ms/5000ms"; one
  earlier run 545 of 546, chapter 18 timeout, which passes alone). `npx vitest run --testTimeout=60000`:
  52 files, 546 tests passed. `npm run build`: astro check "Result (163 files)" with 0 errors and 0 warnings,
  24 pages built, exit 0.
- [x] Screenshots and clickthrough pass for `19-size-and-value`, `22-conditional` and `23-does-the-conditional`.
  Evidence: all six runs exit 0. Clickthrough: chapter 19 two widgets (5 and 2 actions at 1280px and 360px),
  chapter 22 two widgets (7 and 6 actions), chapter 23 two widgets (5 and 3 actions). Element crops of every
  changed paragraph (chapter 19 SMB/HML split, chapter 22 covariance derivation and moment-condition sentence,
  chapter 23 model section) were inspected in light and dark at 1280px and 375px: the new symbols render, no KaTeX
  error, no page overflow.
- [x] `grep -n "E}_{t-1}" src/content/chapters/23-does-the-conditional-capm-explain-anomalies.mdx` prints nothing.
  Evidence: empty output.
- [x] `git diff --name-only origin/main` lists only files in this scope and the outcome file.
  Evidence: `docs/STYLE_GUIDE.md`, `src/components/plots/AlphaBound.tsx`, `src/components/plots/RollingBeta.tsx`,
  chapters 19, 22 and 23, `tests/chapter23-numbers.test.ts`, and this file.

## Summary

**What.** Sign-off changes 1, 2, 3 and 7 of the TASK-078 read-through.

1. Chapter 23 uses Chapter 22's timing: $\mathbb{E}_t[R^e_{i,t+1}] = \beta_{it}\lambda_t$,
   $\lambda_t = \mathbb{E}_t[R^e_{m,t+1}]$, market subscript $m$ (so $\sigma^2_m$, $\varepsilon_{m,t+1}$), and no
   comma in $\beta_{it}$, $\beta_{iq}$, $\alpha_{iq}$. The sentence that redefined a subscript $t$ is gone. The
   daily short-window regression keeps $R^e_{i,t}$ with $t \in q$, because there $t$ is a day. The labels in
   `RollingBeta.tsx` and `AlphaBound.tsx` and the comment in `tests/chapter23-numbers.test.ts` follow.
2. Chapter 22: the covariance $c$ is now $\sigma_{\beta\lambda}$. The SDF intercept $a_t, a_0, a_1$ is now
   $\eta_t, \eta_0, \eta_1$ in prose, display maths and the quiz. Chapter 19: $a_{\text{S},t}$ and
   $c_{\text{H},t}$ are now $s_{\text{S},t}$ (size part) and $v_{\text{H},t}$ (B/M part, "v for value").
   The Chapter 22 widgets and test never used $c$ or $a$, so they did not change.
3. `docs/STYLE_GUIDE.md` §3 has a new table "Part V: factors, anomalies and conditional models" with rows for MKT
   (and $R_m$ vs $M$), SMB, HML, RMW, CMA, WML (Mom published, UMD in code), $s$/$v$ of Chapter 19, $I_{B,t-1}$,
   $z_t$ vs $x_t$, $\beta_{it}$ and $\beta_{iq}$, conditional $\lambda_t$, $\alpha^u$/$\beta^u$,
   $\sigma_{\beta\lambda}$ and $\eta$. The KaTeX macro check passes.
4. Chapter 22 ends "Managed portfolios" with one sentence: the two conditions are moment conditions, and
   Part VI (Chapter 24, *The generalized method of moments*, and Chapter 26, *GMM for asset pricing models*) shows
   how to estimate and test them. Chapter 23 "Next up" now says "testing moment conditions like these".

**Deviations.** The spec suggests $\delta$ for the SDF intercept. $\delta$ is already the time-discount factor
(Chapter 8), so I used $\eta$; the guide row says so and notes that Chapter 7 uses $\eta_1, \eta_2$ as Lagrange
multipliers in another context.

**Fixes found during verify.** The macro column of the $\alpha^u$ row first named `\alpha` in a note, which failed
the notation test; the note moved to the Meaning column. A rewrapped line in the Chapter 22 derivation started with
`- (`, which Markdown read as a nested bullet and broke the MDX build; the minus now ends the previous line.

**Verified revision.** The commit before this outcome, rebased on `origin/main` `55baf89` (which changed only
`goals/` files since the verify runs).

**Follow-ups.** In Chapter 22, $\sigma_m$ is the market shock's standard deviation; in Chapter 23, $\sigma^2_m$ is
the market's unconditional variance. Each chapter defines its own, but a later pass could align them. `src/lib`
comments (`conditional.ts`, `shortWindow.ts`) still use $a_0, a_1$ and $R^e_{Mt}$; library code was out of scope.
