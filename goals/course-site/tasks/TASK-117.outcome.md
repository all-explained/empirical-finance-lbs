# TASK-117 outcome: Chapter 32, Characteristics are covariances: IPCA

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: after `npm ci` (exit 0), `npm test` printed `Test Files 70 passed (70)`, `Tests 740 passed (740)`.
  `npm run build` exited 0; `astro check` printed `0 errors`, `0 warnings`, `1 hint`, then `[build] Complete!`. The
  hint is the unused `Matrix` import in `src/lib/finance/news.ts`, outside this task and already open as #88.
- [x] `npm run screenshots -- 32-characteristics-are-covariances-ipca` passes in both themes at desktop and phone
  size, and the images were inspected.
  Evidence: the run printed ✓ for `dark-desktop`, `dark-phone`, `light-desktop` and `light-phone`. I inspected the
  pages in slices, the widget alone in all four cases, and the open `<details>` block. The first inspection found
  three faults, all fixed: the y-axis title touched the first point of the objective path, the point label named
  iteration 12 at the eleventh point, and the readout wrapped badly at 375px. A script then measured every
  `.katex-display` at 375px with the `<details>` block open. Seven formulas were wider than the column, so each one
  is now broken over lines; the last run found none wider.
- [x] `npm run clickthrough -- 32-characteristics-are-covariances-ipca` passes and reports every widget.
  Evidence: `✓ chapters/32-characteristics-are-covariances-ipca/ · INSTRUMENTED PCA, FITTED BY ALTERNATING LEAST
  SQUARES · 8 actions at 1280px, 8 actions at 360px · segmented "Number of factors K" option "K = 1"; … "K = 2"; …
  "K = 3"; slider "Alpha share of the panel"; button "Step from iteration 1"; button "New panel"`. `IPCAFit` is the
  chapter's only widget. A separate Playwright run checked the readout: it gives 12 iterations, 8.25%, 0.60% and
  $p = 0.685$ at the default; $p = 0.020$ and "rejected" with $K = 1$; "12; showing 4" after three steps; and
  focusing a cell shows "True loading of char. 2 on factor 1: −0.661".
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` prints lines 26 Hook, 45 Intuition, 76 Formalisation, 281 Playground,
  320 Check yourself, 346 Recap & next up.
- [x] No hex colour in the chapter or its widgets. Evidence: the spec's command prints `no hex colours`. It checks
  `src/components/plots/IPCAFit.tsx` and the chapter. `ipcaSample.ts` holds no colour.
- [x] The widget uses seeded simulations from `src/lib/math/rng.ts` through `simulateIpcaPanel`. Evidence:
  `ipcaWorld` in `src/components/plots/ipcaSample.ts` calls `simulateIpcaPanel(seed, …)`, which draws with
  `normalRng(seed)`. `alphaTest(seed, …)` draws with `mulberry32(seed)` and `normalRng(seed + 1)`. The seed starts
  at `DEFAULT_SEED = 1`, and "New panel" adds 1.
- [x] The outcome holds a voice review and a table of every number in the prose with its test. See the two sections
  below.
- [x] The prose is 1,500–3,000 words. Evidence:
  `awk 'NR>8' src/content/chapters/32-characteristics-are-covariances-ipca.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
  prints `2870`. This is the command of the earlier chapter outcomes. It counts the quiz text and inline math, and
  it leaves out the display math.
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0. Evidence: it printed `0` and exited 1, which DEC-002
  accepts.

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | Intuition, before any symbol: "It estimates one small table: one row for each characteristic and one column for each factor." |
| Data before theory | Hook: "With the alphas held at zero, the four factors explain 19.4% of the variation in monthly stock returns, and 1.8% of it through expected returns." |
| One idea per section | Formalisation, "Why ranks": the subsection only says why the characteristics are ranked. Each `###` holds one step. |
| Start with a question the reader has | Hook title: "Is a characteristic a risk or a free lunch?" |
| Write to "you", short sentences, link back | "You can think of an ordinary principal components analysis (Chapter 6) with one extra rule: each stock's loadings must come from its characteristics." |
| Give the honest version | "Those are the paper's numbers, from licensed firm data that this site does not have." |
| Say what the evidence can and cannot show | Key callout: "The simulated panel shows how IPCA works, not what it finds in real stocks." The test carries its bootstrap size: "The paper uses 1,000 samples. The widget uses 200." |
| Don't skip steps | The `<details>` block derives both Kronecker sums step by step; the case $K = \dim z$ is written out line by line. |
| Graduate rigour gradually | Part VIII is ●●●, so the chapter uses vec and Kronecker notation, with a plain reading next to it: "So the fit needs only the $\dim z$ managed-portfolio returns and the $\dim z \times \dim z$ matrix $Z_t'Z_t$ of each month." |
| Papers in our own words | "The title of this chapter is the first story in four words." Each fact from the paper carries its page. |

