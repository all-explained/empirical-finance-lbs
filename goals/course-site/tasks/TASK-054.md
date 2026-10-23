---
id: TASK-054
title: 'Data: quarterly consumption, wealth and labour income for cay'
milestone: M-5
state: approved
depends_on: []
delivery: pr
---

## Why

SC-4, SC-7 and M-5. Chapter 14 estimates $cay$ as a cointegrating residual of log consumption, asset wealth and labour income. The committed `fred-consumption-quarterly` starts in 2007 and has no wealth or income, so the chapter needs a long public quarterly dataset.

## Scope

Add the dataset `fred-cay-quarterly` to the data pipeline. Set up `.venv` as `docs/DATA.md` describes before `npm run data`. Read first: `docs/DATA.md` (file contract, FRED notes), `scripts/data/fetch.py` (its `fred()` helper and the `fred-consumption-quarterly` entry in `build_all`), `src/lib/data/series.ts` and `src/lib/data/series.test.ts`, and the data section of `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/LettauLudvigson2001a.pdf` (Lettau & Ludvigson (2001, JF); open it with `pdftotext -layout`; read only, never copy its text).

Columns: quarterly FRED series from the public `fredgraph.csv` endpoint, no API key, source units kept:
- nominal consumption of nondurable goods (`PCND`) and of services (`PCESV`), and their price indexes (`DNDGRG3Q086SBEA`, `DSERRG3Q086SBEA`);
- household and nonprofit net worth (`TNWBSHNO`, Financial Accounts Z.1, end of quarter);
- labour income parts: compensation of employees received (`W209RC1Q027SBEA`), personal current transfer receipts (`PCTR`) and contributions for government social insurance (`A061RC1Q027SBEA`);
- the PCE price index (`PCECTPI`) and total population (`B230RC0Q173SBEA`).

Check each ID in the downloaded CSV header before you use it. If an ID is not a quarterly series, use the quarterly FRED series for the same NIPA or Z.1 line and record the swap in `docs/DATA.md`. Keep quarters where every column is present; do not average monthly data, deflate, take logs or build $cay$ here (the library task does that). In `docs/DATA.md`, add the row to the sources table and a bullet under "File contract and transformations" that says which Lettau–Ludvigson definition each column stands in for and where the public series differ from theirs (for example, labour taxes are not removed).

Touch only: `scripts/data/fetch.py`, `src/data/series/fred-cay-quarterly.json`, `src/lib/data/series.ts` (one new `seriesColumns` entry), `src/lib/data/series.test.ts` (schema test and three raw-source cells, as for the other datasets) and `docs/DATA.md`. `npm run data` rebuilds every dataset; if it changes any other JSON file, restore that file with `git checkout -- <file>` and say so in the outcome. The JSON file stays under 1 MB. Out of scope: library maths, chapters and widgets.

## Acceptance

- `npm run data` writes `src/data/series/fred-cay-quarterly.json`, and the outcome states its first and last quarter and row count.
- `npm test` passes, including the new schema and raw-cell tests.
- `npm run build` passes.
- `git status --short` shows only the five files named above and this task's outcome file.

## Verify

```sh
npm ci
npm run data
git status --short
npm test
npm run build
du -k src/data/series/fred-cay-quarterly.json
```
