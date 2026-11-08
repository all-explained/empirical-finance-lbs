/**
 * Epstein–Zin pricing and the long-run risks model (Chapter 38), solved by the approximate analytical method of
 * Bansal, Kiku & Yaron (2012, Critical Finance Review; working paper of November 2009, pdf pp. 6–9 and 23) and
 * Beeler & Campbell (2012, Critical Finance Review; working paper of March 2009, pdf pp. 6–9 and 30–33).
 * Every rate is a decimal log real rate per month, as in both papers' calibrations; annual figures are 12 times
 * the monthly ones. Symbols follow docs/STYLE_GUIDE.md §3 (Part X), with the papers' symbols in brackets.
 *
 * Model (BKY eq. (3), pdf p. 6; BC eq. (14), pdf p. 30), all four shocks i.i.d. N(0, 1) and mutually independent:
 *   Δc_{t+1} = μ_c + x_t + σ_t η_{t+1}
 *   x_{t+1} = φ_x x_t + φ_e σ_t e_{t+1}                               [ρ, φ_e]
 *   σ²_{t+1} = σ̄² + φ_σ (σ²_t − σ̄²) + σ_w w_{t+1}                   [ν, ν_1]
 *   Δd_{t+1} = μ_d + β_{d,x} x_t + β_{d,η} σ_t η_{t+1} + φ_d σ_t u_{t+1}   [φ, π or π_d, φ or φ_d]
 * The log SDF is m_{t+1} = θ_EZ log δ − (θ_EZ/ψ) Δc_{t+1} + (θ_EZ − 1) r_{c,t+1} (BKY eq. (5), pdf p. 7), with
 * r_{c,t+1} the log return on the claim to consumption, linearised as r_{c,t+1} = κ_c + ρ_c pc_{t+1} + Δc_{t+1} − pc_t
 * (BKY eq. (6), pdf p. 7). Each claim's log price ratio is affine in the two states, pc_t = A_0 + A_1 x_t + A_2 σ²_t
 * (BKY eq. (7), pdf p. 8) and pd_t = A_{0,m} + A_{1,m} x_t + A_{2,m} σ²_t (BKY eq. (12), pdf p. 23). The
 * Campbell–Shiller constants ρ, κ [κ_1, κ_0] of each claim come from its own mean log price ratio, which is the
 * fixed point of BKY eq. (8), pdf p. 8 (BC eq. (29), pdf p. 33).
 *
 * Solving. Given the constants, E_t[exp(m_{t+1} + r_{t+1})] = 1 (BKY eq. (4), pdf p. 7) holds for all x_t, σ²_t
 * when the constant, the x_t and the σ²_t terms of log E_t[·] = E_t[·] + ½ Var_t[·] vanish separately; that
 * gives the A's. Conditional on the states every shock is normal, so these formulas are exact for the
 * linearised returns; the only approximation is the linearisation itself.
 */
import { bisection } from '../math/rootFind';
import { normalRng } from '../math/rng';
import type { Series } from '../data/series';
import type { Consumption } from './consumptionPuzzle';
import { horizonSlopes, type PredictiveResult } from './predictive';
import { goyalWelchAnnualPresentValue, linearisationConstants } from './presentValue';

function requireFinite(...values: number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('Expected finite numbers');
}

/** Monthly parameters of the long-run risks model. The comments give each field's §3 symbol. */
export interface LongRunRiskParameters {
  /** δ, the monthly time-discount factor. */
  delta: number;
  /** γ, relative risk aversion. */
  gamma: number;
  /** ψ, the elasticity of intertemporal substitution. */
  psi: number;
  /** μ_c, mean log consumption growth per month. */
  muC: number;
  /** φ_x, monthly persistence of x_t. */
  phiX: number;
  /** φ_e: the shock to x_{t+1} has standard deviation φ_e σ_t. */
  varphiE: number;
  /** σ̄, the square root of the long-run mean of σ²_t. */
  sigmaBar: number;
  /** φ_σ, monthly persistence of σ²_t. */
  phiSigma: number;
  /** σ_w, the standard deviation of the shock to σ²_{t+1}. */
  sigmaW: number;
  /** μ_d, mean log dividend growth per month. */
  muD: number;
  /** β_{d,x}, the leverage of dividend growth on x_t. */
  betaDX: number;
  /** β_{d,η}, the loading of dividend growth on the consumption shock σ_t η_{t+1}. */
  betaDEta: number;
  /** φ_d: the dividend's own shock has standard deviation φ_d σ_t. */
  varphiD: number;
}

