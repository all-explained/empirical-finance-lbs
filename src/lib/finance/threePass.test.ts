import { describe, expect, it } from 'vitest';
import { betweenDates, getColumn, loadSeries } from '../data/series';
import { inverse, matMul, symmetricEigen, transpose } from '../math/linalg';
import { normalRng } from '../math/rng';
import { pcaFactors } from './latentFactors';
import { sampleMeans } from './portfolio';
import { simulateOmittedFactor, threePass, twoPass } from './threePass';
import { factorPanel } from './timeSeriesTests';

// Reference values on real data come from numpy on the same committed files, by a separate route: the SVD
// of the demeaned returns, eq. 7 and eq. 8 of Giglio & Xiu (2021) written out with matrix products, the
// p. 1970 variance estimator with its Kronecker-product blocks Π̂_11, Π̂_12, Π̂_22, and lstsq regressions.
const [ff3, ff25, ff30] = await Promise.all([
  loadSeries('ff3-monthly'), loadSeries('ff25-size-bm-monthly'), loadSeries('ff30-industry-monthly'),
]);
// Monthly from 1963-07 to the last committed month (2026-08): T = 758. observed is Mkt-RF, SMB, HML.
const START = '1963-07-01';
const panel = factorPanel(ff3, ff25, { start: START, model: 'ff3' });
const observed = panel.factors;
// The 25 size–B/M portfolios with the 30 industries added: N = 55.
const rf = getColumn(betweenDates(ff3, START, '9999-12-31'), 'RF');
const industries = betweenDates(ff30, START, '9999-12-31');
const wide = panel.excess.map((row, t) => [
  ...row, ...industries.rows[t].slice(1).map((value) => ((value as number) - (rf[t] as number)) / 100),
]);

const dot = (x: readonly number[], y: readonly number[]) => x.reduce((sum, v, i) => sum + v * y[i], 0);
const draws = (seed: number, rows: number, cols: number) => {
  const z = normalRng(seed);
  return Array.from({ length: rows }, () => Array.from({ length: cols }, z));
};
const expectClose = (actual: readonly number[], expected: readonly number[], digits = 12) => {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], digits));
};

// A small seeded panel with three strong factors: T = 60, N = 8, and two observed factors that load on
// them with noise.
const small = (() => {
  const f = draws(11, 60, 3);
  const loadings = draws(12, 8, 3);
  const noise = draws(13, 60, 8);
  const excess = f.map((ft, t) => loadings.map((b, i) => 0.004 + 0.01 * (dot(b, ft) + 0.3 * noise[t][i])));
  const extra = draws(14, 60, 2);
  const observed = f.map((ft, t) => [ft[0] - 0.5 * ft[2] + 0.4 * extra[t][0], 0.3 * ft[1] + extra[t][1]]);
  return { excess, observed };
})();

