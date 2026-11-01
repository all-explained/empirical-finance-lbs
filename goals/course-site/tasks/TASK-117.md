---
id: TASK-117
title: 'Chapter 32: Characteristics are covariances: IPCA'
milestone: M-10
state: approved
depends_on: [TASK-113]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-10. Betas need not be constant: in instrumented PCA they move with firm characteristics, the model is fitted by alternating least squares on characteristic-managed portfolios, and a bootstrap test asks whether characteristics predict returns beyond their effect on betas. This chapter follows the pattern of the Part I to Part VII chapters.

## Scope


Write chapter 32 of `docs/CURRICULUM.md`, "Characteristics are covariances: IPCA", as `src/content/chapters/32-characteristics-are-covariances-ipca.mdx`, with its widget. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part VII and Part VIII blocks of §3), the finished chapters `src/content/chapters/06-principal-components.mdx`, `src/content/chapters/17-cross-sectional-regressions-and-fama-macbeth.mdx` (Fama–MacBeth slopes, which IPCA with $K = L$ reproduces), `src/content/chapters/22-conditional-factor-models.mdx` (betas that move with a state variable) and `src/content/chapters/24-generalized-method-of-moments.mdx` (`GMMObjective`, whose heat-map shading the loadings map should copy), chapter 31 if it is merged, and the library code named below: `src/lib/finance/ipca.ts` (from the library task this task depends on).

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/KellyPruittSu2018.pdf` (Kelly, Pruitt & Su, NBER working paper of 2018; cite the 2019 *Journal of Financial Economics* article, report the mismatch with the curriculum's 2018, and name working-paper pages) with `pdftotext -layout` and name the page for any number or fact you take from it. The paper's own estimates use CRSP and Compustat firm data that the site does not have: you may report a number from the paper with its page, but say that it is the paper's and not ours. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our simulations is read from library output, never from a paper.

Data. Simulated (seeded), as the curriculum says: `simulateIpcaPanel` with the settings the widget and the numbers test share, in `src/components/plots/ipcaSample.ts`. Teach the limit honestly: a seeded panel shows how the method works, not what it finds in real stocks.

Chapter:
- Frontmatter: `part: 8`, `chapter: 32`, `difficulty: 3`, `prerequisites: [17, 31]`, a one-sentence `summary`. Link chapters 17 and 22. Link chapter 31 if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name chapters 33 and 34 only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: the model with $\beta_{i,t}$ and $\alpha_{i,t}$ linear in characteristics (in the Part VIII symbols of §3), why the characteristics are rank-transformed, the managed portfolios and why the fit needs only them and $Z_t'Z_t$, alternating least squares and its start from the PCs of the managed portfolios, the normalisation that removes the rotation (link the rotation of chapter 31), the case $K = L$ as Fama–MacBeth, the total and predictive $R^2$, and the bootstrap test of $\Gamma_\alpha = 0$. Write the curriculum's letters in the §3 symbols and report each replacement.
- Every number in the prose is read from library output on the seeded panel, never typed from memory. Add `tests/chapter32-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the library above:
- `IPCAFit`: the seeded panel's ALS iterations converging (the objective against the iteration, stepped with a `Button` or played with `useTweened`, and still under `prefers-reduced-motion`), and the estimated $\Gamma_\beta$ next to the true one as two heat maps ($L$ characteristics × $K$ factors, shaded as `GMMObjective` shades, with each cell's value on hover or focus). Controls: a `Segmented` or `Slider` for $K$, a `Slider` for the alpha share of the seeded panel, and a `Button` for a new seed. The readout gives the iteration count, the total and predictive $R^2$, $W_\alpha$ and its bootstrap $p$-value (compute the bootstrap after the slider stops, as `UselessFactor` does). Do not let colour be the only cue in the heat maps.
Follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>`.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code. A symbol the chapter needs that §3 lacks goes into the Part VIII block of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); a new colour goes into §4 the same way. Where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 32-characteristics-are-covariances-ipca` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 32-characteristics-are-covariances-ipca` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widget uses seeded simulations from `src/lib/math/rng.ts` through `simulateIpcaPanel`.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 32-characteristics-are-covariances-ipca
npm run clickthrough -- 32-characteristics-are-covariances-ipca
grep -n 'section-tag' src/content/chapters/32-characteristics-are-covariances-ipca.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/32-characteristics-are-covariances-ipca.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