## Numbers in the prose

Numbers from our simulations are tested in `tests/chapter32-numbers.test.ts`. Its tests are named
`formalisation: …` (F) and `playground: the default fit …` (P1) and `playground: too few factors …` (P2).

| Number in the prose | Where | Test |
|---|---|---|
| 200 firms, 120 months, 4 characteristics with the constant, 2 true factors | Formalisation, Playground | F (`PANEL`) |
| 4 returns a month instead of 200, 120 blocks instead of 24,000 firm-months | Formalisation | F (shape of `managed`, `N * T`) |
| 37 portfolios (36 characteristics and the constant) | Formalisation | F (`36 + 1`); 36 is the paper's, p. 23 |
| $K = 4$: ALS stops after one iteration | Formalisation | F |
| $\Gamma_\beta f_{t+1}$ matches the Fama–MacBeth slopes to within $10^{-15}$ | Formalisation | F |
| 200 bootstrap samples in the widget | Formalisation | F (`BOOTSTRAPS`) |
| 12 iterations | Playground | P1 |
| gap $3.3 \times 10^{-5}$ after the first iteration, $2.4 \times 10^{-14}$ after the eleventh | Playground | P1 |
| shrinks by a factor of 6 to 8 from the second iteration on | Playground | P1 (every ratio rounds to 6, 7 or 8) |
| every cell within 0.13 of the truth | Playground | P1 |
| total $R^2$ 8.25%, predictive $R^2$ 0.60% | Playground | P1 |
| $p = 0.685$ at $K = 2$ with no alpha | Playground | P1 |
| $p = 0.020$ at $K = 1$ | Playground | P2 |
| alpha share 0.4%: $p = 0.005$; 1.0% with $K = 3$: $p = 0.395$ | Playground | P2 (both shares are slider steps) |
| at 1.0%: restricted predictive $R^2$ 0.01%, unrestricted 0.29% | Playground | P2 |
| 5 degrees of freedom of the Student $t$ | Formalisation | the paper's, p. 19; the library's `alphaTest` uses 5 |

The paper's numbers carry their pages in the prose; they are not ours and have no test:

| Number | Page of the 2018 working paper |
|---|---|
| 36 characteristics, 12,813 firms, July 1962 to May 2014 | p. 23 |
| rank divided by the number of firms, less 0.5; values in $[-0.5, 0.5]$ | p. 23 |
| four factors: total $R^2$ 19.4% against 21.9% for Fama–French five | p. 5 |
| four factors: predictive $R^2$ 1.8% against 0.3% | p. 6 |
| stop at changes below $10^{-6}$; within 10 iterations | p. 52 |
| 1,000 bootstrap samples; Student $t$ with 5 degrees of freedom | p. 19 |
| one factor rejected with $p$ below 0.01%, two factors not, $p = 15.4\%$ | pp. 25–26 (Table I and its text) |
| the test for each $K$ from 1 to 6 | p. 25 |

The widget caption's 5% and 2.5% monthly factor volatilities and the noise of 0.1 are the constants of
`simulateIpcaPanel` (its doc comment, and `PANEL.noise`).

## Summary

