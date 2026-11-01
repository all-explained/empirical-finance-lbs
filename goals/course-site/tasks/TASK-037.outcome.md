# TASK-037 outcome: Plan: decompose M-11

## Acceptance

- [x] `goal check --json` reports no errors. Evidence: in this worktree it prints `{"goal": "course-site", "issues": [], "ok": true}` and exits 0. `goal proposal check goals/course-site/proposals/TASK-037.yaml --goal course-site` prints `Proposal from TASK-037 is valid` and exits 0. That check validates, in memory, the plan as it will be after apply.
- [x] `goal graph` shows the new M-11 tasks with library and data tasks before chapter tasks and the owner-review task last. Evidence: the new tasks reach the live graph only after the orchestrator runs `goal proposal apply`, which a worker shell cannot run. To preview, I rendered the six projected specs and the link into a throwaway clone at `/tmp/t037-preview`, with the IDs apply should allocate (TASK-125 to TASK-130, in proposal order). There, `goal check --json --offline` reports no issues, and `goal graph --offline` exits 0 with this M-11 block:

  ```
      │ ── M-11 · Part IX: Consumption: data and the equity premium puzzle 0/7 ──
      ▶  TASK-037  Plan: decompose M-11  [running]
  ◇   │  TASK-125  Data: annual real consumption and population from NIPA, 1929 on  [ready]
  ○   │  TASK-126  Library: consumption samples, lognormal consumption-CAPM pricing and the puzzle numbers  [needs TASK-125]
  ├─╮ │
  ○ │ │  TASK-128  Chapter 35: The equity premium and risk-free rate puzzles  [needs TASK-126]
  ├─┼─┤
  │ │ │ ◇  TASK-127  Library: time averaging, the NIPA filter and its inverse  [ready]
  │ ├─┼─╯
  │ ○ │  TASK-129  Chapter 36: Measuring consumption  [needs TASK-126, TASK-127]
  ├─╯ │
  ○   │  TASK-130  Orchestrator reads Part IX and signs it off  [needs TASK-128, TASK-129]
      │ ── M-12 · Part X: Habits, long-run risk and disasters 0/1 ──
      ○  TASK-038  Plan: decompose M-12  [needs TASK-037, TASK-128]
  ```

  The data task comes first, then the two libraries, then the chapters, and the sign-off task is last. It depends on both chapters.
- [x] Every chapter of Part IX (35, 36) has exactly one chapter task. Evidence: in the proposal, `chapter-35` writes `35-equity-premium-and-risk-free-rate-puzzles.mdx` and `chapter-36` writes `36-measuring-consumption.mdx`. No other task writes a chapter.

## Summary

What: `goals/course-site/proposals/TASK-037.yaml`. It adds six M-11 tasks and one link. Every spec is filled and has no template lines.

| Ref (projected ID) | Kind | After | Delivers |
|---|---|---|---|
| `data-consumption-annual` (TASK-125) | data | — | `fred-consumption-annual`: FRED annual `PCNDA`, `PCESVA`, their price indexes and population, 1929 on |
| `lib-consumption-puzzle` (TASK-126) | library | data-consumption-annual | `src/lib/finance/consumptionPuzzle.ts`: `annualConsumption`, `annualSample`, `quarterlySample`, `puzzleMoments`, `impliedRiskAversion`, `impliedRiskFree`, `impliedTimeDiscount`, `crraSdfMoments`, `crraHjPath` |
| `lib-consumption-measurement` (TASK-127) | library | — | `src/lib/finance/consumptionMeasurement.ts`: `simulateTimeAveraging`, `timeAveragedAutocorrelation`, `timeAveragedVarianceRatio`, `nipaFilter`, `unfilter`, `fourthQuarterGrowth` |
| `chapter-35` (TASK-128) | chapter | lib-consumption-puzzle | an optional power-utility view in `HJBound`, default view unchanged; `PuzzleCalculator` |
| `chapter-36` (TASK-129) | chapter | both libraries | `TimeAveraging`, `UnfilterConsumption` |
| `part-9-signoff` (TASK-130) | gate | both chapters | read-through report; the orchestrator signs off by merging |

Link: `TASK-038` (Plan: decompose M-12) now also waits on `chapter-35`, the first Part IX chapter.

