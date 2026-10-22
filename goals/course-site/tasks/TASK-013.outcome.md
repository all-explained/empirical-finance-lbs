# TASK-013 outcome: Reference chapter 1, Returns

## Acceptance

- [x] `npm test` and `npm run build` pass.
  Vitest: `Test Files 5 passed (5)`, `Tests 68 passed (68)`. `astro check`: 0 errors, 0 warnings, 0 hints;
  `2 page(s) built`, `Complete!`.
- [x] `npm run screenshots -- 01-returns` passes: no console, KaTeX or overflow errors.
  It wrote `chapters_01-returns-{dark,light}-{desktop,phone}.png`, all marked ✓. What I saw in the images:
  - Dark desktop: the header reads "Part I · Foundations — Chapter 1", the sidebar marks chapter 1 as current.
    `CompoundingPath` opens on the log scale. The blue market line climbs from \$1 to the "market" label near
    \$10k–\$1M. The dashed line sits clearly above it, and the orange "T-bills" line runs low and smooth.
    The readout shows \$19,717, \$25.53, 0.97%, 0.82%, 0.83% and \$104,161. All formulas render, with
    returns in blue and the risk-free rate in orange. The `<details>` block is collapsed. The calculator shows
    compounded and dashed "added" lines, three price boxes, the slider at 10 periods and a full readout.
    After the review fixes: the `CompoundingPath` x-axis now reads "calendar year" under the 2000 tick; the
    readout still shows 0.97% (11.6% a year), 0.82% (9.9% a year), 0.83% (9.9% a year); the calculator shows
    "+95.3% → \$2.59" and "\$2.00 (wrong)" for 10 periods. In the prose, $\Ret{\bar R}$ and $\Ret{\bar r}$
    are blue, like the readout, and the new logarithm, standard deviation and volatility paragraphs render.
  - Light desktop: the same layout, with darker teal, brown-orange and the light inset plot background.
    Labels, ticks and readout text are readable.
  - Dark and light phone (375px in the screenshot script, 360px in click-through): the plot fills the card
    width, the controls stack below it, and the three price boxes fit in one row. No horizontal scroll.
    The "calendar year" axis label fits under the 2000 tick at 375px.
    After a fix (see Summary), readout values wrap to at most two or three short lines. The quizzes show
    four full-width options each.
- [x] `npm run clickthrough -- 01-returns` passes and reports both widgets:
  `ONE DOLLAR IN STOCKS AND IN T-BILLS · 7 actions at 1280px, 7 actions at 360px` and
  `RETURN CALCULATOR · 3 actions at 1280px, 3 actions at 360px`.
- [x] The six `section-tag` headings are present in the template order: lines 15 Hook, 33 Intuition,
  79 Formalisation, 235 Playground, 251 Check yourself, 277 Recap & next up.
- [x] No hex colour appears in the chapter or the new components: the grep prints `no hex colours`.
- [x] Voice review: see `## Voice review` below.
- [x] The prose is 2,838 words by the command
  `awk '/^---$/{c++; next} c>=2' src/content/chapters/01-returns.mdx | grep -vE '^import ' | wc -w`
  (everything after the frontmatter except import lines). A stricter count that also drops display-math
  blocks and JSX tag and attribute lines gives 2,406:
  `awk '/^---$/{c++; next} c<2{next} /^\$\$$/{m=!m; next} m{next} {print}' src/content/chapters/01-returns.mdx | grep -vE '^(import |<|/>|  [a-z]+=)' | wc -w`.
  Both are inside 1,500–3,000.

## Voice review

One quoted line per rule of style guide §1:

1. Picture first, then the formula. The Intuition section shows the widget before any formula. Formalisation
   then opens with: "Now we write the pictures down."
2. Data before theory. "The answer, from the monthly data in this course: about \$19,700."
3. One idea per section. Intuition has one idea, stated as: "The key fact is that returns **multiply** over
   time." Formalisation has one subsection per kind of return.
4. Start with a question the reader has. "What would that dollar be worth in August 2026?" and
   "So where did the missing \$84,000 go?"
5. Write to "you", short sentences, define each term. "A **return** is how much an investment gains or loses
   over a period, as a fraction of what you put in." And, added after review: "A **logarithm** answers one
   question: to what power must I raise a fixed base to get this number?"
6. Give the honest version. "This is a simplification, and we say so: it drops the cubic and higher terms,
   and it is only good when returns are small."
7. Say what the evidence can and cannot show. "...the average monthly excess return from July 1926 to August
   2026 is 0.70%, about 8.3% a year, with a standard error of 0.15% a month (data `ff3-monthly`)."
8. Don't skip steps. The `<details>` block "Every step of the algebra" writes each step, for example
   "3. The variance is $\sigma^2 = \mathbb{E}[(\Ret{R} - \mu)^2] = \mathbb{E}[\Ret{R}^2] - 2\mu\,\mathbb{E}[\Ret{R}] + \mu^2 = \mathbb{E}[\Ret{R}^2] - \mu^2$."
