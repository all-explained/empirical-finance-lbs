---
id: TASK-138
title: 'Library: rare-disaster pricing, seeded disaster centuries and the relative entropy estimator'
milestone: M-12
state: approved
depends_on: []
delivery: pr
---

## Why


SC-7 and M-12. Chapter 39 shows how a small chance of a large consumption drop can price the equity premium, and then, following Julliard & Ghosh (2012), asks how much disaster risk the data need without assuming its size: it reweights the sample's years so that the Euler equation holds, as close as possible to equal weights. `consumptionPuzzle.ts` prices lognormal power utility and builds the annual sample, but nothing adds a disaster state or solves the entropy problem. No dataset is missing (see the plan outcome), so this task starts at once.

## Scope


Add `src/lib/finance/disasters.ts` and `src/lib/finance/disasters.test.ts`. Read first: the entry of chapter 39 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the SDF and consumption table, the Part IX block, and the Probability and statistics table, which writes probabilities as $\pi$ and keeps $p$ for log prices), `src/lib/finance/consumptionPuzzle.ts` (`annualConsumption`, `annualSample`, `puzzleMoments`, `impliedRiskFree`, `crraSdfMoments`), `src/lib/finance/sdf.ts`, `src/lib/math/rootFind.ts`, `src/lib/math/optimize.ts`, `src/lib/math/distributions.ts` (`chiSquareSurvival`) and `src/lib/math/rng.ts`.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/JulliardGhosh2012.pdf` (working paper; the published author order is Julliard and Ghosh, which the curriculum reverses: cite Julliard & Ghosh (2012), *Review of Financial Studies*, and name working-paper pdf pages) with `pdftotext -layout`, and cite pages in doc comments for anything you take from it: why sample frequencies mislead when rare events are under-represented, p. 5; the empirical likelihood estimator, eq. (3), and its relative entropy reading, eq. (4), p. 6; the exponentially tilted weights, eqs. (5)–(6), p. 7; the dual problem, Appendix A.1.2, p. 32; the calibration method, Section 1.2, p. 8; the annual US data from 1929, p. 8; the US estimates, pp. 10–12 and Table 1, p. 37. Rietz (1988) and Barro (2006) are not in `source/papers/`: name them only where Julliard & Ghosh do (for example p. 2), with their page, and take a number from them only as Julliard & Ghosh report it, with that page. Campbell (2018), Ch. 6, is not in `source/papers/`: take no fact from it.

Functions (decimal log rates per year):
- `disasterPricing(params)`: power utility with i.i.d. lognormal consumption growth plus, with probability $\pi_D$ each year, a drop of a fraction $b_D$ of consumption (the symbols are placeholders; see Notation). Closed forms for $\mathbb{E}[M]$, the log risk-free rate, and the expected excess return of a claim whose disaster loss is an option (equal to $b_D$ for the consumption claim), split into its normal-times part and its disaster part, which carries the term $\pi_D(1 - b_D)^{-\gamma}$ of the curriculum. Derive them in a doc comment from $\mathbb{E}[M R^e] = 0$.
- `requiredDisasterProbability(target, params)`: the $\pi_D$ that matches a target premium at given $b_D$ and $\gamma$, with `bisection`; `null` when no probability in $[0, 1)$ does.
- `simulateDisasterCentury(seed, params, years)`: seeded annual consumption growth and excess returns with rare drops, the number of disasters drawn, and the sample premium, so a widget can show that many centuries contain no disaster.
- `eulerMoments(sample, gamma)`: $g_t(\gamma) = e^{-\gamma\Delta c_t}R^e_t$ from the excess returns of a `ConsumptionSample` (gross excess return $e^{r_t} - e^{r^f_t}$; state it).
- `entropyWeights(g)`: the weights $\pi_t$ that minimise the relative entropy $\sum_t \pi_t\log(T\pi_t)$ subject to $\sum_t \pi_t = 1$ and $\sum_t \pi_t g_t = 0$, through the convex dual (the weights are proportional to $e^{\ell g_t}$ with $\ell$ minimising $\sum_t e^{\ell g_t}$), solved with `newton`; the entropy and the multiplier; `null` when every $g_t$ has the same sign, so no weights exist.
- `empiricalLikelihoodWeights(g)`: the weights of eq. (3), $\pi_t = 1/(T(1 + \ell g_t))$ with $\ell$ from its dual, the log-likelihood and the likelihood-ratio statistic of p. 7 with its $\chi^2(1)$ $p$-value from `chiSquareSurvival`.
- `entropyProfile(sample, gammas)`: for each $\gamma$, the entropy, the statistic, the weights and the weight on the years with the largest consumption falls; the $\gamma$ that minimises each criterion.

Notation. §3 keeps $p$ for log prices and writes probabilities as $\pi$; $b$ is the SDF loading and $\lambda$ a risk premium. Choose the symbols for the disaster probability (for example $\pi_D$), the disaster size (for example $b_D$, always with its subscript) and the dual multiplier (for example $\ell$), and write the entropy weights as $\pi_t$ in the \Prob colour, as §3 does for $\pi(s)$. Add each to the "Part X" block of the §3 table, with the clash it avoids. The other two Part X library tasks add rows to the same block: whichever merges first creates the block heading; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: with $\pi_D = 0$ `disasterPricing` gives the lognormal results of `impliedRiskFree` and `crraSdfMoments` to 1e-12; its closed forms match the means of many seeded draws within a stated band; `requiredDisasterProbability` inverts `disasterPricing` to 1e-10; `entropyWeights` and `empiricalLikelihoodWeights` sum to 1 and satisfy $\sum_t \pi_t g_t = 0$ to 1e-12, give equal weights and zero entropy when the mean of $g$ is 0, match a brute-force `minimize` on a five-point example, and return `null` for one-signed $g$; the statistic of an exact moment is 0; and pinned values on the committed annual data (1930–2025, the default timing of `annualSample`): the entropy-minimising and likelihood-maximising $\gamma$, the entropy at $\gamma = 10$, and the weights of the years 1930–1933. Reuse `annualSample`, `impliedRiskFree`, `crraSdfMoments`, `bisection`, `newton`, `minimize`, `chiSquareSurvival` and the RNG helpers; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- The outcome compares the library's estimates on our annual sample with Julliard & Ghosh's Table 1 (p. 37), and says why they differ (sample years, consumption measure, returns).
- `docs/STYLE_GUIDE.md` §3 has a Part X block with the disaster and entropy symbols, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/disasters.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
