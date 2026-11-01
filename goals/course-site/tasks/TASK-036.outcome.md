# TASK-036 outcome: Plan: decompose M-10

## Acceptance

- [x] `goal check --json` reports no errors. Evidence: in this worktree it prints `{"goal": "course-site", "issues": [], "ok": true}` and exits 0. `goal proposal check goals/course-site/proposals/TASK-036.yaml --goal course-site` prints `Proposal from TASK-036 is valid` and exits 0. That check validates, in memory, the plan as it will be after apply.
- [x] `goal graph` shows the new M-10 tasks with library and data tasks before chapter tasks and the owner-review task last. Evidence: the new tasks reach the live graph only after the orchestrator runs `goal proposal apply`, which refuses to run in an agent shell ("reserved for you; it refuses to run in an agent shell"). To preview, I rendered the nine projected specs and the link into a throwaway clone at `/tmp/t036-preview`, with the IDs apply should allocate (TASK-112 to TASK-120, in proposal order). There, `goal check --json --offline` reports no issues, and `goal graph --offline` exits 0 with this M-10 block:

  ```
      │ ── M-10 · Part VIII: Latent factors and large cross-sections 0/10 ──
      ▶  TASK-036  Plan: decompose M-10  [running]
  ◇   │  TASK-112  Library: PCA factors, rotations, canonical correlations and latent-factor risk premia  [ready]
  ├─╮ │
  ○ │ │  TASK-115  Library: the three-pass estimator and a seeded economy with an omitted factor  [needs TASK-112]
  ○ │ │  TASK-119  Chapter 34: Risk premia with omitted factors  [needs TASK-115]
  │ │ │ ◇  TASK-113  Library: instrumented PCA by alternating least squares, managed portfolios and the alpha test  [ready]
  │ │ │ ○  TASK-117  Chapter 32: Characteristics are covariances: IPCA  [needs TASK-113]
  │ │ │ │ ◇  TASK-114  Library: characteristic portfolios from cross-sectional regressions, and factor-mimicking portfolios  [ready]
  │ │ │ │ ○  TASK-118  Chapter 33: Characteristic-based mimicking portfolios  [needs TASK-114]
  │ ○ │ │ │  TASK-116  Chapter 31: Latent and observable factors  [needs TASK-112]
  │ ╰─┼─┤ │
  ├───┼─┴─╯
  ○   │  TASK-120  Orchestrator reads Part VIII and signs it off  [needs TASK-116, TASK-117, TASK-118, TASK-119]
      │ ── M-11 · Part IX: Consumption: data and the equity premium puzzle 0/1 ──
      ○  TASK-037  Plan: decompose M-11  [needs TASK-036, TASK-116]
  ```

  Every chapter task depends only on the library task it uses. The four library tasks come before the chapters; the sign-off task comes last and depends on all four chapters. No data task is needed (see How).
- [x] Every chapter of Part VIII (31, 32, 33, 34) has exactly one chapter task. Evidence: in the proposal, `chapter-31` writes `31-latent-and-observable-factors.mdx`, `chapter-32` writes `32-characteristics-are-covariances-ipca.mdx`, `chapter-33` writes `33-characteristic-based-mimicking-portfolios.mdx` and `chapter-34` writes `34-risk-premia-with-omitted-factors.mdx`. No other task writes a chapter.

## Summary

What: `goals/course-site/proposals/TASK-036.yaml`. It adds nine M-10 tasks and one link. Every spec is filled and has no template lines.

