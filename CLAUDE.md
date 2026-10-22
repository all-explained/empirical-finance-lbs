# Empirical Finance, Explained

An interactive, visual course on empirical asset pricing, in English, from first principles to PhD level.

## Read first

- `goals/course-site/README.md` describes the goal and worker protocol.
- `docs/CURRICULUM.md` and `docs/STYLE_GUIDE.md` will define the curriculum, notation and style in later tasks.
- Reference chapters will follow in later tasks. Do not copy private course material into the site.

## Stack

Astro 7 (static, `base: /empirical-finance-lbs`) + MDX + KaTeX via `remark-math`/`rehype-katex`
in `astro.config.mjs` + React 18 islands with Mafs + Vitest. Deployed to GitHub Pages.
The scaffold is adapted from `all-explained/options-explained`.

## Commands

- `npm ci`: install the locked dependencies.
- `npm run dev`: start the development server.
- `npm test`: unit tests for the generic math helpers in `src/lib`.
- `npm run build`: `astro check` plus the static build.
- `npm run screenshots [filter]`: after a build, capture both themes at desktop and phone sizes.
  Fail on console errors, KaTeX errors or horizontal overflow.

## Rules

- Keep each task in its own branch and PR. Never merge from a worker session.
- Chapters live in `src/content/chapters/NN-slug.mdx`, with title, part, chapter, difficulty,
  prerequisites and summary in frontmatter. Keep `src/data/curriculum.ts` in sync with the curriculum.
  Its `parts` list stays empty until TASK-005.
- Follow the chapter template: Hook → Intuition → Formalisation → Playground → Check yourself →
  Recap & next up. Start each `##` heading with `<span class="section-tag">Hook</span>` (etc.).
- Use the shared colour tokens and KaTeX macros in `src/lib/katexMacros.ts`.
  TASK-003 will define the course notation and colour semantics. Do not invent them in this scaffold.
- `$…$` is math. Write literal dollars as `\$` in MDX prose. In widget and quiz strings,
  `RichText` uses the same rule: `"\$5"` in an attribute or `"\\$5"` inside a JavaScript string.
  Do not put `\$` inside math.
- All math lives in `src/lib/`, with Vitest tests against reference values.
  Components import formulas and never repeat them.
- Build widgets on `PlotFrame` (axes at plot edges) and `WidgetFrame` (title, plot, controls,
  readout, caption). Use `Label` from `PlotFrame` instead of Mafs `<Text>` for reliable offsets.
- Use shared `Slider`, `Segmented`, `Select` and `Button` controls. Use `useTweened` from
  `animation.ts` for transitions. Use CSS variables for colours and hydrate with `client:visible`.
- Reuse generic shared components before adding new ones.
- Seed every simulation with the helpers in `src/lib/math/rng.ts`.
  Respect `prefers-reduced-motion`. Widgets must work at 360px width.
- Keep `source/` ignored. Never commit private PDFs or copy their text verbatim.
- Code is MIT licensed. Original course content is CC BY 4.0.

## Verify before pushing

- Run `npm test`, `npm run build` and `npm run screenshots`.
- Inspect screenshots in both themes at desktop and phone sizes for every changed page.
- Check new widget controls and readouts with Playwright.
- Follow the style guide once it exists. Keep the scaffold free of topic-specific widgets and chapters.
- Use local verification. Do not run, read or wait for GitHub Actions.

## Gotchas

- Run Astro preview directly through `node_modules/astro/bin/astro.mjs`, with `--ignore-lock`,
  so the screenshot script can stop its server.
- Mafs mounts in the browser. `WidgetFrame` reserves plot height before hydration.
