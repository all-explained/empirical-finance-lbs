/**
 * Every number in the prose of chapter 33, recomputed from ff25-size-bm-monthly, ff3-monthly and fred-cay-quarterly
 * through the mimicking library and the widgets' helper. Facts taken from Fama & French (1992), Kelly, Pruitt & Su
 * (2019) and Giglio & Xiu (2021) are cited in the prose with their pages and hold no numbers from our data.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import ff25 from '../src/data/series/ff25-size-bm-monthly.json';
import cay from '../src/data/series/fred-cay-quarterly.json';
import type { Series } from '../src/lib/data/series';
import { quarterlyPanel } from '../src/lib/finance/conditional';
import { mimickingPortfolio } from '../src/lib/finance/mimicking';
import { matMul, transpose } from '../src/lib/math/linalg';
import { WINDOWS, type ConditionalData } from '../src/components/plots/conditionalSample';
import { characteristicView, mimickingView, SCORES } from '../src/components/plots/mimickingSample';

const data: ConditionalData = {
  ff3: ff3 as unknown as Series<'ff3-monthly'>,
  ff25: ff25 as unknown as Series<'ff25-size-bm-monthly'>,
  cay: cay as unknown as Series<'fred-cay-quarterly'>,
};
const fixed = (v: number, digits: number) => v.toFixed(digits);
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const view = characteristicView(data);
const { sort: bmSort, regression: bmReg } = view.portfolios.bm;
const { sort: sizeSort, regression: sizeReg } = view.portfolios.size;
const bmScore = SCORES.map((z) => z[2]);
const split1995 = { ff25: mimickingView(data, 'ff25', '1995-01-01'), ff3: mimickingView(data, 'ff3', '1995-01-01') };
const split1975 = mimickingView(data, 'ff25', '1975-01-01');

describe('chapter 33 prose numbers', () => {
  test('hook: the monthly sample and the B/M slope portfolio against HML', () => {
    expect([view.first, view.last, view.T, SCORES.length]).toEqual(['1963-07', '2026-08', 758, 25]);
    expect(fixed(bmReg.correlation, 3)).toBe('0.967');
  });

  test('intuition: the scores, the two sets of weights, their exposures, means and t-statistics', () => {
    expect([Math.min(...SCORES.flatMap(([, s, b]) => [s, b])), Math.max(...SCORES.flatMap(([, s, b]) => [s, b]))]).toEqual([-2, 2]);
    // Small stocks (ME1, the first five portfolios) score +2 on size; value stocks (BM5) score +2 on B/M.
    expect(SCORES.slice(0, 5).map(([, s]) => s)).toEqual([2, 2, 2, 2, 2]);
    expect(SCORES.filter((_, i) => i % 5 === 4).map(([, , b]) => b)).toEqual([2, 2, 2, 2, 2]);
    expect([...new Set(bmSort.weights.map((w) => percent(w, 1)))].sort()).toEqual(['-5.0', '0.0', '5.0']);
    expect(bmSort.weights.filter((w) => w === 0)).toHaveLength(15);
    expect(bmReg.weights.slice(0, 5).map((w) => percent(w, 1))).toEqual(['-4.0', '-2.0', '0.0', '2.0', '4.0']);
    for (const p of [bmSort, bmReg]) expect(p.exposures.map((e) => fixed(Math.abs(e), 2))).toEqual(['0.00', '1.00']);
    expect([percent(bmSort.mean, 2), fixed(bmSort.t, 2)]).toEqual(['1.23', '3.17']);
    expect([percent(bmReg.mean, 2), fixed(bmReg.t, 2)]).toEqual(['1.11', '2.94']);
    expect([fixed(bmSort.correlation, 3), fixed(bmReg.correlation, 3)]).toEqual(['0.963', '0.967']);
    expect([percent(sizeSort.mean, 2), percent(sizeReg.mean, 2)]).toEqual(['0.49', '0.49']);
    expect([fixed(sizeSort.t, 2), fixed(sizeReg.t, 2)]).toEqual(['1.05', '1.07']);
  });

  test('formalisation: Z\'Z, the weights in closed form and their sums of squares', () => {
    expect(matMul(transpose(SCORES), SCORES)).toEqual([[25, 0, 0], [0, 50, 0], [0, 0, 50]]);
    expect(5 * (4 + 1 + 0 + 1 + 4)).toBe(50);
    bmReg.weights.forEach((w, i) => expect(w).toBeCloseTo(bmScore[i] / 50, 15));
    bmSort.weights.forEach((w, i) => expect(w).toBeCloseTo(bmScore[i] === 2 ? 1 / 20 : bmScore[i] === -2 ? -1 / 20 : 0, 15));
    expect((1 / 5) / 4).toBe(1 / 20);
    expect(5 * (1 / 20) * 2 + 5 * (-1 / 20) * -2).toBeCloseTo(1, 15);
    expect([fixed(bmReg.squaredWeights, 3), fixed(bmSort.squaredWeights, 3)]).toEqual(['0.020', '0.025']);
  });

  test('playground: the quarterly sample and the in-sample correlations', () => {
    const { ff25: m25, ff3: m3 } = split1995;
    expect([m25.first, m25.last, m25.dates.length]).toEqual(['1963-Q3', '2026-Q2', 252]);
    expect(m25.inSample.weights.length + 1).toBe(26);
    expect(m3.inSample.weights.length + 1).toBe(4);
    expect([fixed(m25.inSample.correlation, 2), fixed(m3.inSample.correlation, 2)]).toEqual(['0.40', '0.09']);
  });

  test('playground: noise benchmarks and the split samples', () => {
    const { ff25: m25, ff3: m3 } = split1995;
    expect(fixed(Math.sqrt(25 / (252 - 1)), 2)).toBe('0.32');
    expect([m25.split.label, m25.split.index]).toEqual(['1995-Q1', 126]);
    expect(m25.dates.length - m25.split.index).toBe(126);
    expect(fixed(Math.sqrt(25 / (126 - 1)), 2)).toBe('0.45');
    expect([fixed(m25.split.correlation, 2), fixed(m25.split.laterCorrelation, 2)]).toEqual(['0.55', '-0.15']);
    expect([split1975.split.label, split1975.split.index]).toEqual(['1975-Q1', 46]);
    expect([fixed(split1975.split.correlation, 2), fixed(split1975.split.laterCorrelation, 2)]).toEqual(['0.79', '-0.05']);
    expect([fixed(m3.split.correlation, 2), fixed(m3.split.laterCorrelation, 2)]).toEqual(['0.19', '-0.01']);
  });

  test('playground: the two 2020 quarters, and the correlations without the four quarters of 2020', () => {
    const panel = quarterlyPanel(data, WINDOWS.full);
    const at = (date: string) => panel.dc[panel.dates.indexOf(date)];
    expect([fixed(at('2020-04-01') * 100, 1), fixed(at('2020-07-01') * 100, 1)]).toEqual(['-10.1', '7.4']);
    // Every other quarter moves less than 4%, so the widget's cut at ±4% touches only these two.
    expect(panel.dc.filter((v, t) => !panel.dates[t].startsWith('2020') && Math.abs(v) > 0.04)).toHaveLength(0);
    const keep = panel.dates.map((d) => !d.startsWith('2020'));
    const dc = panel.dc.filter((_, t) => keep[t]);
    const split = panel.dates.filter((_, t) => keep[t]).indexOf('1995-01-01');
    expect(split).toBe(126);
    const ff25Fit = mimickingPortfolio(dc, panel.excess.filter((_, t) => keep[t]), { split });
    const ff3Fit = mimickingPortfolio(dc, panel.factors.filter((_, t) => keep[t]), { split });
    expect([fixed(ff25Fit.correlation, 2), fixed(ff25Fit.outOfSample!.correlation, 2)]).toEqual(['0.39', '-0.07']);
    expect([fixed(ff3Fit.correlation, 2), fixed(ff3Fit.outOfSample!.correlation, 2)]).toEqual(['0.16', '0.13']);
  });
});
