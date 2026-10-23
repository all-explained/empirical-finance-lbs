# TASK-030 outcome: Plan: decompose M-4

## Acceptance

- [x] `goal check --json` reports no errors. Evidence: it prints `{"goal": "course-site", "issues": [], "ok": true}` and exits 0, after the last plan commit `9204eff`.
- [x] `goal graph` shows the new M-4 tasks with library and data tasks before chapter tasks and the owner-review task last. Evidence (`goal graph`, exit 0, M-4 block):

  ```
  ── M-4 · Part II: Return predictability: the evidence 0/8 ──
  ▶  TASK-030  Plan: decompose M-4  [running]
  │ ◇  TASK-046  Library: Campbell–Shiller log-linearisation and variance shares  [ready]
  │ ○ │  TASK-049  Chapter 10: The Campbell–Shiller decomposition  [needs TASK-046]
  │ │ │ │ ◇  TASK-047  Library: VAR news decomposition and the dog test  [ready]
  │ │ ○ │  TASK-050  Chapter 11: Cash-flow and discount-rate news  [needs TASK-046, TASK-047]
  │ │ │ │ ◇  TASK-048  Library: Stambaugh bias and simulated test size  [ready]
  │ │ │ │ ○  TASK-051  Chapter 12: Stambaugh bias  [needs TASK-048]
  │ ○   │  TASK-052  Owner reads Part II and approves how it reads  [needs TASK-049, TASK-050, TASK-051]
  ○  TASK-031  Plan: decompose M-5  [needs TASK-030, TASK-049]
  ```

  Every chapter task depends on a library task, and the owner review depends on all three new chapter tasks. No data task was needed (see Summary).
- [x] Every chapter of Part II (9, 10, 11, 12) has exactly one chapter task. Evidence: chapter 9 is TASK-014 (M-2 reference chapter, PR #17 merged, owner-approved in TASK-015); chapter 10 is TASK-049, chapter 11 is TASK-050, chapter 12 is TASK-051. No other task writes these chapters.

## Summary

What: seven new M-4 tasks, all with filled specs (no template lines) and committed on `main` by the `goal` CLI (commits `c2fa4c9` to `9204eff`):

| Task | Kind | Depends on | Delivers |
|---|---|---|---|
| TASK-046 | library | — | `src/lib/finance/presentValue.ts`: $\rho$, $\kappa$, exact and approximate log return, annual present-value series from `goyal-welch-annual`, slopes and identity gap, long-run coefficients, variance shares |
| TASK-047 | library | TASK-025 | `src/lib/finance/news.ts`: VAR(1) news weights and decomposition on `fitVAR1`, Cochrane's null simulation and tail shares |
| TASK-048 | library | — | `src/lib/stats/stambaugh.ts`: Kendall and Stambaugh bias, plug-in correction, two-equation fit, seeded slope simulation, critical values |
| TASK-049 | chapter 10 | TASK-046 | `LogLinearCheck`, `VarianceShares` |
| TASK-050 | chapter 11 | TASK-046, TASK-047 | `NewsDecomposition`, `DogThatDidNotBark` |
| TASK-051 | chapter 12 | TASK-048 | `StambaughBias` |
| TASK-052 | manual | TASK-049, TASK-050, TASK-051 | owner reads chapters 9–12 |

How:
- Chapter specs copy the shape of TASK-022 to TASK-028. Each names its papers by absolute path: `CampbellShiller1988.pdf` and `Cochrane2011.pdf` (chapter 10), `Cochrane2008.pdf` and `CampbellShiller1988.pdf` (chapter 11), `Cochrane2008.pdf` (chapter 12). Campbell (2018) is missing for all three, and Stambaugh (1999) for chapter 12; the specs allow no fact from them.
- Lessons from Part I outcomes went into the specs. TASK-028 found curriculum Key math that disagrees with the style guide, so each chapter spec says to follow `docs/STYLE_GUIDE.md` §3 and report the gap. The style guide reserves $\rho$ for the Campbell–Shiller constant, so every spec says to write a correlation as `corr`. There is no colour token for news or variance shares, so the specs ask for existing tokens and a stated choice.
- The libraries take $\rho$ as an argument, so TASK-047 does not wait for TASK-046. This keeps the graph wide: the longest chain is TASK-025 → TASK-047 → TASK-050 → TASK-052.
- Pacing: `goal link TASK-031 --after TASK-049`, so Part III is planned once chapter 10 has proved the Part II pattern.

Deviations:
- Chapter 9 gets no new task. It was written and approved in M-2 (TASK-014, TASK-015), as chapter 1 was for Part I. A second task would break "exactly one chapter task". TASK-052 still asks the owner to read chapter 9 as the opening of Part II.
- No data task. Both datasets the chapters need, `goyal-welch-annual` and `shiller-monthly`, are already built and loaded by `src/lib/data/series.ts`. CRSP is not needed.
- Routes. `goal route` refuses to run in an agent shell ("reserved for you"). The goal's `default_route` is `{platform: claude, model: opus, effort: high}`, which is the route the spec asks for on all six non-manual tasks, so their effective route is correct. Part I tasks used the same default.
- Dispatch. Following the owner rule, I tried to dispatch the ready libraries. The orchestrator had already started TASK-046, TASK-047 and TASK-048 through Orca (one live run each); `goal dispatch --via orca` returned the existing runs and started no duplicates.

Verified revision: plan at `origin/main` `9204eff`; `goal check --json` and `goal graph` both exit 0 there.

Proposed follow-ups:
- After TASK-049 to TASK-051 merge, chapter 9 can link forward to chapters 10–12 (its text now says "later chapters"). That is a small change for the owner review (TASK-052) to request if wanted.
