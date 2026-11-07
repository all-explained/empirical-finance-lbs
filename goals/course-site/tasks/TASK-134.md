---
id: TASK-134
title: 'Part VIII wording fixes in chapters 32 and 34'
milestone: M-10
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

The Part VIII read-through (TASK-120 outcome, `## Sign-off`) lists this change. M-10 and SC-7.

## Scope

Chapter 32 (`src/content/chapters/32-characteristics-are-covariances-ipca.mdx`), line 37: "in four words" becomes "in three words". Lines 307–308: say that the unrestricted fit "reaches 0.29% in the library, a number the widget does not show". Chapter 34 (`src/content/chapters/34-risk-premia-with-omitted-factors.mdx`), line 261: "the 30 industry portfolios of `ff30-industry-monthly`" becomes "Kenneth French's 30 industry portfolios". Line 255: "the bias of the last step above" becomes "the too-few case of step 5 above". Line numbers may have moved after TASK-133: find the sentences by text.

## Acceptance

- The four sentences read as stated.
- No other change in the diff.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 32-characteristics-are-covariances-ipca
npm run clickthrough -- 32-characteristics-are-covariances-ipca
npm run screenshots -- 34-risk-premia-with-omitted-factors
npm run clickthrough -- 34-risk-premia-with-omitted-factors
git diff --name-only origin/main
