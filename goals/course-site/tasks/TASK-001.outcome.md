# TASK-001 outcome

## Acceptance

Verified locally on 2026-10-22 in the task worktree, on branch `goal/course-site/task-001`.

- [x] `npm test` passes, with the original generic-helper tests retained.
  Evidence: Vitest 5.0.3 reports `Test Files 1 passed (1)` and `Tests 10 passed (10)`.
  `tests/math.test.ts` is byte-for-byte identical to the source repository's test file (`cmp` exits 0).
  It checks normal distribution reference values, seeded random draws, Brownian bridges and root finding.
- [x] `npm run build` passes.
  Evidence: `astro check` reports 24 files with 0 errors, 0 warnings and 0 hints.
  Astro generates `/index.html` and reports `1 page(s) built` with exit 0.
  The content loader emits expected empty-collection notices because this task creates no chapters.
- [x] `npm run screenshots` passes, with no console, KaTeX or horizontal overflow errors.
  Evidence: exit 0 and four passing captures: `home-dark-desktop.png`, `home-dark-phone.png`,
  `home-light-desktop.png`, `home-light-phone.png`. Desktop is 1280 × 900; phone is 375 × 800.
  All four images were also visually inspected. Captures stay in ignored `screenshots/`.
- [x] `grep -rniE "black.?scholes|PayoffDiagram|strike" src scripts` prints nothing.
  Evidence: no output; exit 1, which means no matches.
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints `0`.
  Evidence: output `0`; no PDFs or private source files are tracked.
  `git check-ignore source/course-outline-e164-spr26.pdf` confirms the private directory remains ignored.

Dependency setup also passed with `npm ci`.

## Summary

Created the Astro + MDX + KaTeX + React/Mafs + Vitest site from the read-only local
`options-explained` checkout at `943f03fe96fdf7501b67012fc1c1028539099c58`.
Copied the shared layout, navigation, theme toggle, UI components, plot frame, formatting,
`useTweened` and animation helpers, math punctuation plugin, and generic math helpers with their tests.
Copied the deployment workflow as required; GitHub Actions was not run, inspected or used for delivery.

Configured the package name and GitHub Pages base for `empirical-finance-lbs`.
The homepage and metadata use “Empirical Finance, Explained” and show a clear empty-course state.
`PartInfo` keeps its source shape; `parts` is empty. The dynamic chapter template remains available
for later tasks. Added course-specific SVG assets, MIT and CC BY 4.0 licences, setup commands,
and rewritten contributor instructions. No option chapters, pricing modules or topic widgets were copied.
Private `source/` material remains ignored.

Deviation: preserved every copied colour value, but renamed the old option-specific yellow token
and its CSS helper to `--c-accent` / `.c-accent` so acceptance item 4 can pass.
Removed option-specific macros. Kept the other shared macros and colour tokens for TASK-003.
No course notation, palette, curriculum or data decisions were introduced.

Verified implementation revision: `a5888c36c17fbeabcd32dbb8ce73f9a69d91f89d`, after rebasing onto
`origin/main` without conflicts. The outcome-only commit does not change the verified implementation.
The source scans were checked again after creating this outcome.

Delivery: PR https://github.com/all-explained/empirical-finance-lbs/pull/4 targets `main`.
The PR body contains `Goal-Task: course-site/TASK-001`, and its label is `goal:course-site`.
GitHub reports no review comments or review threads at verification time.

Proposed follow-ups: only the already-planned TASK-003 notation/style work and TASK-005 curriculum sync.
No additional task or decision is needed for this scaffold.
