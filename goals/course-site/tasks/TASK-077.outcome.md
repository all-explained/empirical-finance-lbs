# TASK-077 outcome

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: after `npm ci` (exit 0), `npm test` reports 48 files and 522 tests passed, `tests/chapter23-numbers.test.ts` included (5 tests).
  `npm run build` exits 0: "0 errors", "0 warnings", "1 hint", "Complete!". The hint is an unused import in
  `src/lib/finance/news.ts`, a file this task does not touch.
- [x] `npm run screenshots -- 23-does-the-conditional` passes in both themes at desktop and phone size, and I inspected the images.
  Evidence: exit 0 with four ✓ lines (dark/light × desktop/phone). I also shot each widget alone at 1280px and 360px
  in both themes, and the page in slices (dark 1280px, light 360px), and read them. The inspection found three
  defects, all fixed before the final run: long display equations scrolled sideways at 360px (now split with
  `aligned`), the `AlphaBound` readout wrapped into tall columns at 360px (values shortened), and one caption showed a
  raw `σ(λ_t)` (now KaTeX).
- [x] `npm run clickthrough -- 23-does-the-conditional` passes and reports every widget of the chapter.
  Evidence: exit 0. "HOW MUCH DOES A MARKET BETA MOVE? · 5 actions at 1280px, 5 actions at 360px · segmented "Factor"
  option "HML (value)"; segmented "Factor" option "Mom (momentum)"; slider "Rolling window"" and "HOW MUCH ALPHA CAN
  BETA TIMING CREATE? · 3 actions at 1280px, 3 actions at 360px · slider "σ(λt), volatility of the expected market
  premium"". The chapter has these two widgets only.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` gives lines 15 Hook, 35 Intuition, 73 Formalisation, 243 Playground, 280 Check
  yourself, 306 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the spec's `git diff --name-only origin/main -- 'src/components/plots/*.tsx' … | xargs grep -nE
  '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` prints "no hex colours". The same grep on
  `src/components/plots/shortWindowSample.ts` finds nothing. Colours are `var(--c-data)`, `var(--c-model)`,
  `var(--c-factor)` and `var(--text)`.
- [x] The widgets use real data (`ff3-monthly`, `mom-monthly`, `ff3-daily`, `mom-daily`).
  Evidence: `useShortWindowData` in `src/components/plots/shortWindowSample.ts` calls `loadSeries` for the four IDs.
  Both captions name them and the sample, 1964-01 to 2026-06.
