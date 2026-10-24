# TASK-034 outcome: Plan: decompose M-8

## Acceptance

- [x] `goal check --json` reports no errors. Evidence: in this worktree it prints `{"goal": "course-site", "issues": [], "ok": true}` and exits 0. `goal proposal check goals/course-site/proposals/TASK-034.yaml --goal course-site --json` prints `{"ok": true, "task": "TASK-034"}` and exits 0. That check validates the plan as it will be after apply, in memory.
- [x] `goal graph` shows the new M-8 tasks with library and data tasks before chapter tasks and the owner-review task last. Evidence: the new tasks appear in the live graph only after the orchestrator runs `goal proposal apply` (workers cannot apply). To preview, I wrote the eight projected specs and the link into a throwaway clone at `/tmp/t034-preview`, with the IDs apply should allocate (TASK-085 to TASK-092, in proposal order; the orchestrator added TASK-081 to TASK-084 to `main` while this task ran, so apply may still shift them). There, `goal check --json -C /tmp/t034-preview` reports no issues and `goal graph -C /tmp/t034-preview` exits 0 with this M-8 block:

  ```
      │ ── M-8 · Part VI: GMM and tests of asset pricing models 0/9 ──
      ▶  TASK-034  Plan: decompose M-8  [running]
  ◇   │  TASK-085  Library: GMM estimation, the J test and the chi-square distribution  [ready]
  ├─┬─┼─┬─╮
  ○ │ │ │ │  TASK-086  Library: linear SDF models by GMM and the Hansen–Jagannathan distance  [needs TASK-085]
  ○ │ │ │ │  TASK-090  Chapter 26: GMM for asset pricing models  [needs TASK-086]
  │ ○ │ │ │  TASK-087  Library: useless factors, the rank test and GRS-FAR confidence sets  [needs TASK-085]
  │ ○ │ │ │  TASK-091  Chapter 27: Identification: weak and useless factors  [needs TASK-087]
  │ │ │ ○ │  TASK-088  Chapter 24: The generalized method of moments  [needs TASK-085]
  │ │ │ ├─┼─╮
  │ │ │ │ ○ │  TASK-089  Chapter 25: Efficient and feasible GMM  [needs TASK-085]
  ├─┴─┼─┴─╯ │
  ○   │     │  TASK-092  Orchestrator reads Part VI and signs it off  [needs TASK-088, TASK-089, TASK-090, TASK-091]
      │     │ ── M-9 · Part VII: The factor zoo and shrinkage 0/1 ──
      ├─────╯
      ○  TASK-035  Plan: decompose M-9  [needs TASK-034, TASK-088]
  ```

  Every chapter task depends only on library tasks. Every library task depends only on `lib-gmm` (or on nothing). There is no data task (see How). The sign-off task comes last and depends on all four chapters.
- [x] Every chapter of Part VI (24, 25, 26, 27) has exactly one chapter task. Evidence: in the proposal, `chapter-24` writes `24-generalized-method-of-moments.mdx`, `chapter-25` writes `25-efficient-and-feasible-gmm.mdx`, `chapter-26` writes `26-gmm-for-asset-pricing-models.mdx` and `chapter-27` writes `27-weak-and-useless-factors.mdx`. No other task writes a chapter.

## Summary

What: `goals/course-site/proposals/TASK-034.yaml`. It adds eight M-8 tasks and one link. All specs are filled and have no template lines.

