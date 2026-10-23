# TASK-057 outcome: Chapter 13: Out-of-sample predictability

PR: https://github.com/all-explained/empirical-finance-lbs/pull/44

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence (after `npm ci`, on f97f900): `Test Files 33 passed (33)`, `Tests 358 passed (358)`;
  `Result (110 files): - 0 errors - 0 warnings - 1 hint` (the hint is the existing one in `news.ts`),
  `15 page(s) built`, `[build] Complete!`.
- [x] `npm run screenshots -- 13-out-of-sample` passes in both themes at desktop and phone size, and I inspected the images.
  Evidence: `✓ chapters_13-out-of-sample-predictability-{dark,light}-{desktop,phone}.png`. I also took element
  screenshots of both widgets (dark and light, 1280px and 360px, the second one switched to monthly data with both
  restrictions) and of the Clark–West derivation at 360px, and looked at them. A first pass showed readout values
  wrapping at 360px and long equations scrolling; I shortened the readout rows and split the three longest
  displays with `aligned`.
- [x] `npm run clickthrough -- 13-out-of-sample` passes and reports every widget of the chapter.
  Evidence: two lines, one per `OOSRace` instance, each `✓ … 21 actions at 1280px, 21 actions at 360px` over
  the select (12 options), the frequency, the first-forecast-year slider and both restriction controls.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` gives lines 14 Hook, 31 Intuition, 58 Formalisation, 230 Playground,
  265 Check yourself, 291 Recap & next up.
- [x] No hex colour in the chapter or its widgets. Evidence: the Verify grep prints `no hex colours`.
- [x] The widget uses real data from the chapter's curriculum entry (`goyal-welch-annual`, `goyal-welch-monthly`).
  Evidence: `oosSample.ts` loads both through `loadSeries` and `goyalWelchPredictors`; the readout of the second
  widget in Playwright showed the monthly numbers that the prose cites (+0.41%, 1.82, 0.035, +0.20%, 732 forecasts).
- [x] The outcome holds a voice review and a table of every number in the prose with its test (below).
- [x] The prose is 2,716 words, inside 1,500–3,000. Command (the one of chapters 9 and 10):
  `awk 'NR>8' src/content/chapters/13-out-of-sample-predictability.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition section shows the race widget and the dp line ("It climbs from 1965 to 0.094 by 1975 … Then it falls fast") before the Formalisation writes $R^2_{OS}$ and the running sum. |
| Data before theory, where we can | The Hook opens with the real-time result on goyal-welch-annual: "the real-time regression on the dividend–price ratio made squared errors 3.1% larger than the plain average." |
| One idea per section | Each `###` of the Formalisation carries one idea: expanding windows; $R^2_{OS}$; the running score; why a true predictor can lose; Clark–West; the restrictions; the certainty-equivalent gain. |
| Start with a question the reader has | "Over those 61 years, whose forecasts were closer to the returns that happened?" |
| Write to one reader, as "you" | "Now put yourself at the end of 1964. You have the data up to that date and nothing after it." Terms are defined where they first appear (**expanding window**, **out-of-sample $R^2$**, **low power**) and Chapters 9 and 12 are linked. |
| Give the honest version | "A simplification is in play: we multiply weights by *log* excess returns, which is close to, but not the same as, the simple excess return the investor earns." |
| Say what the evidence can and cannot show | "A negative $R^2_{OS}$ does not prove that returns cannot be forecast. The test has **low power**" and every statistic comes with its sample, its number of forecasts and, for Clark–West, its p-value. |
| Don't skip steps in derivations | The squared error is expanded term by term, rearranged into reward minus penalty, and the Clark–West loss is shown to equal the reward; the weight comes from setting the derivative to zero. |
| Graduate rigour comes in gradually | Part III (●●): sums, a $t$-statistic and a first-order condition, each read in words ("The first term is the reward … The second term is a penalty"). |
| Papers in our own words | "Cochrane (2008, p. 25) simulates a world in which the dividend–price ratio truly forecasts returns, and finds that the forecasts beat the mean out of sample in only about 20% of his samples." |

