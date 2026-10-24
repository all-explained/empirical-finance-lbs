---
id: TASK-098
title: 'Chapter 26: GMM for asset pricing models'
milestone: M-8
state: approved
depends_on: [TASK-094]
delivery: pr
---

## Why


SC-7 and M-8. This chapter turns GMM on linear SDF models: first-stage GMM as a cross-sectional regression, the beta and SDF forms side by side, and models ranked by the Hansen–Jagannathan distance. It follows the pattern of the Part I to Part V chapters.

## Scope


Write chapter 26 of `docs/CURRICULUM.md`, "GMM for asset pricing models", as `src/content/chapters/26-gmm-for-asset-pricing-models.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part VI block of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/08-euler-equation-and-sdf.mdx`, `src/content/chapters/16-time-series-tests-and-grs.mdx`, `src/content/chapters/17-cross-sectional-regressions-and-fama-macbeth.mdx` and `src/content/chapters/22-conditional-factor-models.mdx` (the models to copy; chapter 22 uses the same quarterly panel), chapters 24 and 25 if they are merged, and the library code named below: `src/lib/finance/sdfGmm.ts` (from the library task this task depends on), `src/lib/stats/gmm.ts`, `src/lib/finance/conditional.ts` (`quarterlyPanel`) and `src/lib/finance/crossSection.ts`.

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Nagel2013.pdf` (Nagel (2013), NBER working-paper version) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GospodinovKanRobotti2019.pdf` (Gospodinov, Kan & Robotti (2019), working-paper version). Cochrane (2005), Ch. 13, and Hansen & Jagannathan (1997) are not in `source/papers/`: derive the results in your own words, list Cochrane (2005) under further reading only, and take no fact from either. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper.

Data. The curriculum lists `fred-consumption-quarterly`, which starts in 2007 and is too short. Take consumption growth from `fred-cay-quarterly` through `quarterlyPanel`, as chapter 22 does, and report the mismatch in the outcome. Reuse the loaders of `src/components/plots/conditionalSample.ts` (`useConditionalData`), which share one series-loading hook; write no new `useEffect` loading code.

Chapter:
- Frontmatter: `part: 6`, `chapter: 26`, `difficulty: 3`, `prerequisites: [8, 17, 25]`, a one-sentence `summary`. Link chapters 8 and 17. Link chapter 25 (and chapter 24) if merged when you finish; otherwise name them by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name chapter 27 only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: the linear SDF $M_{t+1} = 1 - b'\tilde f_{t+1}$ (write $M$, as §3 says, not the curriculum's $m$), the moments $\mathbb{E}[M R^e] = 0$, $g_T(b)$ and its Jacobian, the proof that first-stage GMM is a cross-sectional regression of mean returns on covariances, $\lambda = \Sigma_f b$ and why $b$ and $\lambda$ answer different questions (a factor can carry a premium and still be redundant in the SDF), the second stage and its $J$ test, and $\delta_{\text{HJ}}$ as the distance from the model's SDF to the nearest SDF that prices the assets. Teach the limits honestly: the HJ ranking uses one fixed weighting for every model, so it differs from the $J$ ranking, and the CCAPM's quarterly sample is short.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter26-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `RegressionLab` preset: first-stage GMM as a cross-sectional fit, with the 25 quarterly portfolios' $\mathbb{E}_T[R^e\tilde f]$ (market factor) on the x-axis, mean excess returns on the y-axis and the fitted line through the origin. Add one optional `initialSource` value for this sample (in `src/components/plots/regressionSample.ts`) and, if the fit needs it, one optional prop to drop the intercept; the default behaviour stays unchanged, and chapter 3 must render as before (run its screenshots).
- `HJDistance`: the 25 pricing errors of CAPM, CCAPM and FF3 as bars, a `Segmented` model control and a `Segmented` weighting control (first stage, HJ), with each model's $\delta_{\text{HJ}}$ and second-stage $J$ and p-value in the readout. Do not let colour be the only cue.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, `prefers-reduced-motion`. Put the data hook the widgets and the numbers test share in `src/components/plots/sdfGmmSample.ts`, built on `useConditionalData` and `sdfModelFits`.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code other than the `RegressionLab` preset above. Where the curriculum's Key math and the §3 notation disagree, follow the style guide and report the mismatch; list any symbol the table still lacks as a candidate. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 26-gmm-for-asset-pricing-models` and `npm run screenshots -- 03-regression` pass in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 26-gmm-for-asset-pricing-models` and `npm run clickthrough -- 03-regression` pass and report every widget of each chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widgets use real data: `ff25-size-bm-monthly`, `ff3-monthly` and `fred-cay-quarterly` through `quarterlyPanel`.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 26-gmm-for-asset-pricing-models
npm run screenshots -- 03-regression
npm run clickthrough -- 26-gmm-for-asset-pricing-models
npm run clickthrough -- 03-regression
grep -n 'section-tag' src/content/chapters/26-gmm-for-asset-pricing-models.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/26-gmm-for-asset-pricing-models.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
