# TASK-098 outcome: Chapter 26: GMM for asset pricing models

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exit 0; `npm test`: 56 files, 588 tests passed, exit 0; `npm run build`: "Result (173 files):
  0 errors, 0 warnings", "25 page(s) built", "Complete!", exit 0.
- [x] `npm run screenshots -- 26-gmm-for-asset-pricing-models` and `npm run screenshots -- 03-regression` pass in
  both themes at desktop and phone size, and the images were inspected.
  Evidence: ✓ for dark-desktop, dark-phone, light-desktop and light-phone of both chapters, exit 0. I read element
  crops of every widget in both themes at 1280px and 360px, and tiles of the full chapter-26 pages. Fixes from the
  inspection: two long formulas ($\hat b_1$, $\hat b_2$) scrolled sideways on a phone and now break over two lines;
  the quiz options lost their backslashes (a JavaScript string in `options={[...]}`), now doubled as in the other
  chapters; the tallest CCAPM bar touched the axis title, so `HJDistance` got headroom. Chapter 3's `RegressionLab`
  looks as before: the same three data options, the same readout and caption.
- [x] `npm run clickthrough -- 26-gmm-for-asset-pricing-models` and `npm run clickthrough -- 03-regression` pass and
  report every widget of each chapter.
  Evidence: chapter 26: ✓ "FIRST-STAGE GMM IS A REGRESSION THROUGH THE ORIGIN", 1 action at 1280px and 1 at 360px
  (Reset dragged dots); ✓ "THREE SDFS, ONE YARDSTICK", 5 actions at each width (three models, two weightings).
  Chapter 3: ✓ both "HOW MUCH DOES A STOCK MOVE WITH THE MARKET?" widgets, 7 actions at each width. Exit 0 for both.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` gives Hook (l. 15), Intuition (34), Formalisation (70), Playground (263),
  Check yourself (304), Recap & next up (330).
- [x] No hex colour in the chapter or its widgets.
  Evidence: the Verify grep over the changed `src/components/plots/*.tsx` and the chapter prints "no hex colours".
  `sdfGmmSample.ts` and `regressionSample.ts` hold no colours.
- [x] The widgets use real data: `ff25-size-bm-monthly`, `ff3-monthly` and `fred-cay-quarterly` through `quarterlyPanel`.
  Evidence: both widgets call `useSdfView` (`sdfGmmSample.ts`), which runs `useConditionalData` (the shared
  series-loading hook of `conditionalSample.ts`) and then `quarterlyPanel(data, WINDOWS.full)` and `sdfModelFits`.
  No new `useEffect` loading code. Both captions name the three dataset IDs and the sample, 1963-Q3 to 2026-Q2.
- [x] The outcome holds a voice review and a table of every number in the prose with its test. Evidence: the two
  sections below.
- [x] The prose is 2,878 words, inside 1,500–3,000. Command (the one of chapters 9, 10, 13, 16 and 22):
  `awk 'NR>8' src/content/chapters/26-gmm-for-asset-pricing-models.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The scatter of mean returns on covariances comes before any GMM algebra: "So the model makes one picture: plot each portfolio's mean excess return against its covariance with the market." |
| Data before theory | The hook opens on our data: "The consumption CAPM passes with ease: $J = 13.0$ on 24 degrees of freedom, a p-value of 0.97." |
| One idea per section | Intuition carries one idea, stated in the Callout: "An SDF model says that mean excess returns are proportional to covariances with the factors." |
| Start with a question the reader has | "The model that passes its test is the model that prices worst." The hook then asks what a GMM estimate measures and which scale can compare models. |
| Write to "you", short sentences, terms defined and linked | "Take a model's SDF $M$ and ask: how far is it from the nearest $M^*$ that prices all $N$ assets exactly?" Links go to Chapters 8, 14, 16, 17 and 18. |
| Give the honest version | "They treat $\bar f$ and $\hat\Sigma_f$ as known, much as the uncorrected two-pass errors treat the betas as known (Chapter 18 corrects those)." |
| Say what the evidence can and cannot show | "The distances have no standard errors here. The gaps of 0.02 and 0.03 between neighbouring models may be noise." And: "A low HJ distance from such a model is not a win." |
| Don't skip steps | First stage = OLS across assets (first-order condition, then the solved form), the step to Chapter 17's $\hat\lambda$ (three lines), $\lambda = \Sigma_f b$ (three steps), the HJ distance as the nearest valid SDF (three steps), and in `<details>` the largest-pricing-error reading and the no-factor case by Sherman–Morrison. |
| Graduate rigour comes in gradually | Part VI is ●●●: full matrix GMM notation, each result followed by a plain reading, e.g. "First-stage GMM is a cross-sectional regression of mean returns on covariances." |
| Papers in our own words | "Nagel (2013) notes that with an identity weighting, the estimate can put almost no weight on the moment for a traded factor's own return, while efficient weighting prices that factor exactly in large samples (NBER WP, p. 21)." No text, figure or table is copied. |

## Numbers in the prose

Every number from our data is recomputed in `tests/chapter26-numbers.test.ts` (7 tests, all pass). Annual values
are quarterly means (or covariances) ×4. Facts from Nagel (2013) and Gospodinov, Kan & Robotti (2019) carry no
numbers.

| Number in the prose | Where | Test |
|---|---|---|
| 25 portfolios, 1963-Q3 to 2026-Q2, 252 quarters | Hook, widget captions | `hook: sample, J tests and first-stage pricing errors` |
| $J$ 13.0 (24 df, p 0.97) CCAPM; 67.7 (22, $1.5 \times 10^{-6}$) FF3; 91.2 (24, $8.9 \times 10^{-10}$) CAPM | Hook | same |
| Mean absolute first-stage pricing error 8.35% CCAPM, 0.99% FF3, 2.09% CAPM | Hook, Playground | same |
| $\hat b = 2.91$ (se 0.87), more than three standard errors from zero; the line through the origin equals first-stage GMM | Intuition, Formalisation | `intuition: the line through the origin is first-stage GMM` |
| ME1-BM1 has the largest covariance; moving it onto the line raises the slope and lowers the mean absolute error | Intuition try-this | same |
| Covariances 0.023 to 0.047 a year; means 5.3% to 14.5% a year; slope with a constant −0.36 | Intuition | same |
| $\hat\lambda = 8.4\%$ a year (se 2.5%), $= \hat\Sigma_f\hat b_1$; market mean 7.5% a year | Formalisation | `formalisation: λ = Σ_f b, the market mean, and the SMB split` |
| FF3: SMB $\hat b = -0.38$ (se 1.35), $\hat\lambda = 1.93\%$ (se 1.34%), neither significant at 5%; split 2.74%, −0.43%, −0.38%; market $\hat b = 3.38$ (se 1.10) | Formalisation | same |
| CCAPM first-stage $\hat b = 331$ (se 181); $\sigma(\Delta c) = 0.93\%$ a quarter; $\sigma(M) \approx 3.1$; second-stage $\hat b = 177$ (se 66); $1/177 \approx 0.57$ points | Formalisation | `formalisation: the consumption CAPM loadings and the noise of its SDF` |
| Highest Sharpe ratio 0.64 a quarter (1.28 a year); $\delta_{\text{HJ}}$ 0.540 (no factors), 0.513 CAPM, 0.488 FF3, 0.470 CCAPM | Formalisation, Recap | `formalisation: HJ distances and the no-factor benchmark`, `recap: the four distances` |
| Small growth (ME1-BM1) first-stage error −8.24% CAPM, −4.37% FF3; every CCAPM bar positive | Playground try-this | `playground: bars, weightings and the gaps between models` |
| HJ weighting raises every model's mean absolute error; FF3 0.99% → 2.17% | Playground try-this too | same |
| Models within 0.05; best 0.07 below no factors; gaps 0.03 and 0.02; 63 years | Playground limits | same |

## Summary

**What.** `src/content/chapters/26-gmm-for-asset-pricing-models.mdx` with two widgets:
- `RegressionLab` gets the optional `initialSource="gmm"` (the `Source` union in `regressionSample.ts`): the 25
  quarterly portfolios' $\mathbb{E}_T[R^e\tilde f]$ (market) across, mean excess returns up, the OLS line through
  the origin, pricing errors as residual lines, draggable dots. The readout gives $\hat b$, $\hat\lambda =
  \hat\Sigma_f\hat b$, their GMM standard errors from `linearSdfGmm` (hidden once a dot is dragged) and the mean
  absolute error. No new prop: the source drops the intercept. The default export now picks one of two thin
  loaders (`MarketLab`, `GmmLab`), so chapter 3 never loads the quarterly data and the hooks are not conditional.
- `HJDistance`: the 25 pricing errors as bars for CAPM, CCAPM and FF3, with `Segmented` model and weighting
  (first stage, HJ) controls. The readout has the chosen $\hat b$, the mean absolute error and a table of every
  model's $\delta_{\text{HJ}}$, second-stage $J$ (df) and p-value, plus the no-factor benchmark. A ▸ marker and bold
  text mark the chosen model, so colour is not the only cue. The bars do not animate: the change is a jump
  between estimates, not a path.
- `sdfGmmSample.ts`: `useSdfView` (on `useConditionalData`) and `sdfView` (on `quarterlyPanel`, `sdfModelFits` and
  `hjDistance` with no factors). The numbers test calls the same `sdfView`.

**Deviations and mismatches.**
- Data: the curriculum lists `fred-consumption-quarterly`, which starts in 2007. As the spec says, consumption
  growth comes from `fred-cay-quarterly` through `quarterlyPanel`, as in Chapter 22.
- Notation: the curriculum writes $m_{t+1} = 1 - b'(f_{t+1} - \mathbb{E}f)$; the chapter writes $M$ (§3) and
  demeans in sample, $\tilde f = f - \bar f$, as §3's Part VI table and the library do. The curriculum and §3 write
  $\delta_{HJ} = \sqrt{g_T'\mathbb{E}_T[RR']^{-1}g_T}$; with excess returns as the payoffs the chapter writes
  $\mathbb{E}_T[R^eR^{e\prime}]$ and says why. §3 lists $\delta_{\text{HJ}}$ without the minimum over $b$; the
  chapter includes it.
- Chapters 24 and 25 are not merged on `origin/main` (`b89b464`). The chapter names them by title,
  *The generalized method of moments* and *Efficient and feasible GMM*, without links, and repeats the three GMM
  facts it needs, so it reads on its own. Chapter 27 is named by title only in "Recap & next up".
- Symbol candidates for the §3 Part VI table (used here, not yet listed): $M^*$ (the nearest SDF that prices the
  test assets), $w^*$ (the weights $\mathbb{E}_T[R^eR^{e\prime}]^{-1}g_T(b)$ of the gap $M - M^*$), $\hat b_1$ and
  $\hat b_2$ (first- and second-stage estimates) and $\Delta\tilde c$ (demeaned consumption growth).
- §2 of the style guide mentions a `<Details>` component; none exists, and the chapter uses a plain `<details>`
  block, as Chapters 4, 6 and 7 do.

**Sources.** Nagel (2013, NBER WP 18554): printed p. 13, eq. (16) and fn. 5 (the linearised SDF normalised to
mean 1; any multiple prices the same, but misspecification tests depend on the normalisation); printed p. 21
(identity weighting can nearly ignore a traded factor's own moment, which efficient weighting enforces).
Gospodinov, Kan & Robotti (2019), manuscript pp. 5–6 (models with weakly correlated factors fit almost perfectly
and pass the CU-GMM and ML specification tests; HJ-distance tests point to misspecification of every model).
Cochrane (2005), Ch. 13 is under further reading only; nothing is taken from it or from Hansen & Jagannathan (1997).
The derivations (first stage = OLS across assets, $\lambda = \Sigma_f b$, the HJ distance as the nearest valid SDF,
its largest-pricing-error reading, the no-factor case) are our own.

**Verified revision.** The commit that adds this outcome, on `origin/main` `b89b464`: every Verify command above.

**Follow-ups.** None required. The CCAPM's huge $\hat b$ with tiny covariances is the weak-factor pattern that
Chapter 27 takes up.
