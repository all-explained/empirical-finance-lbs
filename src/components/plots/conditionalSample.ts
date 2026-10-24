import { useEffect, useState } from 'react';
import { loadSeries, type Series } from '../../lib/data/series';
import {
  conditionalModelFits, managedPortfolios, quarterlyPanel, simulateConditionalCapm, type ConditionalCapmOptions, type ConditionalModel,
} from '../../lib/finance/conditional';
import { arithmeticMean, sampleVariance } from '../../lib/finance/returns';
import { annualiseMean, meanStandardError } from '../../lib/stats/moments';

export type ConditionalData = {
  ff3: Series<'ff3-monthly'>;
  ff25: Series<'ff25-size-bm-monthly'>;
  cay: Series<'fred-cay-quarterly'>;
};

export const DEFAULT_SEED = 1;

/** The style guide's monthly default world: E[R^e_m] = 0.5%, σ(R^e_m) ≈ 4.5%, T = 600. z_t has sd 1, so
 * betaSlope and lambdaSlope are the moves of β_t and λ_t (monthly decimal) per standard deviation of the state. */
export const WORLD: ConditionalCapmOptions = {
  T: 600, beta0: 1, betaSlope: 0.4, lambda0: 0.005, lambdaSlope: 0.004,
  stateRho: 0.95, stateSd: 1, marketSd: 0.045, residualSd: 0.03,
};

export interface ConditionalWorld {
  z: number[];
  beta: number[];
  /** λ_t in % a year (×12). */
  lambda: number[];
  /** Annualised (×12): β̄λ̄, Cov(β_t, λ_t) and their sum, the mean of β_t λ_t. */
  product: number;
  covariance: number;
  meanProduct: number;
  meanBeta: number;
  /** Unconditional OLS on the market: annualised alpha, its classical se, t-statistic and beta. */
  alphaU: number;
  alphaUSE: number;
  alphaUT: number;
  betaU: number;
  /** Conditional alpha: the mean of R^e_i − β_t R^e_m, with its se, annualised. Zero in population. */
  alphaC: number;
  alphaCSE: number;
}

/** One seeded path of the conditional CAPM world with the chosen slopes, in annual units. */
export function conditionalWorld(seed: number, betaSlope: number, lambdaSlope: number): ConditionalWorld {
  const s = simulateConditionalCapm(seed, { ...WORLD, betaSlope, lambdaSlope });
  const pricingError = s.asset.map((r, t) => r - s.beta[t] * s.market[t]);
  const year = (v: number) => annualiseMean(v);
  return {
    z: s.z,
    beta: s.beta,
    lambda: s.lambda.map(year),
    product: year(s.decomposition.product),
    covariance: year(s.decomposition.covariance),
    meanProduct: year(s.decomposition.meanProduct),
    meanBeta: s.decomposition.meanBeta,
    alphaU: year(s.unconditional.alpha),
    alphaUSE: year(s.unconditional.alphaSE),
    alphaUT: s.unconditional.alpha / s.unconditional.alphaSE,
    betaU: s.unconditional.beta,
    alphaC: year(arithmeticMean(pricingError)),
    alphaCSE: year(meanStandardError(pricingError)),
  };
}

export const MODELS: { value: ConditionalModel; label: string }[] = [
  { value: 'capm', label: 'CAPM' },
  { value: 'ff3', label: 'FF3' },
  { value: 'ccapm', label: 'CCAPM' },
  { value: 'scaled-ccapm', label: 'Scaled CCAPM' },
];

/** Return quarters: Lettau–Ludvigson's window (JPE 2001, p. 1255), and the same start to the end of the data. */
export const WINDOWS = {
  ll: { start: '1963-07-01', end: '1998-07-01' },
  full: { start: '1963-07-01', end: undefined },
} as const;
export type Window = keyof typeof WINDOWS;

/** 1963-07-01 → 1963-Q3. */
export const quarterLabel = (date: string) => `${date.slice(0, 4)}-Q${(Number(date.slice(5, 7)) + 2) / 3}`;

export interface ScaledView {
  first: string;
  last: string;
  quarters: number;
  names: string[];
  /** Per model, annualised (×4) actual and fitted mean excess returns, pricing errors, their mean absolute
   * value and the zero-beta rate λ̂_0. */
  fits: Record<ConditionalModel, {
    actual: number[]; fitted: number[]; alpha: number[]; meanAbsAlpha: number; lambda0: number; r2: number; factorNames: string[];
  }>;
}

/** The four two-pass fits of conditionalModelFits on the quarterly 25 portfolios over one window, in % a year. */
export function scaledView(data: ConditionalData, window: Window): ScaledView {
  const panel = quarterlyPanel(data, WINDOWS[window]);
  const fits = conditionalModelFits(panel, MODELS.map((m) => m.value));
  const year = (v: number) => annualiseMean(v, 4);
  return {
    first: quarterLabel(panel.dates[0]),
    last: quarterLabel(panel.dates.at(-1)!),
    quarters: panel.dates.length,
    names: panel.names,
    fits: Object.fromEntries(MODELS.map(({ value }) => {
      const f = fits[value];
      const alpha = f.alpha.map(year);
      return [value, {
        actual: f.actual.map(year), fitted: f.fitted.map(year), alpha, meanAbsAlpha: arithmeticMean(alpha.map(Math.abs)),
        lambda0: year(f.lambda0!), r2: f.r2, factorNames: f.factorNames,
      }];
    })) as ScaledView['fits'],
  };
}

/** The CAPM two-pass fit on the 25 plain portfolios and the 25 managed ones R^e_{t+1} z_t, with z_t the lagged cay
 * standardised over the window: the cross-sectional R² on the 50 assets, and the CAPM betas of each group. */
export function managedCapm(data: ConditionalData, window: Window) {
  const panel = quarterlyPanel(data, WINDOWS[window]);
  const mean = arithmeticMean(panel.cay);
  const sd = Math.sqrt(sampleVariance(panel.cay));
  const excess = managedPortfolios(panel.excess, panel.cay.map((c) => (c - mean) / sd));
  const fit = conditionalModelFits({ ...panel, excess }, ['capm']).capm;
  const beta = fit.beta.map(([b]) => b);
  return {
    r2: fit.r2,
    plainBeta: beta.filter((_, i) => i % 2 === 0),
    managedBeta: beta.filter((_, i) => i % 2 === 1),
  };
}

/** Load ff3-monthly, ff25-size-bm-monthly and fred-cay-quarterly once. */
export function useConditionalData(): { data: ConditionalData | null; failed: boolean } {
  const [data, setData] = useState<ConditionalData | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    Promise.all([loadSeries('ff3-monthly'), loadSeries('ff25-size-bm-monthly'), loadSeries('fred-cay-quarterly')])
      .then(([ff3, ff25, cay]) => setData({ ff3, ff25, cay }), () => setFailed(true));
  }, []);
  return { data, failed };
}
