# TASK-100 outcome: Orchestrator reads Part VI and signs it off

Verified revision: `origin/main` at `f3e9813` (it contains the merges of TASK-096 to TASK-099 and of TASK-101).

## Acceptance

- [x] `npm test` and `npm run build` pass on merged `main`; `astro check` reports 0 errors, 0 warnings.
  Evidence, tests: `npm ci` exit 0; `npm test` exit 0, "Test Files 61 passed (61)", "Tests 637 passed (637)", 27.5 s.
  `vitest.config.ts` (TASK-101) sets `testTimeout` to 30000, so the 5 s timeouts of earlier runs do not occur.
  Evidence, build: `npm run build` exit 0, "Result (187 files): 0 errors, 0 warnings, 1 hint", "28 page(s) built", "Complete!".
  The hint is `'Matrix' is declared but its value is never read` in `src/lib/finance/news.ts`, outside Part VI.
- [x] `npm run screenshots` and `npm run clickthrough` pass for chapters 24 to 27.
  Evidence, screenshots: exit 0 for each of the four chapters, with ✓ for dark-desktop, dark-phone, light-desktop and
  light-phone. Evidence, click-through: exit 0 for each chapter, every widget reported at 1280px and 360px:
  Chapter 24 `GMMObjective` twice (5 actions each); Chapter 25 `GMMObjective` (7) and `JTestSim` (9);
  Chapter 26 `RegressionLab` (1: "Reset dragged dots") and `HJDistance` (5); Chapter 27 `UselessFactor` (6) and
  `ConfidenceSet` (6).
- [x] The outcome holds the four judgements and a `## Sign-off` section.
  Evidence: the sections "Voice", "Widgets", "Shared code and notation" and "Links across Parts", then `## Sign-off`.
- [x] `git diff --name-only origin/main` lists only this task's outcome file.
  Evidence: the command prints `goals/course-site/tasks/TASK-100.outcome.md` and nothing else.

## Summary

I read Chapters 24 to 27 (about 12,400 words with the maths) in the source and as built pages. I looked at every widget in
both themes at 1280px and 360px, with an element screenshot from a Playwright probe kept in `/tmp` (not committed). The
click-through script drove every control. I changed no chapter, widget, library or doc. I checked paper claims against
`source/papers/KleibergenZhan2019.pdf` where a sentence about another source could be wrong: Table V does give a rank-test
p-value of 0.274 and a (−∞, ∞) GRS-FAR set for the conditional consumption CAPM with $c$, $cay$ and $c \times cay$, and
for the Fama–French three factors an empty set with p-value 0.030, as Chapter 27 says. I did not check the page numbers.

### Voice

