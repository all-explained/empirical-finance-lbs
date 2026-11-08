# TASK-138 outcome: library for rare disasters and the relative entropy estimator

## Acceptance

Verified on branch `goal/course-site/task-138`, based on `origin/main` `7bddfe4`.

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
  Evidence: `src/lib/finance/disasters.test.ts` has 23 tests covering all seven exports:
  - `disasterPricing`: with $\pi_D = 0$ it matches `impliedRiskFree` and `crraSdfMoments` to 1e-12. It matches hand-computed closed forms to 1e-12. It matches the means of 400,000 seeded years within four standard errors.
  - `requiredDisasterProbability`: it inverts `disasterPricing` to 1e-10 for two claims. A pinned value: 7.92% for a 6% premium. It peaks at $\pi^*$, and it returns null beyond the peak or below the normal part.
  - `simulateDisasterCentury`: its disasters match the `mulberry32(seed)` draws, its premium is recomputed by hand, and it is deterministic. The share of centuries with no disaster is $0.983^{100}$ within four standard errors.
  - `eulerMoments`: the 1930 cell, from the raw cells.
  - `entropyWeights` and `empiricalLikelihoodWeights`: the weights sum to 1 and price $g$ to 1e-12 for $\gamma$ from 0 to 100. Both give equal weights when the mean of $g$ is 0, and both return null for one-signed $g$. Both match a brute-force `minimize` on five points. The statistic of an exact moment is 0.
  - `entropyProfile`: pinned values on the annual data, listed in the table below.

  Run results: `npm ci` exit 0. `npm test` exit 0, with `Test Files 79 passed (79)` and `Tests 864 passed (864)`. `npx vitest run tests/notation.test.ts` gives `Tests 4 passed (4)`.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: exit 0. `Result (232 files): 0 errors, 0 warnings, 1 hint`, and `37 page(s) built`. The hint is the unused `Matrix` import in `src/lib/finance/news.ts`. It is outside this task and already reported as #88.
- [x] The outcome compares the library's estimates on our annual sample with Julliard & Ghosh's Table 1 (p. 37), and says why they differ.
  Evidence: the section "Comparison with Julliard & Ghosh (2012), Table 1" below.
- [x] `docs/STYLE_GUIDE.md` §3 has a Part X block with the disaster and entropy symbols, and the outcome lists each with the clash it avoids.
  Evidence: the new block "Part X: habits, long-run risk and disasters (Chapters 37–39)" sits after Part IX. Its rows are listed in the section "Notation" below.
