import { describe, expect, it } from 'vitest';
import { normalExpectation } from '../math/quadrature';
import { normalRng } from '../math/rng';
import { impliedRiskFree } from './consumptionPuzzle';
import {
  campbellCochraneParameters as cc, habitClaimReturns, habitLogSdf, habitMarginalUtility, habitRiskFree,
  localCurvature, maxSurplus, priceConsumptionRatio, sensitivity, simulateHabit, steadyStateSurplus,
  type HabitParams,
} from './habit';
import { horizonSlopes } from './predictive';
import { arithmeticMean, sampleVariance } from './returns';

const sBar = Math.log(steadyStateSurplus(cc));
const solution = priceConsumptionRatio(cc);
// 5000 simulated years, summed to annual data as in Table 2 (p. 20) and Table 5 (p. 23).
const annual = habitClaimReturns(simulateHabit(1, cc, { periods: 12 * 5000 }), solution, { annual: true });

describe('campbellCochraneParameters', () => {
  it('turns the annual values of Table 1 (p. 13) into monthly ones', () => {
    expect(cc.mean).toBeCloseTo(0.0189 / 12, 15);
    expect(cc.sd).toBeCloseTo(0.015 / Math.sqrt(12), 15);
    expect(cc.phi ** 12).toBeCloseTo(0.87, 14);
    expect(cc.gamma).toBe(2);
  });

  it('implies δ^12 = 0.896 from eq. (12), which Table 1 rounds to 0.89', () => {
    // −log δ = r^f − γ μ_c + γ(1 − φ)/2 = 0.0094/12 − 2 · 0.001575 + (1 − 0.87^{1/12}) = 0.0091710 per month.
    expect(-Math.log(cc.delta)).toBeCloseTo(0.0094 / 12 - 2 * 0.001575 + (1 - 0.87 ** (1 / 12)), 15);
    expect(cc.delta ** 12).toBeCloseTo(0.8958, 4);
    expect(Math.abs(cc.delta ** 12 - 0.89)).toBeLessThan(0.01);
  });
});

describe('steadyStateSurplus and maxSurplus', () => {
  it('match a hand computation and the S̄ = 0.057 and S_max = 0.094 of Table 1 (p. 13)', () => {
    const surplus = (0.015 / Math.sqrt(12)) * Math.sqrt(2 / (1 - 0.87 ** (1 / 12)));
    expect(steadyStateSurplus(cc)).toBeCloseTo(surplus, 15);
    expect(maxSurplus(cc)).toBeCloseTo(Math.log(surplus) + (1 - surplus ** 2) / 2, 15);
    expect(steadyStateSurplus(cc)).toBeCloseTo(0.057, 3);
    expect(Math.exp(maxSurplus(cc))).toBeCloseTo(0.094, 3);
  });

  it('rejects parameters that leave no room below S = 1', () => {
    expect(() => steadyStateSurplus({ ...cc, sd: 0.5 })).toThrow(RangeError);
    expect(() => steadyStateSurplus({ ...cc, phi: 1 })).toThrow(RangeError);
  });
});

describe('sensitivity', () => {
  it('is 1/S̄ − 1 at s̄, √3/S̄ − 1 one log point below, and zero from s_max up', () => {
    const surplus = steadyStateSurplus(cc);
    expect(sensitivity(sBar, cc)).toBeCloseTo(1 / surplus - 1, 12);
    expect(sensitivity(sBar - 1, cc)).toBeCloseTo(Math.sqrt(3) / surplus - 1, 12);
    expect(sensitivity(maxSurplus(cc), cc)).toBe(0);
    expect(sensitivity(maxSurplus(cc) + 0.1, cc)).toBe(0);
    expect(sensitivity(maxSurplus(cc) - 1e-9, cc)).toBeCloseTo(0, 5);
  });
});

