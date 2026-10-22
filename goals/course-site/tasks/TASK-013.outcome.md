# TASK-013 outcome: Reference chapter 1, Returns

## Acceptance

- [x] `npm test` and `npm run build` pass.
  Vitest: `Test Files 5 passed (5)`, `Tests 67 passed (67)`. `astro check`: 0 errors, 0 warnings, 0 hints;
  `2 page(s) built`, `Complete!`.
- [x] `npm run screenshots -- 01-returns` passes: no console, KaTeX or overflow errors.
  It wrote `chapters_01-returns-{dark,light}-{desktop,phone}.png`, all marked ✓. What I saw in the images:
  - Dark desktop: the header reads "Part I · Foundations — Chapter 1", the sidebar marks chapter 1 as current.
    `CompoundingPath` opens on the log scale. The blue market line climbs from \$1 to the "market" label near
    \$10k–\$1M. The dashed line sits clearly above it, and the orange "T-bills" line runs low and smooth.
    The readout shows \$19,717, \$25.53, 0.97%, 0.82%, 0.83% and \$104,161. All formulas render, with
    returns in blue and the risk-free rate in orange. The `<details>` block is collapsed. The calculator shows
    compounded and dashed "added" lines, three price boxes, the slider at 10 periods and a full readout.
  - Light desktop: the same layout, with darker teal, brown-orange and the light inset plot background.
    Labels, ticks and readout text are readable.
  - Dark and light phone (375px in the screenshot script, 360px in click-through): the plot fills the card
    width, the controls stack below it, and the three price boxes fit in one row. No horizontal scroll.
    After a fix (see Summary), readout values wrap to at most two or three short lines. The quizzes show
    four full-width options each.
- [x] `npm run clickthrough -- 01-returns` passes and reports both widgets:
  `ONE DOLLAR IN STOCKS AND IN T-BILLS · 7 actions at 1280px, 7 actions at 360px` and
  `RETURN CALCULATOR · 3 actions at 1280px, 3 actions at 360px`.
- [x] The six `section-tag` headings are present in the template order: lines 15 Hook, 33 Intuition,
  75 Formalisation, 220 Playground, 236 Check yourself, 262 Recap & next up.
- [x] No hex colour appears in the chapter or the new components: the grep prints `no hex colours`.
- [x] Voice review: see `## Voice review` below.
- [x] The prose is 2,611 words by the command
  `awk '/^---$/{c++; next} c>=2' src/content/chapters/01-returns.mdx | grep -vE '^import ' | wc -w`
  (everything after the frontmatter except import lines). A stricter count that also drops display-math
  blocks and JSX tag and attribute lines gives 2,179:
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
   over a period, as a fraction of what you put in."
6. Give the honest version. "This is a simplification, and we say so: it drops the cubic and higher terms,
   and it is only good when returns are small."
7. Say what the evidence can and cannot show. "...the average monthly excess return from July 1926 to August
   2026 is 0.70%, about 8.3% a year, with a standard error of 0.15% a month (data `ff3-monthly`)."
8. Don't skip steps. The `<details>` block "Every step of the algebra" writes each step, for example
   "3. The variance is $\sigma^2 = \mathbb{E}[(R - \mu)^2] = \mathbb{E}[R^2] - 2\mu\,\mathbb{E}[R] + \mu^2 = \mathbb{E}[R^2] - \mu^2$."
9. Graduate rigour comes in gradually. Part I level, so even notation is explained: "The symbol $\prod$ means
   "multiply all of these together", as $\sum$ means "add all of these"."
10. Papers in our own words. The books appear only in Further reading ("Campbell (2018), Ch. 1."). Every number
    in the chapter is computed from `ff3-monthly`; no fact, number or example comes from a reading.

Lines changed after re-reading:

- "it adds up to a log return about 1.7 higher. And $e^{1.7}$ is about 5.3." became "The exact gap between the
  two final values is a total log return of 1.66, and $e^{1.66}$ is about 5.3." ($e^{1.7}$ is 5.47, so the old
  line was false.)
- "Stocks fell by about 84% from 1929 to 1932." became "From August 1929 to June 1932, the stock line fell by
  about 84%." (The peak and trough months were checked in the data.)
- "The solid blue line is \$1 in the stock market." became "The solid blue line, labelled "market", is \$1 in
  the stock market." (Colour is not the only cue; the plot labels match.)

## Summary

What: `src/content/chapters/01-returns.mdx` (frontmatter as in style guide §2), and two widgets in
`src/components/plots/`.

- `CompoundingPath` loads `ff3-monthly` with `loadSeries`, converts it with `ff3MarketReturns` (market =
  Mkt-RF + RF), and builds every path with `growthPath`. Controls: linear or log scale, simple or log returns,
  and a start-year slider (1926–2016). The solid lines are the same in both modes. The dashed line compounds
  the average return of the chosen kind, so in "simple" mode it overshoots (\$104,161 against \$19,717) and in
  "log" mode it lands on the true final value. The readout shows both final values, the average simple and log
  monthly returns and `meanLogApprox(mean, sampleVariance)`, each also as 12 × monthly. The caption names
  `ff3-monthly` and both the full and the shown sample period. `useTweened` animates the axis range.
- `ReturnCalculator`: three native number inputs (two prices and a dividend) and a periods slider. The readout
  shows simple, gross and log return, the price and dividend parts, and the value of \$1 after $k$ repeats,
  computed with `simpleReturn`, `logReturn` and `growthPath` in both modes. The dashed line is the wrong
  "add the simple returns" answer. Invalid input (empty or non-positive first price, negative values) shows a
  help message instead of throwing. A total loss shows −∞ for the log return.

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

Verified revision: `8fcd553` (chapter and widgets); this outcome is the only later change.

Local Verify output (run in this order, after the final code change):

```text
npm ci                → exit 0 (npm warns about fsevents install scripts)
 Test Files  5 passed (5)
      Tests  67 passed (67)
- 0 errors
- 0 warnings
- 0 hints
[build] 2 page(s) built in 1.01s
[build] Complete!
✓ chapters_01-returns-dark-desktop.png
✓ chapters_01-returns-dark-phone.png
✓ chapters_01-returns-light-desktop.png
✓ chapters_01-returns-light-phone.png
✓ chapters/01-returns/ · ONE DOLLAR IN STOCKS AND IN T-BILLS · 7 actions at 1280px, 7 actions at 360px · segmented "Vertical scale" option "linear scale"; segmented "Vertical scale" option "log scale"; segmented "Kind of return" option "simple returns"; segmented "Kind of return" option "log returns"; slider "Start year"
✓ chapters/01-returns/ · RETURN CALCULATOR · 3 actions at 1280px, 3 actions at 360px · slider "Repeat the move kkk times"
15:## <span class="section-tag">Hook</span> What happened to one dollar since 1926?
33:## <span class="section-tag">Intuition</span> Growth multiplies
75:## <span class="section-tag">Formalisation</span> Three kinds of return
220:## <span class="section-tag">Playground</span> Make your own returns
236:## <span class="section-tag">Check yourself</span> Three quick questions
262:## <span class="section-tag">Recap & next up</span> What you now know
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
