---
id: TASK-141
title: 'Chapter 39: Rare disasters and jump risk'
milestone: M-12
state: approved
depends_on: [TASK-138]
delivery: pr
---

## Why


SC-7 and M-12. Part X closes with the third answer to the puzzles of Part IX: a small chance of a large consumption drop. The chapter shows the pricing, the problem that a century may hold no disaster, and the estimator of Julliard & Ghosh (2012) that asks how much disaster risk our own sample needs. This chapter follows the pattern of the Part I to Part IX chapters.

## Scope


Write chapter 39 of `docs/CURRICULUM.md`, "Rare disasters and jump risk", as `src/content/chapters/39-rare-disasters-and-jump-risk.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part IX and Part X blocks of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/08-euler-equation-and-sdf.mdx` (`SDFExplorer`, state probabilities), `src/content/chapters/24-generalized-method-of-moments.mdx` (the moment condition this estimator reweights) and `src/content/chapters/35-equity-premium-and-risk-free-rate-puzzles.mdx`, chapters 37 and 38 if they are merged, and the code named below: `src/lib/finance/disasters.ts` (from the library task this task depends on), `src/lib/finance/consumptionPuzzle.ts` and `src/components/plots/puzzleSample.ts`.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/JulliardGhosh2012.pdf` (working paper; cite Julliard & Ghosh (2012), *Review of Financial Studies*, report that the curriculum reverses the authors' order, and name working-paper pages) with `pdftotext -layout`, and name the page for any number or fact you take from it; the library's doc comments list the pages of the estimators and Table 1. Rietz (1988) and Barro (2006) are not in `source/papers/`: name them only where Julliard & Ghosh do, with their page, and give a number from them only as Julliard & Ghosh report it. Campbell (2018), Ch. 6, is not in `source/papers/`: list it under further reading in the short form and take no fact from it. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data or simulations is read from library output, never from a paper.

Data. Seeded simulations from `simulateDisasterCentury`, and the annual sample of chapter 35 (`fred-consumption-annual` with `goyal-welch-annual`, through `annualSample`), loaded through one hook in `src/components/plots/disasterSample.ts` built on the hooks of `puzzleSample.ts`; write no new loading code that an existing hook already covers. The curriculum's data line names `fred-consumption-quarterly` (it starts in 2007, issue #112) and `ff3-monthly`; report in the outcome that the chapter uses the annual sample from 1930 instead, which, like Julliard & Ghosh's, starts with the Great Depression. Cross-country disaster data (Barro–Ursúa) are not in the pipeline: do not state numbers from them.

Chapter:
- Frontmatter: `part: 10`, `chapter: 39`, `difficulty: 3`, `prerequisites: [8, 35]`, a one-sentence `summary`. Link chapters 8, 24 and 35. Link chapters 37 and 38 if they are merged when you finish; otherwise name them by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name chapter 40, "Yields, forwards and bond returns", only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: the Euler equation with a disaster state and the term $\pi_D(1 - b_D)^{-\gamma}$, the risk-free rate it implies, why a sample can miss disasters (the peso problem, with the share of seeded centuries that hold none), and the relative entropy estimator as a reweighting of the sample's years, with its dual. Write the curriculum's $p$, $b$ and $\pi_t$ in the symbols of the §3 Part X block and report each replacement. Put numbers on our annual sample: the entropy across $\gamma$, the $\gamma$ each criterion picks, and the weight the estimator moves onto the worst years, and set them next to Julliard & Ghosh's Table 1, marked as theirs and with its page.
- Every number in the prose is read from library output on the committed data or the seeded simulations, never typed from memory. Add `tests/chapter39-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `DisasterLottery`: a seeded century of consumption with rare drops, a `Slider` for $\pi_D$ and one for $b_D$ (and $\gamma$ if it fits at 360px), a `Button` for a new century, and a readout of the premium and risk-free rate the closed forms imply next to the century's sample premium and its number of disasters.
- `EntropyReweighting`: the years of our annual sample with their equal weight $1/T$ and their entropy weight $\pi_t$ (do not let colour be the only cue), a `Slider` for $\gamma$, and a readout of the relative entropy, the weight on the years with the largest consumption falls, and a note when no weights exist at that $\gamma$.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>`. If you animate with `useTweened`, guard against issue #120 as the power-utility view of `HJBound` does, until that issue is fixed.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code. A symbol the chapter needs that §3 lacks goes into the Part X block of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 39-rare-disasters-and-jump-risk` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 39-rare-disasters-and-jump-risk` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- `DisasterLottery` uses seeded simulations from `src/lib/math/rng.ts`, and `EntropyReweighting` and the prose numbers on data use the committed `fred-consumption-annual` and `goyal-welch-annual`.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 39-rare-disasters-and-jump-risk
npm run clickthrough -- 39-rare-disasters-and-jump-risk
grep -n 'section-tag' src/content/chapters/39-rare-disasters-and-jump-risk.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/39-rare-disasters-and-jump-risk.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
