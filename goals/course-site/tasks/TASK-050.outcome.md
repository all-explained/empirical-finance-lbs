# TASK-050 outcome: Chapter 11: Cash-flow and discount-rate news

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings. After `npm ci`, Vitest
  runs 27 files and 301 tests, all passing, including the five tests of `tests/chapter11-numbers.test.ts`.
  `astro check`: "Result (93 files): 0 errors, 0 warnings, 1 hint" (the hint is an unused `Matrix` import in
  `src/lib/finance/news.ts`, library code outside this task); the static build ends with "Complete!".
- [x] `npm run screenshots -- 11-cash-flow` passes with four ✓ lines (dark/light × desktop/phone). I inspected the
  full pages (sliced) and widget-level shots in both themes at 1280 px and 360 px:
  - `NewsDecomposition`: one stacked bar per year 1927–2025, solid purple cash-flow news and light cyan minus
    discount-rate news, a neutral dot for the total, and a dashed marker on 2008. The readout gives −0.523,
    −0.271, −0.251 and the shares 39.2%, 39.8%, 21.0%. A first pass had only two y ticks (0%, −50%); I asked
    `niceTicks` for eight, so the axis now reads in steps of 20%.
  - `DogThatDidNotBark`: 2,000 grey null dots, the dashed identity line, the data's dot labelled "data" with
    dashed tail lines through it. The readout gives 0.046, −0.059; null 0, −0.105; 34.1%, 0.8%, 14.6% (data
    0.44); seed 1. A first pass drew the axis subscripts with the italic `Sub` helper, which looked like "ℓ" at
    12 px; they are now upright `b` with a subscript.
  - Phone: the controls stack under each plot, and the four φ options wrap to two rows. A Playwright check found
    nine display equations wider than their box at 360 px (one at 1280 px). I broke them over lines with
    `aligned`; the check then found 0 at both widths.
- [x] `npm run clickthrough -- 11-cash-flow` passes and reports both widgets: "Why did the market move this year?"
  (5 actions at 1280 px and at 360 px: the two samples and the year slider) and "The dog that did not bark"
  (7 actions at each width: the two samples, the four φ options, re-roll). A separate Playwright check pressed
  ArrowLeft twice on the year slider (2008 → 2006, readout "Unexpected return in 2006 +0.081") and pressed Enter
  on the "φ = 0.99" option (readout and `aria-label` show 73.6%).
- [x] The six `section-tag` headings are in template order (`grep -n 'section-tag'`): line 32 Hook, 48 Intuition,
  80 Formalisation, 240 Playground, 268 Check yourself, 294 Recap & next up.
- [x] No hex colour in the chapter or its widgets: the Verify `git diff … | xargs grep -nE '#[0-9a-fA-F]{3,8}\b'`
  prints "no hex colours". Colours are `var(--c-…)`, `var(--text)` and `var(--text-muted)` only.
- [x] Real data and seeded simulations. Both widgets load `goyal-welch-annual` through `loadSeries` and
  `goyalWelchAnnualPresentValue`. The only simulation is `simulateDogNull`, seeded with `DEFAULT_SEED = 1` and a
  re-roll button that increments the seed; the readout shows the seed.
