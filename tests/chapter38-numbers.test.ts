/**
 * Every number in the prose of chapter 38, recomputed from fred-consumption-annual and goyal-welch-annual and
 * from the seeded simulations of the long-run risks model, through the library and the widget's sample helper.
 * If the data or the library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import consumption from '../src/data/series/fred-consumption-annual.json';
import goyalWelchAnnual from '../src/data/series/goyal-welch-annual.json';
import {
  annualise, consumptionPredictability, epsteinZinTheta, simulateLongRunRisk, solveLongRunRisk,
  type LongRunRiskParameters,
} from '../src/lib/finance/longRunRisk';
import { arithmeticMean, sampleVariance } from '../src/lib/finance/returns';
import { autocorrelations, varianceRatio } from '../src/lib/stats/autocorr';
import { halfLife } from '../src/lib/stats/var';
import {
  annualData, CALIBRATIONS, consumptionCentury, LONG_MONTHS, modelVarianceRatios, type LongRunRiskData,
} from '../src/components/plots/longRunRiskSample';

const data = annualData({
  'fred-consumption-annual': consumption, 'goyal-welch-annual': goyalWelchAnnual,
} as unknown as LongRunRiskData);
const { bky, by } = CALIBRATIONS;
const pct = (v: number, digits: number) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const VR10 = 9;

/** The share of Var(Δc) that x_t carries, s/(1 + s) with s = φ_e²/(1 − φ_x²) (as in lrrVarianceRatio). */
const signalShare = (p: LongRunRiskParameters) => {
  const s = p.varphiE ** 2 / (1 - p.phiX ** 2);
  return s / (1 + s);
};
const solve = (p: LongRunRiskParameters, change: Partial<LongRunRiskParameters> = {}) => solveLongRunRisk({ ...p, ...change });
/** The three terms of the premium, a year: β_{m,η}λ_η σ̄², β_{m,e}λ_e σ̄², β_{m,w}λ_w σ_w². */
const terms = (p: LongRunRiskParameters) => {
  const { marketBetas: b, pricesOfRisk: l } = solve(p);
  return [b.eta * l.eta * p.sigmaBar ** 2, b.e * l.e * p.sigmaBar ** 2, b.w * l.w * p.sigmaW ** 2].map((v) => 12 * v);
};
/** One-year R² of annual Δc on pd, from annualised model output or from the data. */
const r2 = (dc: readonly number[], pd: readonly number[]) => consumptionPredictability(dc, pd, [1])[0].r2;

/**
 * 1,000 seeded samples as long as our data: seeds 1 to 1,000, 97 years of months each, which annualise turns into
 * 96 years of growth. Each sample gives VR(10) of annual Δc and the one-year R² of Δc on pd.
 */
const SAMPLES = 1000;
const samples = (p: LongRunRiskParameters) => Array.from({ length: SAMPLES }, (_, i) => {
  const annual = annualise(simulateLongRunRisk(i + 1, p, { months: 12 * (data.dc.length + 1) }));
  expect(annual.dc.length).toBe(data.dc.length);
  return { vr: varianceRatio(annual.dc, 10), r2: r2(annual.dc, annual.pd) };
});
const share = (values: number[], below: number) => values.filter((v) => v <= below).length / values.length;

