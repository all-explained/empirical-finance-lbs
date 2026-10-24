// Conditional factor models: a seeded world where a conditional CAPM holds and the unconditional one
// fails, the decomposition E[β_t λ_t] = E[β_t]E[λ_t] + Cov(β_t, λ_t), scaled factors and managed
// portfolios, and the scaled consumption CAPM of Lettau and Ludvigson (2001, JPE 109, 1238–1287),
// "LL" below, on quarterly 25 size–B/M portfolios. Returns are decimals.
import { getColumn, type ColumnName, type Series } from '../data/series';
import { normalRng } from '../math/rng';
import { ols } from '../stats/ols';
import { cayInputs, fullSampleCay } from './cay';
import { crossSectionalRegression, type CrossSectionalRegression } from './crossSection';
import { sampleMeans } from './portfolio';
import { grossGrowth } from './returns';
import { timeSeriesRegressions } from './timeSeriesTests';

export interface BetaPremiumDecomposition {
  /** (1/T) Σ_t β_t λ_t. */
  meanProduct: number;
  meanBeta: number;
  meanLambda: number;
  /** β̄ λ̄. */
  product: number;
  /** (1/T) Σ_t (β_t - β̄)(λ_t - λ̄). meanProduct = product + covariance. */
  covariance: number;
}

/** The sample average of β_t λ_t split into β̄ λ̄ and the covariance, both with the divisor T, so the
 * identity holds exactly in sample (up to rounding). */
export function betaPremiumDecomposition(beta: readonly number[], lambda: readonly number[]): BetaPremiumDecomposition {
  if (beta.length !== lambda.length || beta.length === 0) throw new RangeError('betaPremiumDecomposition: needs equal, non-empty paths');
  const T = beta.length;
  const mean = (x: readonly number[]) => x.reduce((sum, value) => sum + value, 0) / T;
  const meanBeta = mean(beta);
  const meanLambda = mean(lambda);
  return {
    meanProduct: mean(beta.map((b, t) => b * lambda[t])),
    meanBeta,
    meanLambda,
    product: meanBeta * meanLambda,
    covariance: mean(beta.map((b, t) => (b - meanBeta) * (lambda[t] - meanLambda))),
  };
}

export interface ConditionalCapmOptions {
  T: number;
  beta0: number;
  /** b in β_t = β_0 + b z_t. */
  betaSlope: number;
  lambda0: number;
  /** l in λ_t = λ_0 + l z_t. */
  lambdaSlope: number;
  /** AR(1) persistence of z_t. */
  stateRho: number;
  /** Unconditional standard deviation of z_t; the shock sd is stateSd·√(1 - stateRho²). */
  stateSd: number;
  marketSd: number;
  residualSd: number;
}

export interface ConditionalCapmSimulation {
  /** Row t holds z_t, β_t and λ_t, known at t, and the returns from t to t + 1. */
  z: number[];
  beta: number[];
  lambda: number[];
  /** R^e_{m,t+1} = λ_t + marketSd·ε_{m,t+1}. */
  market: number[];
  /** R^e_{i,t+1} = β_t R^e_{m,t+1} + residualSd·ε_{i,t+1}, so E_t[R^e_{i,t+1}] = β_t λ_t. */
  asset: number[];
  /** OLS of asset on a constant and market over the whole sample, with the classical se of alpha. */
  unconditional: { alpha: number; alphaSE: number; beta: number };
  /** Of the true β_t and λ_t paths. */
  decomposition: BetaPremiumDecomposition;
}

/**
 * A conditional CAPM that holds exactly: the conditional alpha is zero every period. z_t is a stationary
 * Gaussian AR(1) started from its unconditional distribution. With z independent of the shocks, the
 * population unconditional regression gives β^u = β_0 + b l λ_0 σ_z² / Var(R^e_m) and
 * α^u = Cov(β_t, λ_t)·[1 - E[R^e_m]² / Var(R^e_m)], with Cov(β_t, λ_t) = b l σ_z², E[R^e_m] = λ_0 and
 * Var(R^e_m) = l²σ_z² + marketSd². So α^u = 0 when b = 0 or l = 0: beta timing needs both to move.
 */