9. Graduate rigour comes in gradually. Part I level, so even notation is explained: "The symbol $\prod$ means
   "multiply all of these together", as $\sum$ means "add all of these"."
10. Papers in our own words. The books appear only in Further reading ("Campbell (2018), Ch. 1."). Every number
    in the chapter is computed from `ff3-monthly`; no fact, number or example comes from a reading.

Lines changed after re-reading (first pass):

- "it adds up to a log return about 1.7 higher. And $e^{1.7}$ is about 5.3." became "The exact gap between the
  two final values is a total log return of 1.66, and $e^{1.66}$ is about 5.3." ($e^{1.7}$ is 5.47, so the old
  line was false.)
- "Stocks fell by about 84% from 1929 to 1932." became "From August 1929 to June 1932, the stock line fell by
  about 84%." (The peak and trough months were checked in the data.)
- "The solid blue line is \$1 in the stock market." became "The solid blue line, labelled "market", is \$1 in
  the stock market." (Colour is not the only cue; the plot labels match.)

Lines changed after the PR #13 review at `6c7f556` (each money figure rechecked against `ff3-monthly`):

- "a 1% move in 1930 is a few cents, and a 1% move in 2020 is hundreds of dollars" was false. It became "In 1930
  the dollar was worth between \$1.23 and \$2.01, so a 1% move was one or two cents. In 2020 it was worth
  between \$6,091 and \$9,470, so a 1% move was \$61 to \$95." (2020 low is March 2020, high is December.)
