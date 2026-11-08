---
id: TASK-143
title: 'Library: zero-coupon curves, forward and par rates, bond holding returns and the expectations-hypothesis yield'
milestone: M-13
state: approved
depends_on: []
delivery: pr
---

## Why


SC-7 and M-13. Part XI starts from the arithmetic of bonds: prices, yields, forward rates, par yields and the return of buying an n-year bond and selling it a year later. All three chapters of the Part use it, and Part XII builds affine models on it. `src/lib` has no bond code: `src/lib/stats/pca.ts` only turns the GSW yields into monthly changes for Chapter 6. Both datasets the Part needs, `gsw-zero-coupon` and `fred-treasury-monthly`, are committed, so this task starts at once.

## Scope


Add `src/lib/finance/bonds.ts` and `src/lib/finance/bonds.test.ts`. Read first: the entries of chapters 40–42 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the "Bonds and the term structure" table, the Returns and prices table and the Probability and statistics table), the `gsw-zero-coupon` and `fred-treasury-monthly` rows and build notes of `docs/DATA.md`, `src/lib/data/series.ts` (`getColumn`, `betweenDates`), `src/lib/stats/pca.ts` (`gswYieldChanges` and its private `panel`), `src/lib/finance/returns.ts` and `src/lib/finance/predictive.ts` (`fitAR1`).

Readings. Open these PDFs with `pdftotext -layout` and cite pages in doc comments for anything you take from them:
- `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CochranePiazzesi2005.pdf` (the published *American Economic Review* article; journal page = pdf page + 137): the log forward rate, the log holding-period return and the log excess return, pdf p. 4 (journal p. 141).
- `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CampbellShiller1991.pdf` (NBER working paper 3153, October 1989; cite the 1991 *Review of Economic Studies* article and name working-paper pdf pages): the expectations hypothesis as an average of expected short rates plus a constant, eq. (1), pdf p. 6; the perfect-foresight spread, eq. (3), pdf pp. 8–9; coupon bonds as portfolios of zero-coupon bonds, pdf p. 15. The text layer is OCR and garbled in places: check any formula or number against the page image (`pdftoppm -png -r 150 -f N -l N`).
Campbell, Lo & MacKinlay (1997), Ch. 10, and Cochrane (2005), Ch. 19, are books that are not in `source/papers/` (see `docs/READINGS.md`): take no fact from them. Gürkaynak, Sack & Wright (2007) is the data citation of `gsw-zero-coupon`, not a reading: state about it only what `docs/DATA.md` states.

