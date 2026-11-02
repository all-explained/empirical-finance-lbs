---
id: TASK-126
title: 'Data: annual real consumption and population from NIPA, 1929 on'
milestone: M-11
state: approved
depends_on: []
delivery: pr
route: {platform: codex, model: gpt-6.1-sol, effort: high}
---

## Why


SC-4, SC-7 and M-11. Chapter 35 puts numbers on the consumption CAPM over the long annual sample that the equity premium puzzle is usually stated on, and chapter 36 follows Kroencke (2017), who works with annual NIPA consumption from the late 1920s. The pipeline has no annual consumption. `fred-consumption-quarterly` starts in 2007-Q1 (78 quarters, COVID included), and `fred-cay-quarterly` starts in 1951-Q4. FRED publishes the annual NIPA series from 1929 with no API key.

## Scope


Add one dataset to the data pipeline, from FRED, with no credentials. Set up `.venv` as `docs/DATA.md` describes before `npm run data`. Read first: `docs/DATA.md` (file contract, the `fred-consumption-quarterly` and `fred-cay-quarterly` notes), `scripts/data/fetch.py` (its FRED helpers and the FRED entries in `build_all`), `src/lib/data/series.ts` and `src/lib/data/series.test.ts`.

Dataset: `fred-consumption-annual`, from the FRED public CSV `https://fred.stlouisfed.org/graph/fredgraph.csv?id=PCNDA,PCESVA,DNDGRG3A086NBEA,DSERRG3A086NBEA,B230RC0A052NBEA`: nominal nondurable goods (`PCNDA`) and services (`PCESVA`) expenditure, billions of USD; their chain-type price indexes (`DNDGRG3A086NBEA`, `DSERRG3A086NBEA`, 2017=100); total population (`B230RC0A052NBEA`, thousands of persons, including Armed Forces overseas). Annual, from 1929, keeping the years with all five fields. Keep source units; no deflating, per-person scaling or logs (the library does that, as `cayInputs` does for `fred-cay-quarterly`). These are the annual counterparts of five `fred-cay-quarterly` columns, so a reader can deflate each component by its own index in the same way. Check each ID and unit against the CSV header and the FRED series page before you use it; if FRED has renamed or discontinued one, use the current series for the same NIPA line and record the swap, as the cay notes do.

Docs. In `docs/DATA.md`, add the row to the sources table (BEA and FRED terms and citation, as for `fred-consumption-quarterly`), update the dataset count in the opening lines and in "A normal run ... rewrites all ... outputs", and add a bullet under "File contract and transformations" that states the units, that annual NIPA values are averages over the year (not end-of-year levels; chapter 36 depends on this), and that chained-dollar components are not additive. In `docs/CURRICULUM.md`, add `fred-consumption-annual` to the **Data:** lines of chapters 35 and 36; change nothing else there.

Touch only: `scripts/data/fetch.py`, the new JSON file in `src/data/series/`, `src/lib/data/series.ts` (one new `seriesColumns` entry), `src/lib/data/series.test.ts` (schema test and three raw-source cells, as for the others), `docs/DATA.md` and `docs/CURRICULUM.md`. `npm run data` rebuilds every dataset; if it changes any other JSON file, restore it with `git checkout -- <file>` and say so in the outcome. The JSON file stays under 100 KB. Out of scope: library maths, chapters and widgets. If the download is blocked, stop with `Goal-Blocked` and name the exact file the owner must download.

## Acceptance


- `npm run data` writes `src/data/series/fred-consumption-annual.json`, and the outcome states its first and last date, row count and size.
- `npm test` passes, including the new schema and raw-cell tests.
- `npm run build` passes.
- `git status --short` shows only the files named above and this task's outcome file.

## Verify


npm ci
npm run data
git status --short
npm test
npm run build
du -k src/data/series/fred-consumption-annual.json
