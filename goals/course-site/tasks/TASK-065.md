---
id: TASK-065
title: 'Chapter 18: Errors in variables and the Shanken correction'
milestone: M-6
state: approved
depends_on: [TASK-062]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-6. Part IV closes by asking how much the estimated betas of the first pass shrink the honest uncertainty of the second. This chapter follows the pattern of the earlier chapters.

## Scope


Write chapter 18 of `docs/CURRICULUM.md`, "Errors in variables and the Shanken correction", as `src/content/chapters/18-errors-in-variables-and-shanken.mdx`, with its widget. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md`, the finished chapters `src/content/chapters/01-returns.mdx`, `src/content/chapters/09-time-varying-expected-returns.mdx`, `src/content/chapters/12-stambaugh-bias.mdx` (a seeded-simulation chapter) and `src/content/chapters/13-out-of-sample-predictability.mdx` (the models to copy), and the library code named below: `src/lib/finance/crossSection.ts` (from the library task this task depends on) and `src/lib/finance/timeSeriesTests.ts`.

Readings. The curriculum's only reading, Cochrane (2005), Ch. 12, is a book the owner has not supplied: it is not in `source/papers/`, so take no fact from it and list it under further reading only. Shanken (1992) is not in `source/papers/` either. Teach the correction as a method, derived step by step from the two-pass model, and attribute nothing to Shanken (1992) beyond the name of the correction. Cite readings in the short form. Explain ideas in your own words; never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper. Any claim about which factors have a large $c$ (the curriculum mentions consumption factors) is made with our own numbers or stated as a property of the formula, not as a published result.

Chapter:
- Frontmatter: `part: 4`, `chapter: 18`, `difficulty: 2`, `prerequisites: [17]`, a one-sentence `summary`. Link chapter 17 if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped in the derivation of the corrected variance, and show why $c = \lambda'\Sigma_f^{-1}\lambda$ is a squared Sharpe ratio. Show with our numbers when the correction matters: on FF3 monthly data $c$ is small, so the correction is small; a factor with a high Sharpe ratio makes it large. Teach the limits honestly: the correction assumes i.i.d. returns and conditional homoskedasticity, and it fixes standard errors, not the attenuation of $\hat\lambda$.
- Every number in the prose is read from library output on the committed data or from the seeded simulation, never typed from memory. Add `tests/chapter18-numbers.test.ts` that recomputes each one, as `tests/chapter13-numbers.test.ts` does, and list each number with its test in the outcome.

Widget (in `src/components/plots/`), computing only through the libraries above and the typed loaders in `src/lib/data/series.ts`: `ShankenCorrection` (from `simulateTwoPass`: the seeded first-pass betas scattered around the true betas, and the naive and corrected 95% intervals for $\lambda$ next to the truth, with a `Slider` for the factor's Sharpe ratio and one for $T$, a new-seed `Button`, and a readout of $c$, both standard errors and the coverage of both intervals over the replications; a second readout gives the naive and corrected standard errors of the FF3 market premium on the 25 portfolios from `shankenCorrection`). Seed every draw with `src/lib/math/rng.ts` and keep the default seed fixed so the prose numbers match. It follows style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, `prefers-reduced-motion`. Use the data hook in `src/components/plots/factorTestSample.ts` if it is merged; otherwise create that file with a hook built on `factorPanel`, and say so in the outcome so the Part keeps one helper.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the notation table of `docs/STYLE_GUIDE.md` §3 disagree, follow the style guide and report the mismatch (the curriculum's $\Sigma$ in the Shanken formula is the residual covariance, §3 $\Sigma_\varepsilon$); list symbols the table lacks (such as $c$) as candidates. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`; a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 18-errors-in-variables` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 18-errors-in-variables` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widget.
- The widget uses the chapter's curriculum data (`ff25-size-bm-monthly`, `ff3-monthly`, simulated with a fixed seed).
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 18-errors-in-variables
npm run clickthrough -- 18-errors-in-variables
grep -n 'section-tag' src/content/chapters/18-errors-in-variables-and-shanken.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/18-errors-in-variables-and-shanken.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