- [x] The outcome holds a voice review and a table of every number in the prose with its test. See below.
- [x] The prose is 2,583 words, inside 1,500–3,000. Command (the one of chapters 9, 10, 13 and 16):
  `awk 'NR>8' src/content/chapters/23-does-the-conditional-capm-explain-anomalies.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1.

| Rule | Line of the chapter |
| --- | --- |
| Picture first, then the formula | "Start with the picture. Below, the line is a rolling beta…" comes before any formula; the bound σ(β)σ(λ) is first read off the widget's numbers. |
| Data before theory, where we can | The hook opens with the HML and Mom CAPM alphas, 4.56% and 8.53% a year, 1964-01 to 2026-06, before any model. |
| One idea per section | Intuition: beta moves, but only timing matters. Formalisation: the alpha of a conditional CAPM and how to measure beta. Playground: the bound against the facts. |
| Start with a question the reader has | "Could beta timing be large enough to explain alphas of 4.6% and 8.5% a year?" |
| Write to one reader, as "you" | "You just measured the first factor: about 0.3 for HML and 0.5 for Mom." |
| Give the honest version | "It uses the estimated $\sigma(\hat\beta_{i,q})$, which is too large. That makes the bound more generous still." |
| Say what the evidence can and cannot show | "The bound is an argument about **magnitudes**… It is not a formal test of every conditional model, for three reasons." |
| Don't skip steps in derivations | Steps 1–3 derive Eqs. (1)–(4); the algebra for $\beta^u_i$ is written out in eight numbered steps in a `<details>` block. |
| Graduate rigour comes in gradually | Part V (●●): conditional moments and covariances, each read in words ("The second term is the timing reward from the hook"). |
| Papers in our own words | "Think of a shop that is open on some days and closed on others…" No paper text, figure or table is copied; Table 1 and Table 3 are cited by number only. |

## Numbers in the prose

Every number from our data is recomputed in `tests/chapter23-numbers.test.ts`, through `shortWindowSample.ts` and
`src/lib/finance/shortWindow.ts`. Sample: monthly and daily French data, 1964-01 to 2026-06.

| Number in the prose | Where | Test |
| --- | --- | --- |
| 750 months, 1964-01 to 2026-06 | Hook | `hook: …` (`SAMPLE`, `months`) |
| HML alpha 4.56% a year, s.e. 1.29%; beta −0.14 | Hook | `hook: …` |
| Mom alpha 8.53% a year, s.e. 1.83%; beta −0.16 | Hook | `hook: …` |
| 62 years | Hook | `hook: …` (`floor(750/12)`) |
| 4.6% and 8.5% a year | Hook | `hook: …` |
| about 63 daily returns a quarter | Intuition, Formalisation | `intuition: …` (mean `nobs`) |
| HML rolling σ 0.31 (12 months) to 0.19 (120 months) | Intuition try-this | `intuition: …` |
| Mom quarterly betas −1.97 (2009-Q2) to 1.46 (1966-Q2), σ 0.54 | Intuition try-this | `intuition: …` |
| about 2% for each 1% (2009-Q2) | Intuition | `intuition: …` (`round(1.97)`) |
| about 0.3 (HML) and 0.5 (Mom) | Intuition | `intuition: …` |
| 0.5% a month = 6% a year | Intuition | arithmetic in `intuition: …`; the value is from Lewellen & Nagel (2006, p. 290) |
| 0.31 × 6% = 1.9% | Intuition | `intuition: …` |
| squared monthly Sharpe ratio 0.018 (Mkt-RF) | Formalisation | `formalisation: …` |
| average s.e. of one quarterly beta 0.14 (HML), 0.17 (Mom) | Formalisation | `formalisation: …` |
| σ(β̂) 0.31 and implied 0.27 (HML); 0.54 and 0.51 (Mom) | Formalisation | `formalisation: …` |
| 21 trading days | Formalisation | `formalisation: …` (`TRADING_DAYS`); the convention is from p. 299 |
| 250 quarters | Formalisation, quiz | `formalisation: …`, `quiz: …` |
| average conditional alpha 3.89% (t 2.72) HML, 10.10% (t 6.18) Mom | Formalisation | `formalisation: …` |
| bound at 6%: 1.88% (HML), 3.27% (Mom) | Playground | `playground: …` |
| 41% and 38% of the actual alphas | Playground, Recap | `playground: …` |
| σ(λ) needed: 14.6% (HML), 15.7% (Mom) | Playground | `playground: …` |
| average premium 7.16% a year | Playground | `playground: …` |
| 15%: band from −23% to +37% | Playground | `playground: …` |
| quiz: 0.4 × 4% = 1.6% | Quiz 1 | `quiz: …` |
| quiz: Mom 10.1% a year, t = 6.18 | Quiz 3 | `quiz: …` |

Numbers taken from the paper (opened with `pdftotext -layout`; not tested, each with its page):
0.5% a month for σ(λ), large next to an average of about 0.5% (p. 290); Eq. (1) (p. 293); squared Sharpe ratio 0.011
for the CRSP value-weighted index, 1964–2001 (p. 294); premium between 0% and 1% gives a square of at most 0.000025
(p. 294); volatility moving with the premium lowers the alpha (p. 296); short windows (pp. 296–297); Eq. 7 (p. 298);
×21 (p. 299); 0.5% a month is the largest σ in Table 1 (p. 295); implied σ(β) about 0.25 and 0.60, 1964–2001 (p. 291);
the simulation argument on within-quarter swings (p. 302); the implied-σ method (p. 303); average conditional
alphas 0.50% and 1.33% a month, quarterly method, NYSE and Amex portfolios 1964–2001 (Table 3, p. 301).

## Summary

What: chapter 23, `src/content/chapters/23-does-the-conditional-capm-explain-anomalies.mdx`, with two widgets and a
numbers test.

- `src/components/plots/shortWindowSample.ts`: the data hook (`useShortWindowData`) and the views the widgets and the
  test share: `quarterBetas` (Dimson-lag quarterly regressions on daily data, at least 40 days, as pinned in TASK-072),
  `rollingView` (monthly `rollingBetas`), `capmAlpha` (monthly unconditional CAPM) and `lambdaNeeded`.
- `RollingBeta`: HML or Mom (`Segmented`), a window `Slider` (12 to 120 months), the rolling line and the 250
  quarterly dots; the readout gives σ of each beta series, the implied σ of true betas and the average s.e.
- `AlphaBound`: for HML and Mom, the actual CAPM alpha, the bound σ(β̂_iq)σ(λ_t) and the average conditional alpha with
  its 95% bar; a `Slider` for σ(λ_t) from 0% to 20% a year (default 6%, the paper's largest value).
- `tests/chapter23-numbers.test.ts`: every number from our data in the prose.

How: all maths goes through `src/lib/finance/shortWindow.ts` and `src/lib/stats/ols.ts`; components only format.
Widgets use `PlotFrame`, `WidgetFrame`, the shared controls, `useTweened`, `client:visible` and CSS variables, with
`aria-label`s that state the values. No library or shared code changed.

Deviations and mismatches to report:

- Data mismatch (as the spec expects): the curriculum lists `ff25-size-bm-monthly`, `ff3-monthly` and `mom-monthly`. The
  chapter uses `ff3-monthly`, `mom-monthly`, `ff3-daily` and `mom-daily`. The within-quarter regressions need daily
  returns. The chapter does not use `ff25-size-bm-monthly`: its test assets are HML and Mom, the value and momentum
  strategies of the curriculum's Goals.
- Notation: the curriculum's Key math writes $\beta_{it}$, $\beta_{iq}$, $\alpha_{iq}$ and $R^e_{mt}$. The chapter
  follows the style guide's comma subscripts and writes $\beta_{i,t}$, $\beta_{i,q}$, $\alpha_{i,q}$ and
  $R^e_{M,t}$ (capital M, as the paper).
- Candidate symbols for the `docs/STYLE_GUIDE.md` §3 table (not added; the spec does not ask for it):
  $\alpha^u_i$, $\beta^u_i$ (unconditional alpha and beta); $\beta_{i,t}$ (conditional beta; the table's
  $\beta_{i,k}$ uses the second subscript for a factor); $\lambda_t$ (conditional market premium);
  $\sigma^2_t$, $\sigma^2_M$ (conditional and unconditional market variance); $\tilde\lambda_t = \lambda_t - \bar\lambda$;
  $\varepsilon_{M,t}$ (market surprise); $\alpha_{i,q}$, $\beta_{i,q}$, $Q$ and $e_q$ (window estimates, number of
  windows, sampling error); $\bar{\hat\alpha}_i$.
- The table reserves $q$ for a significance level. The chapter uses $q$ for a window, as the curriculum's
  $\beta_{iq}$ does, and says so in words where it first appears ("a short window $q$, such as a calendar quarter").
  The table should list this reuse, or the curriculum should pick another letter.
- Chapter 22 is not merged (checked against `origin/main` at the final rebase). The chapter names it by title,
  *Conditional factor models*, without a link, once in the hook; the page header shows "Builds on Ch. 22" from the frontmatter. Once TASK-076 merges, a follow-up can make them links.
  Chapters 19 to 21 are not mentioned. Part VI is named only in "Recap & next up".
- The bound in `AlphaBound` uses σ(β̂_iq), as the spec says. The readout also shows the bound with the implied σ of
  true betas, which is smaller.

Verified revision: 41507d8 (chapter, widgets, helper, test), on top of `origin/main` aa35937. Verify ran in this
session on that revision: `npm ci`, `npm test`, `npm run build`, `npm run screenshots -- 23-does-the-conditional`,
`npm run clickthrough -- 23-does-the-conditional`, the section-tag grep, the hex grep and the source/PDF count, with
the results above. GitHub Actions were not used.

Proposed follow-ups: link chapter 22 from chapter 23 once TASK-076 merges; decide the §3 symbols above and the
reuse of $q$.
