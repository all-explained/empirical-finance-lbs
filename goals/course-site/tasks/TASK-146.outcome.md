# TASK-146 outcome: Chapter 40, yields, forwards and bond returns

## Acceptance

Verified revision: `935008c` (the chapter commit and one notation fix, rebased on `origin/main` `53d6599`). The
outcome commit adds only this file. Every check ran on the MacBook: the chapter reads only the committed
`src/data/series/*.json` files, and each check took seconds to minutes.

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exit 0; `npm test` exit 0, `Test Files 87 passed (87)`, `Tests 974 passed (974)`, including
  `tests/notation.test.ts` and the new `tests/chapter40-numbers.test.ts` (10 tests). An earlier run, while the
  MacBook had a load average of 254 on 12 cores, failed 8 seeded-simulation tests of chapters 11, 18, 27, 32 and 34
  and two `src/lib` files, all with `Test timed out`; none of them touches this task, and the rerun at lower load
  passed them all. `npm run build` exit 0, `Result (254 files): 0 errors, 0 warnings, 1 hint`, `41 page(s) built`.
  The hint is the unused `Matrix` import in `src/lib/finance/news.ts`, outside this task and already reported as #88.
- [x] `npm run screenshots -- 40-yields-forwards-and-bond-returns` passes in both themes at desktop and phone size,
  and I inspected the images.
  Evidence: exit 0 with `✓` for `dark-desktop`, `dark-phone`, `light-desktop` and `light-phone`. I read the pages in
  crops: the whole light phone page, the dark phone widgets, and the top and both widgets on desktop in each theme.
  Every readout line fits at phone width, both widgets keep their plots inside the frame, and the quizzes and tables
  render. The five-column table of mean excess returns scrolls sideways on a phone, as every prose table does
  (`.prose > table` in `prose.css`). A Playwright check with every `<details>` open finds 14 display equations and
  none wider than its box, at 375px and at 360px, and no page overflow.
- [x] `npm run clickthrough -- 40-yields-forwards-and-bond-returns` passes and reports every widget of the chapter.
  Evidence: exit 0. `THE YIELD CURVE, MONTH BY MONTH · 9 actions at 1280px, 9 actions at 360px` (segmented "Curve":
  Zero, Forward, Par; slider "Month"; buttons "◀ Back", "▶ Play", "Next ▶") and `BUY A BOND, SELL IT A YEAR LATER ·
  6 actions at 1280px, 6 actions at 360px` (sliders "Maturity at purchase n" and "Purchase month").
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` prints lines 21 Hook, 36 Intuition, 65 Formalisation, 304 Playground,
  326 Check yourself, 352 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the spec's `git diff --name-only origin/main -- 'src/components/plots/*.tsx' … | xargs grep -nE
  '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` prints `no hex colours`.
- [x] `YieldCurveMovie`, `BondReturnCalc` and the prose numbers use the committed `gsw-zero-coupon` and
  `fred-treasury-monthly` through `bondSample.ts`.
  Evidence: both widgets call `useBondView()` of `src/components/plots/bondSample.ts`, which loads the two series
  with `useSeriesData` and builds the curves with `gswCurve`, `forwardRates`, `parYields(curve, 2)` and
  `treasuryCurve` of `src/lib/finance/bonds.ts`. `BondReturnCalc` splits the return with `returnDecomposition`.
  `tests/chapter40-numbers.test.ts` reads the same two committed JSON files and calls `bondView`, the function
  `useBondView` wraps.
- [x] The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a
  table of every number in the prose with its test. Evidence: the two sections below.
