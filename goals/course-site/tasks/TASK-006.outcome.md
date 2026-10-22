# TASK-006 outcome

## Acceptance

- [x] `goal check --json` reports no errors.
  Evidence: `ok: true` with an empty `issues` list after the plan commits. One warning (W104, TASK-014 depended on TASK-011 through TASK-012) was fixed by removing the redundant link.
- [x] `goal graph` shows the new M-2 tasks with library tasks before chapter tasks and the owner-review task last.
  Evidence: the graph in the Summary below.

## Summary

Read `docs/CURRICULUM.md`, `docs/STYLE_GUIDE.md`, `docs/DATA.md`, the accepted DEC-001 (chapters 1 and 9), the files in `source/papers/` and the typed loaders in `src/lib/data/series.ts`. Added seven tasks to M-2 with `goal add`, filled every spec, and set a route on each (global rules: mechanical work to codex gpt-6.1-sol high, creative work to claude opus high).

| Task | Kind | Route | Result |
|---|---|---|---|
| TASK-009 | work | codex | `scripts/clickthrough.mjs`: one shared Playwright click-through of every widget control; shared preview code with `screenshots.mjs` |
| TASK-010 | work | codex | `src/lib/finance/returns.ts` with reference-value tests |
| TASK-011 | work | codex | `src/lib/stats/ols.ts`: OLS with classical, White, Newey–West and Hansen–Hodrick errors, tests against an independent implementation |
| TASK-012 | work | codex | `src/lib/finance/predictive.ts`: horizon regressions, AR(1), implied slope, seeded simulation |
| TASK-013 | work | claude opus | Chapter 1, Returns, with `CompoundingPath` and `ReturnCalculator` |
| TASK-014 | work | claude opus | Chapter 9, Time-varying expected returns, with `PredictiveRegression` and `HorizonCurve` |
| TASK-015 | manual | n/a | The owner reads both chapters and approves how they read (SC-5) |

```text
TASK-009 ─┬─ TASK-013 ─┐
TASK-010 ─┘            │
TASK-009 ─┬─ TASK-014 ─┼─ TASK-015 (owner)
TASK-011 ─┴─ TASK-012 ─┘
```

Four library and tooling tasks (009 to 011, and 012 after 011) run in parallel, then the two chapters run in parallel. The graph is shallow: longest chain is TASK-011, TASK-012, TASK-014, TASK-015.

Decisions and deviations:
- The task asked for a Playwright click-through; options-explained wrote one script per chapter. TASK-009 writes one shared script so later chapters reuse it.
- The pre-hand-off questions: no task mixes code with real-data runs (there are no cluster runs); every cited document exists; the owner supplies no input before the chapters except the two books, which the chapter specs handle by listing them as further reading only; every spec can be read cold.
- The two books cited by the chapters (Campbell 2018, Campbell–Lo–MacKinlay 1997) are "owner to supply" in `docs/READINGS.md`. Chapter specs forbid taking facts from them. Supplying them is optional and not on the critical path.
- Chapter 9 lists chapters 4 and 5 as prerequisites; neither exists yet. TASK-014 adds a recap callout and reports any page defect.

Proposed follow-ups:
- Issue all-explained/empirical-finance-lbs#5 (the chapter schema caps `part` at 16 while the curriculum has 17 parts) does not block M-2, because chapters 1 and 9 are in parts 1 and 2. It blocks chapters of Part XVII later.
- `docs/CURRICULUM.md` still uses `β` for the time discount (ch. 8), `γ` for slopes (ch. 33, 34, 42) and `m` for a linear SDF (ch. 26, 30), which the style guide reserves. A small docs task can align them. No M-2 chapter touches these.

Verified revision: plan root at `origin/main` after the plan commits; `goal check --json` and `goal graph` run on 2026-10-22.
