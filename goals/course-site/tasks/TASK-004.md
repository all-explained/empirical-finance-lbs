---
id: TASK-004
title: Build the public-data pipeline and typed loaders
milestone: M-1
state: approved
depends_on: [TASK-001]
delivery: pr
---

## Why

SC-4. Widgets show real history. The data must be reproducible, small, cited, and tested.

## Scope

Build one script that downloads public data and writes small JSON files, plus typed loaders.

Datasets (exact IDs; TASK-002 uses the same IDs):

| ID | Content | Source |
|---|---|---|
| `ff3-monthly` | Mkt-RF, SMB, HML, RF | Kenneth French Data Library |
| `ff5-monthly` | Mkt-RF, SMB, HML, RMW, CMA, RF | Kenneth French Data Library |
| `mom-monthly` | Mom | Kenneth French Data Library |
| `ff25-size-bm-monthly` | 25 size × book-to-market portfolios, value weighted | Kenneth French Data Library |
| `shiller-monthly` | S&P price, dividend, earnings, CPI, long rate, CAPE | Robert Shiller's online data |
| `goyal-welch-annual` | equity premium predictors, annual | Amit Goyal's website (Welch & Goyal 2008 data, latest update) |
| `goyal-welch-monthly` | same, monthly | same |
| `fred-treasury-monthly` | constant-maturity yields 1y–30y, 3-month T-bill | FRED |
| `gsw-zero-coupon` | zero-coupon yields 1–30y, monthly (end of month) | Federal Reserve, Gürkaynak–Sack–Wright |
| `fred-consumption-quarterly` | real nondurables and services consumption, population | FRED |

Build:
- `scripts/data/fetch.py` (use `python3`). Run with `npm run data`. Put pinned Python dependencies in `scripts/data/requirements.txt` and document the one-line setup in the script header. Cache raw downloads in a git-ignored `data-raw/`.
- One file per dataset: `src/data/series/<id>.json` with `id`, `title`, `source`, `url`, `citation`, `retrieved` (date), `frequency`, `columns` (name, unit, description) and `rows`. Keep each file under 1 MB (round to the source's precision).
- `src/lib/data/series.ts`: typed loaders (`loadSeries(id)`, column access, date range helpers).
- `src/lib/data/series.test.ts`: for each dataset, check the schema, sorted unique dates and no missing values in required columns, plus 3 reference values copied by hand from the raw source file (cite the file and cell in a comment).
- `docs/DATA.md`: a table with each ID, source URL, licence or terms of use, citation, coverage dates.

No FRED API key: use FRED's public CSV download URLs. If a source blocks automated download, say so in the outcome and set `Goal-Blocked` with the exact file the owner must download.

Out of scope: statistics code (regressions, GMM), widgets, chapters.

## Acceptance

- `npm run data` runs from a clean checkout (after the documented setup) and rewrites all 10 JSON files.
- `npm test` passes, including the per-dataset schema and reference-value tests.
- `npm run build` passes.
- `du -k src/data/series/*.json` shows every file under 1024 KB.
- `docs/DATA.md` lists all 10 datasets with source, terms and citation.

## Verify

```sh
npm run data
git status --short src/data/series
npm test
npm run build
du -k src/data/series/*.json
```
