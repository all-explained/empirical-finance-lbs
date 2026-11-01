# TASK-116 outcome

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: on f13ea8e, after `npm ci` (exit 0), `npm test` exits 0 with `Test Files 68 passed (68)`, `Tests 713 passed (713)`.
  `npm run build` exits 0. `astro check` prints `- 0 errors` and `- 0 warnings`, and the build ends `[build] Complete!`.
  Its one hint is an unused import in `src/lib/finance/`, which this PR does not touch.
- [x] `npm run screenshots` passes for `31-latent-and-observable-factors`, `06-principal-components` and
  `28-skeptical-look-at-asset-pricing-tests` in both themes at desktop and phone size, and I inspected the images.
  Evidence: each run exits 0 and prints 4 `✓` lines (dark/light × desktop/phone). I opened the full-page chapter 31 image (light desktop).
  I also opened Playwright captures of the chapter 31 widget in all four theme/size pairs, phone slices (375px) of the
  Formalisation and quizzes, and the widget of chapter 6 (dark desktop) and chapter 28 (light phone). Their readouts
  match their prose: 88.1% for chapter 6 axis 1; 83.2%, 6.3% and 3.5% for chapter 28.
  A Playwright check at 375px finds no KaTeX element wider than the viewport, also inside the open `<details>` block.
- [x] `npm run clickthrough` passes for the three chapters and reports every widget.
  Evidence (each run exits 0):
  - `✓ chapters/31-latent-and-observable-factors/ · PRINCIPAL COMPONENTS… · 13 actions at 1280px, 13 actions at 360px · select "Data"; segmented "Show" option "scree"; … option "factors"; slider "Components K"; slider "Rotate axes 1 and 2 by ω"; button "Flip the signs"`
  - `✓ chapters/06-principal-components/ · PRINCIPAL COMPONENTS… · 70 actions at 1280px, 70 actions at 360px`. The control list is the same three-view list as before.
  - `✓ chapters/28-skeptical-look-at-asset-pricing-tests/ · PRINCIPAL COMPONENTS… · 70 actions …` and `✓ … · RANDOM FACTORS THAT FIT · 8 actions at 1280px, 8 actions at 360px`.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` gives lines 14 Hook, 30 Intuition, 58 Formalisation, 205 Playground, 235 Check yourself, 261 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the Verify `git diff … | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` prints `no hex colours`.
  `src/components/plots/latentSample.ts` has no colour at all.
- [x] The widget uses real data (`ff25-size-bm-monthly`, `ff3-monthly`), and the default views of `PCAExplorer` are unchanged.
  Evidence: the factors view loads `ff3-monthly` through `useLatentData` (`usePcaData` plus `loadSeries`) and builds the panel
  with `factorPanel`. Its readout shows `1963-07 to 2026-08, 758 months, 25 portfolios in excess of RF` and
  `Canonical correlations 0.995, 0.972, 0.931`. These are the values pinned in `latentFactors.test.ts`.
  The factors option and the `ff3-monthly` request exist only when `initialView="factors"`. On chapters 6 and 28, the Playwright
  request log shows no `ff3-monthly` request from the PCA widget. The click-through lists the same three views, and the readouts are unchanged.
- [x] The outcome holds a voice review and a table of every number in the prose with its test. See the two sections below.
- [x] The prose is 2,781 words, inside 1,500–3,000. Command (the one of chapters 27 and 28):
  `awk 'NR>8' src/content/chapters/31-latent-and-observable-factors.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition opens the widget on the canonical-correlation bars and the "sheet of paper" picture, before the Formalisation defines $\mathit{cc}_1 = \max \operatorname{corr}(Xw^X, Yw^Y)$. |
