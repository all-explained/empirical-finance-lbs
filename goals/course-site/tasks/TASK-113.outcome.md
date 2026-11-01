# TASK-113 outcome

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX
  macro check. Evidence: `src/lib/finance/ipca.test.ts` has 14 tests over the five exported functions.
  - `simulateIpcaPanel`: it gives the same panel for the same seed. Each month, each characteristic is exactly
    $\{1/N, \dots, 1\} - 0.5$. $\Gamma_\beta'\Gamma_\beta = I$ and $\Gamma_\alpha \perp \Gamma_\beta$.
    The alpha term's share of squares is 0.3 to 12 digits. $\Gamma_\alpha = 0$ when `alphaShare` is 0.
  - `managedPortfolios`: it matches a hand computation with three firms and two characteristics over two months.
  - `ipcaFit`:
    - With $K = \dim z$, $\hat\Gamma_\beta\hat f_{t+1}$ equals the `famaMacBeth` slopes of each month to 9 digits.
    - On a panel with $N = 1000$, $T = 240$, $\dim z = 6$ and $K = 2$, the fit recovers the column space of the
      true $\Gamma_\beta$. The measure is the smallest squared cosine of the principal angles (observed 0.99826,
      tolerance ≥ 0.995, that is an angle below 4.1°). The objective never rises across iterations.
    - The normalisation holds on restricted and unrestricted fits: $\Gamma_\beta'\Gamma_\beta = I$ to 12 digits,
      off-diagonal factor covariance below $10^{-12}$ of the first variance, descending variances, non-negative means.
  - `ipcaR2`: the total $R^2$ is 1 to 9 digits on noiseless restricted and unrestricted panels. It equals
    $-\text{objective}/\sum R^{e\,2}$ of the last iteration. On the large panel it is 0.1263558044 (total) and
    0.0071427728 (predictive).
  - `alphaTest`: the same seed gives the same output. On the default panel with seed 1 and 200 bootstraps,
    $p = 0.685$ when the true $\Gamma_\alpha = 0$, and $p = 0$ when `alphaShare` is 0.02. The two bootstrap tests
    have an explicit 60 s timeout (issue #67); each takes about 1 s.

  `npm test`: `Test Files 67 passed (67)`, `Tests 707 passed (707)`. This includes `tests/notation.test.ts`.
- [x] `npm run build` passes (`astro check` reports 0 errors). Evidence: `0 errors`, `0 warnings`, `1 hint`, then
  `[build] Complete!`. The hint is the unused `Matrix` import in `src/lib/finance/news.ts`, which is already open as
  all-explained/empirical-finance-lbs#88.
- [x] `docs/STYLE_GUIDE.md` §3 has a Part VIII block with the IPCA symbols. Each symbol and the clash it avoids:
  - $z_{it}$, $Z_t$ (characteristics): the paper's and the curriculum's letter. The firm index $i$ separates them
    from the Part V state variable $z_t$ and the Chapter 14 human-capital gap $z_t$, which never carry one.
  - $\dim z$ (number of characteristics, the paper's $L$): avoids $L$, the Newey–West lag count and the eigenvalue
    matrix of $\Sigma = QLQ'$. The code says `dimZ`, never `L`.
  - $\Gamma_\beta$, $\Gamma_\alpha$: upper-case and always subscripted, so they never read as risk aversion $\gamma$.
    $\Gamma_\alpha$ takes no `\Err` macro, because it is a map to alphas, not a pricing error.
  - $R^Z_{t+1} = Z_t'R^e_{t+1}$ (managed portfolios, the paper's $x_{t+1}$): avoids $x_t$, the predictor. The code
    says `returns`, never `x`.
  - $Z_t'Z_t$ (the paper's $W_t$), always written out: avoids $W$, the GMM weighting matrix, and $W_t$, total
    wealth. The code says `ZtZ`, never `W`.
  - $W_\alpha$: it keeps the paper's name and always its subscript, as $\delta_{\text{HJ}}$ does. So it never reads
    as $W$ or $W_t$. The code says `wAlpha`.
  - $R^2_{\text{total}}$, $R^2_{\text{pred}}$: they avoid $R^2_{OS}$, $R^2_{CV}$, $R^2_{\text{OLS}}$ and
    $R^2_{\text{GLS}}$.
  - The block's first line says that the paper's excess return $r_{i,t+1}$ is $R^e_{i,t+1}$ here, because $r$ is a
    log return.

  No other Part VIII task had merged a block when I rebased on `origin/main` (at `ba1b102`), so this PR creates the
  heading.
- [x] `git status --short` shows only `src/lib/finance/ipca.ts`, its test, `docs/STYLE_GUIDE.md` and this task's
  outcome file. Evidence: before the commit it showed `M docs/STYLE_GUIDE.md`, `?? src/lib/finance/ipca.test.ts` and
  `?? src/lib/finance/ipca.ts`. After the commits it is empty, and `git diff --name-only origin/main...HEAD` lists
  these four files.

