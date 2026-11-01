---
id: TASK-112
title: 'Library: PCA factors, rotations, canonical correlations and latent-factor risk premia'
milestone: M-10
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-10. Chapter 31 compares the factors that theory picks (MKT, SMB, HML) with the factors that PCA extracts from the 25 size–value portfolios. It shows that latent factors are fixed only up to a rotation, prices the portfolios with latent factors as the APT allows, and compares the two factor sets by their canonical correlations, which no rotation changes. `src/lib/stats/pca.ts` has PCA, but no factor scores in the $R^e_t = \beta f_t + \varepsilon_t$ form, no rotation and no canonical correlations. Chapter 34's three-pass estimator reuses the PCA factors of this library.

## Scope


Add `src/lib/finance/latentFactors.ts` and `src/lib/finance/latentFactors.test.ts`. Read first: the entries of chapters 31 and 34 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (with the Part VII block), `src/lib/stats/pca.ts` (`pca`, `scores`, `ff25Returns`), `src/lib/math/linalg.ts` (`symmetricEigen`, `solve`, `inverse`), `src/lib/finance/crossSection.ts` (`crossSectionalRegression`), `src/lib/finance/timeSeriesTests.ts` (`factorPanel`, `timeSeriesRegressions`), `src/lib/finance/portfolio.ts` and `src/components/plots/pcaSample.ts` (how chapters 6 and 28 build the 25-portfolio panel). Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GiglioXiu2021.pdf` (Giglio & Xiu (2021), published version) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Nagel2013.pdf` (Nagel (2013), NBER working paper 18554) with `pdftotext -layout` and cite pages in doc comments for anything you take from them: the PCA normalisation of Giglio & Xiu (eq. 7, p. 1959), their rotation-invariance argument (pp. 1956–1957), and Nagel's reading of the APT and of the factor structure of the 25 portfolios. No paper in `source/papers/` defines canonical correlations; use the textbook definition and cite no reading for it.

Functions (decimal excess returns, $T \times N$; factors, $T \times K$):
- `pcaFactors(excess, K)`: the first $K$ principal components of the demeaned returns as factors and their loadings, in the form $R^e_t - \bar R^e = \beta f_t + \varepsilon_t$, with a stated normalisation (state which: unit factor variances, or orthonormal loadings, and how it relates to eq. 7 of Giglio & Xiu), the share of variance each factor explains, and the residuals. Reuse `pca` and `scores`; do not repeat the eigen step.
- `rotateFactors(beta, factors, H)`: $(\beta, f) \to (\beta H^{-1}, H f)$ for an invertible $K \times K$ matrix $H$; the fitted values $\beta f_t$ do not change.
- `canonicalCorrelations(X, Y)`: the $\min(p, q)$ canonical correlations of two blocks of series ($T \times p$ and $T \times q$), in descending order, with the canonical weights of both blocks, from the eigenvalues of $\Sigma_{XX}^{-1}\Sigma_{XY}\Sigma_{YY}^{-1}\Sigma_{YX}$ through `symmetricEigen` on a symmetric form. They do not change under a rotation of either block.
- `latentRiskPremia(excess, K)`: the two-pass cross-sectional regression of mean excess returns on the loadings of `pcaFactors`, with an intercept and without, giving $\hat\lambda$ and the OLS cross-sectional $R^2$ (reuse `crossSectionalRegression`, the one $R^2$ definition of chapter 28), so chapter 31 can compare $K = 1, \dots, 5$ PCs with CAPM and FF3 on the same assets.
Every estimate here uses the whole sample: say so in a doc comment, because the PCs are chosen with the same returns they then price (chapters 28 and 30 make this point).

Notation. §3 has $f_t$, $\beta$, $\lambda$, $K$ and $\varepsilon$. Choose symbols for the rotation matrix (the curriculum's $H$), the canonical correlations (for example $\rho_k$; check that §3 leaves it free) and the canonical weights, check each against §3, and add them to one "Part VIII" block of the §3 table, each with the clash it avoids. The other three Part VIII library tasks add rows to the same block: whichever merges first creates the block heading; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: `pcaFactors` with $K = N$ reproduces the demeaned returns exactly, and its variance shares match `pca`'s eigenvalues; `rotateFactors` leaves fitted values unchanged to 1e-10 for a seeded random $H$; `canonicalCorrelations` of a block with itself is all ones, of two independent seeded blocks is near zero (state the band), equals the absolute correlation when $p = q = 1$, and is unchanged to 1e-10 when either block is rotated; `latentRiskPremia` with the factors' own loadings gives the same $\hat\lambda$ as `crossSectionalRegression` called directly; and pinned values on the committed `ff25-size-bm-monthly` and `ff3-monthly` data from 1963-07: the variance shares of the first five PCs, the three canonical correlations between the first three PCs and [Mkt-RF, SMB, HML], and the cross-sectional $R^2$ with an intercept for $K = 1, \dots, 5$ PCs, CAPM and FF3. Reuse `pca`, `scores`, `ff25Returns`, `symmetricEigen`, `solve`, `inverse`, `sampleMeans`, `sampleCovariance`, `factorPanel`, `crossSectionalRegression` and the RNG helpers of `src/lib/math/rng.ts`; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- `docs/STYLE_GUIDE.md` §3 has a Part VIII block with the rotation and canonical-correlation symbols, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/latentFactors.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
