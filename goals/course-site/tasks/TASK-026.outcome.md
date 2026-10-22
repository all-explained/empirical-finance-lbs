# TASK-026 outcome

## Acceptance

- [x] `npm test` and `npm run build` pass; `astro check` reports 0 errors, 0 warnings.
  `npm test`: 17 files, 220 tests passed, including `src/lib/stats/pca.test.ts` (11 tests) and
  `tests/chapter06-numbers.test.ts` (8 tests). `npm run build`: `Result (63 files): 0 errors, 0 warnings,
  0 hints`, then `[build] Complete!`.
- [x] `npm run screenshots -- 06-principal` passes in both themes at desktop and phone size, and I inspected
  the images. Output: four `✓` lines (`dark-desktop`, `dark-phone`, `light-desktop`, `light-phone`), no console
  errors, no KaTeX errors, no horizontal overflow. I read slices of the full-page images (the opening callout with its Chapter 2 link, Hook, Formalisation
  maths, Playground, quizzes) in both themes, and I captured the widget itself in every view (cloud, cloud
  rotated by 30°, scree, loadings, flipped loadings, yield-curve cloud/scree/loadings, 1963 loadings) in both
  themes at 1280px and 360px. An earlier 12px overflow at 360px (long preset labels in the `Select`) was fixed
  by shortening the labels.
- [x] `npm run clickthrough -- 06-principal` passes and reports every widget of the chapter. Output:
  `✓ chapters/06-principal-components/ · PRINCIPAL COMPONENTS: THE FEW DIRECTIONS THAT MATTER · 70 actions at
  1280px, 70 actions at 360px · select "Data"; segmented "Show" option "scree"; segmented "Show" option
  "loadings"; segmented "Show" option "cloud"; select "Across"; select "Up"; slider "Rotate axes 1 and 2 by ω";
  button "Flip the signs"`. The chapter has one widget, `PCAExplorer`.
- [x] The six `section-tag` headings are in template order (`grep -n 'section-tag'`): line 25 Hook, 41
  Intuition, 70 Formalisation, 211 Playground, 253 Check yourself, 279 Recap & next up.
- [x] No hex colour in the chapter or its widgets: the spec's `git diff --name-only origin/main -- … | xargs grep
  -nE '#[0-9a-fA-F]{3,8}\b' || echo "no hex colours"` prints `no hex colours`. Colours are `var(--c-data)`,
  `var(--c-factor)`, `var(--c-error)` and `var(--text-muted)`.
- [x] At least one widget uses real data, and every simulation is seeded. `PCAExplorer` loads
  `ff25-size-bm-monthly` and `gsw-zero-coupon` (the two datasets of the curriculum entry) through
  `loadSeries`, and its caption names the dataset ID and sample period. The chapter has no simulation, so there
  is no randomness to seed. The library test's random panels use `normalRng` from `src/lib/math/rng.ts`.
- [x] Voice review and numbers table: see `## Voice review` and `## Numbers in the prose` below.
- [x] The prose is 2,742 words, inside 1,500–3,000. Command (as in TASK-014: drops the frontmatter, imports and
  `$$` display blocks; counts callouts, details, try-this paragraphs and quizzes):
  `awk 'NR>8' src/content/chapters/06-principal-components.mdx | grep -v '^import ' | awk '/^\$\$/{m=!m; next} !m' | wc -w`
- [x] `git ls-files | grep -ciE '\.pdf$|^source/'` prints 0 (exit 1, accepted under DEC-002).

## Voice review

One line of the chapter for each rule of `docs/STYLE_GUIDE.md` §1:

| Rule | Line in the chapter |
| --- | --- |
| Picture first, then the formula | "Start with two portfolios, so that you can see the picture. Each dot below is one month." (the cloud widget comes before any equation) |
| Data before theory | "The average correlation between two of these portfolios is 0.84, and even the lowest is 0.63." |
| One idea per section | Each Formalisation subsection carries one idea: "The variance of a direction", "The best direction is $q_1$", "The first $K$ components lose the least", "Sign and rotation: what PCA does not pin down". |
| Start with a question the reader has | "If 25 series move almost as one, how many separate things are really moving?" |
| Write to "you", short sentences, explain terms | "A list like this is a **vector**." The opening callout links [Chapter 2](../02-expected-return-and-risk/) for variance and volatility, and recaps only the tools Chapter 2 does not cover: covariance, correlation and the covariance matrix. |
| Give the honest version | "A fact of linear algebra, which we use without proof, is that every covariance matrix can be written as …" and "We drop the hats to keep the formulas short." |
| Say what the evidence can and cannot show | "PCA describes the sample. It is not a model, and it reports no standard errors in this chapter." and "a component that explains much of the **variance** of returns need not explain their **average**." |
| Don't skip steps | The variance of a combination and the proof that no other $K$ directions beat the first $K$ components are written out in full in two `<details>` blocks; the rotation identity shows the cancelling cross terms. |
| Graduate rigour comes in gradually | Part I level: the optimality proof uses only "write $w$ as a mix of eigenvectors" and Pythagoras, no Lagrangian; the spectral theorem is stated, not proved, and the chapter says so. |
| Papers in our own words | No reading was opened (the books are not in `source/papers/`), so no fact is attributed to one. Campbell, Lo and MacKinlay (1997), Ch. 6 and Litterman and Scheinkman (1991) appear only under Further reading; Fama and French (1993) and Gürkaynak, Sack and Wright (2007) are the data citations from `docs/DATA.md`. |

## Numbers in the prose

Every number is recomputed by `tests/chapter06-numbers.test.ts` from the committed JSON through
`src/lib/stats/pca.ts` and `presetPanel` (the same function the widget uses).

