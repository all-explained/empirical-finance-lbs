# TASK-054 outcome: Data: quarterly consumption, wealth and labour income for cay

## Acceptance

- [x] `npm run data` writes `src/data/series/fred-cay-quarterly.json`.
  First quarter **1951-Q4** (`1951-10-01`), last quarter **2026-Q2** (`2026-04-01`), **299 rows**, ten numeric columns.
  Evidence: the log line `Wrote fred-cay-quarterly.json (30982 bytes)`; `du -k` prints `32`, under 1 MB.
- [x] `npm test` passes, including the new schema and raw-cell tests.
  Evidence: `Test Files 29 passed (29)`, `Tests 318 passed (318)`. The verbose run lists
  `fred-cay-quarterly > has the documented schema…` and `matches raw cell 1951-10-01 / PCND`,
  `2026-04-01 / COE`, `1990-01-01 / TNWBSHNO`.
- [x] `npm run build` passes. Evidence: `astro check` `Result (100 files): - 0 errors`, then `[build] Complete!`.
- [x] `git status --short` shows only the five task files and this outcome file, after the restore below.

## Other datasets restored

The worktree had no `data-raw/` cache, so `npm run data` downloaded every source again. The other ten JSON
files changed only in `retrieved` (2026-10-22 → 2026-10-23); their rows were identical to `HEAD`. I restored
all ten with `git checkout -- <file>`.

## Decisions within scope

- **ID swaps** (checked against the FRED CSV header and titles, recorded in `docs/DATA.md`):
  - `W209RC1Q027SBEA` is discontinued (ends 2015-Q2). FRED has no current quarterly series for the
    NIPA Table 2.1 "compensation of employees" line. `COE` (Table 1.12, compensation paid) replaces it.
    Its quarters equal the three-month means of the monthly received series `W209RC1` within 0.001%
    (1960-Q1, 1990-Q1, 2010-Q1, 2026-Q1 checked). The Z.1 series `HNOCERQ027S` was rejected: it equals
    `COE`, is in millions and is annual before 1952.
  - `PCTR` is monthly. `A577RC1Q027SBEA` is the quarterly series for the same Table 2.1 line.
- **ZIP response**: FRED returns these series as a ZIP with one CSV per aggregation type (net worth is
  end of period). `fred()` now joins the CSVs by date; single-CSV datasets are unchanged.
- **Start date**: before 1951-Q4, `TNWBSHNO` has year-end values only. Keeping "quarters where every
  column is present" literally would give four isolated fourth quarters (1947–1950) with gaps. The script
  keeps the gap-free run from 1951-Q4 and raises an error if a gap appears.

## Not checked

- Screenshots and click-through: no page or widget changed.
