# TASK-003 outcome

## Acceptance

Verified locally on 2026-10-22 in the task worktree, on branch `goal/course-site/task-003`,
at revision `10a85d630dc17302fe8dc6b7273648b9e59a9abb` (rebased onto `origin/main` `48a23c4`).
The whole Verify block ran in one shell and exited 0.

- [x] `docs/STYLE_GUIDE.md` has voice, template, notation, colour and widget sections for this course.
  Evidence: sections `## 1. Voice`, `## 2. Chapter template`, `## 3. Notation` (six tables: returns and
  prices; factor models and tests; SDF and consumption; predictability and Campbell–Shiller; bonds and the
  term structure; probability and statistics), `## 4. Colour semantics`, `## 5. Widgets`, then
  `## 6. Quizzes` and `## 7. References`.
- [x] `npm test` passes, including the notation-vs-macros test.
  Evidence: `Test Files 2 passed (2)`, `Tests 14 passed (14)`. `tests/notation.test.ts` reads the Macro
  column of the §3 tables and checks both directions (every named macro is defined; every defined macro is
  named), and renders each macro with KaTeX to confirm its colour class. Negative check: deleting `\Err`
  from `katexMacros.ts` makes the test fail with `+ "\\Err"`; the file was then restored.
- [x] `npm run build` and `npm run screenshots` pass.
  Evidence: `astro check` reports 25 files with 0 errors, 0 warnings, 0 hints; `1 page(s) built`.
  Screenshots: `✓ home-dark-desktop.png`, `✓ home-dark-phone.png`, `✓ home-light-desktop.png`,
  `✓ home-light-phone.png`, all inspected by eye. The chrome picks up the new tokens in both themes.
- [x] `grep -rnE '\\(Call|Put|Strike|Spot)\b' src docs` prints nothing.
  Evidence: no output (grep exit 1); the Verify line prints `no option macros`.

## Summary

**What.** `docs/STYLE_GUIDE.md` adapts the options-explained guide to empirical asset pricing. It keeps the
voice rules, the six-section chapter template and the widget rules. It replaces the notation table and the
colour semantics.

**Colour tokens** (`src/styles/theme.css`), one CSS variable per role, both themes:
`--c-return`, `--c-rf`, `--c-factor`, `--c-sdf`, `--c-signal`, `--c-data`, `--c-model`, `--c-error`,
`--c-prob`. Option tokens (`--c-spot`, `--c-call`, `--c-put`, `--c-time`, `--c-vol`, `--c-rate`, `--c-bid`,
`--c-ask`, `--c-accent`) are gone. Chrome (links, focus, quiz feedback, callouts) now uses four interface
tokens, `--ui-accent`, `--ui-highlight`, `--ui-good`, `--ui-bad`, so no quantity colour is tied to chrome
by name. Mafs's named colours map onto the semantic roles.

**Macros** (`src/lib/katexMacros.ts`): `\Ret`, `\Rf`, `\Factor`, `\SDF`, `\Signal`, `\Data`, `\Model`,
`\Err`, `\Prob`, one per coloured role. Option macros removed.

**Clashes resolved in the notation table:** time discount $\delta$ vs exposure $\beta$; factor $f_t$ vs
forward rate $f^{(n)}_t$ (forward always carries its superscript); risk premium $\lambda_k$ vs PCA
eigenvalue (now $\ell_k$); Campbell–Shiller $\rho$ vs correlation (written $\operatorname{corr}$); pricing
error $\alpha$ vs significance level (now $q$); $\gamma$ only for risk aversion; $N$ count vs normal CDF
(now $\Phi$); predictive regressions use $a, b$; log price $p_t$ vs bond price $p^{(n)}_t$ vs probability
(now $\pi$).

**Deviations.**
- Gross return has no letter of its own: $R$ is the simple net return and the gross return is written
  $1 + R$. This matches `docs/CURRICULUM.md` Chapter 1. Risk-free rate is $R^f_t$, dated when it is known.
- Five light-theme colours from options-explained were below 4.5:1 contrast on the plot background
  (return, risk-free, SDF, signal, good). They are darkened; every token now reaches at least 4.5:1 against
  both backgrounds in both themes.
- The test does not check `theme.css` for each macro's class, because Vitest replaces CSS imports with an
  empty string. KaTeX rendering of each macro is checked instead.
- `CLAUDE.md`: four lines that said the style guide and notation "will" come in TASK-003 now point to it.

**Proposed follow-ups.** `docs/CURRICULUM.md` key-math lines predate this guide in a few places
(Chapter 8 writes the time discount as $\beta$; Chapters 33, 34 and 42 use $\gamma$ for slopes or weights;
Chapters 26 and 30 write a linear SDF as $m$). Chapter authors follow the guide; no new task is needed unless the
owner wants the curriculum text aligned.

Delivery: PR https://github.com/all-explained/empirical-finance-lbs/pull/7 into `main`, label
`goal:course-site`.
