---
id: TASK-080
title: Part III fixes from the read-through
milestone: M-5
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-7 and M-5. The orchestrator's read-through of chapters 13–15 listed seven small changes. They must land before later Parts copy the Part III pattern. TASK-060 stays open until this task is merged.

## Scope

Make exactly these changes. Prose and docs only: change no widget behaviour and no library maths.

1. `src/content/chapters/14-consumption-wealth-ratio.mdx` (hook): change "from 1952 to 2025" to "1952-Q1 to 2026-Q2", so it matches the sample the chapter and its widget use. Check the number against `src/lib/data/series.ts` output or the existing `tests/chapter14-numbers.test.ts`.
2. `src/content/chapters/13-out-of-sample-predictability.mdx` (hook and recap): replace the raw dataset id "goyal-welch-annual" with "Goyal and Welch's annual data" plus its sample years read from the data. Dataset ids stay in widget captions only.
3. Chapter 14, same file: remove the symbol clashes. `a_t` (log asset wealth) clashes with the predictive intercept `a`; `β_a, β_y` clash with §3, where β is only an exposure; `w_t` (log wealth) clashes with `w` for portfolio weights. Rename the cointegrating weights (for example `θ_a, θ_y`) and the log-asset-wealth symbol, in the chapter, its widget labels (`CointegrationDemo.tsx`, `CayLookAhead.tsx`) and `tests/chapter14-numbers.test.ts` text, and say in words where `w_t` is log wealth. Add each new or reused symbol to `docs/STYLE_GUIDE.md` §3 in the same PR. Keep the KaTeX macro check green.
4. `docs/STYLE_GUIDE.md` §3: add a "Part III" block for `R²_OS`, `CSED`, `cw_t`/`CW`, `T_OS`, `ū`, `cay`, `ω`, `ρ_w`, `h_t`, `z_t`, `W_t`, `π*`, `𝔼*`, `Var*`, `τ`, `F_t`, `call_t`/`put_t`, `SVIX`, `VIX`, `L`/`L*`, as the chapters 13–15 use them. Note that `K` is a strike in chapter 15 and that the Prob colour token colours `π*`. Do this together with item 3, and leave other symbols alone.
5. `src/content/chapters/15-expected-returns-from-option-prices.mdx` (Step 3): name the covariance pair `A = M(1+R)` and `B = 1+R` instead of `X` and `Y`, because `X` is the payoff in Steps 1 and 6.
6. Naming: `src/content/chapters/09-time-varying-expected-returns.mdx` line 261, change "Welch and Goyal (2008)" to "Goyal & Welch (2008)" (write `&` as chapters 13 and 14 do). In chapter 14, change "Stock and Watson (1993)" and "Campbell and Mankiw (1989)" to the `&` form.
7. Links: link "Chapter 14" in the chapter 13 "Next up"; in chapter 15 link "Chapter 9" in the hook and "Chapter 16" in "Next up".

Out of scope: every other chapter, widget behaviour and library maths.

## Acceptance

- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings. If a slow test times out under machine load, rerun with `npx vitest run --testTimeout=60000` and report both results.
- `npm run screenshots` and `npm run clickthrough` pass for `13-out-of-sample`, `14-consumption`, `15-expected-returns` and `09-time-varying`.
- `grep -n "goyal-welch-annual" src/content/chapters/13-out-of-sample-predictability.mdx` prints nothing in prose.
- `grep -rn "Welch and Goyal" src/content/chapters` prints nothing.
- `git diff --name-only origin/main` lists only files named in this scope and this task's outcome file.

## Verify

npm ci
npm test
npm run build
npm run screenshots -- 13-out-of-sample
npm run screenshots -- 14-consumption
npm run screenshots -- 15-expected-returns
npm run screenshots -- 09-time-varying
npm run clickthrough -- 13-out-of-sample
npm run clickthrough -- 14-consumption
npm run clickthrough -- 15-expected-returns
grep -rn "Welch and Goyal" src/content/chapters
git diff --name-only origin/main
