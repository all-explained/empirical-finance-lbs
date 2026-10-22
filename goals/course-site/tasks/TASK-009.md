---
id: TASK-009
title: Add the widget click-through script
milestone: M-2
state: approved
depends_on: []
delivery: pr
route: {platform: codex, model: gpt-6.1-sol, effort: high}
---

## Why

SC-5. Both reference chapters need their widgets checked by a real click-through of every control. options-explained wrote one script per chapter; this course writes one shared script, so later chapters reuse it.

## Scope

Add `scripts/clickthrough.mjs` and the npm script `clickthrough` in `package.json` (`node scripts/clickthrough.mjs`). Usage, as for `screenshots`: `npm run clickthrough` checks every chapter page in `dist/`; `npm run clickthrough -- 09-time` checks only pages whose path contains `09-time`. It needs `npm run build` first, like `scripts/screenshots.mjs`.

Move the preview-server code that `scripts/screenshots.mjs` already has (start `astro preview`, wait for the server, launch Chromium, stop the server) into one shared module, `scripts/lib/preview.mjs`. Both scripts import it. Do not copy the code. Change `screenshots.mjs` only as far as this move needs, and its behaviour must stay the same.

For each `figure.widget` on a page, the script drives every control built from `src/components/ui/controls.tsx`:
- Slider (`input[type=range]`): set the minimum, the maximum and a middle value, with a real `input` event each time.
- Segmented control: click every option.
- Select: choose every option.
- Button: click it.

After every action the script waits for the next animation frame and checks four things: no console error or page error, no KaTeX error element, no horizontal overflow of the page, and a non-empty `.widget-readout` where the widget has one. At the end it prints one line per widget: the chapter, the widget title and the number of actions. It exits 1 and names the chapter, widget, control and action at the first failure. When `dist/chapters/` has no chapter page, it prints `no chapter pages to check` and exits 0.

Run each widget at desktop width and at 360px width.

Out of scope: chapters, widgets, library code, and any change to the screenshots output.

## Acceptance

- `npm run clickthrough` exits 0 and prints `no chapter pages to check` while the site has no chapter page.
- Against a temporary chapter page that holds one widget with a slider, a segmented control, a select and a button, the script exits 0 and reports each control. Remove that page before you commit.
- Against a temporary widget that throws a console error when its slider reaches the maximum, the script exits 1 and names the widget and the control. Remove that widget before you commit.
- `npm run screenshots` still exits 0 and writes the same four home-page images.
- `git status --short` shows only the intended files: `scripts/clickthrough.mjs`, `scripts/lib/preview.mjs`, `scripts/screenshots.mjs`, `package.json`, and this task's outcome file.

## Verify

```sh
npm ci
npm test
npm run build
npm run clickthrough
npm run screenshots
git status --short
```

Show the output of the two temporary-page runs in the outcome.
