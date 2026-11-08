# TASK-140 outcome: Chapter 38, long-run risk

## Acceptance

Verified revision: `828f83d` (the chapter commit, on `origin/main` `f7fd8fe`). The outcome commit adds only this file.

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exit 0; `npm test` exit 0, `Test Files 81 passed (81)`, `Tests 892 passed (892)`, including
  `tests/notation.test.ts` and the new `tests/chapter38-numbers.test.ts` (7 tests); `npm run build` exit 0,
  `0 errors`, `0 warnings`, `1 hint`, `38 page(s) built`. The hint is the unused `Matrix` import in
  `src/lib/finance/news.ts`, outside this task and already reported as #88.
- [x] `npm run screenshots -- 38-long-run-risk` passes in both themes at desktop and phone size, and I inspected the
  images.
  Evidence: exit 0 with `✓` for `dark-desktop`, `dark-phone`, `light-desktop` and `light-phone`. I read the pages in
  crops of the images. The inspection found two problems, now fixed. Four display equations (the log SDF, the
  exponent $m_{t+1} + r_{c,t+1}$, the surprise in $m_{t+1}$ and the equity premium) scrolled sideways inside their
  box on a phone; they now break over more lines. A Playwright check with every `<details>` open finds 7 display
  equations and none wider than its box at 375px and at 360px, no page overflow and no console errors. One sentence
  mixed the gap at the end of the century with the widest gap; it now says "drift up to 0.29 log points apart".
  The same check moves the $\psi$ slider by keyboard to 1.00, where the readout says there is no price because
  $\theta_{\text{EZ}}$ has no value, and to 0.95, where prices return.
