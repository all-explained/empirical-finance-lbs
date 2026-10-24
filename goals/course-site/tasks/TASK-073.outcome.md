# TASK-073 outcome

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: on the rebased branch, after `npm ci`, `npm test`: 48 test files and 522 tests passed. `npm run build`:
  "Result: 0 errors, 0 warnings, 1 hint" (the hint is an unused import in `src/lib/finance/news.ts`, not in this task's files).
- [x] `npm run screenshots -- 19-size-and-value` passes in both themes at desktop and phone size, and the images were inspected.
  Evidence: four `✓ chapters_19-size-and-value-{dark,light}-{desktop,phone}.png`. I read the desktop crops of both widgets
  and the quizzes, and extra Playwright captures of each widget at 1280px and 360px in both themes, in a changed
  state (SortGrid on Alpha + FF5; FactorBuilder on HML from 2007-01). Two phone problems were found and fixed: the
  SortGrid axis title was cut off at 360px, and the FactorBuilder readout wrapped into a narrow column.
- [x] `npm run clickthrough -- 19-size-and-value` passes and reports every widget of the chapter.
  Evidence: "TWENTY-FIVE PORTFOLIOS SORTED ON SIZE AND VALUE · 5 actions at 1280px, 5 actions at 360px" (Colour by:
  Mean excess return, Alpha; Model: CAPM, FF3, FF5) and "FROM SIX PORTFOLIOS TO ONE FACTOR · 7 actions at 1280px,
  7 actions at 360px" (Factor: SMB, HML; select Sample).
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` gives lines 15 Hook, 32 Intuition, 69 Formalisation, 172 Playground,
  214 Check yourself, 240 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the spec's command prints "no hex colours". The same grep on `factorModelSample.ts` finds nothing.
- [x] The widgets use real data from `ff25-size-bm-monthly`, `ff3-monthly`, `ff5-monthly` and `ff6-size-bm-monthly`.
  Evidence: `SortGrid` loads `ff3-monthly` and `ff25-size-bm-monthly` through `useFactorData` of `factorTestSample.ts`,
  and `ff5-monthly` with `loadSeries`; it computes through `modelPanel`, `timeSeriesRegressions` and `grs`.
  `FactorBuilder` loads `ff6-size-bm-monthly` and `ff3-monthly` (published SMB and HML) and rebuilds the factors with
  `sortFactors`. Captions name the dataset IDs and the sample.
- [x] The outcome holds a voice review and a table of every number in the prose with its test.
  Evidence: the sections "Voice review" and "Numbers in the prose" below.
- [x] The prose is 2,403 words, inside 1,500–3,000. Command (the one of chapters 9, 10, 13 and 16):
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
| Largest gap rebuilt vs published 0.005 points (HML and SMB, all months) | Playground | `playground` |
| HML 5.40% (1926-07 to 1963-06), 5.10% (1963-07 to 1990-12) | Playground, quiz, Recap ("over 5%") | `playground` |
| HML 2.32% ($t$ = 1.23) from 1991-01; −1.30% ($t$ = −0.50), 236 months, from 2007-01 | Playground, quiz, Recap | `playground` |
| 5% critical value "about 1.5" (1.52 for FF3 and FF5) | Playground | `playground` |

Not from our data: the breakpoints (NYSE median; 30th and 70th percentiles; NYSE quintiles), the June formation
and the definitions of the factors, operating profitability and investment, from the Kenneth French Data Library
pages listed below; "1963–1990" and the flat beta relation from Fama & French (1992, pp. 427–428).

## Summary

**What.** `src/content/chapters/19-size-and-value.mdx` (Part 5, chapter 19, difficulty 2, prerequisites 16 and 17),
the widgets `SortGrid.tsx` and `FactorBuilder.tsx`, the shared helper `factorModelSample.ts`, and
`tests/chapter19-numbers.test.ts`.

**How.**
- `factorModelSample.ts` holds `gridView` (built on `modelPanel`, `timeSeriesRegressions`, `grs`), `buildView`
  (built on `sortFactors` and `growthPath`), and the hooks `useModelData` (reuses `useFactorData` of
  `factorTestSample.ts`, adds `ff5-monthly`) and `useSortData`. The numbers test and the widgets call the same functions.
- `SortGrid`: 5×5 grid, `Segmented` for mean excess return or alpha and for CAPM, FF3 or FF5, on the common sample
  from 1963-07. Every cell carries its signed number; alphas with $|t| > 1.96$ add `*` and a border, so colour is
  never the only cue. The diverging scale uses `--c-return` (positive) and `--c-error` (negative) by opacity, with a
  gradient legend. The readout gives GRS, its 5% critical value, the p-value and the average absolute alpha.
- `FactorBuilder`: the six legs as a 2×3 grid (long legs: filled with a solid border and "long +½/+⅓"; short legs:
  dashed border and "short −½/−⅓"), and $1 compounded in the rebuilt factor (solid) and the published one (dashed) on a
  log scale. A `Select` picks the sample, so the reader sees the value premium change by period. The readout gives the
  mean, its $t$-statistic and the largest monthly gap. `kind="size-momentum"` loads `ff6-size-mom-monthly` and
  `mom-monthly` and offers UMD; I checked that it computes (1927-01 to 2026-08, 1,196 months), but no chapter renders
  it yet.

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

**Deviations.** None from the scope. The spec's hex-colour command also lists files that exist only on `origin/main`
when the branch is behind it; after the rebase it runs clean.

**Verified revision.** `88af889` (chapter, widgets, helper and test), rebased on `origin/main` at `0782309`; this
outcome-only commit follows it. One run of `npm test` in the same session had six 5-second timeouts in other
chapters' heavy tests (chapters 11 and 14, `cay.test.ts`) while the machine's load average was about 41; the rerun
passed all 522 tests. Not checked: GitHub Actions (not read, by rule).

**Proposed follow-ups.**
- Add $\text{SMB}$, $\text{HML}$, $\text{RMW}$, $\text{CMA}$ and a diverging colour pair to `docs/STYLE_GUIDE.md`.
- Refresh the French monthly files on one day (issue #57); until then `FactorBuilder` with `kind="size-momentum"`
  shows a 0.10-point gap in 2026-08.
