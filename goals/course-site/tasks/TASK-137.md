---
id: TASK-137
title: 'Library: Epstein–Zin pricing, the long-run risks solution, simulation and variance ratios'
milestone: M-12
state: approved
depends_on: []
delivery: pr
---

## Why


SC-7 and M-12. Chapter 38 separates risk aversion from the elasticity of intertemporal substitution, shows how a small persistent part of consumption growth makes stocks risky, and weighs the evidence. It needs the Epstein–Zin SDF, the approximate analytical solution of the long-run risks model with its endogenous linearisation constants, a seeded simulation with and without the persistent part, long-horizon variance ratios, and the predictive regressions Beeler and Campbell use against the model. `presentValue.ts` has the Campbell–Shiller constants and `predictive.ts` the horizon regressions; nothing solves the model. No dataset is missing, so this task starts at once.

## Scope


Add `src/lib/finance/longRunRisk.ts` and `src/lib/finance/longRunRisk.test.ts`. Read first: the entry of chapter 38 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the SDF and consumption table with $\psi$, the predictability table with $\phi$, $\rho$ and $\kappa$, the Part VII row for $\nu_1$, $\nu_2$, the Part IX block and the Probability and statistics table with $\theta$), `src/lib/finance/presentValue.ts` (`linearisationConstants`, `goyalWelchAnnualPresentValue`), `src/lib/finance/predictive.ts` (`predictiveRegression`, `horizonSlopes`), `src/lib/finance/consumptionPuzzle.ts` (`annualConsumption`, `annualSample`, `impliedRiskFree`), `src/lib/stats/autocorr.ts` (`overlapMeanVariance`), `src/lib/stats/var.ts`, `src/lib/math/rootFind.ts` and `src/lib/math/rng.ts`.

Readings. Open these PDFs with `pdftotext -layout` and cite pages in doc comments for anything you take from them:
- `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/BansalKikuYaron2012.pdf` (Bansal, Kiku & Yaron, NBER working paper dated November 2009; cite the 2012 *Critical Finance Review* article and name working-paper pdf pages): preferences, eq. (1), and the joint dynamics of consumption, the persistent part, volatility and dividends, eq. (3), p. 6; the log SDF, eq. (5), and the log-linear return on wealth, eq. (6), p. 7; the solution $z_t = A_0 + A_1x_t + A_2\sigma_t^2$ with the endogenous mean $\bar z$, eqs. (7)–(9), p. 8; the risk premium, eq. (10), and the prices of risk, eq. (11), p. 9; the market return betas and the dividend claim, Appendix, from p. 23; the monthly calibration, Table I, p. 28.
- `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/BeelerCampbell2012.pdf` (Beeler & Campbell, NBER working paper dated March 2009; cite the 2012 *Critical Finance Review* article and name working-paper pdf pages): the BY and BKY calibrations, pp. 6–7 and Table I, p. 34; solving and simulating the model, Section 2.1, p. 7; the analytical moments of both calibrations, Tables II–III, pp. 35–36; autocorrelations of consumption and dividend growth, Table IV, pp. 37–38; predictive regressions on the log price–dividend ratio, Table VI, pp. 41–42; the annual US data, 1930–2006, Section 3, p. 9.
Bansal & Yaron (2004) and Epstein & Zin (1989) are not in `source/papers/`: name them only where an opened reading does, with its page. Campbell (2018), Ch. 6, is not in `source/papers/` either: take no fact from it.

