# TASK-145 outcome: the Cochrane–Piazzesi tent factor library

## Acceptance

Verified revision: `9f0495c` (the library commit, rebased on `origin/main` `323c68b`; an earlier rebase after
TASK-144 merged kept both sets of bond rows in `docs/STYLE_GUIDE.md`). The outcome commit adds only this file. Every job ran on the MacBook: unit tests and the build on committed data of a few hundred rows; no cluster
or PC job was needed.

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro
  check.
  Evidence: `npm test` exit 0, 89 files and 1028 tests passed. `src/lib/finance/bondRiskPremia.test.ts` has 14 tests and
  `src/lib/stats/pca.test.ts` one new test. An independent numpy script, from the JSON file alone, gives the same
  weights, $R^2$, loadings, Hansen–Hodrick standard errors, variance shares and factor shares to the digits pinned.

  | Export | Reference value in the test |
  |---|---|
  | `cpInputs` | 455 months, 1985-11-29 to 2025-09-30; the row of 2000-12-29 by hand from SVENY01–05 then and on 2001-12-31: $f^{(n)} = n y^{(n)} - (n-1) y^{(n-1)}$ and $rx^{(n)}$, to 1e-14; average excess return $(2.7613 + 3.5262 + 3.3819 + 2.9336)/4$ percent; 1990-03 is left out (no 1991-03 on the curve); bad ranges and a curve shorter than 5 years throw |
  | `tentFactor` | seeded data, $rx^{(n)} = b^{(n)}\vartheta'\mathbf{f}_t + 0.002z$ with a tent like Table 1A: weights within 0.02 (constant within 0.002); $\mathit{cp}_t = \vartheta'\mathbf{f}_t$ to 1e-14; the default errors equal `ols` Hansen–Hodrick with 12 lags, the option Newey–West with 18; Hansen–Hodrick standard errors on the full sample, pinned (numpy agrees) |
  | `singleFactorLoadings` | seeded data: $b^{(n)}$ within 0.02 of 0.47, 0.87, 1.24, 1.42, restricted and unrestricted $R^2$ within 0.01; the loadings average to 1 to 1e-12 on all three default ranges; the restricted $R^2$ is the centred one |
  | `yieldFactorForecasts` | five-component $R^2$ = the tent's $R^2$ to 1e-10; variance shares and factor shares each sum to 1; shares and $R^2$ on the full sample pinned (numpy agrees) |
  | `subsampleTents`, `defaultRanges` | weights, $R^2$ and loadings on each default range pinned to 5e-4 (numpy agrees to 4 decimals); a custom range equals `tentFactor` on its inputs, options passed on |
  | `gswYieldLevels` (in `pca.ts`) | SVENY05 and SVENY01 of the first row in the order asked; differenced, the 30 levels equal `gswYieldChanges` to 1e-14; bad maturities throw |

- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `npm run build` exit 0, `Result (258 files): 0 errors, 0 warnings, 1 hint`. The hint is the unused
  `Matrix` import in `src/lib/finance/news.ts`, outside this task and already reported as #88.

- [x] The outcome compares the weights, $R^2$ and loadings on each default range with Cochrane & Piazzesi's Table 1
  (p. 143), marked as theirs, says whether our weights are tent-shaped, and says why they may differ.
  Evidence: the three tables below and the paragraphs after them.

- [x] `docs/STYLE_GUIDE.md` §3 "Bonds and the term structure" has rows for the new symbols, and the outcome lists each
  with the clash it avoids.
  Evidence: `git diff origin/main -- docs/STYLE_GUIDE.md` adds five rows after the $\mathit{tp}^{(n)}_t$ row; their 24
  formulas render in KaTeX with `throwOnError`; `tests/notation.test.ts` passes (no new macro).
  - $\mathbf{f}_t$, the forward-rate vector with its intercept: the paper's $f_t$ is a vector of factors here. Bold,
    like $\mathbf{1}$, the only other bold symbol.
  - $rx^{\text{avg}}_{t+1}$ (`\Ret`), the average excess return across maturities 2–5: the paper's $\overline{rx}_{t+1}$
    would read as a sample mean over time.
  - $\vartheta$, the tent weights: the paper's $\gamma$ is risk aversion here. $\vartheta$ also weights the betas of a
    mimicking portfolio in Chapter 28; the row says so, as the $\omega$ row does for Chapter 6. No unused Greek letter
    reads well ($\varpi$ looks like $\pi$, $\iota$ like $i$, $\upsilon$ like $v$).
  - $\mathit{cp}_t = \vartheta'\mathbf{f}_t$ (`\Signal`), the return-forecasting factor: the paper's $\gamma'f_t$. Italic
    letters, as $\mathit{cw}_t$, so it never reads as log consumption $c$ times a log price $p$.
  - $b^{(n)}$, the loadings: the paper's $b_n$; the maturity superscript keeps them apart from the SDF loadings $b$ and
    a predictive slope $b$, and it never carries a subscript, so it never reads as one of TASK-144's
    expectations-hypothesis slopes such as $b^{(n)}_{\mathit{rx}}$.

