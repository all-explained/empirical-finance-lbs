# TASK-028 outcome

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings. After `npm ci`, Vitest
  runs 13 files and 186 tests, all passing, including the six tests of `tests/chapter08-numbers.test.ts`.
  `astro check`: "Result (53 files): 0 errors, 0 warnings, 0 hints"; the static build ends with "Complete!".
- [x] `npm run screenshots -- 08-euler` passes with four ✓ lines (dark/light × desktop/phone) and no console,
  KaTeX or overflow error. I inspected the full pages and widget-level shots of every theme and size:
  - Desktop, both themes: the prerequisites callout, then the six sections. `SDFExplorer` shows the two state
    columns ("bad times", "good times") with a yellow SDF lollipop and a neutral payoff lollipop in each, "π = 0.50"
    above each column, and a "today" column with the price `P = 0.960` above a dashed line at 0.998. The readout
    gives E[M] 0.950, R^f +5.3%, E[X] 1.050, 0.998, P 0.960, E[R] +9.4% and a premium of +4.1%. `HJBound` shows the
    blue shaded region above a solid line of slope 0.45, dashed ±2 s.e. lines, the dashed yellow power-utility path
    and the dot "γ = 5" below the line; the readout says "0.45 (s.e. 0.10, 1202 months)", "0.10", "no, below the
    bound", "+11.0% a year", lowest γ inside 22, seed 1.
  - Phone (375 px), both themes: the controls stack below each plot; both plots fit the width. A first pass had
    the "π = 0.50" label over the y-axis title and six display equations that scrolled sideways; I moved the
    label down and broke those equations over two lines with `aligned`. A Playwright check then found 0
    display equations wider than their box at 1280 px and at 375 px.
- [x] `npm run clickthrough -- 08-euler` passes and reports both widgets: "Price = E[M × payoff]" (18 actions at
  1280 px and at 360 px: the three payoff presets and the five sliders π(1), M1, M2, X1, X2) and "The
  Hansen–Jagannathan bound" (7 actions at each width: the γ slider, the three samples and re-roll). A separate
  Playwright check dragged the bad-times SDF point from 1.10 to 1.60 and then pressed ArrowDown three times
  (to 1.45); the slider value and the readout followed both times.
- [x] The six `section-tag` headings are in template order (`grep -n 'section-tag'`): line 29 Hook,
  45 Intuition, 80 Formalisation, 251 Playground, 296 Check yourself, 322 Recap & next up.
- [x] No hex colour: the spec's grep prints `no hex colours`; the same grep over `sdfSamples.ts` and the test
  finds none. The widgets colour only through `var(--c-sdf)`, `--c-data`, `--c-prob`, `--c-rf`, `--c-return`,
  `--text` and `--text-muted`.
