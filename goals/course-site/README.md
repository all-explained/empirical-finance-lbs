# Empirical Finance course site: scaffold and reference chapters

Goal `course-site` · format `goal/v2`. Live status is derived from GitHub and git and is
never written here: run `goal status course-site` or `goal tui`.

Build the site, curriculum, style guide and real-data pipeline for an interactive 3Blue1Brown-style course on empirical asset pricing (from zero to PhD level, following the LBS E164 topic list), and finish two polished reference chapters that later chapters copy.

## Context, scope and non-goals

Today the repo holds only a README. The model is `all-explained/options-explained` (local copy at
`~/GitHub/options-explained`): Astro + MDX + KaTeX + React/Mafs widgets + Vitest, deployed to GitHub Pages.

The course follows the topic list of the LBS PhD course E164 "Financial Economics II: Empirical Finance".
The outline PDF lives at `source/course-outline-e164-spr26.pdf` in the main checkout. `source/` is
git-ignored, so worker worktrees do not contain it: specs give absolute paths.

In scope: the site skeleton, `docs/CURRICULUM.md` (a Foundations part first, then the outline's weeks),
`docs/STYLE_GUIDE.md` with notation and colours, a reproducible pipeline for real public data, and two
polished reference chapters (M-2, planned once DEC-001 is accepted).

Non-goals: chapters beyond the two reference chapters (later goals, one per Part), problem sets,
exam material, and any LBS course material (slides, problem sets) other than the topic list.

## Risks and open questions

- **Copyright.** The outline PDF and the papers in `source/papers/` are private inputs. They are never
  committed. Chapters explain papers in our own words and cite them; they do not reproduce figures or tables.
- **Data downloads.** A source may block automated download or change its file layout. TASK-004 then
  blocks with the exact file the owner must download.
- **Licences of data.** Each dataset's terms go in `docs/DATA.md`. Redistributing small derived JSON is
  assumed to be fine for these public academic sources; TASK-004 flags any source where it is not.
- **Assumptions.** Site title "Empirical Finance, Explained". English. The lecturer is not named on the site.
- **Open question.** Paper PDFs: the owner supplies them per chapter (TASK-007). If this is too much work,
  a worker could try open versions (SSRN, NBER, authors' pages) first.

## Plan structure

<!-- goal:graph:start -->
```mermaid
flowchart TD
  subgraph M_1["M-1 · Site and plan"]
    DEC_001{{"DEC-001 Choose the two reference chapters"}}
    DEC_002{{"DEC-002 May delivery accept grep status 1 when the forbidden tracked-file count is zero?"}}
    TASK_001["TASK-001 Scaffold the site from the options-explained stack"]
    TASK_002["TASK-002 Write docs/CURRICULUM.md from the course outline"]
    TASK_003["TASK-003 Write the style guide, notation macros and colour tokens"]
    TASK_004["TASK-004 Build the public-data pipeline and typed loaders"]
    TASK_005["TASK-005 Sync src/data/curriculum.ts with the curriculum"]
    TASK_008["TASK-008 Download every outline paper into source/papers/ and commit docs/READINGS.md"]
  end
  subgraph M_2["M-2 · Reference chapters"]
    TASK_006["TASK-006 Plan: decompose M-2"]
    TASK_007["TASK-007 Put the reference chapters' papers in source/papers/"]
    TASK_009["TASK-009 Add the widget click-through script"]
    TASK_010["TASK-010 Library: return arithmetic"]
    TASK_011["TASK-011 Library: OLS with White and Newey–West standard errors"]
  end
  TASK_002 --> DEC_001
  TASK_001 --> TASK_003
  TASK_001 --> TASK_004
  TASK_001 --> TASK_005
  TASK_002 --> TASK_005
  TASK_003 --> TASK_006
  TASK_004 --> TASK_006
  TASK_005 --> TASK_006
  DEC_001 --> TASK_006
  TASK_008 --> TASK_006
  DEC_001 --> TASK_007
  DEC_002 --> TASK_008
  classDef draft stroke-dasharray: 4 3
  classDef cancelled opacity:0.45
  classDef decision fill:#f3e8ff,stroke:#7c3aed
  class TASK_007 cancelled
  class DEC_001 decision
  class DEC_002 decision
```
<!-- goal:graph:end -->

## Worker protocol

For an agent executing exactly one task of this goal:

1. Work only on your task, in your own branch and worktree, branched from `origin/main`.
2. Read `tasks/TASK-NNN.md` (the spec), the outcomes of the tasks it depends on, and the
   accepted decisions it depends on. Never edit specs, other tasks, decisions or `goal.yaml`.
3. After your first commit, open a draft PR into `main` whose body contains the line
   `Goal-Task: course-site/TASK-NNN`. Write the body with real newlines.
   Use `gh pr create --body-file FILE` or `gh pr edit --body-file FILE`.
   If the repo has several remotes, resolve `origin` with `git remote get-url origin`.
   For a GitHub origin, use `gh pr create --repo <origin OWNER/NAME> --body-file FILE`.
   Pass the same `--repo <origin OWNER/NAME>` to every other `gh pr` command.
4. Do the work and run the spec's Verify commands.
5. Write `tasks/TASK-NNN.outcome.md` with an `## Acceptance` checklist (each item followed by
   its evidence) and a `## Summary` (what, how, deviations, verified revision, proposed
   follow-ups). Commit it in the same PR.
6. Mark the PR ready for review when the spec's Verify commands pass.
   GitHub checks never gate delivery; local Verify decides. Never merge.
7. Blocked by a missing decision, access or data? Explain it in the outcome, add the line
   `Goal-Blocked: <reason>` to the draft PR body, and stop. For a material decision, also
   write `## Decision request` in the outcome with the question, options and trade-offs,
   and your recommendation under `### Recommendation` (omit it if you have none). Add
   `Goal-Decision: <one-line question>` to the draft PR body, commit and push, then stop
   through exit (B). Refresh or `goal sync` creates a decision in the Inbox. Under
   `decide: experts`, the committee gives opinions. A copilot or orchestrator shell records
   the final call with `goal decide`; the ledger names `experts` as the decider.
   The owner can accept or reject any open decision as the human. After acceptance,
   the Resume task action in `:` resumes the task with the decision in its resume note.
