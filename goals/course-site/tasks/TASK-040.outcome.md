# TASK-040 outcome: Plan: decompose M-14

## Acceptance

- [x] `goal check --json` reports no errors. Evidence: in this worktree it prints `"ok": true` with no issue of severity `error` and exits 0; its ten warnings are older W104 notes on TASK-142 and TASK-153 to TASK-155, none from this proposal. `goal proposal check goals/course-site/proposals/TASK-040.yaml --goal course-site` prints `Proposal from TASK-040 is valid` and exits 0. That check validates, in memory, the plan as it will be after apply.
- [x] `goal graph` shows the new M-14 tasks with library and data tasks before chapter tasks and the owner-review task last. Evidence: the new tasks reach the live graph only after the orchestrator runs `goal proposal apply`. To preview, I rendered the eleven projected specs and the link into a throwaway clone at `/tmp/t040-preview`, with the IDs apply should allocate (TASK-156 to TASK-166, in proposal order). There, `goal check --json --offline` reports no errors and no issue on a new task, and `goal graph --offline` exits 0 with this M-14 block:

  ```
  ◇   │  TASK-156  Data: the Svensson parameters of the GSW curve, end of month  [ready]
  │ ◇ │  TASK-157  Data: FRED monthly activity and inflation, and federal debt held by the public to GDP  [ready]
  │ ├─┼─╮
  │ ○ │ │  TASK-161  Library: the corporate–Treasury spread, its regression on debt to GDP, and a demand curve for safe assets  [needs TASK-157]
  │ ○ │ │  TASK-165  Chapter 46: The convenience yield of Treasuries  [needs TASK-161]
  │ │ │ │ ◇  TASK-158  Library: Gaussian affine term structure models, bond pricing recursions, risk-neutral yields and the term premium  [ready]
  ○ │ │ │   │ │  TASK-159  Library: the Adrian–Crump–Moench three-step estimator on GSW, with fitted yields and the term premium  [needs TASK-158, TASK-156]
  │ │ │ ○     │  TASK-160  Library: spanning regressions of bond excess returns on yield components and macro variables, with the Bauer–Hamilton bootstrap  [needs TASK-158, TASK-157]
  │ │ │ ○     │  TASK-164  Chapter 45: Spanned and unspanned factors  [needs TASK-160]
  │ │ │ │     ○  TASK-162  Chapter 43: Affine term structure models  [needs TASK-158]
  ○ │ │ │       │  TASK-163  Chapter 44: Pricing the term structure with linear regressions  [needs TASK-159, TASK-162]
    ○ │         │  TASK-166  Orchestrator reads Part XII and signs it off  [needs TASK-163, TASK-164, TASK-165]
      ○  TASK-041  Plan: decompose M-15  [needs TASK-040, TASK-162]
  ```

  (Edge glyphs trimmed; the full block is in the PR description.) Each data task and library comes before the chapters that use it, and the sign-off task is last: it depends on chapters 44, 45 and 46, and through chapter 44 on chapter 43.
- [x] Every chapter of Part XII (43, 44, 45, 46) has exactly one chapter task. Evidence: in the proposal, `chapter-43` writes `43-affine-term-structure-models.mdx`, `chapter-44` writes `44-pricing-the-term-structure-with-linear-regressions.mdx`, `chapter-45` writes `45-spanned-and-unspanned-factors.mdx` and `chapter-46` writes `46-the-convenience-yield-of-treasuries.mdx`. No other task writes a chapter.

## Summary

What: `goals/course-site/proposals/TASK-040.yaml`. It adds eleven M-14 tasks and one link. Every spec is filled and has no template lines.

