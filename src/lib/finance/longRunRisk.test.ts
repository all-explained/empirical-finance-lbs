import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import { autocorrelations, varianceRatio } from '../stats/autocorr';
import { annualConsumption, impliedRiskFree } from './consumptionPuzzle';
import {
  annualConsumptionPredictors, annualise, bkyParameters, byParameters, consumptionPredictability, epsteinZinTheta,
  lrrVarianceRatio, simulateLongRunRisk, solveLongRunRisk, type LongRunRiskParameters, type LongRunRiskPath,
} from './longRunRisk';
import { arithmeticMean, sampleVariance } from './returns';

const sd = (x: readonly number[]) => Math.sqrt(sampleVariance(x));
const ac1 = (x: readonly number[]) => autocorrelations(x, 1)[1];

// Beeler & Campbell's Table II (working paper, pdf p. 35), from one 1.2-million-month simulation. Means and
// standard deviations are annual percentages. E(re) is the mean log market return, not the excess return: their
// Table V (pdf pp. 39–40) adds back E(rf), with E(re − rf) + ½ var(re − rf) = 5.58 (BY) and 7.85 (BKY).
const tableII = {
  BY: { meanDc: 1.79, sdDc: 2.92, meanR: 6.62, meanRf: 2.56, meanPd: 3.0, sdPd: 0.16, ac1Pd: 0.77 },
  BKY: { meanDc: 1.82, sdDc: 2.96, meanR: 6.58, meanRf: 0.99, meanPd: 3.04, sdPd: 0.26, ac1Pd: 0.95 },
};
const calibrations = { BY: byParameters, BKY: bkyParameters };
// The same length as Beeler & Campbell's run, seeded; each path takes about a quarter of a second.
const paths = {
  BY: simulateLongRunRisk(1, byParameters, { months: 1_200_000 }),
  BKY: simulateLongRunRisk(1, bkyParameters, { months: 1_200_000 }),
};

describe('byParameters and bkyParameters', () => {
  it("are Beeler & Campbell's Table I (pdf p. 34), BKY also Bansal, Kiku & Yaron's Table I (pdf p. 28)", () => {
    expect(byParameters).toEqual({
      delta: 0.998, gamma: 10, psi: 1.5, muC: 0.0015, phiX: 0.979, varphiE: 0.044, sigmaBar: 0.0078,
      phiSigma: 0.987, sigmaW: 0.0000023, muD: 0.0015, betaDX: 3, betaDEta: 0, varphiD: 4.5,
    });
    expect(bkyParameters).toEqual({
      delta: 0.9989, gamma: 10, psi: 1.5, muC: 0.0015, phiX: 0.975, varphiE: 0.038, sigmaBar: 0.0072,
      phiSigma: 0.999, sigmaW: 0.0000028, muD: 0.0015, betaDX: 2.5, betaDEta: 2.6, varphiD: 5.96,
    });
  });
});

describe('epsteinZinTheta', () => {
  it('is 1 when γ = 1/ψ, and (1 − 10)/(1 − 1/1.5) = −27 at the calibrations', () => {
    expect(epsteinZinTheta(2, 0.5)).toBe(1);
    expect(epsteinZinTheta(10, 0.1)).toBeCloseTo(1, 14);
    expect(epsteinZinTheta(10, 1.5)).toBeCloseTo(-27, 12);
  });

  it('refuses ψ = 1, where θ_EZ is infinite', () => {
    expect(() => epsteinZinTheta(10, 1)).toThrow(RangeError);
    expect(() => epsteinZinTheta(10, 0)).toThrow(RangeError);
  });
});

