# TASK-064 outcome: Chapter 17: Cross-sectional regressions and Fama–MacBeth

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: the chain `npm ci && npm test && npm run build && npm run screenshots -- 17-cross-sectional &&
  npm run screenshots -- 07-mean-variance && npm run clickthrough -- 17-cross-sectional` exited 0 on the rebased
  branch. `npm test` printed `Test Files  40 passed (40)` and `Tests  417 passed (417)`. `npm run build` printed
  `- 0 errors`, `- 0 warnings` and `17 page(s) built`.
- [x] `npm run screenshots -- 17-cross-sectional` passes in both themes at desktop and phone size, and I inspected
  the images. `SMLPlot` changed, so `npm run screenshots -- 07-mean-variance` passes too.
  Evidence: both runs printed four `✓` lines (dark/light × desktop/phone) and no problem. I also took element
  screenshots of each widget in both themes at 1280px and 360px with Playwright (reduced motion, no console
  errors), the movie at 1987-10 (CAPM) and at 2026-08 (FF3), and the chapter 7 `SMLPlot`. The chapter 7 widget
  looks as before: same title, CAPM line, dashed fitted line, readout "13.9% − 4.3% × β". Fixes made after
  inspection: the month label overlapped the y-axis title (moved to the top right), and the readout wrapped badly
  at 360px (units moved into the labels).
- [x] `npm run clickthrough -- 17-cross-sectional` passes and reports every widget of the chapter.
  Evidence: `✓ … FAMA–MACBETH, ONE MONTH AT A TIME · 8 actions at 1280px, 8 actions at 360px · segmented "Model"
  option "CAPM"; segmented "Model" option "Fama–French 3"; slider "Month"; button "◀ Step back"; button "▶ Play";
  button "Step ▶"` and `✓ … DOES THE MODEL FIT AVERAGE RETURNS? · 29 actions at 1280px, 29 actions at 360px ·
  segmented "Model" …; segmented "Sample" …; select "Ringed portfolio"`. The chapter has these two widgets.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` prints Hook (line 15), Intuition (33), Formalisation (64), Playground (249),
  Check yourself (267), Recap & next up (293), in that order.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the spec's `git diff --name-only origin/main -- 'src/components/plots/*.tsx' <chapter> | xargs grep -nE
  '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` prints `no hex colours`.
- [x] The widgets use real data from the chapter's curriculum entry (`ff25-size-bm-monthly`, `ff3-monthly`).
  Evidence: both widgets load the two series through `useFactorData` / `useCapmData` (`loadSeries`) and build the
  panel with `factorPanel`; every estimate comes from `timeSeriesRegressions`, `crossSectionalRegression` and
  `famaMacBeth`. Both captions name the two dataset IDs and the sample period.
