---
id: TASK-130
title: 'Chapter 36: Measuring consumption'
milestone: M-11
state: approved
depends_on: [TASK-127, TASK-128]
delivery: pr
---

## Why


SC-7 and M-11. Part IX closes by asking whether the puzzle is partly a measurement problem: NIPA consumption is averaged over time and smoothed by the way it is built, and an unfiltered series, as Kroencke (2017) builds it, covaries more with returns and lowers the risk aversion the puzzle needs. This chapter follows the pattern of the Part I to Part VIII chapters.

## Scope


Write chapter 36 of `docs/CURRICULUM.md`, "Measuring consumption", as `src/content/chapters/36-measuring-consumption.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part IX block of §3), `docs/DATA.md` (the consumption notes), the finished chapters `src/content/chapters/04-autocorrelation-and-newey-west.mdx` (`OverlapDemo`, the closest widget to copy) and `src/content/chapters/05-persistence-ar1-and-var.mdx` (`AR1Simulator`), chapter 35 if it is merged, and the library code named below: `src/lib/finance/consumptionMeasurement.ts` and `src/lib/finance/consumptionPuzzle.ts` (from the library tasks this task depends on).

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Kroencke2017.pdf` (Kroencke, ZEW working paper dated 2013; cite the 2017 *Journal of Finance* article, report the mismatch with the curriculum's 2017, and name working-paper pages) with `pdftotext -layout`, and name the page for any number or fact you take from it. His garbage series (from 1960, built by Savov (2011)) is not in our data: you may report his numbers with their page, but say that they are the paper's and not ours. Working (1960), Breeden, Gibbons & Litzenberger (1989) and Savov (2011) are not in `source/papers/`: name them only as Kroencke reports them, with his page. Campbell (2018), Ch. 6, is not in `source/papers/` either: list it under further reading in the short form and take no fact from it. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data or simulations is read from library output, never from a paper.

Data. `fred-consumption-annual` with `goyal-welch-annual` (the annual sample of chapter 35), `fred-cay-quarterly` (for the Q4-Q4 measure), and seeded simulations from `simulateTimeAveraging`, loaded through one hook in `src/components/plots/consumptionSample.ts` built on the hook of `puzzleSample.ts` if chapter 35 is merged, otherwise on `loadSeries`; write no new loading code that an existing hook already covers. Report the addition of `goyal-welch-annual` and `fred-cay-quarterly` to the curriculum's data line in the outcome.

Chapter:
- Frontmatter: `part: 9`, `chapter: 36`, `difficulty: 2`, `prerequisites: [5, 35]`, a one-sentence `summary`. Link chapters 4 and 5. Link chapter 35 if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name Part X's first chapter only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: what NIPA nondurables and services measure and what they miss, time averaging of a random walk and its autocorrelation near 0.25, the filter and its inverse. Write the curriculum's $\phi$ in the Part IX symbol of §3 and explain its mapping to Kroencke's parameter. Compare annual averages, the Q4-Q4 measure and the unfiltered series on our data: their volatility, autocorrelation, correlation with the market return and the implied $\gamma$ of chapter 35's formula, and say plainly what our data show and how much depends on the filter weight.
- Every number in the prose is read from library output on the committed data or the seeded simulations, never typed from memory. Add `tests/chapter36-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `TimeAveraging`: a seeded fine-step path of log consumption with its period averages drawn over it, a `Slider` for the steps a period, a `Button` for a new seed, and a readout of the sample and exact first-order autocorrelation of the averaged growth and the variance ratio.
- `UnfilterConsumption`: measured and unfiltered annual consumption growth over time, a `Slider` for the filter weight (mark Kroencke's recommended values), and a readout of the volatility, the correlation with the market return and the implied $\gamma$ of each series. Do not let colour be the only cue between the two series.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>`.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code. A symbol the chapter needs that §3 lacks goes into the Part IX block of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 36-measuring-consumption` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 36-measuring-consumption` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The time-averaging widget uses seeded simulations from `src/lib/math/rng.ts`, and the unfiltering widget and the prose numbers use the committed `fred-consumption-annual`, `goyal-welch-annual` and `fred-cay-quarterly` data.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 36-measuring-consumption
npm run clickthrough -- 36-measuring-consumption
grep -n 'section-tag' src/content/chapters/36-measuring-consumption.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/36-measuring-consumption.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
