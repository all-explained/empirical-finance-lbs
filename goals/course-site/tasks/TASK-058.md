---
id: TASK-058
title: 'Chapter 14: The consumption–wealth ratio'
milestone: M-5
state: approved
depends_on: [TASK-055]
delivery: pr
---

## Why

SC-7 and M-5. Part III asks whether the predictability of Part II survives in real time and what other signals say. This chapter follows the pattern set by chapters 1 and 9 and the Part I and Part II chapters.

## Scope

Write chapter 14 of `docs/CURRICULUM.md`, "The consumption–wealth ratio", as `src/content/chapters/14-consumption-wealth-ratio.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md`, the finished chapters `src/content/chapters/01-returns.mdx`, `src/content/chapters/09-time-varying-expected-returns.mdx` and `src/content/chapters/10-campbell-shiller-decomposition.mdx` (the models to copy), and the library code named below: `src/lib/stats/cointegration.ts` and `src/lib/finance/cay.ts` (from TASK-055, which this task depends on; its data `fred-cay-quarterly` comes from TASK-054), `src/lib/finance/predictive.ts`, `src/components/plots/PredictiveRegression.tsx` and `src/components/plots/predictiveSample.ts`.

Readings. Open this PDF with `pdftotext -layout` and name the page for any number or fact you take from it: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/LettauLudvigson2001a.pdf` (Lettau & Ludvigson (2001)). Campbell (2018), Ch. 5, is a book the owner has not supplied: it is not in `source/papers/`, so take no fact from it and list it under further reading only. Cite readings in the short form ("Lettau & Ludvigson (2001)"). Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened; list it under further reading. A number in the prose that comes from our data is read from library output, never from a paper.

Chapter:
- Frontmatter: `part: 3`, `chapter: 14`, `difficulty: 3`, `prerequisites: [5, 9]`, a one-sentence `summary`. Both prerequisites exist; link them. Every sentence about another chapter must be true of the merged site.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped in a derivation: the budget constraint, its log-linearisation, why $c - \omega a - (1-\omega) y$ is stationary, dynamic OLS, and the predictive regression. Teach the limits honestly: the look-ahead problem of full-sample weights, and how our public-data $cay$ differs from the published one.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter14-numbers.test.ts` that recomputes each one, as `tests/chapter10-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above and the typed loaders in `src/lib/data/series.ts`:
- `CointegrationDemo`: two seeded trending series from `simulateCointegratedPair` and their combination $y_t - w\,x_t$ from `combination`, with a slider for $w$, a new-draw button that changes the seed, and the persistence of the combination in the readout, so the reader sees it turn stationary only at the true weight.
- `PredictiveRegression` with $cay$: add one optional prop that selects the predictor (default `dp`, so chapter 9 renders and behaves exactly as before; check its screenshots) and use it with the annual `cay` column of `goyal-welch-annual`, which is Lettau and Ludvigson's published series. This is the one change to shared code allowed.
- `CayLookAhead` (an addition to the curriculum's list; report it): the full-sample and the real-time $cay$ from `fullSampleCay` and `realTimeCay` over time, with the slope and $R^2$ of next-quarter excess returns (`quarterlyExcessReturns`) on each in the readout.
All follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, seeded randomness, `prefers-reduced-motion`. $cay$ is a predictor, so use `--c-signal`; name any other token choice in the outcome. If loading code is shared by the widgets and the numbers test, put it in one helper next to the widgets, as `presentValueSample.ts` does.

Out of scope: other chapters (do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome, including that the curriculum names `fred-consumption-quarterly` while the chapter uses `fred-cay-quarterly`), other changes to shared code. Where the curriculum's Key math and the notation table of `docs/STYLE_GUIDE.md` §3 disagree, follow the style guide and report the mismatch; list symbols the table lacks (such as $cay$, $\omega$, $\rho_w$) as candidates. If a library or data defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch it. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`; a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 14-consumption` and `npm run screenshots -- 09-time-varying` pass in both themes at desktop and phone size, and you inspected the images (chapter 9 looks as before).
- `npm run clickthrough -- 14-consumption` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- At least one widget uses real data from `goyal-welch-annual` or `fred-cay-quarterly`, and every simulation is seeded.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify

```sh
npm ci
npm test
npm run build
npm run screenshots -- 14-consumption
npm run screenshots -- 09-time-varying
npm run clickthrough -- 14-consumption
grep -n 'section-tag' src/content/chapters/14-consumption-wealth-ratio.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/14-consumption-wealth-ratio.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'
```

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
