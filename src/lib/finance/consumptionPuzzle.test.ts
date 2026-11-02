import { describe, expect, it } from 'vitest';
import { getColumn, loadSeries } from '../data/series';
import { normalRng } from '../math/rng';
import { quarterlyExcessReturns } from './cay';
import { quarterlyPanel } from './conditional';
import {
  annualConsumption, annualSample, crraHjPath, crraSdfMoments, impliedRiskAversion, impliedRiskFree,
  impliedTimeDiscount, puzzleMoments, quarterlySample, type ConsumptionSample, type PuzzleMoments,
} from './consumptionPuzzle';
import { crraSdf, hjBoundSharpe } from './sdf';
import { arithmeticMean, sampleVariance } from './returns';

const [consumptionSeries, goyalAnnual, goyalMonthly, cay, ff3, ff25] = await Promise.all([
  loadSeries('fred-consumption-annual'), loadSeries('goyal-welch-annual'), loadSeries('goyal-welch-monthly'),
  loadSeries('fred-cay-quarterly'), loadSeries('ff3-monthly'), loadSeries('ff25-size-bm-monthly'),
]);
const consumption = annualConsumption(consumptionSeries);

const expectRelative = (actual: number, expected: number, tolerance: number) =>
  expect(Math.abs(actual / expected - 1)).toBeLessThan(tolerance);

describe('annualConsumption', () => {
  it('matches a hand computation from the raw cells of 1929–1931', () => {
    // fred-consumption-annual rows 1929–1931: PCNDA, PCESVA, DNDGRG3A086NBEA, DSERRG3A086NBEA, B230RC0A052NBEA.
    const c = (nd: number, sv: number, pnd: number, psv: number, pop: number) =>
      Math.log(((nd / pnd + sv / psv) * 100 * 1e9) / (pop * 1e3));
    const c1929 = c(33.941, 33.613, 10.341, 6.068, 121878);
    const c1930 = c(30.503, 31.972, 9.805, 5.894, 123188);
    const c1931 = c(25.798, 28.963, 8.382, 5.479, 124149);
    expect(consumption.dates.slice(0, 2)).toEqual(['1930-01-01', '1931-01-01']);
    expect(consumption.c[0]).toBeCloseTo(c1930, 12);
    expect(consumption.c[0]).toBeCloseTo(8.843443456593556, 12); // ≈ $6,900 of 2017 dollars per person
    expect(consumption.dc[0]).toBeCloseTo(c1930 - c1929, 12);
    expect(consumption.dc[0]).toBeCloseTo(-0.04366072041829838, 12);
    expect(consumption.dc[1]).toBeCloseTo(c1931 - c1930, 12);
    expect(consumption.dates.at(-1)).toBe('2025-01-01');
    expect(consumption.c).toHaveLength(consumption.dates.length);
    expect(consumption.dc).toHaveLength(consumption.dates.length);
  });
});

describe('annualSample', () => {
  // goyal-welch-annual cells: 1929 CRSP_SPvw −0.0883478, infl 0.00584795; 1930 CRSP_SPvw −0.26302852,
  // Rfree 0.02431439, infl −0.06395349.
  const r1930 = Math.log1p(-0.26302852) - Math.log1p(-0.06395349);
  const rf1930 = Math.log1p(0.02431439) - Math.log1p(-0.06395349);

  it('pairs the return of year t with Δc_t by default, over 1930–2025', () => {
    const sample = annualSample(consumption, goyalAnnual);
    expect(sample.dates[0]).toBe('1930-01-01');
    expect(sample.dates.at(-1)).toBe('2025-01-01');
    expect(sample.dates).toHaveLength(96);
    expect(sample.dc[0]).toBe(consumption.dc[0]);
    expect(sample.r[0]).toBeCloseTo(r1930, 14);
    expect(sample.r[0]).toBeCloseTo(-0.2391159713954255, 14);
    expect(sample.rf[0]).toBeCloseTo(rf1930, 14);
    sample.re.forEach((re, t) => expect(re).toBeCloseTo(sample.r[t] - sample.rf[t], 14));
  });

  it("pairs the return of year t with Δc_{t+1} under 'next-year', over return years 1929–2024", () => {
    const sample = annualSample(consumption, goyalAnnual, { timing: 'next-year' });
    expect(sample.dates[0]).toBe('1929-01-01');
    expect(sample.dates.at(-1)).toBe('2024-01-01');
    expect(sample.dc).toEqual(consumption.dc);
    expect(sample.r[0]).toBeCloseTo(Math.log1p(-0.0883478) - Math.log1p(0.00584795), 14);
    expect(sample.r[1]).toBeCloseTo(r1930, 14);
    expect(sample.dc[1]).toBe(consumption.dc[1]); // the 1930 return goes with Δc of 1931
  });

  it('starts at the start year', () => {
    const sample = annualSample(consumption, goyalAnnual, { start: 1947 });
    expect(sample.dates[0]).toBe('1947-01-01');
    expect(sample.dates).toHaveLength(79);
  });
});