export function simulateConditionalCapm(seed: number, options: ConditionalCapmOptions): ConditionalCapmSimulation {
  const { T, beta0, betaSlope, lambda0, lambdaSlope, stateRho, stateSd, marketSd, residualSd } = options;
  if (!(T >= 3 && Math.abs(stateRho) < 1 && stateSd >= 0 && marketSd > 0 && residualSd >= 0)) {
    throw new RangeError('simulateConditionalCapm: needs T ≥ 3, |stateRho| < 1, marketSd > 0 and non-negative sds');
  }
  const e = normalRng(seed);
  const shockSd = stateSd * Math.sqrt(1 - stateRho * stateRho);
  const paths = { z: [] as number[], beta: [] as number[], lambda: [] as number[], market: [] as number[], asset: [] as number[] };
  let z = stateSd * e();
  for (let t = 0; t < T; t++) {
    const beta = beta0 + betaSlope * z;
    const lambda = lambda0 + lambdaSlope * z;
    const market = lambda + marketSd * e();
    paths.z.push(z);
    paths.beta.push(beta);
    paths.lambda.push(lambda);
    paths.market.push(market);
    paths.asset.push(beta * market + residualSd * e());
    z = stateRho * z + shockSd * e();
  }
  const fit = ols(paths.asset, [paths.market]);
  return {
    ...paths,
    unconditional: { alpha: fit.coefficients[0], alphaSE: fit.standardErrors[0], beta: fit.coefficients[1] },
    decomposition: betaPremiumDecomposition(paths.beta, paths.lambda),
  };
}

/**
 * Scaled factors for M_{t+1} = (a_0 + a_1 z_t) + (b_0 + b_1 z_t)'f_{t+1} = a_0 + a_1 z_t + b_0'f_{t+1}
 * + b_1'(z_t f_{t+1}): a conditional linear model with coefficients linear in z_t is an unconditional
 * model with constant coefficients on the factors z_t, f_{t+1} and z_t f_{t+1} (LL, eq. 2, p. 1246).
 * Timing: row t of factors holds f_{t+1} and z[t] holds z_t, known one period earlier; pass z lagged.
 * Each row is [f_{t+1} (K), z_t, z_t f_{t+1} (K)].
 */
export function scaledFactors(factors: readonly (readonly number[])[], z: readonly number[]): number[][] {
  if (factors.length !== z.length) throw new RangeError('scaledFactors: one z per factor row');
  return factors.map((f, t) => [...f, z[t], ...f.map((value) => z[t] * value)]);
}

/**
 * Managed portfolios R^e_{t+1} ⊗ (1, z_t): row t is [R^e_1, z_t R^e_1, R^e_2, z_t R^e_2, …].
 * Why they are test assets: if E_t[M_{t+1} R^e_{t+1}] = 0 holds for every z_t known at t, multiply by z_t
 * and take unconditional expectations, E[M_{t+1} z_t R^e_{t+1}] = 0. So z_t R^e_{t+1}, the excess return
 * of holding z_t dollars of the asset financed at the risk-free rate, must be priced by the unconditional
 * model too. Timing as in scaledFactors: z[t] is z_t, dated one period before excess[t].
 */
export function managedPortfolios(excess: readonly (readonly number[])[], z: readonly number[]): number[][] {
  if (excess.length !== z.length) throw new RangeError('managedPortfolios: one z per return row');
  return excess.map((row, t) => row.flatMap((r) => [r, z[t] * r]));
}

export interface QuarterlyPanel {
  /** Return quarter t + 1, dated by its first month as in `fred-cay-quarterly`: 1963-07-01 is 1963-Q3. */
  dates: string[];
  names: ColumnName<'ff25-size-bm-monthly'>[];
  /** T × 25 quarterly excess returns: compounded portfolio return minus compounded RF. */
  excess: number[][];
  /** T × 3 [Mkt-RF, SMB, HML]. Mkt-RF: compounded (Mkt-RF + RF) minus compounded RF; SMB, HML: compounded. */
  factors: number[][];
  factorNames: ['Mkt-RF', 'SMB', 'HML'];
  /** Δc_{t+1} = c_{t+1} - c_t, from cayInputs: consumption growth over the return quarter. */
  dc: number[];
  /** cay_t from fullSampleCay, dated the quarter before the return (LL, p. 1261: "lagged cay"). */
  cay: number[];
}

const quarterOf = (date: string) => {
  const month = Number(date.slice(5, 7));
  return `${date.slice(0, 4)}-${String(month - ((month - 1) % 3)).padStart(2, '0')}-01`;
};

/**
 * Quarterly panel for the scaled CCAPM, following LL's timing (eq. 15, p. 1260–1261): returns and Δc_{t+1}
 * over quarter t + 1, and cay_t from the quarter before. LL use 1963-Q3 to 1998-Q3, 141 quarters (p. 1255).
 * cay comes from one dynamic OLS on the whole `fred-cay-quarterly` series, so its weights use data after
 * each date, as LL's full-sample cay does. Only quarters with all three French months are kept;
 * start and end bound the return quarter, inclusive.
 */
