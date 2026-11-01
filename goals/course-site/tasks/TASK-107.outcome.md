# TASK-107 outcome: Chapter 29: Multiple testing

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm ci` exit 0; `npm test`: 64 files, 680 tests passed (5 in `tests/chapter29-numbers.test.ts`);
  `npm run build`: "Result (194 files): 0 errors, 0 warnings, 1 hint" (the hint is an unused import in
  `src/lib/finance/news.ts`, not in this task's files), "29 page(s) built", "Complete!", exit 0.
- [x] `npm run screenshots -- 29-multiple-testing` passes in both themes at desktop and phone size, and the
  images were inspected.
  Evidence: ✓ for dark-desktop, dark-phone, light-desktop, light-phone. I read tiles of all four full pages and,
  with a Playwright probe (not committed), opened the proof `<details>` at 375px. Fixes from the inspection:
  the readout labels were shortened ("True: filled, top", …) because the long labels squeezed the values into
  five lines at phone width, and the expected-false formula moved into the caption; three display equations of
  the proof were wider than a 375px phone and now break over aligned lines (the probe then found no KaTeX box
  wider than the proof and no page overflow).
- [x] `npm run clickthrough -- 29-multiple-testing` passes and reports every widget of the chapter.
  Evidence: exit 0. `MultipleTesting`: 15 actions at 1280px and 15 at 360px (slider "Line ∣t∣"; segmented
  "Snap the line to a rule" options "|t| = 1.96", "|t| = 3", "Bonferroni", "Holm", "BHY"; sliders "Strategies
  tried n" and "Share with a true alpha"; button "New seed"). `ZooChart`: 6 and 6 (slider "Significance line
  ∣t∣"; segmented "Window" and "Portfolio construction").
- [x] The six `section-tag` headings are in template order.
  Evidence: `grep -n 'section-tag'`: line 15 Hook, 31 Intuition, 69 Formalisation, 247 Playground, 287 Check
  yourself, 313 Recap & next up.
- [x] No hex colour in the chapter or its widgets.
  Evidence: the Verify `git diff … | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` prints
  "no hex colours". Colours are `var(--c-signal)`, `--c-prob`, `--text` and `--text-muted`. True and null
  strategies differ by row and label as well as colour; discoveries differ by fill.
- [x] The widget uses seeded simulations from `src/lib/math/rng.ts`; `ZooChart.tsx` is unchanged.
  Evidence: `strategySearch` in `src/components/plots/multipleTestingSample.ts` calls `simulateStrategySearch`
  (which draws with `normalRng(seed)`) and spreads the strip with `mulberry32(seed + 1)`; "New seed" steps the
  seed. `git diff --stat origin/main -- src/components/plots/ZooChart.tsx` prints nothing. The chapter uses
  `<ZooChart client:visible initialLine={3} />`.
- [x] Voice review and numbers table: below.
- [x] The prose is 2,823 words, inside 1,500–3,000. Command (the one of chapters 9, 10, 13, 16, 22 and 27):
  `awk 'NR>8' src/content/chapters/29-multiple-testing.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review (`docs/STYLE_GUIDE.md` §1)

