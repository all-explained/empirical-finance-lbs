# TASK-067 outcome

## Acceptance

- [x] `npm run data` exits 0 and writes all four files. Coverage and exact byte sizes appear below.
- [x] `npm test` exits 0: 41 test files and 446 tests passed, including four new schema cases, twelve raw-source cells, and six unit/cutoff checks.
- [x] `npm run build` exits 0: Astro checks report zero errors; 18 pages built.
- [x] `git status --short` exits 0 with no output after the data commit and restoration. The branch diff contains only the eight allowed implementation/data files plus this outcome.

| File | First date | Last date | Rows | Bytes | `du -k` |
| --- | --- | --- | ---: | ---: | ---: |
| `ff6-size-bm-monthly.json` | 1926-07-01 | 2026-08-01 | 1,202 | 72,482 | 72 |
| `ff6-size-mom-monthly.json` | 1927-01-01 | 2026-09-01 | 1,197 | 58,029 | 60 |
| `ff3-daily.json` | 1963-07-01 | 2026-08-31 | 15,897 | 571,981 | 560 |
| `mom-daily.json` | 1963-07-01 | 2026-08-31 | 15,897 | 323,969 | 320 |

All files are smaller than 1,000,000 bytes.

## Summary

Added four public Kenneth French datasets to the existing pipeline and typed loader. The parser reads six-digit monthly or eight-digit daily dates, validates source headers, handles CR line endings, drops both missing-value markers, and stops after the first table. Monthly portfolio returns use the value-weighted table. Daily extracts start at 1963-07-01 by choice. Source percent units remain unchanged.

The four requested ZIP names and their CSV headers were checked against fresh downloads on 2026-10-24; no filenames changed. Portfolio header spaces become hyphens, as documented in `docs/DATA.md`. The source detail pages confirm the NYSE breakpoints and annual or monthly formation timing. The momentum portfolio ZIP currently ends in September 2026; the other three end in August 2026.

Plan completed: extend the existing French helper, register typed columns, document sources/formation rules, and verify schemas plus raw-source cells. No scope deviations or proposed follow-ups.

Verified implementation revision: `bb832157de227c737ecc73c618f194767fe1a66e`, after a successful rebase onto `origin/main`. This outcome-only commit follows that revision. Branch: `goal/course-site/task-067`. PR: https://github.com/all-explained/empirical-finance-lbs/pull/53.

### Restored outputs

`npm run data` rebuilt every dataset. The following unrelated outputs were restored with `git checkout -- <file>` after each successful run, as required by the task:

- `src/data/series/ff25-size-bm-monthly.json`
- `src/data/series/ff3-monthly.json`
- `src/data/series/ff5-monthly.json`
- `src/data/series/fred-cay-quarterly.json`
- `src/data/series/fred-consumption-quarterly.json`
- `src/data/series/fred-treasury-monthly.json`
- `src/data/series/goyal-welch-annual.json`
- `src/data/series/goyal-welch-monthly.json`
- `src/data/series/gsw-zero-coupon.json`
- `src/data/series/mom-monthly.json`
- `src/data/series/shiller-monthly.json`

### Local verification

The full Verify sequence ran in this session. Each command exited 0:

1. `npm ci` — 439 packages installed.
2. `npm run data` — all fifteen outputs written; unrelated outputs restored as listed above.
3. `git status --short` — no output.
4. `npm test` — 41 files and 446 tests passed.
5. `npm run build` — zero errors; 18 pages built.
6. `du -k src/data/series/ff6-size-bm-monthly.json src/data/series/ff6-size-mom-monthly.json src/data/series/ff3-daily.json src/data/series/mom-daily.json` — sizes below.

The build reports one existing unused `Matrix` import warning in `src/lib/finance/news.ts`. It exits 0. GitHub Actions were not read or used.

Additional checks passed: `uv run --with ruff ruff check scripts/data/fetch.py`, `git diff --check`, a parser smoke test for CR line endings, both missing markers, cutoff, first-table selection and header rejection, and an independent comparison of every new date and value against each raw CSV first table.

Verify output tail:

```text
03:30:00 [build] 18 page(s) built in 6.04s
03:30:00 [build] Complete!
EXIT 0

$ du -k src/data/series/ff6-size-bm-monthly.json src/data/series/ff6-size-mom-monthly.json src/data/series/ff3-daily.json src/data/series/mom-daily.json
72	src/data/series/ff6-size-bm-monthly.json
60	src/data/series/ff6-size-mom-monthly.json
560	src/data/series/ff3-daily.json
320	src/data/series/mom-daily.json
EXIT 0

VERIFY EXIT 0
```
