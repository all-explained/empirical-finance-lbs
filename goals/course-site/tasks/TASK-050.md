---
id: TASK-050
title: 'Chapter 11: Cash-flow and discount-rate news'
milestone: M-4
state: approved
depends_on: [TASK-046, TASK-047]
delivery: pr
---

## Why

SC-7 and M-4. Part II lays out the evidence on return predictability that the rest of the course builds on. This chapter follows the pattern set by chapters 1 and 9 and the Part I chapters.

## Scope

Write chapter 11 of `docs/CURRICULUM.md`, "Cash-flow and discount-rate news", as `src/content/chapters/11-cash-flow-and-discount-rate-news.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md`, the finished chapters `src/content/chapters/01-returns.mdx` and `src/content/chapters/09-time-varying-expected-returns.mdx` (the two models to copy), and the library code named below: `src/lib/finance/news.ts` and `src/lib/finance/presentValue.ts` (from the library tasks this task depends on), `src/lib/stats/var.ts`.

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Cochrane2008.pdf` (Cochrane (2008)) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CampbellShiller1988.pdf` (Campbell & Shiller (1988)). Campbell (2018), Ch. 5, is a book the owner has not supplied: it is not in `source/papers/`, so take no fact from it and list it under further reading only. Cite readings in the short form ("Cochrane (2008)"). Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened; list it under further reading. A number in the prose that comes from our data is read from library output, never from a paper.

Chapter:
- Frontmatter: `part: 2`, `chapter: 11`, `difficulty: 2`, `prerequisites: [10]`, a one-sentence `summary`. A prerequisite chapter that does not exist yet renders as plain text; link nothing that does not exist. Where a prerequisite is not yet written, add a short callout that recaps what the reader needs in plain words.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped in a derivation. Teach the limits honestly: say what the evidence can and cannot show.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter11-numbers.test.ts` that recomputes each one, as `tests/chapter09-numbers.test.ts` does, and list each number with its test in the outcome.
Widgets (in `src/components/plots/`), computing only through the libraries above and the typed loaders in `src/lib/data/series.ts`: `NewsDecomposition` (each year's unexpected return from a VAR(1) on `goyal-welch-annual` as stacked bars of $N_{CF}$ and $-N_{DR}$, with the variance shares in the readout) and `DogThatDidNotBark` (a scatter of seeded $(\hat b_r, \hat b_d)$ draws from `simulateDogNull` under the null of no return predictability, the line $b_r = 1 - \rho\phi + b_d$, the data's estimate marked, and the tail shares from `dogTailShares` in the readout; a control for the $\phi$ assumed under the null). Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, seeded randomness, `prefers-reduced-motion`. Use existing colour tokens for the two kinds of news and name your choice in the outcome.

Out of scope: other chapters (chapter 9 is finished and owner-approved; link back to it, do not edit it), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the notation table of `docs/STYLE_GUIDE.md` §3 disagree, follow the style guide and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`; a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 11-cash-flow` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 11-cash-flow` passes and reports every widget of the chapter.
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
npm run screenshots -- 11-cash-flow
npm run clickthrough -- 11-cash-flow
grep -n 'section-tag' src/content/chapters/11-cash-flow-and-discount-rate-news.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/11-cash-flow-and-discount-rate-news.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'
```

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
