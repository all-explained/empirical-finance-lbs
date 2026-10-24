---
id: TASK-091
title: 'Chapter 27: Identification: weak and useless factors'
milestone: M-8
state: approved
depends_on: [TASK-087]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-8. Part VI closes with identification: a factor unrelated to returns can look priced with a high cross-sectional R², the rank condition can be tested, and GRS-FAR confidence sets stay valid when betas are weak. This chapter follows the pattern of the Part I to Part V chapters.

## Scope


Write chapter 27 of `docs/CURRICULUM.md`, "Identification: weak and useless factors", as `src/content/chapters/27-weak-and-useless-factors.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part VI block of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/12-stambaugh-bias.mdx` (a seeded-simulation chapter), `src/content/chapters/17-cross-sectional-regressions-and-fama-macbeth.mdx`, `src/content/chapters/18-errors-in-variables-and-shanken.mdx` and `src/content/chapters/22-conditional-factor-models.mdx` (the models to copy), chapter 26 if it is merged, and the library code named below: `src/lib/finance/identification.ts` (from the library task this task depends on), `src/lib/finance/crossSection.ts` and `src/lib/finance/conditional.ts` (`quarterlyPanel`).

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GospodinovKanRobotti2019.pdf` (Gospodinov, Kan & Robotti (2019), working-paper version), `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/KleibergenZhan2019.pdf` (Kleibergen & Zhan (2020), published version; the curriculum says 2019, cite 2020 and report the mismatch) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Nagel2013.pdf` (Nagel (2013)). Kan & Zhang (1999) is not in `source/papers/`: take no fact from it. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data or simulations is read from library output, never from a paper.

Data. The curriculum lists `fred-consumption-quarterly`, which starts in 2007 and is too short. Take consumption growth from `fred-cay-quarterly` through `quarterlyPanel`, as chapter 22 does, and report the mismatch in the outcome. Reuse the loaders of `src/components/plots/conditionalSample.ts` (`useConditionalData`), which share one series-loading hook; write no new `useEffect` loading code.

Chapter:
- Frontmatter: `part: 6`, `chapter: 27`, `difficulty: 3`, `prerequisites: [18, 26]`, a one-sentence `summary`. Link chapter 18. Link chapter 26 if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name Part VII's first chapter only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: the rank condition $\mathrm{rank}(\mathbb{E}[R^e f']) = K$, why $\hat\lambda$ does not converge and $R^2$ does not go to zero when $\beta \to 0$, the one-factor rank test, the GRS-FAR statistic at a hypothesised $\lambda^{\circ}$ and its inversion into a confidence set, and why that set can be unbounded. Apply the tests to consumption growth on the quarterly 25 portfolios and say plainly what our data show. Use the Part VI notation of §3.
- Every number in the prose is read from library output on the committed data or the seeded simulations, never typed from memory. Add `tests/chapter27-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `UselessFactor`: histograms of the second-pass $t$-statistic and cross-sectional $R^2$ for seeded useless factors on the real monthly 25 portfolios (`simulateUselessFactor`), with a `Slider` for the factor's strength (0 is useless), a `Segmented` for Fama–MacBeth or Shanken $t$, and the share of $|t| > 1.96$ in the readout.
- `ConfidenceSet`: Wald and GRS-FAR sets for $\lambda$ on a number line, with a `Slider` for the beta spread (`simulateWeakIdentification`) and a `Segmented` to switch to consumption growth on the quarterly 25 portfolios; the readout gives each set (or "unbounded") and the simulated coverage.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, `prefers-reduced-motion`. Put the data hook the widgets and the numbers test share in `src/components/plots/identificationSample.ts`, built on `useConditionalData` and the loaders of `src/components/plots/factorTestSample.ts`.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the §3 notation disagree, follow the style guide and report the mismatch; list any symbol the table still lacks as a candidate. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 27-weak-and-useless-factors` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 27-weak-and-useless-factors` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widgets use real data (`ff25-size-bm-monthly`, `ff3-monthly`, `fred-cay-quarterly`) and seeded simulations from `src/lib/math/rng.ts`.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 27-weak-and-useless-factors
npm run clickthrough -- 27-weak-and-useless-factors
grep -n 'section-tag' src/content/chapters/27-weak-and-useless-factors.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/27-weak-and-useless-factors.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
