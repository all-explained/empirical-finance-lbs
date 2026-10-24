# TASK-076 outcome: Chapter 22: Conditional factor models

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exit 0; `npm test`: 48 files, 524 tests passed; `npm run build`: "Result: 0 errors,
  0 warnings, 1 hint" (the hint is an unused import in `src/lib/finance/news.ts`, not in this PR), "Complete!".
- [x] `npm run screenshots -- 22-conditional` passes in both themes at desktop and phone size, and the images were inspected.
  Evidence: ✓ for dark-desktop, dark-phone, light-desktop, light-phone. I read tiles of all four: maths renders,
  both widgets fit at 375px with the controls stacked under the plot, colours follow the theme. One fix came
  from the inspection: the y-axis titles of `ConditionalBeta` overlapped the lines, so the plots got headroom.
- [x] `npm run clickthrough -- 22-conditional` passes and reports every widget of the chapter.
  Evidence: ✓ "A CONDITIONAL CAPM THAT HOLDS EVERY MONTH", 7 actions at 1280px and 7 at 360px (two sliders, the
  New seed button); ✓ "WHICH MODEL FITS THE 25 PORTFOLIOS?", 6 actions at 1280px and 6 at 360px (four models, two samples).
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` gives Hook (l. 15), Intuition (33), Formalisation (66), Playground (185),
  Check yourself (238), Recap & next up (264).
- [x] No hex colour in the chapter or its widgets.
  Evidence: the Verify grep over the chapter, `ConditionalBeta.tsx`, `ScaledFactors.tsx` and `conditionalSample.ts`
  prints "no hex colours".
- [x] The widgets use the chapter's data.
  Evidence: `ScaledFactors` loads `ff3-monthly`, `ff25-size-bm-monthly` and `fred-cay-quarterly` through
  `loadSeries` in `useConditionalData` (`conditionalSample.ts`). `ConditionalBeta` calls `simulateConditionalCapm`
  with `DEFAULT_SEED = 1` and offers a New seed button.
- [x] The outcome holds a voice review and a table of every number in the prose with its test. Evidence: the two sections below.
- [x] The prose is 2,650 words, inside 1,500–3,000. Command (the one of chapters 9, 10, 13 and 16):
  `awk 'NR>8' src/content/chapters/22-conditional-factor-models.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The two-state toy world and the `ConditionalBeta` widget come before the formula: "The missing 1% comes from timing: the stock has its high beta exactly when risk pays the most." |
| Data before theory | The hook opens on the 25 portfolios: "The cross-sectional $R^2$ is 0.07. The model explains almost none of the spread." |
| One idea per section | Intuition carries one idea only, stated in the Callout: "A factor model can hold every period and still leave an alpha on average." |
| Start with a question the reader has | "Why should a model that moves over time fit *average* returns better?" |
| Write to "you", short sentences, terms defined and linked | "Write $\mathbb{E}_t[\cdot]$ for an expectation given what you know at $t$." Links go to Chapters 8, 13, 14, 16 and 17. |
| Give the honest version | "The step from conditional to unconditional is exact only if the coefficients really are linear in $z_t$. And it holds only for the $z_t$ you chose." |
| Say what the evidence can and cannot show | "The $R^2$ in the widget has no standard error. It describes the fit; it does not test the model." The same for the simulation: "Fifty years of data do not reveal it." |
| Don't skip steps | The decomposition (three steps), the unconditional alpha in the simulated world (four steps), the scaled SDF multiplied out, and the managed-portfolio moment are all written out. |
| Graduate rigour comes in gradually | Part V is ●●. The chapter uses expectations, covariances and one Kronecker product, defined in words: "$\otimes$ (the Kronecker product) pairs each return with each entry of $(1, z_t)$." |
| Papers in our own words | "Jagannathan & Wang (1996) give a story for such a stock: in bad times, firms with weak balance sheets and high leverage get riskier, just when the market premium is high (staff report, p. 6)." No text, figure or table is copied. The toy example uses our own numbers, not the paper's. |

## Numbers in the prose

Every number from our data or the simulation is recomputed in `tests/chapter22-numbers.test.ts` (7 tests, all pass).
Annual values are monthly means ×12 (simulation) or quarterly means ×4 (data).

