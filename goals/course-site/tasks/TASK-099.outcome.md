# TASK-099 outcome: Chapter 27: Identification: weak and useless factors

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exit 0; `npm test`: 57 files, 603 tests passed (6 in `tests/chapter27-numbers.test.ts`);
  `npm run build`: "Result (177 files): 0 errors, 0 warnings", "25 page(s) built", "Complete!", exit 0.
- [x] `npm run screenshots -- 27-weak-and-useless-factors` passes in both themes at desktop and phone size, and the
  images were inspected.
  Evidence: ✓ for dark-desktop, dark-phone, light-desktop, light-phone. I read tiles of the full pages and
  element shots of both widgets in both modes (a Playwright probe, not committed). Fixes from the inspection:
  three display equations were wider than a 375px phone (rank test, GRS-FAR and its F law, the limit), so the
  distribution statements moved into the text and the pricing error got the name $\hat\alpha(\lambda^{\circ})$;
  the `ConfidenceSet` toggle labels were shortened so they do not wrap; the coverage readout became one row per set;
  the $\hat\lambda$ legend now uses KaTeX.
- [x] `npm run clickthrough -- 27-weak-and-useless-factors` passes and reports every widget of the chapter.
  Evidence: exit 0. `UselessFactor`: 6 actions at 1280px and 6 at 360px (slider "Factor strength s", segmented
  "Fama–MacBeth t" and "Shanken t", button "Re-roll simulation"). `ConfidenceSet`: 6 and 6 (slider "Beta spread",
  button "Re-roll simulation", segmented "Simulated" and "Consumption"). The toggle sits after the slider, because
  the data mode hides the simulation controls and the script re-counts controls after each click.
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'`: line 15 Hook, 34 Intuition, 68 Formalisation, 213 Playground, 255 Check
  yourself, 281 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the Verify `git diff … | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` prints
  "no hex colours". Colours are `var(--c-prob)`, `--c-error`, `--c-factor`, `--c-model`, `--c-data`, `--text`,
  `--text-muted`.
- [x] The widgets use real data (`ff25-size-bm-monthly`, `ff3-monthly`, `fred-cay-quarterly`) and seeded simulations
  from `src/lib/math/rng.ts`.
  Evidence: both widgets load through `useIdentificationData`, which is `useConditionalData` (one shared hook for
  the three series; no new `useEffect` loading code). `UselessFactor` runs `simulateUselessFactor` (seed 1,
  `normalRng`) on the monthly panel of `factorPanel`. `ConfidenceSet` runs `simulateWeakIdentification` (seed 7) and,
  in data mode, `rankTest`, `waldConfidenceSet` and `farConfidenceSet` on `quarterlyPanel`. Both have a re-roll
  button that steps the seed.
- [x] Voice review and numbers table: below.
- [x] The prose is 2,988 words, inside 1,500–3,000. Command (the one of chapters 9, 10, 13, 16 and 22):
  `awk 'NR>8' src/content/chapters/27-weak-and-useless-factors.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition explains "a line through 25 points whose horizontal positions are this patterned noise" and shows the `UselessFactor` histograms before the Formalisation derives $\hat\beta \approx z/\sqrt{T}$. |
| Data before theory | The Hook opens on the real monthly 25 portfolios: "It calls 28.0% of them priced. The median cross-sectional $R^2$ is 0.070, and the market itself gets 0.078 on the same portfolios." |
| One idea per section | Hook: noise looks priced. Intuition: dividing by noisy betas. Formalisation: rank condition, divergence, rank test, GRS-FAR, inversion (one `###` each). Playground: weak betas and what our data show. |
| Start with a question the reader has | "So, **how can a factor unrelated to returns look priced, and how do you tell it from a real one?**" |
| Write to one reader, as "you"; explain terms; link back | "So test the rank condition before you trust $\hat\lambda$." Terms such as **weak** factor, **unbounded** and **empty** sets are defined where they first appear; Chapters 16, 17, 18 and 22 are linked. |
| Give the honest version | "It is exact with normal residuals and a fixed factor", and the simulation caption says the factor is standard normal with $T = 60$, $N = 10$. |
| Say what the evidence can and cannot show | "So, plainly: consumption betas on these portfolios differ, but only just. The data cannot say how large the premium on consumption risk is." Every estimate carries its sample (1963-Q3 to 2026-Q2, 252 quarters) and source. |
| Don't skip steps | The divergence is four numbered steps, and the size of GRS-FAR is five steps ending "The true $\check\beta$ has cancelled", with each variance written out. |
| Graduate rigour, with a plain reading | Part VI is ●●●. After the limit of GRS-FAR: "So the far ends of the line get the rank test's p-value." |
| Papers in our own words | "KZ read an unbounded set as a sign of small betas (p. 528)." No text, figure or table is copied; GKR's example is described, not reproduced. |

