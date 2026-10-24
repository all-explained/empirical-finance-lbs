# TASK-058 outcome: Chapter 14: The consumption–wealth ratio

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: on the rebased branch, `npm test` gives 47 files and 517 tests passed, including
  `tests/chapter14-numbers.test.ts` (6 tests); `npm run build` prints `0 errors`, `0 warnings` and `Complete!`.
- [x] `npm run screenshots -- 14-consumption` and `npm run screenshots -- 09-time-varying` pass in both themes at
  desktop and phone size, and the images were inspected. Evidence: 8 `✓` lines (dark/light × desktop/phone for each
  chapter). I read slices of the full-page images: the three chapter-14 widgets render in both themes and fit at
  360px (the segmented control wraps to two rows on the phone); chapter 9's scatter shows the same title, axis label
  "dp at the end of year t", readout (slope 0.042, $R^2$ 1.2%, 99 observations, "dp years 1926–2024") and caption as before.
- [x] `npm run clickthrough -- 14-consumption` passes and reports every widget of the chapter. Evidence: three `✓`
  lines at 1280px and 360px: "Which weight makes two trends cancel?" (slider "Weight w", button "New draw"),
  "Does this year's cay forecast returns?" (slider, segmented data source, re-roll button, standard-error select),
  "How much of cay's forecast is look-ahead?" (segmented "Data used for the full-sample weights", three options).
- [x] The six `section-tag` headings are in template order. Evidence: `grep -n 'section-tag'` gives lines 16 Hook,
  35 Intuition, 76 Formalisation, 282 Playground, 313 Check yourself, 339 Recap & next up.
- [x] No hex colour in the chapter or its widgets. Evidence: the Verify grep, run on the files this branch changes
  (`CayLookAhead.tsx`, `CointegrationDemo.tsx`, `PredictiveRegression.tsx`, `caySample.ts`, `predictiveSample.ts`
  and the chapter), prints `no hex colours`.
- [x] At least one widget uses real data, and every simulation is seeded. Evidence: `PredictiveRegression
  predictor="cay"` reads the `cay` column of `goyal-welch-annual`; `CayLookAhead` reads `fred-cay-quarterly` and
  `goyal-welch-monthly`, all through `loadSeries`. `CointegrationDemo` draws from `simulateCointegratedPair` with an
  explicit seed (default 2, "New draw" adds 1); the cay simulation of `PredictiveRegression` uses the existing seeded
  `simulatePredictive`.
- [x] The outcome holds a voice review and a table of every number in the prose with its test (below).
- [x] The prose is 2,701 words, inside 1,500–3,000. Command (the one of chapters 9, 10 and 13):
  `awk 'NR>8' src/content/chapters/14-consumption-wealth-ratio.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition shows the walker and the dog and the `CointegrationDemo` ("Move $w$ to 0.60: the line turns into noise around a fixed level") before the Formalisation writes the budget constraint. |
| Data before theory, where we can | The Hook opens with our data: "On quarterly data from 1952 to 1998 … $cay$ explains 7.6% of the variance of next quarter's excess stock return." |
| One idea per section | Each `###` of the Formalisation carries one step: the budget constraint; log-linearising it; solving forward; from total wealth to things we can measure; why the left side is stationary; dynamic OLS; the predictive regression; two honest limits. |
| Start with a question the reader has | "Do households know something about returns?" and "Why should spending forecast returns? And why does the evidence look so different with more data?" |
| Write to one reader, as "you" | "So you probably have two questions." Terms are bold and defined where they first appear (**cointegrated**, **stationary**, **persistence**, **human capital**, **superconsistent**, **Dynamic OLS**, **look-ahead**), and Chapters 4, 5, 9, 10, 13 and 15 are linked. |
| Give the honest version | "Second, **our $cay$ is not the published one**. Our consumption keeps shoes and clothing, which the paper removes. Our labour income is before tax …" |
| Say what the evidence can and cannot show | "It shows that $cay$ with full-sample weights forecast quarterly returns well on 1952 to 1998. It cannot show that an investor with real-time weights would have seen that forecast, on our public version of the data." |
| Don't skip steps in derivations | The constraint is divided by $W_t$, logged, linearised with the slope $f'(\bar x) = 1 - 1/\rho_w$ written out, rewritten with $\Delta w = \Delta c - \Delta(c - w)$, cancelled term by term, iterated forward with the terminal condition, and then the three approximations are substituted one at a time. |
| Graduate rigour comes in gradually | Part III (difficulty 3): a first-order Taylor step, an infinite forward sum and a cointegrating regression, each read in words ("The changes take up the part of the error that moves with the shocks to $a$ and $y$"). |
| Papers in our own words | "Compare it with the dividend–price identity of Chapter 10. Consumption plays the role of the dividend that total wealth pays (Lettau & Ludvigson (2001, p. 821))." |