- [x] The outcome holds a voice review and a table of every number in the prose with its test (below).
- [x] The prose is 2,733 words, inside 1,500–3,000. Command (the one of chapters 9, 10 and 13):
  `awk 'NR>8' src/content/chapters/17-cross-sectional-regressions-and-fama-macbeth.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The movie comes in Intuition ("Picture one month, say October 1987 …"), before any formula; Formalisation then writes $\hat\lambda_t$ and its average. |
| Data before theory | The hook opens on chapter 7's line through the 25 real portfolios: "the CAPM said the line should rise by 7.2% a year … Its slope was −4.3% a year." |
| One idea per section | Intuition has one idea: "A monthly cross-sectional slope is noisy because it mostly carries that month's market news. Its time-series average estimates the price of the risk …" |
| Start with a question the reader has | "Is that falling slope a fact about the market, or is it noise? And if it is noise, how large is the noise?" |
| Write to one reader, as "you" | "No single month tells you much about the price of beta." Terms are explained at first use (first pass, second pass, GLS, cross-sectional $R^2$), and chapters 4, 7 and 16 are linked. |
| Give the honest version | "We treat $\hat\beta$ as if it were the true $\beta$ until Chapter 18." |
| Say what the evidence can and cannot show | "A high $R^2$ says the fitted values line up with the means. It does not say the premia are right, and it is not a test." Every estimate gives the sample (July 1963 to August 2026, T = 758), the data and a $t$-statistic. |
| Don't skip steps in derivations | OLS: the derivative $-2\hat\beta'(\bar R^e - \hat\beta\lambda) = 0$, then "Move the terms with $\lambda$ to one side …". Equality: "The first step takes the constant matrix $A$ out of the sum." |
| Graduate rigour comes in gradually | Part IV (●●): matrix algebra ($A = (X'X)^{-1}X'$, $A\hat\Sigma A'$), each step with a plain reading ("each row of $A$ is a set of portfolio weights"). |
| Papers in our own words | "Cochrane (2011, p. 1061) makes a broader point. Sorting stocks into portfolios and running a cross-sectional regression are two ways of doing the same thing …" |

## Numbers in the prose

All tests are in `tests/chapter17-numbers.test.ts` and use the committed `ff3-monthly` and `ff25-size-bm-monthly`
through the library and the widgets' sample helpers. Sample July 1963 to August 2026, T = 758, unless noted. "% a
year" is a monthly mean ×12.

| Number in the prose | Test |
|---|---|
| July 1963 to August 2026, 758 months | `hook: the sample, …` |
| CAPM slope 7.2% a year; chapter 7 fitted slope −4.3% a year | `hook: …` (`smlView`) |
| Fama–MacBeth CAPM slope −4.3% a year, s.e. 4.8, $t$ = −0.91 | `hook: …` |
| Fama & French (1992, p. 438): 0.15% a month, 0.46 s.e. from zero, 1963 to 1990 | From the paper, not our data (p. 438 of the opened PDF) |
| October 1987: market −23.2%, slope −27.7% | `intuition: October 1987 …` |
| Monthly slope s.d. 10.9% a month; negative in 52% of months | `intuition: …` |
| Running mean ends at −4.3% a year, band ±9.3%; 7.2% outside the band | `intuition: …` |
| FF3 market slope −6.6% a year, $t$ = −1.80 | `intuition: …` |
| CAPM no constant: OLS 8.2%, GLS 7.5%, market average 7.2% | `formalisation: OLS and GLS …` |
| FF3 OLS 6.7%, 1.7%, 4.2%; GLS 7.5%, 1.8%, 3.6%; factor averages 7.2%, 1.8%, 3.5% | `formalisation: OLS and GLS …` |
| "For the market and HML, GLS lands closer" | `formalisation: OLS and GLS …` (inequalities) |
| $\hat\Sigma_\varepsilon^{-1}$ gives the same GLS estimate as $\hat\Sigma^{-1}$; $\bar R^e_i = \hat a_i + \hat\beta_i'\bar f$ | `formalisation: OLS and GLS …` |
| Table: CAPM −4.3% ($t$ −0.91), constant 13.9% ($t$ 3.13); FF3 −6.6% (−1.80), 1.4% (1.04), 3.9% (2.95), constant 13.9% (4.50) | `formalisation: the Fama–MacBeth table …` |
| "Only HML has a premium more than two standard errors from zero" | `formalisation: the Fama–MacBeth table …` |
| Fama–MacBeth and two-pass differ by less than $10^{-14}$ | `formalisation: the Fama–MacBeth table …` |
| $R^2$: FF3 with constant 0.66; FF3 no constant 0.48; FF3 GLS 0.36; CAPM no constant −0.59 | `formalisation: the cross-sectional R²` |
| CAPM fitted 7.1% to 11.7%, actual 4.0% to 13.4% | `playground: fitted against actual` |
| FF3 small growth: fitted 8.8%, actual 4.0%, error −4.8%, the largest | `playground: …` |
| FF3 1926–2026 $R^2$ 0.30 | `playground: …` |
| Quiz: 5%/√600 ≈ 0.20%, $t$ ≈ 2.45 | `quiz: the standard error of an average slope` |

## Summary

**What.** `src/content/chapters/17-cross-sectional-regressions-and-fama-macbeth.mdx` (part 4, chapter 17, difficulty
2, prerequisites [16]) with three quizzes; the widget `FamaMacBethMovie`; one optional prop `fitted` on `SMLPlot`;
the helper `famaMacBethSample.ts` (first pass + `famaMacBeth`, and the two-pass regression, both only through the
library); and `tests/chapter17-numbers.test.ts`.

**How.**
- `FamaMacBethMovie`: top panel, the month's 25 excess returns against full-sample market betas, the month's fitted
  line (CAPM) or fitted values (FF3, rings) from `famaMacBeth`, and residuals. Bottom panel, the running mean of the
  market slope (×12) with a ±1.96 s.e. band and the market's average as a dashed line. Play/pause and step use the
  shared `Button`, the month uses `Slider`, the model uses `Segmented`. One `useTweened` value (the month) drives
  the frame, so dots and line slide between months. Under `prefers-reduced-motion` the movie does not autoplay and
  `useTweened` jumps. The running band calls `famaMacBeth` on each prefix of the sample (O(T²); the whole chapter 17
  test file, both movies included, runs in under 0.3 s; marked with a `ponytail:` comment).
- `SMLPlot fitted`: actual against fitted mean excess returns $\hat\beta_i'\hat\lambda$ from
  `crossSectionalRegression` (OLS, no constant), the 45-degree line and the pricing errors, with Model, Sample and
  Ringed-portfolio controls. The default path is the old component, renamed `BetaPlot`, unchanged.

**Deviations and notes.**
- Chapter 16 merged while I worked (#49). I rebased, kept main's `factorTestSample.ts` unchanged, used its
  `useFactorData` hook in the movie, and linked chapter 16. `SMLPlot` keeps its own `useCapmData`, the same loader.
- `SMLPlot` reuse, not a new widget: the fitted view shares the frame, dots, ring, pricing-error segments, sample
  control, portfolio picker and loader. It is a separate inner component (`FittedPlot`) selected by the prop, so the
  chapter 7 path has no branches.
- Cochrane2011.pdf is the published *Journal of Finance* version (pages 1047 on), not the NBER working paper the
  spec names. I cite its printed pages (1061, 1062).
- Fama & MacBeth (1973) is not opened. The chapter only says that Fama & French (1992, p. 430) use its approach,
  and lists it under further reading. Cochrane (2005), Ch. 12, is listed only.
- The movie's betas are full-sample betas, as in the library's `famaMacBeth` (fixed betas). The chapter says so.

**Curriculum and style-guide mismatches.**
- Curriculum Key math writes "GLS weighting by $\Sigma^{-1}$". The chapter follows it with $\Sigma$ the return
  covariance (as §3 defines $\Sigma$) and shows that $\Sigma_\varepsilon^{-1}$ gives the same estimate in sample.
- Curriculum Key math writes the monthly error as $\alpha_{it}$. The chapter uses $\alpha_{i,t}$ (§3 style).
- Symbol candidates for §3 (not added, as the spec says): $\lambda_0$ and $\lambda_{0t}$ (zero-beta rate,
  constant of the cross-sectional regression), $\hat\lambda_t$ (monthly Fama–MacBeth slope), the cross-sectional
  $R^2$, $a_i$ (time-series intercept, when $\alpha$ names the cross-sectional pricing error; the chapter says so
  in words), $\bar f$ (sample mean of the factors), and the local matrices $X$, $A$, $W$.

**Verified revision.** The commit that adds this file; Verify ran on the rebased tree with only this outcome file
uncommitted.

**Follow-ups.** None needed. Chapter 18 can reuse `famaMacBethSample.ts` and the movie's betas.
