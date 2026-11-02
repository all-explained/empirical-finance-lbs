# TASK-119 outcome: Chapter 34, Risk premia with omitted factors

Status: **delivered.** DEC-003 accepted option 1, TASK-125 added a `factors` option to `simulateOmittedFactor`,
and the widget now has the spec's slider for the number of principal components.

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exit 0. `npm test`: `Test Files 75 passed (75)`, `Tests 804 passed (804)`. `npm run build`
  exit 0: `Result (221 files): - 0 errors - 0 warnings`, `35 page(s) built`.
- [x] `npm run screenshots -- 34-risk-premia-with-omitted-factors` passes in both themes at desktop and phone size,
  and I inspected the images. Evidence: four `✓` lines (dark/light × desktop/phone), exit 0. I read the widget in
  all four, at $K = 1$ (dark desktop) and at $s = 2$, $c = 0.99$ (light phone), plus the Playground in light
  desktop. On the phone the "mean" label of the bias bar ran into the "Two-pass" panel name; the bar now sits lower
  and the labels are clear. No page is wider than its viewport (`scrollWidth` 1280 and 375).
- [x] `npm run clickthrough -- 34-risk-premia-with-omitted-factors` passes and reports every widget of the chapter.
  Evidence: exit 0, `✓ … WHAT THE OMITTED FACTOR DOES TO EACH ESTIMATOR · 10 actions at 1280px, 10 actions at
  360px · slider "Strength of the omitted factor s"; slider "Correlation of its loadings with βχ's, c"; slider
  "Number of principal components K"; button "New seed"`. The chapter has one widget. With Playwright, ArrowLeft
  on the K slider changes the axis label to "three-pass estimate, 1 PC" and the three-pass readout.
- [x] The six `section-tag` headings are in template order. Evidence: `grep -n 'section-tag'` prints Hook (14),
  Intuition (34), Formalisation (69), Playground (219), Check yourself (280), Recap & next up (306).
- [x] No hex colour in the chapter or its widgets. Evidence: the spec's `git diff … | xargs grep -nE …` prints
  `no hex colours`.
- [x] The widget uses seeded simulations from `src/lib/math/rng.ts`, and the prose numbers use the committed
  `ff25-size-bm-monthly`, `ff3-monthly` and `ff30-industry-monthly` data. Evidence: the widget calls
  `simulateOmittedFactor` (seeded by `normalRng`) through `omittedEconomy` in `threePassSample.ts`, seed 2021,
  "New seed" adds 1. `tests/chapter34-numbers.test.ts` reads the three JSON files through `skepticalPanel`.
- [x] The outcome holds a voice review and a table of every number in the prose with its test. Evidence: the two
  sections below.
- [x] The prose is 1,500–3,000 words. Evidence: 2,997 words. Command (the one of earlier chapter outcomes):
  `awk 'NR>8' src/content/chapters/34-risk-premia-with-omitted-factors.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).
  Evidence: it prints `0` and exits 1.

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The widget and "Find the space in which all the returns move… Price that whole space… Ask how much of the space your factor is" come before the Formalisation writes $\hat\lambda_\chi = \hat\beta_\chi'\hat\lambda$. |
| Data before theory | The Hook opens on our data: "The slope, the estimated premium, is −0.140% a month. Value now looks like a hedge that you pay for." |
| One idea per section | Each `###` carries one idea: the model, the omitted-variable bias, rotation invariance, the three passes, why extra components do no harm, what our data show. |
| A question the reader has | "**Can you estimate one factor's premium without knowing all the others?**" |
| Write to "you", short sentences, link back | "You want the risk premium of the value factor, HML", with links to Chapters 17, 18, 27 and 31. |
| The honest version | "In the widget, $\beta_{i,1}$ is a standard normal draw…", and "So, plainly: on our data the three-pass estimator fixes the wild two-pass numbers, but with these few portfolios it does not always land on a traded factor's mean." |
| What the evidence can and cannot show | The table gives each three-pass premium with its standard error, the sample 1963-07 to 2026-08 and the data, and "These are whole-sample estimates: the components come from the same returns that they then price." |
| Don't skip steps | The bias is derived in five numbered steps, measurement error in four steps in a `<details>` box, rotation invariance in three, and "more PCs" in five. |
| Graduate rigour comes in gradually | Part VIII is ●●●: matrix notation, with a plain reading after each result ("Their product cannot change, so it can be learnt from any rotation of them"). |
| Papers in our own words | "Giglio & Xiu report that their estimator stays consistent as long as the number of components is at least the true number (p. 1972)." No text, figure or table is copied. |

## Numbers in the prose and their tests

All in `tests/chapter34-numbers.test.ts`. Real data: 25 (and 55) portfolios minus RF, 1963-07 to 2026-08, whole
sample, % a month. Simulation: `omittedEconomy(s, c, 2021)`, 100 samples, $N = 25$, $T = 600$, % a year.

