# TASK-014 outcome

## Acceptance

- [x] `npm test` and `npm run build` pass. Vitest: 8 files, 141 tests pass,
  including the six tests of `tests/chapter09-numbers.test.ts`. `astro check`
  reports 0 errors, 0 warnings and 0 hints; the static build writes 2 pages.
- [x] `npm run screenshots -- 09-time` passes with four ✓ lines (dark/light ×
  desktop/phone) and no console, KaTeX or overflow error. What I saw:
  - Dark desktop: the prerequisites callout, then the six sections. The
    scatter shows 99 blue return dots, a pink fitted line and thin red
    residuals on the goyal-welch-annual data; the readout gives slope 0.042,
    Newey–West SE 0.045, t 0.94, R² 1.2%, 99 observations, dp years 1926–2024.
    The horizon widget opens on the simulation (seed 1): blue estimates with
    ±2 SE bars rise to 0.633 at ten years above the dashed pink true curve
    (0.304). All display math renders; the quizzes and recap are readable.
  - Light desktop: the same content with the light palette; the dashed model
    line is magenta, the estimates blue, the `dp` symbol green. Contrast is good.
  - Dark and light phone (375 px): both widgets fit the width. The controls
    stack (slider, then the data switch, re-roll button, standard-error select);
    the readout grid wraps "1926–2024" to two lines but nothing overflows. The
    horizon chart labels every second tick (1, 3, 5, 7, 9).
- [x] `npm run clickthrough -- 09-time` passes and reports both widgets:
  "Does today's dividend–price ratio forecast returns?" (9 actions at 1280 px and
  at 360 px: horizon slider, both data options, re-roll, standard-error select)
  and "Slopes and R² grow with the horizon" (5 actions at each width). The slider
  is printed as `Horizon kkk`; that is the known script defect
  all-explained/empirical-finance-lbs#16 (it reads KaTeX `textContent`), not a
  chapter defect.
- [x] The six `section-tag` headings are in template order
  (`grep -n 'section-tag'`): line 26 Hook, 40 Intuition, 68 Formalisation,
  163 Playground, 215 Check yourself, 241 Recap & next up.
- [x] No hex colour: the spec's grep over the chapter, `PredictiveRegression.tsx`,
  `HorizonCurve.tsx` (and `predictiveSample.ts`) prints `no hex colours`. The
  widgets colour only through `var(--c-return)`, `--c-model`, `--c-error`,
  `--c-signal`, `--c-data` and `--text-muted`.
