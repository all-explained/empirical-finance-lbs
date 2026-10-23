import { describe, expect, it } from 'vitest';
import { betweenDates, dateRange, getColumn, loadSeries, seriesColumns, type SeriesId } from './series';

// Three independent raw-source cells per dataset, transcribed by hand on 2026-10-22.
// CSV line numbers include preambles/headers. Workbook addresses use Excel notation.
// Tests preserve source units; rounded workbook/Fed cells use the documented precision.
const references: Record<SeriesId, readonly (readonly [string, string, number])[]> = {
  // F-F_Research_Data_Factors.csv lines 6–8, columns B, C, D respectively.
  'ff3-monthly': [['1926-07-01', 'Mkt-RF', 2.89], ['1926-08-01', 'SMB', -1.44], ['1926-09-01', 'HML', 0.05]],
  // F-F_Research_Data_5_Factors_2x3.csv lines 6–8, columns B, E, F.
  'ff5-monthly': [['1963-07-01', 'Mkt-RF', -0.39], ['1963-08-01', 'RMW', 0.40], ['1963-09-01', 'CMA', 0.15]],
  // F-F_Momentum_Factor.csv lines 15–17, column B.
  'mom-monthly': [['1927-01-01', 'Mom', 0.57], ['1927-02-01', 'Mom', -1.51], ['1927-03-01', 'Mom', 3.52]],
  // 25_Portfolios_5x5.csv value-weighted monthly block, lines 17–19, B, F, Z.
  'ff25-size-bm-monthly': [['1926-07-01', 'ME1-BM1', 3.7806], ['1926-08-01', 'ME1-BM5', 8.5104], ['1926-09-01', 'ME5-BM5', -2.4284]],
  // ie_data.xls Data!B129, E1533, M1838. M1838 raw = 29.939593027231528.
  'shiller-monthly': [['1881-01-01', 'price', 6.19], ['1998-01-01', 'cpi', 161.6], ['2023-06-01', 'cape', 29.939593]],
  // PredictorData2025.xlsx Annual!B58, C131, L156.
  // C131 = 16.270999999999997; L156 = 0.04220165299512546.
  'goyal-welch-annual': [['1927-01-01', 'Index', 17.66], ['2000-01-01', 'D12', 16.271], ['2025-01-01', 'Rfree', 0.04220165]],
  // PredictorData2025.xlsx Monthly!B674, C1550, K1861.
  // C1550 = 16.715333333333334; K1861 = 0.0034000000000000002.
  'goyal-welch-monthly': [['1927-01-01', 'Index', 13.21], ['2000-01-01', 'D12', 16.71533333], ['2025-12-01', 'Rfree', 0.0034]],
  // fred-treasury-monthly.csv lines 794/B, 1034/G, 1094/J.
  'fred-treasury-monthly': [['2000-01-01', 'GS1', 6.12], ['2020-01-01', 'GS10', 1.76], ['2025-01-01', 'TB3MS', 4.21]],
  // feds200628.csv lines 6393/SVENY01, 10089/SVENY10, 15308/SVENY30.
  // Last two raw cells = 6.686583424321 and 2.16499996185303.
  'gsw-zero-coupon': [['1985-11-29', 'SVENY01', 7.7914], ['2000-01-31', 'SVENY10', 6.6866], ['2020-01-31', 'SVENY30', 2.165]],
  // fred-consumption-quarterly.csv lines 294/B, 314/C, 294/D.
  'fred-consumption-quarterly': [['2020-01-01', 'PCNDGC96', 3020.002], ['2025-01-01', 'PCESVC96', 10755.176], ['2020-01-01', 'B230RC0Q173SBEA', 331545]],
  // fred-cay-quarterly.csv is a FRED ZIP (transcribed 2026-10-23): quarterly.csv lines 21/B and 319/F,
  // quarterly,_end_of_period.csv line 179/B.
  'fred-cay-quarterly': [['1951-10-01', 'PCND', 95.454], ['2026-04-01', 'COE', 16349.724], ['1990-01-01', 'TNWBSHNO', 22015993]],
};

for (const id of Object.keys(seriesColumns) as SeriesId[]) {
  describe(id, () => {
    it('has the documented schema, ordered unique dates and complete required columns', async () => {
      const series = await loadSeries(id);
      expect(series.id).toBe(id);
      for (const key of ['title', 'source', 'url', 'citation'] as const) expect(series[key].length).toBeGreaterThan(0);
      expect(series.url).toMatch(/^https?:\/\//);
      expect(series.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(series.frequency).toBe(id.endsWith('annual') ? 'annual' : id.endsWith('quarterly') ? 'quarterly' : 'monthly');
      expect(series.columns.map(({ name }) => name)).toEqual(['date', ...seriesColumns[id]]);
      for (const column of series.columns) {
        expect(column.unit.length).toBeGreaterThan(0);
        expect(column.description.length).toBeGreaterThan(0);
        expect(typeof column.required).toBe('boolean');
      }
      expect(series.rows.length).toBeGreaterThan(30);
      const dates = series.rows.map(([date]) => date);
      expect(dates).toEqual([...new Set(dates)].sort());
      for (const row of series.rows) {
        expect(row).toHaveLength(series.columns.length);
        expect(row[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(row[0]).toISOString().slice(0, 10)).toBe(row[0]);
        for (let index = 1; index < row.length; index++) {
          if (series.columns[index]!.required || row[index] !== null) expect(Number.isFinite(row[index])).toBe(true);
        }
      }
    });

    it.each(references[id])('matches raw cell %s / %s', async (date, name, expected) => {
      const series = await loadSeries(id);
      const index = series.columns.findIndex((column) => column.name === name);
      expect(index).toBeGreaterThan(0);
      expect(series.rows.find((row) => row[0] === date)?.[index]).toBe(expected);
    });
  });
}

describe('typed loader helpers', () => {
  it('accesses columns and slices an inclusive date range without changing the original', async () => {
    const series = await loadSeries('ff3-monthly');
    const slice = betweenDates(series, '1926-07-01', '1926-08-01');
    expect(dateRange(slice)).toEqual({ start: '1926-07-01', end: '1926-08-01' });
    expect(getColumn(slice, 'Mkt-RF')).toEqual([2.89, 2.64]);
    expect(series.rows.length).toBeGreaterThan(slice.rows.length);
    expect(dateRange(betweenDates(series, '1800-01-01', '1800-02-01'))).toBeNull();
    expect(() => betweenDates(series, '2000-01-01', '1999-01-01')).toThrow(RangeError);
    expect(() => getColumn(series, 'unknown' as 'SMB')).toThrow(RangeError);
    const invalidColumn = () => {
      // @ts-expect-error Columns from another series must fail type checking.
      return getColumn(series, 'cape');
    };
    void invalidColumn;
  });

  it('keeps unavailable predictors explicit and rejects unknown datasets', async () => {
    const series = await loadSeries('goyal-welch-monthly');
    expect(getColumn(series, 'csp')).toContain(null);
    expect(series.columns.find(({ name }) => name === 'csp')?.required).toBe(false);
    await expect(loadSeries('unknown' as SeriesId)).rejects.toThrow(RangeError);
  });
});
