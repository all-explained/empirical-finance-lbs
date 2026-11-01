# TASK-118 outcome: Chapter 33, characteristic-based mimicking portfolios

## Acceptance

Verified revision: `c9d4093` (the chapter commit, rebased on `origin/main` `c7662ef`). The outcome commit adds only
this file.

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exit 0; `npm test` exit 0, `Test Files 70 passed (70)`, `Tests 743 passed (743)`, including
  `tests/notation.test.ts` and the new `tests/chapter33-numbers.test.ts` (6 tests); `npm run build` exit 0,
  `Result (209 files): 0 errors, 0 warnings, 1 hint`, `32 page(s) built`. The hint is the unused `Matrix` import in
  `src/lib/finance/news.ts`, outside this task and already reported as #88.
- [x] `npm run screenshots -- 33-characteristic-based-mimicking-portfolios` and `npm run screenshots -- 19-size-and-value`
  pass in both themes at desktop and phone size, and I inspected the images.
  Evidence: both exit 0 with `✓` for `dark-desktop`, `dark-phone`, `light-desktop` and `light-phone` of each chapter.
  I read the chapter 33 images in both themes at both sizes, and chapter 19's `SortGrid` (dark desktop). The
  inspection found three problems, now fixed. The two 2020 quarters flattened the consumption plot, so the plot now
  cuts at ±4% and the caption names the cut quarters. The line key overlapped the y-axis label. On the phone, readout
  dates broke at their hyphens. A Playwright shot of split mode (split at 1975-Q1, desktop dark and 360px light)
  and of the regression weights (360px light) showed no overlap after the fixes.
- [x] `npm run clickthrough -- 33-characteristic-based-mimicking-portfolios` and `npm run clickthrough -- 19-size-and-value`
  pass and report every widget of each chapter.
  Evidence: both exit 0. Chapter 33: `TWENTY-FIVE PORTFOLIOS SORTED ON SIZE AND VALUE · 7 actions at 1280px, 7 actions
  at 360px` (Colour by: Mean excess return, Alpha, Weights; Characteristic: Size, Book-to-market; Method: Sort,
  Regression) and `A TRADED PORTFOLIO THAT TRACKS CONSUMPTION GROWTH · 7 actions at 1280px, 7 actions at 360px` (Base
  assets: 25 portfolios, FF3 factors; Weights from: In sample, Split sample; slider Split date at its minimum,
  maximum and middle). Chapter 19: `TWENTY-FIVE PORTFOLIOS SORTED ON SIZE AND VALUE · 5 actions` (Mean excess return,
  Alpha, CAPM, FF3, FF5: the same five controls as before this task) and `BUILD SMB AND HML FROM SIX PORTFOLIOS · 2
  actions`.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` prints lines 15 Hook, 32 Intuition, 61 Formalisation, 175 Playground,
  222 Check yourself, 248 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the spec's `git diff --name-only origin/main -- 'src/components/plots/*.tsx' … | xargs grep -nE
  '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` prints `no hex colours`.
- [x] The widgets use real data (`ff25-size-bm-monthly`, `ff3-monthly` and the quarterly panel of `quarterlyPanel`),
  and the default views of `SortGrid` are unchanged.
  Evidence: the weights view of `SortGrid` computes `characteristicView` from the `ff3` and `ff25` that
  `useModelData` already loads. `MimickingPortfolio` loads through `useMimickingView`, which is built on
  `useConditionalData` (ff3, ff25, fred-cay-quarterly) and `quarterlyPanel`. `SortGrid` offers "Weights" only when it
  starts at `initialMeasure="weights"`. Chapter 19 keeps the default, and its click-through reports the same five
  controls. The chapter 19 screenshots show the old grid, controls and readout.
- [x] The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table
  of every number in the prose with its test. Evidence: the two sections below.
