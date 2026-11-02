# TASK-127 outcome: consumption samples, lognormal consumption-CAPM pricing and the puzzle numbers

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
  Evidence: `npm test` gives 75 test files and 817 tests passed. `tests/notation.test.ts` passes all 4 checks. The 20 tests in `src/lib/finance/consumptionPuzzle.test.ts` cover every export:
  - `annualConsumption`: $c_t$ and $\Delta c_t$ for 1930 and 1931 match a hand computation from the raw 1929–1931 cells to 1e-12 ($c_{1930} = 8.84344$, $\Delta c_{1930} = -0.04366$).
  - `annualSample`: both timings. `'same-year'` (default) gives 96 years, 1930–2025, with $r_{1930}$ and $r^f_{1930}$ checked against the raw Goyal–Welch cells. `'next-year'` gives return years 1929–2024 and pairs the 1930 return with $\Delta c_{1931}$. `start: 1947` gives 79 years.
  - `quarterlySample`: 295 quarters, 1952-Q2–2025-Q4. Its $\Delta c$ equals `quarterlyPanel`'s on every shared quarter. Its $r^e$ is `quarterlyExcessReturns`. Its 1952-Q2 $r^f$ matches a sum over the April–June 1952 monthly cells to 1e-14.
  - `puzzleMoments`: a three-quarter sample with hand means, standard deviations, $\sigma_{ic}$, correlation and Sharpe ratio, and their annualised values ($\times 4$, $\times 2$).
  - `impliedRiskAversion`: recovers $\gamma = 25$ from moments built with it. `fromSharpe` gives 40 from $SR = 0.4$ and $\sigma_c = 0.01$, the example of Campbell (2014, pdf p. 10).
  - `impliedRiskFree` and `impliedTimeDiscount`: a closed-form value (0.190050 for $\delta = 0.99$, $\gamma = 10$, $\mu_c = \sigma_c = 0.02$), and each inverts the other to 1e-12 on a grid of $\gamma$ and $\delta$.
  - `crraSdfMoments`: closed forms; ratio equals `hjBoundSharpe`. On 200,000 seeded draws (`normalRng(127)`) through `crraSdf`, the sample mean is within 0.2% (about 4 standard errors) and the sample standard deviation within 1% (about 6 standard errors).
  - `crraHjPath`: starts at $(\delta, 0)$ and matches `crraSdfMoments` at each $\gamma$.
  - Pinned puzzle numbers on the committed data (annualised), to a relative 1e-8:

    | Sample | $T$ | $\mu_c$ | $\sigma_c$ | corr | $\mathbb{E}[r - r^f]$ | $\gamma$ (cov.) | $\gamma$ ($SR/\sigma_c$) | $\delta$ at cov. $\gamma$ | $\delta$ at $SR/\sigma_c$ |
    |---|---|---|---|---|---|---|---|---|---|
    | Annual 1930–2025 | 96 | 1.83% | 2.17% | 0.072 | 6.28% | 271.0 | 15.0 | 4.5e-6 | 1.245 |
    | Annual 1929–2024, `'next-year'` | 96 | 1.83% | 2.17% | 0.527 | 6.00% | 35.7 | 14.3 | 1.421 | 1.235 |
    | Annual postwar 1947–2025 | 79 | 1.85% | 1.53% | 0.037 | 7.13% | 898.5 | 28.6 | 2.8e-34 | 1.536 |
    | Quarterly 1952-Q2–2025-Q4 | 295 | 1.94% | 1.77% | 0.046 | 6.72% | 618.3 | 23.9 | 1.7e-21 | 1.445 |
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `astro check` gives `Result (220 files): 0 errors, 0 warnings, 1 hint`. The hint is the unused `Matrix` import in `src/lib/finance/news.ts`, already reported as all-explained/empirical-finance-lbs#88. Static build: `[build] Complete!`.
- [x] `docs/STYLE_GUIDE.md` §3 has a Part IX block with the consumption-moment symbols, and the outcome lists each with the clash it avoids.
  Evidence: two rows added to "### Part IX: consumption data and the equity premium puzzle (Chapters 35–36)", which TASK-128 created. Its rows are kept. The symbols are in the table below.