- [x] The prose is 1,500–3,000 words (give the command).
  Evidence: 2,926 words. Command (the one of chapters 9, 10, 13, 16, 22, 26, 30, 33 and 36):
  `awk 'NR>8' src/content/chapters/40-yields-forwards-and-bond-returns.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).
  Evidence: it prints `0` and exits 1.

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition runs `YieldCurveMovie` ("Drag the month, or press play to step through all 479 of them.") before the Formalisation defines $y^{(n)}_t = -p^{(n)}_t/n$ and $f^{(n)}_t$. |
| Data before theory | The Hook opens on our data: "At the end of 2021, the US Treasury's 10-year zero-coupon yield was 1.59%. … your bond lost 17.16% of its value." |
| One idea per section | Each `###` carries one idea: "Prices and yields", "Forward rates", "Par yields", "The holding-period return and its three parts", "What bonds paid since 1985", "The expectations hypothesis", "Hindsight is not a test". |
| A question the reader has | "What does a yield tell you that a price does not? Why does a long yield usually sit above a short one?" |
| Write to "you", short sentences, link back | "Buy the $n$-year bond at $t$. A year later it is an $(n-1)$-year bond, and you sell it." The callout links Chapter 1, and the prose links Chapters 4, 6, 8 and 35. |
| The honest version | "We interpolate it linearly and hold it flat below one year, an approximation the GSW file forces on us." |
| What the evidence can and cannot show | "Even so, 455 overlapping months hold only about 40 separate years. Only the 5- and 10-year means are more than 1.96 standard errors from zero." |
| No skipped steps | The return split names each added and subtracted term ("The second line adds and subtracts $(n-1)\,y^{(n)}_t$"), and a `<details>` block derives the constant expected excess return line by line. |
| Graduate rigour, with a plain reading | "The yield is what you earn if the bond's yield stays where it is." next to the exact three-part split. |
| Papers in our own words | "Campbell & Shiller (1991, working paper, pdf p. 6, eq. 1) state it this way." The chapter explains the hypothesis in its own words; no text, figure or table is copied. |

## Numbers in the prose

Every number from our data is recomputed in `tests/chapter40-numbers.test.ts` (10 tests, all pass) through
`bondView`, `slopes`, `inversions`, `meanExcessReturn`, `hindsight` and `treasuryRow` of
`src/components/plots/bondSample.ts`, and `logPrices`, `parYields`, `holdingReturns` and `returnDecomposition` of
`src/lib/finance/bonds.ts`.

| Number in the prose | Where | Test |
|---|---|---|
| 10-year yield 1.59% at 2021-12; loss 17.16% (10 years), 42.67% (30 years) | Hook, Recap | `hook: the 2021 loss and the slope of the curve` |
| 1985-11 to 2026-09, 479 months; 417 months (87.1%) upward, 62 inverted; mean gap 1.30 points | Hook, Recap | `hook: …` |
| 1985-11: 7.79% and 9.79%; 2021-04: 0.07%; 2023-06: 5.38%, 3.83%, −1.55 points, the deepest | Intuition (Try this) | `intuition: the try-this months and the inversion spells` |
| Nine inversion spells: 1989 (two), 2000, 2006–07 (two), 2019 (two), 26 months 2022-07 to 2024-09, 2024-11 | Intuition | `intuition: …` |
| 2026-09: $y^{(10)}$ 5.28%, $p^{(10)}$ −0.528, $P^{(10)}$ 0.590, $P^{(30)}$ 0.183 | Formalisation | `formalisation: prices, yields and forward rates in 2026-09` |
| 2026-09: $y^{(1)}$ 4.56%, $y^{(2)}$ 4.84%, $f^{(2)}$ 5.12% | Formalisation | `formalisation: prices, yields and forward rates…` |
| 2026-09: $f^{(10)}$ 5.84% vs 5.28%; $f^{(30)}$ 4.90% vs 5.66%; the curve dips from 29 to 30 years | Formalisation, Intuition (Try this too) | `formalisation: prices, yields and forward rates…` |
| 2026-09 10-year par 5.31% (semi-annual), 5.38% (annual) | Formalisation | `formalisation: par yields against zero yields and FRED` |
| Zero vs par: 0.06 points on average, at most 0.29; FRED vs GSW par: 402 months, 0.15 on average, at most 0.91 | Formalisation | `formalisation: par yields…` |
| 2021-12, 10 years: yield 1.59%, roll-down 0.41%, shift −20.82%, log −18.82%, excess −19.24%, simple −17.16%; 9-year 1.54% → 3.86%, about 2.3 points; 1-year 0.42% | Formalisation, Playground | `formalisation: the Hook bond split into its three parts` |
| 455 purchase months, 1985-11 to 2025-09; the table of mean, standard error, t-statistic and SD for 2, 5, 10, 20, 30 years | Formalisation, Recap | `formalisation: mean excess returns since 1985 and the help from the shift` |
| 10-year mean log return 6.54% = yield 4.81% + roll-down 0.84% + shift 0.89% | Formalisation | `formalisation: mean excess returns…` |
| Hindsight, 10 years: 306 months 1985-11 to 2017-09; 9.79% vs 6.36%; 2007-06 5.07% vs 0.97%; mean gap 2.26, positive in 290 | Formalisation | `formalisation: the perfect-foresight yield, in hindsight` |
| Hindsight, 5 years: mean gap 0.92, positive in 308 of 385 | Formalisation | `formalisation: the perfect-foresight yield…` |
| 2021-12, 30 years: 2.06%, 0.35%, −58.06%, −55.64%, −42.67% | Playground (Try this) | `playground: the try-this prompts and the losing years` |
| 2023-10, 10 years: 4.96%, 0.41%, +5.81%, 11.17% log, 11.82% simple | Playground (Try this too) | `playground: …` |
| Losing years: 104 of 455 (10 years), 158 (30 years) | Playground | `playground: …` |
| Quiz: $f^{(2)} = 2 \times 5\% - 4\% = 6\%$ | Check yourself | `check yourself: the forward-rate quiz` |