- [x] The prose is 1,500–3,000 words (give the command).
  Evidence: 2,625 words. Command (the one of chapters 9, 10, 13, 16, 22, 26 and 30):
  `awk 'NR>8' src/content/chapters/33-characteristic-based-mimicking-portfolios.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).
  Evidence: it prints `0` and exits 1.

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition shows the grid of weights ("Now each cell shows a **weight**: the share of capital put in that portfolio, in percent.") before the Formalisation writes $(Z_t'Z_t)^{-1}Z_t'$. |
| Data before theory | The Hook opens on our data: "Over the 758 months from 1963-07 to 2026-08, the monthly slope has a correlation of 0.967 with HML." |
| One idea per section | Each `###` carries one idea: "Every slope is a portfolio return", "The 25 portfolios, worked out", "Why the regression spreads its weights", "A factor that is not a return", "How much of the fit is real?", "What the 25 portfolios hide". |
| A question the reader has | "So how do you hold a portfolio that pays off when a characteristic, or the economy, does?" |
| Write to "you", short sentences, link back | "Switch to "Regression". Now every column has a weight…", with links to Chapters 17, 19 and 26 where their ideas return. |
| The honest version | "Here, the 25 portfolios stand in for firms, and every number above holds only for them." |
| What the evidence can and cannot show | "With a few hundred quarters, one extreme year can change a correlation by this much." Every mean has its $t$-statistic and sample. |
| No skipped steps | $Z'Z$ is worked out in four numbered steps; the smallest-$w'w$ proof and the highest-correlation proof each take four. |
| Graduate rigour, with a plain reading | "So the Fama–MacBeth test on a characteristic asks one plain question: does this portfolio earn a mean return different from zero?" |
| Papers in our own words | "Giglio & Xiu (2021, p. 1955) show that the premium of a mimicking portfolio is biased unless its base assets are well diversified and span all the true risk factors." No text, figure or table is copied. |

## Numbers in the prose

Every number from our data is recomputed in `tests/chapter33-numbers.test.ts` (6 tests, all pass) through
`characteristicView` and `mimickingView` of `src/components/plots/mimickingSample.ts`, which call
`src/lib/finance/mimicking.ts`. Monthly: 1963-07 to 2026-08. Quarterly: 1963-Q3 to 2026-Q2.

| Number in the prose | Where | Test |
|---|---|---|
| 758 months, 1963-07 to 2026-08, 25 portfolios | Hook | `hook: the monthly sample…` |
| corr(B/M slope portfolio, HML) 0.967 | Hook, Intuition, Recap | `hook: …` and `intuition: …` |
| Scores from −2 to +2; small stocks and value stocks score +2 | Intuition, Formalisation | `intuition: …` |
| Sort weights +5.0% and −5.0%, 15 empty cells | Intuition (Try this) | `intuition: …` |
| Regression weights −4.0, −2.0, 0, +2.0, +4.0% (−0.04 … 0.04 in the Formalisation and the quiz) | Intuition, Formalisation, Check yourself | `intuition: …` and `formalisation: …` (each weight equals $z^{\text{BM}}_i/50$) |
| Exposures 1.00 and 0.00 | Intuition | `intuition: …` |
| Sort 1.23% a year, $t = 3.17$; regression 1.11%, $t = 2.94$ | Intuition, Formalisation, Recap | `intuition: …` |
| corr with HML 0.963 (sort) and 0.967 (regression) | Intuition, Recap | `intuition: …` |
| Size: both 0.49% a year, $t$ 1.05 and 1.07 | Intuition | `intuition: …` |
| $Z'Z = \operatorname{diag}(25, 50, 50)$; $5(4+1+0+1+4) = 50$ | Formalisation | `formalisation: …` |
| $w^{\text{sort}} = \pm 1/20$, from $(1/5)/4$; exposure check $= 1$ | Formalisation, Check yourself | `formalisation: …` |
| $w'w$ 0.020 (regression) and 0.025 (sort) | Formalisation, Check yourself | `formalisation: …` |
| 252 quarters, 1963-Q3 to 2026-Q2 | Playground | `playground: the quarterly sample…` |
| 26 numbers (25 portfolios), 4 numbers (FF3) | Playground, Check yourself | `playground: the quarterly sample…` |
| In-sample correlation 0.40 (25 portfolios), 0.09 (FF3) | Playground | `playground: the quarterly sample…` |
| $\sqrt{25/251} = 0.32$, $\sqrt{25/125} = 0.45$ | Playground, Check yourself | `playground: noise benchmarks…` |
| Split 1995-Q1: 126 and 126 quarters; 0.55 then −0.15 | Playground, Check yourself, Recap | `playground: noise benchmarks…` |
| Split 1975-Q1: 46 quarters; 0.79 then −0.05 | Playground | `playground: noise benchmarks…` |
| FF3 split 1995-Q1: 0.19 then −0.01 | Playground | `playground: noise benchmarks…` |
| $\Delta c$ −10.1% in 2020-Q2, +7.4% in 2020-Q3; the ±4% cut touches only these | Playground | `playground: the two 2020 quarters…` |
| Without 2020: 0.39 and −0.07 (25 portfolios), 0.16 and 0.13 (FF3) | Playground | `playground: the two 2020 quarters…` |

