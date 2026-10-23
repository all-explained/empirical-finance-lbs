---
id: TASK-059
title: 'Chapter 15: Expected returns from option prices'
milestone: M-5
state: approved
depends_on: [TASK-056]
delivery: pr
---

## Why

SC-7 and M-5. Part III asks whether the predictability of Part II survives in real time and what other signals say. This chapter follows the pattern set by chapters 1 and 9 and the Part I and Part II chapters.

## Scope

Write chapter 15 of `docs/CURRICULUM.md`, "Expected returns from option prices", as `src/content/chapters/15-expected-returns-from-option-prices.mdx`, with its widget. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, the finished chapters `src/content/chapters/01-returns.mdx`, `src/content/chapters/08-euler-equation-and-sdf.mdx` and `src/content/chapters/09-time-varying-expected-returns.mdx` (the models to copy), and the library code named below: `src/lib/finance/optionBound.ts` (from TASK-056, which this task depends on), `src/lib/finance/sdf.ts`.

Readings. Open this PDF with `pdftotext -layout` and name the page for any number or fact you take from it: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Martin2017.pdf` (Martin (2017)). Campbell (2018), Ch. 5, is a book the owner has not supplied: it is not in `source/papers/`, so take no fact from it and list it under further reading only. Cite readings in the short form ("Martin (2017)"). Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened; list it under further reading. The chapter has no real option data (the curriculum lists Martin's SVIX series as data wanted later): say plainly that the smile is simulated, and quote the paper's numbers (for example, the bound in 2008) only with their page.

Chapter:
- Frontmatter: `part: 3`, `chapter: 15`, `difficulty: 3`, `prerequisites: [8, 13]`, a one-sentence `summary`. A prerequisite chapter that does not exist yet renders as plain text; link nothing that does not exist. Where a prerequisite is not yet written (chapter 13 may still be in review), add a short callout that recaps what the reader needs in plain words. Every sentence about another chapter must be true of the merged site.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped in a derivation: from the SDF pricing equation of chapter 8 to the bound, the condition under which it holds (state it and what it rules out), the strip integral, and the entropy comparison. Teach the limits honestly: say what a lower bound can and cannot tell.
- Every number in the prose is read from library output, never typed from memory. Add `tests/chapter15-numbers.test.ts` that recomputes each one, as `tests/chapter10-numbers.test.ts` does, and list each number with its test in the outcome.

Widget (in `src/components/plots/`), computing only through the library above: `OptionStripBound` (a seeded smile from `seededSmile`, the out-of-the-money strip from `optionStrip` as puts left of the forward and calls right of it, and the bound from `martinLowerBound` in the readout with $\mathrm{SVIX}^2$ and $\mathrm{VIX}^2$; a slider for the level of volatility, so the reader sees the bound spike when volatility is high, and a new-draw button that changes the seed). It follows style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, seeded randomness, `prefers-reduced-motion`. Use existing colour tokens (a risk-neutral quantity is a probability-weighted price; name your choice in the outcome).

Out of scope: other chapters (do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the notation table of `docs/STYLE_GUIDE.md` §3 disagree, follow the style guide and report the mismatch; list symbols the table lacks (such as $\mathrm{SVIX}$, $\mathrm{var}^*$, $L(X)$) as candidates. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`; a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 15-expected-returns` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 15-expected-returns` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widget.
- Every simulation is seeded, and the chapter says that its option prices are simulated.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify

```sh
npm ci
npm test
npm run build
npm run screenshots -- 15-expected-returns
npm run clickthrough -- 15-expected-returns
grep -n 'section-tag' src/content/chapters/15-expected-returns-from-option-prices.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/15-expected-returns-from-option-prices.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'
```

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
