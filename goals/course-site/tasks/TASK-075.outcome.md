# TASK-075 outcome: Chapter 21, Anomalies and the factor zoo

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm test`: "Test Files 48 passed (48)", "Tests 522 passed (522)", exit 0 on the rebased revision. An earlier run under a load average of 37 on this shared machine timed out in four heavy simulation tests of other chapters (chapters 4, 11, 14 and `cay.test.ts`); the rerun passed with no change. `npm run build`: "0 errors", "0 warnings", "20 page(s) built", exit 0.
- [x] `npm run screenshots -- 21-anomalies` passes in both themes at desktop and phone size, and the images were inspected.
  Evidence: exit 0, four ✓ lines (dark/light × desktop/phone). I inspected the four full-page images and a
  per-widget capture of each widget in both themes at 1280px and 360px. Two fixes came from that look: a raw
  `_t` in the SpanningTest caption, and shorter ZooChart readout labels at 360px.
- [x] `npm run clickthrough -- 21-anomalies` passes and reports every widget of the chapter.
  Evidence: exit 0. "THE FACTOR ZOO AND A SIGNIFICANCE LINE · 6 actions at 1280px, 6 actions at 360px" (slider, both
  Window options, the construction option) and "IS THIS FACTOR SPANNED BY THE OTHERS? · 9 actions at 1280px,
  9 actions at 360px" (the factor select and the three Sample options).
  A separate Playwright run at 360px checked the readouts: line at 3 gives 107 and 31 of 165; five ArrowUp
  presses on the focused drag handle move the line from 3.00 to 5.05; Mom gives 8.83% a year, t 4.85; HML
  1963–1993 gives 3.40%, t 2.94. These match the prose.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` gives Hook (line 15), Intuition (33), Formalisation (76), Playground (146),
  Check yourself (180), Recap & next up (206).
- [x] No hex colour in the chapter or its widgets.
  Evidence: the spec's `git diff --name-only origin/main … | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"`
  prints `no hex colours`. All colours are `var(--c-signal)`, `var(--c-factor)`, `var(--c-model)`,
  `var(--c-error)`, `var(--text)`, `var(--text-muted)`.
- [x] The widgets use real data from `ff5-monthly`, `mom-monthly` and the OSAP datasets.
  Evidence: `useZooData` in `src/components/plots/zooSample.ts` loads `osap-ls-monthly` and `ff5-monthly`,
  `mom-monthly` through `loadSeries`, and `osap-signals` through `loadOsapSignals`. ZooChart computes through
  `signalSummaries`, `countAbove`, `compareConstructions` and `byPublicationYear` (`zoo.ts`). SpanningTest
  computes through `spanningTest` (`factors.ts`). Both captions name the dataset IDs and sample periods.
