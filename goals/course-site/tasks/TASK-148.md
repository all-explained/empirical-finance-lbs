---
id: TASK-148
title: 'Chapter 42: Level, slope, curvature and bond risk premia'
milestone: M-13
state: approved
depends_on: [TASK-145]
delivery: pr
---

## Why


SC-7 and M-13. Part XI closes with what does forecast bond returns: one tent-shaped combination of forward rates, the same for every maturity, which level, slope and curvature largely miss. The chapter fits it on our data, checks whether it is stable across the years before and after the paper, and leads to the term structure models of Part XII. This chapter follows the pattern of the Part I to Part X chapters.

## Scope


Write chapter 42 of `docs/CURRICULUM.md`, "Level, slope, curvature and bond risk premia", as `src/content/chapters/42-level-slope-curvature-and-bond-risk-premia.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the "Bonds and the term structure" table of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/06-principal-components.mdx` (`PCAExplorer` and level, slope and curvature of yield changes, which this chapter must not repeat), `src/content/chapters/09-time-varying-expected-returns.mdx` and chapters 40 and 41 if they are merged, and the code named below: `src/lib/finance/bondRiskPremia.ts`, `src/lib/finance/bonds.ts` and `src/lib/stats/pca.ts` (from the library tasks), `src/components/plots/PCAExplorer.tsx` and `src/components/plots/pcaSample.ts`. Check each file name with `ls src/content/chapters/` before you link it.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/CochranePiazzesi2005.pdf` (published *American Economic Review* article; journal page = pdf page + 137; cite journal pages) with `pdftotext -layout`, and name the page for any number or fact you take from it; the library's doc comments list the pages of the regressions, Table 1, Figure 1, Table 4 and the discussion of measurement error. The paper's Appendix is not in `source/papers/`: take no fact from it, including its subsample results. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper. Say about how GSW builds its curves only what `docs/DATA.md` states.

Data. `gsw-zero-coupon` only, through the hook of `src/components/plots/bondSample.ts` if chapter 40 has merged it (otherwise add that hook, built on `useSeriesData`, and say so in the outcome), and through `usePcaData` of `pcaSample.ts` for `PCAExplorer`.

Chapter:
- Frontmatter: `part: 11`, `chapter: 42`, `difficulty: 2`, `prerequisites: [6, 41]`, a one-sentence `summary`. Link chapters 6 and 9, and chapters 40 and 41 if they are merged when you finish; otherwise name them by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name chapter 43, "Affine term structure models", only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: principal components of yield levels (link chapter 6 for the method and for changes), the regression of the average excess return on the forward-rate vector, the single-factor model and its two-step estimate, why the loadings average to 1, and the $R^2$ of level, slope and curvature against the tent. Write the curriculum's $\gamma$, $f_t$, $b_n$ and $\overline{rx}_{t+1}$ in the symbols of §3 and report each replacement. Put numbers on our data for each default range of `subsampleTents`, and set them next to Cochrane & Piazzesi's Table 1 (p. 143) and Table 4 (p. 147), marked as theirs. Report honestly whether our weights form a tent and whether they are stable after 2003; if they are not, say so and give the reasons the readings and `docs/DATA.md` support.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter42-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `PCAExplorer` preset: add one preset, `gsw-levels`, the 1- to 5-year GSW yield levels through `gswYieldLevels`, and use it in the chapter with `initialView="loadings"`. The `ff25`, `ff25-1963` and `gsw` presets stay unchanged, and chapters 6, 28 and 31 must render as before (run their screenshots and click-through). No other task in this Part edits `PCAExplorer`.
- `TentFactor`: the weights on $y^{(1)}_t$ and $f^{(2)}_t, \dots, f^{(5)}_t$ with ±2 Hansen–Hodrick standard errors, a `Segmented` for the three default ranges of `subsampleTents`, a two-option `Segmented` that overlays the unrestricted weights for each maturity scaled by its loading (do not let colour be the only cue between maturities), and a readout of the $R^2$ of the tent, of level, slope and curvature, and the loadings $b^{(n)}$ (or the §3 symbol) on the chosen range.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone, and keep each readout line short enough not to wrap at 360px, as chapter 37 had to fix), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>` (issue #83). If you animate with `useTweened`, guard against issue #120 as the power-utility view of `HJBound` does, until that issue is fixed.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code other than the `PCAExplorer` preset above and the `bondSample.ts` hook if chapter 40 has not added it. A symbol the chapter needs that §3 lacks goes into the "Bonds and the term structure" table of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 42-level-slope-curvature-and-bond-risk-premia`, `npm run screenshots -- 06-principal-components`, `npm run screenshots -- 28-skeptical-look-at-asset-pricing-tests` and `npm run screenshots -- 31-latent-and-observable-factors` pass in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough` passes for `42-level-slope-curvature-and-bond-risk-premia`, `06-principal-components`, `28-skeptical-look-at-asset-pricing-tests` and `31-latent-and-observable-factors` and reports every widget of each chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- `TentFactor`, the `gsw-levels` preset and the prose numbers use the committed `gsw-zero-coupon`; the other `PCAExplorer` presets are unchanged.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 42-level-slope-curvature-and-bond-risk-premia
npm run screenshots -- 06-principal-components
npm run screenshots -- 28-skeptical-look-at-asset-pricing-tests
npm run screenshots -- 31-latent-and-observable-factors
npm run clickthrough -- 42-level-slope-curvature-and-bond-risk-premia
npm run clickthrough -- 06-principal-components
npm run clickthrough -- 28-skeptical-look-at-asset-pricing-tests
npm run clickthrough -- 31-latent-and-observable-factors
grep -n 'section-tag' src/content/chapters/42-level-slope-curvature-and-bond-risk-premia.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/42-level-slope-curvature-and-bond-risk-premia.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
