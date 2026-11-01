import { describe, expect, it } from 'vitest';
import { betweenDates, getColumn, loadSeries, type Series } from '../data/series';
import { inverse } from '../math/linalg';
import { normalRng } from '../math/rng';
import { betas, maxSharpeSquared, sampleCovariance, sampleMeans, tangencyWeights } from './portfolio';
import { sampleVariance } from './returns';
import {
  assetPanel, crossValidatedR2, defaultPriorScales, elasticNetSdf, principalComponentAssets, ridgePenalty,
  ridgeSdf, shrinkagePath, splitSampleSharpe,
} from './shrinkage';

const [ff3, ff5, mom, ff25, osap] = await Promise.all([
  loadSeries('ff3-monthly'), loadSeries('ff5-monthly'), loadSeries('mom-monthly'),
  loadSeries('ff25-size-bm-monthly'), loadSeries('osap-ls-monthly'),
]);
const ff = assetPanel('ff', { ff3, ff5, mom, ff25 });
const zoo = assetPanel('osap', { ff3, osap });
const SPLIT = '2005-01-01';
const ffSplit = assetPanel('ff', { ff3, ff5, mom, ff25 }, { estimateBefore: SPLIT });
const zooSplit = assetPanel('osap', { ff3, osap }, { estimateBefore: SPLIT });

// Seeded panel: T = 120 months, N = 6 correlated assets with means from 0.2% to 0.7% a month.
function seededReturns(seed: number, T = 120, N = 6): number[][] {
  const z = normalRng(seed);
  return Array.from({ length: T }, () => {
    const common = 0.03 * z();
    return Array.from({ length: N }, (_, i) => 0.002 + 0.001 * i + (0.5 + 0.1 * i) * common + 0.02 * z());
  });
}
const seeded = seededReturns(7);
const [mu, Sigma] = [sampleMeans(seeded), sampleCovariance(seeded)];
const times = (A: number[][], x: number[]) => A.map((row) => row.reduce((s, a, j) => s + a * x[j], 0));
const trace = (A: number[][]) => A.reduce((s, row, i) => s + row[i], 0);

describe('ridgeSdf', () => {
  it('solves (Σ + ν₂I)b = μ̄ on a 2 × 2 case by hand', () => {
    // Σ + I = [[3, 1], [1, 3]] has inverse [[3, -1], [-1, 3]]/8, so b̂ = (3/8, -1/8) for μ̄ = (1, 0).
    const b = ridgeSdf([1, 0], [[2, 1], [1, 2]], 1);
    expect(b[0]).toBeCloseTo(3 / 8, 14);
    expect(b[1]).toBeCloseTo(-1 / 8, 14);
  });

  it('with penalty 0 equals Σ⁻¹μ̄, in the direction of tangencyWeights', () => {
    const b = ridgeSdf(mu, Sigma, 0);
    times(inverse(Sigma), mu).forEach((value, i) => expect(b[i]).toBeCloseTo(value, 10));
    const total = b.reduce((s, v) => s + v, 0);
    tangencyWeights(mu, Sigma).forEach((w, i) => expect(b[i] / total).toBeCloseTo(w, 10));
  });

  it('maps the prior scale to ν₂ = tr Σ / (SR²_prior T)', () => {
    // tr Σ = 4, SR_prior = 0.5, T = 100: ν₂ = 4 / (0.25 · 100) = 0.16.
    expect(ridgePenalty(0.5, [[2, 1], [1, 2]], 100)).toBeCloseTo(0.16, 15);
  });
});

