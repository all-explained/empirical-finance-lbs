# TASK-129 outcome: Chapter 35, the equity premium and risk-free rate puzzles

## Acceptance

Verified revision: `383b471` (the chapter commit, rebased on `origin/main` `c7ff41a`). The outcome commit adds only
this file.

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exit 0; `npm test` exit 0, `Test Files 77 passed (77)`, `Tests 832 passed (832)`, including
  `tests/notation.test.ts` and the new `tests/chapter35-numbers.test.ts` (8 tests); `npm run build` exit 0,
  `Result (226 files): 0 errors, 0 warnings`, `36 page(s) built`.
- [x] `npm run screenshots -- 35-equity-premium-and-risk-free-rate-puzzles` and
  `npm run screenshots -- 08-euler-equation-and-sdf` pass in both themes at desktop and phone size, and I inspected
  the images.
  Evidence: both exit 0 with `✓` for `dark-desktop`, `dark-phone`, `light-desktop` and `light-phone` of each chapter.
  I read chapter 35 in dark desktop (whole page), light desktop (`HJBound`), dark phone (both widgets, the evidence
  callout and the δ paragraphs) and light phone (`HJBound`), and chapter 8's `HJBound` in dark desktop. The
  inspection found two problems, now fixed:
  1. The first run failed all four chapter 35 shots with `RangeError: σ_c must be nonnegative`. `useTweened` can
     dip below its start value on its first frame, and the power-utility view tweens σ_c up from 0 while the data
     load. The view now clamps the tweened σ_c at 0, with a comment. The shared bug is
     all-explained/empirical-finance-lbs#120.
  2. On the phone, the "admissible SDFs" label touched the y-axis title. It now sits at σ(M) = 0.98, clear of the
     curve.
  Chapter 8's `HJBound` shows the same plot, ±2 s.e. band, controls and readout as before.
- [x] `npm run clickthrough -- 35-equity-premium-and-risk-free-rate-puzzles` and
  `npm run clickthrough -- 08-euler-equation-and-sdf` pass and report every widget of each chapter.
  Evidence: both exit 0. Chapter 35: `POWER UTILITY AGAINST THE HANSEN–JAGANNATHAN BOUND · 6 actions at 1280px,
  6 actions at 360px` (slider Risk aversion γ; Consumption sample: Annual, Postwar, Quarterly) and `THE PUZZLE
  CALCULATOR · 9 actions at 1280px, 9 actions at 360px` (Consumption sample: Annual, Postwar, Quarterly; sliders
  Risk aversion γ and Time discount δ, a year). Chapter 8: `PRICE = E[M × PAYOFF] · 18 actions` and `THE
  HANSEN–JAGANNATHAN BOUND · 7 actions at 1280px, 7 actions at 360px` (slider Risk aversion γ; Sample: 1926–2026,
  1963–2026, 2000–2026; button Re-roll simulation), the same controls as before this task.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` prints lines 23 Hook, 37 Intuition, 69 Formalisation, 234 Playground,
  250 Check yourself, 276 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the spec's `git diff --name-only origin/main -- 'src/components/plots/*.tsx' … | xargs grep -nE
  '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` prints `no hex colours`.
- [x] The widgets use real data (`fred-consumption-annual`, `fred-cay-quarterly`, `goyal-welch-annual`,
  `goyal-welch-monthly` and `ff3-monthly`), and the default view of `HJBound` is unchanged.
  Evidence: `usePuzzleViews` in `src/components/plots/puzzleSample.ts` loads the first four series through the
  existing `useSeriesData` and builds the three samples with `annualConsumption`, `annualSample` and
  `quarterlySample`. The power-utility view takes the market Sharpe ratio from `useFF3` and `marketSharpe` of
  `sdfSamples.ts`. `HJBound` with no `preset` renders `SimulatedView`, which is the old component body unchanged;
  chapter 8 still writes `<HJBound client:visible />`.
- [x] The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table
  of every number in the prose with its test. Evidence: the two sections below.
