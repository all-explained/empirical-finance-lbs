---
id: TASK-127
title: 'Library: consumption samples, lognormal consumption-CAPM pricing and the puzzle numbers'
milestone: M-11
state: approved
depends_on: [TASK-126]
delivery: pr
---

## Why


SC-7 and M-11. Chapter 35 measures consumption growth and market returns, and asks what risk aversion the power-utility SDF needs to price the equity premium, what risk-free rate that risk aversion implies, and how the model's Hansen–Jagannathan ratio grows with risk aversion. `src/lib/finance/sdf.ts` prices on finite states and has the HJ bound, and `cayInputs` builds quarterly log real consumption per person, but nothing gives the lognormal closed forms or the annual sample. Chapter 36 reuses the samples and the implied risk aversion.

## Scope


Add `src/lib/finance/consumptionPuzzle.ts` and `src/lib/finance/consumptionPuzzle.test.ts`. Read first: the entries of chapters 35 and 36 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the SDF and consumption table, and the Part VI to Part VIII blocks), `docs/DATA.md` (consumption, cay inputs and Goyal–Welch notes), `src/lib/finance/sdf.ts` (`crraSdf`, `hjBoundSharpe`), `src/lib/finance/cay.ts` (`cayInputs`, `quarterlyExcessReturns`), `src/lib/finance/conditional.ts` (`quarterlyPanel`, the consumption growth chapters 22, 26 and 33 use), `src/lib/stats/moments.ts`, `src/lib/data/series.ts` and `src/components/plots/sdfSamples.ts` (the assumed consumption moments of chapter 8's `HJBound`, which this library replaces with measured ones).

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Ludvigson2013.pdf` (Ludvigson (2013), working paper of January 2012; the puzzle and the Euler-equation errors are on pdf pages 12–22) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Campbell2014.pdf` (Campbell (2014), working paper; the puzzle is on pdf page 10) with `pdftotext -layout`, and cite pages in doc comments for anything you take from them. The curriculum's readings Campbell (2018) and Cochrane (2005) are not in `source/papers/` (see `docs/READINGS.md`): take no fact from them. The lognormal formulas are textbook algebra; derive them in a doc comment from $\mathbb{E}_t[M_{t+1}(1 + R_{t+1})] = 1$ and cite no reading for them.

Samples (decimal log real rates per period):
- `annualConsumption(series)`: log real nondurables and services per person from `fred-consumption-annual`, built as `cayInputs` builds $c_t$ (each component deflated by its own price index, then added; per person), and its growth $\Delta c_t$.
- `annualSample(consumption, goyalWelchAnnual, options)`: year-by-year $\Delta c$, the log real market return $\log(1 + \text{CRSP\_SPvw}) - \log(1 + \text{infl})$, the log real risk-free rate from `Rfree` and `infl`, and the log excess return, over the common years (1930 to 2025 by default; an option for the start year, so the chapter can show the postwar sample). Annual NIPA consumption is a yearly average, so the timing of returns against consumption matters: support the two conventions the literature uses (the return of year $t$ against $\Delta c_t$, and against $\Delta c_{t+1}$), state which is the default and why in a doc comment, and test both.
- `quarterlySample(cayQuarterly, goyalWelchMonthly)`: the same four series by quarter from 1952-Q1, reusing `cayInputs` and `quarterlyExcessReturns` (add the real risk-free rate from the monthly `Rfree` and `infl` in the same way); do not repeat their code.
- `puzzleMoments(sample, periodsPerYear)`: means, standard deviations, the covariance $\sigma_{ic}$ and correlation of $\Delta c$ with the log market return, the mean log real risk-free rate and the Sharpe ratio, per period and annualised (reuse `annualiseMean` and `annualiseVolatility`).

Pricing under lognormal power utility, $M_{t+1} = \delta\,e^{-\gamma\Delta c_{t+1}}$:
- `impliedRiskAversion(moments)`: $\gamma = (\mathbb{E}[r_i - r_f] + \tfrac12\sigma_i^2)/\sigma_{ic}$, and the bound-style value $\gamma \approx SR/\sigma_c$ that holds when the correlation is one.
- `impliedRiskFree(delta, gamma, mean, sd)` and `impliedTimeDiscount(riskFree, gamma, mean, sd)`: the log risk-free rate $-\log\delta + \gamma\mu - \tfrac12\gamma^2\sigma_c^2$ and its inverse, the $\delta$ that matches a given rate (above one is the risk-free rate puzzle).
- `crraSdfMoments(delta, gamma, mean, sd)`: the exact lognormal $\mathbb{E}[M]$, $\sigma(M)$ and $\sigma(M)/\mathbb{E}[M] = \sqrt{e^{\gamma^2\sigma_c^2} - 1}$, and `crraHjPath(gammas, delta, mean, sd)`, the curve these trace in the $(\mathbb{E}[M], \sigma(M))$ plane as $\gamma$ rises, for the `HJBound` preset of chapter 35.

Notation. The style guide uses $\delta$ for the time-discount factor, $M_{t+1} = \delta(C_{t+1}/C_t)^{-\gamma}$, while the curriculum's $r_f = \delta + \gamma g - \tfrac12\gamma^2\sigma_c^2$ uses $\delta$ for the rate of time preference: follow §3 and write $-\log\delta$. §3 gives $g$ to the GMM moment function: choose the symbols for the mean and standard deviation of $\Delta c$ (for example $\mu_c$ and $\sigma_c$) and for $\sigma_{ic}$, check each against §3, and add them to one "Part IX" block of the §3 table, each with the clash it avoids. The other Part IX library task adds rows to the same block: whichever merges first creates the block heading; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: `annualConsumption` on the first years matches a hand computation from the raw cells; `crraSdfMoments` matches the moments of `crraSdf` over many seeded normal draws (state the tolerance); `impliedRiskFree` and `impliedTimeDiscount` invert each other to 1e-12; `impliedRiskAversion` recovers $\gamma$ from moments built with a known $\gamma$; `quarterlySample` agrees with `quarterlyPanel` on the shared quarters; and pinned values on the committed data for the annual 1930–2025 sample, the annual postwar sample and the quarterly sample: $\mu_c$, $\sigma_c$, the correlation, the equity premium, the implied $\gamma$ both ways, and the $\delta$ that matches the mean risk-free rate at that $\gamma$. Reuse `crraSdf`, `hjBoundSharpe`, `cayInputs`, `quarterlyExcessReturns`, the moments helpers and the RNG helpers of `src/lib/math/rng.ts`; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- `docs/STYLE_GUIDE.md` §3 has a Part IX block with the consumption-moment symbols, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/consumptionPuzzle.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