describe('habitRiskFree', () => {
  it('gives the 0.94% a year of Table 1 at its parameters, and eq. (12) by hand at others', () => {
    expect(12 * habitRiskFree(cc)).toBeCloseTo(0.0094, 14);
    const other: HabitParams = { mean: 0.002, sd: 0.005, phi: 0.98, gamma: 3, delta: 0.995 };
    expect(habitRiskFree(other)).toBeCloseTo(-Math.log(0.995) + 3 * 0.002 - (3 * 0.02) / 2, 15);
  });

  it('makes E[M_{t+1}] e^{r^f} = 1 at every grid point by quadrature, which checks eq. (12)', () => {
    const rf = habitRiskFree(cc);
    for (const s of solution.s) {
      const sdfMean = normalExpectation((z) => {
        const dc = cc.mean + cc.sd * z;
        const sNext = (1 - cc.phi) * sBar + cc.phi * s + sensitivity(s, cc) * (dc - cc.mean); // eq. (3)
        return Math.exp(habitLogSdf(s, sNext, dc, cc));
      }, 20);
      expect(Math.abs(sdfMean * Math.exp(rf) - 1)).toBeLessThan(1e-10);
    }
  });
});

describe('localCurvature', () => {
  it('is γ/S_t: 35 at S̄ with γ = 2', () => {
    expect(localCurvature(steadyStateSurplus(cc), 2)).toBeCloseTo(2 / steadyStateSurplus(cc), 14);
    expect(localCurvature(0.057, 2)).toBeCloseTo(35.088, 3);
    expect(localCurvature(1, 2)).toBe(2);
    expect(() => localCurvature(0, 2)).toThrow(RangeError);
  });
});

describe('habitLogSdf', () => {
  it('is log δ − γ(Δc + Δs) from eq. (5), and power utility when s does not move', () => {
    expect(habitLogSdf(-3, -2.9, 0.002, cc)).toBeCloseTo(Math.log(cc.delta) - 2 * 0.102, 15);
    expect(habitLogSdf(-3, -3, 0.002, cc)).toBeCloseTo(Math.log(cc.delta) - 2 * 0.002, 15);
  });
});

describe('simulateHabit', () => {
  it('starts at s̄ and takes its first step from the first draw of normalRng(seed)', () => {
    const path = simulateHabit(7, cc, { periods: 3 });
    const z = normalRng(7)();
    expect(path.s[0]).toBe(sBar);
    expect(path.dc[0]).toBeCloseTo(cc.mean + cc.sd * z, 15);
    // From s̄, eq. (3) moves s by Λ(s̄)(Δc − μ_c) = (1/S̄ − 1) σ_c z.
    expect(path.s[1]).toBeCloseTo(sBar + (1 / steadyStateSurplus(cc) - 1) * cc.sd * z, 14);
    expect(path.logM[0]).toBeCloseTo(habitLogSdf(path.s[0], path.s[1], path.dc[0], cc), 15);
    expect(path.c[3]).toBeCloseTo(path.dc[0] + path.dc[1] + path.dc[2], 15);
    path.X.forEach((x, t) => expect(x).toBeCloseTo(Math.exp(path.c[t]) * (1 - path.S[t]), 15));
  });

  it('gives the same path for the same seed and another for another seed', () => {
    expect(simulateHabit(3, cc, { periods: 50 })).toEqual(simulateHabit(3, cc, { periods: 50 }));
    expect(simulateHabit(4, cc, { periods: 50 }).s).not.toEqual(simulateHabit(3, cc, { periods: 50 }).s);
    expect(simulateHabit(3, cc).s).toHaveLength(1201);
  });
});