- [x] The outcome holds a voice review and a table of every number in the prose with its test (below).
- [x] The prose is 1,500–3,000 words: 1,945.
  Command (frontmatter, imports, display math, JSX tags and quiz props removed):
  `awk '/^---$/{f++;next} f>=2' src/content/chapters/21-anomalies-and-the-factor-zoo.mdx | awk '/^\$\$$/{m=!m;next} !m' | grep -vE '^import |^<(Zoo|Span|Quiz|Callout)|^\s*(question|options|answer|explanation|client:visible)|^\s*/>' | sed -E 's/<[^>]+>//g' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
| --- | --- |
| Picture first, then the formula | The ZooChart (Intuition) shows the counts above a line before Formalisation writes $t = \bar R/(s/\sqrt T)$; the spanning scatter shows the α gap that the formula defines. |
| Data before theory | Hook: "In each paper's own sample, 158 of the 165 have a $t$-statistic above 1.96. In the months after that sample, only 66 do." |
| One idea per section | Intuition: what an anomaly is and why counts shrink; Formalisation: many $t$-tests, then why only α adds; Playground: spanning verdicts by factor and sample. |
| Start with a question the reader has | "So which of the 165 discoveries are real? And how many factors do you actually need?" |
| Write to "you", short sentences, link back | "Hedge the new factor: buy it and sell $\beta$ of each old factor." Links to Chapters 3, 7 and 16. |
| Give the honest version | "The widget tests the raw mean return of each long–short portfolio, not its alpha against a model." |
| Say what the evidence can and cannot show | "But 'not rejected' is not 'proved to be zero'. The 95% confidence interval for its alpha runs from −0.21% to 4.76% a year." |
| Don't skip steps | Four steps to the $t$-statistic; three steps from the hedged return to $SR^2(f, f_{\text{new}}) = SR^2(f) + (\hat\alpha/\hat\sigma_\varepsilon)^2$. |
| Graduate rigour gradually (●● Part) | Matrix form only where Chapter 16 already built it ($\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha$), then the one-asset scalar case. |
| Papers in our own words | "Cochrane (2011, p. 1060) asks this of the zoo: which variables carry independent information about average returns, and which are subsumed by others?" |

## Numbers in the prose and their tests

All data numbers are recomputed in `tests/chapter21-numbers.test.ts` through `zooSample.ts`, `zoo.ts`,
`factors.ts`, `normal.ts` and `moments.ts`. Numbers from readings carry their page in the prose.

| Number in the prose | Source | Test |
| --- | --- | --- |
| 165 predictors, published 1973 to 2016 | osap-signals, `byPublicationYear` | `hook` |
| 158 of 165 above 1.96 in sample; 66 after | `countAbove` via `zooCounts` | `hook`, `intuition` |
| Mom12m (Jegadeesh & Titman 1993), sample 1964–1989 | osap-signals metadata | `hook` |
| 16.09% a year, t 4.48, 312 months; 420 months after, 9.21%, t 1.82 | `signalSummaries` | `hook` |
| Line at 3: 107 in sample, 31 after; back at 1.96: 66 | `countAbove` | `intuition` |
| 1.96 (5% two-sided cutoff) | `invCdf(0.975)` | `formalisation` |
| 0.05 × 316 = 15.8 | arithmetic on HLZ's 316 | `formalisation` |
| 0.27% beyond ±3; 0.85 of 316 | `cdf(3)` | `formalisation` |
| Sharpe 0.5, 240 months: expected t 2.24; passes 1.96 61%, passes 3 22% | `cdf` | `formalisation` |
| HML 1963–2026: α 0.85% a year, t 0.89, R² 0.513, 758 months | `spanningTest` via `spanningView` | `playground` |
| HML 1963–1993 (366 months): α 3.40%, t 2.94 | same | `playground` |
| HML 1994–2026 (392 months): α −1.48%, t −1.01 | same | `playground` |
| Mom: R² 0.091, α 8.83%, t 4.85 | same | `playground` |
| SMB: α 2.28%, t 1.80; 95% interval −0.21% to 4.76% | same | `playground` |
| Classical and White t close | same (within 0.4 for HML, Mom, SMB) | `playground` |
| Quiz: 0.05 × 200 = 10 | arithmetic | `quiz` |
| 316 factors | Harvey, Liu & Zhu (2016, p. 8) | reading |
| t > 3 hurdle | Harvey, Liu & Zhu (2016, p. 5) | reading |
| Most published t above 1.96 | Harvey, Liu & Zhu (2016, p. 23) | reading |
| 452 anomalies; 65% fail with NYSE breakpoints and value weights; 43.1% with all-stock breakpoints and equal weights; microcaps 60.7% of stocks, 3.2% of value | Hou, Xue & Zhang (2020, p. 2020) | reading |
| "zoo" | Cochrane (2011, p. 1047) | reading |
| Chapter numbers 3, 7, 16, 19, 20, 22, 28–30 | `docs/CURRICULUM.md` | — |

## Summary

**What.** `src/content/chapters/21-anomalies-and-the-factor-zoo.mdx`, two widgets (`ZooChart.tsx`,
`SpanningTest.tsx`), their shared data helper `zooSample.ts`, and `tests/chapter21-numbers.test.ts`. No shared code,
library, curriculum or style-guide file changed.

**How.** `zooSample.ts` holds the data hook (`useZooData`), the zoo counts (`zooSummaries`, `zooCounts`) and the
spanning view (`spanningView`, which builds the six-factor panel from `ff5-monthly` and `mom-monthly` and calls
`spanningTest`). `factorModelSample.ts` is not merged, so the factor panel lives here. The numbers test imports
the same helper, so the widgets and the prose read the same values.

ZooChart: points at publication year and original-sample (or post-sample) $t$; a draggable line (Mafs
`MovablePoint`, focusable and moved by arrow keys) synced with a shared `Slider` (0.50–8.00, default 1.96); a
dashed mark at $t = 3$; a `Segmented` construction control and a `Segmented` window control; readout of
`countAbove` (both windows) and `compareConstructions` at the line. SpanningTest: a `Select` of Mkt-RF, SMB,
HML, RMW, CMA, Mom; a `Segmented` sample control (1963–2026, 1963–1993, 1994–2026); a scatter of the factor
against $\hat\beta'f_t$ with the 45° line and the α gap; readout of α̂ (×12), classical and White $t$, $R^2$.

**Deviations and choices.**

1. *Only one portfolio construction exists.* TASK-068 measured but did not commit the value-weighted and
   NYSE-20th-percentile OSAP variants (size rule), and TASK-070 exposes only `'original'`. The construction
   `Segmented` therefore has one option, and its `compareConstructions` rows compare the original with itself
   (0 of 165 cross, ratio 100%); the widget says so in the readout. The chapter reports the microcap and
   value-weighting effect from Hou, Xue & Zhang (2020, p. 2020) instead, and says our data cannot show it.
   I added a window control (original sample vs after it) so the chart still shows a real shrinkage.
2. *Extra sample control in SpanningTest.* The spec fixes the common sample from 1963-07; the default is that
   full sample. Two halves were added because the spec asks the chapter to teach that a factor can be spanned in
   one sample and not in another, and HML shows it (t 2.94 then −1.01).
3. *Raw means, not alphas.* `zoo.ts` gives the $t$ of each raw long–short mean. The chapter states this
   simplification in the Intuition section.
4. *Prerequisites.* Chapters 19 (*Size and value*) and 20 (*Momentum*) are not merged at `origin/main`
   `0782309`, so the chapter names them by title without links. Chapters 3, 7 and 16 are linked.

**Mismatches to report.**

- `docs/CURRICULUM.md` cites "Hou, Xue & Zhang (2018)"; the paper is Review of Financial Studies 33 (2020). The
  chapter cites 2020.
- The curriculum's Key math uses $f_{\text{new},t}$, which the notation table of `docs/STYLE_GUIDE.md` §3 lacks.
  Candidate row: "$f_{\text{new},t}$ | `\Factor` | A candidate factor tested for spanning by the model's factors
  $f_t$". The chapter also uses $\hat\sigma_\varepsilon$ (residual standard deviation of one regression) and
  $SR^2(\cdot)$ with a set of assets as argument; candidates for the table.

**Verified revision.** `c8bef85` (chapter, widgets, test), rebased on `origin/main` `0782309`, plus this outcome
file. `npm ci`, `npm test`, `npm run build`, `npm run screenshots -- 21-anomalies`, `npm run clickthrough -- 21-anomalies`
exit 0 on that revision. GitHub Actions were not read.

**Not checked.** Screen-reader output beyond the `aria-label` text; touch dragging on a real phone.

**Proposed follow-ups.** When a data task commits the OSAP `VWforce` and `ME_gt_NYSE20pct` variants (TASK-070's
follow-up), add them to `CONSTRUCTIONS` in `zooSample.ts`; the widget then compares constructions for real.
