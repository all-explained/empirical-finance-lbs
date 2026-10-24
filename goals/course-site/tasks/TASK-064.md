---
id: TASK-064
title: 'Chapter 17: Cross-sectional regressions and Fama–MacBeth'
milestone: M-6
state: approved
depends_on: [TASK-062]
delivery: pr
---

## Why


SC-7 and M-6. Part IV turns from testing alphas to pricing betas: the two-pass cross-sectional regression and Fama–MacBeth, the workhorse of empirical asset pricing. This chapter follows the pattern of the earlier chapters.

## Scope


Write chapter 17 of `docs/CURRICULUM.md`, "Cross-sectional regressions and Fama–MacBeth", as `src/content/chapters/17-cross-sectional-regressions-and-fama-macbeth.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md`, the finished chapters `src/content/chapters/01-returns.mdx`, `src/content/chapters/07-mean-variance-and-the-capm.mdx`, `src/content/chapters/09-time-varying-expected-returns.mdx` and `src/content/chapters/13-out-of-sample-predictability.mdx` (the models to copy), and the library code named below: `src/lib/finance/crossSection.ts` (from the library task this task depends on) and `src/lib/finance/timeSeriesTests.ts`.

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Cochrane2011.pdf` (Cochrane (2011), NBER working-paper version) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/FamaFrench1992.pdf` (Fama & French (1992)). Cochrane (2005), Ch. 12, is a book the owner has not supplied: it is not in `source/papers/`, so take no fact from it and list it under further reading only. Fama & MacBeth (1973) is not in `source/papers/` either: teach the method and attribute nothing to that paper unless an opened reading says it, with its page. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper.

Chapter:
- Frontmatter: `part: 4`, `chapter: 17`, `difficulty: 2`, `prerequisites: [16]`, a one-sentence `summary`. Link chapter 16 if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped in a derivation: the first and second pass, OLS against GLS weighting, the monthly Fama–MacBeth slopes and their standard error, and why Fama–MacBeth equals the two-pass estimate when betas are constant. Teach the limits honestly: what a high cross-sectional $R^2$ does and does not show, and that the standard errors here ignore that betas are estimated (the bridge to chapter 18).
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter17-numbers.test.ts` that recomputes each one, as `tests/chapter13-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above and the typed loaders in `src/lib/data/series.ts`:
- `FamaMacBethMovie`: month by month, the cross-section of the 25 portfolios' excess returns against their betas with that month's fitted line from `famaMacBeth`, beside the running mean of $\hat\lambda_t$ with its standard-error band; play, pause and step with the shared `Button`, a `Slider` for the month, a `Segmented` control for CAPM or FF3 (for FF3, show the market slope and say so). Animate with `useTweened`; under `prefers-reduced-motion` the movie does not autoplay and steps jump.
- `SMLPlot` reuse: the curriculum asks for fitted against actual mean returns. You may add one optional prop to `src/components/plots/SMLPlot.tsx` that switches it to fitted ($\hat\beta_i'\hat\lambda$ from `crossSectionalRegression`) against actual mean returns, with the default unchanged; then re-run `npm run screenshots -- 07-mean-variance` and report the change. If a separate widget is cleaner, explain why in the outcome.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, `prefers-reduced-motion`. Use the data hook in `src/components/plots/factorTestSample.ts` if chapter 16 has merged it; otherwise create that file with a hook built on `factorPanel`, and say so in the outcome so the two chapters keep one helper.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code other than the one optional `SMLPlot` prop. Where the curriculum's Key math and the notation table of `docs/STYLE_GUIDE.md` §3 disagree, follow the style guide and report the mismatch (for example $\Sigma$ for the residual covariance, which §3 writes $\Sigma_\varepsilon$); list symbols the table lacks (such as $\lambda_0$, $\hat\lambda_t$, the cross-sectional $R^2$) as candidates. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`; a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 17-cross-sectional` passes in both themes at desktop and phone size, and you inspected the images; if `SMLPlot` changed, `npm run screenshots -- 07-mean-variance` passes too.
- `npm run clickthrough -- 17-cross-sectional` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widgets use real data from the chapter's curriculum entry (`ff25-size-bm-monthly`, `ff3-monthly`).
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 17-cross-sectional
npm run clickthrough -- 17-cross-sectional
grep -n 'section-tag' src/content/chapters/17-cross-sectional-regressions-and-fama-macbeth.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/17-cross-sectional-regressions-and-fama-macbeth.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
