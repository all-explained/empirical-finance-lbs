---
id: TASK-159
title: 'Library: Gaussian affine term structure models, bond pricing recursions, risk-neutral yields and the term premium'
milestone: M-14
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-14. Part XII prices bonds from a state that follows a VAR, a short rate linear in the state and prices of risk linear in the state. All four chapters use the recursions for $A_n$ and $B_n$: chapter 43 drags a model's state and prices of risk, chapter 44 feeds estimated parameters into them, chapter 45 inverts them to recover the state from yields, and chapter 46 reads its spreads against the term structure. `src/lib` has VAR(1) estimation (`fitVAR1`) and bond arithmetic (`bonds.ts`) but no model that prices bonds. Needs no data task, so it starts at once.

## Scope


Add `src/lib/finance/affine.ts` and `src/lib/finance/affine.test.ts`. Read first: the entries of chapters 43–46 in `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md` §3 (the "Bonds and the term structure" table, the predictability table with $\phi$, $\mu_x$, $v_{t+1}$ and the VAR matrix $A$, the Returns and prices table with $\mu$ and $\Sigma$, and the SDF table), `src/lib/stats/var.ts` (`fitVAR1`, `forecastVAR1`), `src/lib/finance/bonds.ts` (`YieldCurve`, `logPrices`, `forwardRates`), `src/lib/math/linalg.ts` and `src/lib/math/rng.ts`.

