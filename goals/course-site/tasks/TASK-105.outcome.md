# TASK-105 outcome: Library: shrinkage SDF estimates, the elastic net and cross-validated R²

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX
  macro check.
  Evidence: `npm ci && npm test && npm run build && git status --short` on `79f7499` (rebased on `origin/main` `5ef7bf4`) exited 0; `npm test`: 61 files, 641 tests passed, `tests/notation.test.ts` included. `shrinkage.test.ts` has 17 tests, about 2 s. Reference values per export:
  `ridgeSdf`: a 2 × 2 case by hand, $(\Sigma + I)^{-1}(1, 0)' = (3/8, -1/8)'$; with penalty 0 it equals
  `inverse(Σ)μ̄` and, scaled to sum to one, `tangencyWeights`, to 1e-10.
  `ridgePenalty`: $\operatorname{tr}\Sigma = 4$, $SR_{\text{prior}} = 0.5$, $T = 100$ give $\nu_2 = 0.16$.
  `elasticNetSdf`: with $\nu_1 = 0$ it equals `ridgeSdf` to 1e-8; with $\nu_1 \ge 2\max_i\lvert\bar\mu_i\rvert$ it
  returns all zeros; on a seeded case with some zero and some non-zero coefficients it meets the KKT conditions of
  eq. (28) (gradient $= -\nu_1\operatorname{sign}b_i$ to 1e-12 where $b_i \ne 0$, $\lvert\text{gradient}\rvert \le \nu_1$ where $b_i = 0$).
  `principalComponentAssets`: total variance is preserved; the PC covariance is $\operatorname{diag}(\ell_j)$; the
  means are $Q'\bar\mu$. On PCs, ridge shrinks coefficient $j$ by $\ell_j/(\ell_j + \nu_2)$ (KNS p. 278, eq. 24), to 1e-8.
  `crossValidatedR2`: a hand-checked value on a one-asset, six-month panel, $(96/121 + 0 - 336/25)/3$; on a seeded
  panel the same output on repeated calls, the same ridge value for assets and PCs (rotation invariance), and a
  different value with 4 folds.
  `shrinkagePath`: each R² equals `crossValidatedR2` and each $\hat b$ equals `elasticNetSdf` on the full sample;
  the default penalties map back to `defaultPriorScales`.
  `splitSampleSharpe`: with penalty 0 the squared in-sample Sharpe ratio equals `maxSharpeSquared` of the first
  months, to 1e-12, and the weights are $\hat\Sigma^{-1}\bar\mu$.
  `assetPanel` and the pinned data values: see the tables below.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `Result (186 files): - 0 errors - 0 warnings - 1 hint`, `28 page(s) built`, `[build] Complete!`, exit 0, on `79f7499`. The hint is the unused `Matrix` import in `src/lib/finance/news.ts`, already reported as #88.
- [x] `docs/STYLE_GUIDE.md` §3 has a Part VII block with the shrinkage symbols, and the outcome lists each with
  the clash it avoids.
  Evidence: the new heading `### Part VII: the factor zoo and shrinkage (Chapters 28–30)` with four rows:

  | Symbol | Meaning | Clash it avoids |
  |---|---|---|
  | $\nu_2$, $\nu_1$ | L2 and L1 penalties; code `penalty` and `l2`, and `l1` | The paper's $\gamma$, $\gamma_2$, $\gamma_1$: $\gamma$ is risk aversion |
  | $SR_{\text{prior}}$ | Root expected maximum squared Sharpe ratio under the prior; code `priorScale` | The paper's $\kappa$ (Campbell–Shiller constant) and its $\tau = \operatorname{tr}\Sigma$ (option life); the row writes $\operatorname{tr}\Sigma$. $\xi$ was free in §3 but chapter 8 already uses it |
  | $R^2_{CV}$ | Cross-validated cross-sectional $R^2$, eq. (30) | $R^2_{OS}$, the forecast $R^2$ of Chapter 13 |
  | $K_{CV}$ | Number of folds; code `folds` | Bare $K$, the number of factors |

  The curriculum's $m_t$ and $F_t$ stay out of the code. Code and comments use $M$ and $R^e_t$. The paper's
  $P_t$ (price here), $D$ (Jacobian here) and $\eta$ (conditional SDF intercept here) are written as $Q'R^e_t$
  and $\ell_j$, or in words. The notation test in `npm test` passes, because the block names no macro.
- [x] `git status --short` shows only `src/lib/finance/shrinkage.ts`, its test, `docs/STYLE_GUIDE.md` and this
  task's outcome file.
  Evidence: `git status --short` printed nothing after the build; `git diff --name-only origin/main...HEAD` lists exactly `docs/STYLE_GUIDE.md`, `goals/course-site/tasks/TASK-105.outcome.md`, `src/lib/finance/shrinkage.test.ts` and `src/lib/finance/shrinkage.ts`.

## Summary

**What.** `src/lib/finance/shrinkage.ts` exports `assetPanel`, `assetWindows`, `ridgeSdf`, `ridgePenalty`,
`elasticNetSdf`, `principalComponentAssets`, `crossValidatedR2`, `shrinkagePath`, `defaultPriorScales` and
`splitSampleSharpe`. It reuses `modelPanel`, `betweenDates`, `getColumn`, `betas`, `sampleMeans`,
`sampleCovariance`, `sampleVariance`, `arithmeticMean`, `pca` and `solve`. `inverse`, `tangencyWeights` and
`maxSharpeSquared` are the references in the tests. Every formula cites Kozak, Nagel & Santosh (2020, JFE 135,
271–292) by printed page.

