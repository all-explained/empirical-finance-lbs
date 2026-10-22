# TASK-022 outcome: Chapter 2: Expected return and risk

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  After `npm ci` (exit 0), Vitest reports 11 files and 158 tests passed, including the 4 tests of
  `tests/chapter02-numbers.test.ts`. `npm run build` exits 0: `astro check` prints "0 errors, 0 warnings,
  0 hints", and Astro builds 4 pages.
- [x] `npm run screenshots -- 02-expected` passes in both themes at desktop and phone size, and I inspected
  the images. It prints four ✓ lines (dark/light × desktop/phone) with no console, KaTeX or overflow error.
  I also took element screenshots of each widget state with Playwright (dark and light, 1280 px and 360 px).
  What I saw:
  - `SamplingErrorMean` opens at T = 600 on seed 1. Grey histogram bars (`--c-prob`, 25% fill) centre on
    the dashed pink "true mean" line at 6%. The blue market dot sits at 8.6% with a ±2 s.e. bar of about the
    same width as the cloud. At T = 60 the bars span about −21% to +29%; at T = 1200 they are a narrow spike.
    The x axis stays fixed, so the narrowing is visible. The readout matches the prose (2.2%, 37% vs 3%, 21% at
    T = 60).
  - `DistributionExplorer` "whole": blue bars with a tall middle above the dashed pink normal, and ±3 SD lines.
    "Left tail": isolated bars down to −28.7% while the normal curve is flat at zero. "1947 on": skewness
    −0.49, excess kurtosis 1.66, worst month October 1987.
  - Phone (360 px): controls stack below the plot, nothing overflows, and the plot labels do not overlap. The
    readout grid wraps long values onto several lines (the shared `readout-grid` layout), but stays readable.
  - Light theme: same content; the bars, lines and labels keep enough contrast.
  - Fixed after the first inspection: a tail bar drew above the plot frame (heights are now clamped to the
    frame), the "true mean", "market" and y-axis labels overlapped on the phone, and the SVG glyph "σ̂" rendered
    badly (the plot labels now say "SD").
- [x] `npm run clickthrough -- 02-expected` passes and reports both widgets:
  "HOW PRECISE IS A SAMPLE MEAN?" (4 actions at 1280 px and at 360 px: slider "Sample length T", button
  "Re-roll simulation") and "ARE MONTHLY RETURNS NORMAL?" (6 actions at each width: segmented "Show" options
  whole, left tail, right tail; segmented "Sample" options all months, before 1947, 1947 on).
- [x] The six `section-tag` headings are in template order (`grep -n 'section-tag'`): line 15 Hook,
  32 Intuition, 67 Formalisation, 208 Playground, 244 Check yourself, 270 Recap & next up.
- [x] No hex colour: the spec's grep over the chapter, `SamplingErrorMean.tsx` and `DistributionExplorer.tsx`
  prints `no hex colours`; the helper `meanSampling.ts` has none either. The widgets colour only through
  `var(--c-prob)`, `--c-model`, `--c-data`, `--text-muted` and the `.good`/`.bad` classes.
- [x] Real data and seeded simulation: `DistributionExplorer` and the market marker of `SamplingErrorMean`
  load `ff3-monthly` through `loadSeries` (captions name the dataset and Jul 1926–Aug 2026). The simulation
  in `SamplingErrorMean` draws from `normalRng(seed)` in `src/lib/math/rng.ts`, starts at seed 1, shows the
  seed in the readout and has a "Re-roll simulation" button.
