# TASK-025 outcome

## Acceptance

- [x] `npm test` and `npm run build` pass. Vitest: 18 files, 230 tests pass,
  including 15 tests in `src/lib/stats/var.test.ts` and 8 in
  `tests/chapter05-numbers.test.ts`. `astro check` reports 0 errors, 0 warnings
  and 0 hints ("Result (68 files)"); the static build writes 7 pages.
- [x] `npm run screenshots -- 05-persistence` passes with four ✓ lines
  (dark/light × desktop/phone) and no console, KaTeX or overflow error. I
  inspected the page and close-ups of each widget, in both themes, at 1280 px and 360/375 px:
  - Header line "Builds on Ch. 3 Regression and standard errors" is a link.
    Opening callout "What you need from Chapter 3" links to Chapter 3 and keeps a
    three-line reminder (OLS, residuals, standard errors and the two-standard-error
    range that Formalisation uses), then the six sections. Every display equation renders. All
    display math fits a 360 px column: a Playwright check counts 0
    `.katex-display` blocks wider than their box, after I split three long
    equations into shorter lines.
  - `AR1Simulator` (default example): a teal seeded path of 600 months, the mean
    line, then the autocorrelation panel with the teal sample curve, the dashed
    pink φ^k curve, a grey line at 0.5 and a "half-life" marker at 2.9 years.
    Readout: half-life 34 months (2.9 years), theory s.d. 0.201, sample s.d.
    0.175, OLS φ̂ 0.9745, seed 1. With the preset "shiller-monthly dp", a thick
    faint line shows the real log D/P from 1881 to 2023 behind the thin simulated
    path. The readout adds "OLS φ̂ on real log D/P 0.9966" and "Half-life of that φ̂
    205 months (17.1 years)".
  - `VARForecast`: two stacked panels (D/P, E/P in percent), 20 years either side
    of June 2023, solid data, dashed pink forecast with an end dot, and a flat
    long-run line. Readout 1.58% → 2.64% and 4.17% → 7.07%, with the matrix Â in KaTeX.
    From December 1999 with "two AR(1)s", the faint realised path after 2000 is
    visible and the readout gives 1.17% → 1.63%, 3.37% → 5.11%, AR(1) φ̂ values.
  - Phone: controls stack below the plots, the readout wraps, nothing overflows.
    Light theme: same content with the light palette, good contrast.
- [x] `npm run clickthrough -- 05-persistence` passes and reports both widgets:
  "How long does a shock last?" (9 actions at 1280 px and at 360 px: both preset
  options, the φ and σ_ε sliders, re-roll) and "Forecasting two ratios together"
  (9 actions at each width: select, both model options, horizon slider). I also
  clicked the right answer of each quiz with Playwright: explanations show, 0
  KaTeX errors, no console errors.
- [x] The six `section-tag` headings are in template order (`grep -n 'section-tag'`):
  line 25 Hook, 39 Intuition, 70 Formalisation, 258 Playground, 280 Check
  yourself, 306 Recap & next up.
- [x] No hex colour. The spec's grep runs over `AR1Simulator.tsx`,
  `VARForecast.tsx` and the chapter, and prints `no hex colours`.
  `persistenceSample.ts` and `var.ts` also have 0 matches. Widgets colour only
  through `var(--c-signal)`, `--c-data`, `--c-model`, `--text-muted`, `--grid`, `--axis`.
- [x] Real data and seeded simulation. Both widgets load `shiller-monthly`, the
  curriculum entry's dataset, through `loadSeries`. `AR1Simulator` has the
  curriculum's preset, the log D/P with φ̂ near one. `VARForecast` is all real
  data. The only simulation, `simulateAR1`, draws from `normalRng(seed)` in
  `src/lib/math/rng.ts`. The widget starts at seed 1 and "Re-roll simulation" adds 1.