The other numbers are not data: the 11 Hansen–Hodrick lags (twelve months less one), "about 40 separate years"
(455/12), 1.96, and the quiz values of 4% on a flat curve.

## Summary

**What.** `src/content/chapters/40-yields-forwards-and-bond-returns.mdx` (six template sections, 2,926 words, three
`Quiz` questions). The widgets `YieldCurveMovie` and `BondReturnCalc`. The shared hook
`src/components/plots/bondSample.ts` (`useBondView`, built on `useSeriesData`, for chapters 40 to 42), and
`tests/chapter40-numbers.test.ts`.

**How.**
- `bondView` builds the GSW zero curve, the forward curve and the par curve with semi-annual coupons, which is
  FRED's convention, and FRED's constant-maturity curve. `meanExcessReturn` takes Hansen–Hodrick standard errors
  with 11 lags through `ols` of `src/lib/stats/ols.ts`. `hindsight` wraps `perfectForesightYield`.
- `YieldCurveMovie` has a fixed 0–12% axis, so the movie never rescales; a test checks that every curve and every
  FRED yield lies inside it. FRED's yields are rings, and the readout names "solid: GSW" and "rings: FRED", so colour
  is never the only cue. The movie plays only when you press play, and it draws each month without tweening, so
  nothing moves on its own under `prefers-reduced-motion`.
- `BondReturnCalc` draws the curve at purchase solid and the curve at sale dashed, and its readout adds the yield,
  the roll-down and the shift to the log return, then subtracts $y^{(1)}_t$ for the excess return.
- Readings opened with `pdftotext -layout`: Cochrane & Piazzesi (2005), notation on journal pp. 140–141 (pdf pp.
  3–4); Campbell & Shiller (1991), NBER working paper 3153, eq. (1) on pdf p. 6 and coupon bonds as portfolios of
  zero-coupon bonds on pdf p. 15. Campbell, Lo & MacKinlay (1997), Ch. 10, and Cochrane (2005), Ch. 19, are listed
  under further reading only.

**Notation.** All symbols are in the "Bonds and the term structure" table of `docs/STYLE_GUIDE.md` §3, so this PR
does not change the style guide. Campbell & Shiller call the constant of the expectations hypothesis $c$; §3
reserves $c$ for log consumption, so the chapter writes it as $\mathit{tp}^{(n)}$, the §3 term premium, with no date
because it is constant. The discount factor of the par yield is the zero price $P^{(m)}_t$, not $d(m)$, because §3
reserves $d$ for the log dividend. $k$ (coupons a year) and $m$ (a maturity that need not be whole) are local
letters that §3 does not use.

**Deviations and mismatches.**
- The curriculum's Key math writes the hypothesis with "+ const"; the chapter names it $\mathit{tp}^{(n)}$, as
  above.
- The chapter also links Chapter 4 (Newey–West), whose flat-weight Hansen–Hodrick note it uses for the standard
  errors. The spec named Chapters 1, 6, 8 and 35; the extra link is true of the merged site.
- Chapter 41, *Testing the expectations hypothesis*, is named by title, only in "Recap & next up".

**Verified revision.** `935008c`, with every check above run on the MacBook.

**Follow-ups.** None.
