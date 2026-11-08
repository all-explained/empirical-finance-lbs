---
id: TASK-150
title: 'Part IX sign-off fixes: bridge to Part X, chapter 36 wording, chapter 37 number, stale notes'
milestone: M-11
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

The Part IX read-through (TASK-131 outcome, `## Sign-off`) lists these four changes. M-11 and SC-7.

## Scope

Make the four changes of the `## Sign-off` of `goals/course-site/tasks/TASK-131.outcome.md` (read it on the PR #135 head or on `main` once merged; if it is not on `main`, run `gh pr diff 135 --repo all-explained/empirical-finance-lbs`).
1. Chapter 36 Next up (`src/content/chapters/36-measuring-consumption.mdx`): say the puzzle survives better measurement and that Part X offers three answers, each linked: Chapter 37 *Internal and external habits*, Chapter 38 *Long-run risk*, Chapter 39 *Rare disasters and jump risk*. In Chapter 35 add one clause to the last Recap bullet pointing to that Next up.
2. Chapter 36 wording and links: the 1931 start sentence in the Hook, "tens of percent" named by the readout (about 11% a year), a link to Chapter 35 in the note box, the Chapter 5 link in absolute form.
3. Chapter 37, "The answer to Chapter 35": fix the $\delta$ (1.310 at $\gamma = 20.0$; 1.245 at $\gamma = 15$), checked with `impliedTimeDiscount` and pinned in a test. Write it as "at $\gamma = 15.0$ in Chapter 35's table" style wording so it is true. TASK-151 also edits Chapter 37, so keep your edit to this sentence.
4. Stale "not written yet" notes in Chapters 8, 3 and 9: link the chapters they name (check they are on the site).
Out of scope: any other edit.

## Acceptance

- The four changes are made as stated and every number is read from library output or an existing test.
- Every new link has a chapter number and italic title and a working target.
- Build passes.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 36-measuring-consumption
npm run clickthrough -- 36-measuring-consumption
npm run screenshots -- 35-equity-premium-and-risk-free-rate-puzzles
npm run clickthrough -- 35-equity-premium-and-risk-free-rate-puzzles
npm run screenshots -- 37-internal-and-external-habits
npm run clickthrough -- 37-internal-and-external-habits
npm run screenshots -- 08-euler-equation-and-sdf
npm run clickthrough -- 08-euler-equation-and-sdf
npm run screenshots -- 03-regression-and-standard-errors
npm run clickthrough -- 03-regression-and-standard-errors
npm run screenshots -- 09-time-varying-expected-returns
npm run clickthrough -- 09-time-varying-expected-returns
git diff --name-only origin/main
