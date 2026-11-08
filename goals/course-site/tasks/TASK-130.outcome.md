# TASK-130 outcome: Chapter 36, measuring consumption

## Acceptance

Verified revision: `b0bd52d` (the chapter commit, rebased on `origin/main` `c7ff41a`). The outcome commit adds only
this file.

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exit 0; `npm test` exit 0, `Test Files 77 passed (77)`, `Tests 830 passed (830)`, including
  `tests/notation.test.ts` and the new `tests/chapter36-numbers.test.ts` (6 tests); `npm run build` exit 0,
  `Result (227 files): 0 errors, 0 warnings, 1 hint`, `36 page(s) built`. The hint is the unused `Matrix` import in
  `src/lib/finance/news.ts`, outside this task and already reported as #88.
- [x] `npm run screenshots -- 36-measuring-consumption` passes in both themes at desktop and phone size, and I
  inspected the images.
  Evidence: exit 0 with `✓` for `dark-desktop`, `dark-phone`, `light-desktop` and `light-phone`. I read every part of
  the page in crops of all four images. The inspection found two problems, now fixed. Four display equations of the
  time-averaging proof (Steps 1, 3, 5 and 6) and one line of the sums in `<details>` ran past the 375px phone width.
  They now break over lines. A Playwright check with every `<details>` open finds 9 display equations and none wider
  than its box, at 375px and at 360px, and no page overflow. The `UnfilterConsumption` readout showed volatility to
  one decimal (2.1%, 5.0%) while the prose says 2.08% and 5.02%. It now shows two decimals. The five-column table of
  the three measures scrolls sideways on a phone, as every prose table does (`.prose > table` in `prose.css`).
- [x] `npm run clickthrough -- 36-measuring-consumption` passes and reports every widget of the chapter.
  Evidence: exit 0. `AVERAGING A RANDOM WALK OVER EACH PERIOD · 4 actions at 1280px, 4 actions at 360px` (slider
  "Steps a period", button "New seed") and `UNDOING THE NIPA FILTER · 6 actions at 1280px, 6 actions at 360px`
  (slider "Filter weight φ"; segmented "Kroencke's recommended weights": 0.00, 0.20 and 0.60).
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` prints lines 25 Hook, 43 Intuition, 85 Formalisation, 277 Playground,
  303 Check yourself, 329 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the spec's `git diff --name-only origin/main -- 'src/components/plots/*.tsx' … | xargs grep -nE
  '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` prints `no hex colours`.
- [x] The time-averaging widget uses seeded simulations from `src/lib/math/rng.ts`, and the unfiltering widget and the
  prose numbers use the committed `fred-consumption-annual`, `goyal-welch-annual` and `fred-cay-quarterly` data.
  Evidence: `TimeAveraging` calls `averagingSimulation(seed, n)`, which calls `simulateTimeAveraging` of
  `src/lib/finance/consumptionMeasurement.ts`; that function draws from `normalRng` of `src/lib/math/rng.ts`. The
  default seed is 36, and "New seed" adds 1. `UnfilterConsumption` loads the three series through
  `useConsumptionData` and computes through `consumptionMeasures` and `measureStats`. The numbers test reads the same
  three committed JSON files.
- [x] The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table
  of every number in the prose with its test. Evidence: the two sections below.
