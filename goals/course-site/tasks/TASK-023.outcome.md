# TASK-023 outcome: Chapter 3, Regression and standard errors

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  After `npm ci`: `Test Files 13 passed (13)`, `Tests 185 passed (185)`. Build: `- 0 errors`, `- 0 warnings`,
  `- 0 hints`, `[build] Complete!`.
- [x] `npm run screenshots -- 03-regression` passes in both themes at desktop and phone size, and the images were
  inspected. Output: `✓` for `…-dark-desktop.png`, `…-dark-phone.png`, `…-light-desktop.png`,
  `…-light-phone.png`. I read crops of the dark desktop page (widget, derivations, playground, quizzes) and
  widget-only shots in both themes at 1280px and 360px. A first run found a 2px/17px overflow at phone width (a
  long option in the `Data` select); the labels were shortened. A dashed band that crossed the x-axis labels is
  now clipped to the plot box.
- [x] `npm run clickthrough -- 03-regression` passes and reports every widget of the chapter (two instances of
  `RegressionLab`): `✓ … HOW MUCH DOES A STOCK MOVE WITH THE MARKET? · 7 actions at 1280px, 7 actions at 360px ·
  segmented "Standard errors" option "classical"; segmented "Standard errors" option "White"; select "Data";
  button "Reset dragged dots"; button "Re-roll simulation"`, printed once per instance.
  A separate Playwright run (1280px and 360px, light theme, reduced motion) checked what clickthrough cannot:
  the White toggle changes the readout from 0.140 / 8.18 to 0.175 / 6.53; five `ArrowUp` presses on a focused dot
  and a mouse drag both move the fit; "Reset dragged dots" restores 1.14; three re-rolls of the fanning case give
  seed 4 with slope 1.56 and White standard error 0.189; 0 console errors.
- [x] The six `section-tag` headings are in template order: lines 24 Hook, 41 Intuition, 71 Formalisation,
  231 Playground, 254 Check yourself, 280 Recap & next up.
- [x] No hex colour in the chapter or its widgets: the Verify command prints `no hex colours`.
- [x] At least one widget uses real data from the chapter's curriculum entry, and every simulation is seeded.
  The real preset loads `ff3-monthly` (Mkt-RF, RF) through `loadSeries`, with `ff25-size-bm-monthly` for the
  left-hand portfolio (see Deviations). The simulation uses `normalRng(seed)` from `src/lib/math/rng.ts`, default
  seed 1, with a re-roll button.
