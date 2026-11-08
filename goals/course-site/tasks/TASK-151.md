---
id: TASK-151
title: 'Part X sign-off fixes: numbers, widget label, wording, links and the Part XI bridge'
milestone: M-12
state: approved
depends_on: [TASK-150]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

The Part X read-through (TASK-142 outcome, `## Sign-off`) lists four changes. M-12 and SC-7. This task runs after TASK-150, which already fixes the $\delta$ sentence of Chapter 37 and links Chapter 36's Next up to Chapters 37–39.

## Scope

Make the four changes of the `## Sign-off` of `goals/course-site/tasks/TASK-142.outcome.md` (PR #136 head; `gh pr diff 136 --repo all-explained/empirical-finance-lbs` if not on `main`), with these adjustments because TASK-150 merged first: in change 1 skip the Chapter 37 $\delta$ sentence if TASK-150 fixed it (check), and do the Chapter 39 Hook sentence; in change 4 skip Chapter 36's Next up link (done). Change 2 renames the `HabitSimulator` slider to "Utility curvature $\gamma$" and updates the Chapter 37 prompt and any test naming the old label. Change 3 fixes the wording of Chapter 37 line 300 and Chapter 39 lines 289–295. Change 4 links Chapters 36–39 as listed and adds the three-line Part X bridge and the Part XI sentence in Chapter 39's "Recap & next up" (true of `docs/CURRICULUM.md` Parts XI and XII; Chapter 40 stays plain text until on the site; if TASK-146 has merged, link it). Out of scope: any other edit.

## Acceptance

- The four changes are made as stated.
- The slider label and the Chapter 37 prompt agree, and clickthrough for Chapter 37 passes.
- Every number in the new bridge is true of the merged site.
- Build passes.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 37-internal-and-external-habits
npm run clickthrough -- 37-internal-and-external-habits
npm run screenshots -- 38-long-run-risk
npm run clickthrough -- 38-long-run-risk
npm run screenshots -- 39-rare-disasters-and-jump-risk
npm run clickthrough -- 39-rare-disasters-and-jump-risk
npm run screenshots -- 36-measuring-consumption
npm run clickthrough -- 36-measuring-consumption
git diff --name-only origin/main
