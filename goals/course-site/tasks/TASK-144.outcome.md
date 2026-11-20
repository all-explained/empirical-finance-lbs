# TASK-144 outcome: expectations-hypothesis library for Chapter 41

## Acceptance

Verified revision: `32a80a9` (the library commit, rebased on `origin/main` `d533eab`). The outcome commit adds only
this file. All runs were on the MacBook (Apple M2 Pro, Node 26): unit tests on the committed `gsw-zero-coupon` series
(479 months) and on seeded simulations. No cluster or PC job was needed.

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro
  check.
  Evidence: `npm ci` exit 0; `npm test` exit 0, `Test Files 87 passed (87)`, `Tests 1003 passed (1003)`, including `tests/notation.test.ts`. `src/lib/finance/expectationsHypothesis.test.ts` has 39 tests. Each export and its
  reference value:

  | Export | Reference value in the test |
  |---|---|
  | `yieldChangeRegression` | slope, Hansen–Hodrick (12 lags) and Newey–West (18 lags) errors and $T$ at $n = 2, 5, 10$ equal an independent NumPy script to 1e-6 (rerun this session: 0.468821 (0.658263), −0.323580 (0.682930), −1.251540 (0.684820), $T = 455$); $t$-statistics against 0 and 1; the first scatter point by hand to 1e-15; December-only observations: $T = 38$, slope 1.129013 (0.686662); the Hansen–Hodrick error equals a hand-written $(X'X)^{-1}\big[\sum_{\lvert l\rvert \le 3}\sum_t x_te_te_{t-l}x_{t-l}'\big](X'X)^{-1}$ on a 30-month fixture to 1e-12; on a 90,000-month path without a moving premium the slope is within 0.15 of 1 at 2, 5, 10 years |
  | `perfectForesightRegression` | pinned slope, errors and $T$ at $n = 2, 5, 10$ (the Hansen–Hodrick variance with 108 lags is negative at $n = 10$, so the error is NaN; Newey–West gives 0.059708); default lags $12(n - 1)$; December only at $n = 10$: 1.049845 (0.044109); long path within 0.08 of 1 |
  | `forwardSpreadRegression` | pinned excess-return and short-rate slopes at $n = 2, 5, 10$; at $n = 2$ the two slopes sum to 1 and the intercepts to 0, each to 1e-12, on the committed data; long path: $b_{\mathit{rx}}$ within 0.08 of 0 and $b_{\Delta y^{(1)}}$ within 0.08 of 1 |
  | `slopesByMaturity` | one result per maturity in the given order with hypothesis values 0; equal to `forwardSpreadRegression` |
  | `fitExpectationsWorld` | $\phi_y = 0.9925217$, $\sigma_y = 0.0024574$, $\mu_y = 0.0259323$ (equal to `fitAR1`), $\mathit{tp}^{(10)} = 0.0129955$ |
  | `simulateExpectationsWorld` | shape of `gswCurve`, seed-reproducible; every yield equals $\mu_y + \bar\phi^{(n)}_y(y^{(1)}_t - \mu_y) + \mathit{tp}^{(n)}$ summed term by term to 1e-15; the moving premium leaves $y^{(1)}_t$ unchanged and adds $(1 - 1/n)\mathit{tp}_t$ to 1e-15 |
  | `populationSlope` | 1 to 1e-12 for $n = 2, \dots, 30$ without the moving premium; the $n = 2$ closed form to 1e-14; −0.2357, 0.0422, −0.0855 at 2, 5, 10 years with it; a 90,000-month path with the premium gives slopes within 0.15 of these |
  | `slopeDistribution` | reproducible from its seed; sample $i$ equals `yieldChangeRegression` on the path of the $i$-th seed to 1e-12; median within 0.1 of 1 for 200 samples of 400 years; fitted world at our length, $n = 2$, seed 144: median 3.135938, share at or below the data's slope 0.068 |

  The bands on the long path are three Hansen–Hodrick standard errors measured on that path (about 0.05 for the yield
  change, 0.025 for the other regressions, at most 0.05 with the premium).
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `npm run build` exit 0, `Result (252 files): 0 errors, 0 warnings, 1 hint`, then `40 page(s) built`. The hint is the unused `Matrix` import in `src/lib/finance/news.ts`, outside this task and already reported as #88.
- [x] The outcome lists the slopes on our data at 2, 5 and 10 years next to the m = 12 column of Campbell & Shiller's
  Table 1a (pdf p. 28) and Cochrane & Piazzesi's Table 2 (pdf p. 8), marked as theirs, and says why they differ.
  Evidence: the tables in "Our slopes against the papers" below; the papers' numbers were read from the page images.
- [x] The outcome states the number of samples and the measured time of one `slopeDistribution` call.
  Evidence: "Timing of `slopeDistribution`" below.
- [x] `docs/STYLE_GUIDE.md` §3 "Bonds and the term structure" has rows for the new symbols, and the outcome lists each
  with the clash it avoids.
  Evidence: seven new rows after $\mathit{tp}^{(n)}_t$; see "Notation" below. `tests/notation.test.ts` passes.
- [x] `git status --short` shows only `src/lib/finance/expectationsHypothesis.ts`, its test, `docs/STYLE_GUIDE.md` and
  this task's outcome file.
  Evidence: before the commits, `git status --short` printed ` M docs/STYLE_GUIDE.md`, `?? goals/course-site/tasks/TASK-144.outcome.md`, `?? src/lib/finance/expectationsHypothesis.test.ts`, `?? src/lib/finance/expectationsHypothesis.ts`, and nothing else.

## Our slopes against the papers

Ours: `gsw-zero-coupon`, end-of-month dates $t$ from 1985-11 to 2025-09 (outcomes to 2026-09), monthly observations of
one-year changes, Hansen–Hodrick errors with 12 lags in parentheses.

Yield-change regression, $y^{(n-1)}_{t+1} - y^{(n)}_t$ on $\mathit{sp}^{(n)}_t/(n - 1)$; slope 1 under the hypothesis.
Campbell & Shiller's m = 12 column is the same regression with a one-year holding period ($m = 12$ months,
$n = 24, 60, 120$ months).