**What.** `src/content/chapters/32-characteristics-are-covariances-ipca.mdx` (six sections, three quizzes),
`src/components/plots/IPCAFit.tsx`, `src/components/plots/ipcaSample.ts` (the settings the widget and the numbers
test share), `tests/chapter32-numbers.test.ts`, and one row in the Part VIII block of `docs/STYLE_GUIDE.md` §3.

**How.** The chapter covers the Key math of the curriculum entry: the model with $\beta_{it}$ and $\alpha_{it}$
linear in characteristics, the rank transform, the managed portfolios and why the fit needs only them and
$Z_t'Z_t$ (both first-order conditions, the Kronecker algebra in a `<details>` block), ALS from the PCs of the
managed portfolios, the normalisation and the rotation, $K = \dim z$ as Fama–MacBeth, the two $R^2$, and the
bootstrap test of $\Gamma_\alpha = 0$. The widget computes only through `simulateIpcaPanel`, `managedPortfolios`,
`ipcaFit`, `ipcaR2` and `alphaTest`. It plots the objective of each iteration as its distance above the final
value on a log scale. After the first iteration the objective moves by less than $10^{-4}$ of $\sum(R^e)^2$, so a
linear axis showed a flat line. A button steps through the iterations and never disables itself. The heat maps copy the
banded `--c-data` shading of `GMMObjective`, show a sign in every cell, and give the value on hover or focus. The
bootstrap runs 250 ms after the controls rest, as in `UselessFactor`.

**Deviations and mismatches.**

1. Readings: the curriculum cites Kelly, Pruitt & Su (2018). The chapter cites the 2019 *Journal of Financial
   Economics* article and says that its page numbers are those of the 2018 NBER working paper (w24540), the PDF
   in `source/papers/`. Page numbers are the printed ones: printed page = PDF page − 1, as in `ipca.ts`.
2. Letters of the curriculum's Key math, replaced by §3 symbols: $r_{i,t+1}$ → $R^e_{i,t+1}$; $x_{t+1}$ →
   $R^Z_{t+1}$; the paper's $W_t$ → $Z_t'Z_t$; $L$ → $\dim z$; and $\beta_{it} = z_{it}'\Gamma_\beta$ is written
   $\beta_{it} = \Gamma_\beta'z_{it}$, as §3 does, so $\beta_{it}$ is a column vector.
3. New §3 row: $\hat\varepsilon^Z_{t+1}$, $\tilde\varepsilon^Z_{t+1}$ for the managed-portfolio residuals of the
   bootstrap. The paper writes $\hat d$, which would read as the log dividend $d_t$. To avoid other clashes, the
   chapter has no letter for the regressors of the OLS steps ($X$ is a payoff), the bootstrap multiplier ($q$ is a
   significance level), the random month ($s$ is a share) or the shift of $\Gamma_\alpha$ ($c$ is log consumption).
4. Chapter 31 is not merged on `origin/main` (checked at `c7662ef`), so the chapter names "Latent and observable
   factors" by title without a link. Once it merges, the two mentions can become links.
5. The $K$ control offers 1, 2 and 3, not 4. With $K = \dim z$ the alpha map has no room, because $\Gamma_\alpha$ is
   kept orthogonal to $\Gamma_\beta$, so the test would always give $W_\alpha = 0$. The prose covers $K = 4$ with
   its tested Fama–MacBeth match instead.
6. The heat maps are an HTML grid inside the plot area, not a `PlotFrame`: they have no axes, and focusable cells
   are simpler in HTML. Their styles are inline, because `src/styles/` is shared code.
7. The heat maps show the restricted fit. The library keeps no intermediate $\hat\Gamma_\beta$, so the stepping
   moves only the objective path.

**Verified revision.** `aa2bbad` (the chapter commit) on `origin/main` at `c7662ef`, plus this outcome. `npm ci`,
`npm test`, `npm run build`, the screenshots and the click-through ran on it.

**Proposed follow-ups.** When chapter 31 merges, link its two mentions in chapter 32 (the prerequisite callout and
"This is the rotation of Chapter 31").
