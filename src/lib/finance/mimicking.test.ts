import { describe, expect, it } from 'vitest';
import { loadSeries } from '../data/series';
import { identity, matMul } from '../math/linalg';
import { normalRng } from '../math/rng';
import { quarterlyPanel } from './conditional';
import { famaMacBeth } from './crossSection';
import { ff25Characteristics, mimickingPortfolio, slopePortfolios, slopeWeights, sortWeights } from './mimicking';
import { sampleCovariance } from './portfolio';
import { factorPanel } from './timeSeriesTests';

const [ff3, ff25, cay] = await Promise.all([
  loadSeries('ff3-monthly'), loadSeries('ff25-size-bm-monthly'), loadSeries('fred-cay-quarterly'),
]);
const Z = ff25Characteristics();
const sum = (x: readonly number[]) => x.reduce((total, value) => total + value, 0);

function seededPanel(seed: number, T: number, N: number): number[][] {
  const draw = normalRng(seed);
  return Array.from({ length: T }, () => Array.from({ length: N }, () => 0.01 + 0.05 * draw()));
}

function expectClose(actual: readonly (readonly number[])[], expected: readonly (readonly number[])[], tolerance: number) {
  actual.forEach((row, i) => row.forEach((value, j) => expect(Math.abs(value - expected[i][j])).toBeLessThan(tolerance)));
}

describe('slopeWeights', () => {
  it('times Z is the identity: unit exposure to its own characteristic, none to the others', () => {
    const weights = slopeWeights(Z);
    expectClose(matMul(weights, Z), identity(3), 1e-12);
    // With a constant column, the constant's portfolio is fully invested and the others are long–short.
    expect(weights.map(sum)).toEqual([expect.closeTo(1, 12), expect.closeTo(0, 12), expect.closeTo(0, 12)]);
  });

  it('is (Z\'Z)⁻¹Z\' on a hand case', () => {
    // Z = [1 −1; 1 0; 1 1]: Z'Z = diag(3, 2), so the rows are (1/3, 1/3, 1/3) and (−1/2, 0, 1/2).
    expectClose(slopeWeights([[1, -1], [1, 0], [1, 1]]), [[1 / 3, 1 / 3, 1 / 3], [-0.5, 0, 0.5]], 1e-15);
  });
});

describe('slopePortfolios', () => {
  it('equals the Fama–MacBeth slopes on the 25 portfolios to 1e-10', () => {
    const { excess } = factorPanel(ff3, ff25, { start: '1963-07-01', model: 'ff3' });
    expectClose(slopePortfolios(excess, Z), famaMacBeth(excess, Z, { intercept: false }).monthly, 1e-10);
  });

  it('uses Z[t] with returns[t] when the characteristics change, as one Fama–MacBeth regression per period', () => {
    const returns = seededPanel(7, 5, 6);
    const characteristics = returns.map((_, t) => seededPanel(100 + t, 6, 2).map((z) => [1, ...z]));
    const slopes = slopePortfolios(returns, characteristics);
    slopes.forEach((row, t) => {
      expectClose([row], famaMacBeth([returns[t]], characteristics[t], { intercept: false }).monthly, 1e-12);
    });
  });
});

describe('ff25Characteristics', () => {
  it('gives the centred quintile scores of a hand-written table for the four corners', () => {
    // ff25 columns run ME1-BM1 … ME1-BM5, ME2-BM1, …, ME5-BM5: size in groups of five, B/M inside each.
    const corners = { 0: 'ME1-BM1', 4: 'ME1-BM5', 20: 'ME5-BM1', 24: 'ME5-BM5' } as const;
    const table = { 'ME1-BM1': [1, -2, -2], 'ME1-BM5': [1, -2, 2], 'ME5-BM1': [1, 2, -2], 'ME5-BM5': [1, 2, 2] };
    Object.entries(corners).forEach(([i, name]) => expect(Z[Number(i)]).toEqual(table[name]));
    expect(Z).toHaveLength(25);
    expect(Z.map((row) => row[1] + row[2]).reduce((a, b) => a + b)).toBe(0);
  });
});