| Ref (projected ID) | Kind | After | Delivers |
|---|---|---|---|
| `lib-gmm` (TASK-085) | library | — | `src/lib/stats/gmm.ts` (`longRunCovariance`, `gmm` one-step/two-step/iterated/CUE, `linearGmm`, `gmmObjective`, `objectiveSurface`, toy model, `simulateJTest`); `minimize` in `src/lib/math/optimize.ts`; `chiSquareCdf`/`chiSquareSurvival`; the Part VI block of the §3 notation table |
| `lib-sdf-gmm` (TASK-086) | library | lib-gmm | `src/lib/finance/sdfGmm.ts`: `linearSdfGmm`, `hjDistance`, `sdfModelFits` |
| `lib-identification` (TASK-087) | library | lib-gmm | `src/lib/finance/identification.ts`: `simulateUselessFactor`, `rankTest`, `grsFar`, `farConfidenceSet`, `waldConfidenceSet`, `simulateWeakIdentification` |
| `chapter-24` (TASK-088) | chapter | lib-gmm | `GMMObjective` (with a `methods` prop) |
| `chapter-25` (TASK-089) | chapter | lib-gmm | `GMMObjective` with all four methods, `JTestSim` |
| `chapter-26` (TASK-090) | chapter | lib-sdf-gmm | `RegressionLab` preset, `HJDistance` |
| `chapter-27` (TASK-091) | chapter | lib-identification | `UselessFactor`, `ConfidenceSet` |
| `part-6-signoff` (TASK-092) | gate | the four chapters | read-through report; the orchestrator signs off by merging |

Link: `TASK-035` (Plan: decompose M-9) now also waits on `chapter-24`, the first Part VI chapter.

How:
- Data. No data task is needed.
  - Chapters 24 and 25 use seeded simulations only.
  - Chapters 26 and 27 need the 25 portfolios, FF3 and consumption growth. The curriculum names `fred-consumption-quarterly`, but it starts in 2007, which is too short. `quarterlyPanel` in `src/lib/finance/conditional.ts` (Part V) already builds quarterly 25-portfolio excess returns, FF3 factors and $\Delta c$ from `fred-cay-quarterly` (1951-Q4 on). Both chapter specs use it and report the mismatch.
  - CRSP is not needed.
