# TASK-109 outcome: Orchestrator reads Part VII and signs it off

Verified revision: the Verify commands ran on `4d57bd9` (it contains the merges of TASK-106, TASK-107 and TASK-108).
`origin/main` is now `f7d5a6b`; the only change since `4d57bd9` is `goals/course-site/decisions.jsonl`, so the site code is
the same.

## Acceptance

- [x] `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
  Evidence, tests: `npm ci` exit 0 ("added 439 packages"); `npm test` exit 0, "Test Files 66 passed (66)",
  "Tests 693 passed (693)".
  Evidence, build: `npm run build` exit 0, "Result (200 files): 0 errors, 0 warnings, 1 hint", "31 page(s) built",
  "Complete!". The hint is `'Matrix' is declared but its value is never read` in `src/lib/finance/news.ts`, outside Part VII.
- [x] `npm run screenshots` and `npm run clickthrough` pass for `28-skeptical-look-at-asset-pricing-tests`,
  `29-multiple-testing`, `30-shrinking-the-cross-section` and `07-mean-variance`.
  Evidence, screenshots: exit 0 for each of the four filters, with ✓ for dark-desktop, dark-phone, light-desktop and
  light-phone. Evidence, click-through: exit 0 for each filter, every widget reported at 1280px and 360px:
  Chapter 28 `PCAExplorer` (70 actions) and `RandomFactorFit` (8); Chapter 29 `MultipleTesting` (15) and `ZooChart` (6);
  Chapter 30 `FrontierBuilder` preset `shrinkage` (3) and `ShrinkagePath` (10); Chapter 7 `FrontierBuilder` default
  ("Build the frontier from a few portfolios", 14) and the beta widget (27).
- [x] The outcome holds the four judgements and a `## Sign-off` section.
  Evidence: the sections "Voice", "Widgets", "Shared code and notation" and "Links across Parts", then `## Sign-off`.
- [x] `git diff --name-only origin/main` lists only this task's outcome file.
  Evidence: the command prints `goals/course-site/tasks/TASK-109.outcome.md` and nothing else.

## Summary

I read Chapters 28 to 30 (about 8,900 words with the maths) in the source and as built pages. A Playwright probe, kept in
`/tmp` and not committed, set every widget to the state that each "Try this" prompt describes and read the readout. It also
took element screenshots of all six widgets at 360px in both themes. I cut tiles from the full-page phone screenshots
and read them. The click-through script drove every control. I changed no chapter, widget, library or doc.

I spot-checked paper claims against `source/papers/`: Harvey, Liu & Zhu give the BHY bar 2.78 and the bar 3.18 with
missing tests; Hou, Xue & Zhang give 65% failures at 1.96 and 82% at 2.78 among 452 anomalies; Kozak, Nagel & Santosh
find the best out-of-sample $R^2$ at κ ≈ 0.23 on the 25 portfolios; Lewellen, Nagel & Shanken state Observation 1 as the
chapter says. I did not check every page number.

### Voice

The voice works for a reader who starts from zero, at the Part's ●●● level. Each chapter opens on numbers the reader can
check and ends the Hook on one question. Chapter 28 shows that noise fits the 25 portfolios almost as well as FF3. Chapter 29
asks how many strategies a colleague tried. Chapter 30 shows that the best portfolio you could not have held loses half its
Sharpe ratio. Terms are defined where they first appear (mimicking portfolio, FWER, FDR, ridge, elastic net, sparse in
PCs). Each proof goes in numbered steps with a plain reading after it, and the pure algebra sits in `<details>`. The chapters say what they cannot
show. Chapter 28 warns that the bootstrap interval is centred on a biased $R^2$. Chapter 29 says that 165 survivors
are not a false discovery rate. Chapter 30 states the look-ahead in its betas twice and tests how stable the chosen penalty is.

Defects, all small:
- Chapter 28, Traded factors, says "From step 2 above". The nearest step 2 above is the GLS list (the tangency
  portfolio), not the linearity result it means (change 2).
- Chapter 29, FWER section: "when it is at least 1, it is at least 1" reads as a tautology (change 3).
- Chapter 30's key Callout says that "a handful of principal components" beats "a handful of anomalies". The chapter's own
  numbers are 14 PCs ($R^2_{CV}$ 0.44) against 20 anomalies (0.29), so "a handful" says more than the evidence (change 4).

### Widgets

Each widget teaches what its caption says, and each prose number I compared with a readout matched.

- `PCAExplorer` (28), preset `ff25-1963`, scree view: 83.2% and 6.3%, 758 months, as the text says.
- `RandomFactorFit` (28): median OLS $R^2$ 0.613 against FF3 0.663 and CAPM 0.078; 0.232 at $s = 1$; GLS 0.120
  against FF3 0.204; with the 55 assets 0.192 against 0.221 and 23.5% of draws above FF3.