- [x] `git status --short` shows only the allowed files.
  Evidence: before the library commit it printed only `docs/STYLE_GUIDE.md`, `src/lib/stats/pca.ts`,
  `src/lib/stats/pca.test.ts`, `src/lib/finance/bondRiskPremia.ts` and `src/lib/finance/bondRiskPremia.test.ts`;
  `git diff --name-only origin/main...HEAD` lists those five and this file, and after the commits `git status --short`
  prints nothing.

## Comparison with Cochrane & Piazzesi (2005), Table 1 (p. 143)

Theirs: Fama–Bliss one- to five-year zero-coupon prices, monthly observations of annual returns, 1964–2003 (p. 142 and
the note of Table 1). Ours: the committed `gsw-zero-coupon` curve; each range is stated by its first and last month of
$t$. Constants in percent; other weights unit-free. Standard errors: Hansen–Hodrick, 12 lags, in parentheses.

**Weights $\vartheta$ (their $\gamma$) and $R^2$, Table 1A.**

| Sample | $T$ | const | $y^{(1)}$ | $f^{(2)}$ | $f^{(3)}$ | $f^{(4)}$ | $f^{(5)}$ | $R^2$ |
|---|---|---|---|---|---|---|---|---|
| **Theirs**, 1964–2003 | — | −3.24 (1.45) | −2.14 (0.36) | 0.81 (0.74) | 3.00 (0.50) | 0.80 (0.45) | −2.08 (0.34) | 0.35 |
| Full, 1985-11 to 2025-09 | 455 | −1.52 (1.53) | 0.32 (1.41) | 0.67 (8.60) | −6.99 (22.81) | 9.46 (26.38) | −3.02 (11.10) | 0.135 |
| Shared, 1985-11 to 2003-12 | 205 | 0.95 (4.02) | −1.04 (1.76) | 2.07 (12.43) | −16.11 (33.39) | 35.34 (37.78) | −20.12 (15.47) | 0.138 |
| After, 2004-01 to 2025-09 | 250 | −2.44 (1.94) | 0.50 (1.46) | 3.50 (7.83) | −15.59 (20.28) | 17.35 (23.59) | −5.04 (10.25) | 0.217 |

**Loadings $b^{(n)}$ (their $b_n$) and $R^2$, Table 1B.** Restricted $R^2$ / unrestricted $R^2$.

| Sample | $b^{(2)}$ | $b^{(3)}$ | $b^{(4)}$ | $b^{(5)}$ | $R^2$, $n = 2$ | $n = 3$ | $n = 4$ | $n = 5$ |
|---|---|---|---|---|---|---|---|---|
| **Theirs**, 1964–2003 | 0.47 | 0.87 | 1.24 | 1.43 | 0.31 / 0.32 | 0.34 / 0.34 | 0.37 / 0.37 | 0.34 / 0.35 |
| Full | 0.44 | 0.83 | 1.19 | 1.54 | 0.143 / 0.158 | 0.129 / 0.131 | 0.129 / 0.129 | 0.134 / 0.137 |
| Shared | 0.47 | 0.86 | 1.19 | 1.48 | 0.098 / 0.122 | 0.125 / 0.128 | 0.141 / 0.141 | 0.147 / 0.151 |
| After | 0.35 | 0.77 | 1.21 | 1.67 | 0.157 / 0.179 | 0.184 / 0.187 | 0.214 / 0.214 | 0.245 / 0.248 |

Our standard errors of $b^{(n)}$ are 0.13 to 0.40. They treat $\mathit{cp}_t$ as data, as the doc comment of
`singleFactorLoadings` says. Theirs, 0.01 to 0.04, come from an estimate the paper describes in its Appendix, which is
not in `source/papers/`, so the two are not compared.

**Yield factors, Table 4 and p. 147.** Percent of the variance of yields; $R^2$ of $rx^{\text{avg}}_{t+1}$; percent of
the variance of $\mathit{cp}_t$.

| Sample | Variance of yields, components 1–5 | $R^2$: level, + slope, + curvature, all five | Variance of $\mathit{cp}_t$, components 1–5 | First three |
|---|---|---|---|---|
| **Theirs**, 1964–2003 | 98.6, 1.4, 0.03, 0.02, 0.01 | —, 0.24, 0.26, 0.35 | 9.1, 58.7, 7.6, 24.3, 0.3 | 75.4 |
| Full | 98.82, 1.16, 0.026, 0.0005, 0.0000 | 0.042, 0.103, 0.134, 0.135 | 31.3, 44.9, 22.8, 0.1, 1.0 | 98.9 |
| Shared | 98.32, 1.65, 0.031, 0.0007, 0.0000 | 0.010, 0.078, 0.085, 0.138 | 7.0, 49.7, 4.7, 28.5, 9.9 | 61.5 |
| After | 98.02, 1.89, 0.085, 0.0015, 0.0000 | 0.007, 0.082, 0.212, 0.217 | 3.2, 34.4, 60.3, 0.1, 1.9 | 97.9 |

