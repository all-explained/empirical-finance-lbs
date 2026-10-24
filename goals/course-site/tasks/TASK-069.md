---
id: TASK-069
title: 'Library: factor models beyond FF3, 2×3 sorts, momentum and spanning tests'
milestone: M-7
state: approved
depends_on: [TASK-067]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-7. Chapters 19 to 21 need the 25 portfolios priced by CAPM, FF3, Carhart and FF5, the SMB, HML and momentum factors rebuilt from their 2×3 sorts, the momentum formation signal, a bear-market regression for momentum crashes, and spanning regressions, in `src/lib`, with tests.

## Scope


Add `src/lib/finance/factors.ts` and `src/lib/finance/factors.test.ts`. Read first: the entries of chapters 19, 20 and 21 in `docs/CURRICULUM.md`, the notation table in `docs/STYLE_GUIDE.md` §3 ("Factor models and tests"), the French notes in `docs/DATA.md` (percent per month; divide by 100), `src/lib/finance/timeSeriesTests.ts` (`factorPanel`, `timeSeriesRegressions`, `grs`), `src/lib/stats/ols.ts`, `src/lib/finance/returns.ts` and `src/components/plots/factorTestSample.ts` (how chapter 16 uses the panel). The 2×3 construction follows the Kenneth French Data Library page for each factor; cite that page in a doc comment. No reading in `source/papers/` defines these factors: Fama & French (1993, 2015), Jegadeesh & Titman (1993) and Carhart (1997) are not supplied, so attribute nothing to them beyond the names of the factors.

Functions:
- `modelPanel({ ff3, ff5?, mom? }, ff25, { start, end?, model })` with `model` `'capm'`, `'ff3'`, `'carhart'` (FF3 plus Mom) or `'ff5'`: returns the `FactorPanel` shape of `timeSeriesTests.ts` (widen the factor-name type here, not there). For `'capm'` and `'ff3'` it equals `factorPanel` exactly. Throw a `RangeError` when a start lies before a source's first month (Mom starts 1927-01, FF5 1963-07) or when dates do not line up. Do not change `factorPanel`.
- `sortFactors(six, kind)` with `kind` `'size-value'` (from `ff6-size-bm-monthly`) or `'size-momentum'` (from `ff6-size-mom-monthly`): the six decimal leg returns and the factors built from them, $SMB = \tfrac13(SL + SM + SH) - \tfrac13(BL + BM + BH)$ and $HML = \tfrac12(SH + BH) - \tfrac12(SL + BL)$ for the first, $UMD = \tfrac12(SW + BW) - \tfrac12(SL + BL)$ (winners minus losers) for the second.
- `formationReturn(returns, t, { lookback = 12, skip = 1 })`: the compounded return from $t-12$ to $t-2$, the formation signal $r_{t-12 \to t-2}$, through `grossGrowth`.
- `bearMarketRegression(wml, market, { lookback = 24 })`: the bear-market indicator $I_{B,t-1} = 1$ when the market's compounded excess return over the previous `lookback` months is negative, and the OLS fit of $WML_t = \alpha_0 + \alpha_B I_{B,t-1} + (\beta_0 + \beta_B I_{B,t-1}) R^e_{m,t} + \varepsilon_t$ with White standard errors from `ols`.
- `worstMonths(dates, values, k)` and `windowBefore(dates, values, date, months)` for a crash-by-crash view.
- `spanningTest(newFactors, baseFactors)`: the time-series regression of each new factor on the base factors, $f_{\text{new},t} = \alpha + \beta' f_t + \varepsilon_t$, with $\alpha$, its classical and White $t$-statistics and $R^2$, and the GRS test of all alphas when there are several new factors. Reuse `timeSeriesRegressions` and `grs`.

Tests against reference values, each stated in the test: `modelPanel` equals `factorPanel` for CAPM and FF3, and throws for an FF5 start before 1963-07; `sortFactors` on a hand-made six-portfolio row; on the committed data, rebuilt HML, SMB and UMD match the published `HML`, `SMB` (of `ff3-monthly`) and `Mom` to within the source's rounding (state the largest gap); `formationReturn` on a hand-computed series; `bearMarketRegression` recovers known coefficients on a seeded series (seed with `src/lib/math/rng.ts`); `spanningTest` gives $\alpha = 0$ and $R^2 = 1$ for a factor that is an exact combination of the base; and pinned values on the committed data from 1963-07: the GRS statistic of the 25 portfolios under each model, and the FF3 alpha of Mom with its $t$-statistic. Reuse `ols`, `grossGrowth`, `timeSeriesRegressions` and `grs`; do not copy them. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/factors.ts`, its test and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
