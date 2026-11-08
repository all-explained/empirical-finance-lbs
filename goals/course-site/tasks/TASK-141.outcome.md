# TASK-141 outcome: Chapter 39, rare disasters and jump risk

## Acceptance

Verified revision: `0a8daf8` (the chapter commit, on `origin/main` `be267c1`). The outcome commit adds only this
file.

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exit 0; `npm test` exit 0, `Test Files 83 passed (83)`, `Tests 928 passed (928)`, including
  `tests/notation.test.ts` and the new `tests/chapter39-numbers.test.ts` (11 tests); `npm run build` exit 0,
  `Result (242 files): 0 errors, 0 warnings, 1 hint`. The hint is the unused `Matrix` import in
  `src/lib/finance/news.ts`, outside this task and already reported as #88.
- [x] `npm run screenshots -- 39-rare-disasters-and-jump-risk` passes in both themes at desktop and phone size, and I
  inspected the images.
  Evidence: exit 0 with `✓` for `dark-desktop`, `dark-phone`, `light-desktop` and `light-phone`. I read the page in
  crops of all four images. The inspection found one problem, now fixed: in `DisasterLottery` the "D" marker of a
  disaster sat at the foot of the plot, where the line lands after the fall, so the second marker touched the line.
  The markers now sit in headroom at the top, below the axis title, and the crops of both widgets in all four images
  show them clear of the line. Every display equation fits the 375px phone width; the five-column table of our
  numbers scrolls sideways on a phone, as every prose table does.
