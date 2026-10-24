/**
 * Every number in the prose of chapter 21 that comes from our data, recomputed from osap-ls-monthly,
 * osap-signals, ff5-monthly and mom-monthly through the library and the widgets' sample helper.
 * Numbers taken from readings (316, 452, 65%, 60.7%, 3.2%, 43.1%) are cited with their page in the
 * prose; the arithmetic built on them is checked here too.
 */
import { describe, expect, test } from 'vitest';
import osap from '../src/data/series/osap-ls-monthly.json';
import docs from '../src/data/series/osap-signals.json';
import ff5 from '../src/data/series/ff5-monthly.json';
import mom from '../src/data/series/mom-monthly.json';
import type { Series } from '../src/lib/data/series';
import type { OsapSignals } from '../src/lib/data/osap-signals';
import { cdf, invCdf } from '../src/lib/math/normal';
import { annualiseMean } from '../src/lib/stats/moments';
import { byPublicationYear, SPANNING_SAMPLES, spanningView, zooCounts, zooSummaries, type ZooData } from '../src/components/plots/zooSample';

const data: ZooData = {
  returns: { original: osap as unknown as Series<'osap-ls-monthly'> },
  signals: (docs as unknown as OsapSignals).signals,
  ff5: ff5 as unknown as Series<'ff5-monthly'>,
  mom: mom as unknown as Series<'mom-monthly'>,
};
const zoo = zooSummaries(data, 'original');
const at = (line: number) => zooCounts(zoo, zoo, line);
const yearly = (monthly: number, digits = 2) => (annualiseMean(monthly) * 100).toFixed(digits);
const sample = (value: 'full' | 'early' | 'late') => SPANNING_SAMPLES.find((s) => s.value === value)!;
const span = (factor: Parameters<typeof spanningView>[1], value: 'full' | 'early' | 'late' = 'full') => spanningView(data, factor, sample(value).start, sample(value).end);

describe('chapter 21 prose numbers', () => {
  test('hook: the zoo, and momentum in and after its sample', () => {
    const years = byPublicationYear(zoo);
    expect([zoo.length, years[0].year, years.at(-1)!.year]).toEqual([165, 1973, 2016]);
    expect([at(1.96).inSample, at(1.96).post, at(1.96).withPost]).toEqual([158, 66, 165]);
    const momentum = zoo.find((s) => s.acronym === 'Mom12m')!;
    const doc = data.signals.find((s) => s.acronym === 'Mom12m')!;
    expect([doc.authors, doc.publicationYear, doc.sampleStartYear, doc.sampleEndYear]).toEqual(['Jegadeesh and Titman', 1993, 1964, 1989]);
    expect([yearly(momentum.original!.mean), momentum.original!.t.toFixed(2), momentum.original!.months]).toEqual(['16.09', '4.48', 312]);
    expect([momentum.post!.months, yearly(momentum.post!.mean), momentum.post!.t.toFixed(2)]).toEqual([420, '9.21', '1.82']);
  });

  test('intuition: the line at 1.96 and at 3', () => {
    expect([at(1.96).inSample, at(3).inSample]).toEqual([158, 107]);
    expect([at(3).post, at(1.96).post]).toEqual([31, 66]);
    // The widget's only construction compared with itself: nothing crosses, ratio 1.
    expect(at(1.96).versusOriginal).toEqual({ common: 165, crossedBelow: 0, medianMeanRatio: 1 });
  });

  test('formalisation: luck among 316 factors and the power of a higher line', () => {
    expect(invCdf(0.975).toFixed(2)).toBe('1.96');
    expect((0.05 * 316).toFixed(1)).toBe('15.8');
    const beyond3 = 2 * (1 - cdf(3));
    expect((beyond3 * 100).toFixed(2)).toBe('0.27');
    expect((beyond3 * 316).toFixed(2)).toBe('0.85');
    const expectedT = 0.5 * Math.sqrt(240 / 12);
    expect(expectedT.toFixed(2)).toBe('2.24');
    expect([(cdf(expectedT - 1.96) * 100).toFixed(0), (cdf(expectedT - 3) * 100).toFixed(0)]).toEqual(['61', '22']);
  });

  test('playground: HML in each sample, Mom and SMB', () => {
    const hml = { full: span('HML'), early: span('HML', 'early'), late: span('HML', 'late') };
    expect([hml.full.first, hml.full.last, hml.full.T]).toEqual(['1963-07', '2026-08', 758]);
    expect([yearly(hml.full.alpha), hml.full.alphaT.toFixed(2), hml.full.r2.toFixed(3)]).toEqual(['0.85', '0.89', '0.513']);
    expect([hml.early.last, hml.early.T, yearly(hml.early.alpha), hml.early.alphaT.toFixed(2)]).toEqual(['1993-12', 366, '3.40', '2.94']);
    expect([hml.late.first, hml.late.T, yearly(hml.late.alpha), hml.late.alphaT.toFixed(2)]).toEqual(['1994-01', 392, '-1.48', '-1.01']);
    const momentum = span('Mom');
    expect([momentum.r2.toFixed(3), yearly(momentum.alpha), momentum.alphaT.toFixed(2)]).toEqual(['0.091', '8.83', '4.85']);
    const smb = span('SMB');
    expect([yearly(smb.alpha), smb.alphaT.toFixed(2)]).toEqual(['2.28', '1.80']);
    // 95% interval: α̂ ± 1.96 classical standard errors, s.e. = α̂ / t.
    const se = smb.alpha / smb.alphaT;
    expect([yearly(smb.alpha - 1.96 * se), yearly(smb.alpha + 1.96 * se)]).toEqual(['-0.21', '4.76']);
    // "The two are close": classical and White t within 0.4 of each other for every factor named.
    for (const v of [hml.full, momentum, smb]) expect(Math.abs(v.alphaT - v.alphaTWhite)).toBeLessThan(0.4);
  });

  test('quiz: 200 useless variables at 5%', () => {
    expect(0.05 * 200).toBe(10);
  });
});
