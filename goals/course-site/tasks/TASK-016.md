---
id: TASK-016
title: Fix the preview port and the click-through slider label
milestone: M-2
state: approved
depends_on: []
delivery: pr
route: {platform: codex, model: gpt-6.1-sol, effort: high}
---

## Why

SC-5. The widget check scripts must be safe to run in parallel worktrees and must print readable control names. Fixes the open issues all-explained/empirical-finance-lbs#15 and all-explained/empirical-finance-lbs#16, both found while reviewing TASK-013 and TASK-014.

## Scope

Change `scripts/lib/preview.mjs`, `scripts/clickthrough.mjs` and, only if the first change needs it, `scripts/screenshots.mjs`.

1. Port (#15). Today `scripts/lib/preview.mjs` uses the fixed port 4329. Pick a free port at start (listen on port 0 and read the port, or scan upward), pass it to `astro preview`, and build the base URL from it. Keep running Astro through `node_modules/astro/bin/astro.mjs` with `--ignore-lock`, so the script can stop its server. Fail loudly if the server that answers is not the one this run started.
2. Label (#16). `scripts/clickthrough.mjs` reads the KaTeX text of a control label, so the report prints `slider "Repeat the move kkk times"`. Read the label from `aria-label` when it exists. Otherwise read the visible text without the KaTeX MathML and annotation nodes. The report must print `Repeat the move k times` style names, one `k` per symbol.

Out of scope: chapters, widgets, library code, and any change to what the scripts check or to the screenshot images.

## Acceptance

- Two `npm run screenshots -- 01-returns` runs started at the same time, from two different worktrees of the same commit, both exit 0.
- `npm run clickthrough -- 01-returns` exits 0 and prints no `kkk`. The Return calculator slider is named with one `k`.
- `npm run clickthrough -- 09-time` exits 0 and prints no `kkk`.
- `grep -n 4329 scripts/lib/preview.mjs scripts/screenshots.mjs scripts/clickthrough.mjs` prints nothing.
- `git status --short` shows only the intended script files and this task's outcome file.

## Verify

```sh
npm ci
npm test
npm run build
npm run clickthrough -- 01-returns
npm run clickthrough -- 09-time
npm run screenshots -- 01-returns
grep -n 4329 scripts/lib/preview.mjs scripts/screenshots.mjs scripts/clickthrough.mjs || echo "no fixed port"
git status --short
```

The `grep` for the fixed port prints `no fixed port` and its own status is 1 when the port is gone. Accept that exit status when the printed line is exactly `no fixed port`.