describe('quarterlySample', () => {
  const sample = quarterlySample(cay, goyalMonthly);

  it('runs from 1952-Q2 to 2025-Q4, the quarters both extracts cover', () => {
    expect(sample.dates[0]).toBe('1952-04-01');
    expect(sample.dates.at(-1)).toBe('2025-10-01');
    expect(sample.dates).toHaveLength(295);
  });

  it('has the Δc of quarterlyPanel on the shared quarters', () => {
    const panel = quarterlyPanel({ ff3, ff25, cay }, { start: '1952-01-01' });
    const dc = new Map(sample.dates.map((date, t) => [date, sample.dc[t]]));
    const shared = panel.dates.filter((date) => dc.has(date));
    expect(shared.length).toBeGreaterThan(280);
    shared.forEach((date) => expect(dc.get(date)).toBe(panel.dc[panel.dates.indexOf(date)]));
  });

  it('takes r^e from quarterlyExcessReturns and sums the monthly real risk-free rate', () => {
    const excess = quarterlyExcessReturns(goyalMonthly);
    expect(sample.re[0]).toBe(excess.r[excess.dates.indexOf('1952-04-01')]);
    // 1952-Q2 by hand from the monthly cells of April, May and June 1952.
    const months = goyalMonthly.rows.flatMap(([date], t) => (date >= '1952-04-01' && date <= '1952-06-01' ? [t] : []));
    const [rfree, infl] = [getColumn(goyalMonthly, 'Rfree'), getColumn(goyalMonthly, 'infl')];
    expect(months).toHaveLength(3);
    const rf = months.reduce((sum, t) => sum + Math.log1p(rfree[t]!) - Math.log1p(infl[t]!), 0);
    expect(sample.rf[0]).toBeCloseTo(rf, 14);
    sample.r.forEach((r, t) => expect(r).toBeCloseTo(sample.re[t] + sample.rf[t], 14));
  });
});

describe('puzzleMoments', () => {
  // Three quarters: Δc = 1%, 3%, 2%; r = −5%, 10%, 4%; r^f = 1%, 2%, 0%.
  const sample: ConsumptionSample = {
    dates: ['2000-01-01', '2000-04-01', '2000-07-01'],
    dc: [0.01, 0.03, 0.02], r: [-0.05, 0.1, 0.04], rf: [0.01, 0.02, 0], re: [-0.06, 0.08, 0.04],
  };
  const { observations, perPeriod, annual } = puzzleMoments(sample, 4);

  it('matches hand moments per quarter', () => {
    // Deviations: Δc −0.01, 0.01, 0; r −0.08, 0.07, 0.01; r^e −0.08, 0.06, 0.02. Divisor T − 1 = 2.
    expect(observations).toBe(3);
    expect(perPeriod.mean.dc).toBeCloseTo(0.02, 15);
    expect(perPeriod.mean.r).toBeCloseTo(0.03, 15);
    expect(perPeriod.mean.rf).toBeCloseTo(0.01, 15);
    expect(perPeriod.mean.re).toBeCloseTo(0.02, 15);
    expect(perPeriod.sd.dc).toBeCloseTo(0.01, 15);
    expect(perPeriod.sd.r).toBeCloseTo(Math.sqrt(0.0057), 15);
    expect(perPeriod.sigmaIC).toBeCloseTo(0.00075, 15);
    expect(perPeriod.correlation).toBeCloseTo(0.00075 / (0.01 * Math.sqrt(0.0057)), 12);
    expect(perPeriod.sharpe).toBeCloseTo(0.02 / Math.sqrt(0.0052), 12);
  });

  it('annualises means and σ_ic by 4 and standard deviations and the Sharpe ratio by 2', () => {
    expect(annual.mean.dc).toBeCloseTo(0.08, 15);
    expect(annual.sd.dc).toBeCloseTo(0.02, 15);
    expect(annual.sigmaIC).toBeCloseTo(0.003, 15);
    expect(annual.correlation).toBe(perPeriod.correlation);
    expect(annual.sharpe).toBeCloseTo(0.04 / Math.sqrt(0.0052), 12);
  });
});