| Number in the prose | Test |
|---|---|
| 1963-07, 2026-08, 758 months | `hook: the sample, …` |
| Means 0.602, 0.147, 0.294 (Mkt-RF, SMB, HML) | `hook` |
| Two-pass alone on 25: 0.687, 0.640, −0.140; SMB "more than four times" its mean | `hook` |
| Two-pass with all three: 0.560, 0.144, 0.353 | `hook` |
| Economy: $N$ 25, $T$ 600, 100 samples, true premium 6.00% a year (0.5% a month) | `intuition and formalisation` |
| $s = 1$, $c = 0.5$: two-pass bias +2.77, RMSE 3.65; three-pass −0.27, 1.88; predicted bias 3.00 | `intuition and formalisation` |
| $c = 0$: two-pass bias −0.21, RMSE 2.23; $s = 0$: RMSE 1.93 | `playground: the try-this settings` |
| $c = -0.5$: two-pass bias −3.18; $s = 2$, $c = 0.9$: +10.58 | `playground` |
| $s = 1$, $c = 0$, $K = 1$: three-pass bias −2.96, "about half the premium", RMSE 4.42 against the two-pass 2.23 | `playground: the number of components at c = 0` |
| $c = 0$, $K$ from 2 to 6: three-pass bias stays −0.32, RMSE 1.89 | `playground: the number of components at c = 0` (each $K$ of 3 to 6 gives the $K = 2$ numbers) |
| Three-pass RMSE between 1.88 and 1.91 in those settings (1.88, 1.89, 1.90, 1.91, 1.89) | `intuition…`, `playground` |
| $K = 5$ on 25: 0.538, 0.186, 0.320; s.e. 0.160, 0.109, 0.106; step-3 $R^2$ 0.98, 0.99, 0.95; each within half a s.e. of its mean | `our data: three-pass premia on the 25 portfolios…` |
| $K = 3$: 0.549, 0.153, 0.340; HML with $K = 1$: −0.030, $R^2$ 0.01; $K = 2$: 0.174 | `our data: three-pass premia…` |
| Mkt-RF 0.536 ($K = 6$) to 0.611 ($K = 7$), seventh term 0.075, under half a s.e.; the term equals the difference | `our data: each added component adds one term…` |
| 55 portfolios; HML alone −0.512; $K = 5$: 0.582, 0.138, 0.106; HML 1.9 s.e. below its mean; 84% spanned | `our data: the 25 portfolios with the 30 industries` |
| Paper: 647 portfolios, seven PCs (pp. 1972–1973); momentum −201, 69, 71, 49 bps (p. 1973) | The paper's numbers, read from the PDF and labelled as the paper's in the prose; not ours, so not tested |
| $K = 2$ factors, 6% premia, 1 and 2, 3 moves, Theorem 1, eqs. 1 and 2 | Structural, not estimates |

## Summary

**What.** `src/content/chapters/34-risk-premia-with-omitted-factors.mdx` (2,997 words, three `Quiz` questions), the
widget `src/components/plots/OmittedFactorBias.tsx`, its helper `src/components/plots/threePassSample.ts`,
`tests/chapter34-numbers.test.ts`, and two rows in the Part VIII block of `docs/STYLE_GUIDE.md` §3.

**How.** The widget runs `simulateOmittedFactor` through `omittedEconomy` 250 ms after the last slider move, as
`UselessFactor` does, and draws one histogram panel per estimator on a shared axis, with the true premium dashed,
the mean estimate solid and the bias as a bar between them. The slider $K$ (1 to 6) sets the `factors` option of
`simulateOmittedFactor` (DEC-003, TASK-125); the axis label and the `aria-label` name the number of components.
The panels and readout name each estimator in text, so colour is never the only cue. The real-data numbers come from `threePass` and `twoPass` on `skepticalPanel`.

**Notation.** Following §3 and TASK-115: the curriculum's $v_t$, $u_t$, $\gamma$ become $f_t$, $\varepsilon_t$,
$\lambda$; $g_t$ becomes $\chi_t$; $\xi$ becomes $a$; $\eta$ becomes $\beta_\chi$; $z_t$ becomes
$\varepsilon_{\chi,t}$; $\gamma_g$ becomes $\lambda_\chi$; $\hat p$ becomes $K$. New rows: $\tilde\chi_t$ (the
demeaned observed factor) and $s$, $c$ (the economy's strength and loading correlation), each with the clash it
avoids. I avoided the library comment's $a_i$, $b_i$ (a first-pass intercept and SDF loadings in §3) by describing
the draws in words.

**Deviations and mismatches.**
- No data-loading hook in `threePassSample.ts`. The widget shows only the seeded economy, so it loads no data, and
  the test reads the data through the existing `skepticalPanel`. A hook would be dead code.
- The curriculum's data line names `ff25-size-bm-monthly` and `ff3-monthly` only; the chapter also uses
  `ff30-industry-monthly`, as the spec asks. Its widget line names only the strength slider; the spec adds the
  correlation and PC sliders.
- The sentence "For the traded factors they study, the three-pass estimates are mostly close to the means" (pp.
  1974–1975) is cut to keep the prose under 3,000 words after the two new try-this lines. The chapter makes no
  claim from those pages now.
- Chapter 31 is merged and linked. Chapters 17, 18 and 27 are linked. Part IX's first chapter is named by title
  only in "Recap & next up".

**Verified revision.** The commit that adds this file, on `origin/main` `92233ed`.

**Follow-up.** None.