describe('elasticNetSdf', () => {
  it('with no L1 penalty equals ridgeSdf to 1e-8', () => {
    const net = elasticNetSdf(mu, Sigma, { l1: 0, l2: 1e-4 });
    expect(net.converged).toBe(true);
    expect(net.nonZero).toBe(6);
    ridgeSdf(mu, Sigma, 1e-4).forEach((value, i) => expect(Math.abs(net.b[i] - value)).toBeLessThan(1e-8));
  });

  it('returns all zeros once ν₁ ≥ 2 max|μ̄_i|', () => {
    // At b = 0 the gradient of the smooth part is -2μ̄, so b = 0 is optimal when ν₁ ≥ 2 max|μ̄_i|.
    const net = elasticNetSdf(mu, Sigma, { l1: 2 * Math.max(...mu.map(Math.abs)), l2: 1e-4 });
    expect(net.b).toEqual([0, 0, 0, 0, 0, 0]);
    expect(net.nonZero).toBe(0);
  });

  it('meets the KKT conditions of eq. (28) on the seeded case', () => {
    // g = 2((Σ + ν₂I)b - μ̄): g_i = -ν₁ sign(b_i) where b_i ≠ 0, and |g_i| ≤ ν₁ where b_i = 0.
    const [l1, l2] = [0.004, 1e-4];
    const { b, nonZero, converged } = elasticNetSdf(mu, Sigma, { l1, l2 });
    expect(converged).toBe(true);
    expect(nonZero).toBeGreaterThan(0);
    expect(nonZero).toBeLessThan(6);
    const g = times(Sigma, b).map((value, i) => 2 * (value + l2 * b[i] - mu[i]));
    b.forEach((value, i) => {
      if (value === 0) expect(Math.abs(g[i])).toBeLessThanOrEqual(l1);
      else expect(Math.abs(g[i] + l1 * Math.sign(value))).toBeLessThan(1e-12);
    });
  });
});

describe('principalComponentAssets', () => {
  const pcs = principalComponentAssets(seeded);
  const SigmaP = sampleCovariance(pcs.returns);

  it('preserves total variance and makes the PCs uncorrelated with variances ℓ_j', () => {
    expect(trace(SigmaP)).toBeCloseTo(trace(Sigma), 14);
    SigmaP.forEach((row, i) => row.forEach((value, j) => expect(value).toBeCloseTo(i === j ? pcs.values[i] : 0, 14)));
    // Means rotate with the returns, μ̄_P = Q'μ̄: the PCs are not demeaned.
    sampleMeans(pcs.returns).forEach((value, j) => expect(value).toBeCloseTo(pcs.loadings[j].reduce((s, q, i) => s + q * mu[i], 0), 14));
  });

  it('on PCs, ridge shrinks each coefficient by ℓ_j / (ℓ_j + ν₂) (KNS p. 278, eq. 24)', () => {
    const muP = sampleMeans(pcs.returns);
    const penalty = pcs.values[2];
    const [shrunk, naive] = [ridgeSdf(muP, SigmaP, penalty), ridgeSdf(muP, SigmaP, 0)];
    pcs.values.forEach((l, j) => expect(shrunk[j] / naive[j]).toBeCloseTo(l / (l + penalty), 8));
  });
});

describe('crossValidatedR2', () => {
  it('matches a hand-checked value on a one-asset, six-month panel', () => {
    // Folds (1, 3), (2, 2), (0, 4): every mean is 2; test variances 2, 0, 8; training variances 8/3, 10/3, 2/3.
    // With ν₂ = 1, b̂ = 2/(s² + 1) = 6/11, 6/13, 6/5 and R² = 1 - (2 - s²₂b̂)²/4 = 96/121, 0, -336/25.
    const r2 = crossValidatedR2([[1], [3], [2], [2], [0], [4]], { penalty: 1 });
    expect(r2).toBeCloseTo((96 / 121 + 0 - 336 / 25) / 3, 14);
  });

  it('gives the same output on repeated calls, and the same ridge R² for assets and PCs', () => {
    const options = { penalty: 2e-4 };
    const first = crossValidatedR2(seeded, options);
    expect(crossValidatedR2(seeded, options)).toBe(first);
    expect(crossValidatedR2(seeded, { ...options, space: 'pcs' })).toBeCloseTo(first, 10);
    expect(crossValidatedR2(seeded, { ...options, folds: 4 })).not.toBe(first);
  });
});

