---
id: TASK-083
title: Share one series-loading hook across chapter widgets
milestone: M-7
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-7 and M-7. Part V read-through (`TASK-078.outcome.md`, Sign-off change 8; read it on branch `goal/course-site/task-078`) found the same loading hook written six times in `src/components/plots/`.

## Scope

Move `useSeriesData` (now in `factorModelSample.ts`) into one small module. Have `useCapmData` (`capmSample.ts`), `useModelData` (`sizeValueSample.ts`), `useShortWindowData` (`shortWindowSample.ts`) and `useConditionalData` (`conditionalSample.ts`) call it with a module-level id array. Keep `useZooData` (`zooSample.ts`) as a thin wrapper that adds `loadOsapSignals()`. Let `factorTestSample.ts` and `factorModelSample.ts` share it. Keep each hook's return type, so no widget changes. Change no behaviour and no maths. No chapter prose changes.

Out of scope: chapters, widget behaviour, library maths, notation.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings. Slow tests that time out: rerun with `npx vitest run --testTimeout=60000` and report both.
- Screenshots and clickthrough pass for chapters `16` to `23` (use the file name filters `16-time-series-tests`, `17-cross-sectional`, `18-errors-in-variables`, `19-size-and-value`, `20-momentum`, `21-anomalies`, `22-conditional`, `23-does-the-conditional`).
- `grep -rn "useEffect" src/components/plots/*Sample.ts` shows one loading hook, not six.
- `git diff --name-only origin/main` lists only `src/components/plots/` files and the outcome file.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 16-time-series-tests
npm run screenshots -- 19-size-and-value
npm run screenshots -- 21-anomalies
npm run screenshots -- 23-does-the-conditional
npm run clickthrough -- 16-time-series-tests
npm run clickthrough -- 17-cross-sectional
npm run clickthrough -- 18-errors-in-variables
npm run clickthrough -- 19-size-and-value
npm run clickthrough -- 20-momentum
npm run clickthrough -- 21-anomalies
npm run clickthrough -- 22-conditional
npm run clickthrough -- 23-does-the-conditional
grep -rn "useEffect" src/components/plots/*Sample.ts
git diff --name-only origin/main
