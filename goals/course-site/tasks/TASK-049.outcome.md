# TASK-049 outcome: Chapter 10: The Campbell–Shiller decomposition

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings. After `npm ci`, `npm test`
  printed `Test Files 27 passed (27)`, `Tests 301 passed (301)`. `npm run build` printed `- 0 errors`,
  `- 0 warnings`, `- 1 hint` and `[build] Complete!`. The one hint is an unused import `Matrix` in
  `src/lib/finance/news.ts` (TASK-047), outside this task.
- [x] `npm run screenshots -- 10-campbell` passes in both themes at desktop and phone size, and I inspected the
  images. It printed `✓` for `…-dark-desktop.png`, `…-dark-phone.png`, `…-light-desktop.png` and
  `…-light-phone.png`. I also took ordered page tiles (dark 1280px, light 360px) and element shots of each widget
  in both themes at 1280px and 360px, in the default state and after changes (error view at shift −1.0; 15 years
  with the post-war sample). The inspection found two defects, both fixed before the final run: a line that
  began with "1." rendered as a numbered list, and `\rho`/`\log` lost their backslash in a quiz option array.
  Wide display equations scroll sideways at 360px through the site's `.katex-display { overflow-x: auto }`.
- [x] `npm run clickthrough -- 10-campbell` passes and reports every widget of the chapter:
  `HOW GOOD IS THE LOG-LINEAR RETURN? · 5 actions at 1280px, 5 actions at 360px` and
  `WHERE DOES THE VARIANCE OF DP COME FROM? · 5 actions at 1280px, 5 actions at 360px`.
- [x] The six `section-tag` headings are in template order. `grep -n 'section-tag'` gives Hook (line 15),
  Intuition (30), Formalisation (59), Playground (226), Check yourself (255), Recap & next up (281).
- [x] No hex colour in the chapter or its widgets. The spec's `git diff … | xargs grep …` command printed
  `no hex colours` (new files were staged with `git add -N` so the diff lists them).
- [x] At least one widget uses real data from the chapter's curriculum entry, and every simulation is seeded.
  Both widgets load `goyal-welch-annual` through `loadSeries` and compute only through
  `src/lib/finance/presentValue.ts`. The chapter has no simulation, so it uses no randomness.
