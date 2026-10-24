# TASK-063 outcome: Chapter 16: Time-series tests and the GRS statistic

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence (after rebasing on `origin/main` 8454e24): `npm ci` exited 0; `npm test` printed
  `Test Files  39 passed (39)` and `Tests  410 passed (410)`, including the 5 tests of
  `tests/chapter16-numbers.test.ts`; `npm run build` printed `- 0 errors`, `- 0 warnings`, `16 page(s) built` and
  `Complete!`. The one hint is the unused `Matrix` import in `src/lib/finance/news.ts`, not in this task's files.
- [x] `npm run screenshots -- 16-time-series-tests` passes in both themes at desktop and phone size, and I inspected
  the images.
  Evidence: it printed `✓` for `chapters_16-time-series-tests-and-grs-{dark,light}-{desktop,phone}.png`. I read
  slices of the light desktop and dark phone pages (hook to recap, all KaTeX, both quizzes, the further-reading
  list) and element shots of every widget in both themes at 1280px and 360px. Two display equations were cut at
  phone width; I split each over two lines with `aligned` and checked the new phone shot. The SMB and HML labels
  overlapped in `GRSGeometry`; they now sit on opposite sides.
- [x] `npm run clickthrough -- 16-time-series-tests` passes and reports every widget of the chapter.
  Evidence: three `✓` lines, one per widget instance: `TWENTY-FIVE ALPHAS AND ONE JOINT TEST` (Intuition),
  `THE SHARPE RATIO THE TEST ASSETS ADD` (Formalisation) and `TWENTY-FIVE ALPHAS AND ONE JOINT TEST` (Playground,
  starts 2015-01), each with `6 actions at 1280px, 6 actions at 360px` over segmented "Model" (CAPM,
  Fama–French 3) and select "Sample starts". A separate Playwright run with reduced motion read the readouts after
  each change: FF3 chosen by keyboard (focus + Space) gave `758, 25, 3`, GRS `3.64`, `p = 8.3 × 10⁻⁹`, `6 of 25`,
  `1.04% a year`; the geometry widget on CAPM from 2015-01 gave `0.78`, `2.19`, `0.350`, `0.401 − 0.051 = 0.350`,
  GRS `1.52`.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` prints lines 15 Hook, 32 Intuition, 59 Formalisation, 202 Playground,
  238 Check yourself, 264 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the spec's `git diff … | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` printed
  `no hex colours`. The widgets colour only with `var(--c-error)`, `var(--c-factor)`, `var(--c-return)` and the
  neutral tokens.
- [x] The widgets use real data from the chapter's curriculum entry (`ff25-size-bm-monthly`, `ff3-monthly`).
  Evidence: `factorTestSample.ts` loads both series (through `useCapmData`) and builds every number on
  `factorPanel`, `timeSeriesRegressions`, `grs` and `sharpeFrontiers`. Both captions name the two dataset IDs and
  the sample period.
- [x] The outcome holds a voice review and a table of every number in the prose with its test.
  Evidence: the sections "Voice review" and "Numbers in the prose" below.
- [x] The prose is 2,623 words, inside 1,500–3,000. Command (the one of chapters 9, 10 and 13):
  `awk 'NR>8' src/content/chapters/16-time-series-tests-and-grs.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1.

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | `AlphaBars` comes before any formula, and `GRSGeometry` comes before the Sharpe identity: "Below, each set of assets has a frontier, and the dashed line from the origin touches it." |
| Data before theory | The hook opens on our data: "Small growth stocks have an alpha of −6.3% a year, with a $t$-statistic of −2.94." |
| One idea per section | Intuition holds one idea: "A joint test of alphas weighs each alpha by its precision and by its correlation with the others." |
| Start with a question the reader has | "How can a model that halves the alphas be rejected almost as firmly?" |
| Write to one reader, as "you" | "You ran 25 tests. At the 5% level, a true model fails 1.25 of them on average, by luck alone." Terms are defined where they first appear (**residual**), and Chapters 3 and 7 are linked. |
| Give the honest version | "We state the exact result without proof" and "These are the classical standard errors of Chapter 3, not White's." |
| Say what the evidence can and cannot show | "A rejection says one thing: … It does not say that the alphas are large, or that you could earn them after trading costs." Every estimate carries its sample (1963-07 to 2026-08, 758 months) and its p-value. |
| Don't skip steps in derivations | The variance of $\hat\alpha_i$ in four numbered steps, the Sharpe identity in four numbered steps (repackage with $H$, invariance, block-diagonal covariance, split of the quadratic form), and $T > N + K$ from the dimension of the residual space. The exact Hotelling-to-$F$ step is stated as a cited result, and the text says so. |
| Graduate rigour comes in gradually | Part IV (●●): matrix algebra, read in words: "GRS is the gain in squared Sharpe ratio from adding the test assets to the factors, scaled by sample size." |
| Papers in our own words | "Gibbons, Ross & Shanken (1989, p. 1124) call this a Hotelling $T^2$ test, the many-asset version of the $t$-test." |

