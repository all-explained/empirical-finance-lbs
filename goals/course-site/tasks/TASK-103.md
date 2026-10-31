---
id: TASK-103
title: 'Library: random-factor fits, GLS R², traded-factor restrictions and R² confidence intervals'
milestone: M-9
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-9. Chapter 28 shows that almost any factor correlated with SMB and HML fits the 25 size–value portfolios, and applies the four fixes of Lewellen, Nagel & Shanken (2010): more test assets, the restriction that a traded factor's premium equals its mean, the GLS R², and confidence intervals for R². `src/lib` has the two-pass regression and its OLS R², but none of these four pieces.

## Scope


Add `src/lib/finance/skeptical.ts` and `src/lib/finance/skeptical.test.ts`. Read first: the entry of chapter 28 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3, `src/lib/finance/crossSection.ts` (`crossSectionalRegression`, its one R² definition), `src/lib/finance/timeSeriesTests.ts` (`factorPanel`, `timeSeriesRegressions`), `src/lib/finance/factors.ts` (`modelPanel`), `src/lib/finance/identification.ts` (`simulateUselessFactor`, which chapter 27 uses; do not duplicate it), `src/lib/finance/portfolio.ts`, `src/lib/stats/pca.ts` and `src/lib/math/rng.ts`. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/LewellenNagelShanken2010.pdf` (Lewellen, Nagel & Shanken (2010), NBER working-paper version) with `pdftotext -layout` and cite pages in doc comments for anything you take from it: the artificial factors of its Figure 1, Prescriptions 1–4, the GLS R² and its link to mean-variance efficiency, and the bootstrap behind its confidence intervals.

Functions (decimal excess returns, $T \times N$, and factors, $T \times K$; every function takes plain matrices, so the industry portfolios of the parallel data task need no code here):
- `randomFactorFit(seed, excess, smb, hml, { samples, factors, noiseShare })`: draw seeded artificial factors that mix SMB, HML and noise, as the paper's Figure 1 does (state the mixing rule and cite its page); for each draw run the two-pass regression with an intercept and return the OLS and GLS cross-sectional R², and their distribution (median and the share above a given level).
- `glsR2(excess, factors)`: the GLS cross-sectional R² as the paper defines it, with the return covariance $\Sigma$ (divisor $T$) as weight, and its relative mean-variance reading: state in a doc comment which squared Sharpe ratios it compares. Do not change `crossSectionalRegression`.
- `tradedFactorRestriction(excess, factors)`: for traded factors, the cross-sectional regression with the factors added to the test assets, its slope $\hat\lambda$ next to the factor means $\bar f$, the gap $\hat\lambda - \bar f$ with a standard error, and the zero-beta rate against zero (excess returns), as Prescription 2 asks.
- `r2ConfidenceInterval(seed, excess, factors, { samples, level, weighting })`: a seeded bootstrap of months for the sample R² (OLS or GLS), following the paper's procedure as far as it states it (cite the page), returning the interval and the bootstrap draws. Keep the default `samples` small enough that the unit tests finish in a few seconds; give long tests an explicit timeout (issue #67).

Notation. Add any symbol these functions need that §3 lacks (for example $R^2_{\text{GLS}}$) to one "Part VII" block of the `docs/STYLE_GUIDE.md` §3 table, each with the clash it avoids. The other two Part VII library tasks add rows to the same block: whichever merges first creates the block heading; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: `glsR2` is 1 when the factor is the in-sample tangency portfolio of the test assets (`tangencyWeights`), as the paper says it must be; with OLS weighting the R² of the two-pass regression equals `crossSectionalRegression`'s `r2`; in `tradedFactorRestriction`, when the factor is one of the test assets, $\hat\lambda$ matches a hand computation on a three-asset case; `randomFactorFit` with `noiseShare` 1 behaves like a useless factor (state the median R²) and with `noiseShare` near 0 gives a median OLS R² far above the CAPM's on the 25 portfolios (state both); `r2ConfidenceInterval` gives the same output for the same seed and an interval that contains the point estimate; pinned values on the committed `ff25-size-bm-monthly` and `ff3-monthly` data from 1963-07: the OLS and GLS R² of CAPM and FF3, and the 95% interval for the FF3 OLS R². Reuse `timeSeriesRegressions`, `crossSectionalRegression`, `factorPanel`, `modelPanel`, `sampleMeans`, `sampleCovariance`, `tangencyWeights`, `maxSharpeSquared`, `solve`, `inverse` and the RNG helpers; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/skeptical.ts`, its test, `docs/STYLE_GUIDE.md` (if a symbol was added) and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
