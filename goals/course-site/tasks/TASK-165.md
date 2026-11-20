---
id: TASK-165
title: 'Chapter 45: Spanned and unspanned factors'
milestone: M-14
state: approved
depends_on: [TASK-161]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-14. In an invertible affine model the state is a function of today's yields, so nothing else should forecast bond returns. Regressions often say growth and inflation do; the chapter shows why persistent predictors and overlapping returns make that evidence look stronger than it is, gets the size right with a bootstrap, and explains how a hidden factor could still exist. This chapter follows the pattern of the Part I to Part XI chapters.

## Scope


Write chapter 45 of `docs/CURRICULUM.md`, "Spanned and unspanned factors", as `src/content/chapters/45-spanned-and-unspanned-factors.mdx`, with its widget. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the "Bonds and the term structure" table of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/04-autocorrelation-and-newey-west.mdx` (overlapping returns), `src/content/chapters/12-stambaugh-bias.mdx` (`StambaughBias`, persistent predictors), chapter 42 and chapter 43 if they are merged, and the code named below: `src/lib/finance/spanning.ts` and `src/lib/finance/affine.ts` (from the library tasks), `src/components/plots/StambaughBias.tsx` and `src/components/plots/stambaughSample.ts`. Check each file name with `ls src/content/chapters/` before you link it.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/BauerHamilton2018.pdf` (FRBSF working paper 2015-15; cite the 2018 *Review of Financial Studies* article and name working-paper pdf pages) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Duffee2013.pdf` (cite the 2011 *Review of Financial Studies* article, as `docs/READINGS.md` records; the curriculum calls it Duffee (2013): use the year `docs/READINGS.md` gives and report the mismatch), and name the page for any number or fact you take from them; the library's doc comments list the pages. Joslin, Priebsch & Singleton (2014) and Ludvigson & Ng (2009) are not in `source/papers/`: name them only where an opened reading does, with its page, and take no fact from them. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data or simulations is read from library output, never from a paper.

Data. `gsw-zero-coupon` through `useBondView` of `bondSample.ts`, `fred-macro-monthly` through one hook in `src/components/plots/spanningSample.ts` built on `useSeriesData`, and seeded simulations from `simulatedSpanning` and `hiddenFactorDemo`. The curriculum's data line also names `fred-treasury-monthly`; report in the outcome whether the chapter uses it, and why.

Chapter:
- Frontmatter: `part: 12`, `chapter: 45`, `difficulty: 3`, `prerequisites: [12, 43]`, a one-sentence `summary`. Link chapters 4 and 12, and chapters 42 and 43 if they are merged when you finish; otherwise name them by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name chapter 46, "The convenience yield of Treasuries", only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: why an invertible model makes the state a function of yields ($X_t$ from $Q'y_t$, in §3's symbols; the curriculum writes $W$, the GMM weighting matrix here), the spanning regression and its null, why a persistent predictor and overlapping returns inflate the $R^2$ gain and the $t$-statistic (link chapter 12's bias and chapter 4's overlap), the bootstrap under the null step by step, and what a hidden factor is and why yields cannot reveal it. Put numbers on our data at 2 and 10 years with growth and inflation, and set them next to Bauer & Hamilton's Table 2, marked as theirs and with its page. Say plainly what the evidence allows and what it does not.
- Every number in the prose is read from library output on the committed data or the seeded simulations, never typed from memory. Add `tests/chapter45-numbers.test.ts` that recomputes each one, as `tests/chapter40-numbers.test.ts` does, and list each number with its test in the outcome.

Widget (in `src/components/plots/`), computing only through `spanning.ts`:
- `SpanningBootstrap`: the distribution of the $R^2$ gain under the null as a histogram, with the data's gain as a marked line (do not let colour be the only cue), a `Slider` for the persistence of the macro variable (redrawn from `simulatedSpanning`), a `Segmented` between that seeded world and the Bauer–Hamilton bootstrap on our data at a chosen maturity (2 or 10 years), a `Button` for a new seed, and a readout of the share of samples at or above the data's gain, the 95th percentile and the asymptotic $p$-value. Compute the bootstrap view once per maturity and keep each redraw within what the library measured.
It follows style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone, and keep each readout line short enough not to wrap at 360px), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>` (issue #83). If you animate with `useTweened`, guard against issue #120 as the power-utility view of `HJBound` does, until that issue is fixed.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code other than the `spanningSample.ts` hook. A symbol the chapter needs that §3 lacks goes into the "Bonds and the term structure" table of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

Where jobs run: build, tests, screenshots and click-through run on the MacBook on committed files and seeded simulations; nothing reads CRSP, option or tick data.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 45-spanned-and-unspanned-factors` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 45-spanned-and-unspanned-factors` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widget.
- `SpanningBootstrap` and the prose numbers use the committed `gsw-zero-coupon` and `fred-macro-monthly` and seeded simulations from `src/lib/math/rng.ts`.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 45-spanned-and-unspanned-factors
npm run clickthrough -- 45-spanned-and-unspanned-factors
grep -n 'section-tag' src/content/chapters/45-spanned-and-unspanned-factors.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/45-spanned-and-unspanned-factors.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
