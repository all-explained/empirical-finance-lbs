---
id: TASK-119
title: 'Chapter 34: Risk premia with omitted factors'
milestone: M-10
state: approved
depends_on: [TASK-115, DEC-003, TASK-125]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-10. Part VIII closes with the risk premium of an observed factor when the model leaves out other factors: the two-pass estimate picks up the omitted factors' premia, and the three-pass estimator of Giglio & Xiu (2021) removes the bias through rotation invariance. This chapter follows the pattern of the Part I to Part VII chapters.

## Scope


Write chapter 34 of `docs/CURRICULUM.md`, "Risk premia with omitted factors", as `src/content/chapters/34-risk-premia-with-omitted-factors.mdx`, with its widget. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part VII and Part VIII blocks of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/17-cross-sectional-regressions-and-fama-macbeth.mdx`, `src/content/chapters/18-errors-in-variables-and-shanken.mdx` and `src/content/chapters/27-weak-and-useless-factors.mdx` (a seeded-economy widget to copy), chapter 31 if it is merged, and the library code named below: `src/lib/finance/threePass.ts` (from the library task this task depends on), `src/lib/finance/latentFactors.ts` and `src/lib/finance/crossSection.ts`.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GiglioXiu2021.pdf` (Giglio & Xiu (2021), published version) with `pdftotext -layout` and name the page for any number or fact you take from it. The paper's estimates use 647 portfolios that the site does not have: you may report a number from the paper with its page, but say that it is the paper's and not ours. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data or simulations is read from library output, never from a paper.

Data. `ff25-size-bm-monthly`, `ff3-monthly` and `ff30-industry-monthly` from 1963-07, and seeded simulations from `simulateOmittedFactor`, loaded through one hook in `src/components/plots/threePassSample.ts` built on the existing loaders (`useFactorData` of `factorTestSample.ts` and `loadSeries`, or the hook of `skepticalSample.ts`, which already loads the industries); write no new loading code that an existing hook already covers. The curriculum's data line does not name the industries; report the addition.

Chapter:
- Frontmatter: `part: 8`, `chapter: 34`, `difficulty: 3`, `prerequisites: [17, 31]`, a one-sentence `summary`. Link chapters 17, 18 and 27. Link chapter 31 if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name Part IX's first chapter only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: the model of returns on latent factors and of the observed factor on the latent factors, the omitted-variable bias of the two-pass estimate, rotation invariance of the observed factor's premium, the three passes, and why using more PCs than the true number does no harm. Write the curriculum's $v_t$, $u_t$, $g_t$, $\xi$, $\eta$, $z_t$ and $\gamma$ in the Part VIII symbols of §3 and report each replacement. Apply both estimators to Mkt-RF, SMB and HML on the 25 portfolios and on the 25 portfolios with the 30 industries, and say plainly what our data show; for a traded factor, compare the premium with its sample mean.
- Every number in the prose is read from library output on the committed data or the seeded simulations, never typed from memory. Add `tests/chapter34-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `OmittedFactorBias`: the seeded economy of `simulateOmittedFactor`, with the two-pass and three-pass estimates across draws as two histograms (or strips) against the true premium, a `Slider` for the omitted factor's strength, a `Slider` for the correlation of its loadings with the observed factor's, a `Slider` for the number of PCs, and a `Button` for a new seed. The readout gives the mean bias and the root mean squared error of each estimator. Compute after the slider stops, as `UselessFactor` does. Do not let colour be the only cue between the two estimators.
Follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>`.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code. A symbol the chapter needs that §3 lacks goes into the Part VIII block of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 34-risk-premia-with-omitted-factors` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 34-risk-premia-with-omitted-factors` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widget uses seeded simulations from `src/lib/math/rng.ts`, and the prose numbers use the committed `ff25-size-bm-monthly`, `ff3-monthly` and `ff30-industry-monthly` data.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 34-risk-premia-with-omitted-factors
npm run clickthrough -- 34-risk-premia-with-omitted-factors
grep -n 'section-tag' src/content/chapters/34-risk-premia-with-omitted-factors.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/34-risk-premia-with-omitted-factors.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