- `MultipleTesting` (29): at 1.96, 40 discoveries, 28 true, 12 false, 2 missed, FDP 30%, expected 13.5. At 3, 1 false and
  9 missed. Bonferroni and Holm find 12, BHY 15. At a 50% share they find 67, 71, and 111 true with 1 false. At 0%, 14
  false at 1.96 and none with Bonferroni. One mismatch: the text gives Bonferroni's bar as $|t| > 3.76$, but "snap to
  Bonferroni" draws the line at 3.71. `ruleLine` puts it midway between the last strategy kept and the first dropped, and
  neither the text nor the caption says so (change 3).
- `ZooChart` (29), `initialLine={3}`: 107, 123, 88, 81 and 158 above 3, 2.72, 3.45, 3.64 and 1.96, as the text says.
- `FrontierBuilder` preset `shrinkage` (30): 1.84 and 0.82 at $\nu_2 = 0$; 1.64 and 0.55 at $10^{-3}$.
- `ShrinkagePath` (30): ridge peak 0.520 at 0.158 a month (0.55 a year), top coefficient short-term reversal; −1.377 at
  the weakest penalty. At $L^1$ share 0.9 and prior 0.112: 20 non-zero and 0.292 in assets, 14 and 0.436 in PCs; best in
  assets 0.485 with 44 non-zero. On the 30 FF portfolios: −3.521 and −0.006 at the two ends.
- Layout: no horizontal overflow at 360px in either theme, no KaTeX error, no console error, and no widget has an empty
  readout. The sticky header covers the top of a widget only in my element shots, not on the page.
- Two widgets of Chapter 30 write the same kind of number two ways. The `FrontierBuilder` slider shows "10^-3.0", while
  `ShrinkagePath` shows "7.7 × 10⁻³" (change 4).

### Shared code and notation

The chapters reuse the shared widgets without forking them.

- `PCAExplorer.tsx` was last changed by TASK-026 and `ZooChart.tsx` by TASK-075. Part VII uses both through props
  (`initialPreset`, `initialView`, `initialLine`).
- There is one `FrontierBuilder`. TASK-108 added an optional `preset?: 'shrinkage'` that renders `ShrunkFrontier`; with no
  prop it renders the same `AssetFrontier` as before. Chapter 7 still calls `<FrontierBuilder client:visible />`, and its
  screenshots and click-through pass.
- There is no duplicate loading code. `useSkepticalData` joins `useFactorData` and `useSeriesData`. `useShrinkageData`
  joins `useZooData` and `useSeriesData`. `MultipleTesting` is seeded simulation only (`mulberry32`). No Part VII file
  calls `fetch`; the `useEffect` calls in `RandomFactorFit` and `ShrinkagePath` run the deferred computation, not loading.
  Formulas live in `src/lib` (`skeptical.ts`, `multipleTesting.ts`, `shrinkage.ts`) and tests pin the prose numbers.
- One stale comment: `shrinkageSample.ts` line 99 says the portfolio is "scaled to the in-sample volatility of the market",
  but `shrunkTangency` scales it to the `target` volatility (10% a year) (change 4).

The Part VII block of `docs/STYLE_GUIDE.md` §3 covers most symbols ($n$, $p_{(j)}$, $\nu_2$, $\nu_1$, $SR_{\text{prior}}$,
$R^2_{CV}$, $K_{CV}$, $R^2_{\text{OLS}}$, $R^2_{\text{GLS}}$, $\mu_{\text{gmv}}$, $SR^2_{\text{tan}}$). The chapters follow
it, and they explain each departure from the papers' letters. But four symbols break the one-symbol, one-meaning rule
(change 1):
- $Q$: in Chapter 28 it is the $K \times K$ map $\operatorname{Cov}(f, f^{P\prime})\operatorname{Var}(f^P)^{-1}$
  ($B_P = BQ$). In Chapter 30, as in Chapter 6 and §3, it is the eigenvector matrix of $\Sigma = QLQ'$.
- $s$: the noise share of the random factors in Chapter 28 (it is also the slider label), and the $L^1$ share in Chapter 30.
  §3 lists only the Chapter 30 meaning. Chapter 27 also uses $s$, for a factor's strength.
- The vector of ones: §3 conventions and Chapters 17 and 27 write $\mathbf{1}$, but Chapter 28 writes $\iota$, and the
  §3 Part VII row defines $\iota$. Chapter 29 uses $\mathbf{1}\{\cdot\}$ as an indicator, which no table lists.
- Chapter 28 introduces $B$, $f^P$, $B_P$, $\lambda_P$ and $\vartheta$, and no table lists them.

### Links across Parts

Part VII links the identification problems of Part VI to the latent factors of Part VIII. Every sentence about another
chapter is true of the merged site.

- From Part VI: Chapter 27's Next up names Chapter 28 and its question. Chapter 28 links Chapter 27: at $s = 1$ the
  factors are its useless factors, and they still get a median $R^2$ of 0.232. Chapter 30 builds on the linear SDF and
  the HJ weighting of Chapter 26, both linked or named. The bridge is thin at one point. Chapter 28's main result (a weak
  link makes $\lambda_P$ large but keeps $R^2$ at 1) is the population side of Chapter 27's weak factors, but the text
  says so only in a "Try this" (change 2).
