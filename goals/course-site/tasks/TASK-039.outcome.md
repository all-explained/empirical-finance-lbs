# TASK-039 outcome: Plan: decompose M-13

## Acceptance

- [x] `goal check --json` reports no errors. Evidence: in this worktree it prints `{"goal": "course-site", "issues": [], "ok": true}` and exits 0. `goal proposal check goals/course-site/proposals/TASK-039.yaml --goal course-site` prints `Proposal from TASK-039 is valid` and exits 0. That check validates, in memory, the plan as it will be after apply.
- [x] `goal graph` shows the new M-13 tasks with library and data tasks before chapter tasks and the owner-review task last. Evidence: the new tasks reach the live graph only after the orchestrator runs `goal proposal apply`, which refuses to run in an agent shell. To preview, I rendered the seven projected specs and the link into a throwaway clone at `/tmp/t039-preview`, with the IDs apply should allocate (TASK-143 to TASK-149, in proposal order). There, `goal check --json --offline` reports no issues, and `goal graph --offline` exits 0 with this M-13 block:

  ```
      │ ── M-13 · Part XI: The term structure: facts 0/8 ──
      ▶  TASK-039  Plan: decompose M-13  [running]
  ◇   │  TASK-143  Library: zero-coupon curves, forward and par rates, bond holding returns and the expectations-hypothesis yield  [ready]
  ├─┬─┼─╮
  ○ │ │ │  TASK-144  Library: Campbell–Shiller and Fama–Bliss regressions by maturity and a seeded expectations-hypothesis world  [needs TASK-143]
  ○ │ │ │  TASK-147  Chapter 41: Testing the expectations hypothesis  [needs TASK-144]
  │ ○ │ │  TASK-145  Library: the Cochrane–Piazzesi tent factor, its single-factor loadings and forecasts with yield principal components  [needs TASK-143]
  │ ○ │ │  TASK-148  Chapter 42: Level, slope, curvature and bond risk premia  [needs TASK-145]
  │ │ │ ○  TASK-146  Chapter 40: Yields, forwards and bond returns  [needs TASK-143]
  │ │ │ ├─╮
  ├─┴─┼─╯ │
  ○   │   │  TASK-149  Orchestrator reads Part XI and signs it off  [needs TASK-146, TASK-147, TASK-148]
      │   │ ── M-14 · Part XII: Term structure models 0/1 ──
      ├───╯
      ○  TASK-040  Plan: decompose M-14  [needs TASK-039, TASK-146]
  ```

  Each library comes before the chapters that use it, and the sign-off task is last. It depends on all three chapters. No data task is needed (see How).
- [x] Every chapter of Part XI (40, 41, 42) has exactly one chapter task. Evidence: in the proposal, `chapter-40` writes `40-yields-forwards-and-bond-returns.mdx`, `chapter-41` writes `41-testing-the-expectations-hypothesis.mdx` and `chapter-42` writes `42-level-slope-curvature-and-bond-risk-premia.mdx`. No other task writes a chapter.

## Summary

What: `goals/course-site/proposals/TASK-039.yaml`. It adds seven M-13 tasks and one link. Every spec is filled and has no template lines.

| Ref (projected ID) | Kind | After | Delivers |
|---|---|---|---|
| `lib-bonds` (TASK-143) | library | — | `src/lib/finance/bonds.ts`: the GSW curve, log prices, forward rates, par yields (annual and semi-annual), holding-period and excess returns matched by calendar month, the exact split of a return into yield, roll-down and shift, the perfect-foresight yield, the FRED par curve and the bill bond-equivalent yield |
| `lib-expectations-hypothesis` (TASK-144) | library | lib-bonds | `src/lib/finance/expectationsHypothesis.ts`: the yield-change, perfect-foresight and forward-spread regressions by maturity with Hansen–Hodrick errors, a seeded world where the hypothesis holds (with an optional term premium), its population slope and the slope distribution of samples as long as ours |
| `lib-bond-risk-premia` (TASK-145) | library | lib-bonds | `src/lib/finance/bondRiskPremia.ts`: the Cochrane–Piazzesi inputs, tent factor, single-factor loadings, yield-factor forecasts and subsample tents; `gswYieldLevels` in `src/lib/stats/pca.ts` |
| `chapter-40` (TASK-146) | chapter | lib-bonds | `YieldCurveMovie`, `BondReturnCalc` and the shared `bondSample.ts` hook |
| `chapter-41` (TASK-147) | chapter | lib-expectations-hypothesis | a `spread` view of `PredictiveRegression` and of `HorizonCurve`, with their default views unchanged |
| `chapter-42` (TASK-148) | chapter | lib-bond-risk-premia | a `gsw-levels` preset of `PCAExplorer`, and `TentFactor` |
| `part-11-signoff` (TASK-149) | gate | all three chapters | read-through report; the orchestrator signs off by merging |

Link: `TASK-040` (Plan: decompose M-14) now also waits on `chapter-40`, the first Part XI chapter.

How:
- Data. No data task is needed.
  - Both datasets the curriculum names for Part XI are committed: `gsw-zero-coupon` (1985-11 to 2026-09, end of month) and `fred-treasury-monthly` (monthly averages, 1977-02 to 2026-09). The "Data wanted later" table of `docs/CURRICULUM.md` lists nothing for chapters 40–42. CRSP is not needed.
  - The committed `fred-treasury-monthly` has no months from 1987-01 to 1993-09. It keeps complete months only, and FRED has no 20-year yield in those years. `docs/DATA.md` does not say so. `lib-bonds` is the first task that relies on the gap, so its spec adds the gap and its reason to the coverage cell of that row, and lists `docs/DATA.md` among its files.
  - Chapter 41's curriculum data line names `fred-treasury-monthly`, but its regressions need end-of-month zero-coupon yields. The spec asks the chapter to use GSW only and to report the mismatch.