## Numbers in the prose

Every number from our data is checked in `tests/chapter16-numbers.test.ts`. "From 1963-07" means 1963-07 to
2026-08 (758 months); alphas and their bars are ×12; Sharpe ratios "a year" are ×√12; squared Sharpe ratios and
$\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha$ are per month with divisor $T$.

| Number in the prose | Where | What it is | Test |
|---|---|---|---|
| 758 months, 1963-07 to 2026-08, 25 portfolios | Hook, Playground | The default sample | `hook: CAPM alphas from 1963-07, and the joint verdicts` |
| −6.3%, −2.94 | Hook | CAPM alpha and $t$ of small growth (ME1-BM1) | same |
| +5.7%, 3.17 | Hook | CAPM alpha and $t$ of small value (ME1-BM5) | same |
| 10 of the 25 | Hook | CAPM alphas whose 95% bar excludes zero | same |
| 1.25 | Hook | 25 × 0.05, expected false rejections | same |
| 2.36%, 1.04% | Hook, Playground | Average absolute alpha, CAPM and FF3 | same |
| $7.4 \times 10^{-11}$, $8.3 \times 10^{-9}$ | Hook, Formalisation | GRS p-values, CAPM and FF3 | same |
| −6.28%, −5.58% | Intuition | Small growth alpha, CAPM and FF3 | `intuition: small growth under the CAPM and FF3` |
| 4.18%, 2.16% | Intuition | Half-width of its 95% bar, CAPM and FF3 | same |
| −2.94, −5.06 | Intuition | Its $t$-statistic, CAPM and FF3 | same |
| 16.8%, 8.6% | Intuition | Its residual volatility a year, CAPM and FF3 | same |
| 25, 730 | Formalisation | Degrees of freedom of GRS for FF3 | `formalisation: GRS for FF3, T > N + K, and the Sharpe identity` |
| 1.52 | Formalisation | 5% critical value of $F_{25,\,730}$ | same |
| 0.129, 0.036, 1.036, 3.64 | Formalisation | FF3: $\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha$, $SR^2_f$, $1 + SR^2_f$, GRS | same |
| 29 months | Formalisation | $N + K + 1$ for 25 portfolios and 3 factors | same |
| 140 | Formalisation, Playground | Months from 2015-01 | same, and `playground: …` |
| 0.47, 0.65 | Formalisation | $SR_f$ a year, CAPM and FF3 | `formalisation: …` |
| 1.40, 1.41 (about 1.4) | Formalisation | $SR_{\text{all}}$ a year, CAPM and FF3 | same |
| 0.146 = 0.164 − 0.018 | Formalisation | CAPM identity, per month | same (also checks the identity to 1e-10) |
| 0.129 = 0.165 − 0.036 | Formalisation | FF3 identity, per month | same |
| 3.18%, 1.52, 1.60, 0.073, no bar | Playground | CAPM from 2015-01: average absolute alpha, GRS, 5% critical value, p-value, bars that exclude zero | `playground: a short sample, the full sample, and power` |
| 1,202, 3.40, 3.37 | Playground | From 1926-07: months, GRS for CAPM and FF3 | same |
| 2.19 | Playground | $SR_{\text{all}}$ a year, CAPM from 2015-01 | same |
| 26 assets | Playground | The market plus 25 portfolios (CAPM) | count, by construction |
| $T = 758$, 0.054 | Playground | Smallest $\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha$ that rejects FF3 at 5% (GRS inverted at its critical value) | same |
| "about a quarter" | Playground | Ratio of that threshold at $4 \times 758$ months to 758 months (between 0.22 and 0.27) | same |

