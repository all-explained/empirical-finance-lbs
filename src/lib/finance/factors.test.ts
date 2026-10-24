import { describe, expect, it } from 'vitest';
import { loadSeries, type Series } from '../data/series';
import { normalRng } from '../math/rng';
import { bearMarketRegression, formationReturn, modelPanel, sortFactors, spanningTest, windowBefore, worstMonths } from './factors';
import { factorPanel, grs } from './timeSeriesTests';

const ff3 = await loadSeries('ff3-monthly');
const ff5 = await loadSeries('ff5-monthly');
const mom = await loadSeries('mom-monthly');
const ff25 = await loadSeries('ff25-size-bm-monthly');
const sixValue = await loadSeries('ff6-size-bm-monthly');
const sixMomentum = await loadSeries('ff6-size-mom-monthly');
const sources = { ff3, ff5, mom };

function cell<I extends 'ff3-monthly' | 'ff5-monthly' | 'mom-monthly'>(series: Series<I>, date: string, name: string): number {
  const j = series.columns.findIndex((c) => c.name === name);
  return series.rows.find(([d]) => d === date)![j] as number;
}

// Largest |rebuilt - published| in percentage points, over the dates both series share.
function largestGap(dates: string[], rebuilt: number[], published: Series, name: string, last = '9999-12-31') {
  const j = published.columns.findIndex((c) => c.name === name);
  const byDate = new Map(published.rows.map((row) => [row[0], row[j] as number]));
  let gap = 0;
  let shared = 0;
  dates.forEach((date, t) => {
    if (!byDate.has(date) || date > last) return;
    shared++;
    gap = Math.max(gap, Math.abs(rebuilt[t] * 100 - byDate.get(date)!));
  });
  return { gap, shared };
}

describe('modelPanel', () => {
  it('equals factorPanel for the CAPM and FF3', () => {
    for (const model of ['capm', 'ff3'] as const) {
      for (const start of ['1926-07-01', '1963-07-01']) {
        expect(modelPanel(sources, ff25, { start, model })).toEqual(factorPanel(ff3, ff25, { start, model }));
      }
      expect(modelPanel({ ff3 }, ff25, { start: '1990-01-01', end: '1999-12-01', model }))
        .toEqual(factorPanel(ff3, ff25, { start: '1990-01-01', end: '1999-12-01', model }));
    }
  });

  it('adds Mom for Carhart and takes the five FF5 factors from ff5-monthly', () => {
    const date = '1963-07-01';
    const carhart = modelPanel(sources, ff25, { start: date, model: 'carhart' });
    const three = factorPanel(ff3, ff25, { start: date, model: 'ff3' });
    expect(carhart.factorNames).toEqual(['Mkt-RF', 'SMB', 'HML', 'Mom']);
    expect(carhart.excess).toEqual(three.excess);
    expect(carhart.factors[0]).toEqual([...three.factors[0], cell(mom, date, 'Mom') / 100]);
    const five = modelPanel(sources, ff25, { start: date, model: 'ff5' });
    expect(five.factorNames).toEqual(['Mkt-RF', 'SMB', 'HML', 'RMW', 'CMA']);
    expect(five.excess).toEqual(three.excess);
    expect(five.factors[0]).toEqual(five.factorNames.map((name) => cell(ff5, date, name) / 100));
    expect(five.dates).toHaveLength(758);
  });

  it('throws for a start before a source begins, a missing source or misaligned dates', () => {
    expect(() => modelPanel(sources, ff25, { start: '1963-06-01', model: 'ff5' })).toThrow(RangeError);
    expect(() => modelPanel(sources, ff25, { start: '1926-12-01', model: 'carhart' })).toThrow(RangeError);
    expect(() => modelPanel(sources, ff25, { start: '1927-01-01', model: 'carhart' })).not.toThrow();
    expect(() => modelPanel({ ff3 }, ff25, { start: '1963-07-01', model: 'ff5' })).toThrow(RangeError);
    const gap = { ...mom, rows: mom.rows.filter(([date]) => date !== '1990-01-01') };
    expect(() => modelPanel({ ff3, mom: gap }, ff25, { start: '1963-07-01', model: 'carhart' })).toThrow(RangeError);
  });
});

