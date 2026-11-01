# TASK-106 outcome: Chapter 28: A skeptical look at asset pricing tests

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: after `npm ci` (exit 0): `npm test`: 64 files, 681 tests passed (6 in `tests/chapter28-numbers.test.ts`), exit 0; `npm run build`: "0 errors", "0 warnings", "29 page(s) built", exit 0.
- [x] `npm run screenshots -- 28-skeptical-look-at-asset-pricing-tests` passes in both themes at desktop and phone
  size, and the images were inspected.
  Evidence: ✓ for dark-desktop, dark-phone, light-desktop and light-phone. I cut the full pages into tiles and read
  them. Fixes from the inspection: the $R^2_{\text{GLS}}$ display ran past a 375px phone, so it and the first
  display of the Formalisation are now two-line `aligned` blocks; the table header is upper-cased by the site CSS,
  which turned "$\hat\lambda_0$ ($t$)" into "($T$)", the sample size, so the column is now "Zero-beta rate (t-stat)";
  the readout showed the beat-FF3 share as a whole percent while the prose gives one decimal, so it now shows one.
- [x] `npm run clickthrough -- 28-skeptical-look-at-asset-pricing-tests` passes and reports every widget of the
  chapter.
  Evidence: exit 0. `PCAExplorer`: 70 actions at 1280px and 70 at 360px. `RandomFactorFit`: 8 and 8 (slider
  "Noise share s of each factor"; segmented "Cross-sectional R²" OLS and GLS; segmented "Test assets" "25
  portfolios" and "25 + 30 industries"; button "Re-roll simulation").
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'`: line 15 Hook, 32 Intuition, 63 Formalisation, 206 Playground, 255 Check
  yourself, 281 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the Verify hex grep prints "no hex colours". Colours are `var(--c-prob)`, `--c-factor` and
  `--text-muted`, and the `\Ret`, `\Factor`, `\Err` and `\Data` macros.
- [x] The widgets use real data (`ff25-size-bm-monthly`, `ff3-monthly`, `ff30-industry-monthly`) and seeded
  simulations from `src/lib/math/rng.ts`; `git diff --stat origin/main -- src/components/plots/PCAExplorer.tsx` is
  empty.
  Evidence: the diff command prints nothing. `RandomFactorFit` loads through `useSkepticalData` in
  `skepticalSample.ts`, which joins `useFactorData` (25 portfolios and FF3) and `useSeriesData` (the `loadSeries`
  hook) for the industries; it adds no loading code of its own. Each draw runs `randomFactorFit` (`normalRng`, seed
  2010, re-roll steps the seed). `PCAExplorer` is used as it is, with `initialPreset="ff25-1963"` and
  `initialView="scree"`.
- [x] Voice review and numbers table: below.
- [x] The prose is 2,740 words, inside 1,500–3,000. Command (the one of chapter 27):
  `awk 'NR>8' src/content/chapters/28-skeptical-look-at-asset-pricing-tests.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition shows the `PCAExplorer` scree plot ("The first principal component carries 83.2% of the variance") before the Formalisation derives $B_P = BQ$. |
| Data before theory | The Hook opens on the monthly 25 portfolios: "The Fama–French three-factor model (FF3) gets a cross-sectional $R^2$ of 0.663. The CAPM gets 0.078." |
| One idea per section | Hook: noise fits. Intuition: few directions, so betas line up. Formalisation: one `###` each for the linearity result, OLS $R^2$, GLS $R^2$, traded factors and intervals. Playground: random factors against FF3, then what our data show. |
| Start with a question the reader has | "So, **if a model made of noise fits the 25 portfolios almost as well as FF3, what does a high $R^2$ on them prove?**" |
| Write to one reader, as "you"; explain terms; link back | "The widget below opens on their scree plot from July 1963." Mimicking portfolios, the zero-beta Sharpe ratio and the bootstrap are defined where they first appear; Chapters 6, 17, 18, 19 and 27 are linked. |
| Give the honest version | "This interval is centred on the sample $R^2$, which is biased up (LNS, p. 21). So read it as the sampling spread, not as a range for the true $R^2$." |
| Say what the evidence can and cannot show | "FF3 beats the CAPM on every line. But no line says that FF3 prices these assets." Every estimate carries the sample (1963-07 to 2026-08), a 95% interval or a Shanken $t$. |
| Don't skip steps | The linearity result is three numbered steps, the premium ratio $1/\operatorname{corr}^2$ three more, and the GLS reading six, with the Cauchy–Schwarz and GLS algebra in a `<details>` block. |
| Graduate rigour, with a plain reading | Part VII is ●●●. After the GLS steps: "So $R^2_{\text{GLS}}$ measures how close the model's mimicking portfolios come to the mean–variance frontier." |
| Papers in our own words | "They write that a factor needs only a weak correlation with SMB or HML, and none with the small, idiosyncratic residuals of the portfolios (p. 2)." No text, figure or table is copied. |

## Numbers in the prose

All tests are in `tests/chapter28-numbers.test.ts`. Page numbers of LNS are cited in the prose and are not numbers
from a result. Percent-a-year values are monthly decimals × 1200, rounded to one decimal.

| Number in the prose | Where | Test |
|---|---|---|
| 1963-07 to 2026-08, 758 months; 25 and 55 assets | Hook, Playground | `the sample` |
| 200 draws, 2 factors, seed 2010 | Hook, Playground | `hook and playground` (`RANDOM_SAMPLES`, `RANDOM_FACTORS`, `RANDOM_SEED`) |
| FF3 OLS $R^2$ 0.663; CAPM 0.078 | Hook, table, Recap | `hook and playground` (`modelR2`) |
| median OLS $R^2$ 0.613 at $s = 0.75$; 87.5% above one half | Hook, Playground, Recap | `hook and playground` (`fit.median.ols`, `fit.shareAbove.ols`) |
| FF3 GLS $R^2$ 0.204; median GLS draw 0.120 | Try this | `hook and playground` |
| median OLS $R^2$ 0.232 at $s = 1$ | Try this | `try this` |
| 55 assets: median 0.192, FF3 0.221, 23.5% beat FF3 | Playground | `try this` (`beatFF3.ols`) |
| PCA shares 83.2%, 6.3%, 3.5%; component 1 one sign; 2 small vs big; 3 growth vs value | Intuition, Try this | `intuition` (`presetPanel('ff25-1963')`, the panel the widget shows) |
| the eight $R^2$ with 95% bootstrap intervals in the table, and the ones repeated in the list | What our data show, Recap | `what our data show: R² and 95% bootstrap intervals` (`r2ConfidenceInterval`, seed 2010, 100 samples) |
| CAPM premium −3.9%, market mean 7.2%, gap −11.1%, $t = -2.54$ | What our data show, quiz 2 | `traded factors price themselves` |
| FF3 gaps −0.9%, −0.2%, 0.4% ($t$ −2.72, −0.65, 1.55); on 55: −3.3%, −0.8%, −1.7% ($t$ −3.60, −2.13, −3.59) | What our data show | `traded factors price themselves` |
| zero-beta rates 13.3% (3.00), 0.6% (2.76), 7.7% (2.90), 3.6% (3.82) | Table | `traded factors price themselves` |

Fixed inputs, not results: noise share 0.75 and 1, the time-series $R^2$ of 0.25 at $s = 0.75$ (it is $1 - s$ by
construction), 30 industries, 100 bootstrap samples, 95%, the 2.5th and 97.5th percentiles, one half.

## Summary

**What.** `src/content/chapters/28-skeptical-look-at-asset-pricing-tests.mdx` (part 7, chapter 28, difficulty 3,
prerequisites [6, 17]); the widget `src/components/plots/RandomFactorFit.tsx`; its data helper
`src/components/plots/skepticalSample.ts`; `tests/chapter28-numbers.test.ts`. `PCAExplorer` is reused unchanged.

**How.**
- `skepticalSample.ts` builds the panel with `factorPanel` (25 portfolios, FF3) and adds the 30 industries less RF
  with `excessReturn`, checking that the dates line up. `modelR2` is the OLS `crossSectionalRegression` and
  `glsR2`; `randomView` is `randomFactorFit` plus `rejectionRate` against FF3's $R^2$.
- `RandomFactorFit` runs 200 draws when the slider rests (250 ms), as `UselessFactor` does. In Node, under a load
  average above 28, one view took about 4 s on 25 assets and 9 s on 55; the readout says "updating…" meanwhile.
- The Formalisation derives: linearity in any betas with $\operatorname{Cov}(\varepsilon, f^{P\prime}) = 0$ (LNS
  Observation 1); the free premium $\lambda_P = \mathbb{E}[f^P]/\operatorname{corr}^2$ (LNS p. 6); $R^2_{\text{OLS}}$
  as the curriculum writes it; $R^2_{\text{GLS}}$ and its reading
  $\hat\alpha'\Sigma^{-1}\hat\alpha = SR^2_{\text{tan}}(\hat\lambda_0) - SR^2_f(\hat\lambda_0)$ with
  $\mu_{\text{gmv}}$ as the no-factor minimum; $\lambda = \mathbb{E}[f]$ and $\lambda_0 = 0$ for traded factors,
  with the Shanken-scaled standard errors; the bootstrap interval for $R^2$.

**What our data show.** On the 25 portfolios, two-factor models of SMB, HML and 75% noise have a median OLS $R^2$
of 0.613, against FF3's 0.663. Adding the 30 industries cuts both (0.192 and 0.221), and 23.5% of the random
draws then beat FF3. FF3's $R^2_{\text{GLS}}$ is 0.204 on 25 assets and 0.076 on 55. With the factors among the
test assets, the CAPM's premium is −3.9% a year against a 7.2% mean ($t = -2.54$ on the gap). FF3's gaps are small
on 25 assets but grow on 55 (two of three with $|t| > 3.5$), and every zero-beta rate is more than two standard
errors from zero.

**Deviations and mismatches.**
- Readings: the PDF is NBER working paper 12360 (July 2006). The chapter cites the published 2010 article and
  says that its page numbers are the working paper's. Kandel & Stambaugh (1995) is named only as LNS's source
  (LNS pp. 3, 18); I did not open it and take no fact from it.
- Random factors: LNS draw loadings or portfolio weights from quarterly 1963–2004 moments (Figures 1–4). The
  library mixes SMB, HML and noise on monthly 1963-07 to 2026-08 data, so the chapter quotes no LNS figure numbers,
  only the 3/4 noise share and its time-series $R^2$ of 0.25 (p. 13).
- Intervals: LNS invert simulated distributions to get a range for the true $R^2$ (pp. 21–22). The library's
  `r2ConfidenceInterval` is a percentile bootstrap; the chapter says what it measures and what LNS do instead.
- Curriculum and §3 agree on $R^2_{\text{OLS}}$, $R^2_{\text{GLS}}$, $\mu_{\text{gmv}}$, $\iota$ and
  $SR^2(\lambda_0)$. No mismatch.
- Symbols the §3 table still lacks (candidates for a style-guide task): $f^P_t$, the proposed factors, with $B_P$
  and $\lambda_P$ (LNS write $P$, $C$, $\gamma$; $\gamma$ is risk aversion here); $Q$, the $K \times K$ slope matrix
  of $f$ on $f^P$; $B$, the $N \times K$ beta matrix (also a candidate from Chapter 27); $\tilde\mu = \bar R^e -
  \lambda_0\iota$; $\vartheta$, the weights on the mimicking portfolios; $\tilde w = \Sigma^{1/2}w$; $s$, the noise
  share (as in Chapter 27's strength $s$; §3 has the state $s$ of $\pi(s)$). The widget's mix and noise are named in
  words, $\text{mix}_{k,t}$ and $\text{noise}_{k,t}$, because $g$ is the GMM moment and $e$ a Chapter 19 residual.
- Chapters 29 and 30 are not merged; the Recap names them by title, without links.

**Verified revision.** `bf11cbf` (the next commit adds only this file), on `origin/main` `67ebb14`: `npm ci`, `npm test`, `npm run build`,
`npm run screenshots -- 28-skeptical-look-at-asset-pricing-tests`, `npm run clickthrough --
28-skeptical-look-at-asset-pricing-tests`, the `section-tag` grep, the `PCAExplorer` diff, the hex grep and the
tracked-PDF count, all as above.

**Follow-ups.**
- Style-guide task: add the symbol candidates above to the Part VII table.
- When Chapters 29 and 30 merge: link them from the Recap.
