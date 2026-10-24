# TASK-083 outcome: Share one series-loading hook across chapter widgets

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence (after the rebase on `origin/main` d8eb74f): `npm ci` exit 0. `npm test` under machine load: 2 to 3
  timeouts at 5000 ms in files this task does not touch (`tests/chapter11-numbers.test.ts` tail shares,
  `tests/chapter14-numbers.test.ts` playground, `src/lib/finance/cay.test.ts` real-time window); 544 of 546 passed.
  `npx vitest run --testTimeout=60000`: 52 files, 546 tests passed. `npm run build`: astro check "Result (164 files)"
  with 0 errors and 0 warnings, 24 pages built, exit 0.
- [x] Screenshots and clickthrough pass for chapters 16 to 23.
  Evidence: `npm run screenshots -- <filter>` and `npm run clickthrough -- <filter>` exit 0 for all eight filters
  (`16-time-series-tests`, `17-cross-sectional`, `18-errors-in-variables`, `19-size-and-value`, `20-momentum`,
  `21-anomalies`, `22-conditional`, `23-does-the-conditional`). Clickthrough drove every widget at 1280px and 360px,
  for example chapter 17 "Does the model fit average returns?" (29 actions), chapter 19 grid (5 actions), chapter 21
  spanning test (9 actions), chapter 23 rolling betas (5 actions). Full-page captures of chapters 19 (light, desktop)
  and 21 (dark, desktop) were inspected: the data widgets show loaded data, not a loading or error message.
- [x] `grep -rn "useEffect" src/components/plots/*Sample.ts` shows one loading hook, not six.
  Evidence: the six Part V hooks (`useCapmData`, `useModelData`, `useShortWindowData`, `useConditionalData`,
  `useZooData`, `useSeriesData`) have no `useEffect` left; the only Part V hit is `seriesSample.ts:8`, in `useLoaded`.
  The grep still lists Parts II–IV sample files (`caySample`, `hacSample`, `oosSample`, `pcaSample`,
  `persistenceSample`, `predictiveSample`, `presentValueSample`, `regressionSample`, `stambaughSample`). They are
  outside this task's scope, which names only the six Part V hooks.
- [x] `git diff --name-only origin/main` lists only `src/components/plots/` files and the outcome file.
  Evidence: `capmSample.ts`, `conditionalSample.ts`, `factorModelSample.ts`, `seriesSample.ts` (new),
  `shortWindowSample.ts`, `sizeValueSample.ts`, `zooSample.ts`, and this file.

## Summary

**What.** A new module `src/components/plots/seriesSample.ts` holds the one loading effect:

- `useLoaded(load)` runs a module-level loader once and returns `{ data, failed }`.
- `useSeriesData(ids)` (moved from `factorModelSample.ts`, which re-exports it) loads an id array through `useLoaded`.

`useCapmData`, `useModelData`, `useShortWindowData`, `useConditionalData` and `useZooData` now call `useLoaded`
with a module-level loader. `factorTestSample.ts` already re-exported `useCapmData` as `useFactorData`, so it shares
the hook with no change. Every hook keeps its return type, so no widget changed.

**Deviation.** The spec suggests calling `useSeriesData` with an id array from each hook. That hook keys its result
by series id (`'ff3-monthly'`), but these hooks return short keys (`ff3`, `ff25`, `cay`). Keeping the return types
would need a renaming step in each hook. A module-level loader passed to `useLoaded` keeps the types with less code,
and `useSeriesData` itself is built on `useLoaded`. `useZooData` is a one-line call like the others; its loader adds
`loadOsapSignals()`.

`useModelData` used to call `useFactorData` and load `ff5-monthly` in a second effect. It now loads the three series
in one `Promise.all`. The data and the failure flag are the same; `loadSeries` fetches each file as before.

**Verified revision.** 4a6f8ad on top of `origin/main` d8eb74f. Rebased to a4cf642 on `origin/main` 55baf89;
`git diff 4a6f8ad a4cf642 -- . ':!goals'` is empty, so the verified code is unchanged.

**Proposed follow-up.** Move the nine Parts II–IV sample hooks listed above onto `useLoaded` where they fit (some
depend on arguments or defer heavy work with a timer, so not all are a one-line change).
