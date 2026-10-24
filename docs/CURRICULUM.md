# Curriculum

The topic order follows the PhD course E164 "Financial Economics II: Empirical Finance" at London Business School.

There are 66 chapters in 17 parts. Part I builds the tools from zero: returns, regression, time series, portfolio
theory and the stochastic discount factor. Parts II–XVI follow the outline's Weeks 1–9, and Part XVII turns Week 10
into short chapters on current research. Each chapter builds on earlier ones. "Prereqs" lists the chapters a reader
should have read first.

Difficulty: ● intro (algebra and basic statistics) · ●● intermediate (regression, matrix algebra, time series) ·
●●● advanced (graduate level: GMM asymptotics, dynamic equilibrium models, high-dimensional estimation).

Each chapter entry lists:
- **Goals**: what the reader can do after reading it.
- **Key math**: the formulas that must appear.
- **Widgets**: the interactive figures planned for it. Reusable components are named in `CodeStyle`.
- **Data**: the datasets the chapter loads, by ID (see `docs/DATA.md`), or "simulated (seeded)" when the figure
  draws from a model with a fixed random seed.
- **Readings**: the papers and book chapters behind it, in short form.
- **Prereqs**: the chapters to read first.

`TimeSeriesChart` (a real series over time, with recession shading and a date brush) and the controls `Slider`,
`Toggle`, `Quiz`, `Callout` and `Details` appear in almost every chapter and are not repeated below.

---

## Part I — Foundations ●–●●

*Outline: none. The tools that Weeks 1–9 assume.*

### 1. Returns
- **Goals:** Compute simple, log and excess returns from prices and dividends. Compound returns over many
  periods. Explain why log returns add over time and simple returns add across assets, and why the average log
  return is below the average simple return.
- **Key math:** $R_{t+1} = (P_{t+1} + D_{t+1})/P_t - 1$; $r_{t+1} = \log(1 + R_{t+1})$; $R^e_{t+1} = R_{t+1} -
  R^f_t$; $1 + R_{t \to t+k} = \prod_{j=1}^{k} (1 + R_{t+j})$, $r_{t \to t+k} = \sum_{j=1}^{k} r_{t+j}$;
  $\mathbb{E}[r] \approx \mathbb{E}[R] - \tfrac12 \sigma^2(R)$.
- **Widgets:** `CompoundingPath`: one dollar invested in the market and in T-bills, on a linear or log scale, with
  a toggle between simple and log returns. `ReturnCalculator`: type two prices and a dividend and see each
  kind of return.
- **Data:** `ff3-monthly`, `shiller-monthly`.
- **Readings:** Campbell (2018), Ch. 1; Campbell, Lo & MacKinlay (1997), Ch. 1.
- **Prereqs:** none.

### 2. Expected return and risk
- **Goals:** Estimate a mean return and its standard error. Explain why the mean is hard to estimate and the
  variance is easy. Compute and annualise a Sharpe ratio. Spot fat tails and skewness in return histograms.
- **Key math:** $\bar R = \tfrac1T \sum_t R_t$; $\mathrm{se}(\bar R) = \sigma/\sqrt{T}$; $SR = \mathbb{E}[R^e]/
  \sigma(R^e)$; annualising: $\mu_{\text{ann}} = 12\mu$, $\sigma_{\text{ann}} = \sqrt{12}\,\sigma$, $SR_{\text{ann}}
  = \sqrt{12}\,SR$; skewness and excess kurtosis.
- **Widgets:** `SamplingErrorMean`: draw many seeded samples of $T$ months and watch the spread of $\bar R$
  shrink like $1/\sqrt{T}$, next to the real market's estimate. `DistributionExplorer`: a histogram of returns
  with a fitted normal and a tail zoom.
- **Data:** `ff3-monthly`, simulated (seeded).
- **Readings:** Campbell (2018), Ch. 2; Campbell, Lo & MacKinlay (1997), Ch. 1.
- **Prereqs:** 1.

### 3. Regression and standard errors
- **Goals:** Run an OLS regression, read its coefficients, $t$-statistics and $R^2$. Explain when classical
  standard errors are wrong and how White standard errors fix heteroskedasticity.
