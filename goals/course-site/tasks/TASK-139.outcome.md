# TASK-139 outcome: Chapter 37, Internal and external habits

Status: **delivered.**

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exit 0. `npm test`: `Test Files 84 passed (84)`, `Tests 931 passed (931)`. `npm run build`
  exit 0: `Result (244 files): - 0 errors - 0 warnings`, `39 page(s) built`.
- [x] `npm run screenshots -- 37-internal-and-external-habits`, `-- 09-time-varying-expected-returns` and
  `-- 14-consumption-wealth-ratio` pass in both themes at desktop and phone size, and I inspected the images.
  Evidence: each run exits 0 with four `✓` lines (dark/light × desktop/phone). I read both chapter 37 widgets in all
  four sizes and themes, with the data and with the habit model selected, and the Formalisation on the dark phone
  page. Fixes from that reading: the $\bar S$ label sat on the data line and was removed (the legend names the
  line); the readout values wrapped into three or four lines on the phone and are now short; the option
  "habit model (seeded)" broke the toggle into two rows on the phone and is now "habit model"; two display
  equations ran past a 375px screen and now break over more lines. Chapter 9's dp widget (light desktop) and
  chapter 14's cay widget (dark phone) look as on `main`.
- [x] `npm run clickthrough` passes for the three chapters and reports every widget of each. Evidence: all exit 0.
  Chapter 37: `HOW A HABIT TURNS SMOOTH CONSUMPTION INTO SWINGING PRICES · 10 actions at 1280px, 10 actions at
  360px · slider "Curvature γ"; slider "Persistence ϕ12, a year"; slider "Date t"; button "New seed"` and `DOES
  THE PRICE RATIO FORECAST RETURNS, IN THE DATA AND IN THE HABIT MODEL? · 9 actions … · slider "Horizon k";
  segmented "Data" option "goyal-welch-annual"; segmented "Data" option "habit model"; button "Re-roll
  simulation"; select "Standard errors"`. Chapter 9: its two widgets, the dp one with `option "simulated
  (seeded)"` as before. Chapter 14: its three widgets, the cay one unchanged.
- [x] The six `section-tag` headings are in template order. Evidence: `grep -n 'section-tag'` prints Hook (24),
  Intuition (41), Formalisation (87), Playground (285), Check yourself (307), Recap & next up (333).
- [x] No hex colour in the chapter or its widgets. Evidence: the spec's `git diff … | xargs grep -nE …` prints
  `no hex colours`.
- [x] `HabitSimulator` and the habit view of `PredictiveRegression` use seeded simulations from
  `src/lib/math/rng.ts`; the data side uses the committed `goyal-welch-annual`; the default views are unchanged.
  Evidence: both call `simulateHabit(seed, …)` (seeded through `rng.ts` in the library), seed 1, "New seed" and
  "Re-roll simulation" add 1. The data side loads through `usePredictiveSample('data', seed, 'dp')` inside
  `useHabitPredictiveSample` and shows pd = −dp. For `dp` and `cay`, `useHabitPredictiveSample` returns
  `usePredictiveSample(source, seed, predictor)` unchanged, every `TEXT.dp` and `TEXT.cay` string is unchanged,
  and the click-through of chapters 9 and 14 reports the same controls and labels.
- [x] The outcome holds a voice review and a table of every number in the prose with its test. Evidence: the two
  sections below.
- [x] The prose is 1,500–3,000 words. Evidence: 2,856 words. Command (the one of earlier chapter outcomes):
  `awk 'NR>8' src/content/chapters/37-internal-and-external-habits.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).
  Evidence: it prints `0` and exits 1.

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | `HabitSimulator` and "Watch the middle panel… The price of a claim to all future consumption follows it" come before the Formalisation writes the law of motion of $s_t$. |
| Data before theory | The Hook opens on the numbers of our data in Chapters 35 and 9: "power utility reaches the market's Sharpe ratio of 0.45 only at $\gamma = 20.0$… Treasury bills paid 0.24%". |
| One idea per section | Each `###` of the Formalisation carries one idea: local curvature, the habit's motion, the SDF, the price of risk, the choice of $\Lambda$, prices and returns, the answer to Chapter 35. |
| A question the reader has | "Can one modest curvature then look like a huge and changing fear of risk?" |
| Write to "you", short sentences, link back | "Your habit comes from *your own* past consumption. Then a meal out tonight raises the standard you will judge tomorrow by, and you know it.", with links to Chapters 5, 8, 9, 35 and 36. |
| The honest version | "Campbell & Cochrane *choose* $\delta$ to match the T-bill rate and $\gamma$ to match the Sharpe ratio… So the model does not predict these two numbers." |
| What the evidence can and cannot show | The warning box: our typical price–consumption ratio is 35.1 years against the paper's 18.3, because the level depends on how deep slumps are priced; "The shape, the Sharpe ratio and the predictability do not depend much on this." And "A century of the model is one draw, just as our century of data is." |
| Don't skip steps | Local curvature from $u'$ and $u''$; the log SDF from the law of motion; $\Lambda$ in three numbered steps with the algebra of steps 2 and 3 in a `<details>` box; the cancellation in the rate. |
| Graduate rigour comes in gradually | Part X is ●●●: lognormal algebra and a function of the state, each result read in words ("In a slump, people are close to their habit, so they fear any further fall"). |
| Papers in our own words | "Campbell & Cochrane (pdf p. 37) answer with a simple point. Prices depend only on *ratios* of marginal utilities". No text, figure or table is copied. |

