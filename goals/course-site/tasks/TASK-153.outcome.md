# TASK-153 outcome: Part X fix: HabitSimulator slider label

## Acceptance

Verified revision: `c10811a` (the label commit, rebased onto `origin/main` `2521275`; main's new commits touch only
`goals/course-site/decisions.jsonl`). The outcome commit adds only this file.

- [x] The slider reads 'Utility curvature γ' and the chapter 37 prompt uses the same words.
  Evidence: `src/components/plots/HabitSimulator.tsx` now has `label="Utility curvature $\gamma$"`. The chapter 37
  "Try this" prompt now says "Then raise the utility curvature $\gamma$ to 4". The clickthrough reports
  `slider "Utility curvature γ"`. Crops of the light desktop and dark phone screenshots show the label on one line
  next to its value 2.0, and the prompt below the widget.
- [x] `git grep 'Curvature γ'` finds no stale label.
  Evidence: `git grep -n 'Curvature γ'` finds no source, chapter or script file. Its only hits are records that
  this task may not edit: `goals/course-site/tasks/TASK-153.md` (this spec) and line 21 of
  `goals/course-site/tasks/TASK-139.outcome.md` (an old clickthrough log).
- [x] Tests, build, screenshots and the chapter 37 clickthrough pass.
  Evidence: the Verify chain exited 0. `npm ci` passed. `npm test`: `Test Files 86 passed (86)`,
  `Tests 964 passed (964)`. `npm run build`: `0 errors`, `0 warnings`, `40 page(s) built`.
  `npm run screenshots -- 37-internal-and-external-habits`: four `✓` images. `npm run clickthrough --
  37-internal-and-external-habits`: both widgets pass, at 10 and 9 actions, each at 1280px and 360px.

## Summary

What: the HabitSimulator slider "Curvature γ" is now "Utility curvature γ". This keeps it apart from the local
curvature γ/S_t and the habit parameters. The chapter 37 prompt that names the slider uses the same words.

How: I changed one slider label and one sentence in chapter 37, then rewrapped that paragraph. The clickthrough
finds controls by their place on the page, not by label, so it needed no change.

Where jobs ran: all on the MacBook. There were no cluster or PC jobs.

Deviations: none. Follow-ups: none.
