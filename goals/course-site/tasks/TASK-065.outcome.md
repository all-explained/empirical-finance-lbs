# TASK-065 outcome: Chapter 18: Errors in variables and the Shanken correction

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: after `npm ci`, `npm test` printed `Test Files  40 passed (40)` and `Tests  417 passed (417)`
  (7 of them in the new `tests/chapter18-numbers.test.ts`). `npm run build` printed `Result (127 files):`,
  `- 0 errors`, `- 0 warnings`, `17 page(s) built` and `Complete!`.
- [x] `npm run screenshots -- 18-errors-in-variables` passes in both themes at desktop and phone size, and I
  inspected the images.
  Evidence: it printed `✓` for `chapters_18-errors-in-variables-and-shanken-{dark,light}-{desktop,phone}.png`.
  I cut the tall images into slices and read them: both widgets (desktop dark and light, phone dark and light),
  the derivation, the quizzes and the recap. Two layout faults I found there are fixed: the "estimate = truth"
  label covered the top-right dot (now in the empty lower-right corner), and the "true λ" label touched the first
  interval row (the plot now has room above the rows). On the phone the controls stack below the plot, and the
  readout wraps without overflow.
- [x] `npm run clickthrough -- 18-errors-in-variables` passes and reports every widget of the chapter.
  Evidence: two `✓` lines, one for each `ShankenCorrection` on the page (Intuition and Playground):
  `ESTIMATED BETAS AND THE HONEST INTERVAL FOR THE PREMIUM · 7 actions at 1280px, 7 actions at 360px · slider
  "Factor Sharpe ratio (a year)"; slider "Sample length T"; button "Re-roll simulation"`.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` gives lines 14 Hook, 36 Intuition, 76 Formalisation, 286 Playground,
  306 Check yourself, 332 Recap & next up.
- [x] No hex colour in the chapter or its widget.
  Evidence: the spec's `git diff --name-only origin/main -- 'src/components/plots/*.tsx' <chapter> | xargs grep
  -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` printed `no hex colours`.
- [x] The widget uses the chapter's curriculum data (`ff25-size-bm-monthly`, `ff3-monthly`, simulated with a fixed
  seed).
  Evidence: `ShankenCorrection` loads both series through `useFactorData` (in `factorTestSample.ts`, built on
  `loadSeries`) and computes the FF3 readout with `factorPanel`, `timeSeriesRegressions`,
  `crossSectionalRegression` and `shankenCorrection`. The simulation is `simulateTwoPass` (seeded with
  `normalRng`) at `DEFAULT_SEED = 18`, 200 replications. The re-roll button adds 1 to the seed.
- [x] The outcome holds a voice review and a table of every number in the prose with its test. See below.
- [x] The prose is 2,914 words, inside 1,500–3,000. Command (the one of chapters 9, 10 and 13):
  `awk 'NR>8' src/content/chapters/18-errors-in-variables-and-shanken.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition shows the widget (beta errors, 20 interval pairs) and argues "An error of size $d$ in the beta looks like an error of $\lambda d$ in the mean return" before the Formalisation writes any matrix. |