## Numbers in the prose and their tests

All in `tests/chapter37-numbers.test.ts`, test names in quotes. Model: `simulateHabit` with seed 1 at Table 1's
parameters (`campbellCochraneParameters`), monthly; "the century" is 100 years, "5,000 years" is 60,000 months
summed to years by `habitClaimReturns`. Data: `goyal-welch-annual` (pd = −dp of Chapter 9) and Chapter 35's samples
through `puzzleViews`, `powerUtilityPath` and `marketSharpe`.

| Number in the prose | Test |
|---|---|
| Sharpe 0.45, $\gamma = 20.0$, $r^f$ 28.2%, T-bills 0.24% (Chapter 35); $R^2$ 11.8% at ten years (Chapter 9) | `hook: the numbers of chapters 35 and 9` |
| Habit 94.3% of consumption, surplus 5.7%, 1% fall in $C$ is 17.5% of the surplus | `intuition: the surplus, internal against external habits, Table 1` |
| $X_t = hC_{t-1}$: ratio 0.49 to 0.52 at $h = 0.5$, 0.11 to 0.29 at $h = 0.8$ (`habitMarginalUtility`) | `intuition: the surplus, …` |
| Table 1: mean 1.89%, volatility 1.50% a year, $\gamma = 2$, $\bar S = 0.057$ | `intuition: the surplus, …` |
| Try this: year 56.5, $S_t = 0.019$, curvature 106.8, $P_t/C_t$ 26.3 against a mean of 35.8; $\gamma = 4$: $\bar S$ 0.081, curvature 49.6, mean 27.8 | `intuition: the widget at its defaults, and at γ = 4` |
| $\gamma/\bar S = 35.1$; $\phi^{12} = 0.87$, half-life 5.0 years | `formalisation: curvature, persistence, the price of risk and the rate` |
| Price of risk 0.53 a year at the steady state; power utility 0.03 | `formalisation: curvature, …` |
| $s_{\max} = -2.37$, $S_{\max} = 0.094$ | `formalisation: curvature, …` |
| $P_t/C_t$ 41.6 at $S_{\max}$, 34.1 at $\bar S$, 24.0 at $S_t = 0.01$ | `formalisation: curvature, …` |
| 5,000 years; typical $P_t/C_t$ 35.1 years | `formalisation: the answer to chapter 35` |
| Table: $\delta$ 0.99 (Chapter 35) and 0.896; $r^f$ 0.94%; Sharpe 0.47; local curvature 35.1 and 20.0 | `formalisation: the answer to chapter 35` (and `hook`, `formalisation: curvature`) |
| Power utility needs $\delta = 1.245$ (Chapter 35) | `formalisation: the answer to chapter 35` |
| Rate terms 11.0%, 3.78%, 13.85% (sum 0.94%) | `formalisation: the answer to chapter 35` |
| Claim's excess return: mean 3.85%, volatility 8.2% a year | `formalisation: the answer to chapter 35` |
| Data, one year: slope −0.042, $t$ −0.94; model: slope −0.233, $t$ −3.35, $R^2$ 10.2%; ten years: model $R^2$ 41.4% (data 11.8%) | `playground: data and model regressions, and the long-run slopes` |
| 10 × slope on 5,000 years: −1.6, −3.0, −4.1, −5.9, −7.3 at 1, 2, 3, 5, 7 years | `playground: …` |
| Standard deviation of $pc_t$ 0.13 (model) and of $pd_t$ 0.50 (data) | `playground: …` |
| Quiz: $2/0.057 \approx 35$, $2/0.02 = 100$ | `quiz: local curvature` |
| Paper's numbers: 18.3, 6.64%, 15.2% (Table 2, pdf p. 20); −2.0 to −9.4 (Table 5, pdf p. 23); Table 1 (pdf p. 13) | Read from the PDF and labelled as the paper's in the prose; not ours, so not tested |
| 1930, 100 years, 5,000 years, 12 months, three conditions | Structural, not estimates |

