# TASK-143 outcome: bond library for Part XI

## Acceptance

Verified revision: `84c5afb` (the library commit, rebased on `origin/main` ``8031595``). The outcome commit adds
only this file.

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro
  check.
  Evidence: `npm ci` exit 0; `npm test` exit 0, `Test Files 86 passed (86)`, `Tests 964 passed (964)`, including `tests/notation.test.ts`. `src/lib/finance/bonds.test.ts` has 21 tests. Each export and its reference value:

  | Export | Reference value in the test |
  |---|---|
  | `gswCurve` | 479 dates, maturities 1–30; SVENY01, SVENY10, SVENY30 on 2000-12-29 = 5.4462%, 5.3428%, 5.5569% |
  | `logPrices` | $p^{(10)}$ on 2000-12-29 $= -0.53428$ |
  | `forwardRates` | flat curve: every forward is the yield; $y^{(n)}_t$ is the mean of $f^{(1)}_t, \dots, f^{(n)}_t$ to 1e-14 on all 479 × 30 cells; 2000-12-29: $f^{(1)} = 5.4462\%$, $f^{(10)} = 10y^{(10)} - 9y^{(9)} = 5.8666\%$, $f^{(30)} = 5.0958\%$ |
  | `discountFactor` | $e^{-2y^{(2)}}$ on the grid, $e^{-2.5 \cdot 0.03}$ halfway between 2% and 4%, $e^{-0.5y^{(1)}}$ below one year |
  | `parYields` | flat curve: $e^y - 1$ (annual) and $2(e^{y/2} - 1)$ (semi-annual); a par bond priced with the curve's discount factors is worth 1 to 1e-12 at every date and maturity, both frequencies; annual par yields on 2000-12-29: 5.5972%, 5.4433%, 5.6668% at 1, 10, 30 years (an independent Python script gives the same to 1e-15); against FRED, below |
  | `holdingReturns` | flat curve that never moves: $r = y$, $rx = 0$ at every maturity; nothing across a missing month (fixture without 2001-04); 2000-12-29 → 2001-12-31, 10 years: $0.53428 - 9 \times 0.05385$ |
  | `returnDecomposition` | yield + roll-down + shift $= r$ to 1e-14 at every date and maturity, and $r$ equals `holdingReturns`; curve that never moves: shift 0 and $r - y^{(n)}$ = roll-down; 10 years from 2000-12-29: yield 5.3428%, roll-down $-9(y^{(9)} - y^{(10)})$, shift $-9(5.385\% - 5.2846\%)$, $r = 4.963\%$, $rx = -0.4832\%$ |
  | `perfectForesightYield` | a constant short rate is its own perfect-foresight yield; short rates 1%, 2%, 3% give 2% and a term premium of 3% with a 5% yield, and the month whose chain hits the missing month is left out |
  | `billBondEquivalent` | 5% discount, 91 days: $365 \times 0.05/(360 - 4.55) = 5.1343\%$ |
  | `treasuryCurve` | December 2000: GS1…GS30 = 5.60, 5.35, 5.26, 5.17, 5.28, 5.24, 5.64, 5.49%; TB3MS 5.77% → bond-equivalent; 515 rows, 1986-12 followed by 1993-10 |
  | `gswYields` (new in `pca.ts`) | 479 × 30, first row SVENY01 = 7.7914% |

- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `npm run build` exit 0, `Result (250 files): 0 errors, 0 warnings, 1 hint`. The hint is the unused `Matrix` import in `src/lib/finance/news.ts`, outside this task and already reported as #88.
- [x] The outcome reports the measured mean absolute gaps between GSW par yields and FRED constant-maturity yields at 2,
  5 and 10 years.
  Evidence: GSW semi-annual par yields (`parYields(curve, 2)`) against `GS2`, `GS5`, `GS10`, matched by calendar month,
  1993-10 to 2026-09: 388 of FRED's 396 months (8 GSW months are missing). The test pins the gaps to 0.01 bp and
  states the bounds 10, 12 and 15 bp. An independent Python script gives the same three numbers.

  | Maturity | Mean absolute gap | Mean gap, GSW − FRED |
  |---|---|---|
  | 2 years | 9.63 bp | +0.46 bp |
  | 5 years | 11.31 bp | +1.05 bp |
  | 10 years | 14.13 bp | +9.44 bp |

  The doc comments of `treasuryCurve` and the test say that FRED's yields are monthly averages of daily yields and
  GSW's are end of month; most of the absolute gap is the move of the curve inside the month.