- Inside Part VII: Chapter 28's Next up names Chapters 29 and 30 correctly, and Chapter 29's names Chapter 30. Chapter 29
  reuses Chapter 21's zoo, and its claims about Chapter 21 hold: Chapter 21 counts the predictors above 1.96 and 3 and gives
  $0.5 \times \sqrt{T/12}$. Chapter 30's prerequisite box links Chapters 7, 26 and 6, but names Chapter 28 in plain text
  with the title in quotes, though Chapter 28 is on the site (change 4).
- To Part VIII: Chapter 28 opens on the principal components of the 25 portfolios. Chapter 30 ends on the result that
  principal components price the anomalies better than single anomalies. Its Next up names "Latent and observable
  factors", which is Chapter 31 of `docs/CURRICULUM.md` (not on the site yet, so plain text is right). It writes the
  title in quotes, where other chapters use italics (change 4).
- Earlier Parts: Chapter 21's closing paragraph names Chapters 28 to 30 with their titles. All three titles match the site.
- Sources: `docs/READINGS.md` says why Kozak, Nagel & Santosh and Hou, Xue & Zhang are 2020 in the chapters and 2018 in
  the curriculum. That is not a defect.

Not a Part VII defect, so I did not list it: the site writes co-authors both as "&" and as "and". Part VII mostly uses
"&", but Chapter 30's Further reading uses "and", and so does the example in `docs/STYLE_GUIDE.md` §7. One site-wide
rule would settle it.

## Sign-off

Four changes. Each becomes an M-9 task for claude opus high, and this PR is merged after they are.

1. **Part VII notation: Chapter 28 (`src/content/chapters/28-skeptical-look-at-asset-pricing-tests.mdx`,
   `src/components/plots/RandomFactorFit.tsx`), Chapter 29 and `docs/STYLE_GUIDE.md` §3.**
   Rename Chapter 28's map $Q$ to $G$, a letter the course does not use (lines 83–85, 88, 179 and the first quiz's
   explanation). Then $Q$ means only the eigenvectors of $\Sigma = QLQ'$. Write the vector of ones as $\mathbf{1}$ in
   Chapter 28 (lines 114, 118, 123, 136) and in the §3 $\mu_{\text{gmv}}$ row, as the §3 conventions and Chapters 17 and 27 do.
   In the §3 $s$ row, add the noise share of Chapter 28 and the factor strength of Chapter 27, each local to its chapter.
   Add §3 rows for $B$ ($N \times K$ beta matrix, Chapters 27–28), $f^P$, $B_P$, $\lambda_P$ and $\vartheta$ (Chapter 28),
   and for the indicator $\mathbf{1}\{\cdot\}$ (Chapter 29, always with braces).
2. **Chapter 28, `src/content/chapters/28-skeptical-look-at-asset-pricing-tests.mdx`.** Line 179: replace "From step 2
   above" with "From step 2 of the linearity result". In the Intuition, after the sentence that ends "uses a larger premium
   $\lambda$ to stretch them" (line 52), add one sentence with a link: this is the weak-factor problem of
   Chapter 27 seen in population, where the premium blows up and the two-pass test cannot tell.
3. **Chapter 29, `src/content/chapters/29-multiple-testing.mdx`.** Lines 114–115: replace "when it is at least 1, it is at
   least 1, and when it is 0, the indicator is 0 too" with "when it is at least 1, the indicator is 1, which is no larger,
   and when it is 0, both are 0". Lines 130–131: after "snap the line to Bonferroni", say that a snapped line sits midway
   between the last strategy the rule keeps and the first it drops. So it reads 3.71 here, below the bar of 3.76, and
   both lines split the strategies the same way.
4. **Chapter 30, `src/content/chapters/30-shrinking-the-cross-section.mdx`, `src/components/plots/FrontierBuilder.tsx`,
   `src/components/plots/shrinkageSample.ts`.** In the prerequisite Callout, link Chapter 28 as the other three are linked,
   with its title in italics. In Next up, write *Latent and observable factors* in italics. In the key Callout (lines 299–301),
   replace "a handful … a handful" with the chapter's numbers: 14 non-zero PCs give $R^2_{CV}$ 0.44, and 20 non-zero
   anomalies give 0.29. In the Hook, give the end of the anomaly sample (December 2024) with 8.85 and 2.18. In the
   `ShrunkFrontier` slider of `FrontierBuilder.tsx`, format the penalty as `ShrinkagePath` does ("1.0 × 10⁻³", not
   "10^-3.0"). Move the formatter to `format.ts` so both widgets share it. Fix the stale comment on `inSample` in
   `shrinkageSample.ts` (line 99) to say "scaled to the target volatility".

Part VII reads well, apart from the four changes above.
