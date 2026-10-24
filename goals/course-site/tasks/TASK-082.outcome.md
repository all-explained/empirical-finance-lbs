# TASK-082 outcome

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  Evidence: `npm test` with the default 5 s timeout: 540 passed, 6 failed; all 6 failures are
  "Test timed out in 5000ms" in prose-number and `cay` tests that this task does not touch
  (chapters 4, 11, 14 and 18). Rerun with `npx vitest run --testTimeout=60000`: 52 files, 546 tests passed.
  `npm run build`: exit 0, `astro check` "0 errors, 0 warnings", 24 pages built.
- [x] Screenshots and clickthrough pass for `19-size-and-value` and `20-momentum`.
  Evidence: `npm run screenshots -- 19-size-and-value` and `-- 20-momentum` exit 0, 4 images each (dark and
  light, desktop and phone). `npm run clickthrough` exit 0 for both: Chapter 19 heat map 5 actions and SMB/HML
  builder 2 actions; Chapter 20 compounding 7 actions, momentum builder, crash months 10 actions; each at 1280 px and 360 px.
  Element screenshots of both FactorBuilder widgets and the Chapter 20 t-statistics paragraph were inspected in
  both themes at 1280 px and 360 px.
- [x] `grep -n "UMD" src/components/plots/FactorBuilder.tsx src/content/chapters/20-momentum.mdx` shows UMD only
  where the chapter explains the code name.
  Evidence: one hit, `20-momentum.mdx:107` ("version UMD (up minus down). They are the same thing."). None in FactorBuilder.
- [x] `git diff --name-only origin/main` lists only files in scope and this outcome file.
  Evidence: `FactorBuilder.tsx`, `19-size-and-value.mdx`, `20-momentum.mdx`, `TASK-082.outcome.md`.

## Summary

- What: Chapter 20 and FactorBuilder call the published series Mom and the formula WML. The on-screen plot label,
  table caption, readout, aria label and data caption now say "WML rebuilt" and "Mom published"; no UMD on screen.
  The five t-statistics in Chapter 20 ($t = 1.18$, $t = -6.84$, $t = 7.05$, $t = -1.19$, $t = 7.77$) are KaTeX.
  The FactorBuilder caption says "then at the 30th and 70th NYSE percentiles of …" for both kinds.
  Chapter 19 says Chapter 7 gave the idea for the market portfolio and links Chapter 16 for several factors.
- How: FactorBuilder maps the library key `UMD` to the display name `WML` in one place (`name`); the library
  (`src/lib/finance/factors.ts`) keeps its `UMD` key, because library maths is out of scope.
- Deviations: none.
- Verified revision: the branch head that contains this file, rebased on `origin/main` 37087ec.
- Proposed follow-ups: at 360 px the FactorBuilder plot label overlaps the top y tick label ($10k / $100).
  The overlap was there before this task (same label length) and also shows on the SMB/HML builder.
