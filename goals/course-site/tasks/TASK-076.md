---
id: TASK-076
title: 'Chapter 22: Conditional factor models'
milestone: M-7
state: approved
depends_on: [TASK-071]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-7. A model can hold period by period and still fail on average. This chapter separates conditional from unconditional models and shows how scaled factors turn one into the other, following the pattern of the earlier chapters.

## Scope


Write chapter 22 of `docs/CURRICULUM.md`, "Conditional factor models", as `src/content/chapters/22-conditional-factor-models.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md`, the finished chapters `src/content/chapters/08-euler-equation-and-sdf.mdx`, `src/content/chapters/12-stambaugh-bias.mdx` (a seeded-simulation chapter) and `src/content/chapters/16-time-series-tests-and-grs.mdx` (the models to copy), and the library code named below: `src/lib/finance/conditional.ts` (from the library task this task depends on), `src/lib/finance/crossSection.ts` and `src/lib/finance/cay.ts`.

Readings. Open these PDFs and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/LettauLudvigson2001b.pdf` (Lettau & Ludvigson (2001, JPE); `pdftotext -layout`) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/JagannathanWang1996.pdf` (Jagannathan & Wang (1996)). The second file is a scan of Minneapolis Fed Staff Report 208 with no text layer: render the pages you need with `pdftoppm -r 200 -png` and read them with `tesseract` or by viewing the images, cite the published Journal of Finance article in the short form, and give staff-report page numbers, saying so. Cochrane (2005), Ch. 8, is a book the owner has not supplied: it is not in `source/papers/`, so take no fact from it and list it under further reading only. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data or the seeded simulation is read from library output, never from a paper.

Chapter:
- Frontmatter: `part: 5`, `chapter: 22`, `difficulty: 2`, `prerequisites: [8, 14, 17]`, a one-sentence `summary`. Link each prerequisite that is merged when you finish; name the others by title and say so in the outcome. Every sentence about another chapter must be true of the merged site.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: $\mathbb{E}_t[R^e_{i,t+1}] = \beta_{it}\lambda_t$, the decomposition $\mathbb{E}[R^e_i] = \mathbb{E}[\beta_{it}]\mathbb{E}[\lambda_t] + \mathrm{Cov}(\beta_{it}, \lambda_t)$, the scaled SDF $m_{t+1} = (a_0 + a_1 z_t) + (b_0 + b_1 z_t) f_{t+1}$ and why it is an unconditional model in the factors $f_{t+1}$, $z_t$, $z_t f_{t+1}$, and managed portfolios $R^e_{t+1} \otimes (1, z_t)$. Teach the limits honestly: the choice of $z_t$ is free and easy to overfit, full-sample $cay$ uses future data, and a high cross-sectional $R^2$ on the 25 portfolios is a low bar (link chapter 17 if merged).
- Every number in the prose is read from library output on the committed data or the seeded simulation, never typed from memory. Add `tests/chapter22-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above and the typed loaders in `src/lib/data/series.ts`:
- `ConditionalBeta`: from `simulateConditionalCapm`, the state, $\beta_t$ and $\lambda_t$ over time, with `Slider`s for how much beta and the premium move with the state, a new-seed `Button` and a fixed default seed; the readout gives $\overline{\beta}\,\overline{\lambda}$, the covariance term, and the unconditional and conditional alphas.
- `ScaledFactors`: fitted against actual quarterly mean excess returns of the 25 portfolios from `conditionalModelFits`, with a `Segmented` control for CAPM, FF3, CCAPM and scaled CCAPM and the cross-sectional $R^2$ in the readout. Use `SMLPlot` in its fitted-against-actual mode if chapter 17 merged that mode; otherwise build this widget alone and say why in the outcome.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, `prefers-reduced-motion`. Put the data hook the widgets and the numbers test share in one helper, `src/components/plots/conditionalSample.ts`.

Data. The curriculum lists `fred-consumption-quarterly` and `goyal-welch-annual`. The first starts in 2007, too short for this test, so take consumption growth and $cay$ from `fred-cay-quarterly` through `cayInputs` and `fullSampleCay`, and report the mismatch. Use `goyal-welch-annual` only if the chapter needs it, and say which.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the notation table of `docs/STYLE_GUIDE.md` §3 disagree, follow the style guide and report the mismatch; list symbols the table lacks (such as $\beta_{it}$, $\lambda_t$, $z_t$, $a_0$, $a_1$, $b_0$, $b_1$) as candidates, checking first that $z_t$ and $M$ are not already taken in §3. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`; a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 22-conditional` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 22-conditional` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widgets use the chapter's data (`ff25-size-bm-monthly`, `ff3-monthly`, `fred-cay-quarterly`, simulated with a fixed seed).
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 22-conditional
npm run clickthrough -- 22-conditional
grep -n 'section-tag' src/content/chapters/22-conditional-factor-models.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/22-conditional-factor-models.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