- [x] Voice review: see `## Voice review`. Numbers table: see `## Numbers in the prose`.
- [x] Prose length: 2,388 words, inside 1,500–3,000. Command (drops the frontmatter, imports and `$$`
  display blocks; counts callouts, try-this paragraphs and quizzes):
  `awk 'NR>8' src/content/chapters/02-expected-return-and-risk.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1:

| Rule | Line in the chapter |
| --- | --- |
| Picture first, then the formula | "The widget draws all 1,000 samples. The grey bars show where their averages land." (the sampling widget comes before $\mathrm{se} = \sigma/\sqrt{T}$) |
| Data before theory | "Chapter 1 found that, from July 1926 to August 2026, the US stock market beat one-month Treasury bills by 0.70% a month on average." |
| One idea per section | Each Formalisation subsection carries one idea: "The sample mean and its standard error", "Why more frequent data does not help the mean", "Why the volatility is easy", "The Sharpe ratio", "Skewness and fat tails". |
| Start with a question the reader has | "If you plan your savings around that number, how much should you trust it?" |
| Write to "you", short sentences, explain terms | "The **standard error** is the square root of this variance, the typical size of the estimation error." Chapter 1 exists, so it is linked, not recapped. |
| Give the honest version | "We assume for now that the months are independent draws with the same mean … Chapter 4 relaxes the independence." |
| Say what the evidence can and cannot show | "The mean is 4.5 standard errors above zero, so a century is enough to say that the premium is positive. It is not enough to say how big it is." |
| Don't skip steps in derivations | The `se(σ̂)` derivation lists every step in a `<details>` block (Var(Y) = E[Y²] − (E Y)², kurtosis, the square-root derivative, substitution, the 1/T term). |
| Graduate rigour comes in gradually (● Part) | Only sums, variances and one derivative of the square root; no matrices. |
| Papers in our own words | No paper result is shown. Campbell (2018) and Campbell, Lo and MacKinlay (1997) are not in `source/papers/`, so they are listed under further reading only, and no fact is taken from them. |

Lines changed after re-reading:

- "It is the most famous number in finance" became "one of the most famous numbers" (honest version).
- "The worst, September 1931, lost 28.7%" became "had an excess return of −28.7%", and the same for April
  1933: the widget shows excess returns, not total returns.

## Numbers in the prose

All `test` rows are assertions in `tests/chapter02-numbers.test.ts` (run with `npm test`). They recompute each
number from `src/data/series/ff3-monthly.json` through `marketExcess` (`ff3MarketReturns`, `excessReturn`),
`arithmeticMean`, `sampleVariance`, `meanStandardError`, `sharpeRatio`, `annualiseMean`,
`annualiseVolatility`, `annualiseSharpe`, `skewness`, `excessKurtosis` and `cdf`, and from the seeded
simulation through `simulateSamples` and `sampleMoments`.

| Number in the prose | Where | Source |
| --- | --- | --- |
| July 1926 to August 2026; 1,202 months | Hook, Formalisation, Playground | test "hook" (first and last date, length) |
| 0.70% a month; 8.3% a year | Hook, Formalisation, Recap | test "hook" |
| standard error 1.8% a year; range 4.7% to 12.0% | Hook, Formalisation, Recap | test "hook" (mean ± 2 s.e., annualised) |
| volatility 18.4% a year, "give or take less than one percentage point" | Hook, Formalisation | test "hook" (σ̂ × √12; fat-tail se(σ̂) × √12 < 1 point) |
| true mean 0.5% and volatility 4.5% a month; 6.0% and 15.6% a year | Intuition | test "seeded simulation" (`TRUE_MEAN`, `TRUE_VOL`, annualised) |
| 1,000 samples; "the other 999" | Intuition | test "seeded simulation" (`SAMPLES = 1000`) |
| T = 600 (50 years): spread 2.2% a year | Intuition | test "seeded simulation" (seed 1) |
| T = 150: spread 4.5%, "doubles"; "a quarter of the data" | Intuition | test "seeded simulation" (ratio ≈ 2); 150 = 600/4 |
| T = 60 (five years): 21% of means below zero | Intuition | test "seeded simulation" |
| 37% vs 3%; "more than ten times as precise" | Intuition | test "seeded simulation" (ratio > 10) |
| market bar "about as wide as the cloud" | Intuition | test "seeded simulation" (market s.e. over the last 600 months = simulated spread, both 2.2%) |
| waves 4.5% a month, drift 0.5% a month | Intuition | same constants as the simulation |
| σ̂ = 5.30% a month; se = 0.15% a month; 1202 | Formalisation | test "formalisation" |
| t-statistic 4.5 | Formalisation | test "formalisation" |
| "about 95%" for ±2 standard errors | Formalisation | normal approximation: 2Φ(2) − 1 = 0.954 (textbook fact, stated as "about") |
| 12 months; √12 | Formalisation, Recap, quiz 2 | definition of annualising (`annualiseMean`, `annualiseVolatility`, tested in TASK-018) |
| 100 years | Formalisation | test "formalisation" (1202/12 rounds to 100) |
| (18.4/1)², about 340 years | Formalisation | test "formalisation" (`toBeCloseTo(340, -1)`) |
| normal kurtosis 3, excess kurtosis 0, skewness 0 | Formalisation | definitions |
| 1/√(2T) = 2.0% | Formalisation, Playground | test "formalisation" |
| standard error 22% of the mean | Formalisation | test "formalisation" |
| SR = 0.13 a month; 0.45 a year | Formalisation, Recap | test "formalisation" |
| Sharpe ratio give or take 0.10 | Formalisation, Recap | test "formalisation" (annual s.e. / annual volatility) |
| 1.6 months expected beyond −3σ; 11 observed (6 above +3σ in the widget) | Playground, Recap | test "playground" |
| September 1931: −28.7%, 5.6 standard deviations | Playground | test "playground" |
| April 1933: +38.8%, 7.2 standard deviations | Playground | test "playground" |
| skewness 0.15; excess kurtosis 7.4 | Playground, Recap | test "playground" |
| 39% of months negative | Playground | test "playground" |
| before 1947: skewness +0.49; from 1947: −0.49, excess kurtosis 1.7 | Playground | test "playground" |
| volatility 28.1% a year before 1947, 14.9% from 1947 | Playground | test "playground" |
| se(σ̂) 4.4% of its size; "five times better than the mean" | Playground | test "playground" (√((2 + 7.37)/(4T)); 22% / 4.4% rounds to 5) |
| "several" five-standard-deviation months | Playground callout | test "playground" (at least 3 months with \|z\| > 5) |
| three standard deviations | Playground, Recap | the widget's ±3 SD lines (`DistributionExplorer.tsx`) |
| quiz 1: 25 → 100 years; distractors 50, 35 | Check yourself | hand arithmetic: 4 × 25 = 100 (the 1/√T rule) |
| quiz 2: 0.2 → 0.69; distractors 2.4, 0.2, 0.058 | Check yourself | hand arithmetic: √12 × 0.2 = 0.693; 12 × 0.2 = 2.4; 0.2/√12 = 0.058 |
| quiz 3: 20 years | Check yourself | illustrative |
| Chapters 1, 3, 4 | Hook, Formalisation, Next up | chapter numbers in `docs/CURRICULUM.md` |

## Summary

What: chapter 2, `src/content/chapters/02-expected-return-and-risk.mdx`, with two widgets,
`src/components/plots/SamplingErrorMean.tsx` and `src/components/plots/DistributionExplorer.tsx`, one shared
helper `src/components/plots/meanSampling.ts` (ff3 loader hook and the seeded simulation), and the
prose-number test `tests/chapter02-numbers.test.ts`.

How:
- Both widgets load `ff3-monthly` once through `loadSeries` and compute through `src/lib` only:
  `ff3MarketReturns`, `excessReturn`, `arithmeticMean`, `sampleVariance`, `meanStandardError`,
  `annualiseMean`, `annualiseVolatility`, `skewness`, `excessKurtosis`, `histogram`, `pdf` and `cdf`.
- `SamplingErrorMean` draws 1,000 seeded samples of 1,200 months from the style guide's default world
  (0.5% mean, 4.5% volatility a month) with `normalRng`. A sample of T months is the first T draws of a row,
  so moving the slider extends the same samples instead of drawing new ones. The x axis is fixed and the y axis
  is tweened with `useTweened` (which respects `prefers-reduced-motion`). The readout puts the spread of the
  means next to the spread of the volatilities. The market marker uses the last T months of real data.
- `DistributionExplorer` shows the 40-bin histogram with the fitted normal scaled to months per bin, a
  left-tail and right-tail zoom beyond 2.5 standard deviations (tweened axes), and three samples: all months,
  before 1947, 1947 on.
- The chapter derives se(R̄) = σ/√T, the frequency argument se(12R̄) = σ_ann/√(T/12), the standard error of σ̂
  with the excess kurtosis (all steps in `<details>`), and SR_ann = √12 SR, with the limits stated each time
  (independent months, normal approximation, sample dependence of skewness).

Deviations: none from the spec. The prerequisite (Chapter 1) exists, so the chapter links to it and needs no
recap callout. No shared code changed.

Mismatches to report (not fixed, out of scope):
- `docs/STYLE_GUIDE.md` §3 has no symbol for skewness or excess kurtosis, and $\kappa$ is taken by the
  Campbell–Shiller constant. The chapter writes both in words ("excess kurtosis") instead of adding a symbol.
- The widgets write "SD" (standard deviation) in SVG plot labels, because the combining hat of "σ̂" does not
  render well in SVG text. Readouts keep $\hat\sigma$ through KaTeX.
- The shared `readout-grid` gives the label column most of the width at 360 px, so long values wrap onto
  three or four lines. This is the same in chapters 1 and 9; a shared CSS change could fix it.

Verified revision: the head of this PR's branch. Tests, build, screenshots and clickthrough were re-run on
the final chapter and widget code; this outcome file is the only later change.

GitHub Actions were not read or used as a delivery gate.

Follow-ups: none required. Optional: a symbol row for skewness and excess kurtosis in the style guide, if later
chapters need them in formulas.
