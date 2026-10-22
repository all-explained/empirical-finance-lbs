---
id: TASK-008
title: Download every outline paper into source/papers/ and commit docs/READINGS.md
milestone: M-1
state: approved
depends_on: []
delivery: pr
priority: 1
route: {platform: codex, model: gpt-6.1-sol, effort: high}
---

## Why

SC-2 and SC-5. Chapters must state each paper's model, equations and numbers correctly. Workers check them against the paper, not against memory. Doing all papers first means no chapter task waits for downloads.

## Scope

1. Read every reading in the course outline: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/course-outline-e164-spr26.pdf` (git-ignored, not in your worktree; use `pdftotext -layout`). Include the general books and survey papers and the Week 1–10 lists. Remove duplicates (for example Cochrane 2011 appears in two weeks).
2. For each paper, find the DOI and download the **published** PDF from the publisher's site. The owner's Mac is on the CEMFI VPN, which gives institutional access to most journals (Wiley, Oxford Academic, Elsevier/ScienceDirect, UChicago Press, JSTOR, AEA, Econometric Society).
3. If the publisher blocks automated download, use a legal open version: the author's website, SSRN, NBER, or arXiv. Record it as "working paper". Never use shadow libraries (Sci-Hub, LibGen, Anna's Archive).
4. Books (Cochrane 2005, Campbell 2018, Campbell–Lo–MacKinlay 1997, Duffie 2001, Singleton 2006): download only what the author or publisher offers for free. Otherwise mark them "owner to supply".
5. Save each file to `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/<Key>.pdf` (absolute path, outside your worktree). `<Key>` is the surnames joined plus the year, for example `CampbellShiller1988`, `GoyalWelch2008`. With four or more authors use `<First>EtAl<Year>`. Add `a`/`b` on a clash.
6. Check every file: `file` reports a PDF, it is larger than 50 KB, and the title on page 1 (`pdftotext -l 1`) matches the citation. An HTML login page saved as `.pdf` is a failure.
7. Commit `docs/READINGS.md`: one table per outline week (plus "General"), with columns Key, Citation, DOI or URL, Version (`published` / `working paper` / `owner to supply`), File. This is the bibliography that the curriculum and chapters use.

The PR contains only `docs/READINGS.md` and the outcome. PDFs never enter git.

Out of scope: summaries of papers, curriculum, site code.

## Acceptance

- `docs/READINGS.md` lists every reading of the outline once; the outcome states the outline count and the table count, and they are equal.
- Every row with Version `published` or `working paper` has a file in `source/papers/` that `file` reports as PDF and that is larger than 50 KB.
- The outcome lists every `owner to supply` row, with the reason (paywall, bot block, book).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0.

## Verify

```sh
P=/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers
ls -1 "$P" | wc -l
for f in "$P"/*.pdf; do file -b "$f" | grep -q PDF || echo "NOT PDF: $f"; [ $(wc -c < "$f") -gt 51200 ] || echo "TOO SMALL: $f"; done
grep -cE '^\| [A-Za-z]+[0-9]{4}[ab]? \|' docs/READINGS.md
grep -cE '\| (published|working paper|owner to supply) \|' docs/READINGS.md
git ls-files | grep -ciE '\.pdf$|^source/'
```