Numbers that are not from our data: 95%, 5% and 1.96 (the confidence level and the normal cut-off, from
`invCdf(0.975)` in the widgets); the page numbers of Gibbons, Ross & Shanken (1989): p. 1122 (choice of assets can
change the conclusion), p. 1124 (Hotelling $T^2$, the one-factor $F$ result, robustness to non-normality),
p. 1126 (the Sharpe-ratio reading), p. 1131 (power depends on $T(SR^2_{\text{all}} - SR^2_f)/(1 + SR^2_f)$; the power
figures use 60 or 120 months, "five or ten years"), p. 1146 (several factors, $F(N, T-N-L)$); the quiz's
$N = 25$, $K = 3$, $T = 100$, $72$, $97$, $28$, 6,000 months, $p = 0.001$, 0.2% and 1-in-1,000 (hand examples;
`quiz: degrees of freedom` checks $100 - 25 - 3 = 72$).

## Summary

**What.** `src/content/chapters/16-time-series-tests-and-grs.mdx` (part 4, chapter 16, difficulty 2,
prerequisites 3 and 7, both linked), the widgets `src/components/plots/AlphaBars.tsx` and
`src/components/plots/GRSGeometry.tsx`, their shared helper `src/components/plots/factorTestSample.ts`, and
`tests/chapter16-numbers.test.ts`. Three quizzes.

**How.** `factorTest` calls `factorPanel`, `timeSeriesRegressions` and `grs`, and annualises with
`annualiseMean`/`annualiseVolatility`. `frontierPicture` calls `sharpeFrontiers` and converts to annual units.
`AlphaBars` arranges the 25 portfolios in five size groups with book-to-market rising inside each, draws each alpha
with a ±1.96 s.e. bar (filled dot when the bar excludes zero, hollow otherwise, so colour is not the only cue), and
tweens between models with `useTweened` (one shared y range, so the bars visibly shrink). `GRSGeometry` draws both
frontiers, both tangent lines from the origin (tweened slopes), the 25 portfolios, the factors and the gap bar; its
readout shows $SR_f$, $SR_{\text{all}}$, $\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha$ next to
$SR^2_{\text{all}} - SR^2_f$, and GRS rebuilt from those numbers.

**Deviations and choices.**
- `factorTestSample.ts` re-exports `useCapmData` from `capmSample.ts` as `useFactorData`. It is only the loader of
  the two series; every number is built on `factorPanel`, not on `capmSample`.
- `grs` does not return $\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha$, so the helper computes it with `solve`
  from `timeSeriesRegressions`' alphas and residual covariance. The numbers test checks that it equals
  `sharpeAll2 - sharpeFactors2` to 1e-10 for both models.
- The library has no inverse $F$ CDF. The helper's `fCritical` finds the critical value with `bisection` on
  `fSurvival`.
- `GRSGeometry` also has the sample-start `Select` (the spec asks only for the model control). It lets the
  Playground show the inflated in-sample $SR_{\text{all}}$ of 2015-01.
- The 95% bars use classical standard errors, as `timeSeriesRegressions` does; the chapter says so.

**Mismatches reported (not edited).**
- `docs/CURRICULUM.md` cites "Gibbons, Ross & Shanken (1987)". The PDF is Econometrica 57(5), 1989, pp. 1121–1152
  (title page), so the chapter cites 1989.
- The curriculum's Key math writes $\hat\Omega$ for the factor covariance and $\hat\Sigma$ for the residual
  covariance; the chapter follows `docs/STYLE_GUIDE.md` §3 with $\hat\Sigma_f$ and $\hat\Sigma_\varepsilon$.
- Symbol candidates for the §3 table: $GRS$; $SR_f$ and $SR_{\text{all}}$ (sample values, written without a hat;
  the chapter says all moments are sample moments with divisor $T$); $\hat B$ ($N \times K$ matrix of betas);
  $\sigma^2_{\varepsilon,i}$; $F_{N,\,T-N-K}$ and $\chi^2_N$; and the chapter-local $z_t$, $\mu_z$, $\Sigma_z$, $H$
  (the hedge matrix; I avoided $A$, which §3 gives to the VAR, and $M$, the SDF).
- No new colour.

**Verified revision.** Code at `9f25669` on top of `origin/main` 8454e24; this outcome adds no code.

**Proposed follow-ups.** Optional: export $\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha$ from `grs` and an
inverse $F$ CDF from `distributions.ts`, so the helper's two small computations can move into the library.