## Numbers in the prose

All tests are in `tests/chapter27-numbers.test.ts`. Numbers cited from a paper carry their page in the prose and
are not recomputed.

| Number in the prose | Where | Test |
|---|---|---|
| 1963-07 to 2026-08, 758 months | Hook | `hook and intuition` (`sample.first`, `last`, rows) |
| 200 draws (seed 1) | Hook | `hook and intuition` (`USELESS_SAMPLES`, `USELESS_SEED`) |
| 28.0% with FM $\lvert t\rvert > 1.96$; 7.5% Shanken | Hook, Try this, Formalisation | `hook and intuition` (`rejectFM`, `rejectShanken`) |
| median $R^2$ 0.070; CAPM $R^2$ 0.078 | Hook | `hook and intuition` |
| 46.5% of draws beat the CAPM | Hook | `hook and intuition` (`beatCapm`) |
| best draw $R^2$ 0.625 | Hook | `hook and intuition` (max of `r2`) |
| strength 0.25: no draw with $\lvert t\rvert > 1.96$; median $R^2$ 0.009 | Try this | `try this: strength 0.25` |
| 1963-Q3 to 2026-Q2, 252 quarters | Formalisation, Playground | `formalisation` (`full.first`, `last`, `quarters`) |
| $\Delta c$: $F(24, 227) = 1.61$, p = 0.039 | Formalisation | `formalisation` |
| market: $F = 9.27$, p $= 1.8 \times 10^{-22}$; 95% set empty | Formalisation, quiz 3 | `formalisation` |
| 10 assets, $\lambda = 1$, 600 samples | Playground | `playground` (`WEAK`) |
| spread 1: 90.2%, 93.2%, 94.7% | Try this | `playground` |
| spread 0.25: 38.3%, 41.0%, 94.7%; 86.8% unbounded | Try this | `playground` |
| spread 0: 22.2%, 23.5%; 97.7% unbounded | Try this | `playground` |
| $\hat\lambda = 0.89\%$ a quarter; FM $[0.14\%, 1.63\%]$; Shanken $[-0.14\%, 1.91\%]$ | What our data show | `what our data show: consumption growth` |
| 95% GRS-FAR $[0.6\%, 43.2\%]$, bounded; 29 times the FM width | What our data show, Recap | `what our data show: consumption growth` |
| rank test rejects at 5%, not at 1% | Formalisation, Recap | `what our data show: consumption growth` (0.01 < p < 0.05) |
| 99% GRS-FAR below $-8.6\%$ or above $0.5\%$, unbounded | What our data show | `what our data show: consumption growth` |
| 1963-Q3 to 1998-Q3, 141 quarters; p = 0.120; set below $-0.6\%$ or above $0.7\%$ | What our data show | `what our data show: Lettau and Ludvigson's window` |
| GKR: monthly 1967–2012; pseudo-$R^2$ 22.77% → 99.28% | Hook | cited: GKR table 1, pp. 2–3 (working paper) |
| KZ: rank-test p = 0.274 for the scaled CCAPM, unbounded sets | What our data show | cited: KZ table V, p. 535 |

The 5%, 1.96, 25 portfolios, 0.05, the first 12 rows of the widget and the strengths 0 and 0.25 are fixed inputs, not results.

## Summary

**What.** `src/content/chapters/27-weak-and-useless-factors.mdx` (part 6, chapter 27, difficulty 3,
prerequisites [18, 26]); widgets `src/components/plots/UselessFactor.tsx` and `ConfidenceSet.tsx`; their shared
helper `src/components/plots/identificationSample.ts`; `tests/chapter27-numbers.test.ts`.

**How.**
- The helper computes only through `identification.ts`, `timeSeriesTests.ts` (`factorPanel`,
  `timeSeriesRegressions`), `crossSection.ts`, `conditional.ts` (`quarterlyPanel`) and `stambaugh.ts`
  (`quantile`, `rejectionRate`). The CAPM line in `UselessFactor` is the same two-pass regression on Mkt-RF.
