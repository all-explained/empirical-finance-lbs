# TASK-156 outcome: link chapter 40 from chapter 39 Next up

## Acceptance

- [x] Every mention of chapter 40 in chapters 36-39 is a working link.
  Evidence: `grep -n -i "chapter 40\|Yields, forwards" src/content/chapters/3[6-9]*.mdx` found one mention, in
  Chapter 39's "Recap & next up" (line 377). It now reads
  `[Chapter 40](/empirical-finance-lbs/chapters/40-yields-forwards-and-bond-returns/), *Yields, forwards and bond returns*`,
  the same style as the Chapter 37 and 38 links above it. The built page
  `dist/chapters/39-rare-disasters-and-jump-risk/index.html` contains
  `href="/empirical-finance-lbs/chapters/40-yields-forwards-and-bond-returns/"`, and the build lists
  `/chapters/40-yields-forwards-and-bond-returns/index.html`. Chapters 36-38 do not mention Chapter 40.
- [x] `npm test` and `npm run build` pass; screenshots and clickthrough pass for chapter 39.
  Evidence: `npm ci`, `npm test` (88 files, 1013 tests passed), `npm run build` (41 pages built),
  `npm run screenshots -- 39-rare-disasters-and-jump-risk` (four screenshots: both themes, desktop and phone)
  and `npm run clickthrough -- 39-rare-disasters-and-jump-risk` (both widgets, 1280px and 360px) all exit 0.

## Summary

One sentence in Chapter 39 changed: the plain-text "Chapter 40" in Next up is now a link. No other prose, widget
or library changed. Everything ran on the MacBook (small static site, no data jobs). Verified revision: the commit
that adds this file, on top of `origin/main`.
