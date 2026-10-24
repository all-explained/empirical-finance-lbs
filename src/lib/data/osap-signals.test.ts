import { describe, expect, it } from 'vitest';
import { loadOsapSignals } from './osap-signals';
import { loadSeries, seriesColumns } from './series';

describe('OSAP signal documentation', () => {
  it('loads one complete record for each clear predictor in the return matrix', async () => {
    const doc = await loadOsapSignals();
    expect(doc.id).toBe('osap-signals');
    expect(doc.release).toBe('October 2025 (v2.0.0)');
    expect(doc.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(doc.url).toBe('https://www.openassetpricing.com/data/');
    for (const field of ['title', 'source', 'citation'] as const) expect(doc[field].length).toBeGreaterThan(0);
    const names = doc.signals.map(({ acronym }) => acronym);
    expect(names).toHaveLength(165);
    expect(names).toEqual([...new Set(names)].sort());
    expect(names).toEqual(seriesColumns['osap-ls-monthly']);
    const returns = await loadSeries('osap-ls-monthly');
    expect(returns.columns.slice(1).map(({ name }) => name)).toEqual(names);
    for (const signal of doc.signals) {
      expect(signal.authors.length).toBeGreaterThan(0);
      expect(signal.journal.length).toBeGreaterThan(0);
      expect(signal.category).toBe('Predictor');
      expect(signal.predictability).toBe('1_clear');
      for (const year of [signal.publicationYear, signal.sampleStartYear, signal.sampleEndYear]) {
        expect(Number.isInteger(year)).toBe(true);
        expect(year).toBeGreaterThanOrEqual(1900);
        expect(year).toBeLessThanOrEqual(2025);
      }
      expect(signal.sampleStartYear).toBeLessThanOrEqual(signal.sampleEndYear);
    }
  });

  it('matches original-paper metadata in the release SignalDoc.csv', async () => {
    const doc = await loadOsapSignals();
    // SignalDoc.csv, Acronym=AbnormalAccruals: Authors, Year, Journal and sample-year columns.
    expect(doc.signals.find(({ acronym }) => acronym === 'AbnormalAccruals')).toEqual({
      acronym: 'AbnormalAccruals', authors: 'Xie', publicationYear: 2001, journal: 'AR',
      sampleStartYear: 1971, sampleEndYear: 1992, category: 'Predictor', predictability: '1_clear',
    });
  });
});