Functions (decimal log rates; monthly steps as in the papers' calibrations, with annual figures from an option):
- `bkyParameters` and `byParameters`: the two calibrations of Beeler & Campbell's Table I (check BKY against Bansal, Kiku & Yaron's Table I), each value with its page.
- `epsteinZinTheta(gamma, psi)`: $\theta = (1 - \gamma)/(1 - 1/\psi)$, with the limit at $\psi = 1$ handled or refused (say which).
- `solveLongRunRisk(params)`: $A_0$, $A_1$, $A_2$ for the consumption claim with $\bar z$ from the fixed point of eq. (8) and $\kappa_0$, $\kappa_1$ from $\bar z$; the same for the dividend claim (Appendix); the prices of risk of eq. (11); the market betas; the risk-free rate; and the equity premium of eq. (10), monthly and annualised, at $\sigma_t^2 = \bar\sigma^2$. Solve the fixed points with `rootFind.ts` and report the residual.
- `simulateLongRunRisk(seed, params, options)`: a seeded monthly path of $x_t$, $\sigma_t^2$ (keep it positive and state how, citing Beeler & Campbell's page for their choice), $\Delta c_t$, $\Delta d_t$, the log price–consumption and price–dividend ratios, the market return and the risk-free rate; an option that switches the persistent part off ($x_t \equiv 0$) with the same shocks, so a widget can show consumption with and without it.
- `annualise(monthlyPath)`: annual consumption and dividend growth and annual returns from the monthly path, aggregated as Beeler & Campbell do (monthly levels summed to yearly levels, then growth, then logs; Table II note, p. 35), so model output and annual data are compared alike.
- `varianceRatio(x, horizon)`: the variance of $k$-period sums over $k$ times the one-period variance, for any series; add it to `src/lib/stats/autocorr.ts` with its test, unless `overlapMeanVariance` already gives it, in which case reuse that. `lrrVarianceRatio(params, horizon)`: the exact ratio for $\Delta c$ implied by the AR(1) persistent part at constant volatility, derived in a doc comment.
- `consumptionPredictability(dc, pd, horizons)`: slopes, $t$-statistics and $R^2$ of $k$-year consumption growth on the log price–dividend ratio, as in Beeler & Campbell's Table VI, through `horizonSlopes`; a helper that builds the inputs from `annualConsumption` and `goyalWelchAnnualPresentValue` over the common years (state them).

Notation. §3 gives $\theta$ to the GMM parameter vector, $\rho$ and $\kappa$ to the Campbell–Shiller constants, $\phi$ to AR(1) persistence, $\nu_1$, $\nu_2$ to shrinkage penalties and $\lambda$ to risk premia. Write the papers' $\kappa_1$ and $\kappa_0$ as the §3 $\rho$ and $\kappa$ with a subscript for the claim, because they are the same constants. Then choose symbols for the Epstein–Zin $\theta$ (for example $\theta_{\text{EZ}}$), the persistence of $x_t$ (for example $\phi_x$), the persistence of volatility, the loading of $x_t$ on its shock, the dividend leverage, and the prices of risk; give $x_t$, $\bar\sigma$ and $\sigma_w$ rows. Add each to the "Part X" block of the §3 table, with the clash it avoids and the papers' symbol. The other two Part X library tasks add rows to the same block: whichever merges first creates the block heading; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: `epsteinZinTheta` is 1 when $\gamma = 1/\psi$; with $\gamma = 1/\psi$, no persistent part and constant volatility, the prices of long-run and volatility risk are 0 and the risk-free rate equals `impliedRiskFree` to 1e-10; $A_1 = (1 - 1/\psi)/(1 - \kappa_1\phi_x)$ and the fixed-point residual is below 1e-12; on both calibrations, the mean and volatility of annual consumption growth, the mean excess return, the mean risk-free rate and the mean log price–dividend ratio of a long seeded simulation, put through `annualise`, match the BY and BKY columns of Beeler & Campbell's Table II (p. 35, itself from a 1.2-million-month simulation) within a stated tolerance; $\mathbb{E}[M_{t+1}e^{r_{t+1}}] = 1$ for the market and the risk-free asset within a stated band on a long seeded path; `varianceRatio` of seeded white noise lies within a stated band of 1 and of the model's `lrrVarianceRatio` on a long seeded path; and pinned values on the committed data for `consumptionPredictability` at 1, 3 and 5 years. Reuse `linearisationConstants`, `horizonSlopes`, `predictiveRegression`, `impliedRiskFree` and the RNG helpers; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- The outcome compares the library's moments with Beeler & Campbell's Table II (p. 35) for both calibrations.
- `docs/STYLE_GUIDE.md` §3 has a Part X block with the long-run risks symbols, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/longRunRisk.ts`, its test, `src/lib/stats/autocorr.ts` and its test if `varianceRatio` was added there, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