| Number in the prose | Where | Test |
|---|---|---|
| 25 portfolios, 1963-Q3 to 1998-Q3, 141 quarters | Hook, Playground | `hook and playground` |
| $R^2$ 0.07 (CCAPM) and 0.55 (scaled CCAPM) | Hook, Recap | `hook and playground` |
| $R^2$ 0.02 CAPM, 0.07 CCAPM, 0.55 scaled CCAPM, 0.82 FF3 | Playground try-this | `hook and playground` |
| Mean absolute pricing error 2.37%, 1.67%, 0.92% a year | Playground try-this | `hook and playground` |
| 2026-Q2, 252 quarters; $R^2$ 0.01, 0.36, 0.61, 0.69 | Playground try-this too | `playground: the sample to the end` |
| Scaled constant 14.3% a year; actual averages 3.5% to 14.2% | Limits | `limits` |
| $cay$ weights estimated on 1952 to 2026 | Playground, Limits | `limits` (first and last `cayInputs` dates) |
| "25 points and four coefficients" | Limits | `limits` (3 factors + constant) |
| Managed portfolios: 50 assets, CAPM $R^2$ 0.02 to 0.62; plain betas 0.79 to 1.61, managed −0.60 to −0.15 | Limits | `limits` (`managedCapm`) |
| Toy world: 4%, 0.5, 8%, 1.5 → 2%, 12%, average 7%; average beta 1, premium 6%, product 6%, gap 1% | Intuition | `intuition: the two-state toy world` |
| 600 months, fifty years | Intuition, Formalisation, Recap | `intuition: the seeded world` |
| Mean of $\beta_t\lambda_t$ 6.99% = 5.28% + 1.72% | Intuition try-this | `intuition: the seeded world` |
| Beta's move 0: covariance zero, alpha 1.38% → −0.07% | Intuition try-this | `intuition: the seeded world` |
| Beta's move −0.40: covariance −1.72%, alpha −1.51% | Intuition try-this | `intuition: the seeded world` |
| Unconditional alpha 1.38% ± 1.72%, $t$ = 0.80 | Intuition, Formalisation | `intuition: the seeded world` |
| Conditional alpha −0.18% ± 1.50% | Intuition | `intuition: the seeded world` |
| $s_\beta = 0.4$, $s_\lambda = 4.8\%$ a year; covariance 1.92%; population alpha 1.90% | Formalisation | `formalisation` (also checked against a 200,000-month seeded path) |
| About 160 years for $t = 2$ | Formalisation | `formalisation` |
| Quiz: $1.2 \times 5\% + 0.5\% = 6.5\%$ | Check yourself | `quiz` |
| $t$-statistic of 2 | Formalisation | Definition, not a computed number |

Numbers from the readings, each with its page, not recomputed:

| Number | Source |
|---|---|
| 141 quarters, 1963-Q3 to 1998-Q3 | Lettau & Ludvigson (2001, JPE), p. 1255 |
| $R^2$ 0.01 CAPM, 0.80 FF3 | ibid., table 1, p. 1256 |
| $R^2$ 0.16 CCAPM, 0.70 scaled CCAPM | ibid., table 3, p. 1260 |
| Scaled SDF, eq. 2 | ibid., p. 1246 |
| Zero-beta constant | ibid., eq. 4, p. 1247 |
| $R^2$ is not a formal test; consumption excludes shoes and clothing | ibid., p. 1254 |
| $cay$ chosen because it forecasts excess returns | ibid., p. 1243 and p. 1251 |
| Decomposition, eq. 4; the leverage story for bad times | Jagannathan & Wang (1996), staff report p. 6 |

## Summary

**What.** `src/content/chapters/22-conditional-factor-models.mdx` (frontmatter `part: 5`, `chapter: 22`,
`difficulty: 2`, `prerequisites: [8, 14, 17]`), two widgets and one shared helper:

- `ConditionalBeta.tsx`: from `simulateConditionalCapm`, $\beta_t$ (top) and $\lambda_t$ (bottom) over 50 simulated
  years, with the months when $\lambda_t$ is above its mean shaded. Two `Slider`s set $s_\beta$ and $s_\lambda$, and a
  `Button` gives a new seed (default seed 1). The readout gives $\bar\beta\bar\lambda$, the covariance, their sum,
  the unconditional OLS alpha with its se and $t$, the conditional alpha with its se, and $\hat\beta^u$ next to $\bar\beta$.
