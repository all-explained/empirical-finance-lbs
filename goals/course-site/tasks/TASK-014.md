---
id: TASK-014
title: 'Reference chapter 9: Time-varying expected returns'
milestone: M-2
state: approved
depends_on: [TASK-009, TASK-011, TASK-012]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-5 and M-2. This chapter is the model for a real-data chapter: a regression on public data, the honest caveats, and a seeded simulation next to the data. Every later Weeks 1–9 chapter copies its pattern. Choice recorded in DEC-001 (option B).

## Scope

Write chapter 9 of `docs/CURRICULUM.md`, "Time-varying expected returns", as `src/content/chapters/09-time-varying-expected-returns.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md`, and the code from TASK-011 and TASK-012 (`src/lib/stats/ols.ts`, `src/lib/finance/predictive.ts`).

Papers. These PDFs are in the main checkout, and are not in your worktree. Read them with `pdftotext -layout`:
- `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Cochrane2011.pdf` (the curriculum's reading)
- `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CampbellShiller1988.pdf` (the dividend–price ratio; a teaser for chapter 10)
- `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GoyalWelch2008.pdf` (the annual data and its caveats)

The second reading, Campbell (2018), Ch. 5, is a book. It is not in `source/papers/` and the owner has not supplied it. State no fact or number as taken from it; list it under further reading in the short form "Campbell (2018)". Explain the papers in your own words and cite them in the short form ("Cochrane (2011)"). Never copy their text, figures or tables, and never copy from the LBS outline. Quote a number from a paper only after you read it on the page, and name the page.

Chapter:
- Frontmatter: `part: 2`, `chapter: 9`, `difficulty: 2`, `prerequisites: [4, 5]`, a one-sentence `summary`. Chapters 4 and 5 do not exist yet; check that the build and the page handle prerequisites with no chapter file, and report any defect without changing shared code. Add a short callout that recaps what the reader needs from chapters 4 and 5 (overlapping observations, Newey–West standard errors, an AR(1) series) in plain words. Link nothing that does not exist.
- The six sections in the template order, with `section-tag` headings. About 1,500–3,000 words of prose.
- Cover the Goals: regress future returns on the dividend–price ratio at horizons from one month or one year to ten years; why slopes and `R^2` grow with the horizon (the `b1 (1 - phi^k)/(1 - phi)` link to a persistent predictor); read the evidence as expected returns that change over time.
- Be honest about the limits: the overlapping observations make the effective sample small, so a large `t`-statistic overstates the evidence; the in-sample fit is not a trading result. Teach these as caveats, and name chapters 12 and 13 of the curriculum only as "later chapters". Do not explain Stambaugh bias here.
- Every number in the prose is read from the library output on the committed data, never typed from memory. The outcome lists each number in the chapter with the command or test that produces it.
- 2–3 `Quiz` questions.

Widgets (in `src/components/plots/`), computing only through `src/lib/finance/predictive.ts`, `src/lib/stats/ols.ts` and the typed loaders:
- `PredictiveRegression`: a scatter of `dp` against the next k-year log excess return with the fitted line (colours by role: predictor, return, model, error). Controls: horizon slider (1–10 years), a data switch between `goyal-welch-annual` and "simulated (seeded)" with a re-roll button, and a standard-error choice. The readout shows slope, `t`-statistic and `R^2`. The caption names the dataset ID and the sample period.
- `HorizonCurve`: slope and `R^2` against horizon from the same regression, with the AR(1)-implied slope curve drawn next to the estimate, for the data and for the simulation.
- Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, seeded randomness.

Out of scope: other chapters, edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), library changes. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library.

## Acceptance

- `npm test` and `npm run build` pass.
- `npm run screenshots -- 09-time` passes: no console, KaTeX or overflow errors. View the dark and light, desktop and phone images and say what you saw.
- `npm run clickthrough -- 09-time` passes and reports both widgets.
- The six `section-tag` headings are present in the template order.
- No hex colour appears in the chapter or the new components.
- One widget uses the real `goyal-welch-annual` data and one path is simulated with a seed: show both in the screenshots.
- A voice review, written in the outcome: for each rule of style guide §1, one quoted line of the chapter that follows it, and any line you changed after re-reading.
- A table in the outcome: every number in the prose, and the command or test that gives it.
- The prose is between 1,500 and 3,000 words; the outcome states the command used to count them.

## Verify

```sh
npm ci
npm test
npm run build
npm run screenshots -- 09-time
npm run clickthrough -- 09-time
grep -n 'section-tag' src/content/chapters/09-time-varying-expected-returns.mdx
grep -nE '#[0-9a-fA-F]{3,8}\b' src/content/chapters/09-time-varying-expected-returns.mdx src/components/plots/PredictiveRegression.tsx src/components/plots/HorizonCurve.tsx || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'
```

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
