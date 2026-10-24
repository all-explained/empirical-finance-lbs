# TASK-078 outcome: Orchestrator reads Part V and signs it off

I read chapters 19 to 23 on `main` at `26a135e` (the merge base of this branch). I read the MDX source, and I read the
library and widget code that each chapter uses. I changed no chapter, widget, library or doc.

## Acceptance

- [x] `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exited 0. `npm test` printed `Test Files  52 passed (52)` and `Tests  546 passed (546)`, exit 0.
  `npm run build` printed `Result (163 files): - 0 errors - 0 warnings - 1 hint`, then `24 page(s) built`, exit 0.
  The hint is the unused `Matrix` import at `src/lib/finance/news.ts:7` (Part II, not Part V).
- [x] `npm run screenshots` and `npm run clickthrough` pass for the five chapters.
  Evidence: all ten runs exited 0. Each screenshots run printed four `✓` lines (dark and light, desktop and
  phone). Clickthrough printed `✓` for all 11 widget instances, each at 1280px and 360px: chapter 19 two (5 and 2
  actions), chapter 20 three (7, 0 and 10 actions), chapter 21 two (6 and 9), chapter 22 two (7 and 6), chapter 23
  two (5 and 3). The chapter 20 `FactorBuilder` has 0 actions because the momentum version has one factor and so no control.
- [x] The outcome holds the four judgements and a `## Sign-off` section.
  Evidence: the sections below. The sign-off is a numbered list of eight changes.
- [x] `git diff --name-only origin/main` lists only this task's outcome file.
  Evidence: after the commit it prints `goals/course-site/tasks/TASK-078.outcome.md` and nothing else.

What I did and did not do. I ran the Verify commands twice, once on `6ec5855` and again after `main` moved to
`26a135e` (TASK-080 changed Chapters 13 to 15); the numbers above are from the second run. The clickthrough script
uses every control at both widths, so I did not repeat that by hand. I viewed element crops of four pages (chapter 19
desktop light, chapter 20 phone dark, chapter 22 desktop dark, chapter 23 phone light): no overflow, no KaTeX error,
no clipped control. I did not read the other 16 page images, and I did not check page numbers in citations against
the private PDFs (`source/` is not in this worktree). I did check the arithmetic and the cross-chapter claims
described below.

## 1. Does the voice work for a reader who starts from zero?

Yes, with small faults. All five chapters follow the template and `docs/STYLE_GUIDE.md` §1.

- Each hook has a real number and a question. Chapter 19: small value stocks have the lower beta and earn 9.41 points
  more. Chapter 20: a rule with an alpha of 11.2% that loses 52.6% in one month. Chapter 21: 158 of 165 predictors pass
  in-sample and 66 after. Chapter 22: an $R^2$ of 0.07 that becomes 0.55. Chapter 23: HML and Mom alphas that a
  moving beta might explain.
- New words are defined where they first appear: size, book-to-market, value, growth, anomaly, long–short portfolio,
  spanned, scaled factor, managed portfolio, microcap. The shop-and-crowd comparison in Chapter 23 is a good one.
- Derivations show their steps. Chapter 19 shows why SMB and HML average over the other sort. Chapter 22 derives the
  unconditional alpha in four steps. Chapter 23 puts its long algebra in a `<details>` block and states the result
  first.
- Each chapter says what its evidence cannot show: the 25 portfolios are a friendly test for FF3 (19), the Sharpe ratio of
  a skewed strategy depends on the sample (20), a higher $t$ line misses real predictors (21), a high $R^2$ is a low
  bar (22), and the bound is an argument about magnitudes (23). Chapter 21 says plainly that its widget cannot show the
  portfolio-construction effect, because that data is not on the site.
- I recomputed the counts and ratios I could check by hand and found no error: 758, 750 and 1,196 months; the Sharpe
  ratios 0.45 and 0.45; $1.02^{11} - 1 = 24.3\%$; the 1,172 and 275 bear-market months; the bear-market quiz
  $0.78 - 0.40 + (0.04 - 0.69) \times 20 = -12.62\%$; the 41% and 38% bound shares; the 14.6% and 15.7% premium
  needed; the 160 years in Chapter 22; the algebra of Steps 1 to 3 in Chapter 23.

Where the voice loses a newcomer:

- **Three names for one factor.** Chapter 20 says "Mom" in the hook, "WML" in the formulas and "UMD" in the widget
  label ("UMD rebuilt (wide) and Mom published (dashed)"). The chapter explains it in one sentence (line 106), but the
  reader still meets three names. Chapter 21 and 23 say "Mom".