Every page cited in the prose (pdf pp. 4, 5, 7, 8, 9, 11, 12, 13, 20, 23, 37, 38, 39) was opened in this session by
rendering it with `pdftoppm` and reading it with `tesseract`. Constantinides (1990) and Abel (1990) are named only
where Campbell & Cochrane name them (pdf pp. 37 and 4). Campbell (2018), Ch. 6, is listed under further reading and
gives no fact.

## Summary

**What.** `src/content/chapters/37-internal-and-external-habits.mdx` (2,856 words, three `Quiz` questions); the
widget `src/components/plots/HabitSimulator.tsx`; `src/components/plots/habitSample.ts` (the model at a given
$\gamma$ and $\phi^{12}$, the seeded century, the habit `PredictiveSample`, and the one hook
`useHabitPredictiveSample`); a `predictor="habit"` view of `PredictiveRegression`;
`tests/chapter37-numbers.test.ts`; and one sentence in the $pc_t$ row of the Part X block of `docs/STYLE_GUIDE.md`
§3.

**How.** `HabitSimulator` draws three panels over a seeded century: consumption and habit over trend, $S_t$ with
$\bar S$ and $S_{\max}$, and $P_t/C_t$, with sliders for $\gamma$, $\phi^{12}$ and the date, and a "New seed"
button. When $\gamma$ or $\phi$ moves, $\delta$ is chosen again so $r^f$ stays at Table 1's 0.94%, as the paper
chooses $\delta$ (pdf p. 12). One `priceConsumptionRatio` solve takes 20–180 ms over the slider ranges (TASK-136
measures 35 ms at Table 1), so the widget solves again 200 ms after the sliders rest and shows "solving…" until
then. The readout gives $\bar S$, $S_{\max}$, $s_{\max}$, $r^f$, $\delta$, $S_t$ and $\gamma/S_t$ at the date,
$P_t/C_t$ at the date and its mean. The habit view of `PredictiveRegression` shows pd = −dp of `goyal-welch-annual`
or a seeded century of the model with $pc_t$ as the predictor and the claim's log excess return as the outcome,
annual. It is one entry of the `TEXT` table plus four optional `sim*` strings, so `dp` and `cay` keep their strings.
`useHabitPredictiveSample` calls the same hooks for every view, so the component follows the rules of hooks.
No `useTweened`, so issue #120 does not apply.

**Notation.** Following the §3 Part X block: the curriculum's and the paper's $\lambda(s_t)$ is $\Lambda(s_t)$
($\lambda$ is a risk premium), $g$ is $\mu_c$ ($g$ is the GMM moment function), and $\phi$ stays $\phi$. The paper's
local curvature $\eta_t$ is written $\gamma/S_t$ ($\eta_t$ is the conditional SDF intercept of Chapter 22); the
chapter states each replacement. $X_t$, $S_t$, $s_t$, $\bar S$, $s_{\max}$, $\Lambda$ and $h$ were already in §3; the
$pc_t$ row now says Chapter 37 uses it for the habit model's consumption claim.

**Deviations and mismatches.**
- Data: the curriculum names `shiller-monthly`; the chapter uses Chapter 9's `goyal-welch-annual` dividend–price
  data, as the spec asks, so the model and the data sit in the same widget.
- The curriculum's widget line says `HabitSimulator` shows "the price–dividend ratio it implies". The model's claim
  pays consumption, so the widget shows the price–consumption ratio.
- The curriculum's Key math writes $\lambda(s_t)$ and $g$; the chapter follows §3 (above).
- The model's price level is about twice the paper's (35.1 against 18.3 years), the known result of TASK-136's
  converged solution. The chapter says so in a warning box and leans on the shape, the Sharpe ratio and the
  slopes, not the level.
- The model's Sharpe ratio is that of the unlevered consumption claim, as in Table 2's consumption-claim column.
- Chapter 38 is named only in "Recap & next up", by title.

**Verified revision.** The commit that adds this file, rebased on `origin/main` `e8b8198`.

**Follow-up.** None for this task. Seen on `main`, not changed: on a phone, the `Data` toggle of the dp and cay
views wraps "simulated (seeded)" onto a second row; it works and reads correctly.
