# TASK-033 outcome: Plan: decompose M-7

## Acceptance

- [x] `goal check --json` reports no errors. Evidence: in this worktree it prints `{"goal": "course-site", "issues": [], "ok": true}` and exits 0. `goal proposal check goals/course-site/proposals/TASK-033.yaml --goal course-site --json` prints `{"ok": true, "task": "TASK-033"}` and exits 0. That check validates the plan as it will be after apply, in memory.
- [x] `goal graph` shows the new M-7 tasks with library and data tasks before chapter tasks and the owner-review task last. Evidence: the new tasks appear in the live graph only after the orchestrator runs `goal proposal apply` (workers cannot apply). To preview, I wrote the twelve projected specs into a throwaway clone at `/tmp/t033-preview`, with the IDs apply should allocate (TASK-067 to TASK-078, in proposal order). There, `goal check --json -C /tmp/t033-preview` reports no issues and `goal graph -C /tmp/t033-preview` exits 0 with this M-7 block:

  ```
      │ ── M-7 · Part V: Factors, anomalies and conditional models 0/13 ──
      ▶  TASK-033  Plan: decompose M-7  [running]
  ◇   │  TASK-067  Data: French 2×3 sorts and daily factors  [ready]
  ├─╮ │
  ○ │ │  TASK-069  Library: factor models beyond FF3, 2×3 sorts, momentum and spanning tests  [needs TASK-067]
  ├─┼─┼─┬─╮
  ○ │ │ │ │  TASK-073  Chapter 19: Size and value  [needs TASK-069]
  ├─┼─┤ │ │
  │ │ │ │ │ ◇  TASK-068  Data: published anomaly portfolios from Open Source Asset Pricing  [ready]
  │ │ │ │ │ ○  TASK-070  Library: anomaly t-statistics across the factor zoo  [needs TASK-068]
  │ │ │ ├─┼─╯
  │ │ │ ○ │  TASK-075  Chapter 21: Anomalies and the factor zoo  [needs TASK-069, TASK-070]
  │ │ │ │ │ ◇  TASK-071  Library: conditional betas, scaled factors and the scaled CCAPM  [ready]
  │ │ │ │ │ ○  TASK-076  Chapter 22: Conditional factor models  [needs TASK-071]
  │ ○ │ │ │ │  TASK-072  Library: rolling and short-window betas and the Lewellen–Nagel alpha bound  [needs TASK-067]
  │ ○ │ │ │ │  TASK-077  Chapter 23: Does the conditional CAPM explain anomalies?  [needs TASK-072]
  │ ╰─┼─┤ │ │
  │   │ │ ○ │  TASK-074  Chapter 20: Momentum  [needs TASK-069]
  │   │ │ ╰─┤
  ├───┼─┴───╯
  ○   │  TASK-078  Orchestrator reads Part V and signs it off  [needs TASK-073, TASK-074, TASK-075, TASK-076, TASK-077]
      │ ── M-8 · Part VI: GMM and tests of asset pricing models 0/1 ──
      ○  TASK-034  Plan: decompose M-8  [needs TASK-033, TASK-073]
  ```

  Every chapter task depends only on library tasks, and every library task depends only on data tasks (or on nothing). The sign-off task comes last and depends on all five chapters.
- [x] Every chapter of Part V (19, 20, 21, 22, 23) has exactly one chapter task. Evidence: in the proposal, `chapter-19` writes `19-size-and-value.mdx`, `chapter-20` writes `20-momentum.mdx`, `chapter-21` writes `21-anomalies-and-the-factor-zoo.mdx`, `chapter-22` writes `22-conditional-factor-models.mdx` and `chapter-23` writes `23-does-the-conditional-capm-explain-anomalies.mdx`. No other task writes a chapter.

## Summary

What: `goals/course-site/proposals/TASK-033.yaml`. It adds twelve M-7 tasks and one link. All specs are filled and have no template lines.

