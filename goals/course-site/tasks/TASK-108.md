---
id: TASK-108
title: 'Chapter 30: Shrinking the cross-section'
milestone: M-9
state: approved
depends_on: [TASK-105]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-9. Part VII closes by estimating the SDF on many factors at once: a natural prior turns the estimate into a ridge regression, the elastic net adds sparsity, and a few principal components carry most of the SDF. This chapter follows the pattern of the Part I to Part VI chapters.

## Scope


Write chapter 30 of `docs/CURRICULUM.md`, "Shrinking the cross-section", as `src/content/chapters/30-shrinking-the-cross-section.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part VI and Part VII blocks of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/06-principal-components.mdx`, `src/content/chapters/07-mean-variance-and-the-capm.mdx` (`FrontierBuilder`), `src/content/chapters/13-out-of-sample-predictability.mdx` (in-sample against out-of-sample) and `src/content/chapters/26-gmm-for-asset-pricing-models.mdx` (the linear SDF), chapter 28 if it is merged, and the library code named below: `src/lib/finance/shrinkage.ts` (from the library task this task depends on), `src/lib/finance/portfolio.ts` and `src/lib/stats/pca.ts`.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/KozakNagelSantosh2018.pdf` (Kozak, Nagel & Santosh (2020), published version; the curriculum says 2018, cite 2020 and report the mismatch) with `pdftotext -layout` and name the page for any number or fact you take from it. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper.

Data. The two asset sets of `assetPanel` (`'ff'` from `ff25-size-bm-monthly`, `ff5-monthly` and `mom-monthly`; `'osap'` from `osap-ls-monthly`), loaded through one hook in `src/components/plots/shrinkageSample.ts` built on the existing loaders (`loadSeries`, and the hook of `zooSample.ts` for OSAP); write no new loading code that an existing hook already covers.

Chapter:
- Frontmatter: `part: 7`, `chapter: 30`, `difficulty: 3`, `prerequisites: [6, 7, 26, 28]`, a one-sentence `summary`. Link chapters 6, 7 and 26. Link chapter 28 if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name Part VIII's first chapter only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: the SDF $M_{t+1} = 1 - b'\tilde f_{t+1}$ (write $M$ and $f$, as §3 says, not the curriculum's $m_t$ and $F_t$) with $b = \Sigma^{-1}\mu$, why the in-sample estimate overfits, the prior on $\mu$ and the step to the ridge form, what ridge does to each principal component, the elastic-net penalty and what sparsity in assets against sparsity in PCs means, and the cross-validated out-of-sample R². Use the Part VII letters of §3 for the penalties and the prior scale, and report each curriculum letter that §3 replaced. Teach the limits honestly: say what changes between the two asset sets, and that the cross-validated penalty is itself estimated.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter30-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `ShrinkagePath`: $\hat b$ against the penalty (log scale) for the largest coefficients, with the cross-validated R² curve below it and its maximum marked; a `Segmented` for the asset set (`'ff'`, `'osap'`), a `Segmented` for the space (assets, PCs), a `Slider` for the $L^1$ share (0 is ridge), and a `Slider` for the penalty that moves a marker on both panels. The readout gives the penalty, the cross-validated R² and the number of non-zero coefficients. Precompute the path once per setting and compute after the slider stops.
- `FrontierBuilder` preset: add one optional prop (for example `preset`, default the current chapter 7 behaviour) that shows, for the `'ff'` set, the in-sample frontier with the in-sample and out-of-sample mean–volatility points of the shrunk tangency portfolio from `splitSampleSharpe`, and a `Slider` for the penalty; the readout gives both Sharpe ratios. The default behaviour stays unchanged, and chapter 7 must render as before (run its screenshots and click-through). No other task in this Part edits `FrontierBuilder`.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>`.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code other than the `FrontierBuilder` preset above. Where the curriculum's Key math and the §3 notation disagree, follow the style guide and report the mismatch; list any symbol the table still lacks as a candidate. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 30-shrinking-the-cross-section` and `npm run screenshots -- 07-mean-variance` pass in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 30-shrinking-the-cross-section` and `npm run clickthrough -- 07-mean-variance` pass and report every widget of each chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widgets use real data: `ff25-size-bm-monthly`, `ff5-monthly`, `mom-monthly` and `osap-ls-monthly` through `assetPanel`.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 30-shrinking-the-cross-section
npm run screenshots -- 07-mean-variance
npm run clickthrough -- 30-shrinking-the-cross-section
npm run clickthrough -- 07-mean-variance
grep -n 'section-tag' src/content/chapters/30-shrinking-the-cross-section.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/30-shrinking-the-cross-section.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