## Numbers in the prose

Every number from our data is recomputed in `tests/chapter14-numbers.test.ts`, through the library and the widgets'
helpers (`caySample.ts`, `predictiveSample.ts`). "Quarterly" is our $cay$ from `fred-cay-quarterly` with next
quarter's log excess return from `goyal-welch-monthly`; "annual" is the published `cay` column of `goyal-welch-annual`.

| Number in the prose | Where | What it is | Test |
|---|---|---|---|
| 1.2% | Hook | Chapter 9's one-year $R^2$ of dp, annual | `hook: one quarter ahead, on the paper sample and on all our data` |
| 1952 to 1998; 7.6%; 3.96 | Hook | Quarterly $R^2$ and Newey–West $t$, weights and regression on 1952-Q4 to 1998-Q3 | same |
| 1952 to 2025; 0.07%; 0.38 | Hook | The same on all our data (weights to 2026-Q2, last forecast 2025-Q4) | same |
| 0.6 (true weight); 0.980, 0.60, 0.492, 1.20, 0.979 | Intuition | `CointegrationDemo` at seed 2: persistence at $w$ = 0, 0.60, 1.20 | `intuition: the cointegration demo at its default seed` |
| "lowest point … around 0.6", "estimate … close to it" | Intuition | Seeds 2–6: lowest persistence on the slider grid within 0.1 of 0.6; DOLS estimate within 0.05 | same |
| 0.39 (0.034), 0.61 (0.032), 1952-Q4 to 1998-Q3 | Formalisation, Recap | Our DOLS weights on the paper's quarters | `formalisation: dynamic OLS weights` |
| −0.03 (0.053), 0.98 (0.058), 1952-Q1 to 2026-Q2 | Formalisation, Recap | Our DOLS weights on all our data | same |
| 1.14; 0.019; 2.2 | Formalisation | Quarterly slope, sd of $cay$ and their product, 1952–1998 | `formalisation: size of the quarterly slope and persistence of the annual series` |
| 1945 to 2025; 0.73; 0.95 | Formalisation | AR(1) persistence of annual $cay$ and of dp on the same years | same |
| 0.418, 0.69, 0.8%; 1.464, 1.15, 4.0% | Formalisation (try this) | `PredictiveRegression predictor="cay"` at 1 and 3 years | `formalisation: the PredictiveRegression widget with the published annual cay` |
| 2020; −0.137; almost four (3.9) standard deviations | Formalisation (try this) | Lowest annual $cay$ and its distance from zero in sd | same |
| 9.8% ($t$ = 2.18); 37.7% ($t$ = 4.85) | Formalisation | Annual regressions on the years up to 1998, at 1 and 3 years | same |
| 1967-Q2; 62 quarters, 1952-Q1 to 1967-Q2 | Playground | First real-time date and first window | `playground: full-sample against real-time weights` |
| 125; 0.90, 2.99, 5.8%; 0.35, 1.05, 0.9% | Playground (try this) | `CayLookAhead` at "to 1998-Q3": forecasts, full-sample and real-time slope, $t$, $R^2$ | same |
| 0.39 → 0.09 → −0.03 | Playground (try this) | Full-sample $\hat\beta_a$ at the three sample ends | same |
| 0.01, 0.09 | Playground (try this) | Full-sample slope and $t$ with weights to 2026-Q2 | same |

Numbers taken from Lettau & Ludvigson (2001), each with its page in the prose (page numbers checked against
`pdftotext -layout` of the PDF): eq. 1 (p. 818), eq. 2 and $\rho_w$ (p. 818), the approximations (pp. 819–820),
"not too variable" (pp. 820–821), the dividend analogy (p. 821), free weights and nondurables (p. 822), Stock and
Watson's DLS (p. 822), $k = 8$ (p. 823, fn. 8), superconsistency (p. 823), $\hat\beta_a = 0.31$, $\hat\beta_y = 0.59$
(eq. 12, p. 823), one to five quarters (p. 816), about 2.2 for real returns (p. 829), look-ahead (p. 831), the
first window ending in 1968-Q1 and the out-of-sample result (p. 833). The data differences (shoes and clothing,
taxes) come from the paper's data appendix (p. 845) and `docs/DATA.md`. Campbell (2018), Ch. 5, Stock and Watson
(1993) and Campbell and Mankiw (1989) were not opened; they are only under further reading.

