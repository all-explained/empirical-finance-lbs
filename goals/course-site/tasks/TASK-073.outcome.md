# TASK-073 outcome

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: after merging `origin/main` (`0a3d024`) and `npm ci`, `npm test`: 52 test files and 546 tests passed,
  `tests/chapter20-numbers.test.ts` included. `npm run build`:
  "Result: 0 errors, 0 warnings, 1 hint" (the hint is an unused import in `src/lib/finance/news.ts`, not in this task's files).
- [x] `npm run screenshots -- 19-size-and-value` passes in both themes at desktop and phone size, and the images were inspected.
  Evidence: four `✓ chapters_19-size-and-value-{dark,light}-{desktop,phone}.png` after the merge. I read Playwright
  crops of both widgets at 1280px and 360px in both themes, with FactorBuilder switched to HML: the legs, the
  0.01-point gap the prose cites and the SortGrid cells all render. On phones, main's FactorBuilder readout wraps
  into a narrow value column; it is readable, and it is the same widget chapter 20 uses, so I left it.
- [x] `npm run clickthrough -- 19-size-and-value` passes and reports every widget of the chapter.
  Evidence: "TWENTY-FIVE PORTFOLIOS SORTED ON SIZE AND VALUE · 5 actions at 1280px, 5 actions at 360px" (Colour by:
  Mean excess return, Alpha; Model: CAPM, FF3, FF5) and "BUILD SMB AND HML FROM SIX PORTFOLIOS · 2 actions at 1280px,
  2 actions at 360px" (Factor: SMB, HML).
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` gives lines 15 Hook, 32 Intuition, 69 Formalisation, 172 Playground,
  213 Check yourself, 239 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the spec's command prints "no hex colours". The same grep on `FactorBuilder.tsx`, `factorModelSample.ts`
  and `sizeValueSample.ts` finds nothing.
- [x] The widgets use real data from `ff25-size-bm-monthly`, `ff3-monthly`, `ff5-monthly` and `ff6-size-bm-monthly`.
  Evidence: `SortGrid` loads `ff3-monthly` and `ff25-size-bm-monthly` through `useFactorData` of `factorTestSample.ts`,
  and `ff5-monthly` with `loadSeries`; it computes through `modelPanel`, `timeSeriesRegressions` and `grs`.
  `FactorBuilder` (main's, from TASK-074, `kind="size-value"`) loads `ff6-size-bm-monthly` and `ff3-monthly`
  (published SMB and HML) and rebuilds the factors with `sortFactors` through `sortView`. Captions name the dataset IDs and the sample.
- [x] The outcome holds a voice review and a table of every number in the prose with its test.
  Evidence: the sections "Voice review" and "Numbers in the prose" below.
- [x] The prose is 2,417 words, inside 1,500–3,000. Command (the one of chapters 9, 10, 13 and 16):
  `awk 'NR>8' src/content/chapters/19-size-and-value.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1.

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | `SortGrid` comes in Intuition, before any formula: "Below, each cell is one portfolio. Small stocks are in the top row, and value stocks are in the right column." |
| Data before theory | The hook opens on our data: "The portfolio of small growth stocks has a CAPM beta of 1.42. Its mean excess return is 3.96% a year." |
| One idea per section | Intuition holds one idea: "Sorting on size and on book-to-market spreads average returns much more than it spreads market betas." |
| Start with a question the reader has | "If beta does not explain why small value stocks earned so much, what does?" |
| Write to one reader, as "you" | "Its size depends on the sample you pick." Terms are defined where they first appear (**size**, **book-to-market**, **value**, **growth**, **value spread**, **operating profitability**, **investment**), and Chapters 7, 16 and 17 are linked. |
| Give the honest version | "The averages remove the other sort's effect only to the extent that the two effects add up." |
| Say what the evidence can and cannot show | "A $t$-statistic of $-0.50$ over 236 months cannot tell a zero premium from a positive one, so this does not prove the value premium is gone." Every estimate carries its sample and a $t$-statistic or p-value. |
| Don't skip steps in derivations | The cancellation behind SMB and HML is written out term by term, with the leftover terms named; the FF3 pricing equation follows from the regression with the zero-alpha step stated. |
| Graduate rigour comes in gradually | Part V (●●): vectors $\beta_i'f_t$ and the GRS test of Chapter 16, each read in words ("the model says that every $\alpha_i$ is zero"). |
| Papers in our own words | "Cochrane (2011, p. 1058) puts it this way: the puzzle is not only that value stocks earn more, but that their betas do not rise with their returns." |

## Numbers in the prose

Every number from our data is checked in `tests/chapter19-numbers.test.ts` (5 tests). "From 1963-07" means 1963-07
to 2026-08 (758 months); means and alphas are monthly ×12. Quiz numbers repeat prose numbers.

| Number in the prose | Where | Test |
|---|---|---|
| 758 months, 1963-07 to 2026-08 | Hook | `hook` |
| Small growth: beta 1.42, mean 3.96% | Hook, Intuition, Recap | `hook` |
| Small value: beta 1.06, mean 13.37% | Hook, Intuition, Recap | `hook` |
| 9.41 points less | Hook | `hook` |
| Big growth 7.38%, big value 9.57% | Intuition try-this | `intuition` |
| Value spread 4.94, size spread 1.98 | Intuition | `intuition` |
| CAPM alphas −6.28% and +5.69% | Intuition, Formalisation, Recap | `intuition` |
| CAPM betas from 0.86 to 1.42 | Intuition | `intuition` |
| SMB 1.77% ($t$ = 1.35), HML 3.53% ($t$ = 2.72), published factors from 1963-07 | Formalisation | `formalisation: factor means…` |
| Small value loadings 0.95, 1.10, 0.69; small growth 1.11, 1.40, −0.26 | Formalisation | `formalisation: factor means…` |
| Average absolute alpha 2.36% → 1.04% | Formalisation | `formalisation: factor means…` |
| FF3: small value +2.16%, small growth −5.58% ($t$ = −5.06), 6 of 25 with $|t| > 1.96$ | Formalisation | `formalisation: factor means…` |
| FF3 GRS 3.64, $p = 8.3 \times 10^{-9}$ | Formalisation, Playground | `formalisation: factor means…` |
| FF5: small growth −3.30% ($t$ = −3.23), RMW loading −0.50, average 1.05%, 7 of 25 | Formalisation | `formalisation: FF5` |
| FF5 GRS 3.23, $p = 2.6 \times 10^{-7}$ | Formalisation, Playground | `formalisation: FF5` |
| 1926-07 to 2026-08 (all months of the six portfolios) | Playground | `playground` |
| Largest gap rebuilt vs published 0.01 points, as the readout rounds it (HML and SMB) | Playground | `playground` |
| Rebuilt HML 5.40% (1926-07 to 1963-06), 5.10% (1963-07 to 1990-12) | Playground, quiz, Recap ("over 5%") | `playground` |
| Rebuilt HML 2.32% ($t$ = 1.23) from 1991-01; −1.30% ($t$ = −0.50), 236 months, from 2007-01 | Playground, quiz, Recap | `playground` |
| 5% critical value "about 1.5" (1.52 for FF3 and FF5) | Playground | `playground` |

Not from our data: the breakpoints (NYSE median; 30th and 70th percentiles; NYSE quintiles), the June formation
and the definitions of the factors, operating profitability and investment, from the Kenneth French Data Library
pages listed below; "1963–1990" and the flat beta relation from Fama & French (1992, pp. 427–428).

## Summary

**What.** `src/content/chapters/19-size-and-value.mdx` (Part 5, chapter 19, difficulty 2, prerequisites 16 and 17),
the widget `SortGrid.tsx` with its helper `sizeValueSample.ts`, and `tests/chapter19-numbers.test.ts`. The chapter
renders main's `FactorBuilder.tsx` (TASK-074) and does not change it.

**How.**
- `sizeValueSample.ts` holds `gridView` (built on `modelPanel`, `timeSeriesRegressions`, `grs`) and the hook
  `useModelData` (reuses `useFactorData` of `factorTestSample.ts`, adds `ff5-monthly`). The numbers test and
  `SortGrid` call the same functions. The playground numbers come from `sortView` of main's `factorModelSample.ts`,
  the function `FactorBuilder` uses.
- `SortGrid`: 5×5 grid, `Segmented` for mean excess return or alpha and for CAPM, FF3 or FF5, on the common sample
  from 1963-07. Every cell carries its signed number; alphas with $|t| > 1.96$ add `*` and a border, so colour is
  never the only cue. The diverging scale uses `--c-return` (positive) and `--c-error` (negative) by opacity, with a
  gradient legend. The readout gives GRS, its 5% critical value, the p-value and the average absolute alpha.
- `FactorBuilder`: main's widget from TASK-074 with `kind="size-value"`. It shows the six legs as a 2×3 grid with
  the long legs solid and the short legs dashed, and \$1 in T-bills plus the rebuilt factor against the published
  one on a log scale. The readout gives both means, both end values and the largest monthly gap.

**Merge with main (resume).** TASK-074 merged its own `FactorBuilder.tsx` and `factorModelSample.ts` first, which made
an add/add conflict with this branch. I took main's two files unchanged, so chapter 20 and
`tests/chapter20-numbers.test.ts` are untouched and pass. This branch's grid code (`GridModel`, `GRID_MODELS`,
`GRID_START`, `gridView`, `useModelData`) moved to the new `sizeValueSample.ts`. This branch's own `FactorBuilder`,
with its `Select` for the sample, was dropped: main's widget covers the 2×3 grid, the legs and the gap. The value
premium by period is now a prose paragraph after the widget, with the same numbers, tested on main's `sortView`.
The "Try this" now says "pick HML" (main's widget opens on SMB) and cites the gap as 0.01 points, as main's readout
rounds it (it was 0.005 at three decimals).

**Readings.** Fama & French (1992) and Cochrane (2011) were read with `pdftotext -layout`. The Cochrane PDF in
`source/papers/` is the *Journal of Finance* version (vol. 66, pp. 1047 onwards), not the NBER working paper the spec
names, so the page numbers cited (pp. 1058, 1060) are journal pages. Fama & French (1993) and (2015) were not opened;
the chapter takes their factor definitions only from these French library pages:
`Data_Library/f-f_5_factors_2x3.html`, `six_portfolios.html`, `six_portfolios_me_op.html`, `six_portfolios_me_inv.html`
and `tw_5_ports.html` (all under https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/). The five-factor page
cites the model as "Fama and French, 2014"; the chapter uses (2015) as `docs/CURRICULUM.md` and `docs/DATA.md` do.

**Chapter 17** is merged, so the chapter links it (the cross-sectional $R^2$ point).

**Mismatches and candidates (not edited, per the spec).**
- The curriculum's Key math writes $b_i\,MKT_t + s_i\,SMB_t + h_i\,HML_t$. The style guide reserves $\beta_{i,k}$
  for factor exposures and uses $b$ for SDF loadings and predictive slopes, so the chapter writes
  $\beta_{i,\text{MKT}}, \beta_{i,\text{SMB}}, \beta_{i,\text{HML}}$. Candidates for the §3 table: $\text{MKT}_t$,
  $\text{SMB}_t$, $\text{HML}_t$, $\text{RMW}_t$, $\text{CMA}_t$ (factor names, coloured `\Factor`), and the curriculum's
  $b_i, s_i, h_i$ if the owner prefers them.
- Local symbols used once and defined in place: $R_{\text{SL},t}$ etc. for the six legs, and $a$, $c$, $e$ for the
  size part, B/M part and leftover in the cancellation argument.
- No new colour token. The diverging scale pairs `--c-return` and `--c-error`; §4 has no diverging pair, so a
  candidate is to name one there.

**Deviations.** The chapter reuses main's `FactorBuilder`, so the sample selector is gone and the value premium by
period is shown in prose, not in a widget. Re-add a sample `Select` as its own widget if the owner wants it.

**Verified revision.** The merge commit of `origin/main` at `0a3d024` into this branch, with `npm ci`, `npm test`,
`npm run build`, both page scripts and the greps above run on it in one session; this outcome-only commit follows
it. Not checked: GitHub Actions (not read, by rule).

**Proposed follow-ups.**
- Add $\text{SMB}$, $\text{HML}$, $\text{RMW}$, $\text{CMA}$ and a diverging colour pair to `docs/STYLE_GUIDE.md`.
- Refresh the French monthly files on one day (issue #57).
- Main's `FactorBuilder` readout wraps into a narrow column at 360px; a stacked layout on phones would read better.
