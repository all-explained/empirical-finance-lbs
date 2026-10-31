---
id: TASK-102
title: 'Data: French 30 industry portfolios'
milestone: M-9
state: approved
depends_on: []
delivery: pr
---

## Why


SC-4, SC-7 and M-9. Chapter 28 applies the first fix of Lewellen, Nagel & Shanken (2010): test a model on more than the 25 size–value portfolios, which they do by adding the 30 industry portfolios of the Kenneth French Data Library. `docs/CURRICULUM.md` ("Data wanted later") lists these portfolios for chapter 28; they are not in the pipeline.

## Scope


Add one dataset to the data pipeline, from the Kenneth French Data Library, with no credentials. Set up `.venv` as `docs/DATA.md` describes before `npm run data`. Read first: `docs/DATA.md` (file contract and French notes), `scripts/data/fetch.py` (its `french()` helper and the French entries in `build_all`), `src/lib/data/series.ts` and `src/lib/data/series.test.ts`.

Dataset: `ff30-industry-monthly`, "30 Industry Portfolios" (`30_Industry_Portfolios_CSV.zip`), the first table only (value-weighted monthly returns), from 1926-07 on. Keep source units (percent per month) and drop `-99.99` and `-999`. Column names as in the source header (`Food`, `Beer`, `Smoke`, …). Check the file name and header against the download before you use it; if the library has renamed the file, use the current name and record it.

Docs. In `docs/DATA.md`, add the row to the sources table (terms and citation as for the other French files), update the dataset count in the opening line, and add a bullet under "File contract and transformations" that says how the library assigns firms to industries (by SIC code, as the library page states it). In `docs/CURRICULUM.md`, delete the "30 or 49 industry portfolios" row of "Data wanted later" and add `ff30-industry-monthly` to the **Data:** line of chapter 28; change nothing else there.

Touch only: `scripts/data/fetch.py`, the new JSON file in `src/data/series/`, `src/lib/data/series.ts` (one new `seriesColumns` entry), `src/lib/data/series.test.ts` (schema test and three raw-source cells, as for the others), `docs/DATA.md` and `docs/CURRICULUM.md`. `npm run data` rebuilds every dataset; if it changes any other JSON file, restore it with `git checkout -- <file>` and say so in the outcome. The JSON file stays under 1 MB. Out of scope: library maths, chapters and widgets. If the download is blocked, stop with `Goal-Blocked` and name the exact file the owner must download.

## Acceptance


- `npm run data` writes `src/data/series/ff30-industry-monthly.json`, and the outcome states its first and last date, row count and size.
- `npm test` passes, including the new schema and raw-cell tests.
- `npm run build` passes.
- `git status --short` shows only the files named above and this task's outcome file.

## Verify


npm ci
npm run data
git status --short
npm test
npm run build
du -k src/data/series/ff30-industry-monthly.json
