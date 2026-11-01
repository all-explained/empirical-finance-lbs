# TASK-108 outcome: Chapter 30, Shrinking the cross-section

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: after `npm ci`, `npm test` printed `Test Files 64 passed (64)`, `Tests 682 passed (682)`.
  `npm run build` exited 0; `astro check` printed `Result (194 files): 0 errors, 0 warnings, 1 hint`. The hint is
  the unused `Matrix` import in `src/lib/finance/news.ts`, outside this task and already reported as #88.
- [x] `npm run screenshots -- 30-shrinking-the-cross-section` and `npm run screenshots -- 07-mean-variance` pass in
  both themes at desktop and phone size, and the images were inspected.
  Evidence: both runs printed ✓ for `dark-desktop`, `dark-phone`, `light-desktop` and `light-phone`. The inspection
  found label collisions at 375px (line numbers and "best" on the axis titles of `ShrinkagePath`, the in-sample dot
  and the frontier line on the axis title of the `FrontierBuilder` preset). All were fixed and re-shot. Chapter 7
  renders as before. After the review fixes, the Hook caveat and the longer warning Callout were inspected in
  `light-desktop` and `dark-phone` (Hook) and `dark-desktop` and `light-phone` (Callout), and the chapter 7
  `FrontierBuilder` in `dark-phone`.
- [x] `npm run clickthrough -- 30-shrinking-the-cross-section` and `npm run clickthrough -- 07-mean-variance` pass and
  report every widget of each chapter.
  Evidence: chapter 30: ✓ "The tangency portfolio, before and after it was chosen" (3 actions at 1280px and 360px)
  and ✓ "Shrink the SDF and score it out of sample" (10 actions at each width: both options of both `Segmented`,
  the L1 share slider and the penalty slider). Chapter 7: ✓ "Build the frontier from a few portfolios" (14 actions)
  and ✓ "Does beta line up with average returns?" (27 actions).
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'` prints Hook (27), Intuition (47), Formalisation (80), Playground (263),
  Check yourself (303), Recap & next up (329).
- [x] No hex colour in the chapter or its widgets.
  Evidence: the Verify `git diff … | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` printed
  `no hex colours`; the same grep on `src/components/plots/shrinkageSample.ts` finds nothing.
- [x] The widgets use real data: `ff25-size-bm-monthly`, `ff5-monthly`, `mom-monthly` and `osap-ls-monthly` through
  `assetPanel`.
  Evidence: `useShrinkageData` in `src/components/plots/shrinkageSample.ts` loads `ff3-monthly` and
  `ff25-size-bm-monthly` with `useSeriesData` (`loadSeries`), and `ff5`, `mom` and the OSAP returns with
  `useZooData`. It passes all of them to `assetPanel('ff', …)` and `assetPanel('osap', …)`. `ff3-monthly` is the
  market that `assetPanel` removes. Both widgets read from this one hook.
