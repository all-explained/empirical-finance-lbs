# TASK-032 outcome: Plan: decompose M-6

## Acceptance

- [x] `goal check --json` reports no errors. Evidence: in this worktree it prints `{"goal": "course-site", "issues": [], "ok": true}` and exits 0. `goal proposal check goals/course-site/proposals/TASK-032.yaml --goal course-site --json` prints `{"ok": true, "task": "TASK-032"}` and exits 0. That check validates the plan as it will be after apply, in memory.
- [x] `goal graph` shows the new M-6 tasks with library and data tasks before chapter tasks and the owner-review task last. Evidence: the new tasks appear in the live graph only after the orchestrator runs `goal proposal apply` (workers cannot apply). To preview, I wrote the six projected specs into a throwaway clone at `/tmp/t032-preview`, with the IDs apply should allocate. There, `goal check --json` reports no issues and `goal graph -C /tmp/t032-preview` exits 0 with this M-6 block:

  ```
      │ ── M-6 · Part IV: Cross-sectional tests 0/7 ──
      ▶  TASK-032  Plan: decompose M-6  [running]
  ◇   │  TASK-061  Library: the F distribution, time-series factor regressions and GRS  [ready]
  ├─╮ │
  ○ │ │  TASK-062  Library: two-pass regressions, Fama–MacBeth and the Shanken correction  [needs TASK-061]
  ├─┼─┼─╮
  ○ │ │ │  TASK-064  Chapter 17: Cross-sectional regressions and Fama–MacBeth  [needs TASK-062]
  │ ○ │ │  TASK-063  Chapter 16: Time-series tests and the GRS statistic  [needs TASK-061]
  │ ├─┤ │
  │ │ │ ○  TASK-065  Chapter 18: Errors in variables and the Shanken correction  [needs TASK-062]
  ├─┴─┼─╯
  ○   │  TASK-066  Orchestrator reads Part IV and signs it off  [needs TASK-063, TASK-064, TASK-065]
      │ ── M-7 · Part V: Factors, anomalies and conditional models 0/1 ──
      ○  TASK-033  Plan: decompose M-7  [needs TASK-032, TASK-063]
  ```

  Both libraries come before the chapters. The sign-off task comes last and depends on all three chapters. No data task is needed (see below).
- [x] Every chapter of Part IV (16, 17, 18) has exactly one chapter task. Evidence: in the proposal, `chapter-16` writes `16-time-series-tests-and-grs.mdx`, `chapter-17` writes `17-cross-sectional-regressions-and-fama-macbeth.mdx` and `chapter-18` writes `18-errors-in-variables-and-shanken.mdx`. No other task writes a chapter.

## Summary

What: `goals/course-site/proposals/TASK-032.yaml`. It adds six M-6 tasks and one link. All specs are filled and have no template lines.

| Ref (projected ID) | Kind | After | Delivers |
|---|---|---|---|
| `lib-time-series-tests` (TASK-061) | library | — | `src/lib/math/distributions.ts` (log-gamma, incomplete beta, F CDF) and `src/lib/finance/timeSeriesTests.ts` (`factorPanel`, `timeSeriesRegressions`, `grs`, `sharpeFrontiers`) |
| `lib-two-pass` (TASK-062) | library | lib-time-series-tests | `src/lib/finance/crossSection.ts` (`crossSectionalRegression` OLS/GLS, `famaMacBeth`, `shankenCorrection`, `simulateTwoPass`) |
| `chapter-16` (TASK-063) | chapter | lib-time-series-tests | `AlphaBars`, `GRSGeometry` |
| `chapter-17` (TASK-064) | chapter | lib-two-pass | `FamaMacBethMovie`, `SMLPlot` fitted-against-actual view |
| `chapter-18` (TASK-065) | chapter | lib-two-pass | `ShankenCorrection` |
| `part-4-signoff` (TASK-066) | gate | the three chapters | read-through report; the orchestrator signs off by merging |

Link: `TASK-033` (Plan: decompose M-7) now also waits on `chapter-16`. Part V is then planned once the first Part IV chapter has proved the pattern.