describe('shrinkagePath', () => {
  it('collects the full-sample b̂ and crossValidatedR2 at each penalty', () => {
    const penalties = [0, 1e-4, 1e-3];
    const path = shrinkagePath(seeded, { penalties, l1: 1e-3 });
    expect(path.priorScales[0]).toBe(Infinity);
    path.penalties.forEach((penalty, i) => {
      expect(path.r2[i]).toBe(crossValidatedR2(seeded, { penalty, l1: 1e-3 }));
      expect(path.coefficients[i]).toEqual(elasticNetSdf(mu, Sigma, { l1: 1e-3, l2: penalty }).b);
    });
  });

  it('maps the default prior scales to penalties and back', () => {
    const path = shrinkagePath(seeded);
    expect(path.penalties).toHaveLength(21);
    path.priorScales.forEach((scale, i) => expect(scale).toBeCloseTo(defaultPriorScales[i], 12));
    expect(path.penalties[0]).toBeCloseTo(ridgePenalty(0.01, Sigma, 120), 15);
  });
});

describe('splitSampleSharpe', () => {
  it('with penalty 0 has the in-sample maximum Sharpe ratio √(μ̄\'Σ̂⁻¹μ̄) of the first months', () => {
    const { weights, inSample, outOfSample } = splitSampleSharpe(seeded, { split: 80 });
    const first = seeded.slice(0, 80);
    expect(inSample.sharpe ** 2).toBeCloseTo(maxSharpeSquared(sampleMeans(first), sampleCovariance(first)), 12);
    expect(inSample.mean).toBeCloseTo(inSample.sharpe ** 2, 12);
    weights.forEach((w, i) => expect(w).toBeCloseTo(ridgeSdf(sampleMeans(first), sampleCovariance(first), 0)[i], 12));
    expect(outOfSample.sharpe).toBeLessThan(inSample.sharpe);
  });
});

describe('assetPanel', () => {
  // Four months of one signal (2, 4, 5, 1 %) and the market (1, 3, 2, 0 %). Over all four months β = 6/5 = 1.2;
  // over the first three, with means 11/3 and 2, β = (5/3 + 1/3 + 0)/(1 + 1 + 0) = 1. F_t = signal_t - β market_t.
  const months = ['1963-07-01', '1963-08-01', '1963-09-01', '1963-10-01'];
  const series = <I extends 'ff3-monthly' | 'osap-ls-monthly'>(name: string, values: number[]) => ({
    columns: [{ name: 'date' }, { name }], rows: months.map((date, t) => [date, values[t]]),
  }) as unknown as Series<I>;
  const tiny = { ff3: series<'ff3-monthly'>('Mkt-RF', [1, 3, 2, 0]), osap: series<'osap-ls-monthly'>('AM', [2, 4, 5, 1]) };

  it('removes the market with whole-window betas by default, and with earlier-month betas on request', () => {
    const column = (panel: { returns: number[][] }) => panel.returns.map(([value]) => value);
    [0.008, 0.004, 0.026, 0.01].forEach((v, t) => expect(column(assetPanel('osap', tiny))[t]).toBeCloseTo(v, 15));
    [0.01, 0.01, 0.03, 0.01].forEach((v, t) => {
      expect(column(assetPanel('osap', tiny, { estimateBefore: '1963-10-01' }))[t]).toBeCloseTo(v, 15);
    });
    expect(() => assetPanel('osap', tiny, { estimateBefore: '1963-09-01' })).toThrow(RangeError);
  });

  it('with estimateBefore, zeroes the betas and matches the market volatility in the earlier months only (KNS p. 290)', () => {
    const before = (rows: number[][]) => rows.slice(0, 498);
    const market = getColumn(betweenDates(ff5, '1963-07-01', '2004-12-01'), 'Mkt-RF').map((v) => (v as number) / 100);
    betas(before(ffSplit.returns), market).forEach((beta) => expect(Math.abs(beta)).toBeLessThan(1e-12));
    ffSplit.returns[0].forEach((_, j) => {
      expect(sampleVariance(before(ffSplit.returns).map((row) => row[j]))).toBeCloseTo(sampleVariance(market), 14);
    });
    const zooMarket = getColumn(betweenDates(ff3, '1963-07-01', '2004-12-01'), 'Mkt-RF').map((v) => (v as number) / 100);
    betas(before(zooSplit.returns), zooMarket).forEach((beta) => expect(Math.abs(beta)).toBeLessThan(1e-12));
    expect([ffSplit.dates, zooSplit.dates]).toEqual([ff.dates, zoo.dates]);
  });
});

