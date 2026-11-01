# Style Guide

This guide is the house style for every chapter. Follow it so that 66 chapters, many of them written in
different sessions, read like one course. `docs/CURRICULUM.md` says *what* each chapter covers; this guide says
*how* it is written, which symbols it uses and which colours it shows.

## 1. Voice

- **Picture first, then the formula.** Show the shape before writing it down. A formula should feel like a
  summary of something the reader has already seen.
- **Data before theory, where we can.** Most chapters can open with a real series: the dividend–price ratio
  since 1926, the returns of 25 size–value portfolios, the yield curve. Let the reader see the fact the model
  must explain.
- **One idea per section.** If a section needs two "aha" moments, split it in two.
- **Start each chapter with a question the reader actually has.** For example: *"If stocks paid 7% a year
  more than T-bills for a century, why doesn't everyone hold only stocks?"*
- **Write to one reader, as "you".** Keep sentences short. Explain a term the first time it appears, and link
  back to the chapter that introduced it.
- **Give the honest version.** Simplify, but don't say false things. When a simplification is in play, say so
  ("we treat the betas as known until Chapter 18").
- **Say what the evidence can and cannot show.** Report standard errors, the sample period and the data
  source with every estimate. Never call a pattern "significant" without the test behind it.
- **Don't skip steps in derivations.** Write out every step. Steps that are pure algebra can go in a
  collapsible `<Details>` block, but they must be there.
- **Graduate rigour comes in gradually.** Part I uses algebra and basic statistics, and builds regression,
  time series and the SDF from zero. The ●● Parts use matrix algebra and time series. The ●●●
  Parts (GMM asymptotics, dynamic equilibrium models, high-dimensional estimation) use full graduate
  notation, and always give a plain reading of each result next to it. The dots in `docs/CURRICULUM.md` set
  each Part's level.
- **Papers in our own words.** Explain a paper's idea and cite it. Never copy its text, figures or tables.

## 2. Chapter template

Every chapter is one MDX file in `src/content/chapters/NN-slug.mdx` and has these sections, in this order:

| # | Section | Purpose |
|---|---|---|
| 1 | **Hook** | A concrete question, puzzle, or surprising fact, ideally from real data. About 1–3 paragraphs. |
| 2 | **Intuition** | The picture, interactive where possible. No heavy notation yet. |
| 3 | **Formalisation** | The TeX, colour-coded to match the picture. Derivations and estimators go here. |
| 4 | **Playground** | A widget the reader can explore freely. It ends with 1–2 "try this" prompts. |
| 5 | **Check yourself** | 2–3 short `<Quiz>` questions, answered client-side. Each answer has an explanation. |
| 6 | **Recap & next up** | 3–5 bullet takeaways and a one-line teaser for the next chapter. |

Start each `##` heading with its tag, for example `## <span class="section-tag">Hook</span> A century of
returns`.

Frontmatter:

```yaml
---
title: "Returns"
part: 1
chapter: 1
difficulty: 1          # 1 = intro, 2 = intermediate, 3 = advanced
prerequisites: []
summary: "Simple, log and excess returns, and why log returns add up over time."
---
```

Length: about 1,500–3,000 words of prose. If a chapter runs longer, split it.

## 3. Notation

Use these symbols everywhere. If a chapter needs a new symbol, add it to this table in the same PR. The
**Macro** column names the KaTeX colour macro for the symbol (§4); a dash means the symbol is not coloured.
`tests/notation.test.ts` fails if a macro named here is missing from `src/lib/katexMacros.ts`.

### Returns and prices

| Symbol | Macro | Meaning |
|---|---|---|
| $R_{t+1}$, $R_{i,t+1}$ | `\Ret` | Simple (net) return from $t$ to $t+1$, of the market or of asset $i$: $R_{t+1} = (P_{t+1} + D_{t+1})/P_t - 1$ |
| $1 + R_{t+1}$ | `\Ret` | Gross return. It has no letter of its own: write $1 + R$, so a "10% return" is always $R = 0.10$ |
| $r_{t+1}$ | `\Ret` | Log return, $r_{t+1} = \log(1 + R_{t+1})$. $\log$ is always the natural log |
| $R^e_{t+1}$, $r^e_{t+1}$ | `\Ret` | Excess return over the risk-free rate, $R^e_{t+1} = R_{t+1} - R^f_t$, and its log version $r_{t+1} - r^f_t$ |
| $R^f_t$, $r^f_t$ | `\Rf` | Risk-free rate from $t$ to $t+1$. It is known at $t$, so it carries the date $t$. $r^f_t = \log(1 + R^f_t)$ |
| $R_{t \to t+k}$ | `\Ret` | Return over the $k$ periods after $t$. $k$ is a horizon in periods |
| $P_t$, $D_t$; $p_t$, $d_t$ | — | Price and dividend; their logs $p_t = \log P_t$, $d_t = \log D_t$ |
| $\mu$, $\sigma$, $\Sigma$ | — | Mean, standard deviation, and the $N \times N$ covariance matrix of returns. Other covariances carry a subscript: $\Sigma_\varepsilon$, $\Sigma_f$ |
| $w$ | — | Portfolio weights, an $N$-vector |
| $SR$ | — | Sharpe ratio $\mathbb{E}[R^e]/\sigma(R^e)$ |

### Factor models and tests