How:
- Data. One data task is needed.
  - `fred-consumption-quarterly` starts in 2007-Q1: 78 quarters, with the COVID quarters. That is too short for the puzzle, and no merged chapter loads it. I opened issue #112 for this.
  - `fred-cay-quarterly` gives quarterly real consumption per person from 1951-Q4 through `cayInputs`. Chapters 14, 22, 26 and 33 already use it, so the quarterly sample reuses it.
  - The puzzle is usually stated on the long annual sample, and Kroencke (2017) works with annual NIPA consumption from the late 1920s. FRED has the annual series from 1929 with no API key. I checked all five IDs (`PCNDA`, `PCESVA`, `DNDGRG3A086NBEA`, `DSERRG3A086NBEA`, `B230RC0A052NBEA`) with `curl`; each returns a 1929 row.
  - Annual returns, the risk-free rate and inflation come from `goyal-welch-annual` (1871–2025), which is already built. CRSP is not needed.
- Libraries. There is one library per chapter. The measurement library is pure maths with seeded tests, so it starts at once, in parallel with the data task.
  - What is reused, not copied: `crraSdf`, `hjBoundSharpe`, `cayInputs`, `quarterlyExcessReturns`, `quarterlyPanel` (as a test reference), `annualiseMean`, `annualiseVolatility`, `sampleAutocorrelation`, `autocorrelations` and the RNG helpers.
  - The tests include exact identities: `unfilter(nipaFilter(x))` returns `x`. The time-averaged autocorrelation is $(n^2-1)/(2(2n^2+1))$, which tends to 1/4, and the variance ratio tends to 2/3. The lognormal SDF moments match `crraSdf` on seeded draws. `impliedRiskFree` and `impliedTimeDiscount` invert each other.
- Notation clashes that the specs settle:
  - The style guide's $\delta$ is the time-discount factor, while the curriculum's $r_f$ formula uses $\delta$ as a rate. The specs follow §3 and write $-\log\delta$.
  - §3 gives $g$ to the GMM moment function, so the mean consumption growth gets a new symbol (for example $\mu_c$).
  - §3 gives $\phi$ to AR(1) persistence, so the filter weight gets a new symbol (for example $\varphi$).
  - Kroencke's unfilter parameter is one minus the curriculum's weight. The library uses the curriculum's weight and converts his recommended values (0.80 and 0.40 become 0.20 and 0.60).
  - Both library tasks write to one "Part IX" block of §3.
- Graph shape. After apply, two tasks are ready at once: TASK-125 and TASK-127. The longest chain is data → library → chapter → sign-off, 4 nodes.
- Readings by absolute path. All are in `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/`. I opened each with `pdftotext` and checked the pages the specs cite.
  - Chapter 35: `Ludvigson2013.pdf` (working paper of January 2012; puzzle on pdf pages 12–22) and `Campbell2014.pdf` (working paper; puzzle on pdf page 10).
  - Chapter 36: `Kroencke2017.pdf` (ZEW working paper dated 2013; eq. 9 on pdf page 14, the split $\phi = \alpha \times \nu$ on pages 13–14, the recommended values on page 15).
  - Missing readings: Campbell (2018) and Cochrane (2005), the curriculum's readings for both chapters, are not in `source/papers/`. The specs list them only as further reading and allow no fact from them. The same rule covers Mehra & Prescott (1985), Weil (1989), Working (1960), Breeden, Gibbons & Litzenberger (1989) and Savov (2011). A chapter may name one of them only where an opened reading does so, with that reading's page.

Deviations:
- No owner-review task. The spec asks for a `delivery: manual` task in which the owner reads Part IX. The owner rule of 2026-10-23 (in `goal rules`) forbids "owner reads and approves" gates. So `part-9-signoff` is a `kind: gate` read-through that the orchestrator signs off, as TASK-120 does for Part VIII. It is last in the graph.
- Routes. The proposal format has no `route` field (`goal proposal check` rejects it). `policy.default_route` is claude opus high, which is right for the two libraries, the two chapters and the gate. The data task must go to codex. After apply, the orchestrator runs `goal route <id of data-consumption-annual> codex gpt-6.1-sol high`.
- Data lines. The chapters' curriculum data lines name `fred-consumption-quarterly` and `shiller-monthly`. The specs use the longer consumption series and the Goyal–Welch returns, and each chapter reports the mismatch. The data task adds `fred-consumption-annual` to the data lines of chapters 35 and 36.

Verified revision: the proposal at this PR's head, on top of `origin/main` 0126f8e.

Proposed follow-ups:
- Orchestrator: after apply, route the data task to codex gpt-6.1-sol high, then dispatch TASK-125 and TASK-127.
- Issue #112: `fred-consumption-quarterly` is too short for any consumption chapter. Rebuild it from 1947 or drop it.