describe('threePass', () => {
  it('matches the compact form of eq. 8 written out by hand on a small seeded case', () => {
    // V̂ = √T (ς_1 : … : ς_K)' from the T × T matrix R̃R̃' (eq. 7), β̂ = T⁻¹R̃V̂', and
    // λ̂_χ = G̃V̂'(V̂V̂')⁻¹(β̂'β̂)⁻¹β̂'R̄^e, with R̃ and G̃ the demeaned returns and observed factors.
    const { excess, observed } = small;
    const n = excess.length;
    const demean = (X: number[][]) => {
      const m = sampleMeans(X);
      return X.map((row) => row.map((v, i) => v - m[i]));
    };
    const R = demean(excess);
    const V = symmetricEigen(matMul(R, transpose(R))).vectors.slice(0, 3).map((v) => v.map((x) => Math.sqrt(n) * x));
    const beta = matMul(transpose(R), transpose(V)).map((row) => row.map((v) => v / n));
    const G = transpose(demean(observed));
    const etaHat = matMul(matMul(G, transpose(V)), inverse(matMul(V, transpose(V))));
    const gamma = matMul(matMul(inverse(matMul(transpose(beta), beta)), transpose(beta)), sampleMeans(excess).map((v) => [v]));
    const byHand = matMul(etaHat, gamma).map(([v]) => v);
    expectClose(threePass(excess, observed, { factors: 3 }).lambda, byHand);
  });

  it('with a zero-beta rate matches eq. 9 written out by hand', () => {
    // λ̂_0 = (ι'M_β̂ι)⁻¹ι'M_β̂R̄^e and λ̂_χ = G̃V̂'(V̂V̂')⁻¹(β̂'M_ιβ̂)⁻¹β̂'M_ιR̄^e, with M_A = I - A(A'A)⁻¹A'.
    const { excess, observed } = small;
    const { beta, factors } = pcaFactors(excess, 3);
    const annihilator = (A: number[][]) => {
      const P = matMul(matMul(A, inverse(matMul(transpose(A), A))), transpose(A));
      return P.map((row, i) => row.map((v, j) => (i === j ? 1 : 0) - v));
    };
    const iota = beta.map(() => [1]);
    const rbar = sampleMeans(excess).map((v) => [v]);
    const Mb = annihilator(beta);
    const Mi = annihilator(iota);
    const lambda0 = matMul(matMul(transpose(iota), Mb), rbar)[0][0] / matMul(matMul(transpose(iota), Mb), iota)[0][0];
    const V = transpose(factors);
    const m = sampleMeans(observed);
    const G = transpose(observed.map((row) => row.map((v, j) => v - m[j])));
    const BtMi = matMul(transpose(beta), Mi);
    const byHand = matMul(
      matMul(matMul(G, factors), inverse(matMul(V, factors))),
      matMul(inverse(matMul(BtMi, beta)), matMul(BtMi, rbar)),
    ).map(([v]) => v);
    const fit = threePass(excess, observed, { factors: 3, zeroBeta: true });
    expect(fit.latent.lambda0).toBeCloseTo(lambda0, 12);
    expectClose(fit.lambda, byHand);
    expect(fit.se).toBeUndefined();
  });

  it('is unchanged to 1e-10 when the factors are rotated before steps 2 and 3', () => {
    // Any invertible H: λ̂ becomes Hλ̂ and β̂_χ' becomes β̂_χ'H⁻¹, so λ̂_χ, its standard error and the R² stay.
    const H = draws(21, 5, 5);
    const plain = threePass(panel.excess, observed, { factors: 5 });
    const rotated = threePass(panel.excess, observed, { factors: 5, rotation: H });
    expectClose(rotated.lambda, plain.lambda, 10);
    expectClose(rotated.se!, plain.se!, 10);
    expectClose(rotated.r2, plain.r2, 10);
    expectClose(rotated.latent.lambda, matMul(H, plain.latent.lambda.map((v) => [v])).map(([v]) => v), 10);
    expect(Math.abs(rotated.latent.lambda[0] - plain.latent.lambda[0])).toBeGreaterThan(1e-4);
  });

  it('gives a principal component its own cross-sectional slope as its premium', () => {
    // χ_t = f̂_{k,t} has β̂_χ = e_k and R² = 1, so λ̂_χ = λ̂_k.
    const { factors } = pcaFactors(panel.excess, 4);
    const fit = threePass(panel.excess, factors.map((f) => [f[1], f[3]]), { factors: 4 });
    expectClose(fit.lambda, [fit.latent.lambda[1], fit.latent.lambda[3]], 14);
    expectClose(fit.betaChi[0], [0, 1, 0, 0], 12);
    expectClose(fit.r2, [1, 1], 12);
  });

  it('pins the premia of Mkt-RF, SMB and HML for 3 to 7 PCs of the 25 portfolios', () => {
    const reference: Record<number, { lambda: number[]; r2: number[] }> = {
      3: { lambda: [0.005489680463392543, 0.0015335107620225808, 0.00339748872650524], r2: [0.9672110209365599, 0.919846894077816, 0.9431932744805018] },
      4: { lambda: [0.005304480817761164, 0.0019417202925384913, 0.0032170286941342226], r2: [0.9711324636978607, 0.9616209775740456, 0.9515833482957438] },
      5: { lambda: [0.005383489380864421, 0.001860097191814796, 0.003195520078940234], r2: [0.981384351236126, 0.9856124419450367, 0.9532954065906254] },
      6: { lambda: [0.005362177548016496, 0.0018733470023768945, 0.0032081546804918525], r2: [0.9815628431248007, 0.9857637183842202, 0.95343677036285] },
      7: { lambda: [0.00610723520675028, 0.001676657800388313, 0.0027359752904519167], r2: [0.9883565226646758, 0.9868018714717788, 0.9595853879987533] },
    };
    // Sample means of the three traded factors, 0.60%, 0.15% and 0.29% a month.
    const means = [0.006017810026385226, 0.0014741424802110826, 0.00293957783641161];
    expectClose(sampleMeans(observed), means, 15);
    for (const K of [3, 4, 5, 6, 7]) {
      const fit = threePass(panel.excess, observed, { factors: K });
      expectClose(fit.lambda, reference[K].lambda);
      expectClose(fit.r2, reference[K].r2);
      // A traded factor's premium is its mean: here every estimate is within half a standard error of it.
      fit.lambda.forEach((v, j) => expect(Math.abs(v - means[j])).toBeLessThan(0.5 * fit.se![j]));
    }
  });

  it('pins the premia for 3 to 7 PCs of the 25 portfolios with the 30 industries added', () => {
    const reference: Record<number, number[]> = {
      3: [0.006170822114285818, 0.0006393596747586254, 0.00046907657257279735],
      4: [0.006057353950391161, 0.0007484867448604233, 0.0007688739634312497],
      5: [0.0058154130689909, 0.0013801087564016658, 0.0010645707372969222],
      6: [0.005823765086956911, 0.001402399446239001, 0.0010571257711544137],
      7: [0.006122881004231563, 0.0010837419429719237, 0.00130935748688844],
    };
    // With 3 PCs the industries pull the components away from value: HML's R² on them is only 0.22.
    expect(threePass(wide, observed, { factors: 3 }).r2[2]).toBeCloseTo(0.2169596797248904, 12);
    for (const K of [3, 4, 5, 6, 7]) expectClose(threePass(wide, observed, { factors: K }).lambda, reference[K]);
  });

  it('pins the standard errors of the p. 1970 estimator, with 0 and 3 Newey–West lags', () => {
    // For a traded factor that the PCs span, Φ is close to its variance (p. 1965): Mkt-RF's 0.160% is
    // near σ/√T = 0.162%.
    expectClose(threePass(panel.excess, observed, { factors: 5 }).se!, [0.0016041325588152513, 0.0010888665362776854, 0.001060545766307899], 14);
    expectClose(threePass(panel.excess, observed, { factors: 5, lags: 3 }).se!, [0.0016457793295875888, 0.0011136706267769597, 0.0012261946470204987], 14);
  });

  it('pins the estimates with a zero-beta rate on the 25 portfolios (5 PCs)', () => {
    const fit = threePass(panel.excess, observed, { factors: 5, zeroBeta: true });
    expect(fit.latent.lambda0).toBeCloseTo(0.015430648466495066, 12);
    expectClose(fit.lambda, [-0.009406823564198648, 0.0016082763350211188, 0.00304368266066959]);
  });
});

