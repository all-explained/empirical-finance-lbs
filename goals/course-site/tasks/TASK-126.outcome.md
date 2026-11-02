# TASK-126 outcome

## Acceptance

- [x] `npm run data` exited 0 and wrote `src/data/series/fred-consumption-annual.json`: first date **1929-01-01**, last date **2025-01-01**, **97 rows**, **6,401 bytes**. `du -k` reported **8 KiB** of disk allocation. The file is below 100 KB.
- [x] `npm test` exited 0: **73 test files, 772 tests passed**. This includes the annual schema/source-unit test and three raw-source cells. The focused series suite also passed **83 tests**. Before implementation, the annual test failed with `RangeError: Unknown series: fred-consumption-annual`.
- [x] `npm run build` exited 0: Astro checked 216 files with **0 errors**, then built **34 pages**.
- [x] `git status --short` exited 0. Before the implementation commit, it listed only the six allowed paths below. This outcome is the only additional task file. All 18 unrelated generated JSON files were restored. The final PR contains exactly these seven paths, and delivery requires a clean working tree.

```text
 M docs/CURRICULUM.md
 M docs/DATA.md
 M scripts/data/fetch.py
 M src/lib/data/series.test.ts
 M src/lib/data/series.ts
?? src/data/series/fred-consumption-annual.json
```

## Summary

Added the annual NIPA inputs through the existing `fred()` helper and `seriesColumns` registry. The pipeline keeps complete annual observations in source units. It performs no deflation, per-person scaling or logarithms. Documentation covers annual averaging, non-additive chained-dollar components, source terms and citations. Only the chapter 35 and 36 **Data:** lines changed in `docs/CURRICULUM.md`.

Verified implementation revision: **1045077** (`feat: Add annual NIPA consumption data`), based on `origin/main` revision `d3a12af`. The branch rebased cleanly before implementation. This outcome adds verification evidence only. No specification changes, material decisions or proposed follow-ups.

The mechanical implementation used the required `codex gpt-6.1-sol high` route. Independent review found no actionable issues and checked every generated row. All 485 numeric cells match the public CSV.

### Source checks

Checked the public CSV header and each FRED series page on 2026-11-02. All five IDs are current and annual; no substitutions were needed.

| Series | FRED units |
| --- | --- |
| [PCNDA](https://fred.stlouisfed.org/series/PCNDA) | Billions of Dollars, nominal nondurable goods |
| [PCESVA](https://fred.stlouisfed.org/series/PCESVA) | Billions of Dollars, nominal services |
| [DNDGRG3A086NBEA](https://fred.stlouisfed.org/series/DNDGRG3A086NBEA) | Index 2017=100, nondurable goods prices |
| [DSERRG3A086NBEA](https://fred.stlouisfed.org/series/DSERRG3A086NBEA) | Index 2017=100, services prices |
| [B230RC0A052NBEA](https://fred.stlouisfed.org/series/B230RC0A052NBEA) | Thousands of persons, including Armed Forces overseas |

Raw CSV lines supporting the three fixed test cells, respectively 2/B, 73/E and 98/F:

```text
observation_date,PCNDA,PCESVA,DNDGRG3A086NBEA,DSERRG3A086NBEA,B230RC0A052NBEA
1929-01-01,33.941,33.613,10.341,6.068,121878
2000-01-01,1540.600,4314.008,76.084,65.210,282398
2025-01-01,4225.457,14380.931,120.480,132.410,341944
```

### Verification output

All six required Verify commands exited 0 during this session. `.venv` was installed according to `docs/DATA.md`. The data rebuild downloaded public sources without credentials. Its other 18 JSON outputs changed and were restored with `git checkout -- <file>`, as required; their existing checked-in vintages remain in the PR.

`npm ci` output excerpt and tail:

```text
added 439 packages, and audited 440 packages in 3s
npm warn install-scripts
npm warn install-scripts Run `npm install-scripts ls` to review, or `npm install-scripts approve <pkg>` to allow.
```

`npm run data` tail:

```text
INFO     Wrote fred-consumption-quarterly.json (4282 bytes)
INFO     Wrote fred-consumption-annual.json (6401 bytes)
INFO     Wrote fred-cay-quarterly.json (30982 bytes)
INFO     Wrote osap-ls-monthly.json (2059185 bytes)
INFO     Wrote osap-signals.json (31261 bytes)
```

`git status --short` output is recorded under Acceptance. `git diff --check` also exited 0.

`npm test` tail:

```text
 Test Files  73 passed (73)
      Tests  772 passed (772)
   Start at  01:06:57
   Duration  45.57s (tests 88%, import 8%, transform 3%)
```

`npm run build` tail:

```text
01:07:18 ✓ Completed in 1.61s.
01:07:18 [build] ✓ Completed in 7.46s.
01:07:18 [build] 34 page(s) built in 8.00s
01:07:18 [build] Complete!
```

`du -k src/data/series/fred-consumption-annual.json`:

```text
8	src/data/series/fred-consumption-annual.json
```

GitHub Actions were not inspected or used as a delivery gate. Historical FRED values remain subject to source revisions.
