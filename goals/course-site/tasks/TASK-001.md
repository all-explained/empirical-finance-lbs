---
id: TASK-001
title: Scaffold the site from the options-explained stack
milestone: M-1
state: approved
depends_on: []
delivery: pr
---

## Why

SC-1 and SC-6. Every other task builds on this site skeleton.

## Scope

Create the site by copying the stack of `options-explained`. Read it at `~/GitHub/options-explained` (local, read only). `~/GitHub/economia-financiera` did the same copy before and is a second example.

Copy and adapt:
- `package.json` and `package-lock.json` (name `empirical-finance-lbs`), `tsconfig.json`, `astro.config.mjs` (`site: 'https://all-explained.github.io'`, `base: '/empirical-finance-lbs'`), `src/content.config.ts`.
- `src/layouts/BaseLayout.astro`, `src/components/layout/*`, `src/components/ui/*` (`WidgetFrame`, `controls`, `Quiz`, `Tex`, `Callout`, `RichText` if it exists), and the generic plot helpers (`PlotFrame`, `useTweened`, `animation.ts`, `format.ts`).
- `src/styles/*`, `src/lib/katexMacros.ts`, `src/lib/rehypeMathPunctuation.mjs`, `src/pages/index.astro`, `src/pages/chapters/*`.
- `scripts/screenshots.mjs`, `.github/workflows/ci.yml`, `LICENSE` (MIT), `LICENSE-CONTENT.md` (CC BY 4.0).
- `CLAUDE.md`, rewritten for this course (title "Empirical Finance, Explained"). Keep its rules on the chapter template, `src/lib` for all maths, widgets, seeding and verification.

Remove everything that is about options: chapters, option widgets, `src/lib` pricing modules and their tests, option macros. Keep the colour tokens and macros as they are for now; TASK-003 replaces them.

`src/data/curriculum.ts` keeps its `PartInfo` shape but holds an empty `parts` list; TASK-005 fills it. The index page must build with no chapters.

Keep `source/` in `.gitignore`. It holds a private PDF and must never be committed.

Out of scope: curriculum, style guide, notation, colour changes, data.

## Acceptance

- `npm test` passes (keep the tests of the generic helpers you copied).
- `npm run build` passes.
- `npm run screenshots` passes: no console, KaTeX or overflow errors.
- `grep -rniE "black.?scholes|PayoffDiagram|strike" src scripts` prints nothing.
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0.

## Verify

```sh
npm ci
npm test
npm run build
npm run screenshots
grep -rniE "black.?scholes|PayoffDiagram|strike" src scripts || echo "no option leftovers"
git ls-files | grep -ciE '\.pdf$|^source/'
```
