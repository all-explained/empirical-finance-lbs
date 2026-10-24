---
id: TASK-081
title: Part V notation, guide rows and Part VI bridge
milestone: M-7
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-7 and M-7. The Part V read-through (`goals/course-site/tasks/TASK-078.outcome.md`, Sign-off changes 1, 2, 3 and 7) found symbol clashes and a thin link to Part VI. Fix them before later Parts copy the pattern. Read the full wording in that outcome on branch `goal/course-site/task-078`.

## Scope

1. Chapter 23 (`src/content/chapters/23-does-the-conditional-capm-explain-anomalies.mdx`): use Chapter 22's timing, $\mathbb{E}_t[R^e_{i,t+1}] = \beta_{it}\lambda_t$, with $R^e_m$ and no comma in $\beta_{it}$. Delete the sentence that redefines a subscript $t$. Update the labels in `RollingBeta.tsx` and `AlphaBound.tsx` and `tests/chapter23-numbers.test.ts` text to match.
2. Chapter 22 (`22-conditional-factor-models.mdx`): rename the covariance $c$ (for example $\sigma_{\beta\lambda}$) and the SDF intercept $a_t, a_0, a_1$ (for example $\delta_t, \delta_0, \delta_1$) in prose, maths, quizzes, recap, widget labels and test text. Chapter 19 (`19-size-and-value.mdx`): rename $a_{\text{S},t}$ and $c_{\text{H},t}$ (for example $s_t$, $v_t$).
3. `docs/STYLE_GUIDE.md` §3: add rows for SMB, HML, RMW, CMA, MKT, WML (published as Mom, rebuilt as UMD in code), $I_{B,t-1}$, $z_t$ (how it differs from $x_t$), $\beta_{it}$, $\lambda_t$ (conditional), $\alpha^u$ and the symbols chosen in item 2. Keep the KaTeX macro check green.
4. Chapter 22, end of "Managed portfolios": add one sentence that the conditions $\mathbb{E}[M_{t+1}R^e_{i,t+1}] = 0$ and $\mathbb{E}[M_{t+1}z_tR^e_{i,t+1}] = 0$ are moment conditions that Part VI (Chapters 24 and 26) shows how to estimate and test. Chapter 23 "Next up": change "testing models like this one" to "testing moment conditions like these".

Out of scope: Chapter 20, `FactorBuilder.tsx`, the data hooks, widget behaviour and library maths. Another task edits Chapter 19 line 63 and Chapter 20: do not touch them.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings. If a slow test times out under load, rerun with `npx vitest run --testTimeout=60000` and report both.
- Screenshots and clickthrough pass for `19-size-and-value`, `22-conditional` and `23-does-the-conditional`.
- `grep -n "E}_{t-1}" src/content/chapters/23-does-the-conditional-capm-explain-anomalies.mdx` prints nothing.
- `git diff --name-only origin/main` lists only files in this scope and the outcome file.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 19-size-and-value
npm run screenshots -- 22-conditional
npm run screenshots -- 23-does-the-conditional
npm run clickthrough -- 19-size-and-value
npm run clickthrough -- 22-conditional
npm run clickthrough -- 23-does-the-conditional
git diff --name-only origin/main
