# TASK-016 outcome

## Acceptance

- [x] Two simultaneous `npm run screenshots -- 01-returns` runs from different
  worktrees of the same commit both exit 0. Both worktrees used
  `66eec039b8c6b25c5cfd11879476d26c35f3390a`. The task worktree started at
  `2026-10-22T19:50:38.097Z`; `task-016-parallel-verify` started at
  `2026-10-22T19:50:38.099Z`. Both finished at `19:50:53Z`, exited 0, and
  reported all four Returns screenshots passing.
- [x] `npm run clickthrough -- 01-returns` exits 0 and prints no `kkk`.
  The Return calculator reports `slider "Repeat the move k times"` and
  passes three actions at each of 1280px and 360px. The other widget passes
  seven actions at each width.
- [x] `npm run clickthrough -- 09-time` exits 0 and prints no `kkk`.
  The two widgets pass nine and five actions, respectively, at each width.
  A separate assertion on the complete Verify log confirms no `kkk` and
  confirms the exact single-`k` Return calculator label.
- [x] `grep -n 4329 scripts/lib/preview.mjs scripts/screenshots.mjs scripts/clickthrough.mjs`
  prints nothing and exits 1. The Verify command with `|| echo "no fixed port"`
  prints exactly `no fixed port` for this check and succeeds.
- [x] `git status --short` contains only intended paths: the two script files
  before the implementation commit, then this outcome file before its commit.
  The full Verify run reports a clean working tree after the script commit.
  The PR changes only `scripts/lib/preview.mjs`, `scripts/clickthrough.mjs`,
  and this outcome file.

## Summary

The preview helper asks the operating system for a free loopback port, passes
it to Astro, and builds the browser URL from that port. It waits for its own
child process to announce the selected URL before making HTTP requests.
It rejects Astro port fallback and reports startup failures with server output.
Astro still runs directly through `node_modules/astro/bin/astro.mjs` with
`--ignore-lock`, and cleanup still stops both the browser and server.

The click-through script prefers the control's `aria-label`. Otherwise, it
copies the label and removes KaTeX MathML and annotation nodes before reading
the text. The controls and actions checked remain the same.

Verified revision: `66eec039b8c6b25c5cfd11879476d26c35f3390a`, rebased onto
`origin/main` without conflicts. The later outcome commit changes documentation
only. No task-scope deviations or proposed follow-ups.

Local Verify completed with exit 0 on 2026-10-22:

```sh
npm ci
npm test
npm run build
npm run clickthrough -- 01-returns
npm run clickthrough -- 09-time
npm run screenshots -- 01-returns
grep -n 4329 scripts/lib/preview.mjs scripts/screenshots.mjs scripts/clickthrough.mjs || echo "no fixed port"
git status --short
```

Results: 8 test files and 142 tests passed. Astro reported 0 errors, warnings,
or hints and built all 3 pages. Both chapter checks and all 4 screenshots passed.

An additional forced-collision check occupied the selected port before Astro
started. The helper rejected the fallback port, the browser check never ran,
and the competing server received 0 requests. The check exited 0.
