# TASK-136 outcome: library for the Campbell–Cochrane habit model and Gauss–Hermite quadrature

## Acceptance

Verified revision: `32282b9`, rebased on `origin/main` `f9e81d2`, after TASK-137 merged. Verify ran again after the rebase. Later commits change only this file.

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
  Evidence: `src/lib/math/quadrature.test.ts` (7 tests) and `src/lib/finance/habit.test.ts` (25 tests) cover all 13 exports:
  - `gaussHermite`: the closed-form rules of one and two nodes to 1e-14. Every moment up to degree $2n - 1$ is exact for $n$ = 1, 2, 3, 5, 8, 12 and 20, to 1e-9 of the size of the terms. Nodes are symmetric, and the weights sum to $\sqrt\pi$.
  - `normalExpectation`: $\mathbb{E}[e^{aZ}] = e^{a^2/2}$ to 1e-10 for $a$ from −1.5 to 3 with 20 nodes, and $\mathbb{E}[Z^2] = 1$, $\mathbb{E}[Z^4] = 3$, $\mathbb{E}[Z^6] = 15$ with 4 nodes.
  - `campbellCochraneParameters`: the monthly values of Table 1 (p. 13). $\delta^{12} = 0.8958$ from eq. (12), within 0.01 of the table's 0.89.
  - `steadyStateSurplus`, `maxSurplus`: a hand computation, and Table 1's $\bar S = 0.057$ and $S_{\max} = 0.094$ to three decimals.
  - `sensitivity`: $1/\bar S - 1$ at $\bar s$, $\sqrt3/\bar S - 1$ at $\bar s - 1$, and 0 from $s_{\max}$ up.
  - `habitRiskFree`: $12r^f = 0.94\%$ (Table 1) and eq. (12) by hand at other parameters. $\mathbb{E}[M_{t+1}]e^{r^f} = 1$ to 1e-10 by quadrature at all 200 grid points.
  - `localCurvature`: $2/0.057 = 35.088$.
  - `habitLogSdf`: eq. (5) by hand, and power utility when $s$ does not move.
  - `simulateHabit`: the first step by hand from `normalRng(seed)`, $X_t = C_t(1 - S_t)$, and the same path for the same seed.
  - `priceConsumptionRatio`: with the habit off, the closed-form power-utility value $e^a/(1 - e^a)$ to 1e-8 at every grid point. It rises with $s$. It moves by less than 1.5% at $\bar s$ on a grid four times finer. Plus the grid ends and the interpolation.
  - `habitClaimReturns`: monthly and annual values by hand. On 5000 seeded years: the mean price–consumption ratio is 1.5 to 2.5 times Table 2's 18.3 (see "Deviation from Table 2" below), and the Sharpe ratio is within 0.08 of Table 2's 0.43. The slopes of `horizonSlopes` at 1, 2, 3, 5 and 7 years are negative and grow with the horizon, each between 0.5 and 1.2 times Table 5's (p. 23).
  - `habitMarginalUtility`: with $h = 0$, both habits give $C_t^{-\gamma}$. With $h = 0.5$, the internal habit matches a trapezoid integral that does not use Gauss–Hermite.

  Run results: `npm ci` exit 0. `npm test` exit 0, with `Test Files 82 passed (82)` and `Tests 917 passed (917)`. `npx vitest run tests/notation.test.ts` gives `Tests 4 passed (4)`.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: exit 0. `Result (238 files): 0 errors, 0 warnings, 1 hint`, and `37 page(s) built`. The hint is the unused `Matrix` import in `src/lib/finance/news.ts`, outside this task and already reported as #88.
- [x] The outcome states the grid, the stopping rule and the measured time of one `priceConsumptionRatio` solve.
  Evidence: the section "The price–consumption solver" below.
- [x] `docs/STYLE_GUIDE.md` §3 has a Part X block with the habit symbols, and the outcome lists each with the clash it avoids.
  Evidence: six rows added to the Part X block that TASK-138 created. Every row of TASK-138 (disasters) and TASK-137 (long-run risk) is kept. They are listed in the section "Notation" below.
