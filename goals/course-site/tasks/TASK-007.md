---
id: TASK-007
title: Put the reference chapters' papers in source/papers/
milestone: M-2
state: cancelled
depends_on: [DEC-001]
delivery: manual
reason: "Replaced by TASK-008: a worker downloads all outline papers first, not only the reference chapters' papers."
---

## Why

SC-5. A chapter must state each paper's model, equations and key numbers correctly. Workers check them against the paper, not against memory.

## Scope

After DEC-001 is accepted, the owner downloads the papers listed under **Readings** for the two chosen chapters into `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/`. Name each file `<Authors><Year>.pdf` with surnames joined, for example `CampbellShiller1988.pdf`, `GoyalWelch2008.pdf`. Book chapters (Cochrane, Campbell) go in the same folder, for example `Campbell2018-ch5.pdf`.

`source/` is git-ignored. These files stay on this Mac and are never committed or published.

## Acceptance

- Every reading of the two chosen chapters has a PDF in `source/papers/`, or the owner marks it "not needed" in a note to the orchestrator.

## Verify

```sh
ls -1 /Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/
```
