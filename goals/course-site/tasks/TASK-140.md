---
id: TASK-140
title: 'Chapter 38: Long-run risk'
milestone: M-12
state: approved
depends_on: [TASK-137]
delivery: pr
---

## Why


SC-7 and M-12. The second answer to the puzzles of Part IX: with Epstein–Zin preferences, a small persistent part of consumption growth that is hard to see in the data carries a large price of risk. The chapter weighs the case for it (Bansal, Kiku & Yaron) against the case against it (Beeler & Campbell) on our own data. This chapter follows the pattern of the Part I to Part IX chapters.

## Scope


Write chapter 38 of `docs/CURRICULUM.md`, "Long-run risk", as `src/content/chapters/38-long-run-risk.mdx`, with its widget. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part IX and Part X blocks of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/05-persistence-ar1-and-var.mdx` (`AR1Simulator`), `src/content/chapters/10-campbell-shiller-decomposition.mdx` (the linearisation this model reuses), `src/content/chapters/11-cash-flow-and-discount-rate-news.mdx` and `src/content/chapters/35-equity-premium-and-risk-free-rate-puzzles.mdx`, chapter 37 if it is merged, and the code named below: `src/lib/finance/longRunRisk.ts` (from the library task this task depends on), `src/lib/finance/presentValue.ts`, `src/lib/finance/consumptionPuzzle.ts`, `src/components/plots/puzzleSample.ts` and `src/components/plots/AR1Simulator.tsx`.

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/BansalKikuYaron2012.pdf` (NBER working paper dated November 2009; cite the 2012 *Critical Finance Review* article and name working-paper pages) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/BeelerCampbell2012.pdf` (NBER working paper dated March 2009; cite the 2012 *Critical Finance Review* article and name working-paper pages); the library's doc comments list the pages of the model, the solution and the tables. Bansal & Yaron (2004) and Epstein & Zin (1989) are not in `source/papers/`: name them only where an opened reading does, with its page, and state no number from them. Campbell (2018), Ch. 6, is not in `source/papers/`: list it under further reading in the short form and take no fact from it. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data or simulations is read from library output, never from a paper.

Data. Seeded simulations from `simulateLongRunRisk` and `annualise`, and our annual data, `fred-consumption-annual` with `goyal-welch-annual` (consumption growth and the log price–dividend ratio, through `consumptionPredictability`), loaded through one hook in `src/components/plots/longRunRiskSample.ts` built on `useSeriesData` of `seriesSample.ts` and the helpers of `puzzleSample.ts`; write no new loading code that an existing hook already covers. The curriculum's data line names `fred-consumption-quarterly` (it starts in 2007, issue #112); report in the outcome that the chapter uses the annual series instead.

Chapter:
- Frontmatter: `part: 10`, `chapter: 38`, `difficulty: 3`, `prerequisites: [5, 35]`, a one-sentence `summary`. Link chapters 5, 10, 11 and 35. Link chapter 37 if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name chapter 39 only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: Epstein–Zin preferences and why they separate $\gamma$ from $\psi$, the log SDF with $\theta$, the dynamics with the persistent part and stochastic volatility, the log-linear solution and why $\psi > 1$ makes good news about growth raise prices, the three prices of risk, and the equity premium. Write the curriculum's $\theta$, $\rho$, $\varphi_e$ and the papers' $\kappa_1$ in the symbols of the §3 Part X block and report each replacement. Weigh the evidence on our data and the model's: the variance ratio of consumption growth at long horizons, and whether the price–dividend ratio forecasts consumption growth (Beeler & Campbell's test), with the papers' own numbers marked as theirs and with their page.
- Every number in the prose is read from library output on the committed data or the seeded simulations, never typed from memory. Add `tests/chapter38-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widget (in `src/components/plots/`), computing only through the libraries above:
- `LongRunRisk`: a seeded consumption path with and without the persistent part (same shocks; do not let colour be the only cue between them), the variance ratio of consumption growth across horizons for the model and for our annual data, a `Slider` for the persistence of $x_t$ and one for $\psi$, a `Segmented` for the BKY and BY calibrations, a `Button` for a new seed, and a readout of the equity premium, the risk-free rate and the price of long-run risk as they move.
It follows style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>`. If you animate with `useTweened`, guard against issue #120 as the power-utility view of `HJBound` does, until that issue is fixed.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code. A symbol the chapter needs that §3 lacks goes into the Part X block of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 38-long-run-risk` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 38-long-run-risk` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- `LongRunRisk` uses seeded simulations from `src/lib/math/rng.ts`, and its data curve and the prose numbers on data use the committed `fred-consumption-annual` and `goyal-welch-annual`.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 38-long-run-risk
npm run clickthrough -- 38-long-run-risk
grep -n 'section-tag' src/content/chapters/38-long-run-risk.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/38-long-run-risk.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
