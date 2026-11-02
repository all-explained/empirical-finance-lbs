# TASK-125 outcome

## Acceptance

- [x] `factors` defaults to 2 and existing tests pass unchanged.
  The option is destructured as `factors: K = 2` and forwarded to `threePass`.
  All 15 original tests passed before editing and remain unchanged. All 21 tests in
  `threePass.test.ts` pass after the change. The new default test compares omitted
  `factors` and explicit `factors: 2` against the full seed-5 output recorded before editing.
- [x] The new tests pass and state their reference values.
  Six added cases pass. The seed-5 test pins every output field. The one-PC case uses
  strength 0.4, correlation 0.5 and λ_2 = 0.005: approximate monthly bias 0.001,
  with a ±0.0005 band that excludes zero. The three-, four-, five- and six-PC cases
  target premium 0.005 and zero mean bias within ±0.0007. Each long case has an
  explicit 60-second timeout. Before implementation, the one-PC test failed because
  the fixed two-PC estimator's bias was outside its band; all six cases now pass.
- [x] `git status --short` contains no changes outside the two library files and this outcome.
  The implementation commit changes only `src/lib/finance/threePass.ts` and
  `src/lib/finance/threePass.test.ts`. This outcome is the only added file.
  The final commit leaves a clean worktree; the PR contains exactly these three files.

## Summary

Added optional `factors` to `simulateOmittedFactor`, retaining the default of two PCs.
Updated the simulation and result comments. The seeded economy, default results,
callers, chapters and widgets are unchanged. Component-count validation remains in
the existing PCA path. No dependencies or configuration changed.

Verified source revision: `80a3f6a47ad4211df8b82f096f3f53b1007bfad7`.
An independent review found no issues and separately passed the six added tests.
The branch was rebased onto `origin/main` before editing, without conflicts.
No deviations or proposed follow-ups.

Local Verify on 2026-11-02, with every command exiting 0:

```text
npm ci
added 439 packages, and audited 440 packages in 3s

npm test
 Test Files  73 passed (73)
      Tests  773 passed (773)
   Duration  46.77s (tests 89%, import 8%, transform 3%)

npm run build
Result (216 files):
- 0 errors
- 0 warnings
- 1 hint
[build] 34 page(s) built in 7.06s
[build] Complete!

git status --short
(no output after committing)
```

GitHub Actions were not inspected. Browser checks were not needed for this library-only change.
