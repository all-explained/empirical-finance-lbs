# TASK-035 outcome: Plan: decompose M-9

## Acceptance

- [x] `goal check --json` reports no errors. Evidence: in this worktree it prints `{"goal": "course-site", "issues": [], "ok": true}` and exits 0. `goal proposal check goals/course-site/proposals/TASK-035.yaml --goal course-site` prints `Proposal from TASK-035 is valid` and exits 0. That check validates, in memory, the plan as it will be after apply.
- [x] `goal graph` shows the new M-9 tasks with library and data tasks before chapter tasks and the owner-review task last. Evidence: the new tasks reach the live graph only after the orchestrator runs `goal proposal apply`, which refuses to run in an agent shell. To preview, I wrote the eight projected specs and the link into a throwaway clone at `/tmp/t035-preview`, with the IDs apply should allocate (TASK-101 to TASK-108, in proposal order). There, `goal check --json` reports no issues, and `goal graph` exits 0 with this M-9 block:

  ```
      │ ── M-9 · Part VII: The factor zoo and shrinkage 0/9 ──
      ▶  TASK-035  Plan: decompose M-9  [running]
  ◇   │  TASK-101  Data: French 30 industry portfolios  [ready]
  │ ◇ │  TASK-102  Library: random-factor fits, GLS R², traded-factor restrictions and R² confidence intervals  [ready]
  ├─╯ │
  ○   │  TASK-105  Chapter 28: A skeptical look at asset pricing tests  [needs TASK-101, TASK-102]
  ├───┤
  │ ◇ │  TASK-103  Library: Bonferroni, Holm and Benjamini–Hochberg–Yekutieli, and seeded strategy searches  [ready]
  │ ○ │  TASK-106  Chapter 29: Multiple testing  [needs TASK-103]
  │ │ │ ◇  TASK-104  Library: shrinkage SDF estimates, the elastic net and cross-validated R²  [ready]
  │ │ │ ○  TASK-107  Chapter 30: Shrinking the cross-section  [needs TASK-104]
  ├─┴─┼─╯
  ○   │  TASK-108  Orchestrator reads Part VII and signs it off  [needs TASK-105, TASK-106, TASK-107]
      │ ── M-10 · Part VIII: Latent factors and large cross-sections 0/1 ──
      ○  TASK-036  Plan: decompose M-10  [needs TASK-035, TASK-105]
  ```

  Each chapter task depends only on the data or library tasks it uses. No library task depends on another task. The sign-off task comes last and depends on all three chapters.
- [x] Every chapter of Part VII (28, 29, 30) has exactly one chapter task. Evidence: in the proposal, `chapter-28` writes `28-skeptical-look-at-asset-pricing-tests.mdx`, `chapter-29` writes `29-multiple-testing.mdx` and `chapter-30` writes `30-shrinking-the-cross-section.mdx`. No other task writes a chapter.

## Summary

What: `goals/course-site/proposals/TASK-035.yaml`. It adds eight M-9 tasks and one link. Every spec is filled and has no template lines.

| Ref (projected ID) | Kind | After | Delivers |
|---|---|---|---|
| `data-industries` (TASK-101) | data | — | `ff30-industry-monthly` from the French library; the "Data wanted later" row for chapter 28 removed |
| `lib-skeptical-tests` (TASK-102) | library | — | `src/lib/finance/skeptical.ts`: `randomFactorFit`, `glsR2`, `tradedFactorRestriction`, `r2ConfidenceInterval` |
| `lib-multiple-testing` (TASK-103) | library | — | `src/lib/stats/multipleTesting.ts`: `pValues`, `bonferroni`, `holm`, `benjaminiHochberg`, `benjaminiHochbergYekutieli`, `simulateStrategySearch`, `discoveryCounts` |
| `lib-shrinkage` (TASK-104) | library | — | `src/lib/finance/shrinkage.ts`: `assetPanel`, `ridgeSdf`, `elasticNetSdf`, `principalComponentAssets`, `crossValidatedR2`, `shrinkagePath`, `splitSampleSharpe` |
| `chapter-28` (TASK-105) | chapter | data-industries, lib-skeptical-tests | `RandomFactorFit`; `PCAExplorer` unchanged (`initialPreset="ff25-1963"`, `initialView="scree"`) |
| `chapter-29` (TASK-106) | chapter | lib-multiple-testing | `MultipleTesting`; `ZooChart` unchanged (`initialLine={3}`) |
| `chapter-30` (TASK-107) | chapter | lib-shrinkage | `ShrinkagePath`; an optional `FrontierBuilder` preset, default unchanged |
| `part-7-signoff` (TASK-108) | gate | the three chapters | read-through report; the orchestrator signs off by merging |

Link: `TASK-036` (Plan: decompose M-10) now also waits on `chapter-28`, the first Part VII chapter.

How:
- Data. One data task is needed.
  - Chapter 28 applies Lewellen, Nagel & Shanken's first fix (more test assets). Their paper adds the 30 French industry portfolios (Prescription 1, PDF page 17 of the working-paper version). These portfolios are public and not in the pipeline, so `data-industries` adds them.
  - Chapter 29 needs no new data. It uses seeded simulations and the published OSAP predictors that `signalSummaries` (chapter 21) already reads.
  - Chapter 30 needs no new data. `ff25-size-bm-monthly`, `ff5-monthly`, `mom-monthly` and `osap-ls-monthly` are all built. The OSAP set is closer to the anomaly portfolios that Kozak, Nagel & Santosh use.
  - CRSP is not needed.
