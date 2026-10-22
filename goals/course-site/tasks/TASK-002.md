---
id: TASK-002
title: Write docs/CURRICULUM.md from the course outline
milestone: M-1
state: approved
depends_on: []
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why

SC-2 and SC-6. The curriculum is the plan for every chapter. DEC-001 and all later chapter work read it.

## Scope

Write `docs/CURRICULUM.md`. Docs only: no site code.

Inputs:
- The course outline: `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/course-outline-e164-spr26.pdf`. It is git-ignored, so it is NOT in your worktree; use this absolute path. Read it with `pdftotext -layout`.
- The format model: `~/GitHub/options-explained/docs/CURRICULUM.md`.

Content:
- The reader starts from zero and ends at PhD level, as in `options-explained`.
- **Part I, Foundations** first: returns (simple, log, excess, compounding), expected return and risk, OLS regression and standard errors (including Newey–West), persistence and AR(1), mean–variance and the CAPM, the Euler equation and the stochastic discount factor. Add what Weeks 1–9 need; do not add more.
- Then the outline's Weeks 1–9 as parts. Split a week into two parts when it is too big. Week 10 becomes one last part of short "frontier" chapters.
- Each chapter: **Goals**, **Key math**, **Widgets** (named reusable components), **Data**, **Readings** (short form "Campbell & Shiller (1988)"), **Prereqs**. Give a difficulty dot (● / ●● / ●●●) per part.
- **Data** uses only these dataset IDs, or "simulated (seeded)": `ff3-monthly`, `ff5-monthly`, `mom-monthly`, `ff25-size-bm-monthly`, `shiller-monthly`, `goyal-welch-annual`, `goyal-welch-monthly`, `fred-treasury-monthly`, `gsw-zero-coupon`, `fred-consumption-quarterly`. TASK-004 builds exactly these. If a chapter needs other data, list it in a "Data wanted later" section at the end.
- End with a component table (as in `options-explained`) and a **Coverage table**: every "Concepts covered" item of the outline, mapped to its chapter number(s).
- Intro: one line saying the topic order follows the PhD course E164 "Financial Economics II: Empirical Finance" at London Business School. Do not name the lecturer.
- If `docs/READINGS.md` exists on `origin/main`, write Readings with its keys (for example `CampbellShiller1988`).
- Write in your own words. Do not copy sentences from the outline.

## Acceptance

- `docs/CURRICULUM.md` exists, with Part I Foundations first and one or more parts for each of Weeks 1–10.
- Every chapter has Goals, Key math, Widgets, Data, Readings and Prereqs.
- The coverage table lists every "Concepts covered" item of the outline with a chapter number; the outcome shows the count of items and the count mapped.
- Every Data entry is a listed dataset ID or "simulated (seeded)".
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0.

## Verify

```sh
grep -cE '^### [0-9]+\.' docs/CURRICULUM.md
grep -cE '^\- \*\*(Goals|Key math|Widgets|Data|Readings|Prereqs):\*\*' docs/CURRICULUM.md
grep -oE '`[a-z0-9-]+-(monthly|annual|quarterly|coupon)`' docs/CURRICULUM.md | sort -u
git ls-files | grep -ciE '\.pdf$|^source/'
```
