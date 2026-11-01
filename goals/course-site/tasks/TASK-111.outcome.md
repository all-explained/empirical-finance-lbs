# TASK-111 outcome: Part VI widget cleanup: drop identification data aliases (chapter 27)

## Acceptance

- [x] `git grep -n "useIdentificationData\|IdentificationData"` prints nothing.
  Evidence: `git grep -n "useIdentificationData\|IdentificationData" -- ':!goals/'` prints nothing and exits 1
  on `f25e502`. No code, test or doc outside `goals/` names the aliases. The unscoped command still hits two
  goal records that a worker may not edit: this task's spec (`TASK-111.md`, which quotes the pattern) and
  `TASK-099.outcome.md` line 30 (a past record of how the widgets loaded their data). This outcome file also
  quotes the pattern. The spec contains its own pattern, so the unscoped form cannot print nothing.
- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: on `f25e502`, `npm test`: 63 files, 675 tests passed. `npm run build`:
  `Result (191 files): - 0 errors - 0 warnings - 1 hint`, `28 page(s) built`, `[build] Complete!`. The hint is
  the unused `Matrix` import in `src/lib/finance/news.ts`, already reported as #88.
- [x] `npm run screenshots` and `npm run clickthrough` pass for `27-weak-and-useless-factors`.
  Evidence: screenshots `✓` for dark and light at desktop and phone sizes. Clickthrough `✓` for both widgets,
  6 actions at 1280px and 6 at 360px each, including the `Consumption` option of `ConfidenceSet`, which loads
  the real data through `useConditionalData`. Inspected by eye: `UselessFactor` reads 28.0% (Fama–MacBeth),
  Shanken 7.5% and CAPM R² 0.078 in dark desktop and light phone. `ConfidenceSet` draws its 12 sets with
  coverage 90.2%, 93.2% and 94.7%. These match the chapter text.
- [x] `git diff --name-only origin/main` lists only files named in this scope and this task's outcome file.
  Evidence: after a rebase on `origin/main` `509edf6`, it lists `src/components/plots/ConfidenceSet.tsx`,
  `src/components/plots/UselessFactor.tsx`, `src/components/plots/identificationSample.ts`,
  `tests/chapter27-numbers.test.ts`, and this file once committed.

The full Verify chain (`npm ci && npm test && npm run build && npm run screenshots -- 27-weak-and-useless-factors
&& npm run clickthrough -- 27-weak-and-useless-factors`) exited 0 on `f25e502`.

## Summary

**What.** Deleted the two alias lines from `identificationSample.ts`. `ConfidenceSet.tsx` and `UselessFactor.tsx`
import `useConditionalData` from `./conditionalSample`. `monthlySample` and `consumptionSets` take
`ConditionalData`, which `identificationSample.ts` already imported. `tests/chapter27-numbers.test.ts` types its
data fixture as `ConditionalData`. All other exports of `identificationSample.ts` stay.

**How.** A pure rename at the call sites. No widget behaviour and no library maths changed; the chapter 27 number
test passes unchanged.

**Deviations.** The scope does not name `tests/chapter27-numbers.test.ts`, but it asks to update every grep hit in
code, tests and docs, and the test was one. The grep check is scoped to exclude `goals/` (see Acceptance).

**Verified revision.** `f25e502`, rebased on `origin/main` `509edf6`.

**Proposed follow-ups.** None.
