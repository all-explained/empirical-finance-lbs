---
id: TASK-147
title: 'Chapter 41: Testing the expectations hypothesis'
milestone: M-13
state: approved
depends_on: [TASK-144]
delivery: pr
---

## Why


SC-7 and M-13. The expectations hypothesis makes sharp predictions, and the data reject them: when the curve is steep, long yields tend to fall, not rise, and excess bond returns are high. The chapter runs the tests on our data, shows with a seeded world where the hypothesis holds that chance does not explain the result, and reads it as a time-varying bond risk premium. This chapter follows the pattern of the Part I to Part X chapters.

## Scope


Write chapter 41 of `docs/CURRICULUM.md`, "Testing the expectations hypothesis", as `src/content/chapters/41-testing-the-expectations-hypothesis.mdx`, with its widget views. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the "Bonds and the term structure" table of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/04-autocorrelation-and-newey-west.mdx` (overlapping observations), `src/content/chapters/09-time-varying-expected-returns.mdx` (`PredictiveRegression`, `HorizonCurve`), `src/content/chapters/12-stambaugh-bias.mdx` and chapter 40 if it is merged, and the code named below: `src/lib/finance/expectationsHypothesis.ts` and `src/lib/finance/bonds.ts` (from the library tasks), `src/components/plots/PredictiveRegression.tsx`, `src/components/plots/HorizonCurve.tsx`, `src/components/plots/predictiveSample.ts` and `src/components/plots/habitSample.ts` (how chapter 37 added a view). Check each file name with `ls src/content/chapters/` before you link it.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CampbellShiller1991.pdf` (NBER working paper 3153, October 1989; cite the 1991 *Review of Economic Studies* article and name working-paper pdf pages; the OCR text is garbled in places, so read every number you cite from the page image, `pdftoppm -png -r 150 -f N -l N`) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CochranePiazzesi2005.pdf` (published; journal page = pdf page + 137), and name the page for any number or fact you take from them; the library's doc comments list the pages of the regressions, Tables 1a and 2 of Campbell & Shiller, their Monte Carlo and their reading of the result, and Table 2 of Cochrane & Piazzesi. Campbell, Lo & MacKinlay (1997), Ch. 10, is not in `source/papers/`: list it under further reading in the short form and take no fact from it. Fama & Bliss (1987) is not in `source/papers/`: name it only where an opened reading does, with its page. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data or simulations is read from library output, never from a paper.

Data. `gsw-zero-coupon` through the hook of `src/components/plots/bondSample.ts` if chapter 40 has merged it; otherwise add that hook, built on `useSeriesData`, and say so in the outcome. Seeded simulations from `simulateExpectationsWorld` and `slopeDistribution`. The curriculum's data line also names `fred-treasury-monthly`; report in the outcome that the chapter does not use it, because its yields are monthly averages of par yields, not the end-of-month zero-coupon yields the identities need.

Chapter:
- Frontmatter: `part: 11`, `chapter: 41`, `difficulty: 2`, `prerequisites: [9, 40]`, a one-sentence `summary`. Link chapters 4, 9 and 12, and chapter 40 if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name chapter 42, "Level, slope, curvature and bond risk premia", only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: why the hypothesis implies slope 1 in the yield-change regression (the capital loss a rising yield brings), the perfect-foresight regression, the forward-spread regression and why its slope is 0 for excess returns, why eleven months of overlap need Hansen–Hodrick errors, how far samples of our length stray from 1 under the hypothesis, and how a time-varying term premium makes long yields move the wrong way. Write the curriculum's $a$, $b$ and the spread in the symbols of §3 and report each replacement. Put numbers on our data at several maturities, and set them next to Campbell & Shiller's and Cochrane & Piazzesi's tables, marked as theirs and with their page.
- Every number in the prose is read from library output on the committed data or the seeded simulations, never typed from memory. Add `tests/chapter41-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `PredictiveRegression` view: add one optional view, `predictor="spread"`, whose scatter is the yield-change regression at one maturity, with a maturity `Slider` (2–20 years) in place of the horizon, the data from `gsw-zero-coupon`, the existing simulated source drawn from `simulateExpectationsWorld` (with a two-option `Segmented` that adds the term premium), and a readout of the slope, its Hansen–Hodrick standard error, its $t$-statistic against 1, $R^2$ and, for the simulation, the slope the hypothesis implies. The `dp`, `cay` and `habit` views stay unchanged, and chapters 9, 14 and 37 must render as before (run their screenshots and click-through).
- `HorizonCurve` view: add one optional view, `predictor="spread"`, with maturity on the x-axis: the slope at each maturity with ±2 Hansen–Hodrick standard errors, the hypothesis line, a `Segmented` between the yield-change regression (line at 1) and the forward-spread regression for excess returns (line at 0), and a `Button` that draws `slopeDistribution` for the chosen maturity and shows the band of 90% of the samples. The default view stays unchanged, and chapter 9 must render as before.
No other task in this Part edits `PredictiveRegression` or `HorizonCurve`. Both views follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone, and keep each readout line short enough not to wrap at 360px, as chapter 37 had to fix), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>` (issue #83). If you animate with `useTweened`, guard against issue #120 as the power-utility view of `HJBound` does, until that issue is fixed.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code other than the two views above and the `bondSample.ts` hook if chapter 40 has not added it. A symbol the chapter needs that §3 lacks goes into the "Bonds and the term structure" table of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 41-testing-the-expectations-hypothesis`, `npm run screenshots -- 09-time-varying-expected-returns`, `npm run screenshots -- 14-consumption-wealth-ratio` and `npm run screenshots -- 37-internal-and-external-habits` pass in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough` passes for `41-testing-the-expectations-hypothesis`, `09-time-varying-expected-returns`, `14-consumption-wealth-ratio` and `37-internal-and-external-habits` and reports every widget of each chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The spread views use the committed `gsw-zero-coupon` and seeded simulations from `src/lib/math/rng.ts`; the default views of `PredictiveRegression` and `HorizonCurve` are unchanged.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 41-testing-the-expectations-hypothesis
npm run screenshots -- 09-time-varying-expected-returns
npm run screenshots -- 14-consumption-wealth-ratio
npm run screenshots -- 37-internal-and-external-habits
npm run clickthrough -- 41-testing-the-expectations-hypothesis
npm run clickthrough -- 09-time-varying-expected-returns
npm run clickthrough -- 14-consumption-wealth-ratio
npm run clickthrough -- 37-internal-and-external-habits
grep -n 'section-tag' src/content/chapters/41-testing-the-expectations-hypothesis.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/41-testing-the-expectations-hypothesis.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
