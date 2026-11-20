---
id: TASK-164
title: 'Chapter 44: Pricing the term structure with linear regressions'
milestone: M-14
state: approved
depends_on: [TASK-160, TASK-163]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-14. An affine model can be estimated with three sets of OLS regressions instead of maximum likelihood. The chapter runs them on our data, checks that the fitted curve prices the yields it never targeted, and reads the history of the 10-year term premium it implies. It waits for chapter 43 because it adds a preset to chapter 43's `TermPremium` widget. This chapter follows the pattern of the Part I to Part XI chapters.

## Scope


Write chapter 44 of `docs/CURRICULUM.md`, "Pricing the term structure with linear regressions", as `src/content/chapters/44-pricing-the-term-structure-with-linear-regressions.mdx`, with its widget views. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the "Bonds and the term structure" table of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/03-regression-and-standard-errors.mdx` (`RegressionLab`), `src/content/chapters/06-principal-components.mdx`, `src/content/chapters/43-affine-term-structure-models.mdx` and chapter 42 if it is merged, and the code named below: `src/lib/finance/acm.ts` and `src/lib/finance/affine.ts` (from the library tasks), `src/components/plots/TermPremium.tsx` (from chapter 43), `src/components/plots/RegressionLab.tsx` and `src/components/plots/regressionSample.ts` (how chapter 26 added the `gmm` preset). Check each file name with `ls src/content/chapters/` before you link it.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/AdrianCrumpMoench2013.pdf` (New York Fed Staff Report 340; cite the 2013 *Journal of Financial Economics* article and name working-paper pdf pages) and name the page for any number or fact you take from it; the library's doc comments list the pages of the three steps, the data, Table 2, Table 3 and Fig. 4. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper. Say about how GSW builds its curves only what `docs/DATA.md` states.

Data. `gsw-svensson-parameters` (and `gsw-zero-coupon` where the chapter compares with the published yields), loaded through one hook in `src/components/plots/acmSample.ts` built on `useSeriesData`, that runs `acmInputs`, `acmEstimate` and `acmFit` once and shares the result between the widgets; write no other loading code.

Chapter:
- Frontmatter: `part: 12`, `chapter: 44`, `difficulty: 3`, `prerequisites: [42, 43]`, a one-sentence `summary`. Link chapters 3, 6 and 43, and chapter 42 if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name chapter 45, "Spanned and unspanned factors", only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: principal components as pricing factors and their VAR, why the expected excess return is $\beta'(\lambda_0 + \lambda_1 X_t)$ minus a convexity term, the stacked regression and its three steps, how the prices of risk come from a cross-sectional regression on $\beta$ (link chapter 17's two-pass idea only if you say how it differs), why no recursion is imposed and how close $\hat\beta^{(n)}$ comes to $B_n$ anyway, the fitted yields and their pricing errors, and the term premium's history on our data. Write the curriculum's symbols in those of §3 and report each replacement. Set our numbers next to Adrian, Crump & Moench's Table 2 and Table 3, marked as theirs, on the paper's sample preset.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter44-numbers.test.ts` that recomputes each one, as `tests/chapter40-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `TermPremium` preset: the estimated model's fitted yield, risk-neutral yield and term premium on our data, month by month, through the optional prop chapter 43 documented, with a maturity `Slider` and a `Segmented` for the two sample presets; the readout names the date, the three values and the yield pricing error. The seeded view stays unchanged, and chapter 43 must render as before (run its screenshots and click-through).
- `RegressionLab` presets: one per step, from `acmStepRegressions` (`acm-var`, `acm-returns`, `acm-cross-section`), each with the selector the step needs (state component, maturity) and a readout that names what the full estimate gives. The `data`, `fan` and `gmm` sources stay unchanged, and chapters 3 and 26 must render as before (run their screenshots and click-through). No other task in this Part edits `RegressionLab`.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone, and keep each readout line short enough not to wrap at 360px), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>` (issue #83). If you animate with `useTweened`, guard against issue #120 as the power-utility view of `HJBound` does, until that issue is fixed.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code other than the two widget extensions above and the `acmSample.ts` hook. A symbol the chapter needs that §3 lacks goes into the "Bonds and the term structure" table of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

Where jobs run: build, tests, screenshots and click-through run on the MacBook on committed files; the estimate takes milliseconds; nothing reads CRSP, option or tick data.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 44-pricing-the-term-structure-with-linear-regressions`, `npm run screenshots -- 43-affine-term-structure-models`, `npm run screenshots -- 03-regression-and-standard-errors` and `npm run screenshots -- 26-gmm-for-asset-pricing-models` pass in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough` passes for `44-pricing-the-term-structure-with-linear-regressions`, `43-affine-term-structure-models`, `03-regression-and-standard-errors` and `26-gmm-for-asset-pricing-models` and reports every widget of each chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The `TermPremium` preset, the three `RegressionLab` presets and the prose numbers use the committed `gsw-svensson-parameters` through `acmSample.ts`; the seeded `TermPremium` view and the other `RegressionLab` sources are unchanged.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 44-pricing-the-term-structure-with-linear-regressions
npm run screenshots -- 43-affine-term-structure-models
npm run screenshots -- 03-regression-and-standard-errors
npm run screenshots -- 26-gmm-for-asset-pricing-models
npm run clickthrough -- 44-pricing-the-term-structure-with-linear-regressions
npm run clickthrough -- 43-affine-term-structure-models
npm run clickthrough -- 03-regression-and-standard-errors
npm run clickthrough -- 26-gmm-for-asset-pricing-models
grep -n 'section-tag' src/content/chapters/44-pricing-the-term-structure-with-linear-regressions.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/44-pricing-the-term-structure-with-linear-regressions.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