- `ScaledFactors.tsx`: actual against fitted quarterly mean excess returns of the 25 portfolios from
  `conditionalModelFits`. A `Segmented` control picks CAPM, FF3, CCAPM or scaled CCAPM, and a second one picks the
  sample (LL's 1963-Q3–1998-Q3 or 1963-Q3 to the end of the data). The readout gives $R^2$, the mean |α|, the constant,
  the factors and the quarters.
- `conditionalSample.ts`: `useConditionalData`, `conditionalWorld`, `scaledView` and `managedCapm`. The widgets and
  the numbers test share them.
- `tests/chapter22-numbers.test.ts`.

**Readings.** I opened `LettauLudvigson2001b.pdf` (`pdftotext -layout`). `JagannathanWang1996.pdf` has no text layer.
I rendered PDF pages 1–32 with `pdftoppm -r 200 -png` and read them with `tesseract`. Page numbers are those of
Minneapolis Fed Staff Report 208 (PDF page n is staff-report page n − 2). The chapter cites the published Journal of
Finance article in the short form, Jagannathan & Wang (1996), and gives these staff-report pages. Cochrane (2005),
Ch. 8, is not supplied. No fact is taken from it, and it is under Further reading only.

**Deviations and choices.**

- *`SMLPlot` not reused.* Chapter 17 merged `SMLPlot`'s fitted-against-actual mode. But that mode computes its own
  monthly `factorPanel` for CAPM and FF3 only, and it cannot take the quarterly panel or the CCAPM and scaled-CCAPM fits.
  Making it take them would change shared code, which is out of scope. So `ScaledFactors` is a separate widget, with
  the same layout and colours (data dots, model line, error sticks).
- *Data mismatch with the curriculum.* The curriculum lists `fred-consumption-quarterly` and `goyal-welch-annual`.
  As the spec says, `fred-consumption-quarterly` starts in 2007. So consumption growth and $cay$ come from
  `fred-cay-quarterly` through `cayInputs` and `fullSampleCay`. `goyal-welch-annual` is not used: the chapter needs no
  annual predictor.
- *Managed-portfolio example.* The "low bar" paragraph shows that adding 25 managed portfolios raises even the plain
  CAPM's $R^2$ from 0.02 to 0.62. `managedCapm` computes this with `managedPortfolios` and `conditionalModelFits`, with
  lagged $cay$ standardised over the window. It is not in the widget.
- *Prerequisites.* Chapters 8, 14 and 17 are all merged and linked. Chapter 14 merged while this task ran (`76cfe87`).
  I then replaced its title-only mention with a link, and added that Chapter 14 shows the weaker real-time forecasts.
  The "Next up" line names Chapter 23, which is not merged yet. This follows the teaser habit of the earlier chapters.

**Notation mismatches and candidates (for a later style-guide edit; `docs/STYLE_GUIDE.md` is not changed).**

- The curriculum writes the SDF as $m_{t+1}$. §3 keeps $m$ for the log SDF and $M$ for the SDF in every model, linear
  ones included. The chapter follows the style guide: $M_{t+1} = (a_0 + a_1 z_t) + (b_0 + b_1 z_t) f_{t+1}$.
- Candidate symbols that the §3 table lacks: $\beta_{it}$ (conditional beta, as in the curriculum; §3's $\beta_{i,k}$
  is the $k$-th exposure, so the date has no comma); $\lambda_t$ (conditional premium); $z_t$ (conditioning variable
  known at $t$, coloured `\Signal` as a predictor; §3 does not use $z_t$, and $M$ is the SDF as here); $a_0, a_1, b_0,
  b_1$ (constant SDF coefficients; §3 lists $b$ for SDF loadings from Part VI); $s_\beta$, $s_\lambda$ (how much beta
  and the premium move per standard deviation of $z_t$ in the simulated world; chosen so that they do not clash with
  $b_0, b_1$); $\alpha^u$, $\beta^u$ (unconditional alpha and beta); $c$ and $V$ (shorthand inside one derivation);
  $\otimes$ (Kronecker product).
- No new colour.

**Verified revision.** Chapter and widgets at `cd2d76e`, rebased on `origin/main` `0782309`, plus this outcome file.
On that revision: `npm ci`, `npm test`, `npm run build`, `npm run screenshots -- 22-conditional` and
`npm run clickthrough -- 22-conditional` all pass.

**Proposed follow-ups.**

- Add the candidate symbols above to the `docs/STYLE_GUIDE.md` §3 table.
- Optional: let `SMLPlot`'s fitted mode take precomputed actual and fitted values. Then `ScaledFactors` and Chapter 17
  could share one scatter.
- Optional: a real-time-$cay$ switch in `ScaledFactors`, to show how the look-ahead affects the scaled CCAPM's fit.