| Ref (projected ID) | Kind | After | Delivers |
|---|---|---|---|
| `data-gsw-svensson` (TASK-156) | data | — | `gsw-svensson-parameters`: the six Svensson parameters on the dates of `gsw-zero-coupon`, which stays unchanged |
| `data-fred-macro-debt` (TASK-157) | data | — | `fred-macro-monthly` (INDPRO, CPIAUCSL, CFNAI) and `fred-debt-gdp-annual` (debt held by the public to GDP) |
| `lib-affine` (TASK-158) | library | — | `src/lib/finance/affine.ts`: the recursions for $A_n$, $B_n$, yields, risk-neutral yields, the term premium, expected excess returns, a seeded simulation, one- and two-factor models for the widget, and the inversion of yields to the state |
| `lib-acm` (TASK-159) | library | lib-affine, data-gsw-svensson | `src/lib/finance/acm.ts`: the three-step estimator, its step regressions and the fitted curve; `svenssonYield` and `gswMonthlyCurve` in `bonds.ts` |
| `lib-spanning` (TASK-160) | library | lib-affine, data-fred-macro-debt | `src/lib/finance/spanning.ts`: the spanning regressions, the Bauer–Hamilton bootstrap, a seeded world with a persistence slider and a hidden-factor demo |
| `lib-convenience` (TASK-161) | library | data-fred-macro-debt | `src/lib/finance/convenience.ts`: the Aaa–Treasury spread, its regression on log debt to GDP, the exponential form and the demand curve |
| `chapter-43` (TASK-162) | chapter | lib-affine | `AffineCurve`, `TermPremium` |
| `chapter-44` (TASK-163) | chapter | lib-acm, chapter-43 | a `TermPremium` preset, three `RegressionLab` presets and the `acmSample.ts` hook |
| `chapter-45` (TASK-164) | chapter | lib-spanning | `SpanningBootstrap` and the `spanningSample.ts` hook |
| `chapter-46` (TASK-165) | chapter | lib-convenience | `ConvenienceDemand`, the `convenienceSample.ts` hook and the Part XII bridge |
| `part-12-signoff` (TASK-166) | gate | chapters 44, 45, 46 | read-through report; the orchestrator signs off by merging |

Link: `TASK-041` (Plan: decompose M-15) also waits on `chapter-43`, the first Part XII chapter.

How:
- Data. Two data tasks, public sources only; no CRSP and no licensed data.
  - Chapter 44 follows Adrian, Crump & Moench (2013): monthly excess returns at 6 to 120 months over the one-month yield. `gsw-zero-coupon` has only the 1- to 30-year yields, so returns of bonds under a year and the one-month rate cannot be built from it. The same Federal Reserve CSV publishes the six Svensson parameters, and the paper rebuilds its curves from them (pdf p. 16). The data task adds them as a separate dataset, `gsw-svensson-parameters`, and leaves `gsw-zero-coupon` untouched: GSW revises its history, and chapters 40–42 pin numbers on the committed file. The library then tests that the formula reproduces every committed `SVENYnn` value, which also detects a revision.
  - Chapter 45 needs growth and inflation. Bauer & Hamilton use a three-month average of CFNAI (pdf p. 20); Duffee uses industrial production growth and CPI inflation (pdf p. 40). Only Goyal–Welch's `infl` is committed, and it ends in 2025-12. The data task adds INDPRO, CPIAUCSL and CFNAI from FRED, and drops CFNAI if its terms forbid redistribution.
  - Chapter 46 needs the Aaa–Treasury spread and debt to GDP. `AAA`, `BAA`, `lty` and `tbl` are already in `goyal-welch-annual` (1871–2025), so no corporate yields are downloaded. Debt to GDP is missing (the "Data wanted later" table lists it); the data task adds it from FRED and deletes that table row.
  - The two data tasks edit the **Data:** lines of chapters 44, 45 and 46 in `docs/CURRICULUM.md`, as TASK-037's data task did.
- Libraries. `lib-affine` comes first because all four chapters lean on its recursions. It starts at once with the two data tasks. The three other libraries then run in parallel.
  - The model is written once, in Adrian, Crump & Moench's form, with prices of risk entering as $\mu - \lambda_0$ and $\Phi - \lambda_1$ (pdf p. 11). The curriculum's Key math writes $\Sigma\lambda_0$ and $\Sigma\lambda_1$. Both are the same model with rescaled prices of risk; the library derives and tests the mapping, and chapter 43 states it in one sentence and reports the mismatch.
  - What is reused, not copied: `fitVAR1`, `forecastVAR1`, `ols` with Hansen–Hodrick and Newey–West errors, `pca`, `scores`, `gswYields`, `holdingReturns`, `treasuryCurve`, `quantile`, `optimize.ts`, `useSeriesData`, `useBondView` and the RNG helpers.
  - Tests include exact identities and known answers: closed-form one-factor loadings, paper and curriculum forms agreeing to 1e-12, risk-neutral yields equal to average VAR forecasts, exact state inversion without noise, the bootstrap's size under a simulated null, and the Svensson formula against every committed GSW yield. Each library outcome sets our numbers next to the paper's tables, marked as theirs, and says why they differ.