describe('chapter 38 prose numbers', () => {
  test('hook: the annual data and the faint signal', () => {
    expect([data.first, data.last, data.dc.length]).toEqual(['1930', '2025', 96]);
    expect([pct(arithmeticMean(data.dc), 2), pct(Math.sqrt(sampleVariance(data.dc)), 2)]).toEqual(['1.83', '2.17']);
    expect(fixed(autocorrelations(data.dc, 1)[1], 2)).toBe('0.36');
    expect(pct(signalShare(bky), 1)).toBe('2.8');
    expect(fixed(bky.phiX * signalShare(bky), 3)).toBe('0.028');
    expect(pct(solve(bky).equityPremium.annual, 2)).toBe('6.42');
    expect(pct(terms(bky)[1], 2)).toBe('2.05');
  });

  test('intuition: persistence, the seeded century and the variance ratios', () => {
    expect([bky.phiX, by.phiX]).toEqual([0.975, 0.979]);
    expect([fixed(halfLife(bky.phiX), 1), fixed(halfLife(by.phiX), 1)]).toEqual(['27.4', '32.7']);
    const century = consumptionCentury(bky, 1);
    const widest = Math.max(...century.withX.map((v, t) => Math.abs(v - century.withoutX[t])));
    expect(fixed(widest, 2)).toBe('0.29');
    expect(LONG_MONTHS / 12).toBe(10_000);
    expect(fixed(modelVarianceRatios(bky)[VR10], 2)).toBe('2.63');
    expect(fixed(data.ratios[VR10], 2)).toBe('1.61');
  });

  test('formalisation: θ_EZ, the solution and the prices of risk in BKY', () => {
    expect([bky.gamma, bky.psi, by.gamma, by.psi]).toEqual([10, 1.5, 10, 1.5]);
    const theta = epsteinZinTheta(10, 1.5);
    expect([fixed(theta, 6), fixed(theta - 1, 6)]).toEqual(['-27.000000', '-28.000000']);
    expect([bky.phiSigma, bky.betaDX, by.betaDX]).toEqual([0.999, 2.5, 3]);
    const s = solve(bky);
    expect([fixed(s.consumption.rho, 4), fixed(s.consumption.A1, 2)]).toEqual(['0.9987', '12.70']);
    expect(fixed(1 / bky.psi, 2)).toBe('0.67');
    expect(fixed(s.pricesOfRisk.eta, 6)).toBe('10.000000');
    expect(fixed(s.pricesOfRisk.e, 1)).toBe('13.5');
    expect(Math.round(s.pricesOfRisk.w / 1000) * 1000).toBe(-57_000);
    expect(bky.sigmaW).toBe(2.8e-6);
  });

  test('formalisation: the equity premium and the risk-free rate', () => {
    const s = solve(bky);
    expect([pct(s.equityPremium.annual, 2), pct(s.riskFree.annual, 2)]).toEqual(['6.42', '1.28']);
    const t = terms(bky);
    expect(t.reduce((a, b) => a + b, 0)).toBeCloseTo(s.equityPremium.annual, 12);
    expect(t.map((v) => pct(v, 2))).toEqual(['1.62', '2.05', '2.76']);
    expect(t.map((v) => pct(v / s.equityPremium.annual, 0))).toEqual(['25', '32', '43']);
    const b = solve(by);
    expect([pct(b.equityPremium.annual, 2), pct(b.riskFree.annual, 2)]).toEqual(['5.54', '2.58']);
    const power = solve(by, { psi: 1 / by.gamma });
    expect(epsteinZinTheta(by.gamma, 1 / by.gamma)).toBeCloseTo(1, 12);
    expect([pct(power.equityPremium.annual, 2), pct(power.riskFree.annual, 2)]).toEqual(['0.00', '16.75']);
  });

  test('can the data see it: variance ratios and the predictive regressions', () => {
    expect([fixed(modelVarianceRatios(bky)[VR10], 2), fixed(modelVarianceRatios(by)[VR10], 2)]).toEqual(['2.63', '3.26']);
    const [one, five] = consumptionPredictability(data.dc, data.pd, [1, 5]);
    expect([fixed(one.slope, 3), fixed(one.tStat, 2), fixed(one.r2, 3)]).toEqual(['0.006', '0.80', '0.018']);
    expect([fixed(five.slope, 3), fixed(five.tStat, 2), fixed(five.r2, 3)]).toEqual(['-0.025', '-1.61', '0.068']);
    const long = (p: LongRunRiskParameters) => {
      const annual = annualise(simulateLongRunRisk(1, p, { months: LONG_MONTHS }));
      return r2(annual.dc, annual.pd);
    };
    expect([fixed(long(by), 3), fixed(long(bky), 3)]).toEqual(['0.387', '0.043']);
    const theirYears = data.dates.findIndex((date) => date.startsWith('2006')) + 1;
    expect(data.dates[0].slice(0, 4)).toBe('1930');
    expect(fixed(r2(data.dc.slice(0, theirYears), data.pd.slice(0, theirYears)), 3)).toBe('0.072');
  });

  test('can the data see it: 1,000 seeded samples of 96 years', () => {
    const [mBky, mBy] = [samples(bky), samples(by)];
    expect(pct(share(mBky.map((s) => s.vr), data.ratios[VR10]), 1)).toBe('21.3');
    expect(pct(share(mBy.map((s) => s.vr), data.ratios[VR10]), 1)).toBe('8.3');
    const ours = r2(data.dc, data.pd);
    expect(share(mBy.map((s) => s.r2), ours)).toBe(0);
    expect(pct(share(mBky.map((s) => s.r2), ours), 1)).toBe('18.7');
    // The warning: a half-life of about two years.
    expect(fixed(halfLife(bky.phiX) / 12, 1)).toBe('2.3');
  });

  test('playground: the sliders and the seeds', () => {
    const premium = (change: Partial<LongRunRiskParameters>) => pct(solve(bky, change).equityPremium.annual, 2);
    expect([premium({ phiX: 0.95 }), premium({ phiX: 0.99 })]).toEqual(['2.88', '15.41']);
    const low = solve(bky, { psi: 0.9 });
    expect([fixed(low.consumption.A1, 2), pct(low.equityPremium.annual, 2), pct(low.riskFree.annual, 2)])
      .toEqual(['-4.28', '5.17', '3.00']);
    expect(fixed(consumptionCentury(bky, 3).ratios[VR10], 2)).toBe('1.52');
  });
});
