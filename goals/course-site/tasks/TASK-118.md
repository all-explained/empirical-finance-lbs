---
id: TASK-118
title: 'Chapter 33: Characteristic-based mimicking portfolios'
milestone: M-10
state: approved
depends_on: [TASK-114]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-10. A characteristic becomes a tradable factor by a sort or by a cross-sectional regression whose slope is a portfolio return, and a non-traded factor such as consumption growth gets a traded stand-in by projecting it on returns. This chapter follows the pattern of the Part I to Part VII chapters.

## Scope


Write chapter 33 of `docs/CURRICULUM.md`, "Characteristic-based mimicking portfolios", as `src/content/chapters/33-characteristic-based-mimicking-portfolios.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part V, Part VII and Part VIII blocks of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/17-cross-sectional-regressions-and-fama-macbeth.mdx`, `src/content/chapters/19-size-and-value.mdx` (`SortGrid` and `FactorBuilder`), `src/content/chapters/22-conditional-factor-models.mdx` and `src/content/chapters/26-gmm-for-asset-pricing-models.mdx` (the consumption CAPM on quarterly data), and the library code named below: `src/lib/finance/mimicking.ts` (from the library task this task depends on), `src/lib/finance/conditional.ts` (`quarterlyPanel`) and `src/components/plots/sizeValueSample.ts`.

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/FamaFrench1992.pdf` (Fama & French (1992), published version) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/KellyPruittSu2018.pdf` (Kelly, Pruitt & Su, NBER working paper of 2018; cite the 2019 *Journal of Financial Economics* article, report the mismatch with the curriculum's 2018, and name working-paper pages). You may also cite `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GiglioXiu2021.pdf` (pp. 1954–1955) for the bias of a mimicking portfolio built on too few base assets. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper.

Data. `ff25-size-bm-monthly` and `ff3-monthly` from 1963-07, and the quarterly panel of `quarterlyPanel` (25 portfolios, FF3 and consumption growth from `fred-cay-quarterly`), loaded through one hook in `src/components/plots/mimickingSample.ts` built on the existing loaders (`useModelData` of `sizeValueSample.ts`, and the loading of `conditionalSample.ts` or `sdfGmmSample.ts` for the quarterly panel); write no new loading code that an existing hook already covers. The curriculum's data line names `fred-consumption-quarterly`; report that the chapter uses the consumption growth of chapters 22 and 26 instead.

Chapter:
- Frontmatter: `part: 8`, `chapter: 33`, `difficulty: 3`, `prerequisites: [17, 19]`, a one-sentence `summary`. Link chapters 17, 19 and 26. Link chapter 32 if it is merged when you finish (the managed portfolios); otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name chapter 34 only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: Fama–MacBeth slopes as portfolio returns, with weights the rows of $(Z_t'Z_t)^{-1}Z_t'$ (unit exposure to one characteristic, none to the others), a sort against a regression as two ways to weight the same assets, and the projection of a non-traded factor on returns with its mimicking return. Write the curriculum's $\hat\gamma_t$, $c$, $w$ and $e_t$ in the Part VIII symbols of §3 and report each replacement. Teach the limits honestly: the 25 portfolios stand in for firms, and a projection on 25 assets over a few hundred quarters overfits (show the split-sample correlation).
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter33-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `SortGrid` preset: add one optional view (for example `initialMeasure="weights"`, with a matching option in its measure control) that shades the 5×5 grid by the weight each portfolio gets in a long–short sort and in the cross-sectional slope portfolio (`sortWeights` and `slopeWeights`), with a `Segmented` for the characteristic (size, book-to-market) and one for the method (sort, regression). The readout gives the chosen portfolio's mean, $t$-statistic and correlation with SMB or HML. The default views stay unchanged, and chapter 19 must render as before (run its screenshots and click-through). No other task in this Part edits `SortGrid`.
- `MimickingPortfolio`: consumption growth and its mimicking return over time (quarterly), with a `Segmented` for the base assets (the 25 portfolios; the three FF3 factors), a `Segmented` for in sample against split sample, and a `Slider` for the split date. The readout gives the correlation achieved and the largest weights.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>`.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code other than the `SortGrid` view above. A symbol the chapter needs that §3 lacks goes into the Part VIII block of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 33-characteristic-based-mimicking-portfolios` and `npm run screenshots -- 19-size-and-value` pass in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 33-characteristic-based-mimicking-portfolios` and `npm run clickthrough -- 19-size-and-value` pass and report every widget of each chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widgets use real data (`ff25-size-bm-monthly`, `ff3-monthly` and the quarterly panel of `quarterlyPanel`), and the default views of `SortGrid` are unchanged.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 33-characteristic-based-mimicking-portfolios
npm run screenshots -- 19-size-and-value
npm run clickthrough -- 33-characteristic-based-mimicking-portfolios
npm run clickthrough -- 19-size-and-value
grep -n 'section-tag' src/content/chapters/33-characteristic-based-mimicking-portfolios.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/33-characteristic-based-mimicking-portfolios.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
