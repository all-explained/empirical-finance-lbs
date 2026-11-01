---
id: TASK-115
title: 'Library: the three-pass estimator and a seeded economy with an omitted factor'
milestone: M-10
state: approved
depends_on: [TASK-112]
delivery: pr
---

## Why


SC-7 and M-10. Chapter 34 estimates the risk premium of an observed factor when the model omits other factors, with the three-pass estimator of Giglio & Xiu (2021): PCA, then a cross-sectional regression on the PCA loadings, then a time-series projection of the factor on the latent factors. It needs the estimator, the omitted-variable bias of the two-pass estimate in a seeded economy, and the estimates on the committed data. The PCA step reuses `pcaFactors` of the latent-factor library.

## Scope


Add `src/lib/finance/threePass.ts` and `src/lib/finance/threePass.test.ts`. Read first: the entry of chapter 34 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (with the Part VII and Part VIII blocks), `src/lib/finance/latentFactors.ts` (`pcaFactors`, `rotateFactors`, `latentRiskPremia`, from the library task this task depends on), `src/lib/finance/crossSection.ts` (`crossSectionalRegression`, `simulateTwoPass`), `src/lib/stats/ols.ts`, `src/lib/finance/timeSeriesTests.ts` (`factorPanel`) and `src/lib/math/rng.ts`. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GiglioXiu2021.pdf` (Giglio & Xiu (2021), published version) with `pdftotext -layout` and cite pages in doc comments for the two-factor example of omitted-variable bias (section II), the model (eqs. 1–2, p. 1956), rotation invariance (pp. 1956–1957), the three steps and their compact form (eqs. 7–8, p. 1959), the version with a zero-beta rate (p. 1960), the asymptotic distribution you use for standard errors, and the point that the estimate stays consistent when more PCs than the true number are used (p. 1972). Where the paper differs from this spec, follow the paper and report the difference in the outcome.

Functions (decimal excess returns $T \times N$; observed factors $T \times d$):
- `threePass(excess, observed, { factors, zeroBeta })`: the three steps with `factors` PCs (the paper's $\hat p$): the PCA factors and loadings from `pcaFactors`, the cross-sectional slopes on the loadings, the time-series slopes of each observed factor on the PCs with the $R^2$ of that regression, and the product, the risk premium of each observed factor. Return a standard error from the paper's asymptotic distribution if the PDF gives every piece it needs; otherwise leave it out and say why.
- `twoPass(excess, observed)`: the usual two-pass estimate with only the observed factors, through `crossSectionalRegression`; write no new regression code.
- `simulateOmittedFactor(seed, { N, T, strength, correlation, noise, samples })`: a seeded economy with two priced factors, an observed proxy of the first (with measurement error `noise`), and a second, omitted factor of strength `strength` whose loadings correlate with the first's by `correlation`, as in the paper's section II. For each draw return the two-pass and three-pass estimates of the observed factor's premium and the true value, and summaries (mean bias, root mean squared error). Keep the default `samples` small enough for the widget and the unit tests; give long tests an explicit timeout (issue #67).
Every estimate on real data uses the whole sample; say so in a doc comment.

Notation. The curriculum writes $R^e_t = \beta v_t + u_t$, $g_t = \xi + \eta v_t + z_t$ and $\gamma_g = \eta\gamma_v$; in §3, $\gamma$ is risk aversion (risk premia are $\lambda$), $g$ is the GMM moment, $\eta$ the intercept of a conditional SDF (Chapter 22), $z_t$ a state variable and $u_t$, $v_t$ second-equation shocks. Use the Part VIII symbols that the latent-factor library added, choose free letters for the rest (the observed factor, its loading on the latent factors, its measurement error and its risk premium), check each against §3, and add them to the Part VIII block of the §3 table, each with the clash it avoids. If the curriculum's letter is taken, keep it out of the code names too. Rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: `threePass` is unchanged to 1e-10 when the PCA factors are rotated with `rotateFactors` before steps 2 and 3; it matches the compact form of eq. 8 written out by hand on a small seeded case; when the observed factor is itself one of the PCs, its premium equals that PC's cross-sectional slope; in `simulateOmittedFactor` with `strength` 0 the two-pass and three-pass estimates agree on average, and with a strong omitted factor the two-pass estimate is biased and the three-pass estimate is not (state the bias of each and the band); the simulation gives the same output for the same seed; and pinned values on the committed `ff25-size-bm-monthly` and `ff3-monthly` data from 1963-07, and on the 25 portfolios with the 30 industries of `ff30-industry-monthly` added: the three-pass premia of Mkt-RF, SMB and HML for 3 to 7 PCs, their two-pass premia, and their sample means (for a traded factor the premium should be close to its mean). Reuse `pcaFactors`, `rotateFactors`, `crossSectionalRegression`, `ols`, `factorPanel`, `sampleMeans` and the RNG helpers; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- `docs/STYLE_GUIDE.md` §3 has the three-pass symbols in the Part VIII block, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/threePass.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
