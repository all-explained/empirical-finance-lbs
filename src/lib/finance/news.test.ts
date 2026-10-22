import { describe, expect, test } from 'vitest';
import { normalRng } from '../math/rng';
import { ols } from '../stats/ols';
import { dogTailShares, newsDecomposition, newsWeights, simulateDogNull } from './news';

describe('newsWeights', () => {
  test('2×2 A solved by hand', () => {
    // A = [0 0.5; 0 0.5], rho = 0.9: rho A = [0 0.45; 0 0.45], (I − rho A)^(-1) = [1 9/11; 0 20/11],
    // so lambda_DR' = (0, 0.45) (I − rho A)^(-1) = (0, 9/11) and lambda_CF' = (1, 9/11).
    // Check by the sum: a unit shock to x raises E r_{t+1+j} by 0.5^j, so N_DR = sum_j 0.9^j 0.5^j = 0.45/0.55.
    const { discountRate, cashFlow } = newsWeights([[0, 0.5], [0, 0.5]], 0.9);
    expect(discountRate[0]).toBeCloseTo(0, 14);
    expect(discountRate[1]).toBeCloseTo(9 / 11, 14);
    expect(cashFlow[0]).toBeCloseTo(1, 14);
    expect(cashFlow[1]).toBeCloseTo(9 / 11, 14);
  });

  test('returnIndex picks the return row', () => {
    // Same system with the return second: A = [0.5 0; 0.5 0], lambda_DR' = (9/11, 0), lambda_CF' = (9/11, 1).
    const { discountRate, cashFlow } = newsWeights([[0.5, 0], [0.5, 0]], 0.9, 1);
    expect(discountRate[0]).toBeCloseTo(9 / 11, 14);
    expect(discountRate[1]).toBeCloseTo(0, 14);
    expect(cashFlow[1]).toBeCloseTo(1, 14);
    expect(() => newsWeights([[0.5, 0], [0.5, 0]], 0.9, 2)).toThrow(RangeError);
  });

  test('A = 0: no discount-rate news, all news is cash-flow news', () => {
    const { discountRate, cashFlow } = newsWeights([[0, 0, 0], [0, 0, 0], [0, 0, 0]], 0.96);
    expect(discountRate).toEqual([0, 0, 0]);
    expect(cashFlow).toEqual([1, 0, 0]);
  });
});

describe('newsDecomposition', () => {
  // Synthetic VAR(1) of (r, x): r_{t+1} = 0.1 x_t + e_r, x_{t+1} = 0.9 x_t + e_x, seeded.
  const draw = normalRng(5);
  const r = [0];
  const x = [0];
  for (let t = 0; t < 400; t++) {
    r.push(0.1 * x[t] + 0.2 * draw());
    x.push(0.9 * x[t] + 0.15 * draw());
  }
  const rho = 0.96;
  const news = newsDecomposition([r, x], rho);

  test('N_CF − N_DR equals the unexpected return to 1e-12', () => {
    expect(news.unexpected).toHaveLength(400);
    news.unexpected.forEach((u, t) => expect(Math.abs(news.cashFlow[t] - news.discountRate[t] - u)).toBeLessThan(1e-12));
  });

  test('the unexpected return is the OLS residual of the return equation', () => {
    const residuals = ols(r.slice(1), [r.slice(0, -1), x.slice(0, -1)]).residuals;
    news.unexpected.forEach((u, t) => expect(u).toBeCloseTo(residuals[t], 12));
  });

  test('the three shares sum to 1', () => {
    const { cashFlow, discountRate, covariance } = news.shares;
    expect(cashFlow + discountRate + covariance).toBeCloseTo(1, 12);
    expect(discountRate).toBeGreaterThan(0);
  });

  test('weights follow the fitted A', () => {
    // The decomposition uses newsWeights on the fitted A, not a second formula.
    expect(news.weights).toEqual(newsWeights(news.fit.A, rho));
  });
});

describe('simulateDogNull', () => {
  const sdp = 0.15;
  const rho = 0.96;
  // cov(e^d, e^dp) = rho var(e^dp) makes e^r = e^d − rho e^dp uncorrelated with e^dp, so the
  // slope estimate b_r has no small-sample (Stambaugh) bias and its mean under the null is exactly 0.
  const residualCov = [[sdp ** 2, rho * sdp ** 2], [rho * sdp ** 2, 0.04]];
  const options = { T: 80, phi: 0.94, rho, residualCov, samples: 2000, seed: 3 };
  const draws = simulateDogNull(options);

  test('every draw satisfies br − bd + rho phiHat = 1 to 1e-10', () => {
    expect(draws).toHaveLength(2000);
    draws.forEach((d) => expect(Math.abs(d.br - d.bd + rho * d.phi - 1)).toBeLessThan(1e-10));
  });

  test('mean br under the null is 0 within 4 Monte Carlo standard errors', () => {
    const br = draws.map((d) => d.br);
    const mean = br.reduce((s, v) => s + v, 0) / br.length;
    const sd = Math.sqrt(br.reduce((s, v) => s + (v - mean) ** 2, 0) / (br.length - 1));
    expect(Math.abs(mean)).toBeLessThan(4 * sd / Math.sqrt(br.length));
  });

  test('the same seed gives the same draws, another seed does not', () => {
    expect(simulateDogNull(options)).toEqual(draws);
    expect(simulateDogNull({ ...options, seed: 4 })[0]).not.toEqual(draws[0]);
  });

  test('rejects a non-stationary phi and a bad covariance', () => {
    expect(() => simulateDogNull({ ...options, phi: 1 })).toThrow(RangeError);
    expect(() => simulateDogNull({ ...options, residualCov: [[0.01, 0.02], [0.02, 0.01]] })).toThrow(RangeError);
  });
});

describe('dogTailShares', () => {
  test('hand-counted shares, ties count as at or above', () => {
    const rho = 0.9;
    // Long-run slopes br / (1 − 0.9 phi): 0.526, 0.345, −0.071, 0.364; the data's is 0.1/0.235 = 0.426.
    const draws = [
      { br: 0.10, bd: -0.05, phi: 0.90 },
      { br: 0.05, bd: 0.02, phi: 0.95 },
      { br: -0.02, bd: 0, phi: 0.80 },
      { br: 0.20, bd: -0.10, phi: 0.50 },
    ];
    expect(dogTailShares(draws, { br: 0.10, bd: 0, phi: 0.85 }, rho)).toEqual({ br: 0.5, bd: 0.5, longRun: 0.25 });
  });
});
