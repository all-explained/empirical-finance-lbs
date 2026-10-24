---
id: TASK-096
title: 'Chapter 24: The generalized method of moments'
milestone: M-8
state: approved
depends_on: [TASK-093]
delivery: pr
---

## Why


SC-7 and M-8. Part VI opens with GMM itself: an estimator written as moment conditions, its consistency and asymptotic normality, and OLS, IV and maximum likelihood as special cases. This chapter follows the pattern of the Part I to Part V chapters.

## Scope


Write chapter 24 of `docs/CURRICULUM.md`, "The generalized method of moments", as `src/content/chapters/24-generalized-method-of-moments.mdx`, with its widget. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part VI block of §3), the finished chapters `src/content/chapters/03-regression-and-standard-errors.mdx`, `src/content/chapters/04-autocorrelation-and-newey-west.mdx`, `src/content/chapters/12-stambaugh-bias.mdx` (a seeded-simulation chapter) and `src/content/chapters/16-time-series-tests-and-grs.mdx` (the models to copy), and the library code named below: `src/lib/stats/gmm.ts` (from the library task this task depends on), `src/lib/stats/ols.ts` and `src/lib/math/distributions.ts`.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Nagel2013.pdf` (Nagel (2013), NBER working-paper version) with `pdftotext -layout` and name the page for any fact you take from it. Cochrane (2005), Ch. 10–11, is not in `source/papers/`: derive every result in your own words from the moment conditions, list the book under further reading only, and take no fact from it. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data or simulations is read from library output, never from a paper.

Chapter:
- Frontmatter: `part: 6`, `chapter: 24`, `difficulty: 3`, `prerequisites: [3, 4]`, a one-sentence `summary`. Link chapters 3 and 4. Every sentence about another chapter must be true of the merged site; name chapters 25 to 27 only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: moment conditions and their sample analogue $g_T(\theta)$, the minimum of $g_T'Wg_T$, why the estimator is consistent, the delta-method step to the sandwich covariance, $S$ as the long-run covariance of the moments (link the Newey–West sum of chapter 4), and OLS, IV and normal maximum likelihood as special cases (show that the weighting matrix does not matter when the model is just identified). Use the Part VI notation of §3, not the curriculum's $f(x_t,\theta)$ and $d$.
- Every number in the prose is read from library output on the seeded toy sample, never typed from memory. Add `tests/chapter24-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widget (in `src/components/plots/`), computing only through `gmm.ts`:
- `GMMObjective`: the objective $g_T'Wg_T$ over $(\mu, \sigma^2)$ for the toy model of `gmm.ts`, as a heat map with contour lines and a legend, the minimum marked, and a `Segmented` control for the number of moments (2: just identified; 4: over-identified). A `methods` prop lists the weighting choices shown in a second `Segmented`; its default is `['one-step', 'two-step']` (identity and efficient weighting) for this chapter, and chapter 25 passes `['one-step', 'two-step', 'iterated', 'cue']`. A `Button` draws a new seeded sample. The readout gives $\hat\theta$, its standard errors and the objective at the minimum. Put the seeded sample and its settings in `src/components/plots/gmmSample.ts`, shared with chapter 25 and with this chapter's numbers test.
Chapter 25 (a parallel task) uses the same widget. If it has merged `GMMObjective` or `gmmSample.ts` when you finish, rebase on `origin/main` and reuse them, extending only through the props described here; otherwise create them as described, so the Part keeps one widget. Say which happened in the outcome. Follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, `prefers-reduced-motion`.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the §3 notation disagree, follow the style guide and report the mismatch; list any symbol the table still lacks as a candidate. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 24-generalized-method-of-moments` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 24-generalized-method-of-moments` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widget uses the seeded toy sample of `gmm.ts`, through `gmmSample.ts`.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 24-generalized-method-of-moments
npm run clickthrough -- 24-generalized-method-of-moments
grep -n 'section-tag' src/content/chapters/24-generalized-method-of-moments.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/24-generalized-method-of-moments.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