- New, before the log-return formula: what a logarithm answers ($\log_{10} 1000 = 3$), that $\log$ is the
  natural log with base $e \approx 2.718$, and what $e$ is ("what \$1 becomes in one period at a 100% rate, if
  the interest is added in tiny pieces"). "Here $\log$ is always the natural logarithm. In the example, ...
  $= 0.0953$" became "In the example, $\Ret{r_{t+1}} = \log 1.10 = 0.0953$, because $e^{0.0953} = 1.10$".
  "undo the log with the exponential" became "undo the log with the exponential, $e$ to that power".
- New, right after variance is defined: "The square root of the variance, $\sigma$, is the **standard
  deviation**. It is a typical size of the distance from the mean, in the same units as the return: if monthly
  returns are often 5% above or below their mean, $\sigma$ is about 5%. In finance, the standard deviation of
  returns is called **volatility**." Both terms are used only after this line (prose, quiz 3, recap).
- New: "(A bar marks an average over time, and a hat marks a value estimated from the data.)", next to the first
  $\hat\sigma$.
- $\bar R$ and $\bar r$ in "Why the average log return is lower" became $\Ret{\bar R}$ and $\Ret{\bar r}$ (and
  $\sum_t \Ret{r_t}$), as in the `CompoundingPath` readout. Style guide §4 says to colour a term where it helps
  match a formula to a plot; these lines point at the readout.
- Rewrapped the uneven lines (the widget intro, the 1929–1932 line, the "more than five times" line, and the
  paragraphs touched above) to the file's width of about 110 characters.

Lines changed after the second review (each checked in the browser):

- "On a **log scale**, each step up the axis multiplies the value by 10." was wrong for the default view, whose
  labels are \$1, \$100, \$10k, \$1M. A first fix said "by 100", but a Playwright read of the y-axis labels
  showed the step depends on the range: 100 for 1926 with simple returns, 10 for 1926 with log returns and for
  1980 and 2000 in both modes. It became "each labelled line is a fixed multiple of the one below it: 10 or 100
  times, as the range needs."
- "Now switch to "log returns"." used a term the chapter defines only later. It became "Now switch to "log
  returns", a second way to measure each month's return. The Formalisation section below defines it."
- Every $R$ and $r$ in math that stands for a return is now wrapped in `\Ret`, as style guide §4 asks: the
  "10% means $\Ret{R} = 0.10$" line, the log approximation $\log(1 + \Ret{R}) \approx \Ret{R} - \tfrac12
  \Ret{R}^2$, all five steps of "Every step of the algebra", and the explanation of quiz 3. A scan of every
  math segment in the chapter and of the strings in both widgets finds no bare $R$ or $r$ left.

## Summary

What: `src/content/chapters/01-returns.mdx` (frontmatter as in style guide §2), and two widgets in
`src/components/plots/`.

- `CompoundingPath` loads `ff3-monthly` with `loadSeries`, converts it with `ff3MarketReturns` (market =
  Mkt-RF + RF), and builds every path with `growthPath`. Controls: linear or log scale, simple or log returns,
  and a start-year slider (1926–2016). The solid lines are the same in both modes. The dashed line compounds
  the average return of the chosen kind, so in "simple" mode it overshoots (\$104,161 against \$19,717) and in
  "log" mode it lands on the true final value. The readout shows both final values, the average simple and log
  monthly returns and `meanLogApprox(mean, sampleVariance)`, each also as 12 × monthly. The caption names
  `ff3-monthly` and both the full and the shown sample period. `useTweened` animates the axis range. The x-axis
  is labelled "calendar year" (`xLabel`), as the calculator labels its axis "periods".
- `ReturnCalculator`: three native number inputs (two prices and a dividend) and a periods slider. The readout
  shows simple, gross and log return, the price and dividend parts, and the value of \$1 after $k$ repeats,
  computed with `simpleReturn`, `logReturn`, `grossGrowth` and `growthPath` in both modes. The dashed line is the wrong
  "add the simple returns" answer. Invalid input (empty or non-positive first price, negative values) shows a
  help message instead of throwing. A total loss shows −∞ for the log return.

Review fix: the small arithmetic that the widgets used to repeat now lives in `src/lib/finance/returns.ts`,
with a Vitest case (`adds equal returns over k periods and builds the wrong added path`):

- `repeatedSum(perPeriod, k)` = k × r. The calculator's "sum of log returns" ($k\,r$) and the "a year"
  figure in `CompoundingPath` (12 × the monthly mean) both use it. Test: 10 · ln 1.1 = 0.95310 = ln(1.1¹⁰),
  12 × 0.0097 = 0.1164, −∞ handled, non-integer k rejected.
- `addedPath(R, k)` = 1 + j·R for j = 0..k, the wrong "add the simple returns" line. Test: [1, 1.1, 1.2, 1.3]
  against 1.1³ = 1.331; −50% three times gives −0.5.
- The gross return readout uses `grossGrowth([R])` instead of `1 + R`.
- What stays in the components is display only: `× 100` to print a percent, `Math.log10` for the log-scale
  axis, and the year fraction for the x coordinate.

Extra Playwright check (temporary script, not committed), after hydration at 360px: next price 150 and
dividend 0 give +50.00% and log +40.55%; next price 50 gives log −69.31%; an empty first price shows the help
message; next price 0 gives −100.00% and log −∞. Switching `CompoundingPath` to log returns makes the dashed
line end at \$19,717. Tab from the mode buttons reaches the slider and ArrowRight moves it to 1927.
0 console errors, no overflow.

Fix made after viewing the phone screenshots: readout values wrapped to four lines. I moved "monthly" into the
labels and split the price/dividend row in two.

Deviations and mismatches to report:

- `shiller-monthly` is left out. `ff3-monthly` already gives the total market return, and the calculator's
  price-change and dividend-yield split teaches why dividends matter. A price-only against total-return
  comparison would need a third widget or a second data path in `CompoundingPath`.
- No shared number input exists. `ReturnCalculator` uses native `<input type="number">` with inline styles that
  use only CSS variables. Shared components were not changed.
- The curriculum lists a `Toggle` control, which does not exist; the widgets use `Segmented`.
- Style guide §3 asks for annualised means in readouts; the spec asks for monthly averages. The readout shows
  both.
- The click-through report prints the slider label as "Repeat the move kkk times", because KaTeX's text
  includes MathML and HTML copies. This is cosmetic, in the shared script.
- No new symbols or colours, so the style guide tables did not change.

Verified revision: the second-review commit on top of `53da590` (chapter, widgets, `returns.ts` and its test);
this outcome is committed with it. Verify was rerun after the final code change.

Local Verify output (run in this order, after the final code change):

```text
npm ci                → exit 0 (npm warns about fsevents install scripts)
 Test Files  5 passed (5)
      Tests  68 passed (68)
- 0 errors
- 0 warnings
- 0 hints
[build] 2 page(s) built in 797ms
[build] Complete!
✓ chapters_01-returns-dark-desktop.png
✓ chapters_01-returns-dark-phone.png
✓ chapters_01-returns-light-desktop.png
✓ chapters_01-returns-light-phone.png
✓ chapters/01-returns/ · ONE DOLLAR IN STOCKS AND IN T-BILLS · 7 actions at 1280px, 7 actions at 360px · segmented "Vertical scale" option "linear scale"; segmented "Vertical scale" option "log scale"; segmented "Kind of return" option "simple returns"; segmented "Kind of return" option "log returns"; slider "Start year"
✓ chapters/01-returns/ · RETURN CALCULATOR · 3 actions at 1280px, 3 actions at 360px · slider "Repeat the move kkk times"
15:## <span class="section-tag">Hook</span> What happened to one dollar since 1926?
33:## <span class="section-tag">Intuition</span> Growth multiplies
79:## <span class="section-tag">Formalisation</span> Three kinds of return
235:## <span class="section-tag">Playground</span> Make your own returns
251:## <span class="section-tag">Check yourself</span> Three quick questions
277:## <span class="section-tag">Recap & next up</span> What you now know
no hex colours
0
exit=1   (accepted under DEC-002: the printed count is exactly 0)
```

GitHub Actions were not run, read or waited for.

Proposed follow-ups:

- A shared `NumberInput` control in `src/components/ui/controls.tsx`, so later calculators do not repeat the
  inline styles.
- In `scripts/clickthrough.mjs`, read control labels without the KaTeX MathML copy.
- Optionally, a `shiller-monthly` price-only against total-return figure in chapter 1 or 2.
