# TASK-133 outcome: link chapters 30-33 and add the Part VII bridge

## Acceptance

- [x] Every listed mention is a working link with chapter number and italic title.
  Evidence: each mention now reads `[Chapter N](…), *Title*`, the form of Chapter 26 line 73. In the built pages,
  a multi-line match of `<a>Chapter N</a>, <em>Title</em>` finds all nine: Chapter 30 Next up → 31 (line 342);
  Chapter 31 Next up → 32, 33, 34 (lines 277–281); Chapter 32 prerequisite box → 31 (line 22) and Next up → 33
  (line 359); Chapter 33 "What the 25 portfolios hide" → 32 (line 219). The two bridge links (31 → 30, 32 → 29)
  match too. A script that resolves every chapter href in the four built pages finds 315 local links, and each
  target `dist/…/index.html` exists. The only other hits are the four canonical URLs to the live site.
- [x] The two bridge passages exist and every number in them matches Chapter 30.
  Evidence: Chapter 31, end of "Why the components price the test assets" (lines 129–132), says that on 108
  anomalies an SDF that keeps 14 components reaches an $R^2_{CV}$ of 0.44, against 0.29 for one that keeps 20
  anomalies. Chapter 30 gives the same numbers on line 278 ("$R^2_{CV}$ is 0.29 … only 14 components … 0.44") and
  in its key Callout on lines 299–301 (108 anomalies, 14 components, 20 anomalies, 0.44 against 0.29). Chapter 32's
  Hook (lines 31–32) adds the sentence on the zoo of Chapter 29; it holds no numbers.
- [x] Build passes with no broken links.
  Evidence: `npm run build` gives `astro check` 0 errors and `[build] Complete!`. The link check above
  finds no missing target.

## Summary

**What.** Nine chapter mentions in chapters 30–33 are now links with the chapter number and the italic title. Two
bridge passages tie Part VIII to Part VII: Chapter 31 recalls Chapter 30's out-of-sample result, and Chapter 32's
Hook recalls the zoo of Chapter 29.

**How.** Each file keeps its own link form: absolute `/empirical-finance-lbs/chapters/…` in chapters 30, 31 and 33,
relative `../…` in Chapter 32, as its prerequisite box already used. In the Chapter 32 prerequisite box, the Chapter 31
entry now has the box's form, a bold label then the link in brackets. The Chapter 32 Hook sentence follows "It does
not say *why*." so that the pair "how much … why" stays together.

**Deviations.** None.

**Verified revision.** `npm ci`, `npm test` (78 files, 838 tests passed), `npm run build`, and
`npm run screenshots` and `npm run clickthrough` for each of the four chapters all exit 0, with no console errors,
KaTeX errors or overflow. They ran on the change after its rebase onto `origin/main`. I checked crops of the Chapter 31 bridge paragraph at desktop and phone sizes: the link,
the italic title and $R^2_{CV}$ render correctly.

**Proposed follow-ups.** None.