- [x] Real data and seeded simulation: `HJBound` loads `ff3-monthly` through `loadSeries`, `betweenDates`,
  `dateRange` and `ff3MarketReturns` (caption: "Data: ff3-monthly (Kenneth French Data Library), Mkt-RF from
  1926-07 to 2026-08"). Its power-utility SDF is simulated with `normalRng(seed)`, seed 1 by default, with a
  "Re-roll simulation" button and the seed in the readout. `SDFExplorer` has no randomness.
- [x] Voice review: see `## Voice review`. Numbers table: see `## Numbers in the prose`.
- [x] Prose length: 2,515 words, inside 1,500–3,000. Command (the chapter 9 command: it drops the frontmatter,
  imports and `$$` display blocks, and counts callouts, try-this paragraphs and quizzes):
  `awk 'NR>8' src/content/chapters/08-euler-equation-and-sdf.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1:

| Rule | Line in the chapter |
| --- | --- |
| Picture first, then the formula | The Intuition section puts `SDFExplorer` before any derivation: "For each state, multiply the payoff by $M$ and by the probability of the state. Then add up the states. That is an expected value." |
| Data before theory | "From July 1926 to August 2026, the US stock market paid 8.3% a year more than Treasury bills, on average." |
| One idea per section | Formalisation has one idea per subsection: "The Euler equation", "Power utility", "Returns and the risk-free rate", "Risk premia are covariances", "The Hansen–Jagannathan bound", "The beta form". |
| Start with a question the reader has | "If you could see the rule, could you tell from 0.45 what kind of investors set it?" |
| Write to "you", short sentences, explain terms | "An extra dollar is worth more to you when you have few of them." and "'Stochastic' means random: you do not know today which value applies." Chapter 1 is linked; Chapter 7 does not exist, so the opening callout recaps covariance, the Sharpe ratio and beta. |
| Give the honest version | "We also treat $R^f$ as a constant. That is a simplification: the real risk-free rate moves, and the conditional version above allows for it." |
| Say what the evidence can and cannot show | "First, 0.45 is an estimate. Its standard error is about 0.10 a year … Two standard errors on each side give a range from 0.25 to 0.65." |
| Don't skip steps in derivations | "Move the first term to the right side, and move the constant $\delta$ inside the expectation:", then each step from $P = \mathbb{E}[MX]$ to the covariance form, the bound and the beta form. |
| Graduate rigour comes in gradually (Part I) | Only algebra, expectations and covariances: "By the definition of covariance, $\mathbb{E}[XY] = \mathbb{E}[X]\,\mathbb{E}[Y] + \operatorname{Cov}(X, Y)$." |
| Papers in our own words | The readings are not in `source/papers/`, so the chapter attributes no fact or number to them and lists them only under Further reading. Consumption moments are labelled "an assumption, not data. Chapter 35 measures them." |

## Numbers in the prose

Every test is in `tests/chapter08-numbers.test.ts`. Data: `ff3-monthly`, 1926-07 to 2026-08. "Seeded" means
`crraMoments(γ, seed)` in `src/components/plots/sdfSamples.ts`.

| Number in the prose | Where | Test |
| --- | --- | --- |
| July 1926, August 2026, 1,202 months | Hook | `hook: the market excess return in ff3-monthly` |
| 8.3% a year (mean excess return, ×12) | Hook | same |
| 18.4% (volatility, ×√12) | Hook | same |
| 0.45 (annual Sharpe ratio); 45% of its mean | Hook, Playground, Quiz 3, Recap | same |
| SDF 1.10 and 0.80, probability one half | Intuition | `intuition: the two-state widget` |
| expected payoff 1.05 for all three | Intuition | same |
| prices 0.960, 0.998, 1.035 | Intuition | same |
| E[M] 0.95, R^f 5.3%; bond return 5.3% | Intuition, Formalisation | same |
| payoffs 0.80/1.30 (stock) and 1.30/0.80 (insurance) | Intuition | same |
| stock: 9.4% expected return, 4.1% premium | Intuition, Formalisation | same (also premium = E[R] − R^f) |
| insurance: 1.4% expected return, −3.8% premium | Intuition | same |
| δ = 0.99, γ = 5, ±2% growth → M = 0.90 and 1.10 | Formalisation | `formalisation: power utility and the beta form` |
| β = −1.74, λ_M = −0.024, product 4.1% | Formalisation | same |
| δ = 0.99, 2,000 draws, mean 2%, volatility 2%, seed 1 | Playground, Recap | `playground: the seeded power-utility SDF` |
| γ = 5 → σ(M)/E[M] = 0.10 | Playground | same |
| lowest γ inside: 22 (seed 1); "above 20" | Playground, Recap | same |
| implied R^f 41.5% at γ = 22; "far above any rate in the data" (highest annualised RF below 20%) | Playground | same |
| first five seeds: 22 or 23 | Playground | same (`[22, 22, 23, 23, 22]`) |
| s.e. 0.10; √(12/T) with T = 1,202 | Playground, Recap | `playground: limits of the estimated Sharpe ratio` |
| range 0.25 to 0.65 | Playground | same |
| 0.47 since 1963, 0.48 since 2000; s.e. 0.13 and 0.19 | Playground | same |
| R^f 3.2% a year; 1/1.032 = 0.97; 0.97 × 0.45 = 0.44 (44%) | Playground, Quiz 3 | same |
| Quiz 1: price 1.2, expected payoff 1.0 | Check yourself | `quizzes` |
| Quiz 3: 0.97 × 0.45 = 0.44 | Check yourself | same |

"Chapter 35" is a chapter number from `docs/CURRICULUM.md`, not a measured number.

## Summary

What: chapter 8 as `src/content/chapters/08-euler-equation-and-sdf.mdx`, with two widgets:

- `SDFExplorer`: two states of the world. The reader drags the SDF and the payoff in each state (Mafs
  `MovablePoint`, which also takes arrow keys), or uses five sliders and three payoff presets. The price,
  risk-free rate, expected return and covariance premium come from `price`, `riskFreeRate` and
  `riskPremiumFromCovariance`.
- `HJBound`: the region above $\sigma(M) = \mathbb{E}[M]\,|SR|$ from `hjRegion`, with the market's Sharpe ratio from
  `ff3-monthly` (three samples, ±2 s.e.), and a seeded power-utility SDF whose γ the reader moves from 0 to 50.

`src/components/plots/sdfSamples.ts` holds the glue that both widgets and the numbers test share, as
`predictiveSample.ts` does for chapter 9: the payoff presets, `marketSharpe` and `crraMoments`. It computes only
through `sdf.ts`, `returns.ts`, `moments.ts`, `rng.ts` and the typed loaders. No shared code changed.

How: the Formalisation derives the Euler equation from a two-date saver, then $M = \delta(C_{t+1}/C_t)^{-\gamma}$,
$1 = \mathbb{E}[M(1+R)]$, $1 + R^f = 1/\mathbb{E}[M]$, the covariance form, the Hansen–Jagannathan bound and the beta
form, one step at a time. The Playground states three limits: the Sharpe ratio is an estimate, one asset gives
only a lower limit, and the bound is necessary, not sufficient.

Deviations and mismatches (reported, not edited, as the spec asks):

- `docs/CURRICULUM.md` Key math writes $\beta$ for the time-discount factor and uses a gross $R^f$
  ($R^f = 1/\mathbb{E}[M]$, $\mathbb{E}[R^e] = -R^f\operatorname{Cov}$). The chapter follows `docs/STYLE_GUIDE.md`:
  $\delta$, a net $R^f$, so $1 + R^f = 1/\mathbb{E}[M]$ and $-(1 + R^f)\operatorname{Cov}(M, R^e)$, as `sdf.ts` does.
- `docs/CURRICULUM.md` writes $p = \mathbb{E}[mx]$. The style guide reserves $p$ for a log price, $x_t$ for a
  predictor and $m$ for the log SDF, and writes $P_t = \mathbb{E}_t[M_{t+1}X_{t+1}]$. The chapter uses
  $P = \mathbb{E}[MX]$.
- Symbols the chapter uses that are not in the style guide §3 table: $u(\cdot)$ (utility), $\xi$ (units bought),
  $e_t$ (income), and $G$ (gross consumption growth, in the `HJBound` caption). Each is defined where it appears.
  I propose adding them to the table in a later PR.
- The payoff $X$ and the price have no colour token, so both are drawn in the neutral text colour and are labelled
  "X" and "P = …". The SDF uses `--c-sdf`.
- `crraSdf(beta, gamma, g)` in `sdf.ts` names the time-discount argument `beta`; the style guide calls it
  $\delta$. This is cosmetic, not a defect.
- The standard error of the Sharpe ratio is $\sqrt{12}\,\text{s.e.(mean)}/\text{sd} \approx \sqrt{12/T}$. It ignores
  the sampling error of the standard deviation; the prose says "about".
- The consumption moments of the simulation (mean 2%, volatility 2% a year) are an assumption. The caption and the
  prose say so and point to Chapter 35.
- Hansen and Jagannathan (1991) is under Further reading, with Cochrane (2005) and Campbell (2018). None of the three
  is in `source/papers/`; the chapter takes no fact or number from them.

Verified revision: the PR head that holds this file, on `origin/main` `c723af0`. Local Verify: `npm ci`, `npm test`,
`npm run build`, `npm run screenshots -- 08-euler` and `npm run clickthrough -- 08-euler` all exit 0; the section-tag,
hex and tracked-file greps print as above. GitHub Actions were not read or used.

Proposed follow-ups:

- Add $u$, $\xi$, $e_t$ and $G$ to the style guide's notation table, and align the curriculum's Key math for
  chapter 8 with the style guide ($\delta$, net $R^f$, $P = \mathbb{E}[MX]$).