- [x] The prose is 1,500–3,000 words (give the command).
  Evidence: 2,846 words. Command (the one of chapters 9, 10, 13, 16, 22, 26, 30 and 33):
  `awk 'NR>8' src/content/chapters/36-measuring-consumption.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).
  Evidence: it prints `0` and exits 1.

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition runs `TimeAveraging` ("The thick dashes show the average over each quarter of 90 days.") before the Formalisation derives $(n_{\text{avg}}^2 - 1)/(2(2n_{\text{avg}}^2 + 1))$. |
| Data before theory | The Hook opens on our data: "From 1931 to 2025 its growth has a volatility of 2.08% a year. Its correlation with the real return of the stock market is 0.03." |
| One idea per section | Each `###` carries one idea: "What the national accounts measure", "Time averaging: where the 1/4 comes from", "The filter, and what it does to a covariance", "Undoing it", "Three measures on our data". |
| A question the reader has | "Is consumption really this smooth and this deaf to the stock market, or does the way we measure it make it so?" |
| Write to "you", short sentences, link back | "Now drag the slider up. At 2 steps it is already 0.167." The callout links Chapter 5, and the filter is "an AR(1), as in Chapter 5". |
| The honest version | "Read the reported $\gamma$ as "enormous", not as 2,313. A covariance near zero makes the ratio swing wildly." |
| What the evidence can and cannot show | "These are point estimates from one sample, with no standard errors. A correlation of 0.15 over 95 years is about 1.5 standard errors from zero." |
| No skipped steps | The averaging result takes six numbered steps, and a `<details>` block works out both sums. The three filter facts each take one line of algebra. |
| Graduate rigour, with a plain reading | "One shock lands in two growth rates, so neighbouring growth rates move together." |
| Papers in our own words | "Kroencke models the statistician as an estimator who moves part of the way toward each new reading (working paper pp. 6–7)." No text, figure or table is copied. |

## Numbers in the prose

Every number from our data or the simulation is recomputed in `tests/chapter36-numbers.test.ts` (6 tests, all pass)
through `consumptionMeasures`, `measureStats` and `averagingSimulation` of `src/components/plots/consumptionSample.ts`.
These call `src/lib/finance/consumptionMeasurement.ts` and `src/lib/finance/consumptionPuzzle.ts`.

| Number in the prose | Where | Test |
|---|---|---|
| 1931–2025, 95 years; volatility 2.08%, correlation 0.03, $\gamma$ 849 (reported) | Hook, Playground, Recap | `hook and playground: measured consumption, 1931–2025` |
| Exact autocorrelation 0, 0.167, 0.211, ≈0.25 (1, 2, 3, 10 steps), 0.250 at 90 | Intuition (Try this) | `intuition: exact autocorrelations and the default simulation` |
| Seed 36, 90 steps, 399 quarters: sample 0.288, exact 0.250; variance ratio 0.610, exact 0.667 | Intuition | `intuition: …` |
| $\varphi = 0.20$ and $0.60$ from Kroencke's 0.80 and 0.40; $0.80 \times 1/2 = 0.40$ | Formalisation, Recap | `formalisation: the filter facts, Kroencke's weights and the 1/5 that matches averaging` |
| $\varphi = 1/5$ keeps 2/3 of the variance; factor 2.5 at $\varphi = 0.6$ | Formalisation | `formalisation: the filter facts…` |
| 1953–2025, 73 years; first Q4 1952 (the data start 1951-10-01) | Formalisation | `formalisation: three measures on 1953–2025` |
| Annual: 1.50%, 0.12, 0.01, 2,313 | Formalisation | `formalisation: three measures…` |
| Q4–Q4: 1.54%, 0.07, 0.30, 100 | Formalisation, Recap | `formalisation: three measures…` |
| Unfiltered 0.20: 1.86%, −0.09, 0.08, 313 | Formalisation | `formalisation: three measures…` |
| Unfiltered 0.60: 4.13%, −0.38, 0.19, 59 | Formalisation | `formalisation: three measures…` |
| Start in 1930: $\gamma$ 271 | Formalisation | `formalisation: the 1930 start, the sample to 2019 and the timing` |
| To 2019: reported autocorrelation 0.47; unfiltered 0.60: −0.10, 0.23, 71 | Formalisation | `formalisation: the 1930 start…` |
| Growth 1930–2025: correlation 0.07 with the same year's return, 0.53 with the previous year's | Formalisation | `formalisation: the 1930 start…` |
| Unfiltered 0.60, 1931–2025: 5.02%, 0.15, $\gamma$ 58 | Playground, Recap | `playground: Kroencke's two weights on 1931–2025` |
| Unfiltered 0.20, 1931–2025: correlation 0.07, $\gamma$ 260 | Playground | `playground: …` |
| $\gamma$ falls by a factor of more than 10 | Playground | `playground: …` |
| Weight 0.80: autocorrelation strongly negative, swings of tens of percent | Playground | `playground: …` (below −0.3; largest growth above 20%) |
| 0.15 over 95 years ≈ 1.5 standard errors | Playground | `playground: …` |
| Quizzes: 1/6 at 2 steps; $\gamma$ doubles to 40 at $\varphi = 0.5$ | Check yourself | Closed-form: $(4 - 1)/(2 \times 9)$ and $20/(1 - 0.5)$; the first is `timeAveragedAutocorrelation(2)` in `intuition: …` |

