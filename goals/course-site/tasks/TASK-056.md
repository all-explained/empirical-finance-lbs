---
id: TASK-056
title: 'Library: option strips, SVIX and the Martin lower bound'
milestone: M-5
state: approved
depends_on: []
delivery: pr
---

## Why

SC-7 and M-5. Chapter 15 needs option prices on a seeded smile, the strip of out-of-the-money options, the SVIX and VIX integrals, Martin's lower bound on the expected return and the entropy $L(X)$, in `src/lib`, with tests.

## Scope

Add `src/lib/finance/optionBound.ts` and `src/lib/finance/optionBound.test.ts`. Read first: the entry of chapter 15 in `docs/CURRICULUM.md`, the notation table in `docs/STYLE_GUIDE.md` §3 ($R^f$, $\mathbb{Q}$), `src/lib/math/normal.ts`, `src/lib/math/rng.ts` and `src/lib/finance/sdf.ts`. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Martin2017.pdf` (Martin (2017)) with `pdftotext -layout` and cite its pages in doc comments for the bound, the definition and scaling of $\mathrm{SVIX}^2$ (per period or annualised) and the link between VIX and entropy. Where the curriculum's Key math scales $\mathrm{SVIX}^2$ differently from the paper, follow the paper and report the gap in the outcome.

Functions (gross risk-free rate $R^f$ over the horizon $T$, no dividends):
- `blackScholes(kind, S, K, T, Rf, sigma)`: call or put price.
- `smileVolatility(k, { level, skew, curvature, floor })`: implied volatility as a function of log-moneyness $k = \log(K/F)$, and `seededSmile(seed, level)`: skew and curvature drawn from narrow, documented ranges with `mulberry32`.
- `optionStrip(S, Rf, T, smile, strikes)`: for each strike, the out-of-the-money price (put below the forward $F = S R^f$, call at or above it).
- `svixSquared(strip, S, Rf, T)`, `vixSquared(strip, S, Rf, T)` (the $1/K^2$-weighted strip), both by the trapezoid rule on the strike grid.
- `martinLowerBound(strip, S, Rf, T)`: the lower bound on $\mathbb{E}_t[R_T] - R^f$ that the strip implies.
- `entropy(values, probabilities)` = $\log \mathbb{E}[X] - \mathbb{E}[\log X]$.

Tests against reference values, each stated in the test: put–call parity at three strikes; Black–Scholes at one textbook point by hand; with a flat smile (lognormal), the strip gives the risk-neutral variance of $R_T$ in closed form, $(R^f)^2(e^{\sigma^2 T} - 1)$, to a stated relative tolerance, and `vixSquared` gives $\sigma^2$ to a stated tolerance; the bound rises with the level of volatility; a seeded smile is the same for the same seed; `entropy` of a two-point distribution by hand and of a lognormal sample ($\approx \sigma^2/2$). Reuse `cdf` from `src/lib/math/normal.ts` and `mulberry32` from `src/lib/math/rng.ts`; do not copy them. Out of scope: chapters, widgets, edits to docs or to code outside the files named.

## Acceptance

- Every exported function has a test against a reference value, and `npm test` passes.
- `npm run build` passes (`astro check` reports 0 errors).
- `git status --short` shows only `src/lib/finance/optionBound.ts`, its test and this task's outcome file.

## Verify

```sh
npm ci
npm test
npm run build
git status --short
```
