# TASK-131 outcome: Orchestrator reads Part IX and signs it off

Verified revision: the Verify commands ran on `eb99dc5`, the tip of `main` at the time. It contains the merges of
TASK-127 to TASK-130 (the libraries and Chapters 35 and 36) and of Part X (Chapters 37 to 39), so the links from
Part IX forward could be checked against real chapters.

## Acceptance

- [x] `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
  Evidence, tests: `npm ci` exit 0; `npm test` exit 0, "Test Files 85 passed (85)", "Tests 942 passed (942)".
  Evidence, build: `npm run build` exit 0, "Result (248 files): 0 errors, 0 warnings, 1 hint", "40 page(s) built",
  "Complete!". The hint is the unused `Matrix` import in `src/lib/finance/news.ts`, outside Part IX, already reported by
  TASK-109 and TASK-120.
- [x] `npm run screenshots` and `npm run clickthrough` pass for `35-equity-premium-and-risk-free-rate-puzzles`,
  `36-measuring-consumption` and `08-euler-equation-and-sdf`.
  Evidence, screenshots: exit 0 for each of the three filters, with ✓ for dark-desktop, dark-phone, light-desktop and
  light-phone. Evidence, click-through: exit 0 for each filter, every widget reported at 1280px and 360px: Chapter 35
  `HJBound` power-utility preset (6 actions) and `PuzzleCalculator` (9); Chapter 36 `TimeAveraging` (4) and
  `UnfilterConsumption` (6); Chapter 8 pricing widget (18) and the default `HJBound` (7).
- [x] The outcome holds the four judgements and a `## Sign-off` section.
  Evidence: the sections "Voice", "Widgets", "Shared code and notation" and "Links across Parts", then `## Sign-off`.
- [x] `git diff --name-only origin/main` lists only this task's outcome file.
  Evidence: the command prints `goals/course-site/tasks/TASK-131.outcome.md` and nothing else.

## Summary

I read Chapters 35 and 36 (about 5,500 words with the maths) as source and as built pages, and Chapter 8 and the parts
of Chapters 26, 14, 34, 37, 38 and 39 that they link to or that link back. A Playwright probe, kept in `/tmp` and not
committed, set every widget to the state that each "Try this" prompt describes and read the readout. It also took
element screenshots of all four widgets at 360px in both themes and measured horizontal overflow: 0px on both pages in
both themes, no KaTeX error and no console error. The click-through script drove every control. I read the shared code
that Part IX touches: `consumptionPuzzle.ts`, `consumptionMeasurement.ts`, `puzzleSample.ts`, `consumptionSample.ts`,
`HJBound.tsx` and the other sample modules that load consumption. I changed no chapter, widget, library or doc. I did
not check the paper page numbers (Campbell, Ludvigson, Kroencke).

### Voice

The voice works for a reader who starts from zero, at the Part's ●● level. Each Hook ends on one question that the
reader can feel: stocks beat bills by 6.3% while consumption hardly moves (35), and "is the puzzle in the ruler?"
(36). Terms are defined where they first appear (the lognormal fact, precautionary saving, flow against level,
filter). The one hard fact of Chapter 35, $\mathbb{E}[e^x] = e^{\mu_x + \frac12\sigma_x^2}$, gets a plain reason (the
convexity of $e^x$) before it is used, and each term of the risk-free rate gets a story. Chapter 36 proves its limits
in numbered steps with a plain reading after each, and puts the pure algebra in a `<details>` block. Both chapters
say what they cannot show: the premium's standard error of 1.97%, the correlation of 0.07 that sits well inside two
standard errors of zero, the lognormal assumption that the data reject, "no standard errors" for the unfiltered
estimates, and that Kroencke's estimator is not ours.

