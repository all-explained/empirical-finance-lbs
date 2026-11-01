# TASK-114 outcome: characteristic portfolios and factor-mimicking portfolios

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX
  macro check.
  Evidence: after `npm ci`, `npm test` printed `Test Files 67 passed (67)`, `Tests 707 passed (707)`; this includes
  `tests/notation.test.ts`. `src/lib/finance/mimicking.test.ts` has 14 tests:
  - `slopeWeights`: `slopeWeights(Z)·Z` is the 3 × 3 identity to 1e-12 on `ff25Characteristics()`, the constant's
    row sums to 1 and the others to 0; a hand case $Z = [1\ {-1};\ 1\ 0;\ 1\ 1]$ gives rows $(1/3, 1/3, 1/3)$ and
    $(-1/2, 0, 1/2)$.
  - `slopePortfolios`: equals `famaMacBeth(...).monthly` on the 758 months of the 25 portfolios to 1e-10; with a
    seeded time-varying $Z_t$ it equals a one-period `famaMacBeth` on each $(R_t, Z_t)$ to 1e-12.
  - `ff25Characteristics`: rows 0, 4, 20, 24 equal the hand-written table ME1-BM1 $[1, -2, -2]$, ME1-BM5
    $[1, -2, 2]$, ME5-BM1 $[1, 2, -2]$, ME5-BM5 $[1, 2, 2]$.
  - `sortWeights`: value minus growth on the B/M scores sums to 0, has exposure 1 to the score, and weights each
    BM5 and BM1 portfolio $\pm 1/20$; it throws when a leg is empty.
  - `mimickingPortfolio`: a seeded factor $0.002 + w'R^e_t$ returns $w$ and $a = 0.002$ to 1e-10 and a correlation of
    1, in sample and after a split.
  - Pinned values on committed data, below.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `npm run build` exited 0 (`31 page(s) built`, `Complete!`); `astro check` printed
  `Result (202 files): 0 errors, 0 warnings, 1 hint`. The hint is the unused import in `src/lib/finance/news.ts`,
  outside this task and already reported as #88.
- [x] `docs/STYLE_GUIDE.md` §3 has a Part VIII block with the slope and projection symbols; each with the clash it
  avoids:

  | Symbol | Replaces | Clash it avoids |
  |---|---|---|
  | $\hat\xi_{t+1}$ (slopes on characteristics) | the curriculum's $\hat\gamma_t$ | $\gamma$ is risk aversion. Not $c$ (log consumption $c_t$) nor $g$ (Chapter 24 writes the moment at $t$ as $g_t$). Dated $t+1$ like the return it is, not $t$ as in the curriculum |
  | $a$ (projection intercept) | the curriculum's $c$ | $c_t$ is log consumption, the very series Chapter 33 projects. $a$ is already the §3 intercept of time-series regressions |
  | $w$ (mimicking weights) | kept | Same meaning as the §3 portfolio weights; the row says that on excess returns they need not sum to one |
  | $\varepsilon_t$ (projection residual) | the curriculum's $e_t$ | $e_{\text{SH},t}$ is the 2×3 residual of Chapter 19; $\varepsilon$ is the §3 residual |
  | $z_{i,t}$, $Z_t$ (characteristics) | kept | $z_t$ is the Part V state variable; $z_{i,t}$ always carries an asset index. TASK-113 (IPCA) had not merged, so this task chose them |
  | $\dim z$ (number of characteristics) | the $L$ of Kelly, Pruitt & Su | $L$ counts Newey–West lags and is the eigenvalue matrix of $\Sigma = QLQ'$; $\dim z$ follows Part VI's $\dim g$ |

  The γ row (Part I) said slopes on characteristics "are $c$ or $g$"; it now points to $\hat\xi_{t+1}$. Three rows
  that ruled out $c$ or $g$ "as a slope on characteristics" ($\zeta$, $g(x_t,\theta)$, $c$ (prior)) lost that
  clause, since neither letter is a slope now.