/** The BY calibration with γ = 10, the column of Beeler & Campbell's Table II (Table I, pdf p. 34).
 * Bansal & Yaron (2004) set β_{d,η} = 0 (BC, pdf p. 30) and consider γ of 7.5 and 10 (BC, pdf p. 9).
 */
export const byParameters: LongRunRiskParameters = {
  delta: 0.998, gamma: 10, psi: 1.5,
  muC: 0.0015, phiX: 0.979, varphiE: 0.044,
  sigmaBar: 0.0078, phiSigma: 0.987, sigmaW: 0.0000023,
  muD: 0.0015, betaDX: 3, betaDEta: 0, varphiD: 4.5,
};

/** The BKY calibration: Beeler & Campbell's Table I (pdf p. 34), identical to Bansal, Kiku & Yaron's Table I
 * (pdf p. 28), where π is β_{d,η}, ν is φ_σ and ϕ is φ_d.
 */
export const bkyParameters: LongRunRiskParameters = {
  delta: 0.9989, gamma: 10, psi: 1.5,
  muC: 0.0015, phiX: 0.975, varphiE: 0.038,
  sigmaBar: 0.0072, phiSigma: 0.999, sigmaW: 0.0000028,
  muD: 0.0015, betaDX: 2.5, betaDEta: 2.6, varphiD: 5.96,
};

/** θ_EZ = (1 − γ)/(1 − 1/ψ) of Epstein–Zin preferences (BKY eq. (1), pdf p. 6). It is 1 when γ = 1/ψ, the
 * power-utility case. ψ = 1 is refused: θ_EZ is then infinite, and the log-linear solution here divides by it.
 */
export function epsteinZinTheta(gamma: number, psi: number): number {
  requireFinite(gamma, psi);
  if (psi <= 0) throw new RangeError('ψ must be positive');
  if (psi === 1) throw new RangeError('ψ = 1 makes θ_EZ infinite; this solution needs ψ ≠ 1');
  return (1 - gamma) / (1 - 1 / psi);
}

/** One claim's solution: its log price ratio is A0 + A1 x_t + A2 σ²_t. */
export interface ClaimSolution {
  A0: number;
  A1: number;
  A2: number;
  /** The mean log price ratio, the fixed point of A0 + A2 σ̄² = mean (BKY eq. (8), pdf p. 8). */
  mean: number;
  /** Campbell–Shiller constants ρ, κ at the mean, from linearisationConstants. */
  rho: number;
  kappa: number;
  /** A0 + A2 σ̄² − mean at the solution. */
  residual: number;
}

/** A per-month rate and its annual value, 12 times larger. */
export interface Rate {
  monthly: number;
  annual: number;
}

/** Loadings on the shocks η, e and w. */
export interface ShockLoadings {
  eta: number;
  e: number;
  w: number;
}

export interface LongRunRiskSolution {
  theta: number;
  /** The claim to consumption, whose log price ratio is pc_t. */
  consumption: ClaimSolution;
  /** The claim to dividends, the market, whose log price ratio is pd_t. */
  market: ClaimSolution;
  /** λ_η, λ_e, λ_w: m_{t+1} − E_t m_{t+1} = −λ_η σ_t η_{t+1} − λ_e σ_t e_{t+1} − λ_w σ_w w_{t+1} (BKY eq. (11), pdf p. 9). */
  pricesOfRisk: ShockLoadings;
  /** β_{m,η}, β_{m,e}, β_{m,w}: r_{m,t+1} − E_t r_{m,t+1} = β_{m,η} σ_t η + φ_d σ_t u + β_{m,e} σ_t e + β_{m,w} σ_w w
   * (BKY Appendix, pdf p. 23). */
  marketBetas: ShockLoadings;
  /** r^f_t = b_0 + b_1 x_t + b_2 σ²_t: the coefficients [b_0, b_1, b_2]. */
  riskFreeLoadings: [number, number, number];
  /** r^f_t at x_t = 0 and σ²_t = σ̄². */
  riskFree: Rate;
  /** BKY eq. (10), pdf p. 9: E_t[r_{m,t+1} − r^f_t] + ½ Var_t(r_{m,t+1})
   * = β_{m,η} λ_η σ²_t + β_{m,e} λ_e σ²_t + β_{m,w} λ_w σ_w², at σ²_t = σ̄². BC's Table V reports this measure. */
  equityPremium: Rate;
  /** E_t[r_{m,t+1} − r^f_t] at σ²_t = σ̄²: equityPremium less ½ Var_t(r_{m,t+1}). */
  logEquityPremium: Rate;
}

