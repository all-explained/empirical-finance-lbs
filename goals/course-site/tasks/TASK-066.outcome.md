# TASK-066 outcome: Orchestrator reads Part IV and signs it off

I read chapters 16, 17 and 18 on `main` at `f015b61`. I read the MDX source, and I looked at every widget in a
browser in both themes at 1280px and 360px. I changed no chapter, widget, library or doc.

## Acceptance

- [x] `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exited 0. `npm test` printed `Test Files  41 passed (41)` and `Tests  424 passed (424)`.
  `npm run build` printed `- 0 errors`, `- 0 warnings`, `- 1 hint`, then `18 page(s) built` and `Complete!`.
  The hint is the unused `Matrix` import in `src/lib/finance/news.ts` (Part II, not Part IV).
- [x] `npm run screenshots` and `npm run clickthrough` pass for the three chapters.
  Evidence: each screenshots run printed four `✓` lines (dark and light, desktop and phone) for
  `16-time-series-tests-and-grs`, `17-cross-sectional-regressions-and-fama-macbeth` and
  `18-errors-in-variables-and-shanken`. Clickthrough printed `✓` for all widget instances: chapter 16 three
  (6 actions at 1280px and 360px each), chapter 17 two (8 and 29 actions), chapter 18 two (7 actions each).
- [x] The outcome holds the four judgements and a `## Sign-off` section.
  Evidence: the sections below.
- [x] `git diff --name-only origin/main` lists only this task's outcome file.
  Evidence: it prints `goals/course-site/tasks/TASK-066.outcome.md` and nothing else.

## 1. Does the voice work for a reader who starts from zero?

Mostly yes. The three chapters follow the template and `docs/STYLE_GUIDE.md` §1.