- [x] `git status --short` shows only `src/lib/finance/disasters.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.
  Evidence: before the commit it printed ` M docs/STYLE_GUIDE.md`, `?? src/lib/finance/disasters.test.ts`, `?? src/lib/finance/disasters.ts` and this file. After the commit it prints nothing.

## Comparison with Julliard & Ghosh (2012), Table 1

Panel A of Table 1 (p. 37) uses one moment: the market excess return. The library computes the same objects.
- **EL estimate:** the $\gamma$ that minimises $\mathit{LR}(\gamma)$.
- **BETEL estimate:** the $\gamma$ that minimises $\mathit{KL}(\gamma)$.
- **Test at $\gamma = 10$:** $\mathit{LR}(10)$ against $\chi^2_1$.

There is one moment and one parameter. So both criteria reach 0 at the $\gamma$ where the sample mean of $g_t(\gamma)$ is 0, and the two estimates coincide. The paper's EL estimate and BETEL mode also coincide, both at 28.5. The values come from `entropyProfile` on a grid of $\gamma$ from 0 to 60 in steps of 0.5, refined by `minimize`. The test file pins them all.

| | Julliard & Ghosh, Table 1, Panel A | Ours, returns 1930–2025 | Ours, returns 1930–2009 |
|---|---|---|---|
| Observations | 1929–2009 | 96 | 80 |
| EL $\hat\gamma$ | 28.5 (s.e. 9.23) | 42.84 | 35.67 |
| BETEL $\hat\gamma$ | 28.5, 95% band [11.5, 46.6] | 42.84 | 35.67 |
| $\chi^2_1$ test at $\gamma = 10$ ($p$-value) | 4.31 (0.038) | 8.63 (0.0033) | 4.85 (0.028) |

On our full sample, the tilted weights at $\gamma = 10$ give $T\pi_t$ = 2.25, 3.12, 1.57 and 0.34 to the years 1930–1933. The weights rise in 1930–1932, when stocks fell along with consumption. They fall in 1933, when consumption fell but stocks rose. The relative entropy is 0.0541.

Both samples reject $\gamma = 10$ at the 5% level and need a $\gamma$ far above 10, as the paper does. Our numbers are higher for three reasons:
1. **Sample years.** We have 16 more years (2010–2025), with a high realised premium. The mean log excess return is 6.28% over 1930–2025 and 5.14% over 1930–2009. Our first return year is 1930, because the consumption extract starts in 1929, so its first growth rate is for 1930. Cutting the sample to 2009 moves $\hat\gamma$ from 42.8 to 35.7 and the statistic from 8.63 to 4.85. That brings the test close to the paper's 4.31.
2. **Consumption measure.** We use nondurables plus services per person. Each is deflated by its own chain-type price index (`annualConsumption`). Julliard & Ghosh use nondurables alone, per capita and real (p. 9). Services are smoother than nondurables. Adding them likely weakens the link between $\Delta c$ and returns (the correlation is 0.07 on our sample), which raises the $\gamma$ that the moment needs. We did not test this, because the extract has no nondurables-only series per person deflated as the paper does.
3. **Returns.** We use the Goyal–Welch `CRSP_SPvw`, the CRSP value-weighted S&P 500 return with dividends, and the T-bill `Rfree`. Both are deflated by CPI inflation `infl`. Julliard & Ghosh use the CRSP value-weighted index of all NYSE, AMEX and NASDAQ stocks and the one-month T-bill, compounded from monthly returns and deflated by the PCE deflator (p. 9).

Both use the end-of-period timing (p. 9), which is the default 'same-year' timing of `annualSample`. A one-off probe with the 'next-year' timing over 1929–2009 gives $\hat\gamma = 17.8$, which shows how much the timing matters. That number is not pinned.

## Notation

These are the rows of the new Part X block in `docs/STYLE_GUIDE.md` §3, with the clash each one avoids.

| Symbol | Clash it avoids |
|---|---|
| $\pi_D$ (`\Prob`), the chance of a disaster each year | The curriculum writes $p$, which is a log price. The subscript separates it from the state probability $\pi(s)$ and from the weights $\pi_t$. |
| $b_D$, the fraction of consumption a disaster takes | The curriculum writes $b$, which is already the SDF loadings of Part VI and a predictive slope. It always keeps its subscript. |
| $b_{D,i}$, the fraction of claim $i$'s value a disaster takes | The $D$ keeps it apart from an SDF loading $b$. It equals $b_D$ for the claim to consumption. |
| $\mathbb{I}_{D,t+1}$, the disaster indicator | $J$ is the GMM statistic of Part VI, and $\mathbf{1}$ is the vector of ones. |
| $g_t(\gamma) = e^{-\gamma\Delta c_t}R^e_t$, the Euler moment | Not a new letter: it is the moment at $t$ of Chapter 24, with $\theta = \gamma$. It is not the curriculum's $g$ for mean growth, which Part IX writes as $\mu_c$. |
| $\pi_t$ (`\Prob`), the weight of year $t$ | The paper writes $p_t$, which is a log price. The date separates it from $\pi(s)$ and $\pi_D$. |
| $\ell$, the dual multiplier | The paper writes $\lambda$, which is a risk premium here. It stays bare, so it never reads as the eigenvalue $\ell_k$. |
| $\mathit{KL}(\gamma)$, the relative entropy | The paper writes $K(p, F)$, but $K$ counts factors. It is not the entropy $L(X)$ of Part III. |
| $\mathit{LR}(\gamma)$, the likelihood-ratio statistic | The paper writes $\mathit{elr}(\gamma)$. It is not $J$, the GMM statistic. |

## Summary

**What.** `src/lib/finance/disasters.ts` has seven exports.
- `disasterPricing` gives the closed forms for $\mathbb{E}[M]$, $r^f$ and the premium $\log\mathbb{E}[1 + R] - r^f$. The premium splits into $\gamma\sigma_{ic}$ and a disaster part, derived in the doc comment from $\mathbb{E}[MR^e] = 0$.
- `requiredDisasterProbability` finds the needed $\pi_D$.
- `simulateDisasterCentury` draws seeded centuries.
- `eulerMoments`, `entropyWeights` and `empiricalLikelihoodWeights` build the moments and the two sets of weights.
- `entropyProfile` runs both estimators across a grid of $\gamma$.

The code reuses `annualSample` (through the `ConsumptionSample` type), `bisection`, `newton`, `minimize`, `chiSquareSurvival`, `mulberry32`, `normalRng` and `arithmeticMean`. The tests reuse `impliedRiskFree` and `crraSdfMoments`.

**How.**
- **Premium peak.** The premium as a function of $\pi_D$ is not monotone. It equals $\gamma\sigma_{ic}$ at $\pi_D = 0$ and again at $\pi_D = 1$. Its derivative vanishes at $\pi^* = 1/(1 + \sqrt{(1 - b_D)^{-\gamma}(1 - b_{D,i})})$, a closed form derived in the doc comment. So `requiredDisasterProbability` bisects on $[0, \pi^*]$ and returns the smallest root.
- **Entropy weights.** `newton` solves the first-order condition of $\sum_t e^{\ell g_t}$, starting at $\ell = 0$. It works on $g/\max|g|$ and shifts the exponent for stability.
- **Empirical likelihood weights.** The multiplier lies in a known bracket, the $\ell$ where every $1 + \ell g_t \ge 1/T$. Bisection on that bracket always converges, while Newton can jump out of it.
- **Results.** On the annual data, the constraints hold to about 1e-16 for $\gamma$ from 0 to 100.

**Deviations.**
- **Sign of the statistic.** The library writes the statistic of p. 7 as $-2(\sum_t\log\pi_t + T\log T)$. This sign makes it nonnegative, as a $\chi^2_1$ statistic must be, since $\sum_t\log\pi_t \le -T\log T$.
- **Profile weights.** `entropyProfile` reports the entropy (BETEL) weights as "the weights", because the widget `EntropyReweighting` shows them. Its worst-year weight sums the four largest consumption falls by default. On our data those are 1930, 1932, 1933 and 2020, not 1930–1933, and the test pins the four years.
- **Excluded points.** A $\gamma$ at which $g_t$ is one-signed is left out of `points`.
- **Optimiser precision.** `best` is refined by Nelder–Mead, which is good to about 1e-5 in $\gamma$. So the tests pin it to three decimals.

**Readings.**
- Rietz (1988) and Barro (2006) are named only where Julliard & Ghosh name them (p. 2).
- The test calibration takes $\gamma = 4$ and $\pi_D = 1.7\%$, the "standard calibration" that Julliard & Ghosh attribute to the literature after Barro (2006), p. 16. $\mu_c$, $\sigma_c$ and $b_D = 0.3$ are round numbers of our own.
- Nothing is taken from Campbell (2018).

**Follow-ups.** None needed for Chapter 39. The chapter can call `simulateDisasterCentury` for `DisasterLottery`. It can call `entropyProfile` on `annualSample` for `EntropyReweighting`. The curriculum's "worst quarters" would need `quarterlySample`, which `eulerMoments` also accepts.