function requireParameters(p: LongRunRiskParameters): void {
  requireFinite(...Object.values(p));
  if (!(p.delta > 0)) throw new RangeError('δ must be positive');
  if (Math.abs(p.phiX) >= 1 || Math.abs(p.phiSigma) >= 1) throw new RangeError('Persistence must lie in (−1, 1)');
  if (p.sigmaBar <= 0 || p.sigmaW < 0 || p.varphiE < 0 || p.varphiD < 0) {
    throw new RangeError('Volatilities must be nonnegative, and σ̄ positive');
  }
}

/** Solve the fixed point mean = A0(mean) + A2(mean) σ̄² by bisection, where coefficients(ρ, κ) gives the A's.
 * At very low means ρ → 0 and the gap is positive. When the gap is still positive at a mean of 20, the claim
 * has no finite price (BC's "NA" cases, Table V, pdf p. 40), so the function throws.
 */
function solveClaim(
  sigmaBar2: number, coefficients: (rho: number, kappa: number) => { A0: number; A1: number; A2: number },
): ClaimSolution {
  const gap = (mean: number) => {
    const { rho, kappa } = linearisationConstants(mean);
    const { A0, A2 } = coefficients(rho, kappa);
    return A0 + A2 * sigmaBar2 - mean;
  };
  const [low, high] = [-20, 20];
  if (!(gap(high) < 0)) throw new RangeError('The claim has no finite price at these parameters');
  // tol = 0 bisects down to adjacent floating-point numbers.
  const mean = bisection(gap, low, high, { tol: 0, maxIter: 200 });
  const { rho, kappa } = linearisationConstants(mean);
  return { ...coefficients(rho, kappa), mean, rho, kappa, residual: gap(mean) };
}

/** E_t[r_{t+1}] = c0 + c1 x_t + c2 σ²_t for a claim with log price ratio A0 + A1 x + A2 σ² and growth mean
 * g0 + g1 x_t: the conditional mean of κ + ρ(A0 + A1 x_{t+1} + A2 σ²_{t+1}) + growth − (A0 + A1 x_t + A2 σ²_t).
 */
function expectedReturn(
  p: LongRunRiskParameters, claim: { A0: number; A1: number; A2: number; rho: number; kappa: number },
  g0: number, g1: number,
): [number, number, number] {
  const { A0, A1, A2, rho, kappa } = claim;
  return [
    kappa + (rho - 1) * A0 + rho * A2 * (1 - p.phiSigma) * p.sigmaBar ** 2 + g0,
    rho * A1 * p.phiX - A1 + g1,
    rho * A2 * p.phiSigma - A2,
  ];
}