- `UselessFactor` runs 200 draws on 758 months (about 3 s), so it waits until the slider rests, as
  `StambaughBias` does. `ConfidenceSet` runs 600 samples (about 1 s) the same way.
- The simulated GRS-FAR grid is −4 to 6 in steps of 0.01; the consumption grid is −100% to 100% a quarter in
  steps of 0.1%, as in the TASK-095 pinned values. A set that reaches an end of its grid is shown as unbounded.
- The Formalisation derives the $\sqrt T$ growth of $\hat\lambda$, the non-vanishing $R^2$, the growth of the FM $t$
  and the bounded Shanken $t$, the size of GRS-FAR at the true $\lambda^{\circ}$ (the betas cancel), and the limit
  of GRS-FAR at $\pm\infty$ equal to the rank-test $F$.

**What our data show.** On the quarterly 25 portfolios, 1963-Q3 to 2026-Q2, consumption growth passes the rank
test at 5% (p = 0.039) but not at 1%. Its 95% GRS-FAR set is bounded, $[0.6\%, 43.2\%]$ a quarter, which excludes
zero but is 29 times wider than the FM interval; the 99% set is unbounded. Over 1963-Q3 to 1998-Q3 the rank test
does not reject (p = 0.120) and the 95% set is unbounded. The market's 95% set is empty.

**Deviations and mismatches.**
- Data: the curriculum lists `fred-consumption-quarterly`, which starts in 2007. Consumption growth comes from
  `fred-cay-quarterly` through `quarterlyPanel`, as in Chapter 22.
- Readings: the curriculum says Kleibergen & Zhan (2019); the PDF is the published version, Journal of Finance
  75(1), 507–550, February 2020, so the chapter cites 2020. The Nagel PDF is NBER Working Paper 18554
  (November 2012), so its pages (19–20, fn. 9) are working-paper pages; the chapter says so. GKR pages are those
  of the Atlanta Fed working paper 2017-9. GKR prove $R^2 \to 1$ only for ML and CU-GMM; for the OLS two-pass
  they state the $\sqrt T$ divergence citing earlier work, and the chapter says exactly that. No fact is taken from
  Kan & Zhang (1999).
- Notation: the curriculum writes $\mathrm{rank}(\mathbb{E}[R^e f']) = K$; the chapter follows §3 and writes
  $\mathrm{rank}(\mathbb{E}[R^e\tilde f']) = K$ with demeaned factors, and shows it equals $\mathrm{rank}(B) = K$.
  The curriculum's "factor Anderson–Rubin statistic" is called GRS-FAR, as in KZ and the library.
- Symbols the §3 table still lacks (candidates for a style-guide task): $B$, the $N \times K$ matrix of betas;
  $\check R_t$ and $\check\beta$, the $N - 1$ returns minus the last asset and their betas (KZ eq. 15);
  $\hat\alpha(\lambda^{\circ})$, the pricing error at a hypothesised premium; $p(\lambda^{\circ})$, the GRS-FAR
  p-value; $z$, the limit of $\sqrt T\hat\beta$ in the divergence argument (in Chapters 22–23, $z_t$ is a state
  variable; here $z$ has no date). The residuals of the differenced regression are $\varepsilon_t$, as in §3, not
  KZ's $u_t$.
- Chapter 26 is not merged. The chapter names it by title, *GMM for asset pricing models*, without a link, in one
  sentence that says it estimates $b$ from $\mathbb{E}[R^e] = \mathbb{E}[R^e\tilde f']b$ (its curriculum entry).
  Re-check that sentence and add the link when Chapter 26 merges. Part VII's first chapter is named only in Recap.

**Verified revision.** The commit that adds this file, on `origin/main` `20d5bfa`: `npm ci`, `npm test`,
`npm run build`, `npm run screenshots -- 27-weak-and-useless-factors`, `npm run clickthrough --
27-weak-and-useless-factors`, the `section-tag` grep, the hex grep and the tracked-PDF count, all as above.

**Follow-ups.**
- Style-guide task: add the symbol candidates above to the Part VI table.
- When Chapter 26 merges: link it from this chapter.
- `docs/READINGS.md` still lists Kleibergen & Zhan as "owner to supply" (reported by TASK-095).
