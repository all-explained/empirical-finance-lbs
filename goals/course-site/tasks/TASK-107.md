---
id: TASK-107
title: 'Chapter 29: Multiple testing'
milestone: M-9
state: approved
depends_on: [TASK-104]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-9. After hundreds of researchers have tried hundreds of signals, $t > 2$ is too low a bar. This chapter controls the family-wise error rate and the false discovery rate, counts true and false discoveries in a seeded search, and reads the case for a cut-off near $t = 3$. It follows the pattern of the Part I to Part VI chapters.

## Scope


Write chapter 29 of `docs/CURRICULUM.md`, "Multiple testing", as `src/content/chapters/29-multiple-testing.mdx`, with its widget. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part VII block of §3), the finished chapters `src/content/chapters/02-expected-return-and-risk.mdx` (sampling error), `src/content/chapters/12-stambaugh-bias.mdx` (a seeded-simulation chapter with a test-size widget) and `src/content/chapters/21-anomalies-and-the-factor-zoo.mdx` (the published predictors and `ZooChart`), and the library code named below: `src/lib/stats/multipleTesting.ts` (from the library task this task depends on) and `src/lib/finance/zoo.ts`.

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/HarveyLiuZhu2016.pdf` (Harvey, Liu & Zhu (2016), published version) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/HouXueZhang2018.pdf` (Hou, Xue & Zhang; check its version and year on the first page, cite what it says, and report any mismatch with the curriculum's 2018). Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data or simulations is read from library output, never from a paper.

Data. Seeded simulations for the widget. For the real-data section, the original-sample $t$-statistics of `signalSummaries` on `osap-ls-monthly`, loaded through the existing hook of `src/components/plots/zooSample.ts`; write no new loading code. Teach the limit honestly: these are published survivors, not every test that was tried, so the count that survives a rule is not the false discovery rate of the literature.

Chapter:
- Frontmatter: `part: 7`, `chapter: 29`, `difficulty: 3`, `prerequisites: [21]`, a one-sentence `summary`. Link chapter 21. Every sentence about another chapter must be true of the merged site; link chapter 28 only if it is merged when you finish, otherwise name it by title and say so in the outcome; name chapter 30 only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: the family-wise error rate and the Bonferroni bound, Holm's step-down rule and why it is never less powerful, the false discovery rate, the Benjamini–Hochberg rule and the Yekutieli constant that makes it valid under any dependence, and the expected number of false discoveries. Write the rules in the Part VII notation of §3 (not the curriculum's $\alpha/M$: in §3, $\alpha$ is a pricing error and $M$ the SDF), and report the mismatch.
- Every number in the prose is read from library output on the committed data or the seeded simulations, never typed from memory. Add `tests/chapter29-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `MultipleTesting`: the $t$-statistics of the seeded strategies of `simulateStrategySearch` as a histogram (or strip) split into true and null strategies, with a threshold line the reader can drag and also set with a `Slider` (keyboard use), a `Segmented` that snaps the threshold to the cut-off of a rule (fixed $t = 1.96$, $t = 3$, Bonferroni, Holm, BHY), `Slider`s for the number of strategies and the true share, and a `Button` for a new seed. The readout gives true and false discoveries, misses and the false discovery proportion. Do not let colour be the only cue between true and null. Put the simulation settings the widget and the numbers test share in `src/components/plots/multipleTestingSample.ts`.
- `ZooChart` as it is, with `initialLine={3}` (its line control runs from 0.5 to 8): the published predictors against the higher bar. No change to the component.
Follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>`.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the §3 notation disagree, follow the style guide and report the mismatch; list any symbol the table still lacks as a candidate. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 29-multiple-testing` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 29-multiple-testing` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widget uses seeded simulations from `src/lib/math/rng.ts`; `git diff --stat origin/main -- src/components/plots/ZooChart.tsx` is empty.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 29-multiple-testing
npm run clickthrough -- 29-multiple-testing
grep -n 'section-tag' src/content/chapters/29-multiple-testing.mdx
git diff --stat origin/main -- src/components/plots/ZooChart.tsx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/29-multiple-testing.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
