# TASK-008 outcome

## Summary

Collected **55 paper PDFs** in the main checkout's private `source/papers/` folder. Added `docs/READINGS.md` with **63 distinct readings**: five books and 58 papers. Versions: **14 published, 41 working papers, eight owner to supply**.

Read the full outline with `pdftotext -layout`. There are **69 reading mentions**, reduced to **63 distinct readings**. The six repeats are Campbell (2018), twice; Cochrane (2011), once; Cochrane (2005), twice; and Nagel (2013), once. Canonical row counts are General 8; Weeks 1–10: 6, 5, 2, 6, 5, 6, 4, 6, 9, 6. Their sum is **63**.

Publisher access was attempted first. Bot blocks required legal author, institutional, NBER, and arXiv alternatives. Citation corrections and differing draft titles/dates are recorded in the bibliography. No shadow libraries were used. No PDF or outline text is committed.

Verified revision: bibliography content in this outcome's commit, based on `e3353e313c7ae2f0028014cc359b6d90fb4e3ca2`. The only PR changes are the bibliography and this outcome. No application code changed; no application test suite is relevant. Local file, title, table, DOI, and git checks decide acceptance. GitHub Actions were not read or run.

## Acceptance

- [x] **Every distinct outline reading occurs once.** Outline count **63**; table count **63**; unique keys **63**. Both requested table `grep -cE` commands print **63**. General and all ten weeks have tables. Repeated assignments retain chapter/week cross-references.
- [x] **Every published or working-paper row has a valid file.** All **55** referenced files exist in `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/`. `file -b` reports PDF for each; sizes range from **232,054 to 3,899,650 bytes**, all above **51,200 bytes**. The requested loop emits no errors. First-page titles were checked with `pdftotext -l 1`; Campbell–Cochrane (1999) required rendered-page inspection because its font mapping is broken. Jagannathan–Wang (1996) required rendered-page inspection because it is scanned. Both visual checks confirm title and authors.
- [x] **Every owner-to-supply reading has a reason.** All **eight** rows are listed below and in `docs/READINGS.md`.
- [x] **No PDF or source path is tracked.** `git ls-files | grep -ciE '\.pdf$|^source/'` prints **0**. A separate assertion of zero forbidden paths exits **0**. The literal grep command itself returns **1**, the blocking delivery conflict described below.

## Local Verify evidence

The exact supplied Verify block was run on 2026-10-22. It emitted no `NOT PDF` or `TOO SMALL` messages. Its complete numeric tail was:

```text
      55
63
63
0
```

The block exits **1**, because its last command is `grep -c` with zero matches. This is normal grep behavior. A separate check asserted the expected output `0` and expected grep status `1`; that check exits **0**. No command was masked or reported as passing with a different status.

DOI titles were audited through Crossref and OpenAlex. This corrected the Lettau–Ludvigson JPE DOI to `10.1086/323282` and Nagel's survey DOI to `10.1146/annurev-financial-110112-121009`. Crossref rate limits required OpenAlex fallback. The arXiv DOI is registered outside Crossref and was confirmed through OpenAlex. `git diff --check` passes.

## Owner to supply

- `Cochrane2005` — book: author offers sample chapters only; full book is sold by Princeton.
- `Campbell2018` — book: complete free author/publisher edition unavailable; publisher access is bot-blocked.
- `CampbellLoMacKinlay1997` — book: complete free author/publisher edition unavailable; MIT author page and publisher return HTTP 403.
- `Duffie2001` — book: author offers corrections only and links to a commercial edition.
- `Singleton2006` — book: no complete free author/publisher edition found; publisher returns HTTP 403.
- `FamaFrench1992` — bot block: Wiley PDF and pdfdirect return HTTP 403; author-site fallback paths unavailable.
- `GibbonsRossShanken1987` — bot block: JSTOR PDF returns an HTML challenge; no verified legal open PDF found.
- `KleibergenZhan2019` — bot block: Wiley, University of Amsterdam repository, and SSRN all return HTTP 403.

## Decision request

**Question:** May delivery accept grep status 1 when the forbidden tracked-file count is zero?

The task requires both a zero tracked-file count and exit status 0 from an unmodified block ending in `grep -c`. Normal grep cannot satisfy both. The work satisfies all four content acceptance requirements, but the literal delivery command cannot pass. This is reported in https://github.com/all-explained/empirical-finance-lbs/issues/3. The task spec has not been changed.

Options and trade-offs:

1. Accept the exact output `0` plus grep status `1` as success. Keep the count assertion, accept only that expected status, and reject grep errors. This preserves all substantive acceptance checks.
2. Require the unmodified command to exit 0. This remains impossible while no forbidden paths are tracked. Tracking a PDF to change grep's status would violate acceptance and is unacceptable.

### Recommendation

Accept option 1. Use an explicit assertion that the forbidden path count is zero. After that decision, resume TASK-008 and mark the PR ready. No paper downloads or bibliography changes are needed for the decision.

Proposed follow-ups: the owner supplies the eight documented book or bot-blocked readings when needed. This task explicitly permits those entries. No new task, decision record, or goal specification was created or edited.
