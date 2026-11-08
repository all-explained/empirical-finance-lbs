# TASK-038 outcome: Plan: decompose M-12

## Acceptance

- [x] `goal check --json` reports no errors. Evidence: in this worktree it prints `{"goal": "course-site", "issues": [], "ok": true}` and exits 0. `goal proposal check goals/course-site/proposals/TASK-038.yaml --goal course-site` prints `Proposal from TASK-038 is valid` and exits 0. That check validates, in memory, the plan as it will be after apply.
- [x] `goal graph` shows the new M-12 tasks with library and data tasks before chapter tasks and the owner-review task last. Evidence: the new tasks reach the live graph only after the orchestrator runs `goal proposal apply`, which a worker shell cannot run. To preview, I rendered the seven projected specs and the link into a throwaway clone at `/tmp/t038-preview`, with the IDs apply should allocate (TASK-136 to TASK-142, in proposal order). There, `goal check --json --offline` reports no issues, and `goal graph --offline` exits 0 with this M-12 block:

  ```
      │ ── M-12 · Part X: Habits, long-run risk and disasters 0/8 ──
      ▶  TASK-038  Plan: decompose M-12  [running]
  ◇   │  TASK-136  Library: the Campbell–Cochrane habit model, its price–consumption ratio and Gauss–Hermite quadrature  [ready]
  ○   │  TASK-139  Chapter 37: Internal and external habits  [needs TASK-136]
  ├───┤
  │ ◇ │  TASK-137  Library: Epstein–Zin pricing, the long-run risks solution, simulation and variance ratios  [ready]
  │ ○ │  TASK-140  Chapter 38: Long-run risk  [needs TASK-137]
  │ │ │ ◇  TASK-138  Library: rare-disaster pricing, seeded disaster centuries and the relative entropy estimator  [ready]
  │ │ │ ○  TASK-141  Chapter 39: Rare disasters and jump risk  [needs TASK-138]
  ├─┴─┼─╯
  ○   │  TASK-142  Orchestrator reads Part X and signs it off  [needs TASK-139, TASK-140, TASK-141]
      │ ── M-13 · Part XI: The term structure: facts 0/1 ──
      ○  TASK-039  Plan: decompose M-13  [needs TASK-038, TASK-139]
  ```

  Each library comes before its chapter, and the sign-off task is last. It depends on all three chapters. No data task is needed (see How).
- [x] Every chapter of Part X (37, 38, 39) has exactly one chapter task. Evidence: in the proposal, `chapter-37` writes `37-internal-and-external-habits.mdx`, `chapter-38` writes `38-long-run-risk.mdx` and `chapter-39` writes `39-rare-disasters-and-jump-risk.mdx`. No other task writes a chapter.

## Summary

What: `goals/course-site/proposals/TASK-038.yaml`. It adds seven M-12 tasks and one link. Every spec is filled and has no template lines.

| Ref (projected ID) | Kind | After | Delivers |
|---|---|---|---|
| `lib-habit` (TASK-136) | library | — | `src/lib/finance/habit.ts` (Campbell–Cochrane: surplus ratio, sensitivity function, constant risk-free rate, SDF, seeded paths, price–consumption ratio on a grid, claim returns, internal against external marginal utility) and `src/lib/math/quadrature.ts` (Gauss–Hermite) |
| `lib-long-run-risk` (TASK-137) | library | — | `src/lib/finance/longRunRisk.ts` (Epstein–Zin $\theta$, the BKY and BY calibrations, the log-linear solution with endogenous constants, prices of risk, equity premium, seeded monthly paths with and without $x_t$, annual aggregation, model variance ratio, consumption predictability on data); `varianceRatio` in `src/lib/stats/autocorr.ts` |
| `lib-disasters` (TASK-138) | library | — | `src/lib/finance/disasters.ts` (disaster pricing and the probability a premium needs, seeded centuries, Euler moments, relative entropy and empirical likelihood weights through their duals, the profile across $\gamma$) |
| `chapter-37` (TASK-139) | chapter | lib-habit | `HabitSimulator`; an optional habit view of `PredictiveRegression`, with the `dp` and `cay` views unchanged |
| `chapter-38` (TASK-140) | chapter | lib-long-run-risk | `LongRunRisk` |
| `chapter-39` (TASK-141) | chapter | lib-disasters | `DisasterLottery`, `EntropyReweighting` |
| `part-10-signoff` (TASK-142) | gate | all three chapters | read-through report; the orchestrator signs off by merging |

Link: `TASK-039` (Plan: decompose M-13) now also waits on `chapter-37`, the first Part X chapter.

How:
- Data. No data task is needed.
  - Chapters 37 and 38 run on seeded model simulations. Their data sides use datasets already built: the `goyal-welch-annual` dividend–price data of chapter 9, and `fred-consumption-annual` with `goyal-welch-annual`, through `annualConsumption` and `annualSample` of chapter 35.
  - Chapter 39 follows Julliard & Ghosh (2012), who use annual US data from 1929 (pdf p. 8). Our annual sample from 1930 also starts with the Great Depression, so it fits the estimator.
  - The curriculum's "Data wanted later" table lists Barro–Ursúa cross-country disaster data for chapter 39. Both the data page and the workbook on `scholar.harvard.edu` return HTTP 403 to `curl`, so a data task would block on the owner. The estimator of the chapter is built to work without that data, so the chapter does without it and states no number from it.
  - The curriculum's data lines for chapters 38 and 39 name `fred-consumption-quarterly`, which starts in 2007 (issue #112), and chapter 37's names `shiller-monthly`. Each chapter spec says which dataset it uses instead and asks the worker to report the mismatch.
  - CRSP is not needed.
