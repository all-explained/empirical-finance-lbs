import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import { chiSquareSurvival } from '../math/distributions';
import { minimize } from '../math/optimize';
import { mulberry32 } from '../math/rng';
import { annualConsumption, annualSample, crraSdfMoments, impliedRiskFree, type ConsumptionSample } from './consumptionPuzzle';
import {
  disasterPricing, empiricalLikelihoodWeights, entropyProfile, entropyWeights, eulerMoments,
  requiredDisasterProbability, simulateDisasterCentury, type DisasterParams,
} from './disasters';
import { arithmeticMean, sampleVariance } from './returns';

const [consumptionSeries, goyalAnnual] = await Promise.all([
  loadSeries('fred-consumption-annual'), loadSeries('goyal-welch-annual'),
]);
const sample = annualSample(annualConsumption(consumptionSeries), goyalAnnual);

/** The first years of a sample, up to and including the return year `end`. */
function through(s: ConsumptionSample, end: number): ConsumptionSample {
  const n = s.dates.filter((date) => Number(date.slice(0, 4)) <= end).length;
  return { dates: s.dates.slice(0, n), dc: s.dc.slice(0, n), r: s.r.slice(0, n), rf: s.rf.slice(0, n), re: s.re.slice(0, n) };
}

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
const moment = (weights: readonly number[], g: readonly number[]) => sum(weights.map((w, t) => w * g[t]));

// An illustrative calibration: γ = 4 and π_D = 1.7%, the "standard calibration" Julliard & Ghosh (2012, p. 16)
// attribute to the literature after Barro (2006); μ_c, σ_c and b_D are round numbers of our own.
const base: DisasterParams = { delta: 0.99, gamma: 4, mean: 0.02, sd: 0.02, probability: 0.017, size: 0.3 };

describe('disasterPricing', () => {
  it('is the lognormal model of impliedRiskFree and crraSdfMoments when π_D = 0', () => {
    const lognormal = { ...base, probability: 0, claim: { sd: 0.16, cov: 0.0008, loss: 0.4 } };
    const pricing = disasterPricing(lognormal);
    expect(pricing.riskFree).toBeCloseTo(impliedRiskFree(0.99, 4, 0.02, 0.02), 12);
    expect(pricing.sdfMean).toBeCloseTo(crraSdfMoments(0.99, 4, 0.02, 0.02).mean, 12);
    // E[r − r^f] + ½σ_i² = γ σ_ic = 4 × 0.0008.
    expect(pricing.premium.normal).toBeCloseTo(0.0032, 12);
    expect(pricing.premium.disaster).toBe(0);
    expect(pricing.premium.total).toBeCloseTo(0.0032, 12);
  });

  it('matches the hand-computed closed forms for the consumption claim', () => {
    // A_0 = 0.983 + 0.017 × 0.7^−4, A_i = 0.983 + 0.017 × 0.7^−3.
    const a0 = 0.983 + 0.017 / 0.7 ** 4;
    const ai = 0.983 + 0.017 / 0.7 ** 3;
    const pricing = disasterPricing(base);
    expect(pricing.riskFree).toBeCloseTo(-Math.log(0.99) + 0.08 - 0.0032 - Math.log(a0), 12);
    expect(pricing.riskFree).toBeCloseTo(0.03444402095321255, 12);
    expect(pricing.premium.normal).toBeCloseTo(0.0016, 12);
    expect(pricing.premium.disaster).toBeCloseTo(Math.log(1 - 0.017 * 0.3) + Math.log(a0 / ai), 12);
    expect(pricing.premium.disaster).toBeCloseTo(0.015249512335351809, 12);
    // First order in π_D: π_D b_D [(1 − b_D)^−γ − 1] = 0.017 × 0.3 × (0.7^−4 − 1) ≈ 0.0161.
    expect(Math.abs(pricing.premium.disaster - 0.017 * 0.3 * (0.7 ** -4 - 1))).toBeLessThan(0.001);
  });

  it('matches the means of 400,000 seeded years within four standard errors', () => {
    const years = 400_000;
    const draws = simulateDisasterCentury(7, base, years);
    const pricing = disasterPricing(base);
    const check = (values: number[], expected: number) => {
      const band = 4 * Math.sqrt(sampleVariance(values) / years);
      expect(Math.abs(arithmeticMean(values) - expected)).toBeLessThan(band);
    };
    const sdf = draws.dc.map((dc) => base.delta * Math.exp(-base.gamma * dc));
    check(sdf, pricing.sdfMean);
    check(draws.re.map(Math.exp), Math.exp(pricing.premium.total));
    check(sdf.map((m, t) => m * Math.exp(draws.r[t])), 1);
    check(draws.disaster.map(Number), base.probability);
  });

  it('rejects parameters outside the model', () => {
    expect(() => disasterPricing({ ...base, probability: 1 })).toThrow(RangeError);
    expect(() => disasterPricing({ ...base, size: 1 })).toThrow(RangeError);
    expect(() => disasterPricing({ ...base, claim: { sd: 0.1, cov: 0.01, loss: 0.3 } })).toThrow(RangeError);
  });
});

