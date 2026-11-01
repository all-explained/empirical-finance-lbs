---
id: TASK-124
title: 'Library: re-estimate assetPanel betas on the pre-2005 window (chapter 30)'
milestone: M-9
state: approved
depends_on: [TASK-123]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-7 and M-9. `assetPanel` in `src/lib/finance/shrinkage.ts` removes the market and rescales the Fama–French portfolios with betas from the whole sample. The split-sample Sharpe ratios in chapter 30 therefore see the future through the betas (documented at `shrinkage.ts` lines 63-64 and in TASK-105's outcome). The paper estimates them on the earlier window (its p. 290). The fix removes the caveat from the chapter.

## Scope

Change `assetPanel` so that, for the split-sample statistics, the market betas and the scales are estimated on the in-sample months only and applied to both samples. Keep the full-sample behaviour available where a test or the chapter needs it, and keep the API change as small as possible. Update the library tests with new reference values (hand-checkable on a small seeded panel), then update every number in `src/content/chapters/30-shrinking-the-cross-section.mdx` and `tests/chapter30-numbers.test.ts` that changes (the Sharpe ratios 1.84 to 0.82 and 8.85 to 2.18 are the first to check). Remove the look-ahead caveats from the Hook (about lines 38-40) and from the warning Callout (about lines 257-260) only if the numbers are now clean; keep any caveat that is still true. Run `git grep -n "assetPanel"` and update every caller.

Out of scope: other chapters and other libraries.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- Every number in chapter 30 prose maps to a test in `tests/chapter30-numbers.test.ts`.
- `npm run screenshots` and `npm run clickthrough` pass for `30-shrinking-the-cross-section` and `07-mean-variance`.
- The outcome file states the old and new split-sample numbers.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 30-shrinking-the-cross-section
npm run screenshots -- 07-mean-variance
npm run clickthrough -- 30-shrinking-the-cross-section
npm run clickthrough -- 07-mean-variance
git grep -n "assetPanel"
git diff --name-only origin/main