describe('solveLongRunRisk', () => {
  it('reduces to power utility when γ = 1/ψ, with no persistent part and constant volatility', () => {
    const power: LongRunRiskParameters = { ...byParameters, gamma: 2, psi: 0.5, varphiE: 0, sigmaW: 0 };
    const solution = solveLongRunRisk(power);
    expect(solution.theta).toBe(1);
    expect(solution.pricesOfRisk.eta).toBe(2);
    expect(solution.pricesOfRisk.e).toBeCloseTo(0, 15);
    expect(solution.pricesOfRisk.w).toBeCloseTo(0, 15);
    // Consumption Chapter 35: r^f = −log δ + γ μ_c − ½ γ² σ_c², here with σ_c = σ̄.
    expect(Math.abs(solution.riskFree.monthly - impliedRiskFree(0.998, 2, 0.0015, 0.0078))).toBeLessThan(1e-10);
  });

  it('gives A_1 = (1 − 1/ψ)/(1 − ρ_c φ_x) and solves both fixed points to a residual below 1e-12', () => {
    for (const params of [byParameters, bkyParameters]) {
      const { consumption, market } = solveLongRunRisk(params);
      expect(consumption.A1).toBeCloseTo((1 - 1 / params.psi) / (1 - consumption.rho * params.phiX), 12);
      expect(market.A1 / ((params.betaDX - 1 / params.psi) / (1 - market.rho * params.phiX))).toBeCloseTo(1, 12);
      expect(Math.abs(consumption.residual)).toBeLessThan(1e-12);
      expect(Math.abs(market.residual)).toBeLessThan(1e-12);
      // The constants sit at each claim's own mean: ρ = e^mean/(1 + e^mean).
      expect(consumption.rho).toBeCloseTo(1 / (1 + Math.exp(-consumption.mean)), 15);
    }
  });

  it("matches the closed forms of the prices of risk, BKY eq. (11), pdf p. 9", () => {
    for (const p of [byParameters, bkyParameters]) {
      const { pricesOfRisk, consumption: { rho } } = solveLongRunRisk(p);
      const longRun = (rho * p.varphiE) / (1 - rho * p.phiX);
      expect(pricesOfRisk.eta).toBe(p.gamma);
      expect(pricesOfRisk.e).toBeCloseTo((p.gamma - 1 / p.psi) * longRun, 10);
      expect(pricesOfRisk.w / (-(p.gamma - 1) * (p.gamma - 1 / p.psi) * rho
        / (2 * (1 - rho * p.phiSigma)) * (1 + longRun ** 2))).toBeCloseTo(1, 12);
    }
  });

  it('pins the BY solution; the risk-free rate and premium agree with Beeler & Campbell\'s Table V', () => {
    const solution = solveLongRunRisk(byParameters);
    expect(solution.consumption.mean).toBeCloseTo(6.241755420738935, 10);
    expect(solution.consumption.A1).toBeCloseTo(14.554859389876833, 10);
    expect(solution.market.mean).toBeCloseTo(5.488397451350018, 10);
    expect(solution.pricesOfRisk.e).toBeCloseTo(17.896751891380582, 10);
    expect(solution.marketBetas.eta).toBe(byParameters.betaDEta);
    expect(solution.marketBetas.e).toBeCloseTo(solution.market.rho * solution.market.A1 * byParameters.varphiE, 14);
    expect(solution.riskFree.annual).toBeCloseTo(12 * solution.riskFree.monthly, 15);
    // Table V, panel A (pdf p. 39), γ = 10 and ψ = 1.5: E(rf) = 2.58 and E(re − rf) + ½ var(re − rf) = 5.58.
    // In BY the variance floor almost never binds, so the analytical values at σ̄² are close to the simulated ones.
    expect(Math.abs(100 * solution.riskFree.annual - 2.58)).toBeLessThan(0.01);
    expect(Math.abs(100 * solution.equityPremium.annual - 5.58)).toBeLessThan(0.05);
    // The Jensen term is ½ Var_t(r_m) at σ̄², from the market's loadings on the four shocks.
    const { eta, e, w } = solution.marketBetas;
    const variance = (eta ** 2 + byParameters.varphiD ** 2 + e ** 2) * byParameters.sigmaBar ** 2
      + (w * byParameters.sigmaW) ** 2;
    expect(solution.equityPremium.monthly - solution.logEquityPremium.monthly).toBeCloseTo(variance / 2, 15);
  });

  it('refuses a claim with no finite price (the NA cells of Table V, panel B, pdf p. 40)', () => {
    expect(() => solveLongRunRisk({ ...bkyParameters, psi: 0.5 })).toThrow(RangeError);
  });
});

