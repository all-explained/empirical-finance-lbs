# TASK-103 outcome: Library: random-factor fits, GLS R², traded-factor restrictions and R² confidence intervals

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX
  macro check.
  Evidence: `npm test` (see the Verify run in the PR description): 61 files, 637 tests, including
  `tests/notation.test.ts`. `skeptical.test.ts` has 13 tests and runs in about 6 s. Reference values per export:
  `glsR2`: $R^2_{\text{GLS}} = 1$ (to 1e-10) and $\hat\lambda_0 = 0$ when the factor is the in-sample tangency
  portfolio (`tangencyWeights`); for the equal-weighted portfolio, `unexplained` equals
  $SR^2_{\text{tan}}(\hat\lambda_0) - SR^2_f(\hat\lambda_0)$ from `maxSharpeSquared` (LNS Result 7) to 1e-12;
  `total` is the same for the CAPM and FF3 and equals $\mu'\Sigma^{-1}\mu - (\iota'\Sigma^{-1}\mu)^2/\iota'\Sigma^{-1}\iota$.
  `tradedFactorRestriction`: a three-asset hand case (betas 0.5, 1.5, 1; $\hat\lambda = 0.014$,
  $\hat\lambda_0 = -0.004/3$, gap 0.004, and both standard errors from $(1 + c)\,A\hat\Sigma_\varepsilon A'/T$ with
  $c = 0.25$), to 1e-14; on FF3 the slopes equal `crossSectionalRegression` with the factors among the test assets.
  `randomFactorFit`: with `noiseShare` 0 and two factors every draw has the OLS and GLS $R^2$ of the SMB–HML
  model (LNS Result 5), to 1e-10; with `noiseShare` 1 (30 draws) the median OLS $R^2$ is 0.074, next to 0.066 for
  `simulateUselessFactor` at strength 0; with `noiseShare` 0.01 and two factors (100 draws) the median OLS $R^2$
  is 0.624 against the CAPM's 0.078.
  `r2ConfidenceInterval`: the same seed gives the same output, another seed other draws; the OLS estimate is
  `crossSectionalRegression`'s `r2`; the GLS estimate is `glsR2`'s.
  Pinned on `ff25-size-bm-monthly` and `ff3-monthly` from 1963-07 (T = 758): OLS $R^2$ 0.0782 (CAPM) and
  0.6633 (FF3); GLS $R^2$ 0.0613 (CAPM) and 0.2043 (FF3); the 95% interval for the FF3 OLS $R^2$ (100 samples,
  seed 2010) is [0.367, 0.838] and contains 0.663.
- [x] `npm run build` passes (`astro check` reports 0 errors).
  Evidence: `Result (186 files): - 0 errors - 0 warnings - 1 hint` (the hint is in `news.ts`, not this task),
  `[build] Complete!`, exit 0.
- [x] `git status --short` shows only `src/lib/finance/skeptical.ts`, its test, `docs/STYLE_GUIDE.md` (if a symbol
  was added) and this task's outcome file.
  Evidence: `git diff --name-only origin/main...HEAD` lists exactly `docs/STYLE_GUIDE.md`,
  `goals/course-site/tasks/TASK-103.outcome.md`, `src/lib/finance/skeptical.test.ts` and
  `src/lib/finance/skeptical.ts`; `git status --short` is empty after the commits.

## Summary

**What.** `src/lib/finance/skeptical.ts` exports `randomFactorFit`, `glsR2`, `tradedFactorRestriction` and
`r2ConfidenceInterval`. It reuses `timeSeriesRegressions`, `crossSectionalRegression`, `famaMacBeth`,
`sampleMeans`, `sampleCovariance`, `maxSharpeSquared`, `inverse`, `quantile` (from `stats/stambaugh.ts`),
`mulberry32` and `normalRng`. `tangencyWeights`, `simulateUselessFactor` and `factorPanel` are references in the
tests. `crossSectionalRegression` is unchanged. Pages cite the printed page numbers of NBER working paper 12360
(July 2006), the copy in `source/papers/`.

