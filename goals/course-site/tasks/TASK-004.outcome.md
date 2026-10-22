# TASK-004 outcome

## Acceptance

Verified locally on 2026-10-22 on branch `goal/course-site/task-004`.
Implementation revision: `275ad95a47ff3ef475a52e1c8dbff65e5dc55383`.
This outcome-only commit does not change that implementation.

- [x] `npm run data` runs after the documented clean-checkout setup and rewrites all ten JSON files.
  Evidence: `npm ci` and the one-line Python virtual-environment setup both exited 0.
  With no `data-raw/` directory and a clean tracked worktree, `npm run data` downloaded all nine
  raw files (the Goyal workbook supplies two datasets), printed ten `Wrote` messages and exited 0.
  A second cached run also printed all ten writes. `git status --short src/data/series` printed nothing:
  the downloaded data reproduce the committed extracts exactly.
- [x] `npm test` passes, including schema and reference values for each dataset.
  Evidence: Vitest reports `Test Files 3 passed (3)` and `Tests 53 passed (53)`.
  The new suite has 42 tests: ten schema/date/required-value checks, thirty hand-transcribed
  raw-source cell checks, and two loader helper tests. Existing math and curriculum tests also pass.
  Comments cite each reference's CSV line/column or workbook sheet/cell.
- [x] `npm run build` passes.
  Evidence: exit 0; Astro checks 27 files with 0 errors, 0 warnings and 0 hints,
  then builds one page. Expected empty-chapter collection notices remain.
  Dependencies were reinstalled with `npm ci` after rebasing onto the TASK-005 changes.
- [x] Every `du -k src/data/series/*.json` result is below 1024 KB.
  Evidence: ff25 240; ff3 44; ff5 36; consumption 8; Treasury 32; Goyal annual 32;
  Goyal monthly 260; GSW 108; momentum 28; Shiller 96 KB.
  The script additionally rejects JSON payloads of 1,000,000 bytes or larger.
- [x] `docs/DATA.md` lists all ten datasets with source, terms and citation.
  Evidence: the ten-row source table includes linked source URLs, available terms, paper/source
  citations and coverage dates. An ID-to-documentation check confirms all ten generated IDs appear.
  It records the lack of explicit open-data licences for French, Shiller and Goyal data and
  Goyal's Bloomberg-source disclosure. No broad reuse rights are claimed.

The complete required Verify sequence exited 0:

```sh
npm run data
git status --short src/data/series
npm test
npm run build
du -k src/data/series/*.json
```

Its final output was:

```text
15:02:07 [build] 1 page(s) built in 602ms
15:02:07 [build] Complete!
240 src/data/series/ff25-size-bm-monthly.json
44  src/data/series/ff3-monthly.json
36  src/data/series/ff5-monthly.json
8   src/data/series/fred-consumption-quarterly.json
32  src/data/series/fred-treasury-monthly.json
32  src/data/series/goyal-welch-annual.json
260 src/data/series/goyal-welch-monthly.json
108 src/data/series/gsw-zero-coupon.json
28  src/data/series/mom-monthly.json
96  src/data/series/shiller-monthly.json
```

## Summary

Added `scripts/data/fetch.py`, pinned Python dependencies, the `npm run data` command,
ignored raw caching, ten compact cited JSON datasets, asynchronous typed loaders,
column access, inclusive date slicing and range helpers. Added source documentation
and linked it from the root README. No statistics, widgets, chapters or goal specs changed.

All source downloads work using ordinary public `curl` requests without API keys.
Shiller's published endpoint uses HTTP because its HTTPS endpoint fails.
The Goyal workbook includes a harmless openpyxl header/footer warning; data cells parse correctly.
The Federal Reserve endpoint works with curl, despite failures from a default Python HTTP client.

Dates and units remain explicit. French returns stay in percent, Goyal returns stay in decimals,
and GSW yields stay in continuously compounded annual percent. Optional Goyal predictors retain
missing entries as `null`. Other datasets use complete requested-column observations.
GSW uses the final source observation of each completed month, preserving the trading-day date.
Precision is documented: source CSV precision, six decimals for Shiller, eight for Goyal, four for GSW.

Coverage limits are documented, including Shiller's June 2023 complete-data endpoint,
GSW's full-maturity start in November 1985, the FRED GS30 gap and quarterly consumption from 2007.
These are source-data constraints, not blocked downloads. No material decision is needed.

The branch was rebased onto `origin/main` without conflicts; the verified base includes TASK-005.
`uv run --with ruff ruff check scripts/data/fetch.py` and `git diff --check` pass.
`npm run screenshots` passes all four desktop/phone and light/dark captures.
GitHub Actions were not read, run or used to gate delivery.

Delivery PR: https://github.com/all-explained/empirical-finance-lbs/pull/8 into `main`,
with `Goal-Task: course-site/TASK-004` and the `goal:course-site` label.
The PR is marked ready only after local verification and this committed outcome.
Proposed follow-ups: none beyond the existing course plan.
