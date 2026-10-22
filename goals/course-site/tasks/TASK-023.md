---
id: TASK-023
title: 'Chapter 3: Regression and standard errors'
milestone: M-3
state: approved
depends_on: []
delivery: pr
---

## Why

SC-7 and M-3. Part I gives the reader the tools that Weeks 1–9 assume. This chapter follows the pattern set by chapters 1 and 9.

## Scope

Write chapter 3 of `docs/CURRICULUM.md`, "Regression and standard errors", as `src/content/chapters/03-regression-and-standard-errors.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md`, the finished chapters `src/content/chapters/01-returns.mdx` and `src/content/chapters/09-time-varying-expected-returns.mdx` (the two models to copy), and the library code named below: `src/lib/stats/ols.ts` (classical and White errors already exist; do not change it).

Readings. The readings of this chapter are books and are not in `source/papers/`: the owner has not supplied them. Cite readings in the short form ("Cochrane (2005)"). Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened; list it under further reading. If a PDF exists, read it with `pdftotext -layout` and name the page for any number you quote.

Chapter:
- Frontmatter: `part: 1`, `chapter: 3`, `difficulty: 1`, `prerequisites: [2]`, a one-sentence `summary`. A prerequisite chapter that does not exist yet renders as plain text; link nothing that does not exist. Where a prerequisite is not yet written, add a short callout that recaps what the reader needs in plain words.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped in a derivation. Teach the limits honestly: say what the evidence can and cannot show.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter03-numbers.test.ts` that recomputes each one, as `tests/chapter09-numbers.test.ts` does, and list each number with its test in the outcome.
Widgets (in `src/components/plots/`), computing only through the libraries above and the typed loaders in `src/lib/data/series.ts`: `RegressionLab` (a scatter with draggable points, the OLS line, residuals, and a toggle between classical and White standard errors; preset: a stock's excess return on the market, from `ff3-monthly`, giving its beta). Show a seeded heteroskedastic case where the two standard errors differ. Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, seeded randomness, `prefers-reduced-motion`.

Out of scope: other chapters, edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`; a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 03-regression` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 03-regression` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- At least one widget uses real data from the chapter's curriculum entry, and every simulation is seeded.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify

```sh
npm ci
npm test
npm run build
npm run screenshots -- 03-regression
npm run clickthrough -- 03-regression
grep -n 'section-tag' src/content/chapters/03-regression-and-standard-errors.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/03-regression-and-standard-errors.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'
```

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
