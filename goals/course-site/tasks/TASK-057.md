---
id: TASK-057
title: 'Chapter 13: Out-of-sample predictability'
milestone: M-5
state: approved
depends_on: [TASK-053]
delivery: pr
---

## Why

SC-7 and M-5. Part III asks whether the predictability of Part II survives in real time and what other signals say. This chapter follows the pattern set by chapters 1 and 9 and the Part I and Part II chapters.

## Scope

Write chapter 13 of `docs/CURRICULUM.md`, "Out-of-sample predictability", as `src/content/chapters/13-out-of-sample-predictability.mdx`, with its widget. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md`, the finished chapters `src/content/chapters/01-returns.mdx`, `src/content/chapters/09-time-varying-expected-returns.mdx` and `src/content/chapters/10-campbell-shiller-decomposition.mdx` (the models to copy), and the library code named below: `src/lib/finance/outOfSample.ts` (from TASK-053, which this task depends on), `src/lib/finance/predictive.ts`.

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GoyalWelch2008.pdf` (Goyal & Welch (2008)) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Cochrane2008.pdf` (Cochrane (2008)). Campbell (2018), Ch. 5, is a book the owner has not supplied: it is not in `source/papers/`, so take no fact from it and list it under further reading only. The sign and slope restrictions are often credited to Campbell & Thompson (2008), which is not in `source/papers/` either: teach them as a method and attribute nothing to that paper unless one of the opened readings says it, with its page. Cite readings in the short form ("Goyal & Welch (2008)"). Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened; list it under further reading. A number in the prose that comes from our data is read from library output, never from a paper.

Chapter:
- Frontmatter: `part: 3`, `chapter: 13`, `difficulty: 2`, `prerequisites: [9, 12]`, a one-sentence `summary`. A prerequisite chapter that does not exist yet renders as plain text; link nothing that does not exist. Where a prerequisite is not yet written (chapter 12 may still be in review), add a short callout that recaps what the reader needs in plain words. Every sentence about another chapter must be true of the merged site.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped in a derivation. Teach the limits honestly: say what out-of-sample tests can and cannot show (for example, low power, and why Clark–West differs from comparing $R^2_{OS}$ with zero).
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter13-numbers.test.ts` that recomputes each one, as `tests/chapter10-numbers.test.ts` does, and list each number with its test in the outcome.

Widget (in `src/components/plots/`), computing only through the libraries above and the typed loaders in `src/lib/data/series.ts`: `OOSRace` (the cumulative squared-error difference against the historical mean from `cumulativeSquaredErrorDifference`, one line per predictor from `goyalWelchPredictors`, with controls for the first forecast year, the data frequency (annual or monthly) and the sign and slope restrictions; the readout gives $R^2_{OS}$, the Clark–West statistic and the certainty-equivalent gain of the highlighted predictor). Highlight one predictor at a time with a `Select` and draw the others in a muted existing token, so the colour tokens suffice; name your choice in the outcome. It follows style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, `prefers-reduced-motion`. If loading code is shared by the widget and the numbers test, put it in one helper next to the widget, as `presentValueSample.ts` does.

Out of scope: other chapters (link back to chapters 9 and 10, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the notation table of `docs/STYLE_GUIDE.md` §3 disagree, follow the style guide and report the mismatch; list symbols the table lacks (such as $R^2_{OS}$) as candidates. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`; a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 13-out-of-sample` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 13-out-of-sample` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widget uses real data from the chapter's curriculum entry (`goyal-welch-annual`, `goyal-welch-monthly`).
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify

```sh
npm ci
npm test
npm run build
npm run screenshots -- 13-out-of-sample
npm run clickthrough -- 13-out-of-sample
grep -n 'section-tag' src/content/chapters/13-out-of-sample-predictability.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/13-out-of-sample-predictability.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'
```

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
