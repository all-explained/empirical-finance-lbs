/**
 * Every number in the prose of chapter 35, recomputed from fred-consumption-annual, goyal-welch-annual,
 * fred-cay-quarterly, goyal-welch-monthly and ff3-monthly through the library and the widgets' sample helpers.
 * If the data or the library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import consumption from '../src/data/series/fred-consumption-annual.json';
import cay from '../src/data/series/fred-cay-quarterly.json';
import ff3 from '../src/data/series/ff3-monthly.json';
import goyalWelchAnnual from '../src/data/series/goyal-welch-annual.json';
import goyalWelchMonthly from '../src/data/series/goyal-welch-monthly.json';
import type { Series } from '../src/lib/data/series';
import {
  annualConsumption, annualSample, crraSdfMoments, impliedRiskAversion, impliedRiskFree, impliedTimeDiscount,
  puzzleMoments,
} from '../src/lib/finance/consumptionPuzzle';
import { crraSdf } from '../src/lib/finance/sdf';
import { meanStandardError } from '../src/lib/stats/moments';
import { DEFAULT_DELTA, powerUtilityPath, puzzleViews, type PuzzleData } from '../src/components/plots/puzzleSample';
import { marketSharpe, SAMPLE_STARTS } from '../src/components/plots/sdfSamples';

const data = {
  'fred-consumption-annual': consumption, 'goyal-welch-annual': goyalWelchAnnual,
  'fred-cay-quarterly': cay, 'goyal-welch-monthly': goyalWelchMonthly,
} as unknown as PuzzleData;
const views = puzzleViews(data);
const { annual, postwar, quarterly } = views;
const all = [annual, postwar, quarterly];
const market = marketSharpe(ff3 as unknown as Series<'ff3-monthly'>, SAMPLE_STARTS[0]);
const pct = (v: number, digits: number) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const rf = (delta: number, gamma: number, view = annual) =>
  impliedRiskFree(delta, gamma, view.moments.mean.dc, view.moments.sd.dc);
const matchingDelta = (gamma: number, view = annual) =>
  impliedTimeDiscount(view.moments.mean.rf, gamma, view.moments.mean.dc, view.moments.sd.dc);
const lowest = powerUtilityPath(annual.moments.mean.dc, annual.moments.sd.dc, market.sharpe).lowest!;

describe('chapter 35 prose numbers', () => {
  test('hook: the annual sample, 1930–2025', () => {
    const m = annual.moments;
    expect([annual.first, annual.last, annual.observations]).toEqual(['1930', '2025', 96]);
    expect([pct(m.mean.r, 2), pct(m.mean.rf, 2), pct(m.mean.re, 2), pct(m.sd.r, 1)]).toEqual(['6.52', '0.24', '6.28', '19.2']);
    expect(pct(m.mean.re, 1)).toBe('6.3');
    expect([pct(m.mean.dc, 2), pct(m.sd.dc, 2)]).toEqual(['1.83', '2.17']);
    // "about 2% more than the year before, give or take 2%".
    expect([pct(m.mean.dc, 0), pct(m.sd.dc, 0)]).toEqual(['2', '2']);
  });

  test('intuition: the power-utility curve against the bound', () => {
    expect(fixed(crraSdfMoments(DEFAULT_DELTA, 5, annual.moments.mean.dc, annual.moments.sd.dc).ratio, 2)).toBe('0.11');
    expect(fixed(market.sharpe, 2)).toBe('0.45');
    expect(fixed(lowest.gamma, 1)).toBe('20.0');
    expect([fixed(crraSdf(1, 20, 0.98), 2), fixed(crraSdf(1, 5, 0.98), 2)]).toEqual(['1.50', '1.11']);
    const lowestRate = rf(DEFAULT_DELTA, lowest.gamma);
    expect(pct(lowestRate, 1)).toBe('28.2');
    expect(Math.round((lowestRate - annual.moments.mean.rf) * 100)).toBe(28);
  });

  test('formalisation: the table of three samples', () => {
    expect(all.map((v) => [v.first, v.last])).toEqual([['1930', '2025'], ['1947', '2025'], ['1952-Q2', '2025-Q4']]);
    expect(all.map((v) => v.observations)).toEqual([96, 79, 295]);
    expect(all.map((v) => pct(v.moments.mean.dc, 2))).toEqual(['1.83', '1.85', '1.94']);
    expect(all.map((v) => pct(v.moments.sd.dc, 2))).toEqual(['2.17', '1.53', '1.77']);
    expect(all.map((v) => fixed(v.moments.correlation, 3))).toEqual(['0.072', '0.037', '0.046']);
    expect(all.map((v) => pct(v.moments.mean.re, 2))).toEqual(['6.28', '7.13', '6.72']);
    expect(all.map((v) => pct(v.moments.sd.r, 1))).toEqual(['19.2', '16.7', '16.1']);
    expect(all.map((v) => fixed(v.gamma.fromCovariance, 0))).toEqual(['271', '898', '618']);
    expect(all.map((v) => fixed(v.gamma.fromSharpe, 1))).toEqual(['15.0', '28.6', '23.9']);
    expect(all.map((v) => pct(v.moments.mean.rf, 2))).toEqual(['0.24', '0.47', '0.61']);
  });

  test('formalisation: reading the table', () => {
    expect(fixed(annual.moments.sharpe, 2)).toBe('0.33');
    // "15 to 29" and correlations "from 0.04 to 0.07".
    expect(all.map((v) => fixed(v.gamma.fromSharpe, 0))).toEqual(['15', '29', '24']);
    expect(all.map((v) => fixed(v.moments.correlation, 2))).toEqual(['0.07', '0.04', '0.05']);
  });

  test('formalisation: what the evidence can and cannot show', () => {
    const sample = annualSample(annualConsumption(data['fred-consumption-annual']), data['goyal-welch-annual']);
    expect(pct(meanStandardError(sample.re), 2)).toBe('1.97');
    expect(fixed(2 / Math.sqrt(annual.observations), 2)).toBe('0.20');
    const nextYear = puzzleMoments(
      annualSample(annualConsumption(data['fred-consumption-annual']), data['goyal-welch-annual'], { timing: 'next-year' }), 1,
    ).annual;
    const gamma = impliedRiskAversion(nextYear);
    expect([fixed(nextYear.correlation, 2), fixed(gamma.fromCovariance, 0), fixed(gamma.fromSharpe, 1)]).toEqual(['0.53', '36', '14.3']);
  });

  test('formalisation: the risk-free rate puzzle', () => {
    const gamma = annual.gamma.fromSharpe;
    expect(pct(rf(DEFAULT_DELTA, gamma), 1)).toBe('23.2');
    expect(pct(rf(DEFAULT_DELTA, 1), 2)).toBe('2.81');
    expect(fixed(matchingDelta(gamma), 3)).toBe('1.245');
    expect(fixed(matchingDelta(postwar.gamma.fromSharpe, postwar), 3)).toBe('1.536');
    expect(matchingDelta(annual.gamma.fromCovariance).toExponential(1)).toBe('4.5e-6');
  });

  test('playground: the try-this prompts', () => {
    expect(pct(rf(DEFAULT_DELTA, 15) - rf(1, 15), 1)).toBe('1.0');
    expect(all.map((v) => fixed(matchingDelta(5, v), 2))).toEqual(['1.09', '1.09', '1.09']);
  });

  test('check yourself and recap', () => {
    expect(fixed(0.45 / 0.015, 0)).toBe('30');
    expect(fixed(annual.gamma.fromCovariance / annual.gamma.fromSharpe, 0)).toBe('18');
    expect(all.map((v) => pct(rf(DEFAULT_DELTA, v.gamma.fromSharpe, v), 0))).toEqual(['23', '44', '38']);
    expect(Math.max(...all.map((v) => v.moments.mean.rf))).toBeLessThan(0.01);
  });
});