- **Key math:** $\hat\beta = (X'X)^{-1}X'y$; classical $\widehat{\mathrm{Var}}(\hat\beta) = \hat\sigma^2 (X'X)^{-1}$;
  White $\widehat{\mathrm{Var}}(\hat\beta) = (X'X)^{-1}\big(\sum_t \hat u_t^2 x_t x_t'\big)(X'X)^{-1}$; $t =
  \hat\beta/\mathrm{se}(\hat\beta)$; $R^2 = 1 - \sum \hat u_t^2 / \sum (y_t - \bar y)^2$.
- **Widgets:** `RegressionLab`: a scatter plot with draggable points, the OLS line, residuals, and a toggle
  between classical and White standard errors. Preset: a stock's excess return on the market (its beta).
- **Data:** `ff3-monthly`, simulated (seeded).
- **Readings:** Campbell, Lo & MacKinlay (1997), Appendix A; Cochrane (2005), Ch. 11.
- **Prereqs:** 2.

### 4. Autocorrelation and Newey–West
- **Goals:** Explain why overlapping long-horizon returns make errors autocorrelated and $t$-statistics too
  large. Compute Newey–West (HAC) standard errors and choose the lag length.
- **Key math:** $\hat S = \hat\Gamma_0 + \sum_{j=1}^{L} \big(1 - \tfrac{j}{L+1}\big)(\hat\Gamma_j + \hat\Gamma_j')$,
  $\hat\Gamma_j = \tfrac1T \sum_t \hat u_t \hat u_{t-j} x_t x_{t-j}'$; $\widehat{\mathrm{Var}}(\hat\beta) = (X'X)^{-1}
  T \hat S (X'X)^{-1}$; with $k$-period overlapping returns the errors follow an MA($k-1$).
- **Widgets:** `HACLagExplorer`: residual autocorrelation bars, the Bartlett weights, and the standard error as
  the reader drags the lag length $L$. `OverlapDemo`: monthly windows of a 12-month return, sharing 11 months.
- **Data:** `shiller-monthly`, simulated (seeded).
- **Readings:** Cochrane (2005), Ch. 11; Campbell, Lo & MacKinlay (1997), Appendix A.
- **Prereqs:** 3.

### 5. Persistence: AR(1) and VAR
- **Goals:** Simulate and estimate an AR(1). Read persistence as a half-life. Forecast many steps ahead. Stack
  several variables in a VAR(1) and forecast them together.
- **Key math:** $x_{t+1} = \mu + \phi x_t + \varepsilon_{t+1}$; $\mathrm{Var}(x) = \sigma_\varepsilon^2/(1-\phi^2)$;
  $\mathbb{E}_t[x_{t+k}] - \bar x = \phi^k (x_t - \bar x)$; half-life $= \log(1/2)/\log\phi$; VAR(1)
  $z_{t+1} = A z_t + \varepsilon_{t+1}$, $\mathbb{E}_t[z_{t+k}] = A^k z_t$.
- **Widgets:** `AR1Simulator`: a seeded path with sliders for $\phi$ and $\sigma$, the autocorrelation function,
  and the half-life. Preset: the log dividend–price ratio with $\hat\phi$ near one.
- **Data:** `shiller-monthly`, simulated (seeded).
- **Readings:** Campbell, Lo & MacKinlay (1997), Ch. 7; Cochrane (2005), Ch. 20.
- **Prereqs:** 3.

### 6. Principal components
- **Goals:** Find the few directions that explain most of the co-movement in many return or yield series. Read
  loadings and the share of variance explained. Know that components are only defined up to sign and rotation.
- **Key math:** $\Sigma = Q \Lambda Q'$; component $k$ is $q_k' x_t$ with variance $\lambda_k$; share explained
  $\lambda_k / \sum_j \lambda_j$; the first $K$ components minimise $\sum_t \lVert x_t - \hat x_t \rVert^2$.
- **Widgets:** `PCAExplorer`: a cloud of points in two or three dimensions with its principal axes, a scree plot,
  and a loadings chart. Presets: the 25 size–value portfolios and the yield curve.
- **Data:** `ff25-size-bm-monthly`, `gsw-zero-coupon`.
- **Readings:** Campbell, Lo & MacKinlay (1997), Ch. 6.
- **Prereqs:** 2.

### 7. Mean–variance and the CAPM
- **Goals:** Build the efficient frontier and the tangency portfolio. Explain why, in the CAPM, only beta with the
  market earns a premium. Estimate betas and draw the security market line.
- **Key math:** $\min_w w'\Sigma w$ s.t. $w'\mu = \bar\mu$, $w'\mathbf 1 = 1$; tangency $w^* \propto
  \Sigma^{-1}\mu^e$; $SR^2_{\max} = \mu^{e\prime}\Sigma^{-1}\mu^e$; $\mathbb{E}[R^e_i] = \beta_i\,\mathbb{E}[R^e_m]$,
  $\beta_i = \mathrm{Cov}(R_i, R_m)/\mathrm{Var}(R_m)$.
- **Widgets:** `FrontierBuilder`: pick assets, see the frontier, the tangency portfolio and the capital market
  line; drag expected returns and watch the weights swing. `SMLPlot`: average return against beta, with the
  CAPM line.
- **Data:** `ff25-size-bm-monthly`, `ff3-monthly`.
- **Readings:** Campbell (2018), Ch. 2–3; Cochrane (2005), Ch. 5–6.
- **Prereqs:** 2, 3.

### 8. The Euler equation and the stochastic discount factor
- **Goals:** Derive the consumption Euler equation from a saver's choice. Write every price as $p = \mathbb{E}[mx]$.
  Read risk premia as covariance with the SDF. Derive the Hansen–Jagannathan bound and the beta form.
- **Key math:** $u'(C_t) P_t = \mathbb{E}_t[\beta u'(C_{t+1}) X_{t+1}]$; $M_{t+1} = \beta (C_{t+1}/C_t)^{-\gamma}$;
  $1 = \mathbb{E}_t[M_{t+1}R_{t+1}]$; $R^f = 1/\mathbb{E}[M]$; $\mathbb{E}[R^e] = -R^f\,\mathrm{Cov}(M, R^e)$;
  $\sigma(M)/\mathbb{E}[M] \ge |\mathbb{E}[R^e]|/\sigma(R^e)$; $\mathbb{E}[R^e_i] = \beta_{i,M}\lambda_M$.
- **Widgets:** `SDFExplorer`: two states of the world, a draggable SDF and payoff, and the price that results.
  `HJBound`: the Hansen–Jagannathan region in $(\mathbb{E}M, \sigma M)$ space, with the market's Sharpe ratio.
- **Data:** `ff3-monthly`, simulated (seeded).
- **Readings:** Cochrane (2005), Ch. 1–2; Campbell (2018), Ch. 4.
- **Prereqs:** 1, 7.

---

## Part II — Return predictability: the evidence ●●

*Outline: Week 1.*

### 9. Time-varying expected returns
- **Goals:** Regress future returns on the dividend–price ratio at horizons from one month to ten years. Explain
  why slopes and $R^2$ grow with the horizon. Read the evidence as expected returns that change over time.
- **Key math:** $R^e_{t \to t+k} = a_k + b_k\,dp_t + \varepsilon_{t+k}$; with an AR(1) predictor, $b_k \approx b_1
  (1 - \phi^k)/(1 - \phi)$; Newey–West or Hansen–Hodrick standard errors for overlapping horizons.
- **Widgets:** `PredictiveRegression`: a scatter of $dp_t$ against the next $k$-period return, with a horizon
  slider, the slope, $t$-statistic and $R^2$. `HorizonCurve`: slope and $R^2$ against horizon.
- **Data:** `shiller-monthly`, `goyal-welch-annual`.
- **Readings:** Cochrane (2011); Campbell (2018), Ch. 5.
- **Prereqs:** 4, 5.

### 10. The Campbell–Shiller decomposition
- **Goals:** Log-linearise the return identity. Show that a high price–dividend ratio must forecast high dividend
  growth, low returns, or an explosive bubble. Measure each share of the variance.
- **Key math:** $r_{t+1} \approx \kappa + \rho\,pd_{t+1} + \Delta d_{t+1} - pd_t$, $\rho = e^{\overline{pd}}/(1 +
  e^{\overline{pd}})$; $pd_t = \tfrac{\kappa}{1-\rho} + \sum_{j \ge 1} \rho^{j-1}(\Delta d_{t+j} - r_{t+j})$;
  $1 \approx b_r^{\text{lr}} - b_d^{\text{lr}}$ with $b^{\text{lr}} = b/(1 - \rho\phi)$.
- **Widgets:** `LogLinearCheck`: the exact and approximate return side by side, with the error. `VarianceShares`:
  a bar that splits $\mathrm{Var}(dp)$ into return news, dividend news and the bubble term.
- **Data:** `shiller-monthly`, `goyal-welch-annual`.
- **Readings:** Campbell & Shiller (1988); Campbell (2018), Ch. 5; Cochrane (2011).
- **Prereqs:** 5, 9.

### 11. Cash-flow and discount-rate news
- **Goals:** Split each unexpected return into news about future dividends and news about future returns, with a
  VAR. Explain Cochrane's "dog that did not bark": if returns were not predictable, dividends would have to be.
- **Key math:** $r_{t+1} - \mathbb{E}_t r_{t+1} = N_{CF,t+1} - N_{DR,t+1}$; $N_{DR,t+1} = e_1'\rho A(I - \rho A)^{-1}
  \varepsilon_{t+1}$; the identity $b_r = 1 - \rho\phi + b_d$ that ties the return slope, the dividend slope and
  the persistence of $dp$.
- **Widgets:** `NewsDecomposition`: annual returns as stacked bars of cash-flow and discount-rate news.
  `DogThatDidNotBark`: the joint distribution of $(\hat b_r, \hat b_d)$ under the null of no return
  predictability, with the actual estimate marked.
- **Data:** `goyal-welch-annual`, simulated (seeded).
- **Readings:** Cochrane (2008); Campbell & Shiller (1988); Campbell (2018), Ch. 5.
- **Prereqs:** 10.

### 12. Stambaugh bias
- **Goals:** Show why a persistent predictor whose shocks move with returns biases the predictive slope upward in
  small samples. Correct the bias and get the right test size by simulation.
- **Key math:** $r_{t+1} = a + b x_t + u_{t+1}$, $x_{t+1} = \mu + \phi x_t + v_{t+1}$; $\mathbb{E}[\hat b - b] =
  (\sigma_{uv}/\sigma_v^2)\,\mathbb{E}[\hat\phi - \phi]$; $\mathbb{E}[\hat\phi - \phi] \approx -(1 + 3\phi)/T$.
- **Widgets:** `StambaughBias`: many seeded samples under $b = 0$, the histogram of $\hat b$ and its $t$-statistic,
  with sliders for $\phi$, $\mathrm{corr}(u, v)$ and $T$.
- **Data:** simulated (seeded), `goyal-welch-annual`.
- **Readings:** Cochrane (2008); Campbell (2018), Ch. 5.
- **Prereqs:** 5, 9.

---

## Part III — Return predictability: out of sample and beyond ●●–●●●

*Outline: Week 1.*

### 13. Out-of-sample predictability
- **Goals:** Run predictive regressions in real time with expanding windows. Compute the out-of-sample $R^2$ and
  test it. Explain why most predictors lose to the historical mean, and what sign and slope restrictions do.
- **Key math:** $R^2_{OS} = 1 - \sum_t (r_{t+1} - \hat r_{t+1})^2 / \sum_t (r_{t+1} - \bar r_t)^2$; the cumulative
  difference in squared errors; the Clark–West statistic; the certainty-equivalent gain of a mean–variance investor.
- **Widgets:** `OOSRace`: cumulative squared-error difference against the historical mean, one line per predictor,
  with toggles for the start date and for slope restrictions.
- **Data:** `goyal-welch-monthly`, `goyal-welch-annual`.
- **Readings:** Goyal & Welch (2008); Cochrane (2008); Campbell (2018), Ch. 5.
- **Prereqs:** 9, 12.

### 14. The consumption–wealth ratio
- **Goals:** Derive $cay$ from the household budget constraint. Estimate it as a cointegrating residual. Explain
  why it predicts returns at business-cycle horizons, and the look-ahead problem of a full-sample estimate.
- **Key math:** $c_t - \omega a_t - (1-\omega) y_t \approx \mathbb{E}_t \sum_{j \ge 1} \rho_w^j (r_{w,t+j} - \Delta
  c_{t+j})$; dynamic OLS for the cointegrating vector; $R^e_{t \to t+k} = a + b\,cay_t + \varepsilon$.
- **Widgets:** `PredictiveRegression` preset with $cay$; `CointegrationDemo`: two trending series and their
  stationary combination, with a slider for the weight.
- **Data:** `goyal-welch-annual`, `fred-consumption-quarterly`.
- **Readings:** Lettau & Ludvigson (2001, JF); Campbell (2018), Ch. 5.
- **Prereqs:** 5, 9.

### 15. Expected returns from option prices
- **Goals:** Get a lower bound on the expected market return from option prices alone, without a regression.
  Compare variance-based and entropy-based bounds. Explain why the bound spikes in crises.
- **Key math:** $\mathbb{E}_t[R_{T}] - R^f \ge \tfrac{1}{R^f}\mathrm{var}^*_t(R_T)$; $\mathrm{SVIX}^2_t =
  \tfrac{2}{R^f S_t^2}\big[\int_0^{F_t} \mathrm{put}(K)\,dK + \int_{F_t}^{\infty} \mathrm{call}(K)\,dK\big]$; entropy
  $L(X) = \log\mathbb{E}[X] - \mathbb{E}[\log X]$ under the physical and risk-neutral measures.
- **Widgets:** `OptionStripBound`: a seeded smile, the strip of out-of-the-money options and the bound it implies,
  with a slider for the level of volatility.
- **Data:** simulated (seeded).
- **Readings:** Martin (2017); Campbell (2018), Ch. 5.
- **Prereqs:** 8, 13.

---

## Part IV — Cross-sectional tests ●●

*Outline: Week 2.*

### 16. Time-series tests and the GRS statistic
- **Goals:** Test a factor model asset by asset with time-series regressions. Test all alphas jointly with the
  GRS statistic. Read GRS as the Sharpe ratio gained by adding the test assets to the factors.
- **Key math:** $R^e_{it} = \alpha_i + \beta_i' f_t + \varepsilon_{it}$; $GRS = \tfrac{T-N-K}{N}\big(1 + \bar f'
  \hat\Omega^{-1}\bar f\big)^{-1}\hat\alpha'\hat\Sigma^{-1}\hat\alpha \sim F_{N,\,T-N-K}$; $\alpha'\Sigma^{-1}\alpha =
  SR^2_{\text{all}} - SR^2_{f}$.
- **Widgets:** `AlphaBars`: the alpha of each test portfolio with confidence bars, for CAPM and FF3. `GRSGeometry`:
  two frontiers (factors only, factors plus test assets) and the gap GRS measures.
- **Data:** `ff25-size-bm-monthly`, `ff3-monthly`.
- **Readings:** Gibbons, Ross & Shanken (1989); Cochrane (2005), Ch. 12.
- **Prereqs:** 3, 7.

### 17. Cross-sectional regressions and Fama–MacBeth
- **Goals:** Estimate betas in a first pass, then price them in a second, cross-sectional pass. Run Fama–MacBeth
  regressions each month and average the slopes. Explain what the cross-sectional $R^2$ does and does not show.
- **Key math:** $\hat\lambda = (\hat\beta'\hat\beta)^{-1}\hat\beta'\bar R^e$; monthly slopes $\hat\lambda_t$ from
  $R^e_{it} = \lambda_{0t} + \hat\beta_i'\lambda_t + \alpha_{it}$; $\hat\lambda = \tfrac1T\sum_t\hat\lambda_t$,
  $\mathrm{se}(\hat\lambda) = \sigma(\hat\lambda_t)/\sqrt{T}$; GLS weighting by $\Sigma^{-1}$.
- **Widgets:** `FamaMacBethMovie`: the monthly cross-sectional fit, frame by frame, with the running average of
  $\hat\lambda_t$. `SMLPlot` with fitted against actual mean returns.
- **Data:** `ff25-size-bm-monthly`, `ff3-monthly`.
- **Readings:** Cochrane (2005), Ch. 12; Cochrane (2011); Fama & French (1992).
- **Prereqs:** 16.

### 18. Errors in variables and the Shanken correction
- **Goals:** Explain why estimated betas make second-pass standard errors too small. Apply the Shanken correction
  and see when it matters.
- **Key math:** $\mathrm{Var}(\hat\lambda) = \tfrac1T\big[(\beta'\beta)^{-1}\beta'\Sigma\beta(\beta'\beta)^{-1}
  (1 + \lambda'\Sigma_f^{-1}\lambda) + \Sigma_f\big]$; the factor $c = \lambda'\Sigma_f^{-1}\lambda$ is a squared
  Sharpe ratio, large for consumption factors.
- **Widgets:** `ShankenCorrection`: seeded first-pass betas scattered around the truth, the naive and corrected
  confidence intervals for $\lambda$, with a slider for the factor's Sharpe ratio.
- **Data:** `ff25-size-bm-monthly`, `ff3-monthly`, simulated (seeded).
- **Readings:** Cochrane (2005), Ch. 12.
- **Prereqs:** 17.

---

## Part V — Factors, anomalies and conditional models ●●

*Outline: Week 2.*

### 19. Size and value
- **Goals:** Show that small stocks and high book-to-market stocks earned more than the CAPM allows. Build the
  SMB and HML factors from double sorts. Compare the three- and five-factor models.
- **Key math:** $R^e_{it} = \alpha_i + b_i\,MKT_t + s_i\,SMB_t + h_i\,HML_t + \varepsilon_{it}$; the 2×3 sort
  behind each factor; the five-factor model adds $RMW$ and $CMA$.
- **Widgets:** `SortGrid`: a 5×5 grid of size and book-to-market portfolios coloured by mean return or alpha, with a
  model toggle (CAPM, FF3, FF5). `FactorBuilder`: how a 2×3 sort becomes a long–short factor.
- **Data:** `ff25-size-bm-monthly`, `ff3-monthly`, `ff5-monthly`.
- **Readings:** Fama & French (1992); Cochrane (2011).
- **Prereqs:** 16, 17.

### 20. Momentum
- **Goals:** Build the momentum factor from past 12-month returns. Show that it survives the three-factor model.
  Explain momentum crashes after market rebounds.
- **Key math:** the formation signal $r_{t-12 \to t-2}$; $WML_t = R_{\text{winners},t} - R_{\text{losers},t}$; a
  regression of $WML$ on the market with a separate beta in bear markets.
- **Widgets:** `CompoundingPath` preset with momentum; `CrashZoom`: momentum's worst months and the market path
  before each one.
- **Data:** `mom-monthly`, `ff3-monthly`.
- **Readings:** Cochrane (2011); Fama & French (1992).
- **Prereqs:** 19.

### 21. Anomalies and the factor zoo
- **Goals:** Define an anomaly. Survey the hundreds of published return predictors. Show how many shrink when
  microcaps are dropped or portfolios are value-weighted. Ask which few factors span the rest.
- **Key math:** a spanning regression $f_{\text{new},t} = \alpha + \beta' f_t + \varepsilon_t$; a new factor adds
  to the model only if $\alpha \ne 0$; $t$-statistics of alphas across many factors.
- **Widgets:** `ZooChart`: published factors by year, with their $t$-statistics and a draggable significance
  line. `SpanningTest`: is factor X spanned by the others?
- **Data:** `ff5-monthly`, `mom-monthly`.
- **Readings:** Cochrane (2011); Hou, Xue & Zhang (2018); Harvey, Liu & Zhu (2016).
- **Prereqs:** 19, 20.

### 22. Conditional factor models
- **Goals:** Separate conditional from unconditional models. Show that a conditional CAPM can hold while the
  unconditional one fails. Turn a conditional model into an unconditional one with scaled factors and managed
  portfolios.
- **Key math:** $\mathbb{E}_t[R^e_{i,t+1}] = \beta_{it}\lambda_t$; $\mathbb{E}[R^e_i] = \mathbb{E}[\beta_{it}]
  \mathbb{E}[\lambda_t] + \mathrm{Cov}(\beta_{it}, \lambda_t)$; $m_{t+1} = (a_0 + a_1 z_t) + (b_0 + b_1 z_t) f_{t+1}$;
  managed portfolios $R^e_{t+1} \otimes (1, z_t)$.
- **Widgets:** `ConditionalBeta`: an asset whose beta rises in bad times, its conditional and unconditional alphas,
  and the covariance term. `ScaledFactors`: the fit of the scaled CCAPM against FF3 on the 25 portfolios.
- **Data:** `ff25-size-bm-monthly`, `ff3-monthly`, `goyal-welch-annual`, `fred-consumption-quarterly`.
- **Readings:** Cochrane (2005), Ch. 8; Jagannathan & Wang (1996); Lettau & Ludvigson (2001, JPE).
- **Prereqs:** 8, 14, 17.

### 23. Does the conditional CAPM explain anomalies?
- **Goals:** Estimate conditional betas from short windows. Bound how much beta–premium covariance can explain.
  Conclude that the conditional CAPM leaves most of value and momentum unexplained.
- **Key math:** $\alpha^u_i \approx \mathrm{Cov}(\beta_{it}, \lambda_t) \le \sigma(\beta_{it})\,\sigma(\lambda_t)$;
  rolling and within-quarter regressions $R^e_{it} = \alpha_{iq} + \beta_{iq} R^e_{mt} + \varepsilon_{it}$.
- **Widgets:** `RollingBeta`: a rolling beta with a window slider. `AlphaBound`: the largest alpha that beta
  timing can create, against the actual alpha.
- **Data:** `ff25-size-bm-monthly`, `ff3-monthly`, `mom-monthly`.
- **Readings:** Lewellen & Nagel (2006).
- **Prereqs:** 22.

---

## Part VI — GMM and tests of asset pricing models ●●●

*Outline: Week 3.*

### 24. The generalized method of moments
- **Goals:** Write an estimator as a set of moment conditions. Derive GMM's consistency and asymptotic normality.
  See OLS, IV and maximum likelihood as special cases.
- **Key math:** $g_T(\theta) = \tfrac1T \sum_t f(x_t, \theta)$, $\mathbb{E}[f(x_t, \theta_0)] = 0$; $\hat\theta =
  \arg\min_\theta g_T' W g_T$; $\sqrt{T}(\hat\theta - \theta_0) \to N\big(0, (d'Wd)^{-1} d'WSWd\,(d'Wd)^{-1}\big)$,
  $d = \partial g/\partial\theta'$, $S = \sum_j \mathbb{E}[f_t f_{t-j}']$.
- **Widgets:** `GMMObjective`: the objective surface over two parameters for a toy model, with a weighting-matrix
  toggle and the minimum marked.
- **Data:** simulated (seeded).
- **Readings:** Cochrane (2005), Ch. 10–11; Nagel (2013).
- **Prereqs:** 3, 4.

### 25. Efficient and feasible GMM
- **Goals:** Choose the weighting matrix that minimises the variance. Run two-step, iterated and
  continuously-updated GMM. Test over-identifying restrictions with $J$. Know when a fixed first-stage weighting
  is the better choice.
- **Key math:** $W = S^{-1}$ gives $\mathrm{Var}(\hat\theta) = \tfrac1T (d'S^{-1}d)^{-1}$; $J = T\,g_T(\hat\theta)'
  \hat S^{-1} g_T(\hat\theta) \sim \chi^2_{r-k}$; the CUE objective $g_T(\theta)'\hat S(\theta)^{-1}g_T(\theta)$.
- **Widgets:** `GMMObjective` with a two-step / iterated / CUE toggle; `JTestSim`: the size of the $J$ test in
  seeded samples as $T$ shrinks.
- **Data:** simulated (seeded).
- **Readings:** Cochrane (2005), Ch. 11; Nagel (2013).
- **Prereqs:** 24.

### 26. GMM for asset pricing models
- **Goals:** Estimate linear SDF models by GMM. Show that first-stage GMM is a cross-sectional regression. Compare
  the beta and SDF forms. Rank models with the Hansen–Jagannathan distance.
- **Key math:** $m_{t+1} = 1 - b'(f_{t+1} - \mathbb{E}f)$; $\mathbb{E}[m R^e] = 0$; $g_T(b) = \mathbb{E}_T[R^e] -
  \mathbb{E}_T[R^e \tilde f']\,b$; $\lambda = \Sigma_f b$; $\delta_{HJ} = \sqrt{g_T'\,\mathbb{E}_T[RR']^{-1}g_T}$.
- **Widgets:** `RegressionLab` preset: first-stage GMM as a cross-sectional fit. `HJDistance`: pricing errors of
  CAPM, CCAPM and FF3 on the 25 portfolios, with their HJ distances.
- **Data:** `ff25-size-bm-monthly`, `ff3-monthly`, `fred-consumption-quarterly`.
- **Readings:** Cochrane (2005), Ch. 13; Nagel (2013).
- **Prereqs:** 8, 17, 25.

### 27. Identification: weak and useless factors
- **Goals:** Explain why a factor uncorrelated with returns can look priced, with a high cross-sectional $R^2$.
  Test the rank condition. Build confidence sets that stay valid when identification is weak.
- **Key math:** identification needs $\mathrm{rank}(\mathbb{E}[R^e f']) = K$; with $\beta \to 0$, $\hat\lambda$ does
  not converge and $R^2$ does not go to zero; the factor Anderson–Rubin statistic and its inversion into a
  confidence set.
- **Widgets:** `UselessFactor`: seeded useless factors and the distribution of their $t$-statistics and $R^2$ in
  the second pass. `ConfidenceSet`: Wald and robust sets for $\lambda$ as the beta spread shrinks.
- **Data:** simulated (seeded), `ff25-size-bm-monthly`, `fred-consumption-quarterly`.
- **Readings:** Gospodinov, Kan & Robotti (2019); Kleibergen & Zhan (2019); Nagel (2013).
- **Prereqs:** 18, 26.

---

## Part VII — The factor zoo and shrinkage ●●●

*Outline: Week 4.*

### 28. A skeptical look at asset pricing tests
- **Goals:** Show that the 25 size–value portfolios have a strong factor structure, so almost any factor correlated
  with SMB and HML fits them. Apply four fixes: more test assets, priced traded factors, GLS $R^2$, and confidence
  intervals for $R^2$.
- **Key math:** $R^2 = 1 - \sum_i \hat\alpha_i^2 / \sum_i (\bar R^e_i - \bar{\bar R}^e)^2$; GLS $R^2$ with
  $\Sigma^{-1}$ weights; for a traded factor, the restriction $\lambda = \mathbb{E}[f]$.
- **Widgets:** `RandomFactorFit`: seeded factors that mix SMB, HML and noise, and the $R^2$ each one gets.
  `PCAExplorer` preset on the 25 portfolios.
- **Data:** `ff25-size-bm-monthly`, `ff3-monthly`, simulated (seeded).
- **Readings:** Lewellen, Nagel & Shanken (2010).
- **Prereqs:** 6, 17.

### 29. Multiple testing
- **Goals:** Explain why $t > 2$ is too low a bar after hundreds of tries. Control the family-wise error rate and
  the false discovery rate. Read the case for a cut-off near $t = 3$.
- **Key math:** Bonferroni $p_i \le \alpha/M$; Holm's step-down rule; Benjamini–Hochberg–Yekutieli; the expected
  number of false discoveries $M_0\,\alpha$.
- **Widgets:** `MultipleTesting`: $M$ seeded strategies, some with true alpha, a draggable threshold, and counts of
  true and false discoveries.
- **Data:** simulated (seeded).
- **Readings:** Harvey, Liu & Zhu (2016); Hou, Xue & Zhang (2018).
- **Prereqs:** 21.

### 30. Shrinking the cross-section
- **Goals:** Estimate SDF coefficients for many factors at once. Show that a natural prior turns the estimate into a
  ridge regression. Add sparsity with the elastic net. See that a few principal components carry most of the SDF.
- **Key math:** $m_t = 1 - b'(F_t - \mathbb{E}F)$, $b = \Sigma^{-1}\mu$; with prior $\mu \sim N(0, \tfrac{\kappa^2}{\tau}
  \Sigma^{2})$, $\hat b = (\Sigma + \gamma I)^{-1}\bar\mu$; the elastic net penalty $\gamma_1\lVert b\rVert_1 +
  \gamma_2\lVert b\rVert_2^2$; cross-validated $R^2_{OS}$.
- **Widgets:** `ShrinkagePath`: SDF coefficients against the penalty, with the out-of-sample $R^2$ curve.
  `FrontierBuilder` preset: in-sample and out-of-sample Sharpe ratios of the shrunk tangency portfolio.
- **Data:** `ff25-size-bm-monthly`, `ff5-monthly`, `mom-monthly`.
- **Readings:** Kozak, Nagel & Santosh (2018).
- **Prereqs:** 6, 7, 26, 28.

---

## Part VIII — Latent factors and large cross-sections ●●●

*Outline: Week 4.*

### 31. Latent and observable factors
- **Goals:** Compare factors chosen by theory with factors extracted by PCA. State the APT. Explain why latent
  factors are only defined up to rotation and how to compare models anyway.
- **Key math:** $R^e_t = \beta f_t + \varepsilon_t$; $\mathbb{E}[R^e] = \beta\lambda$; $(\beta, f) \to (\beta H^{-1},
  H f)$ leaves the fit unchanged; the canonical correlations between PCs and observed factors.
- **Widgets:** `PCAExplorer` preset: the first three PCs of the 25 portfolios against MKT, SMB and HML, with
  canonical correlations.
- **Data:** `ff25-size-bm-monthly`, `ff3-monthly`.
- **Readings:** Kelly, Pruitt & Su (2018); Giglio & Xiu (2021); Nagel (2013).
- **Prereqs:** 6, 17.

### 32. Characteristics are covariances: IPCA
- **Goals:** Let betas depend on firm characteristics. Estimate the model by alternating least squares. Test
  whether characteristics predict returns beyond their effect on betas.
- **Key math:** $r_{i,t+1} = \alpha_{it} + \beta_{it}' f_{t+1} + \varepsilon_{i,t+1}$, $\beta_{it} = z_{it}'\Gamma_\beta$,
  $\alpha_{it} = z_{it}'\Gamma_\alpha$; managed portfolios $x_{t+1} = Z_t' r_{t+1}$; the test of $\Gamma_\alpha = 0$.
- **Widgets:** `IPCAFit`: a seeded panel, the ALS iterations converging, and the loadings $\Gamma_\beta$ as a heat
  map.
- **Data:** simulated (seeded).
- **Readings:** Kelly, Pruitt & Su (2018).
- **Prereqs:** 17, 31.

### 33. Characteristic-based mimicking portfolios
- **Goals:** Turn a characteristic into a tradable portfolio by sorting or by cross-sectional regression. Build a
  factor-mimicking portfolio for a non-traded factor such as consumption growth.
- **Key math:** Fama–MacBeth slopes as portfolios: $\hat\gamma_t = (Z_t'Z_t)^{-1}Z_t' r_{t+1}$, whose weights are
  the rows of $(Z_t'Z_t)^{-1}Z_t'$; projection $f_t = c + w' R^e_t + e_t$ and the mimicking return $w'R^e_t$.
- **Widgets:** `SortGrid` preset: sorts against regression weights. `MimickingPortfolio`: a non-traded factor,
  its projection on the 25 portfolios, and the correlation achieved.
- **Data:** `ff25-size-bm-monthly`, `fred-consumption-quarterly`.
- **Readings:** Fama & French (1992); Kelly, Pruitt & Su (2018).
- **Prereqs:** 17, 19.

### 34. Risk premia with omitted factors
- **Goals:** Estimate the risk premium of an observed factor when the model omits other factors. Run the
  three-pass estimator: PCA, then cross-sectional regression, then projection of the factor on the latent ones.
- **Key math:** $R^e_t = \beta v_t + u_t$; $g_t = \xi + \eta v_t + z_t$; $\gamma_g = \eta\gamma_v$; rotation
  invariance of $\hat\gamma_g$; omitted-variable bias of the two-pass estimate.
- **Widgets:** `OmittedFactorBias`: a seeded economy with one omitted factor, the two-pass and three-pass
  estimates, and a slider for the omitted factor's strength.
- **Data:** `ff25-size-bm-monthly`, `ff3-monthly`, simulated (seeded).
- **Readings:** Giglio & Xiu (2021).
- **Prereqs:** 17, 31.

---

## Part IX — Consumption: data and the equity premium puzzle ●●

*Outline: Week 5.*

### 35. The equity premium and risk-free rate puzzles
- **Goals:** Put numbers on the consumption CAPM. Show that it needs an absurd risk aversion to match the equity
  premium, and then gives a risk-free rate that is too high.
- **Key math:** lognormal pricing $\mathbb{E}[r_{i} - r_f] + \tfrac12\sigma_i^2 = \gamma\,\sigma_{ic}$; $r_f =
  \delta + \gamma g - \tfrac12\gamma^2\sigma_c^2$; the HJ bound $\sigma(M)/\mathbb{E}[M] \approx \gamma\sigma_c$.
- **Widgets:** `HJBound` preset with power utility: the curve traced as $\gamma$ rises. `PuzzleCalculator`: inputs
  from the data and the $\gamma$ and $r_f$ they imply.
- **Data:** `fred-consumption-quarterly`, `ff3-monthly`, `shiller-monthly`.
- **Readings:** Campbell (2018), Ch. 6; Cochrane (2005), Ch. 21.
- **Prereqs:** 8.

### 36. Measuring consumption
- **Goals:** Explain what NIPA nondurables and services measure and what they miss. Show how time averaging and
  statistical filtering smooth measured consumption. Recover an unfiltered series and see risk aversion fall.
- **Key math:** time averaging of a random walk gives first-order autocorrelation $\approx 0.25$; a filtered
  series $\Delta c^{\text{NIPA}}_t = (1-\phi)\Delta c_t + \phi\,\Delta c^{\text{NIPA}}_{t-1}$ inverts to $\Delta c_t =
  (\Delta c^{\text{NIPA}}_t - \phi\,\Delta c^{\text{NIPA}}_{t-1})/(1-\phi)$.
- **Widgets:** `TimeAveraging`: a seeded daily path, its quarterly average, and the autocorrelation that appears.
  `UnfilterConsumption`: measured and unfiltered consumption growth with a slider for $\phi$, and the implied
  $\gamma$.
- **Data:** `fred-consumption-quarterly`, simulated (seeded).
- **Readings:** Kroencke (2017); Campbell (2018), Ch. 6.
- **Prereqs:** 5, 35.

---

## Part X — Habits, long-run risk and disasters ●●●

*Outline: Week 5.*

### 37. Internal and external habits
- **Goals:** Compare habits formed from one's own past consumption with habits set by others. Build the
  Campbell–Cochrane model. Show how a low surplus ratio raises risk aversion and makes returns predictable.
- **Key math:** $U = \mathbb{E}\sum_t \delta^t (C_t - X_t)^{1-\gamma}/(1-\gamma)$; $S_t = (C_t - X_t)/C_t$; $s_{t+1} =
  (1-\phi)\bar s + \phi s_t + \lambda(s_t)(\Delta c_{t+1} - g)$; $M_{t+1} = \delta\big(\tfrac{S_{t+1}C_{t+1}}{S_tC_t}
  \big)^{-\gamma}$; local curvature $\gamma/S_t$.
- **Widgets:** `HabitSimulator`: seeded consumption, the surplus ratio, and the price–dividend ratio it implies,
  with sliders for $\gamma$ and $\phi$. `PredictiveRegression` preset on model data.
- **Data:** simulated (seeded), `shiller-monthly`.
- **Readings:** Campbell & Cochrane (1999); Campbell (2018), Ch. 6.
- **Prereqs:** 9, 35.

### 38. Long-run risk
- **Goals:** Separate risk aversion from the intertemporal elasticity with Epstein–Zin preferences. Show how a
  small persistent component in consumption growth makes stocks risky. Weigh the empirical case for and against.
- **Key math:** $\log M_{t+1} = \theta\log\delta - \tfrac{\theta}{\psi}\Delta c_{t+1} + (\theta - 1) r_{c,t+1}$,
  $\theta = \tfrac{1-\gamma}{1-1/\psi}$; $\Delta c_{t+1} = \mu + x_t + \sigma_t\eta_{t+1}$, $x_{t+1} = \rho x_t +
  \varphi_e\sigma_t e_{t+1}$, with stochastic $\sigma_t^2$.
- **Widgets:** `LongRunRisk`: seeded consumption with and without the hidden $x_t$, the variance ratio at long
  horizons, and the equity premium as $\rho$ and $\psi$ move.
- **Data:** simulated (seeded), `fred-consumption-quarterly`.
- **Readings:** Bansal, Kiku & Yaron (2012); Beeler & Campbell (2012); Campbell (2018), Ch. 6.
- **Prereqs:** 5, 35.

### 39. Rare disasters and jump risk
- **Goals:** Show how a small chance of a large consumption drop can explain the equity premium. Estimate the
  needed disaster risk without assuming its size, using relative entropy.
- **Key math:** with disaster probability $p$ and size $b$, $\mathbb{E}[M R^e] = 0$ gains a term $p(1-b)^{-\gamma}$;
  the relative entropy estimator $\min_\pi \sum_t \pi_t \log(T\pi_t)$ s.t. $\sum_t \pi_t M_t(\gamma) R^e_t = 0$.
- **Widgets:** `DisasterLottery`: a seeded century with rare drops, the premium they imply, and sliders for $p$ and
  $b$. `EntropyReweighting`: how the estimator reweights the sample's worst quarters.
- **Data:** simulated (seeded), `fred-consumption-quarterly`, `ff3-monthly`.
- **Readings:** Ghosh & Julliard (2012); Campbell (2018), Ch. 6.
- **Prereqs:** 8, 35.

---

## Part XI — The term structure: facts ●●

*Outline: Week 6.*

### 40. Yields, forwards and bond returns
- **Goals:** Move between prices, yields, forward rates and holding-period returns. Read a yield curve. State the
  expectations hypothesis.
- **Key math:** $p^{(n)}_t = \log P^{(n)}_t$, $y^{(n)}_t = -p^{(n)}_t/n$; $f^{(n)}_t = p^{(n-1)}_t - p^{(n)}_t$;
  $r^{(n)}_{t+1} = p^{(n-1)}_{t+1} - p^{(n)}_t$, $rx^{(n)}_{t+1} = r^{(n)}_{t+1} - y^{(1)}_t$; expectations hypothesis
  $y^{(n)}_t = \tfrac1n\sum_{j=0}^{n-1}\mathbb{E}_t y^{(1)}_{t+j} + \text{const}$.
- **Widgets:** `YieldCurveMovie`: the zero curve month by month, with forward and par curves on a toggle.
  `BondReturnCalc`: buy an $n$-year bond, sell it a year later, and see the return.
- **Data:** `gsw-zero-coupon`, `fred-treasury-monthly`.
- **Readings:** Campbell, Lo & MacKinlay (1997), Ch. 10; Cochrane (2005), Ch. 19.
- **Prereqs:** 1.

### 41. Testing the expectations hypothesis
- **Goals:** Test whether yield spreads forecast yield changes and excess returns. Explain why long yields move
  the wrong way and what that says about time-varying bond risk premia.
- **Key math:** $y^{(n-1)}_{t+1} - y^{(n)}_t = a + b\,\tfrac{y^{(n)}_t - y^{(1)}_t}{n-1} + \varepsilon_{t+1}$, the
  hypothesis implies $b = 1$; the forward-spread regression $rx^{(n)}_{t+1} = a + b\,(f^{(n)}_t - y^{(1)}_t) +
  \varepsilon_{t+1}$.
- **Widgets:** `PredictiveRegression` preset: the slope for each maturity against the hypothesis line $b = 1$.
- **Data:** `gsw-zero-coupon`, `fred-treasury-monthly`.
- **Readings:** Campbell & Shiller (1991); Campbell, Lo & MacKinlay (1997), Ch. 10.
- **Prereqs:** 9, 40.

### 42. Level, slope, curvature and bond risk premia
- **Goals:** Extract level, slope and curvature from yields. Forecast bond excess returns with one tent-shaped
  combination of forward rates. Show that one factor drives expected returns at all maturities.
- **Key math:** PCA of yields; $\overline{rx}_{t+1} = \gamma' f_t + \bar\varepsilon_{t+1}$; $rx^{(n)}_{t+1} = b_n
  (\gamma' f_t) + \varepsilon^{(n)}_{t+1}$.
- **Widgets:** `PCAExplorer` preset on yields. `TentFactor`: the forward-rate weights $\gamma$, with a sample
  toggle that shows how stable the tent is.
- **Data:** `gsw-zero-coupon`.
- **Readings:** Cochrane & Piazzesi (2005).
- **Prereqs:** 6, 41.

---

## Part XII — Term structure models ●●●

*Outline: Week 6.*

### 43. Affine term structure models
- **Goals:** Build bond prices from a short rate, a VAR for the state and a market price of risk. Derive the bond
  pricing recursions. Split yields into expected short rates and a term premium.
- **Key math:** $X_{t+1} = \mu + \Phi X_t + \Sigma\varepsilon_{t+1}$; $r_t = \delta_0 + \delta_1'X_t$; $M_{t+1} =
  \exp(-r_t - \tfrac12\lambda_t'\lambda_t - \lambda_t'\varepsilon_{t+1})$, $\lambda_t = \lambda_0 + \lambda_1 X_t$;
  $p^{(n)}_t = A_n + B_n'X_t$ with $B_{n+1}' = B_n'(\Phi - \Sigma\lambda_1) - \delta_1'$ and $A_{n+1} = A_n +
  B_n'(\mu - \Sigma\lambda_0) + \tfrac12 B_n'\Sigma\Sigma'B_n - \delta_0$.
- **Widgets:** `AffineCurve`: a one- or two-factor model whose curve reshapes as the reader drags the state and
  the prices of risk. `TermPremium`: yield, risk-neutral yield, and the gap.
- **Data:** simulated (seeded), `gsw-zero-coupon`.
- **Readings:** Adrian, Crump & Moench (2013); Campbell, Lo & MacKinlay (1997), Ch. 11.
- **Prereqs:** 5, 8, 40.

### 44. Pricing the term structure with linear regressions
- **Goals:** Estimate an affine model with three sets of OLS regressions instead of maximum likelihood. Produce a
  term-premium series and read its history.
- **Key math:** a VAR for the pricing factors; $rx_{t+1} = \beta'(\lambda_0 + \lambda_1 X_t) - \tfrac12(B^*\mathrm{vec}
  (\Sigma) + \sigma^2\iota) + \beta' v_{t+1} + e_{t+1}$; $\lambda_0$ and $\lambda_1$ from a cross-sectional
  regression on $\beta$.
- **Widgets:** `TermPremium` preset on the estimated model; `RegressionLab` preset for each of the three steps.
- **Data:** `gsw-zero-coupon`.
- **Readings:** Adrian, Crump & Moench (2013).
- **Prereqs:** 42, 43.

### 45. Spanned and unspanned factors
- **Goals:** Explain the spanning property: in an affine model, the state is a function of yields. Test whether
  macro variables forecast bond returns beyond the yield curve. Get the size of the test right with a bootstrap.
- **Key math:** $X_t = (B'W)^{-1}(W' y_t - W'A)$ when the model is invertible; the regression $rx_{t+1} = a +
  b_1' PC_t + b_2' z_t + \varepsilon$ with null $b_2 = 0$; the bootstrap under the spanning null.
- **Widgets:** `SpanningBootstrap`: the distribution of the $R^2$ gain under the null, with the actual gain and a
  slider for the persistence of $z_t$.
- **Data:** `gsw-zero-coupon`, `fred-treasury-monthly`, simulated (seeded).
- **Readings:** Duffee (2013); Bauer & Hamilton (2018).
- **Prereqs:** 12, 43.

### 46. The convenience yield of Treasuries
- **Goals:** Explain why investors accept a lower yield on Treasuries for their safety and liquidity. Measure the
  convenience yield with yield spreads and relate it to the supply of government debt.
- **Key math:** $y^{\text{other}}_t - y^{\text{Treas}}_t = a + b\,\log(\text{Debt}_t/\text{GDP}_t) + \varepsilon_t$,
  with $b < 0$; a demand curve for safe assets.
- **Widgets:** `ConvenienceDemand`: a downward-sloping demand for Treasuries, a supply shifter, and the
  equilibrium spread.
- **Data:** `fred-treasury-monthly`, simulated (seeded).
- **Readings:** Krishnamurthy & Vissing-Jorgensen (2012).
- **Prereqs:** 40.

---

## Part XIII — Horizons, entropy and the equity term structure ●●●

*Outline: Week 7.*

### 47. Entropy bounds
- **Goals:** Define the entropy of the SDF. Derive a lower bound from mean log excess returns. Split the SDF into
  permanent and transitory parts and show that the permanent part must be large.
- **Key math:** $L(M) = \log\mathbb{E}[M] - \mathbb{E}[\log M]$; $L_t(M_{t+1}) \ge \mathbb{E}_t[\log R_{t+1}] - \log
  R^f_t$; $M_{t+1} = M^P_{t+1}M^T_{t+1}$, $M^T_{t+1} = 1/R^{(\infty)}_{t+1}$; $L(M^P) \ge \mathbb{E}[\log R_{t+1} -
  \log R^{(\infty)}_{t+1}]$.
- **Widgets:** `EntropyBound`: the entropy of a lognormal SDF against $\sigma(\log M)$, with the bound from the data.
  `HJBound` side by side.
- **Data:** `ff3-monthly`, `gsw-zero-coupon`.
- **Readings:** Backus, Chernov & Zin (2014); Alvarez & Jermann (2005).
- **Prereqs:** 8, 40.

### 48. Horizon dependence
- **Goals:** Measure how entropy per period changes with the horizon. Link it to average yield spreads. Use it to
  reject models whose SDF is too persistent or not persistent enough.
- **Key math:** $I(n) = n^{-1}L_t(M_{t,t+n})$; horizon dependence $H(n) = I(n) - I(1) = \mathbb{E}[y^{(1)} - y^{(n)}]$
  under the paper's assumptions; $H(n)$ for AR(1) log SDFs.
- **Widgets:** `HorizonDependence`: $H(n)$ for the data and for habit, long-run-risk and disaster models, with
  sliders for each model's persistence.
- **Data:** `gsw-zero-coupon`, simulated (seeded).
- **Readings:** Backus, Chernov & Zin (2014).
- **Prereqs:** 37, 38, 47.

### 49. Dividend strips and the equity term structure
- **Goals:** Price claims to a single year's dividend. Build short-maturity strips from index options. Compare
  short- and long-maturity equity returns and see how the slope moves over the cycle.
- **Key math:** $P_t = \sum_{n \ge 1} P^{(n)}_t$, $P^{(n)}_t = \mathbb{E}_t[M_{t,t+n}D_{t+n}]$; put–call parity gives
  $\sum_{j \le n} P^{(j)}_t = S_t + \mathrm{put}_t - \mathrm{call}_t - K e^{-r n}$; strip yields $e^{(n)}_t$ and the
  slope $e^{(\text{long})}_t - e^{(\text{short})}_t$.
- **Widgets:** `DividendStrips`: a stack of strip prices that sums to the index, with the term structure of strip
  returns under each model and a cycle slider.
- **Data:** simulated (seeded), `shiller-monthly`.
- **Readings:** van Binsbergen, Brandt & Koijen (2012); Gormsen (2021).
- **Prereqs:** 10, 40, 47.

---

## Part XIV — Learning ●●–●●●

*Outline: Week 8.*

### 50. Bayes updating and priors
- **Goals:** Update a belief about a mean return with Bayes' rule. Choose and defend a prior. Track a moving
  parameter with the Kalman filter.
- **Key math:** normal–normal updating: posterior mean $\tfrac{\mu_0/\tau_0^2 + T\bar r/\sigma^2}{1/\tau_0^2 +
  T/\sigma^2}$, posterior variance $(1/\tau_0^2 + T/\sigma^2)^{-1}$; the Kalman gain $K_t = P_{t|t-1}/(P_{t|t-1} +
  \sigma^2)$.
- **Widgets:** `BayesUpdater`: a prior, seeded data arriving one month at a time, and the posterior narrowing.
  `KalmanTracker`: a hidden drifting mean and the filter's estimate.
- **Data:** simulated (seeded), `ff3-monthly`.
- **Readings:** Johannes, Korteweg & Polson (2014); Adam & Nagel (2022).
- **Prereqs:** 2.

### 51. Learning and portfolio choice
- **Goals:** Choose a portfolio when the model's parameters are unknown. Use the predictive distribution in
  place of point estimates. Learn sequentially about predictability and show what it is worth in real time.
- **Key math:** $p(r_{T+1} \mid \text{data}) = \int p(r_{T+1} \mid \theta)\,p(\theta \mid \text{data})\,d\theta$;
  myopic weight $w = \mathbb{E}[R^e]/(\gamma\,\mathrm{Var}(R^e))$ under the predictive distribution; sequential
  updating of $p(\theta \mid \text{data}_{1:t})$.
- **Widgets:** `ParameterUncertainty`: the optimal weight with and without estimation risk, as the horizon and the
  sample length move. `OOSRace` preset with a Bayesian investor.
- **Data:** `goyal-welch-monthly`, simulated (seeded).
- **Readings:** Johannes, Korteweg & Polson (2014).
- **Prereqs:** 13, 50.

### 52. Learning about consumption dynamics
- **Goals:** Let investors learn the parameters of consumption growth. Show that, with recursive preferences,
  revisions in beliefs act like long-run risk. Explain why this helps explain the equity premium and
  predictability.
- **Key math:** $\Delta c_{t+1} = \mu_{s_{t+1}} + \sigma\varepsilon_{t+1}$ with unknown regime parameters; posterior
  updating of $\mu$ each quarter; the Epstein–Zin SDF evaluated under subjective beliefs.
- **Widgets:** `BeliefRevision`: seeded consumption, the posterior for its mean and persistence, and the
  premium that the revisions create.
- **Data:** `fred-consumption-quarterly`, simulated (seeded).
- **Readings:** Johannes, Lochstoer & Mou (2016).
- **Prereqs:** 38, 50.

### 53. Learning in high dimensions
- **Goals:** Show that with many assets and many predictors, rational learners leave in-sample predictability that
  cannot be exploited out of sample. Estimate linear factor models with Bayesian methods.
- **Key math:** $r_{t+1} = X_t g + e_{t+1}$ with $N$ assets and $J$ predictors; the posterior mean $\hat g = (X'X +
  \tfrac{\sigma^2}{\tau^2} I)^{-1}X'r$; the gap between in-sample and out-of-sample $R^2$ as $J/N$ rises; a
  Bayesian posterior for factor risk premia.
- **Widgets:** `BigDataLearner`: in-sample and out-of-sample $R^2$ against the number of predictors, with a prior
  tightness slider.
- **Data:** simulated (seeded), `ff25-size-bm-monthly`.
- **Readings:** Martin & Nagel (2021).
- **Prereqs:** 30, 50.

### 54. Experience, expectations and overreaction
- **Goals:** Show how personal experience shapes beliefs about returns. Test whether forecasters over- or
  under-react to news. Read survey data on expectations.
- **Key math:** experience weights $w_t(k) \propto (t - k)^{\lambda}$; the forecast-error regression $x_{t+h} -
  F_t x_{t+h} = a + b\,(F_t x_{t+h} - F_{t-1}x_{t+h}) + e$, with $b < 0$ for overreaction; diagnostic expectations.
- **Widgets:** `ExperienceWeights`: weighting curves for different $\lambda$, applied to the stock market history
  of investors born in different years. `ForecastErrorRegression` on seeded forecasters.
- **Data:** `shiller-monthly`, simulated (seeded).
- **Readings:** Malmendier & Nagel (2011); Bordalo et al. (2020); Adam & Nagel (2022).
- **Prereqs:** 3, 50.

---

## Part XV — Asset management ●●

*Outline: Week 9.*

### 55. Mutual funds in equilibrium
- **Goals:** Explain why skilled managers need not beat the market net of fees. Model flows that chase
  performance and returns that fall with fund size.
- **Key math:** fund size $q_t$ with costs $C(q_t)$; competitive flows set $\mathbb{E}_t[R_{t+1} - R^B_{t+1}] = 0$
  net of fees; Bayesian learning about skill $\alpha$ from past returns; flow sensitivity to returns.
- **Widgets:** `BerkGreen`: a seeded fund whose skill investors learn, with its size growing and net alpha
  shrinking to zero.
- **Data:** simulated (seeded).
- **Readings:** Berk & Green (2004).
- **Prereqs:** 50.

### 56. Measuring skill
- **Goals:** Measure skill as dollar value added, not as net alpha. Choose the benchmark: tradable index funds
  against factor models. Test whether skill persists.
- **Key math:** value added $V_{it} = q_{i,t-1}(R^G_{it} - R^B_{it})$; gross and net alpha; the benchmark as the
  return of the closest index-fund portfolio.
- **Widgets:** `ValueAdded`: two seeded funds with the same alpha and different sizes. `AlphaBars` preset with
  CAPM, FF3, FF5 and momentum benchmarks.
- **Data:** `ff3-monthly`, `ff5-monthly`, `mom-monthly`, simulated (seeded).
- **Readings:** Berk & van Binsbergen (2015).
- **Prereqs:** 16, 55.

### 57. Agency, benchmarking and indexing
- **Goals:** Show how paying managers against a benchmark changes their demand and pushes up benchmark stocks.
  Measure the price effect of index inclusion with a regression discontinuity.
- **Key math:** a benchmarked manager's demand $\theta = \tfrac{1}{\gamma}\Sigma^{-1}\mu + c\,w_B$; the RD effect
  $\tau = \lim_{x \downarrow c}\mathbb{E}[y \mid x] - \lim_{x \uparrow c}\mathbb{E}[y \mid x]$.
- **Widgets:** `BenchmarkDemand`: an asset's price as the share of benchmarked money grows. `RDPlot`: seeded
  stocks around a size cut-off, with a bandwidth slider.
- **Data:** simulated (seeded).
- **Readings:** Chang, Hong & Liskovich (2015).
- **Prereqs:** 7, 55.

---

## Part XVI — Intermediaries and frictions ●●●

*Outline: Week 9.*

### 58. Intermediary asset pricing
- **Goals:** Price assets with the marginal value of wealth of financial intermediaries, not households. Build
  factors from broker-dealer leverage and from primary dealers' capital ratio, and test them across asset classes.
- **Key math:** $m_{t+1} = a - b\,\Delta\log \text{Lev}_{t+1}$; the capital ratio $\eta_t = \tfrac{\sum_i
  \text{Equity}_{it}}{\sum_i (\text{Equity}_{it} + \text{Debt}_{it})}$; in He–Krishnamurthy, risk premia rise as
  intermediary capital falls.
- **Widgets:** `IntermediaryModel`: intermediary equity hit by a seeded shock, and the risk premium it implies.
  `SMLPlot` preset with a capital-ratio beta.
- **Data:** `ff25-size-bm-monthly`, `ff3-monthly`, simulated (seeded).
- **Readings:** He & Krishnamurthy (2013); Adrian, Etula & Muir (2014); He, Kelly & Manela (2018).
- **Prereqs:** 17, 26.

### 59. Slow-moving capital and liquidity spirals
- **Goals:** Explain why prices recover slowly after supply shocks when capital moves slowly. Show how margins
  link funding to market liquidity and can feed a spiral.
- **Key math:** the funding constraint $x^+ m^+ + x^- m^- \le W$; margins that rise with volatility; a price gap
  that decays like $e^{-\kappa t}$ as capital arrives.
- **Widgets:** `LiquiditySpiral`: a seeded shock, rising margins, forced sales and the price path, with a slider for
  margin sensitivity. `SlowCapital`: the recovery path for different arrival rates of capital.
- **Data:** simulated (seeded).
- **Readings:** Duffie (2010); Brunnermeier & Pedersen (2009).
- **Prereqs:** 7.

### 60. CIP violations and capital regulation
- **Goals:** Measure deviations from covered interest parity. Explain why they persist after 2008, and why they
  spike at quarter ends, through the balance-sheet cost of arbitrage.
- **Key math:** the cross-currency basis $x_{t,t+n} = y^{\$}_{t,t+n} - \big(y_{t,t+n} - \tfrac1n(f_{t,t+n} - s_t)\big)$;
  the arbitrage profit net of a balance-sheet charge.
- **Widgets:** `CIPArbitrage`: the round trip through spot and forward markets, with its cash flows and a
  balance-sheet cost slider.
- **Data:** simulated (seeded).
- **Readings:** Du, Tepper & Verdelhan (2018).
- **Prereqs:** 40, 59.

---

## Part XVII — Frontier topics ●●●

*Outline: Week 10. Short chapters on recent research.*

### 61. Demand systems
- **Goals:** Model each investor's portfolio as a demand curve in characteristics and price. Clear the market and
  measure how inelastic demand for stocks is.
- **Key math:** $\tfrac{w_i(n)}{w_i(0)} = \exp\big(\beta_{0,i}\,me(n) + \beta_{1,i}'x(n) + \epsilon_i(n)\big)$; market
  clearing $ME(n) = \sum_i A_i w_i(n)$; instruments from investment universes.
- **Widgets:** `DemandSystem`: three seeded investors, a supply shock, and the price change at different
  elasticities.
- **Data:** simulated (seeded).
- **Readings:** Koijen & Yogo (2019).
- **Prereqs:** 7, 57.

### 62. Subjective risk premia
- **Goals:** Read survey expectations of returns. Model beliefs formed with fading memory. Show that subjective
  risk premia can move very differently from the premia that regressions find.
- **Key math:** $\tilde{\mathbb{E}}_t[\Delta d_{t+1}] = (1 - \nu)\sum_{j \ge 0} \nu^j \Delta d_{t-j}$; the subjective
  premium against the objective one implied by the model.
- **Widgets:** `FadingMemory`: belief paths for different $\nu$ on dividend data.
- **Data:** `shiller-monthly`.
- **Readings:** Nagel & Xu (2023).
- **Prereqs:** 10, 54.

### 63. Belief overreaction and the stock market
- **Goals:** Link overreaction of long-term growth forecasts to excess volatility and return predictability.
- **Key math:** the Campbell–Shiller identity with subjective expectations; the regression of future returns on
  changes in long-term growth forecasts.
- **Widgets:** `OverreactionSim`: seeded fundamentals, diagnostic forecasts, and the price path they create.
- **Data:** `shiller-monthly`, simulated (seeded).
- **Readings:** Bordalo et al. (2024).
- **Prereqs:** 10, 54.

### 64. Asset embeddings
- **Goals:** Represent assets as vectors learned from who holds them. Use the vectors to measure similarity and to
  predict returns and co-movement.
- **Key math:** a holdings matrix $H \approx U V'$; cosine similarity $\tfrac{v_i'v_j}{\lVert v_i\rVert\lVert
  v_j\rVert}$; embeddings as characteristics in a factor model.
- **Widgets:** `EmbeddingMap`: seeded investors and assets, the learned 2-D embedding, and nearest neighbours.
- **Data:** simulated (seeded).
- **Readings:** Gabaix et al. (2024).
- **Prereqs:** 6, 61.

### 65. Does peer review help predict returns?
- **Goals:** Compare predictors from published papers with predictors found by data mining. Measure how much of
  each survives out of sample and after publication.
- **Key math:** the post-publication decay $\mathbb{E}[\mu^{\text{OOS}}] = (1 - d)\,\hat\mu^{\text{IS}}$; shrinkage
  $\mathbb{E}[\mu \mid \hat\mu] = \bar\mu + (1 - \tfrac{\sigma_e^2}{\sigma_e^2 + \sigma_\mu^2})(\hat\mu - \bar\mu)$.
- **Widgets:** `MultipleTesting` preset: published against mined signals, with in-sample and out-of-sample means.
- **Data:** simulated (seeded).
- **Readings:** Chen, Lopez-Lira & Zimmermann (2024).
- **Prereqs:** 21, 29.

### 66. The zero-beta rate
- **Goals:** Estimate the return of a portfolio with zero beta to the SDF. Show that it differs from the T-bill
  rate and moves with monetary policy.
- **Key math:** $\mathbb{E}[R_i] = R^0 + \beta_i'\lambda$ with $R^0$ estimated in the cross-section; the spread
  $R^0 - R^f$.
- **Widgets:** `SMLPlot` preset with a free intercept, against the T-bill rate.
- **Data:** `ff25-size-bm-monthly`, `fred-treasury-monthly`.
- **Readings:** Di Tella et al. (2024).
- **Prereqs:** 7, 17.

---

## Shared components

| Component | First used | Reused in |
|---|---|---|
| `TimeSeriesChart` | 1 | almost all |
| `CompoundingPath` | 1 | 20 |
| `ReturnCalculator` | 1 | — |
| `SamplingErrorMean` | 2 | — |
| `DistributionExplorer` | 2 | — |
| `RegressionLab` | 3 | 26, 44 |
| `HACLagExplorer`, `OverlapDemo` | 4 | — |
| `AR1Simulator` | 5 | — |
| `PCAExplorer` | 6 | 28, 31, 42 |
| `FrontierBuilder` | 7 | 30 |
| `SMLPlot` | 7 | 17, 58, 66 |
| `SDFExplorer` | 8 | — |
| `HJBound` | 8 | 35, 47 |
| `PredictiveRegression` | 9 | 14, 37, 41 |
| `HorizonCurve` | 9 | — |
| `LogLinearCheck`, `VarianceShares` | 10 | — |
| `NewsDecomposition`, `DogThatDidNotBark` | 11 | — |
| `StambaughBias` | 12 | — |
| `OOSRace` | 13 | 51 |
| `CointegrationDemo` | 14 | — |
| `OptionStripBound` | 15 | — |
| `AlphaBars` | 16 | 56 |
| `GRSGeometry` | 16 | — |
| `FamaMacBethMovie` | 17 | — |
| `ShankenCorrection` | 18 | — |
| `SortGrid` | 19 | 33 |
| `FactorBuilder` | 19 | — |
| `CrashZoom` | 20 | — |
| `ZooChart`, `SpanningTest` | 21 | — |
| `ConditionalBeta`, `ScaledFactors` | 22 | — |
| `RollingBeta`, `AlphaBound` | 23 | — |
| `GMMObjective` | 24 | 25 |
| `JTestSim` | 25 | — |
| `HJDistance` | 26 | — |
| `UselessFactor`, `ConfidenceSet` | 27 | — |
| `RandomFactorFit` | 28 | — |
| `MultipleTesting` | 29 | 65 |
| `ShrinkagePath` | 30 | — |
| `IPCAFit` | 32 | — |
| `MimickingPortfolio` | 33 | — |
| `OmittedFactorBias` | 34 | — |
| `PuzzleCalculator` | 35 | — |
| `TimeAveraging`, `UnfilterConsumption` | 36 | — |
| `HabitSimulator` | 37 | — |
| `LongRunRisk` | 38 | — |
| `DisasterLottery`, `EntropyReweighting` | 39 | — |
| `YieldCurveMovie`, `BondReturnCalc` | 40 | — |
| `TentFactor` | 42 | — |
| `AffineCurve` | 43 | — |
| `TermPremium` | 43 | 44 |
| `SpanningBootstrap` | 45 | — |
| `ConvenienceDemand` | 46 | — |
| `EntropyBound` | 47 | — |
| `HorizonDependence` | 48 | — |
| `DividendStrips` | 49 | — |
| `BayesUpdater`, `KalmanTracker` | 50 | — |
| `ParameterUncertainty` | 51 | — |
| `BeliefRevision` | 52 | — |
| `BigDataLearner` | 53 | — |
| `ExperienceWeights`, `ForecastErrorRegression` | 54 | — |
| `BerkGreen` | 55 | — |
| `ValueAdded` | 56 | — |
| `BenchmarkDemand`, `RDPlot` | 57 | — |
| `IntermediaryModel` | 58 | — |
| `LiquiditySpiral`, `SlowCapital` | 59 | — |
| `CIPArbitrage` | 60 | — |
| `DemandSystem` | 61 | — |
| `FadingMemory` | 62 | — |
| `OverreactionSim` | 63 | — |
| `EmbeddingMap` | 64 | — |
| `Quiz`, `Slider`, `Toggle`, `Callout`, `Details` | 1 | all |

## Coverage table

Every item under "Concepts covered" in the outline, in the outline's order, with the chapters that teach it.
Week 10 has no such list; Part XVII covers its readings.

| # | Week | Concept | Chapter(s) |
|---|---|---|---|
| 1 | 1 | Tests of market predictability | 9, 12 |
| 2 | 1 | Time-varying expected returns | 9, 10 |
| 3 | 1 | Campbell–Shiller decomposition | 10 |
| 4 | 1 | Cash-flow and discount-rate shocks | 11 |
| 5 | 1 | Out-of-sample predictability | 13 |
| 6 | 1 | Stambaugh bias | 12 |
| 7 | 1 | Entropy-based expected returns | 15 |
| 8 | 2 | Cross-sectional tests of linear asset pricing models | 16, 17 |
| 9 | 2 | Fama–MacBeth regressions | 17 |
| 10 | 2 | Shanken correction | 18 |
| 11 | 2 | Size | 19 |
| 12 | 2 | Value | 19 |
| 13 | 2 | Momentum | 20 |
| 14 | 2 | Asset pricing anomalies | 21, 23 |
| 15 | 2 | Factor zoo | 21 |
| 16 | 2 | Conditional linear factor models | 22, 23 |
| 17 | 3 | GMM and its key properties | 24 |
| 18 | 3 | Efficient and feasible estimation | 25 |
| 19 | 3 | Identification of asset pricing models | 26, 27 |
| 20 | 4 | Factor zoo | 28, 29, 30 |
| 21 | 4 | Latent and observable asset pricing factors | 31 |
| 22 | 4 | Characteristic-based mimicking portfolios | 32, 33 |
| 23 | 4 | Shrinkage | 30 |
| 24 | 4 | Estimation of risk premia in a large cross-section | 34 |
| 25 | 5 | Nondurable consumption and its measurement | 35, 36 |
| 26 | 5 | Internal and external habits | 37 |
| 27 | 5 | Long-run risk | 38 |
| 28 | 5 | Jump risk | 39 |
| 29 | 6 | Time-series and cross-sectional properties of the term structure | 40, 41, 42 |
| 30 | 6 | Affine term structure models | 43, 44 |
| 31 | 6 | Spanned and unspanned bond factors | 45 |
| 32 | 6 | Convenience yield | 46 |
| 33 | 7 | Entropy bounds in asset pricing | 47 |
| 34 | 7 | Horizon dependence | 48 |
| 35 | 7 | Term structure of equity returns | 49 |
| 36 | 7 | Dividend strips | 49 |
| 37 | 8 | Bayes updating | 50 |
| 38 | 8 | Priors | 50, 53 |
| 39 | 8 | Learning for optimal portfolio allocation | 51 |
| 40 | 8 | Learning in consumption-based asset pricing models | 52 |
| 41 | 8 | Learning in the estimation of linear factor models | 53 |
| 42 | 8 | Learning in a high-dimensional environment | 53 |
| 43 | 9 | Equilibrium models of mutual fund performance and asset returns | 55 |
| 44 | 9 | Measuring skill in asset management | 56 |
| 45 | 9 | Agency frictions | 55, 57 |
| 46 | 9 | Benchmarking | 57 |
| 47 | 9 | Indexing | 57 |
| 48 | 9 | Intermediary-based asset pricing | 58 |
| 49 | 9 | Measurement of financial frictions | 58, 59, 60 |
| 50 | 9 | CIP violations | 60 |
| 51 | 9 | Capital regulations | 60 |

## Data wanted later

These chapters would gain from data outside the ten datasets that TASK-004 builds. Until then they use
simulated (seeded) data or the nearest listed dataset.

| Data | Source | Chapters |
|---|---|---|
| Option-implied SVIX index | Ian Martin's website | 15 |
| 30 or 49 industry portfolios | Kenneth French Data Library | 28 |
| Published anomaly portfolios and signals | Open Source Asset Pricing (Chen & Zimmermann) | 21, 29, 30, 65 |
| Firm characteristics panel | Open Source Asset Pricing, or CRSP/Compustat (licensed) | 32, 33 |
| Cross-country consumption disasters | Barro–Ursúa macroeconomic data | 39 |
| Corporate bond yields (Aaa, Baa) and federal debt to GDP | FRED | 46 |
| Dividend futures or option-implied strip prices | Exchange data (licensed) or published series | 49 |
| Survey expectations of returns and growth | Michigan, SPF, Graham–Harvey, Gallup/UBS | 54, 62 |
| Long-term growth forecasts | I/B/E/S (licensed) | 63 |
| Mutual fund returns and assets | CRSP Mutual Fund Database (licensed) | 56 |
| Russell 1000/2000 membership | FTSE Russell (licensed) | 57 |
| Broker-dealer leverage; primary dealer capital ratio | Fed Financial Accounts; Asaf Manela's website | 58 |
| FX spot and forward rates; interbank rates | Bloomberg or Refinitiv (licensed) | 60 |
| 13F institutional holdings | SEC EDGAR or Thomson Reuters (licensed) | 61, 64 |
