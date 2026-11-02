import { describe, expect, it } from 'vitest';
import { betweenDates, dateRange, getColumn, loadSeries, seriesColumns, type SeriesId } from './series';

// Three independent raw-source cells per dataset, transcribed by hand on 2026-10-22.
// CSV line numbers include preambles/headers. Workbook addresses use Excel notation.
// Tests preserve source units; rounded workbook/Fed cells use the documented precision.
const references: Record<SeriesId, readonly (readonly [string, string, number])[]> = {
  // October 2025 PredictorLSretWide.csv lines 446/AM, 890/BM and 1189/Mom12m.
  // Raw dates are 1963-01-31, 2000-01-31 and 2024-12-31; store the observation month.
  'osap-ls-monthly': [['1963-01-01', 'AM', 4.36695811965812], ['2000-01-01', 'BM', 8.00532216312057], ['2024-12-01', 'Mom12m', -22.5286012578235]],
  // F-F_Research_Data_Factors.csv lines 6–8, columns B, C, D respectively.
  'ff3-monthly': [['1926-07-01', 'Mkt-RF', 2.89], ['1926-08-01', 'SMB', -1.44], ['1926-09-01', 'HML', 0.05]],
  // F-F_Research_Data_5_Factors_2x3.csv lines 6–8, columns B, E, F.
  'ff5-monthly': [['1963-07-01', 'Mkt-RF', -0.39], ['1963-08-01', 'RMW', 0.40], ['1963-09-01', 'CMA', 0.15]],
  // F-F_Momentum_Factor.csv lines 15–17, column B.
  'mom-monthly': [['1927-01-01', 'Mom', 0.57], ['1927-02-01', 'Mom', -1.51], ['1927-03-01', 'Mom', 3.52]],
  // Transcribed 2026-10-24: 6_Portfolios_2x3.csv first value-weighted block, lines 17/B, 18/D, 19/G.
  'ff6-size-bm-monthly': [['1926-07-01', 'SMALL-LoBM', 1.0866], ['1926-08-01', 'SMALL-HiBM', 5.4422], ['1926-09-01', 'BIG-HiBM', -0.7906]],
  // 6_Portfolios_ME_Prior_12_2.csv first value-weighted block, lines 13/B, 14/D, 15/G.
  'ff6-size-mom-monthly': [['1927-01-01', 'SMALL-LoPRIOR', -0.01], ['1927-02-01', 'SMALL-HiPRIOR', 5.81], ['1927-03-01', 'BIG-HiPRIOR', 2.25]],
  // F-F_Research_Data_Factors_daily.csv lines 10426/B, 10427/C, 10428/D.
  'ff3-daily': [['1963-07-01', 'Mkt-RF', -0.67], ['1963-07-02', 'SMB', -0.28], ['1963-07-03', 'HML', -0.10]],
  // F-F_Momentum_Factor_daily.csv lines 10334–10336, column B.
  'mom-daily': [['1963-07-01', 'Mom', -0.23], ['1963-07-02', 'Mom', 0.45], ['1963-07-03', 'Mom', 0.39]],
  // 25_Portfolios_5x5.csv value-weighted monthly block, lines 17–19, B, F, Z.
  'ff25-size-bm-monthly': [['1926-07-01', 'ME1-BM1', 3.7806], ['1926-08-01', 'ME1-BM5', 8.5104], ['1926-09-01', 'ME5-BM5', -2.4284]],
  // Transcribed 2026-11-01: 30_Industry_Portfolios.csv first value-weighted monthly block, lines 13/B, 14/C, 15/AE.
  'ff30-industry-monthly': [['1926-07-01', 'Food', 0.53], ['1926-08-01', 'Beer', 27.03], ['1926-09-01', 'Other', -3.58]],
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
  // Transcribed 2026-11-02: fred-consumption-annual.csv lines 2/B, 73/E and 98/F.
  'fred-consumption-annual': [['1929-01-01', 'PCNDA', 33.941], ['2000-01-01', 'DSERRG3A086NBEA', 65.210], ['2025-01-01', 'B230RC0A052NBEA', 341944]],
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
      expect(series.frequency).toBe(id.endsWith('daily') ? 'daily' : id.endsWith('annual') ? 'annual' : id.endsWith('quarterly') ? 'quarterly' : 'monthly');
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
  it('keeps complete annual NIPA observations from 1929 in source units', async () => {
    const series = await loadSeries('fred-consumption-annual');
    expect(series.frequency).toBe('annual');
    expect(series.columns.map(({ name }) => name)).toEqual([
      'date', 'PCNDA', 'PCESVA', 'DNDGRG3A086NBEA', 'DSERRG3A086NBEA', 'B230RC0A052NBEA',
    ]);
    expect(series.columns.slice(1).map(({ unit }) => unit)).toEqual([
      'billions of USD', 'billions of USD', 'index 2017=100', 'index 2017=100', 'thousands of persons',
    ]);
    expect(series.columns.every(({ required }) => required)).toBe(true);
    expect(series.rows[0]?.[0]).toBe('1929-01-01');
    series.rows.forEach((row, index) => {
      expect(row[0]).toBe(`${1929 + index}-01-01`);
      expect(row.slice(1).every(Number.isFinite)).toBe(true);
    });
  });

  it('keeps all 30 value-weighted industries from July 1926 in percent units without missing-value markers', async () => {
    const series = await loadSeries('ff30-industry-monthly');
    expect(series.rows[0]?.[0]).toBe('1926-07-01');
    expect(series.columns.slice(1)).toHaveLength(30);
    expect(series.columns.slice(1).every(({ unit, required }) => unit === 'percent' && required)).toBe(true);
    for (const row of series.rows) {
      expect(row.slice(1)).not.toContain(-99.99);
      expect(row.slice(1)).not.toContain(-999);
    }
  });

  it('preserves OSAP source units and unavailable signal histories', async () => {
    const series = await loadSeries('osap-ls-monthly');
    expect(dateRange(series)).toEqual({ start: '1963-01-01', end: '2024-12-01' });
    expect(series.rows).toHaveLength(744);
    expect(series.columns.slice(1)).toHaveLength(165);
    for (const column of series.columns.slice(1)) {
      expect(column.required).toBe(false);
      expect(column.unit).toBe('percent/month');
    }
    const accruals = getColumn(series, 'AbnormalAccruals');
    expect(accruals[0]).toBeNull();
    expect(accruals.some((value) => value !== null)).toBe(true);
  });

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

describe('French 2×3 sorts and daily factors', () => {
  it.each(['ff6-size-bm-monthly', 'ff6-size-mom-monthly', 'ff3-daily', 'mom-daily'] as const)(
    '%s keeps percent units and excludes source missing-value markers', async (id) => {
      const series = await loadSeries(id);
      expect(series.columns.slice(1).every(({ unit, required }) => unit === 'percent' && required)).toBe(true);
      for (const row of series.rows) {
        expect(row.slice(1)).not.toContain(-99.99);
        expect(row.slice(1)).not.toContain(-999);
      }
    },
  );

  it.each(['ff3-daily', 'mom-daily'] as const)('%s starts at the chosen cutoff and keeps trading dates', async (id) => {
    const series = await loadSeries(id);
    expect(series.rows[0]?.[0]).toBe('1963-07-01');
    expect(series.rows.slice(0, 4).map(([date]) => date)).toEqual([
      '1963-07-01', '1963-07-02', '1963-07-03', '1963-07-05',
    ]);
    expect(series.rows.every(([date]) => {
      const day = new Date(date).getUTCDay();
      return date >= '1963-07-01' && day !== 0 && day !== 6;
    })).toBe(true);
  });
});
