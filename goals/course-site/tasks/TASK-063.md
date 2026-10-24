---
id: TASK-063
title: 'Chapter 16: Time-series tests and the GRS statistic'
milestone: M-6
state: approved
depends_on: [TASK-061]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-6. Part IV moves from the market's time series to the cross-section of expected returns. This chapter opens it and follows the pattern set by chapters 1 and 9 and the Part I to Part III chapters.

## Scope


Write chapter 16 of `docs/CURRICULUM.md`, "Time-series tests and the GRS statistic", as `src/content/chapters/16-time-series-tests-and-grs.mdx`, with its widgets. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md`, `docs/DATA.md`, the finished chapters `src/content/chapters/01-returns.mdx`, `src/content/chapters/07-mean-variance-and-the-capm.mdx`, `src/content/chapters/09-time-varying-expected-returns.mdx` and `src/content/chapters/13-out-of-sample-predictability.mdx` (the models to copy), and the library code named below: `src/lib/finance/timeSeriesTests.ts` and `src/lib/math/distributions.ts` (from the library task this task depends on), `src/lib/finance/portfolio.ts`.

Readings. Open this PDF with `pdftotext -layout` and name the page for any number or fact you take from it: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/GibbonsRossShanken1987.pdf`. It was published in Econometrica in 1989 (see `docs/READINGS.md`); cite it as "Gibbons, Ross & Shanken (1989)" and report the curriculum's "1987" as a mismatch. Cochrane (2005), Ch. 12, is a book the owner has not supplied: it is not in `source/papers/`, so take no fact from it and list it under further reading only. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper.

Chapter:
- Frontmatter: `part: 4`, `chapter: 16`, `difficulty: 2`, `prerequisites: [3, 7]`, a one-sentence `summary`. Both prerequisites exist; link them. Every sentence about another chapter must be true of the merged site; chapters 17 and 18 may not be merged yet, so name them only in "Recap & next up" by title.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped in a derivation, including why GRS is the Sharpe ratio gained by adding the test assets. Teach the limits honestly: what a rejection does and does not say (a model can be rejected for tiny alphas when $T$ is large, and pass when the test lacks power), and why the test needs $T > N + K$.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter16-numbers.test.ts` that recomputes each one, as `tests/chapter13-numbers.test.ts` does, and list each number with its test in the outcome.

Widgets (in `src/components/plots/`), computing only through the libraries above and the typed loaders in `src/lib/data/series.ts`:
- `AlphaBars`: the annualised alpha of each of the 25 portfolios with its 95% confidence bar from `timeSeriesRegressions`, arranged so size and book-to-market groups can be read, with a `Segmented` control for CAPM or FF3 and a `Select` for the sample start; the readout gives GRS, its p-value and $T$, $N$, $K$ from `grs`.
- `GRSGeometry`: the two frontiers of `sharpeFrontiers` (factors only, factors plus test assets), their tangency lines and the Sharpe-ratio gap GRS measures, with the same model control; the readout gives $SR_f$, $SR_{\text{all}}$ and the identity $\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha = SR^2_{\text{all}} - SR^2_f$ with numbers.
Both follow style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout, `prefers-reduced-motion`. Put the data hook the widgets and the numbers test share in one helper, `src/components/plots/factorTestSample.ts`, as `presentValueSample.ts` does; build it on `factorPanel`, not on a copy of `capmSample.ts`.

Out of scope: other chapters (link back to chapters 3 and 7, do not edit them), edits to `docs/CURRICULUM.md` or `docs/STYLE_GUIDE.md` (report mismatches in the outcome), changes to shared code. Where the curriculum's Key math and the notation table of `docs/STYLE_GUIDE.md` §3 disagree, follow the style guide and report the mismatch: the curriculum writes $\hat\Omega$ for the factor covariance and $\hat\Sigma$ for the residual covariance, where §3 has $\Sigma_f$ and $\Sigma_\varepsilon$. List symbols the table lacks (such as $GRS$, $SR_{\text{all}}$, $SR_f$) as candidates. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts` (alphas are `\Err`, model-implied values `\Model`); a new symbol or colour goes into the `docs/STYLE_GUIDE.md` tables only if the spec says so, otherwise report it.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 16-time-series-tests` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 16-time-series-tests` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widgets.
- The widgets use real data from the chapter's curriculum entry (`ff25-size-bm-monthly`, `ff3-monthly`).
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 16-time-series-tests
npm run clickthrough -- 16-time-series-tests
grep -n 'section-tag' src/content/chapters/16-time-series-tests-and-grs.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/16-time-series-tests-and-grs.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
