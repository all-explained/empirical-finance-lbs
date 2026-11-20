---
id: TASK-156
title: 'Part X fix: link chapter 40 from chapter 39 Next up'
milestone: M-12
state: approved
depends_on: [TASK-151]
delivery: pr
route: {platform: claude, model: sonnet, effort: high}
---

## Why

TASK-142's re-review found chapter 40 is now on the site, but chapter 39's 'Recap & next up' still names it as plain text. SC-7, M-12.

## Scope

In `src/content/chapters/39-rare-disasters-and-jump-risk.mdx`, link 'Chapter 40, Yields, forwards and bond returns' in 'Recap & next up' using the site's existing chapter link style. Also grep chapters 36-39 for any other plain-text mention of chapter 40 and link it. Out of scope: any other prose, widgets or libraries.

## Acceptance

- Every mention of chapter 40 in chapters 36-39 is a working link.
- `npm test` and `npm run build` pass; screenshots and clickthrough pass for chapter 39.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 39-rare-disasters-and-jump-risk
npm run clickthrough -- 39-rare-disasters-and-jump-risk