The voice works for a reader who starts from zero, at the Part's ●●● level. Each chapter opens on one number that a reader
can check (four moments and two unknowns; a model that passes its test and prices worst; noise that looks priced) and ends
the Hook on a question in bold. Every term is defined where it first appears (moment condition, just identified, efficient,
sandwich, size, unbounded set). Long derivations go in numbered steps, with the plain reading after them ("So the far ends
of the line get the rank test's p-value"). The chapters say what they cannot show: no standard errors on the HJ distances,
a short consumption sample, and "We do not have a simple story" for the power loss of iterated GMM and CUE. Notes: Chapter 26
is the densest (two stages, the $b$ and $\lambda$ forms, the HJ distance and its proof in one chapter), but each part has its
own `###` heading and the HJ algebra sits in a `<details>`. One sentence in Chapter 27 is hard to parse (change 3).

### Widgets

Each widget teaches what its caption says, and each prose number I compared with a readout matched.

- `GMMObjective` (24, 25): the 2-moment minimum 0.496, 1.025 with objective 0; the 4-moment estimates 0.501, 1.086 and
  0.488, 1.005; the standard errors. The method toggle (Chapter 25) changes the contour shape as the text says.
  One label does not match the text (change 1).
- `JTestSim` (25): 13.3% rejected at $T = 100$ with two-step GMM, and the $\chi^2_2$ curve over the histogram. The caption states
  the size, the fat-tail design and the chunked run.
- `RegressionLab` preset and `HJDistance` (26): the slope 2.91, the 25 pricing errors, and the table of $\delta_{\text{HJ}}$,
  $J$ and p-values (0.513, 91.2; 0.470, 13.0; 0.488, 67.7) are the numbers of the Hook and Recap. Both weightings give the
  prose's errors.
- `UselessFactor` and `ConfidenceSet` (27): 28.0% and 7.5% rejections; Wald coverage 90.2% and 93.2% against GRS-FAR
  94.7%, with 1.5% unbounded sets at spread 1. The `Consumption` mode shows the 252-quarter intervals of the text.
- Layout: no horizontal overflow at 360px in either theme, no KaTeX error, no console error, and no widget has an empty readout.
  Page screenshots read well in both themes. The sticky header covers the top of a widget only in my element shots, not on the page.

### Shared code and notation

The chapters share one set of helpers.

- Chapters 24 and 25 use the same `GMMObjective` and `gmmSample.ts` (seed 1, $T = 600$). `JTestSim` uses the same file and
  `src/lib/stats/gmm.ts` for its simulation and `chiSquareCdf` for the curve. No chapter repeats a formula that lives in `src/lib`.
- Chapters 26 and 27 load data through `useConditionalData`, which Part V's `ScaledFactors` uses too: `sdfGmmSample.ts`
  calls it directly, and the two Chapter 27 widgets call it through `useIdentificationData`. Nothing in Part VI adds its own
  `fetch` or `useEffect` loader. That name is a re-export of `useConditionalData` (change 2). The widgets' own `useEffect`
  calls are timers (`JTestSim`, chunked runs) and a re-roll (`UselessFactor`, `ConfidenceSet`), not loaders.
- Notation follows the Part VI block of `docs/STYLE_GUIDE.md` §3: $g_T$, $D$, $W$, $S$ and $\hat S$, $\mathbb{E}_T$, $\tilde f$,
  $\delta_{\text{HJ}}$, $\lambda^{\circ}$, $\dim g$ and $\dim\theta$. I found no symbol used two ways without a note. Where a symbol is
  reused, the chapter says so in words: $x_t$ and $z_t$ (Chapter 24, IV paragraph). $z$ is also a standardised normal vector in Chapters
  25 and 27, local to a derivation, and $\hat\Sigma_f$ is a matrix in Chapter 26 and a scalar in Chapter 27 when $K = 1$. Both are clear
  in context.

### Links across Parts

Part VI links the earlier Parts and points on, and the sentences about other chapters are true of the merged site.

- Part IV: Chapter 24 uses Chapters 3 and 4 (OLS, Newey–West); Chapter 26 uses 8, 16, 17 and 18 (SDF, HJ bound, GRS, two-pass,
  Shanken); Chapter 27 uses 16, 17 and 18. I checked each claim against the linked chapter and the data.
- Part V: Chapter 22 says "Part VI shows how to estimate and test them directly, in Chapter 24 … and Chapter 26" and Chapter 23's
  "Next up" says "Part VI … starting with Chapter 24". Both are true. Going the other way, Chapter 24 mentions managed portfolios without a link, and Chapter 26 says
  nothing about scaled factors; Chapter 27 uses Chapter 22's data and scaled model (change 4).
- Part VII: Chapter 27 ends on "Part VII opens with Chapter 28, *A skeptical look at asset pricing tests*, which asks what a
  cross-sectional fit on these portfolios can prove at all". That matches `docs/CURRICULUM.md` (Chapter 28, goal: the 25
  portfolios' factor structure). Chapter 28 is not on the site yet, so the name is plain text, correctly. The factor zoo of
  Chapter 21 is not named in Part VI.
- Sources: `docs/READINGS.md` records why Kleibergen & Zhan is 2020 in the chapter and 2019 in `docs/CURRICULUM.md`. Not a defect.

## Sign-off

Four changes. Each becomes an M-8 task for claude opus high, and this PR is merged after they are.

1. **Chapter 24, `src/content/chapters/24-generalized-method-of-moments.mdx` (Intuition, lines 42–43).** The text says "The dot
   labelled $\hat\theta$ is the lowest point … The dot labelled $\theta_0$ is the truth". The widget labels read "minimum" and
   "true θ₀" (`GMMObjective.tsx` lines 134, 136, 168). Fix: say "the dot labelled *minimum* is the lowest point, the
   estimate $\hat\theta$".
2. **Chapter 27 widgets, `src/components/plots/identificationSample.ts` (lines 12–13), `ConfidenceSet.tsx`, `UselessFactor.tsx`.**
   `useIdentificationData` and the type `IdentificationData` are two more names for `useConditionalData` and `ConditionalData`.
   Fix: delete both aliases and import `useConditionalData` in the two widgets, as `ScaledFactors.tsx` and `sdfGmmSample.ts` do.
   One name for one thing.
3. **Chapter 27, `src/content/chapters/27-weak-and-useless-factors.mdx` (lines 209–211).** "…so it can never give the right answer
   for weak betas: "almost anything"." The quoted words are not a quotation and the sentence does not say what is wrong. Fix: the
   Wald set is always bounded, but when the betas are weak the right answer is "almost anything", so the Wald set is too narrow
   to be right. Then keep the sentence on the normal approximation.
4. **Chapters 24, 26 and 27, same folder.** Link the first mention of each earlier chapter in the body, as the other chapters do:
   Chapter 26 names Chapters 24 and 25 (line 72) in plain text, and Chapter 27 names Chapter 26 (line 80) in plain text. Add the Part V bridge in one sentence each: in Chapter 24's
   IV paragraph, link "managed portfolio" to Chapter 22; in Chapter 26, after the linear SDF, say that the scaled models of
   Chapter 22 are linear SDFs with extra factors, so the same moments and tests apply.

Part VI reads well, apart from the four changes above.
