---
id: TASK-154
title: 'Part X fix: wording in chapters 37 and 39'
milestone: M-12
state: approved
depends_on: [TASK-139, TASK-140, TASK-141, TASK-153]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

TASK-142 found two hard sentences in Part X. SC-7, M-12.

## Scope

Chapter 37 near line 300: explain 'slope times 10' (what is multiplied and why) in plain words. Chapter 39 lines 289-295: split the long Table 1 sentence into short sentences without changing its numbers. Out of scope: other prose.

## Acceptance

- Both passages read clearly to a reader from zero, in the Part's voice (`docs/STYLE_GUIDE.md` §1).
- No number changes.
- Tests, build, screenshots and clickthrough pass for chapters 37 and 39.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 37-internal-and-external-habits
npm run clickthrough -- 37-internal-and-external-habits
npm run screenshots -- 39-rare-disasters-and-jump-risk
npm run clickthrough -- 39-rare-disasters-and-jump-risk
