# TASK-112 outcome

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
  Evidence: `src/lib/finance/latentFactors.test.ts` has 16 tests. `pcaFactors`: K = N rebuilds the demeaned returns (gap < 1e-12),
  shares equal `pca`'s eigenvalue shares, (1/T)Σ f_t f_t' = I and β equals the time-series OLS betas, and pinned shares of the first
  five PCs. `rotateFactors`: fitted values unchanged to 1e-10 for a seeded H, and a hand-checked 2 × 2 case. `canonicalCorrelations`:
  a block with itself gives ones; two independent seeded blocks (T = 10000, 3 + 3 series) give every cc_k < 0.05; K_X = K_Y = 1 gives
  |corr| (also for a negative correlation); rotating either block changes nothing to 1e-10; the weights give unit-variance variates
  with correlation cc_k; and pinned values. `latentRiskPremia`: λ̂, λ̂_0 and R² equal `crossSectionalRegression` on the factors'
  own time-series betas, with and without an intercept, and pinned R². The pinned values come from numpy (SVD, QR-based canonical
  correlations, `lstsq`) on the same committed files; its CAPM and FF3 R² equal the values already pinned in `skeptical.test.ts`.
  `npm test` on 5ba3e8c: `Test Files 67 passed (67)`, `Tests 709 passed (709)`, exit 0; `tests/notation.test.ts` passes.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: on 5ba3e8c, `astro check` prints `- 0 errors`, `- 0 warnings`; the build ends `[build] Complete!`, exit 0.
- [x] `docs/STYLE_GUIDE.md` §3 has a Part VIII block with the rotation and canonical-correlation symbols, and the outcome lists each with the clash it avoids.
  Evidence: `### Part VIII: latent factors and large cross-sections (Chapters 31–34)`, after the Part VII block. All 38 formulas
  in the block render with KaTeX (`throwOnError: true`). The symbols and the clashes they avoid:
  - $H$, the K × K rotation. Not $Q$, because $H$ need not be orthogonal. Not the angle $\omega$ of Chapter 6, which turns one
    plane only. An upright $\text{H}$ stays the high-B/M sort letter ($\text{HML}$, $v_{\text{H},t}$).
  - $\mathit{cc}_k$, the k-th canonical correlation. Not the textbook $\rho_k$: §3 makes $\rho$ the Campbell–Shiller constant and
    says a correlation is never $\rho$. So §3 does not leave $\rho_k$ free. The italic name follows $\mathit{cw}_t$.
  - $w^X_k$, $w^Y_k$, the canonical weights. Not the textbook $a_k$, $b_k$, which are the first-pass intercept and the SDF
    loadings. The block superscript keeps them apart from portfolio weights $w$ and log wealth $w_t$.
  - $X$, $Y$; $K_X$, $K_Y$, the two blocks and their widths. $X$ has no date, so it is not the payoff $X_{t+1}$. The spec's
    $p$ and $q$ would clash with the $p$-value $p_i$, the log price $p_t$ and the significance level $q$.
- [x] `git status --short` shows only `src/lib/finance/latentFactors.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.
  Evidence: `git diff --name-only origin/main...HEAD` lists exactly these four files, and `git status --short` is empty after the commit.

## Summary

**What.** `src/lib/finance/latentFactors.ts` adds four functions for Chapters 31 and 34:
`pcaFactors(excess, K)`, `rotateFactors(beta, factors, H)`, `canonicalCorrelations(X, Y)` and `latentRiskPremia(excess, K)`.
`docs/STYLE_GUIDE.md` §3 gains the Part VIII block.

**How.**
- `pcaFactors` reuses `pca` and `scores`. Normalisation: unit factor variances, with (1/T)Σ f_t f_t' = I_K and β_{·k} = √(ℓ_k(T−1)/T) q_k.
  This equals Giglio & Xiu (2021) eq. 7 (p. 1959) exactly, so the three-pass estimator of Chapter 34 can follow the paper with
  no rescaling. These β are also the time-series OLS betas on the factors. The result carries `mean`, `factors`, `beta`, `share`
  and `residuals`.
- `rotateFactors` is (β, f) → (βH⁻¹, Hf) through `inverse` and `matMul`. Its doc cites Giglio & Xiu pp. 1956–1957.
- `canonicalCorrelations` takes the covariances from `sampleCovariance`. It runs `symmetricEigen` on BB', with
  B = Σ_XX^{-1/2} Σ_XY Σ_YY^{-1/2}, which has the eigenvalues of Σ_XX⁻¹Σ_XYΣ_YY⁻¹Σ_YX. It returns min(K_X, K_Y) correlations in
  descending order, with the weights of both blocks scaled so that each variate has unit variance.
- `latentRiskPremia` calls `crossSectionalRegression` (OLS, with and without an intercept) on the `pcaFactors` loadings. Its doc
  gives Nagel's (2013) APT reading of the 25 portfolios (pp. 14–15, §3.4 pp. 18–20).
- The module header says that every estimate uses the whole sample.
- Pinned on the 25 portfolios from 1963-07 (T = 758):
  - Variance shares of the first five PCs: 83.3%, 6.3%, 3.5%, 1.3%, 0.7%.
  - Canonical correlations of the first three PCs with Mkt-RF, SMB and HML: 0.995, 0.972, 0.931.
  - Cross-sectional R² with an intercept: 0.002, 0.282, 0.640, 0.703 and 0.791 for K = 1 to 5 PCs; 0.078 for the CAPM; 0.663 for FF3.

**Deviations.**
- The symmetric form is BB', not Σ_XX^{-1/2}Σ_XYΣ_YY⁻¹Σ_YXΣ_XX^{-1/2}. The two are the same matrix in exact arithmetic. The first
  version used the second product. With a badly scaled rotated block, its rounding broke the symmetry check of `symmetricEigen`.
  BB' is symmetric to the last bit.
- The rotation-invariance test uses seeded H draws with condition numbers 2.4 (seed 112) and 7.6 (seed 7). A first draw (seed 8)
  had a condition number of 6,600. It moved the correlations by 1.1e-10 because the block's covariance matrix squares that
  condition number. The test comment says so.
- `PcaFactors` also returns `mean` (R̄^e). The model R^e_t − R̄^e = βf_t + ε_t needs it, and `latentRiskPremia` and the three-pass
  estimator use it.

**Verified revision.** 5ba3e8c (rebased on `origin/main`): `npm ci`, `npm test`, `npm run build` and `git status --short` all exit 0.

**Proposed follow-ups.** None.