- [x] The prose is 1,500–3,000 words (give the command).
  Evidence: 2,206 words. Command (the one of chapters 9, 10, 13, 16, 22, 26, 30 and 33):
  `awk 'NR>8' src/content/chapters/35-equity-premium-and-risk-free-rate-puzzles.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).
  Evidence: it prints `0` and exits 1.

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition draws the power-utility curve against the HJ region ("As $\gamma$ rises from 0, these points trace a curve") before the Formalisation derives $\sigma(M)/\mathbb{E}[M] \approx \gamma\sigma_c$. |
| Data before theory | The Hook opens on our data: "From 1930 to 2025, the US stock market earned a log real return of 6.52% a year, on average. Treasury bills earned 0.24%." |
| One idea per section | Each `###` carries one idea: "One fact about the normal distribution", "The pricing rule in logs", "The risk-free rate", "The equity premium", "The Hansen–Jagannathan ratio", "The numbers", "The risk-free rate puzzle in numbers". |
| A question the reader has | "If consumption hardly ever falls by much, why did investors need 6.3% a year to hold stocks?" |
| Write to "you", short sentences, link back | "For each $\gamma$ you get one SDF", with links to Chapters 8, 14 and 26 where their ideas return. |
| The honest version | "Ludvigson (2013, working paper, pdf p. 22) reports that the data reject joint lognormality, so read the numbers below as a careful approximation, not as exact model values." |
| What the evidence can and cannot show | "The 6.28% premium has a standard error of 1.97% … a correlation of 0.07 is well inside two standard errors of zero", and the next-year timing that moves the covariance $\gamma$ to 36. |
| No skipped steps | The lognormal Euler equation goes from $\mathbb{E}[e^x] = e^{\mu_x + \frac12\sigma_x^2}$ through the mean and variance of $x$ to $r^f$, the premium equation and $\sqrt{e^{\gamma^2\sigma_c^2} - 1}$, each step written out. |
| Graduate rigour, with a plain reading | Each term of $r^f = -\log\delta + \gamma\mu_c - \tfrac12\gamma^2\sigma_c^2$ gets its story: "impatience", "growth", "precautionary saving". |
| Papers in our own words | "Campbell (2014, working paper, pdf p. 10) explains it with exactly this bound and traces it to Mehra and Prescott (1985)." No text, figure or table is copied. |

## Numbers in the prose

Every number from our data is recomputed in `tests/chapter35-numbers.test.ts` (8 tests, all pass) through
`puzzleViews` and `powerUtilityPath` of `src/components/plots/puzzleSample.ts`, which call
`src/lib/finance/consumptionPuzzle.ts`, and `marketSharpe` of `sdfSamples.ts`. Annual: 1930–2025, postwar
1947–2025, quarterly 1952-Q2 to 2025-Q4; all rates log real, a year.

| Number in the prose | Where | Test |
|---|---|---|
| 1930–2025, 96 years; market 6.52%, bills 0.24%, premium 6.28% (6.3%), volatility 19.2% | Hook | `hook: the annual sample, 1930–2025` |
| $\mu_c$ 1.83%, $\sigma_c$ 2.17%; "about 2% … give or take 2%" | Hook, Intuition | `hook: …` |
| Ratio 0.11 at $\gamma = 5$; market Sharpe ratio 0.45 | Intuition (Try this), Formalisation | `intuition: the power-utility curve against the bound` |
| Lowest $\gamma$ on the curve 20.0; its $r^f$ 28.2%, about 28 points above the data | Intuition, Formalisation | `intuition: …` |
| $0.98^{-20} = 1.50$, $0.98^{-5} = 1.11$ | Intuition | `intuition: …` |
| Table: periods 96, 79, 295; $\mu_c$, $\sigma_c$, corr, premium, $\sigma_i$, both $\gamma$ rows, mean $r^f$ for the three samples | Formalisation | `formalisation: the table of three samples` |
| Annual log Sharpe ratio 0.33; $\gamma$ "15 to 29"; correlations "from 0.04 to 0.07" | Formalisation | `formalisation: reading the table` |
| Standard error 1.97%; $\pm 2/\sqrt{96} = \pm 0.20$; next-year timing: corr 0.53, $\gamma$ 36, $SR/\sigma_c$ 14.3 | Formalisation | `formalisation: what the evidence can and cannot show` |
| $r^f$ 23.2% at $\gamma = 15.0$, 2.81% at $\gamma = 1$; matching $\delta$ 1.245, postwar 1.536 at $\gamma = 28.6$; $4.5 \times 10^{-6}$ at $\gamma = 271$ | Formalisation | `formalisation: the risk-free rate puzzle` |
| $\delta$ from 0.99 to 1 lowers the rate by 1.0 point at $\gamma = 15$; matching $\delta$ about 1.09 at $\gamma = 5$ in each sample | Playground | `playground: the try-this prompts` |
| Quiz: $0.45/0.015 = 30$; 271 vs 15.0, about 18 times; Recap: $r^f$ 23% to 44%, data under 1% | Check yourself, Recap | `check yourself and recap` |