- [x] The voice review and the numbers table are below.
- [x] Prose length: 2,571 words, inside 1,500–3,000. Command (the chapter 9 command: it drops the frontmatter,
  imports and display maths):
  `awk 'NR>8' src/content/chapters/11-cash-flow-and-discount-rate-news.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

### Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
| --- | --- |
| Picture first, then the formula | The Intuition widget shows the yearly bars and the 2008 split before Step 1 derives "$r_{t+1} - \mathbb{E}_t r_{t+1} = N_{CF,t+1} - N_{DR,t+1}$". |
| Data before theory | "In 2008, stocks in the S&P index lost 36.6%, dividends included." |
| One idea per section | Intuition carries one idea, "Higher expected returns from now on mean a lower price today"; Formalisation is split into four numbered steps, each with its own result. |
| Start with a question the reader has | "When the stock market moves, which kind of news is it reacting to?" |
| Write to "you", short sentences, explain terms | "The second is **discount-rate news**: news about the return that buyers expect to earn." Chapter 10 does not exist yet, so the opening callout recaps it in plain words; Chapters 5 and 9 are linked. |
| Give the honest version | "Cash-flow news is not measured directly. It is what is left after the VAR forecasts returns." |
| Say what the evidence can and cannot show | "These are classical OLS standard errors on 99 years." and "The dog test is strong evidence only if $dp$ is not too close to a random walk." |
| Don't skip steps in derivations | Step 2 writes both forecasts, subtracts them to get $A^j\varepsilon_{t+1}$, then sums the geometric series and says when it converges. Step 3 says why OLS slopes add. |
| Graduate rigour gradually (●● Part) | Matrix algebra of the VAR ($e_1'\rho A(I-\rho A)^{-1}$) with a plain reading: "The VAR reads it as news of higher future returns, because a high $dp$ forecasts high returns and stays high for years." |
| Papers in our own words | "Cochrane (2008, p. 9) builds a world where this null is true. … The shocks have the covariance seen in the data." |

### Every number in the prose

All tests are in `tests/chapter11-numbers.test.ts`. "Data" below means `goyal-welch-annual` through
`src/components/plots/newsSample.ts`, the module the widgets use.

| Number in the prose | Where | Test |
| --- | --- | --- |
| 2008: 36.6% loss, dividends included | Hook | `hook and intuition` |
| 1927 (first return year), 1927–2025, 99 years, 1873–2025 | Intuition, Formalisation | `samples` |
| 2008 news: −0.523, −0.271, −0.251 | Intuition (try this) | `hook and intuition` |
| 1996–1999: surprises 0.62, minus DR news 0.55, CF news 0.07 | Intuition | `hook and intuition` |
| Shares 39.2%, 39.8%, 21.0% ("about 40%" in the recap) | Intuition, Recap | `variance shares and news weights` |
| $\rho = 0.969$ | Step 2 | `samples` |
| $e_1'\rho A(I-\rho A)^{-1} = (0.28, 0.78)$ | Step 2 | `variance shares and news weights` |
| 1873–2025 shares 64.5%, 9.8%, 25.8% | Step 2 limits | `variance shares and news weights` |
| $b_r = 0.046$, s.e. 0.038, $t = 1.21$ | Step 3 | `three slopes and the identity` |
| $b_d = -0.059$, s.e. 0.022, $t = -2.75$ | Step 3, Step 4 | `three slopes and the identity` |
| $\phi = 0.924$, s.e. 0.043 | Step 3, Playground | `three slopes and the identity` |
| Identity holds within 0.0002 | Step 3 | `three slopes and the identity` |
| Null $b_d = \rho\phi - 1 = -0.105$ | Step 4 | `three slopes and the identity` |
| 2,000 seeded samples, seed 1 | Step 4 | `dog test: seeded tail shares` |
| 34.1% of samples beat $b_r$; 15 of 2,000 (0.8%) beat $b_d$ | Step 4, quiz 3 | `dog test: seeded tail shares` |
| $\phi = 0.99$: null $b_d = -0.041$, 73.6% beat $b_d$ | Playground, quiz 3 | `dog test: seeded tail shares` |
| $\phi = 0.95$: 7.4% | Playground | `dog test: seeded tail shares` |
| 1872–2025: $b_d = -0.088$, 4.2% | Playground | `three slopes…`, `dog test…` |
| Long-run slope beats the null in 14.6% (readout: data 0.44) | Playground | `dog test: seeded tail shares` |
| Cochrane: $b_d$ = 0.008 | Step 4 | From the paper: Cochrane (2008), NBER WP 12026, Table 2, printed p. 8 |
| Cochrane: about one sample in five beats $b_r$, fewer than one in fifty beats $b_d$, CRSP 1927–2004 | Step 4 | From the paper: printed p. 11, Table 3 (22.3% and 1.77%) |
| Quiz 1: $\rho = 0.96$, $\phi = 0.95$, answer −0.088; quiz 3: about −0.04 at $\phi = 0.99$ | Check yourself | Hand arithmetic in the question; not data |

## Summary

What: `src/content/chapters/11-cash-flow-and-discount-rate-news.mdx`, the widgets
`src/components/plots/NewsDecomposition.tsx` and `src/components/plots/DogThatDidNotBark.tsx`, their shared
`src/components/plots/newsSample.ts` (as `predictiveSample.ts` is for chapter 9), and
`tests/chapter11-numbers.test.ts`.

How:
- `newsSample.ts` slices `goyalWelchAnnualPresentValue` from the end of 1926 (default) or 1872, sets $\rho$ with
  `linearisationConstants` at the slice's mean $pd$, and calls only library functions: `newsDecomposition` on
  the VAR(1) in $(r, dp)$, `presentValueSlopes` for the data's slopes, `fitVAR1` for the null's shock
  covariance, `simulateDogNull` and `dogTailShares`.
- `NewsDecomposition` draws a diverging stack per year ($N_{CF}$ and $-N_{DR}$), a dot for the total, a year
  slider for one year's numbers, and the three variance shares.
- `DogThatDidNotBark` offers φ under the null as four options (the data's estimate, 0.95, 0.98, 0.99) rather than
  a slider, because one simulation of 2,000 samples takes about 0.3–0.5 s; a slider would recompute on every
  step.
- Colours: cash-flow news uses `--c-factor`, minus discount-rate news uses `--c-return` (it is news about future
  returns), null draws use `--c-prob`, the data's estimate `--c-data`, the identity line `--c-model`. Bars also
  differ by opacity and the readout names them in words.
- Readings: I opened both PDFs with `pdftotext -layout`. Page numbers are the printed numbers of the NBER working
  papers in `source/papers/` (Cochrane (2008) = NBER WP 12026; Campbell and Shiller (1988) = NBER WP 2100).
  Campbell (2018), Ch. 5 is listed under further reading only.

Deviations and mismatches:
- The dog-test null takes its shock covariance from `fitVAR1([dp, dd]).residualCovariance`, a VAR(1) in $dp$ and
  $\Delta d$. Cochrane (2008, p. 9) uses the residuals of the regressions on $dp_t$ alone. No library function
  returns the covariance of two residual series, and I did not add one (shared code is out of scope). The
  variances differ by 3–4%; the caption says which covariance is used.
- Our data differ from Cochrane's in an honest, visible way: on S&P index dividends, $b_d = -0.059$ (not about 0),
  and the long-run test is weaker (14.6%) than the dividend test. The chapter says so.
- `docs/STYLE_GUIDE.md` §3 lists $N_{CF}$ and $N_{DR}$ with no colour macro, and §4 has no token for news or
  dividends. The formulas leave $N$ uncoloured; the widget uses `--c-factor` for cash-flow news, which is not a
  factor. No mismatch between the curriculum's Key math and the notation table.
- The curriculum's Prereqs for chapter 11 is chapter 10, which is not written yet (TASK-049). The opening callout
  recaps it in plain words and links nothing that does not exist.

Verified revision: the PR head. Local Verify: `npm ci`, `npm test`, `npm run build`,
`npm run screenshots -- 11-cash-flow`, `npm run clickthrough -- 11-cash-flow`, the `section-tag` grep, the hex
grep and the tracked-PDF count. GitHub Actions were not read or used.

Proposed follow-ups:
- Add a colour token (and macro) for cash-flow news or dividends to `docs/STYLE_GUIDE.md` §4, so chapters 10 and 11
  do not borrow `--c-factor`.
- Export a residual-covariance helper (or return residuals from `presentValueSlopes`) so the dog-test null can use
  the single-predictor residuals, as in Cochrane (2008).
- Remove the unused `Matrix` import in `src/lib/finance/news.ts` (the one `astro check` hint).