- Libraries. There are three coherent libraries. `lib-gmm` is the core; the other two build on it in parallel.
  - Reuse instead of copies: `serialCovariance` in `ols.ts` gets the `export` keyword only, and `longRunCovariance` builds on it. The specs name `ols`, `solve`, `inverse`, `logGamma`, `quarterlyPanel`, `timeSeriesRegressions`, `crossSectionalRegression`, `famaMacBeth`, `shankenCorrection`, `grs` and `maxSharpeSquared` for reuse.
  - Each spec names reference-value tests, including exact identities:
    - GMM on the OLS moments reproduces `ols()` and its Newey–West standard errors;
    - over-identified IV with $W = (Z'Z/T)^{-1}$ equals 2SLS;
    - first-stage SDF GMM gives the same $\hat\lambda$ as the cross-sectional regression on betas;
    - $\delta_{\text{HJ}}^2 = SR^2/(1 + SR^2)$ with no factors;
    - the two forms of Kleibergen & Zhan's GRS-FAR statistic (their eq. 23) agree.
- Graph shape. The graph is wide and shallow. After apply, TASK-085 is ready. When it merges, four tasks are ready at once: TASK-086 to TASK-089. The longest chain is library → library → chapter → sign-off, 4 nodes.
- Readings by absolute path (all in `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/`, each checked with `pdftotext`):
  - Chapters 24 and 25: `Nagel2013.pdf`.
  - Chapter 26: `Nagel2013.pdf`, `GospodinovKanRobotti2019.pdf`.
  - Chapter 27: `GospodinovKanRobotti2019.pdf`, `KleibergenZhan2019.pdf` (the published 2020 version; cite 2020), `Nagel2013.pdf`.
  - Missing, so no fact may come from them: Cochrane (2005), Ch. 10–11 and 13; Hansen & Jagannathan (1997); Kan & Zhang (1999).
  - `docs/READINGS.md` still lists Kleibergen & Zhan as "owner to supply", but the PDF is now in `source/papers/`. The library spec says so. Updating `docs/READINGS.md` is a follow-up.
- Lessons from earlier outcomes went into the specs:
  - Notation first. Parts III–V each left lists of candidate symbols for later fix tasks (TASK-063, TASK-073 to TASK-077, TASK-080). Here `lib-gmm`, which runs before every chapter, adds one Part VI block to the §3 table. It proposes a letter for each curriculum symbol that clashes with §3: $g(x_t,\theta)$ not $f$ (factors), $D$ not $d$ (log dividend), $W$ not $w$ (weights), $L$ and $\dim\theta$ not $r - k$, $\delta_{\text{HJ}}$, and $\lambda^{\circ}$ not $\lambda_{f,0}$ (zero-beta rate $\lambda_0$). The chapters must use $M$ for the SDF, not the curriculum's $m$ (TASK-076).
  - One shared widget. Chapters 24 and 25 share `GMMObjective` through a `methods` prop, and `gmmSample.ts`. Both specs describe the widget the same way, so whichever chapter lands first builds it, and the other reuses it (as `FactorBuilder` in Part V).
  - Reuse the Part V loaders (`useConditionalData`) and the Part IV loaders (`factorTestSample.ts`), with no new loading code (TASK-063, TASK-076).
  - One optional prop on a shared widget, with the default unchanged and its chapter re-screenshotted: the `RegressionLab` preset re-runs chapter 3's screenshots and click-through (as TASK-058 did).
  - Every sentence about another chapter must be true of the merged site. A prerequisite that is not merged yet is named by title (TASK-024 review, TASK-077).

Deviations:
- Sign-off task. TASK-034 asks for a manual owner-review task like TASK-029. The owner rule of 2026-10-23 removes owner approval gates, and plan tasks must not create them. The proposal format also has no `delivery` field. So, as in TASK-032 and TASK-033, the last task is a `kind: gate` PR task, and the orchestrator signs off by merging it.
- Routes. The proposal format has no `route` field. All eight tasks are creative (libraries, chapters, widgets, a read-through), so the goal's `default_route` (claude opus high) applies. No `goal route` override is needed.
- One library task edits `docs/STYLE_GUIDE.md`. The chapter specs keep the usual rule (report, do not edit), so parallel chapters cannot conflict on the table.
- Acting on the new tasks. The owner rule says a planning task should dispatch its new tasks. These tasks do not exist until the orchestrator runs `goal proposal apply`, which refuses to run in a worker shell. After apply, dispatch TASK-085 (the only ready task); the others wait on it.

Risks:
- GMM in the browser. `JTestSim` runs many seeded GMM fits. The spec asks the worker to keep the default run fast and state the timing.
- Kleibergen & Zhan's GRS-FAR uses $N - 1$ returns against a zero-beta rate. The spec tells the worker to follow eqs. (21)–(26) and state the construction, and to test only identities the paper states.
- Chapters 24 and 25 run in parallel and share one widget. If both create it, the second must rebase and keep one `GMMObjective`. The chapter 25 acceptance checks that one file exists.
- Part V fix tasks on `main`. TASK-081 (Part V notation) also adds rows to the §3 table, so the `lib-gmm` spec tells its worker to rebase and keep both blocks. TASK-083 moves the series-loading hook into one module but keeps `useConditionalData` and `useFactorData`, which the chapter 26 and 27 specs reuse; they also forbid new `useEffect` loading code.
- A transient `goal proposal check` error. One run reported E019 (template placeholders) for TASK-081 to TASK-084. The orchestrator was adding those tasks at that moment; the next run, after TASK-084 was cancelled and the others were filled, exited 0.

Verified revision: the proposal and this outcome on branch `goal/course-site/task-034`, based on `main` `e088df7`. `goal proposal check`, `goal check --json` and `goal graph` all exit 0.

Proposed follow-ups:
- After apply, dispatch TASK-085.
- Update `docs/READINGS.md`: `KleibergenZhan2019` is now in `source/papers/`.