| Ref (projected ID) | Kind | After | Delivers |
|---|---|---|---|
| `data-french-sorts-daily` (TASK-067) | data | — | `ff6-size-bm-monthly`, `ff6-size-mom-monthly` (French 2×3 sorts), `ff3-daily`, `mom-daily` (from 1963-07) |
| `data-osap` (TASK-068) | data | — | Open Source Asset Pricing long–short predictor returns (original, and value-weighted and ex-microcap if published) and signal documentation |
| `lib-factors` (TASK-069) | library | data-french-sorts-daily | `src/lib/finance/factors.ts`: `modelPanel` (CAPM, FF3, Carhart, FF5), `sortFactors`, `formationReturn`, `bearMarketRegression`, `worstMonths`, `windowBefore`, `spanningTest` |
| `lib-zoo` (TASK-070) | library | data-osap | `src/lib/finance/zoo.ts`: `signalSummaries`, `countAbove`, `compareConstructions`, `byPublicationYear` |
| `lib-conditional` (TASK-071) | library | — | `src/lib/finance/conditional.ts`: `simulateConditionalCapm`, `betaPremiumDecomposition`, `scaledFactors`, `managedPortfolios`, `quarterlyPanel`, `conditionalModelFits` |
| `lib-short-window` (TASK-072) | library | data-french-sorts-daily | `src/lib/finance/shortWindow.ts`: `dailyFactorPanel`, `rollingBetas`, `shortWindowRegressions`, `conditionalAlphaSummary`, `unconditionalAlpha`, `alphaBound` |
| `chapter-19` (TASK-073) | chapter | lib-factors | `SortGrid`, `FactorBuilder` |
| `chapter-20` (TASK-074) | chapter | lib-factors | `CompoundingPath` momentum prop, `CrashZoom`, `FactorBuilder` size–momentum |
| `chapter-21` (TASK-075) | chapter | lib-factors, lib-zoo | `ZooChart`, `SpanningTest` |
| `chapter-22` (TASK-076) | chapter | lib-conditional | `ConditionalBeta`, `ScaledFactors` |
| `chapter-23` (TASK-077) | chapter | lib-short-window | `RollingBeta`, `AlphaBound` |
| `part-5-signoff` (TASK-078) | gate | the five chapters | read-through report; the orchestrator signs off by merging |

Link: `TASK-034` (Plan: decompose M-8) now also waits on `chapter-19`, the first Part V chapter.

How:
- Data. The built datasets cover most of Part V. I added two data tasks only where a chapter needs data that is not built:
  - Chapters 19 and 20 rebuild SMB, HML and the momentum factor from the 2×3 sorts behind them. That needs French's two six-portfolio files.
  - Chapter 23 follows Lewellen & Nagel (2006), who run within-quarter regressions on daily returns (its introduction and its section on short-window regressions, read with `pdftotext`). That needs French's daily factors. The daily files start in 1963-07 to stay under 1 MB.
  - Chapter 21's zoo needs published anomaly returns. `docs/CURRICULUM.md` ("Data wanted later") names Open Source Asset Pricing as the public source.
  - Chapter 22 needs no new data. `fred-consumption-quarterly` starts in 2007, which is too short, so the spec takes consumption growth and $cay$ from `fred-cay-quarterly` through the existing `cay.ts`.
  - CRSP is not needed: the French portfolios are built from it already, and the OSAP data covers the anomalies.
- Libraries. There are four coherent libraries. Each reuses `timeSeriesRegressions`, `grs`, `crossSectionalRegression`, `cay.ts` and `ols` and does not copy them. `modelPanel` must equal `factorPanel` for CAPM and FF3, so Part IV's helper keeps working. Each spec names reference-value tests, including exact identities:
  - rebuilt HML, SMB and UMD match the published factors to source rounding;
  - a spanned factor has $\alpha = 0$ and $R^2 = 1$;
  - $\overline{\beta\lambda} = \overline{\beta}\,\overline{\lambda} + \widehat{\mathrm{Cov}}(\beta, \lambda)$ holds to 1e-12;
  - Lewellen & Nagel's unconditional-alpha formula matches a long seeded simulation.
