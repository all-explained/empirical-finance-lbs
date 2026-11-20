---
id: TASK-166
title: 'Chapter 46: The convenience yield of Treasuries'
milestone: M-14
state: approved
depends_on: [TASK-162]
delivery: pr
route: {platform: claude, model: opus, effort: high}
---

## Why


SC-7 and M-14. Investors accept a lower yield on Treasuries because they are safe and liquid. The chapter measures that convenience yield with the corporate–Treasury spread, shows that it falls when the government supplies more debt, reads that as a downward-sloping demand for safe assets, and closes Part XII. This chapter follows the pattern of the Part I to Part XI chapters.

## Scope


Write chapter 46 of `docs/CURRICULUM.md`, "The convenience yield of Treasuries", as `src/content/chapters/46-the-convenience-yield-of-treasuries.mdx`, with its widget. Read first: the chapter's entry in `docs/CURRICULUM.md`, all of `docs/STYLE_GUIDE.md` (with the "Bonds and the term structure" table of §3), `docs/DATA.md`, the finished chapters `src/content/chapters/03-regression-and-standard-errors.mdx`, `src/content/chapters/08-euler-equation-and-sdf.mdx` and `src/content/chapters/40-yields-forwards-and-bond-returns.mdx`, chapters 43–45 if they are merged, and the code named below: `src/lib/finance/convenience.ts` (from the library task this task depends on) and `src/components/plots/seriesSample.ts` (`useSeriesData`). Check each file name with `ls src/content/chapters/` before you link it.

Readings. Open `/Users/jesusvillotamiranda/GitHub/empirical-finance-lbs/source/papers/KrishnamurthyVissingJorgensen2012.pdf` (working paper of February 2008; cite the 2012 *Journal of Political Economy* article, as `docs/READINGS.md` records, and name working-paper pdf pages) and name the page for any number or fact you take from it; the library's doc comments list the pages of the model, Figure 1, Table I, Table IV, Table VII and the 72 basis points. Cite readings in the short form. Explain ideas in your own words; never copy text, figures or tables, and never copy from the LBS outline. State no fact or number as taken from a reading you have not opened. A number in the prose that comes from our data is read from library output, never from a paper.

Data. `goyal-welch-annual` (`AAA`, `BAA`, `lty`, `tbl`) and `fred-debt-gdp-annual`, with `fred-treasury-monthly` for the check of the long Treasury yield, loaded through one hook in `src/components/plots/convenienceSample.ts` built on `useSeriesData`; write no other loading code. Say in a caption that `lty`'s source changes in 2022, as `docs/DATA.md` states.

Chapter:
- Frontmatter: `part: 12`, `chapter: 46`, `difficulty: 3`, `prerequisites: [40]`, a one-sentence `summary`. Link chapters 3, 8 and 40, and chapters 43–45 where the prose leans on them if they are merged when you finish; otherwise name them by title and say so in the outcome. Every sentence about another chapter must be true of the merged site.
- The six sections in the template order with `section-tag` headings, 1,500–3,000 words of prose, 2–3 `Quiz` questions.
- Cover the Goals and the Key math of the chapter's curriculum entry, with no step skipped: the spread as default, risk premium and convenience; why supply moves only the convenience part; the regression on $\log(\text{Debt}/\text{GDP})$ with its controls and what its negative slope means as a semi-elasticity; the demand curve for safe assets and the equilibrium spread; and what the convenience yield implies for the "risk-free" rate the earlier chapters used. Put numbers on our data for both presets of `convenienceSample`, and set them next to Krishnamurthy & Vissing-Jorgensen's Table I and the 72 basis points, marked as theirs. Report honestly if the relation is weaker after 2005, and give the reasons the reading and `docs/DATA.md` support.
- "Recap & next up" closes Part XII: a three-line bridge that recaps what chapters 43–46 showed (each sentence true of the merged site) and one sentence that leads to Part XIII, naming chapter 47, "Entropy bounds", by title only.
- Every number in the prose is read from library output on the committed data, never typed from memory. Add `tests/chapter46-numbers.test.ts` that recomputes each one, as `tests/chapter40-numbers.test.ts` does, and list each number with its test in the outcome.

Widget (in `src/components/plots/`), computing only through `convenience.ts`:
- `ConvenienceDemand`: the demand curve for Treasuries (spread against debt to GDP), a vertical supply line set by a `Slider` for debt to GDP, a `Slider` that shifts safety demand, a `Segmented` between the log and exponential forms, the yearly data as points with the fitted curve (do not let colour be the only cue between data and model), and a readout of the equilibrium spread, the convenience yield and the change in the spread for one more point of debt to GDP.
It follows style guide §5: shared frames and controls, `client:visible`, colour by CSS variable, `aria-label`, keyboard use, 360px layout (break wide display math so it fits a 375px phone, and keep each readout line short enough not to wrap at 360px), `prefers-reduced-motion`. In `options={[...]}` strings, double every backslash. Use plain `<details>`, not `<Details>` (issue #83). If you animate with `useTweened`, guard against issue #120 as the power-utility view of `HJBound` does, until that issue is fixed.

Out of scope: other chapters (link back, do not edit them), edits to `docs/CURRICULUM.md` (report mismatches in the outcome), changes to shared code other than the `convenienceSample.ts` hook. A symbol the chapter needs that §3 lacks goes into the "Bonds and the term structure" table of `docs/STYLE_GUIDE.md` §3 in this PR, with the clash it avoids (rebase first and keep every row); where the curriculum's Key math and §3 disagree, follow §3 and report the mismatch. If a library defect blocks you, report it in the outcome and stop with `Goal-Blocked` rather than patch the library. Use the colour tokens in `src/styles/theme.css` and the macros in `src/lib/katexMacros.ts`.

Where jobs run: build, tests, screenshots and click-through run on the MacBook on committed files; nothing reads CRSP, option or tick data.

## Acceptance


- `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
- `npm run screenshots -- 46-the-convenience-yield-of-treasuries` passes in both themes at desktop and phone size, and you inspected the images.
- `npm run clickthrough -- 46-the-convenience-yield-of-treasuries` passes and reports every widget of the chapter.
- The six `section-tag` headings are in template order.
- No hex colour in the chapter or its widget.
- `ConvenienceDemand` and the prose numbers use the committed `goyal-welch-annual` and `fred-debt-gdp-annual` through `convenienceSample.ts`.
- "Recap & next up" holds the Part XII bridge and names chapter 47 by title only.
- The outcome holds a voice review (one line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1) and a table of every number in the prose with its test.
- The prose is 1,500–3,000 words (give the command).
- `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1 is accepted under DEC-002).

## Verify


npm ci
npm test
npm run build
npm run screenshots -- 46-the-convenience-yield-of-treasuries
npm run clickthrough -- 46-the-convenience-yield-of-treasuries
grep -n 'section-tag' src/content/chapters/46-the-convenience-yield-of-treasuries.mdx
git diff --name-only origin/main -- 'src/components/plots/*.tsx' src/content/chapters/46-the-convenience-yield-of-treasuries.mdx | xargs grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"
git ls-files | grep -ciE '\.pdf$|^source/'

The last command prints 0 and exits 1; that is accepted under DEC-002 when the printed count is exactly 0.