## Summary

**What.** `src/content/chapters/14-consumption-wealth-ratio.mdx` (part 3, chapter 14, difficulty 3, prerequisites
5 and 9, both linked) with three `Quiz` questions and three widgets:

- `CointegrationDemo` (new): a seeded pair from `simulateCointegratedPair` ($T$ = 300, true weight 0.6, gap
  persistence 0.5) and $y_t - w\,x_t$ from `combination`; slider for $w$, "New draw" changes the seed, readout
  shows the AR(1) persistence of the combination and a dynamic OLS estimate (2 leads and lags).
- `PredictiveRegression` (shared, one change): new optional prop `predictor: 'dp' | 'cay'`, default `'dp'`. All
  predictor-specific strings live in one `TEXT` table, and the `dp` entry holds the old strings unchanged, so chapter 9
  renders as before. `predictiveSample.ts` gains the same optional argument; `cay` comes from
  `goyalWelchPredictors(series, 'annual')`, from its first non-empty year (1945).
- `CayLookAhead` (new, an addition to the curriculum's widget list): full-sample $cay$ (dashed, weights to the chosen
  quarter: 1998-Q3, 2019-Q4 or 2026-Q2) against real-time $cay$ (solid, `realTimeCay`, first window 62 quarters),
  with slope, $t$ and $R^2$ of next quarter's log excess return (`quarterlyExcessReturns`) on each.

Shared loading code for the two new widgets and the numbers test is in `src/components/plots/caySample.ts`, as
`presentValueSample.ts` does.

**Colour tokens.** $cay$ and $y_t - w\,x_t$ use `--c-signal`. In `CointegrationDemo`, $x_t$ is `--text-muted`
(dashed) and $y_t$ is `--c-data`: they are raw simulated series, not a signal. In `CayLookAhead`, both lines are
$cay$, so both are `--c-signal`, told apart by dashed and solid strokes and a label.

**Deviations and mismatches to report.**

- Data: `docs/CURRICULUM.md` names `fred-consumption-quarterly`; the chapter uses `fred-cay-quarterly` (from
  TASK-054) and also `goyal-welch-monthly` for quarterly returns.
- Key math: the curriculum writes $c_t - \omega a_t - (1-\omega) y_t \approx \mathbb{E}_t \sum \rho_w^j(r_{w,t+j} -
  \Delta c_{t+j})$. The paper's eq. (9) splits $r_w$ into $\omega r_a + (1-\omega) r_h$ and adds $(1-\omega) z_t$; the
  chapter derives that full form. The curriculum's regression uses $R^e_{t\to t+k}$; the chapter uses the log
  $r^e_{t\to t+k}$, as chapter 9 and the widgets do.
- Notation candidates for the `docs/STYLE_GUIDE.md` §3 table (not added, per the spec): $cay_t$ (shown with
  `\Signal`), $\omega$ (asset share of total wealth), $\rho_w$ (the budget-constraint analogue of the Campbell–Shiller
  $\rho$), $W_t$/$w_t$ (total wealth and its log), $a_t$ (log asset wealth), $y_t$ (log labour income), $h_t$ (log
  human capital), $z_t$, $r_{w}$, $r_{a}$, $r_{h}$, and $\beta_a$, $\beta_y$ (cointegrating weights; the table says
  $\beta$ is "only ever a regression or factor exposure", which a regression weight satisfies).
- Clashes worth a style-guide decision: $a_t$ (asset wealth) next to the intercept $a$ of the predictive regression,
  and the demo's weight $w$ next to $w_t$ (log total wealth). The spec names both; the chapter keeps them and flags
  that the demo's $x_t$, $y_t$ are made-up series.
- Our $\hat\beta_a$ on the paper's quarters is 0.39 against the paper's 0.31; the chapter states both and the reasons
  (consumption with shoes and clothing, pre-tax labour income, unadjusted wealth).

**Verified revision.** The branch head after the outcome commit, rebased on `origin/main` at `100d099`.

**Proposed follow-ups.** Add the notation candidates above to `docs/STYLE_GUIDE.md` §3; rename the data entry of
chapter 14 in `docs/CURRICULUM.md` to `fred-cay-quarterly` and list `CayLookAhead`.
