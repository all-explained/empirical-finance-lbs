# TASK-031 outcome: Plan: decompose M-5

## Acceptance

- [x] `goal check --json` reports no errors. Evidence: it prints `{"goal": "course-site", "issues": [], "ok": true}` and exits 0, on `origin/main` `736a3ee` (after the last plan commit).
- [x] `goal graph` shows the new M-5 tasks with library and data tasks before chapter tasks and the owner-review task last. Evidence (`goal graph`, exit 0, M-5 block):

  ```
  ── M-5 · Part III: Return predictability: out of sample and beyond 0/9 ──
  ▶  TASK-031  Plan: decompose M-5  [running]
  │ ▶  TASK-053  Library: out-of-sample forecasts, Clark–West and certainty-equivalent gains  [running]
  │ ○  TASK-057  Chapter 13: Out-of-sample predictability  [needs TASK-053]
  │ ├─╮
  │ │ │ ▶  TASK-054  Data: quarterly consumption, wealth and labour income for cay  [running]
  │ │ │ ○  TASK-055  Library: cointegration, dynamic OLS and cay  [needs TASK-054]
  │ │ │ ○  TASK-058  Chapter 14: The consumption–wealth ratio  [needs TASK-055]
  │ │ │ │ ▶  TASK-056  Library: option strips, SVIX and the Martin lower bound  [running]
  │ │ │ │ ○  TASK-059  Chapter 15: Expected returns from option prices  [needs TASK-056]
  │ ├─┼─┴─╯
  │ ○ │  TASK-060  Owner reads Part III and approves how it reads  [needs TASK-057, TASK-058, TASK-059]
  │   │ ── M-6 · Part IV: Cross-sectional tests 0/1 ──
  ├───╯
  ○  TASK-032  Plan: decompose M-6  [needs TASK-031, TASK-057]
  ```

  Every chapter task depends on a library task (TASK-055 in turn on the data task TASK-054), and the owner review depends on all three chapter tasks.
- [x] Every chapter of Part III (13, 14, 15) has exactly one chapter task. Evidence: chapter 13 is TASK-057, chapter 14 is TASK-058, chapter 15 is TASK-059. No other task writes these chapters.

## Summary

What: eight new M-5 tasks, all with filled specs (no template lines), committed on `main` by the `goal` CLI (commits `26cad55` to `9dee422`, plus one spec fix):

| Task | Kind | Depends on | Delivers |
|---|---|---|---|
| TASK-053 | library | — | `src/lib/finance/outOfSample.ts`: Goyal–Welch predictor panel (annual and monthly), expanding-window forecasts with sign and floor restrictions, $R^2_{OS}$, cumulative squared-error difference, Clark–West, certainty-equivalent gain |
| TASK-054 | data | — | `fred-cay-quarterly`: nominal nondurables and services with price indexes, household net worth, labour-income parts, PCE price index, population (public FRED) |
| TASK-055 | library | TASK-054 | `src/lib/stats/cointegration.ts` (dynamic OLS, real-time residual, seeded cointegrated pair) and `src/lib/finance/cay.ts` (log real per-person $c$, $a$, $y$; full-sample and real-time $cay$; quarterly excess returns) |
| TASK-056 | library | — | `src/lib/finance/optionBound.ts`: Black–Scholes, seeded smile, OTM strip, $\mathrm{SVIX}^2$, $\mathrm{VIX}^2$, Martin's lower bound, entropy |
| TASK-057 | chapter 13 | TASK-053 | `OOSRace` |
| TASK-058 | chapter 14 | TASK-055 | `CointegrationDemo`, `PredictiveRegression` with $cay$, `CayLookAhead` |
| TASK-059 | chapter 15 | TASK-056 | `OptionStripBound` |
| TASK-060 | manual | TASK-057, TASK-058, TASK-059 | owner reads chapters 13–15 |

How:
- Chapter specs copy the shape of TASK-022 to TASK-028 and TASK-049 to TASK-051. Papers by absolute path: `GoyalWelch2008.pdf` and `Cochrane2008.pdf` (chapter 13), `LettauLudvigson2001a.pdf` (chapter 14), `Martin2017.pdf` (chapter 15). Campbell (2018) is missing for all three; the specs allow no fact from it. Chapter 13 also names Campbell & Thompson (2008), which is not in `source/papers/`: the restrictions are taught as a method with no fact attributed to that paper.
- Lessons from earlier outcomes went into the specs: every sentence about another chapter must be true of the merged site (the TASK-024 review); follow `docs/STYLE_GUIDE.md` §3 where the curriculum disagrees and list missing symbols as candidates (TASK-028, TASK-049); share loading code in one helper next to the widgets (`presentValueSample.ts`, TASK-049); use existing colour tokens and name the choice, with `OOSRace` highlighting one predictor at a time so the tokens suffice.
- Pacing: `goal link TASK-032 --after TASK-057`, so Part IV is planned once chapter 13 has proved the Part III pattern.
- Dispatch, per the owner rule: the orchestrator had already started TASK-053 and TASK-054 (`goal dispatch` returned the live runs and started no duplicates); I started TASK-056 through Orca. TASK-055 and the chapters wait on their dependencies.

Deviations:
- Data task. The curriculum lists `fred-consumption-quarterly` for chapter 14, but that file starts in 2007-Q1 and holds no wealth or income, so $cay$ cannot be estimated from it. TASK-054 adds `fred-cay-quarterly` from public FRED series. The library task depends on it, giving the chain TASK-054 → TASK-055 → TASK-058 → TASK-060 (four nodes, within the 3–4 limit). Chapters 13 and 15 need no new data: `goyal-welch-annual` and `goyal-welch-monthly` are built, and chapter 15 uses a seeded smile, as `docs/CURRICULUM.md` says. CRSP is not needed.
- The FRED IDs in TASK-054 are my best identification; the spec makes the worker check each header and record any swap in `docs/DATA.md`.
- Chapter 14 adds a widget, `CayLookAhead`, for the curriculum's look-ahead goal, and allows one optional prop on chapter 9's `PredictiveRegression` (default unchanged, chapter 9 screenshots re-checked). The chapter reports both as curriculum mismatches.
- Routes. `goal route` refuses to run in an agent shell ("reserved for you"). The goal's `default_route` is claude opus high, which is the route the spec asks for on the six library and chapter tasks. TASK-054 (data) should run on codex gpt-6.1-sol high, but the orchestrator had already started it on the default claude opus high route before I could dispatch it with `--agent codex`. I did not stop a live run. If the owner wants the codex route for future attempts: `goal route TASK-054 codex gpt-6.1-sol high`.

Verified revision: plan at `origin/main` `736a3ee`; `goal check --json` and `goal graph` both exit 0 there.

Proposed follow-ups:
- Martin's published SVIX series (listed under "Data wanted later") could replace the simulated smile in chapter 15 in a later data task.
- After chapter 14, add the $cay$ symbols ($cay$, $\omega$, $\rho_w$) and the chapter 13 and 15 candidates to the §3 notation table in one style-guide task.
