# TASK-074 outcome: Chapter 20, Momentum

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: after `npm ci` on the branch rebased onto `origin/main` `d35e14e`: `npm test` → `Tests  524 passed (524)`.
  `npm run build` → `Result (148 files): 0 errors, 0 warnings, 1 hint` (the hint is an unused import in
  `src/lib/finance/news.ts`, not from this task), then `[build] Complete!`.
- [x] `npm run screenshots -- 20-momentum` and `npm run screenshots -- 01-returns` pass in both themes at desktop
  and phone size, and I inspected the images.
  Evidence: all 8 lines `✓ chapters_20-momentum-{dark,light}-{desktop,phone}.png` and
  `✓ chapters_01-returns-{dark,light}-{desktop,phone}.png`. I also captured each widget alone in both themes at
  1280px and 360px and looked at every image (see "Screenshots" below).
- [x] `npm run clickthrough -- 20-momentum` passes and reports every widget of the chapter.
  Evidence: `✓ ONE DOLLAR IN STOCKS, T-BILLS AND MOMENTUM · 7 actions at 1280px, 7 actions at 360px`,
  `✓ BUILD THE MOMENTUM FACTOR FROM SIX PORTFOLIOS · 0 actions at 1280px, 0 actions at 360px`,
  `✓ MOMENTUM'S WORST MONTHS, UP CLOSE · 10 actions at 1280px, 10 actions at 360px`. `FactorBuilder` with
  `kind="size-momentum"` has one factor (UMD), so it shows no control; its `size-value` form has the factor
  `Segmented`.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag' src/content/chapters/20-momentum.mdx` gives Hook (16), Intuition (33),
  Formalisation (67), Playground (187), Check yourself (221), Recap & next up (247).
- [x] No hex colour in the chapter or its widgets.
  Evidence: the Verify `grep -nE '#[0-9a-fA-F]{3,8}\b'` over the chapter, `CompoundingPath.tsx`, `CrashZoom.tsx`,
  `FactorBuilder.tsx` and `factorModelSample.ts` prints `no hex colours`. Colours are `var(--c-factor)`,
  `var(--c-return)`, `var(--text-muted)` and `color-mix()` of `var(--c-factor)`.
- [x] The widgets use real data from the chapter's curriculum entry (`mom-monthly`, `ff3-monthly`) and
  `ff6-size-mom-monthly`.
  Evidence: `CompoundingPath momentum` loads `ff3-monthly` and `mom-monthly`; `CrashZoom` loads both through
  `useSeriesData`; `FactorBuilder kind="size-momentum"` loads `ff3-monthly`, `mom-monthly` and
  `ff6-size-mom-monthly`. Every caption names its dataset IDs and sample.
