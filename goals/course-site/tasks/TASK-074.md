---
id: TASK-074
title: 'Chapter 20: Momentum'
milestone: M-7
state: approved
depends_on: [TASK-069]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-7. Momentum is the anomaly the three-factor model cannot absorb, and its crashes show what a factor's risk can look like. This chapter follows the pattern of the earlier chapters.

## Scope


Write chapter 20 of `docs/CURRICULUM.md`, "Momentum", as `src/content/chapters/20-momentum.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md`, the finished chapters `src/content/chapters/01-returns.mdx`, `src/content/chapters/13-out-of-sample-predictability.mdx` and `src/content/chapters/16-time-series-tests-and-grs.mdx` (the models to copy), chapter 19 if it is merged, and the library code named below: `src/lib/finance/factors.ts` (from the library task this task depends on), `src/lib/finance/returns.ts` and `src/lib/finance/timeSeriesTests.ts`.

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Cochrane2011.pdf` (Cochrane (2011)) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/FamaFrench1992.pdf` (Fama & French (1992)). Jegadeesh & Titman (1993), Carhart (1997) and Daniel & Moskowitz (2016) are not in `source/papers/`: teach the formation signal and the bear-market regression as methods, show them with our data, and attribute nothing to those papers beyond the names. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper.

Chapter:
- Frontmatter: `part: 5`, `chapter: 20`, `difficulty: 2`, `prerequisites: [19]`, a one-sentence `summary`. Link chapter 19 if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: the signal $r_{t-12 \to t-2}$ and why the last month is skipped, $WML_t$ from the size–momentum 2×3 sort, the FF3 alpha of momentum, and the bear-market regression with its separate beta. Teach the limits honestly: momentum's high Sharpe ratio comes with rare, large crashes, and a sample without them overstates it.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter20-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above and the typed loaders in `src/lib/data/series.ts`:
- `CompoundingPath` preset with momentum: add one optional prop to `src/components/plots/CompoundingPath.tsx` that plots the growth of a dollar in `Mom` next to the market, with the default unchanged; then re-run `npm run screenshots -- 01-returns` and report the change.
- `CrashZoom`: momentum's worst months from `worstMonths`, a `Select` to pick one, and the market's path and momentum's path in the months before it from `windowBefore`; the readout gives that month's return, the bear-market indicator, and the two betas of `bearMarketRegression`.
- `FactorBuilder` with `kind="size-momentum"` if chapter 19 has merged it; otherwise create it with the `kind` prop as the chapter 19 spec describes, and say so in the outcome so the Part keeps one widget.
All follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, `prefers-reduced-motion`. Use the data hook in `src/components/plots/factorModelSample.ts` if chapter 19 has merged it; otherwise create that file with a hook built on `modelPanel` and `sortFactors`, and say so in the outcome so the Part keeps one helper.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code other than the one optional `CompoundingPath` prop. Where the curriculum's Key math and the notation table of `docs/STYLE_GUIDE.md` §3 disagree, follow the style guide and report the mismatch; list symbols the table lacks (such as $WML$, $I_B$) as candidates. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`; a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 20-momentum` and `npm run screenshots -- 01-returns` pass in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 20-momentum` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widgets use real data from the chapter's curriculum entry (`mom-monthly`, `ff3-monthly`) and `ff6-size-mom-monthly`.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 20-momentum
npm run screenshots -- 01-returns
npm run clickthrough -- 20-momentum
grep -n 'section-tag' src/content/chapters/20-momentum.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/20-momentum.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