| Maturity | Ours $b_{\Delta y}$ | Campbell & Shiller (1991), Table 1a, m = 12 (theirs) |
|---|---|---|
| 2 years | 0.469 (0.658) | −1.034 (0.620), pdf p. 28 |
| 5 years | −0.324 (0.683) | −2.022 (1.205), pdf p. 29 (the table continues there) |
| 10 years | −1.252 (0.685) | not reported ("---" at n = 120, m = 12), pdf p. 29 |

Forward-spread regression, $rx^{(n)}_{t+1}$ on $f^{(n)}_t - y^{(1)}_t$; slope 0 under the hypothesis.

| Maturity | Ours $b_{\mathit{rx}}$ | Cochrane & Piazzesi (2005), Table 2, $\beta$ (theirs) |
|---|---|---|
| 2 years | 0.266 (0.329) | 0.99 (0.33), pdf p. 8 |
| 5 years | 0.753 (0.377) | 1.27 (0.64), pdf p. 8 |
| 10 years | 1.395 (0.496) | not reported (maturities 2–5 only) |

Why they differ:
1. Sample. Campbell & Shiller use 1952:1–1987:2 (Table 1a notes, pdf p. 29) and Cochrane & Piazzesi 1964–2003
   (pdf p. 6). Ours starts in 1985-11, when the GSW file first has all 30 maturities, and covers the long fall in
   rates, the zero lower bound of 2009–2015 and 2020–2021, when the one-year yield barely moved, and the 2022 rise.
   The direction still matches: our $b_{\Delta y}$ falls with maturity and is negative at 5 and 10 years, as all of
   theirs are, and our $b_{\mathit{rx}}$ is positive at every maturity, as theirs is.
2. Data. Theirs are discount-bond yields from McCulloch's term structure (Campbell & Shiller) and from the CRSP
   Fama–Bliss file (Cochrane & Piazzesi). Ours is the Gürkaynak–Sack–Wright fitted Svensson curve, smooth across
   maturities. Noise in $y^{(n)}_t$ enters the spread and the yield change with opposite signs and pulls
   $b_{\Delta y}$ down; a smooth curve has less such noise, which can explain part of why our $b_{\Delta y}$ sit above
   theirs.
3. Maturities. Cochrane & Piazzesi stop at 5 years and Campbell & Shiller report no m = 12 slope at 10 years; our
   10-year slopes have no published counterpart.
4. Standard errors. Campbell & Shiller report Hansen–Hodrick errors like ours. Cochrane & Piazzesi's Table 2 errors
   are "Small T": bootstrapped from a 12-lag yield VAR (pdf p. 6), about a third larger than asymptotic errors.

Monte Carlo, for comparison: Campbell & Shiller's first number under −1.034 is 0.047, the share of 1,000 VAR runs
further below 1 (pdf p. 28). In our AR(1) world fitted to the data, 0.068 of 500 samples of our length give a slope at
or below our 0.469 at 2 years.

## Timing of `slopeDistribution`