describe('sortFactors', () => {
  // One hand-made month, percent: SL 1, SM 2, SH 3, BL 0.5, BM 1, BH 2.5.
  // SMB = 6/3 - 4/3 = 2/3 %, HML = (3 + 2.5)/2 - (1 + 0.5)/2 = 2 %; the same cells as a momentum sort give UMD = 2 %.
  const row = ['2000-01-01', 1, 2, 3, 0.5, 1, 2.5] as const;

  it('builds SMB, HML and UMD from one hand-made row', () => {
    const value = sortFactors({ ...sixValue, rows: [row] }, 'size-value');
    expect(value.dates).toEqual(['2000-01-01']);
    expect(value.legs).toEqual({ SL: [0.01], SM: [0.02], SH: [0.03], BL: [0.005], BM: [0.01], BH: [0.025] });
    expect(value.factors.SMB[0]).toBeCloseTo(2 / 300, 15);
    expect(value.factors.HML[0]).toBeCloseTo(0.02, 15);
    const momentum = sortFactors({ ...sixMomentum, rows: [row] }, 'size-momentum');
    expect(momentum.legs.SW).toEqual([0.03]);
    expect(momentum.legs.BW).toEqual([0.025]);
    expect(momentum.factors.UMD[0]).toBeCloseTo(0.02, 15);
  });

  it('rejects the wrong file', () => {
    expect(() => sortFactors(sixMomentum as never, 'size-value')).toThrow(RangeError);
  });

  it('rebuilds the published SMB and HML to within rounding (largest gap 0.005 points)', () => {
    // Each leg and factor is rounded to 0.01 percent; every month from 1926-07 is compared.
    const { dates, factors } = sortFactors(sixValue, 'size-value');
    for (const name of ['SMB', 'HML'] as const) {
      const { gap, shared } = largestGap(dates, factors[name], ff3, name);
      expect(shared).toBe(1202);
      expect(gap).toBeLessThanOrEqual(0.005 + 1e-9);
    }
  });

  it('rebuilds the published Mom to within rounding (largest gap 0.01 points through 2026-07)', () => {
    // Four rounded legs, halved, plus the rounded factor: at most 0.005 + 0.005 = 0.01 points.
    // 2026-08 differs by 0.10 points: ff6-size-mom-monthly (retrieved 2026-10-24) is a later vintage than
    // mom-monthly (2026-10-22), whose newest month has since been revised.
    const { dates, factors } = sortFactors(sixMomentum, 'size-momentum');
    const early = largestGap(dates, factors.UMD, mom, 'Mom', '2026-07-01');
    expect(early.shared).toBe(1195);
    expect(early.gap).toBeLessThanOrEqual(0.01 + 1e-9);
    expect(largestGap(dates, factors.UMD, mom, 'Mom').gap).toBeLessThanOrEqual(0.1 + 1e-9);
  });
});

describe('formationReturn', () => {
  it('compounds months t - 12 to t - 2 and skips t - 1', () => {
    // Twelve months of 1% and a 50% month at t - 1 = 11: r = 1.01^11 - 1 = 0.115668...
    const returns = [...Array(11).fill(0.01), 0.5, -0.2];
    expect(formationReturn(returns, 12)).toBeCloseTo(1.01 ** 11 - 1, 15);
    expect(formationReturn(returns, 12)).toBeCloseTo(0.1156683467, 10);
    // lookback 3, skip 1 at t = 3: (1.1)(1.2) - 1 = 0.32; skip 0 adds the -50% month: 0.66 - 1 = -0.34.
    expect(formationReturn([0.1, 0.2, -0.5, 0.3], 3, { lookback: 3 })).toBeCloseTo(0.32, 15);
    expect(formationReturn([0.1, 0.2, -0.5, 0.3], 3, { lookback: 3, skip: 0 })).toBeCloseTo(-0.34, 15);
  });

  it('throws when the window leaves the data', () => {
    expect(() => formationReturn(Array(12).fill(0.01), 11)).toThrow(RangeError);
    expect(() => formationReturn(Array(12).fill(0.01), 14)).toThrow(RangeError);
    expect(() => formationReturn(Array(12).fill(0.01), 12, { lookback: 2, skip: 2 })).toThrow(RangeError);
  });
});