Readings. Open with `pdftotext -layout` and cite pages in doc comments for anything you take from it: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/AdrianCrumpMoench2013.pdf` (New York Fed Staff Report 340, revised April 2013; cite the 2013 *Journal of Financial Economics* article and name working-paper pdf pages; printed page = pdf page − 2): the VAR of the state, eqs. (1)–(2), pdf p. 6; the exponentially affine pricing kernel and the prices of risk, eqs. (4)–(5), pdf p. 7; the expected excess return, eqs. (8)–(10), pdf p. 7; the affine yields and the recursions, eqs. (21)–(27), pdf p. 11; $\beta^{(n)\prime} = B_n'$, eq. (28), the role of $\sigma^2$, and the risk-neutral parameters $A^{RF}_n$, $B^{RF}_n$ with $\lambda_0 = \lambda_1 = 0$, pdf p. 12. Campbell, Lo & MacKinlay (1997), Ch. 11, is a book that is not in `source/papers/` (see `docs/READINGS.md`): take no fact from it.

Units and parameter form. One period is one month; rates are decimal log rates per month, and the functions that return yields annualise by 12 (say so in each doc comment). Write the model once, in Adrian, Crump & Moench's form: $X_{t+1} = \mu + \Phi X_t + v_{t+1}$ with $v_{t+1} \sim N(0, \Sigma)$, the short rate $\delta_0 + \delta_1'X_t$, and prices of risk $\lambda_0 + \lambda_1 X_t$ that enter the recursions as $\mu - \lambda_0$ and $\Phi - \lambda_1$. The curriculum's Key math writes $X_{t+1} = \mu + \Phi X_t + \Sigma\varepsilon_{t+1}$ and the recursions with $\Sigma\lambda_0$ and $\Sigma\lambda_1$: derive in a doc comment that the two are the same model when the paper's $\lambda_0$, $\lambda_1$ equal the curriculum's times its $\Sigma$, and test it. Keep the optional $\tfrac12\sigma^2$ term of eq. (25) (default 0) and say what it is.

Functions:
- `affineLoadings(model, maxN)`: $A_n$ and $B_n$ for $n = 0, \dots, \mathit{maxN}$ from the recursions, with $A_0 = 0$, $B_0 = 0$, $A_1 = -\delta_0$, $B_1 = -\delta_1$; and the same with $\lambda_0 = \lambda_1 = 0$ (risk-neutral).
- `affineYields(model, X, maturities)`: log yields $-(A_n + B_n'X)/n$, annualised, for a state $X$; `riskNeutralYields` the same with the risk-neutral loadings, which equal the average expected short rate over the bond's life (derive why in a doc comment, as the paper states on pdf p. 12); `termPremium` the gap, $\mathit{tp}^{(n)}_t$ in §3's symbol.
- `expectedExcessReturn(model, X, n)`: the one-month expected log excess return of the $n$-month bond, from eqs. (10) and (28), with the convexity term.
- `simulateAffine(seed, model, months, options)`: a seeded path of the state, from its unconditional mean unless a start is given, with the yields, risk-neutral yields and term premia of chosen maturities on each date, and an option to add seeded i.i.d. measurement error to the yields (chapter 45 uses it).
- `oneFactorModel(params)` and `twoFactorModel(params)`: models for chapter 43's widget, set by readable parameters (the mean and monthly persistence of the short rate, its shock volatility, and the constant and slope of the price of risk; for two factors, a second factor that moves the slope of the curve, with its own persistence and correlation), each with a doc comment on what moving the parameter does to the curve. Give default parameters whose average curve on the annual grid is near the mean GSW curve of 1985-11 to 2026-09 (state the fit and the gap at 1, 5 and 10 years in the outcome; fit by hand or with `src/lib/math/optimize.ts`).
- `invertState(model, yields, maturities, Q)`: the state that the yields imply, $X_t = (Q'B)^{-1}(Q'y_t - Q'A)$ with $A$, $B$ stacked over the maturities and $Q$ a matrix of $K$ yield weights (for example the first $K$ principal-component loadings), when $Q'B$ is invertible; report its condition number, and return null when it is singular.

Notation. §3 already defines $\mathit{tp}^{(n)}_t$ ("the model term premium of Part XII"), $y^{(n)}_t$, $p^{(n)}_t$, $rx^{(n)}_{t+1}$, and reserves $A_n$ for the affine intercept (the $\bar\phi^{(n)}_y$ row). The papers' other symbols clash with §3: $X_t$ with the payoff $X_{t+1}$; $\Phi$ with the VAR matrix $A$ of Chapter 5 and `fitVAR1`; $\mu$ and $\Sigma$ with a return's mean and covariance (§3 asks other covariances to carry a subscript, as $\Sigma_\varepsilon$); $\delta_0$, $\delta_1$ with the time-discount factor $\delta$; $\lambda_0$, $\lambda_1$ with the factor risk premia $\lambda$, the conditional premium $\lambda_t$ of Chapters 22–23 and the zero-beta rate $\lambda_0$ of Chapter 17; $B_n$ with the beta matrix $B$; $e_{t+1}$ with the residual of a 2×3 portfolio in Chapter 19. Choose one symbol for each (for example a subscript $X$ on the VAR's mean and covariance, $\mu_X$ and $\Sigma_X$, as §3 does with $\mu_x$; keep $\Phi$ for the state's VAR and say in the row that Chapter 5's $A$ is the same object), add each to the "Bonds and the term structure" table of §3 with the clash it avoids and the paper's symbol, and use them in every doc comment. The other Part XII library tasks add rows to the same table; rebase on `origin/main` before you finish and keep every row. Keep the KaTeX macro check in `npm test` green.

Tests against reference values, each stated in the test: for a one-factor model, $A_n$ and $B_n$ match the closed form of a Gaussian AR(1) short rate (derive it in the test) to 1e-12; with $\lambda_0 = \lambda_1 = 0$ and $\Sigma \to 0$ every yield equals the average expected short rate and the term premium is 0; the paper's form and the curriculum's form give the same loadings to 1e-12; the risk-neutral yield equals the average of `forecastVAR1` short-rate forecasts to 1e-12; `expectedExcessReturn` equals $p^{(n-1)}$ expected next month minus $p^{(n)}$ minus the short rate, computed from the loadings, to 1e-12; `invertState` recovers the state of a simulated date to 1e-10 without measurement error; `simulateAffine` is reproducible from its seed; and the default parameters' average curve against the GSW mean at 1, 5 and 10 years within a stated gap. Reuse `forecastVAR1`, `matMul`, `inverse`, `solve` and the RNG helpers; do not copy them. Out of scope: estimation on data (the next library task), chapters, widgets, and edits to files other than those named.

Where jobs run: unit tests on small made-up data and the committed GSW file, seconds, on the MacBook.

## Acceptance


- Every exported function has a test against a reference value, and `npm test` passes, including the KaTeX macro check.
- `npm run build` passes (`astro check` reports 0 errors).
- The outcome states the derivation that maps the paper's prices of risk to the curriculum's, and the gap of the default parameters' average curve to the GSW mean at 1, 5 and 10 years.
- `docs/STYLE_GUIDE.md` §3 "Bonds and the term structure" has a row for each new symbol, and the outcome lists each with the clash it avoids.
- `git status --short` shows only `src/lib/finance/affine.ts`, its test, `docs/STYLE_GUIDE.md` and this task's outcome file.

## Verify


npm ci
npm test
npm run build
git status --short