- [x] Real data and a seeded simulation are both on the screenshots:
  `PredictiveRegression` opens on goyal-welch-annual (caption: "Data:
  goyal-welch-annual … 1926–2025"); `HorizonCurve` opens with
  `initialSource="sim"` on seed 1 (readout "Seed 1", caption "Simulated
  (seeded)"). The simulation draws through `simulatePredictive` with the seed,
  which uses `src/lib/math/rng.ts`.
- [x] Voice review: see `## Voice review` below.
- [x] Numbers table: see `## Numbers in the prose` below.
- [x] Prose length: 2,326 words, inside 1,500–3,000. Command (drops the
  frontmatter, imports and `$$` display blocks; counts callouts, try-this
  paragraphs and quizzes):
  `awk 'NR>8' src/content/chapters/09-time-varying-expected-returns.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted
  under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1:

| Rule | Line in the chapter |
| --- | --- |
| Picture first, then the formula | "The test is a picture. Each dot is one year." (the scatter widget comes before any equation) |
| Data before theory | "At the end of 1931, the dividends of the US stock market were 10.1% of its price." |
| One idea per section | The Formalisation subsections each carry one idea: "Why the slope grows with the horizon", "Why $R^2$ grows too", "What the $t$-statistic can and cannot tell you". |
| Start with a question the reader has | "When prices are high compared with dividends, should you expect lower returns?" |
| Write to "you", short sentences, explain terms | "That ratio, dividends over price, is the **dividend–price ratio**." Chapters 4 and 5 do not exist, so the opening callout recaps them in plain words instead of linking. |
| Give the honest version | "The two numbers are close but not equal, because the model is a simplification and 100 years are few." |
| Say what the evidence can and cannot show | "At ten years, the classical $t$-statistic is 3.43, the Newey–West one is 1.63 and the Hansen–Hodrick one is 1.44. Only the first one looks impressive, and it is the wrong one." |
| Don't skip steps in derivations | "Two years ahead, apply the same rule to that forecast:" followed by the $\mathbb{E}_t[dp_{t+2}]$ step, then the general $\phi^{j}$ step and the geometric sum. |
| Graduate rigour comes in gradually (●● Part) | "The last step is the sum of a geometric series." Only algebra and the AR(1) are used. |
| Papers in our own words | "Cochrane (2011, p. 2) reads the evidence this way. High prices compared with dividends have been followed by years of poor returns, and low prices by years of good ones." |

Lines changed after re-reading:

- "The slope is 0.042 and the $t$-statistic is 0.94." became "… and the
  Newey–West $t$-statistic is 0.94." (rule: report which standard errors).
- "The slope is 0.39 and the $R^2$ is 11.8%." became "The slope is 0.39, with a
  Newey–West $t$-statistic of 1.63, and the $R^2$ is 11.8%." (same rule: no
  estimate without its test).
- Further reading "Campbell (2018), Ch. 5" became "Campbell (2018)", the short
  form the spec asks for.

## Numbers in the prose

All `test` rows are assertions in `tests/chapter09-numbers.test.ts` (run with
`npm test`), which recompute each number from `src/data/series/goyal-welch-annual.json`
through `dataSample`, `horizonSlopes`, `predictiveRegression`,
`impliedHorizonSlope`, `arithmeticMean` and `sampleVariance`.

| Number in the prose | Where | Source |
| --- | --- | --- |
| dp = 10.1% at end-1931 | Hook | test "hook" (`exp(dp[1931])`) |
| 1.1% at end-1999 (the minimum) | Hook, "the 1999 low" | test "hook" (also asserts `min(dp) = dp[1999]`) |
| 1.15% at end-2025 | Hook | test "hook" |
| 6.8% at end-1949 | Hook | test "hook" |
| stocks grew 4.8 times as much as T-bills, 1950–1959 | Hook | test "hook" (`exp(sum r 1950–1959)`) |
| stocks ended 29% behind T-bills, 2000–2009 | Hook | test "hook" (`1 − exp(sum r 2000–2009)`) |
| 100 years; 1926–2025 | Hook, Formalisation, Playground, Recap | test "hook" (`years[0]=1926`, last 2025, length 100) |
| one-year slope 0.042, NW t 0.94, R² 1.2%, 99 observations | Intuition, Playground, Recap, Try this | test "regressions on the full sample" (`h1`) |
| horizons 1, 5 and 10 years; 1 to 10 years | Try this, Playground | slider and `HORIZONS` range in the widgets |
| one-year return SD 19.3%, mean 6.5% | Intuition; "6.5% a year" again in Playground | test "moments" |
| ten-year slope 0.39, NW t 1.63, R² 11.8% | Intuition, Formalisation, Playground, Recap, quiz | test "regressions on the full sample" (`h10`) |
| φ = 0.92, φ¹⁰ = 0.45, ratio 7.2, implied slope 0.30 | Formalisation, Playground | test "AR(1) horizon link" |
| 90 observations at ten years | Formalisation | test "regressions" (`h10.nobs = 90`) |
| "nine of their ten years" | Formalisation, quiz | arithmetic: windows k = 10 apart by one year share k − 1 = 9 |
| returns 1927–2025 hold 9 non-overlapping decades | Formalisation | test "regressions" (`floor((r.length − 1)/10) = 9`) |
| classical t 3.43, Hansen–Hodrick t 1.44 | Formalisation, quiz | test "regressions" |
| two Newey–West standard errors; ±2 | Playground | `HorizonCurve.tsx` (bars at `slope ± 2·standardError`) |
| seed 1: ten-year estimate 0.63, NW t 3.02; truth 0.30 | Playground Try this | test "seeded simulation" (`DEFAULT_SEED = 1`) |
| "four times, to seed 5": −0.49, t −2.13 | Playground Try this | test "seeded simulation"; re-roll adds 1 to the seed (1 → 5 is four presses) |
| "twice the truth" | Playground | 0.63 / 0.30 ≈ 2.1 from the two tested values |
| Cochrane (2011) sample 1947–2009, Table I, p. 1 | Playground | read in `Cochrane2011.pdf` (`pdftotext -layout`): Table I caption on printed page 1 |
| 1947–2009 on our data: slope 0.12, NW t 2.46, R² 10.1% (63 obs.) | Playground | test "returns 1947–2009" |
| Cochrane (2011, p. 2) reading | Playground | read on printed page 2 of `Cochrane2011.pdf` (Figure 1 discussion) |
| SD of dp 0.50; 2.1 percentage points | Playground | test "moments" (`sd·b1`) |
| "an investor in 1950" | Playground | illustrative year, no estimate |
| Welch and Goyal (2008, p. 1455) | Playground | read in `GoyalWelch2008.pdf`: abstract on journal page 1455 (the next page prints 1456) |
| 1950 and 1951, "share four years" | Prerequisites callout | illustrative: two five-year windows one year apart share 4 years |
| quiz 1: φ = 0.5, b₁ = 0.1, b₂ = 0.15 | Check yourself | hand arithmetic, `b1(1+φ)`; the formula is `impliedHorizonSlope` (tested in TASK-012) |
| quiz 2: classical t 3.4, "99%", "50%" | Check yourself | 3.4 is 3.43 rounded (tested); 99% and 50% are wrong distractors |
| Chapters 4, 5, 10 | Callout, Next up | chapter numbers in `docs/CURRICULUM.md` |

## Summary

What: chapter 9, `src/content/chapters/09-time-varying-expected-returns.mdx`,
with two widgets, `src/components/plots/PredictiveRegression.tsx` and
`src/components/plots/HorizonCurve.tsx`, one shared loader hook
`src/components/plots/predictiveSample.ts`, and the prose-number test
`tests/chapter09-numbers.test.ts`.

How: both widgets load `goyal-welch-annual` once through the typed loader
(`loadSeries`) and compute only through `goyalWelchAnnualPredictors`,
`forwardSums`, `predictiveRegression`, `horizonSlopes`, `fitAR1`,
`impliedHorizonSlope`, `simulatePredictive` and `ols`. The simulation is an AR(1)
world calibrated to the data (same length, φ, b₁ and shock sizes) and seeded,
so the "true" slope curve is known. It opens the Playground so the reader sees
how far one draw of 100 years can wander from the truth. The data path opens
the Intuition scatter.

Prerequisites with no chapter file: the build passes and the page shows
"Builds on Ch. 4, Ch. 5" as plain text, with no link to a missing page. No
defect found; no shared code changed.

Deviations: none from the spec. Campbell (2018) is listed under further reading
only; no fact is taken from it. Stambaugh bias is not explained; the later
chapters are named only as "later chapters".

Mismatches to report: none found between the chapter and `docs/CURRICULUM.md`
or `docs/STYLE_GUIDE.md`. The `warning` callout renders with the heading
"Common mistake"; the text reads correctly under it.

Verified revision: the head of this PR's branch (tests, build, screenshots and
clickthrough were re-run on the final chapter text).

Follow-ups: fix all-explained/empirical-finance-lbs#16 so the click-through
names math labels once ("Horizon k").
