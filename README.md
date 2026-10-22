# Empirical Finance, Explained

An interactive, visual course on empirical asset pricing: return predictability, cross-sectional tests,
GMM, the factor zoo, consumption-based models, bonds, learning, and intermediaries. It starts from zero
and goes up to PhD level.

Work in progress. The plan lives in `goals/course-site/`.

1. Install dependencies: `npm ci`.
2. Start the site: `npm run dev`.
3. Run helper tests: `npm test`.
4. Check types and build: `npm run build`.
5. Check both themes at desktop and phone sizes: `npm run screenshots`.

The site uses Astro, MDX, KaTeX and React/Mafs widgets, adapted from
[options-explained](https://github.com/all-explained/options-explained).
It is configured for `https://all-explained.github.io/empirical-finance-lbs/`.
The curriculum is empty until the course-planning tasks fill it.

Public datasets are checked in under `src/data/series/`. See [docs/DATA.md](docs/DATA.md) for Python setup,
`npm run data`, source terms, units and coverage.

Code is [MIT licensed](LICENSE). Original course content is [CC BY 4.0](LICENSE-CONTENT.md).
Private source material stays in the ignored `source/` directory.