describe('simulateLongRunRisk', () => {
  it('is seeded, keeps σ²_t positive, and has the documented lengths', () => {
    const first = simulateLongRunRisk(7, bkyParameters, { months: 600 });
    expect(simulateLongRunRisk(7, bkyParameters, { months: 600 })).toEqual(first);
    Object.values(first).forEach((series) => expect(series).toHaveLength(600));
    expect(paths.BKY.variance.every((v) => v > 0)).toBe(true);
    expect(simulateLongRunRisk(7, bkyParameters).dc).toHaveLength(1200);
  });

  it('switches the persistent part off with the same shocks', () => {
    const on = simulateLongRunRisk(3, byParameters, { months: 360 });
    const off = simulateLongRunRisk(3, byParameters, { months: 360, persistent: false });
    expect(off.x.every((x) => x === 0)).toBe(true);
    expect(off.variance).toEqual(on.variance);
    // Δc_{t+1} = μ_c + x_t + σ_t η_{t+1}: removing x_t leaves the same η shocks.
    off.dc.forEach((dc, t) => expect(dc).toBeCloseTo(on.dc[t] - (t === 0 ? 0 : on.x[t - 1]), 14));
  });

  it('prices the market and the risk-free asset: E[M e^r] = 1 on the long seeded paths', () => {
    // E_t[M e^r] = 1 exactly for the linearised returns; the sample mean of the martingale difference
    // M e^r − 1 has a standard error near 2e-4 here. BY misses by 2.4e-4 and 2.5e-4. In BKY the variance floor
    // binds in 1.1% of months, which tilts the mean up by about 1.1e-3, so its band is wider.
    const bands = { BY: 1e-3, BKY: 2e-3 };
    for (const name of ['BY', 'BKY'] as const) {
      const { m, r, rf } = paths[name];
      expect(Math.abs(arithmeticMean(m.map((mt, t) => Math.exp(mt + r[t]))) - 1)).toBeLessThan(bands[name]);
      expect(Math.abs(arithmeticMean(m.map((mt, t) => Math.exp(mt + rf[t]))) - 1)).toBeLessThan(bands[name]);
    }
  });
});

describe('annualise', () => {
  it('sums levels and returns within each year, by hand on a 30-month path', () => {
    const months = 30;
    const path: LongRunRiskPath = {
      x: Array(months).fill(0), variance: Array(months).fill(1e-4), pc: Array(months).fill(6),
      dc: Array(months).fill(0.01), dd: Array.from({ length: months }, (_, t) => (t === 12 ? Math.log(2) : 0)),
      pd: Array.from({ length: months }, (_, t) => 5 + t / 100), r: Array(months).fill(0.005),
      rf: Array(months).fill(0.001), m: Array(months).fill(0),
    };
    const annual = annualise(path);
    // Two full years, so one year of growth. Constant growth g per month gives annual growth 12g.
    expect(annual.dc).toHaveLength(1);
    expect(annual.dc[0]).toBeCloseTo(0.12, 14);
    // Dividends double in month 13 and stay there, so the second year's level is twice the first.
    expect(annual.dd[0]).toBeCloseTo(Math.log(2), 14);
    expect(annual.r[0]).toBeCloseTo(0.06, 14);
    expect(annual.rf[0]).toBeCloseTo(0.012, 14);
    expect(annual.pd[0]).toBeCloseTo(5.23 - Math.log(12), 14);
    expect(() => annualise({ ...path, dc: path.dc.slice(0, 20) })).toThrow(RangeError);
  });

  it("matches Beeler & Campbell's Table II (pdf p. 35) on both calibrations", () => {
    // Tolerances, in percentage points: E(Δc) 0.06 and σ(Δc) 0.1 (x_t makes the mean of 100,000 years uncertain
    // to about 0.02); E(r) and E(r − rf) 0.15 (standard error about 0.06); E(rf) 0.05; then 0.02 for E(pd),
    // 0.01 for σ(pd) and 0.02 for AC1(pd), in log units.
    for (const name of ['BY', 'BKY'] as const) {
      const annual = annualise(paths[name]);
      const target = tableII[name];
      const excess = annual.r.map((r, t) => r - annual.rf[t]);
      expect(annual.dc).toHaveLength(99_999);
      expect(Math.abs(100 * arithmeticMean(annual.dc) - target.meanDc)).toBeLessThan(0.06);
      expect(Math.abs(100 * sd(annual.dc) - target.sdDc)).toBeLessThan(0.1);
      expect(Math.abs(100 * arithmeticMean(annual.r) - target.meanR)).toBeLessThan(0.15);
      expect(Math.abs(100 * arithmeticMean(excess) - (target.meanR - target.meanRf))).toBeLessThan(0.15);
      expect(Math.abs(100 * arithmeticMean(annual.rf) - target.meanRf)).toBeLessThan(0.05);
      expect(Math.abs(arithmeticMean(annual.pd) - target.meanPd)).toBeLessThan(0.02);
      expect(Math.abs(sd(annual.pd) - target.sdPd)).toBeLessThan(0.01);
      expect(Math.abs(ac1(annual.pd) - target.ac1Pd)).toBeLessThan(0.02);
    }
  });
});

