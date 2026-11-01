# TASK-115 outcome: the three-pass estimator and a seeded economy with an omitted factor

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX
  macro check.
  Evidence: after `npm ci`, `npm test` printed `Test Files 70 passed (70)`, `Tests 752 passed (752)`; this includes `tests/notation.test.ts`.
  `src/lib/finance/threePass.test.ts` has 15 tests:
  - `threePass`: equals eq. 8 written out by hand (V̂ from the T × T matrix R̃R̃' of eq. 7, β̂ = T⁻¹R̃V̂') on a seeded
    T = 60, N = 8 panel to 1e-12; with `zeroBeta` equals eq. 9 by hand (λ̂_0 and λ̂_χ, with M_β̂ and M_ι) to 1e-12;
    a random 5 × 5 rotation H before steps 2 and 3 leaves λ̂_χ, its standard error and the R² unchanged to 1e-10
    while the latent premia become Hλ̂; an observed factor equal to PC k gets β̂_χ = e_k, R² = 1 and λ̂_χ = λ̂_k;
    pinned premia, R² and standard errors on committed data (below), against numpy.
  - `twoPass`: pinned premia on the 25 and on the 55 portfolios, and with a zero-beta rate on the 25, against numpy.
  - `simulateOmittedFactor`: same seed, same output (and another seed differs); with no omitted factor and no noise
    the mean gap between the two estimates is under 0.01% a month; with `strength` 2 and `correlation` 0.5 the
    two-pass bias is within 0.07% of the predicted 0.5% and the three-pass bias within 0.07% of 0; with `noise`
    equal to the factor volatility the same bands hold for the attenuation bias. The band is three standard
    errors of a mean over 100 samples (0.04/√300/√100 = 0.023%). These tests have a 60 s timeout (issue #67).
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `npm run build` exited 0 (`31 page(s) built`, `Complete!`); `astro check` printed
  `Result (208 files): 0 errors, 0 warnings, 1 hint`. The hint is the unused import in `src/lib/finance/news.ts`,
  outside this task and already reported as #88.
- [x] `docs/STYLE_GUIDE.md` §3 has the three-pass symbols in the Part VIII block, each with the clash it avoids:

  | Symbol | Replaces | Clash it avoids |
  |---|---|---|
  | $\chi_t$ (observed factor) | the paper's $g_t$; the curriculum's $g_t$ | Chapter 24 writes the GMM moment at $t$ as $g_t$. $\xi$, the curriculum's intercept, is now the slopes $\hat\xi_{t+1}$ of Chapter 33 (TASK-114). $\chi$ was free apart from the $\chi^2$ distribution, which always carries its square and degrees of freedom. `\Factor`, like $f_t$ and $f^P_t$ |
  | $a$ (its intercept) | the curriculum's $\xi$ | $\xi$ is taken (above). $a$ is already the §3 intercept of a time-series regression; TASK-114's outcome proposed it |
  | $\beta_\chi$ (its loadings on the latent factors) | the paper's and the curriculum's $\eta$ | $\eta$ is the intercept of a conditional SDF (Chapter 22). A loading is an exposure, which §3 reserves $\beta$ for; the subscript $\chi$ separates it from an asset's $\beta_i$ |
  | $\varepsilon_{\chi,t}$ (its measurement error) | the paper's and the curriculum's $z_t$ | $z_t$ is the state variable of Chapters 22–23. Not $u_t$, a second equation's shock, which the paper uses for the returns' residuals. `\Err`, like every $\varepsilon$ |
  | $\lambda_\chi$ (its risk premium) | the paper's $\gamma_g$; the curriculum's $\gamma_g$ | $\gamma$ is risk aversion; §3 premia are $\lambda$. The row says the subscript is the letter $\chi$, never the $0$ of the zero-beta rate $\lambda_0$ |
  | $f_t$, $\varepsilon_t$, $\lambda$, $K$ (latent factors, residuals, their premia, number of PCs) | the paper's $v_t$, $u_t$, $\gamma$, $\hat p$ | A sentence above the Part VIII table: $v_t$, $u_t$ are a second equation's shocks and $\gamma$ is risk aversion. These are the symbols `latentFactors.ts` (TASK-112) already uses |

  The code keeps the clashing letters out of its names: `betaChi`, `lambda`, `se`, no `eta`, `gamma` or `g`.
- [x] `git status --short` shows only `src/lib/finance/threePass.ts`, its test, `docs/STYLE_GUIDE.md` and this
  outcome file. Evidence: before the first commit, `git status --short` printed ` M docs/STYLE_GUIDE.md` and `??`
  for `goals/course-site/tasks/TASK-115.outcome.md`, `src/lib/finance/threePass.test.ts` and
  `src/lib/finance/threePass.ts`. After the commit it prints nothing (exit 0), and
  `git diff --name-only origin/main...HEAD` lists exactly those four files.

Verified revision: `ac3dc4f`, rebased on `origin/main` `27bf5a5`. The run was `npm ci` (exit 0), `npm test`
(`Test Files 70 passed (70)`, `Tests 752 passed (752)`, exit 0), `npm run build` (exit 0, `Result (208 files):
0 errors, 0 warnings, 1 hint`, `31 page(s) built`), `git status --short` (empty, exit 0). This outcome file is
the only change after it.

## Pinned values on the committed data

Monthly, 1963-07 to 2026-08, T = 758, whole sample, no zero-beta rate. Premia are per month in decimals. The 55
portfolios are the 25 size–B/M portfolios with the 30 industries of `ff30-industry-monthly` added (minus RF).

| PCs | Mkt-RF, 25 | SMB, 25 | HML, 25 | Mkt-RF, 55 | SMB, 55 | HML, 55 |
|---|---|---|---|---|---|---|
| 3 | 0.005490 | 0.001534 | 0.003397 | 0.006171 | 0.000639 | 0.000469 |
| 4 | 0.005304 | 0.001942 | 0.003217 | 0.006057 | 0.000748 | 0.000769 |
| 5 | 0.005383 | 0.001860 | 0.003196 | 0.005815 | 0.001380 | 0.001065 |
| 6 | 0.005362 | 0.001873 | 0.003208 | 0.005824 | 0.001402 | 0.001057 |
| 7 | 0.006107 | 0.001677 | 0.002736 | 0.006123 | 0.001084 | 0.001309 |
| two-pass | 0.005604 | 0.001444 | 0.003532 | 0.006059 | 0.000861 | 0.001846 |
| sample mean | 0.006018 | 0.001474 | 0.002940 | 0.006018 | 0.001474 | 0.002940 |

- On the 25 portfolios every three-pass premium is within half a standard error of the factor's mean, as it should
  be for a traded factor. With 5 PCs the standard errors are 0.160%, 0.109% and 0.106% (3 Newey–West lags: 0.165%,
  0.111%, 0.123%); Mkt-RF's is close to its σ/√T = 0.162%, as p. 1965 predicts for a traded factor the PCs span.
- On the 55 portfolios HML is poorly spanned by 3 PCs (R² = 0.22) and its premium drops to 0.05% a month; with
  5 or more PCs R² is 0.84–0.86 and the premium 0.11–0.13%, still below its mean of 0.29%. The industries add
  strong comovement that is not value, so a few PCs no longer pick up HML. Chapter 34 can show this.
- With a zero-beta rate (eq. 9, 5 PCs, 25 portfolios) λ̂_0 = 1.54% a month and Mkt-RF's premium is −0.94%; the
  two-pass gives λ̂_0 = 1.16% and −0.55%. This is the familiar failure of the 25 portfolios to pin down the
  zero-beta rate; Giglio & Xiu's positive market premium with a free zero-beta rate needs their 647 portfolios.

## Summary

What: `src/lib/finance/threePass.ts` with `threePass`, `twoPass` and `simulateOmittedFactor`, its test, and four
rows plus one sentence in the Part VIII block of `docs/STYLE_GUIDE.md` §3.

How: `threePass` runs `pcaFactors` (step 1; its normalisation is the paper's eq. 7), `crossSectionalRegression` of
R̄^e on β̂ (step 2, with an intercept under `zeroBeta`), and `ols` of each observed factor on the PCs (step 3), then
λ̂_χ = β̂_χ'λ̂. An optional `rotation` H goes through `rotateFactors` before steps 2 and 3. `twoPass` is
`timeSeriesRegressions` then `crossSectionalRegression` on `sampleMeans`. No regression code is new. The standard
error follows Theorem 1 (p. 1964) and the estimator of p. 1970: Φ̂ is the Newey–West long-run covariance
(`longRunCovariance`, `lags` = q, default 0) of ψ_t = ε̂_{χ,t} f̂_t'Σ̂_f⁻¹λ̂ + β̂_χ'f̂_t, which expands to the paper's
four blocks Π̂_11, Π̂_12, Π̂_21, Π̂_22; the numpy reference builds those blocks with Kronecker products, so the test
checks the algebra. `simulateOmittedFactor` draws, per sample, loadings a_i and b_i, two independent factors and
the noisy proxy χ_t of the first, with the RNG of `rng.ts`. Doc comments cite Giglio & Xiu (2021, JPE 129) for
§II (pp. 1953–1956), eqs. 1–2 (p. 1956), rotation invariance (pp. 1956–1957), eqs. 7–8 (p. 1959), eq. 9 (p. 1960),
Theorem 1 (p. 1964), the variance estimator (p. 1970) and consistency with extra PCs (p. 1972).

Deviations from the spec:
- Standard error: returned as `se` without a zero-beta rate. With `zeroBeta` it is left out: the article gives Φ
  only for the model with the risk-free rate as zero-beta rate and sends the other case to online appendix I.2,
  which is not in the PDF.
- Options beyond the spec: `threePass` takes `rotation` (the rotation test, and a possible widget control) and
  `lags` (the paper's q). `twoPass` takes an optional `{ zeroBeta }`, default false, so it matches the three-pass
  setting; called as `twoPass(excess, observed)` it is the spec's estimate.
- Simulation: the true premium λ_1 = 0.5% is the same in every sample, so it is returned once as `truth` next to
  the per-sample arrays. The economy fixes premia (0.5%), factor volatility (4%) and idiosyncratic volatility (3%)
  as constants, and its two factors are independent in time, so the two-pass bias comes from the cross-sectional
  correlation of the loadings and from the noise, not from a time-series correlation of the factors (§II names
  both). The three-pass uses 2 PCs, the true number. Default `samples` is 20: one sample costs about 30 ms at
  N = 50, T = 300.
- Paper versus spec: none in the estimator. The paper's step 3 regresses the demeaned factor on the PCs without an
  intercept; `ols` with an intercept gives the same slopes because the PCs have mean zero.

Follow-ups for Chapter 34 (TASK-119): use $\chi_t = a + \beta_\chi'f_t + \varepsilon_{\chi,t}$ and
$\lambda_\chi = \beta_\chi'\lambda$ in place of the curriculum's $g_t = \xi + \eta v_t + z_t$ and
$\gamma_g = \eta\gamma_v$; the curriculum's Key math line is out of date on these letters.