## Numbers in the prose

Every number from our data is checked in `tests/chapter13-numbers.test.ts`. "Annual" is goyal-welch-annual,
"monthly" goyal-welch-monthly; "from 1965" scores forecasts of 1965 to 2025; "both rules" means the slope
restriction and the zero floor.

| Number in the prose | Where | What it is | Test |
|---|---|---|---|
| 0.042, 1.2%, 1926 to 2025 | Hook | In-sample slope and $R^2$ of dp, annual (Chapter 9's numbers) | `hook: the in-sample regression of chapter 9 and the real-time race` |
| 61 years, 1965 to 2025 | Hook, Formalisation | Forecasts of dp from 1965 | same |
| 3.1% (and −3.1%) | Hook, Formalisation | $R^2_{OS}$ of dp from 1965 | same |
| none of the 12 | Hook, Recap | Predictors with $R^2_{OS} > 0$ from 1965, no rules | same (`winners(none)` is empty, `PREDICTORS.length` is 12) |
| 0.094 by 1975, 0.096 in 1994, below zero by 1998, −0.052 in 2025 | Intuition | dp running score from 1965 | `intuition: the shape of the dp line` |
| −2.7%, 6.0% | Intuition | dp forecast and historical mean for 1996 | same |
| 1.68 | Formalisation | Mean's sum of squared errors, dp from 1965 (final score / $R^2_{OS}$) | `formalisation: …` |
| 0.72, p 0.23 | Formalisation | Clark–West of dp from 1965 | same |
| −17.1%, 1.31, p 0.095 | Formalisation | dy from 1947: $R^2_{OS}$ and Clark–West | same |
| 14 of the 61 years | Formalisation | Negative dp forecasts from 1965 | same |
| −3.1% to −1.0% | Formalisation | dp $R^2_{OS}$ from 1965, both rules | same |
| three: T-bill rate, long-term yield, stock variance | Formalisation | Predictors with $R^2_{OS} > 0$ from 1965, both rules | same (`winners(both)`) |
| −0.50% a year | Formalisation | Certainty-equivalent gain of dp from 1965 | same |
| 732, 0.41%, 1.82, p 0.035, 0.20% a year | Playground | lty, monthly, from 1965, both rules | `playground: lty on monthly data with both restrictions` |

Numbers that are not from our data: 20 years (first forecast, Goyal & Welch (2008, p. 1464)); 1965 (their second
start date, same page); $\gamma = 3$ and the 150% cap (Goyal & Welch (2008, p. 1484)); 1.645 (one-sided 5% normal
cut-off); about 20% (Cochrane (2008, p. 25)); "about a thousand regressions" (1,200 months minus the 20-year
window); the quiz's 2.0, 2.1, −5%, −0.1 and 2.1 (hand examples).

## Summary

**What.** `src/content/chapters/13-out-of-sample-predictability.mdx` (part 3, chapter 13, difficulty 2,
prerequisites 9 and 12, both linked), the widget `src/components/plots/OOSRace.tsx`, its helper
`src/components/plots/oosSample.ts`, and `tests/chapter13-numbers.test.ts`.

**How.** `oosSample.ts` holds everything the widget and the test share: the 12 predictors of
`goyalWelchPredictors` with their expected signs, `predictorRun` (slices a predictor to its span with data, calls
`expandingForecasts` with a 20-year first window and the chosen restrictions, and adds the variance known before
each forecast through `sampleVariance`), `race` (cuts a run at the first forecast year and calls
`cumulativeSquaredErrorDifference`, `oosR2`, `clarkWest` and `certaintyEquivalentGain`) and the hook `useRuns`.
Expanding-window forecasts do not depend on where scoring starts, so the first-year slider only cuts one run; it
does not refit. The earliest year at which all 12 predictors have a forecast at both frequencies is 1947
(monthly `ntis` starts in 1926-12), so the slider runs from 1947 to 2000.

**Widget choices.**
- Highlight colour: the highlighted predictor is a thick line in `--c-signal` (a predictor) with its name at the
  line end; the other 11 are thin lines in `--axis`, the existing muted token. Line width and the label carry the
  difference too, so colour is not the only cue.
- Restrictions are two `Segmented` controls whose options name what they do ("any slope" / "expected slope sign",
  "negative forecasts" / "floor at zero"), because a `Segmented` label is only an `aria-label`.
- Performance: a monthly predictor takes about 0.4 s in Node, so `useRuns` computes one predictor per task and shows
  "Computing the real-time forecasts… k of 12" in the plot and readout. In Chromium a full monthly set took about
  3.3 s. Runs are cached per frequency, restriction pair and predictor, so the second widget on the page and
  repeated toggles reuse them.
- The page has two `OOSRace` instances (Intuition and Playground, the second starts on `lty`), as chapter 10 has two
  widgets. They share the run cache.

**Deviations and mismatches to report.**
- Curriculum vs style guide: the curriculum's Key math writes $r_{t+1}$, $\hat r_{t+1}$, $\bar r_t$. The return is a
  log *excess* return, so the chapter follows `docs/STYLE_GUIDE.md` §3 and writes $r^e_{t+1}$, $\hat r^e_{t+1}$,
  $\bar r^e_t$.
- Symbols the §3 table lacks (candidates, not added): $R^2_{OS}$; $\bar r^e_t$ as the expanding mean up to $t$ (a bar
  with an end-date subscript); $T_{OS}$, the number of forecasts; $\mathit{CSED}_\tau$, the running score;
  $\mathit{SSE}_{\bar r}$, $\mathit{SSE}_{\hat r}$; $\mathit{cw}_t$ and $\mathit{CW}$ for the Clark–West loss and
  statistic (not $f_t$, which §3 reserves for factors); $\hat\sigma^2_t$, the variance known at $t$; $\bar u$, realised
  mean–variance utility.
- Expected slope signs are a teaching choice, stated in the chapter: positive for dp, dy, ep, de, bm, tms, dfy,
  svar; negative for ntis, tbl, lty, infl. No opened reading gives a table of signs. The sign for `de` is the least
  clear. On annual data the slope of `infl` always has the wrong sign, so with the restriction on its forecast is
  always the mean ($R^2_{OS} = 0$, Clark–West 0).
- Citation form: the spec and curriculum say "Goyal & Welch (2008)"; chapter 9 writes "Welch and Goyal (2008)".
  I followed the spec. A later pass could make the two chapters agree.
- Campbell and Thompson is named only where Goyal & Welch (2008, p. 1483) describe the zero truncation, as the spec
  allows. Inoue and Kilian is named only as reported by Goyal & Welch (2008, p. 1463). Clark–West is taught as a
  method; nothing is attributed to Clark and West (2007), which is not in `source/papers/`.
- Certainty-equivalent gain: `certaintyEquivalentGain` multiplies weights by log excess returns, which its doc
  comment calls an approximation. The chapter says so. The variance is the expanding-window variance of the same
  returns as the benchmark mean, a teaching choice named in the caption.

**Readings opened.** Goyal & Welch (2008), journal pages read with `pdftotext -layout`: pp. 1455, 1461–1465,
1483–1484. Cochrane (2008), NBER WP 12026 version in `source/papers/`, printed pages 23–26. Campbell (2018) is not
supplied and is listed under further reading only.

**Verified revision.** f97f900 on `goal/course-site/task-057`, with `npm ci`, `npm test`, `npm run build`,
`npm run screenshots -- 13-out-of-sample`, `npm run clickthrough -- 13-out-of-sample` and the greps above.
The outcome-only commit after it changes no code.

**Proposed follow-ups.**
- Add the candidate symbols above to the §3 table, in one style-guide PR for Part III.
- Align "Goyal & Welch" / "Welch and Goyal" across chapters 9 and 13.
- If monthly compute time matters on slow phones, a slope-and-intercept-only path in `expandingForecasts`
  (no standard errors) would cut it, as the TASK-053 outcome suggests.