describe('requiredDisasterProbability', () => {
  it('inverts disasterPricing to 1e-10', () => {
    const target = disasterPricing(base).premium.total;
    expect(Math.abs(requiredDisasterProbability(target, base)! - 0.017)).toBeLessThan(1e-10);
    const stock = { ...base, claim: { sd: 0.16, cov: 0.0016, loss: 0.4 } };
    const premium = disasterPricing({ ...stock, probability: 0.04 }).premium.total;
    expect(Math.abs(requiredDisasterProbability(premium, stock)! - 0.04)).toBeLessThan(1e-10);
  });

  it('needs π_D = 7.92% for a 6% premium on the consumption claim at γ = 4 and b_D = 0.3', () => {
    expect(requiredDisasterProbability(0.06, base)).toBeCloseTo(0.07922815017091545, 10);
  });

  it('peaks at π* = 1/(1 + √((1 − b_D)^−γ(1 − b_D))) and returns null beyond the peak or below the normal part', () => {
    const peak = 1 / (1 + Math.sqrt(0.7 ** -3)); // ≈ 0.369
    const at = (probability: number) => disasterPricing({ ...base, probability }).premium.total;
    expect(at(peak)).toBeGreaterThan(at(peak - 0.01));
    expect(at(peak)).toBeGreaterThan(at(peak + 0.01));
    expect(requiredDisasterProbability(at(peak) + 1e-6, base)).toBeNull();
    expect(requiredDisasterProbability(0.001, base)).toBeNull();
    expect(requiredDisasterProbability(0.0016, base)).toBe(0);
  });
});

describe('simulateDisasterCentury', () => {
  it('draws disasters from mulberry32(seed) and reports their count and the sample premium', () => {
    const century = simulateDisasterCentury(42, base, 100);
    const uniform = mulberry32(42);
    const hits = Array.from({ length: 100 }, () => uniform() < 0.017);
    expect(century.disaster).toEqual(hits);
    expect(century.disasters).toBe(hits.filter(Boolean).length);
    expect(century.premium).toBeCloseTo(Math.log(arithmeticMean(century.re.map(Math.exp))), 14);
    century.rf.forEach((rf) => expect(rf).toBe(disasterPricing(base).riskFree));
    century.re.forEach((re, t) => expect(re).toBeCloseTo(century.r[t] - century.rf[t], 14));
    expect(simulateDisasterCentury(42, base, 100)).toEqual(century);
  });

  it('shows no disaster in about 0.983^100 ≈ 18% of 2,000 centuries, within four standard errors', () => {
    const empty = Array.from({ length: 2000 }, (_, seed) => simulateDisasterCentury(seed, base, 100).disasters === 0);
    const share = 0.983 ** 100;
    expect(Math.abs(empty.filter(Boolean).length / 2000 - share)).toBeLessThan(4 * Math.sqrt(share * (1 - share) / 2000));
  });
});

