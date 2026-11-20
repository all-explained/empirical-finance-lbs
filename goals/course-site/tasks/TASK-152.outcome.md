# TASK-152 outcome: Part X fix: numbers in chapters 37 and 39

## Acceptance

Verified revision: `a5f6257` (the chapter commit, rebased onto `origin/main` `d533eab`; main's new commits touch only
`goals/course-site/decisions.jsonl`). The outcome commit adds only this file.

- [x] Both chapters give the same risk-aversion figure, equal to the library value.
  Evidence: Chapter 37's Hook says power utility reaches the market's Sharpe ratio of 0.45 "only at $\gamma = 20.0$".
  Chapter 39's Hook said "a risk aversion of at least 15"; it now says power utility "reaches the market's Sharpe
  ratio of 0.45 only at a risk aversion $\gamma = 20.0$". Both values come from the same library path:
  `powerUtilityPath(mean.dc, sd.dc, marketSharpe(ff3, SAMPLE_STARTS[0]).sharpe).lowest.gamma` (built on
  `crraHjPath` in `src/lib/finance/consumptionPuzzle.ts`). `tests/chapter37-numbers.test.ts` already expected
  `'20.0'`; `tests/chapter39-numbers.test.ts` now expects `['0.45', '20.0']` from the same call, in place of its old
  pin of `gamma.fromSharpe` at `'15'`. Both pass.
- [x] The δ = 1.245 sentence names its γ.
  Evidence: TASK-150 had already added "$\delta = 1.245$ even at $\gamma = 15.0$". The sentence now also says what
  that γ is: "the lower bound $SR/\sigma_c$ in Chapter 35's table". `tests/chapter37-numbers.test.ts` computes it
  with `impliedTimeDiscount` at `puzzle.gamma.fromSharpe` and expects `'1.245'`. It passes.
- [x] `npm test` and `npm run build` pass; screenshots and clickthrough pass for chapters 37 and 39.
  Evidence: `npm ci` exit 0; `npm test` exit 0, `Test Files 86 passed (86)`, `Tests 964 passed (964)`;
  `npm run build` exit 0, `Result (250 files): 0 errors, 0 warnings`, `40 page(s) built`.
  `npm run screenshots -- 37-internal-and-external-habits` and `-- 39-rare-disasters-and-jump-risk` exit 0, four `✓`
  images each. `npm run clickthrough` exit 0 for both: chapter 37's two widgets at 10 and 9 actions, chapter 39's at
  10 and 5 actions, each at 1280px and 360px.

## Summary

What: one figure for the risk aversion that power utility needs, in Chapters 37 and 39, plus one test pin.

How: Chapter 35 gives two values. 20.0 is where the power-utility curve reaches the Hansen–Jagannathan bound at the
market's Sharpe ratio of 0.45; it is Chapter 35's headline and Chapter 37's Hook, table, risk-free rate (28.2%) and
δ (1.310) all rest on it. 15.0 is the lower bound $SR/\sigma_c$ from the log excess returns of the annual table. So I
changed Chapter 39's one Hook sentence to 20.0, the smaller change, and pinned it with the call Chapter 37's test
uses. In Chapter 37 I only labelled the 15.0 as the $SR/\sigma_c$ bound and wrapped that over-long source line.

Inspection: I cropped Chapter 39's Hook from the light desktop screenshot and read it. The math renders and the
paragraph flows. The crop is deleted.

Deviations: acceptance item 2 was already met by TASK-150; the label added here only makes the 15.0 easier to read
next to the 20.0. Follow-ups: none.