| Data before theory, where we can | The Hook opens with FF3 on the 25 portfolios: "The second pass gives a market premium of 6.72% a year. Its standard error is 1.970% a year if you treat the betas as known. With the correction of this chapter it is 1.971%." |
| One idea per section | Each `###` of the Formalisation has one idea: the model; Steps 1–5 of the derivation; why $c$ is a squared Sharpe ratio; when the correction matters; what it does not fix. |
| Start with a question the reader has | "**when do estimated betas make the standard errors wrong, and by how much?**" |
| Write to one reader, as "you" | "So here is the question you should have" and "The correction is honest about its own limits, and so should you be." Terms are defined where they first appear (**first pass**, **second pass**, **naive**, **conditional homoskedasticity**, **attenuation**); Chapters 7 and 16 are linked. |
| Give the honest version | "This is exact. Now we simplify it to first order. … Replacing them changes each term by an amount of order $1/T$, which is smaller than the terms we keep." |
| Say what the evidence can and cannot show | "That is a property of the formula. Which real factors have a large $c$ is a question for the data." Every data number names ff3-monthly / ff25-size-bm-monthly and 1963-07 to 2026-08; every simulated number names its Sharpe ratio, $T$ and the 200 samples. |
| Don't skip steps in derivations | Steps 1–5 write out the known-beta error, the first-pass beta error, the exact estimated-beta error, its first-order form, the zero covariances ($\sum_t w_t = 0$), and $\sum_t w_t^2 = T\lambda'\hat\Sigma_f^{-1}\lambda$; the Fama–MacBeth identity $A\Sigma A' = \Sigma_f + A\Sigma_\varepsilon A'$ is expanded too. |
| Graduate rigour comes in gradually | Part IV (●●): matrix algebra and sums, each read in words ("It keeps the factor part and multiplies the residual part by $1 + c$"). |
| Papers in our own words | No paper text is used. The correction is derived from the two-pass model; Shanken (1992) gives only its name, and Cochrane (2005), Ch. 12 is listed under further reading only. |

## Numbers in the prose

"FF3" means ff3-monthly and ff25-size-bm-monthly, 1963-07 to 2026-08, OLS second pass without an intercept
(`ff3Shanken`). "World (SR, T)" is `twoPassWorld` at that annual factor Sharpe ratio and $T$, seed 18, 200
samples. Every test is in `tests/chapter18-numbers.test.ts`.

| Number | Where | Source | Test |
|---|---|---|---|
| 1963-07, 2026-08, $T$ = 758 | Hook, widget readout | FF3 sample dates | `hook: FF3 market premium…` |
| 6.72% a year | Hook | FF3 $\hat\lambda_{\text{Mkt}}$ × 12 | `hook: FF3 market premium…` |
| 1.970%, 1.971% a year | Hook, Formalisation, Recap | FF3 naive and corrected SE × 12 | `hook: FF3 market premium…` |
| 25 assets, betas 0.5 to 1.5, premium 6% a year, 200 samples | Hook, Intuition | `N`, `TRUE_BETA`, `LAMBDA`, `REPLICATIONS` | `the simulated world…` |
| Sharpe ratio 5, 600 months; 83.5%, 93.5% coverage | Hook, Intuition, Playground | World (5, 600) | `hook, intuition and formalisation…` |
| 0.47 a year (market Sharpe ratio) | Intuition try-this | `annualiseSharpe(sharpeRatio(Mkt-RF))` from 1963-07 | `intuition: the market's Sharpe ratio…` |
| $c$ = 0.0386; 0.196 a month, 0.68 a year | Formalisation, Recap, Quiz 2 | FF3 `c`, $\sqrt c$, $\sqrt{12c}$ | `formalisation: when the correction matters…` |
| residual share 2.8% | Formalisation, Quiz 2 | FF3: $((\text{se}_c/\text{se}_n)^2 - 1)/c$ | `formalisation: when the correction matters…` |
| SE up by 0.05% | Formalisation, Quiz 2 | FF3: $\text{se}_c/\text{se}_n - 1$ | `formalisation: when the correction matters…` |
| $c$ = 2.08 per month | Formalisation | World (5, 600) | `hook, intuition and formalisation…` |
| 0.218%, 0.293%, 0.279% a year; "about a fifth too small" (0.22) | Formalisation | World (5, 600) mean naive SE, mean corrected SE, sd of $\hat\lambda$ | `hook, intuition and formalisation…` |
| average $\hat\lambda$ 5.85% a year | Formalisation | World (5, 600) | `hook, intuition and formalisation…` |
| Sharpe ratio 0.4, $c$ = 0.013, coverage 97.0% and 97.0% | Playground | World (0.4, 600) | `playground: the default world…` |
| $T$ = 120: 62.5%, 78.0%, average $\hat\lambda$ 5.27% | Playground | World (5, 120) | `playground: the default world…` |
| monthly Sharpe 0.2 → 1.04 | Quiz 1 | `shankenCorrection` with $\lambda = 0.2$, $\Sigma_f = 1$ | `quiz: a monthly Sharpe ratio of 0.2…` |

