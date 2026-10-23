# TASK-051 outcome: Chapter 12: Stambaugh bias

PR: https://github.com/all-explained/empirical-finance-lbs/pull/36

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence (after rebasing on `origin/main` 31ad03c): `npm ci` exit 0; `npm test`: `Test Files 28 passed (28)`,
  `Tests 309 passed (309)`; `npm run build`: `Result (96 files): - 0 errors - 0 warnings`, then `[build] Complete!`.
- [x] `npm run screenshots -- 12-stambaugh` passes in both themes at desktop and phone size, and I inspected the images.
  Evidence: `✓ chapters_12-stambaugh-bias-{dark,light}-{desktop,phone}.png`, exit 0. I cut each full-page image
  into slices and read them all: the hook, both widgets, every display equation, the callouts, the quizzes and the recap.
  The inspection found and fixed four defects: SVG axis titles with a combining hat ("b̂") drew the hat out of place;
  "true b = 0" overlapped the y-axis title at 360px; three display equations were wider than a phone; and
  quiz 3's option lost the backslashes of `\phi` and `\operatorname` (a JavaScript string needs `\\`).
- [x] `npm run clickthrough -- 12-stambaugh` passes and reports every widget of the chapter.
  Evidence: two lines, one per `StambaughBias` instance, each `11 actions at 1280px, 11 actions at 360px · slider
  "Persistence ϕ"; slider "Shock correlation corr(u,v)"; slider "Sample length T"; button "Set to the
  goyal-welch-annual estimates"; button "Re-roll simulation"`, exit 0. The simulation reruns 150 ms after the
  sliders rest, so a separate Playwright run also checked the final state. At 1280px and 360px it moved
  φ and T to their maximum with the keyboard (`End`). The readout updated after about 650 ms, the
  `aria-label` described the new state, and there were no console errors.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` → lines 14 Hook, 30 Intuition, 75 Formalisation, 211 Playground,
  252 Check yourself, 278 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the Verify command prints `no hex colours`; `stambaughSample.ts` has none either. Colours are
  `var(--c-prob)`, `var(--c-model)`, `var(--c-data)`, `var(--c-error)`, `var(--text)`, `var(--text-muted)` and the
  KaTeX macros `\Ret`, `\Signal`, `\Err`.
- [x] At least one widget uses real data from the chapter's curriculum entry, and every simulation is seeded.
  Evidence: `StambaughBias` loads `goyal-welch-annual` through `loadSeries` and `goyalWelchAnnualPredictors`, fits it
  with `predictiveSystem`, and uses the fit for the shock sizes, the preset and the data marks. The caption names
  the dataset and its years. The samples come from `simulateSlopes` with seed 1 by default. A "Re-roll simulation"
  button raises the seed, and the readout shows it.
- [x] Voice review and numbers table: see `## Voice review` and `## Numbers in the prose`.
- [x] The prose is 2,483 words, inside 1,500–3,000. Command (the chapter 9 command: it drops the frontmatter,
  imports and `$$` display blocks, and counts callouts, try-this paragraphs and quizzes):
  `awk 'NR>8' src/content/chapters/12-stambaugh-bias.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1:

| Rule | Line in the chapter |
| --- | --- |
| Picture first, then the formula | The Intuition shows the widget's two histograms sliding right as $\operatorname{corr}(u, v)$ falls to $-0.90$ before any formula: "Watch both histograms slide to the right." |
| Data before theory | The Hook opens on the data: "On the goyal-welch-annual data, with dividend–price ratios from 1926 to 2024 and returns from 1927 to 2025, the slope is 0.042." |
| One idea per section | Formalisation has one step per subsection: "Step 1: write each estimation error as a ratio", "Step 2: split the return shock", "Step 3: substitute", "Step 4: take expectations", "Step 5: the bias of $\hat\phi$". |
| Start with a question the reader has | "How much of the slope we measure is real, and how much is produced by the regression itself?" |
| Write to "you", short sentences, explain terms | "The test that promises 5% has a true **size**, its rate of false alarms, more than three times as large." Chapters 5 and 9 exist, so they are linked, with no recap callout. |
| Give the honest version | "We state this one without proof: its derivation is a long expansion of a ratio of random sums. You can check it in the widget instead." |
| Say what the evidence can and cannot show | "What the data cannot show is that returns are *not* predictable. A test that fails to reject is not proof of the null." |
| Don't skip steps in derivations | Steps 1–4 derive $\mathbb{E}[\hat b - b] = (\sigma_{uv}/\sigma_v^2)\,\mathbb{E}[\hat\phi - \phi]$ line by line: "The constant $a$ drops out, because the deviations $x_t - \bar x$ add up to zero." |
| Graduate rigour comes in gradually (Part II, ●●) | Sums, a population regression of one shock on another, and a conditional expectation: "Fix the path of $x$. Then the last fraction is a weighted sum of the $e$'s, and each $e$ has mean zero." |
| Papers in our own words | "Cochrane (2008, p. 2) explains the source of the problem the same way: a change in prices moves both the return and the dividend yield…" Stambaugh (1999) and Campbell (2018) are not in `source/papers/`, so no fact is taken from them; they are under Further reading only. |

## Numbers in the prose

Every test is in `tests/chapter12-numbers.test.ts`. Data: `goyal-welch-annual`, dp at the end of 1926–2024, log excess
returns 1927–2025, through `goyalWelchAnnualPredictors` and `predictiveSystem` (`dataFit` in
`src/components/plots/stambaughSample.ts`). "World" means `nullSlopes` (1,000 samples of `simulateSlopes`, seed 1,
`b̂` rescaled to the data's $\sigma_u/\sigma_v$), exactly what the widget shows for those sliders.

| Number in the prose | Where | Source | Test |
| --- | --- | --- | --- |
| 1926, 2024; 1927, 2025; 99 pairs / $T = 99$ / "99 years" | Hook, On our data, Recap | `dataFit`: `first`, `last`, `T` | `data: the predictive system on goyal-welch-annual` |
| slope 0.042 | Hook, On our data, Recap | `predictiveSystem` `bHat` | same |
| classical $t$ = 1.07 | Hook, Formalisation | `predictiveSystem` `tStat` | same |
| $\phi = 0.92$ / $\hat\phi = 0.92$ | Intuition, On our data | `phiHat` | same |
| $\operatorname{corr}(u, v) = -0.86$ | Intuition, On our data | `corr` | same |
| $c = -0.78$ | On our data | `sigmaUV / sigmaV2` | same |
| $\mathbb{E}[\hat\phi - \phi] \approx -0.038$ | On our data, Playground | `kendallBias(phiHat, T)` | same |
| bias 0.030; "about 70%" | On our data, Playground, Recap | `stambaughBias(sigmaUV, sigmaV2, phiHat, T)`; ratio to `bHat` | same, and `hook and playground: the world calibrated to the data` |
| corrected slope 0.013 | On our data | `biasCorrectedSlope` | `data: …` |
| "a thousand" / 1,000 samples, seed 1 | Hook, Intuition | `SAMPLES`, `DEFAULT_SEED` | `simulation setup` |
| average slope 0.033; "more than a third" (36.1%) above 0.042 | Hook, Playground | World at the data's $\hat\phi$, corr, $T$: mean `bHat`, `rejectionRate(b, bHat)` | `hook and playground: …` |
| 31.6% of $t$ above 1.07 | Formalisation, Playground | `rejectionRate(t, tStat)` | same |
| simulated $\hat\phi - \phi$ = −0.041 | Playground | mean `phiHat` − φ | same |
| 15.9% above 1.645; "more than three times" 5% | Formalisation, Recap | `rejectionRate(t, 1.645)` | same |
| simulated 5% cut-off 2.17 | Formalisation, Recap, Quiz 3 | `upperCriticalValue(t, 0.05)` | same |
| opens at $\phi = 0.95$, $T = 100$, corr 0; average 0.001; 5.7% | Intuition try-this | World (0.95, 0, 100) | `intuition: …` |
| corr −0.90: average 0.036; 18.1% | Intuition try-this | World (0.95, −0.9, 100) | same |
| $\phi = 0.990$: 25.9%; cut-off 2.56 | Playground try-this | World (0.99, data corr, 99) | `playground: phi = 0.99, T = 500, corr = +0.86` |
| $T = 500$: bias 0.006; 9.8% | Playground try-this | World (data φ̂, data corr, 500) | same |
| corr +0.86: bias changes sign | Playground try-this | `stambaughBias` < 0 | same |
| 1.645 and 1.96 | Formalisation, Key callout | `invCdf(0.95)`, `invCdf(0.975)` | `textbook cut-offs` |
| Quiz 2: −0.8, 0.9, 100 → −0.037, +0.0296 ≈ +0.030 | Quiz 2 | `kendallBias(0.9, 100)`, `stambaughBias(-0.8, 1, 0.9, 100)` | `quiz: sigmaUV / sigmaV2 = -0.8, …` |
| Quiz 3: "1.9 would not reject" | Quiz 3 | simulated cut-off > 1.9 | `quiz 3: …` |
| Quiz inputs 0.99, 80 years, 1.9, 50% | Quizzes 1 and 3 | Hypothetical inputs and a distractor, not results | — |
| Cochrane (2008): pp. 2, 11 ("about 22%"), 23 ("about half") | How to read the evidence | `Cochrane2008.pdf`, `pdftotext -layout`, printed page numbers | Taken from the paper, not our data, and labelled as his sample and null |

## Summary

**What.** `src/content/chapters/12-stambaugh-bias.mdx` (Part 2, chapter 12, difficulty 2, prerequisites [5, 9]),
the widget `src/components/plots/StambaughBias.tsx`, its data and simulation helper
`src/components/plots/stambaughSample.ts`, and `tests/chapter12-numbers.test.ts`.

**How.** The chapter derives $\mathbb{E}[\hat b - b] = (\sigma_{uv}/\sigma_v^2)\,\mathbb{E}[\hat\phi - \phi]$ in four
steps, then adds the $-(1 + 3\phi)/T$ approximation. It applies both to goyal-welch-annual and corrects the slope.
It then sizes the test by simulation. `StambaughBias` draws 1,000 seeded samples under $b = 0$ from `simulateSlopes`.
It shows histograms of $\hat b$ and $t$, with the analytic bias (`stambaughBias`), the textbook 1.645, the simulated
5% cut-off (`upperCriticalValue`) and the false rejections in `--c-error`. A preset button sets $\phi$, corr and $T$ to
`predictiveSystem` on the data and marks the data's $\hat b$ and $t$. The same widget appears twice, as chapter 3
does with `RegressionLab`. The Intuition copy opens at corr = 0. The Playground copy opens at the preset
(`initialPreset`). The simulation reruns 150 ms after the sliders rest. The slowest setting (φ = 0.999, T = 500) takes about 0.65 s in
Chromium. Axis limits tween through `useTweened`, so reduced motion is respected.

**Deviations and mismatches (reported, not edited).**
- `simulateSlopes` uses `simulatePredictive`'s default shock sizes and does not return them. The library
  outcome (TASK-048) flagged this. `stambaughSample.ts` repeats those two defaults in a marked `ponytail:`
  comment. It uses them to rescale $\hat b$ to the data's $\sigma_u/\sigma_v$. This is exact: $\hat b$ scales
  with $\sigma_u/\sigma_v$, and $t$ does not depend on scale. With the rescale, the histogram and the
  theory line share the units of the data's slope.
- The $T$ slider runs from 20 to 500 **years**, not §5's 60–1,200 months. The world uses annual data, and the
  chapter's point needs $T$ well beyond the 99 years of data.
- Curriculum Key math vs the style guide §3: the curriculum writes $r_{t+1}$, $\mu$ and $\mathrm{corr}$. The chapter
  follows the style guide: $r^e_{t+1}$ for the log excess return, $\mu_x$ for the AR(1) constant, and
  $\operatorname{corr}(\cdot,\cdot)$. The return shock is $u$ (not $\varepsilon$), as in the curriculum, the spec's slider
  $\operatorname{corr}(u, v)$ and the library. §3 lets $u_t$, $v_t$ name "the shocks of a second equation"; a
  two-equation system reads naturally that way, but the table could say so explicitly.
- Local symbols not in the §3 table: $\sigma_{uv} = \operatorname{Cov}(u, v)$, $\sigma_v^2$, $\sigma_u$ (the §3 rule
  "other covariances carry a subscript"), $c = \sigma_{uv}/\sigma_v^2$, the remainder $e_{t+1}$ and the denominator $S$.
  Each is defined in words where it first appears. A later edit of the style guide could add $\sigma_{uv}$, $\sigma_v$.
- The Kendall approximation $-(1 + 3\phi)/T$ is stated without proof, and the chapter says so. Its source is not in
  `source/papers/`, so no derivation or citation is taken from it. The widget readout checks it against the simulation.

**Verified revision.** The PR head, rebased on `origin/main` 31ad03c, with `npm ci`, `npm test`, `npm run build`,
`npm run screenshots -- 12-stambaugh` and `npm run clickthrough -- 12-stambaugh` run locally.

**Proposed follow-ups.**
- Let `simulateSlopes` take `sigmaU` and `sigmaV`, or return them. `stambaughSample.ts` could then drop its copy of
  `simulatePredictive`'s defaults.
- Add $\sigma_{uv}$, $\sigma_v$ to the §3 table, and say there that $u$, $v$ name the two shocks of a predictive system.
