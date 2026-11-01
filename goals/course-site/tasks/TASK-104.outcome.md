# TASK-104 outcome: Library: Bonferroni, Holm and Benjamini–Hochberg–Yekutieli, and seeded strategy searches

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX
  macro check.
  Evidence: `npm test` on `625c7d7` (on `origin/main` `be4b470`): 61 files, 640 tests passed, exit 0, with
  `tests/notation.test.ts` green. `multipleTesting.test.ts` has 16 tests. Reference values per export:
  `pValues`: $t = \pm 1.96$ gives 0.05 to 1e-4, $t = 0$ gives 1.
  `bonferroni`, `holm`, `benjaminiHochberg`, `benjaminiHochbergYekutieli`: the ten $p$-values of Harvey, Liu &
  Zhu (2016), Table 4 (p. 18), worked by hand at $q = 5\%$. Bonferroni rejects tests 4, 7, 8; Holm adds 9
  ($p_{(5)} = 0.84\% > 5\%/6$); BH rejects all ten; BHY rejects 2, 4, 6, 7, 8, 9 ($p_{(6)} = 0.85\% \le 1.02\%$).
  These are the paper's counts 3, 4 and 6. Counts are ordered Bonferroni ≤ Holm ≤ BH and BHY ≤ BH. Each $t$
  cut-off equals $\Phi^{-1}(1 - p/2)$ of the largest rejected $p$ from Python `statistics.NormalDist`, to 1e-10
  (3.4808, 2.7478, 1.9899, 2.6315; the paper's $t$ are 3.43, 2.75, 2.63 from rounded $p$). No rejection gives
  `tCutoff: null`; bad inputs throw.
  `yekutieliConstant`: $c(1) = 1$, $c(10) = 7381/2520$. BHY with $n = 1$ rejects $p = 0.05$ and keeps
  $p = 0.0501$ at $q = 0.05$: a single test at level $q$.
  `simulateStrategySearch`: same seed, same output; another seed, other $t$; 10 of 50 true at share 0.2. With
  `trueShare` 0 (5000 strategies, $T = 240$, seed 2016) the share of $|t| > 1.96$ is within 0.012 of 5%: the
  exact size of $|t_{239}| > 1.96$ is 0.0512, and three binomial standard errors are 0.0092. With every alpha
  true (2000 strategies, annual Sharpe 0.5) the mean $t$ is within 0.07 ($3/\sqrt{2000}$) of
  $0.5\sqrt{20} = 2.236$.
  `discoveryCounts`: a hand-made five-strategy case gives 2 true and 1 false discoveries, 1 miss, proportion 1/3,
  and expected false discoveries $2 \times 2\Phi(-1.96) = 0.09999$; no discovery gives proportion 0.
  Pinned on `osap-ls-monthly` (original-sample $t$ of `signalSummaries`): 165 signals; 158 with $|t| > 1.96$;
  107 with $|t| > 3$; at $q = 0.05$ Bonferroni keeps 81 (cut-off $|t| = 3.643$), Holm 88 (3.453) and BHY 123
  (2.725). A separate Python script on the same JSON (stdlib only) gives the same numbers.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `Result (186 files): - 0 errors`, `[build] Complete!`, exit 0, on `625c7d7`.
- [x] `docs/STYLE_GUIDE.md` §3 has a Part VII block with the symbols for the number of tests and a $p$-value, and
  the outcome lists each with the clash it avoids.
  Evidence: the block "Part VII: the factor zoo and shrinkage (Chapters 28–30)" follows the Part VI block. Rows:
  - $n$, $n_0$; $c(n)$: number of tests, true nulls, and BHY's constant. Avoids $M$ (the SDF; the paper and the
    curriculum write $M$, $M_0$) and $N$ (number of test assets). A maturity $n$ is always a superscript in
    parentheses and log asset wealth $n_t$ always carries a date. $c(n)$ always keeps its argument, so it is not
    log consumption $c_t$.
  - $p_i$; $p_{(j)}$: the $p$-value of test $i$ and the $j$-th smallest. Avoids the log price $p_t$ (a $p$-value
    carries a test index, never a date), the bond price $p^{(n)}_t$ (index above, not below) and $\pi$ (a state
    probability). The level stays §3's $q$, never $\alpha$.
  No macro is added, so the KaTeX macro check is unchanged.
- [x] `git status --short` shows only `src/lib/stats/multipleTesting.ts`, its test, `docs/STYLE_GUIDE.md` and
  this task's outcome file.
  Evidence: before the code commit, `git status --short` showed ` M docs/STYLE_GUIDE.md`,
  `?? src/lib/stats/multipleTesting.test.ts` and `?? src/lib/stats/multipleTesting.ts`; this file is the only
  other change on the branch.

## Summary

**What.** `src/lib/stats/multipleTesting.ts` exports `pValues`, `bonferroni`, `holm`, `benjaminiHochberg`,
`benjaminiHochbergYekutieli`, `yekutieliConstant`, `simulateStrategySearch` (with the constant
`strategyVolatility`) and `discoveryCounts`. It reuses `cdf` and `invCdf` (`normal.ts`), `normalRng` (`rng.ts`),
`arithmeticMean` and `meanStandardError`. The tests reuse `signalSummaries` and `countAbove`.

**How.** Each procedure returns `{ rejected, count, tCutoff }`: a flag per test in input order, the number
rejected and the smallest rejected $|t|$, read off the largest rejected $p$ as $\Phi^{-1}(1 - p/2)$, or `null`.
Holm is a step-down loop; BH and BHY share one step-up rule with $c = 1$ or $c(n)$. Doc comments cite HLZ:
Bonferroni pp. 17–18, Holm pp. 19–20, BHY pp. 20–21 and eq. (1), BH's dependence condition p. 21, and the case
for $t \approx 3$ (abstract p. 5; BHY 2.78 at 5% on p. 26; 3.18 with unpublished tries on p. 28). Journal page =
PDF page + 4.

`simulateStrategySearch` draws i.i.d. normal monthly returns with annualised volatility 15%
(`strategyVolatility`). The first `round(count × trueShare)` strategies have monthly mean
$(\text{sharpe}/\sqrt{12})\,\sigma_{\text{month}}$; the rest have mean zero. $t = \bar r/(s/\sqrt T)$, as in
`zoo.ts`. `discoveryCounts` uses $|t| > \text{cutoff}$ (strict, like `countAbove`) and the two-sided size
$2\Phi(-\text{cutoff})$.

**Deviations.** `yekutieliConstant` is exported (and tested) so chapter 29 can print $c(n)$ without repeating the
formula.

**Verified revision.** `625c7d7` plus this file.

**Follow-ups.** Chapter 29 (TASK-107) must write the curriculum's $p_i \le \alpha/M$ and $M_0\,\alpha$ as
$p_i \le q/n$ and $n_0$ times the test size; TASK-107's spec already asks for that.