- [x] `npm run clickthrough -- 39-rare-disasters-and-jump-risk` passes and reports every widget of the chapter.
  Evidence: exit 0. `A CENTURY WITH RARE DISASTERS · 10 actions at 1280px, 10 actions at 360px` (slider "Disaster
  chance πD, a year", slider "Disaster size bD", slider "Risk aversion γ", button "New century") and
  `HOW THE ENTROPY ESTIMATOR REWEIGHTS THE YEARS · 5 actions at 1280px, 5 actions at 360px` (segmented "Sample":
  "To 2025" and "To 2009"; slider "Risk aversion γ").
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` prints lines 25 Hook, 42 Intuition, 70 Formalisation, 310 Playground,
  324 Check yourself, 350 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the spec's `git diff --name-only origin/main -- 'src/components/plots/*.tsx' … | xargs grep -nE
  '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` prints `no hex colours`.
- [x] `DisasterLottery` uses seeded simulations from `src/lib/math/rng.ts`, and `EntropyReweighting` and the prose
  numbers on data use the committed `fred-consumption-annual` and `goyal-welch-annual`.
  Evidence: `DisasterLottery` calls `disasterLottery(seed, …)` of `src/components/plots/disasterSample.ts`, which
  calls `simulateDisasterCentury` of `src/lib/finance/disasters.ts`; that function draws from `mulberry32` and
  `normalRng` of `src/lib/math/rng.ts`. The default seed is 2, and "New century" adds 1. `EntropyReweighting` loads
  the two series through `useEntropyViews`, built on `useSeriesData` of `seriesSample.ts` (the hook
  `puzzleSample.ts` uses), and builds the sample with Chapter 35's `annualConsumption` and `annualSample`. The numbers
  test reads the same two committed JSON files.
- [x] The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table
  of every number in the prose with its test. Evidence: the two sections below.
- [x] The prose is 1,500–3,000 words (give the command).
  Evidence: 2,969 words. Command (the one of chapters 9, 10, 13, 16, 22, 26, 30, 33 and 36):
  `awk 'NR>8' src/content/chapters/39-rare-disasters-and-jump-risk.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).
  Evidence: it prints `0` and exits 1.

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition runs `DisasterLottery` and explains "a dollar in a disaster year is worth far more" (line 56) before the Formalisation derives $\mathcal{D}_0 = 1 - \pi_D + \pi_D(1 - b_D)^{-\gamma}$. |
| Data before theory | The Hook opens on our data: "From 1930 to 2025, stocks beat bills by 6.28% a year, yet real consumption per person grew smoothly, with a standard deviation of 2.17% a year." (line 27) |
| One idea per section | Each `###` carries one idea: the Euler equation with a disaster state, the risk-free rate, the premium, the peso problem, letting the data choose the weights, the dual, estimating $\gamma$, and the numbers on our sample. |
| A question the reader has | "If disasters are rare, how would you ever know how likely they are?" (line 38) |
| Write to "you", short sentences, link back | "Drag $\pi_D$ to zero. The premium falls to zero and the risk-free rate jumps to 8.69%." The callout links Chapters 8, 24 and 35. |
| The honest version | "Be clear about what is new. With one moment and one parameter, both criteria reach zero where the equal-weight mean is zero … The point estimate is not new." (line 269) |
| What the evidence can and cannot show | "The weights can only sit on years we observed. If the true disaster is worse than any year in the sample, no reweighting finds it." (line 303), with the asymptotic $\chi^2_1$ and 96 years. |
| No skipped steps | The premium takes three numbered steps, the first-order step is worked out in `<details>`, and the dual goes from the derivative to $\pi_t \propto e^{\ell g_t}$ to $\mathit{KL}(\gamma) = -\log(\frac1T\sum_t e^{\ell g_t})$ line by line. |
| Graduate rigour, with a plain reading | "The estimator does not ask for deeper consumption disasters. It asks for more years in which stocks crash while consumption dips." (line 297) |
| Papers in our own words | "They argue that it counts a fall that lasted several years as if it came in one." (Julliard & Ghosh, p. 16). No text, figure or table is copied. |

## Numbers in the prose

Every number from our data or the simulations is recomputed in `tests/chapter39-numbers.test.ts` (11 tests, all
pass) through `disasterLottery`, `lotteryParams`, `emptyCenturyShare` and `entropyViews` of
`src/components/plots/disasterSample.ts`, `puzzleViews` of `puzzleSample.ts`, and `requiredDisasterProbability` and
`simulateDisasterCentury` of `src/lib/finance/disasters.ts`.

| Number in the prose | Where | Test |
|---|---|---|
| 1930–2025; premium 6.28%, consumption volatility 2.17%; $\gamma$ of at least 15 | Hook | `hook: the puzzle of Chapter 35` |
| Economy: 2% give or take 2%, $\pi_D = 1.7\%$, $b_D = 40\%$, stock volatility 16%, $\gamma = 4$ | Intuition | `intuition: the default economy and its closed forms` |
| Closed forms: premium 4.14%, risk-free −2.13%; at $\pi_D = 0$: 0.00% and 8.69% | Intuition, Formalisation | `intuition: the default economy…` |
| $(1 - 0.4)^{-4} = 7.7$ ("almost eight"); 6.7 in the approximation | Intuition, Formalisation | `intuition: the default economy…` |
| Seed 2: two disasters, years 25 and 39, sample premium 3.18% | Intuition | `intuition: the default century and the share of empty centuries` |
| 17.9% of seeds 1 to 10,000 hold no disaster | Intuition, Formalisation | `intuition: the default century…` |
| Approximation $0.017 \times 0.4 \times 6.7 = 4.57\%$; 1.52% at $b_D = 0.3$ | Formalisation | `formalisation: the premium and the needed disaster chance` |
| $\pi_D$ needed for 6.28%: 2.72% ($b_D = 0.4$), 8.72% ($b_D = 0.3$), every 11 years | Formalisation | `formalisation: the premium and the needed…` |
| $0.983^{100} = 18.0\%$; mean premium of empty centuries 4.81% | Formalisation | `formalisation: the peso problem` |
| 96 years; worst consumption years 1930, 1932, 1933, 2020; weights exist at every $\gamma$ | Formalisation | `formalisation: the annual sample and its four worst years` |
| Table: $\mathit{KL}$, weight on the four worst years, $\mathit{LR}$ and $p$-value at $\gamma$ = 0, 4, 10, 20, 30; 4.2% at equal weights | Formalisation | `formalisation: the table across γ` |
| $\hat\gamma = 42.8$ by both criteria; to 2009: 35.7, $\mathit{LR}(10) = 4.85$, $p$ 0.028 | Formalisation, Playground, Recap | `formalisation: the estimates, in full and to 2009` |
| At $\gamma = 10$: 1931 3.12× (3.25% against 1.04%), 1930 2.25×, 2008 1.93×, 1933 0.34× | Formalisation, Quiz 3 | `formalisation: where the weight goes at γ = 10` |
| Towards 43 the entropy is near zero and the test stops rejecting; after 2009 the premium was higher | Playground | `playground: the try-this prompts` |
| Quizzes: $0.5^{-4} = 16$; $0.99^{100} = 37\%$ | Check yourself | `check yourself` |

Facts from Julliard & Ghosh (2012) are cited with their pages and are not our data; the pages are those of the
working-paper PDF, whose printed and PDF page numbers agree. Page 2: Rietz (1988) pioneered and Barro (2006) revived
the rare-events idea. Page 4: recession rather than disaster risk. Page 5: BETEL of Schennach (2005); equal-weight
estimators credit a premium in a disaster-poor sample to high risk aversion. Page 6: EL, eq. (3). Page 7: the entropy
problem, eq. (6), and the $\chi^2$ likelihood ratio test. Page 8: calibration by fixing the preference parameters;
the 1929–2009 sample. Page 9: nondurables, the CRSP index of all stocks, the consumption deflator. Pages 15–17:
international disasters in place of the Great Depression; the standard calibration of $\gamma$ about 4 and 1.7%;
15.1%, a disaster every 6.6 years. Pages 19–20: $\gamma = 10$, largest BETEL weight 2.6% against 1.3%. Page 32:
Appendix A.1.2, eqs. (17)–(18). Page 37: Table 1, Panel A.

## Summary

**What.** `src/content/chapters/39-rare-disasters-and-jump-risk.mdx` (six template sections, 2,969 words, three
`Quiz` questions). The widgets `DisasterLottery` and `EntropyReweighting`. The helpers
`src/components/plots/disasterSample.ts`, and `tests/chapter39-numbers.test.ts`. One row in the Part X block of
`docs/STYLE_GUIDE.md` §3.

**How.**
- `DisasterLottery` prices a stock whose normal-year risk has no covariance with consumption, so its whole premium
  comes from disasters, with `disasterPricing`, and draws one century with `simulateDisasterCentury`.
- `EntropyReweighting` shows $T\pi_t$ as a dot on a stem from the dashed equal-weight line, so colour is never the only
  cue; the four worst consumption years carry a ▼ on the axis. It reads `entropyProfile` on a grid of $\gamma$ from 0
  to 50 in steps of 0.5, and says so in text when no weights exist at a $\gamma$ (on our sample they exist at every
  grid point).
- `useEntropyViews` loads the two series once with `useSeriesData` and builds the sample with `annualSample`; no new
  loading code. No `useTweened` animation, so issue #120 does not apply.
- Readings opened with `pdftotext -layout`: Julliard & Ghosh (2012), working paper, the pages listed above.
  Rietz (1988), Barro (2006) and Schennach (2005) are named only where Julliard & Ghosh name them, with their page.
  Campbell (2018), Ch. 6, is listed under further reading only.

**Notation.** The curriculum's $p$, $b$ and $\pi_t$ follow the §3 Part X block: $p$ is $\pi_D$ (`\Prob`), $b$ is
$b_D$ (and $b_{D,i}$ for a stock), and the weights are $\pi_t$ (`\Prob`); the curriculum's $M_t(\gamma)R^e_t$ is
$g_t(\gamma)$. The disaster factors are $\mathcal{D}_0$ and $\mathcal{D}_i$, a new §3 row, because $A_0$ is the
$pc_t$ loading of Chapter 38. The stock's normal shock is $u_{t+1}$, the second-equation shock of §3, because
$\eta_{t+1}$ is Chapter 38's consumption shock. The second multiplier of the dual is described in words, not named.

**Deviations and mismatches.**
- Data: the curriculum's data line names `fred-consumption-quarterly` (it starts in 2007, issue #112) and
  `ff3-monthly`. The chapter uses the annual sample of Chapter 35 from 1930 (`fred-consumption-annual` with
  `goyal-welch-annual`), which, like Julliard & Ghosh's, starts with the Great Depression. The curriculum's widget
  line says "worst quarters"; the widget shows years.
- Readings: the curriculum writes "Ghosh & Julliard (2012)"; the authors' order is Julliard & Ghosh, which the chapter
  uses.
- Chapters 37 and 38 are not merged. The Hook names them by title, *Internal and external habits* and *Long-run
  risk*, without links. Chapter 40 is named by title only in "Recap & next up".
- Our estimates (42.8, and 35.7 to 2009) are above Julliard & Ghosh's 28.5. The chapter says the measures differ
  (nondurables and services, the CRSP value-weighted S&P 500 and CPI inflation, against their nondurables, CRSP index
  of all stocks and consumption deflator) and that the verdict on $\gamma = 10$ is the same.

**Follow-ups.** When Chapters 37 and 38 merge, the Part X read-through can turn their titles in the Hook into links.