**How.**
- Asset sets. `'ff'`: the 25 size–B/M portfolios less RF, with SMB, HML, RMW, CMA (from `ff5-monthly`, through
  `modelPanel` 'ff5') and Mom (`modelPanel` 'carhart') as traded assets. Mkt-RF is the market, so it is not an
  asset. There are 30 assets, 1963-07 to 2026-08, 758 months. Each asset has the market removed with a
  full-sample beta (p. 280, fn. 9) and is rescaled to the market's standard deviation (p. 280). `'osap'`: the 108
  signals of `osap-ls-monthly` with no missing month from 1963-07 to 2024-12 (738 months), with the market
  (Mkt-RF of `ff3-monthly`) removed (p. 282–283). The paper does not rescale its anomaly portfolios, so this set is
  not rescaled.
- `ridgeSdf` solves $(\Sigma + \nu_2 I)b = \bar\mu$ (eq. 22). `ridgePenalty` is
  $\nu_2 = \operatorname{tr}\Sigma/(SR^2_{\text{prior}}T)$ (p. 277, eq. 29 on p. 279).
- `elasticNetSdf` minimises eq. (28) by cyclic coordinate descent from $b = 0$. Each step is a soft threshold
  at $\nu_1/2$. It stops when no coordinate moves more than `tolerance` (1e-12) × $\max_i\lvert b_i\rvert$, or after
  `maxSweeps` (10 000); `converged` reports which. The paper uses LARS-EN (fn. 7). Both solve the same convex problem.
- `crossValidatedR2` uses $K_{CV} = 3$ contiguous blocks by default (p. 279), with eq. (30) averaged over folds.
  $\nu_2$ is fixed across folds, as the paper's "for each possible γ" says. Fold moments are computed once per
  path, so the OSAP path (21 penalties, $N = 108$) takes about 0.7 s.
- `space: 'pcs'` rotates once on the whole sample (eqs. 10–11). The PC portfolios are not demeaned, so
  $\bar\mu_{PC} = Q'\bar\mu$.
- `splitSampleSharpe` returns $\hat b$ itself as the weights: the paper's MVE portfolio $\hat b'F_t$ (p. 290).
  It does not rescale them to sum to one, because for zero-cost assets $\mathbf 1'\hat b$ can be near zero or
  negative. The Sharpe ratio does not depend on the scale.

**Pinned values on the committed data** (monthly; default grid of 21 prior scales $SR_{\text{prior}} = 10^{-2}$ to
$10^{1}$; $K_{CV} = 3$; split at 2005-01, month 498, after the paper's withheld sample, p. 289):

| | FF set | OSAP set |
|---|---|---|
| Window, assets | 1963-07 to 2026-08, 758 months, 30 | 1963-07 to 2024-12, 738 months, 108 |
| Best grid point | $SR_{\text{prior}} = 0.01$ (the grid's lower edge), $\nu_2 = 0.786539$ | $SR_{\text{prior}} = 0.158489$, $\nu_2 = 0.00772691$ |
| Its $R^2_{CV}$ | −0.006015 | 0.520071 |
| Sharpe at $\nu_2 = 0$, in / out | 0.529950 / 0.236763 | 2.555409 / 0.630102 |
| Sharpe at the best $\nu_2$, in / out | 0.261963 / 0.022318 | 1.330832 / 0.630282 |

**Finding for Chapter 30 (TASK-108).** On the FF set, $R^2_{CV}$ is negative at every penalty. It rises toward 0
as shrinkage grows, so heavy shrinkage toward $\hat b = 0$ wins. The third fold (2005–2026) causes this: its
means are small, so any $\hat b$ fitted on 1963–2004 fails there. At $SR_{\text{prior}} = 0.2$ the per-fold R²
are −0.003, 0.744 and −4.901. The paper's FF25 result (peak near κ ≈ 0.23, p. 281) uses daily data from 1926 to
2017. The OSAP set gives the paper's shape: a hump-shaped $R^2_{CV}$ with a peak of 0.52. This is a data result,
not a bug: the formula is checked against the hand case and rotation invariance.

**Deviations.**
- $\hat\Sigma$ is `sampleCovariance` (divisor $T - 1$). The paper's eq. (14) uses $T$.
- Monthly data, not daily. $SR_{\text{prior}}$ is per month.
- `assetPanel` estimates betas and rescaling on the whole window. A split-sample test on these returns therefore
  sees the future through the betas. The paper's pure out-of-sample test re-estimates betas before 2005
  (p. 290, fn. 22). The doc comment says so.
- The spec asks for a hand-checked `crossValidatedR2` value "on a small seeded panel". The hand-checked value
  uses a six-month, one-asset panel so that the fractions are exact. The repeated-call and rotation checks use
  the seeded panel.

**Verified revision.** `79f7499`, rebased on `origin/main` `5ef7bf4`. No other Part VII library task has merged yet, so this PR creates the Part VII block.

**Proposed follow-ups.**
- If TASK-108 shows the paper's pure out-of-sample test, add an option to `assetPanel` that estimates the
  market betas and the rescaling on the first months only.
- TASK-108 should choose how to show the FF result: as a lesson (shrinkage cannot beat zero when the premia
  change), or with the OSAP set as the main example.
- `npm test` timed out in unrelated tests (cay, chapters 4, 11, 14, 18, predictive, gmm) while the machine load
  average was above 60. TASK-101 (PR #87) raises the default timeout for this.