describe('sortWeights', () => {
  const bm = Z.map((row) => row[2]);
  const valueMinusGrowth = sortWeights(bm, { long: 2, short: -2 });

  it('sums to zero and has unit exposure to its score', () => {
    expect(sum(valueMinusGrowth)).toBeCloseTo(0, 15);
    expect(sum(valueMinusGrowth.map((w, i) => w * bm[i]))).toBeCloseTo(1, 15);
  });

  it('weights each value and growth portfolio 1/5, divided by the spread of 4', () => {
    // Five value (BM5) and five growth (BM1) portfolios: ±(1/5)/4 = ±1/20, zero elsewhere.
    expect(valueMinusGrowth.filter((w) => w !== 0)).toHaveLength(10);
    valueMinusGrowth.forEach((w, i) => expect(w).toBeCloseTo(bm[i] === 2 ? 0.05 : bm[i] === -2 ? -0.05 : 0, 15));
  });

  it('needs assets on both legs', () => {
    expect(() => sortWeights(bm, { long: 3, short: -2 })).toThrow(RangeError);
    expect(() => sortWeights(bm, { long: 2, short: 2 })).toThrow(RangeError);
  });
});

describe('mimickingPortfolio', () => {
  it('returns the weights and a correlation of 1 for a factor that is a portfolio of the base assets', () => {
    const base = seededPanel(11, 120, 4);
    const w = [0.5, -0.25, 1, 0.75];
    const factor = base.map((r) => 0.002 + sum(r.map((value, i) => value * w[i])));
    const fit = mimickingPortfolio(factor, base, { split: 60 });
    fit.weights.forEach((value, i) => expect(value).toBeCloseTo(w[i], 10));
    expect(fit.intercept).toBeCloseTo(0.002, 10);
    expect(fit.correlation).toBeCloseTo(1, 12);
    fit.outOfSample!.weights.forEach((value, i) => expect(value).toBeCloseTo(w[i], 10));
    expect(fit.outOfSample!.correlation).toBeCloseTo(1, 12);
  });

  it('needs periods on both sides of the split', () => {
    const base = seededPanel(12, 40, 4);
    const factor = base.map((r) => r[0]);
    expect(() => mimickingPortfolio(factor, base, { split: 5 })).toThrow(RangeError);
    expect(() => mimickingPortfolio(factor, base, { split: 39 })).toThrow(RangeError);
  });
});

describe('committed data', () => {
  it('the B/M slope portfolio tracks HML (monthly, 1963-07 to 2026-08)', () => {
    const panel = factorPanel(ff3, ff25, { start: '1963-07-01', model: 'ff3' });
    expect(panel.dates).toHaveLength(758);
    const bm = slopePortfolios(panel.excess, Z).map((row) => row[2]);
    const [[vb, c], [, vh]] = sampleCovariance(bm.map((value, t) => [value, panel.factors[t][2]]));
    expect(c / Math.sqrt(vb * vh)).toBeCloseTo(0.9673, 4);
    // Fama–MacBeth mean and t-statistic (divisor T), per month, per quintile step of B/M.
    const fm = famaMacBeth(panel.excess, Z, { intercept: false });
    expect(fm.lambda[2]).toBeCloseTo(0.000923, 6);
    expect(fm.tStats[2]).toBeCloseTo(2.940, 3);
  });

  describe('consumption growth dc of quarterlyPanel, 1963-Q3 to 2026-Q2', () => {
    const panel = quarterlyPanel({ ff3, ff25, cay }, { start: '1963-07-01' });
    // The split halves the sample: weights from 1963-Q3 to 1994-Q4 (126 quarters), correlation from 1995-Q1 on.
    const split = panel.dates.indexOf('1995-01-01');

    it('has 252 quarters split 126 and 126', () => {
      expect(panel.dates).toHaveLength(252);
      expect(split).toBe(126);
    });

    it('on the 25 portfolios: 0.40 in sample, −0.15 on the later half', () => {
      const fit = mimickingPortfolio(panel.dc, panel.excess, { split });
      expect(fit.correlation).toBeCloseTo(0.4015, 4);
      expect(fit.outOfSample!.correlation).toBeCloseTo(-0.1543, 4);
    });

    it('on the three FF3 factors: 0.09 in sample, −0.01 on the later half', () => {
      const fit = mimickingPortfolio(panel.dc, panel.factors, { split });
      expect(fit.correlation).toBeCloseTo(0.0867, 4);
      expect(fit.outOfSample!.correlation).toBeCloseTo(-0.0076, 4);
    });
  });
});