- [x] Voice review: see `## Voice review`. Numbers table: see `## Numbers in the prose`.
- [x] Prose length: 2,539 words, inside 1,500–3,000. Command (same as TASK-014; drops the frontmatter, imports
  and `$$` display blocks; counts callouts, try-this paragraphs and quizzes):
  `awk 'NR>8' src/content/chapters/03-regression-and-standard-errors.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1:

| Rule | Line from the chapter |
|---|---|
| Picture first, then the formula | The Intuition widget and the plank picture come before any formula: "They act like the ends of a plank resting on a pivot in the middle of the cloud." The derivation then finds the same plank: "The weights grow with the distance $x_t - \bar x$: that is the plank." |
| Data before theory | The Hook opens on real data: "On the last five years of monthly data, from September 2021 to August 2026, big value stocks have a beta of 1.14." |
| One idea per section | Each Formalisation subsection carries one idea: "The line with one regressor", "How precise is the slope?", "Classical standard errors", "White standard errors", "What White standard errors cannot fix". |
| Start with a question the reader has | "The market falls sharply next month. How much should you expect your stocks to fall? And how sure can you be of that answer?" |
| Write to "you", short sentences, explain terms | "Each thin vertical line is a **residual**: the gap between a dot and the line." Chapter 2 does not exist, so the opening callout recaps it in plain words instead of linking. |
| Give the honest version | "They are a large-sample approximation, and with few observations they tend to be a little too small." |
| Say what the evidence can and cannot show | "The five-year beta of 1.14 and the long-sample beta of 1.30 differ, but we have not tested whether that gap is more than chance." Every estimate names its standard errors and sample. |
| Don't skip steps in derivations | "Both $\sum_t (y_t - \bar y)$ and $\sum_t (x_t - \bar x)$ are zero, so we may replace the first $x_t$ by $x_t - \bar x$ without changing the sum." |
| Graduate rigour comes in gradually (Part I) | The slope is derived with sums first, then "The same estimator with matrices" repeats it with $X'X$ for $K$ regressors. |
| Papers in our own words | "White's idea is that we do not need to. We only need the weighted sum in the middle of the sandwich, and each squared residual stands in for its own month's variance." No text, figure or number is taken from a reading. |

## Numbers in the prose

Every test is in `tests/chapter03-numbers.test.ts`. "Recent" is the 60 months 2021-09 to 2026-08; "full" is all
1,202 months 1926-07 to 2026-08; the portfolio is `ME5-BM5` excess return on `Mkt-RF`.

| Number | Where | Test |
|---|---|---|
| September 2021, August 2026, 60 months | Hook, Playground, widget | `samples` |
| 1,202 months, July 1926 | Hook, Formalisation, Recap | `samples` |
| β̂ = 1.14 (recent) | Hook, Formalisation | `last five years` |
| se 0.140 classical, 0.175 White (recent) | Hook | `last five years` |
| intercept 1.33% a month, classical t 2.05 (recent) | Formalisation | `last five years` |
| t 8.18 classical, 6.53 White (recent) | Formalisation | `last five years` |
| t for β = 1: 1.02 classical (recent) | Formalisation | `last five years` |
| band 0.86 to 1.42 (recent, classical ± 2 se) | Formalisation | `last five years` |
| R² 53.6% (recent); 54% in a quiz | Formalisation, Quiz 3 | `last five years` |
| se 0.027 classical, 0.069 White (full) | Hook | `all 1,202 months` |
| White / classical = 2.6 (full) | Hook, Formalisation, Recap | `all 1,202 months` |
| β̂ = 1.30, R² 66.7% (full) | Formalisation | `all 1,202 months` |
| t for β = 1: 11.5 classical, 4.4 White (full) | Formalisation | `all 1,202 months` |
| four months with a market move above 25%, all 1931–1933 | Formalisation | `all 1,202 months` |
| nine of the ten largest residuals in the 1930s | Formalisation | `all 1,202 months` |
| 1.96 | Formalisation | `normal approximations` (`invCdf(0.975)`) |
| about 95% for ± 2 se; q = 5% | Chapter 2 callout, Formalisation | `normal approximations` (`2·cdf(2) − 1`) |
| 60 months, mean 0.5%, volatility 4.5%, true beta 1.2, noise 4% | Playground, widget caption | `seeded simulation` checks 60; the other four are the parameters of `simulatedSample` (style-guide defaults; 1.2 and 4% chosen here) |
| fanning, seed 1: β̂ 1.23, se 0.111 classical, 0.158 White, ratio 1.4 | Playground | `seeded simulation` |
| even, seed 1: se 0.121 classical, 0.119 White | Playground | `seeded simulation` |
| fanning, seed 4: β̂ 1.56, se 0.100 / 0.189, bands 1.36–1.76 and 1.18–1.94 | Playground | `seeded simulation` |
| Quiz 1: 0.8, 0.1, −2 | Quiz | hypothetical inputs; the answer is the formula in the text |

## Summary

**What.** `src/content/chapters/03-regression-and-standard-errors.mdx` (frontmatter `part: 1`, `chapter: 3`,
`difficulty: 1`, `prerequisites: [2]`), the `RegressionLab` widget, its data helper
`src/components/plots/regressionSample.ts`, and `tests/chapter03-numbers.test.ts`.

**How.** The chapter derives the OLS slope with sums and then with matrices, derives $\hat\beta - \beta$ as a
weighted sum of errors, builds the sandwich variance, and gets the classical and White (HC0) estimators from it.
It covers $t$, $R^2$ and the limits of White errors. `RegressionLab` draws 60 draggable dots (pointer and arrow
keys, 44px touch targets, an `aria-label` per dot), the OLS line, residuals, and dashed lines at slope ± 2
standard errors. The dashed lines tween when the reader toggles classical/White (`useTweened`, which respects
`prefers-reduced-motion`). All estimates come from `ols` in `src/lib/stats/ols.ts` (unchanged); the mean for the
pivot comes from `arithmeticMean`. The chapter uses the widget twice: real data in Intuition, the seeded fanning
case in Playground.

**Deviations.**
- `ff3-monthly` holds factors only, not a single stock. The "stock" of the preset is the French portfolio
  `ME5-BM5` (big value stocks) from `ff25-size-bm-monthly`, minus `RF` from `ff3-monthly`, on `Mkt-RF`.
  No security-level data is used.
- The widget shows the last 60 months, not all 1,202, so that each dot can be dragged. The full-sample numbers
  are in the prose and tested.
- Notation mismatches, reported and not edited (out of scope):
  - The curriculum writes residuals as $\hat u_t$. The chapter uses $\hat\varepsilon_t$, as in the style-guide
    table, where $u_t$ names a second equation's shocks.
  - The chapter uses $x_t$ for the regressor vector and says in words that Part II uses the same letter for a
    predictor. The §3 table lists $x_t$ only as a predictor.
  - $y_t$, $X$, $\hat\sigma^2$ and $\mathrm{se}(\cdot)$ are not in the §3 table.
  - The market-model intercept is written $a_i$, not $\alpha_i$. The chapter says that Chapter 7 calls it alpha.
- Further reading cites White (1980) and Fama and French (1993), which are not in `source/papers/`. No fact or
  number in the chapter is taken from them or from the two books.

**Known limits.** On a phone, the 60 touch targets cover the plot, so a vertical swipe that starts on the plot
drags a dot instead of scrolling the page (Mafs sets `touch-action: none` on movable points). Both instances of
the widget share one title.

**Process note.** While I verified, another worktree (task-024) held the shared preview port 4329. Issue #15
already reports this, so I filed nothing new. I reran every browser check only when the port was free.

**Verified revision.** `ce843bb` (all code, the chapter and the test). `npm ci`, the tests, the build, the
screenshots, the clickthrough and the Playwright checks all ran on it. The commit after it adds only this file.

**Proposed follow-ups.**
- Add the regression symbols ($y_t$, $X$, $\hat\sigma^2$, $\mathrm{se}$) and the regressor reading of $x_t$ to the
  style-guide notation table.
- Align the curriculum's $\hat u_t$ with $\hat\varepsilon_t$.