**How.**
- `glsR2` follows LNS Result 8 (p. 33): the GLS regression of $\bar R^e$ on $[1\ \hat\beta]$ with weight
  $\hat\Sigma^{-1}$ (return covariance, divisor $T$), and
  $R^2_{\text{GLS}} = 1 - \hat\alpha'\hat\Sigma^{-1}\hat\alpha / (\bar R^e - \mu_{\text{gmv}}\iota)'\hat\Sigma^{-1}(\bar R^e - \mu_{\text{gmv}}\iota)$.
  The weighted $R^2$ is computed in `skeptical.ts`: `crossSectionalRegression`'s `r2` is the unweighted one.
  The doc comment states the Sharpe-ratio reading: the numerator is
  $SR^2_{\text{tan}}(\hat\lambda_0) - SR^2_f(\hat\lambda_0)$ and the denominator is the squared slope of the
  frontier's asymptote.
- `randomFactorFit`: each factor is $\sqrt{1-s}\,g_t + \sqrt{s}\,e_t$, where $g_t$ is a standardised mix
  $a\,\widetilde{\text{SMB}}_t + b\,\widetilde{\text{HML}}_t$ with a seeded normal pair $(a, b)$, and $s$ is
  `noiseShare`. `threshold` (default 1/2, the "more than half" count of LNS p. 8) sets the share above.
  With no noise only two factors are independent, so a third throws.
- `tradedFactorRestriction` puts the factors after the test assets and runs the OLS two-pass with an intercept.
  The standard errors of $\hat\lambda - \bar f$ and $\hat\lambda_0$ are the Fama–MacBeth ones of
  $\hat\lambda_t - f_t$ and $\hat\lambda_{0t}$, times $\sqrt{1 + c}$ with $c = \bar f'\hat\Sigma_f^{-1}\bar f$
  (Shanken). The doc comment derives why the factor shock cancels in $\hat\lambda_t - f_t$.
- `r2ConfidenceInterval` resamples months with replacement, returns and factors together, reruns both passes
  and takes the percentile interval. Default 100 samples, about 2 s on the 25 portfolios; the slow tests carry
  a 30 s timeout (issue #67).
- Notation: a new "Part VII" block in `docs/STYLE_GUIDE.md` §3 with $R^2_{\text{OLS}}$, $R^2_{\text{GLS}}$,
  $\mu_{\text{gmv}}$, $\iota$ and $SR^2(\lambda_0)$, each with the clash it avoids. No macro was needed.

**Deviations.**
- LNS Figure 1 (pp. 8–10) draws random loadings or random portfolios of the 25 size–B/M portfolios, not mixes
  of SMB and HML. The spec asks for SMB–HML–noise mixes, so the doc comment states the rule above and cites
  LNS p. 2 (any factor correlated with SMB or HML fits), Figure 1 and the noise share of Figure 2 (pp. 11–13).
- The spec's "Prescriptions 1–4" are the four suggestions of the introduction (pp. 2–3). In the body they are
  Prescriptions 1–6; the traded-factor restriction is Prescriptions 2 and 4 (pp. 17, 21) and the $R^2$ interval
  is Prescription 5 (pp. 21–22). The doc comments cite the body numbers.
- LNS get their $R^2$ interval by inverting simulated distributions over candidate true $R^2$ values (pp. 21–22,
  fn. 8 p. 27). The spec asks for a bootstrap of months that returns its draws, so the function gives the
  percentile interval of the sample $R^2$. Its doc comment says that this is the sampling spread around a biased
  estimate, not an interval for the true $R^2$.
- `tradedFactorRestriction` is OLS only. Its doc comment notes that GLS forces $\hat\lambda = \bar f - \hat\lambda_0$
  (LNS p. 21).

**Verified revision.** The branch head of PR #92 (see the PR description for the Verify output).

**Proposed follow-ups.**
- Chapter 28 (TASK-106) can run `randomFactorFit` with the 30 industry portfolios of TASK-102 appended to
  `excess` for Prescription 1; no code change is needed.
- If the chapter needs an interval for the true $R^2$, a later library task could add the LNS inversion.
- The full suite still times out in other files when the machine is loaded (issue #67); TASK-101 (PR #87)
  fixes it.