describe('twoPass', () => {
  it('pins the premia of Mkt-RF, SMB and HML on the 25 portfolios and on the 55', () => {
    expectClose(twoPass(panel.excess, observed).lambda, [0.005604000578695593, 0.0014443888763395567, 0.003531771728333033]);
    expectClose(twoPass(wide, observed).lambda, [0.00605916649210992, 0.0008608035385324625, 0.0018456911155388081]);
  });

  it('pins the premia and the zero-beta rate on the 25 portfolios', () => {
    const fit = twoPass(panel.excess, observed, { zeroBeta: true });
    expect(fit.lambda0).toBeCloseTo(0.011600167328947808, 12);
    expectClose(fit.lambda, [-0.005472211134035011, 0.0011695381897137383, 0.0032607710601671343]);
  });
});

describe('simulateOmittedFactor', () => {
  const base = { N: 50, T: 300, samples: 100 };

  it('gives the same output for the same seed', () => {
    const options = { N: 20, T: 60, strength: 1, correlation: 0.5, noise: 0.02, samples: 3 };
    expect(simulateOmittedFactor(5, options)).toEqual(simulateOmittedFactor(5, options));
    expect(simulateOmittedFactor(6, options).twoPass).not.toEqual(simulateOmittedFactor(5, options).twoPass);
  });

  it('with no omitted factor and no noise, the two estimates agree on average', () => {
    // Both target λ_1 = 0.5%. The mean gap between them is under 0.01% a month, and each mean bias is under
    // 0.07%, three standard errors of the mean of 100 samples (0.04/√300/√100 = 0.023%).
    const sim = simulateOmittedFactor(1, { ...base, strength: 0, correlation: 0, noise: 0 });
    expect(sim.truth).toBe(0.005);
    expect(sim.twoPass).toHaveLength(100);
    const gap = sim.twoPass.reduce((sum, v, s) => sum + v - sim.threePass[s], 0) / 100;
    expect(Math.abs(gap)).toBeLessThan(0.0001);
    expect(Math.abs(sim.bias.twoPass)).toBeLessThan(0.0007);
    expect(Math.abs(sim.bias.threePass)).toBeLessThan(0.0007);
  }, 60_000);

  it('with a strong omitted factor, biases the two-pass estimate and not the three-pass one', () => {
    // strength 2, correlation 0.5: the two-pass estimate tends to λ_1 + 2 · 0.5 · λ_2 = 1%, a bias of 0.5% a
    // month. Band: the two-pass bias is within 0.07% of 0.5%, the three-pass bias within 0.07% of 0.
    const sim = simulateOmittedFactor(2, { ...base, strength: 2, correlation: 0.5, noise: 0 });
    expect(Math.abs(sim.bias.twoPass - 0.005)).toBeLessThan(0.0007);
    expect(Math.abs(sim.bias.threePass)).toBeLessThan(0.0007);
    expect(sim.rmse.threePass).toBeLessThan(sim.rmse.twoPass / 2);
  }, 60_000);

  it('with measurement error, attenuates the two-pass estimate and leaves the three-pass one unbiased', () => {
    // noise 0.04 equals the factor's volatility, so the first-pass beta is halved and the two-pass estimate
    // tends to 2λ_1 = 1%: a bias of 0.5% a month, with the same bands as above.
    const sim = simulateOmittedFactor(3, { ...base, strength: 0, correlation: 0, noise: 0.04 });
    expect(Math.abs(sim.bias.twoPass - 0.005)).toBeLessThan(0.0007);
    expect(Math.abs(sim.bias.threePass)).toBeLessThan(0.0007);
  }, 60_000);

  it('rejects impossible settings', () => {
    expect(() => simulateOmittedFactor(1, { N: 20, T: 60, strength: 1, correlation: 1.5, noise: 0 })).toThrow(RangeError);
  });
});