Defects, all small:
- Chapter 36, Hook and "Three measures on our data": the Hook says consumption growth has a volatility of 2.08% from
  1931 to 2025 and an implied $\gamma$ of 849, straight after Chapter 35 said 2.17% and 271 for 1930 to 2025. The only
  explanation is one clause far below ("Start the full sample in 1930 instead of 1931, and the reported $\gamma$ falls
  from 849 to 271"). The reason for 1931, that the inverse filter needs the previous year, is in a code comment and
  not in the prose. A reader who opens Chapter 36 after 35 sees two sets of numbers for the same series (change 2).
- Chapter 36, "Try this too": "the dashed line now swings by tens of percent a year". At $\varphi = 0.80$ the readout
  shows a volatility of 10.82%, so "tens of percent" is too strong (change 2).

### Widgets

Each widget teaches what its caption says, and each prose number I compared with a readout matched.

- `HJBound` preset `power-utility` (35): at $\gamma = 5$, ratio 0.11 against the Sharpe ratio 0.45 and "no, below the
  bound". At $\gamma = 20$: 0.46, "yes, inside the region". Lowest $\gamma$ 20.0 and rate 28.2% (annual), 28.5 and 44.3%
  (postwar), 24.6 and 39.2% (quarterly), against data rates of 0.24%, 0.47% and 0.61%.
- `PuzzleCalculator` (35): annual, $\gamma = 5$, $\delta = 0.99$: model 9.58%, matching $\delta$ 1.087. At $\gamma = 15$:
  23.19% and 1.245. Moving $\delta$ to 1 gives 22.19%, one point lower, as the prose says. At $\gamma = 5$ and
  $\delta = 1$, the matching $\delta$ is 1.087, 1.089 and 1.091 in the three samples ("about 1.09 in each"). The
  covariance and Sharpe $\gamma$ read 271/15.0, 898/28.6 and 618/23.9, as the table of the chapter says.
- `TimeAveraging` (36): default seed 36, 90 steps: sample autocorrelation 0.288, exact 0.250, variance ratio 0.610,
  exact 0.667, as the prose says. Exact values at 1, 2, 3 and 10 steps: 0.000, 0.167, 0.211 and 0.246. At one step the
  variance ratio is 1.000.
- `UnfilterConsumption` (36): 1931–2025, 95 years; as reported 2.08%, 0.32, 0.03, 849. At $\varphi = 0.60$: 5.02%,
  −0.25, 0.15, 58. At 0.20: 2.45%, 0.11, 0.07, 260. At 0.80: 10.82%, −0.33, 0.18, 23. The prose matches all of them.
- Layout: no horizontal overflow at 360px in either theme, no KaTeX error, no console error, and no widget has an
  empty readout. Each widget's caption names its series and its sample.

### Shared code and notation

The chapters reuse the shared widgets and libraries without forking them.

- There is one `HJBound`. TASK-129 added the `power-utility` preset; `<HJBound client:visible />` is unchanged and
  Chapter 8 renders it as before. Its readout at seed 1 gives 0.10 at $\gamma = 5$, a lowest $\gamma$ of 22, and 41.5%
  at $\gamma = 22$, as Chapter 8's prose says. Its screenshots and click-through pass (7 actions).
- Consumption is built once. `annualConsumption` (`consumptionPuzzle.ts`) builds it from `fred-consumption-annual` and
  calls `cayInputs` for the quarterly series, as its docstring says. Four sample modules call it: `puzzleSample.ts`,
  `consumptionSample.ts`, `disasterSample.ts` and `longRunRiskSample.ts`. `quarterlySample` and `consumptionMeasures`
  take the quarterly series from `cayInputs`, as does `conditional.ts` for Chapter 26.
- Implied risk aversion is computed once, in `impliedRiskAversion` of `consumptionPuzzle.ts`. `puzzleSample.ts` and
  `measureStats` in `consumptionSample.ts` call it. No component and no other library repeats the formula.
  `impliedRiskFree` is shared the same way (`HJBound`, `PuzzleCalculator`, `habit.ts`).
- No duplicate loading code. `usePuzzleViews` and `useConsumptionData` both go through `useSeriesData`. Their id lists
  differ (four series against three) and overlap, as do the two-series lists of `disasterSample.ts` and
  `longRunRiskSample.ts`. Each list is one line, each module needs its own set, and the series are cached by
  `loadSeries`. That is fine.
- `docs/STYLE_GUIDE.md` §3 has a Part IX block with $\varphi$, $\mu_c$, $\sigma_c$, $\sigma_i$ and $\sigma_{ic}$. Both
  chapters use them as the block says. $\delta$ is the time-discount factor throughout and is never reused, and Chapter
  36 uses no $\delta$. $\phi$ is the AR(1) persistence in the note box of Chapter 36 and $\varphi$ is the filter weight
  in the body; the chapter says why it writes $\varphi$, and the block of §3 explains the pairing and Kroencke's
  $1 - \varphi$. Part X keeps $\varphi_e$ and $\varphi_d$ with subscripts, and its block says so. I found no symbol
  used two ways.

### Links across Parts

Inside Part IX, every sentence about another chapter is true of the merged site.

- Claims checked: Chapter 8 does derive $\SDF{M_{t+1}} = \delta(C_{t+1}/C_t)^{-\gamma}$ and the HJ bound, and its
  widget does use simulated consumption that "Chapter 35 measures". Chapter 14 does build $cay$ from quarterly
  consumption. Chapter 26 does report a huge consumption weight (first-stage $\hat b$ of 331, second-stage 177, from
  a consumption growth standard deviation of 0.93%). Chapter 5 does define the AR(1) persistence $\phi$.
- Into Part X: Chapters 37, 38 and 39 each open on Chapter 35's numbers (1.83%, 2.17%, 20.0, 28.2%, 0.24%, "at least
  15") and these match. Chapters 37 and 38 cite Chapter 36's time-averaging point, and Chapter 38's "pushes this
  autocorrelation toward 1/4" is Chapter 36's result. Chapter 39 uses the lognormal fact of Chapter 35.
- The bridge forward is thin. Chapter 36's Next up names only *Internal and external habits*. Chapter 35 does not
  say that fixes exist, and neither chapter names Chapters 38 and 39 (long-run risk and disasters) or links
  Chapter 37. Chapter 39 begins "Part X gives three answers", so the reader meets the three only in Part X (change 1).
- Chapter 36 names Chapter 35 by title in its note box without a link, and its one link to Chapter 5 is relative
  (`../05-persistence-ar1-and-var/`), where every other cross-link in Parts VIII to X is absolute (change 2).
- A sentence about Chapter 35 that is false in Chapter 37 (change 3): the table of Chapter 37 puts power utility at
  $\gamma = 20.0$, and the text after it says "power utility needed $\delta = 1.245$ in Chapter 35". That $\delta$ is
  Chapter 35's value for $\gamma = 15.0$. At $\gamma = 20.0$ the calculator of Chapter 35 gives 1.310.
- A sentence about another chapter that is stale, outside Part IX (change 4): Chapter 8's note box says "Chapter 7 is not
  written yet". Chapter 7, *Mean–variance and the CAPM*, is on the site. The same stale sentence stands in Chapter 3
  (line 15, about Chapter 2) and Chapter 9 (line 16).

## Sign-off

Four changes. Part IX itself is sound: the maths, the numbers and the widgets agree with the library, and the two
puzzles carry the Part. Each change is small. Route each as an M-11 task to claude opus high.

1. **Chapters 35 and 36, bridge to Part X.** In `src/content/chapters/36-measuring-consumption.mdx`, replace the
   Next up paragraph with one that says the puzzle survives better measurement and that Part X offers three answers,
   each with a link: *Internal and external habits* (Chapter 37), *Long-run risk* (Chapter 38) and *Rare disasters and
   jump risk* (Chapter 39). In `35-equity-premium-and-risk-free-rate-puzzles.mdx`, add one clause to the last
   Recap bullet ("Only a $\delta$ above 1 would fix it") that points to the Next up of Chapter 36 for what changes
   instead.
2. **Chapter 36, wording and links.** In `src/content/chapters/36-measuring-consumption.mdx`: (a) add one sentence to
   the Hook that says the sample starts in 1931, not 1930, because the unfiltered series needs the previous year, so
   its 2.08% and 849 differ from the 2.17% and 271 of Chapter 35; (b) change "swings by tens of percent a year" in
   "Try this too" to name the readout (a volatility of about 11% a year); (c) link Chapter 35 in the note box and
   change the Chapter 5 link to the absolute form `/empirical-finance-lbs/chapters/05-persistence-ar1-and-var/`.
3. **Chapter 37, one number.** In `src/content/chapters/37-internal-and-external-habits.mdx`, in "The answer to
   Chapter 35", change "where power utility needed $\delta = 1.245$ in Chapter 35" to the $\delta$ of the table's
   $\gamma = 20.0$, 1.310 (and say that it is 1.245 at $\gamma = 15$), or move the comparison to $\gamma = 15$. Check
   the numbers with `impliedTimeDiscount` in `src/lib/finance/consumptionPuzzle.ts` and pin the one you keep in
   a test.
4. **Chapter 8, stale note.** In `src/content/chapters/08-euler-equation-and-sdf.mdx` (line 17), replace "Chapter 7
   is not written yet, so here is the short version of the three tools this chapter uses from it" with a link to
   Chapter 7 and "here is the short version of the three tools". Do the same in
   `03-regression-and-standard-errors.mdx` (line 15) and `09-time-varying-expected-returns.mdx` (line 16), after
   checking that the chapters they name are on the site.
