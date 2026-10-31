# TASK-096 outcome: Chapter 24: The generalized method of moments

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence (after the rebase on `origin/main` `20d5bfa`): `npm ci` exit 0; `npm test` exit 0, `Test Files 57 passed (57)`,
  `Tests 602 passed (602)`, including
  `tests/chapter24-numbers.test.ts` (5 tests) and `tests/notation.test.ts`. `npm run build` exit 0:
  `Result (175 files): 0 errors, 0 warnings, 1 hint` (the hint is an unused import in `src/lib/finance/news.ts`,
  not touched here), `25 page(s) built`, `Complete!`. On a busy machine (load 38 on 12 cores) one earlier run timed
  out `tests/chapter18-numbers.test.ts` at 5 s; that is the known issue #67, and the final run passed.
- [x] `npm run screenshots -- 24-generalized-method-of-moments` passes in both themes at desktop and phone size, and
  I inspected the images.
  Evidence: exit 0, four ✓ lines (dark/light × desktop/phone). I read every section of the page at phone (dark) and
  desktop (light) size, plus element shots of the widget in the 4-moment one-step and two-step states in both
  themes and both sizes. Inspection found and fixed: a 20 px phone overflow (a long inline formula in the recap),
  white seams on the heat map (Mafs CSS strokes every `path`; colours now go in `style`), a numbered list broken
  by display math (now bold "Step n" paragraphs), and "darker means lower", which is false in the dark theme (now
  "stronger shading").
- [x] `npm run clickthrough -- 24-generalized-method-of-moments` passes and reports every widget of the chapter.
  Evidence: exit 0. Both copies are reported: "THE GMM OBJECTIVE AND ITS MINIMUM" and "RE-DRAW THE SAMPLE", each
  with 5 actions at 1280px and 5 at 360px (two options of "Number of moments", two of "Weighting matrix", button
  "New sample").
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` gives Hook (line 14), Intuition (32), Formalisation (71), Playground (296),
  Check yourself (325), Recap & next up (351).
- [x] No hex colour in the chapter or its widgets.
  Evidence: the Verify command prints `no hex colours`; `gmmSample.ts` has none either. All colours are
  `var(--c-data)`, `var(--c-model)` and `var(--text)`.
- [x] The widget uses the seeded toy sample of `gmm.ts`, through `gmmSample.ts`.
  Evidence: `GMMObjective.tsx` imports `toySample`, `fitToy` and `objectiveGrid` from `gmmSample.ts`, which call
  `simulateToySample`, `toyMoments`, `gmm`, `objectiveSurface`, `gmmObjective` and `longRunCovariance` from
  `src/lib/stats/gmm.ts`. The component computes no formula of its own; `tests/chapter24-numbers.test.ts` uses
  the same helpers.
- [x] The outcome holds a voice review and a table of every number in the prose with its test. See below.
- [x] The prose is 2,988 words, inside 1,500–3,000. Command (the one of chapters 9, 10, 13, 16 and 23):
  `awk 'NR>8' src/content/chapters/24-generalized-method-of-moments.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1.

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition shows the objective surface before any formula: "Stronger shading means a smaller value. The lines are contours: each joins the guesses with the same value, like the height lines on a map." |
| Data before theory, where we can | "Here is a sample of 600 draws $x_1, \dots, x_{600}$ from a seeded simulation. It is not a return. It is a toy series whose truth we know." The chapter is simulated by design (curriculum: "simulated (seeded)"). |
| One idea per section | Hook: four equations, two unknowns. Intuition: minimise a weighted sum of squares. Formalisation: estimator, consistency, sandwich, special cases. Playground: which features are rules and which are luck. |
| Start with a question the reader has | "So you have four equations and two unknowns, and the equations disagree. Which two do you use? Can you use all four at once?" |
| Write to one reader, as "you" | "Pretend you do not know those two numbers, and estimate them." Terms are bold and defined where they first appear (moment condition, just identified, long-run covariance, instruments, score). |
| Give the honest version | "We assume that $g_\infty$ is continuous and that the convergence is uniform in $\theta$, over a closed and bounded set of parameters that contains $\theta_0$." |
| Say what the evidence can and cannot show | "The standard errors rest on large-sample theory, not on the exact distribution of $\hat\theta$ in 600 draws." Every estimate comes with its standard error, the sample (seeded, $T = 600$) and the source. |
| Don't skip steps in derivations | The sandwich in four "Step n" paragraphs; the cancellation $(D'WD)^{-1}D'W = D^{-1}W^{-1}(D')^{-1}D'W = D^{-1}$; 2SLS through $P_Z$; the information identity $S = -D$ in six steps in a `<details>` block. |
| Graduate rigour comes in gradually | Part VI (●●●): full matrix notation, each result read in words ("Neither the estimate nor its covariance depends on $W$. That is why the dot did not move…"). |
| Papers in our own words | "Nagel (2013, p. 21) makes the same point about asset pricing tests. A GMM estimator with an identity weighting matrix may give almost no weight to one moment condition…" — paraphrased, no text, figure or table copied. |

