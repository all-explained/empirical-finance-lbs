---
id: TASK-097
title: 'Chapter 25: Efficient and feasible GMM'
milestone: M-8
state: approved
depends_on: [TASK-093]
delivery: pr
---

## Why


SC-7 and M-8. The weighting matrix decides how precise GMM is. This chapter derives the efficient choice, runs two-step, iterated and continuously-updated GMM, tests over-identifying restrictions with J, and shows when a fixed first-stage weighting is the better choice. It follows the pattern of the Part I to Part V chapters.

## Scope


Write chapter 25 of `docs/CURRICULUM.md`, "Efficient and feasible GMM", as `src/content/chapters/25-efficient-and-feasible-gmm.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part VI block of §3), the finished chapters `src/content/chapters/04-autocorrelation-and-newey-west.mdx`, `src/content/chapters/12-stambaugh-bias.mdx` (a seeded-simulation chapter with a test-size widget) and `src/content/chapters/16-time-series-tests-and-grs.mdx` (the models to copy), chapter 24 if it is merged, and the library code named below: `src/lib/stats/gmm.ts` (from the library task this task depends on) and `src/lib/math/distributions.ts`.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Nagel2013.pdf` (Nagel (2013), NBER working-paper version) with `pdftotext -layout` and name the page for any fact you take from it; its remarks on identity-weighted GMM for asset pricing support the section on when a fixed weighting is better. Cochrane (2005), Ch. 11, is not in `source/papers/`: derive every result in your own words, list the book under further reading only, and take no fact from it. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our simulations is read from library output, never from a paper.

Chapter:
- Frontmatter: `part: 6`, `chapter: 25`, `difficulty: 3`, `prerequisites: [24]`, a one-sentence `summary`. Link chapter 24 if it is merged when you finish; otherwise name it by title and say so in the outcome. Link chapter 4 for $\hat S$. Every sentence about another chapter must be true of the merged site; name chapters 26 and 27 only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: why $W = S^{-1}$ gives the smallest variance, $\tfrac1T(D'S^{-1}D)^{-1}$, two-step, iterated and continuously-updated GMM and how they differ in finite samples, the $J$ test and its $\chi^2_{L-\dim\theta}$ limit, and why a fixed weighting (identity, or one chosen for economic meaning) can be better when $\hat S$ is noisy or when the moments that matter should keep their weight. Teach the limits honestly: show with the seeded simulation how far the size of $J$ is from 5% in short samples. Use the Part VI notation of §3, not the curriculum's $d$ and $r - k$.
- Every number in the prose is read from library output on the seeded simulations, never typed from memory. Add `tests/chapter25-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through `gmm.ts`:
- `GMMObjective` with `methods={['one-step', 'two-step', 'iterated', 'cue']}`: the toy objective of chapter 24 with all four weighting choices, so the reader sees the surface and its minimum move. If chapter 24 has merged `GMMObjective` and `gmmSample.ts` when you finish, rebase on `origin/main` and reuse them; otherwise create them with the `methods` prop exactly as the chapter 24 spec describes (default `['one-step', 'two-step']`; a `Segmented` for 2 or 4 moments; a new-sample `Button`; readout of $\hat\theta$, standard errors and the objective), and say so in the outcome, so the Part keeps one widget.
- `JTestSim`: the histogram of $J$ over seeded samples of `simulateJTest` against the $\chi^2$ density, with a `Slider` for $T$, a `Segmented` method control (two-step, iterated, CUE) and a `Segmented` for normal or fat tails (size against power). The readout gives the rejection rate at 5% and the number of samples. Keep the default run fast enough to feel instant on a laptop (state the timing in the outcome).
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, `prefers-reduced-motion`. Put the simulation settings the widgets and the numbers test share in `src/components/plots/gmmSample.ts`.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the §3 notation disagree, follow the style guide and report the mismatch; list any symbol the table still lacks as a candidate. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 25-efficient-and-feasible-gmm` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 25-efficient-and-feasible-gmm` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- There is one `GMMObjective` component in `src/components/plots/`, shared with chapter 24 through its `methods` prop.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 25-efficient-and-feasible-gmm
npm run clickthrough -- 25-efficient-and-feasible-gmm
grep -n 'section-tag' src/content/chapters/25-efficient-and-feasible-gmm.mdx
ls src/components/plots/ | grep -c '^GMMObjective'
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/25-efficient-and-feasible-gmm.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