- [x] `git status --short` shows only `src/lib/finance/consumptionPuzzle.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.
  Evidence: `git diff --name-only origin/main` lists exactly these four files. `git status --short` is empty after the commit.

### New symbols and the clash each avoids

| Symbol | Meaning | Clash it avoids |
|---|---|---|
| $\mu_c$ | Mean of log consumption growth $\Delta c_{t+1}$. | The curriculum writes $g$, but §3 gives $g$ to the GMM moment function $g(x_t, \theta)$ and $g_T$. The subscript separates it from $\mu$, a return's mean, and from the AR(1) intercept $\mu_x$. |
| $\sigma_c$ | Standard deviation of $\Delta c_{t+1}$. | Bare $\sigma$ is a return's standard deviation. |
| $\sigma_i$ | Standard deviation of the log return $r_{i,t+1}$. | Same convention as $\sigma$; the subscript names the asset, as in $R_{i,t+1}$. |
| $\sigma_{ic}$ | $\operatorname{Cov}(r_{i,t+1}, \Delta c_{t+1})$. | Lower-case like $\sigma_{\beta\lambda}$ (Chapter 22), so it never reads as an entry of the return covariance matrix $\Sigma$. The $c$ is consumption, never an asset index. |

The $\mu_c$ row also notes that the curriculum's $r_f = \delta + \dots$ uses $\delta$ as a rate of time preference; §3 keeps $\delta$ as the discount factor and writes $-\log\delta$.

## Summary

**What.** `src/lib/finance/consumptionPuzzle.ts` has these exports:
- `annualConsumption(series)`: log real nondurables and services per person from `fred-consumption-annual`, built as `cayInputs` builds $c_t$, and $\Delta c_t$, from 1930.
- `annualSample(consumption, goyalWelchAnnual, { start, timing })`: $\Delta c$, $r$, $r^f$ and $r^e = r - r^f$ by year.
- `quarterlySample(cayQuarterly, goyalWelchMonthly)`: the same four series by quarter.
- `puzzleMoments(sample, periodsPerYear)`: means, standard deviations, $\sigma_{ic}$, correlation and Sharpe ratio, per period and annualised.
- `impliedRiskAversion`, `impliedRiskFree`, `impliedTimeDiscount`, `crraSdfMoments` and `crraHjPath`.

The module doc comment derives the lognormal formulas from $\mathbb{E}_t[M_{t+1}(1 + R_{t+1})] = 1$.

**Timing.** `'same-year'` is the default: the return of year $t$ goes with $\Delta c_t$. It dates consumption of year $t$ at the end of the year, as the Euler equation dates $R_{t+1}$ and $\Delta c_{t+1}$ together. It is also the pairing of `quarterlySample` and `quarterlyPanel`. `'next-year'` raises the correlation from 0.07 to 0.53 and cuts the covariance-implied $\gamma$ from 271 to 36. The doc comment states this.

**Reuse.** `quarterlySample` gets $r^f$ from `quarterlyExcessReturns` fed `Rfree` in place of `CRSP_SPvw` and `infl` in place of `Rfree`. So it repeats none of that function's quarter grouping. Moments use `arithmeticMean`, `sampleVariance`, `sampleCovariance`, `sharpeRatio`, `annualiseMean`, `annualiseVolatility` and `annualiseSharpe`. The tests use `crraSdf`, `hjBoundSharpe`, `quarterlyPanel`, `quarterlyExcessReturns` and `normalRng`.

**Readings.** Ludvigson (2013, working paper of January 2012): NIPA nondurables and services as the consumption measure (pdf p. 12), and the rejection of joint lognormality (pdf p. 22). Campbell (2014, working paper, pdf p. 10): $SR \approx 0.4$ and $\sigma_c \approx 0.01$ need $\gamma$ near 40. No text is copied. Campbell (2018) and Cochrane (2005) are not used.

**Deviations.**
- The quarterly sample starts in 1952-Q2, not 1952-Q1. `cayInputs` starts in 1952-Q1 (it drops 1951-Q4 for the wealth lag), so the first growth is the next quarter. `quarterlyPanel` starts there too.
- With `'next-year'`, the default sample has return years 1929–2024, so that it uses the same $\Delta c$ years, 1930–2025.
- The moments use $\sigma_i$ and $\sigma_{ic}$ of the log real market return, as in the lognormal Euler equation. The Sharpe ratio is that of the log excess return.

**Verified revision.** The Verify commands (`npm ci`, `npm test`, `npm run build`, `git status --short`) ran on the branch at `origin/main` 92233ed plus this task's files.

**Proposed follow-ups.** None.
