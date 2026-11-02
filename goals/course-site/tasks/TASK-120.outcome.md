# TASK-120 outcome: Orchestrator reads Part VIII and signs it off

Verified revision: the Verify commands ran on `781d8c8`. It contains the merges of TASK-116, TASK-117, TASK-118 and
TASK-119. An earlier full run on `ebd4210` gave the same results; the only site change between the two is TASK-127's
new library `consumptionPuzzle.ts` and its test, which no page uses yet.

## Acceptance

- [x] `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
  Evidence, tests: `npm ci` exit 0 ("added 439 packages"); `npm test` exit 0, "Test Files 76 passed (76)",
  "Tests 824 passed (824)".
  Evidence, build: `npm run build` exit 0, "Result (223 files): 0 errors, 0 warnings, 1 hint", "35 page(s) built", "Complete!". The hint is the unused `Matrix` import in `src/lib/finance/news.ts`, outside Part VIII, already reported by TASK-109.
- [x] `npm run screenshots` and `npm run clickthrough` pass for `31-latent-and-observable-factors`,
  `32-characteristics-are-covariances-ipca`, `33-characteristic-based-mimicking-portfolios`,
  `34-risk-premia-with-omitted-factors`, `06-principal-components`, `19-size-and-value` and
  `28-skeptical-look-at-asset-pricing-tests`.
  Evidence, screenshots: exit 0 for each of the seven filters, with ✓ for dark-desktop, dark-phone, light-desktop and
  light-phone. Evidence, click-through: exit 0 for each filter, every widget reported at 1280px and 360px:
  Chapter 31 `PCAExplorer` factors view (13 actions); Chapter 32 `IPCAFit` (8); Chapter 33 `SortGrid` weights view (7)
  and `MimickingPortfolio` (7); Chapter 34 `OmittedFactorBias` (10); Chapter 6 `PCAExplorer` default (70);
  Chapter 19 `SortGrid` default (5) and the six-portfolio widget (2); Chapter 28 `PCAExplorer` scree preset (70) and
  `RandomFactorFit` (8).
- [x] The outcome holds the four judgements and a `## Sign-off` section.
  Evidence: the sections "Voice", "Widgets", "Shared code and notation" and "Links across Parts", then `## Sign-off`.
- [x] `git diff --name-only origin/main` lists only this task's outcome file.
  Evidence: the command prints `goals/course-site/tasks/TASK-120.outcome.md` and nothing else.

## Summary

I read Chapters 31 to 34 (about 11,900 words with the maths) in the source and as built pages. A Playwright probe, kept
in `/tmp` and not committed, set every widget to the state that each "Try this" prompt describes and read the readout.
It also took element screenshots of all five widgets at 360px in both themes and measured horizontal overflow (0px on
all four pages in both themes). The click-through script drove every control. I read the shared code that Part VIII
touches: `PCAExplorer`, `SortGrid`, `latentSample.ts`, `latentFactors.ts`, `ipca.ts`, `threePass.ts` and
`mimicking.ts`. I changed no chapter, widget, library or doc. I did not check the paper page numbers.

### Voice

The voice works for a reader who starts from zero, at the Part's ●●● level. Each Hook ends on one question that the
reader can feel: two lists of three factors that do not match (31), risk or free lunch (32), how to buy a number (33),
three answers for one premium (34). Terms are defined where they first appear (canonical correlation, approximate
factor structure, managed portfolio, exposure, mimicking portfolio). One picture carries the Part: the "sheet of
paper" of Chapter 31 comes back in Chapter 34 to explain why the rotation does no harm. Each proof goes in numbered
steps with a plain reading after it, and the pure algebra sits in `<details>`. Each chapter says what it cannot show.
Chapter 31 gives sample numbers with no standard errors and shows how much the third one moves in the 1926 sample.
Chapter 32 says that its panel is simulated and that the real numbers are the paper's. Chapter 33 shows its own
consumption tracker fall apart out of sample. Chapter 34 reports that its estimator misses HML by 1.9 standard errors
once the industries are added.