## Numbers in the prose

All come from the seeded toy sample (`DEFAULT_SEED = 1`, `SAMPLE_T = 600`, normal tails) in `gmmSample.ts`.
Tests are in `tests/chapter24-numbers.test.ts`.

| Number in the prose | Where | Test |
|---|---|---|
| 600 draws; $\mu = 0.5$, $\sigma^2 = 1$ | Hook, Playground | `hook: the sample and its moments` (`SAMPLE_T`, `TOY_MEAN`, `TOY_VARIANCE`) |
| Sample mean 0.496, sample variance 1.025 | Hook | `hook: the sample and its moments` |
| Fourth central moment 3.547; $\sqrt{3.547/3} = 1.087$ | Hook, Intuition | `hook: the sample and its moments` |
| 2 moments: estimate 0.496 and 1.025; objective 0 | Intuition try-this | `intuition: the three estimates, …` (objective below 1e-10) |
| 4 moments, one-step: 0.501 and 1.086; objective no longer zero | Intuition try-this | `intuition: …` (objective above 1e-4) |
| 4 moments, two-step: 0.488 and 1.005 | Intuition try-this | `intuition: …` |
| "about six times" ($d(3\sigma^4)/d\sigma^2 = 6\sigma^2$ at $\sigma^2 = 1$) | Intuition | `intuition: …` |
| Standard errors 0.041, 0.064 (2 moments); 0.060, 0.087 (4, one-step); 0.041, 0.061 (4, two-step) | Intuition | `intuition: …` |
| se($\hat\mu$) = 0.041 = $\sqrt{\hat\sigma^2/T}$; se($\hat\sigma^2$) = 0.064 from the fourth moment; normal formula 0.059 | Formalisation | `formalisation: the just-identified estimate is …` |
| ML estimate 0.496 and 1.025 again (= sample mean, divisor-$T$ variance) | Formalisation | `formalisation: …` (to 1e-8) |
| "the dot never moves, and the objective at the minimum is always 0" (2 moments, new samples) | Playground | `playground: with 2 moments the weighting never moves …` (seeds 1–5) |
| $L = 0$ lags | Formalisation, caption | A setting: `gmm`'s default `lags = 0`, stated because the draws are independent |
| 3 parameters, 3 moments; 6 lags | Quiz | Hypothetical values in the questions, not results |
| Nagel (2013, p. 21) | Intuition | Page of the NBER WP 18554 PDF (printed p. 21, `pdftotext -layout`) |

The widget test `widget: the objective grid agrees with each fit at its estimate` checks that the shaded surface
matches each method's objective at $\hat\theta$, for one-step, two-step and CUE.

## Summary