| Number in the prose | Where | Test |
| --- | --- | --- |
| 25 portfolios, July 1926 to August 2026, 1,202 months | Hook | `hook: the 25 portfolios and the yield curve` |
| 25 variances and 300 covariances | Hook | same (`25 * 24 / 2`, and 300 correlations counted) |
| Average correlation 0.84, lowest 0.63 | Hook | same |
| One direction carries 83.8% | Hook, Formalisation, Playground, Recap | same; `formalisation: shares …` |
| 30 yields, December 1985 to September 2026 (478 months); three directions carry 98.9% | Hook, Recap | `hook: the 25 portfolios and the yield curve` |
| Correlation of the pair 0.67; axis 1 at 65°; 88.1% of the pair's variance | Intuition | `intuition: the cloud of largest growth against smallest value` |
| 69.0% at 30°; exactly 50% at 45° | Intuition, Formalisation | same |
| Shares 83.8%, 4.4%, 3.1%; together 91.2% | Formalisation | `formalisation: shares and what three components leave out` |
| Three components lose 8.8% (portfolios) and 1.1% (yields) | Formalisation | same |
| Component 1 loadings all positive, 0.13 to 0.28 | Playground | `playground: loadings of the 25 portfolios` |
| Component 2 highest for smallest growth (ME1-BM1), lowest for largest value (ME5-BM5); small positive, big negative | Playground | same |
| Component 3's two largest loadings on the two corner portfolios | Playground | same |
| Components 3 and 4 carry 3.1% and 2.6% | Playground (limits) | same |
| From July 1963: 83.2%, 6.3%, 3.5%; component 3 falls from growth to value in every size group | Playground | `playground: the sample from July 1963` |
| Yield shares 89.0%, 7.7%, 2.2% | Playground | `playground: level, slope and curvature of the yield curve` |
| Level loadings 0.12 to 0.20; slope from 0.38 to −0.15 with one sign change; curvature positive at both ends, negative in the middle, two sign changes | Playground | same |
| Rotation by 30°: component 1 from 83.8% to 63.9%, component 2 from 4.4% to 24.2%, sum 88.1% | Playground | `playground: rotating components 1 and 2 of the portfolios by 30°` |
| Quiz: eigenvalues 6, 3, 1 give 60% | Check yourself | `quiz: eigenvalues 6, 3 and 1` |

## Summary

What:
- `src/lib/stats/pca.ts`: `pca` (sample covariance, eigenvalues, loadings, shares, cumulative shares),
  `scores`, `reconstruct`, `reconstructionError`, `directionVariance`, `rotatePair`, `projectOnDirection`, and the
  data panels `ff25Returns` (percent to decimals) and `gswYieldChanges` (monthly changes of the 30 yields).
  It reuses `symmetricEigen` (TASK-019) and `sampleCovariance`/`sampleMeans` from `src/lib/finance/portfolio.ts`
  (TASK-020, merged while this task ran; I removed my own duplicate covariance function after rebasing).
- `src/lib/stats/pca.test.ts`: a hand example (eigenvalues 6 and 2/3, share 0.9, scores ±3/√2, error 2),
  and a seeded panel checking Σ = QLQ', orthonormal loadings, trace = Σℓ, uncorrelated scores with variance ℓ_k,
  error = (T − 1) Σ_{k>K} ℓ_k for every K, and that 200 random directions never beat q_1.
- `src/components/plots/PCAExplorer.tsx` with `pcaSample.ts`: three views (cloud with principal axes and the
  distances to axis 1; scree plot with running total; loadings of components 1–3), presets for the 25 portfolios
  from 1926 and from 1963 and for yield changes, a rotation slider ω (−90° to 90°) and a sign flip. The cloud uses
  the same pixel scale on both axes, so right angles look right. The flip is tweened with `useTweened`, which
  respects `prefers-reduced-motion`. The slider works with the arrow keys; all controls are the shared ones.
- `src/content/chapters/06-principal-components.mdx` and `tests/chapter06-numbers.test.ts`.

Deviations and mismatches to report (no edits to `docs/`):
- Notation. The curriculum's Key math writes $\lambda_k$ and $x_t$. The style guide reserves $\lambda_k$ for
  risk premia (it lists $\ell_k$ for eigenvalues) and $x_t$ for a predictor. The chapter uses $\ell_k$ and $z_t$,
  and says why for $\ell$. Symbols not in the style-guide tables: $z_t$ (vector of series), $q_k$, $Q$,
  $L = \operatorname{diag}(\ell_1, \dots, \ell_N)$, the rotation angle $\omega$, and the proof-only $c_k$, $h_j$, $e_t$, $w$
  (a direction). Scores use the table's factor symbol $f_{k,t}$ with `\Factor`. Suggest adding $z_t$, $q_k$,
  $Q$, $L$ and $\omega$ to the notation table.
- The curriculum says "two or three dimensions" for the cloud; the spec says two, and the widget is
  two-dimensional.
- The spec says "Both follow style guide §5", but names one widget; the chapter has one widget.
- The click-through script walks controls by index. When a view switch removes controls, later controls are
  skipped. I ordered the "Show" options (scree, loadings, cloud) so that every control is driven; a script that
  re-finds controls by label would remove this constraint.

Verified revision: the review fix (opening callout links Chapter 2), rebased on `origin/main` at `e422810`; the full Verify sequence ran on it. The built link `../02-expected-return-and-risk/` resolves to `dist/chapters/02-expected-return-and-risk/index.html`.

Proposed follow-ups: add the symbols above to `docs/STYLE_GUIDE.md` §3; make `clickthrough.mjs` robust to
controls that appear and disappear with a view switch.
