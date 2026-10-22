# TASK-027 outcome

## Acceptance

Verified revision: `d298ece` (rebased on `origin/main` at `24010b0`, after TASK-023 merged Chapter 3).

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  `npm ci` exited 0. `npm test`: 14 files, 203 tests passed (6 of them in
  `tests/chapter07-numbers.test.ts`). `npm run build`: "0 errors, 0 warnings, 0 hints", then "[build] Complete!".
- [x] `npm run screenshots -- 07-mean-variance` passes in both themes at desktop and phone size, and I inspected
  the images. All four lines are ✓ (`dark-desktop`, `dark-phone`, `light-desktop`, `light-phone`). I inspected the
  full pages and element shots of both widgets in both themes at 1280px and 360px. The inspection found and fixed:
  a 17px phone overflow from long `Select` option labels; ring markers that rendered as filled dots; a "+ −4.3%"
  sign in a readout; a top y tick under the axis title; and display equations that needed side-scrolling on
  phones (a Playwright check now finds 0 of them at 360px and 375px, with the `<details>` block open).
- [x] `npm run clickthrough -- 07-mean-variance` passes and reports every widget of the chapter:
  - `✓ … BUILD THE FRONTIER FROM A FEW PORTFOLIOS · 14 actions at 1280px, 14 actions at 360px · select "Asset to move"; slider "Shift in the expected return of middle"; button "Remove small growth"; button "Remove small value"; button "Remove big growth"; button "Remove big value"; button "Add middle"; button "Reset"`
  - `✓ … DOES BETA LINE UP WITH AVERAGE RETURNS? · 27 actions at 1280px, 27 actions at 360px · segmented "Sample" option "1963–2026"; segmented "Sample" option "1926–2026"; select "Ringed portfolio"`
- [x] The six `section-tag` headings are in template order: `grep -n 'section-tag'` gives Hook (29), Intuition (45),
  Formalisation (85), Playground (260), Check yourself (295), Recap & next up (321).
- [x] No hex colour in the chapter or its widgets. The spec command prints `no hex colours`. A direct
  `grep -nE '#[0-9a-fA-F]{3,8}\b'` on `FrontierBuilder.tsx`, `SMLPlot.tsx`, `capmSample.ts` and the MDX file also
  finds nothing (exit 1). Every colour is a `var(--…)` token.
- [x] At least one widget uses real data from the chapter's curriculum entry, and every simulation is seeded.
  Both widgets load `ff25-size-bm-monthly` and `ff3-monthly` through `loadSeries`/`getColumn`, and their captions
  name both dataset IDs and the sample period. The chapter has no simulation, so no random numbers are drawn.
- [x] The outcome holds a voice review and a table of every number in the prose with its test. See the two
  sections below.