## Summary

**What.** `src/lib/finance/ipca.ts` has five functions:

- `simulateIpcaPanel(seed, { N, T, dimZ, K, alphaShare, noise })`. The defaults are 200 firms, 120 months,
  4 characteristics, 2 factors, `alphaShare` 0 and `noise` 0.1.
- `managedPortfolios(Z, excess)`.
- `ipcaFit(managed, { K, alpha, tolerance, maxIterations })`. The defaults are $10^{-6}$ (Appendix A) and 1,000.
- `ipcaR2(panel, fit)`.
- `alphaTest(seed, managed, fit, { bootstraps })`. The default is 200.

The fit returns $\hat\Gamma_\beta$, $\hat\Gamma_\alpha$, the factors, $\hat\lambda$ (the factor means), and per-iteration
`history.objective` and `history.maxChange` for the convergence animation.

**How.** Doc comments cite the working paper (NBER w24540, April 2018):

| Topic | Place in the paper |
|---|---|
| Model | eq. 3, p. 9; pp. 10–12 |
| First-order conditions | eqs. 6–7, p. 12; eq. 11, p. 16 |
| Normalisation | p. 13 |
| Managed portfolios and the start value | eq. 9, p. 14 |
| The case $K = L$ | p. 15 |
| Rank transform | pp. 23–24 |
| Total and predictive $R^2$ | eqs. 14–15, p. 24 |
| ALS method | Appendix A, p. 52 |
| Bootstrap test | section 3.1, pp. 17–19, eq. 12 |

The ALS uses only $R^Z$ and $Z_t'Z_t$. The doc comment of `ipcaFit` derives the two Kronecker identities that make
this possible. The fit reuses `symmetricEigen` (start value and normalisation), `solve` (both ALS steps) and
`inverse` from `linalg.ts`, `sampleCovariance` and `sampleMeans` from `portfolio.ts`, and `mulberry32` and
`normalRng` from `rng.ts`. The test reuses `famaMacBeth`.

**Deviations from the spec, and where the paper is silent.**

1. The spec puts the model on pp. 10–12. Eq. 3 is on p. 9, and eqs. 4–7 are on p. 12. The comments cite p. 9 and
   pp. 10–12.
2. The unrestricted fit is not identified as written. $\Gamma_\alpha \to \Gamma_\alpha + \Gamma_\beta c$ with
   $f \to f - c$ leaves the fit unchanged, and the normalisation of p. 13 does not fix this. So each iteration
   projects $\Gamma_\alpha$ off the columns of $\Gamma_\beta$. The paper does not state this condition, but its
   Appendix B simulation draws $\Gamma_\alpha$ orthogonal to $\Gamma_\beta$. Without it, $W_\alpha$ would depend on
   where the ALS stops along a flat direction. The projection keeps the objective non-increasing, and a test checks
   this.
3. With $K = L$ the paper sets $\Gamma_\beta = I_L$, so the factors are the Fama–MacBeth slopes. Under the p. 13
   normalisation the factors are those slopes rotated, so the test compares $\hat\Gamma_\beta\hat f_{t+1}$ with the
   slopes.
4. The managed portfolios carry no $\sum_t R^{e\prime}R^e$, so `history.objective` is objective (5) less that
   constant. The doc comment says that $-\text{objective}/\sum R^{e\,2}$ is the total $R^2$ of each iteration, and a
   test checks it.
5. Names that differ from the spec: the option is `dimZ`, not `L`. The returns argument is `excess`, as in
   `famaMacBeth`. The fields are `returns`/`ZtZ`, not `x`/`W`. The reason: the spec asks to keep taken letters out
   of code names.
6. The paper does not divide by the number of firms in eq. 9, so neither does the code. With the same $N$ every
   month, dividing would change neither $\hat\Gamma$ nor $\hat f$.
7. The paper calls $\hat\lambda$ the unconditional risk-price estimate. The code takes the factor means, as the
   spec says.
8. Bootstrap (eq. 12): each month of a sample draws its own residual month and its own unit-variance $t_5$
   multiplier. The p-value is the share of $\tilde W_\alpha$ strictly above $W_\alpha$, as in the paper. The refits
   use the default tolerance.
9. The simulation's alpha size `alphaShare` follows the spirit of Appendix B's $\kappa$, which is set by the share
   of return variation. It is the alpha term's share of the panel's sum of squares, with the cross term ignored.

**Verified revision.** The library commit `ed07f7f` on top of `origin/main` at `ba1b102`. `npm ci`, `npm test`
(67 files, 707 tests) and `npm run build` (0 errors) pass there.

**Proposed follow-ups.** None. TASK-117 (Chapter 32) can build `IPCAFit` on `simulateIpcaPanel`, `ipcaFit` and
its `history`. It can draw the heat map from `gammaBeta`.
