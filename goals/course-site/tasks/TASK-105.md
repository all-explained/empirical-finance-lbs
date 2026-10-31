---
id: TASK-105
title: 'Library: shrinkage SDF estimates, the elastic net and cross-validated R²'
milestone: M-9
state: approved
depends_on: []
delivery: pr
---

## Why


SC-7 and M-9. Chapter 30 estimates SDF coefficients for many factors at once, as Kozak, Nagel & Santosh (2020) do: a natural prior turns the estimate into a ridge regression, the elastic net adds sparsity, and a few principal components carry most of the SDF. It needs the estimators, their cross-validated out-of-sample R², and in-sample and out-of-sample Sharpe ratios of the shrunk tangency portfolio. Nothing in `src/lib` shrinks yet.

## Scope


Add `src/lib/finance/shrinkage.ts` and `src/lib/finance/shrinkage.test.ts`. Read first: the entry of chapter 30 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (with the Part VI block), `docs/DATA.md`, `src/lib/finance/portfolio.ts` (`tangencyWeights`, `maxSharpeSquared`, `sampleMeans`, `sampleCovariance`), `src/lib/finance/factors.ts` (`modelPanel`), `src/lib/finance/sdfGmm.ts` (the SDF form $M_{t+1} = 1 - b'\tilde f_{t+1}$), `src/lib/stats/pca.ts`, `src/lib/math/linalg.ts` (`symmetricEigen`, `solve`) and `src/lib/finance/zoo.ts` (how `osap-ls-monthly` is read). Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/KozakNagelSantosh2018.pdf` (Kozak, Nagel & Santosh (2020), published version; the file name says 2018) with `pdftotext -layout` and cite pages in doc comments for the prior, the ridge form, the elastic-net objective, the PC rotation, the K-fold cross-validation and the out-of-sample R² you implement.

Functions (decimal excess returns of the base assets, $T \times N$):
- `assetPanel(set, series)` for two asset sets: `'ff'`, the 25 size–value portfolios with the FF5 factors and momentum as traded assets (from `ff25-size-bm-monthly`, `ff5-monthly` and `mom-monthly`, 1963-07 on, through `modelPanel` where it fits), and `'osap'`, the published long–short predictors of `osap-ls-monthly` with no missing month over a common window chosen so that at least 40 signals remain (state the window and the count). Apply the preprocessing the paper states (for example removing the market and rescaling), citing each step's page, and return dates, names and returns.
- `ridgeSdf(mu, Sigma, penalty)`: $\hat b = (\Sigma + \gamma I)^{-1}\bar\mu$ in the curriculum's letters, and the map from the paper's prior scale (the expected maximum squared Sharpe ratio) to the penalty, as the paper gives it.
- `elasticNetSdf(mu, Sigma, { l1, l2 })`: the paper's penalised objective with the $L^1$ and $L^2$ penalties, by coordinate descent to a tolerance with an iteration cap; return $\hat b$ and the number of non-zero coefficients.
- `principalComponentAssets(returns)`: the returns rotated onto their principal components (reuse `pca`), so both estimators can run on PCs as well as on the original assets.
- `crossValidatedR2(returns, { folds, penalty, l1, space })`: K-fold cross-validation over contiguous blocks of months (state $K$; the paper's choice is the default), with the out-of-sample cross-sectional R² the paper defines (cite it), averaged over folds.
- `shrinkagePath(returns, { penalties, l1, space })`: $\hat b$ for each penalty on a grid and the cross-validated R² curve, for the `ShrinkagePath` widget.
- `splitSampleSharpe(returns, { split, penalty })`: the shrunk tangency portfolio $w \propto \hat b$ estimated on the first part of the sample, with its in-sample and out-of-sample Sharpe ratios and mean–volatility points, for the `FrontierBuilder` preset; with penalty 0 it is the plain tangency portfolio.

Notation. The curriculum writes $m_t$, $F_t$, $\gamma$, $\kappa$ and $\tau$; §3 uses $M$ for the SDF and $f_t$ for factors, and $\gamma$ (risk aversion), $\kappa$ (Campbell–Shiller constant), $\tau$ (option life) and $F_t$ (forward price) are taken. Choose free letters for the penalties, the prior scale and the cross-validated R² (§3's $R^2_{OS}$ is the forecast R² of chapter 13, a different object), check each against §3, and add them to one "Part VII" block of the §3 table, each with the clash it avoids; if the curriculum's letter is taken, keep it out of the code names too. The other two Part VII library tasks add rows to the same block: whichever merges first creates the block heading; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: `ridgeSdf` with penalty 0 equals $\Sigma^{-1}\bar\mu$ and the `tangencyWeights` direction; `elasticNetSdf` with no $L^1$ penalty equals `ridgeSdf` to 1e-8, with a large $L^1$ penalty returns all zeros, and its solution meets the optimality (KKT) conditions on a seeded case; `principalComponentAssets` preserves total variance; on PCs, the ridge estimate shrinks each PC coefficient by the factor the paper derives (state it); `crossValidatedR2` gives the same output on repeated calls and a hand-checked value on a small seeded panel; `splitSampleSharpe` with penalty 0 gives the in-sample maximum Sharpe ratio `maxSharpeSquared`; and pinned values on the committed data: for both asset sets, the sample window, the number of assets, the penalty that maximises the cross-validated R² and that R², and the in-sample and out-of-sample Sharpe ratios at penalty 0 and at that penalty. Keep the default grids small enough that the unit tests finish in a few seconds; give long tests an explicit timeout (issue #67). Reuse `pca`, `symmetricEigen`, `solve`, `sampleMeans`, `sampleCovariance`, `tangencyWeights`, `maxSharpeSquared`, `modelPanel` and the series loaders; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- `docs/STYLE_GUIDE.md` §3 has a Part VII block with the shrinkage symbols, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/shrinkage.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
