---
id: TASK-158
title: 'Data: FRED monthly activity and inflation, and federal debt held by the public to GDP'
milestone: M-14
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: sonnet, effort: high}
---

## Why


SC-4, SC-7 and M-14. Chapter 45 asks whether growth and inflation forecast bond returns beyond the yield curve, as Bauer & Hamilton (2018) and Duffee (2011) do; the pipeline has no activity series and its only inflation series, `infl` of `goyal-welch-monthly`, ends in 2025-12. Chapter 46 regresses the corporate–Treasury spread on the log of government debt to GDP, as Krishnamurthy & Vissing-Jorgensen (2012) do; the spread's yields are committed (`AAA`, `BAA` and `lty` of `goyal-welch-annual`), but debt to GDP is not. The "Data wanted later" table of `docs/CURRICULUM.md` lists it for chapter 46. FRED serves all of them with no API key.

## Scope


Add two datasets to the data pipeline, from FRED, with no credentials. Set up `.venv` as `docs/DATA.md` describes before `npm run data`. Read first: `docs/DATA.md` (file contract and the notes of the FRED datasets), `scripts/data/fetch.py` (its FRED helpers and the FRED entries in `build_all`), `src/lib/data/series.ts` and `src/lib/data/series.test.ts`.

Datasets:
- `fred-macro-monthly`, from `https://fred.stlouisfed.org/graph/fredgraph.csv?id=INDPRO,CPIAUCSL,CFNAI`: industrial production (`INDPRO`, index), the consumer price index for all urban consumers (`CPIAUCSL`, seasonally adjusted index) and the Chicago Fed National Activity Index (`CFNAI`, a weighted average of standardised indicators, 0 = trend growth). Monthly, keeping the months with all three fields (CFNAI starts in 1967-03). Keep source units; compute no growth rates or averages (the library does that). Bauer & Hamilton's growth measure is the three-month average of CFNAI (`/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/BauerHamilton2018.pdf`, pdf p. 20); Duffee uses industrial production growth and CPI inflation (`/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/Duffee2013.pdf`, pdf p. 40). Read each series' terms on its FRED page: if CFNAI may not be redistributed, drop it, keep the other two, and say so in the outcome.
- `fred-debt-gdp-annual`: federal debt held by the public as a percent of GDP, annual. Krishnamurthy & Vissing-Jorgensen use the face value of publicly held debt over GDP (`/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/KrishnamurthyVissingJorgensen2012.pdf`, pdf p. 2). Use `FYPUGDA188S` if its FRED page confirms that definition; otherwise use the FRED series for the same quantity with the longest annual history, and record the choice and why. Say in the build note whether the years are fiscal or calendar years.
Check each ID and unit against the CSV header and the FRED series page before you use it; if FRED has renamed or discontinued one, use the current series for the same quantity and record the swap, as the cay notes do.

Docs. In `docs/DATA.md`, add both rows to the sources table (terms and citation of each source: the Board for `INDPRO`, BLS for `CPIAUCSL`, the Chicago Fed for `CFNAI`, and the source FRED names for the debt series), update the dataset count in the opening lines and in "A normal run ... rewrites all ... outputs", and add a bullet for each under "File contract and transformations" with its units and first and last date. In `docs/CURRICULUM.md`, add `fred-macro-monthly` to the **Data:** line of chapter 45, add `fred-debt-gdp-annual` and `goyal-welch-annual` to that of chapter 46, and delete the chapter-46 row of "Data wanted later", whose two series are then committed (Aaa and Baa in `goyal-welch-annual`); change nothing else there.

Touch only: `scripts/data/fetch.py`, the two new JSON files in `src/data/series/`, `src/lib/data/series.ts` (two new `seriesColumns` entries), `src/lib/data/series.test.ts` (schema test and three raw-source cells for each, as for the others), `docs/DATA.md` and `docs/CURRICULUM.md`. `npm run data` rebuilds every dataset; if it changes any other JSON file, restore it with `git checkout -- <file>` and say so in the outcome. Each JSON file stays under 100 KB. Out of scope: library maths, chapters and widgets. If a download is blocked, stop with `Goal-Blocked` and name the exact file the owner must download.

Where jobs run: this is small work (public FRED CSVs, seconds), so it runs on the MacBook. It reads no CRSP, option or tick data; nothing goes to the cluster or the CEMFI PC.

## Acceptance


- `npm run data` writes `src/data/series/fred-macro-monthly.json` and `src/data/series/fred-debt-gdp-annual.json`, and the outcome states the first and last date, row count and size of each, and the series ID chosen for debt to GDP.
- `npm test` passes, including the new schema and raw-cell tests.
- `npm run build` passes.
- `git status --short` shows only the files named above and this task's outcome file.

## Verify


npm ci
npm run data
git status --short
npm test
npm run build
du -k src/data/series/fred-macro-monthly.json src/data/series/fred-debt-gdp-annual.json