- Libraries. There is one library per chapter, and none needs a dataset, so all three start at once.
  - What is reused, not copied: `impliedRiskFree`, `crraSdfMoments`, `annualConsumption`, `annualSample`, `predictiveRegression`, `horizonSlopes`, `linearisationConstants`, `goyalWelchAnnualPresentValue`, `bisection`, `newton`, `minimize`, `chiSquareSurvival` and the RNG helpers.
  - Gauss–Hermite quadrature is generic maths, so it goes in `src/lib/math/quadrature.ts`, not in the habit file. `varianceRatio` goes in `src/lib/stats/autocorr.ts` unless `overlapMeanVariance` already gives it.
  - The tests include exact limits. With $S_t \equiv 1$, the habit price–consumption ratio is the power-utility closed form. With $\gamma = 1/\psi$ and no $x_t$, long-run risks pricing is power utility. With $\pi_D = 0$, disaster pricing is the lognormal result of chapter 35. Entropy weights satisfy the moment condition to 1e-12.
  - Reference values come from the papers' tables, with pages. Campbell & Cochrane Table 1 (p. 13) gives $\bar S = 0.057$ and $S_{\max} = 0.094$. Beeler & Campbell Table II (p. 35) gives simulated moments for BY and BKY. Julliard & Ghosh Table 1 is on p. 37.
- Notation clashes that the specs settle, in one shared "Part X" block of §3:
  - Habits: $\lambda(s_t)$ clashes with risk premia, so it gets a new symbol (for example $\Lambda$). $g$ becomes the Part IX $\mu_c$. $\phi$ stays, because it is an AR(1) persistence, as in §3.
  - Long-run risk: the Epstein–Zin $\theta$ clashes with the GMM parameter vector (for example $\theta_{\text{EZ}}$). The papers' $\kappa_1$ and $\kappa_0$ are the §3 Campbell–Shiller $\rho$ and $\kappa$, so they keep those letters with a subscript. The persistence of $x_t$ (the papers' $\rho$) therefore needs another symbol (for example $\phi_x$). The papers' $\nu$ clashes with the shrinkage penalties.
  - Disasters: §3 keeps $p$ for log prices and writes probabilities as $\pi$, and $b$ is the SDF loading. So the specs suggest $\pi_D$ and $b_D$, an $\ell$ for the dual multiplier, and $\pi_t$ in the \Prob colour for the entropy weights.
  - Whichever library merges first creates the block heading. The others rebase and keep every row.
- Lessons from Part IX, built into the specs.
  - Chapter 36 could not reuse chapter 35's hook, because the two ran in parallel. So each Part X chapter builds its hook on hooks that are already merged (`seriesSample.ts`, `puzzleSample.ts`, `predictiveSample.ts`). It links an earlier Part X chapter only if that chapter is merged, and otherwise names it by title. The sign-off lists each place where a title should become a link.
  - Chapter 35 hit the `useTweened` overshoot (issue #120, still open). Each chapter spec asks for the same guard as `HJBound` until that issue is fixed.
  - Only chapter 37 edits a shared widget (`PredictiveRegression`). Its spec, and the sign-off, require the screenshots and click-through of chapters 9 and 14.
- Graph shape. After apply, three tasks are ready at once: TASK-136, TASK-137 and TASK-138. The longest chain is library → chapter → sign-off, 3 nodes.
- Readings by absolute path. All four are in `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/`. I opened each and checked the pages the specs cite.
  - Chapter 37: `CampbellCochrane1999.pdf` (author manuscript, May 1998). Its fonts are scrambled, so `pdftotext` prints nonsense. I read it by OCR (`pdftoppm -r 150` then `tesseract`), and the specs tell the worker to do the same. Pages cited: model pp. 4–9, prices of long-lived assets p. 11, Table 1 p. 13, Table 2 p. 20, Table 5 p. 23, internal habit p. 37.
  - Chapter 38: `BansalKikuYaron2012.pdf` (NBER working paper, November 2009; model pp. 6–9, Appendix p. 23, Table I p. 28) and `BeelerCampbell2012.pdf` (NBER working paper, March 2009; Table I p. 34, Table II p. 35 with its aggregation rule, Tables IV and VI pp. 37–42, data p. 9).
  - Chapter 39: `JulliardGhosh2012.pdf` (working paper; estimators pp. 5–7, calibration and data p. 8, dual in Appendix A.1.2 p. 32, Table 1 p. 37). The curriculum reverses the authors' order. The specs cite Julliard & Ghosh and ask the chapter to report the mismatch.
  - Missing readings: Campbell (2018), Ch. 6, a reading of all three chapters, is not in `source/papers/`. The specs list it only as further reading and allow no fact from it. The same rule covers Constantinides (1990), Abel (1990), Bansal & Yaron (2004), Epstein & Zin (1989), Rietz (1988) and Barro (2006). A chapter may name one of them only where an opened reading does, with that reading's page.

Deviations:
- No owner-review task. The spec asks for a `delivery: manual` task in which the owner reads Part X. The owner rule of 2026-10-23 (in `goal rules`) forbids "owner reads and approves" gates. So `part-10-signoff` is a `kind: gate` read-through that the orchestrator signs off, as TASK-131 does for Part IX. It is last in the graph.
- Routes. The proposal format has no `route` field. `policy.default_route` is claude opus high, which is right for all seven tasks: three libraries, three chapters and the gate. No data task needs codex.

Verified revision: the proposal at this PR's head, on top of `origin/main` 89cb6ba.

Proposed follow-ups:
- Orchestrator: after apply, approve and dispatch TASK-136, TASK-137 and TASK-138 at once.
- Issue #112: `fred-consumption-quarterly` is still too short for any consumption chapter, and the curriculum names it for chapters 38 and 39. Part X does not need it.
