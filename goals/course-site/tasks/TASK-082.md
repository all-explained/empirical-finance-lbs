---
id: TASK-082
title: Part V Mom naming, t-statistics, caption and attribution
milestone: M-7
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-7 and M-7. Part V read-through (`TASK-078.outcome.md`, Sign-off changes 4, 5 and 6; read it on branch `goal/course-site/task-078`) found three naming faults, a wrong caption and a false attribution.

## Scope

1. `src/content/chapters/20-momentum.mdx` and `src/components/plots/FactorBuilder.tsx`: use "Mom" for the published series and "WML" for the formula. Drop "UMD" from the on-screen label. Write every $t$-statistic in math ($t = 1.18$, $t = -6.84$, $t = 7.77$, near lines 173–176 and 253).
2. `FactorBuilder.tsx` caption (near line 142): replace "then into thirds on …" with "then at the 30th and 70th NYSE percentiles of …", for both kinds.
3. `src/content/chapters/19-size-and-value.mdx` line 63: say Chapter 7 gave this for the market portfolio and that Chapter 16 (link `/empirical-finance-lbs/chapters/16-time-series-tests-and-grs/`) extends it to several factors.

Out of scope: notation renames in Chapters 19, 22 and 23 (another task), the data hooks, widget behaviour and library maths.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings. Slow tests that time out: rerun with `npx vitest run --testTimeout=60000` and report both.
- Screenshots and clickthrough pass for `19-size-and-value` and `20-momentum`.
- `grep -n "UMD" src/components/plots/FactorBuilder.tsx src/content/chapters/20-momentum.mdx` shows UMD only where the chapter explains the code name, never in an on-screen label.
- `git diff --name-only origin/main` lists only files in this scope and the outcome file.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 19-size-and-value
npm run screenshots -- 20-momentum
npm run clickthrough -- 19-size-and-value
npm run clickthrough -- 20-momentum
grep -n "UMD" src/components/plots/FactorBuilder.tsx src/content/chapters/20-momentum.mdx
git diff --name-only origin/main