| Ref (projected ID) | Kind | After | Delivers |
|---|---|---|---|
| `lib-latent-factors` (TASK-112) | library | — | `src/lib/finance/latentFactors.ts`: `pcaFactors`, `rotateFactors`, `canonicalCorrelations`, `latentRiskPremia` |
| `lib-ipca` (TASK-113) | library | — | `src/lib/finance/ipca.ts`: `simulateIpcaPanel`, `managedPortfolios`, `ipcaFit`, `ipcaR2`, `alphaTest` |
| `lib-mimicking` (TASK-114) | library | — | `src/lib/finance/mimicking.ts`: `slopeWeights`, `slopePortfolios`, `ff25Characteristics`, `sortWeights`, `mimickingPortfolio` |
| `lib-three-pass` (TASK-115) | library | lib-latent-factors | `src/lib/finance/threePass.ts`: `threePass`, `twoPass`, `simulateOmittedFactor` |
| `chapter-31` (TASK-116) | chapter | lib-latent-factors | an optional canonical-correlation view in `PCAExplorer`, default views unchanged |
| `chapter-32` (TASK-117) | chapter | lib-ipca | `IPCAFit` on a seeded panel |
| `chapter-33` (TASK-118) | chapter | lib-mimicking | an optional weights view in `SortGrid`, default views unchanged; `MimickingPortfolio` |
| `chapter-34` (TASK-119) | chapter | lib-three-pass | `OmittedFactorBias` |
| `part-8-signoff` (TASK-120) | gate | the four chapters | read-through report; the orchestrator signs off by merging |

Link: `TASK-037` (Plan: decompose M-11) now also waits on `chapter-31`, the first Part VIII chapter.

How:
- Data. No data task is needed.
  - Chapters 31 and 34 use `ff25-size-bm-monthly` and `ff3-monthly`. Chapter 34 also uses `ff30-industry-monthly`, which TASK-102 built, so the three-pass estimator runs on 55 assets as well as 25. That is closer to the large cross-section that Giglio & Xiu need.
  - Chapter 32 uses a seeded panel, as the curriculum says. Real IPCA needs a firm-level characteristics panel (CRSP and Compustat), which is licensed and not supplied in that form.
  - Chapter 33 needs consumption growth on quarterly 25-portfolio returns. `quarterlyPanel` in `src/lib/finance/conditional.ts` already builds it (chapters 22 and 26 use it). The curriculum's data line names `fred-consumption-quarterly`; the spec uses the existing panel so that the site shows one consumption series, and asks the chapter to report the mismatch.
  - CRSP is not needed.
- Libraries. There is one library per chapter. Three start at once; the three-pass library waits for the latent-factor library so that the PCA factors and the rotation are written once (`pcaFactors`, `rotateFactors`).
  - What is reused, not copied: `pca`, `scores`, `ff25Returns`, `symmetricEigen`, `solve`, `inverse`, `crossSectionalRegression`, `famaMacBeth`, `ols`, `factorPanel`, `quarterlyPanel`, `sampleMeans`, `sampleCovariance` and the RNG helpers.
  - Each spec names reference-value tests, including exact identities: rotated factors leave the fit and the three-pass premium unchanged; canonical correlations do not change under a rotation; IPCA with $K = L$ equals the Fama–MacBeth slopes (Kelly, Pruitt & Su, p. 15); slope weights times the characteristics give the identity; a factor that is an exact portfolio is mimicked with correlation 1.
  - The IPCA library fits the model from the managed portfolios $Z_t'r_{t+1}$ and $Z_t'Z_t$ alone. The first-order conditions need nothing else. So the widget's cost does not grow with the number of firms.