describe('impliedRiskAversion', () => {
  it('recovers γ = 25 from lognormal moments built with it', () => {
    // σ_c = 2%, σ_i = 18%, correlation 0.9: σ_ic = 0.00324 and E[r − r^f] = γ σ_ic − ½ σ_i² = 0.0648.
    const sigmaIC = 0.9 * 0.18 * 0.02;
    const moments: PuzzleMoments = {
      mean: { dc: 0.02, r: 0.0748, rf: 0.01, re: 25 * sigmaIC - 0.18 ** 2 / 2 },
      sd: { dc: 0.02, r: 0.18, rf: 0, re: 0.18 }, sigmaIC, correlation: 0.9, sharpe: 0.5,
    };
    expect(impliedRiskAversion(moments).fromCovariance).toBeCloseTo(25, 12);
  });

  it('gives Campbell’s γ of about 40 from SR = 0.4 and σ_c = 0.01', () => {
    // Campbell (2014, working paper, pdf p. 10).
    const moments: PuzzleMoments = {
      mean: { dc: 0.02, r: 0.07, rf: 0.01, re: 0.06 }, sd: { dc: 0.01, r: 0.15, rf: 0, re: 0.15 },
      sigmaIC: 0.0003, correlation: 0.2, sharpe: 0.4,
    };
    expect(impliedRiskAversion(moments).fromSharpe).toBeCloseTo(40, 12);
  });
});

describe('impliedRiskFree and impliedTimeDiscount', () => {
  it('give r^f = −log 0.99 + 10 × 0.02 − ½ × 10² × 0.02² for δ = 0.99, γ = 10, μ_c = σ_c = 2%', () => {
    expect(impliedRiskFree(0.99, 10, 0.02, 0.02)).toBeCloseTo(0.19005033585350148, 15);
  });

  it('invert each other to 1e-12', () => {
    for (const gamma of [0, 2, 10, 50]) {
      for (const delta of [0.9, 0.99, 1.1]) {
        const riskFree = impliedRiskFree(delta, gamma, 0.018, 0.022);
        expect(Math.abs(impliedTimeDiscount(riskFree, gamma, 0.018, 0.022) - delta)).toBeLessThan(1e-12);
      }
      expect(Math.abs(impliedRiskFree(impliedTimeDiscount(0.01, gamma, 0.018, 0.022), gamma, 0.018, 0.022) - 0.01))
        .toBeLessThan(1e-12);
    }
  });
});

describe('crraSdfMoments', () => {
  const [delta, gamma, mean, sd] = [0.99, 10, 0.02, 0.02];
  const moments = crraSdfMoments(delta, gamma, mean, sd);

  it('has E[M] = δ e^{−γμ + ½γ²σ²} = e^{−r^f} and σ(M)/E[M] = √(e^{γ²σ²} − 1)', () => {
    expect(moments.mean).toBeCloseTo(0.99 * Math.exp(-0.18), 15);
    expect(moments.mean).toBeCloseTo(Math.exp(-impliedRiskFree(delta, gamma, mean, sd)), 15);
    expect(moments.ratio).toBeCloseTo(0.20201676710706026, 15);
    expect(moments.ratio).toBeCloseTo(hjBoundSharpe(moments.mean, moments.sd), 15);
  });

  it('matches crraSdf over 200,000 seeded normal draws of Δc', () => {
    const z = normalRng(127);
    const draws = Array.from({ length: 200_000 }, () => crraSdf(delta, gamma, Math.exp(mean + sd * z())));
    // Standard errors: σ(M)/E[M]/√N ≈ 0.045% for E[M], about 0.17% for σ(M). Tolerances are 0.2% and 1%.
    expectRelative(arithmeticMean(draws), moments.mean, 0.002);
    expectRelative(Math.sqrt(sampleVariance(draws)), moments.sd, 0.01);
  });
});

