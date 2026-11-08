# TASK-132 outcome: rename Chapter 31's matrix B to Psi

## Acceptance

- [x] `git grep` shows no $B$ for the canonical-correlation matrix and no $G$ for the invertible rotation in Chapter 31.
  Evidence: `git grep -nE "BB'|\$B = |B = Σ|const B"` on the chapter and `src/lib/finance/latentFactors.ts` finds nothing (exit 1). `git grep -nw G -- src/lib/finance/latentFactors.ts` finds nothing (exit 1). In the chapter, `git grep -nP` for a math-mode $B$ or $G$ that is not part of a longer name finds only lines 70 and 153–154. Line 70 says Chapter 28 called the beta matrix $B$. Lines 153–154 recall Chapter 28's $B_P = BG$ and $\lambda_P = G^{-1}\lambda$. Both keep their Chapter 28 meaning, as the spec asks. $\Psi$ now appears on lines 181–187 of the chapter, and $H$ on lines 171–172.
- [x] The STYLE_GUIDE row exists and the notation-vs-macros test passes.
  Evidence: `docs/STYLE_GUIDE.md` §3 "Part VIII" has the row $\Psi = \Sigma_{XX}^{-1/2}\Sigma_{XY}\Sigma_{YY}^{-1/2}$, whose $\Psi\Psi'$ has eigenvalues $\mathit{cc}_k^2$. It is placed after the $X$, $Y$ row. `tests/notation.test.ts` passes all 4 checks. $\Psi$ takes no macro: the macros only add a colour class to returns, factors and errors, and $\Psi$ is none of these.
- [x] `latentFactors.test.ts` passes unchanged.
  Evidence: `git diff --stat origin/main -- src/lib/finance/latentFactors.test.ts` is empty. All 16 tests in that file pass, including "pins the canonical correlations of the first three PCs".

## Summary

**What.** The chapter now writes the canonical-correlation matrix as $\Psi$, in place of $B$, which is the $N \times K$ beta matrix of Chapter 28. The rotation of a block in "No rotation changes it" is now $H$, in place of $G$, the map from true to proposed betas in Chapter 28. $H$ is already the rotation letter of Chapters 31 and 34. The docstring of `canonicalCorrelations` uses the same two letters, and its local variable `B` is now `Psi`.

**How.** The new STYLE_GUIDE row also separates $\Psi$ from the lower-case $\psi$ of the EIS (elasticity of intertemporal substitution). One chapter line grew to 123 characters, so I rewrapped it to stay at 120 or fewer.

**Deviations.** None. No numbers and no other files changed.

**Verified revision.** `npm ci`, `npm test` (76 files, 824 tests passed), `npm run build` (`astro check` 0 errors, 0 warnings, 1 hint; `[build] Complete!`), `npm run screenshots -- 31-latent-and-observable-factors` (4 shots, no console errors, KaTeX errors or overflow) and `npm run clickthrough -- 31-latent-and-observable-factors` (13 actions at 1280px and 360px) all exit 0. They ran on the change before its rebase onto `origin/main` c7ff41a. That commit changes only `goals/course-site/decisions.jsonl`. I checked crops of lines 171–187 in both themes at desktop and phone sizes: $H$ and $\Psi$ render correctly.

**Proposed follow-ups.** None.
