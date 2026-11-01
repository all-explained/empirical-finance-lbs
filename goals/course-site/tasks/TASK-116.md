---
id: TASK-116
title: 'Chapter 31: Latent and observable factors'
milestone: M-10
state: approved
depends_on: [TASK-112]
delivery: pr
---

## Why


SC-7 and M-10. Part VIII opens by setting the factors of theory next to the factors that PCA finds in the returns: the APT says any factors that span the common variation can price the assets, latent factors are fixed only up to a rotation, and canonical correlations compare two factor sets whatever their rotation. This chapter follows the pattern of the Part I to Part VII chapters.

## Scope


Write chapter 31 of `docs/CURRICULUM.md`, "Latent and observable factors", as `src/content/chapters/31-latent-and-observable-factors.mdx`, with its widget. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part VII and Part VIII blocks of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/06-principal-components.mdx` (PCA and `PCAExplorer`), `src/content/chapters/17-cross-sectional-regressions-and-fama-macbeth.mdx` and `src/content/chapters/28-skeptical-look-at-asset-pricing-tests.mdx` (the factor structure of the 25 portfolios; build on it and do not repeat it), and the library code named below: `src/lib/finance/latentFactors.ts` (from the library task this task depends on), `src/lib/stats/pca.ts` and `src/components/plots/pcaSample.ts`.

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Nagel2013.pdf` (Nagel (2013), NBER working paper 18554; cite the 2013 *Annual Review* article and name working-paper pages), `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GiglioXiu2021.pdf` (Giglio & Xiu (2021), published version) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/KellyPruittSu2018.pdf` (Kelly, Pruitt & Su, NBER working paper of 2018; cite the 2019 *Journal of Financial Economics* article, report the mismatch with the curriculum's 2018, and name working-paper pages). Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper.

Data. `ff25-size-bm-monthly` and `ff3-monthly`, 1963-07 on, loaded through one hook in `src/components/plots/latentSample.ts` built on the existing loaders (`usePcaData` of `pcaSample.ts` and `loadSeries`); write no new loading code that an existing hook already covers.

Chapter:
- Frontmatter: `part: 8`, `chapter: 31`, `difficulty: 3`, `prerequisites: [6, 17]`, a one-sentence `summary`. Link chapters 6, 17 and 28. Every sentence about another chapter must be true of the merged site; name chapters 32 to 34 only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: the factor model $R^e_t = \beta f_t + \varepsilon_t$ and the APT's $\mathbb{E}[R^e] = \beta\lambda$ (what "approximately" and "no near-arbitrage" mean), why PCs of the test assets price them almost by construction, the rotation $(\beta, f) \to (\beta H^{-1}, Hf)$ that leaves the fit unchanged (in the Part VIII symbols of §3), and canonical correlations as the rotation-free way to compare the first three PCs with MKT, SMB and HML. Say plainly what our data show, and teach the limit: the PCs are estimated on the same returns they price.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter31-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `PCAExplorer` preset: add one optional view (for example `initialView="factors"`, with a matching option in its view control) that, for the 25 portfolios from 1963-07, shows the canonical correlations between the first $K$ PCs and [Mkt-RF, SMB, HML] as bars, and the plain correlation of each PC with each factor as a small table. A `Slider` for $K$ (1 to 5) and a `Slider` for a rotation angle inside the plane of PCs 1 and 2 (reuse the existing $\omega$ rotation) show that the plain correlations move and the canonical correlations do not. The readout gives the canonical correlations and the variance share of the $K$ PCs. The default views stay unchanged, and chapters 6 and 28 must render as before (run their screenshots and click-through). No other task in this Part edits `PCAExplorer`.
Follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>`.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code other than the `PCAExplorer` view above. A symbol the chapter needs that §3 lacks goes into the Part VIII block of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 31-latent-and-observable-factors`, `npm run screenshots -- 06-principal-components` and `npm run screenshots -- 28-skeptical-look-at-asset-pricing-tests` pass in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 31-latent-and-observable-factors`, `npm run clickthrough -- 06-principal-components` and `npm run clickthrough -- 28-skeptical-look-at-asset-pricing-tests` pass and report every widget of each chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widget uses real data (`ff25-size-bm-monthly`, `ff3-monthly`), and the default views of `PCAExplorer` are unchanged.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 31-latent-and-observable-factors
npm run screenshots -- 06-principal-components
npm run screenshots -- 28-skeptical-look-at-asset-pricing-tests
npm run clickthrough -- 31-latent-and-observable-factors
npm run clickthrough -- 06-principal-components
npm run clickthrough -- 28-skeptical-look-at-asset-pricing-tests
grep -n 'section-tag' src/content/chapters/31-latent-and-observable-factors.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/31-latent-and-observable-factors.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