/**
 * The approximate analytical solution of the long-run risks model, for the consumption claim and the market.
 *
 * Consumption claim (BKY eq. (9), pdf p. 8). m_{t+1} + r_{c,t+1} = θ_EZ[log δ + (1 − 1/ψ)Δc_{t+1} + κ_c + ρ_c pc_{t+1} − pc_t],
 * so its mean plus θ_EZ/2 times its variance must vanish:
 *   A_1 = (1 − 1/ψ)/(1 − ρ_c φ_x),
 *   A_2 = (θ_EZ/2) [(1 − 1/ψ)² + (ρ_c A_1 φ_e)²] / (1 − ρ_c φ_σ),
 *   A_0 = [log δ + κ_c + (1 − 1/ψ) μ_c + ρ_c A_2 (1 − φ_σ) σ̄² + (θ_EZ/2)(ρ_c A_2 σ_w)²] / (1 − ρ_c).
 * Prices of risk (BKY eq. (11), pdf p. 9): λ_η = γ, λ_e = (1 − θ_EZ) ρ_c A_1 φ_e, λ_w = (1 − θ_EZ) ρ_c A_2.
 *
 * Risk-free rate (BC eqs. (27)–(28), pdf p. 33): r^f_t = −E_t m_{t+1} − ½ Var_t m_{t+1}, with
 * Var_t m_{t+1} = (λ_η² + λ_e²) σ²_t + λ_w² σ_w², so r^f_t is affine in x_t and σ²_t.
 *
 * Market (BKY eq. (12), pdf p. 23, derived here): E_t m + E_t r_m + ½ Var_t(m + r_m) = 0 for all states gives
 *   A_{1,m} = (β_{d,x} − 1/ψ)/(1 − ρ_m φ_x),
 *   A_{2,m} = [s_m + ½((β_{d,η} − λ_η)² + φ_d² + (ρ_m A_{1,m} φ_e − λ_e)²)] / (1 − ρ_m φ_σ),
 *   A_{0,m} = [m_0 + κ_m + ρ_m A_{2,m}(1 − φ_σ) σ̄² + μ_d + ½(ρ_m A_{2,m} − λ_w)² σ_w²] / (1 − ρ_m),
 * where E_t m_{t+1} = m_0 − x_t/ψ + s_m σ²_t. The market's betas are β_{m,η} = β_{d,η}, β_{m,e} = ρ_m A_{1,m} φ_e and
 * β_{m,w} = ρ_m A_{2,m}, and the equity premium is BKY eq. (10), pdf p. 9.
 * Each claim's ρ and κ are the Campbell–Shiller constants at its own mean log price ratio; the fixed point is
 * solved by bisection and its residual reported.
 */
export function solveLongRunRisk(params: LongRunRiskParameters): LongRunRiskSolution {
  requireParameters(params);
  const p = params;
  const theta = epsteinZinTheta(p.gamma, p.psi);
  const s2 = p.sigmaBar ** 2;
  const k = 1 - 1 / p.psi;

  const consumptionCoefficients = (rho: number, kappa: number) => {
    const A1 = k / (1 - rho * p.phiX);
    const A2 = (theta / 2) * (k ** 2 + (rho * A1 * p.varphiE) ** 2) / (1 - rho * p.phiSigma);
    const A0 = (Math.log(p.delta) + kappa + k * p.muC + rho * A2 * (1 - p.phiSigma) * s2
      + (theta / 2) * (rho * A2 * p.sigmaW) ** 2) / (1 - rho);
    return { A0, A1, A2 };
  };
  const consumption = solveClaim(s2, consumptionCoefficients);
  const lambda: ShockLoadings = {
    eta: p.gamma,
    e: (1 - theta) * consumption.rho * consumption.A1 * p.varphiE,
    w: (1 - theta) * consumption.rho * consumption.A2,
  };

  // E_t m = θ log δ − (θ/ψ)(μ_c + x_t) + (θ − 1) E_t r_c = m0 + mx x_t + ms σ²_t.
  const rc = expectedReturn(p, consumption, p.muC, 1);
  const m0 = theta * Math.log(p.delta) - (theta / p.psi) * p.muC + (theta - 1) * rc[0];
  const mx = -theta / p.psi + (theta - 1) * rc[1];
  const ms = (theta - 1) * rc[2];
  const riskFreeLoadings: [number, number, number] = [
    -m0 - 0.5 * (lambda.w * p.sigmaW) ** 2, -mx, -ms - 0.5 * (lambda.eta ** 2 + lambda.e ** 2),
  ];

  const marketCoefficients = (rho: number, kappa: number) => {
    const A1 = (p.betaDX + mx) / (1 - rho * p.phiX);
    const A2 = (ms + 0.5 * ((p.betaDEta - lambda.eta) ** 2 + p.varphiD ** 2 + (rho * A1 * p.varphiE - lambda.e) ** 2))
      / (1 - rho * p.phiSigma);
    const A0 = (m0 + kappa + rho * A2 * (1 - p.phiSigma) * s2 + p.muD
      + 0.5 * ((rho * A2 - lambda.w) * p.sigmaW) ** 2) / (1 - rho);
    return { A0, A1, A2 };
  };
  const market = solveClaim(s2, marketCoefficients);
  const beta: ShockLoadings = {
    eta: p.betaDEta, e: market.rho * market.A1 * p.varphiE, w: market.rho * market.A2,
  };

  const rate = (monthly: number): Rate => ({ monthly, annual: 12 * monthly });
  const premium = (beta.eta * lambda.eta + beta.e * lambda.e) * s2 + beta.w * lambda.w * p.sigmaW ** 2;
  const marketVariance = (beta.eta ** 2 + p.varphiD ** 2 + beta.e ** 2) * s2 + (beta.w * p.sigmaW) ** 2;
  return {
    theta, consumption, market, pricesOfRisk: lambda, marketBetas: beta, riskFreeLoadings,
    riskFree: rate(riskFreeLoadings[0] + riskFreeLoadings[2] * s2),
    equityPremium: rate(premium),
    logEquityPremium: rate(premium - marketVariance / 2),
  };
}

