---
id: TASK-135
title: 'Library: ipcaFit reuses rotateFactors and one symmetricPower'
milestone: M-10
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

The Part VIII read-through (TASK-120 outcome, `## Sign-off`) lists this change. M-10 and SC-7.

## Scope

In `ipcaFit` (`src/lib/finance/ipca.ts`, lines 255–267), apply the three normalisation steps with `rotateFactors` from `latentFactors.ts` ($H$ = the square root of $\Gamma_\beta'\Gamma_\beta$, then the eigenvector matrix, then the diagonal sign matrix), and write the rotation as $H$ in the comments. Move `symmetricPower` to `src/lib/math/linalg.ts` next to `symmetricEigen` and use it for `inverseRoot` in `latentFactors.ts`, leaving one helper. Out of scope: chapters, widgets and any change to numbers.

## Acceptance

- `ipca.test.ts`, `latentFactors.test.ts` and `tests/chapter32-numbers.test.ts` pass unchanged.
- `git grep symmetricPower` shows one definition.
- The diff touches only `ipca.ts`, `latentFactors.ts`, `linalg.ts` and tests if a linalg test is added.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 32-characteristics-are-covariances-ipca
npm run clickthrough -- 32-characteristics-are-covariances-ipca
git diff --name-only origin/main