- Notation. Part XII's papers reuse many §3 letters: $X_t$ (a payoff), $\Phi$ (Chapter 5 writes the VAR matrix $A$), $\mu$ and $\Sigma$ (a return's mean and covariance), $\delta$ (time discount), $\lambda_0$ (the zero-beta rate), $\lambda_t$ (the conditional premium), $B$ (the beta matrix), $e_t$, $c$, $\iota$, $W$, $z_t$, and Krishnamurthy & Vissing-Jorgensen's $\alpha$ and $B$. Each library spec lists the clashes it meets, suggests a fix, and requires a row in the "Bonds and the term structure" table of §3 with the clash and the paper's symbol. §3 already reserves $A_n$ for the affine intercept and $\mathit{tp}^{(n)}_t$ for the model term premium; the specs keep both.
- Lessons from Parts X and XI, built into the specs:
  - Readout lines that wrap on the phone and display math that scrolls sideways: each chapter spec asks for short readout lines at 360px and math broken to fit 375px.
  - Issues #83 (no `<Details>` component) and #120 (`useTweened` overshoot) are still open (checked today); each chapter spec carries the workaround.
  - Chapters run in parallel cannot rely on each other: each links an earlier Part XII chapter only if it is merged, and the sign-off lists each place that names one by title instead.
  - Chapter 46 closes the Part with the three-line bridge and the next-Part sentence that the Part X sign-off had to add afterwards (TASK-151).
  - Chapter 44 edits two shared widgets; its spec and the sign-off require the screenshots and click-through of chapters 43 (`TermPremium`), 3 and 26 (`RegressionLab`).
- Graph shape. After apply, three tasks are ready at once: TASK-156, TASK-157 and TASK-158. The longest chain is library → library → chapter → sign-off, or library → chapter → chapter → sign-off: 4 nodes.
- Readings by absolute path, all in `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/`. I opened each with `pdftotext -layout` and checked the pages the specs cite.
  - `AdrianCrumpMoench2013.pdf` is New York Fed Staff Report 340, revised April 2013; printed page = pdf page − 2.
  - `BauerHamilton2018.pdf` is FRBSF working paper 2015-15, May 2017 version.
  - `Duffee2013.pdf` is the January 2011 final version of "Information in (and not in) the term structure", published in the *Review of Financial Studies* in 2011; `docs/READINGS.md` records that the outline's "2013" is this paper.
  - `KrishnamurthyVissingJorgensen2012.pdf` is the working paper of 12 February 2008; its tables have Roman numerals and sit at pdf pp. 45–52.
  - Missing readings: Campbell, Lo & MacKinlay (1997), Ch. 11, is not in `source/papers/`; the chapter 43 spec lists it as further reading only and allows no fact from it. Joslin, Priebsch & Singleton (2014) and Ludvigson & Ng (2009) are missing too; chapter 45 may name them only where an opened reading does.
- Where jobs run. Every task is small work on committed files or public downloads of seconds, so all run on the MacBook. No task reads CRSP, option or tick data. Each spec says so.

Deviations:
- No owner-review task. The spec asks for a `delivery: manual` task in which the owner reads Part XII. The owner rule of 2026-10-23 (in `goal rules`) forbids "owner reads and approves" gates. So `part-12-signoff` is a `kind: gate` read-through that the orchestrator signs off, as TASK-149 does for Part XI. It is last in the graph.
- Chapter 44 also waits on chapter 43. The spec says a chapter depends only on its library or data task. But the curriculum gives `TermPremium` to chapter 43 and a preset of it to chapter 44; without the link, two workers would each build the widget. The longest chain stays at 4 nodes.
- Routes. The proposal format has no `route` field, and planning workers may not run `goal route`. `policy.default_route` is claude opus high, which suits the four libraries, the four chapters and the gate. For the two data tasks the spec names `codex gpt-6.1-sol high`; the newer owner routing rule in `goal rules` sends downloads to claude haiku or sonnet. I recommend `goal route TASK-156 claude sonnet` and `goal route TASK-157 claude sonnet` after apply: each adds a fetch entry, schema tests and docs, which is more than a bare download.
- Chapter 45's curriculum data line names `fred-treasury-monthly`. Its regressions need end-of-month zero-coupon yields, so the spec asks the chapter to report whether it uses that dataset and why.

Verified revision: the proposal at this PR's head, on top of `origin/main` d0e31ca. TASK-155 is the highest ID there, so the projected IDs TASK-156 to TASK-166 hold if nothing else is added first.

Proposed follow-ups:
- Orchestrator: after apply, set the two data routes above, then dispatch TASK-156, TASK-157 and TASK-158.
