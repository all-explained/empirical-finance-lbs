---
id: TASK-073
title: 'Chapter 19: Size and value'
milestone: M-7
state: approved
depends_on: [TASK-069]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-7. Part V opens with the two best-known patterns the CAPM misses, size and value, and the factors built to price them. This chapter follows the pattern of the Part I to Part IV chapters.

## Scope


Write chapter 19 of `docs/CURRICULUM.md`, "Size and value", as `src/content/chapters/19-size-and-value.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md`, the finished chapters `src/content/chapters/01-returns.mdx`, `src/content/chapters/07-mean-variance-and-the-capm.mdx`, `src/content/chapters/13-out-of-sample-predictability.mdx` and `src/content/chapters/16-time-series-tests-and-grs.mdx` (the models to copy), and the library code named below: `src/lib/finance/factors.ts` (from the library task this task depends on) and `src/lib/finance/timeSeriesTests.ts`.

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/FamaFrench1992.pdf` (Fama & French (1992)) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Cochrane2011.pdf` (Cochrane (2011), NBER working-paper version). Fama & French (1993) and (2015), which define the three- and five-factor models, are not in `source/papers/`: describe the factors as the Kenneth French Data Library pages do, cite those pages, and take no other fact from the two papers. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper.

Chapter:
- Frontmatter: `part: 5`, `chapter: 19`, `difficulty: 2`, `prerequisites: [16, 17]`, a one-sentence `summary`. Link chapter 16. Link chapter 17 if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name chapters 20 to 23 only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: the size and value spreads in the 25 portfolios, the CAPM alphas they leave, the 2×3 sort and why each factor averages over the other sort, the FF3 regression, and what RMW and CMA add in FF5. Teach the limits honestly: a factor that prices the portfolios it was built from is a low bar (link the GRS reading of chapter 16), and the value premium's size depends on the sample (show it with our data).
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter19-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above and the typed loaders in `src/lib/data/series.ts`:
- `SortGrid`: the 5×5 grid of size and book-to-market portfolios coloured by annualised mean excess return or by alpha (`Segmented`), with a `Segmented` model control (CAPM, FF3, FF5) on the common sample from 1963-07, each cell labelled with its number; the readout gives the GRS statistic and p-value of the chosen model. Use a diverging colour scale from CSS variables with a legend, and do not let colour be the only cue.
- `FactorBuilder`: the six 2×3 portfolios of `ff6-size-bm-monthly` as a grid, the legs of SMB and HML highlighted as the reader picks a factor, and the rebuilt factor's cumulative return against the published one, with the largest gap in the readout. Give it a `kind` prop (`'size-value'` default, `'size-momentum'`) so chapter 20 reuses it.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, `prefers-reduced-motion`. Put the data hook the widgets and the numbers test share in one helper, `src/components/plots/factorModelSample.ts`, built on `modelPanel` and `sortFactors`; reuse the loaders of `factorTestSample.ts` rather than writing new loading code.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the notation table of `docs/STYLE_GUIDE.md` §3 disagree, follow the style guide and report the mismatch; list symbols the table lacks (such as $b_i$, $s_i$, $h_i$, $SMB$, $HML$, $RMW$, $CMA$) as candidates. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`; a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 19-size-and-value` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 19-size-and-value` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widgets use real data from the chapter's curriculum entry (`ff25-size-bm-monthly`, `ff3-monthly`, `ff5-monthly`) and `ff6-size-bm-monthly`.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 19-size-and-value
npm run clickthrough -- 19-size-and-value
grep -n 'section-tag' src/content/chapters/19-size-and-value.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/19-size-and-value.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
