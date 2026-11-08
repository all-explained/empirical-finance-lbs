# TASK-150 outcome: Part IX sign-off fixes

## Acceptance

Verified revision: `5c9294c` (the chapter commit), rebased unchanged onto `origin/main` `8031595` as `96120de`; the
rebase adds only main's one-line `decisions.jsonl` entry. The outcome commit adds only this file.

- [x] The four changes are made as stated and every number is read from library output or an existing test.
  Evidence:
  1. Bridge. Chapter 36's Next up now says the puzzle survives better measurement and that Part X offers three
     answers, each linked: Chapter 37 *Internal and external habits*, Chapter 38 *Long-run risk*, Chapter 39 *Rare
     disasters and jump risk*. Chapter 35's last Recap bullet ends "so the Next up of Chapter 36, *Measuring
     consumption*, says what Part X changes instead."
  2. Chapter 36. The Hook adds that the sample starts in 1931 because the unfiltered series needs the previous year,
     so its 2.08% and 849 differ from Chapter 35's 2.17% and 271. Those four numbers are pinned already:
     `tests/chapter36-numbers.test.ts` (`['2.08', …, '849']` and the 1930 start's `'271'`) and
     `tests/chapter35-numbers.test.ts` (`'2.17'`). "Swings by tens of percent a year" is now "has a volatility of
     about 11% a year"; the new line `expect(pct(extreme.sd)).toBe('10.82')` in `tests/chapter36-numbers.test.ts`
     pins the readout at $\varphi = 0.80$. The note box links Chapter 35, and the Chapter 5 link is
     `/empirical-finance-lbs/chapters/05-persistence-ar1-and-var/`.
  3. Chapter 37. The sentence now reads "power utility needed $\delta = 1.310$ at the table's $\gamma = 20.0$, and
     $\delta = 1.245$ even at $\gamma = 15.0$ in Chapter 35's table". `tests/chapter37-numbers.test.ts` computes both
     with `impliedTimeDiscount` (at `lowest.gamma`, the table's 20.0, and at `puzzle.gamma.fromSharpe`, Chapter 35's
     15.0) and expects `['1.310', '1.245']`. It passes.
  4. Stale notes. Chapter 8 links Chapter 7 *Mean–variance and the CAPM*; Chapter 3 links Chapter 2 *Expected
     return and risk*; Chapter 9 links Chapter 4 *Autocorrelation and Newey–West* and Chapter 5 *Persistence: AR(1)
     and VAR*. Each says "Here is the short version." No "not written yet" is left: `git grep 'not written yet' --
     src/content` prints nothing.
- [x] Every new link has a chapter number and italic title and a working target.
  Evidence: each new link is written `[Chapter N](/empirical-finance-lbs/chapters/NN-slug/), *Title*`. After the
  build, `dist/chapters/<slug>/index.html` exists for all nine targets (02, 04, 05, 07, 35, 36, 37, 38, 39). A
  Playwright probe on the preview read the `href`s of each changed paragraph: Chapter 36's Next up gives the
  37, 38 and 39 URLs, its note box the 35 URL, Chapter 35's bullet the 36 URL, Chapter 8 the 01 and 07 URLs,
  Chapter 3 the 02 URL and Chapter 9 the 04 and 05 URLs.
- [x] Build passes.
  Evidence: `npm ci` exit 0; `npm test` exit 0, `Test Files 85 passed (85)`, `Tests 942 passed (942)`;
  `npm run build` exit 0, `Result (248 files): 0 errors, 0 warnings, 1 hint` (the hint is the known #88, outside
  this task). `npm run screenshots` and `npm run clickthrough` exit 0 for chapters 36, 35, 37, 08, 03 and 09:
  four `✓` images each, and every widget passes at 1280px and 360px (36: 4 and 6 actions; 35: 6 and 9; 37: 10 and
  9; 08: 18 and 7; 03: 7; 09: 9 and 5). No KaTeX error on the changed pages.

## Summary

What: the four changes of the `## Sign-off` of the TASK-131 outcome (PR #135), in Chapters 3, 8, 9, 35, 36 and 37,
plus two test pins. How: I read each number from the library through the chapter number tests before writing it.
The 1.310 and the 10.82% had no pin, so I added one each. In Chapter 37 I changed only the one sentence, as the
spec asks, since TASK-151 also edits that chapter.

Inspection: I took element crops of every changed passage in both themes at 375px and 1280px and read them. The
links, italics and math render, and nothing overflows. The crops are deleted.

Deviations: none. Follow-ups: none.
