# TASK-142 outcome: Orchestrator reads Part X and signs it off

Verified revision: the Verify commands ran on `422dbd5`, which contains the merges of TASK-139, TASK-140 and TASK-141.
The branch is now rebased on `origin/main` (`afe32d4`); the only file that differs between the two is
`goals/course-site/decisions.jsonl`, so no page, widget or library changed.

## Acceptance

- [x] `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
  Evidence, tests: `npm ci` exit 0 ("added 439 packages"); `npm test` exit 0, "Test Files 85 passed (85)",
  "Tests 942 passed (942)".
  Evidence, build: `npm run build` exit 0, "Result (248 files): 0 errors, 0 warnings, 1 hint", "40 page(s) built",
  "Complete!". The hint is the unused `Matrix` import in `src/lib/finance/news.ts`, outside Part X and already reported
  (#88).
- [x] `npm run screenshots` and `npm run clickthrough` pass for `37-internal-and-external-habits`,
  `38-long-run-risk`, `39-rare-disasters-and-jump-risk`, `09-time-varying-expected-returns` and
  `14-consumption-wealth-ratio`.
  Evidence, screenshots: exit 0 for each of the five filters, with ✓ for dark-desktop, dark-phone, light-desktop and
  light-phone. Evidence, click-through: exit 0 for each filter, every widget reported at 1280px and 360px: Chapter 37
  `HabitSimulator` (10 actions) and `PredictiveRegression` habit view (9); Chapter 38 `LongRunRisk` (9); Chapter 39
  `DisasterLottery` (10) and `EntropyReweighting` (5); Chapter 9 `PredictiveRegression` default (9) and the horizon
  widget (5); Chapter 14 the weight widget (4), `PredictiveRegression` cay view (9) and the look-ahead widget (3).
- [x] The outcome holds the four judgements and a `## Sign-off` section.
  Evidence: the sections "Voice", "Widgets", "Shared code and notation" and "Links across Parts", then `## Sign-off`.
- [x] `git diff --name-only origin/main` lists only this task's outcome file.
  Evidence: after the outcome commit the command prints `goals/course-site/tasks/TASK-142.outcome.md` and nothing else.

## Summary

I read Chapters 37, 38 and 39 (2,856, 2,730 and 2,969 words of prose, by the count command of TASK-141) in the
source and as built pages, and Chapters 35 and 36 for every claim that Part X makes about them. I looked at the dark
and light desktop and phone screenshots of all five pages. A Playwright probe, kept in `/tmp` and not committed, set each Part X widget to the state that its
"Try this" prompts describe and read the readout. I read the shared code that Part X touches: `PredictiveRegression`,
`predictiveSample.ts`, `habitSample.ts`, `seriesSample.ts`, `consumptionPuzzle.ts`, `quadrature.ts` and the three
Part X libraries. I changed no chapter, widget, library or doc. I did not check the paper page numbers.

### Voice