- [x] Voice review: see `## Voice review`.
- [x] Numbers table: see `## Numbers in the prose`.
- [x] Prose length: 2,365 words, inside 1,500–3,000. Command (the TASK-014 one:
  drops frontmatter, imports and `$$` display blocks):
  `awk 'NR>8' src/content/chapters/05-persistence-ar1-and-var.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1:

| Rule | Line in the chapter |
| --- | --- |
| Picture first, then the formula | "Think of a cup of hot coffee in a cold room." Then the `AR1Simulator` widget, all before the first equation in Formalisation. |
| Data before theory | "In June 1932, the dividends of the US stock market were 13.8% of its price." |
| One idea per section | Formalisation has one idea per subsection: "The model", "The mean", "The variance", "Forecasts many steps ahead", "Autocorrelation", "The half-life", "Estimating an AR(1), and what the data cannot tell you", "Stacking series: the VAR(1)". |
| Start with a question the reader has | "Suppose the ratio is far below normal today. How many years should you expect to wait until it is back halfway to normal?" |
| Write to "you", short sentences, explain terms | "The **half-life** is the number of months until half of today's gap is expected to be gone." The callout links to Chapter 3 and keeps a short reminder of OLS. |
| Give the honest version | "The two are close but not equal, because $1 - \hat\phi^2$ is a small number that the data measure only roughly." |
| Say what the evidence can and cannot show | "So the data are consistent with a half-life of seven years and with no half-life at all." |
| Don't skip steps in derivations | "Move the $\phi^2$ term to the left and divide:" and the $t+2$ step written out before the $k$-step formula, for both the AR(1) and the VAR. |
| Graduate rigour comes in gradually (Part I) | "$A^k$ is the matrix $A$ multiplied by itself $k$ times." Only algebra, one 2×2 matrix and OLS. |
| Papers in our own words | No paper or book is quoted. The readings are books that are not in `source/papers/`, so they appear only under Further reading, in short form. No fact is taken from them. |

Lines changed after re-reading:

- "…the VAR forecast 7.11%, but the data show 4.59%, because earnings fell in the
  2008–2009 recession." lost its "because" clause. The data show that December 2009
  earnings were about the same as in December 1999, so the cause was not shown.
- "In a finite sample, the sample autocorrelation of a very persistent series
  usually falls faster than $\phi^k$" became a tested claim: "In 200 seeded
  simulations … below $\phi^{120}$ in 188, and its average was 0.39."
- $\hat\rho_k$ became $\widehat{\operatorname{corr}}_k$, because the guide reserves
  $\rho$ for the Campbell–Shiller constant. The intercept $\mu$ became $\mu_x$, and the
  VAR intercepts $c$ became $\mu_z$, because $c$ is log consumption in the guide.

## Numbers in the prose

All `test` rows are assertions in `tests/chapter05-numbers.test.ts` (run by
`npm test`). It recomputes each number from `src/data/series/shiller-monthly.json`
through `shillerValuation`, `fitAR1`, `fitVAR1`, `forecastVAR1`, `halfLife`,
`ar1Variance`, `sampleAutocorrelation`, `simulateAR1`, `valuationModels`,
`valuationForecast`, `arithmeticMean`, `sampleVariance` and `matPow`.

| Number in the prose | Where | Source |
| --- | --- | --- |
| D/P 13.8% in June 1932 (the maximum) | Hook, Playground | test "hook" (also asserts it is the maximum) |
| 1.1% in August 2000, "its lowest month" | Hook | test "hook" (asserts the minimum) |
| 1.58% in June 2023, last month | Hook, Try this | test "hook" |
| 1,710 months, 1881 to 2023 | Hook, Formalisation, Recap | test "hook" (first/last date, length) |
| typical level 3.8% | Hook | test "hook" (`exp(mean dp)`) |
| "these 142 years" | Formalisation | test "hook" (`floor(1710/12)`) |
| default φ = 0.98, σ = 0.04, 600 months, seed 1 | Intuition | test "intuition" (`DEFAULT_AR1`) |
| half-life 34 months, 2.9 years at φ = 0.98 | Intuition, Formalisation | test "intuition" |
| half-life 1 month at φ = 0.5 | Intuition, Formalisation | test "intuition" |
| half-life 58 years at φ = 0.999 | Intuition | test "intuition" |
| slider values φ = 0.997, σ = 0.043; φ̂ = 0.9966 | Intuition, Formalisation, Recap | test "intuition" |
| half-life of φ̂: 205 months, 17.1 years; "17 years" | Intuition, warning callout, Recap | test "intuition" |
| theory s.d. 0.52, sample s.d. 0.45 | Formalisation | test "formalisation: variance…" |
| standard error 0.0023 | Formalisation, Recap | test "formalisation: variance…" (`fitVAR1([dp]).standardErrors`) |
| φ̂ − 2 s.e. = 0.9921, half-life 7.3 years ("seven years") | Formalisation, Recap | test "formalisation: variance…" |
| φ̂ + 2 s.e. = 1.0012 | Formalisation | test "formalisation: variance…" |
| 1881–1951: φ̂ 0.979, 2.7 years; 1952–2023: 0.995, 12.7 years | Formalisation | test "subsamples" (split at 1952-01) |
| φ̂¹² = 0.960 vs 0.892; φ̂¹²⁰ = 0.666 vs 0.556 | Formalisation | test "sample autocorrelations" |
| 200 simulations, 1,710 months, φ = 0.9966, 188 below, average 0.39 | Formalisation | test "sample autocorrelations" (seeds 1–200, σ = 0.043) |
| Â = [0.989 0.012; −0.007 0.997] | Formalisation | test "the VAR(1) of dp and ep" |
| 0.012: s.e. 0.0038, t 3.2; −0.007: s.e. 0.0040, t −1.7 | Formalisation | test "the VAR(1) of dp and ep" |
| "20 years either side", "120 months", "ten years" | Playground | `WINDOW = 240` and the slider default `k = 120` in `VARForecast.tsx` |
| June 2023, 10 years: VAR 2.64%, AR(1)s 1.99% | Playground Try this | test "playground" |
| payout 38% (June 2023), long-run 54% | Playground Try this | test "playground" (`exp(dp − ep)`, `exp(mean dp − mean ep)`) |
| Dec 1999 → Dec 2009: D/P 2.02% actual, VAR 2.32%, AR 1.63% | Playground Try this | test "playground" |
| Dec 1999 → Dec 2009: E/P VAR 7.11%, actual 4.59% | Playground Try this | test "playground" |
| long-run D/P: VAR 3.57%, AR(1) 3.17% | Playground | test "playground" |
| June 1932 13.8% → 4.5% within a year (June 1933) | Playground | test "playground" |
| Quiz 1: φ = 0.9, 6.6 months; −0.693 / −0.105 | Check yourself | test "check yourself" |
| Quiz 2: φ = 0.8, σ_ε = 0.06, s.d. 0.10 (0.0036/0.36 = 0.01) | Check yourself | test "check yourself"; 0.06, 0.075, 0.30 are distractors |
| Quiz 3: A = [0.5 0; 0.5 0.5], z = (1, 0)', A² and (0.25, 0.5)' | Check yourself | test "check yourself" (`matPow`, `forecastVAR1`) |
| 2008–2009 | Playground | dates in the text, no estimate |
| Chapters 3, 6, 9 | Callout, Hook, Next up | chapter numbers in `docs/CURRICULUM.md` |

## Summary

What:
- `src/lib/stats/var.ts` (new) with `ar1Variance`, `ar1Autocorrelation`,
  `halfLife`, `ar1Forecast`, `simulateAR1`, `sampleAutocorrelation`, `fitVAR1` and
  `forecastVAR1`, tested in `src/lib/stats/var.test.ts` (14 tests).
- The chapter `src/content/chapters/05-persistence-ar1-and-var.mdx`.
- The widgets `AR1Simulator.tsx` and `VARForecast.tsx`, and the helper
  `persistenceSample.ts` (loader hook, log D/P and log E/P, and the model fits that
  the widgets and the test share).
- `tests/chapter05-numbers.test.ts`.

How:
- `fitVAR1` runs `ols` once per equation, gets the mean from `solve(I − A, μ_z)`,
  and computes the residual covariance. `forecastVAR1` returns
  `mean + matPow(A, k)(z_t − mean)`. A one-variable `fitVAR1` is the AR(1); a test
  checks that it equals `fitAR1`.
- `simulateAR1` starts from a stationary draw and uses the same shocks for every φ
  and σ_ε, so a slider moves one path instead of drawing a new one.
- The VAR pair is the log dividend–price and log earnings–price ratios. Both come
  from `shiller-monthly`, and the cross term is clearly non-zero (t = 3.2). So the
  joint forecast differs visibly from two AR(1)s. I tried the long rate as the
  second series and dropped it: its cross terms were near zero, and the VAR looked
  the same as two AR(1)s. Monthly Shiller returns were also unsuitable: the
  VAR gave them an own-lag coefficient of 0.27, which I did not want to teach.

Deviations and mismatches (no change made to the curriculum or style guide):
- Notation. The curriculum's Key math writes $x_{t+1} = \mu + \phi x_t + \varepsilon_{t+1}$.
  The style guide's AR(1) row writes $\mu_x$ and $v_{t+1}$. The chapter uses $\mu_x$ (the guide)
  and $\varepsilon$ (the curriculum; the guide keeps $v$ for a second equation's shock).
- New symbols that are not in the style guide's tables: $ep_t$ (log earnings–price
  ratio, coloured `\Signal` like $dp_t$), $z_t$ (the VAR state vector), $\mu_z$ (VAR
  intercepts), $h$ (half-life), $\sigma_\varepsilon$ (AR(1) shock s.d., from the
  curriculum) and $\widehat{\operatorname{corr}}_k$ (sample autocorrelation). I
  report them and did not add them, as the spec says. No new colour.
- `sampleAutocorrelation` lives in `var.ts`. TASK-024 (PR #28) adds a sample ACF
  in `src/lib/stats/autocorr.ts`. PR #28 was still open at this revision, so I did
  not dedupe; one of the two can be removed after it merges.
- Chapter 3 is on main. The "Builds on Ch. 3" header and the callout link to it;
  the callout keeps only a short reminder of what this chapter uses.

Verified revision: `5699975` (code, rebased on origin/main `5138220`). The full spec Verify sequence (`npm ci`,
`npm test`, `npm run build`, `npm run screenshots -- 05-persistence`,
`npm run clickthrough -- 05-persistence`, the `section-tag` grep, the hex grep, the
tracked-file grep) ran on that revision. Everything passed; the last grep printed 0 with exit 1.

Proposed follow-ups:
- Add $ep_t$, $z_t$, $h$ and $\widehat{\operatorname{corr}}_k$ to the style guide's
  notation tables, and make the curriculum's AR(1) use $\mu_x$, as in the guide.
- Merge `sampleAutocorrelation` with any sample ACF that TASK-024 adds.
