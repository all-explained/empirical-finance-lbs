---
id: TASK-075
title: 'Chapter 21: Anomalies and the factor zoo'
milestone: M-7
state: approved
depends_on: [TASK-069, TASK-070]
delivery: pr
---

## Why


SC-7 and M-7. After size, value and momentum come hundreds of published predictors. This chapter asks how many survive honest checks and which few factors span the rest, following the pattern of the earlier chapters.

## Scope


Write chapter 21 of `docs/CURRICULUM.md`, "Anomalies and the factor zoo", as `src/content/chapters/21-anomalies-and-the-factor-zoo.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md` (including the OSAP notes), the finished chapters `src/content/chapters/01-returns.mdx`, `src/content/chapters/13-out-of-sample-predictability.mdx` and `src/content/chapters/16-time-series-tests-and-grs.mdx` (the models to copy), chapters 19 and 20 if they are merged, and the library code named below: `src/lib/finance/zoo.ts` and `src/lib/finance/factors.ts` (from the library tasks this task depends on).

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Cochrane2011.pdf` (Cochrane (2011)), `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/HouXueZhang2018.pdf` (published in the Review of Financial Studies in 2020, see `docs/READINGS.md`; cite it as "Hou, Xue & Zhang (2020)" and report the curriculum's "2018" as a mismatch) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/HarveyLiuZhu2016.pdf` (Harvey, Liu & Zhu (2016)). Cite the OSAP data as `docs/DATA.md` does. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper.

Chapter:
- Frontmatter: `part: 5`, `chapter: 21`, `difficulty: 2`, `prerequisites: [19, 20]`, a one-sentence `summary`. Link each prerequisite that is merged when you finish; name the others by title and say so in the outcome. Every sentence about another chapter must be true of the merged site. Multiple testing and shrinkage are Part VII (chapters 28 to 30): name them only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: what makes a predictor an anomaly, the $t$-statistics of many published predictors, how many shrink under value weighting or without microcaps (with the OSAP variants the data task committed), the spanning regression and why only $\alpha \ne 0$ adds to a model. Teach the limits honestly: a higher $t$ threshold is a blunt fix for data mining, and a factor can be spanned in one sample and not in another.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter21-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above and the typed loaders in `src/lib/data/`:
- `ZooChart`: each published predictor as a point at its publication year and original-sample $t$-statistic from `signalSummaries`, a draggable significance line (keyboard-movable, default 1.96, with a mark at 3) and a `Segmented` control for the portfolio construction; the readout gives `countAbove` and `compareConstructions` for the line's value.
- `SpanningTest`: a `Select` for a factor among the FF5 factors and Mom, regressed on the others with `spanningTest`; a scatter of the factor against its fitted value and a readout of $\alpha$, its $t$-statistic and $R^2$, on the common sample from 1963-07.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, `prefers-reduced-motion`. Put the data hook the widgets and the numbers test share in one helper, `src/components/plots/zooSample.ts`; for the factors, use `src/components/plots/factorModelSample.ts` if it is merged.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the notation table of `docs/STYLE_GUIDE.md` §3 disagree, follow the style guide and report the mismatch; list symbols the table lacks (such as $f_{\text{new},t}$) as candidates. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`; a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 21-anomalies` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 21-anomalies` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widgets use real data from the chapter's curriculum entry (`ff5-monthly`, `mom-monthly`) and the OSAP datasets.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 21-anomalies
npm run clickthrough -- 21-anomalies
grep -n 'section-tag' src/content/chapters/21-anomalies-and-the-factor-zoo.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/21-anomalies-and-the-factor-zoo.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
