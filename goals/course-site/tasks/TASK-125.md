---
id: TASK-125
title: 'Library: factors option for simulateOmittedFactor'
milestone: M-10
state: approved
depends_on: []
delivery: pr
route: {platform: codex, model: gpt-6.1-sol, effort: high}
---

## Why

SC-7 and M-10 (DEC-003). The chapter 34 widget needs a slider for the number of PCs in the seeded economy. `simulateOmittedFactor` fixes it at 2. With the option, the widget can show that too few PCs leave a bias and that extra PCs do no harm.

## Scope

In `src/lib/finance/threePass.ts`, add an option `factors` (default 2) to `simulateOmittedFactor`. Pass it to `threePass` instead of the fixed 2. Update the doc comment. Add tests to `src/lib/finance/threePass.test.ts`. Out of scope: chapters, widgets, other files, and any change to the default output (the existing pinned values must stay unchanged).

Tests, each stated in the test: with the default, the output equals the old output for the same seed; with `factors: 1` and `correlation` not 0, the three-pass estimate stays biased by about `strength · correlation · λ_2` (state the bias and the band); with `factors` 3 to 6 the three-pass estimate stays unbiased (state the band). Give long tests an explicit timeout (issue #67).

## Acceptance

- `factors` defaults to 2 and existing tests pass unchanged.
- The new tests pass and state their reference values.
- `git status --short` shows only `src/lib/finance/threePass.ts`, its test and this task's outcome file.

## Verify

npm ci
npm test
npm run build
git status --short
