---
id: TASK-068
title: 'Data: published anomaly portfolios from Open Source Asset Pricing'
milestone: M-7
state: approved
depends_on: []
delivery: pr
---

## Why


SC-4, SC-7 and M-7. Chapter 21 plots published return predictors by year with their t-statistics and shows how many shrink when portfolios are value-weighted or microcaps are dropped. `docs/CURRICULUM.md` ("Data wanted later") names Open Source Asset Pricing (Chen & Zimmermann) as the public source; it is not in the pipeline.

## Scope


Add the Open Source Asset Pricing (OSAP) predictor data to the data pipeline. Public sources only, no credentials. Set up `.venv` as `docs/DATA.md` describes before `npm run data`. Read first: `docs/DATA.md`, `scripts/data/fetch.py`, `src/lib/data/series.ts`, `src/lib/data/series.test.ts`, and the OSAP data page (https://www.openassetpricing.com/data/) with its signal documentation.

What the chapter needs:
- Monthly long–short returns of every signal OSAP classes as a clear predictor, built as in the original papers (OSAP's "original paper" portfolios). One series file, `osap-ls-monthly`: column zero is the date, then one column per signal acronym; cells are `null` before a signal's data start, so every signal column is optional (`required: false`).
- The same long–short returns under value weighting, `osap-ls-vw-monthly`, and with microcaps excluded (OSAP's NYSE 20th-percentile size screen), `osap-ls-exmicro-monthly`, if OSAP publishes these variants. If one is not published, say so in the outcome and leave it out; do not build it yourself.
- Signal documentation, `osap-signals`: one record per signal with acronym, authors, publication year, journal, original sample start and end years and OSAP's category. This is not a dated series. Add it as a small JSON file with its own typed loader in `src/lib/data/` and its own test, and document its contract in `docs/DATA.md` next to the series contract.
Keep OSAP's units (state them: OSAP reports percent per month). Do not compute means, t-statistics or any summary here; the library task does that. Start the series in 1963-01 if a file would otherwise pass 1.5 MB; if it is still over 1.5 MB, report the sizes and keep the original-paper file only.

Downloads. OSAP serves files from Google Drive and through its Python package `openassetpricing`. Use whichever works without credentials; pin any new Python dependency in `scripts/data/requirements.txt`. Record the exact file names, release (vintage) and retrieval date in `docs/DATA.md`, and add the rows to the sources table with the terms OSAP states. If OSAP states no redistribution licence, follow the goal's assumption for small derived public academic data, as for the French files, and say so. If the download is blocked, stop with `Goal-Blocked` and name the exact files the owner must download.

Another data task (`data-french-sorts-daily`) may merge first and touch the same files. Rebase on `origin/main` before you finish and keep both sets of entries. Touch only: `scripts/data/fetch.py`, `scripts/data/requirements.txt` if needed, the new JSON files in `src/data/series/`, `src/lib/data/series.ts` (new `seriesColumns` entries), one new loader file for the signal documentation in `src/lib/data/` with its test, `src/lib/data/series.test.ts` and `docs/DATA.md`. If `npm run data` changes any other JSON file, restore it with `git checkout -- <file>` and say so. Out of scope: library maths, chapters and widgets.

## Acceptance


- `npm run data` writes the OSAP files, and the outcome states each file's first and last date (or record count), number of signals and size.
- `npm test` passes, including schema tests, three raw-source cells per series file and a test of the signal documentation loader.
- `npm run build` passes.
- `git status --short` shows only the files named above and this task's outcome file.

## Verify


npm ci
npm run data
git status --short
npm test
npm run build
du -k src/data/series/osap-*.json