describe('the committed data', () => {
  it('builds the FF set: 30 assets from 1963-07 to 2026-08, market removed and rescaled (KNS p. 280)', () => {
    expect([ff.dates[0], ff.dates.at(-1), ff.dates.length, ff.names.length]).toEqual(['1963-07-01', '2026-08-01', 758, 30]);
    expect(ff.names.slice(24)).toEqual(['ME5-BM5', 'SMB', 'HML', 'RMW', 'CMA', 'Mom']);
    const market = getColumn(betweenDates(ff5, '1963-07-01', '2026-08-01'), 'Mkt-RF').map((v) => (v as number) / 100);
    betas(ff.returns, market).forEach((beta) => expect(Math.abs(beta)).toBeLessThan(1e-12));
    ff.returns[0].forEach((_, j) => expect(sampleVariance(ff.returns.map((row) => row[j]))).toBeCloseTo(sampleVariance(market), 14));
  });

  it('builds the OSAP set: 108 complete signals from 1963-07 to 2024-12, market removed (KNS p. 282–283)', () => {
    expect([zoo.dates[0], zoo.dates.at(-1), zoo.dates.length, zoo.names.length]).toEqual(['1963-07-01', '2024-12-01', 738, 108]);
    expect(zoo.names.slice(0, 3)).toEqual(['AM', 'Accruals', 'AssetGrowth']);
    const market = getColumn(betweenDates(ff3, '1963-07-01', '2024-12-01'), 'Mkt-RF').map((v) => (v as number) / 100);
    betas(zoo.returns, market).forEach((beta) => expect(Math.abs(beta)).toBeLessThan(1e-12));
  });

  // The split at 2005-01 follows the paper's withheld sample (KNS p. 289); it is month 498 in both sets. The
  // split-sample Sharpe ratios use the panels with betas and scales from before the split. They are monthly. Pinned on the default grid of 21 prior scales and K = 3.
  it('pins the FF set: R²_CV peaks at the heaviest shrinkage of the grid', () => {
    // Every penalty does worse than b̂ = 0 in the 2005–2026 fold, so the best SR_prior is the grid's smallest, 0.01.
    const path = shrinkagePath(ff.returns);
    const best = path.r2.indexOf(Math.max(...path.r2));
    expect(best).toBe(0);
    expect(path.penalties[best]).toBeCloseTo(0.786539, 6);
    expect(path.r2[best]).toBeCloseTo(-0.006015, 6);
    const split = ff.dates.indexOf(SPLIT);
    expect(split).toBe(498);
    const plain = splitSampleSharpe(ffSplit.returns, { split });
    expect(plain.inSample.sharpe).toBeCloseTo(0.532520, 6);
    expect(plain.outOfSample.sharpe).toBeCloseTo(0.242931, 6);
    const shrunk = splitSampleSharpe(ffSplit.returns, { split, penalty: path.penalties[best] });
    expect(shrunk.inSample.sharpe).toBeCloseTo(0.271365, 6);
    expect(shrunk.outOfSample.sharpe).toBeCloseTo(0.039040, 6);
  }, 20000);

  it('pins the OSAP set: R²_CV peaks at SR_prior ≈ 0.158 a month', () => {
    const path = shrinkagePath(zoo.returns);
    const best = path.r2.indexOf(Math.max(...path.r2));
    expect(best).toBe(8);
    expect(path.priorScales[best]).toBeCloseTo(0.158489, 6);
    expect(path.penalties[best]).toBeCloseTo(0.00772691, 8);
    expect(path.r2[best]).toBeCloseTo(0.520071, 6);
    const split = zoo.dates.indexOf(SPLIT);
    expect(split).toBe(498);
    const plain = splitSampleSharpe(zooSplit.returns, { split });
    expect(plain.inSample.sharpe).toBeCloseTo(2.553388, 6);
    expect(plain.outOfSample.sharpe).toBeCloseTo(0.628921, 6);
    const shrunk = splitSampleSharpe(zooSplit.returns, { split, penalty: path.penalties[best] });
    expect(shrunk.inSample.sharpe).toBeCloseTo(1.323400, 6);
    expect(shrunk.outOfSample.sharpe).toBeCloseTo(0.634406, 6);
  }, 20000);
});