- Graph shape. The graph is wide and shallow. After apply, three tasks are ready at once: TASK-112 to TASK-114. The longest chain is library → library → chapter → sign-off, 4 nodes.
- Readings by absolute path. All are in `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/`, and I opened each with `pdftotext` and checked the pages the specs cite.
  - Chapter 31: `Nagel2013.pdf` (NBER working paper 18554), `GiglioXiu2021.pdf` (published), `KellyPruittSu2018.pdf` (NBER working paper, April 2018; published 2019).
  - Chapter 32: `KellyPruittSu2018.pdf`.
  - Chapter 33: `FamaFrench1992.pdf` (published) and `KellyPruittSu2018.pdf`; `GiglioXiu2021.pdf` pp. 1954–1955 for the bias of mimicking portfolios on too few base assets.
  - Chapter 34: `GiglioXiu2021.pdf`.
  - No reading the curriculum names for Part VIII is missing. `docs/READINGS.md` still lists `FamaFrench1992` as "owner to supply", but the PDF is now in `source/papers/` (issue #45).
  - No paper in `source/papers/` defines canonical correlations. The latent-factor spec asks for the textbook definition and no citation for it.
- Lessons from the Part VII outcomes (TASK-102 to TASK-108) that went into the specs:
  - Paper details. TASK-103 found that its spec described Lewellen, Nagel & Shanken's Figure 1 wrongly. These specs cite only pages I checked, and each library spec says: where the paper differs from the spec, follow the paper and report it.
  - Look-ahead. TASK-108 found whole-sample betas inside split-sample numbers. The latent-factor and three-pass specs ask for a doc comment that says every real-data estimate uses the whole sample, and chapter 31 must teach that the PCs price the returns they came from.
  - Notation. Each library adds its symbols to one "Part VIII" block of §3; the first to merge creates the heading, and the others rebase and keep every row. The specs name the curriculum letters that §3 already uses: $\gamma$ (risk aversion), $\eta$ (Chapter 22's SDF intercept), $z_t$ (a state variable), $x_t$ (a predictor), $g$ (the GMM moment), $W$ (the GMM weighting matrix), $L$ (Newey–West lags), $c_t$ (log consumption), $e$ (a Chapter 19 residual) and $u_t$, $v_t$ (second-equation shocks).
  - Symbols from chapters. TASK-106 to TASK-108 each listed symbols §3 still lacked, and the TASK-108 review asked for §3 edits that its spec had ruled out. CLAUDE.md says a new symbol goes into §3 in the same PR. So the Part VIII chapter specs let each chapter add its missing symbols to the Part VIII block (rebase first, keep every row), and a new colour to §4.
  - Shared widgets. Only two tasks edit a shared widget, each with one optional view and the default unchanged: chapter 31 edits `PCAExplorer` and re-runs chapters 6 and 28; chapter 33 edits `SortGrid` and re-runs chapter 19. The sign-off checks both.
  - Reuse the existing loaders (`usePcaData`, `useFactorData`, `useModelData`, the skeptical and quarterly-panel hooks). No new loading code that a hook already covers.
  - Test timeouts (issue #67): small default bootstraps and simulation sizes, explicit timeouts on long tests, widgets that compute after the slider stops.
  - Recurring screenshot problems: wide display math on a 375px phone, doubled backslashes in `options={[...]}` strings, `<details>` instead of the missing `<Details>`.
  - Every sentence about another chapter must be true of the merged site. A prerequisite that is not merged yet is named by title.

Deviations:
- Sign-off task. TASK-036 asks for a manual owner-review task like TASK-029. The owner rule of 2026-10-23 removes owner approval gates, and plan tasks must not create them. The proposal format also has no `delivery` field. So, as in TASK-032 to TASK-035, the last task is a `kind: gate` PR task, and the orchestrator signs off by merging it.
- Routes. The proposal format has no `route` field, and `goal route` is not a worker command. Every new task is creative (libraries, chapters, a read-through), so the goal's `default_route` (claude opus high) applies and no override is needed. There is no data task to route to codex.
- Chapter 34 adds `ff30-industry-monthly`, and chapter 33 uses the consumption growth of `quarterlyPanel` instead of `fred-consumption-quarterly`. Both chapters must report the change against the curriculum's data line.
- Acting on the new tasks. The owner rule says a planning task should dispatch its new tasks. These tasks do not exist until the orchestrator runs `goal proposal apply`, which refuses to run in a worker shell. After apply, dispatch TASK-112 to TASK-114.

Risks:
- The "Part VIII" §3 block. Four library tasks and four chapter tasks may add rows to it. Each must rebase and keep every row; each spec says so.
- IPCA in the browser. ALS plus a bootstrap is the heaviest computation in the Part. The spec keeps the seeded panel small, runs ALS on the $L$-dimensional managed portfolios, and computes the bootstrap after the slider stops.
- Weak real-data results. On 25 or 55 portfolios the three-pass premia may not differ much from the two-pass ones, and the mimicking portfolio for consumption growth may overfit. The specs ask the chapters to say plainly what our data show and to show the split-sample correlation.

Verified revision: the proposal and this outcome on branch `goal/course-site/task-036`, based on `main` `fec327f` (`origin/main` is `f7d5a6b`, which only records this task's dispatch). `goal proposal check`, `goal check --json` and `goal graph` all exit 0.

Proposed follow-ups:
- After apply, dispatch TASK-112 to TASK-114.
- `docs/READINGS.md` lists `FamaFrench1992` as "owner to supply" although the PDF is in `source/papers/`. Open issue all-explained/empirical-finance-lbs#45 already tracks it.