/** A monthly path. Entry t of x, variance, pc and pd is the state at the end of month t + 1; entry t of
 * dc, dd, r and m is earned during month t + 1; rf[t] is the rate for month t + 1, known at its start.
 */
export interface LongRunRiskPath {
  x: number[];
  /** σ²_t, kept positive (see simulateLongRunRisk). */
  variance: number[];
  dc: number[];
  dd: number[];
  /** Log price–consumption ratio pc_t of the consumption claim. */
  pc: number[];
  /** Log price–dividend ratio pd_t of the market, monthly price over monthly dividend. */
  pd: number[];
  /** Log market return r_{m,t+1} = κ_m + ρ_m pd_{t+1} + Δd_{t+1} − pd_t. */
  r: number[];
  rf: number[];
  /** Log SDF m_{t+1}. */
  m: number[];
}

export interface LongRunRiskSimulationOptions {
  /** Number of months; 1200 (100 years) by default. */
  months?: number;
  /** false switches the persistent part off: the model is solved with φ_e = 0, so x_t ≡ 0. The shocks are the
   * same draws, so η, w and u, and hence σ²_t, match the path with the persistent part. */
  persistent?: boolean;
}

/** Floor for σ²_t. Beeler & Campbell (pdf pp. 6 and 8), following Bansal & Yaron (2004), replace a negative
 * conditional variance with a small positive number; this is that number (σ_t = 10⁻⁶ per month). Bansal, Kiku
 * & Yaron (pdf p. 10) discard negative draws instead and find nearly identical results. The pricing formulas
 * assume normal shocks, so the floor bends E_t[M e^r] = 1 slightly in the months it binds.
 */
const VARIANCE_FLOOR = 1e-12;

/**
 * A seeded monthly path of the long-run risks model, started at x_0 = 0 and σ²_0 = σ̄². Each month draws
 * η, e, w and u, in that order, from normalRng(seed). Prices come from solveLongRunRisk(params); with
 * persistent: false, from solveLongRunRisk({ ...params, varphiE: 0 }).
 */