**What.**
- `src/content/chapters/24-generalized-method-of-moments.mdx`: the chapter, with frontmatter `part: 6`,
  `chapter: 24`, `difficulty: 3`, `prerequisites: [3, 4]`, links to Chapters 3 and 4, three quizzes, and
  Chapters 25–27 named by title only in "Recap & next up".
- `src/components/plots/gmmSample.ts`: the seeded sample (`DEFAULT_SEED`, `SAMPLE_T`, `toySample`), `fitToy`
  (GMM from the sample mean and divisor-$T$ variance, as `simulateJTest` starts), and `objectiveGrid`
  (`objectiveSurface` with the fit's last-stage $W$, or $g_T(\theta)'\hat S(\theta)^{-1}g_T(\theta)$ for CUE).
- `src/components/plots/GMMObjective.tsx`: heat map in `--c-data` shading (8 bands a factor $\sqrt{10}$ apart)
  with marching-squares contour lines, the minimum in `--c-model` (tweened, so it respects reduced motion), the
  truth $\theta_0$, a legend, `Segmented` controls for 2 or 4 moments and for the weighting (`methods` prop,
  default `['one-step', 'two-step']`), a `New sample` `Button` (seed + 1), and a readout with $\hat\theta$, its
  standard errors and the minimum of $g_T'Wg_T$. Shapes are drawn as one SVG path per band and per contour level.
- `tests/chapter24-numbers.test.ts`.

**Chapter 25 and the shared widget.** TASK-097 had not merged `GMMObjective` or `gmmSample.ts` (checked against
`origin/main` `20d5bfa` at the final rebase, which adds the TASK-094 and TASK-095 libraries but no widget; no
remote branch had them either). So this task created both. The
`methods` prop already handles `'iterated'` and `'cue'`: Chapter 25 only passes
`methods={['one-step', 'two-step', 'iterated', 'cue']}`.

**Deviations.**
- The component also takes an optional `title`, used for the second copy in the Playground.
- The widget opens at 2 moments, so the Intuition can start from the just-identified case.
- The curriculum's Key math writes $f(x_t, \theta)$, $d$ and $S = \sum_j \mathbb{E}[f_tf_{t-j}']$. The chapter
  follows §3: $g(x_t, \theta)$, $D$, $S = \sum_j \mathbb{E}[g_tg_{t-j}']$.
- Sources: no fact is taken from Cochrane (2005), which is under further reading only. Every result is derived
  from the moment conditions. The one fact from a reading is Nagel (2013, p. 21).

**Notation mismatches and candidate symbols** (`docs/STYLE_GUIDE.md` was not edited, as the spec says).
- $x_t$: §3 lists it as a predictor (`\Signal`), while the Part VI row writes $g(x_t, \theta)$ with $x_t$ as the
  data. The chapter says so in words and does not colour it. Candidate: note the Part VI reading in the $x_t$ row.
- $z_t$ as the vector of instruments (IV): not in the table, which gives $z_t$ to a Part V state variable and the
  Chapter 14 human-capital gap. The chapter says so in words and ties it to managed portfolios. Candidate row.
- Local symbols, each defined where used: $D_T(\theta)$ (sample Jacobian, with limit $D$), $g_\infty(\theta)$,
  $Q(\theta)$, $\bar\theta$ (mean-value point), $A$ (the linear map), $P_Z$, $\hat X$, $s(x; \theta)$ (score).
  $D_T(\theta)$ is the likeliest to recur in Chapters 25–27 and is a candidate for the Part VI table.

**Verified revision.** The commit of this outcome, rebased on `origin/main` `20d5bfa`. Verify ran again after the
rebase: `npm ci` exit 0, `npm test` 602 passed, `npm run build` 0 errors 0 warnings, screenshots and click-through
exit 0. The rebase changed no file of this task.

**Follow-ups.**
- Add the $x_t$ note, the instrument $z_t$ row and $D_T(\theta)$ to the §3 Part VI table.
- Align the curriculum's Key math for Chapters 24–25 with §3 (already proposed in the TASK-093 outcome).
