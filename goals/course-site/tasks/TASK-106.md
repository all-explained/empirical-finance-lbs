---
id: TASK-106
title: 'Chapter 28: A skeptical look at asset pricing tests'
milestone: M-9
state: approved
depends_on: [TASK-102, TASK-103]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-9. Part VII opens by doubting the tests themselves: the 25 size–value portfolios have so strong a factor structure that almost any factor correlated with SMB and HML fits them, and four fixes make the tests harder to pass. This chapter follows the pattern of the Part I to Part VI chapters.

## Scope


Write chapter 28 of `docs/CURRICULUM.md`, "A skeptical look at asset pricing tests", as `src/content/chapters/28-skeptical-look-at-asset-pricing-tests.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part VI and Part VII blocks of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/06-principal-components.mdx`, `src/content/chapters/17-cross-sectional-regressions-and-fama-macbeth.mdx` and `src/content/chapters/27-weak-and-useless-factors.mdx` (the models to copy; chapter 27 already shows useless factors, so build on it and do not repeat it), and the library code named below: `src/lib/finance/skeptical.ts` (from the library task this task depends on), `src/lib/finance/crossSection.ts` and `src/lib/stats/pca.ts`.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/LewellenNagelShanken2010.pdf` (Lewellen, Nagel & Shanken (2010), NBER working-paper version; cite the published 2010 article and name working-paper pages) with `pdftotext -layout` and name the page for any number or fact you take from it. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data or simulations is read from library output, never from a paper.

Data. `ff25-size-bm-monthly`, `ff3-monthly` and `ff30-industry-monthly` (from the data task this task depends on), 1963-07 on. Load them through one hook in `src/components/plots/skepticalSample.ts`, built on the existing loaders (`useFactorData` of `factorTestSample.ts` for the 25 portfolios and FF3, and `loadSeries` for the industries); write no new loading code that an existing hook already covers.

Chapter:
- Frontmatter: `part: 7`, `chapter: 28`, `difficulty: 3`, `prerequisites: [6, 17]`, a one-sentence `summary`. Link chapters 6, 17 and 27. Every sentence about another chapter must be true of the merged site; name chapters 29 and 30 only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: why a strong factor structure in the test assets lets any factor that loads on it fit (link the principal components of chapter 6), the cross-sectional R² as the curriculum writes it, the GLS R² with $\Sigma^{-1}$ weights and its mean-variance reading, the restriction $\lambda = \mathbb{E}[f]$ for a traded factor, and confidence intervals for R². Apply the four fixes to CAPM and FF3 and say plainly what our data show. Use the §3 notation.
- Every number in the prose is read from library output on the committed data or the seeded simulations, never typed from memory. Add `tests/chapter28-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `RandomFactorFit`: the OLS or GLS cross-sectional R² of seeded artificial factors (`randomFactorFit`) as a histogram, with a `Slider` for the noise share, a `Segmented` for the R² (OLS, GLS), a `Segmented` for the test assets (25 portfolios; 25 portfolios and 30 industries), the R² of CAPM and FF3 marked, and the median R² and the share above FF3's in the readout. Compute after the slider stops, as `UselessFactor` does.
- `PCAExplorer` as it is, with `initialPreset="ff25-1963"` and `initialView="scree"`: no change to the component.
Follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>`.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the §3 notation disagree, follow the style guide and report the mismatch; list any symbol the table still lacks as a candidate. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 28-skeptical-look-at-asset-pricing-tests` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 28-skeptical-look-at-asset-pricing-tests` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widgets use real data (`ff25-size-bm-monthly`, `ff3-monthly`, `ff30-industry-monthly`) and seeded simulations from `src/lib/math/rng.ts`; `git diff --stat origin/main -- src/components/plots/PCAExplorer.tsx` is empty.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 28-skeptical-look-at-asset-pricing-tests
npm run clickthrough -- 28-skeptical-look-at-asset-pricing-tests
grep -n 'section-tag' src/content/chapters/28-skeptical-look-at-asset-pricing-tests.mdx
git diff --stat origin/main -- src/components/plots/PCAExplorer.tsx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/28-skeptical-look-at-asset-pricing-tests.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