Numbers taken from readings, not from our data, each cited with its page: Campbell (2014, working paper, pdf p. 10),
a Sharpe ratio of 0.4 and $\sigma_c$ on the order of 0.01, needing $\gamma$ on the order of 40. $\delta = 0.99$ is
the style guide's default; 0.45 and 1.5% in the first quiz are a stated exercise.

## Summary

**What.** `src/content/chapters/35-equity-premium-and-risk-free-rate-puzzles.mdx` (six template sections, 2,206
words, three `Quiz` questions). The widget `PuzzleCalculator`. A `preset="power-utility"` view of `HJBound`. The
hook `src/components/plots/puzzleSample.ts`, and `tests/chapter35-numbers.test.ts`.

**How.**
- `puzzleViews` builds three samples: annual from 1930 and its postwar part (`annualSample` on
  `annualConsumption`), and quarterly from 1952 (`quarterlySample`). It annualises them with `puzzleMoments` and
  gives both $\gamma$ values with `impliedRiskAversion`.
- `powerUtilityPath` runs `crraHjPath` for $\gamma$ from 0 to 50 in steps of 0.1 and finds the lowest $\gamma$
  whose $\sigma(M)/\mathbb{E}[M]$ reaches the market's Sharpe ratio. The `HJBound` view draws that curve, and its
  readout gives that $\gamma$ and its $r^f$ from `impliedRiskFree`.
- `PuzzleCalculator` shows the data moments of the chosen sample, the $\gamma$ the premium needs both ways, the
  model $r^f$ next to the data, and the matching $\delta$ from `impliedTimeDiscount`.
- Readings opened with `pdftotext -layout`: Campbell (2014, working paper, pdf p. 10); Ludvigson (2013, working
  paper, pdf pp. 4 and 22). Mehra & Prescott (1985) is named only where Campbell names it. Weil (1989) is not named:
  Ludvigson's p. 4 names the risk-free rate puzzle but cites Weil (1989) for recursive utility, not as its origin.

**Notation (curriculum Key math → §3).** The §3 Part IX block already holds every symbol, so `docs/STYLE_GUIDE.md`
is unchanged.
- $r_f$ → $r^f$, the §3 risk-free rate.
- $\delta$ in $r_f = \delta + \ldots$ (a rate of time preference) → $-\log\delta$, with $\delta$ the time-discount
  factor.
- $g$ → $\mu_c$, because $g$ is the GMM moment function.
- $\sigma_c$, $\sigma_i$, $\sigma_{ic}$ are kept.

**Deviations and mismatches.**
- Data: the curriculum's data line names `fred-consumption-quarterly` (it starts in 2007) and `shiller-monthly`.
  The chapter uses the longer `fred-consumption-annual` and the quarterly consumption of `fred-cay-quarterly`, with
  the Goyal–Welch returns (`goyal-welch-annual`, `goyal-welch-monthly`), as the spec asks.
- Loading: `useLookAheadData` of `caySample.ts` returns a processed look-ahead view, not the raw series, so
  `usePuzzleViews` loads the four series in one `useSeriesData` call (the shared loader on `loadSeries`). It adds no
  loading code.
- Two Sharpe ratios: the `HJBound` view uses the market's 0.45 from monthly simple returns in `ff3-monthly`, as
  chapter 8 does; the table uses each sample's own log Sharpe ratio (0.33 for the annual one). The chapter says so
  and explains why the widget needs $\gamma = 20.0$ where the table says 15.0.
- Workaround: the power-utility view clamps the tweened $\sigma_c$ at 0 because of the shared `useTweened` bug
  (all-explained/empirical-finance-lbs#120). Fixing `animation.ts` is outside this task's scope.

**Follow-ups.** Fix all-explained/empirical-finance-lbs#120 in `animation.ts`, then drop the clamp in
`HJBound.tsx`.