Defects, all small:
- Chapter 32, Hook: "The title of this chapter is the first story in four words." The story, "Characteristics are
  covariances", is three words (change 3).
- Chapter 32, Playground: "the unrestricted fit reaches 0.29%". This is true of the library (`chapter32-numbers`
  pins it), but the widget shows only the restricted fit. At $K = 3$ its restricted readout happens to show 0.29% too,
  so a reader who looks for the number finds the wrong one (change 3).
- Chapter 34, "What our data show": "the 30 industry portfolios of `ff30-industry-monthly`" puts a dataset id in the
  prose, and "the bias of the last step above" points at step 5 of a list two sections up (change 3).

### Widgets

Each widget teaches what its caption says, and each prose number I compared with a readout matched.

- `PCAExplorer` (31), preset `ff25-1963`, factors view: canonical correlations 0.995, 0.972, 0.931 and 93.1%; plain
  correlations 0.93/0.58/−0.07, −0.13/0.62/−0.65, 0.30/−0.44/−0.72. At 45°: 0.56 and 0.85 for component 1, bars
  unchanged. $K = 1$: 0.994. $K = 5$: 0.996, 0.985, 0.976 and 95.2%. "Flip the signs" flips every plain correlation
  and no bar. 1926 sample: third bar 0.467 at $K = 3$, 0.894 at $K = 4$.
- `IPCAFit` (32): at $K = 2$ and no alpha, 12 iterations, 8.25% and 0.60%, $p = 0.685$. $K = 1$: $p = 0.020$.
  $K = 2$ with 0.4%: $p = 0.005$. $K = 2$ with 1.0%: restricted predictive $R^2$ 0.01%. $K = 3$ with 1.0%:
  $p = 0.395$.
- `SortGrid` (33), weights view: ±5.0% sort, −4.0 to +4.0% regression; exposures 1.00 and 0.00; $w'w$ 0.025 and
  0.020; 1.23% ($t = 3.17$) and 1.11% ($t = 2.94$); correlations with HML 0.963 and 0.967. Size: 0.49% with
  $t = 1.05$ and 1.07.
- `MimickingPortfolio` (33): 0.40 in sample, 0.09 with FF3; split at 1995-Q1: 0.55 and −0.15 (25 portfolios), 0.19 and
  −0.01 (FF3); split at 1975-Q1: 46 quarters, 0.79 and −0.05.
- `OmittedFactorBias` (34): at $s = 1$, $c = 0.5$: +2.77% and 3.65%, three-pass −0.27% and 1.88%. $c = 0$: −0.21% and
  2.23%; $s = 0$: 1.93%. $c = -0.5$: −3.18%. $s = 2$, $c = 0.9$: +10.58%. Three-pass RMSE 1.88% to 1.91% in all of
  these. $K = 1$: −2.96% and 4.42%. $K$ from 2 to 6: −0.32% and 1.89%.
- Layout: no horizontal overflow at 360px in either theme, no KaTeX error, no console error, and no widget has an empty
  readout. The sticky header covers the top of a widget only in my element shots, not on the page.
- One readout detail, not a defect: the factors view of `PCAExplorer` works on excess returns, so at $K = 1$ it gives
  component 1 a share of 83.3%, while the scree view of the same data, on raw returns, gives 83.2%. Each readout names
  its series ("in excess of RF" and "25 series"), and Chapter 31's Hook says it uses excess returns.

### Shared code and notation

The chapters reuse the shared widgets without forking them.

- There is one `PCAExplorer`. TASK-116 added a factors view that only `initialView="factors"` offers, and only that
  view loads `ff3-monthly`. Chapter 6 (`<PCAExplorer client:visible />`) and Chapter 28 (`initialView="scree"`) render
  as before, and their screenshots and click-throughs pass (70 actions each).
- There is one `SortGrid`. TASK-118 added a weights view that only `initialMeasure="weights"` offers. Chapter 19
  (`<SortGrid client:visible />`) renders as before, and its screenshots and click-through pass.