**Are our weights tent-shaped? No, on none of the three ranges.** Theirs are negative at both ends and peak at
$f^{(3)}$. Ours alternate in sign with large weights on $f^{(3)}$, $f^{(4)}$ and $f^{(5)}$. On every range the peak is
at $f^{(4)}$, with a trough at $f^{(3)}$. The shared range, the closest to theirs in years, is the most extreme. The
standard errors of these three weights are 8 to 38, so the data barely pin down any single weight. On the full range
every pair of $f^{(2)}, \dots, f^{(5)}$ is correlated at 0.93 or more, and the five columns $y^{(1)}, f^{(2)}, \dots,
f^{(5)}$ have a condition number of about 1,200.

What survives is the single-factor structure. The loadings rise smoothly with maturity, as theirs do (0.44, 0.83,
1.19, 1.54 on the full range against 0.47, 0.87, 1.24, 1.43). The restricted $R^2$ is within 0.025 of the unrestricted
one. The $R^2$ is lower, 0.13 to 0.22 against their 0.35.

**Why they may differ.**
1. *Sample years.* The committed GSW file starts in 1985-11, so it shares only 18 years with their 1964–2003 sample.
   That is 205 of our months against about 470 of theirs. Their sample holds the high and volatile rates of the 1970s and early
   1980s; ours holds the near-zero short rates after 2008. The "Shared" range ends at $t$ = 2003-12, as the spec
   states. If their last return ends in 2003, their last $t$ is 2002-12, so our shared range has 12 extra months.
2. *GSW fitted curves against Fama–Bliss prices.* GSW yields are a fitted curve: one smooth function of maturity each
   day. The paper builds its returns from the Fama–Bliss prices of the 1- to 5-year bonds (p. 142). The tent
   lives in small, maturity-specific moves. The paper finds that the fourth component, which loads on the four- to
   five-year spread, carries 0.02% of the variance of yields but 24.3% of the variance of $\gamma'f_t$ (p. 147). In
   GSW, components 4 and 5 carry 0.0005% and less than 0.0001% on the full range, about 40 times less. There the
   fourth carries 0.1% of the variance of $\mathit{cp}_t$, and level, slope and curvature carry 98.9%. A smooth fit
   leaves little of the four- to five-year wiggle for the regression to use. The shared range keeps more of it (28.5%)
   and has the most extreme weights. Whether that wiggle is risk premium or measurement error is the question of
   pp. 150–153. The paper argues against measurement error: the tent survives with lagged forward rates, and pure
   measurement error gives step-shaped coefficients, not tents (Figures 3–4, p. 151). This task cannot settle it on
   GSW data.

## Summary

**What.** `src/lib/finance/bondRiskPremia.ts` and its test: `cpInputs` (forward-rate vector, $rx^{(n)}_{t+1}$ for
$n = 2, \dots, 5$ from `holdingReturns`, their average), `tentFactor` (eq. 3), `singleFactorLoadings` (eq. 2 next to
eq. 1, with the derivation that the loadings average to 1 in its doc comment), `yieldFactorForecasts` (Table 4 and
the variance shares of p. 147), `subsampleTents` with `defaultRanges`. `gswYieldLevels` in `src/lib/stats/pca.ts`,
next to `gswYieldChanges`, built on `gswYields` and so on the same private `panel` helper. Five rows in §3 of
`docs/STYLE_GUIDE.md`.

**How.** It reuses `holdingReturns`, `forwardRates`, `pca`, `scores` and `ols`. Rows are matched by calendar month,
as in `bonds.ts`. The share of $\mathrm{Var}(\mathit{cp}_t)$ that component $k$ explains is
$\operatorname{corr}(\mathit{cp}_t, s_{k,t})^2$; the doc comment shows why. Five components span the five yields, and
the scores are uncorrelated in sample.

**Deviations.**
- `singleFactorLoadings` takes an optional third argument, the standard-error options, like `tentFactor`.
- The restricted regressions have no intercept, as eq. (2), so their $R^2$ is computed centred.
- `defaultRanges` states the last month, 2025-09, so the pinned values stay fixed when the data are extended.
- The tent weights take $\vartheta$, the spec's example, though Chapter 28 already uses it; see above.

**Limits, named in the code.**
- Hansen–Hodrick and Newey–West lags count rows. Across a month that GSW skips (eleven in the file), they reach one
  month further back.
- The standard errors of $b^{(n)}$ ignore that $\vartheta$ is estimated.

**Verification.**
- `npm ci` exit 0.
- `npm test`: exit 0, 89 files and 1028 tests passed, the KaTeX macro check (`tests/notation.test.ts`) among them.
- `npm run build` exit 0; `astro check` reports 0 errors and 0 warnings.
- Numpy check: an independent script in `/tmp`, reading only the committed JSON, reproduces every pinned number.

**Proposed follow-ups.**
- Chapter 42 can show the stable single-factor loadings together with the unstable tent. The `TentFactor` widget's
  sample toggle can use `defaultRanges`.
- If the chapter needs the tent itself, a Fama–Bliss-like unsmoothed curve is not among the committed data. The
  chapter should say that GSW is a fitted curve.