The voice works for a reader who starts from zero, at the Part's ●●● level. Each Hook ends on a question the reader can
feel: fear that comes and goes (37), a signal too faint to see, and how you would ever test it (38), a disaster that
did not come, and how you would ever know its odds (39). Each Intuition shows a picture before a formula. One
picture carries each chapter: the surplus ratio as a small gap between two big numbers (37), the two consumption
paths with the same shocks (38) and the shaded disaster years (39). Terms are defined where they first appear (habit,
surplus ratio, variance ratio, peso problem, relative entropy). The proofs go in numbered steps with a plain reading
after them, and pure algebra sits in `<details>`: the habit's steady state (37), the log SDF (38) and the first-order
step of the disaster premium (39). Each chapter says what it cannot show, and does so with numbers: Chapter 37 says its
price level depends on how deep the grid goes (35.1 years against the paper's 18.3), Chapter 38 says 21.3% of
BKY samples look like the data, and Chapter 39 says the weights can only sit on years we saw.

Defects, all small:
- Chapter 37 and Chapter 39 give two values for "the risk aversion that power utility needs". Chapter 37's Hook and
  table use 20.0, which reaches the Sharpe ratio of 0.45. Chapter 39's Hook says "at least 15", which prices the 6.28%
  premium. Both are true of Chapter 35, which explains the gap in a paragraph, but a reader who goes from 37 to 39
  sees two numbers for one fact (change 1).
- Chapter 37, "The answer to Chapter 35": the table column of power utility is at $\gamma = 20.0$, and the next
  paragraph says power utility "needed $\delta = 1.245$ in Chapter 35". That $\delta$ is the one at $\gamma = 15.0$;
  at 20.0 it would be higher (change 1).
- Chapter 37, Playground: "the slope times 10 is −1.6, −3.0 …" never says why the slope is multiplied by 10, and a
  reader who has just used the widget sees −0.233 at one year, not −2.3 (change 3).
- Chapter 39, "The numbers on our annual sample": the paragraph on Julliard and Ghosh's Table 1 has one sentence of
  about 60 words ("… an EL test that $\gamma$ can be as small as 10 of 4.31 ($p$-value 0.038)"), which is hard to
  parse, and a line of about 300 characters in the source (change 3).

### Widgets

Each widget teaches what its caption says, and each prose number I compared with a readout matched.

- `HabitSimulator` (37), default seed 1: steady state 0.057, $S_{\max}$ 0.094, $r^f$ 0.94%, $\delta$ 0.896. Date 56.5:
  $S_t$ 0.019, curvature 106.8, $P_t/C_t$ 26.3 years, mean 35.8. $\gamma = 4$: steady state 0.081, mean 27.8.
- `PredictiveRegression` (37), habit view: data at one year −0.042, $t$ −0.94, $R^2$ 1.2%. Habit model at one year
  −0.233, −3.35, 10.2%; at ten years $R^2$ 41.4%, and the data's 11.8%.
- `LongRunRisk` (38), BKY: premium 6.42%, $r^f$ 1.28%, $\lambda_e$ 13.5, $\theta_{\text{EZ}}$ −27.0, $A_1$ 12.70,
  $\mathit{VR}(10)$ 2.63 and data 1.61. $\phi_x = 0.95$: premium 2.88%. $\phi_x = 0.99$: 15.41%. $\psi = 0.9$: $A_1$
  −4.28, premium 5.17%, $r^f$ 3.00%, and seed 3 gives $\mathit{VR}(10)$ 1.52.
- `DisasterLottery` (39): premium 4.14%, $r^f$ −2.13%, disasters in years 25 and 39. $\pi_D = 0$: premium 0.00% and
  $r^f$ 8.69%.
- `EntropyReweighting` (39): $\gamma = 10$ gives $\mathit{KL}$ 0.0541, the four worst years 5.0% against 4.2%, 1931 at
  3.12 times, $\mathit{LR}$ 8.63 ($p = 0.003$, rejected), and the estimate 42.8. $\gamma = 43$: $\mathit{KL}$ 0.0000, no
  rejection. "To 2009": estimate 35.7, and at $\gamma = 10$ $\mathit{LR}$ 4.85 ($p = 0.028$).
- Layout: no horizontal overflow at 360px in either theme, no KaTeX error and no console error (the screenshot script
  fails on each). In the crops I looked at, the "D" markers of `DisasterLottery` sit clear of the line, the readouts are
  full, and the five-line caption of `LongRunRisk` fits the phone width.
- One label to change (change 2): the first slider of `HabitSimulator` is "Curvature $\gamma$", and the readout under it
  is "Local curvature $\gamma/S_t$". A reader who has just seen $\gamma/S_t$ at 36.0 and then drags a slider called
  "Curvature" to 4 sees the local curvature move from 36 to 53 and cannot tell which curvature the slider sets. The
  chapter calls $\gamma$ "the utility curvature" in the answer to its first quiz question.

### Shared code and notation

The chapters reuse the shared widgets and libraries without forking them.

- There is one `PredictiveRegression`. Chapter 37 passes `predictor="habit"`, Chapter 14 passes `predictor="cay"` and
  Chapter 9 passes nothing (`dp`). Their screenshots and click-throughs pass (9 actions each at both widths). Every
  predictor-specific string is in one `TEXT` table, and `useHabitPredictiveSample` calls `usePredictiveSample`
  unchanged, so the habit view loads `goyal-welch-annual` once through the Chapter 9 hook.
- The annual sample is built once. `annualConsumption` and `annualSample` are defined only in
  `src/lib/finance/consumptionPuzzle.ts`. `puzzleSample.ts` (Chapter 35), `disasterSample.ts` (Chapter 39) and
  `longRunRiskSample.ts` (Chapter 38) call them; `longRunRisk.ts` adds only `annualConsumptionPredictors`, which takes
  the output of `annualConsumption` and the Goyal–Welch present values and builds nothing again.
- Gauss–Hermite quadrature is in `src/lib/math/quadrature.ts` only. Its one user is `src/lib/finance/habit.ts`
  (`gaussHermite` and `normalExpectation`); `longRunRisk.ts` and `disasters.ts` use closed forms and write no
  quadrature of their own.
- No duplicate loading code in Part X. `puzzleSample.ts`, `disasterSample.ts` and `longRunRiskSample.ts` use
  `useSeriesData`; `HabitSimulator` loads nothing, and its seeded paths use `mulberry32` and `normalRng`. The hand-made
  `useEffect` plus `loadSeries` loaders of `predictiveSample.ts` and `caySample.ts` date from Chapters 9 and 14,
  before the shared hook of TASK-083; they are not Part X code and Part X adds none.
- The Part X block of `docs/STYLE_GUIDE.md` §3 covers every symbol of the three chapters, and each chapter explains where
  it departs from its paper's letters ($\Lambda$ for $\lambda$, $\mu_c$ for $g$ and $\mu$, $\theta_{\text{EZ}}$,
  $\phi_x$, $\ell$ for $\lambda$, $\pi_D$ for $p$). I found no symbol used two ways. $\phi$ is persistence in Chapters
  37 and 5 and always has a subscript in Chapter 38. $\theta$ is the GMM vector in Chapter 39 and keeps its subscript
  in Chapter 38. $\rho$ is the Campbell–Shiller constant (as $\rho_c$) and never persistence. $\lambda_\eta$,
  $\lambda_e$ and $\lambda_w$ always carry a shock subscript and the Chapter 37 callout says $\lambda$ is a risk premium.
  $\pi$ is a probability in all three chapters: $\pi(s)$, $\pi_D$ and $\pi_t$. $b$ always has the subscript $D$. $\varphi_e$
  stays apart from the filter weight $\varphi$ of Chapter 36.

