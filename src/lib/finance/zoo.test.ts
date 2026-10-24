import { describe, expect, it } from 'vitest';
import { loadOsapSignals, type OsapSignal } from '../data/osap-signals';
import { loadSeries, type Series } from '../data/series';
import {
  byPublicationYear, compareConstructions, countAbove, signalSummaries, type SignalSummary,
} from './zoo';

const [returns, documentation] = await Promise.all([loadSeries('osap-ls-monthly'), loadOsapSignals()]);
const zoo = signalSummaries(returns, documentation.signals, { construction: 'original' });

// Three signals over 2000-01 to 2005-01, percent per month.
// BM: sample 2000–2002, 1, 3, 1, 3, … (36 months), then 0, 2, … (24 months), then null in 2005-01.
// AM: only 20 non-null months, all in sample. Size: sample 2001 only (12 months), then -1, -3, … (36).
const dates = Array.from({ length: 61 }, (_, i) => `${2000 + Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, '0')}-01`);
const hand = {
  id: 'osap-ls-monthly', title: '', source: '', url: '', citation: '', retrieved: '', frequency: 'monthly',
  columns: ['date', 'BM', 'AM', 'Size'].map((name) => ({ name, unit: '', description: '', required: false })),
  rows: dates.map((date, i) => {
    const year = Number(date.slice(0, 4));
    const bm = year === 2005 ? null : year <= 2002 ? (i % 2 ? 3 : 1) : (i % 2 ? 2 : 0);
    const size = year === 2001 ? 5 : year >= 2002 && year <= 2004 ? (i % 2 ? -3 : -1) : null;
    return [date, bm, i < 20 ? 1 + i : null, size];
  }),
} as unknown as Series<'osap-ls-monthly'>;
const doc = (acronym: string, publicationYear: number, sampleStartYear: number, sampleEndYear: number) =>
  ({ acronym, publicationYear, sampleStartYear, sampleEndYear }) as OsapSignal;
const handSignals = [doc('BM', 1985, 2000, 2002), doc('AM', 1981, 2000, 2004), doc('Size', 1981, 2001, 2001)];
const handZoo = signalSummaries(hand, handSignals, { construction: 'original' });

describe('signalSummaries', () => {
  it('summarises the hand-made three-signal case', () => {
    // BM in sample: r̄ = 0.02, deviations ±0.01, s² = 36·1e-4/35, so t = 0.02 / (0.01/√35) = 2√35.
    // BM after: r̄ = 0.01 over 24 months, t = √23. Size after: r̄ = -0.02 over 36, t = -2√35.
    const [bm, am, size] = handZoo;
    expect(bm.acronym).toBe('BM');
    expect(bm.publicationYear).toBe(1985);
    expect(bm.original?.months).toBe(36);
    expect(bm.original?.mean).toBeCloseTo(0.02, 14);
    expect(bm.original?.t).toBeCloseTo(2 * Math.sqrt(35), 10);
    expect(bm.post?.months).toBe(24);
    expect(bm.post?.mean).toBeCloseTo(0.01, 14);
    expect(bm.post?.t).toBeCloseTo(Math.sqrt(23), 10);
    // AM has 20 < 24 months in sample and none after.
    expect(am).toEqual({ acronym: 'AM', publicationYear: 1981, original: null, post: null });
    expect(size.original).toBeNull();
    expect(size.post?.months).toBe(36);
    expect(size.post?.mean).toBeCloseTo(-0.02, 14);
    expect(size.post?.t).toBeCloseTo(-2 * Math.sqrt(35), 10);
  });

  it('matches r̄ / (s/√T) computed by hand on BM (Stattman 1980), 1963–1976', () => {
    // Sample 1962–1976, cut to the data's 1963-01 start. Python: 168 months, r̄ = 0.011785985079397033, t = 3.650370214127763.
    const column = returns.columns.findIndex(({ name }) => name === 'BM');
    const r = returns.rows.filter(([date]) => date >= '1963-01-01' && date <= '1976-12-01').map((row) => (row[column] as number) / 100);
    const mean = r.reduce((a, b) => a + b, 0) / r.length;
    const s = Math.sqrt(r.reduce((a, b) => a + (b - mean) ** 2, 0) / (r.length - 1));
    const bm = zoo.find(({ acronym }) => acronym === 'BM')!;
    expect(bm.original?.months).toBe(168);
    expect(bm.original?.mean).toBeCloseTo(mean, 15);
    expect(bm.original?.t).toBeCloseTo(mean / (s / Math.sqrt(r.length)), 12);
    expect(bm.original?.t).toBeCloseTo(3.650370214127763, 10);
    expect(bm.post?.t).toBeCloseTo(3.225216763075874, 10);
  });

  it('rejects returns from another construction', () => {
    expect(() => signalSummaries({ ...hand, id: 'ff3-monthly' } as unknown as Series<'osap-ls-monthly'>, handSignals, { construction: 'original' })).toThrow(RangeError);
  });
});

