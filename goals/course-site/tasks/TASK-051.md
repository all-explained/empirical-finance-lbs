---
id: TASK-051
title: 'Chapter 12: Stambaugh bias'
milestone: M-4
state: approved
depends_on: [TASK-048]
delivery: pr
---

## Why

SC-7 and M-4. Part II lays out the evidence on return predictability that the rest of the course builds on. This chapter follows the pattern set by chapters 1 and 9 and the Part I chapters.

## Scope

Write chapter 12 of `docs/CURRICULUM.md`, "Stambaugh bias", as `src/content/chapters/12-stambaugh-bias.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md`, the finished chapters `src/content/chapters/01-returns.mdx` and `src/content/chapters/09-time-varying-expected-returns.mdx` (the two models to copy), and the library code named below: `src/lib/stats/stambaugh.ts` (from the library task this task depends on), `src/lib/finance/predictive.ts`.

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Cochrane2008.pdf` (Cochrane (2008)). Campbell (2018), Ch. 5, is a book the owner has not supplied, and Stambaugh (1999) is not in `source/papers/` either: take no fact from them and list them under further reading only. Cite readings in the short form ("Cochrane (2008)"). Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened; list it under further reading. A number in the prose that comes from our data is read from library output, never from a paper.

Chapter:
- Frontmatter: `part: 2`, `chapter: 12`, `difficulty: 2`, `prerequisites: [5, 9]`, a one-sentence `summary`. A prerequisite chapter that does not exist yet renders as plain text; link nothing that does not exist. Where a prerequisite is not yet written, add a short callout that recaps what the reader needs in plain words.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped in a derivation. Teach the limits honestly: say what the evidence can and cannot show.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter12-numbers.test.ts` that recomputes each one, as `tests/chapter09-numbers.test.ts` does, and list each number with its test in the outcome.
Widgets (in `src/components/plots/`), computing only through the libraries above and the typed loaders in `src/lib/data/series.ts`: `StambaughBias` (many seeded samples under $b = 0$ from `simulateSlopes`; a histogram of $\hat b$ and one of its $t$-statistic, with sliders for $\phi$, $\operatorname{corr}(u, v)$ and $T$; the analytic bias from `stambaughBias` and the simulated 5% critical value marked; a preset that sets the sliders to the estimates of `predictiveSystem` on `goyal-welch-annual` and marks the data's $\hat b$ and $t$). It follows style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, seeded randomness, `prefers-reduced-motion`. Write a correlation as $\operatorname{corr}(\cdot,\cdot)$, never $\rho$.

Out of scope: other chapters (chapter 9 is finished and owner-approved; link back to it, do not edit it), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the notation table of `docs/STYLE_GUIDE.md` §3 disagree, follow the style guide and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`; a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 12-stambaugh` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 12-stambaugh` passes and reports every widget of the chapter.
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
npm run screenshots -- 12-stambaugh
npm run clickthrough -- 12-stambaugh
grep -n 'section-tag' src/content/chapters/12-stambaugh-bias.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/12-stambaugh-bias.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'
```

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