- [x] The outcome holds a voice review and a table of every number in the prose with its test (below).
- [x] The prose is 1,500–3,000 words.
  Evidence: 2,556 words. Command (the one of chapters 9, 10, 13 and 16):
  `awk 'NR>8' src/content/chapters/20-momentum.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1.

| Rule | Line from the chapter |
|---|---|
| Picture first, then the formula | The Intuition shows the momentum dollar against the market dollar before any symbol: "Momentum climbs smoothly for long stretches and then falls off a cliff." |
| Data before theory | Hook: "In 1932-08, Mom lost 52.6% in one month. The market rose 37.1% in the same month." |
| One idea per section | Intuition = one Sharpe ratio, two paths (skewness); Formalisation = signal → factor → alpha → crash beta; Playground = the crashes up close. |
| Start with a question the reader has | "Why does a rule with such a large alpha fall apart exactly when the market recovers?" |
| Write to one reader, as "you"; explain terms; link back | "**skewness**, which measures whether the big surprises are on the upside or the downside (a negative value means the big ones are losses)." Links to Chapters 1, 3 and 16. |
| Give the honest version | "Our data cannot show the size of the effect, because the published portfolios already skip the month." |
| Say what the evidence can and cannot show | "The regression shows *when* the risk is high. It does not capture its full size." and "Our data has no costs, so we cannot say how much of the alpha survives them." |
| Don't skip steps | "Take means of both sides. The residuals average zero in sample, so $\overline{WML} = \hat\alpha + \hat\beta'\bar f$." then "$\hat\alpha = 7.35\% - (-3.89\%) = 11.2\%$". |
| Graduate rigour comes in gradually | Part V (●●): the bear-market regression is written out, then read in words: "In a normal month, $I_{B,t-1} = 0$ and the beta is $\beta_0$. After a bear market, … the beta is $\beta_0 + \beta_B$." |
| Papers in our own words | "Cochrane (2011, p. 1062–1063) puts it in terms of prediction. A tiny serial correlation in individual stock returns, too small to notice in a regression, is enough." |

## Numbers in the prose

Every number comes from library output on the committed data. `tests/chapter20-numbers.test.ts` recomputes it.

| Number in the prose (section) | Test (`describe('chapter 20 prose numbers')`) |
|---|---|
| 1927-01 to 2026-08, 1,196 months (Hook, Playground) | `hook: …` and `playground: …` |
| Mom 7.35% a year, volatility 16.3% (Hook, Recap, FactorBuilder try-this) | `hook: …`; 7.35% of rebuilt UMD in `formalisation: the signal, …` |
| Market 8.31% a year, volatility 18.4% (Hook) | `hook: …` |
| Sharpe ratio 0.45 for both (Hook, Recap) | `hook: …` |
| Negative betas on market and value (Hook) | `hook: …` (`alpha.beta[0]`, `alpha.beta[2]` < 0) |
| FF3 alpha 11.2% a year, t = 7.77 (Hook, Formalisation, Recap) | `hook: …` |
| 1932-08: Mom −52.6%, market +37.1% (Hook) | `hook: …` |
| 2009-04: Mom −34.4%, market +10.2% (Hook, Formalisation) | `hook: …` |
| \$17,985 market and \$8,231 momentum from 1927 (Intuition try-this) | `intuition: …` |
| "drops by more than half in two summer months" of 1932 | `intuition: …` (product of 1932-07 and 1932-08 < 0.5) |
| Skewness 0.15 (market) and −3.02 (Mom) (Intuition) | `intuition: …` |
| 768 months 1945-01 to 2008-12, Sharpe 0.82, skewness −0.60 (Intuition, Playground, Recap) | `intuition: …` |
| Mom mean −0.84% a year from 2009-01 (Intuition) | `intuition: …` |
| Signal example: 11 × 2% then −5%, signal 24.3% (Formalisation) | `formalisation: the signal, …` (`formationReturn`) |
| Legs: small winners 18.8%, small losers 10.0%, big winners 14.6%, big losers 8.7% (FactorBuilder try-this) | `formalisation: the signal, …` |
| \$8,239 rebuilt and \$8,231 published; largest gap 0.10 points in 2026-08 (FactorBuilder try-this) | `formalisation: the signal, …` |
| FF3 betas −0.22, −0.06, −0.46; predicted mean −3.89% (Formalisation) | `formalisation: the signal, …` |
| White t = 8.13; R² 23% (Formalisation) | `formalisation: the signal, …` |
| From 1963-07: alpha 9.80% a year, t = 5.47 (Formalisation) | `formalisation: the signal, …` |
| Fit from 1929-01, 1,172 months, 275 after a bear market (Formalisation, Playground) | `formalisation: the bear-market regression` |
| β̂₀ = 0.04 (t = 1.18), β̂_B = −0.69 (t = −6.84), bear beta −0.64 (Formalisation, Recap, Quiz 3) | `formalisation: the bear-market regression` |
| α̂₀ = 0.78% a month (t = 7.05), α̂_B = −0.40% (t = −1.19) (Formalisation, Quiz 3) | `formalisation: the bear-market regression` |
| Fitted −6.2% (2009-04) and −23.5% (1932-08) (Formalisation) | `formalisation: the bear-market regression` |
| 2001-01: past 24 months −0.1%, market +3.3%; indicator 1 in all ten worst months; under a quarter (Playground) | `playground: …` |
| Quiz 2: 7.35 − (−3.89) = 11.24; Quiz 3: −12.62% | `quiz: …` |
| 24 months, 12, 11, 2%, 5%, 30%, 10 worst months, 2×3, ½ | Definitions of the method or widget settings, not estimates. |

Readings, with the pages opened (`pdftotext -layout`): Cochrane (2011), J. Finance 66, pp. 1060 (momentum among
strategies that do not line up with market, size and value betas), 1062–1063 (a small serial correlation is
enough for momentum), 1075 (why do momentum stocks move together?). Fama & French (1992), p. 451 (the three-year
past return has no power in their FM regressions). Jegadeesh & Titman (1993), Carhart (1997) and Daniel &
Moskowitz (2016) are not in `source/papers/`: the chapter names them only and takes no fact from them.

## Summary

**What.** `src/content/chapters/20-momentum.mdx` (part 5, chapter 20, difficulty 2, prerequisites [19]); new
widgets `src/components/plots/CrashZoom.tsx` and `src/components/plots/FactorBuilder.tsx`; the shared helper
`src/components/plots/factorModelSample.ts`; one optional prop `momentum` on
`src/components/plots/CompoundingPath.tsx`; `tests/chapter20-numbers.test.ts`. Three quizzes.

**How.**
- `factorModelSample.ts`: `useSeriesData(ids)` loads a fixed set of series. `momentumSample` aligns Mom with
  Mkt-RF and RF on the months of `mom-monthly`. `crashView` calls `worstMonths`, `windowBefore`,
  `bearMarketRegression` (24-month lookback) and `growthPath`. `momentumAlpha` builds the `'carhart'` panel with
  `modelPanel` and runs `spanningTest` of Mom on the three FF3 factors. `sortView` calls `sortFactors` for either
  kind and compares each rebuilt factor with the published one (SMB and HML of `ff3-monthly`, or Mom).
- `CompoundingPath momentum`: also loads `mom-monthly` and draws a solid `--c-factor` line for \$1 in RF + Mom,
  with a label and a readout row. The start slider begins at 1927 in this mode. With the prop absent, the widget is
  unchanged: the chapter 1 screenshots pass, and its readout still shows \$19,717 and \$25.53 from 1926.
- `CrashZoom`: a `Select` of Mom's ten worst months. The plot compounds \$1 in Mkt-RF (dashed) and in Mom (solid)
  over the 24 months before the month and through it, with a dashed line at the start of the crash month and a
  legend line in the readout. The readout gives the month's Mom and market returns, the 24-month market return,
  $I_{B,t-1}$, and $\hat\beta_0$, $\hat\beta_B$ (White t) and $\hat\beta_0 + \hat\beta_B$.
- `FactorBuilder`: a 2×3 grid of the six legs with their mean returns and weights (+½, −½, +⅓, 0; solid border
  and fill for bought legs, dashed border for sold legs, so colour is not the only cue), and \$1 in T-bills plus
  the rebuilt factor (wide line) against the published one (dashed, log scale). The readout gives both means,
  both end values and the largest one-month gap.

**Deviations and choices.**
- Chapter 19 had not merged when I finished (checked `origin/main` at `d35e14e`). The chapter names it as
  "Chapter 19, *Size and value*", without a link, and says only that it builds SMB and HML from a 2×3 sort.
  Prerequisites stay `[19]` as the spec asks.
- So I created `FactorBuilder` with the `kind` prop as the chapter 19 spec describes (`'size-value'` default with
  an SMB/HML `Segmented`, `'size-momentum'`), and `factorModelSample.ts` built on `modelPanel` and `sortFactors`,
  so the Part keeps one widget and one helper. TASK-073 should reuse both, not add copies. Its spec asks to reuse
  the loader of `factorTestSample.ts`; that loader only loads `ff3-monthly` and `ff25-size-bm-monthly`, so the helper
  has the small generic `useSeriesData`. The `size-value` form is checked by one extra test (rebuilt SMB and HML
  within 0.1 points of `ff3-monthly` in every month; the largest gap is 0.005 points) but no chapter shows it yet.
- \$1 in a long–short factor is shown as \$1 in T-bills plus the factor (RF + Mom), since the position needs no
  money of its own. The chapter and the captions say so.
- The fitted crash values (−6.2%, −23.5%) are computed in the test from the regression coefficients; the widget
  does not show them.
- Why the signal skips month $t-1$ is taught as the design of the method (one-month reversal, bid–ask effects),
  with the honest remark that our data cannot show it, because the published portfolios already skip the month.

**Mismatches reported (not edited).**
- `docs/CURRICULUM.md` writes the signal as $r_{t-12 \to t-2}$. In `docs/STYLE_GUIDE.md` §3 a lowercase $r$ is a
  log return, and `formationReturn` compounds simple returns. The chapter follows the style guide and writes
  $R_{i,t-12 \to t-2}$. §3 defines $R_{t \to t+k}$ as "the return over the $k$ periods after $t$"; here the
  subscript names the first and last months of an 11-month window, which the chapter states in words.
- Candidates for the §3 table (not added): $WML_t$ (winners minus losers, coloured `\Factor`), $I_{B,t-1}$ (the
  bear-market indicator), $\alpha_0$, $\alpha_B$, $\beta_0$, $\beta_B$ (intercepts and betas in normal and bear
  months), and $R^e_{m,t}$ for the market excess return. No new colour or macro.

**Screenshots.** Inspected: the four full pages of each chapter, and each widget alone in dark and light at 1280px
and 360px. Two problems found and fixed before the final run: the `CrashZoom` caption had an unescaped \$1 that
`RichText` turned into math (311px overflow on phone), and two dashed lines in `CompoundingPath` differed only by
colour (momentum is now solid). The line labels of `CrashZoom` sat on the lines and moved to a legend line.

**Verified revision.** `99425df` (all code of this task, rebased onto `origin/main` `d35e14e`): `npm ci`, `npm test`, `npm run build`, both screenshot runs and the click-through all passed there. The next commit adds only this file.

**Proposed follow-ups.**
- TASK-073: reuse `FactorBuilder` (`kind="size-value"`) and `factorModelSample.ts`; link Chapter 20 once both
  merge, and replace the plain "Chapter 19, *Size and value*" in this chapter with a link.
- Add the §3 candidates above to the style guide in a docs task.