How:
- Data. Every Part IV chapter uses `ff25-size-bm-monthly` and `ff3-monthly`. Both are built (`docs/DATA.md`). Chapter 18 adds a seeded simulation. CRSP is not needed, so I added no data task.
- Libraries. The second library reuses the first library's first pass (`timeSeriesRegressions`) and panel (`factorPanel`), so it does not refit them. This gives the chain TASK-061 → TASK-062 → chapter 17 or 18 → sign-off. That is 4 nodes, within the 3–4 limit. Chapter 16 can start as soon as TASK-061 merges. Each library spec names reference-value tests, including exact identities: $\hat\alpha'\hat\Sigma_\varepsilon^{-1}\hat\alpha = SR^2_{\text{all}} - SR^2_f$; with constant betas, Fama–MacBeth equals the two-pass estimate; with a traded factor as a test asset, GLS gives $\hat\lambda$ equal to the factor mean.
- One data helper. The panel lives in the library. All three chapter specs name a single hook file, `src/components/plots/factorTestSample.ts`. Chapters 17 and 18 use it if chapter 16 has merged it; otherwise the first chapter to finish creates it. The sign-off checks that there is no duplicate loading code.
- Readings by absolute path. Chapter 16: `GibbonsRossShanken1987.pdf`, cited as 1989 (the publication year, per `docs/READINGS.md`); the curriculum's "1987" is reported as a mismatch. Chapter 17: `Cochrane2011.pdf` and `FamaFrench1992.pdf`. Chapter 18 has no supplied reading. Cochrane (2005), Fama & MacBeth (1973) and Shanken (1992) are missing, so the specs allow no fact from them. Chapter 18 derives the correction itself.
- Lessons from earlier outcomes went into the specs. Every sentence about another chapter must be true of the merged site (TASK-024 review). Follow the §3 notation where the curriculum differs: the curriculum writes $\hat\Omega$ for the factor covariance and $\Sigma$ for the residual covariance, but §3 has $\Sigma_f$ and $\Sigma_\varepsilon$. List missing symbols as candidates (TASK-028, TASK-049, TASK-057). Allow one optional prop on a shared widget, with the default unchanged and its chapter re-screenshotted (TASK-058 did this for `PredictiveRegression`; here it is `SMLPlot`). Respect `prefers-reduced-motion` in the Fama–MacBeth movie.

Deviations:
- Sign-off task. The proposal format (`goal-proposal/v1`) has no `delivery` field. `goal proposal check` rejected `delivery: manual` with "unknown field". So the sign-off cannot be a manual task like TASK-060. It is a `kind: gate` PR task. A worker runs build, screenshots and click-through for chapters 16–18, reads them and writes a report with a `## Sign-off` section. The orchestrator signs off by merging that PR. This follows the owner rule of 2026-10-23: no owner approval gate.
- Routes. The proposal format has no `route` field, and `goal route` refuses to run in a worker shell. All six tasks are library, chapter or reading tasks, so they should run on claude opus high. That is the goal's `default_route`, so no route override is needed.
- Acting on the new tasks. The owner rule says a planning task should dispatch its new tasks. These tasks do not exist until the orchestrator runs `goal proposal apply`, which refuses to run in an agent shell. After apply, TASK-061 (projected ID) is ready at once and is the only task to dispatch. The other tasks wait on it.

Verified revision: the proposal and this outcome on branch `goal/course-site/task-032`, based on `main` `7560113`. `goal proposal check`, `goal check --json` and `goal graph` all exit 0.

Proposed follow-ups:
- After apply, dispatch the first library task (projected TASK-061).
- `docs/READINGS.md` still marks `FamaFrench1992`, `GibbonsRossShanken1987` and `KleibergenZhan2019` as "owner to supply", but their PDFs are in `source/papers/`. Reported as https://github.com/all-explained/empirical-finance-lbs/issues/45 and not fixed here (out of scope).
- After Part IV, add its candidate symbols ($GRS$, $SR_{\text{all}}$, $SR_f$, $\lambda_0$, $\hat\lambda_t$, $c$) to the §3 table, in one style-guide task together with the Part III candidates.
