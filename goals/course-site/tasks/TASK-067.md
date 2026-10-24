---
id: TASK-067
title: 'Data: French 2×3 sorts and daily factors'
milestone: M-7
state: approved
depends_on: []
delivery: pr
---

## Why


SC-4, SC-7 and M-7. Chapters 19 and 20 rebuild SMB, HML and the momentum factor from the 2×3 sorts behind them, and chapter 23 runs within-quarter regressions on daily returns, as Lewellen & Nagel (2006) do. None of these four public French files is in the pipeline yet.

## Scope


Add four datasets to the data pipeline, all from the Kenneth French Data Library, with no credentials. Set up `.venv` as `docs/DATA.md` describes before `npm run data`. Read first: `docs/DATA.md` (file contract and French notes), `scripts/data/fetch.py` (its `french()` helper and the French entries in `build_all`), `src/lib/data/series.ts` and `src/lib/data/series.test.ts`.

Datasets (keep source units: percent per period; first table only, value-weighted returns; drop `-99.99` and `-999`):
- `ff6-size-bm-monthly`: "6 Portfolios Formed on Size and Book-to-Market (2 x 3)" (`6_Portfolios_2x3_CSV.zip`). Columns `SMALL-LoBM`, `ME1-BM2`, `SMALL-HiBM`, `BIG-LoBM`, `ME2-BM2`, `BIG-HiBM` as in the source header, or a clear renaming documented in `docs/DATA.md`.
- `ff6-size-mom-monthly`: "6 Portfolios Formed on Size and Momentum (2 x 3)" (`6_Portfolios_ME_Prior_12_2_CSV.zip`). Same rule for column names.
- `ff3-daily`: "Fama/French 3 Factors [Daily]" (`F-F_Research_Data_Factors_daily_CSV.zip`), columns `Mkt-RF`, `SMB`, `HML`, `RF`, from 1963-07-01 on to keep the file small.
- `mom-daily`: "Momentum Factor (Mom) [Daily]" (`F-F_Momentum_Factor_daily_CSV.zip`), column `Mom`, from 1963-07-01 on.
Check each file name and header against the download before you use it; if the library has renamed a file, use the current name and record it. Daily dates are trading days in ISO form. In `docs/DATA.md`, add the four rows to the sources table (terms and citations as for the other French files), update the dataset count in the opening line, and add a bullet under "File contract and transformations" that says how each 2×3 sort is formed (the breakpoints and timing as the library page states them) and that the daily files start in 1963-07 by choice.

Another data task (`data-osap`) may merge first and touch the same files. Rebase on `origin/main` before you finish and keep both sets of entries. Touch only: `scripts/data/fetch.py`, the four new JSON files in `src/data/series/`, `src/lib/data/series.ts` (four new `seriesColumns` entries), `src/lib/data/series.test.ts` (schema test and three raw-source cells per dataset, as for the others) and `docs/DATA.md`. `npm run data` rebuilds every dataset; if it changes any other JSON file, restore it with `git checkout -- <file>` and say so in the outcome. Each JSON file stays under 1 MB. Out of scope: library maths, chapters and widgets. If a download is blocked, stop with `Goal-Blocked` and name the exact file the owner must download.

## Acceptance


- `npm run data` writes the four JSON files, and the outcome states each file's first and last date, row count and size.
- `npm test` passes, including the new schema and raw-cell tests.
- `npm run build` passes.
- `git status --short` shows only the files named above and this task's outcome file.

## Verify


npm ci
npm run data
git status --short
npm test
npm run build
du -k src/data/series/ff6-size-bm-monthly.json src/data/series/ff6-size-mom-monthly.json src/data/series/ff3-daily.json src/data/series/mom-daily.json
