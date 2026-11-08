---
id: TASK-136
title: 'Library: the Campbell–Cochrane habit model, its price–consumption ratio and Gauss–Hermite quadrature'
milestone: M-12
state: approved
depends_on: []
delivery: pr
---

## Why


SC-7 and M-12. Chapter 37 builds the Campbell–Cochrane model: a slow-moving external habit, the surplus consumption ratio, a sensitivity function that keeps the risk-free rate constant, and a price–consumption ratio that falls when the surplus is low, so that returns become predictable. `src/lib/finance/sdf.ts` and `consumptionPuzzle.ts` price only power utility, and nothing in `src/lib` solves a model on a grid or takes an expectation over a normal shock by quadrature. The maths needs no dataset, so this task starts at once.

## Scope


Add `src/lib/finance/habit.ts`, `src/lib/math/quadrature.ts` and a test file for each. Read first: the entry of chapter 37 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the SDF and consumption table, the predictability table where $\phi$ is AR(1) persistence, the Part IX block and the Probability and statistics table), `src/lib/finance/consumptionPuzzle.ts` (`impliedRiskFree`, `crraSdfMoments`), `src/lib/finance/sdf.ts`, `src/lib/finance/predictive.ts` (`predictiveRegression`, `horizonSlopes`), `src/lib/stats/var.ts`, `src/lib/math/rootFind.ts` and `src/lib/math/rng.ts`.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CampbellCochrane1999.pdf` (Campbell & Cochrane, author manuscript dated May 1998; cite the 1999 *Journal of Political Economy* article and name manuscript pdf pages). Its fonts are scrambled, so `pdftotext` prints nonsense: render a page with `pdftoppm -png -r 150 -f N -l N` and read the image, or run `tesseract` on it. Cite pages in doc comments for anything you take from it: preferences, eq. (1), pdf p. 4; the surplus consumption ratio and its law of motion, eqs. (2)–(3), and i.i.d. consumption growth, eq. (4), p. 5; marginal utility and the SDF, eq. (5), p. 6; the risk-free rate, eq. (8), p. 7; the sensitivity function, the steady state and the upper bound on the surplus, eqs. (9)–(12), p. 8, with the conditions behind them on p. 9; the prices of long-lived assets, solved numerically on a grid, p. 11; the parameter choices, Section II.E, p. 12, and Table 1, p. 13; internal habit formation, Section IV.C, p. 37. Campbell (2018), Ch. 6, is not in `source/papers/` (see `docs/READINGS.md`): take no fact from it. Constantinides (1990) and Abel (1990) are not in `source/papers/` either: name them only where Campbell & Cochrane do, with their page.

Functions (decimal log rates per period; one period is a month unless an option says otherwise, as in Campbell & Cochrane's simulations; state the conversion from their annual Table 1 values in a doc comment):
- `quadrature.ts`: `gaussHermite(n)`, the nodes and weights of $n$-point Gauss–Hermite quadrature, and `normalExpectation(f, n)`, $\mathbb{E}[f(Z)]$ for $Z \sim N(0, 1)$. Generic maths; no finance in this file.
- `campbellCochraneParameters`: Table 1 of the paper (mean and volatility of consumption growth, the risk-free rate, $\phi$, $\gamma$ and the implied $\delta$), each value with its page.
- `steadyStateSurplus(params)` and `maxSurplus(params)`: $\bar S$ and $s_{\max}$ of eqs. (9) and (11).
- `sensitivity(s, params)`: eq. (10), zero above $s_{\max}$.
- `habitRiskFree(params)`: the constant log risk-free rate of eq. (12); `localCurvature(surplus, gamma)`: $\gamma/S_t$.
- `habitLogSdf(s, sNext, dc, params)`: $\log M_{t+1}$ from eq. (5).
- `simulateHabit(seed, params, options)`: a seeded path of $\Delta c_t$, $s_t$ (starting at $\bar s$), $S_t$, the habit $X_t$ and $\log M_t$.
- `priceConsumptionRatio(params, options)`: the price–consumption ratio of a claim to consumption as a function of $s$ on a grid, by the series of zero-coupon claims, $F_0(s) = 1$, $F_n(s) = \mathbb{E}[M_{t+1}e^{\Delta c_{t+1}}F_{n-1}(s_{t+1}) \mid s_t = s]$, $P/C(s) = \sum_{n \ge 1} F_n(s)$, with `normalExpectation` over the shock and linear interpolation in $s$; state the grid, the stopping rule and the time one solve takes on the test machine, which must stay low enough for a widget slider (say what you measured). Return the grid, the values and an evaluator.
- `habitClaimReturns(path, solution)`: the log price–consumption ratio and the log return and excess return of the consumption claim along a simulated path, time-aggregated to years as an option, so a chapter can run predictive regressions on model data with `predictiveRegression` and `horizonSlopes` (reuse them in the tests; do not copy them).
- `habitMarginalUtility(path, options)`: marginal utility under an external habit and under an internal habit, both with the simple habit $X_t = hC_{t-1}$, on a given consumption path; the internal one subtracts the effect of today's consumption on tomorrow's habit, $\delta h\,\mathbb{E}_t[(C_{t+1} - hC_t)^{-\gamma}]$, taken by `normalExpectation` under i.i.d. lognormal growth. Derive both in a doc comment and cite p. 37 for the comparison.

Notation. §3 gives $\lambda$ to risk premia, $g$ to the GMM moment function and $s$ to a share in Chapter 28. Choose the symbol for the sensitivity function (for example $\Lambda(s_t)$), write the mean and volatility of consumption growth as the Part IX $\mu_c$ and $\sigma_c$, keep $\phi$ for the persistence of $s_t$ only if it reads as the AR(1) persistence of §3 (it is), and give $S_t$, $s_t$, $\bar s$, $s_{\max}$, $X_t$ and $h$ rows. Add each to one "Part X" block of the §3 table, with the clash it avoids. The other two Part X library tasks add rows to the same block: whichever merges first creates the block heading; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: `gaussHermite` integrates polynomials up to degree $2n - 1$ exactly and gives $\mathbb{E}[e^{aZ}] = e^{a^2/2}$ to 1e-10; $\bar S$, $s_{\max}$ and the risk-free rate on `campbellCochraneParameters` match a hand computation and the values Table 1 reports (name the page); at every grid point $\mathbb{E}[M_{t+1}]e^{r^f} = 1$ to 1e-10 by quadrature, which checks eq. (12); with the habit switched off (an option that sets $S_t \equiv 1$) `priceConsumptionRatio` equals the closed-form power-utility value to 1e-8; the price–consumption ratio rises with $s$; its mean on a long seeded path lies within a stated band of the paper's simulated mean (name the table and page); the slope of long-horizon excess returns on the log price–consumption ratio in a long seeded simulation is negative and grows with the horizon, as Table 5 (p. 23) reports; `habitMarginalUtility` with $h = 0$ is power-utility marginal utility; and the same seed gives the same path. Reuse the RNG helpers of `src/lib/math/rng.ts`, `predictiveRegression` and `horizonSlopes`; do not copy them. Out of scope: chapters, widgets, data loading and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- The outcome states the grid, the stopping rule and the measured time of one `priceConsumptionRatio` solve.
- `docs/STYLE_GUIDE.md` §3 has a Part X block with the habit symbols, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/habit.ts`, `src/lib/math/quadrature.ts`, their tests, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