- **Maths in plain text.** Chapter 20 writes "(t = 1.18)", "(t = −6.84)" and "(t = 7.77)" outside math (lines 173–176
  and 253). Chapters 19, 21, 22 and 23 write $t = 1.35$ in math. The plain version renders without the italic $t$ and
  with a different minus sign.
- **A false attribution.** Chapter 19 (line 63) says "An idea from Chapter 7: if a small set of portfolios reaches
  the highest Sharpe ratio, then the betas on those portfolios explain every mean". Chapter 7 shows this only for the
  market portfolio. The several-factor version is in Chapter 16 (quiz explanation: "the factors already reach the
  tangency portfolio").
- Chapter 22 is long and dense in its Formalisation (five sub-sections, with a four-step derivation in the third). It
  reads well with the widget and the Callout, so I list no change. Later Parts should not go denser.

## 2. Does each widget teach what its caption says?

Yes for all 11 widget instances. The clickthrough exercised every control at 1280px and 360px, and I checked each
"Try this" number against the chapter text and the library code that feeds it.

- `SortGrid` (19). Yes. The three "Colour by" and "Model" controls change the grid; the mean and alpha numbers in the
  text (3.96% to 13.37%, −6.28%, +5.69%, FF3 to −5.58%) are the readout's.
- `FactorBuilder` size–value (19). Yes. SMB and HML rebuilt lie on the published lines, with a gap of 0.01 points.
- `CompoundingPath` with `momentum` (20). Yes. The third line and the 1927 and 1945 starts show the two paths.
- `FactorBuilder` size–momentum (20). Yes, with one caption fault: the caption says stocks are "split at the median
  size, then into thirds on past return" (and "into thirds on book-to-market" for Chapter 19). The chapters use the 30th
  and 70th percentiles (30/40/30), not thirds. `FactorBuilder.tsx` line 142.
- `CrashZoom` (20). Yes. The ten worst months, the 24-month window and the bear-market indicator match the text (indicator
  is 1 in all ten).
- `ZooChart` (21). Yes. The line from 1.96 to 3.00 gives 158 to 107 in-sample and 31 after; the one option in
  "Portfolio construction" matches the chapter's own warning.
- `SpanningTest` (21). Yes. HML in three samples, Mom and SMB match the text.
- `ConditionalBeta` (22). Yes. The identity $\bar\beta\bar\lambda + \operatorname{Cov}$ and the alpha with a 0 or −0.40 beta move
  are in the readout.
- `ScaledFactors` (22). Yes. The four $R^2$ values (0.02, 0.07, 0.55, 0.82) and the 2026-Q2 sample match.
- `RollingBeta` (23). Yes. The window from 12 to 120 months and the quarterly dots match.
- `AlphaBound` (23). Yes. 1.88% and 3.27% at 6% a year, and 14.6% and 15.7% needed, match.

Layout: no widget overflows at 375px in the pages I viewed, and the sample themes match.

## 3. One data helper and one notation?

**Data helpers: one `FactorBuilder`, but not one loader.** Chapters 19 and 20 share one `FactorBuilder`
(`kind="size-value"` and `kind="size-momentum"`), and `SortGrid` reuses Part IV's `useFactorData` through
`sizeValueSample.ts`. There is no duplicate `FactorBuilder`. Two things are not as the plan intends:

- **The loading hook is written six times.** `useSeriesData(ids)` in `factorModelSample.ts` (lines 10–19) is the generic
  hook, and only `FactorBuilder` and `CrashZoom` use it. Five more hooks repeat the same
  `useState`/`useEffect`/`failed` code: `useCapmData` (`capmSample.ts:84`, Part IV), `useModelData`
  (`sizeValueSample.ts:64`), `useShortWindowData` (`shortWindowSample.ts:136`), `useConditionalData`
  (`conditionalSample.ts:133`) and `useZooData` (`zooSample.ts:108`). `ff3-monthly` is requested by five of them.
  It is code, not network, duplication: `loadSeries` is a dynamic `import()`, so the browser fetches each file once.
- **Part IV's helper is not the base of Part V's.** `factorTestSample.ts` re-exports `useCapmData` as `useFactorData`.
  Only chapter 19's `SortGrid` builds on it. Chapters 20 to 23 do not use it, and `factorModelSample.ts` does not
  import from it. Both files fit one idea (a sample from the French data) so they should share one hook module.

**Notation: three clashes and a large gap in the guide.**

- **Timing convention flips between Chapter 22 and 23.** Chapter 22 follows the guide (`$\mathbb{E}_t[\cdot]$` is
  "information at $t$"): $\mathbb{E}_t[R^e_{i,t+1}] = \beta_{it}\lambda_t$, with $\beta_{it}$ and $\lambda_t$ known at $t$
  and aimed at $t+1$. Chapter 23 uses $\mathbb{E}_{t-1}[R^e_{i,t}] = \beta_{i,t}\lambda_t$, with the same symbols dated by
  the return they apply to, and says "a subscript $t$ on a moment means conditional on what investors know at the start
  of month $t$". The same $\lambda_t$ is the premium for next month in one chapter and for this month in the other.
  The chapters also differ in the market return ($R^e_m$ in 20 and 22, $R^e_M$ in 23) and in the comma
  ($\beta_{it}$ against $\beta_{i,t}$).
- **$c$ clashes with consumption in Chapter 22.** The chapter uses $c = \operatorname{Cov}(\beta_t, \lambda_t)$ (lines 109–128), and
  also $\Delta c_{t+1}$ (consumption growth) and $cay_t$ in the same Formalisation. The style guide (line 107) gives
  $c_t$ to log consumption. This is the clash that TASK-079 removed from Chapter 18 for the same reason. Chapter 19
  also uses $a_{\text{S},t}$ and $c_{\text{H},t}$ for the size and B/M parts of a return (lines 98–115).
- **$a$ in Chapter 22.** The SDF is written $M_{t+1} = a_t + b_t f_{t+1}$ with $a_0$ and $a_1$. The guide keeps $a$ for the
  intercept of a predictive regression, and TASK-080 has just renamed $a_t$ in Chapter 14 for that reason. Chapter 22
  uses $\lambda_t$ as the market premium; the guide's $\lambda$ is a risk premium (factor price), which agrees, so I
  list no change for it.
- **The guide has no rows for Part V's symbols.** `grep -c "SMB\|HML\|RMW\|WML\|UMD" docs/STYLE_GUIDE.md` prints 0.
  Missing: SMB, HML, RMW, CMA, MKT, WML/Mom/UMD, $I_{B,t-1}$, $z_t$ (the guide's signal is $x_t$), $\beta_{it}$, $\lambda_t$,
  $\alpha^u$. `CLAUDE.md` says a new symbol goes into the tables in the same PR.

No other symbol is used two ways inside Part V. $\alpha$ is always an intercept or pricing error. $\hat\beta$ is always a
regression slope. $\sigma(\beta)$ always means the standard deviation over time.

## 4. Does Part V link the tests of Part IV to the GMM of Part VI?

**To Part IV: yes.** Every sentence about another chapter that I checked is true of the merged site, with one exception
(the Chapter 7 sentence above).

- Chapter 19 builds on Chapter 16's 25 portfolios, its GRS test, the "demanding for the CAPM, friendly for FF3" remark
  (Chapter 16 line 236) and Chapter 17's "three or four slopes are easy to fit" (Chapter 17 line 242). All present.
  Chapters 16 and 17 now define SMB and HML and point to Chapter 19 (TASK-079).
- Chapter 20 reuses Chapter 1's `CompoundingPath` (Chapter 1 line 57), Chapter 3's White standard errors and Chapter 16's
  regression. Chapter 21 uses Chapter 16's identity $\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha = SR^2_{\text{all}} - SR^2_f$
  (Chapter 16 line 166). Chapter 22 uses Chapter 8's SDF, Chapter 17's two-pass regression, Chapter 13's look-ahead and
  Chapter 14's real-time $cay$ (Chapter 14 lines 270–294). Chapter 23 uses Chapters 16 and 17.
- All eight links in Part V (Chapters 1, 3, 7, 8, 13, 14, 16, 17) point to files that exist. The forward references are
  right: Chapter 20's "Chapter 21 asks how to decide when a new factor adds something", Chapter 21's Chapters 28, 29 and
  30 with their names, and Chapter 23's "Part VI (chapters 24 to 27)" and "Chapter 24, *The generalized method of
  moments*" all match `docs/CURRICULUM.md`.

**To Part VI: thin.** The only Part V mention of GMM is the "Next up" of Chapter 23 (lines 318–319): "Part VI … builds the
general tool for testing models like this one". Chapter 22 never says it. Yet Chapter 22 is where the moment conditions
appear: $\mathbb{E}[M_{t+1} R^e_{i,t+1}] = 0$ for plain and for managed portfolios, tested with Chapters 16 and 17. Those
are exactly what Part VI estimates and tests. The curriculum (Chapters 24–27) treats GMM on linear SDF models, not conditional
or scaled ones, so "models like this one" over-promises a little. A bridge sentence in Chapter 22 fixes both (change 7).

## Sign-off

Part V needs eight small changes before the next Parts copy its pattern. The maths and the widgets are right; the
changes are notation, one caption, one attribution, a bridge to Part VI and a loader refactor.

1. **Chapter 23, `src/content/chapters/23-does-the-conditional-capm-explain-anomalies.mdx`.** Use Chapter 22's
   timing convention and market-return symbol. Rewrite the model and the algebra with $\mathbb{E}_t[R^e_{i,t+1}] =
   \beta_{it}\lambda_t$, $R^e_m$ and no comma in $\beta_{it}$, and delete the sentence that redefines a subscript $t$
   (line 77–79). Check the labels in `RollingBeta.tsx` and `AlphaBound.tsx` for the same symbols.
2. **Chapter 22 and Chapter 19, `22-conditional-factor-models.mdx` and `19-size-and-value.mdx`.** Remove the clashes on
   $c$ and $a$. In Chapter 22 rename the covariance $c$ (for example $\sigma_{\beta\lambda}$) and the SDF intercept
   $a_t$, $a_0$, $a_1$ (for example $\delta_t$, $\delta_0$, $\delta_1$), in prose, display maths, quizzes and recap. In
   Chapter 19 rename the size and B/M parts $a_{\text{S},t}$, $c_{\text{H},t}$ (for example $s_t$ and $v_t$).
3. **`docs/STYLE_GUIDE.md` §3.** Add rows for SMB, HML, RMW, CMA, MKT, WML (published as Mom, rebuilt as UMD in the code),
   $I_{B,t-1}$, $z_t$ (state variable, the conditional-model signal; say how it differs from $x_t$), $\beta_{it}$,
   $\lambda_t$ (conditional), $\alpha^u$, and the symbols chosen in change 2.
4. **Chapter 20, `src/content/chapters/20-momentum.mdx`, and `src/components/plots/FactorBuilder.tsx`.** Use one name
   for the factor in prose and widget labels: "Mom" for the published series and "WML" for the formula, and drop "UMD"
   from the on-screen label. Write every $t$-statistic in math ($t = 1.18$, $t = -6.84$, $t = 7.77$, and the same in
   lines 173–176 and 253).
5. **`src/components/plots/FactorBuilder.tsx`, caption (line 142).** Replace "then into thirds on …" with "then at the
   30th and 70th NYSE percentiles of …", for both kinds, so it matches Chapters 19 and 20.
6. **Chapter 19, `src/content/chapters/19-size-and-value.mdx`, line 63.** Change "An idea from Chapter 7" to say that
   Chapter 7 gave this for the market portfolio and that [Chapter 16](/empirical-finance-lbs/chapters/16-time-series-tests-and-grs/)
   extends it to several factors.
7. **Chapter 22 and Chapter 23, `22-conditional-factor-models.mdx` (end of "Managed portfolios") and
   `23-…mdx` ("Next up").** Add one sentence in Chapter 22: the conditions $\mathbb{E}[M_{t+1}R^e_{i,t+1}] = 0$ and
   $\mathbb{E}[M_{t+1}z_tR^e_{i,t+1}] = 0$ are moment conditions, and Part VI (Chapters 24 and 26) shows how to estimate
   and test them directly. In Chapter 23, change "testing models like this one" to "testing moment conditions like these".
8. **Data hooks, `src/components/plots/` (`capmSample.ts`, `sizeValueSample.ts`, `shortWindowSample.ts`,
   `conditionalSample.ts`, `zooSample.ts`, `factorModelSample.ts`, `factorTestSample.ts`).** Move `useSeriesData` into one
   small module and have `useCapmData`, `useModelData`, `useShortWindowData` and `useConditionalData` call it with a
   module-level id array. Keep `useZooData` as a thin wrapper that adds `loadOsapSignals()`. Keep each hook's return
   type, so no widget changes. `npm test`, `npm run build` and the clickthrough for chapters 16–23 must pass.

Each change becomes a new M-7 task for claude opus high. Changes 1 to 3 touch the same symbols, so the orchestrator may
merge them into one task.
