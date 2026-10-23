# TASK-059 outcome: Chapter 15: Expected returns from option prices

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: after `npm ci` (exit 0), `npm test` printed `Test Files  31 passed (31)` and `Tests  335 passed (335)`,
  including the 9 tests of `tests/chapter15-numbers.test.ts`. `npm run build` printed `- 0 errors`, `- 0 warnings`,
  `- 1 hint` (the unused `Matrix` import in `src/lib/finance/news.ts`, not in this task's files) and
  `[build] Complete!`.
- [x] `npm run screenshots -- 15-expected-returns` passes in both themes at desktop and phone size, and I inspected the images.
  Evidence: it printed `✓` for `chapters_15-expected-returns-from-option-prices-{dark,light}-{desktop,phone}.png`
  (no console errors, no KaTeX errors, no horizontal overflow). I cut each full page into slices and read the widget,
  the Formalisation and the Playground in dark desktop, dark phone, light desktop and light phone. Both panels,
  the labels, the readout and the caption fit at 360px; the controls stack below the plot. Three long display
  equations (Step 5's strip identity, the variance-equals-area line and the $x^2$ line) scroll sideways inside
  their own box at 360px, through the site's `.katex-display { overflow-x: auto }`; the page itself does not overflow.
- [x] `npm run clickthrough -- 15-expected-returns` passes and reports every widget of the chapter.
  Evidence: two lines, one per copy of `OptionStripBound` (Intuition and Playground):
  `✓ … THE OPTION STRIP AND THE BOUND IT IMPLIES · 6 actions at 1280px, 6 actions at 360px · slider "At-the-money volatility"; segmented "Smile" option "skewed (seeded)"; segmented "Smile" option "flat (lognormal)"; button "New draw"`.
  A separate Playwright run read the readout at 20% (4.21%), 40% (16.47%), 45% (20.87%), 10% (1.08%), flat at 20%
  (VIX 20.0%, SVIX 20.2%, bound 4.21%), after "New draw" (seed 2) and after one ArrowRight key press on the
  slider (21%). Each value matches the prose.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` gives lines 25 Hook, 40 Intuition, 68 Formalisation, 293 Playground,
  329 Check yourself, 355 Recap & next up.
- [x] No hex colour in the chapter or its widget.
  Evidence: the spec's `git diff … | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` printed `no hex colours`.
- [x] Every simulation is seeded, and the chapter says that its option prices are simulated.
  Evidence: the only random input is the smile, from `seededSmile(seed, level)` (mulberry32 in `src/lib/math/rng.ts`),
  with seed 1 by default; "New draw" raises the seed and the readout shows it. The flat smile has no randomness.
  The Hook says "every option price in this chapter is **simulated**, from a seeded model", the Playground repeats
  it, and the widget caption starts "Simulated (seeded), not market data."
- [x] The outcome holds a voice review and a table of every number in the prose with its test.
  Evidence: see `## Voice review` and `## Numbers in the prose`.
- [x] The prose is 2,944 words, inside 1,500–3,000.
  Command (the chapter 9 and 12 command: it drops the frontmatter, imports and `$$` display blocks, and counts
  callouts, try-this paragraphs, the `<details>` block and quizzes):
  `awk 'NR>8' src/content/chapters/15-expected-returns-from-option-prices.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1:

| Rule | Line in the chapter |
| --- | --- |
| Picture first, then the formula | The Intuition shows the widget's shaded strip before any formula: "That sum is the shaded area in the bottom panel below." Step 5 then ends on "The bracket is the shaded area in the widget." |
| Data before theory | There is no option data on the site, so the Hook opens with the paper's numbers, with pages: "His monthly bound averaged only 1.86% a year in 2004–2006. In November 2008, at the height of the financial crisis, it peaked at 55.0% a year (p. 385)." |
| One idea per section | Formalisation has one step per subsection: risk-neutral probabilities, the risk-neutral mean and variance, the identity, the condition, the strip integral, variance or entropy. |
| Start with a question the reader has | "Is there a way to read the expected return of the stock market off today's prices, with no regression at all?" |
| Write to "you", short sentences, explain terms | "An option that would pay nothing if the index stayed where it is today is **out of the money**." Chapter 8 is linked; Chapter 13 is not on the site, so it is plain text with a recap callout. |
| Give the honest version | "Assume the index pays no dividends… This is a simplification: the real index pays dividends." |
| Say what the evidence can and cannot show | "A lower bound is a floor, not a forecast… Above all, the widget's numbers are not estimates… they carry no standard error and no sample period." |
| Don't skip steps in derivations | Steps 1–5 go from $P_t = \mathbb{E}_t[MX]$ to the strip line by line ("Divide the variance of Step 2 by $1 + R^f_t$. You get exactly the first brace."); the VIX–entropy link is in a `<details>` block, five steps. |
| Graduate rigour comes in gradually (Part III, ●●) | Integrals over strikes, change of measure and Taylor's theorem with an integral remainder, each with a plain reading: "A square is a portfolio of calls, one at every strike." |
| Papers in our own words | "Martin (2017, p. 374) shows that, when $M$ and the return are lognormal, it is the same as 'the Sharpe ratio is larger than the volatility'." Campbell (2018), Ch. 5, is not in `source/papers/`, so no fact is taken from it; it is under Further reading only. |

## Numbers in the prose

Numbers from the widget and from Chapter 8's two-state world are in `tests/chapter15-numbers.test.ts`
(test names in the right column). Numbers quoted from Martin (2017) were read with `pdftotext -layout` and carry
their journal page in the prose; the PDF's page n is journal page 366 + n.

| Number in the prose | Where | Source or test |
| --- | --- | --- |
| January 1996 to January 2012 | Hook | Martin (2017), p. 382 |
| 1.86% a year in 2004–2006; 55.0% in November 2008 | Hook, Recap | Martin (2017), p. 385 |
| a factor of almost thirty (29.6) | Hook | `hook: the ratio of the two bounds quoted from Martin (2017, p. 385)` |
| 20% (opening volatility), 4.21% | Intuition try-this, Quiz 1 | `intuition: the bound at 20% and at 40%, and the quiz ratio`; `the simulated market of the widget and the caption` (default level 0.2, seed 1) |
| 40%, 16.47%, almost four times (3.9) | Intuition try-this, Quiz 1 | `intuition: the bound at 20% and at 40%, and the quiz ratio` |
| one period = one year ($\tau = 1$); $R^f$ = 3%; 1.03 | Step 5, caption | `the simulated market of the widget and the caption` |
| real probability 0.5, risk-neutral probability 0.579 | Step 1 | `step 1: risk-neutral odds in chapter 8’s two-state world` |
| insurance: premium −3.8%, bound 5.4% | Step 4 | `step 4: the condition fails for the insurance and the stock of chapter 8` |
| stock: premium 4.1%, bound 6.3% | Step 4 | same test |
| Sharpe ratio near 50%, volatility near 16% | Step 4 | Martin (2017), p. 374 |
| condition defined; fails for gold and Treasury bonds; fails if $M$ is constant; no model fitting the data where it fails | Step 4 | Martin (2017), p. 371 and p. 373 |
| known dividends | Step 5 | Martin (2017), p. 379 |
| $\mathrm{SVIX}^2$ = 0.0409; $1.03 \times 0.0409$ = 4.21% | Step 5 | `step 5: SVIX² and the bound in the widget` |
| VIX = entropy (Result 3) | Step 6 | Martin (2017), p. 401 |
| lognormal VIX² = σ², SVIX² = (e^{σ²τ} − 1)/τ; VIX above SVIX every day; one month | Step 6 | Martin (2017), p. 402 |
| same log-variance under both measures when jointly lognormal | Step 6 | Martin (2017), p. 374 (footnote 6) |
| VIX 21.8%, SVIX 20.2% | Step 6 | `step 6: VIX against SVIX, and the VIX-based number` |
| $\mathrm{VIX}^2$ = 0.0477; $1.03 \times 0.0477$ = 4.91% | Step 6 | same test |
| 45% opening level; 20.87% | Playground | `playground: crisis, calm and new draws` |
| 21.5% (one-year bound, maximum) | Playground try-this | Martin (2017), Table I, p. 384 |
| 10%: 1.08% | Playground try-this | `playground: crisis, calm and new draws` |
| first ten seeds: bound 4.21% to 4.84%, VIX 21.6% to 27.4% | Playground try-this | same test |
| flat smile at 20%: VIX 20.0%, SVIX 20.2%, $\sqrt{e^{0.04} - 1}$ = 20.2%, bound 4.21% | Playground try-this | `playground: the flat (lognormal) smile` |
| monthly bound averaged 5.00% | Playground text | Martin (2017), p. 382 |
| predictive regressions do not reject equality | Playground text | Martin (2017), p. 367 |
| strikes 30 to 300 (dropping strikes only lowers the bound) | Playground text, caption | `the simulated market of the widget and the caption`; Martin (2017), p. 381 |
| index at 100, forward 103, 5% floor, plot 40–200 | caption | `the simulated market of the widget and the caption` (the plot range is a constant in `OptionStripBound.tsx`) |

## Summary

- **What.** `src/content/chapters/15-expected-returns-from-option-prices.mdx` (part 3, chapter 15, difficulty 3,
  prerequisites [8, 13]); the widget `src/components/plots/OptionStripBound.tsx`; its helper
  `src/components/plots/optionStripSample.ts` (the simulated market, the strike grid and `stripBound`, which calls
  `seededSmile`, `optionStrip`, `svixSquared`, `vixSquared` and `martinLowerBound`); and
  `tests/chapter15-numbers.test.ts`. No shared code, library, curriculum or style-guide file changed.
- **How the chapter runs.** Hook with Martin's numbers and the plain statement that the site's option prices are
  simulated. Intuition: options as insurance, the strip as an area, the widget at 20%. Formalisation in six steps:
  risk-neutral probabilities from $P = \mathbb{E}[MX]$; the risk-neutral mean and variance; the identity
  $\mathbb{E}_t[R] - R^f_t = \operatorname{Var}^*_t(R)/(1 + R^f_t) - \operatorname{Cov}_t(M(1+R), R)$; the negative
  correlation condition and the three cases it rules out (hedge assets, a risk-neutral world, Chapter 8's own
  stock); the strip integral through $x^2 = 2\int_0^\infty \max(0, x-K)\,dK$ and put–call parity; and variance against
  entropy (VIX as risk-neutral entropy, derived in a `<details>` block; lognormal case; why the variance, not the
  entropy, gives the bound; the VIX-based number 4.91% against the bound 4.21%). Playground at 45%, with the limits
  of a lower bound. Three quizzes. Recap with a teaser for Chapter 16 (plain text: it is not on the site).
- **Widget.** Two stacked `PlotFrame`s in one `WidgetFrame`: the implied-volatility smile (neutral `--text`) and
  the out-of-the-money strip (puts dashed left of the forward, calls solid right of it, area shaded). Controls: a
  `Slider` for the at-the-money volatility (10%–60%), a `Segmented` "Smile" (skewed (seeded) / flat (lognormal)) and a
  `Button` "New draw", which raises the seed and returns to the skewed smile. The readout shows the bound, SVIX²,
  VIX², VIX − SVIX, $R^f$, the smile's skew and curvature, and the seed. The picture morphs between smiles with
  `useTweened`, which jumps at once under `prefers-reduced-motion`; the readout always shows the target. Each
  figure has a live `aria-label`. `initialLevel` lets the Playground copy open at 45%.
- **Colour choice.** Option prices, the shaded strip and the strip integral in TeX use `--c-prob` / `\Prob`: a
  risk-neutral price is a probability-weighted payoff, and §4 gives `--c-prob` "filled at 25% opacity" for
  densities. The bound (an expected excess return) is `--c-return`, $R^f$ is `--c-rf`, $M$ is `--c-sdf`. Puts and
  calls share a colour and differ by line style and label, so colour is never the only cue.
- **Simulated market.** One-year options on an index at 100, $R^f$ = 3% a year (gross 1.03 over the horizon, as
  `optionBound.ts` expects), strikes 30 to 300 in steps of 1. One year rather than one month: at one month the
  seed-1 smile and a flat smile gave the same bound to two decimals (2.26% at 15% volatility), so "New draw"
  would show almost nothing. The grid
  stops at 30 because the quadratic smile of `seededSmile` grows without limit at very low strikes (a 1201-point grid
  down to 5 gave a bound of 8.9% for seed 5 at 15% volatility); the cut-off only lowers the bound (p. 381).
  The slider stops at 60% because above it the calls beyond 300 start to matter.
- **Mismatches with `docs/CURRICULUM.md` (reported, not edited).**
  1. The curriculum writes $\mathbb{E}_t[R_T] - R^f \ge \tfrac{1}{R^f}\mathrm{var}^*_t(R_T)$ with a gross return
     $R_T$ and a gross $R^f$. The style guide's $R$ and $R^f$ are net and the gross return is $1 + R$, so the
     chapter writes $\mathbb{E}_t[R_{t+1}] - R^f_t \ge \operatorname{Var}^*_t(R_{t+1})/(1 + R^f_t)$, with one period
     equal to the life of the options.
  2. The curriculum's $\mathrm{SVIX}^2_t$ has no $1/(T - t)$; Martin (2017, eq. 12, p. 382) annualises, and so does
     the library (TASK-056 outcome). The chapter follows the paper with $1/\tau$.
  3. The curriculum uses $S_t$ for the index price; the style guide's price is $P_t$, which the chapter uses.
  4. The curriculum uses $T$ for the maturity date; the style guide's $T$ is the sample size, so the chapter dates
     the payoff $t+1$ and writes the life of the options in years as $\tau$.
  5. The curriculum's $\mathrm{var}^*$ is written $\operatorname{Var}^*$, as the style guide writes variances.
- **Candidate symbols for the §3 table (not added).** $\mathbb{E}^*_t$ and $\operatorname{Var}^*_t$ (risk-neutral
  expectation and variance), $\pi^*(s)$ (risk-neutral probability, `\Prob`), $\tau$ (life of an option in years),
  $K$ as a strike (a reuse of $K$, the number of factors; the chapter says so in words where it first appears, as
  §3 requires, but the table does not yet list the reuse), $F_t$ (forward price), $\mathrm{put}_t(K)$,
  $\mathrm{call}_t(K)$, $\mathrm{SVIX}$, $\mathrm{VIX}$, $L(X)$ and $L^*(X)$ (entropy under real and risk-neutral odds).
- **Deviations.** The widget appears twice (Intuition at 20%, Playground at 45%), so the picture comes before the
  formulas and the Playground still has a widget. The goal "compare variance-based and entropy-based bounds" is met
  by comparing the variance bound $(1+R^f)\mathrm{SVIX}^2$ with the same expression in $\mathrm{VIX}^2$, and by
  showing that entropy gives an identity for the risk-neutral mean log return rather than a bound; the entropy bound
  on the SDF (an analogue of Hansen–Jagannathan) would need a reading the owner has not supplied.
- **Verified revision.** `npm ci`, `npm test`, `npm run build`, the screenshots and the clickthrough ran on
  `1a37646`; this outcome is the next commit and changes no code.
- **Proposed follow-ups.** A style-guide task to add the candidate symbols above and the strike reuse of $K$. A
  curriculum fix for mismatches 1–4. Martin's SVIX series as real data, which the curriculum lists as wanted later,
  would let the Hook show the 2008 spike in a widget.