One call uses the default 500 samples, each 479 months long (our data's length), in the world fitted to the data.
Measured on the MacBook (Apple M2 Pro, Node 26, inside Vitest), after one warm-up call, 10 calls at each maturity:

| Maturity | Wall time, median (min–max) | CPU time, median |
|---|---|---|
| 2 years | 135 ms (130–146) | 137 ms |
| 5 years | 133 ms (128–149) | 136 ms |
| 10 years | 140 ms (132–164) | 140 ms |

So one call takes about 0.14 s, low enough for a widget button. The machine was loaded (load average about 70 on 12
cores); wall and CPU time agree, so the load did not inflate these numbers. Earlier runs during a load spike (load
above 95) took 0.4–0.9 s. Not measured: a browser or a phone.

## Notation

Seven rows in `docs/STYLE_GUIDE.md` §3, "Bonds and the term structure":

| Symbol | Meaning | Clash it avoids |
|---|---|---|
| $\mathit{sp}^{(n)}_t$ | Yield spread $y^{(n)}_t - y^{(1)}_t$ | Campbell & Shiller's $S^{(n,m)}_t$ and $s^{(n,m)}_t$: $S$ is the GMM long-run covariance and the surplus ratio, $s$ a state, a share or the log surplus ratio |
| $\mathit{pfs}^{(n)}_t$ | Perfect-foresight spread | Campbell & Shiller's $S^{(n,m)*}_t$: the same $S$ clash, and the star marks risk-neutral quantities such as $\pi^*(s)$ |
| $b_{\Delta y}$, $b_{\mathit{pfs}}$, $b_{\mathit{rx}}$, $b_{\Delta y^{(1)}}$ | Slopes of the four regressions | The SDF loadings $b$: the subscript names the left-hand side, which an SDF loading never carries. Cochrane & Piazzesi's $\beta$ is a factor exposure here |
| $\mathit{tp}^{(n)}$, $\mathit{tp}_t$ | Constant and moving parts of the world's term premium | Campbell & Shiller's constant $c$ (the spec's example $c^{(n)}$), which is log consumption $c_t$; the existing row already rules it out |
| $\mu_y$, $\phi_y$, $\sigma_y$ | Mean, monthly persistence and shock s.d. of the simulated one-year yield | Bare $\phi$, the persistence of a predictor; the subscript names the series, as $\phi_x$ does |
| $\phi_{\mathit{tp}}$, $\sigma_{\mathit{tp}}$ | Persistence and shock s.d. of $\mathit{tp}_t$ | The same: the subscript names the series |
| $\bar\phi^{(n)}_y$ | Weight $\tfrac1n\sum_{j<n}\phi_y^{12j}$ of today's short rate in the $n$-year yield | $A_n$, the affine intercept of Part XII, and the VAR matrix $A$ |

## Summary

What: `src/lib/finance/expectationsHypothesis.ts` adds the four regressions of Chapter 41 (yield change, perfect
foresight, and the two Fama–Bliss forward-spread regressions), `slopesByMaturity`, a seeded world where the hypothesis
holds (`fitExpectationsWorld`, `simulateExpectationsWorld`), its population slope with and without a moving term
premium, and `slopeDistribution`, the Monte Carlo of Campbell & Shiller (pdf pp. 20–22).

How: every regression is built from `bonds.ts` (`holdingReturns`, `perfectForesightYield`, `forwardRates`) and runs
through `ols` with Hansen–Hodrick errors (12 lags per year of horizon) or Newey–West (18 per year), or on one
calendar month a year (`annualMonth`) for non-overlapping observations. The world reuses `fitAR1` and the RNG helpers
and returns a curve in the shape of `gswCurve`, so the same regressions run on it. Derivations (why each slope is 1 or
0, why the two $n = 2$ slopes sum to 1, and the population slope) are in doc comments with page citations.

Deviations:
1. One extra export, `fitExpectationsWorld`, fits the world to a curve so `simulateExpectationsWorld` and
   `slopeDistribution` take an explicit `ExpectationsWorld`; the spec's `params` is that object.
2. The term-premium constant is $\mathit{tp}^{(n)}$, not the spec's example $c^{(n)}$ (see Notation).
3. At $n = 10$ the perfect-foresight Hansen–Hodrick variance (108 lags) is negative on our data, so its error is NaN,
   as `ols` reports; the Newey–West option gives 0.0597.
4. Limit, stated in the code: lags count rows, and `gsw-zero-coupon` skips eleven months, so a lag across a gap reaches
   one month further back.

Follow-ups: none required. Chapter 41 can show that our sample length alone pushes the 2-year slope's median to about
3 in a world where the hypothesis holds (Kendall's bias in the short rate's autocorrelation), which is why the
Monte Carlo share, not the distance from 1, is the fair test.