- [x] `git status --short` shows only `src/lib/finance/mimicking.ts`, its test, `docs/STYLE_GUIDE.md` and this
  outcome file. Evidence: before the first commit, `git status --short` printed ` M docs/STYLE_GUIDE.md` and `??`
  for `goals/course-site/tasks/TASK-114.outcome.md`, `src/lib/finance/mimicking.test.ts` and
  `src/lib/finance/mimicking.ts`. After the commit, `git status --short` prints nothing (exit 0), and
  `git diff --name-only origin/main...HEAD` lists exactly those four files.

Verified revision: `aada72b`, rebased on `origin/main` `e8857a0`. The run was `npm ci` (exit 0), `npm test`
(`Test Files 67 passed (67)`, `Tests 707 passed (707)`), `npm run build` (exit 0, `Result (202 files): 0 errors,
0 warnings, 1 hint`, `31 page(s) built`), `git status --short` (empty, exit 0).

## Pinned values on the committed data

| Quantity | Value | Sample |
|---|---|---|
| corr(B/M slope portfolio, HML) | 0.9673 | monthly, 1963-07 to 2026-08, 758 months |
| B/M slope, Fama–MacBeth mean | 0.000923 a month per quintile step | same |
| B/M slope, Fama–MacBeth $t$ (divisor $T$) | 2.940 | same |
| corr($\Delta c$, mimicking), 25 portfolios, in sample | 0.4015 | quarterly, 1963-Q3 to 2026-Q2, 252 quarters |
| corr($\Delta c$, mimicking), 25 portfolios, later half | −0.1543 | weights from 1963-Q3 to 1994-Q4 (126 quarters), correlation 1995-Q1 to 2026-Q2 (126) |
| corr($\Delta c$, mimicking), FF3, in sample | 0.0867 | 252 quarters |
| corr($\Delta c$, mimicking), FF3, later half | −0.0076 | same split |

The split halves the sample. The 25-portfolio projection fits 26 parameters on 126 quarters; its correlation drops
from 0.40 to −0.15 out of sample, the overfitting the doc comment warns about.

## Summary

What: `src/lib/finance/mimicking.ts` with `slopeWeights`, `slopePortfolios`, `ff25Characteristics`, `sortWeights` and
`mimickingPortfolio`, its test, and the Part VIII block of `docs/STYLE_GUIDE.md` §3.

How: `slopeWeights` is $(Z'Z)^{-1}Z'$ from `linalg`. `slopePortfolios` takes one $Z$ or one $Z_t$ per period, with
$Z[t]$ known before `returns[t]`, the timing of `managedPortfolios` in `conditional.ts`. `ff25Characteristics` parses
`seriesColumns['ff25-size-bm-monthly']`. `sortWeights` divides the long–short weights by long − short, so the sort
has unit exposure to its score, like the score's row of `slopeWeights`. `mimickingPortfolio` runs `ols` and computes
correlations from `sampleCovariance`; `split` is the number of estimation periods. The tests reuse `famaMacBeth`,
`factorPanel` and `quarterlyPanel`. Doc comments cite Fama & French (1992, pp. 430, 438–439), Kelly, Pruitt & Su
(2018, NBER WP, p. 15) and Giglio & Xiu (2021, pp. 1954–1955).

Deviations:
- Data: the curriculum's data line for Chapter 33 names `fred-consumption-quarterly`. That series starts in 2007-Q1
  (`docs/DATA.md`), so it cannot cover 1963 on. As the spec says, the projection uses `dc` of `quarterlyPanel`, the
  consumption growth of Chapters 22 and 26. The curriculum's data line is out of date on this point.
- Notation: the curriculum's Key math writes $\hat\gamma_t = (Z_t'Z_t)^{-1}Z_t'r_{t+1}$ and
  $f_t = c + w'R^e_t + e_t$. Chapter 33 should write $\hat\xi_{t+1} = (Z_t'Z_t)^{-1}Z_t'R^e_{t+1}$ and
  $f_t = a + w'R^e_t + \varepsilon_t$.

Follow-ups:
- TASK-113 (IPCA) chooses symbols for the characteristics and their count; on rebase it should keep $z_{i,t}$,
  $Z_t$ and $\dim z$ or replace them in one place.
- TASK-115: the curriculum's $g_t = \xi + \eta v_t + z_t$ uses $\xi$, now the slopes on characteristics. Its
  intercept is the intercept of a projection of a factor, so $a$ of this block fits it.
