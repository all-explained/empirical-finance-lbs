# TASK-009 outcome

## Acceptance

- [x] With no chapter pages, `npm run clickthrough` exits 0 and prints `no chapter pages to check`.
  The final build contains only `/index.html`; the final Verify run prints that exact message.
- [x] A temporary chapter with the real shared Slider, Segmented, Select and Button passes.
  The script reports all controls and eight actions at each of 1280px and 360px.
  The fixture also checks that React received slider values `0,10,5`, the final segmented option,
  and the final select option before its button runs. It sits below the fold with `client:visible`.
  Both the chapter and its component were removed before committing.
- [x] A temporary widget with a console error at slider maximum exits 1.
  The failure names the chapter, widget, slider label, width and `maximum (10)` action.
  Both temporary source files were removed, and the final build removed their generated page.
- [x] `npm run screenshots` exits 0 and writes the same four home-page images.
  All four SHA-256 hashes match images made by the original `HEAD:scripts/screenshots.mjs`.
  The filenames are `home-dark-desktop.png`, `home-dark-phone.png`,
  `home-light-desktop.png` and `home-light-phone.png`.
- [x] The change contains only `scripts/clickthrough.mjs`, `scripts/lib/preview.mjs`,
  `scripts/screenshots.mjs`, `package.json` and this outcome.
  `git status --short` was checked after removing the temporary sources. The staged snapshot
  below lists the five intended files; generated screenshots and `dist/` remain ignored.

## Temporary-page runs

Successful run (also verifies the path filter):

```text
> empirical-finance-lbs@0.1.0 clickthrough
> node scripts/clickthrough.mjs clickthrough-fixture

✓ chapters/clickthrough-fixture/ · Click-through fixture · 8 actions at 1280px, 8 actions at 360px · slider "Fixture amount"; segmented "Fixture mode" option "Mode A"; segmented "Fixture mode" option "Mode B"; select "Fixture choice"; button "Fixture reset"
exit: 0
```

Failing run (the fixture logs a console error from the real Slider's `onChange`):

```text
> empirical-finance-lbs@0.1.0 clickthrough
> node scripts/clickthrough.mjs

✗ chapters/clickthrough-fixture/ · Failing slider fixture · 1280px · slider "Fixture amount" · maximum (10): fixture slider reached maximum
exit: 1 (expected 1)
```

## Verify

All commands completed with exit 0 after the fixtures were removed:

```sh
npm ci
npm test
npm run build
npm run clickthrough
npm run screenshots
git status --short
```

Output tail:

```text
Test Files  4 passed (4)
     Tests  57 passed (57)
Result (30 files):
- 0 errors
- 0 warnings
- 0 hints
[build] 1 page(s) built
[build] Complete!

> empirical-finance-lbs@0.1.0 clickthrough
> node scripts/clickthrough.mjs

no chapter pages to check

> empirical-finance-lbs@0.1.0 screenshots
> node scripts/screenshots.mjs

✓ home-dark-desktop.png
✓ home-dark-phone.png
✓ home-light-desktop.png
✓ home-light-phone.png
```

Staged scope check (`git status --short`):

```text
A  goals/course-site/tasks/TASK-009.outcome.md
M  package.json
A  scripts/clickthrough.mjs
A  scripts/lib/preview.mjs
M  scripts/screenshots.mjs
```

The build reports the expected empty chapter collection. `npm ci` reports five low-severity
dependency advisories; it exits 0. No dependency or lockfile changes were made.

## Summary

Added one shared chapter click-through script and the `clickthrough` npm command.
It discovers built chapter HTML, supports a path filter, waits for visible React islands,
and drives slider bounds and midpoint, every segmented option, every select option and buttons.
After each action it waits for animation frames, then checks console/page errors, KaTeX errors,
page overflow and readout text. Each widget gets a fresh page at each width.

Moved preview startup, readiness, Chromium launch and cleanup into `scripts/lib/preview.mjs`.
Both browser scripts use this helper. Screenshot viewports, themes, names and pixels stay unchanged.

Verified revision: the implementation working tree based on `5e041daa5870b4f75cfdd38438424bcaea393056`.
Deviations: none. Proposed follow-ups: none. No chapters, widgets or library code are delivered.