describe('bearMarketRegression', () => {
  // Seeded market: R^e_m ~ N(0.5%, 4.5%) monthly, T = 3000; WML = 1% - 2% I + (0.1 - 0.8 I) R^e_m + ε.
  const T = 3000;
  const z = normalRng(20);
  const market = Array.from({ length: T }, () => 0.005 + 0.045 * z());
  const truth = { alpha0: 0.01, alphaB: -0.02, beta0: 0.1, betaB: -0.8 };
  const wml = (noise: number) => {
    const fresh = normalRng(21);
    return market.map((m, t) => {
      const bear = t >= 24 && market.slice(t - 24, t).reduce((w, r) => w * (1 + r), 1) < 1 ? 1 : 0;
      return truth.alpha0 + truth.alphaB * bear + (truth.beta0 + truth.betaB * bear) * m + noise * fresh();
    });
  };

  it('flags I_{B,t-1} from the compounded past market return', () => {
    // lookback 2: t = 2 sees (0.9)(1.05) = 0.945 < 1, t = 3 (1.05)(1.2) = 1.26, t = 4 (1.2)(0.7) = 0.84,
    // t = 5 (0.7)(1.01) = 0.707, t = 6 (1.01)(1.1) = 1.111, t = 7 (1.1)(0.95) = 1.045.
    const market = [-0.1, 0.05, 0.2, -0.3, 0.01, 0.1, -0.05, 0.02];
    const fit = bearMarketRegression([0.01, 0.02, 0.03, 0.01, 0.05, 0.02, -0.04, 0.01], market, { lookback: 2 });
    expect(fit.bear).toEqual([1, 0, 1, 1, 0, 0]);
    expect(fit.fit.nobs).toBe(6);
  });

  it('recovers exact coefficients without noise and close ones with seeded noise', () => {
    const exact = bearMarketRegression(wml(0), market);
    expect(exact.bear).toHaveLength(T - 24);
    expect(exact.bear.some((b) => b === 1) && exact.bear.some((b) => b === 0)).toBe(true);
    for (const key of Object.keys(truth) as (keyof typeof truth)[]) expect(exact.coefficients[key]).toBeCloseTo(truth[key], 12);
    const noisy = bearMarketRegression(wml(0.03), market);
    expect(noisy.coefficients.alpha0).toBeCloseTo(0.01, 2);
    expect(noisy.coefficients.alphaB).toBeCloseTo(-0.02, 2);
    expect(Math.abs(noisy.coefficients.beta0 - 0.1)).toBeLessThan(0.05);
    expect(Math.abs(noisy.coefficients.betaB + 0.8)).toBeLessThan(0.1);
    expect(noisy.tStats.betaB).toBeLessThan(-10);
    expect(noisy.fit.coefficients[3]).toBe(noisy.coefficients.betaB);
  });
});