describe('eulerMoments', () => {
  it('is e^{−γ Δc_t}(e^{r_t} − e^{r^f_t}): the 1930 cell by hand', () => {
    // Cells as in consumptionPuzzle.test.ts: Δc_1930 = −0.04366072041829838; CRSP_SPvw −0.26302852,
    // Rfree 0.02431439 and infl −0.06395349 in 1930.
    const excess = (1 - 0.26302852) / (1 - 0.06395349) - (1 + 0.02431439) / (1 - 0.06395349);
    expect(eulerMoments(sample, 10)[0]).toBeCloseTo(Math.exp(10 * 0.04366072041829838) * excess, 12);
    expect(eulerMoments(sample, 10)[0]).toBeCloseTo(-0.4750279425177659, 12);
    expect(eulerMoments(sample, 0)).toHaveLength(96);
  });
});

describe('entropyWeights and empiricalLikelihoodWeights', () => {
  const solvers = [['entropyWeights', entropyWeights], ['empiricalLikelihoodWeights', empiricalLikelihoodWeights]] as const;
  const five = [0.3, -0.2, 0.1, -0.4, 0.5];

  it.each(solvers)('%s sums to 1 and prices g to 1e-12 on the annual data from γ = 0 to 100', (_, solve) => {
    for (const gamma of [0, 10, 28.5, 60, 100]) {
      const g = eulerMoments(sample, gamma);
      const { weights } = solve(g)!;
      expect(Math.abs(sum(weights) - 1)).toBeLessThan(1e-12);
      expect(Math.abs(moment(weights, g))).toBeLessThan(1e-12);
      weights.forEach((w) => expect(w).toBeGreaterThan(0));
    }
  });

  it.each(solvers)('%s gives equal weights when the mean of g is 0', (_, solve) => {
    const result = solve([1, -2, 3, -2])!;
    result.weights.forEach((w) => expect(w).toBeCloseTo(0.25, 12));
    expect(result.multiplier).toBeCloseTo(0, 12);
  });

  it.each(solvers)('%s returns null for one-signed g', (_, solve) => {
    expect(solve([0.1, 0.2, 0.3])).toBeNull();
    expect(solve([-0.1, 0, -0.3])).toBeNull();
  });

  // Brute force: π_1, π_2, π_3 are free and π_4, π_5 solve Σπ_t = 1 and Σπ_t g_t = 0; `minimize` searches the three.
  function bruteForce(objective: (weights: number[]) => number): number[] {
    const complete = ([a, b, c]: number[]) => {
      const rest = 1 - a - b - c;
      const priced = five[0] * a + five[1] * b + five[2] * c;
      const fifth = (-priced - five[3] * rest) / (five[4] - five[3]);
      return [a, b, c, rest - fifth, fifth];
    };
    const value = (x: number[]) => {
      const weights = complete(x);
      return weights.every((w) => w > 0) ? objective(weights) : Infinity;
    };
    return complete(minimize(value, [0.2, 0.2, 0.2], { tol: 1e-14, maxIter: 20000 }).x);
  }

  it('entropyWeights matches a brute-force minimum of Σπ_t log(5π_t) on five points', () => {
    const result = entropyWeights(five)!;
    const brute = bruteForce((weights) => sum(weights.map((w) => w * Math.log(5 * w))));
    result.weights.forEach((w, t) => expect(w).toBeCloseTo(brute[t], 6));
    expect(result.entropy).toBeCloseTo(sum(brute.map((w) => w * Math.log(5 * w))), 10);
    // π_t ∝ e^{ℓ g_t}: log(π_1/π_2) = ℓ (g_1 − g_2).
    expect(Math.log(result.weights[0] / result.weights[1])).toBeCloseTo(result.multiplier * 0.5, 12);
    expect(result.entropy).toBeCloseTo(0.01689043577008746, 12);
  });

  it('empiricalLikelihoodWeights matches a brute-force maximum of Σ log π_t on five points', () => {
    const result = empiricalLikelihoodWeights(five)!;
    const brute = bruteForce((weights) => -sum(weights.map(Math.log)));
    result.weights.forEach((w, t) => expect(w).toBeCloseTo(brute[t], 6));
    expect(result.logLikelihood).toBeCloseTo(sum(brute.map(Math.log)), 10);
    expect(result.statistic).toBeCloseTo(-2 * (result.logLikelihood + 5 * Math.log(5)), 12);
    expect(result.pValue).toBeCloseTo(chiSquareSurvival(result.statistic, 1), 14);
  });

  it('gives a statistic of 0 for an exact moment', () => {
    const result = empiricalLikelihoodWeights([0.5, -0.25, -0.25])!;
    expect(result.statistic).toBeCloseTo(0, 12);
    // The χ²(1) CDF rises like √x, so a statistic of 1e-16 from rounding leaves p within 1e-7 of 1.
    expect(result.pValue).toBeCloseTo(1, 6);
  });
});

