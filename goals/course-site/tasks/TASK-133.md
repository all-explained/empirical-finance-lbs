---
id: TASK-133
title: 'Part VIII links: link chapters 30-33 and add the Part VII bridge'
milestone: M-10
state: approved
depends_on: [TASK-132]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

The Part VIII read-through (TASK-120 outcome, `## Sign-off`) lists this change. M-10 and SC-7.

## Scope

Link every chapter now on the site, with chapter number and italic title, as Chapter 31's Next up does: Chapter 30's Next up (Chapter 31); Chapter 31's Next up (Chapters 32–34); Chapter 32's prerequisite box (Chapter 31) and Next up (Chapter 33); Chapter 33 "What the 25 portfolios hide" (Chapter 32). Then add the Part VII bridge. In Chapter 31, at the end of "Why the components price the test assets", add two sentences with a link: Chapter 30 found that a few principal components of the anomaly portfolios price them out of sample better than the anomalies themselves ($R^2_{CV}$ of 0.44 against 0.29); this chapter asks what such components are and how they relate to factors with names. In Chapter 32's Hook, after "That measures *how much* a characteristic predicts", add one sentence with a link: with hundreds of characteristics in the zoo of Chapter 29, IPCA asks how few factors they need. Out of scope: other edits to these chapters.

## Acceptance

- Every listed mention is a working link with chapter number and italic title.
- The two bridge passages exist and every number in them matches Chapter 30.
- Build passes with no broken links.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 30-shrinking-the-cross-section
npm run clickthrough -- 30-shrinking-the-cross-section
npm run screenshots -- 31-latent-and-observable-factors
npm run clickthrough -- 31-latent-and-observable-factors
npm run screenshots -- 32-characteristics-are-covariances-ipca
npm run clickthrough -- 32-characteristics-are-covariances-ipca
npm run screenshots -- 33-characteristic-based-mimicking-portfolios
npm run clickthrough -- 33-characteristic-based-mimicking-portfolios
git diff --name-only origin/main