- Graph shape. The graph is wide and shallow. Three tasks are ready at once after apply: TASK-067, TASK-068 and TASK-071. The longest chain is data → library → chapter → sign-off, 4 nodes.
- Readings by absolute path. The PDFs are in `source/papers/`:
  - Chapter 19: `FamaFrench1992.pdf`, `Cochrane2011.pdf`.
  - Chapter 20: `Cochrane2011.pdf`, `FamaFrench1992.pdf`.
  - Chapter 21: `Cochrane2011.pdf`, `HouXueZhang2018.pdf` (cite as 2020; report the curriculum's 2018), `HarveyLiuZhu2016.pdf`.
  - Chapter 22: `LettauLudvigson2001b.pdf`, `JagannathanWang1996.pdf`. The second is a scan with no text layer, so the spec says to render pages with `pdftoppm` and read them with `tesseract` (both installed).
  - Chapter 23: `LewellenNagel2006.pdf`.
  - Missing, so no fact may come from them: Cochrane (2005), Ch. 8; Fama & French (1993, 2015); Jegadeesh & Titman (1993); Carhart (1997); Daniel & Moskowitz (2016). The factors are described as the French Data Library pages describe them.
- Lessons from earlier outcomes went into the specs:
  - Every sentence about another chapter must be true of the merged site (TASK-024 review). Prerequisites that are not merged yet (chapters 14 and 17) are named by title.
  - Follow the §3 notation where the curriculum differs, and list missing symbols as candidates (TASK-028, TASK-049, TASK-057, TASK-063).
  - Keep one data helper per Part (`factorModelSample.ts`), and reuse the loaders of `factorTestSample.ts` (TASK-063).
  - One shared `FactorBuilder` serves chapters 19 and 20 through a `kind` prop.
  - Allow one optional prop on a shared widget, with the default unchanged and its chapter re-screenshotted (`CompoundingPath`, as TASK-058 did for `PredictiveRegression`).

Deviations:
- Sign-off task. TASK-033 asks for a manual owner-review task like TASK-029. The owner rule of 2026-10-23 removes owner approval gates, and plan tasks must not create them. The proposal format also has no `delivery` field. So, as in TASK-032, the last task is a `kind: gate` PR task, and the orchestrator signs off by merging it.
- Routes. The proposal format has no `route` field: `goal proposal check` rejects it with "unknown field `route`". `goal route` refuses to run in a worker shell. The library, chapter and sign-off tasks use the goal's `default_route` (claude opus high), so they need no override. The two data tasks need one. After apply, the orchestrator must run:
  1. `goal route TASK-067 codex gpt-6.1-sol high`
  2. `goal route TASK-068 codex gpt-6.1-sol high`
- Parallel data tasks. TASK-067 and TASK-068 both edit `scripts/data/fetch.py`, `src/lib/data/series.ts`, `src/lib/data/series.test.ts` and `docs/DATA.md`. I kept them parallel to keep the graph shallow. Each spec tells the worker to rebase on `origin/main` and keep both sets of entries.
- Acting on the new tasks. The owner rule says a planning task should dispatch its new tasks. These tasks do not exist until the orchestrator runs `goal proposal apply`, which refuses to run in a worker shell. After apply and the two `goal route` commands, dispatch TASK-067, TASK-068 and TASK-071. The other tasks wait on them.

Risks:
- OSAP downloads come from Google Drive or a Python package, and may be blocked. TASK-068 then blocks with the exact files to download. Only TASK-070 and chapter 21 wait on it.
- Licence terms for the OSAP data are not checked yet. TASK-068 records them in `docs/DATA.md`. It follows the goal's assumption for small public academic extracts if no licence is stated.

Verified revision: the proposal and this outcome on branch `goal/course-site/task-033`, based on `main` `b8dce26`. `goal proposal check`, `goal check --json` and `goal graph` all exit 0.

Proposed follow-ups:
- After apply, set the two data routes and dispatch TASK-067, TASK-068 and TASK-071.
- After Part V, add its candidate symbols to the §3 table. Do it in one style-guide task, together with the Part III and Part IV candidates.