- [x] `npm run clickthrough -- 38-long-run-risk` passes and reports every widget of the chapter.
  Evidence: exit 0. `A SMALL, PERSISTENT PART OF CONSUMPTION GROWTH · 9 actions at 1280px, 9 actions at 360px`
  (segmented "Calibration": BKY and BY; slider "Persistence of $x_t$, $\phi_x$ (a month)"; slider "Elasticity $\psi$";
  button "New seed"). `LongRunRisk` is the chapter's only widget.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` prints lines 22 Hook, 38 Intuition, 66 Formalisation, 274 Playground,
  287 Check yourself, 313 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the spec's `git diff --name-only origin/main -- 'src/components/plots/*.tsx' … | xargs grep -nE
  '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` prints `no hex colours`. `longRunRiskSample.ts` has none either.
- [x] `LongRunRisk` uses seeded simulations from `src/lib/math/rng.ts`, and its data curve and the prose numbers on data
  use the committed `fred-consumption-annual` and `goyal-welch-annual`.
  Evidence: `consumptionCentury(params, seed)` and `modelVarianceRatios` call `simulateLongRunRisk` of
  `src/lib/finance/longRunRisk.ts`, which draws from `normalRng(seed)` of `src/lib/math/rng.ts`. The default seed is
  1, and "New seed" adds 1. The data curve comes from `useLongRunRiskData`, which loads the two series through
  `useSeriesData`; the numbers test reads the same two committed JSON files through `annualData`.
- [x] The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table
  of every number in the prose with its test. Evidence: the two sections below.
- [x] The prose is 1,500–3,000 words (give the command).
  Evidence: 2,730 words. Command (the one of earlier chapter outcomes):
  `awk 'NR>8' src/content/chapters/38-long-run-risk.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).
  Evidence: it prints `0` and exits 1.

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition runs `LongRunRisk` ("The solid line includes $x_t$. The dashed line uses the very same shocks without it.") before the Formalisation writes the dynamics and solves for $A_1$. |
| Data before theory | The Hook opens on our data: "Growth averaged 1.83% a year, with a standard deviation of 2.17%. It has a little memory: its first-order autocorrelation is 0.36." |
| One idea per section | Each `###` carries one idea: "Two parameters for two attitudes", "The log SDF", "The dynamics", "The log-linear solution", "Three prices of risk", "The equity premium", "Can the data see it?". |
| A question the reader has | "Can a part of consumption growth that you can hardly see in the data be what makes stocks risky? And if it is that hard to see, how would you ever test it?" |
| Write to "you", short sentences, link back | "Your value $V_t$ mixes today's consumption with a certainty equivalent of tomorrow's value." The chapter links Chapters 5, 10, 11, 35 and 36. |
| The honest version | "In seed 3 the century's $\mathit{VR}(10)$ is 1.52, below the data, although the model is true." |
| What the evidence can and cannot show | "The estimates are point values with Newey–West standard errors from one sample, and the 1,000 seeded samples assume the model is true." |
| No skipped steps | The log SDF takes five numbered steps in a `<details>` block; $A_1$ is derived term by term; a second `<details>` block derives $\lambda_\eta = \gamma$ and the weights of $e$ and $w$. |
| Graduate rigour, with a plain reading | "Good news about growth does two things. It raises future cash flows, which raises prices. It also raises interest rates … which lowers them. With $\psi > 1$ the first effect wins." |
| Papers in our own words | "Bansal, Kiku & Yaron answer that the price–dividend ratio mixes two states, so it is a weak proxy for $x_t$." No text, figure or table is copied. |

## Numbers in the prose

Every number from our data or the seeded simulations is recomputed in `tests/chapter38-numbers.test.ts` (7 tests, all
pass) through `annualData`, `consumptionCentury` and `modelVarianceRatios` of
`src/components/plots/longRunRiskSample.ts`, and `solveLongRunRisk`, `simulateLongRunRisk`, `annualise`,
`consumptionPredictability` and `epsteinZinTheta` of `src/lib/finance/longRunRisk.ts`. The "1,000 seeded samples" are
seeds 1 to 1,000, each 97 years of months, which `annualise` turns into 96 years of growth, the length of our data.

| Number in the prose | Where | Test |
|---|---|---|
| 1930–2025, 96 years; mean 1.83%, sd 2.17%, AC1 0.36 | Hook | `hook: the annual data and the faint signal` |
| BKY: $x_t$ is 2.8% of the variance of monthly growth; AC1 0.028 | Hook, warning callout | `hook: …` |
| BKY premium 6.42%, of which 2.05 points from long-run risk | Hook, Formalisation, Playground, Recap | `hook: …`; `formalisation: the equity premium and the risk-free rate` |
| $\phi_x$ 0.975 and 0.979; half-lives 27.4 and 32.7 months | Intuition | `intuition: persistence, the seeded century and the variance ratios` |
| Seed 1: paths at most 0.29 log points apart | Intuition | `intuition: …` |
| 10,000-year path: $\mathit{VR}(10)$ 2.63 (BKY); data 1.61 | Intuition, Formalisation | `intuition: …`; `can the data see it: variance ratios and the predictive regressions` |
| $\gamma = 10$, $\psi = 1.5$ in both; $\theta_{\text{EZ}} = -27$, weight $-28$ | Formalisation | `formalisation: θ_EZ, the solution and the prices of risk in BKY` |
| $\phi_\sigma = 0.999$; $\beta_{d,x}$ 2.5 and 3 | Formalisation | `formalisation: θ_EZ, …` |
| $\rho_c = 0.9987$, $A_1 = 12.70$; $1/\psi = 0.67$ | Formalisation | `formalisation: θ_EZ, …` |
| $\lambda_\eta = 10$, $\lambda_e = 13.5$, $\lambda_w \approx -57{,}000$; $\sigma_w = 2.8 \times 10^{-6}$ | Formalisation | `formalisation: θ_EZ, …` |
| BKY rf 1.28%; terms 1.62, 2.05, 2.76; shares 25%, 32%, 43% | Formalisation, Recap | `formalisation: the equity premium and the risk-free rate` |
| BY premium 5.54%, rf 2.58%; BY at $\psi = 1/\gamma$: 0.00% and 16.75% | Formalisation | `formalisation: the equity premium …` |
| $\mathit{VR}(10)$ 3.26 for BY | Formalisation | `can the data see it: variance ratios …` |
| 21.3% (BKY) and 8.3% (BY) of 1,000 samples have $\mathit{VR}(10) \le 1.61$ | Formalisation | `can the data see it: 1,000 seeded samples of 96 years` |
| Data, 1930–2025: 1-year slope 0.006, $t$ 0.80, $R^2$ 0.018; 5-year slope −0.025, $t$ −1.61, $R^2$ 0.068 | Formalisation | `can the data see it: variance ratios …` |
| Long path 1-year $R^2$: 0.387 (BY), 0.043 (BKY) | Formalisation | `can the data see it: variance ratios …` |
| Data 1930–2006: 1-year $R^2$ 0.072 | Formalisation | `can the data see it: variance ratios …` |
| No BY sample and 18.7% of BKY samples have $R^2 \le 0.018$ | Formalisation, Quiz 3 | `can the data see it: 1,000 seeded samples …` |
| Half-life "of two years" (2.3) | Warning callout | `can the data see it: 1,000 seeded samples …` |
| $\phi_x$ 0.95 → 2.88%, 0.99 → 15.41% | Playground | `playground: the sliders and the seeds` |
| $\psi = 0.9$: $A_1 = -4.28$, premium 5.17%, rf 3.00% | Playground | `playground: …` |
| Seed 3: century $\mathit{VR}(10)$ 1.52 | Playground | `playground: …` |

Numbers marked as the papers' are not our data and are not tested; each was checked with `pdftotext -layout` against
the working paper page named. Bansal, Kiku & Yaron (NBER WP, November 2009): Epstein–Zin preferences, pdf p. 6;
solution (9) and the $\psi > 1$ intuition, pdf p. 8; eqs. (10)–(11), pdf p. 9; the 25/32/43% split and the VAR
consumption $R^2$ of 26% at one year, pdf pp. 12–13; $A_{1,m}$, eq. (12), pdf p. 23. Beeler & Campbell (NBER WP,
March 2009): the cancellation at $\psi = 1$, pdf p. 3; discount-rate news in BKY, pdf pp. 4–5; the predictability test,
pdf pp. 12–16; Table I (both calibrations), pdf p. 34; Table VI Panel A (BY): population $R^2$ 0.390 and 0.373 against
0.068 and 0.000 in the 1930–2006 data, pdf p. 41.

## Summary

**What.** `src/content/chapters/38-long-run-risk.mdx` (six template sections, 2,730 words, three `Quiz` questions), the
widget `src/components/plots/LongRunRisk.tsx`, its helpers `src/components/plots/longRunRiskSample.ts`, and
`tests/chapter38-numbers.test.ts`.

**How.**
- `useLongRunRiskData` loads `fred-consumption-annual` and `goyal-welch-annual` through `useSeriesData` of
  `seriesSample.ts`, and `annualData` pairs them with `annualConsumption` (the helper `puzzleSample.ts` uses) and
  `annualConsumptionPredictors`. No new loading code.
- `consumptionCentury` draws the seeded century twice from `simulateLongRunRisk`, with and without the persistent
  part (same shocks, `persistent: false`). The two lines differ by colour and by stroke: solid with $x_t$, dashed
  without. `modelVarianceRatios` uses one 10,000-year path, time-aggregated by `annualise` as the data are.
- The paths are simulated with consumption-only pricing (`consumptionOnly`): `simulateLongRunRisk` solves prices first,
  and BKY's dividend claim has no finite price once $\varphi_e = 0$. Consumption does not depend on prices, so the
  paths match the calibration draw for draw. The code comment names this limit.
- `pricing` catches $\psi = 1$ (no $\theta_{\text{EZ}}$) and parameters with no finite price, and the readout says so.
- The widget does not animate, so `useTweened` and issue #120 do not apply.

**Notation.** All symbols are rows of the Part X block of `docs/STYLE_GUIDE.md` §3 already on `main`, so this PR does
not change the style guide. Replacements, reported in the chapter's "The symbols" callout: the curriculum's $\mu$ is
$\mu_c$; $\theta$ is $\theta_{\text{EZ}}$ ($\theta$ is the GMM parameter vector); $\rho$ is $\phi_x$ ($\rho$ is a
Campbell–Shiller constant); the papers' $\kappa_1$ is $\rho_c$. $\varphi_e$ keeps the curriculum's symbol, always with
its subscript.

**Deviations and mismatches.**
- Data: the curriculum's data line names `fred-consumption-quarterly`, which starts in 2007 (issue #112). The chapter
  uses the annual series `fred-consumption-annual` with `goyal-welch-annual` instead, as the spec asks.
- Curriculum Key math writes $\mu$, $\theta$ and $\rho$; §3 wins, as listed under Notation.
- Chapter 37 is not merged (no `37-*.mdx` on `origin/main`). The opening callout names it by title, "Internal and
  external habits", without a link, and says only that this chapter does not build on it. Chapter 39 is named by
  title only in "Recap & next up".
- Bansal & Yaron (2004) and Epstein & Zin (1989) are named only where Beeler & Campbell or Bansal, Kiku & Yaron name
  them, with no number taken from them. Campbell (2018), Ch. 6, is listed under further reading only.
- Beeler & Campbell use Newey–West with $2(k - 1)$ lags; the library uses $k$ lags. The chapter states its own choice.

**Follow-ups.** When Chapter 37 merges, the Part X read-through can turn its title in the opening callout into a
link.