Facts taken from Kroencke are cited with their pages and are not our data. The PDF is the ZEW Discussion Paper
13-071 (2013); printed page = PDF page − 5. Page 1: Savov (2011) uses garbage and matches the equity premium. Page 2:
$\gamma$ of 19 to 34 for unfiltered consumption (1950–2011) and 15 to 25 for garbage. Pages 3–4: benchmarking,
interpolation, and the appraisal-smoothing idea from real-estate research. Pages 6–7: the estimator model. Page 8:
Working (1960) and Breeden, Gibbons & Litzenberger (1989) for 2/3 and 1/4, and the halved covariance. Pages 9–10:
$\phi = \alpha \times \nu$, $\alpha = 0.80$, $\nu = 1/2$. Page 16: postwar correlation with the market 0.58 for
garbage and 0.01 for NIPA, volatility 2.88% against 1.30%. Page 17: $\phi = 0.40$ matches garbage closely.

## Summary

**What.** `src/content/chapters/36-measuring-consumption.mdx` (six template sections, 2,846 words, three `Quiz`
questions). The widgets `TimeAveraging` and `UnfilterConsumption`. The helpers
`src/components/plots/consumptionSample.ts`, and `tests/chapter36-numbers.test.ts`.

**How.**
- `useConsumptionData` loads the three series through `useSeriesData` (built on `loadSeries`), the shared hook of
  `seriesSample.ts`. Chapter 35's `puzzleSample.ts` does not exist on `origin/main`.
- `consumptionMeasures` pairs each measure with the same year's log real market return from `annualSample`: annual
  averages, `fourthQuarterGrowth` of `cayInputs`, and `unfilter` of the annual growth.
- `measureStats` takes volatility, correlation and the covariance-implied $\gamma$ from `puzzleMoments` and
  `impliedRiskAversion`, and the first-order autocorrelation from `sampleAutocorrelation`.
- Readings opened with `pdftotext -layout`: Kroencke (ZEW DP 13-071, printed pp. 1–4, 6–10, 16–17). Working (1960),
  Breeden, Gibbons & Litzenberger (1989) and Savov (2011) are named only as Kroencke reports them, with his page.
  Campbell (2018), Ch. 6, is listed under further reading only.

**Notation.** The curriculum's $\phi$ is $\varphi$, as in the Part IX block of `docs/STYLE_GUIDE.md` §3, because
$\phi$ is AR(1) persistence. The chapter explains that Kroencke's parameter is $1 - \varphi$. $n_{\text{avg}}$ is the
§3 symbol for steps a period. Both rows were already in §3, so this PR does not change the style guide.

**Deviations and mismatches.**
- Data: the curriculum's data line for Chapter 36 names `fred-consumption-quarterly` and `fred-consumption-annual`.
  The chapter uses `fred-consumption-annual`, adds `goyal-welch-annual` (the annual returns) and
  `fred-cay-quarterly` (for the Q4–Q4 measure), as the spec asks, and does not use `fred-consumption-quarterly`
  (it starts in 2007-Q1).
- Readings: the curriculum cites Kroencke (2017), the *Journal of Finance* article. Only the 2013 ZEW working paper
  is in `source/papers/`. The chapter cites Kroencke (2017) and names working-paper pages, and says so in the Hook.
- Chapter 35 is not merged (no `35-*.mdx` and no `puzzleSample.ts` on `origin/main`). The chapter names it by title,
  *The equity premium and risk-free rate puzzles*, without a link. The callout restates the one formula it uses.
- Part X's first chapter is named by title, *Internal and external habits*, only in "Recap & next up".

**Follow-ups.** When Chapter 35 merges, the Part IX read-through can turn its title in the opening callout into a
link.
