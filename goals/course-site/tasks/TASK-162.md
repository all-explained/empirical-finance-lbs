---
id: TASK-162
title: 'Library: the corporate–Treasury spread, its regression on debt to GDP, and a demand curve for safe assets'
milestone: M-14
state: approved
depends_on: [TASK-158]
delivery: pr
---

## Why


SC-7 and M-14. Chapter 46 measures the convenience yield of Treasuries: the Aaa–Treasury spread is low when government debt is plentiful and high when it is scarce, which traces a downward-sloping demand for safe assets. The chapter needs the spread, the regression on log debt to GDP with default controls, and the demand curve with its equilibrium spread for the widget. Nothing in `src/lib` computes yield spreads or reads debt.

## Scope


Add `src/lib/finance/convenience.ts` and its test file. Read first: the entries of chapters 40 and 46 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the "Bonds and the term structure" table with the rows of the earlier Part XII libraries, and the predictability table), the `goyal-welch-annual`, `fred-treasury-monthly` and `fred-debt-gdp-annual` rows and notes of `docs/DATA.md` (the Goyal–Welch note on Bloomberg indices from 2022), `src/lib/data/series.ts`, `src/lib/finance/bonds.ts` (`treasuryCurve`), `src/lib/stats/ols.ts` and `src/lib/math/optimize.ts`.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/KrishnamurthyVissingJorgensen2012.pdf` (working paper of 12 February 2008; cite the 2012 *Journal of Political Economy* article, as `docs/READINGS.md` records, and name working-paper pdf pages; its tables carry Roman numerals) with `pdftotext -layout`, and cite pages in doc comments for anything you take from it: the spread against debt to GDP, 1925–2005 (Figure 1), pdf p. 2; the semi-elasticity and the 72 basis points at a debt ratio of 0.37, pdf p. 3; the spread as default, risk premium and convenience, eqs. (1)–(4), pdf pp. 7–9; the log demand function $\alpha + B\log(\text{Debt}/\text{GDP})$ with $B < 0$, pdf pp. 10–11; the Aaa and long Treasury yields, pdf p. 11; the controls (Baa–Aaa, the slope, stock volatility), pdf pp. 13–14; Table I, pdf p. 45; Table IV, pdf p. 48; the exponential specification (Table VII), pdf p. 51.

Functions (annual data, decimal yields; Newey–West standard errors, lags stated, since annual spreads are persistent):
- `convenienceSample(goyalWelch, debt, options)`: for each year with both, the Aaa–Treasury spread (`AAA` minus `lty` of `goyal-welch-annual`), the Baa–Aaa spread, the slope (`lty` minus `tbl`) and $\log(\text{Debt}/\text{GDP})$; a range option with the paper's years (to 2005) and ours (all years) as named presets. State in the doc comment what `lty` measures as `docs/DATA.md` describes it, and that its source changes from 2022. As a check, the Aaa minus 20-year Treasury spread from `fred-treasury-monthly` (`GS20`, annual average of the months present) over the years both exist, and its correlation with the Goyal–Welch spread.
- `convenienceRegression(sample, controls)`: the spread on a constant and $\log(\text{Debt}/\text{GDP})$, alone and with the Baa–Aaa spread and the slope, as Table I's columns; slopes, standard errors, $R^2$, the fitted line and the points for a scatter.
- `exponentialDemand(sample)`: the paper's exponential form, fitted by nonlinear least squares with `optimize.ts`, and the convenience yield it implies at a given debt ratio (the spread minus its limit as debt grows without bound), as the paper's 72 basis points.
- `demandCurve(params)` and `equilibriumSpread(params, debtToGdp)`: for the widget, a downward-sloping demand for Treasuries in log or exponential form, a vertical supply at the chosen debt ratio, a shifter for the strength of safety demand, and the spread where they meet; also the change in the spread for a one-point rise in debt to GDP (the paper's 1.7 to 3.6 basis points per point, pdf p. 3).

Notation. The curriculum writes $y^{\text{other}}_t - y^{\text{Treas}}_t = a + b\log(\text{Debt}_t/\text{GDP}_t)$; the paper writes $\alpha + B\log(\cdot)$, where §3 has $\alpha$ for a pricing error and $B$ for the beta matrix and $B_n$ for the affine slope, and the paper's $\Theta^T_t$ and $\Delta^*_t$ have no row. Choose symbols for the spread, the debt ratio, the semi-elasticity (a slope with a subscript, as Part XI's $b_{\Delta y}$), the convenience yield and the demand shifter. Add each to the "Bonds and the term structure" table of §3 with the clash it avoids and the paper's symbol. The other Part XII library tasks add rows to the same table; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: on simulated data with a known slope plus seeded noise, `convenienceRegression` recovers it within a stated band; the Newey–West standard error matches a hand computation on a small fixture; `equilibriumSpread` lies on the demand curve at the supply and falls as supply rises; the exponential form's convenience yield is positive and tends to 0 as debt grows; and pinned values on the committed data for both presets (the slope and $R^2$ alone and with controls, and the convenience yield at the last year's debt ratio). Reuse `ols`, the `optimize.ts` minimiser and `getColumn`; do not copy them. Out of scope: chapters, widgets, and edits to files other than those named.

Where jobs run: unit tests on the committed annual files, seconds, on the MacBook.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- The outcome sets our slopes, $R^2$ and convenience yield on the paper's years next to Table I (pdf p. 45), Table VII (pdf p. 51) and the 72 basis points (pdf p. 3), marked as theirs, and says why they differ (the long Treasury yield, the debt series, years).
- `docs/STYLE_GUIDE.md` §3 "Bonds and the term structure" has rows for the new symbols, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/convenience.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