- Libraries. `lib-bonds` comes first because all three chapters use its curve arithmetic, and Part XII will build on it. The two regression libraries then run in parallel.
  - What is reused, not copied: `getColumn`, `betweenDates`, the panel helper of `pca.ts`, `pca`, `scores`, `ols` with `hansen-hodrick` and `newey-west` errors, `fitAR1`, `predictiveRegression`, `useSeriesData`, `usePcaData` and the RNG helpers.
  - The tests include exact identities: on a flat curve every forward equals the yield; the yield is the mean of its forwards; a par bond priced off the curve is worth 1; the three parts of a return sum to it; the two $n = 2$ forward-spread slopes sum to 1; the Cochrane–Piazzesi loadings average to 1; the five-component $R^2$ equals the tent's.
  - Reference values come from the papers, with pages: Campbell & Shiller Table 1a and Table 2, and Cochrane & Piazzesi Tables 1, 2 and 4. Our sample (GSW, 1985–2026) differs from theirs, so each outcome sets our numbers next to theirs and says why they differ.
- Notation. §3 already has a "Bonds and the term structure" table with $n$, $P^{(n)}_t$, $p^{(n)}_t$, $y^{(n)}_t$, $f^{(n)}_t$ and $rx^{(n)}_{t+1}$, so all new rows go in that table, not in a new Part block. The specs settle these clashes:
  - The holding-period return $r^{(n)}_{t+1}$ against the stock return $r_{t+1}$; a term-premium symbol Part XII can keep.
  - The regression slopes against $b$ (SDF loadings); the spread against $s$ and the persistence of the simulated short rate against $\phi$.
  - Cochrane & Piazzesi's $\gamma$ (the tent weights) against risk aversion, their $f_t$ (forward-rate vector) against a factor vector, their $b_n$ against SDF loadings, and their $\overline{rx}_{t+1}$ against a sample mean.
  - Whichever library merges first adds its rows. The others rebase and keep every row.
- Lessons from Parts IX and X, built into the specs:
  - Chapter 37 had readout lines that wrapped on the phone, and chapter 38 had display equations that scrolled sideways. Each chapter spec asks for short readout lines at 360px and for wide display math broken to fit a 375px phone.
  - Issue #120 (`useTweened` overshoot) and issue #83 (no `<Details>` component) are still open. Each chapter spec asks for the `HJBound` guard and plain `<details>`.
  - Chapters run in parallel cannot reuse each other's code. Chapter 40 adds the one `bondSample.ts` hook; chapters 41 and 42 reuse it if merged, and otherwise add it and say so. They link an earlier Part XI chapter only if it is merged, and otherwise name it by title. The sign-off lists each such place.
  - Chapter 41 edits two shared widgets, and chapter 42 edits one. Their specs, and the sign-off, require the screenshots and click-through of every chapter that uses them: 9, 14 and 37 for `PredictiveRegression`; 9 for `HorizonCurve`; 6, 28 and 31 for `PCAExplorer`.
- Graph shape. After apply, one task is ready at once: TASK-143. Then the two regression libraries and chapter 40 run in parallel. The longest chain is library → library → chapter → sign-off, 4 nodes.
- Readings by absolute path. Both are in `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/`. I opened each and checked the pages the specs cite.
  - `CochranePiazzesi2005.pdf` is the published *American Economic Review* article; journal page = pdf page + 137. I checked the running heads: pdf p. 4 is journal p. 141, pdf p. 6 is p. 143 (Table 1) and pdf p. 10 is p. 147 (Table 4).
  - `CampbellShiller1991.pdf` is NBER working paper 3153 (October 1989). Its text layer is OCR and garbled in places, so the specs tell the worker to check every formula and number against the page image.
  - Missing readings: Campbell, Lo & MacKinlay (1997), Ch. 10, and Cochrane (2005), Ch. 19, are not in `source/papers/`. The specs list them only as further reading and allow no fact from them. Fama & Bliss (1987) and the Cochrane–Piazzesi Appendix are missing too. A chapter may name Fama & Bliss only where an opened reading does, with that reading's page. The Appendix's subsample results may not be used; chapter 42 runs its own subsamples instead.

Deviations:
- No owner-review task. The spec asks for a `delivery: manual` task in which the owner reads Part XI. The owner rule of 2026-10-23 (in `goal rules`) forbids "owner reads and approves" gates. So `part-11-signoff` is a `kind: gate` read-through that the orchestrator signs off, as TASK-142 does for Part X. It is last in the graph.
- Routes. The proposal format has no `route` field. `policy.default_route` is claude opus high, which is right for all seven tasks: three libraries, three chapters and the gate. No data task needs codex.
- Chapter 41's widget. The curriculum asks for a `PredictiveRegression` preset that shows the slope for each maturity against the line $b = 1$. A slope by maturity is what `HorizonCurve` draws by horizon, so the spec splits it: a `spread` view of `PredictiveRegression` for the scatter at one maturity, and a `spread` view of `HorizonCurve` for the slopes by maturity. The "Shared components" table lists `HorizonCurve` for chapter 9 only. The sign-off checks that chapter 9 renders as before.

Verified revision: the proposal at this PR's head, on top of `origin/main` afe32d4. TASK-142 is the highest ID there, so the projected IDs TASK-143 to TASK-149 hold.

Proposed follow-ups:
- Orchestrator: after apply, approve and dispatch TASK-143. Dispatch TASK-144, TASK-145 and TASK-146 when it merges.