- No duplicate loading code. `useLatentData` extends `usePcaData` and adds `ff3-monthly` only for the factors view;
  `MimickingPortfolio` reuses `useConditionalData` and `GRID_START`; `OmittedFactorBias` and `IPCAFit` are seeded
  simulations (`mulberry32`, `normalRng`). The one hand-written `loadSeries` call, in `useLatentData`, is there because
  the load is conditional, which `useSeriesData` does not offer. That is fine.
- `threePass.ts` and `latentSample.ts` reuse `pcaFactors`, `rotateFactors` and `canonicalCorrelations` from
  `latentFactors.ts`. Formulas live in `src/lib`, and `tests/chapter31-numbers.test.ts` to
  `tests/chapter34-numbers.test.ts` pin the prose numbers.
- One rotation step is written again instead of reused (change 4). After ALS, `ipcaFit` in `src/lib/finance/ipca.ts`
  (lines 255–267) applies three rotations by hand: $\Gamma_\beta \to \Gamma_\beta G$ with $f \to G^{-1}f$ for the
  orthonormal step, the eigenvector step and the sign step. Each is `rotateFactors(gammaBeta, factors, H)` with
  $H = G^{-1}$. The comment also calls the rotation $G$, where §3 and Chapters 31 and 34 write $H$. And the private
  `symmetricPower` of `ipca.ts` and the private `inverseRoot` of `latentFactors.ts` both compute a power of a symmetric
  matrix from `symmetricEigen`.

The Part VIII block of `docs/STYLE_GUIDE.md` §3 covers the symbols of all four chapters, and each chapter explains
where it departs from its paper's letters. But Chapter 31 uses two letters two ways (change 1):
- $B$: line 70 says that Chapter 28 calls the beta matrix $B$, as the §3 row does. Lines 181–187 then define
  $B = \Sigma_{XX}^{-1/2}\Sigma_{XY}\Sigma_{YY}^{-1/2}$ for the canonical correlations. The docstring of
  `canonicalCorrelations` in `latentFactors.ts` uses the same $B$.
- $G$: line 153 uses Chapter 28's map $G$ ($B_P = BG$). Lines 171–172 use $G$ again for any invertible matrix that
  turns the block $X$. That second $G$ is a rotation, which §3 writes $H$. The docstring of `canonicalCorrelations`
  says "X G'" too.

### Links across Parts

Inside Part VIII, every sentence about another chapter is true of the merged site. Part VIII links well to Part IX.
It does not yet link back to the factor zoo and shrinkage of Part VII.

- Claims checked: Chapter 28 does call the beta matrix $B$ and writes $B_P = BG$, $\lambda_P = G^{-1}\lambda$. Chapter 6
  gives the angle $\omega$ and says that in the 1926 sample components 3 and 4 carry 3.1% and 2.6%. Chapter 17 says the
  25 portfolios move together every month. Chapter 22 defines managed portfolios as $z_tR^e_{i,t+1}$. Chapter 26 tests
  the CCAPM on the 252 quarters from 1963-Q3 to 2026-Q2. Chapter 18 covers estimated betas, and Chapter 27 the useless
  factors that look priced in a two-pass test.
- To Part IX: Chapter 33 builds a traded stand-in for consumption growth, the factor of Chapter 26's CCAPM, and shows
  how little of its fit survives. Chapter 34 asks for the premium of a non-traded factor, "such as consumption growth".
  Its Next up names *The equity premium and risk-free rate puzzles*, the title of Chapter 35 in `docs/CURRICULUM.md`
  (not on the site yet, so plain text is right). That is a good bridge.
- From Part VII: Chapter 28 is linked (Chapters 31 and 34). But no Part VIII chapter names Chapter 29 or Chapter 30.
  Chapter 30 ends on its strongest result, that an elastic net that keeps 14 principal components prices the anomalies
  out of sample better than one that keeps 20 anomalies, and its Next up promises that Chapter 31 "asks how far a few
  statistical factors can stand in for the many observable ones". Chapter 31 then works only with the 25 portfolios
  and FF3, and never picks that thread up. Chapter 32, which reduces many characteristics to a few factors, also does
  not name the zoo of Chapter 29 (change 2).