| Symbol | Macro | Meaning |
|---|---|---|
| $f_t$, $f_{k,t}$ | `\Factor` | The $K$-vector of factors at $t$, and factor $k$. A factor never carries a maturity superscript (compare the forward rate $f^{(n)}_t$) |
| $\beta_i$, $\beta_{i,k}$ | — | Exposure (beta) of asset $i$ to the factors: a $K$-vector, and its $k$-th entry. $\beta$ is only ever a regression or factor exposure |
| $\lambda$, $\lambda_k$ | — | Risk premia (factor prices): $\mathbb{E}[R^e_i] = \beta_i'\lambda$ |
| $\alpha_i$, $\alpha$ | `\Err` | Pricing error (alpha) of asset $i$, and the $N$-vector of them. Never a significance level |
| $a_i$ | — | Intercept of asset $i$ in a first-pass time-series regression, $R^e_{i,t} = a_i + \beta_i'f_t + \varepsilon_{i,t}$, in a two-pass test (Chapters 17–18), where $\alpha_i$ is the cross-sectional pricing error. In a time-series test with traded factors (Chapter 16) the intercept is the pricing error, so it is $\alpha_i$. In predictive regressions $a$ is the intercept; context separates the two |
| $\zeta$ | — | Shanken factor $\zeta = \lambda'\Sigma_f^{-1}\lambda$, per period: the corrected variance of $\hat\lambda$ scales the residual part by $1 + \zeta$. For traded factors it is the squared highest Sharpe ratio of the factors, $SR^2_f$. Not $c$, which is log consumption, nor $\kappa$, which is a Campbell–Shiller constant |
| $\varepsilon_{i,t}$ | `\Err` | Residual or shock. $u_t$, $v_t$ name the shocks of a second equation (for example a predictor's) |
| $T$, $N$, $K$ | — | Sample size (periods), number of test assets, number of factors. Index them $t = 1, \dots, T$, $i = 1, \dots, N$, $k = 1, \dots, K$ |
| $\hat\beta$, $\bar R$ | — | A hat marks an estimate or a fitted value. A bar marks a sample mean over time, $\bar R_i = \tfrac1T \sum_t R_{i,t}$ |
| $\bar R^e_i$ | `\Data` | An observed (sample) quantity, coloured as data when a plot compares it with a model |
| $\hat\beta_i'\hat\lambda$ | `\Model` | A fitted (model-implied) quantity, coloured as model in the same plot |
| $q$ | — | Significance level or false-discovery rate of a test, as in "reject when $p \le q$". Never $\alpha$, which is the pricing error |

### The stochastic discount factor and consumption

| Symbol | Macro | Meaning |
|---|---|---|
| $M_{t+1}$, $m_{t+1}$ | `\SDF` | Stochastic discount factor and its log, $m = \log M$. Use $M$ in every model, linear ones included: $M_{t+1} = 1 - b'(f_{t+1} - \mathbb{E}f)$ |
| $b$ (SDF) | — | Loadings of a linear SDF on the factors (Part VI on). In predictive regressions $b$ is a slope; context separates the two |
| $X_{t+1}$ | — | Payoff at $t+1$: $P_t = \mathbb{E}_t[M_{t+1} X_{t+1}]$ and $\mathbb{E}_t[M_{t+1}(1 + R_{t+1})] = 1$ |
| $C_t$, $c_t$, $\Delta c_{t+1}$ | — | Consumption, its log, and log consumption growth $c_{t+1} - c_t$ |
| $\gamma$ | — | Relative risk aversion. $\gamma$ is used for nothing else: slopes on characteristics are $\hat\xi_{t+1}$ (Part VIII) |
| $\delta$ | — | Subjective time-discount factor: $M_{t+1} = \delta (C_{t+1}/C_t)^{-\gamma}$. Never $\beta$, which is a factor exposure |
| $\psi$ | — | Elasticity of intertemporal substitution (Epstein–Zin) |
| $\mathbb{E}_t[\cdot]$ | — | Expectation conditional on information at $t$. $\mathbb{E}[\cdot]$ without a subscript is unconditional |

### Predictability and the Campbell–Shiller decomposition

| Symbol | Macro | Meaning |
|---|---|---|
| $x_t$ | `\Signal` | A predictor or signal known at $t$: $r_{t+1} = a + b\,x_t + \varepsilon_{t+1}$. Use $a$, $b$ for predictive regressions so they never look like $\alpha$, $\beta$ |
| $dp_t$, $pd_t$ | `\Signal` | Log dividend–price ratio $dp_t = d_t - p_t$, and its negative, the log price–dividend ratio $pd_t = p_t - d_t$ |
| $\phi$ | — | Persistence of an AR(1) predictor: $x_{t+1} = \mu_x + \phi x_t + v_{t+1}$. $A$ is the coefficient matrix of a VAR |
| $\rho$, $\kappa$ | — | Campbell–Shiller linearisation constants: $r_{t+1} \approx \kappa + \rho\,pd_{t+1} + \Delta d_{t+1} - pd_t$, with $\rho = e^{\overline{pd}}/(1 + e^{\overline{pd}})$. Write a correlation as $\operatorname{corr}(\cdot,\cdot)$, never $\rho$ |
| $\Delta d_{t+1}$ | — | Log dividend growth $d_{t+1} - d_t$ |
| $N_{CF}$, $N_{DR}$ | — | Cash-flow and discount-rate news. $N$ with a subscript is news; $N$ alone is the number of assets |

### Part III: out-of-sample tests, $cay$ and option bounds (Chapters 13–15)

| Symbol | Macro | Meaning |
|---|---|---|
| $R^2_{OS}$ | — | Out-of-sample $R^2$ (Chapter 13): one minus the model's sum of squared forecast errors over the mean's, on the same $T_{OS}$ dates. It can be negative |
| $T_{OS}$ | — | Number of out-of-sample forecast dates |
| $\mathit{CSED}_\tau$ | — | Cumulative squared-error difference up to date $\tau$: the mean's squared errors minus the model's. At the last date it is $\mathit{SSE}_{\bar r}\,R^2_{OS}$ |
| $\mathit{cw}_t$, $\mathit{CW}$ | — | Clark–West adjusted loss difference at $t$, and the one-sided $t$-statistic on its mean |
| $\bar u$ | — | Realised mean–variance utility of a portfolio built from forecasts, $\operatorname{mean}(w_t r^e_{t+1}) - \tfrac{\gamma}{2}\operatorname{Var}(w_t r^e_{t+1})$. Here $w_t$ is a portfolio weight |
| $cay_t$ | `\Signal` | Consumption–wealth ratio (Chapter 14): $c_t - \theta_n n_t - \theta_y y_t - \text{const}$. The name keeps the letters of Lettau & Ludvigson (2001) |
| $W_t$, $w_t$ | — | Total wealth (asset wealth plus human capital) and its log, in Chapter 14 only. This $w_t$ is not a portfolio weight $w$; the chapter says so in words. $R_{w,t}$, $r_{w,t}$ are the return on total wealth |
| $n_t$ | — | Log asset wealth, the households' net worth (Chapter 14). The paper writes $a_t$; we use $n_t$ because $a$ is a predictive intercept. Not the maturity $n$, which is always a superscript in parentheses |
| $h_t$, $z_t$ | — | Log human capital, $h_t = \text{const} + y_t + z_t$, and its stationary gap $z_t$ from log labour income $y_t$ |
| $\omega$ | — | Average share of asset wealth in total wealth, $w_t \approx \omega n_t + (1 - \omega) h_t$. In Chapter 6, $\omega$ is a rotation angle |
| $\rho_w$ | — | Linearisation constant of the budget constraint, $\rho_w = 1 - e^{\overline{c - w}}$: the usual share of wealth that is not consumed. Compare the Campbell–Shiller $\rho$ |
| $\theta_n$, $\theta_y$; $\theta$ | — | Cointegrating weights on $n_t$ and $y_t$, estimated by dynamic OLS, and the single weight $\theta$ of the cointegration demo (Chapter 14). Never $\beta$, which is only an exposure. Part VI reuses $\theta$ for the GMM parameter vector |
| $\pi^*(s)$ | `\Prob` | Risk-neutral probability of state $s$ (Chapter 15), $\pi^*(s) = \pi(s)\,M(s)\,(1 + R^f_t)$. The Prob colour token colours it, as it colours $\pi(s)$ |
| $\mathbb{E}^*_t$, $\operatorname{Var}^*_t$ | — | Expectation and variance at $t$ with the risk-neutral probabilities $\pi^*$ |
| $\tau$ | — | Life of the options in years (Chapter 15). In Chapter 13, $\tau$ is the end date of $\mathit{CSED}_\tau$ |
| $F_t$ | — | Forward price of the index, $F_t = P_t(1 + R^f_t)$ |
| $K$ | — | Strike price of an option in Chapter 15, not the number of factors. The chapter says so in words |
| $\mathrm{call}_t(K)$, $\mathrm{put}_t(K)$ | — | Prices at $t$ of a call and of a put on the index with strike $K$ |
| $\mathrm{SVIX}_t$ | — | Martin's index: $\mathrm{SVIX}^2_t$ is the risk-neutral variance of $(1 + R_{t+1})/(1 + R^f_t)$, scaled to a year by $1/\tau$ |
| $\mathrm{VIX}_t$ | — | The CBOE volatility index: the same options weighted by $1/K^2$, so $\mathrm{VIX}^2_t = \tfrac{2}{\tau}L^*_t$ of the same gross return ratio |
| $L(X)$, $L_t$, $L^*_t$ | — | Entropy of a positive variable, $L(X) = \log\mathbb{E}[X] - \mathbb{E}[\log X]$, with real and with risk-neutral probabilities at $t$ |

### Part V: factors, anomalies and conditional models (Chapters 19–23)

| Symbol | Macro | Meaning |
|---|---|---|
| $\text{MKT}_t$; $R_{m,t}$, $R^e_{m,t}$ | `\Factor`; `\Ret` | Market factor, the market's excess return $\text{MKT}_t = R_{m,t} - R^f_t$. The French data call it Mkt-RF. The market's subscript is a lower-case $m$, never $M$, which is the SDF |
| $\text{SMB}_t$, $\text{HML}_t$ | `\Factor` | Size factor (small minus big) and value factor (high minus low book-to-market), long–short portfolios from the 2×3 sorts of Chapter 19. Each is already an excess return |
| $\text{RMW}_t$, $\text{CMA}_t$ | `\Factor` | Profitability factor (robust minus weak) and investment factor (conservative minus aggressive) of the five-factor model (Chapter 19) |
| $\text{WML}_t$ | `\Factor` | Momentum factor, winners minus losers (Chapter 20). Formulas write WML. The French data publish it as Mom, and the code calls the rebuilt series UMD (up minus down). All three name one factor |
| $s_{\text{S},t}$, $v_{\text{H},t}$ | — | Size part and B/M part of a 2×3 portfolio's return, $R_{\text{SH},t} = s_{\text{S},t} + v_{\text{H},t} + e_{\text{SH},t}$, in Chapter 19 only. This $v$ always carries a sort letter, so it is not a shock $v_t$ |
| $I_{B,t-1}$ | — | Bear-market indicator (Chapter 20): 1 if the market's cumulative excess return over the 24 months up to $t-1$ is negative, otherwise 0. It is known at $t-1$ |
| $z_t$ | `\Signal` | State variable of a conditional model (Chapters 22–23), known at $t$. Model coefficients move with it ($\eta_t = \eta_0 + \eta_1 z_t$), and $z_t R^e_{i,t+1}$ is a managed portfolio. A predictor $x_t$ forecasts a return; $z_t$ scales a model's coefficients or its test assets. In Chapter 14, $z_t$ is the human-capital gap |
| $\beta_{it}$, $\beta_{iq}$ | — | Conditional beta of asset $i$, known at $t$, for the return from $t$ to $t+1$: $\mathbb{E}_t[R^e_{i,t+1}] = \beta_{it}\lambda_t$. No comma between $i$ and $t$. A beta without a date is constant. $\beta_{iq}$ is the beta of asset $i$ inside a short window $q$, such as a quarter (Chapter 23); this $q$ is a window, not a significance level |
| $\lambda_t$ | — | Conditional market risk premium, $\lambda_t = \mathbb{E}_t[R^e_{m,t+1}]$, known at $t$ (Chapters 22–23). $\bar\lambda = \mathbb{E}[\lambda_t]$ is the unconditional premium |
| $\alpha^u_i$, $\beta^u_i$ | `\Err` | Unconditional alpha and beta: intercept and slope of one constant-beta regression over the whole sample, when the true model is conditional. Only the alpha takes the macro |
| $\sigma_{\beta\lambda}$ | — | Covariance of beta and the premium, $\operatorname{Cov}(\beta_t, \lambda_t)$, in the simulated world of Chapter 22. Not $c$, which is log consumption |
| $\eta_t$; $\eta_0$, $\eta_1$ | — | Intercept of a conditional linear SDF, $M_{t+1} = \eta_t + b_t f_{t+1}$, and its constant and slope on $z_t$ (Chapter 22). Not $a$, which is a predictive intercept, nor $\delta$, the time-discount factor. In Chapter 7, $\eta_1$ and $\eta_2$ are Lagrange multipliers |

### Part VI: GMM, SDF estimation and identification (Chapters 24–27)

The parameter vector $\theta$ and the statistic $J$ are in the Probability and statistics table.

| Symbol | Macro | Meaning |
|---|---|---|
| $g(x_t, \theta)$, $g_T(\theta)$ | — | Moment function at date $t$, with $\mathbb{E}[g(x_t, \theta_0)] = 0$, and its sample mean $g_T(\theta) = \tfrac1T\sum_t g(x_t, \theta)$. Not $f$, which is a factor $f_t$ |
| $\dim g$, $\dim\theta$ | — | Number of moment conditions and of parameters. $J$ has $\dim g - \dim\theta$ degrees of freedom. Not $r$ and $k$, which are a log return and a factor index, nor $L$, which counts Newey–West lags in $\hat S$ (Chapter 4) |
| $D$ | — | Jacobian $D = \partial g_T/\partial\theta'$, a $\dim g \times \dim\theta$ matrix. Not $d$, which is a log dividend $d_t$. The dividend $D_t$ always carries its date |
| $W$ | — | Weighting matrix: $\hat\theta$ minimises $g_T(\theta)'W g_T(\theta)$. Not $w$, which is portfolio weights. Total wealth $W_t$ (Chapter 14) always carries its date |
| $S$, $\hat S$ | — | Long-run covariance of the moments, $S = \sum_{j=-\infty}^{\infty}\mathbb{E}[g_t\,g_{t-j}']$, and its Newey–West estimate with $L$ lags, as in Chapter 4. Efficient GMM sets $W = \hat S^{-1}$ |
| $\mathbb{E}_T[\cdot]$ | — | Sample mean over $t = 1, \dots, T$ of a product, $\mathbb{E}_T[R^e f'] = \tfrac1T\sum_t R^e_t f_t'$. The subscript is the sample size $T$, never a date: compare $\mathbb{E}_t[\cdot]$ |
| $\tilde f_t$ | `\Factor` | Demeaned factors $\tilde f_t = f_t - \bar f$, as in $M_t = 1 - b'\tilde f_t$ and $g_T(b) = \mathbb{E}_T[R^e] - \mathbb{E}_T[R^e\tilde f']\,b$ |
| $\delta_{\text{HJ}}$ | — | Hansen–Jagannathan distance, $\delta_{\text{HJ}} = \sqrt{g_T'\,\mathbb{E}_T[RR']^{-1}g_T}$. It always keeps its subscript, so it never reads as the time-discount factor $\delta$ |
| $\lambda^{\circ}$ | — | A hypothesised value of the risk premia $\lambda$, tested by the GRS-FAR statistic and collected into a confidence set (Chapter 27). Not $\lambda_0$, which is the zero-beta rate of Chapter 17 |

### Part VII: the factor zoo and shrinkage (Chapters 28–30)

| Symbol | Macro | Meaning |
|---|---|---|
| $n$, $n_0$; $c(n)$ | — | Number of tests (strategies or signals tried), and how many of them have a true null (Chapter 29). Bonferroni rejects when $p_i \le q/n$; the expected number of false discoveries is $n_0$ times the test size; BHY's constant is $c(n) = \sum_{j=1}^{n} 1/j$, always written with its argument so it never reads as log consumption $c_t$. Not $M$, which is the SDF (Harvey, Liu & Zhu write $M$), nor $N$, which is the number of test assets. A maturity $n$ is always a superscript in parentheses, and log asset wealth $n_t$ always carries its date |
| $p_i$; $p_{(j)}$ | — | $p$-value of test $i$, and the $j$-th smallest of the $n$ $p$-values, $p_{(1)} \le \dots \le p_{(n)}$ (Chapter 29). It always carries a test index and never a date, so it never reads as a log price $p_t$; $p_{(j)}$ has its index below the line, the bond price $p^{(n)}_t$ above it. Not $\pi$, which is a state probability |
| $\nu_2$, $\nu_1$ | — | L2 and L1 penalties of the shrinkage SDF estimates (Chapter 30): the ridge estimate is $\hat b = (\Sigma + \nu_2 I)^{-1}\bar\mu$, and the elastic net minimises $(\bar\mu - \Sigma b)'\Sigma^{-1}(\bar\mu - \Sigma b) + \nu_2 b'b + \nu_1\sum_i\lvert b_i\rvert$. Kozak, Nagel & Santosh (2020) write $\gamma$, $\gamma_2$, $\gamma_1$; here $\gamma$ is risk aversion. Each $\nu$ always carries its subscript |
| $SR_{\text{prior}}$ | — | Prior scale (Chapter 30): the root expected maximum squared Sharpe ratio under the prior, $SR^2_{\text{prior}} = \mathbb{E}[\mu'\Sigma^{-1}\mu]$. It sets $\nu_2 = \operatorname{tr}\Sigma/(SR^2_{\text{prior}}\,T)$. The paper writes $\kappa$, a Campbell–Shiller constant here, and $\tau$ for $\operatorname{tr}\Sigma$, the option life here |
| $R^2_{CV}$ | — | Cross-validated cross-sectional $R^2$ (Chapter 30): the mean over folds of $1 - \lVert\bar\mu_{\text{out}} - \Sigma_{\text{out}}\hat b\rVert^2/\lVert\bar\mu_{\text{out}}\rVert^2$, with $\bar\mu_{\text{out}}$ and $\Sigma_{\text{out}}$ from the withheld fold and $\hat b$ from the others. Not $R^2_{OS}$, the forecast $R^2$ of Chapter 13 |
| $K_{CV}$ | — | Number of folds in the cross-validation, each a block of consecutive months; 3, as in the paper. Bare $K$ is the number of factors |
| $s$ | — | A share between 0 and 1, with one meaning per chapter. In Chapter 28, the noise share of each random factor, $f_{k,t} = \sqrt{1 - s}\,\text{mix}_{k,t} + \sqrt{s}\,\text{noise}_{k,t}$: the part of its variance that is noise. In Chapter 30, the $L^1$ share of the total elastic-net penalty, $\nu_1 = s(\nu_2 + \nu_1)$, so $s = 0$ is the ridge, a split that is our device, not the paper's. Not a state $s$, which only appears as the argument of $\pi(s)$ or $M(s)$, nor $s_{\text{S},t}$, which carries a sort letter |
| $c$ (prior) | — | Prior constant $c = SR^2_{\text{prior}}/\operatorname{tr}\Sigma$, so $\mu \sim N(0, c\Sigma^2)$, in the ridge derivation of Chapter 30 only; the chapter says so in words. Not log consumption $c_t$, which carries its date, nor a slope on characteristics |
| $R^2_{\text{OLS}}$, $R^2_{\text{GLS}}$ | — | Cross-sectional $R^2$ of the two-pass regression with an intercept (Chapter 28). $R^2_{\text{OLS}} = 1 - \sum_i \hat\alpha_i^2 / \sum_i (\bar R^e_i - \bar{\bar R}^e)^2$. $R^2_{\text{GLS}} = 1 - \hat\alpha'\Sigma^{-1}\hat\alpha / (\bar R^e - \mu_{\text{gmv}}\mathbf{1})'\Sigma^{-1}(\bar R^e - \mu_{\text{gmv}}\mathbf{1})$, with the GLS pricing errors. Not $R^2_{OS}$, the out-of-sample $R^2$ of Chapter 13, nor the time-series $R^2$ of a first-pass regression |
| $\mu_{\text{gmv}}$ | — | Mean excess return of the global minimum-variance portfolio, $\mu_{\text{gmv}} = \mathbf{1}'\Sigma^{-1}\bar R^e / \mathbf{1}'\Sigma^{-1}\mathbf{1}$, with $\mathbf{1}$ the $N$-vector of ones. Not $\lambda_0$, the zero-beta rate a model estimates |
| $SR^2(\lambda_0)$; $SR^2_{\text{tan}}(\lambda_0)$, $SR^2_f(\lambda_0)$ | — | Squared Sharpe ratio measured against the zero-beta rate, $(\mathbb{E}[R^e] - \lambda_0)^2/\sigma^2$, for a portfolio whose weights sum to one; the highest one among the test assets and among the factors' mimicking portfolios (Chapter 28). The GLS pricing errors leave $SR^2_{\text{tan}}(\hat\lambda_0) - SR^2_f(\hat\lambda_0)$ unexplained. Lewellen, Nagel & Shanken write $\theta^2$; not $\theta$, which is the GMM parameter vector |
| $B$ | — | The $N \times K$ matrix of betas, whose row $i$ is $\beta_i'$: $R^e_t = \mathbb{E}[R^e] + B(f_t - \mathbb{E}f) + \varepsilon_t$ and $\mathbb{E}[R^e] = B\lambda$ (Chapter 28; Chapter 27 uses the same matrix). In the proof of Chapter 29, $B_j$ is instead the event that a true null's $p$-value falls in the $j$-th band of width $q/(n\,c(n))$; it always carries the band index $j$. Not $I_{B,t-1}$, whose $B$ marks a bear market |
| $f^P_t$; $B_P$, $\lambda_P$ | `\Factor`; — | The $K$ proposed factors of Chapter 28 ($P$ for "proposed"), correlated with the returns only through the true factors $f_t$; their $N \times K$ matrix of betas, $B_P = BG$; and the premia that price the returns with those betas, $\lambda_P = G^{-1}\lambda$. Only $f^P_t$ takes the macro. The $P$ is a label, never a power and never a price $P_t$ |
| $G$ | — | The $K \times K$ matrix that maps the true betas to the proposed ones, $G = \operatorname{Cov}(f, f^{P\prime})\operatorname{Var}(f^P)^{-1}$ (Chapter 28). With one factor of each kind it is the number $\operatorname{Cov}(f, f^P)/\operatorname{Var}(f^P)$. Not $Q$, which is the matrix of eigenvectors |
| $\vartheta$ | — | Weights on the betas that define a mimicking portfolio, $w = \Sigma^{-1}\hat\beta\vartheta$, a $K$-vector (Chapter 28). Not $\theta$, the GMM parameter vector |
| $\mathbf{1}\{\cdot\}$ | — | Indicator: 1 if the event in the braces happens, otherwise 0, as in $\mathbf{1}\{n_{\text{false}} \ge 1\}$ (Chapter 29). It always carries its braces, so it never reads as the vector of ones $\mathbf{1}$ |

### Part VIII: latent factors and large cross-sections (Chapters 31–34)

Kelly, Pruitt & Su (2018) write $r_{i,t+1}$ for an excess return; here it is $R^e_{i,t+1}$, because $r$ is a log return.
Giglio & Xiu (2021) write $v_t$, $u_t$ and $\gamma$ for the latent factors, the residuals and their premia, and $\hat p$ for the
number of principal components; here they are $f_t$, $\varepsilon_t$, $\lambda$ and $K$, because $v_t$ and $u_t$ are a second
equation's shocks and $\gamma$ is risk aversion.

| Symbol | Macro | Meaning |
|---|---|---|
| $z_{it}$, $Z_t$ | — | Characteristics of firm $i$ known at $t$ (Chapter 32): a $\dim z$-vector with the constant 1 first, each other entry rank-transformed across firms every month to $[-0.5, 0.5]$. $Z_t$ is the $N \times \dim z$ matrix whose row $i$ is $z_{it}'$. No comma between $i$ and $t$, as in $\beta_{it}$. The firm index separates it from the state variable $z_t$ of Part V and the human-capital gap $z_t$ of Chapter 14, which never carry one |
| $\dim z$ | — | Number of characteristics, the constant included (Chapter 32). The paper writes $L$; here $L$ counts Newey–West lags and is the eigenvalue matrix of $\Sigma = QLQ'$. Compare $\dim g$ in Part VI |
| $\Gamma_\beta$, $\Gamma_\alpha$ | — | The $\dim z \times K$ matrix and the $\dim z$-vector that map characteristics to betas and alphas: $\beta_{it} = \Gamma_\beta'z_{it}$, $\alpha_{it} = z_{it}'\Gamma_\alpha$ (Chapter 32). Upper-case and always with its subscript, so it never reads as risk aversion $\gamma$. $\Gamma_\alpha$ is not itself a pricing error, so it takes no macro |
| $R^Z_{t+1}$ | `\Ret` | Returns on the $\dim z$ characteristic-managed portfolios, $R^Z_{t+1} = Z_t'R^e_{t+1}$ (Chapter 32): entry $l$ weights each firm's excess return by its $l$-th characteristic, with no division by $N$. The paper writes $x_{t+1}$; here $x_t$ is a predictor. The superscript $Z$ names the weights, as $e$ and $f$ do in $R^e$ and $R^f$ |
| $Z_t'Z_t$ | — | The $\dim z \times \dim z$ cross-product of the characteristics, always written out (Chapter 32). The paper writes $W_t$; here $W$ is a GMM weighting matrix and $W_t$ is total wealth (Chapter 14) |
| $W_\alpha$ | — | Statistic of the test of $\Gamma_\alpha = 0$, $W_\alpha = \hat\Gamma_\alpha'\hat\Gamma_\alpha$, with a $p$-value from a wild bootstrap of the managed-portfolio residuals (Chapter 32). It always keeps its subscript, as $\delta_{\text{HJ}}$ does, so it never reads as the weighting matrix $W$ or wealth $W_t$ |
| $R^2_{\text{total}}$, $R^2_{\text{pred}}$ | — | Total and predictive $R^2$ of an IPCA fit over all firms and months (Chapter 32): one minus the sum of squared residuals over $\sum_{i,t}(R^e_{i,t+1})^2$, a raw sum that is not demeaned. The total fit uses $z_{it}'(\hat\Gamma_\alpha + \hat\Gamma_\beta\hat f_{t+1})$, the predictive fit $z_{it}'(\hat\Gamma_\alpha + \hat\Gamma_\beta\hat\lambda)$ with $\hat\lambda$ the factor means. Not $R^2_{OS}$, $R^2_{CV}$, $R^2_{\text{OLS}}$ or $R^2_{\text{GLS}}$ |
| $H$ | — | Invertible $K \times K$ rotation of latent factors (Chapters 31 and 34): $(\beta, f_t) \to (\beta H^{-1}, H f_t)$ leaves the fit $\beta f_t$ unchanged. Giglio & Xiu (2021) use the same letter. Not $Q$, the orthonormal eigenvectors, because $H$ need not be orthogonal, nor the angle $\omega$ of Chapter 6, which turns one plane only. An upright $\text{H}$ is the high-B/M sort letter, as in $\text{HML}$ and $v_{\text{H},t}$ |
| $\mathit{cc}_k$ | — | $k$-th canonical correlation of two blocks of series (Chapter 31), $1 \ge \mathit{cc}_1 \ge \dots \ge \mathit{cc}_{\min(K_X, K_Y)} \ge 0$: the highest $\operatorname{corr}(Xw^X, Yw^Y)$ among combinations uncorrelated with the first $k - 1$ pairs. No rotation of either block changes it. Not the textbook $\rho_k$: $\rho$ is the Campbell–Shiller constant, and a correlation is never $\rho$. Italic letters, as in $\mathit{cw}_t$ |
| $w^X_k$, $w^Y_k$ | — | Canonical weights (Chapter 31): the combinations $Xw^X_k$ and $Yw^Y_k$ have unit variance and correlation $\mathit{cc}_k$. Not the textbook $a_k$, $b_k$, which here are a first-pass intercept and SDF loadings. The superscript names the block, so they never read as portfolio weights $w$, which have none, or as log wealth $w_t$ |
| $X$, $Y$; $K_X$, $K_Y$ | — | The two blocks of series that canonical correlations compare (Chapter 31), $T \times K_X$ and $T \times K_Y$, such as the first three PCs and Mkt-RF, SMB, HML. $X$ never carries a date, so it is not the payoff $X_{t+1}$. $K$ with a block subscript counts that block's series, as bare $K$ counts factors |
| $\hat\xi_{t+1}$ | — | Slopes of the cross-sectional regression of $R^e_{t+1}$ on the characteristics known at $t$, $\hat\xi_{t+1} = (Z_t'Z_t)^{-1}Z_t'R^e_{t+1}$ (Chapter 33). Each entry is the return of a portfolio whose weights are a row of $(Z_t'Z_t)^{-1}Z_t'$. The curriculum writes $\hat\gamma_t$; $\gamma$ is risk aversion. Not $c$, which is log consumption, nor $g$, since Chapter 24 writes the moment at $t$ as $g_t$. Dated $t+1$, as the return is |
| $a$, $w$, $\varepsilon_t$ (mimicking) | — | Projection of a factor on the excess returns of base assets by OLS, $f_t = a + w'R^e_t + \varepsilon_t$ (Chapter 33); $w'R^e_t$ is the mimicking portfolio's return. $a$ is an intercept, as in every time-series regression here; the curriculum writes $c$, which is log consumption, the very series projected in Chapter 33. $w$ is the portfolio weights of §3; on excess returns they need not sum to one. $\varepsilon_t$ is the residual; the curriculum writes $e_t$, the residual of a 2×3 portfolio in Chapter 19 |
| $\chi_t$ | `\Factor` | An observed factor whose premium Chapter 34 estimates, traded (Mkt-RF) or not (a macro series), with $\chi_t = a + \beta_\chi'f_t + \varepsilon_{\chi,t}$ for the latent factors $f_t$: a time-series regression, so its intercept is $a$, where the curriculum writes $\xi$. One series: each observed factor is estimated on its own. Giglio & Xiu (2021) write $g_t$, the moment at $t$ in Chapter 24; the curriculum's $\xi$ is the slopes $\hat\xi_{t+1}$ of Chapter 33. Not the $\chi^2$ distribution, which always carries its square and degrees of freedom |
| $\beta_\chi$ | — | $K$-vector of loadings of $\chi_t$ on the latent factors (Chapter 34), the slopes of its time-series regression on them. A loading is an exposure, so it is a $\beta$; the subscript $\chi$ separates it from an asset's $\beta_i$. The paper and the curriculum write $\eta$, the intercept of a conditional SDF in Chapter 22 |
| $\varepsilon_{\chi,t}$ | `\Err` | Measurement error of $\chi_t$, uncorrelated with $f_t$ (Chapter 34): the part of the observed factor that no latent factor explains. The paper and the curriculum write $z_t$, the state variable of Chapters 22–23. Not $u_t$, a second equation's shock, which the paper uses for the returns' residuals |
| $\lambda_\chi$ | — | Risk premium of $\chi_t$, $\lambda_\chi = \beta_\chi'\lambda$ (Chapter 34): the mean excess return of a portfolio with beta 1 on $\chi_t$ and 0 on every other factor, priced as an asset's $\mathbb{E}[R^e_i] = \beta_i'\lambda$. No rotation $H$ changes it. The paper writes $\gamma_g$; $\gamma$ is risk aversion. The subscript is the letter $\chi$, never the zero-beta rate's $0$ in $\lambda_0$ |

### Bonds and the term structure

| Symbol | Macro | Meaning |
|---|---|---|
| $n$ | — | Maturity in periods. It always appears as a superscript in parentheses |
| $P^{(n)}_t$, $p^{(n)}_t$ | — | Price of a zero-coupon bond paying 1 in $n$ periods, and its log. The superscript separates it from a stock price $p_t$ |
| $y^{(n)}_t$ | — | Log yield, $y^{(n)}_t = -p^{(n)}_t/n$. The short rate is $y^{(1)}_t = r^f_t$ |
| $f^{(n)}_t$ | — | Log forward rate, $f^{(n)}_t = p^{(n-1)}_t - p^{(n)}_t$. It always carries its maturity superscript, so it never looks like a factor $f_t$ |
| $rx^{(n)}_{t+1}$ | `\Ret` | Log excess return of holding the $n$-period bond for one period: $p^{(n-1)}_{t+1} - p^{(n)}_t - y^{(1)}_t$ |

### Probability and statistics

| Symbol | Macro | Meaning |
|---|---|---|
| $\mathbb{P}$, $\mathbb{Q}$ | — | Real-world and risk-neutral probability measures |
| $\pi(s)$ | `\Prob` | Probability of state $s$. Use $\pi$, not $p$, which is a log price |
| $\Phi(\cdot)$, $\varphi(\cdot)$ | — | Standard normal CDF and PDF, always written with their argument. $N$ is a count, never the normal CDF |
| $\ell_k$ | — | $k$-th eigenvalue in principal components. Not $\lambda_k$, which is a risk premium |
| $Q$, $q_k$; $L$ | — | Eigendecomposition $\Sigma = QLQ'$ (Chapters 6 and 30): the orthonormal eigenvectors $q_k$ are the columns of $Q$, and $L$ is the diagonal matrix of the eigenvalues $\ell_k$. This $L$ always stands next to $Q$, so it never reads as the lag count $L$ of $\hat S$ or the entropy $L(X)$ |
| $\theta$, $\theta_0$, $\hat\theta$ | — | Parameter vector of a GMM estimator (Part VI), its true value and its estimate, with moments $g_T(\theta)$ and statistic $J = T\,g_T(\hat\theta)'\hat S^{-1}g_T(\hat\theta)$, compared with $\chi^2_{\dim g - \dim\theta}$ |
| $\operatorname{Var}$, $\operatorname{Cov}$, $\operatorname{corr}$ | — | Variance, covariance and correlation |

Conventions:
- Time runs in periods $t$. Monthly data is the default. Report means and volatilities annualised, in percent:
  multiply a monthly mean by 12 and a monthly volatility by $\sqrt{12}$. Say so in every readout.
- A random variable dated $t+1$ is not known at $t$. A quantity dated $t$, like $R^f_t$ or $x_t$, is known at
  $t$.
- Vectors are columns. $'$ is the transpose. $\mathbf{1}$ is a vector of ones.
- A symbol may be reused inside one chapter only if this table lists the reuse and the chapter says so in
  words where it first appears.

## 4. Colour semantics

Each quantity keeps the same colour in plots, in TeX, and in prose highlights. These are the **only** semantic
colours. For anything else, use the neutral palette. Every colour reaches at least 4.5:1 contrast against both
the page and the plot background in its theme.

| Role | Examples | Token | Macro | Dark theme | Light theme |
|---|---|---|---|---|---|
| Return | $R$, $r$, $R^e$, $rx^{(n)}$ | `--c-return` | `\Ret` | `#58C4DD` | `#1A6D8C` |
| Risk-free rate | $R^f$, $r^f$ | `--c-rf` | `\Rf` | `#FF862F` | `#A5500F` |
| Factor | $f_t$, $f_{k,t}$ | `--c-factor` | `\Factor` | `#B189C6` | `#7A4E94` |
| Stochastic discount factor | $M$, $m$ | `--c-sdf` | `\SDF` | `#F4D345` | `#7F6608` |
| Predictor / signal | $x_t$, $dp_t$ | `--c-signal` | `\Signal` | `#5CD0B3` | `#17705C` |
| Data (observed) | $\bar R^e_i$, a sample moment | `--c-data` | `\Data` | `#7C9BFF` | `#2F55C8` |
| Model (fitted) | $\hat\beta_i'\hat\lambda$, a fitted line | `--c-model` | `\Model` | `#F27BC4` | `#B02D7E` |
| Error / residual | $\alpha$, $\varepsilon$ | `--c-error` | `\Err` | `#FC6255` | `#C0392B` |
| Probability / density | $\pi(s)$, a density | `--c-prob` | `\Prob` | `#D7D7D7` (filled at 25% opacity) | `#555555` |

Data and model form a pair. Use them when the point of a plot is the fit, as in "average returns against
model-predicted returns": observed points in `--c-data`, the fitted line or points in `--c-model`, and the gaps
between them in `--c-error`. When a plot shows one kind of quantity, colour it by what it is (a return is
`--c-return`), not by where it came from.

Interface colours are for chrome only (links, focus rings, buttons, callouts, quiz feedback). They never mark
a quantity in a plot or formula:

| Token | Use | Value |
|---|---|---|
| `--ui-accent` | Links, focus rings, active controls | same as `--c-return` |
| `--ui-highlight` | Eyebrows, Part numerals, key callouts | same as `--c-sdf` |
| `--ui-good` | Right answers, gains in readouts (`.good`) | `#83C167` / `#36702A` |
| `--ui-bad` | Wrong answers, losses in readouts (`.bad`) | same as `--c-error` |

Always pair `.good` and `.bad` with a sign or a word ("+2.1%", "rejected") so colour is never the only cue.

Neutral palette: background `#0F1117` (dark) / `#FAFAF7` (light), text `#E8E6E3` / `#1A1A1A`, axes in the text colour
at 45–50% opacity and grid lines at 8–10%. All tokens live in `src/styles/theme.css`, and Mafs's named
colours map onto the semantic ones there.

In TeX, use the KaTeX macros from `src/lib/katexMacros.ts`. Don't use raw `\color{}`:

```tex
\Ret{R^e_{i,t+1}}, \Rf{R^f_t}, \Factor{f_t}, \SDF{M_{t+1}}, \Signal{dp_t}, \Data{\bar R^e_i}, \Model{\hat\beta_i'\hat\lambda}, \Err{\alpha_i}, \Prob{\pi(s)}
```

Colour a term only where it helps the reader match the formula to a plot. A formula where every symbol is
coloured is just as hard to read as one with no colour at all.

## 5. Widgets

- **Every widget works without explanation.** Label the axes with units, and show the current value next to
  every slider.
- **Real data where it exists.** A widget that shows a historical fact loads the JSON built by the data
  pipeline through its typed loader, never a hand-copied number. Its caption names the dataset ID from
  `docs/DATA.md` and the sample period.
- **Simulated widgets start at the default example**, unless the chapter's point needs something else:
  monthly data; a market excess return with mean 0.5% (6% a year) and volatility 4.5% (about 16% a year);
  $R^f = 0.25\%$ (3% a year); $T = 600$ months, $N = 25$ test assets, $K = 3$ factors; $\gamma = 5$ and
  $\delta = 0.99$ a year; an AR(1) predictor with $\phi = 0.98$ a month.
- **Widgets compute; they don't hard-code answers.** All math (estimators, test statistics, model moments)
  comes from `src/lib/`, which is unit-tested. Never re-implement a formula inside a component.
- **Sliders have sensible ranges:** $T \in [60, 1200]$ months; $N \in [2, 100]$; $K \in [1, 6]$;
  $\gamma \in [0, 50]$; $\delta \in [0.9, 1]$; $\phi \in [0, 0.999]$; correlations in $[-0.99, 0.99]$.
- **Randomness is seeded.** Simulations use `src/lib/math/rng.ts`, take a seed and offer a "re-roll" button,
  so a figure the text describes looks the same on every load.
- **Motion has a purpose.** Animate a transition only when the change between states is the thing to learn,
  like a sampling distribution narrowing as $T$ grows. Respect `prefers-reduced-motion`.
- **Build on the shared parts.** Use `PlotFrame` (axes at the plot edges, `Label` for text) and `WidgetFrame`
  (title, plot, controls, readout, caption), the shared `Slider`, `Segmented`, `Select` and `Button` controls,
  and `useTweened` from `animation.ts`. Colour with the CSS variables in §4, never with hex codes.
- **Accessibility:** colour is never the only cue (also use line style, marker shape or a label), widgets work
  by keyboard, each figure has an `aria-label` that summarises what it shows, and touch targets are at least
  44px.
- **Phone layout:** every widget works at 360px width. Stack the controls below the plot instead of beside it.
- **Performance:** load widgets with `client:visible`, and lazy-load heavy libraries only in the chapters that
  use them.

### Writing widgets into a chapter

```mdx
import SamplingErrorMean from '../../components/plots/SamplingErrorMean';
import Callout from '../../components/ui/Callout.astro';
import { Quiz, NumericQuiz } from '../../components/ui/Quiz';

<SamplingErrorMean client:visible initialT={600} title="How precise is the equity premium?" />

<p class="try-this"><strong>Try this:</strong> cut the sample to 10 years...</p>

<Callout type="key">The one idea to remember.</Callout>
```

- Put a short "Try this" prompt after each widget, telling the reader what to do with it.
- In MDX, write a literal dollar sign as `\$`, because `$…$` is math. Never write `\$` inside math.

## 6. Quizzes

- Mostly multiple choice. Use a numeric answer with a tolerance when computing something is the point.
- Each question tests one idea from the chapter. Avoid trick questions.
- Every answer, right or wrong, shows a 1–3 sentence explanation.

## 7. References

End each chapter with a short **Further reading** list of the papers and book chapters it builds on, in the
short form used by `docs/CURRICULUM.md` (for example Campbell (2018), Ch. 1; Cochrane (2005), Ch. 12; Fama and
MacBeth (1973)). Cite every paper whose result the chapter shows.