describe('lrrVarianceRatio', () => {
  it('equals 1 + 2 Σ (1 − j/k) ρ_j with ρ_j = φ_x^j s/(1 + s), summed directly', () => {
    const p = byParameters;
    const share = p.varphiE ** 2 / (1 - p.phiX ** 2);
    for (const k of [1, 2, 12, 120]) {
      let direct = 1;
      for (let j = 1; j < k; j++) direct += 2 * (1 - j / k) * p.phiX ** j * share / (1 + share);
      expect(lrrVarianceRatio(p, k)).toBeCloseTo(direct, 12);
    }
    expect(lrrVarianceRatio(p, 1)).toBe(1);
    expect(lrrVarianceRatio({ ...p, varphiE: 0 }, 120)).toBe(1);
    expect(lrrVarianceRatio(byParameters, 120)).toBeCloseTo(3.632237490251992, 10);
    expect(lrrVarianceRatio(bkyParameters, 120)).toBeCloseTo(2.512962908974152, 10);
    expect(() => lrrVarianceRatio(p, 0)).toThrow(RangeError);
  });

  it('matches varianceRatio of Δc on the long seeded paths within 2% at ten years', () => {
    // The sample ratio is biased down slightly: about 1% here, on three seeds alike.
    for (const name of ['BY', 'BKY'] as const) {
      const exact = lrrVarianceRatio(calibrations[name], 120);
      expect(Math.abs(varianceRatio(paths[name].dc, 120) / exact - 1)).toBeLessThan(0.02);
    }
  });
});

describe('consumptionPredictability', async () => {
  const [consumptionSeries, goyalAnnual] = await Promise.all([
    loadSeries('fred-consumption-annual'), loadSeries('goyal-welch-annual'),
  ]);
  const inputs = annualConsumptionPredictors(annualConsumption(consumptionSeries), goyalAnnual);

  it('builds Δc and pd over the common years 1930–2025', () => {
    expect(inputs.dates[0]).toBe('1930-01-01');
    expect(inputs.dates.at(-1)).toBe('2025-01-01');
    expect(inputs.dates).toHaveLength(96);
    expect(inputs.dc[0]).toBeCloseTo(-0.04366072041829838, 14);
    expect(inputs.pd[0]).toBeCloseTo(2.7506665032566295, 14);
  });

  it('pins the slopes, t-statistics and R² at 1, 3 and 5 years on the committed data', () => {
    const [one, three, five] = consumptionPredictability(inputs.dc, inputs.pd, [1, 3, 5]);
    expect(one).toMatchObject({ k: 1, nobs: 95 });
    expect(one.slope).toBeCloseTo(0.005552428247525951, 12);
    expect(one.tStat).toBeCloseTo(0.8037295776127681, 10);
    expect(one.r2).toBeCloseTo(0.01788923714373447, 12);
    expect(three.slope).toBeCloseTo(-0.005210601361944474, 12);
    expect(three.tStat).toBeCloseTo(-0.3719645732781413, 10);
    expect(three.r2).toBeCloseTo(0.004003601147271607, 12);
    expect(five.slope).toBeCloseTo(-0.02472331813096261, 12);
    expect(five.tStat).toBeCloseTo(-1.6125479104413063, 10);
    expect(five.r2).toBeCloseTo(0.06767314877278274, 12);
  });

  it("is close to Beeler & Campbell's Table VI over their 1930–2006 sample (pdf pp. 41–42)", () => {
    // End-of-period timing: b = 0.012, 0.010, −0.001 and R² = 0.068, 0.013, 0.000. The data vintages differ.
    const n = inputs.dates.indexOf('2006-01-01') + 1;
    const results = consumptionPredictability(inputs.dc.slice(0, n), inputs.pd.slice(0, n), [1, 3, 5]);
    [0.012, 0.01, -0.001].forEach((b, j) => expect(Math.abs(results[j].slope - b)).toBeLessThan(0.002));
    [0.068, 0.013, 0].forEach((r2, j) => expect(Math.abs(results[j].r2 - r2)).toBeLessThan(0.01));
  });
});
