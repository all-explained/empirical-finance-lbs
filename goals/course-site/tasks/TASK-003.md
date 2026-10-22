---
id: TASK-003
title: Write the style guide, notation macros and colour tokens
milestone: M-1
state: approved
depends_on: [TASK-001]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-3. Every chapter and widget follows the style guide, its notation and its colours.

## Scope

Write `docs/STYLE_GUIDE.md`, adapted from `~/GitHub/options-explained/docs/STYLE_GUIDE.md`:
- Keep the voice section and the chapter template (Hook → Intuition → Formalisation → Playground → Check yourself → Recap & next up) and the widget rules.
- Replace the notation table with one for empirical asset pricing: gross, log and excess returns, the risk-free rate, the SDF, betas, risk premia, pricing errors (alpha), factors, the dividend–price ratio and the Campbell–Shiller terms, yields and forward rates, consumption growth, risk aversion and time discount, sample size T, number of assets N, number of factors K. Resolve clashes explicitly (for example the time-discount factor and a regression beta must not share a symbol).
- Replace the colour semantics with this course's roles. A starting set: return, risk-free rate, factor, SDF, predictor/signal, data (observed) vs model (fitted), error/residual, probability. Each role gets one CSS variable.

Implement them:
- Colour tokens in `src/styles/theme.css` (and wherever options-explained defines them) for both light and dark themes, with readable contrast. Remove the option-only tokens.
- One KaTeX macro per coloured symbol in `src/lib/katexMacros.ts`. Remove the option-only macros.
- A Vitest test that reads the notation table in `docs/STYLE_GUIDE.md` and fails if a macro it names is missing from `katexMacros.ts`.

Out of scope: chapters, curriculum, data.

## Acceptance

- `docs/STYLE_GUIDE.md` has voice, template, notation, colour and widget sections for this course.
- `npm test` passes, including the notation-vs-macros test.
- `npm run build` and `npm run screenshots` pass.
- `grep -rnE '\\(Call|Put|Strike|Spot)\b' src docs` prints nothing.

## Verify

```sh
npm test
npm run build
npm run screenshots
grep -rnE '\\(Call|Put|Strike|Spot)\b' src docs || echo "no option macros"
```