describe('entropyProfile on the annual sample (returns 1930–2025, same-year timing)', () => {
  const gammas = Array.from({ length: 121 }, (_, i) => i * 0.5);
  const profile = entropyProfile(sample, gammas);

  it('finds both criteria minimised at γ ≈ 42.84, where the sample Euler equation holds', () => {
    // One moment and one parameter: both criteria are 0 where the mean of g_t(γ) is 0.
    expect(profile.best.entropy).toBeCloseTo(42.836, 3);
    expect(profile.best.statistic).toBeCloseTo(42.836, 3);
    expect(Math.abs(arithmeticMean(eulerMoments(sample, profile.best.entropy)))).toBeLessThan(1e-6);
  });

  it('pins the entropy, the statistic and the weights of 1930–1933 at γ = 10', () => {
    const point = profile.points.find(({ gamma }) => gamma === 10)!;
    expect(point.entropy).toBeCloseTo(0.054101082875937796, 12);
    expect(point.statistic).toBeCloseTo(8.631327001372028, 10);
    expect(point.pValue).toBeCloseTo(0.0033043078618827026, 10);
    // T π_t = 2.25, 3.12, 1.57 and 0.34: the tilt raises the weight of 1930–1932, when stocks fell with consumption,
    // and cuts that of 1933, when consumption fell but stocks rose.
    const expected = [2.251227745511051, 3.1155705303455985, 1.5749196046691465, 0.3366794110431144];
    point.weights.slice(0, 4).forEach((w, t) => expect(96 * w).toBeCloseTo(expected[t], 10));
  });

  it('adds up the weight of the four largest consumption falls: 1930, 1932, 1933 and 2020', () => {
    expect(profile.worstYears.map((t) => sample.dates[t].slice(0, 4))).toEqual(['1930', '1932', '1933', '2020']);
    const atZero = profile.points[0];
    expect(atZero.worstWeight).toBeCloseTo(sum(profile.worstYears.map((t) => atZero.weights[t])), 14);
    expect(profile.points).toHaveLength(gammas.length);
  });

  it('on returns 1930–2009, the years of Julliard & Ghosh Table 1, gives γ ≈ 35.7 and LR = 4.85 at γ = 10', () => {
    const early = through(sample, 2009);
    expect(early.dates).toHaveLength(80);
    expect(entropyProfile(early, gammas).best.statistic).toBeCloseTo(35.674, 3);
    const atTen = empiricalLikelihoodWeights(eulerMoments(early, 10))!;
    expect(atTen.statistic).toBeCloseTo(4.853350276204651, 10);
    expect(atTen.pValue).toBeCloseTo(0.027592488763044522, 10);
  });
});