- [x] `git status --short` shows only `src/lib/finance/habit.ts`, `src/lib/math/quadrature.ts`, their tests, `docs/STYLE_GUIDE.md` and this task's outcome file.
  Evidence: before the library commit it printed ` M docs/STYLE_GUIDE.md`, `?? src/lib/finance/habit.test.ts`, `?? src/lib/finance/habit.ts`, `?? src/lib/math/quadrature.test.ts` and `?? src/lib/math/quadrature.ts`. After the commits it prints nothing.

## The price–consumption solver

`priceConsumptionRatio` sums zero-coupon claims: $F^{(0)} = 1$, $F^{(n)}(s) = \mathbb{E}[M_{t+1}e^{\Delta c_{t+1}}F^{(n-1)}(s_{t+1}) \mid s_t = s]$ and $P/C(s) = \sum_{n \ge 1}F^{(n)}(s)$. Each expectation uses `normalExpectation` with 20 nodes, and $F^{(n-1)}$ is linear in $s$ between grid points. The one-step operator is a sparse matrix built once.

- **Grid.** It has 200 points by default:
  - 100 points equally spaced in $S$, $S_i = S_{\max}\,i/100$, where P/C is close to linear in $S$ (the paper's Figure 3, p. 15).
  - Below them, 100 points whose distance below $\bar s$ grows geometrically, down to the $s$ at which $\gamma\sigma_c(1 + \Lambda(s)) = 3$. That quantity is the conditional standard deviation of $\log M_{t+1}$. At Table 1's values the grid runs from $s = -197.4$ to $s_{\max} = -2.37$.
  - The bottom is set by quadrature accuracy. With 20 nodes, $\mathbb{E}[e^{aZ}]$ is right to about 1e-11 for $a \le 3$, but only to 1e-5 at $a = 4.8$. At about $a = 7$, with 60 nodes, the series diverges.
  - Values extend flat beyond the ends of the grid.
- **Stopping rule.** Let $\rho_n = \max_i F^{(n)}_i/F^{(n-1)}_i$. It never rises with $n$, because the operator is positive. So the terms after $n$ sum to at most $F^{(n)}\rho_n/(1 - \rho_n)$. The series stops at the first $n$ with $\rho_n < 1$ where that bound is below $10^{-12}$ times the sum so far at every grid point. It throws after `maxTerms` (100,000) terms.
- **Measured time.** At Table 1's values, one solve sums 3087 terms. Seven solves in a row took 36.2, 31.4, 36.3, 35.0, 33.9, 35.0 and 35.5 ms (Node 26.12 under Vitest, on this Apple Silicon laptop). That is fast enough to recompute while a slider moves. The tests' four-times-finer grid (400 + 400 points) takes about 0.45 s.
- **Accuracy.** P/C($\bar s$) is 34.14 years with the defaults and 33.79 on 400 + 400 points (1.0%). A tail down to $\gamma\sigma_c(1 + \Lambda) = 5$, with 40 nodes, gives 33.49. So the defaults are within about 2%.

## Deviation from Table 2

The converged solution gives a mean price–consumption ratio near twice the paper's. On 5000 seeded years (seeds 1, 2 and 3; annual, time-averaged as in Table 2):

| Statistic | Campbell & Cochrane, Table 2 (p. 20), consumption claim | This library |
|---|---|---|
| $\exp\mathbb{E}[p - c]$ (years) | 18.3 | 35.1 |
| $\sigma(p - c)$ | 0.27 | 0.13–0.14 |
| $\mathbb{E}[r - r^f]$ | 6.64% | 3.8% |
| $\sigma(r - r^f)$ | 15.2% | 8.1–8.2% |
| Sharpe ratio | 0.43 | 0.47 |
| 10 × slope at 1, 2, 3, 5, 7 years (Table 5, p. 23) | −2.0, −3.7, −5.1, −7.5, −9.4 | −1.6, −3.0, −4.2, −5.9, −7.3 (seed 1) |

Why they differ:
- In this model, the prices of long claims depend on rare paths on which $s$ falls far below anything a simulation visits. The SDF term $S_{t+n}^{-\gamma}$ is huge on those paths.
- The bond price checks this. $\mathbb{E}_t[M_{t,t+n}] = e^{-nr^f}$ holds exactly. Yet a Monte Carlo mean over 200,000 seeded paths gives 0.36 for the 20-year bond, against the exact 0.83.
- So a grid must reach far into the low-$s$ tail. Moving its bottom from $s = -7$ to $-200$ lowers P/C($\bar s$) from about 94 years to 34. Below that, the value hardly changes.
- The paper's grid, by its Figure 3 (p. 15), starts near $S = 0.005$ ($s = -5.3$). Its appendix, with the details of the method, is not in `source/papers/`.
- A grid that stops near $S = 0.005$ or $0.001$, with flat or linear extrapolation below, gives P/C($\bar s$) of 75–94 years. Setting the price to zero below $S = 0.005$ gives 12. Neither reproduces the paper's 18. So I could not rebuild the paper's numbers. The library reports the converged solution of the paper's equations instead.
- The shape is the same as in the paper: P/C rises with $S$, the Sharpe ratio matches, and the long-horizon slopes are negative and grow with the horizon. The level and the volatility of prices differ.

For Chapter 37 (TASK-139): read every number from the library, as that spec asks. Say that the model's price level depends on how deep recessions are priced. Do not quote 18.3 as the library's output.

## Notation

Rows added to the Part X block of `docs/STYLE_GUIDE.md` §3:

| Symbol | Clash it avoids |
|---|---|
| $X_t$ (habit) | The payoff $X_{t+1}$ of the SDF table, the undated block $X$ of Chapter 31, and the long-run risk state $x_t$ of Chapter 38. It is always dated, upper-case and next to $C_t$, and Chapter 37 writes no payoff as $X$. |
| $S_t$, $s_t$ (surplus ratio and its log) | The GMM long-run covariance $S$, the state $s$ of $\pi(s)$ and the share $s$ of Chapters 28–34. It is always dated. The paper's local curvature $\eta_t$ is written $\gamma/S_t$, because $\eta_t$ is the conditional SDF intercept of Chapter 22. |
| $\bar S$, $\bar s$ (steady state) | A sample mean such as $\bar R$. Chapter 37 writes no sample mean of $S_t$. |
| $s_{\max}$, $S_{\max}$ (upper bound) | $SR_{\max}$, the APT Sharpe-ratio bound of Chapter 31. |
| $\Lambda(s_t)$ (sensitivity function) | The paper's and the curriculum's $\lambda(s_t)$: $\lambda$ is a risk premium. It always has its argument, so it is not a matrix such as $\Sigma$. |
| $h$ (simple-habit weight) | Log human capital $h_t$. It is undated. |

Reused, not added:
- $\mu_c$ and $\sigma_c$ are the Part IX moments of consumption growth; the paper writes $g$ and $\sigma$, and $g$ is the GMM moment.
- $\phi$ is the AR(1) persistence of the predictability table.

The library follows the same names: `HabitParams` uses `mean` and `sd`, as `impliedRiskFree` and the disaster library do.

## Summary

- **What.** `src/lib/math/quadrature.ts` holds Gauss–Hermite rules by Golub–Welsch on the existing `symmetricEigen`, cached per size, and `normalExpectation`; it has no finance in it. `src/lib/finance/habit.ts` holds the model of Campbell & Cochrane (1999), with the pdf page of each equation in its doc comments.
- **Readings.** All facts come from Campbell & Cochrane (1999), pdf pp. 4–8, 11–15, 20, 23 and 37. Pages were read by rendering them with `pdftoppm` and running `tesseract`, plus one look at Figure 3. Constantinides (1990) and Abel (1990) are only named where the paper names them. Nothing is taken from Campbell (2018).
- **Deviation.** The price level differs from Table 2, as explained above. The test states its band (1.5 to 2.5 times 18.3) and the reason.
- **Limit.** `habitMarginalUtility` needs $e^{\mu_c + \sigma_c z} > h$ at the lowest quadrature node, since under exact normality the internal-habit expectation is not finite. It throws otherwise.
- **Follow-ups.** None proposed. TASK-139 should read the "Deviation from Table 2" section before it writes the chapter's numbers.