export function simulateLongRunRisk(
  seed: number, params: LongRunRiskParameters, options: LongRunRiskSimulationOptions = {},
): LongRunRiskPath {
  const { months = 1200, persistent = true } = options;
  if (!Number.isSafeInteger(months) || months < 1) throw new RangeError('months must be a positive integer');
  const p = persistent ? params : { ...params, varphiE: 0 };
  const { theta, consumption: c, market: mk, riskFreeLoadings: [b0, b1, b2] } = solveLongRunRisk(p);
  const normal = normalRng(seed);
  const path: LongRunRiskPath = { x: [], variance: [], dc: [], dd: [], pc: [], pd: [], r: [], rf: [], m: [] };
  let x = 0;
  let v = p.sigmaBar ** 2;
  let pc = c.A0 + c.A2 * v;
  let pd = mk.A0 + mk.A2 * v;
  for (let t = 0; t < months; t++) {
    const [eta, e, w, u] = [normal(), normal(), normal(), normal()];
    const sigma = Math.sqrt(v);
    const dc = p.muC + x + sigma * eta;
    const dd = p.muD + p.betaDX * x + p.betaDEta * sigma * eta + p.varphiD * sigma * u;
    path.rf.push(b0 + b1 * x + b2 * v);
    x = p.phiX * x + p.varphiE * sigma * e;
    v = Math.max(p.sigmaBar ** 2 + p.phiSigma * (v - p.sigmaBar ** 2) + p.sigmaW * w, VARIANCE_FLOOR);
    const pcNext = c.A0 + c.A1 * x + c.A2 * v;
    const pdNext = mk.A0 + mk.A1 * x + mk.A2 * v;
    const rc = c.kappa + c.rho * pcNext + dc - pc;
    path.r.push(mk.kappa + mk.rho * pdNext + dd - pd);
    path.m.push(theta * Math.log(p.delta) - (theta / p.psi) * dc + (theta - 1) * rc);
    path.x.push(x);
    path.variance.push(v);
    path.dc.push(dc);
    path.dd.push(dd);
    path.pc.push(pcNext);
    path.pd.push(pdNext);
    [pc, pd] = [pcNext, pdNext];
  }
  return path;
}

/** Annual series from a monthly path. Entry t is year t + 2 of the path: the first year has no growth. */
export interface AnnualLongRunRisk {
  /** log(C_year / C_previous year), each C the sum of the year's 12 monthly levels. */
  dc: number[];
  /** The same for dividends. */
  dd: number[];
  /** Sums of the year's 12 monthly log returns and risk-free rates. */
  r: number[];
  rf: number[];
  /** pd of the year's last month less log 12: the price over 12 times that month's dividend, an annual rate. */
  pd: number[];
}

/** log Σ_j exp(level_j) over one year's months, without overflow on long paths. */
function logSumExp(levels: readonly number[]): number {
  const top = Math.max(...levels);
  return top + Math.log(levels.reduce((sum, level) => sum + Math.exp(level - top), 0));
}

/**
 * Time-aggregate a monthly path to years as Beeler & Campbell do (Table II note, pdf p. 35; text, pdf pp. 8–9):
 * monthly consumption and dividend levels summed to yearly levels, then the growth rate, then logs; log returns
 * and risk-free rates summed within the year; the price–dividend ratio from the last month of the year, put in
 * annual units by subtracting log 12. A final partial year is dropped. Model output and annual data are then
 * compared alike. The log 12 is not stated in the paper: it is the rule that reproduces the mean, standard
 * deviation and AC1 of pd in Table II for both calibrations. Dividing December's price by the sum of the year's
 * 12 dividends instead, as the annual data divide the index by D12, adds the dividends' monthly noise: the
 * standard deviation of pd rises from 0.16 to 0.20 (BY) and the AC1 falls from 0.78 to 0.71.
 */
export function annualise(path: LongRunRiskPath): AnnualLongRunRisk {
  const years = Math.floor(path.dc.length / 12);
  if (years < 2) throw new RangeError('annualise needs at least 24 months');
  const levels = (growth: readonly number[]) => {
    let level = 0;
    return growth.slice(0, 12 * years).map((g) => (level += g));
  };
  const c = levels(path.dc);
  const d = levels(path.dd);
  const year = (series: readonly number[], y: number) => series.slice(12 * y, 12 * y + 12);
  const sum = (series: readonly number[], y: number) => year(series, y).reduce((total, value) => total + value, 0);
  const annual: AnnualLongRunRisk = { dc: [], dd: [], r: [], rf: [], pd: [] };
  let [cPrevious, dPrevious] = [logSumExp(year(c, 0)), logSumExp(year(d, 0))];
  for (let y = 1; y < years; y++) {
    const [cYear, dYear] = [logSumExp(year(c, y)), logSumExp(year(d, y))];
    const december = 12 * y + 11;
    annual.dc.push(cYear - cPrevious);
    annual.dd.push(dYear - dPrevious);
    annual.r.push(sum(path.r, y));
    annual.rf.push(sum(path.rf, y));
    annual.pd.push(path.pd[december] - Math.log(12));
    [cPrevious, dPrevious] = [cYear, dYear];
  }
  return annual;
}

