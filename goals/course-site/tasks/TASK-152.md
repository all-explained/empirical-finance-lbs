---
id: TASK-152
title: 'Part X fix: numbers in chapters 37 and 39'
milestone: M-12
state: approved
depends_on: [TASK-139, TASK-140, TASK-141]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

The TASK-142 read-through of Part X found numbers that disagree between chapters 37 and 39. SC-7, M-12.

## Scope

Chapter 37 (`src/content/chapters/37-internal-and-external-habits.mdx`, near line 279): state which risk aversion γ the δ = 1.245 belongs to. Chapters 37 and 39: make the 'risk aversion needed' figures agree (chapter 37 says 20, chapter 39 Hook near line 29 says 15). Recompute from the library in `src/lib`, do not hard-code; fix whichever text is wrong and cite the value the library gives. Out of scope: any other prose, widgets, libraries.

## Acceptance

- Both chapters give the same risk-aversion figure, equal to the library value.
- The δ = 1.245 sentence names its γ.
- `npm test` and `npm run build` pass; screenshots and clickthrough pass for chapters 37 and 39.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 37-internal-and-external-habits
npm run clickthrough -- 37-internal-and-external-habits
npm run screenshots -- 39-rare-disasters-and-jump-risk
npm run clickthrough -- 39-rare-disasters-and-jump-risk