describe('worstMonths and windowBefore', () => {
  const dates = ['2000-01-01', '2000-02-01', '2000-03-01', '2000-04-01', '2000-05-01'];
  const values = [0.02, -0.1, 0.03, -0.1, -0.3];

  it('lists the k worst months, worst first, ties in date order', () => {
    expect(worstMonths(dates, values, 3)).toEqual([
      { index: 4, date: '2000-05-01', value: -0.3 },
      { index: 1, date: '2000-02-01', value: -0.1 },
      { index: 3, date: '2000-04-01', value: -0.1 },
    ]);
  });

  it('returns the months before a date, clipped at the start', () => {
    expect(windowBefore(dates, values, '2000-04-01', 2)).toEqual({ dates: ['2000-02-01', '2000-03-01'], values: [-0.1, 0.03] });
    expect(windowBefore(dates, values, '2000-02-01', 5)).toEqual({ dates: ['2000-01-01'], values: [0.02] });
    expect(() => windowBefore(dates, values, '1999-01-01', 2)).toThrow(RangeError);
  });

  it('finds the worst momentum month on the committed data', () => {
    // Mom fell 52.61% in 1932-08 (mom-monthly, percent); the second-worst month is 1932-07, at -45.63%.
    const dated = mom.rows.map(([date]) => date);
    const [worst, second] = worstMonths(dated, mom.rows.map((row) => row[1] as number), 2);
    expect(worst).toEqual({ index: dated.indexOf('1932-08-01'), date: '1932-08-01', value: -52.61 });
    expect(second.date).toBe('1932-07-01');
  });
});

describe('spanningTest', () => {
  const z = normalRng(7);
  const base = Array.from({ length: 200 }, () => [0.005 + 0.04 * z(), 0.002 + 0.03 * z()]);

  it('gives α = 0 and R² = 1 for an exact combination of the base', () => {
    const spanned = base.map(([a, b]) => [0.5 * a - 0.2 * b]);
    const result = spanningTest(spanned, base);
    expect(result.alpha[0]).toBeCloseTo(0, 14);
    expect(result.r2[0]).toBeCloseTo(1, 12);
    expect(result.beta[0][0]).toBeCloseTo(0.5, 12);
    expect(result.beta[0][1]).toBeCloseTo(-0.2, 12);
    expect(result.grs).toBeUndefined();
  });

  it('runs GRS when there are several new factors', () => {
    const fresh = base.map(([a, b]) => [0.003 + 0.5 * a + 0.02 * z(), 0.001 - b + 0.01 * z()]);
    const result = spanningTest(fresh, base);
    expect(result.alpha).toHaveLength(2);
    expect(result.grs).toEqual(grs(fresh, base));
  });

  it('pins the FF3 alpha of Mom from 1963-07 on the committed data', () => {
    // 758 months, 1963-07 to 2026-08: α̂ = 0.817% per month, classical t 5.47, White t 5.58, R² 0.080.
    const panel = modelPanel(sources, ff25, { start: '1963-07-01', model: 'carhart' });
    const result = spanningTest(panel.factors.map((row) => [row[3]]), panel.factors.map((row) => row.slice(0, 3)));
    expect(result.alpha[0]).toBeCloseTo(0.0081673064, 9);
    expect(result.alphaT[0]).toBeCloseTo(5.4654420806, 8);
    expect(result.alphaTWhite[0]).toBeCloseTo(5.5830564781, 8);
    expect(result.r2[0]).toBeCloseTo(0.0798541797, 9);
  });
});

describe('GRS of the 25 size–B/M portfolios from 1963-07 (committed data, T = 758)', () => {
  // GRS ~ F(25, 758 - 25 - K). Every model is rejected; Carhart and FF5 come closest.
  const pinned = { capm: 4.1962882299, ff3: 3.6425630022, carhart: 3.2189768530, ff5: 3.2269804308 } as const;
  for (const model of ['capm', 'ff3', 'carhart', 'ff5'] as const) {
    it(model, () => {
      const panel = modelPanel(sources, ff25, { start: '1963-07-01', model });
      const result = grs(panel.excess, panel.factors);
      expect(result.statistic).toBeCloseTo(pinned[model], 8);
      expect(result.df2).toBe(758 - 25 - panel.factorNames.length);
      expect(result.pValue).toBeLessThan(1e-6);
    });
  }
});