- [x] The outcome holds a voice review and a table of every number in the prose with its test. See below.
- [x] The prose is 2,747 words, inside 1,500–3,000. Command (the one of chapters 9, 10, 13, 16, 22 and 26):
  `awk 'NR>8' src/content/chapters/30-shrinking-the-cross-section.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The `FrontierBuilder` preset in Intuition shows the in-sample dot and the out-of-sample ring before any formula: "The dot is the tangency portfolio in the months that chose it. The ring is the same portfolio after 2005." |
| Data before theory | The Hook opens on our data: "In those months it earned a Sharpe ratio of 1.84 a year. Then hold the same weights from January 2005 to August 2026. The Sharpe ratio falls to 0.82." |
| One idea per section | Intuition carries one idea, stated in its Callout: "The naive SDF estimate puts its largest weights on the directions with the least variance, where sample means are least reliable." |
| Start with a question the reader has | "If the estimate loses more than half its Sharpe ratio on new data, how should you estimate an SDF on 30, or 108, factors at once?" |
| Write to "you", short sentences, terms defined and linked | "Before you see the data, what do you believe about $\mu$?" Links go to Chapters 6, 7, 13 and 26. |
| Give the honest version | "From here on we treat $\Sigma$ as known. The paper argues that the main source of error is the uncertainty about the means." And: "This split is our device, not the paper's." |
| Say what the evidence can and cannot show | "The chosen penalty is itself an estimate. … Treat the best $R^2_{CV}$ as optimistic." And the FF set: "$R^2_{CV}$ is negative at every penalty. … On monthly data since 1963, with the market removed, we do not find that." And the leak: "So the months after 2004 are not fully unseen. … read the numbers after 2004 as a guide, not as a clean test." |
| Don't skip steps | $b = \Sigma^{-1}\mu$ from $\mathbb{E}[Mf] = 0$ (two lines); $\mathbb{E}[\mu'\Sigma^{-1}\mu] = SR^2_{\text{prior}}$ (three steps); the posterior mean to the ridge in `<details>` (five steps); the first-order condition of the penalised problem; the shrink factor per component. |
| Graduate rigour comes in gradually | Part VII is ●●●: full matrix notation and a Bayesian posterior, each result followed by a plain reading, e.g. "The ridge does not drop components. It fades them by their variance." |
| Papers in our own words | "Kozak, Nagel & Santosh (2020, p. 277) write this belief as a normal prior", followed by our own reason for it (near-arbitrage). No text, figure or table is copied. |

## Numbers in the prose

Every number from our data is recomputed in `tests/chapter30-numbers.test.ts` (7 tests, all pass). Sharpe ratios
are annual (monthly ×√12). The only numbers from the paper are the prior scale of about 0.23 and its sample (daily,
July 1926 to December 2017), both from Kozak, Nagel & Santosh (2020, p. 281).

| Number in the prose | Where | Test |
|---|---|---|
| 30 FF portfolios, 108 anomalies; July 1963, December 2004 / January 2005, August 2026 | Hook | `hook: naive tangency portfolio before and after 2005` |
| Naive tangency Sharpe ratio 1.84 in sample (= frontier slope), 0.82 out of sample | Hook, Intuition try-this | same |
| Anomalies: 8.85 before 2005, 2.18 after | Hook, Intuition | same |
| First three PCs of the 30 FF portfolios carry 70.5% of the variance | Intuition | `intuition: variance of the PCs and the shrunk tangency portfolio at 10^-3` |
| At $\nu_2 = 10^{-3}$: 1.64 in sample, 0.55 out of sample (FF); 2.18 → 2.36 out of sample (anomalies) | Intuition | same |
| Shrink factors 0.835, 0.383, 0.216, 0.002 (PCs 1, 5, 10, 108 at the best ridge penalty) | Formalisation | `formalisation: shrink factors of the ridge at the best penalty on the anomalies` |
| 15 prior scales from 0.01 to 1.26 a month | Playground, widget caption | `playground: the ridge path on the anomalies` |
| Best ridge $R^2_{CV}$ 0.520 at $SR_{\text{prior}} = 0.158$ a month (0.55 a year); largest coefficient STreversal; −1.38 at 1.26 | Playground try-this, Recap (0.52) | same |
| First five PCs carry 61.7% of the anomalies' variance; the five largest PC coefficients sit among the first 15 | Playground | same |
| L1 share 0.9 at $SR_{\text{prior}} = 0.112$: 20 non-zero, 0.29 (assets); 14 non-zero, 0.44 (PCs) | Playground try-this too | `playground: the elastic net with L1 share 0.9, in assets and in PCs` |
| Best $R^2_{CV}$ with L1 share 0.9 in assets: 0.485 with 44 non-zero | Playground | same |
| FF set: $R^2_{CV} < 0$ at every penalty; −3.52 weakest, −0.006 strongest (edge of the grid) | Playground, Quiz 2, Recap | `playground: the FF set and the number of folds` |
| 3 / 5 / 10 blocks pick $SR_{\text{prior}}$ 0.158 / 0.079 / 0.112 with best $R^2_{CV}$ 0.52 / 0.21 / 0.24 | Playground | same |
| Shrink factor 0.8 for $\ell_j = 4\nu_2$ | Quiz 1 | `quiz: the shrink factor of a component with variance 4ν₂` |

## Summary

**What.** `src/content/chapters/30-shrinking-the-cross-section.mdx` (six template sections, 2,747 words, three
`Quiz` questions), the widget `ShrinkagePath`, the data hook `shrinkageSample.ts`, a `preset="shrinkage"` prop of
`FrontierBuilder` (the default renders chapter 7 unchanged), and `tests/chapter30-numbers.test.ts`.

**How.** All math runs through `src/lib/finance/shrinkage.ts` (`assetPanel`, `ridgePenalty`, `shrinkagePath`,
`principalComponentAssets`, `splitSampleSharpe`), `portfolio.ts` (`sampleCovariance`) and `stats/moments.ts`.
`ShrinkagePath` computes the 15-point path one point per task, 250 ms after the controls rest, and caches each
(set, space, L1 share) path. The penalty slider only moves the marker on both panels. The PCs are rotated once per
set on the whole sample.

**Readings.** Kozak, Nagel & Santosh, *Journal of Financial Economics* 135 (2020) 271–292, opened with
`pdftotext -layout`. Pages used: 271 (main finding), 276 (naive $\hat b$, eq. 17), 277 (the prior), 278 (ridge
form and shrink factor), 279 (elastic net, $K = 3$ cross-validation), 281 ($\kappa \approx 0.23$ on raw FF25, daily
1926–2017), 289 (estimation on data to the end of 2004, used for `SPLIT_DATE`), 290 (for the withheld test, betas on
the market estimated before 2005, fn. 22).

**Deviations and mismatches to report.**
- The curriculum cites Kozak, Nagel & Santosh (2018); the chapter cites the published version (2020).
- Curriculum letters replaced by `docs/STYLE_GUIDE.md` §3: $m_t \to M_{t+1}$; $F_t - \mathbb{E}F \to \tilde f_{t+1}$;
  $\kappa^2/\tau \to SR^2_{\text{prior}}/\operatorname{tr}\Sigma$; $\gamma \to \nu_2$; $\gamma_1, \gamma_2 \to \nu_1, \nu_2$;
  $\lVert b\rVert_2^2 \to b'b$ and $\lVert b\rVert_1 \to \sum_i\lvert b_i\rvert$; "cross-validated $R^2_{OS}$" $\to R^2_{CV}$
  (§3 keeps $R^2_{OS}$ for the forecast $R^2$ of Chapter 13).
- The curriculum's Data line lists only the French files; the spec adds `osap-ls-monthly`, which the chapter uses.
- Chapter 28 is not merged on `main` at this revision, so the chapter names it by title ("A skeptical look at asset
  pricing tests") without a link. Link it once it is merged.
- Look-ahead in the split-sample and cross-validation numbers. `assetPanel` removes the market with betas from the
  whole window, and for the `'ff'` set rescales each asset with whole-window volatilities. So the post-2004 Sharpe
  ratios (1.84 → 0.82 on the FF set, 8.85 → 2.18 on the anomalies, and the shrunk ones) and every withheld fold of
  $R^2_{CV}$ see the future through those betas. The paper re-estimates the betas before 2005 for its withheld test
  (p. 290, fn. 22). Doing the same needs a change to `assetPanel` in `src/lib/finance/shrinkage.ts`, a library file
  this task may not edit. The chapter states the leak in the Hook and in the warning Callout of the
  cross-validation section, and the Intuition no longer says that no estimate from the earlier months could know the
  change after 2005.
- New symbols, added to `docs/STYLE_GUIDE.md` §3 in this PR at the review's request (the spec put §3 edits out of
  scope; the review overrides it): $s$, the $L^1$ share, $\nu_1 = s(\nu_2 + \nu_1)$; $c$ (prior), the constant
  $SR^2_{\text{prior}}/\operatorname{tr}\Sigma$ of the ridge derivation; and $Q$, $q_k$, $L$ of $\Sigma = QLQ'$, which
  chapter 6 already used and the table lacked. §3 says each $\nu$ carries its subscript, so the chapter names the
  total penalty $\nu_2 + \nu_1$ and never a bare $\nu$.
- On the 30 FF portfolios (monthly, 1963–2026, market removed) $R^2_{CV}$ is negative at every penalty, unlike the
  paper's daily raw FF25. The chapter states this as a limit of the evidence.

**Verified revision.** All checks above ran on the working tree after merging `origin/main` (`c610958`) and after
the review fixes to the chapter and `docs/STYLE_GUIDE.md`; the commit that carries them also carries this outcome.

**Follow-ups.** Link chapter 28 from chapter 30 once chapter 28 is merged. Give `assetPanel` an estimation window
for the betas and the rescaling (the paper's pre-2005 betas), then drop the leak caveat from chapter 30 and
recompute its post-2004 numbers.