- [x] `docs/STYLE_GUIDE.md` §3 "Bonds and the term structure" has rows for the holding-period return, the par yield and
  the term premium; each with the clash it avoids:
  - $r^{(n)}_{t+1}$ (`\Ret`), log holding-period return: its maturity superscript separates it from the stock log
    return $r_{t+1}$.
  - $\mathit{par}^{(n)}_t$, par yield: a coupon rate, not a log yield, so not the $y$ of $y^{(n)}_t$, and not $c$,
    which is log consumption $c_t$.
  - $\mathit{tp}^{(n)}_t$, term premium (ex post in Chapter 40, the model one in Part XII): not Campbell and Shiller's
    $c$, which is log consumption here, nor $\lambda$, a factor risk premium.

  Evidence: `git diff origin/main -- docs/STYLE_GUIDE.md` adds exactly these three rows after the $rx^{(n)}_{t+1}$ row;
  `tests/notation.test.ts` passes (no new macro).
- [x] `git status --short` shows only the allowed files.
  Evidence: before the commits, `git status --short` printed only `docs/DATA.md`, `docs/STYLE_GUIDE.md`, `src/lib/stats/pca.ts`, `src/lib/stats/pca.test.ts`, `src/lib/finance/bonds.ts`, `src/lib/finance/bonds.test.ts` and this file; `git diff --name-only origin/main...HEAD` lists the same seven files, and after the commits `git status --short` prints nothing.

## Summary

**What.** `src/lib/finance/bonds.ts` and its test; a shared `gswYields` helper exported from `src/lib/stats/pca.ts`
(with a test), on which `gswYieldChanges` now builds; three rows in the §3 bonds table of `docs/STYLE_GUIDE.md`; the
1987-01 to 1993-09 gap in the coverage cell of `fred-treasury-monthly` in `docs/DATA.md`.

**How.**
- `gswCurve` reuses the private `panel` of `pca.ts` through `gswYields`; `treasuryCurve` reads columns with
  `getColumn`; the FRED test slices with `betweenDates`. No panel logic is copied.
- Every "one year later" is found by calendar month (a month number from the ISO date), never by row offset, so the
  11 missing GSW months and the FRED gap give no value instead of a wrong one.
- `discountFactor` interpolates the log yield linearly between integer maturities and holds it flat below one year;
  its doc comment names that limit, which only touches `parYields(curve, 2)`.
- `returnDecomposition` computes $r$ from the prices and the three parts separately, so the 1e-14 test checks the
  identity rather than restating it. The derivation is in its doc comment.
- `treasuryCurve` also returns TB3MS as a bond-equivalent yield with 91 days (`bill`); its doc comment names the limit
  that TB3MS is an average of discount rates.
- Readings, opened with `pdftotext -layout`: Cochrane and Piazzesi (2005), pdf p. 4 (journal p. 141), for $f^{(n)}_t$,
  $r^{(n)}_{t+1}$ and $rx^{(n)}_{t+1}$; Campbell and Shiller (1991), working-paper pdf p. 6 (eq. 1), pp. 8–9
  (eq. 3, the perfect-foresight spread) and p. 15 (coupon bonds as portfolios of zero-coupon bonds). Their eq. (1) is
  garbled in the OCR layer; I used only the sentence around it, which states the average of expected short rates plus
  a constant term premium. Nothing is taken from Campbell, Lo and MacKinlay or from Cochrane (2005).

**Deviations.**
- The spec asks that "on a curve that never moves, the realised excess return of every maturity equals the roll-down
  term alone". Taken literally this is false: the excess return is $y^{(n)} + \text{roll-down} - y^{(1)}$. The test
  checks what holds: the shift is 0, the return beyond the bond's own yield, $r^{(n)}_{t+1} - y^{(n)}_t$, is the
  roll-down alone, and the excess return is the forward spread $f^{(n)}_t - y^{(1)}_t$. On a flat curve both are 0,
  as the spec says.
- `holdingReturns` and `returnDecomposition` need $2 \le n \le N$; with $n = 1$ the return is the known $y^{(1)}_t$.

**Out of scope, reported.** Issue #138: the `docs/DATA.md` FRED build note says complete months exclude a GS30 gap in
2002–2006, but the committed file keeps all 49 of those months. Issue #139: `gswYieldChanges` differences consecutive
rows, so 11 of its "monthly" changes span the missing GSW months.

**Follow-ups.** None beyond the two issues.
