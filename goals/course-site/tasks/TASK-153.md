---
id: TASK-153
title: 'Part X fix: HabitSimulator slider label'
milestone: M-12
state: cancelled
depends_on: [TASK-139, TASK-140, TASK-141, TASK-152]
delivery: pr
route: {platform: claude, model: opus, effort: high}
reason: 'Duplicate of TASK-151 (PR #141), which already carries the slider label, wording, links and Part XI bridge fixes; TASK-152 merged the numbers fix'
---

## Why

TASK-142 found the HabitSimulator slider label 'Curvature γ' ambiguous next to the habit parameters. SC-7, M-12.

## Scope

Rename the slider 'Curvature γ' to 'Utility curvature γ' in `src/components/plots/HabitSimulator.tsx` (near line 126). Update the chapter 37 prompt that names the slider, and any clickthrough step that finds it by label. Out of scope: other widget changes.

## Acceptance

- The slider reads 'Utility curvature γ' and the chapter 37 prompt uses the same words.
- `git grep 'Curvature γ'` finds no stale label.
- Tests, build, screenshots and the chapter 37 clickthrough pass.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 37-internal-and-external-habits
npm run clickthrough -- 37-internal-and-external-habits
git grep -n 'Curvature γ' || echo none

## Attempts

- 2026-11-20: PR #146 closed; cancelled: Duplicate of TASK-151 (PR #141), which already carries the slider label, wording, links and Part XI bridge fixes; TASK-152 merged the numbers fix