- Each hook starts from data the reader has met in Chapter 7: the 25 portfolios, small growth at −6.3% a year,
  small value at +5.7%. Each ends with a real question ("How can a model that halves the alphas be rejected almost as
  firmly?", "Is the falling line real?", "when do estimated betas make the standard errors wrong?").
- The picture comes before the algebra in all three. A new term is defined in bold where it first appears:
  **residual**, **naive**, **corrected**, **conditional homoskedasticity**, **attenuation**,
  **cross-sectional $R^2$**.
- Derivations show their steps (four steps for $\operatorname{Var}(\hat\alpha_i)$, four for the Sharpe identity, five
  for the Shanken variance). Results taken from a paper are marked ("We state the exact result without proof").
- Each chapter says what a result cannot show: a GRS rejection with large $T$ may come from tiny alphas, a high
  cross-sectional $R^2$ is not a test, and the Shanken correction does not fix attenuation.

Three places lose a newcomer:

- Chapters 16, 17 and 18 use FF3, SMB and HML, and none of them says what SMB and HML are. Chapter 7 does not
  either. Chapter 16 says "size and value factors" once and goes on.
- The hook of Chapter 18 names the data files, "on ff3-monthly and ff25-size-bm-monthly". Those are internal
  dataset IDs. A newcomer needs "Kenneth French's monthly data".
- Chapter 18 is the densest page of the course so far: five derivation steps with matrices, then a first-order
  argument. It reads well with the widget and the Callout, so I list no change, but later Parts should not go further.

## 2. Does each widget teach what its caption says?

I used every control with reduced motion on and read the readouts. Every number in the "Try this" text matched
its readout.

- `AlphaBars` (16, Intuition and Playground). Yes. CAPM to FF3 moves small growth from −6.28% to −5.58% and its
  bar half-width from 4.18% to 2.16%. The default readout is `GRS 4.20 (5% critical value 1.52)`, `10 of 25`,
  `2.36% a year`. With "Sample starts" at 2015-01 it reads `GRS 1.52 (5% critical value 1.60)`, `p = 0.073`,
  `0 of 25`: bigger alphas, no rejection. The caption and the prose say the same.
- `GRSGeometry` (16, Formalisation). Yes. The readout shows the identity as numbers:
  `0.165 − 0.036 = 0.129` and `GRS = 730/25 × 0.129/1.036 = 3.64`. The gap between the two tangent lines
  (0.65 and 1.41 a year for FF3) is the thing the caption names.
- `FamaMacBethMovie` (17, Intuition). Yes. The readout gives the month's slope and intercept, the running mean
  with its band, and the whole-sample `−4.3% (4.8%, −0.91)`. Dragging to 1987-10 shows the steep negative slope the
  prose describes. The month's slope is monthly and the means are annual; every row says which.
- `SMLPlot` fitted mode (17, Playground). Yes. CAPM without a constant reads `R² −0.59`, FF3 reads `0.48`, and
  1926–2026 reads `0.30`. Ringing ME1-BM1 shows the largest pricing error.
- `ShankenCorrection` (18, Intuition at Sharpe 5 and Playground at 0.4). Yes. At 5 it reads `c = 2.083`,
  naive `83.5%`, corrected `93.5%`, average $\hat\lambda$ `5.85%`. At 0.4 it reads `c = 0.013` and `97.0%` for
  both. The real-data block reads `1.970%` and `1.971%`, `c = 0.0386`. Cutting $T$ to 120 shows the attenuation
  the prose describes. The Playground reuses the same widget with another start value, which fits the template.

At 360px no control or readout is cut off, and no page scrolls sideways. The widgets look the same in both themes.
In my element shots the sticky site header covers the top of a widget, which comes from the way I scrolled, not from the site.

## 3. One data helper and one notation?

**Data helper: yes.** `AlphaBars`, `GRSGeometry`, `FamaMacBethMovie` and `ShankenCorrection` import
`useFactorData` from `src/components/plots/factorTestSample.ts`. That is a re-export of `useCapmData`, so there is one
loader (`loadSeries` for `ff3-monthly` and `ff25-size-bm-monthly`). No chapter has its own fetch code. All five
widgets build their panel with `factorPanel`. Two small points, neither is duplicate loading:

- `SMLPlot.tsx` (lines 9, 37 and 147) imports `useCapmData` straight from `capmSample.ts`, while the others use the
  `useFactorData` alias. It is the same function.
- `shankenSample.ts` writes the type `{ ff3: Series<'ff3-monthly'>; ff25: Series<'ff25-size-bm-monthly'> }` inline, and
  `factorTestSample.ts` has the same type as an unexported `Data`.

**Notation: one symbol is used two ways, and the guide is silent on two others.**

- $c$. In Chapter 18, $c = \lambda'\Sigma_f^{-1}\lambda$ is the Shanken factor. `docs/STYLE_GUIDE.md` line 107 reserves
  "$c$ or $g$" for slopes on characteristics, and line 106 uses $c_t$ for log consumption. The Shanken $c$ is in no table.
- $a_i$. Chapters 17 and 18 name the time-series intercept $a_i$ and keep $\alpha$ for the cross-sectional pricing
  error. Chapter 17 says so in one sentence, so the reader is not lost. But Chapter 16 calls the same intercept
  $\alpha_i$, and the guide (line 116) keeps $a$, $b$ for predictive regressions. $a_i$ is in no table.
- The same quantity has two names. Chapter 16 writes $SR^2_f$ for the squared Sharpe ratio of the factors, and
  Chapter 18 writes $c$ for the same object when the factors are traded. Chapter 18 links to Chapter 7, not to Chapter 16.
- The three chapters give two different Sharpe ratios for the same FF3 factors. Chapter 16 says 0.65 a year
  ($SR^2_f = 0.036$ a month, from sample means). Chapter 18 says 0.68 a year ($c = 0.0386$, from the second-pass
  premia $\hat\lambda$). Both are right, but nothing tells the reader why they differ.
- No other symbol is used in two ways. $\hat\beta$, $\lambda$, $\lambda_{0t}$, $\Sigma_\varepsilon$, $\Sigma_f$, $T$, $N$
  and $K$ keep one meaning in all three chapters. Chapter 16 states that its covariances divide by $T$.

## 4. Does Part IV link the CAPM of Chapter 7 to the factor models of Part V?

Yes, and the sentences about other chapters are true. I checked each against the chapter files and `src/data/curriculum.ts`.

- Chapter 7 ends by promising the test (16), the cross-sectional line and its errors (17, 18) and the meaning of size
  and value (19). Chapter 16 opens on Chapter 7's 25 portfolios, and its numbers (−6.3%, −2.94, +5.7%, 3.17)
  match Chapter 7's. Chapter 17 opens on Chapter 7's fitted slope (−4.3% against 7.2%), and both numbers match.
  Chapter 18 reuses the Chapter 7 tangency result to explain $c$.
- Every "Chapter 3", "Chapter 4", "Chapter 7", "Chapter 16" and "Chapter 17" link points to a chapter that exists and
  says what the sentence says. The "later Part on GMM" is Part VI in the curriculum.
- The ending of Chapter 18 ("Part V turns … to which factors to test, starting with the size and value factors")
  and the sentence in Chapter 7 about Chapter 19 match the curriculum (Part V, Chapter 19, "Size and value"). Chapter 19
  is not yet on the built site (TASK-073 is pending), so today neither sentence has a page to go to. Neither is a
  link, so nothing is broken. This closes when TASK-073 merges.
- The weak link is the reader's first meeting with FF3. Part IV is where it first appears, but it comes with no
  definition and no pointer to Part V (see judgement 1). Change 2 fixes that.

## Sign-off

Part IV needs five small changes before the next Parts copy its pattern. Each is prose or doc only; the maths and widgets are right.

1. **Chapter 16, `src/content/chapters/16-time-series-tests-and-grs.mdx`.** Define SMB and HML where FF3 first
   appears (line 27). Add one sentence: SMB is the return of small stocks minus big stocks, HML the return of
   high book-to-market minus low, and Chapter 19 builds both. Repeat the pointer in the Chapter 17 sentence that
   introduces FF3 (`17-cross-sectional-regressions-and-fama-macbeth.mdx`, line 84).
2. **Chapter 18, `src/content/chapters/18-errors-in-variables-and-shanken.mdx`, and `docs/STYLE_GUIDE.md`.**
   Remove the clash on $c$. Rename the Shanken factor (for example to $\kappa$) in the chapter, in the readout
   label of `src/components/plots/ShankenCorrection.tsx` and in its test text, or keep $c$ and rewrite
   STYLE_GUIDE lines 106–107 to give characteristic slopes a different letter. Either way, add the Shanken factor
   and the time-series intercept $a_i$ to the notation tables in the same PR.
3. **Chapter 18, `18-errors-in-variables-and-shanken.mdx`, section "When the correction matters".** After
   "a monthly Sharpe ratio of 0.196, or 0.68 a year", add one sentence: Chapter 16 gives 0.65 for the same three
   factors, because it uses their sample means, and here $c$ uses the second-pass premia. In the same section,
   say that for traded factors $c$ is the $SR^2_f$ of Chapter 16.
4. **Chapter 18, `18-errors-in-variables-and-shanken.mdx`, Hook (line 26–27).** Replace "on ff3-monthly and
   ff25-size-bm-monthly" with "on Kenneth French's monthly factors and 25 size–book-to-market portfolios". The
   dataset IDs stay in the widget caption.
5. **`docs/CURRICULUM.md`, Chapter 16 entry (Readings).** It lists "Gibbons, Ross & Shanken (1987)". The chapter
   and its further-reading list cite the 1989 paper. Make the entry say 1989, and check `docs/READINGS.md`
   for the same year.

Optional, no task needed: let `SMLPlot.tsx` import `useFactorData` like the other widgets.