| Data before theory | The Hook: "The first three components carry 93.1% of the variance. … Component 2 has a correlation of 0.62 with SMB and −0.65 with HML." |
| One idea per section | Hook: two lists that do not match. Intuition: compare spaces, not arrows. Formalisation: one `###` each for the APT, why components price, rotation and canonical correlations. Playground: $K$, angle and sample. |
| Start with a question the reader has | "So, **are these the same three factors or not? And if PCA can find factors in any set of returns, why would you need an economic story to choose them?**" |
| Write to one reader, as "you"; explain terms; link back | "Use the widget above." APT, no near-arbitrage, approximate factor structure and canonical correlations are defined at first use. Chapters 6, 17, 19 and 28 are linked. |
| Give the honest version | "PCA ranks directions by variance, never by mean, so it is not literally 'by construction'." |
| Say what the evidence can and cannot show | "These are sample numbers with no standard errors, and the 1926 sample shows how much the third one moves." Every estimate names 1963-07 to 2026-08 (or 1926-07). |
| Don't skip steps | The APT bound is six numbered steps. The rotation result is three. The canonical-correlation eigenproblem is four steps plus a `<details>` proof of the regression step (Cauchy–Schwarz). |
| Graduate rigour, with a plain reading | After $\sum_i \alpha_i^2 \le \sigma^2_\varepsilon SR^2_{\max}$: "That is what 'approximately' means: most assets are priced almost exactly, but a few can have large alphas." |
| Papers in our own words | "Kelly, Pruitt & Su … fix it with normalisations that, as they say, carry no economic restrictions (p. 13)." No text, figure or table is copied. |

## Numbers in the prose

All tests are in `tests/chapter31-numbers.test.ts` (`describe('chapter 31 prose numbers')`). They run on the 25 portfolios
in excess of RF from `latentPanel`, through `factorComparison`, `pcaFactors`, `latentRiskPremia`, `timeSeriesRegressions` and
`crossSectionalRegression`.

| Number in the prose | Where | Test |
|---|---|---|
| 1963-07, 2026-08, 758 months | Hook, Formalisation, Playground, Recap | `hook` |
| 93.1% (share of three components) | Hook, Playground | `hook` |
| 0.93 (component 1, Mkt-RF); 0.58 (component 1, SMB) | Hook, Intuition | `hook` |
| 0.62, −0.65 (component 2, SMB and HML) | Hook | `hook` |
| −0.44, −0.72 (component 3, SMB and HML) | Hook, quiz 2 | `hook` |
| 0.995, 0.972, 0.931 (canonical correlations, $K = 3$) | Intuition, What our data show, quiz 2, Recap | `intuition` |
| 45° turn: 0.93 → 0.56 (Mkt-RF), 0.58 → 0.85 (SMB); bars unchanged | Intuition, quiz 1 | `intuition` |
| $R^2_{\text{OLS}}$ 0.002, 0.282, 0.640, 0.703, 0.791 ($K$ = 1 to 5) | Formalisation, quiz 3 | `formalisation` |
| $R^2_{\text{OLS}}$ exactly 1 with 24 components | Formalisation, quiz 3 | `formalisation` |
| FF3 $R^2_{\text{OLS}}$ 0.663 | Formalisation, quiz 3 | `formalisation` |
| 3.5% (share of component 3) | Formalisation | `formalisation` |
| 0.994 ($K = 1$) | Playground | `playground` |
| 0.996, 0.985, 0.976 and 95.2% ($K = 5$) | Playground | `playground` |
| Flip: plain correlations change sign, bars unchanged | Playground | `playground` |
| 1926 sample: third bar 0.467; 0.894 with $K = 4$ | Playground | `playground` |

Numbers from readings, with the page I opened. They are not our data, so they have no test.
- Nagel: "over 90%" time-series variation (p. 14).
- Giglio & Xiu: 647 portfolios (p. 1970); the market and SMB are almost fully explained by the latent factors and HML less so (p. 1975, Table B1 p. 1987).
- Every page number cited in the chapter.

The other numbers are slider settings: $K = 1, 3, 4, 5$, 45°, 1 to 5.

## Summary