| Rule | Line of the chapter |
|---|---|
| Picture first, then the formula | The Intuition shows the two rows of strategies and the line ("The top row holds the 30 strategies with a true alpha. The bottom row holds the 270 without one.") before the Formalisation writes $\mathbb{E}[n_{\text{false}}] = n_0 \times 2\,\Phi(-t^\ast)$. |
| Data before theory | The Hook opens on a search with a known truth: "You keep 40 strategies. Twelve of the 40 have no alpha at all, so 30% of your "discoveries" are luck." The Playground then puts the rules on the 165 published predictors. |
| One idea per section | Hook: a fixed bar and many tries. Intuition: a line trades one mistake for another. Formalisation: one `###` each for the setting, the expected count, FWER and Bonferroni, Holm, FDR and BHY. Playground: the zoo against the rules, and what the count cannot show. |
| Start with a question the reader has | "A colleague shows you a trading strategy with a $t$-statistic of 2.5. Is it real? … how many other strategies did your colleague try before this one?" |
| Write to one reader, as "you"; explain terms; link back | "To choose a line, you must first say which mistake you want to control." **Discovery**, FWER, FDR and FDP are defined where they first appear; Chapter 21 is linked in the Hook. |
| Give the honest version | "A simplification is in play. With $T = 600$ months, the $t$-statistic of a null strategy follows a Student $t$ distribution, which is very close to the normal. We treat it as normal." |
| Say what the evidence can and cannot show | "So the 123 that clear BHY are not "123 real predictors", and $1 - 123/165$ is not the false discovery rate of the literature. A rule promises a bound only when it sees every test that was tried." |
| Don't skip steps | The uniform $p$-value, $\text{FWER} \le \mathbb{E}[n_{\text{false}}]$, Bonferroni's bound, Holm's power and FWER control are each derived in the text; the BHY proof under any dependence is written out step by step in a `<details>` block. |
| Graduate rigour, with a plain reading | Part VII is ●●●. After the expected count: "In words: the number of true nulls times the size of one test." After the BHY proof: "No step used independence, only the uniform $p$-value of each true null." |
| Papers in our own words | "When they estimate how many are missing, the bar rises to 3.18 (p. 28). That is the basis of their case for $t > 3$." No text, figure or table is copied. |

## Numbers in the prose

All tests are in `tests/chapter29-numbers.test.ts`. The simulated numbers come from `strategySearch` with the
shared settings of `multipleTestingSample.ts` (seed 1, 300 strategies, 10% true, Sharpe 0.5, 600 months,
$q = 5\%$); the zoo numbers from `zooSummaries` on `osap-ls-monthly` and the library's rules.

| Number in the prose | Where | Test |
|---|---|---|
| 300 strategies, 50 years, Sharpe 0.5, 30 true and 270 null | Hook, Intuition | `hook` (settings, `isTrue` counts) |
| 40 kept at 1.96; 12 false, 28 true; 30% | Hook, Try this | `hook` (`discoveryCounts` at the "single" line) |
| at 3: 1 false; misses 2 → 9 | Try this | `intuition` |
| $270 \times 0.05 = 13.5$; this search drew 12 | Intuition, Formalisation | `intuition` (and `expectedFalseDiscoveries`) |
| $0.5 \times \sqrt{600/12} = 3.54$ | Intuition | `intuition` |
| size at 3 is 0.27%; expected count 0.73 | Formalisation | `formalisation` |
| Bonferroni at $n = 300$: $p_i \le 0.000167$, $\lvert t_i\rvert > 3.76$ | Formalisation | `formalisation` |
| Bonferroni and Holm: 12 of 30 true, no false | Formalisation | `formalisation` (`ruleLine` + `discoveryCounts`) |
| at 50% true: Bonferroni 67, Holm 71 (all true) | Formalisation | `formalisation` |
| $c(300) = 6.28$ | Formalisation | `formalisation` (`yekutieliConstant`) |
| BHY: 15 true, no false; at 50%: 111 true, 1 false | Formalisation | `formalisation` |
| 165 predictors; 107 above 3; 158 above 1.96 | Playground | `playground` (`countAbove`) |
| Bonferroni 81 down to 3.64; Holm 88 down to 3.45; BHY 123 down to 2.73 | Playground, Recap, quiz 3 | `playground` (`count`, `tCutoff`) |
| lines 2.72, 3.45, 3.64 give 123, 88, 81 in `ZooChart` | Try this | `playground` (`countAbove`) |
| $42/165$ | quiz 3 | `playground` |
| at 0% true: 14 false at 1.96, all discoveries false; none for Bonferroni | Try this too | `playground` |
| $0.05/500 = 0.0001$ | quiz 1 | `check yourself` |
| HLZ: 316 factors (p. 8); $t > 3$ (p. 5); BHY bar 2.78 by 2012 (p. 26); 3.18 with missing tests (p. 28) | Hook, Playground | cited, Harvey, Liu & Zhu (2016) |
| HXZ: 452 anomalies; 65% fail 1.96; 82% at 2.78 | Playground | cited, Hou, Xue & Zhang (2020), p. 2019 (abstract) |