The two facts taken from readings are cited with their pages and are not from our data: Fama & French (1992) used
individual stocks because grouping blurs precise characteristics (p. 430), with 2,267 stocks a month on average
(p. 439).

## Summary

**What.** `src/content/chapters/33-characteristic-based-mimicking-portfolios.mdx` (six template sections, 2,625
words, three `Quiz` questions). The widget `MimickingPortfolio`. A weights view of `SortGrid`. The helpers
`src/components/plots/mimickingSample.ts`, and `tests/chapter33-numbers.test.ts`. Four symbols go into the Part VIII
block of `docs/STYLE_GUIDE.md` §3.

**How.**
- `characteristicView` builds the B/M and size portfolios two ways: `sortWeights` (top score minus bottom, over 4)
  and the score's row of `slopeWeights`. It reports each portfolio's weights, exposures, $w'w$, mean ×12,
  $t$-statistic and correlation with SMB or HML.
- `SCORES` is `ff25Characteristics()` with the size column negated. Small stocks then score +2, and the size
  portfolios are small minus big, as SMB is.
- `mimickingView` runs `mimickingPortfolio` on `quarterlyPanel`'s `dc`, on the 25 portfolios or the three FF3
  factors. It does this over all quarters and over the quarters before the split, and it takes the later-quarter
  correlation from the library's `outOfSample`.
- Readings opened with `pdftotext -layout`: Fama & French (1992, pp. 430, 438–439); Kelly, Pruitt & Su (NBER WP
  24540, printed pp. 14–15); Giglio & Xiu (2021, pp. 1954–1955).

**Notation (curriculum Key math → §3).**
- $\hat\gamma_t$ → $\hat\xi_{t+1}$, because $\gamma$ is risk aversion. It is dated $t+1$, like the return.
- $c$ (intercept) → $a$, because $c_t$ is log consumption, the series being projected.
- $e_t$ → $\varepsilon_t$, because $e$ is the 2×3 residual of Chapter 19.
- $w$ is kept.
- New rows: $z^{\text{size}}_i$ and $z^{\text{BM}}_i$ (the scores), and $w^{\text{sort}}$ and $w^{\text{reg}}$
  (the two weightings). Each row gives the clash it avoids.

**Deviations and mismatches.**
- Data: the curriculum's data line for Chapter 33 names `fred-consumption-quarterly`. That series starts in 2007-Q1.
  The chapter uses the consumption growth `dc` of `quarterlyPanel` (from `fred-cay-quarterly`), as Chapters 22 and
  26 do.
- Readings: the curriculum cites Kelly, Pruitt & Su (2018). The chapter cites the 2019 *Journal of Financial
  Economics* article and names working-paper pages ("NBER WP, p. 15"), because only the 2018 NBER working paper is in
  `source/papers/`. The style guide's Part VIII preamble still says "Kelly, Pruitt & Su (2018)". I left it alone,
  because it is outside this chapter's rows.
- Chapter 32 is not merged (no `32-*.mdx` on `origin/main`). The chapter names it by title, *Characteristics are
  covariances: IPCA*, without a link.
- Loading: the spec asks for one hook in `mimickingSample.ts`. `useMimickingView` is that hook, for the quarterly
  panel, built on `useConditionalData`. The `SortGrid` weights view takes its monthly data from the `useModelData`
  call that `SortGrid` already makes, so it adds no loading code and no second fetch.
- Plot cut: `MimickingPortfolio` cuts its lines at ±4% a quarter, so 2020-Q2 and 2020-Q3 do not flatten the other
  250 quarters. The caption lists every value off the scale. The prose reports how much 2020 moves the correlations.

**Follow-ups.** None needed for this chapter. When Chapter 32 merges, the Part VIII read-through (TASK-120) can turn
the Chapter 32 title in "What the 25 portfolios hide" into a link.