- Libraries. There is one library per chapter, and none depends on another, so all three start at once.
  - What is reused, not copied:
    - `crossSectionalRegression`, `timeSeriesRegressions`, `factorPanel`, `modelPanel`;
    - `tangencyWeights`, `maxSharpeSquared`, `sampleMeans`, `sampleCovariance`;
    - `pca`, `symmetricEigen`, `solve`, `inverse`;
    - `cdf`, `invCdf`, `signalSummaries` and the RNG helpers.
  - `lib-skeptical-tests` must not duplicate `simulateUselessFactor` (chapter 27). Its random factors mix SMB, HML and noise, as the paper's Figure 1 does.
  - Each spec names reference-value tests, including exact identities:
    - the GLS R² is 1 for the in-sample tangency portfolio;
    - Holm rejects at least as many tests as Bonferroni, and BH at least as many as Holm;
    - the elastic net with no $L^1$ penalty equals ridge;
    - ridge with no penalty gives the tangency direction.
- Graph shape. The graph is wide and shallow. After apply, four tasks are ready at once: TASK-101 to TASK-104. The longest chain is data or library → chapter → sign-off, 3 nodes.
- Readings by absolute path. All are in `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/`, and I checked each with `pdftotext`.
  - Chapter 28: `LewellenNagelShanken2010.pdf` (working-paper version).
  - Chapter 29: `HarveyLiuZhu2016.pdf` and `HouXueZhang2018.pdf`.
  - Chapter 30: `KozakNagelSantosh2018.pdf` (the published 2020 version; cite 2020).
  - No reading the curriculum names for Part VII is missing.
- Lessons from the Part VI outcomes (TASK-093 to TASK-099) that went into the specs:
  - Notation first. Each library task adds its symbols to one "Part VII" block of the §3 table before any chapter runs. The first to merge creates the heading, and the others rebase and keep every row. The specs name the curriculum letters that §3 already uses:
    - for chapter 29: $\alpha$ is a pricing error, $M$ is the SDF and $p$ is a log price;
    - for chapter 30: $m_t$ and $F_t$ (written $M$ and $f$), $\gamma$ (risk aversion), $\kappa$ (Campbell–Shiller constant), $\tau$ (option life) and $R^2_{OS}$ (the forecast R² of chapter 13).
    - The workers must check each new letter against §3 first. TASK-093's proposed $L$ was already taken.
  - Shared widgets. Only one task edits a shared widget: chapter 30 adds an optional `FrontierBuilder` preset, with the default unchanged, and re-runs chapter 7's screenshots and click-through. Chapters 28 and 29 reuse `PCAExplorer` and `ZooChart` through their existing props. Their acceptance checks that those files did not change.
  - Reuse the existing loaders: `useFactorData`, `useZooData` and `loadSeries`. No new loading code that a hook already covers.
  - Test timeouts (issue #67). The library specs ask for small default grids and explicit timeouts on long tests. The widget specs ask for computing only after the slider stops, as `UselessFactor` does.
  - Recurring screenshot problems:
    - wide display math overflows on a 375px phone;
    - backslashes in `options={[...]}` strings must be doubled;
    - use `<details>`, not the missing `<Details>`.
  - Every sentence about another chapter must be true of the merged site. A prerequisite that is not merged yet is named by title.

Deviations:
- Sign-off task. TASK-035 asks for a manual owner-review task like TASK-029. The owner rule of 2026-10-23 removes owner approval gates, and plan tasks must not create them. The proposal format also has no `delivery` field. So, as in TASK-032 to TASK-034, the last task is a `kind: gate` PR task, and the orchestrator signs off by merging it.
- Routes. The proposal format has no `route` field, and `goal route` refuses to run in a worker shell. The library, chapter and sign-off tasks use the goal's `default_route` (claude opus high) or the gate's built-in route, so they need no override. The data task needs one. After apply, the orchestrator must run `goal route TASK-101 codex gpt-6.1-sol high`.
- Docs. Two library tasks may edit `docs/STYLE_GUIDE.md`, and the third must. The data task edits `docs/CURRICULUM.md` (one row removed, one dataset added to chapter 28's Data line), because building the data makes that row stale. The chapter specs keep the usual rule (report, do not edit), so parallel chapters cannot conflict.
- Acting on the new tasks. The owner rule says a planning task should dispatch its new tasks. These tasks do not exist until the orchestrator runs `goal proposal apply`, which refuses to run in a worker shell. After apply and the route command, dispatch TASK-101 to TASK-104.

Risks:
- The "Part VII" §3 block. Three library tasks add rows to it in parallel. The second and third must rebase and keep every row. Each spec says so.
- Chapter 30 in the browser. Cross-validated shrinkage paths on 31 to 100+ assets cost more than earlier widgets. The spec asks the worker to precompute the path once per setting and compute only after the slider stops.
- OSAP balanced panel. The spec asks for a common window with at least 40 signals. If OSAP's start dates leave fewer, the worker must state the count and the window.
- Selection in chapter 29. The OSAP signals are published survivors. The spec asks the chapter to say that the count that survives a rule is not the literature's false discovery rate.

Verified revision: the proposal and this outcome on branch `goal/course-site/task-035`, based on `main` `7776e99`. `goal proposal check`, `goal check --json` and `goal graph` all exit 0.

Proposed follow-ups:
- After apply, run `goal route TASK-101 codex gpt-6.1-sol high`, then dispatch TASK-101 to TASK-104.
