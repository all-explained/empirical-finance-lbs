---
id: TASK-013
title: 'Reference chapter 1: Returns'
milestone: M-2
state: approved
depends_on: [TASK-009, TASK-010]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-5 and M-2. This chapter is the model for the gentle "from zero" voice. Every later Foundations chapter copies its template, its widgets and its tone. Choice recorded in DEC-001 (option B).

## Scope

Write chapter 1 of `docs/CURRICULUM.md`, "Returns", as `src/content/chapters/01-returns.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md` (Goals, Key math, Widgets, Data), all of `docs/STYLE_GUIDE.md` (voice, template, notation, colours, widgets, quizzes), `docs/DATA.md`, and the code from TASK-010 (`src/lib/finance/returns.ts`).

Chapter:
- Frontmatter as in style guide §2: `part: 1`, `chapter: 1`, `difficulty: 1`, `prerequisites: []`, a one-sentence `summary`.
- The six sections in the template order, each heading starting with its `section-tag`. About 1,500–3,000 words of prose. The reader knows nothing about finance or statistics: define each term the first time, with a plain example, and begin with a concrete question answered by real data.
- Cover the curriculum's Goals: simple, log and excess returns from prices and dividends; compounding over many periods; why log returns add over time and simple returns add across assets; why the average log return is below the average simple return (the `mean - variance/2` approximation).
- Notation and colours exactly as the style guide fixes them: the `\Ret`, `\Rf` and related macros, never a hard-coded colour.
- 2–3 `Quiz` questions, one idea each, with an explanation for every answer.

Widgets (in `src/components/plots/`), computing only through `src/lib/finance/returns.ts` and the typed loaders in `src/lib/data/series.ts`:
- `CompoundingPath`: one dollar invested in the market and in T-bills, from `ff3-monthly` (market = `Mkt-RF + RF`). Controls: linear or log scale, simple or log returns, and a start-year slider. The readout shows the final value, the average simple monthly return, the average log monthly return and the `mean - variance/2` approximation. The caption names the dataset ID and the sample period.
- `ReturnCalculator`: the reader types two prices and a dividend and sees the simple, log and gross return, and what the same price move compounds to over several periods.
- Both follow style guide §5: `WidgetFrame`, `PlotFrame`, the shared controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout.

The `shiller-monthly` dataset is listed in the curriculum for this chapter. Use it where it makes the story clearer (for example a long-run price-only versus total-return comparison), or leave it out and say so in the outcome.

Readings. The curriculum cites Campbell (2018), Ch. 1 and Campbell, Lo and MacKinlay (1997), Ch. 1. Both are books. They are not in `source/papers/` and the owner has not supplied them (see `docs/READINGS.md`). Therefore: state no fact, number or example as taken from them; the formulas here are standard and you derive them yourself; list the two books in "further reading" in the short form "Campbell (2018)". Never copy text from any reading or from the LBS outline.

Out of scope: other chapters, edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to the shared components unless a defect blocks you (then report it).

## Acceptance

- `npm test` and `npm run build` pass.
- `npm run screenshots -- 01-returns` passes: no console, KaTeX or overflow errors. View the dark and light, desktop and phone images and say what you saw.
- `npm run clickthrough -- 01-returns` passes and reports both widgets.
- The six `section-tag` headings are present in the template order.
- No hex colour appears in the chapter or the new components.
- A voice review, written in the outcome: for each rule of style guide §1, one quoted line of the chapter that follows it, and any line you changed after re-reading.
- The prose is between 1,500 and 3,000 words; the outcome states the command used to count them.

## Verify

```sh
npm ci
npm test
npm run build
npm run screenshots -- 01-returns
npm run clickthrough -- 01-returns
grep -n 'section-tag' src/content/chapters/01-returns.mdx
grep -nE '#[0-9a-fA-F]{3,8}\b' src/content/chapters/01-returns.mdx src/components/plots/CompoundingPath.tsx src/components/plots/ReturnCalculator.tsx || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'
```

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