- Chapters that are on the site but named in plain text (change 2): Chapter 30's Next up names *Latent and observable
  factors* without a link. Chapter 31's Next up names Chapters 32, 33 and 34 without links. Chapter 32's prerequisite
  box names Chapter 31 as "Latent and observable factors" in quotes, without a link, and its Next up names
  "Characteristic-based mimicking portfolios" in quotes, with no chapter number or link. Chapter 33 names Chapter 32
  in italics without a link. Each was right when written, before the next chapter was merged.

## Sign-off

Four changes. Each becomes an M-10 task for claude opus high, and this PR is merged after they are.

1. **Notation: Chapter 31 (`src/content/chapters/31-latent-and-observable-factors.mdx`), `docs/STYLE_GUIDE.md` §3 and
   `src/lib/finance/latentFactors.ts`.** Rename the canonical-correlation matrix of lines 181–187 from $B$ to $\Psi$,
   a letter no chapter or table uses (`git grep '\\Psi'` finds nothing), and add a §3 Part VIII row for it:
   $\Psi = \Sigma_{XX}^{-1/2}\Sigma_{XY}\Sigma_{YY}^{-1/2}$, whose $\Psi\Psi'$ has the eigenvalues $\mathit{cc}_k^2$, not
   the beta matrix $B$. In lines 171–172, turn the block with $H$ instead of $G$ ("Replace $X$ by $XH'$ for an
   invertible $H$"), so $G$ keeps the one meaning of Chapter 28. Make the same two renames in the docstring of
   `canonicalCorrelations` (lines 94–98) and in its local variable `B`.
2. **Links: Chapters 30, 31, 32 and 33.** Link every chapter that is now on the site, with chapter number and italic
   title, as Chapter 31's Next up does: Chapter 30's Next up (Chapter 31); Chapter 31's Next up (Chapters 32–34);
   Chapter 32's prerequisite box (Chapter 31) and Next up (Chapter 33); Chapter 33, "What the 25 portfolios hide"
   (Chapter 32). Then add the Part VII bridge. In Chapter 31, at the end of "Why the components price the test
   assets", add two sentences with a link: Chapter 30 found that a few principal components of the anomaly portfolios
   price them out of sample better than the anomalies themselves ($R^2_{CV}$ of 0.44 against 0.29); this chapter asks
   what such components are and how they relate to factors with names. In Chapter 32's Hook, after "That measures
   *how much* a characteristic predicts", add one sentence with a link: with hundreds of characteristics in the zoo of
   Chapter 29, IPCA asks how few factors they need.
3. **Wording: Chapter 32 (`src/content/chapters/32-characteristics-are-covariances-ipca.mdx`) and Chapter 34
   (`src/content/chapters/34-risk-premia-with-omitted-factors.mdx`).** Chapter 32, line 37: "in four words" becomes
   "in three words". Lines 307–308: say that the unrestricted fit "reaches 0.29% in the library, a number the widget
   does not show". Chapter 34, line 261: "the 30 industry portfolios of `ff30-industry-monthly`" becomes "Kenneth
   French's 30 industry portfolios". Line 255: "the bias of the last step above" becomes "the too-few case of step 5
   above".
4. **Code reuse: `src/lib/finance/ipca.ts` and `src/lib/finance/latentFactors.ts`.** In `ipcaFit` (lines 255–267),
   apply the three normalisation steps with `rotateFactors` from `latentFactors.ts` ($H$ = the square root of
   $\Gamma_\beta'\Gamma_\beta$, then the eigenvector matrix, then the diagonal sign matrix), and write the rotation as
   $H$ in the comments. Keep one helper for the power of a symmetric matrix: move `symmetricPower` to
   `src/lib/math/linalg.ts` next to `symmetricEigen`, and use it for `inverseRoot` in `latentFactors.ts`. The tests
   `ipca.test.ts`, `latentFactors.test.ts` and `tests/chapter32-numbers.test.ts` must pass unchanged.