- [x] The prose is 1,500–3,000 words: 2,459 words. Command (the one TASK-014 used; it drops the frontmatter, the
  imports and the display-math blocks):
  `awk 'NR>8' src/content/chapters/07-mean-variance-and-the-capm.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints `0` and exits 1, which DEC-002 accepts.

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line from the chapter |
|---|---|
| Picture first, then the formula | "Each mix has an expected return and a volatility, so each mix is a point on a chart of expected return against volatility." The `FrontierBuilder` widget comes before any formula. |
| Data before theory | "From July 1963 to August 2026, small growth stocks earned 4.0% a year more than Treasury bills, on average. Small value stocks earned 13.4% a year more." |
| One idea per section | Intuition has one idea, in its key callout: "With a safe asset, every mean–variance investor holds the same risky portfolio: the tangency portfolio." Playground has one: "average returns do not line up with beta." |
| Start with a question the reader has | "If risk earns a reward, why did the riskier stocks pay less?" |
| Write to "you", short sentences, explain terms | "You can hold a few risky portfolios. How should you mix them?" Terms are bold where they are defined ("the **tangency portfolio**"). The prerequisite callout links Chapters 2 and 3 and gives a short reminder of each. |
| Give the honest version | "The CAPM of Sharpe (1964) and Lintner (1965) adds assumptions. Investors care only about the mean and variance of next period's return. They agree on $\mu$ and $\Sigma$." |
| Say what the evidence can and cannot show | "Each alpha has a $t$-statistic, but 25 $t$-statistics are not a test of the CAPM: they are correlated, and some will look large by luck." Every estimate gives its sample, and the key means give standard errors ("7.2% a year, with a standard error of 1.9"). |
| Don't skip steps in derivations | The Sharpe-ratio step writes out $\sqrt{\eta^2\,\mu^{e\prime}\Sigma^{-1}\Sigma\,\Sigma^{-1}\mu^e}$ before it cancels. The solution for $\eta_1, \eta_2$ and $\sigma_p^2$ is in a `<details>` block. |
| Graduate rigour comes in gradually | Part I (●–●●) uses matrix algebra with a plain reading after each result: "In words, the **alpha** is the average excess return minus the CAPM prediction." |
| Papers in our own words | The chapter states no fact or number from a paper or book. Readings appear only by name, and under further reading. |

## Numbers in the prose and their tests

Every test is in `tests/chapter07-numbers.test.ts`. "Post" is July 1963 to August 2026 (758 months) and "full" is
July 1926 to August 2026, both from `ff25-size-bm-monthly` and `ff3-monthly`. Means, alphas and standard errors are
×12 and volatilities ×√12.

| Number in the prose | Where | Test |
|---|---|---|
| July 1963 to August 2026; 63 years | Hook, Intuition, Playground, Recap | `samples` |
| July 1926; 1926–2026 | Playground | `samples` |
| 25 portfolios | Intuition, Playground | `samples` |
| 4.0% (small growth average excess return) | Hook, Playground | `hook: …`, `security market line, 1963–2026` |
| 13.4% (small value average excess return) | Hook, Playground | `hook: …`, `security market line, 1963–2026` (also the maximum) |
| 27.6% and 21.7% (volatilities) | Hook | `hook: …` |
| 9.4 pp gap, standard error 1.9, about five standard errors | Hook | `hook: …` |
| Tangency weights 149%, 79%, −117%, −12% | Intuition (Try this) | `frontier widget: …` |
| Sharpe ratio 1.04, and 0.90 after the shift | Intuition (Try this) | `frontier widget: …` |
| −2 pp shift → small value weight 126% | Intuition (Try this) | `frontier widget: …` (the shift is the reader's input) |
| 2.7 (standard error of small value's average) | Intuition | `frontier widget: …` |
| β 1.42, CAPM prediction 10.2%, α −6.3%, t −2.94 (small growth) | Playground (Try this) | `security market line, 1963–2026` |
| β 1.06, α +5.7%, t 3.17 (small value) | Playground (Try this) | `security market line, 1963–2026` |
| Market premium 7.2%, standard error 1.9 | Playground, Recap | `security market line, 1963–2026` |
| Fitted slope −4.3% | Playground, Recap | `security market line, 1963–2026` |
| Betas 0.86 to 1.42 | Playground | `security market line, 1963–2026` |
| Alphas −6.3% to +5.7% | Playground, Recap | `security market line, 1963–2026` |
| "In every size group, the value portfolio has a higher alpha than the growth portfolio" | Playground | `security market line, 1963–2026` (loop over the five sizes) |
| Full sample: premium 8.3%, fitted slope 4.8%, intercept 4.9% | Playground | `security market line, 1926–2026` |
| "The dots move closer to the CAPM line" (full sample) | Playground (Try this too) | `security market line, 1926–2026` (smaller mean absolute alpha) |
| Quiz 2: Sharpe ratios 0.3 and 0.4 → 0.5 | Check yourself | `quiz 2: …` (via `maxSharpeSquared`) |
| Quiz 1 (6%, β = 1.5 → 9%) and quiz 3 (40%/0.5, 20%/1.2) | Check yourself | Made-up inputs. Quiz 1's answer is the one multiplication shown in its explanation. |

## Summary

What:
- `src/content/chapters/07-mean-variance-and-the-capm.mdx`: frontmatter as specified, a prerequisite callout,
  the six sections, three `Quiz` questions and further reading.
- `src/components/plots/FrontierBuilder.tsx`: four (or five) size–B/M portfolios, the minimum-variance frontier,
  the risk-free rate, the capital market line, the tangency portfolio and the market. Readout: each asset's
  expected return and tangency weight (a signed number plus a bar), the best Sharpe ratio, and the tangency and
  market means and volatilities.
- `src/components/plots/SMLPlot.tsx`: the 25 portfolios' average excess return against beta, with the CAPM line
  (solid), the fitted cross-sectional line (dashed) and alphas as vertical segments. Controls: the sample
  (1963–2026 or 1926–2026) and the ringed portfolio. The readout gives its beta, average ± standard error, CAPM
  prediction and alpha with its $t$-statistic. The text says plainly that the CAPM fits the 25 portfolios badly,
  and it leaves the formal tests to Chapters 16–18.
- `src/components/plots/capmSample.ts`: data loading and composition of library calls, shared by the widgets
  and the numbers test (the same pattern as `predictiveSample.ts`).
- `tests/chapter07-numbers.test.ts`: recomputes every number in the prose.

How: the widgets compute only through `src/lib/finance/portfolio.ts` (`sampleMeans`, `sampleCovariance`,
`frontier`, `tangencyWeights`, `maxSharpeSquared`, `betas`, `securityMarketLine`), `src/lib/stats/ols.ts` (alphas
and their $t$-statistics), `src/lib/stats/moments.ts` (annualising, standard errors) and the typed loaders in
`src/lib/data/series.ts`. Both widgets use `WidgetFrame`, `PlotFrame`/`Label`, the shared `Slider`, `Segmented`,
`Select` and `Button`, `client:visible`, CSS-variable colours and an `aria-label` that summarises the figure.
`SMLPlot` tweens its y-axis with `useTweened`, which jumps at once under `prefers-reduced-motion`.

Deviations and interpretations:
- "Drag expected returns" is a keyboard-accessible slider. It shifts the expected return of the asset chosen in
  "Asset to move" by −10 to +10 percentage points, in steps of 0.5. I chose a slider over dragging points in the
  plot because the slider works by keyboard and the click-through script drives it.
- "Pick assets" uses one Add/Remove button per portfolio. With 0 assets the widget asks for one. With 1 asset, or
  with equal means, the frontier is one point, and the widget draws no curve.
- `capmSample.ts` computes the tangency portfolio's mean $w'\mu$ and volatility $\sqrt{w'\Sigma w}$ inline,
  because `portfolio.ts` has no function for a given portfolio's moments. These are two weighted sums. It also
  annualises a covariance as 12 × the monthly value, with `annualiseMean` applied to each entry.
- The tangency weights from `tangencyWeights` are shown only when the tangency mean is above $R^f$. Otherwise the
  readout says that no tangency portfolio exists.
- `FrontierBuilder` always uses July 1963 to August 2026. `SMLPlot` opens on that sample and can switch to 1926.
- The alpha $t$-statistics use classical OLS standard errors. The widget caption says so.

Mismatches to report (I did not edit `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md`):
- The curriculum's key math writes the target mean as $\bar\mu$. Style guide §3 keeps a bar for a sample mean,
  so the chapter writes $\mu_p$.
- These symbols are not in the §3 tables: $\mu_p$ and $\sigma_p$ (portfolio mean and volatility); $\mu^e$ (the
  vector of expected excess returns); $w_m$ and $w^*$ (market and tangency weights); $SR_{\max}$; the Lagrange
  multipliers $\eta, \eta_1, \eta_2$ (the chapter says why it does not use $\lambda$); and $A, B, C, D$ (in the
  `<details>` block only). Proposed: add $\mu_p$, $\sigma_p$, $\mu^e$, $w_m$ and $SR_{\max}$ to the
  "Returns and prices" table.
- Readings: Campbell (2018) and Cochrane (2005) are not in `source/papers/`, and I did not open them. The
  chapter lists them under further reading only. Markowitz (1952), Sharpe (1964) and Lintner (1965) are named as
  the sources of the frontier and the CAPM, and are in further reading. I did not open them, and the chapter
  quotes no fact or number from them. Fama and French (1993) is the citation that `docs/DATA.md` gives for the
  25 portfolios.

Proposed follow-ups:
- Add `portfolioMoments(w, mu, Sigma)` to `src/lib/finance/portfolio.ts`, so that the inline $w'\mu$ and
  $w'\Sigma w$ in `capmSample.ts` can go.
- A later chapter (Part III or VII) could show the out-of-sample Sharpe ratio of an estimated tangency portfolio.
  The warning callout in this chapter only states that the in-sample value tends to be too high.