/**
 * Exact variance ratio VR(k) = Var(Δc_{t+1} + … + Δc_{t+k}) / (k Var(Δc_t)) of monthly consumption growth
 * implied by the persistent part, at constant volatility σ_t = σ̄.
 *
 * Derivation. Δc_{t+1} − μ_c = x_t + σ̄ η_{t+1}, with x_t an AR(1) of persistence φ_x and shock sd φ_e σ̄, so
 * Var(x) = φ_e² σ̄²/(1 − φ_x²). η_{t+1} is independent of every x_s, hence Var(Δc) = Var(x) + σ̄² and
 * Cov(Δc_{t+1}, Δc_{t+1+j}) = Cov(x_t, x_{t+j}) = φ_x^j Var(x) for j ≥ 1. With s = Var(x)/σ̄² = φ_e²/(1 − φ_x²),
 * the autocorrelations are ρ_j = φ_x^j s/(1 + s), and VR(k) = 1 + 2 Σ_{j=1}^{k−1} (1 − j/k) ρ_j, where
 *   Σ_{j=1}^{k−1} (k − j) φ^j = φ/(1 − φ) [k − 1 − φ(1 − φ^{k−1})/(1 − φ)].
 * σ̄ cancels. Stochastic volatility leaves this unchanged: the shocks scale by σ_t but stay serially
 * uncorrelated and independent of x, and E[σ²_t] = σ̄², up to the floor on σ²_t.
 */
export function lrrVarianceRatio(params: LongRunRiskParameters, horizon: number): number {
  requireParameters(params);
  if (!Number.isSafeInteger(horizon) || horizon < 1) throw new RangeError('Horizon must be a positive integer');
  const { phiX: phi, varphiE } = params;
  const share = varphiE ** 2 / (1 - phi ** 2);
  if (phi === 0 || horizon === 1) return 1;
  const weighted = (phi / (1 - phi)) * (horizon - 1 - (phi * (1 - phi ** (horizon - 1))) / (1 - phi));
  return 1 + (2 / horizon) * weighted * share / (1 + share);
}

/** Slopes, t-statistics and R² of k-year consumption growth Δc_{t+1} + … + Δc_{t+k} on pd_t, by horizonSlopes
 * with an intercept, as in Beeler & Campbell's Table VI (pdf pp. 41–42). pd[t] and dc[t] must be equally spaced
 * years, with pd at the end of year t and dc earned during it, as annualConsumptionPredictors and annualise give.
 * The standard errors are horizonSlopes' Newey–West with k lags; Beeler & Campbell use 2(k − 1) lags.
 */
export function consumptionPredictability(
  dc: readonly number[], pd: readonly number[], horizons: readonly number[],
): (PredictiveResult & { k: number })[] {
  return horizonSlopes(dc, pd, horizons);
}

/** Annual Δc from annualConsumption and pd from goyalWelchAnnualPresentValue over their common years, which are
 * 1930–2025 on the committed data. Consumption of year t is dated at its end, so pd_t predicts Δc_{t+1}:
 * Beeler & Campbell's "end of period timing" (pdf pp. 14–15, Table VI, pdf pp. 41–42).
 */
export function annualConsumptionPredictors(
  consumption: Consumption, goyalWelch: Series<'goyal-welch-annual'>,
): { dates: string[]; dc: number[]; pd: number[] } {
  const { dates, pd } = goyalWelchAnnualPresentValue(goyalWelch);
  const ratio = new Map(dates.map((date, t) => [date, pd[t]]));
  const out = { dates: [] as string[], dc: [] as number[], pd: [] as number[] };
  consumption.dates.forEach((date, t) => {
    const value = ratio.get(date);
    if (value === undefined) return;
    out.dates.push(date);
    out.dc.push(consumption.dc[t]);
    out.pd.push(value);
  });
  return out;
}
