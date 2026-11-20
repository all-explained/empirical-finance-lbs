---
id: TASK-157
title: 'Data: the Svensson parameters of the GSW curve, end of month'
milestone: M-14
state: approved
depends_on: []
delivery: pr
---

## Why


SC-4, SC-7 and M-14. Chapter 44 estimates an affine model the way Adrian, Crump & Moench (2013) do: monthly excess returns of bonds of 6 to 120 months over the one-month yield. Those need yields at monthly maturities, including maturities below one year, and `gsw-zero-coupon` holds only the 1- to 30-year yields. The same Federal Reserve CSV publishes the six Svensson parameters from which GSW compute every yield; Adrian, Crump & Moench rebuild their curves from those parameters (pdf p. 16). The CSV is public, with no credentials.

## Scope


Add one dataset to the data pipeline, from the source `gsw-zero-coupon` already uses. Set up `.venv` as `docs/DATA.md` describes before `npm run data`. Read first: `docs/DATA.md` (file contract, the `gsw-zero-coupon` row and its build note "take the final daily source observation of each completed month"), `scripts/data/fetch.py` (the GSW download and its month-end rule), `src/lib/data/series.ts` and `src/lib/data/series.test.ts`.

Dataset: `gsw-svensson-parameters`, from `https://www.federalreserve.gov/data/yield-curve-tables/feds200628.csv`: the columns `BETA0`, `BETA1`, `BETA2`, `BETA3` (percent) and `TAU1`, `TAU2` (years), on exactly the dates of the committed `gsw-zero-coupon` (1985-11-29 to 2026-09-30, the last daily observation of each completed month), through the same month-end helper; do not write a second one. Keep source units; compute no yields (the library task that follows does that). Check each column name and unit against the CSV header before you use it. If a parameter is missing in a month, keep the month with a null, and list the months in the outcome.

Keep `gsw-zero-coupon` as committed. GSW is "subject to revision" (`docs/DATA.md`), so a fresh download can change its yields, and chapters 40 to 42 pin numbers on them: restore that file with `git checkout -- src/data/series/gsw-zero-coupon.json`, and restore any other JSON file `npm run data` changes, and say so in the outcome. The new file's dates must equal the committed GSW dates; a test checks this.

Docs. In `docs/DATA.md`, add the row to the sources table (same Board terms and GSW citation as `gsw-zero-coupon`), update the dataset count in the opening lines and in "A normal run ... rewrites all ... outputs", and add a build note: the units, that the dates match `gsw-zero-coupon`, and that GSW yields at any maturity follow from the six parameters (name the source of the formula only as `docs/DATA.md` already cites GSW; the formula itself goes into the library). In `docs/CURRICULUM.md`, add `gsw-svensson-parameters` to the **Data:** line of chapter 44; change nothing else there.

Touch only: `scripts/data/fetch.py`, the new JSON file in `src/data/series/`, `src/lib/data/series.ts` (one new `seriesColumns` entry), `src/lib/data/series.test.ts` (schema test, three raw-source cells, and the test that the dates equal those of `gsw-zero-coupon`), `docs/DATA.md` and `docs/CURRICULUM.md`. The JSON file stays under 100 KB. Out of scope: library maths, chapters and widgets. If the download is blocked, stop with `Goal-Blocked` and name the exact file the owner must download.

Where jobs run: this is small work (one public CSV, seconds), so it runs on the MacBook. It reads no CRSP, option or tick data; nothing goes to the cluster or the CEMFI PC.

## Acceptance


- `npm run data` writes `src/data/series/gsw-svensson-parameters.json`, and the outcome states its first and last date, row count, size and any month with a null.
- `npm test` passes, including the new schema, raw-cell and matching-dates tests.
- `npm run build` passes.
- `git status --short` shows only the files named above and this task's outcome file; `src/data/series/gsw-zero-coupon.json` is unchanged.

## Verify


npm ci
npm run data
git checkout -- src/data/series/gsw-zero-coupon.json
git status --short
npm test
npm run build
du -k src/data/series/gsw-svensson-parameters.json