Functions (decimal log rates per year; one period is one year, observed every month):
- `gswCurve(series)`: the dates, the maturities 1–30 and the T × 30 matrix of log yields $y^{(n)}_t$, from `SVENY01`–`SVENY30` (continuously compounded, percent, so $y^{(n)}_t$ is the column over 100). Reuse the panel logic of `pca.ts`; do not copy it (export a shared helper there if needed, with its test).
- `logPrices(curve)`: $p^{(n)}_t = -n\,y^{(n)}_t$. `forwardRates(curve)`: $f^{(1)}_t = y^{(1)}_t$ and $f^{(n)}_t = p^{(n-1)}_t - p^{(n)}_t$.
- `parYields(curve, frequency)`: the coupon rate at which a bond of each maturity is priced at par, from the discount factors $e^{p^{(n)}_t}$. With `frequency: 1` it is exact on the integer grid. With `frequency: 2` (the convention of the Treasury's constant-maturity yields) it needs half-year discount factors: interpolate the log yield linearly between integer maturities and hold it flat below one year, and name that limit in a code comment.
- `holdingReturns(curve, n)`: for each month $t$, $r^{(n)}_{t+1} = p^{(n-1)}_{t+1} - p^{(n)}_t$ and $rx^{(n)}_{t+1} = r^{(n)}_{t+1} - y^{(1)}_t$, where $t + 1$ is the month twelve months later. Match dates by calendar month, never by row offset, and return no value where the later month is missing. The observations overlap by eleven months; say so in the doc comment.
- `returnDecomposition(curve, date, n)`: the exact identity $r^{(n)}_{t+1} = y^{(n)}_t - (n - 1)\,(y^{(n-1)}_{t+1} - y^{(n)}_t)$, derived in a doc comment, split into the yield, the roll-down at an unchanged curve, $-(n - 1)(y^{(n-1)}_t - y^{(n)}_t)$, and the shift of the curve, $-(n - 1)(y^{(n-1)}_{t+1} - y^{(n-1)}_t)$; also the simple return and the excess return. The parts sum to $r^{(n)}_{t+1}$.
- `perfectForesightYield(curve, n)`: $\frac1n\sum_{j=0}^{n-1} y^{(1)}_{t+j}$ from the realised one-year yields $j$ years later (matched by month), and the ex post term premium, the yield minus it. Missing where the sample ends too early.
- `treasuryCurve(series)`: the `fred-treasury-monthly` maturities 1, 2, 3, 5, 7, 10, 20 and 30 years as decimal par yields with semi-annual coupons, and `billBondEquivalent(discountRate, days)`: TB3MS from the discount basis to a bond-equivalent yield (derive the formula in a doc comment from the price of a bill). The rows are not contiguous: the committed file has no months from 1987-01 to 1993-09, because it keeps complete months only and FRED has no 20-year yield then. Keep the dates and never fill the gap. `docs/DATA.md` does not state the gap yet: add it to the coverage cell of the `fred-treasury-monthly` row, with its reason.

Notation. §3 already defines $n$, $P^{(n)}_t$, $p^{(n)}_t$, $y^{(n)}_t$, $f^{(n)}_t$ and $rx^{(n)}_{t+1}$. Add rows to the "Bonds and the term structure" table of §3 for the log holding-period return $r^{(n)}_{t+1}$ (compare the stock return $r_{t+1}$), the par yield, and the ex post term premium (choose a symbol Part XII can keep for the term premium, for example $\mathit{tp}^{(n)}_t$), each with the clash it avoids. Do not start a Part XI block: bond symbols live in that table. The other two Part XI library tasks add rows to the same table; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: on a flat curve every forward rate equals the yield, the annual par yield is $e^{y} - 1$, and the semi-annual one is $2(e^{y/2} - 1)$; $y^{(n)}_t$ is the mean of $f^{(1)}_t, \dots, f^{(n)}_t$ to 1e-14 on the committed data; a par bond priced with the curve's discount factors is worth 1 to 1e-12; the parts of `returnDecomposition` sum to the return to 1e-14; on a curve that never moves, the realised excess return of every maturity equals the roll-down term alone, and on a flat curve that never moves it is 0; `holdingReturns` returns nothing across a missing month (build a fixture with a gap); `perfectForesightYield` of a constant short rate is that rate; `billBondEquivalent` matches a hand computation; pinned values on the committed data for one date (the 1-, 10- and 30-year yields, forwards and annual par yields at the end of 2000) and for `treasuryCurve` at one month; and the GSW semi-annual par yields against the FRED constant-maturity yields of the same months, 1993-10 to 2026-09, within a stated mean absolute gap at 2, 5 and 10 years (report the measured gaps, and say in the doc comment that FRED's yields are monthly averages while GSW's are end of month). Reuse `getColumn`, `betweenDates` and the panel logic of `pca.ts`; do not copy them. Out of scope: chapters, widgets, regressions, and edits to files other than those named (in `docs/DATA.md`, only the coverage cell above).

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- The outcome reports the measured mean absolute gaps between GSW par yields and FRED constant-maturity yields at 2, 5 and 10 years.
- `docs/STYLE_GUIDE.md` §3 "Bonds and the term structure" has rows for the holding-period return, the par yield and the term premium, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/bonds.ts`, its test, `src/lib/stats/pca.ts` and its test if a shared helper was exported there, `docs/STYLE_GUIDE.md`, `docs/DATA.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
