---
id: TASK-155
title: 'Part X fix: cross-chapter links and Part XI bridge'
milestone: M-12
state: approved
depends_on: [TASK-139, TASK-140, TASK-141]
delivery: pr
---

## Why

TASK-142 found Part X chapters that do not link to chapters now on the site, and no bridge to Part XI. SC-7, M-12.

## Scope

In chapters 36, 37, 38 and 39, replace plain-text mentions of chapters now merged with links, using the site's existing link style, and remove 'not yet written' hedges that are no longer true. Add a short Part X to Part XI (term structure) bridge to chapter 39's 'Recap & next up'. Check every sentence about another chapter is true of merged `main`. Out of scope: other prose, widgets, libraries.

## Acceptance

- Every mention of a merged chapter in chapters 36-39 is a working link.
- Chapter 39's 'Recap & next up' bridges to Part XI.
- Tests, build, screenshots and clickthrough pass for chapters 36-39.

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
ls src/content/chapters | grep '^36-'  # then run screenshots and clickthrough for that slug
