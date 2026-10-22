# TASK-024 outcome

## Acceptance

- [x] `npm test` and `npm run build` pass. After `npm ci` on the resumed branch
  (rebased on `origin/main` at `5138220`): Vitest 18 files, 221 tests pass, including `src/lib/stats/autocorr.test.ts` (8 tests) and
  `tests/chapter04-numbers.test.ts` (6 tests). `astro check` reports 0 errors,
  0 warnings, 0 hints; the build ends with `Complete!`.
- [x] `npm run screenshots -- 04-autocorrelation` passes with four ✓ lines
  (dark/light × desktop/phone), no console, KaTeX or overflow error. What I saw
  (full pages sliced, plus each widget on its own):
  - Dark desktop: the "What you need from Chapter 3" callout, which now opens
    with a link to Chapter 3 (the built `href` resolves to
    `dist/chapters/03-regression-and-standard-errors/`), then the six sections. All
    display maths renders; long equations are split over aligned lines. The
    `OverlapDemo` shows 36 blue monthly bars, the shared months shaded, bracket A
    (solid) and B (dotted) under the bars, and below it the smooth line of
    12-month returns with points A and B. `HACLagExplorer` opens on
    shiller-monthly, 12-month returns, L = 0: red residual-autocorrelation bars
    falling from 0.95 to about zero at lag 12, faded because L = 0, and the
    standard-error curve rising from 0.44% to a plateau near 1.4%.
  - With "simulated (seeded)" and L = 24 (extra capture): the Bartlett weights
    as a dashed line with dots from 1 to 0, every bar solid, and a pink flat
    dashed line for the true standard error (2.22%) above the curve (1.97%).
  - Light desktop and both phones (375 px): same content, legible contrast;
    plots stack above the controls; the readout grid wraps but nothing
    overflows. On the phone the x ticks of the strip show every other label.
- [x] `npm run clickthrough -- 04-autocorrelation` passes and reports both
  widgets: "Two 12-month returns that share months" (4 actions at 1280 px and at
  360 px: gap slider min/max/middle, re-roll) and "How the lag length L changes
  the standard error" (8 actions at each width: lag slider, both horizon options,
  both data options, re-roll). The slider names now print cleanly
  (`Gap j between the windows`, `Lag length L`).
  A first run failed with a 7 px overflow at 360 px from one long inline formula;
  I rewrote that sentence and the run passes.
- [x] The six `section-tag` headings are in template order: line 28 Hook,
  42 Intuition, 74 Formalisation, 227 Playground, 266 Check yourself,
  292 Recap & next up.
- [x] No hex colour: the spec's grep (diff against `origin/main`) lists only
  this task's files, `HACLagExplorer.tsx`, `OverlapDemo.tsx` and the chapter,
  and prints `no hex colours`
  (`hacSample.ts` and `autocorr.ts` hold none either). Colours used:
  `--c-return`, `--c-error`, `--c-model`, `--text`, `--text-muted`.
