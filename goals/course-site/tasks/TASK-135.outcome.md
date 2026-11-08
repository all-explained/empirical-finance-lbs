# TASK-135 outcome

## Acceptance

- [x] `ipca.test.ts`, `latentFactors.test.ts` and `tests/chapter32-numbers.test.ts` pass unchanged.
  Evidence: `git diff origin/main --name-only` on these three files prints nothing. `npx vitest run` on them and
  on `linalg.test.ts` gives 4 files, 53 tests passed. Full `npm test` gives 77 files, 833 tests passed.
- [x] `git grep symmetricPower` shows one definition.
  Evidence: `git grep -n "function symmetricPower"` prints only
  `src/lib/math/linalg.ts:163:export function symmetricPower(...)`. The other hits are imports, calls,
  comments and tests.
- [x] The diff touches only `ipca.ts`, `latentFactors.ts`, `linalg.ts` and tests if a linalg test is added.
  Evidence: `git diff --name-only origin/main` lists `src/lib/finance/ipca.ts`,
  `src/lib/finance/latentFactors.ts`, `src/lib/math/linalg.ts`, `src/lib/math/linalg.test.ts` and this
  outcome file, which the worker protocol requires.

## Summary

What and how:

- `src/lib/math/linalg.ts` exports `symmetricPower(A, p)` = Q Λ^p Q' next to `symmetricEigen`.
  It throws a `RangeError` unless A is positive definite, so a collinear block or a rank-deficient Γ_β
  fails with a clear message, not with `NaN` or `Infinity`.
- `ipcaFit` applies each of the three normalisation steps (p. 13) with `rotateFactors`, which maps
  (Γ_β, f) → (Γ_β H⁻¹, H f). H is (Γ_β'Γ_β)^{1/2}, then the matrix whose rows are the eigenvectors of the
  factor covariance, then the diagonal sign matrix. The comments now name the rotation H, not G.
- `canonicalCorrelations` calls `symmetricPower(·, -0.5)`. The private `inverseRoot` wrapper is removed, so
  only one helper is left.
- `linalg.test.ts` tests `symmetricPower`: the closed form for [5 4; 4 5], identities on a random 5×5
  covariance matrix, and rejection of matrices that are not positive definite.

Deviations: `canonicalCorrelations` now reports a collinear block as
`symmetricPower: matrix must be positive definite`, not `The columns of a block are collinear`. The doc comment
already states the requirement, and a code comment at the call says why it throws. No test checks the message.

Verified revision: `aea7041` (rebased on `fc2bc77`). Verify: `npm ci`, `npm test` (833 passed), `npm run build` (0 errors, 0 warnings,
1 hint from the existing issue #88 in `news.ts`), `npm run screenshots -- 32-characteristics-are-covariances-ipca`
(4 shots, both themes at desktop and phone size, inspected), and
`npm run clickthrough -- 32-characteristics-are-covariances-ipca` (8 actions at 1280px and at 360px).
All exit 0.

Proposed follow-ups: none.
