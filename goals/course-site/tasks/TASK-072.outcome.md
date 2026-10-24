# TASK-072 outcome

## Acceptance

- [x] Every exported function has a test against a reference value, and `npm test` passes.
  Evidence: `src/lib/finance/shortWindow.test.ts` has 17 tests. `npm test` reports 42 files and 463 tests passed.
  - `dailyFactorPanel`: row 1964-01-02 equals the raw percent cells divided by 100; a missing mom-daily date throws `RangeError`.
  - `rollingBetas`: two windows of three computed by hand (α = 3/2, β = 1/2; α = 4/3, β = 1).
  - `shortWindowRegressions`: one quarter by hand with its standard errors (α = 3/2, β = 1/2, SE(β) = √0.75, SE(α) = √1.25), a second quarter by hand (α = -0.5, β = 2.2), month/quarter/half/year labels, and exact recovery of the Dimson summed beta 1.7 under `lags`.
  - `conditionalAlphaSummary`: mean, standard error, t-statistic, σ(β̂) and implied σ(β) by hand.
  - `unconditionalAlpha`: two hand cases (beta moving with the premium; beta moving with market variance), and a seeded 200,000-month simulation (`normalRng(2006)`) where the OLS alpha is within 2e-4 of Eq. (3), about three standard errors.
  - `alphaBound`: the paper's examples by hand, 0.3 × 0.5% = 0.15% (p. 290) and 0.7 × 0.5% = 0.35% (Table 1, p. 295).
  - Pinned French values, below.
- [x] `npm run build` passes (`astro check` reports 0 errors). Evidence: exit 0, "0 errors", "Complete!".
- [x] `git status --short` shows only `src/lib/finance/shortWindow.ts`, its test and this outcome file. Evidence: the branch diff against `origin/main` has exactly these three files; `git status --short` is empty after the commit.

### Pinned values on the committed French data

Quarterly regressions on daily returns, 1964-01-02 to 2026-06-30, with the Dimson lags of Eq. (7), at least 40 days a quarter.
Alphas are daily alphas times 21, in decimal per month (p. 299). The unconditional CAPM alpha uses monthly data, 1964-01 to 2026-06 (750 months).
The bound uses the implied σ(β) and σ(λ) = 0.5% a month, the largest value in Table 1.

| Factor | Quarters | σ(β̂) | Implied σ(β) | Average conditional alpha | t | Unconditional alpha | Bound |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| HML | 250 | 0.3131 | 0.2674 | 0.324% | 2.72 | 0.380% | 0.134% |
| Mom | 250 | 0.5447 | 0.5059 | 0.842% | 6.18 | 0.711% | 0.253% |

These agree with the paper's message: the bound is well below both alphas. The implied σ(β) is close to the paper's 0.25 for V–G and 0.63 for W–L (Table 4, p. 303).

## Summary

Added `src/lib/finance/shortWindow.ts` with six exports: `dailyFactorPanel`, `rollingBetas`, `shortWindowRegressions`, `conditionalAlphaSummary`, `unconditionalAlpha` and `alphaBound`. All regressions reuse `ols`; the simulation uses `normalRng`. Doc comments cite Lewellen and Nagel (2006, JFE 82): short-window method pp. 296–297, Dimson lags Eq. (7) p. 298, alpha standard errors p. 302, implied beta volatility p. 303, Eqs. (1)–(3) p. 293, Eq. (4) p. 294, and the bound pp. 290 and 294. The paper's premium γ_t is written λ_t, as in the style guide.

Choices the paper leaves open:
- `lags` is a boolean. It selects the paper's daily Eq. (7). Lags at the start of a window use the previous trading days of the series, so only the first four days of the series drop out.
- `unconditionalAlpha(beta, premium, variance)` takes the paths of β_t, λ_t and σ²_t and uses moments with divisor T, so Eq. (3) is exact for the path. It also returns β^u (Eq. 2), Cov(β_t, λ_t) and Eq. (4).
- `conditionalAlphaSummary` returns σ(β̂) with divisor n - 1, and the implied σ of true betas (NaN when its variance is negative, as in Table 4 note c).
- `rollingBetas` returns arrays of length T with NaN before the first full window, so they align with the dates.

Verified revision: 2f9993e (implementation), on top of `origin/main` 4549013. Verify ran in this session: `npm ci`, `npm test`, `npm run build`, `git status --short`, each exit 0. GitHub Actions were not used.

Proposed follow-ups: none. Chapter 23 (TASK-077) can build `RollingBeta` on `rollingBetas` and `AlphaBound` on `alphaBound` and the pinned values above.
