---
id: TASK-139
title: 'Chapter 37: Internal and external habits'
milestone: M-12
state: approved
depends_on: [TASK-136]
delivery: pr
---

## Why


SC-7 and M-12. Part X opens with the first answer to the puzzles of Part IX: habits. A slow-moving external habit makes risk aversion high when consumption is close to it, which raises the equity premium, keeps the risk-free rate low and makes returns predictable. This chapter follows the pattern of the Part I to Part IX chapters.

## Scope


Write chapter 37 of `docs/CURRICULUM.md`, "Internal and external habits", as `src/content/chapters/37-internal-and-external-habits.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part IX and Part X blocks of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/09-time-varying-expected-returns.mdx` (`PredictiveRegression`), `src/content/chapters/35-equity-premium-and-risk-free-rate-puzzles.mdx` (`PuzzleCalculator`, the numbers this chapter answers) and `src/content/chapters/05-persistence-ar1-and-var.mdx` (`AR1Simulator`), and the code named below: `src/lib/finance/habit.ts` and `src/lib/math/quadrature.ts` (from the library task this task depends on), `src/lib/finance/predictive.ts`, `src/components/plots/PredictiveRegression.tsx`, `src/components/plots/predictiveSample.ts` and `src/components/plots/puzzleSample.ts`.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CampbellCochrane1999.pdf` (author manuscript dated May 1998; cite the 1999 *Journal of Political Economy* article and name manuscript pdf pages). Its fonts are scrambled: render pages with `pdftoppm -png -r 150 -f N -l N` and read the images, or run `tesseract` on them. Name the page for any number or fact you take from it; the library's doc comments list the pages of the model, Table 1 (p. 13), the simulated moments (Table 2, p. 20), the long-horizon regressions (Table 5, p. 23) and internal habits (p. 37). Constantinides (1990) and Abel (1990) are not in `source/papers/`: name them only where Campbell & Cochrane do, with their page. Campbell (2018), Ch. 6, is not in `source/papers/`: list it under further reading in the short form and take no fact from it. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data or simulations is read from library output, never from a paper.

Data. Seeded simulations from `simulateHabit`, `priceConsumptionRatio` and `habitClaimReturns`, and `goyal-welch-annual` for the data side of the predictive regression (the dividend–price data of chapter 9, through `usePredictiveSample` of `predictiveSample.ts`). Load through one hook in `src/components/plots/habitSample.ts` built on the existing hooks; write no new loading code that an existing hook already covers. The curriculum's data line names `shiller-monthly`; report in the outcome that the chapter uses chapter 9's `goyal-welch-annual` dividend–price data instead, so the model and the data sit in the same widget.

Chapter:
- Frontmatter: `part: 10`, `chapter: 37`, `difficulty: 3`, `prerequisites: [9, 35]`, a one-sentence `summary`. Link chapters 5, 8, 9 and 35, and chapter 36 where the smoothness of measured consumption matters. Every sentence about another chapter must be true of the merged site; name chapter 38 only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: internal against external habits (with `habitMarginalUtility` and the paper's p. 37), utility over $C_t - X_t$, the surplus ratio $S_t$ and its law of motion, the SDF, the local curvature $\gamma/S_t$, why the sensitivity function keeps the risk-free rate constant, and why a low surplus means a high price of risk, a low price–consumption ratio and high expected returns. Write the curriculum's $\lambda(s_t)$, $g$ and $\phi$ in the symbols of the §3 Part X block and report each replacement. Answer chapter 35 with numbers: the risk-free rate, the Sharpe ratio and the local curvature the model gives at Campbell & Cochrane's parameters, against the data of chapter 35.
- Every number in the prose is read from library output on the committed data or the seeded simulations, never typed from memory. Add `tests/chapter37-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `HabitSimulator`: a seeded consumption path with its habit, the surplus ratio below it, and the price–consumption ratio it implies, with a `Slider` for $\gamma$ and one for $\phi$, a `Button` for a new seed, and a readout of $\bar S$, $s_{\max}$, the risk-free rate, the local curvature now and the mean price–consumption ratio. Recompute the grid solution only when a slider settles if one solve is slow (the library outcome gives its time).
- `PredictiveRegression` preset: add one optional view (for example `predictor="habit"`) whose simulated source is a seeded path of the habit model (the log price–consumption ratio as the predictor, the claim's excess return as the outcome, annual), next to the dividend–price data of chapter 9. The default `dp` view and the `cay` view stay unchanged, and chapters 9 and 14 must render as before (run their screenshots and click-through). No other task in this Part edits `PredictiveRegression`.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>`. If you animate with `useTweened`, guard against issue #120 as the power-utility view of `HJBound` does, until that issue is fixed.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code other than the `PredictiveRegression` view above. A symbol the chapter needs that §3 lacks goes into the Part X block of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 37-internal-and-external-habits`, `npm run screenshots -- 09-time-varying-expected-returns` and `npm run screenshots -- 14-consumption-wealth-ratio` pass in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough` passes for `37-internal-and-external-habits`, `09-time-varying-expected-returns` and `14-consumption-wealth-ratio` and reports every widget of each chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- `HabitSimulator` and the habit view of `PredictiveRegression` use seeded simulations from `src/lib/math/rng.ts`; the data side uses the committed `goyal-welch-annual`; the default views of `PredictiveRegression` are unchanged.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 37-internal-and-external-habits
npm run screenshots -- 09-time-varying-expected-returns
npm run screenshots -- 14-consumption-wealth-ratio
npm run clickthrough -- 37-internal-and-external-habits
npm run clickthrough -- 09-time-varying-expected-returns
npm run clickthrough -- 14-consumption-wealth-ratio
grep -n 'section-tag' src/content/chapters/37-internal-and-external-habits.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/37-internal-and-external-habits.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
