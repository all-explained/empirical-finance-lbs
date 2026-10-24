# TASK-068 outcome

## Acceptance

- [x] `npm run data` writes the OSAP files. The final Verify run exited 0 and wrote both files below. The source is the public October 2025 release (v2.0.0), retrieved on 2026-10-24. Each signal column is optional and retains percent-per-month units.

  | File | First date | Last date | Rows or records | Signals | Bytes | `du -k` |
  | --- | --- | --- | ---: | ---: | ---: | ---: |
  | `src/data/series/osap-ls-monthly.json` | 1963-01-01 | 2024-12-01 | 744 rows | 165 | 2,059,185 | 2012 |
  | `src/data/series/osap-signals.json` | Not dated | Not dated | 165 records | 165 | 31,261 | 32 |

- [x] `npm test` passes. Final result: 42 test files passed, 431 tests passed, exit 0. This includes every dated series' schema and three raw-source cells. The OSAP cells are `AM` in 1963-01 (4.36695811965812), `BM` in 2000-01 (8.00532216312057), and `Mom12m` in 2024-12 (-22.5286012578235). Comments identify lines 446, 890 and 1189 in `PredictorLSretWide.csv`. Separate loader tests check signal metadata, an original `SignalDoc.csv` record, and exact agreement with the 165 return columns. An additional test checks optional columns, source units and missing histories.
- [x] `npm run build` passes. Final result: Astro check reported 0 errors; production build completed with 18 pages; exit 0.
- [x] `git status --short` shows only permitted files. It was empty in final Verify after restoring the 11 unrelated JSON files refreshed by `npm run data`. The feature diff contains only `docs/DATA.md`, `scripts/data/fetch.py`, the two new OSAP JSON files, `src/lib/data/series.ts`, `src/lib/data/series.test.ts`, the new `src/lib/data/osap-signals.ts` loader and its test, plus this outcome. No dependency changes were needed.

## Summary

Added OSAP to the existing public-data pipeline. Google Drive downloads work without credentials or new dependencies. Raw sources remain in the ignored cache. File IDs pin the October 2025 release. `docs/DATA.md` records filenames, file IDs, vintage, retrieval date, source units, transformations and terms. No explicit data redistribution licence was located on the OSAP data page or signal browser. These small derived extracts follow the goal's public-academic-data assumption and retain attribution.

Selected `Cat.Signal=Predictor` and `Predictability in OP=1_clear`: 165 signals. The 47 likely predictors, placebos and dropped signals are excluded. Missing return histories remain null. Source trading-day dates become the first day of each observation month. Source precision and signs are retained. No means, t-statistics or other return summaries were calculated.

Both requested variants are published. Their ZIPs contain the corresponding CSVs, including published `port=LS` rows. The pipeline reads those rows; it does not construct portfolios. All three series exceed 1,500,000 bytes after the required 1963-01 cut:

| Candidate series | Published file | Coverage after cut | Signals | JSON bytes | Delivery |
| --- | --- | --- | ---: | ---: | --- |
| `osap-ls-monthly` | `PredictorLSretWide.csv` | 1963-01–2024-12; 744 rows | 165 | 2,059,185 | Retained |
| `osap-ls-vw-monthly` | `PredictorAltPorts_LiqScreen_VWforce.zip` | 1963-01–2024-12; 744 rows | 165 | 2,065,022 | Omitted under the task's size rule |
| `osap-ls-exmicro-monthly` | `PredictorAltPorts_LiqScreen_ME_gt_NYSE20pct.zip` | 1963-01–2024-12; 744 rows | 165 | 2,042,292 | Omitted under the task's size rule |

The task explicitly requires keeping only the original-paper file when the cut still exceeds 1.5 MB. That file has a specific exception to the pipeline's normal 1 MB check. Both variant sizes are logged on rebuild. Their JSON files are not written. No material decision is needed.

