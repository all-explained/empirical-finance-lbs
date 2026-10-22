# TASK-002 outcome: Write docs/CURRICULUM.md from the course outline

## Acceptance

- [x] `docs/CURRICULUM.md` exists, with Part I Foundations first and one or more parts for each of Weeks 1–10.
  Evidence: 17 parts. Part I is "Foundations ●–●●" (chapters 1–8). The `*Outline: …*` tags of Parts II–XVII read
  Week 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6, 7, 8, 9, 9, 10. `grep -cE '^### [0-9]+\.'` prints `66`; the chapters are
  numbered 1–66 without gaps.
- [x] Every chapter has Goals, Key math, Widgets, Data, Readings and Prereqs.
  Evidence: `grep -cE '^\- \*\*(Goals|Key math|Widgets|Data|Readings|Prereqs):\*\*'` prints `396` = 66 × 6. A
  per-chapter check confirmed that each chapter has exactly these six fields, in this order, and that every Prereq
  points to an earlier chapter.
- [x] The coverage table lists every "Concepts covered" item of the outline with a chapter number.
  Evidence: the outline has **51** "Concepts covered" items (Week 1: 7, Week 2: 9, Week 3: 3, Week 4: 5, Week 5: 4,
  Week 6: 4, Week 7: 4, Week 8: 6, Week 9: 9; Week 10 has no list). The coverage table has 51 rows, and **51** are
  mapped to one or more chapters.
- [x] Every Data entry is a listed dataset ID or "simulated (seeded)".
  Evidence: a per-chapter check split each Data line on commas; every token is one of the 10 IDs or
  `simulated (seeded)`. The `grep -oE … | sort -u` lists exactly the 10 IDs: `ff25-size-bm-monthly`, `ff3-monthly`,
  `ff5-monthly`, `fred-consumption-quarterly`, `fred-treasury-monthly`, `goyal-welch-annual`,
  `goyal-welch-monthly`, `gsw-zero-coupon`, `mom-monthly`, `shiller-monthly`.
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0.
  Evidence: prints `0` (its exit code is 1 because grep found no match, which is the wanted result).

## Summary

**What.** `docs/CURRICULUM.md`: 66 chapters in 17 parts, in the format of `options-explained/docs/CURRICULUM.md`.
Part I (8 chapters) builds returns, risk, OLS and White errors, Newey–West, AR(1)/VAR, principal components,
mean–variance and the CAPM, and the Euler equation and SDF. Parts II–XVI follow Weeks 1–9. Weeks 1, 2, 4, 5, 6 and 9
are split into two parts each. Part XVII has six short chapters, one per Week 10 reading. The file ends with the
shared-component table (every widget named in a chapter is in it, and the reverse), the coverage table, and a
"Data wanted later" table with 14 datasets outside TASK-004's list.

**How.** Read the outline with `pdftotext -layout` from the absolute path in the spec. All text is new; the
coverage table restates the outline's concept names as short labels. The lecturer is not named.

**Deviations and choices.**
- Readings use the short form, because `docs/READINGS.md` is not on `origin/main` (checked with
  `git ls-tree origin/main`). TASK-008 owns that file; switch to its keys once it merges.
- Concept counting: lists are split on commas and "and" where the outline joins two separate topics. So "size,
  value, momentum" is three items and "CIP violations and capital regulations" is two. "Factor zoo" appears in
  both Week 2 and Week 4, so it has two rows.
- Readings keep the outline's years, so that they match the outline and TASK-008's keys. A few differ from the
  published versions: Gibbons, Ross & Shanken is Econometrica 1989; Kleibergen & Zhan is JF 2020; Martin & Nagel
  is JFE 2022 ("Market efficiency in the age of big data"); Kelly, Pruitt & Su is JFE 2019. Author order and
  spelling follow the papers (Kelly, Pruitt & Su; Johannes, Lochstoer & Mou; Brunnermeier; Vissing-Jorgensen).
- Foundation readings are textbook chapters from the outline's book list (Campbell 2018; Cochrane 2005;
  Campbell, Lo & MacKinlay 1997). A few Week chapters cite these books for background.

**Verified revision.** The Verify commands ran on commit `144f9c3` (the curriculum); this outcome adds no change to
`docs/CURRICULUM.md`.

**Proposed follow-ups.**
- After TASK-008 merges, replace the short-form readings with `docs/READINGS.md` keys and settle the year
  differences above.
- TASK-004 or a later data task: consider the "Data wanted later" items that are free (French industry
  portfolios, Open Source Asset Pricing signals, FRED Aaa/Baa yields and debt/GDP, Martin's SVIX, the
  He–Kelly–Manela capital ratio).