The 1.96, 3, 5%, $q$ and the 40 strategies of quiz 2 are fixed inputs, not results. The pages cited for the
procedures (Bonferroni without a dependence assumption, p. 18; Holm uniformly more powerful, p. 20; BH under
independence or positive dependence, p. 21; $c(n)$ valid under any dependence, pp. 20–21; FDR definition, p. 14)
were checked in the published PDF (RFS 29(1), 2016, pp. 5–68; PDF page $k$ is journal page $k + 4$).

## Summary

**What.** `src/content/chapters/29-multiple-testing.mdx` (part 7, chapter 29, difficulty 3, prerequisites [21]);
widget `src/components/plots/MultipleTesting.tsx`; its shared settings `src/components/plots/multipleTestingSample.ts`;
`tests/chapter29-numbers.test.ts`. `ZooChart` is reused unchanged with `initialLine={3}`.

**How.**
- The widget computes only through `src/lib/stats/multipleTesting.ts`: `simulateStrategySearch`, `pValues`,
  `bonferroni`, `holm`, `benjaminiHochbergYekutieli` and `discoveryCounts`.
- A rule's line is the midpoint between the largest $|t|$ the rule keeps and the smallest $|t|$ it rejects, so
  the strategies above the drawn line are exactly the rule's discoveries.
- The strip plot puts true strategies in the top row and null ones in the bottom row, with a solid line at $+t^\ast$
  and a dashed one at $-t^\ast$. The line can be dragged (a Mafs `MovablePoint`), set with the `Slider` (keyboard)
  or snapped by the `Segmented`. There is no animation, so `prefers-reduced-motion` needs nothing.
- The Formalisation derives the uniform $p$-value, the expected number of false discoveries (no independence
  needed), $\text{FWER} \le \mathbb{E}[n_{\text{false}}]$, Bonferroni's bound, why Holm rejects everything
  Bonferroni rejects and still controls the FWER, $\text{FDR} \le \text{FWER}$, and the BHY bound under any
  dependence.

**What our data show.** On the 165 original-sample $t$-statistics, at $q = 5\%$, Bonferroni keeps 81 (down to
$|t| = 3.64$), Holm 88 (down to 3.45) and BHY 123 (down to 2.73). These are published survivors, so the chapter
says plainly that the kept count is not the literature's false discovery rate.

**Deviations and mismatches.**
- Notation: the curriculum writes Bonferroni as $p_i \le \alpha/M$ and the expected false count as $M_0\,\alpha$.
  The chapter follows §3 (Part VII): $p_i \le q/n$ and $n_0$ times the test size, because in §3 $\alpha$ is a
  pricing error and $M$ the SDF. The curriculum's widget line also says "$M$ seeded strategies"; the widget says $n$.
- Readings: the curriculum says Hou, Xue & Zhang (2018). The PDF is the published version, *Review of Financial
  Studies* 33(5), 2020, pp. 2019–2133 (advance access December 2018), so the chapter cites 2020 with page 2019.
- Chapter 28 is not merged on `origin/main` (`509edf6`); the chapter does not mention it. Chapter 30 is named by
  title only in Recap & next up.
- Symbols the §3 table still lacks (candidates for a style-guide task): $t^\ast$, a bar on $|t|$;
  $n_{\text{false}}$ and $n_{\text{disc}}$, the counts of false discoveries and of all discoveries; FWER, FDR and
  FDP; $B_j$, the $j$-th band of $p$-values in the BHY proof; $j^\ast$, the rank of the smallest true-null
  $p$-value in the Holm proof. $m$ (Bonferroni's count) and $u$ (a $p$-value level) appear once each, in one proof.

**Verified revision.** The commit that adds this file, on `origin/main` `509edf6`: `npm ci`, `npm test`,
`npm run build`, `npm run screenshots -- 29-multiple-testing`, `npm run clickthrough -- 29-multiple-testing`,
the `section-tag` grep, the `ZooChart` diff, the hex grep and the tracked-PDF count, all as above.

**Follow-ups.**
- Style-guide task: add the symbol candidates above to the Part VII table.
- When Chapter 28 merges: no change needed here; a link back from Chapter 29 is optional.
