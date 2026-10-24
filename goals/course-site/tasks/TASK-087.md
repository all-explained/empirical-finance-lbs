---
id: TASK-087
title: 'Library: useless factors, the rank test and GRS-FAR confidence sets'
milestone: M-8
state: approved
depends_on: [TASK-085]
delivery: pr
---

## Why


SC-7 and M-8. Chapter 27 shows that a factor unrelated to returns can look priced in the second pass, tests the rank condition, and builds GRS-FAR confidence sets that stay valid when identification is weak, as Kleibergen & Zhan (2020) do. It needs these functions in `src/lib`, with tests.

## Scope


Add `src/lib/finance/identification.ts` and `src/lib/finance/identification.test.ts`. Read first: the entry of chapter 27 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the Part VI block from the library task this task depends on), `src/lib/finance/crossSection.ts` (`crossSectionalRegression`, `famaMacBeth`, `shankenCorrection`, `simulateTwoPass`), `src/lib/finance/timeSeriesTests.ts` (`timeSeriesRegressions`, `grs`), `src/lib/finance/conditional.ts` (`quarterlyPanel`), `src/lib/math/distributions.ts` and `src/lib/stats/gmm.ts`. Open these PDFs with `pdftotext -layout` and cite pages in doc comments: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/KleibergenZhan2019.pdf` (Kleibergen & Zhan (2020), published version: the one-factor rank test in its Section C and the GRS-FAR statistic, eqs. (21)–(26)) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GospodinovKanRobotti2019.pdf` (Gospodinov, Kan & Robotti (2019): spurious factors in the second pass). `docs/READINGS.md` still says "owner to supply" for Kleibergen & Zhan; the PDF is now in `source/papers/`. Kan & Zhang (1999) is not in `source/papers/`: attribute nothing to it.

Functions:
- `simulateUselessFactor(seed, excess, { samples, strength })`: draw seeded factors of the sample length of `excess` (real returns, $T \times N$), $f_t = s\,m_t + e_t$ with $m_t$ a fixed standardised real return (state which) and $e_t$ seeded noise, so `strength` $s = 0$ gives a useless factor. For each draw run the two-pass regression with an intercept and return $\hat\lambda$, its Fama–MacBeth and Shanken $t$-statistics and the cross-sectional $R^2$.
- `rankTest(excess, factor)`: the one-factor rank test of the paper's Section C (with a zero-beta rate, it tests whether all betas are equal), its F form and p-value.
- `grsFar(excess, factors, lambdaNull)`: the GRS-FAR statistic of eq. (23) at the hypothesised premium $\lambda^{\circ}$, in both forms the paper gives, and the F-scaled statistic of eq. (25) with its p-value. State in a doc comment how the $N - 1$ returns of eqs. (21)–(22) are formed.
- `farConfidenceSet(excess, factor, { grid, q })` (one factor): the grid values of $\lambda^{\circ}$ that GRS-FAR does not reject at level $q$, as intervals, with flags for a set that reaches either end of the grid (unbounded) or is empty. `waldConfidenceSet(excess, factor, { q })`: $\hat\lambda \pm z\,\mathrm{se}$ with Fama–MacBeth and Shanken standard errors.
- `simulateWeakIdentification(seed, { T, N, betaSpread, lambda, samples, grid })`: returns simulated with a known $\lambda$ and a beta spread across assets, and the coverage of the Wald and GRS-FAR sets over the samples, for the `ConfidenceSet` widget.

Tests against reference values, each stated in the test: the two forms of eq. (23) agree to 1e-10; `grsFar` agrees with `grs` run on the regressions of eqs. (21)–(22), to the extent the paper states they are equal (say exactly which identity you test); under a simulated null with i.i.d. normal errors the GRS-FAR rejection rate is within simulation error of 5% at every `betaSpread` (state the band), while Wald coverage falls well below 95% as `betaSpread` goes to 0 (state the numbers); with `strength` 0 the share of $|t| > 1.96$ in `simulateUselessFactor` is far above 5% (state it); same seed, same output; and pinned values on the committed data: the rank test p-value and the GRS-FAR set for $\Delta c$ and for Mkt-RF on the quarterly 25 portfolios of `quarterlyPanel` from 1963-Q3. Reuse `timeSeriesRegressions`, `grs`, `crossSectionalRegression`, `famaMacBeth`, `shankenCorrection`, `fSurvival`, `chiSquareSurvival`, `invCdf` and the RNG helpers; do not copy them. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/identification.ts`, its test and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
