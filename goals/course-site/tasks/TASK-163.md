---
id: TASK-163
title: 'Chapter 43: Affine term structure models'
milestone: M-14
state: approved
depends_on: [TASK-159]
delivery: pr
---

## Why


SC-7 and M-14. Part XII opens by building bond prices from three pieces: a VAR for the state, a short rate linear in it and prices of risk linear in it. The reader derives the recursions, drags a model's state and prices of risk and watches the curve reshape, and splits a yield into expected short rates and a term premium. This chapter follows the pattern of the Part I to Part XI chapters.

## Scope


Write chapter 43 of `docs/CURRICULUM.md`, "Affine term structure models", as `src/content/chapters/43-affine-term-structure-models.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the "Bonds and the term structure" table of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/05-persistence-ar1-and-var.mdx` (the VAR), `src/content/chapters/08-euler-equation-and-sdf.mdx` (a price as an expected discounted payoff) and `src/content/chapters/40-yields-forwards-and-bond-returns.mdx` (yields, forwards and the ex post term premium), chapters 41 and 42 if they are merged, and the code named below: `src/lib/finance/affine.ts` (from the library task this task depends on), `src/lib/finance/bonds.ts` and `src/components/plots/bondSample.ts` (`useBondView`). Check each file name with `ls src/content/chapters/` before you link it.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/AdrianCrumpMoench2013.pdf` (New York Fed Staff Report 340; cite the 2013 *Journal of Financial Economics* article and name working-paper pdf pages) for the model and the recursions (pdf pp. 6–7 and 11–12); the library's doc comments list the pages. Campbell, Lo & MacKinlay (1997), Ch. 11, is not in `source/papers/`: list it under further reading in the short form and take no fact from it. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data or a seeded model is read from library output, never from a paper.

Data. Seeded models from `affine.ts` (`oneFactorModel`, `twoFactorModel`, `simulateAffine`), and `gsw-zero-coupon` through `useBondView` of `bondSample.ts` for the reference curve; write no new loading code.

Chapter:
- Frontmatter: `part: 12`, `chapter: 43`, `difficulty: 3`, `prerequisites: [5, 8, 40]`, a one-sentence `summary`. Link chapters 5, 8 and 40, and chapter 42 for the facts this Part models if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name chapter 44, "Pricing the term structure with linear regressions", only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: the VAR for the state, the short rate, the exponentially affine SDF and the prices of risk, the guess $p^{(n)}_t = A_n + B_n'X_t$ and the derivation of both recursions from $P^{(n)}_t = \mathbb{E}_t[M_{t+1}P^{(n-1)}_{t+1}]$ (break the display math to fit a 375px phone), risk-neutral yields as average expected short rates, and the term premium as the gap. Write the model in the §3 symbols the library added and say, in one sentence, how the curriculum's form ($\Sigma\lambda_0$, $\Sigma\lambda_1$) maps to it, as the library derives. Link chapter 40's ex post term premium and say how the model's differs (expected, not realised, short rates).
- Every number in the prose is read from library output, never typed from memory. Add `tests/chapter43-numbers.test.ts` that recomputes each one, as `tests/chapter40-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through `affine.ts`:
- `AffineCurve`: a `Segmented` for the one- and two-factor model, `Slider`s for the state (the short rate, and the second factor), the persistence and the price-of-risk constant and slope; the model's yield curve and its risk-neutral curve from 1 month to 30 years, with the GSW curve of a chosen month as reference points (a date `Select` or `Slider`; do not let colour be the only cue between model and data). Readout: the 1-, 10- and 30-year yields, the 10-year term premium, and the slope.
- `TermPremium`: a seeded path of the 10-year yield, its risk-neutral yield and the gap over time, with a maturity `Slider` (1–30 years), a `Button` for a new seed, and a readout of the mean and standard deviation of each line. Write it so chapter 44 can add a preset that draws the estimated model's series on our data in place of the seeded path (one optional prop, documented in the component); chapter 44 adds that preset, not this task.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone, and keep each readout line short enough not to wrap at 360px), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>` (issue #83). If you animate with `useTweened`, guard against issue #120 as the power-utility view of `HJBound` does, until that issue is fixed.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome, including the $\Sigma\lambda$ form), changes to shared code. A symbol the chapter needs that §3 lacks goes into the "Bonds and the term structure" table of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

Where jobs run: build, tests, screenshots and click-through run on the MacBook on committed files and seeded models; nothing reads CRSP, option or tick data.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 43-affine-term-structure-models` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 43-affine-term-structure-models` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- `AffineCurve` and `TermPremium` compute only through `affine.ts`, use seeded models from `src/lib/math/rng.ts`, and read GSW through `bondSample.ts`.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 43-affine-term-structure-models
npm run clickthrough -- 43-affine-term-structure-models
grep -n 'section-tag' src/content/chapters/43-affine-term-structure-models.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/43-affine-term-structure-models.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