The data page's signal-documentation shortcut points to an older copy. The pipeline instead uses `SignalDoc.csv` in the actual October 2025 release folder. Its ID and the matching public release are documented. The signal JSON has its own typed asynchronous loader and is not registered as a dated series.

Verified implementation revision: `2a0fb64fb8596f23697cd75d060ed2589448599c`, rebased successfully onto `origin/main` at `fceeee77d52d1c5c554b11649e9fce12d8f12c78`, with no conflicts. Only this outcome is added after that verification. Python lint (`uvx ruff check scripts/data/fetch.py`), CLI `--help`, and `git diff --check` also passed. The initial `uv run ruff check` could not find ruff; the isolated `uvx` command passed.

`npm run data` refreshed all existing datasets. As the spec requires, all 11 unrelated JSON changes were restored with `git checkout -- <file>`. The final tests used their original checked-in contents. No tests or data access remain blocked. Follow-up: TASK-070 can consume the original-paper series and publication metadata. The task's size rule limits the available weighting comparisons.

## Verify evidence

All six commands below exited 0 in this session after the rebase. Output tails follow. The raw-source tests run offline against the committed extracts. No GitHub Actions or checks were read or used.

```text
Verified revision: 2a0fb64fb8596f23697cd75d060ed2589448599c
$ npm ci
exit 0
  npm audit fix --force

Run `npm audit` for details.
npm warn install-scripts 2 packages have install scripts not yet covered by allowScripts:
npm warn install-scripts   esbuild@0.28.2 (postinstall: node install.js)
npm warn install-scripts   fsevents@2.3.3 (install: (install scripts present))
npm warn install-scripts
npm warn install-scripts Run `npm install-scripts ls` to review, or `npm install-scripts approve <pkg>` to allow.

$ npm run data
exit 0
                    INFO     Wrote goyal-welch-monthly.json (265508 bytes)      
                    INFO     Wrote goyal-welch-annual.json (29643 bytes)        
                    INFO     Wrote fred-treasury-monthly.json (32605 bytes)     
                    INFO     Wrote gsw-zero-coupon.json (110383 bytes)          
                    INFO     Wrote fred-consumption-quarterly.json (4240 bytes) 
                    INFO     Wrote fred-cay-quarterly.json (30982 bytes)        
                    INFO     Wrote osap-ls-monthly.json (2059185 bytes)         
                    INFO     Wrote osap-signals.json (31261 bytes)              

Restored unrelated JSON after data rebuild: src/data/series/ff25-size-bm-monthly.json, src/data/series/ff3-monthly.json, src/data/series/ff5-monthly.json, src/data/series/fred-cay-quarterly.json, src/data/series/fred-consumption-quarterly.json, src/data/series/fred-treasury-monthly.json, src/data/series/goyal-welch-annual.json, src/data/series/goyal-welch-monthly.json, src/data/series/gsw-zero-coupon.json, src/data/series/mom-monthly.json, src/data/series/shiller-monthly.json

$ git status --short
exit 0


$ npm test
exit 0
 RUN  v5.0.3 /Users/jesusvillotamiranda/orca/workspaces/empirical-finance-lbs/goal-course-site-task-068


 Test Files  42 passed (42)
      Tests  431 passed (431)
   Start at  03:31:20
   Duration  15.01s (tests 78%, import 15%, transform 6%)


$ npm run build
exit 0
03:31:47   ├─ /chapters/17-cross-sectional-regressions-and-fama-macbeth/index.html (+26ms) 
03:31:47   ├─ /chapters/18-errors-in-variables-and-shanken/index.html (+36ms) 
03:31:47   ├─ /index.html (+1ms) 
03:31:47 ✓ Completed in 864ms.

03:31:47 [build] ✓ Completed in 4.11s.
03:31:47 [build] 18 page(s) built in 4.41s
03:31:47 [build] Complete!

$ du -k src/data/series/osap-ls-monthly.json src/data/series/osap-signals.json
exit 0
2012	src/data/series/osap-ls-monthly.json
32	src/data/series/osap-signals.json

```