### Links across Parts

Every sentence about another chapter that I checked is true of the merged site, and Part X answers the puzzles in one
voice: Chapter 37 puts the habit model next to power utility in a table, Chapter 38 shows that power utility gives
back a premium of 0.00% and a risk-free rate of 16.75%, and Chapter 39 prices the premium with disaster odds. Chapters
38 and 39 name earlier Part X chapters by title where they were not merged when written.

- Claims checked: Chapter 35 gives $\gamma = 20.0$, a risk-free rate of 28.2%, the T-bill rate of 0.24% and $\delta =
  1.245$ at $\gamma = 15.0$, and its lognormal fact $\mathbb{E}[e^x] = e^{\mu_x + \frac12\sigma_x^2}$. Chapter 9 gives an
  $R^2$ of 11.8% at ten years. Chapter 22 uses $\eta_t$ for the conditional SDF intercept. Chapter 36 says that
  averaging pushes first-order autocorrelation toward 1/4 and uses $\varphi$ for the filter weight. Chapter 36's Next up
  says that Part X opens with *Internal and external habits*, which "changes the investor rather than the data"; that
  is what Chapter 37 does.
- Named by title or number in plain text, without a link (change 4): Chapter 38, the "What you need" callout, line 19:
  Chapter 37, "Internal and external habits". Chapter 39, Hook, line 31: Chapters 37 and 38 (*Internal and external
  habits* and *Long-run risk*). Chapter 37, Next up, line 344: "Long-run risk". Chapter 38, Next up, line 323: "Rare
  disasters and jump risk". Chapter 36, Next up, line 343: *Internal and external habits*. Each was right when written.
- To Part XI: Chapter 39's Next up names "Yields, forwards and bond returns" as the chapter that opens Part XI and moves
  "from stocks to the prices of bonds". Chapter 40 is not on the site yet, so plain text is right. The bridge is thin. Part X
  ends on the entropy estimate, and Chapter 39 says nowhere how the three answers compare, though its Hook promises
  "three answers" (change 4).

## Sign-off

Four changes. Each becomes an M-12 task for claude opus high, and this PR is merged after they are.

1. **Numbers: Chapters 37 and 39 (`src/content/chapters/37-internal-and-external-habits.mdx`,
   `src/content/chapters/39-rare-disasters-and-jump-risk.mdx`).** In Chapter 37, line 279, make the $\delta$ of
   Chapter 35 say which $\gamma$ it belongs to: "where power utility needed $\delta = 1.245$ at $\gamma = 15.0$ in
   Chapter 35's table". In Chapter 39's Hook, line 29, replace "a risk aversion of at least 15" by "a risk aversion of
   at least 15 on our annual sample, and 20 to reach the Sharpe ratio of 0.45, as Chapter 35 explains", so Part X quotes
   the same two numbers in the same words.
2. **Widget label: `src/components/plots/HabitSimulator.tsx` (line 126).** Rename the slider "Curvature $\gamma$" to
   "Utility curvature $\gamma$", the name the chapter uses, and keep "Local curvature $\gamma/S_t$" for the readout. In
   Chapter 37, Intuition, add the same words to the "Try this" prompt ("raise the utility curvature $\gamma$ to 4").
   Run `npm run clickthrough -- 37-internal-and-external-habits` and change any test that names the old label.
3. **Wording: Chapters 37 and 39.** Chapter 37, line 300: say what "the slope times 10" is and why it is scaled (check
   the paper's Table 5), or give the slopes themselves, which are the numbers the widget shows. Chapter 39, lines
   289–295: split the sentence on Table 1 into three, state the test as "a test of $\gamma = 10$ gives 4.31
   ($p$-value 0.038)", wrap the two long source lines, and keep the numbers.
4. **Links and the Part XI bridge: Chapters 36, 37, 38 and 39.** Link every chapter that is now on the site, with chapter
   number and italic title: Chapter 36's Next up (Chapter 37); Chapter 37's Next up (Chapter 38); Chapter 38's callout
   (Chapter 37) and Next up (Chapter 39); Chapter 39's Hook (Chapters 37 and 38). Then add the bridge in Chapter 39's
   "Recap & next up": three short lines, one for each answer of Part X (habit: preferences change and risk aversion
   moves; long-run risk: consumption has a slow part; disasters: the odds change), each with what the premium needs
   and what the data can say about it, and one sentence that leads to Part XI and is true of
   `docs/CURRICULUM.md` Parts XI and XII. Chapter 40 stays in plain text until it is on the site.