95% is the target level of the intervals, and 1.96 is `invCdf(0.975)`; neither is an estimate.

## Summary

**What.** `src/content/chapters/18-errors-in-variables-and-shanken.mdx` (Part 4, chapter 18, difficulty 2,
prerequisite 17), the widget `src/components/plots/ShankenCorrection.tsx`, its helper
`src/components/plots/shankenSample.ts`, and `tests/chapter18-numbers.test.ts`.

**How.**
- The chapter derives the corrected variance in five steps from the two-pass model, with the first-order step
  stated, shows that $c$ is the (maximum) squared Sharpe ratio of traded factors (Chapter 7's formula), and gives
  the limits: i.i.d. months, conditional homoskedasticity, first order in $1/T$, and attenuation of $\hat\lambda$,
  which the correction does not fix.
- `shankenSample.ts` has `twoPassWorld` (`simulateTwoPass` plus the summaries the readout needs) and `ff3Shanken`
  (the FF3 two-pass with `shankenCorrection`). The widget and the test both call them, so no formula is repeated.
- The widget runs 200 replications. That takes about 2 s at $T = 600$ (4 s at $T = 1200$), so, as in chapter 12,
  it runs after the sliders rest and keeps the old picture with "updating…" in the meantime. The widget is used
  twice: at a Sharpe ratio of 5 in the Intuition, and at the default 0.4 in the Playground.
- Colours: estimates `--c-data`, corrected interval `--c-model`, naive interval `--text-muted` dashed, misses
  `--c-error` with a "✕" label (colour is never the only cue), truth `--text` dashed.

**Deviations and notes.**
- Chapter 17 is not merged, so the chapter names it by title ("Chapter 17, 'Cross-sectional regressions and
  Fama–MacBeth', builds this method in full") without a link. Chapter 16 was merged during the task, and the Hook
  links it for the first-pass regressions.
- `factorTestSample.ts`: when I started, it was not on main, so I created it with only the data hook. TASK-063 then
  merged its full version (which has the same `useFactorData` line). I rebased and kept main's file, so this PR
  does not touch it and the Part keeps one helper.
- Curriculum vs style guide: the curriculum's Key math writes $\beta'\Sigma\beta$; the chapter writes
  $\beta'\Sigma_\varepsilon\beta$ (§3: other covariances carry a subscript). `docs/CURRICULUM.md` could be updated.
- Symbols the §3 table lacks (candidates, not added): $c = \lambda'\Sigma_f^{-1}\lambda$ (chapter 12 already uses $c$
  for $\sigma_{uv}/\sigma_v^2$, so the table may want to list both uses); $A$ for the second-pass matrix
  $(\beta'\beta)^{-1}\beta'$; $w_t$ for the monthly weight $(f_t - \bar f)'\hat\Sigma_f^{-1}\lambda$ (it clashes with
  portfolio weights $w$, but appears only inside Steps 2–5); $u_1, u_2, u_3$ for the three error pieces (§3 uses $u$
  for a second equation's shocks); $s$ for the residual share; $\sigma_f$ for one factor's volatility.
- Readings: Cochrane (2005) and Shanken (1992) are not in `source/papers/`. No fact or number comes from them; both
  are under further reading only.
- The claim about consumption factors is stated as a property of the formula ("a factor with a small volatility
  and a large estimated premium has a large $c$"), with no published result.

**Verified revision.** The Verify chain above ran on the rebased branch (on `origin/main` at `a13ddec`) with the
Chapter 16 link in place.

**Follow-ups.** (1) Update the curriculum's Key math to $\Sigma_\varepsilon$. (2) Decide whether $c$, $A$ and
$\sigma_f$ go into the §3 table. (3) When chapter 17 merges, turn its name in the Hook into a link.
