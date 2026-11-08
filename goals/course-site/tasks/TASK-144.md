---
id: TASK-144
title: 'Library: Campbell–Shiller and Fama–Bliss regressions by maturity and a seeded expectations-hypothesis world'
milestone: M-13
state: approved
depends_on: [TASK-143]
delivery: pr
---

## Why


SC-7 and M-13. Chapter 41 tests the expectations hypothesis: does the yield spread forecast the change in long yields with slope 1, and do forward spreads forecast excess returns? It needs the regressions at every maturity with standard errors that respect eleven months of overlap, and a seeded world where the hypothesis holds, so the reader can see how far a sample of our length strays from slope 1 by chance. `predictive.ts` runs return regressions on one predictor and `ols.ts` has Hansen–Hodrick errors; nothing builds the bond regressions. It needs the curve arithmetic of the bond library.

## Scope


Add `src/lib/finance/expectationsHypothesis.ts` and its test file. Read first: the entry of chapter 41 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the "Bonds and the term structure" table, the predictability table and the Probability and statistics table), `src/lib/finance/bonds.ts` (from the library task this task depends on), `src/lib/stats/ols.ts` (`ols` with `errors: 'hansen-hodrick'` and `'newey-west'`), `src/lib/finance/predictive.ts` (`predictiveRegression`, `fitAR1`), `src/lib/stats/autocorr.ts` and `src/lib/math/rng.ts`.

Readings. Open these PDFs with `pdftotext -layout` and cite pages in doc comments for anything you take from them:
- `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CampbellShiller1991.pdf` (NBER working paper 3153, October 1989; cite the 1991 *Review of Economic Studies* article and name working-paper pdf pages; the text layer is OCR and garbled in places, so check every formula and number against the page image, `pdftoppm -png -r 150 -f N -l N`): the expectations hypothesis, eq. (1), pdf p. 6; the yield-change regression and why its slope should be 1, eq. (2), pdf p. 8; the perfect-foresight spread regression, eq. (3), pdf pp. 8–9; the McCulloch data, 1952–1987, pdf p. 15; the results, pdf pp. 16–19, with Table 1a on pdf pp. 28–29 and Table 2 on pdf pp. 31–32; the Monte Carlo under the hypothesis, pdf pp. 20–22; time-varying term premia and the "overreaction" reading, pdf pp. 23–27.
- `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CochranePiazzesi2005.pdf` (published; journal page = pdf page + 137): the Fama–Bliss forward-spread regressions, pdf p. 8 (journal p. 145, Table 2), and the standard errors for overlapping annual returns, pdf p. 6 (Table 1, "HH, 12 lags" and "NW, 18 lags").
Campbell, Lo & MacKinlay (1997), Ch. 10, is not in `source/papers/`: take no fact from it. Fama & Bliss (1987) is not in `source/papers/` either: name it only where Cochrane & Piazzesi or Campbell & Shiller do, with their page.

Functions (annual holding periods on monthly observations, decimal log rates; standard errors Hansen–Hodrick with 12 lags by default, as Cochrane & Piazzesi's Table 1, with options for Newey–West with 18 lags and for non-overlapping annual observations):
- `yieldChangeRegression(curve, n, options)`: $y^{(n-1)}_{t+1} - y^{(n)}_t$ on $(y^{(n)}_t - y^{(1)}_t)/(n - 1)$, the curriculum's Key math; slope, standard error, $t$-statistic against 1 and against 0, $R^2$, the dates used, and the points for a scatter.
- `perfectForesightRegression(curve, n, options)`: the perfect-foresight spread from `perfectForesightYield` minus $y^{(1)}_t$ on the actual spread $y^{(n)}_t - y^{(1)}_t$, slope 1 under the hypothesis.
- `forwardSpreadRegression(curve, n, options)`: $rx^{(n)}_{t+1}$ on $f^{(n)}_t - y^{(1)}_t$, slope 0 under the hypothesis, and the matching regression of $y^{(1)}_{t+n-1} - y^{(1)}_t$ on the same spread, slope 1 under the hypothesis; for $n = 2$ the two slopes sum to 1 (derive why in a doc comment).
- `slopesByMaturity(curve, regression, maturities, options)`: each regression at each maturity, with the value the hypothesis implies.
- `simulateExpectationsWorld(seed, params, options)`: a seeded monthly path of the one-year yield, an AR(1) fitted to the data's one-year yield with `fitAR1`, and long yields priced by the hypothesis on the annual grid, $y^{(n)}_t = \frac1n\sum_{j=0}^{n-1}\mathbb{E}_t y^{(1)}_{t+j} + c^{(n)}$ (closed form from the AR(1)), with an option that adds a time-varying term premium, an independent AR(1) with a loading on each maturity, so the yield-change slope falls below 1 and can turn negative. Return a curve in the shape `gswCurve` returns, so every regression above runs on it unchanged.
- `populationSlope(params, n)`: the yield-change slope the simulated world implies, derived in a doc comment, with and without the term premium.
- `slopeDistribution(seed, params, n, options)`: the slopes of many seeded samples as long as ours under the hypothesis, their quantiles, and the share at or below the data's slope, as Campbell & Shiller's Monte Carlo does (pdf pp. 20–22); state the number of samples and the time one call takes on the test machine, which must stay low enough for a widget button (say what you measured).

Notation. §3 gives $b$ to SDF loadings and predictive slopes, $s$ to states, shares and the log surplus ratio, $S$ to the GMM long-run covariance and the surplus ratio, and $\phi$ to AR(1) persistence. Choose symbols for the yield spread (for example $\mathit{sp}^{(n)}_t$), the perfect-foresight spread, the term-premium constant $c^{(n)}$ and the persistence of the simulated short rate and term premium, and write the regression slopes so they do not read as SDF loadings (say how). Add each to the "Bonds and the term structure" table of §3, with the clash it avoids and the papers' symbol. The other two Part XI library tasks add rows to the same table; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: on a curve simulated without a term premium, the slopes of a very long seeded path are within a stated band of 1 for the yield-change and perfect-foresight regressions and of 0 for the forward-spread regression; with the term premium they are within a stated band of `populationSlope`; the two $n = 2$ forward-spread slopes sum to 1 to 1e-12 on the committed data; the Hansen–Hodrick standard error equals a hand computation on a small fixture; `slopeDistribution` is reproducible from its seed and its median lies near 1; and pinned values on the committed `gsw-zero-coupon` for each regression at $n = 2$, 5 and 10. Reuse `ols`, `fitAR1`, the functions of `bonds.ts` and the RNG helpers; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- The outcome lists the slopes on our data at 2, 5 and 10 years next to the m = 12 column of Campbell & Shiller's Table 1a (pdf p. 28) and Cochrane & Piazzesi's Table 2 (pdf p. 8), marked as theirs, and says why they differ (sample, data, maturities).
- The outcome states the number of samples and the measured time of one `slopeDistribution` call.
- `docs/STYLE_GUIDE.md` §3 "Bonds and the term structure" has rows for the new symbols, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/expectationsHypothesis.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