describe('priceConsumptionRatio', () => {
  it('equals the closed-form power-utility price to 1e-8 with the habit switched off', () => {
    // With S_t ≡ 1, F^(n) = e^{a n} with a = log δ + (1 − γ) μ_c + ½(1 − γ)² σ_c², so P/C = e^a/(1 − e^a).
    const a = Math.log(cc.delta) + (1 - cc.gamma) * cc.mean + 0.5 * (1 - cc.gamma) ** 2 * cc.sd ** 2;
    const power = priceConsumptionRatio(cc, { habit: false });
    power.pc.forEach((value) => expect(Math.abs(value / (Math.exp(a) / -Math.expm1(a)) - 1)).toBeLessThan(1e-8));
    expect(power.riskFree).toBe(impliedRiskFree(cc.delta, cc.gamma, cc.mean, cc.sd));
    expect(solution.riskFree).toBe(habitRiskFree(cc));
  });

  it('runs from the grid bottom, where γσ_c(1 + Λ) = 3, up to s_max', () => {
    // 1 − 2(s − s̄) = 9/(γ(1 − φ)) at the bottom, from (γσ_c(1 + Λ))² = γ(1 − φ)(1 − 2(s − s̄)).
    expect(solution.s[0]).toBeCloseTo(sBar - (9 / (cc.gamma * (1 - cc.phi)) - 1) / 2, 10);
    expect(cc.gamma * cc.sd * (1 + sensitivity(solution.s[0], cc))).toBeCloseTo(3, 10);
    expect(solution.s[solution.s.length - 1]).toBeCloseTo(maxSurplus(cc), 14);
    expect(solution.s).toHaveLength(200);
  });

  it('rises with s, as in Figure 3 (p. 15)', () => {
    solution.pc.slice(1).forEach((value, i) => expect(value).toBeGreaterThan(solution.pc[i]));
    expect(solution.evaluate(sBar)).toBeGreaterThan(solution.evaluate(Math.log(0.01)));
  });

  it('changes by about 1% at s̄ on a grid four times finer', () => {
    const fine = priceConsumptionRatio(cc, { gridSize: 400, tailSize: 400 });
    expect(Math.abs(solution.evaluate(sBar) / fine.evaluate(sBar) - 1)).toBeLessThan(0.015);
  });

  it('interpolates linearly between grid points and flat beyond them', () => {
    const [s0, s1] = [solution.s[150], solution.s[151]];
    expect(solution.evaluate((s0 + s1) / 2)).toBeCloseTo((solution.pc[150] + solution.pc[151]) / 2, 10);
    expect(solution.evaluate(-1000)).toBe(solution.pc[0]);
    expect(solution.evaluate(0)).toBe(solution.pc[199]);
  });

  it('throws when the series has not converged after maxTerms terms', () => {
    expect(() => priceConsumptionRatio(cc, { maxTerms: 10 })).toThrow(/did not converge/);
  });
});