describe('countAbove', () => {
  it('counts the hand-made case', () => {
    // |t|: BM 2√35 ≈ 11.8 and √23 ≈ 4.80; Size -2√35 after; AM and Size in sample are null.
    expect(countAbove(handZoo, 1.96, 'original')).toBe(1);
    expect(countAbove(handZoo, 1.96, 'post')).toBe(2);
    expect(countAbove(handZoo, 5, 'post')).toBe(1);
    expect(countAbove(handZoo, 12, 'original')).toBe(0);
  });

  it('pins the committed OSAP data (independent Python check)', () => {
    expect(zoo).toHaveLength(165);
    expect(countAbove(zoo, 1.96, 'original')).toBe(158);
    expect(countAbove(zoo, 3, 'original')).toBe(107);
    expect(countAbove(zoo, 1.96, 'post')).toBe(66);
    expect(countAbove(zoo, 3, 'post')).toBe(31);
  });
});

describe('compareConstructions', () => {
  const summary = (acronym: string, t: number, mean: number): SignalSummary =>
    ({ acronym, publicationYear: 2000, original: { months: 120, mean, t }, post: null });

  it('compares the hand-made case', () => {
    // Common: X (2.5 → 1.5, crosses), Y (-4 → -3, stays above), Z (1 → 0.5, already below).
    // Mean ratios 0.5, 0.25, 0.8: median 0.5. W is only in b; V has no original summary in b.
    const a = [summary('X', 2.5, 0.01), summary('Y', -4, -0.02), summary('Z', 1, 0.005), summary('V', 3, 0.01)];
    const b = [summary('Z', 0.5, 0.004), summary('W', 5, 0.03), summary('Y', -3, -0.005), summary('X', 1.5, 0.005), { ...summary('V', 0, 0), original: null }];
    expect(compareConstructions(a, b, 1.96)).toEqual({ common: 3, crossedBelow: 1, medianMeanRatio: 0.5 });
    expect(compareConstructions(a, [], 1.96)).toEqual({ common: 0, crossedBelow: 0, medianMeanRatio: null });
  });

  it('is the identity on the committed data', () => {
    // Only the original construction is committed, so no variant can lose signals yet.
    expect(compareConstructions(zoo, zoo, 1.96)).toEqual({ common: 165, crossedBelow: 0, medianMeanRatio: 1 });
  });
});

describe('byPublicationYear', () => {
  it('groups the hand-made case', () => {
    expect(byPublicationYear(handZoo)).toEqual([
      { year: 1981, acronyms: ['AM', 'Size'], cumulative: 2 },
      { year: 1985, acronyms: ['BM'], cumulative: 3 },
    ]);
  });

  it('spans 1973 to 2016 on the committed data (independent Python check)', () => {
    const years = byPublicationYear(zoo);
    expect(years).toHaveLength(34);
    expect(years[0].year).toBe(1973);
    expect(years.at(-1)).toMatchObject({ year: 2016, cumulative: 165 });
  });
});
