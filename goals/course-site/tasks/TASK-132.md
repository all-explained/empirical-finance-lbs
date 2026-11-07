---
id: TASK-132
title: 'Part VIII notation: rename Chapter 31 matrix B to Psi'
milestone: M-10
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

The Part VIII read-through (TASK-120 outcome, `## Sign-off`) lists this change. M-10 and SC-7.

## Scope

In `src/content/chapters/31-latent-and-observable-factors.mdx`, rename the canonical-correlation matrix of lines 181–187 from $B$ to $\Psi$. Add a §3 Part VIII row in `docs/STYLE_GUIDE.md`: $\Psi = \Sigma_{XX}^{-1/2}\Sigma_{XY}\Sigma_{YY}^{-1/2}$, whose $\Psi\Psi'$ has eigenvalues $\mathit{cc}_k^2$ (not the beta matrix $B$). Add the macro if the symbol needs one in `src/lib/katexMacros.ts`. In lines 171–172 use $H$ instead of $G$ ("Replace $X$ by $XH'$ for an invertible $H$"), so $G$ keeps the meaning of Chapter 28. Make the same two renames in the docstring of `canonicalCorrelations` in `src/lib/finance/latentFactors.ts` (lines 94–98) and in its local variable `B`. Out of scope: any other file or any change to numbers.

## Acceptance

- `git grep` shows no $B$ for the canonical-correlation matrix and no $G$ for the invertible rotation in Chapter 31.
- The STYLE_GUIDE row exists and the notation-vs-macros test passes.
- `latentFactors.test.ts` passes unchanged.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 31-latent-and-observable-factors
npm run clickthrough -- 31-latent-and-observable-factors
git diff --name-only origin/main
