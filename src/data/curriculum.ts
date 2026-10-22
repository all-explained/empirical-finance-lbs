/**
 * The full course outline (mirrors docs/CURRICULUM.md). Chapters that exist as
 * MDX files in src/content/chapters/ are linked; the rest show as "coming soon".
 */
export interface PartInfo {
  number: number;
  roman: string;
  title: string;
  difficulty: string;
  chapters: { number: number; title: string }[];
}

export const parts: PartInfo[] = [
  {
    number: 1, roman: 'I', title: 'Foundations', difficulty: '●–●●',
    chapters: [
      { number: 1, title: 'Returns' },
      { number: 2, title: 'Expected return and risk' },
      { number: 3, title: 'Regression and standard errors' },
      { number: 4, title: 'Autocorrelation and Newey–West' },
      { number: 5, title: 'Persistence: AR(1) and VAR' },
      { number: 6, title: 'Principal components' },
      { number: 7, title: 'Mean–variance and the CAPM' },
      { number: 8, title: 'The Euler equation and the stochastic discount factor' },
    ],
  },
  {
    number: 2, roman: 'II', title: 'Return predictability: the evidence', difficulty: '●●',
    chapters: [
      { number: 9, title: 'Time-varying expected returns' },
      { number: 10, title: 'The Campbell–Shiller decomposition' },
      { number: 11, title: 'Cash-flow and discount-rate news' },
      { number: 12, title: 'Stambaugh bias' },
    ],
  },
  {
    number: 3, roman: 'III', title: 'Return predictability: out of sample and beyond', difficulty: '●●–●●●',
    chapters: [
      { number: 13, title: 'Out-of-sample predictability' },
      { number: 14, title: 'The consumption–wealth ratio' },
      { number: 15, title: 'Expected returns from option prices' },
    ],
  },
  {
    number: 4, roman: 'IV', title: 'Cross-sectional tests', difficulty: '●●',
    chapters: [
      { number: 16, title: 'Time-series tests and the GRS statistic' },
      { number: 17, title: 'Cross-sectional regressions and Fama–MacBeth' },
      { number: 18, title: 'Errors in variables and the Shanken correction' },
    ],
  },
  {
    number: 5, roman: 'V', title: 'Factors, anomalies and conditional models', difficulty: '●●',
    chapters: [
      { number: 19, title: 'Size and value' },
      { number: 20, title: 'Momentum' },
      { number: 21, title: 'Anomalies and the factor zoo' },
      { number: 22, title: 'Conditional factor models' },
      { number: 23, title: 'Does the conditional CAPM explain anomalies?' },
    ],
  },
  {
    number: 6, roman: 'VI', title: 'GMM and tests of asset pricing models', difficulty: '●●●',
    chapters: [
      { number: 24, title: 'The generalized method of moments' },
      { number: 25, title: 'Efficient and feasible GMM' },
      { number: 26, title: 'GMM for asset pricing models' },
      { number: 27, title: 'Identification: weak and useless factors' },
    ],
  },
  {
    number: 7, roman: 'VII', title: 'The factor zoo and shrinkage', difficulty: '●●●',
    chapters: [
      { number: 28, title: 'A skeptical look at asset pricing tests' },
      { number: 29, title: 'Multiple testing' },
      { number: 30, title: 'Shrinking the cross-section' },
    ],
  },
  {
    number: 8, roman: 'VIII', title: 'Latent factors and large cross-sections', difficulty: '●●●',
    chapters: [
      { number: 31, title: 'Latent and observable factors' },
      { number: 32, title: 'Characteristics are covariances: IPCA' },
      { number: 33, title: 'Characteristic-based mimicking portfolios' },
      { number: 34, title: 'Risk premia with omitted factors' },
    ],
  },
  {
    number: 9, roman: 'IX', title: 'Consumption: data and the equity premium puzzle', difficulty: '●●',
    chapters: [
      { number: 35, title: 'The equity premium and risk-free rate puzzles' },
      { number: 36, title: 'Measuring consumption' },
    ],
  },
  {
    number: 10, roman: 'X', title: 'Habits, long-run risk and disasters', difficulty: '●●●',
    chapters: [
      { number: 37, title: 'Internal and external habits' },
      { number: 38, title: 'Long-run risk' },
      { number: 39, title: 'Rare disasters and jump risk' },
    ],
  },
  {
    number: 11, roman: 'XI', title: 'The term structure: facts', difficulty: '●●',
    chapters: [
      { number: 40, title: 'Yields, forwards and bond returns' },
      { number: 41, title: 'Testing the expectations hypothesis' },
      { number: 42, title: 'Level, slope, curvature and bond risk premia' },
    ],
  },
  {
    number: 12, roman: 'XII', title: 'Term structure models', difficulty: '●●●',
    chapters: [
      { number: 43, title: 'Affine term structure models' },
      { number: 44, title: 'Pricing the term structure with linear regressions' },
      { number: 45, title: 'Spanned and unspanned factors' },
      { number: 46, title: 'The convenience yield of Treasuries' },
    ],
  },
  {
    number: 13, roman: 'XIII', title: 'Horizons, entropy and the equity term structure', difficulty: '●●●',
    chapters: [
      { number: 47, title: 'Entropy bounds' },
      { number: 48, title: 'Horizon dependence' },
      { number: 49, title: 'Dividend strips and the equity term structure' },
    ],
  },
  {
    number: 14, roman: 'XIV', title: 'Learning', difficulty: '●●–●●●',
    chapters: [
      { number: 50, title: 'Bayes updating and priors' },
      { number: 51, title: 'Learning and portfolio choice' },
      { number: 52, title: 'Learning about consumption dynamics' },
      { number: 53, title: 'Learning in high dimensions' },
      { number: 54, title: 'Experience, expectations and overreaction' },
    ],
  },
  {
    number: 15, roman: 'XV', title: 'Asset management', difficulty: '●●',
    chapters: [
      { number: 55, title: 'Mutual funds in equilibrium' },
      { number: 56, title: 'Measuring skill' },
      { number: 57, title: 'Agency, benchmarking and indexing' },
    ],
  },
  {
    number: 16, roman: 'XVI', title: 'Intermediaries and frictions', difficulty: '●●●',
    chapters: [
      { number: 58, title: 'Intermediary asset pricing' },
      { number: 59, title: 'Slow-moving capital and liquidity spirals' },
      { number: 60, title: 'CIP violations and capital regulation' },
    ],
  },
  {
    number: 17, roman: 'XVII', title: 'Frontier topics', difficulty: '●●●',
    chapters: [
      { number: 61, title: 'Demand systems' },
      { number: 62, title: 'Subjective risk premia' },
      { number: 63, title: 'Belief overreaction and the stock market' },
      { number: 64, title: 'Asset embeddings' },
      { number: 65, title: 'Does peer review help predict returns?' },
      { number: 66, title: 'The zero-beta rate' },
    ],
  },
];

/** Join a path onto the site's base URL (GitHub Pages serves under /empirical-finance-lbs/). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return `${base}/${clean}`;
}