describe('habitClaimReturns', () => {
  it('builds monthly pc, r and re by hand from the solution', () => {
    const path = simulateHabit(5, cc, { periods: 3 });
    const { pc, r, re } = habitClaimReturns(path, solution);
    const ratio = path.s.map((s) => solution.evaluate(s));
    expect(pc).toHaveLength(3);
    expect(pc[1]).toBeCloseTo(Math.log(ratio[2]), 14);
    expect(r[1]).toBeCloseTo(Math.log((ratio[2] + 1) / ratio[1]) + path.dc[1], 14);
    expect(re[1]).toBeCloseTo(r[1] - habitRiskFree(cc), 14);
  });

  it('sums years of periodsPerYear periods and divides the year-end price by the year’s consumption', () => {
    const path = simulateHabit(5, cc, { periods: 5 });
    const monthly = habitClaimReturns(path, solution);
    const years = habitClaimReturns(path, solution, { annual: true, periodsPerYear: 2 });
    expect(years.r).toHaveLength(2);
    expect(years.r[1]).toBeCloseTo(monthly.r[2] + monthly.r[3], 14);
    expect(years.re[0]).toBeCloseTo(monthly.re[0] + monthly.re[1], 14);
    const flow = 1 + Math.exp(path.c[3] - path.c[4]);
    expect(years.pc[1]).toBeCloseTo(Math.log(solution.evaluate(path.s[4])) - Math.log(flow), 14);
    expect(() => habitClaimReturns(path, solution, { annual: true, periodsPerYear: 0 })).toThrow(RangeError);
  });

  it('gives a mean price–consumption ratio of 1.5 to 2.5 times the 18.3 years of Table 2 (p. 20)', () => {
    // This solution prices the deep low-surplus tail that the paper's grid leaves out, so it sits near 35 years;
    // see the doc comment of priceConsumptionRatio.
    const mean = Math.exp(arithmeticMean(annual.pc));
    expect(mean).toBeGreaterThan(1.5 * 18.3);
    expect(mean).toBeLessThan(2.5 * 18.3);
  });

  it('gives a Sharpe ratio within 0.08 of the 0.43 that γ was chosen to match (Table 2, p. 20)', () => {
    const sharpe = arithmeticMean(annual.re) / Math.sqrt(sampleVariance(annual.re));
    expect(Math.abs(sharpe - 0.43)).toBeLessThan(0.08);
  });

  it('makes the slope of excess returns on pc negative and growing with the horizon, as in Table 5 (p. 23)', () => {
    // Table 5, consumption claim, 10 × slope at 1, 2, 3, 5 and 7 years: −2.0, −3.7, −5.1, −7.5, −9.4.
    const paper = [-0.20, -0.37, -0.51, -0.75, -0.94];
    const slopes = horizonSlopes(annual.re, annual.pc, [1, 2, 3, 5, 7]).map(({ slope }) => slope);
    slopes.forEach((slope, i) => {
      expect(slope).toBeLessThan(i === 0 ? 0 : slopes[i - 1]);
      expect(slope / paper[i]).toBeGreaterThan(0.5);
      expect(slope / paper[i]).toBeLessThan(1.2);
    });
  });
});

describe('habitMarginalUtility', () => {
  const path = { c: [0, 0.01, -0.02, 0.005] };

  it('is power-utility marginal utility C_t^{−γ} under both habits when h = 0', () => {
    const { external, internal } = habitMarginalUtility(path, { h: 0 });
    path.c.slice(1).forEach((c, t) => {
      expect(external[t]).toBeCloseTo(Math.exp(-2 * c), 14);
      expect(internal[t]).toBeCloseTo(Math.exp(-2 * c), 14);
    });
  });

  it('subtracts δ h C_t^{−γ} E[(e^{Δc} − h)^{−γ}] under the internal habit', () => {
    const h = 0.5;
    // E[(e^{Δc} − h)^{−γ}] by the trapezoid rule on the normal density over ±10 σ_c, a reference independent of
    // Gauss–Hermite quadrature.
    const steps = 20000;
    let expectation = 0;
    for (let i = 0; i <= steps; i++) {
      const z = -10 + (20 * i) / steps;
      const weight = (i === 0 || i === steps ? 0.5 : 1) * (20 / steps) * Math.exp(-(z ** 2) / 2) / Math.sqrt(2 * Math.PI);
      expectation += weight * (Math.exp(cc.mean + cc.sd * z) - h) ** -2;
    }
    const { external, internal } = habitMarginalUtility(path, { h });
    path.c.slice(1).forEach((c, t) => {
      const outside = (Math.exp(c) - h * Math.exp(path.c[t])) ** -2;
      expect(external[t]).toBeCloseTo(outside, 12);
      expect(internal[t] / (outside - cc.delta * h * Math.exp(-2 * c) * expectation) - 1).toBeCloseTo(0, 10);
    });
  });

  it('rejects an h at or above the lowest quadrature growth, and consumption below the habit', () => {
    expect(() => habitMarginalUtility(path, { h: 1 })).toThrow(RangeError);
    expect(() => habitMarginalUtility(path, { h: 0.98 })).toThrow(RangeError);
    expect(() => habitMarginalUtility({ c: [0, -1] }, { h: 0.5 })).toThrow(RangeError);
  });
});
