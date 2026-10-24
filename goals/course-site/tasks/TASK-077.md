---
id: TASK-077
title: 'Chapter 23: Does the conditional CAPM explain anomalies?'
milestone: M-7
state: approved
depends_on: [TASK-072]
delivery: pr
---

## Why


SC-7 and M-7. Part V closes by measuring betas directly from short windows and asking how much alpha beta timing can create. The answer, little, sends the reader to the GMM and factor-zoo Parts. This chapter follows the pattern of the earlier chapters.

## Scope


Write chapter 23 of `docs/CURRICULUM.md`, "Does the conditional CAPM explain anomalies?", as `src/content/chapters/23-does-the-conditional-capm-explain-anomalies.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md` (including the daily French files), the finished chapters `src/content/chapters/04-autocorrelation-and-newey-west.mdx`, `src/content/chapters/13-out-of-sample-predictability.mdx` and `src/content/chapters/16-time-series-tests-and-grs.mdx` (the models to copy), chapter 22 if it is merged, and the library code named below: `src/lib/finance/shortWindow.ts` (from the library task this task depends on) and `src/lib/finance/timeSeriesTests.ts`.

Readings. Open this PDF with `pdftotext -layout` and name the page for any number or fact you take from it: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/LewellenNagel2006.pdf` (Lewellen & Nagel (2006)). Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper; where you set our numbers next to the paper's, say which sample each comes from.

Chapter:
- Frontmatter: `part: 5`, `chapter: 23`, `difficulty: 2`, `prerequisites: [22]`, a one-sentence `summary`. Link chapter 22 if it is merged when you finish; otherwise name it by title and say so in the outcome. Every sentence about another chapter must be true of the merged site; name Part VI (chapters 24 to 27) only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: rolling and within-quarter regressions on daily data, why short windows let beta move without a model of the state, the average conditional alpha, and the bound $\alpha^u_i \approx \mathrm{Cov}(\beta_{it}, \lambda_t) \le \sigma(\beta_{it})\,\sigma(\lambda_t)$ with a generous $\sigma(\lambda_t)$. Conclude with our numbers that beta timing leaves most of the value and momentum alphas unexplained. Teach the limits honestly: short-window betas are noisy, so $\sigma(\hat\beta_{iq})$ overstates the true variation, and the bound is an argument about magnitudes, not a formal test of every conditional model.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter23-numbers.test.ts` that recomputes each one, as `tests/chapter16-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above and the typed loaders in `src/lib/data/series.ts`:
- `RollingBeta`: the market beta of HML or Mom (`Segmented`) over time from `rollingBetas` on monthly data, with a `Slider` for the window, and the within-quarter betas from daily data as points; the readout gives $\sigma$ of each beta series.
- `AlphaBound`: for HML and Mom, the actual unconditional CAPM alpha next to the largest alpha beta timing can create, $\sigma(\hat\beta_{iq})\,\sigma(\lambda_t)$, with a `Slider` for $\sigma(\lambda_t)$ (annualised, with a generous range) and the average conditional alpha with its confidence bar.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, `prefers-reduced-motion`. Put the data hook the widgets and the numbers test share in one helper, `src/components/plots/shortWindowSample.ts`.

Data. The curriculum lists only monthly files (`ff25-size-bm-monthly`, `ff3-monthly`, `mom-monthly`). The within-quarter regressions need daily returns, so the chapter also uses `ff3-daily` and `mom-daily`; report this as a curriculum mismatch.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the notation table of `docs/STYLE_GUIDE.md` §3 disagree, follow the style guide and report the mismatch; list symbols the table lacks (such as $\alpha^u_i$, $\beta_{iq}$) as candidates. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`; a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 23-does-the-conditional` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 23-does-the-conditional` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widgets use real data (`ff3-monthly`, `mom-monthly`, `ff3-daily`, `mom-daily`).
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 23-does-the-conditional
npm run clickthrough -- 23-does-the-conditional
grep -n 'section-tag' src/content/chapters/23-does-the-conditional-capm-explain-anomalies.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/23-does-the-conditional-capm-explain-anomalies.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
