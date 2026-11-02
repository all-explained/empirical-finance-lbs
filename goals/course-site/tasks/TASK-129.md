---
id: TASK-129
title: 'Chapter 35: The equity premium and risk-free rate puzzles'
milestone: M-11
state: approved
depends_on: [TASK-127]
delivery: pr
---

## Why


SC-7 and M-11. Part IX opens by putting numbers on the consumption CAPM of chapter 8: smooth consumption needs an absurd risk aversion to price the equity premium, and that risk aversion gives a risk-free rate far above the data. This chapter follows the pattern of the Part I to Part VIII chapters.

## Scope


Write chapter 35 of `docs/CURRICULUM.md`, "The equity premium and risk-free rate puzzles", as `src/content/chapters/35-equity-premium-and-risk-free-rate-puzzles.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the Part IX block of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/08-euler-equation-and-sdf.mdx` (`HJBound` and `SDFExplorer`), `src/content/chapters/14-consumption-wealth-ratio.mdx` and `src/content/chapters/26-gmm-for-asset-pricing-models.mdx` (the consumption CAPM estimated by GMM), and the library code named below: `src/lib/finance/consumptionPuzzle.ts` (from the library task this task depends on), `src/lib/finance/sdf.ts`, `src/components/plots/HJBound.tsx` and `src/components/plots/sdfSamples.ts`.

Readings. Open these PDFs with `pdftotext -layout` and name the page for any number or fact you take from them: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Ludvigson2013.pdf` (Ludvigson (2013), working paper of January 2012; cite the Handbook chapter and name working-paper pages) and `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Campbell2014.pdf` (Campbell (2014), working paper). The curriculum's readings Campbell (2018), Ch. 6, and Cochrane (2005), Ch. 21, are not in `source/papers/`: list them under further reading in the short form and take no fact from them. Mehra & Prescott (1985) and Weil (1989) are not in `source/papers/` either: you may name them as the origin of the two puzzles where an opened reading does so, with that reading's page, and state no number from them. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper.

Data. `fred-consumption-annual` with `goyal-welch-annual` (the annual sample from 1930 and its postwar part), and `fred-cay-quarterly` with `goyal-welch-monthly` (the quarterly sample from 1952), through the sample builders of `consumptionPuzzle.ts`, loaded through one hook in `src/components/plots/puzzleSample.ts` built on `loadSeries` and the existing hooks (`useFF3` of `sdfSamples.ts` for the market Sharpe ratio of `HJBound`, and the loading of `sdfGmmSample.ts` or `caySample.ts` for the quarterly data); write no new loading code that an existing hook already covers. The curriculum's data line names `fred-consumption-quarterly` (it starts in 2007) and `shiller-monthly`; report in the outcome that the chapter uses the longer consumption series and the Goyal–Welch returns instead.

Chapter:
- Frontmatter: `part: 9`, `chapter: 35`, `difficulty: 2`, `prerequisites: [8]`, a one-sentence `summary`. Link chapters 8, 14 and 26. Every sentence about another chapter must be true of the merged site; name chapter 36 only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: lognormal pricing from the Euler equation, $\mathbb{E}[r_i - r_f] + \tfrac12\sigma_i^2 = \gamma\sigma_{ic}$, the risk-free rate under power utility, and the HJ ratio $\sigma(M)/\mathbb{E}[M] \approx \gamma\sigma_c$. Write the curriculum's $\delta$, $g$ and $\sigma_c$ in the symbols of §3 (the time-discount factor is $\delta$, so the rate of time preference is $-\log\delta$) and report each replacement. Put the numbers on the annual and the quarterly sample, and say plainly how they differ and why; the low correlation of consumption with returns is half the puzzle, so show $\gamma$ both from $\sigma_{ic}$ and from $SR/\sigma_c$.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter35-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above:
- `HJBound` preset: add one optional view (for example `preset="power-utility"`) that draws the power-utility curve of `crraHjPath` from the measured consumption moments as $\gamma$ rises, against the HJ region of the market's Sharpe ratio, with a `Segmented` for the sample and a readout of the lowest $\gamma$ that reaches the bound and the risk-free rate it implies. The default view stays unchanged, and chapter 8 must render as before (run its screenshots and click-through). No other task in this Part edits `HJBound`.
- `PuzzleCalculator`: the inputs from the data (mean and volatility of consumption growth, the correlation, the equity premium, the market volatility and the mean real risk-free rate) for the chosen sample, a `Slider` for $\gamma$ and one for $\delta$, and a readout of the implied equity premium, the implied risk-free rate and the $\delta$ that matches the data. Show the data value next to each model value.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>`.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code other than the `HJBound` view above. A symbol the chapter needs that §3 lacks goes into the Part IX block of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 35-equity-premium-and-risk-free-rate-puzzles` and `npm run screenshots -- 08-euler-equation-and-sdf` pass in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 35-equity-premium-and-risk-free-rate-puzzles` and `npm run clickthrough -- 08-euler-equation-and-sdf` pass and report every widget of each chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widgets use real data (`fred-consumption-annual`, `fred-cay-quarterly`, `goyal-welch-annual`, `goyal-welch-monthly` and `ff3-monthly`), and the default view of `HJBound` is unchanged.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 35-equity-premium-and-risk-free-rate-puzzles
npm run screenshots -- 08-euler-equation-and-sdf
npm run clickthrough -- 35-equity-premium-and-risk-free-rate-puzzles
npm run clickthrough -- 08-euler-equation-and-sdf
grep -n 'section-tag' src/content/chapters/35-equity-premium-and-risk-free-rate-puzzles.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/35-equity-premium-and-risk-free-rate-puzzles.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