export function quarterlyPanel(
  { ff3, ff25, cay }: { ff3: Series<'ff3-monthly'>; ff25: Series<'ff25-size-bm-monthly'>; cay: Series<'fred-cay-quarterly'> },
  { start, end = '9999-12-31' }: { start: string; end?: string },
): QuarterlyPanel {
  if (ff3.rows.length !== ff25.rows.length || ff3.rows.some(([date], t) => date !== ff25.rows[t][0])) {
    throw new RangeError('quarterlyPanel: ff3 and ff25 dates do not line up');
  }
  const names = ff25.columns.slice(1).map((c) => c.name as ColumnName<'ff25-size-bm-monthly'>);
  const percent = (values: readonly (number | null)[]) => values.map((value) => (value as number) / 100);
  const rf = percent(getColumn(ff3, 'RF'));
  const market = percent(getColumn(ff3, 'Mkt-RF')).map((value, t) => value + rf[t]);
  const smb = percent(getColumn(ff3, 'SMB'));
  const hml = percent(getColumn(ff3, 'HML'));
  const portfolios = names.map((name) => percent(getColumn(ff25, name)));
  const months = new Map<string, number[]>();
  ff3.rows.forEach(([date], t) => months.set(quarterOf(date), [...(months.get(quarterOf(date)) ?? []), t]));

  const inputs = cayInputs(cay);
  const cayFit = fullSampleCay(inputs);
  const panel: QuarterlyPanel = {
    dates: [], names, excess: [], factors: [], factorNames: ['Mkt-RF', 'SMB', 'HML'], dc: [], cay: [],
  };
  inputs.dates.forEach((date, j) => {
    const quarter = months.get(date);
    if (j === 0 || date < start || date > end || quarter?.length !== 3) return;
    const compound = (r: readonly number[]) => grossGrowth(quarter.map((t) => r[t]));
    const riskFree = compound(rf);
    panel.dates.push(date);
    panel.excess.push(portfolios.map((r) => compound(r) - riskFree));
    panel.factors.push([compound(market) - riskFree, compound(smb) - 1, compound(hml) - 1]);
    panel.dc.push(inputs.c[j] - inputs.c[j - 1]);
    panel.cay.push(cayFit.cay[j - 1]);
  });
  return panel;
}

export type ConditionalModel = 'capm' | 'ff3' | 'ccapm' | 'scaled-ccapm';

export interface ConditionalModelFit extends CrossSectionalRegression {
  factorNames: string[];
  /** 25 × K first-pass betas. */
  beta: number[][];
  /** Sample mean excess returns R̄^e_i; fitted holds λ̂_0 + β̂_i'λ̂. */
  actual: number[];
}

function modelFactors(panel: QuarterlyPanel, model: ConditionalModel): { names: string[]; factors: number[][] } {
  switch (model) {
    case 'capm': return { names: ['Mkt-RF'], factors: panel.factors.map(([m]) => [m]) };
    case 'ff3': return { names: [...panel.factorNames], factors: panel.factors.map((row) => [...row]) };
    case 'ccapm': return { names: ['Δc'], factors: panel.dc.map((dc) => [dc]) };
    case 'scaled-ccapm': {
      // LL demean the scaling variable (p. 1255). This moves λ̂ on Δc only, not the fit.
      const mean = panel.cay.reduce((sum, value) => sum + value, 0) / panel.cay.length;
      return {
        names: ['Δc', 'cay', 'cay·Δc'],
        factors: scaledFactors(panel.dc.map((dc) => [dc]), panel.cay.map((value) => value - mean)),
      };
    }
  }
}

/**
 * Two-pass fits on the quarterly 25 portfolios, as in LL's tables 1 and 3: full-sample time-series betas
 * (timeSeriesRegressions), then an OLS cross-sectional regression of mean excess returns on the betas with
 * an intercept (the zero-beta rate, LL eq. 4, p. 1247). r2 is LL's cross-sectional R² (fn. 17, p. 1254).
 * LL's 1963-Q3–1998-Q3 R² values: CAPM 0.01, FF3 0.80 (table 1), CCAPM 0.16, scaled CCAPM 0.70 (table 3).
 * 'scaled-ccapm' uses the factors Δc_{t+1}, cay_t and cay_t Δc_{t+1}, with cay demeaned over the panel.
 */
export function conditionalModelFits<M extends ConditionalModel>(
  panel: QuarterlyPanel, models: readonly M[],
): Record<M, ConditionalModelFit> {
  const actual = sampleMeans(panel.excess);
  return Object.fromEntries(models.map((model) => {
    const { names, factors } = modelFactors(panel, model);
    const { beta } = timeSeriesRegressions(panel.excess, factors);
    const fit = crossSectionalRegression(beta, actual, { intercept: true, weighting: 'ols' });
    return [model, { ...fit, factorNames: names, beta, actual }];
  })) as Record<M, ConditionalModelFit>;
}