describe('crraHjPath', () => {
  it('starts at (δ, 0) and follows crraSdfMoments as γ rises', () => {
    const path = crraHjPath([0, 10, 40], 0.99, 0.02, 0.02);
    expect(path[0]).toEqual({ gamma: 0, mean: 0.99, sd: 0 });
    expect(path[1].mean).toBeCloseTo(0.8269175092971592, 15);
    path.forEach(({ gamma, mean, sd }) => {
      const moments = crraSdfMoments(0.99, gamma, 0.02, 0.02);
      expect(mean).toBe(moments.mean);
      expect(sd).toBe(moments.sd);
    });
    expect(path[2].sd).toBeGreaterThan(path[1].sd);
  });
});

describe('puzzle numbers on the committed data', () => {
  // Annual moments; each implied δ is the one that matches the mean real risk-free rate at that γ.
  const cases = [
    { name: 'annual 1930–2025', sample: annualSample(consumption, goyalAnnual), k: 1, T: 96,
      muC: 0.01832051622, sigmaC: 0.02168911094, correlation: 0.07194497302, equityPremium: 0.06277413676,
      fromCovariance: 270.9518836, fromSharpe: 14.99226615, deltaCovariance: 4.52335257e-6, deltaSharpe: 1.245325188 },
    { name: "annual 1929–2024, 'next-year'", sample: annualSample(consumption, goyalAnnual, { timing: 'next-year' }), k: 1, T: 96,
      muC: 0.01832051622, sigmaC: 0.02168911094, correlation: 0.5272799166, equityPremium: 0.06003976604,
      fromCovariance: 35.67037498, fromSharpe: 14.26747387, deltaCovariance: 1.421293879, deltaSharpe: 1.234727209 },
    { name: 'annual postwar 1947–2025', sample: annualSample(consumption, goyalAnnual, { start: 1947 }), k: 1, T: 79,
      muC: 0.01851533959, sigmaC: 0.01525250378, correlation: 0.03732218491, equityPremium: 0.07134930135,
      fromCovariance: 898.4921068, fromSharpe: 28.56733108, deltaCovariance: 2.761450139e-34, deltaSharpe: 1.536143607 },
    { name: 'quarterly 1952-Q2–2025-Q4', sample: quarterlySample(cay, goyalMonthly), k: 4, T: 295,
      muC: 0.01938959846, sigmaC: 0.01768599356, correlation: 0.04555294161, equityPremium: 0.06721825711,
      fromCovariance: 618.3195944, fromSharpe: 23.88327426, deltaCovariance: 1.722043232e-21, deltaSharpe: 1.444504385 },
  ];

  for (const c of cases) {
    it(c.name, () => {
      const { observations, annual } = puzzleMoments(c.sample, c.k);
      const gamma = impliedRiskAversion(annual);
      const delta = (g: number) => impliedTimeDiscount(annual.mean.rf, g, annual.mean.dc, annual.sd.dc);
      expect(observations).toBe(c.T);
      const pinned: [number, number][] = [
        [annual.mean.dc, c.muC], [annual.sd.dc, c.sigmaC], [annual.correlation, c.correlation],
        [annual.mean.re, c.equityPremium], [gamma.fromCovariance, c.fromCovariance], [gamma.fromSharpe, c.fromSharpe],
        [delta(gamma.fromCovariance), c.deltaCovariance], [delta(gamma.fromSharpe), c.deltaSharpe],
      ];
      // Ten significant digits, so a relative tolerance of 1e-8.
      pinned.forEach(([actual, expected]) => expectRelative(actual, expected, 1e-8));
    });
  }
});