- [x] Real data and seeded simulation: `HACLagExplorer` opens on
  `shiller-monthly` through `loadSeries` (caption "Data: shiller-monthly,
  1881-02 to 2023-06 …"). Both widgets simulate through `simulatePredictive`
  with an explicit seed (it draws from `normalRng` in `src/lib/math/rng.ts`),
  start at seed 1, show the seed in the readout and offer "Re-roll simulation".
- [x] Voice review and numbers table: see below.
- [x] Prose length: 2,574 words, inside 1,500–3,000. Command (the one used for
  chapter 9; drops frontmatter, imports and `$$` blocks, keeps callouts,
  try-this paragraphs and quizzes):
  `awk 'NR>8' src/content/chapters/04-autocorrelation-and-newey-west.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted
  under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1:

| Rule | Line in the chapter |
| --- | --- |
| Picture first, then the formula | "In the widget, window A is fixed on months 1 to 12. Window B starts $j$ months later." (`OverlapDemo` comes before any equation) |
| Data before theory | "From February 1881 to June 2023, the shiller-monthly data hold 1,709 monthly returns of the US stock market." |
| One idea per section | Formalisation splits into "Where the classical formula goes wrong", "Overlapping returns give an MA($k-1$) error", "The Newey–West estimator", "How to choose $L$". |
| Start with a question the reader has | "Did sliding the window one month at a time really make the estimate three times more precise?" |
| Write to "you", short sentences, explain terms | "So the errors are **autocorrelated**: an error is correlated with the errors of the rows near it in time." A callout links to Chapter 3 and keeps a short reminder of OLS, standard errors and White errors. |
| Give the honest version | "Now treat $X$ as fixed. This is a simplification that keeps the algebra short. Large-sample theory gives the same formula without it." |
| Say what the evidence can and cannot show | "What it cannot show is the mean to the nearest point. A standard error of about 1.4 points means a range of about plus or minus 2.8 points around 8.7%." |
| Don't skip steps in derivations | "The middle step uses the sum $1 + 2 + \dots + (k-1)$, which equals $k(k-1)/2$." The Bartlett non-negativity proof is a 7-step `<details>` block. |
| Graduate rigour comes in gradually (Part I) | Only sums and $(X'X)^{-1}$; the one matrix step ("apply the same steps to $c'z_t$") is stated in words. |
| Papers in our own words | No reading was available; the chapter states no fact from Cochrane (2005), Campbell, Lo & MacKinlay (1997), Newey and West (1987) or Hansen and Hodrick (1980) and lists them under further reading only. |

Lines changed after re-reading:

- "the result is the same when $X$ is random" became "Large-sample theory gives
  the same formula without it" (rule: honest version; the fixed-$X$ result is
  exact only under conditions the chapter does not state).
- "Newey–West tends to understate the standard error … as the simulation shows"
  rested on one seed. It now quotes the 200-seed average (2.00 against 2.22),
  which a test checks (rule: say what the evidence can show).
- "142 separate years" became "142 separate 12-month blocks": the blocks run
  February–January, not calendar years.

## Numbers in the prose

"test X" names a test in `tests/chapter04-numbers.test.ts`, which recomputes
each number from `src/data/series/shiller-monthly.json` or the seeded
simulation through `shillerLogReturns`, `hacPath`, `overlappingSums`,
`simulatedLogReturns` (`src/components/plots/hacSample.ts`), `ols`,
`autocorrelations`, `bartlettWeights`, `overlapCorrelation`,
`overlapMeanVariance` and `arithmeticMean`.

| Number in the prose | Where | Source |
| --- | --- | --- |
| February 1881 to June 2023; 1,709 monthly returns | Hook | test "hook" (first and last return date, length) |
| 1,698 twelve-month returns | Hook, Intuition | test "hook" (`h.y.length`) |
| average 8.7% a year | Hook, Playground | test "hook" (`h.mean`); test "playground: shiller" (monthly mean × 12 is also 8.7) |
| classical SE 0.44 points, t 19.7 | Hook, Playground, Try this, Recap | test "hook" (classical `ols` and NW with L = 0) |
| 142 non-overlapping blocks, mean 8.7%, SE 1.45, t 6.0 | Hook, Intuition, Playground | test "hook" |
| "three times more precise" | Hook | test "hook" (1.45/0.44 rounds to 3) |
| 11 shared months, 1 leaves / 1 enters, months 1–12 and 2–13 | Intuition | arithmetic of two 12-month windows one month apart |
| 11/12 = 0.92; sample 0.91 | Intuition | test "intuition" (`overlapCorrelation(12,1)`, ACF of seed 1) |
| gaps 6 and 12; zero at 12 | Intuition Try this | test "intuition" (`overlapCorrelation(12,12) = 0`); slider range 0–24 |
| 11/12 at lag 1, 1/12 at lag 11 | Formalisation | test "formalisation" |
| $S = k^2\sigma^2$; $\sqrt{12} = 3.46$ | Formalisation, Playground, Recap | test "formalisation" (`overlapMeanVariance` limit 144; `sqrt(12)`) |
| weight 0.5 at lag 6 with L = 11 | Formalisation, quiz 3 | test "formalisation" (`bartlettWeights(11)[6]`) |
| bars 0.95 at lag 1, 0.07 at lag 11 | Playground Try this | test "playground: shiller" |
| L = 12: SE 1.30, t 6.7 | Playground Try this | test "playground: shiller" |
| L = 24: SE 1.38, t 6.3; "above 6" | Playground, Recap | test "playground: shiller" |
| L from 0 to 24 | Playground | `MAX_LAG = 24`, asserted in test "playground: shiller" |
| 3.1 times larger | Playground | test "playground: shiller" (`se[24]/se[0]`) |
| 1-month: classical 1.19, lag-1 autocorrelation 0.26, NW L = 24 1.49 | Playground | test "playground: shiller" |
| ±2.8 points; "about 1.4 points" | Playground | test "playground: shiller" (`2·se[24]`); 1.38 rounded |
| simulation: true SE 2.22, classical 0.66, t 7.9, NW L = 24 1.97 | Playground Try this | test "playground: seeded simulation" |
| re-roll three times to seed 4, mean −0.6%; true mean 6%; misses by more than six points | Playground | test "playground: seeded simulation" (re-roll adds 1 to the seed) |
| 50 years of data | Playground | test "playground: seeded simulation" (`SIM_MONTHS / 12`) |
| seeds 1 to 200: average 2.00 below 2.22 | Playground | test "Newey–West understates on average" |
| quiz 1: 24-month windows 6 apart, 18/24 = 0.75 | Check yourself | hand arithmetic; the formula is `overlapCorrelation` (tested in `autocorr.test.ts`) |
| quiz 2: about 3.5; distractors 11, 12 | Check yourself | √12 tested above; 11 and 12 are wrong options |
| quiz 3: L = 11, "at least 100" | Check yourself | 0.5 at lag 6 tested; 100 is a wrong option |
| Chapters 3, 5, 9 | Callout, Formalisation, Next up | chapter numbers in `docs/CURRICULUM.md` |

## Summary

What: chapter 4, `src/content/chapters/04-autocorrelation-and-newey-west.mdx`;
widgets `src/components/plots/HACLagExplorer.tsx` and
`src/components/plots/OverlapDemo.tsx`, with the shared data module
`src/components/plots/hacSample.ts`; the library
`src/lib/stats/autocorr.ts` (`autocorrelations`, `bartlettWeights`,
`overlapCorrelation`, `overlapMeanVariance`) with tests; and
`tests/chapter04-numbers.test.ts`.

How: the chapter teaches the problem through the simplest regression, the mean
of overlapping 12-month returns (a regression on a constant). This keeps the
chapter apart from chapter 9, which already showed classical vs Newey–West vs
Hansen–Hodrick on the dividend–price regression. The Formalisation derives
$\operatorname{Var}(\hat\beta) = (X'X)^{-1}TS(X'X)^{-1}$, the MA($k-1$) error and
the $\sqrt{k}$ understatement, and proves that Bartlett weights keep the
variance non-negative (the moving-sum identity). `HACLagExplorer` runs
`ols(…, 'newey-west', lags: L)` for every L from 0 to 24 on shiller-monthly
log returns (price plus one-twelfth of the annual dividend), or on a seeded
i.i.d. simulation at the style-guide default (600 months, 0.5% mean, 4.5%
volatility) where the true standard error is known exactly. A test checks that
`bartlettWeights` plus `autocorrelations` reproduce the `ols` Newey–West
variance, so the two never drift apart.

Deviations and mismatches to report (no edits made to the curriculum or style guide):

- Notation: the curriculum's key math writes residuals as $\hat u_t$; the style
  guide reserves $u_t$ for a second equation's shocks and uses $\varepsilon$ for
  residuals, so the chapter writes $\hat\varepsilon_t$.
- New symbols not in the style guide tables: $\Gamma_j$, $S$, $L$, $w_j$,
  $z_t$. The chapter also uses $x_t$ for the regressor vector (including the
  constant), while the table lists $x_t$ as a predictor in `\Signal`; it is
  uncoloured here. The chapter avoids $\rho$ (Campbell–Shiller) and $\gamma$
  (risk aversion) for autocorrelations and autocovariances.
- The Bartlett weights appear in neutral `--text` because §4 has no role for
  them.
- One display equation ($\operatorname{Var}(\hat\beta)$ with the sum) is 21 px
  wider than the 360 px column and scrolls inside its own box; the page itself
  does not overflow.
- The lag-1 autocorrelation of one-month Shiller returns (0.26) is reported
  without a cause, because no available source documents how the price series
  is sampled.

No library defect found; no shared code changed.

Verified revision: `ca08e3c` (chapter, widgets, library, tests, rebased on
`origin/main` at `5138220`) plus this outcome commit. `npm ci`, tests, build,
screenshots and click-through were run on `ca08e3c`.

## Resume (review at `8599249`)

The review found one false sentence: the opening callout said Chapter 3 is not
written yet. Changes:

- Rebased on `origin/main`, which now has Chapter 3 (and Chapter 8).
- The callout now starts "[Chapter 3](../03-regression-and-standard-errors/)
  builds these ideas in full. Here is a short reminder of what this chapter
  uses." The three reminder bullets stay.
- The same claim is fixed in the voice review above. The old follow-up ("when
  chapter 3 is written, replace the recap callout") is done and removed.
- `src/lib/stats/autocorr.ts` is unchanged.
- The full Verify was re-run on the new base; results are in Acceptance.

Follow-ups: none.