- [x] The outcome holds a voice review and a table of every number in the prose with its test (below).
- [x] The prose is 2,187 words, inside 1,500–3,000. Command (the chapter 9 command):
  `awk 'NR>8' src/content/chapters/10-campbell-shiller-decomposition.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1:

| Rule | Line from the chapter |
| --- | --- |
| Picture first, then the formula | `LogLinearCheck` comes in Intuition, before the derivation: "The dashed line is the straight-line rule that the next section derives." |
| Data before theory | Hook: "At the end of 2025, the S&P composite index cost 86.7 times the dividends its companies paid that year." |
| One idea per section | Formalisation has one heading per step: "The exact identity", "The straight-line approximation", "Solve forward", "From the identity to variance shares", "The long-run version with an AR(1)", "What the data say". |
| Start with a question the reader has | "If you pay 87 dollars today for each dollar of dividends, what has to happen next?" |
| Write to one reader, as "you"; explain terms, link back | "The last one is the persistence of an AR(1), as in [Chapter 5]." |
| Give the honest version | "The AR(1) version above extends the sum to infinity, but only by assuming that the AR(1) is right." |
| Say what the evidence can and cannot show | "These are point estimates. The library reports no standard errors for them … The full sample and the post-war sample give opposite answers." |
| Don't skip steps in derivations | "The same equation holds one year later, for $pd_{t+1}$. Substitute it in:" followed by the two-step and $k$-step forms and the geometric sum. |
| Graduate rigour comes in gradually | Part II (●●): covariances and regression slopes, each read in words: "Read them as shares: $b_r^{(k)}$ is the share of the variance of $dp$ that future returns carry". |
| Papers in our own words | "Cochrane (2011, p. 1050) reports the same post-war pattern on CRSP data for 1947–2009. He reads it to mean that the variation in the ratio comes from expected returns". |

## Numbers in the prose

All tests are in `tests/chapter10-numbers.test.ts`. Data: `goyal-welch-annual` through
`goyalWelchAnnualPresentValue` (pd years 1872–2025) and the helpers in `src/components/plots/presentValueSample.ts`.
"Post-war" means `sampleData(…, 'postwar')`, pd from the end of 1946.

| Number in the prose | Where | Test |
| --- | --- | --- |
| 87 (title, "87 dollars"), 86.7 (P/D end of 2025) | Hook | `hook: price–dividend ratios since 1872` |
| 1872, 2025 (sample ends) | Hook, Recap | `hook: …` |
| 26.4 (exp of mean pd) | Hook, Formalisation | `hook: …` |
| 88.0 in 1999 (only higher value), 9.9 in 1917 (lowest) | Hook | `hook: …` (sorts pd: 1999 first, 2025 second, 1917 last) |
| 1873 (first return year) | Intuition, Recap | `linearisation constants and error at the mean` |
| 0.39% average error, 2.4% largest, in 1917 | Intuition try-this, Recap | `linearisation constants …` |
| ρ = 26.4/27.4 = 0.964, κ = 0.157 | Formalisation | `linearisation constants …` |
| Error never negative | Formalisation, quiz 3 | `linearisation constants …` (`min(error) ≥ 0`) |
| Shift −1.0: P/D 9.7, largest error 11.9% in 1999 | Formalisation try-this | `moving the expansion point` |
| Shift +1.0: P/D 71.8, largest error 5.6% | Formalisation try-this | `moving the expansion point` |
| dp 1872–2024, b_r = 0.024, b_d = −0.088, φ = 0.92, gap 0.003 | What the data say | `one-year and long-run slopes` |
| b_r^lr = 0.21, b_d^lr = −0.76 | What the data say | `one-year and long-run slopes` |
| From 1946: b_r^lr = 1.11, b_d^lr = 0.10 | What the data say | `one-year and long-run slopes` |
| k = 1: future dp 89% | Playground try-this | `variance shares in the playground` |
| k = 15, full: 25%, 41%, 31% | Playground try-this | `variance shares …` |
| k = 15, from 1946: 74%, 6%, 19% | Playground try-this | `variance shares …` |
| k = 20, full: sum 97%, bubble 27%, ρ^20 = 0.48 | Playground | `variance shares …` |
| 1947–2009, p. 1050 | What the data say | From Cochrane (2011), Table II and p. 1050, opened with `pdftotext -layout`, not from our data |
| p. 5 | Formalisation | Campbell and Shiller (1988), manuscript p. 5 (linearisation at the sample mean; "approximation error is quite small") |

Not data numbers: chapter numbers (5, 9, 11), the illustrative 1950/1951 and "19 years in common" of a 20-year
window, the horizon range 1–20, and the made-up quiz inputs (24, 0.9).

## Summary

What:

- `src/content/chapters/10-campbell-shiller-decomposition.mdx`: chapter 10, Part II, difficulty 2, prerequisites
  [5, 9]. Both prerequisites exist, so the chapter links them and needs no recap callout.
- `src/components/plots/LogLinearCheck.tsx`: the exact and approximate annual log return over 1873–2025, a
  "returns | error" view and a slider that shifts the expansion point from −1.5 to +1.5 around the mean pd.
- `src/components/plots/VarianceShares.tsx`: one stacked bar of the three shares from `varianceShares`, with a
  horizon slider from 1 to 20 years. Negative shares stack to the left of zero. A dashed line marks 100%.
- `src/components/plots/presentValueSample.ts`: loading and small helpers that both widgets and the numbers test
  share (the chapter 9 pattern of `predictiveSample.ts`).
- `tests/chapter10-numbers.test.ts`.

How: the derivation goes exact identity → tangent at the mean → $k$-step forward iteration → covariance shares →
one-year identity $1 \approx b_r - b_d + \rho\phi$ → AR(1) long-run slopes → $1 \approx b_r^{\text{lr}} - b_d^{\text{lr}}$.
Every number comes from the library on the committed JSON.

Colour choices for the three shares (spec asks to name them): returns `--c-return` (solid outline), dividend
growth `--c-factor` (dashed outline), future dp / bubble `--c-signal` (dashed outline, because it is $dp$). The
style guide has no token for dividend growth, so `--c-factor` is a borrowed colour. Each segment also has a text
label ("r", "Δd", "dp") in the bar and a named row in the readout, so colour is never the only cue.

Deviations and additions:

- `VarianceShares` has an extra "Sample" control (from 1872 / from 1946). The full sample and the post-war sample
  give opposite answers, and the chapter's honest reading depends on showing both.
- The chapter has no simulation, so there is no seed or re-roll button.

Mismatches to report (no edits made to `docs/`):

- Curriculum Key math writes $\mathrm{Var}(dp)$; the style guide uses `\operatorname{Var}`. The chapter follows the
  style guide.
- Curriculum Widgets says the bar splits into "return news, dividend news and the bubble term". "News" is
  chapter 11's term ($N_{CF}$, $N_{DR}$); the chapter says "share", as the spec does.
- The symbols $b_r^{(k)}$, $b_d^{(k)}$, $b_{dp}^{(k)}$ and $b^{\text{lr}}$ are not in the §3 notation table. The
  spec says not to edit the table, so I report them here as candidates.
- The curriculum lists `shiller-monthly` as data. The widgets use only `goyal-welch-annual`, the series the
  library task built the identity on.

Verified revision: the PR head. Local Verify only; GitHub Actions were not read or used.

Proposed follow-ups: remove the unused `Matrix` import in `src/lib/finance/news.ts` (an `astro check` hint); add
the chapter 10 symbols above to the §3 notation table.