**What.**
- `src/content/chapters/31-latent-and-observable-factors.mdx`: the chapter. It covers the factor model, a six-step derivation of
  the APT bound $\sum_i \alpha_i^2 \le \sigma^2_\varepsilon SR^2_{\max}$ (what "approximately" and "no near-arbitrage" mean), and why
  the components price their own test assets. It shows the in-sample limit ($R^2_{\text{OLS}}$ = 1 at 24 components) and the rotation
  $(\beta, f_t) \to (\beta H^{-1}, Hf_t)$ with $\lambda \to H\lambda$, tied to $\omega$ of Chapter 6 and $G$ of Chapter 28. It gives
  canonical correlations with a rotation-invariance proof and the eigenvalue derivation, and says plainly what our data show.
  It has three quizzes and names Chapters 32 to 34 by title only in "Recap & next up".
- `PCAExplorer`: a fourth view, `factors`. It has bars of the canonical correlations of the first $K$ PCs with Mkt-RF, SMB and HML,
  and a table of the plain correlations. A "Components $K$" slider runs from 1 to 5. The existing $\omega$ slider and sign flip
  rotate the PCs (H inside the plane of PCs 1 and 2, times −1 when flipped). The readout gives the canonical correlations and
  the variance share of the $K$ PCs.
- `src/components/plots/latentSample.ts`: `useLatentData` (`usePcaData` plus `loadSeries('ff3-monthly')`), `latentPanel`
  (`factorPanel` from the preset's first month) and `factorComparison`. All maths goes through `pcaFactors`, `rotateFactors`,
  `canonicalCorrelations` and `sampleCovariance`.
- `tests/chapter31-numbers.test.ts`: every data number in the prose.
- `docs/STYLE_GUIDE.md` §3, Part VIII block: two rows, each with the clash it avoids (every existing row kept).
  - $SR_{\max}$: not $SR_{\text{tan}}$ or $SR_{\text{prior}}$.
  - $\sigma^2_\varepsilon$: the largest eigenvalue of $\Sigma_\varepsilon$. Not $\ell_k$, and no bar, which would mean a sample mean.

**Deviations.**
- The factors view also accepts the 1926 sample of the 25 portfolios, besides the default from 1963-07. The click-through drives
  controls by position, so the Data select must stay first in every view. In the factors view, it lists only the two
  portfolio samples, and choosing the view from the yield preset switches to 1963. The 1926 sample gives a Playground prompt:
  the third canonical correlation is 0.467 with $K = 3$ and 0.894 with $K = 4$.
- The factors option appears only with `initialView="factors"`, so chapters 6 and 28 keep their three views and never load `ff3-monthly`.
- The factors view runs PCA on excess returns (`factorPanel`), as `latentFactors.test.ts` does. The other views keep raw returns,
  as before. The readout and the caption say "in excess of RF".
- `src/lib` has no correlation helper, so `factorComparison` reads the plain correlations from `sampleCovariance` of the
  joined block, as `tests/chapter06-numbers.test.ts` does. No formula is repeated in a component.
- With $K = 1$ there is no plane to turn, so $\omega$ does nothing, and the readout says so.

**Mismatches with `docs/CURRICULUM.md` (not edited).**
- Readings list "Kelly, Pruitt & Su (2018)". The chapter cites the *JFE* article as Kelly, Pruitt & Su (2019), as the spec asks.
  It names pages of NBER working paper 24540 (April 2018), whose cover does not print the JFE citation.
- Nagel (2013) is cited with the pages of NBER working paper 18554, whose cover is dated November 2012.
- The widget line says "MKT, SMB and HML". The chapter and the widget use the data name Mkt-RF, as the spec does. §3 says the French data call MKT Mkt-RF.
- Key math writes $R^e_t = \beta f_t + \varepsilon_t$. The chapter writes the general model $R^e_t = \mathbb{E}[R^e] + \beta f_t + \varepsilon_t$
  with mean-zero factors. It then shows the curriculum's form for factors whose mean is the premium. This is not a §3 conflict.
- None of the three readings discusses canonical correlations, so the chapter attributes no canonical-correlation result to them.

**Verified revision.** f13ea8e (the next commit adds only this file), rebased on `origin/main` 1987ef1. These all exit 0:
`npm ci`, `npm test`, `npm run build`, the three `npm run screenshots` runs and the three `npm run clickthrough` runs.

**Proposed follow-ups.** None.
