# TASK-097 outcome: Chapter 25: Efficient and feasible GMM

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence (after merging `origin/main` `2e99f37`): `npm run build` exit 0 with `Result (184 files): - 0 errors
  - 0 warnings`, `28 page(s) built`. The one `astro check` hint is in `src/lib/finance/news.ts`, which this task does
  not touch. `npm test -- --testTimeout=60000`: 60 files, 624 tests passed, exit 0. See "Test load" below for the
  plain `npm test` runs.
- [x] `npm run screenshots -- 25-efficient-and-feasible-gmm` passes in both themes at desktop and phone size, and I
  inspected the images.
  Evidence: four `✓ chapters_25-efficient-and-feasible-gmm-{dark,light}-{desktop,phone}.png`, exit 0. After the
  merge I inspected the Hook and Intuition with the shared `GMMObjective` in both themes at 1280px and 375px, and
  the widget in all four weightings and with two moments, to check the "Try this" prompt against the picture. The
  `JTestSim` widget and the later sections did not change in the merge.
- [x] `npm run clickthrough -- 25-efficient-and-feasible-gmm` passes and reports every widget of the chapter.
  Evidence: exit 0. `THE GMM OBJECTIVE AND ITS MINIMUM · 7 actions at 1280px, 7 actions at 360px` (both options of
  "Number of moments", all four options of "Weighting matrix", "New sample") and `HOW OFTEN DOES THE J TEST
  REJECT? · 9 actions at 1280px, 9 actions at 360px` (slider "Sample size T", three "Estimator" options, two "Tails
  of the data" options, "Re-roll simulation").
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` gives Hook (line 15), Intuition (36), Formalisation (72), Playground (226),
  Check yourself (251), Recap & next up (277).
- [x] No hex colour in the chapter or its widgets.
  Evidence: the spec's command prints `no hex colours`.
- [x] There is one `GMMObjective` component in `src/components/plots/`, shared with chapter 24 through its `methods`
  prop.
  Evidence: `ls src/components/plots/ | grep -c '^GMMObjective'` prints 1. Chapter 24 (TASK-096) merged
  `GMMObjective.tsx` and `gmmSample.ts` first, so this branch keeps main's versions. Chapter 25 passes
  `methods={['one-step', 'two-step', 'iterated', 'cue']}` and `initialCount={4}`. The only change to the widget is
  the new `initialCount` prop (default 2, so chapter 24 is unchanged). `gmmSample.ts` gains the J-test settings and
  `jTestChunk` / `jTestRun` that `JTestSim` and the numbers test share.
- [x] The outcome holds a voice review and a table of every number in the prose with its test.
  Evidence: the sections "Voice review" and "Numbers in the prose" below.
- [x] The prose is 2,818 words, inside 1,500–3,000. Command (the one of chapters 9, 10, 13 and 16):
  `awk 'NR>8' src/content/chapters/25-efficient-and-feasible-gmm.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1.

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition shows `GMMObjective` before any formula: "The widget below draws the objective GMM minimises, over every pair $(\mu, \sigma^2)$." |
| Data before theory, where we can | The curriculum's data are simulated, so the hook opens on a seeded sample: "Take 600 seeded draws $x_t$ of a variable whose true mean is 0.5 and whose true variance is 1." |
| One idea per section | Intuition, "Listen hardest to the moments you measure best": only the idea of weighting by precision. |
| Start with a question the reader has | "Which weights should you use? And how far can you trust the test that comes with them?" |
| Write to one reader, as "you"; explain terms; link back | "Chapter 24 estimates parameters like these from **moment conditions**: averages that should be zero at the true parameters." Links to Chapters 4, 16 and 24. |
| Give the honest version | "We do not have a simple story for why iterated GMM and CUE lose so much power here." |
| Say what the evidence can and cannot show | "On the 600 draws of the hook, two-step GMM gives $J = 2.22$, with a $p$-value of 0.33. The data do not reject the model." |
| Don't skip steps in derivations | Five numbered steps to the efficiency result, for example "3. By the fact above, $\Delta D = A_W D - A_* D = I - I = 0$. So both cross terms vanish." Six numbered steps to the $\chi^2$ limit of $J$. |
| Graduate rigour, with a plain reading | "In words: every other weighting adds a piece that is never negative, for every linear combination of the parameters." |
| Papers in our own words | "Nagel (2013, p. 20) observes that many researchers report how well a model prices the portfolios they find economically interesting, instead of the statistically chosen mixes that a formal test weighs most." |

## Numbers in the prose

Every number comes from `gmm.ts` through `gmmSample.ts`, on the seeded samples the widgets show, and is checked in
`tests/chapter25-numbers.test.ts`. "The 600 draws" are `toySample()` (seed 1, normal), the sample of Chapter 24. "J sizes" are
`jTestRun(1, …)`: 400 samples in 8 chunks of 50, four moments. The estimator study uses samples with seeds 1001 to
1300.

| Number in the prose | Where | What it is | Test |
|---|---|---|---|
| 600 draws, mean 0.5, variance 1 | Hook, caption | The objective sample | `settings: …` |
| 400 samples of 100 draws | Hook, Playground | The J simulation | `settings: …` |
| $\hat\mu = 0.501$, $\hat\sigma^2 = 1.086$ | Hook, Intuition | Identity weighting, four moments | `hook and intuition: …` |
| $\hat\mu = 0.488$, $\hat\sigma^2 = 1.005$ | Hook, Intuition | Two-step GMM, four moments | same |
| 0.087, 0.061 | Hook | Standard error of $\hat\sigma^2$, identity and two-step | same |
| 1.03, 194.35 | Intuition | Variance of the first and fourth moment, diagonal of $\hat S$ | same |
| 2.50, 1.76, 0.028 | Intuition | Diagonal of the two-step $W$: moments 1, 2 and 4 | same |
| (0.496, 1.025) | Intuition | Every weighting with two moments | `intuition: with two moments …` |
| 0.488 (all three); 1.005, 1.006, 1.006; 0.041, 0.061 | Formalisation | $\hat\mu$ and $\hat\sigma^2$ by two-step, iterated, CUE; two-step standard errors | `formalisation: the three feasible estimators, …` |
| $\dim g = 4$, $\dim\theta = 2$, 5.99 | Formalisation, Playground | Degrees of freedom and 5% cut-off of $\chi^2_2$ | same |
| $J = 2.22$, $p = 0.33$ | Formalisation | Two-step $J$ on the 600 draws | same |
| ten distinct entries | Formalisation | Of a symmetric 4 × 4 $\hat S$ | `formalisation and quiz: counts …` |
| 300 samples of 50 draws; 0.210, 0.254 | Formalisation | RMSE of $\hat\sigma^2$, identity and two-step | `formalisation: a fixed weighting wins at T = 50 …` |
| 0.144 | Formalisation | Mean reported two-step s.e. of $\hat\sigma^2$ at $T = 50$ | same |
| 1,000 draws; 0.051, 0.049 | Formalisation | RMSE of $\hat\sigma^2$ at $T = 1000$ | same |
| 9.75, 3 | Playground, caption | Fat-tailed fourth central moment, and $3\sigma^4$ | `playground: the fat-tailed fourth central moment …` |
| 13.3% at $T = 100$ | Hook, Formalisation, Playground, Recap | Size of the 5% test, two-step | `hook, playground and quiz: size …` |
| 18.0% at $T = 50$, 7.5% at $T = 1000$ | Playground, Quiz 3 | Size, two-step | same |
| 13.5%, 13.5% | Playground | Size at $T = 100$, iterated and CUE | same |
| 12.0%, 2.3%, 2.3% | Playground | Power at $T = 100$, fat tails: two-step, iterated, CUE | `playground: power …` |
| 66.0%, 56.3% | Playground | Power at $T = 500$, fat tails: two-step, CUE | same |
| 6 moments, 2 parameters, 4 | Quiz 1 | Degrees of freedom | `formalisation and quiz: counts …` |
| $J = 6.5$ | Quiz 3 | A made-up reading, just above 5.99 | same |

Playwright set each prompt's controls in the built site and read the same values from both readouts.

## Summary

**What.**
- `src/content/chapters/25-efficient-and-feasible-gmm.mdx`: frontmatter `part: 6`, `chapter: 25`,
  `difficulty: 3`, `prerequisites: [24]`; six template sections, three quizzes. It derives the sandwich variance
  from the first-order condition, proves $W = S^{-1}$ efficient (the cross terms vanish because $A_W D = I$),
  defines two-step, iterated and CUE, derives $J \to \chi^2_{\dim g - \dim\theta}$ through the projection
  $I - P$, and shows with seeded simulations the size of $J$ in short samples and an estimator study where the
  identity weighting beats two-step GMM at $T = 50$.
- `src/components/plots/GMMObjective.tsx` (from Chapter 24): a new `initialCount` prop, so Chapter 25 opens on four
  moments.
- `src/components/plots/JTestSim.tsx`: histogram of $J$ against the $\chi^2_2$ density (central difference of
  `chiSquareCdf`), the 5% cut-off (bisection on `chiSquareSurvival`), `Slider` for $T$ (50–1,000), `Segmented` for
  the method and for the tails, re-roll `Button`. The readout gives the rejection rate, the samples done, the mean
  $J$ and the share off the plot.
- `src/components/plots/gmmSample.ts` (from Chapter 24): the J-test settings (`J_SEED`, `J_DEFAULT_T`, `J_CHUNK`,
  `J_CHUNKS`, `J_SAMPLES`, `J_COUNT`) and the chunked `jTestChunk` / `jTestRun`.
- `tests/chapter25-numbers.test.ts`: every number in the prose.

**Timing.** `JTestSim` runs its 400 samples in 8 chunks of 50, one chunk per timer tick, so the page stays
responsive and the histogram fills as chunks arrive. In the built site, the default run (two-step, $T = 100$) is
done about 300 ms after the widget scrolls into view, hydration included. Measured worst prompt case: CUE with fat
tails at $T = 500$, 3.5 s, drawn progressively.

**Deviations and reports.**
- Chapter 24 merged while this PR was open, with its own `GMMObjective` and `gmmSample.ts`. The merge keeps
  main's versions. Their toy sample has 600 draws, not 200, so every toy-sample number in the prose and the test
  was recomputed. Main's widget shades a smaller objective more strongly and does not draw the other weightings'
  minima, so the Intuition's description of the widget now says that. The Hook links Chapter 24 and names its
  sample. The chapter still derives the sandwich itself, so it reads on its own.
- Notation follows §3, not the curriculum: $D$ for the curriculum's $d$, and $\chi^2_{\dim g - \dim\theta}$ for its
  $\chi^2_{r-k}$. The task spec writes $\chi^2_{L - \dim\theta}$; §3 uses $\dim g$ because $L$ counts Newey–West
  lags, so I followed §3.
- Symbols the §3 table lacks, all local to the derivations and defined where they appear (candidates for the
  table): $A_W$, $A_*$ (the linear map from $g_T(\theta_0)$ to $\hat\theta - \theta_0$), $\Delta = A_W - A_*$,
  $D_T$ (sample Jacobian), $\hat\theta_1$, $\hat\theta_k$ (stage estimates), $H = S^{-1/2}D$, the projection $P$,
  and $z$, $Q$, $\Lambda$ in the $\chi^2$ proof. Possible clashes a later guide edit could note: $\Delta$ is also
  the difference operator in $\Delta c_{t+1}$; $z$ is a state variable $z_t$ in Part V, but here it has no date;
  $P$ and $Q$ never carry a date, unlike a price $P_t$, and $Q$ is not $\mathbb{Q}$.
- Readings: Nagel (2013), NBER WP 18554, opened with `pdftotext -layout`; printed p. 20 (researchers' focus on
  economically interesting portfolios rather than statistically formed combinations) and p. 21 (an efficient
  weighting prices a traded factor exactly in large samples, an identity weighting may nearly ignore it). Hansen
  (1982) and Cochrane (2005), Ch. 11, are not in `source/papers/`; both are under Further reading only, and no fact
  is taken from them.
- The fat-tail power gap (iterated and CUE 2.3% against two-step 12.0% at $T = 100$) is library output; the chapter
  reports it without a mechanism, because I could not derive one.
- Test load: after the merge, the machine load average was 36–40 from parallel worktrees. Three plain `npm test`
  runs failed 1, 5 and 4 tests, every one `Test timed out in 5000ms`, in files this branch does not change
  (chapters 4, 11, 14, 18 and `cay.test.ts`). `npm test -- --testTimeout=60000` passed all 624 tests.
  `tests/chapter25-numbers.test.ts` takes about 10 s of CPU (it reruns ten J simulations and a 600-estimate study),
  with explicit 60–120 s timeouts on its slow tests.

**Verified revision.** Branch `goal/course-site/task-097` with `origin/main` `2e99f37` merged in; all Verify
commands ran on that merge.

**Follow-ups.**
- `docs/CURRICULUM.md` chapter 25 still writes $d$ and $\chi^2_{r-k}$ (already noted by TASK-093).
