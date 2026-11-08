---
id: TASK-146
title: 'Chapter 40: Yields, forwards and bond returns'
milestone: M-13
state: approved
depends_on: [TASK-143]
delivery: pr
---

## Why


SC-7 and M-13. Part XI opens with the language of bonds: how prices, yields, forward rates and holding-period returns are one set of numbers seen four ways, what the US yield curve has looked like since 1985, and what the expectations hypothesis says. This chapter follows the pattern of the Part I to Part X chapters.

## Scope


Write chapter 40 of `docs/CURRICULUM.md`, "Yields, forwards and bond returns", as `src/content/chapters/40-yields-forwards-and-bond-returns.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the "Bonds and the term structure" table of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/01-returns.mdx` (log returns and `ReturnCalculator`), `src/content/chapters/06-principal-components.mdx` (where the reader first met GSW yield changes) and `src/content/chapters/08-euler-equation-and-sdf.mdx` (a price as an expected discounted payoff), and the code named below: `src/lib/finance/bonds.ts` (from the library task this task depends on) and `src/components/plots/seriesSample.ts` (`useSeriesData`). Check each file name with `ls src/content/chapters/` before you link it.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CochranePiazzesi2005.pdf` (published; journal page = pdf page + 137) for the definitions of forward rates and holding-period returns (p. 141), and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CampbellShiller1991.pdf` (NBER working paper 3153; cite the 1991 *Review of Economic Studies* article and name working-paper pdf pages; check its OCR text against the page image) for the expectations hypothesis, eq. (1), pdf p. 6, and coupon bonds as portfolios of zero-coupon bonds, pdf p. 15. The library's doc comments list these pages. Campbell, Lo & MacKinlay (1997), Ch. 10, and Cochrane (2005), Ch. 19, are not in `source/papers/`: list them under further reading in the short form and take no fact from them. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper.

Data. `gsw-zero-coupon` (end-of-month zero-coupon yields, 1985-11 to 2026-09) for every curve and return, and `fred-treasury-monthly` for the Treasury's constant-maturity par yields on the par view, loaded through one hook in `src/components/plots/bondSample.ts` built on `useSeriesData`; write no new loading code that an existing hook already covers. Chapters 41 and 42 reuse that hook. Say in the caption that FRED's yields are monthly averages with semi-annual coupons, that GSW's are end of month, and that FRED has no months from 1987-01 to 1993-09.

Chapter:
- Frontmatter: `part: 11`, `chapter: 40`, `difficulty: 2`, `prerequisites: [1]`, a one-sentence `summary`. Link chapters 1, 6 and 8, and chapter 35 where the risk-free rate appears. Every sentence about another chapter must be true of the merged site; name chapter 41, "Testing the expectations hypothesis", only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: $p^{(n)}_t$ and $y^{(n)}_t$, the forward rate as the rate locked in today for a loan from $n - 1$ to $n$ and the yield as the average of forwards, the par yield, the holding-period return and its exact split into the yield, the roll-down and the shift of the curve, the excess return, and the expectations hypothesis with its constant. Read the curve on our data: its usual slope, the months it was inverted, and the mean excess return by maturity since 1985. Show with `perfectForesightYield` how a long yield compares with the short rates that followed it, and say plainly that this is hindsight, not a test (chapter 41 tests it).
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter40-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through `bonds.ts`:
- `YieldCurveMovie`: the GSW zero curve at one month, with a date `Slider`, a play `Button` that steps through the months (no autoplay under `prefers-reduced-motion`), a `Segmented` for zero, forward and par curves, and the FRED constant-maturity yields as points on the par view (do not let colour be the only cue between GSW and FRED). Readout: the date, the 1-, 10- and 30-year values of the chosen curve, and the 10-year minus 1-year slope.
- `BondReturnCalc`: a `Slider` for the maturity $n$ (2–30 years) and one for the purchase month; the bond is sold twelve months later. Show the curve at purchase and at sale, and a readout of the yield, the roll-down, the shift, the log return, the excess return over $y^{(1)}_t$ and the simple return, with the parts summing to the return.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone, and keep each readout line short enough not to wrap at 360px, as chapter 37 had to fix), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>` (issue #83). If you animate with `useTweened`, guard against issue #120 as the power-utility view of `HJBound` does, until that issue is fixed.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code. A symbol the chapter needs that §3 lacks goes into the "Bonds and the term structure" table of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 40-yields-forwards-and-bond-returns` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 40-yields-forwards-and-bond-returns` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- `YieldCurveMovie`, `BondReturnCalc` and the prose numbers use the committed `gsw-zero-coupon` and `fred-treasury-monthly` through `bondSample.ts`.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 40-yields-forwards-and-bond-returns
npm run clickthrough -- 40-yields-forwards-and-bond-returns
grep -n 'section-tag' src/content/chapters/40-yields-forwards-and-bond-returns.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/40-yields-forwards-and-bond-returns.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
