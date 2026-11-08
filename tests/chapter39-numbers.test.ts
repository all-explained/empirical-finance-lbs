/**
 * Every number in the prose of chapter 39, recomputed from fred-consumption-annual and goyal-welch-annual and from
 * the seeded centuries, through the library and the widgets' sample helpers. If the data or the library changes,
 * this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import consumption from '../src/data/series/fred-consumption-annual.json';
import goyalWelchAnnual from '../src/data/series/goyal-welch-annual.json';
import cay from '../src/data/series/fred-cay-quarterly.json';
import goyalWelchMonthly from '../src/data/series/goyal-welch-monthly.json';
import { requiredDisasterProbability, simulateDisasterCentury } from '../src/lib/finance/disasters';
import { arithmeticMean } from '../src/lib/finance/returns';
import {
  DEFAULT_CENTURY_SEED, disasterLottery, emptyCenturyShare, entropyViews, LOTTERY, LOTTERY_DEFAULTS, lotteryParams,
  type DisasterData,
} from '../src/components/plots/disasterSample';
import { puzzleViews, type PuzzleData } from '../src/components/plots/puzzleSample';

const data = { 'fred-consumption-annual': consumption, 'goyal-welch-annual': goyalWelchAnnual } as unknown as DisasterData;
const { full, jg } = entropyViews(data);
const annual = puzzleViews({ ...data, 'fred-cay-quarterly': cay, 'goyal-welch-monthly': goyalWelchMonthly } as unknown as PuzzleData).annual;
const pct = (v: number, digits: number) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const { gamma, probability, size } = LOTTERY_DEFAULTS;
const params = lotteryParams(gamma, probability, size);
const lottery = disasterLottery(DEFAULT_CENTURY_SEED, params);
const at = (view: typeof full, g: number) => view.profile.points.find((p) => p.gamma === g)!;
const yearWeight = (view: typeof full, g: number, year: number) => view.years.length * at(view, g).weights[view.years.indexOf(year)];
const CENTURIES = 10000;

describe('chapter 39 prose numbers', () => {
  test('hook: the puzzle of Chapter 35', () => {
    expect([pct(annual.moments.mean.re, 2), pct(annual.moments.sd.dc, 2)]).toEqual(['6.28', '2.17']);
    expect([annual.first, annual.last]).toEqual(['1930', '2025']);
    expect(fixed(annual.gamma.fromSharpe, 0)).toBe('15');
  });

  test('intuition: the default economy and its closed forms', () => {
    expect([LOTTERY.mean, LOTTERY.sd, LOTTERY.stockSd, LOTTERY.years]).toEqual([0.02, 0.02, 0.16, 100]);
    expect([gamma, pct(probability, 1), pct(size, 0)]).toEqual([4, '1.7', '40']);
    expect(params.claim).toEqual({ sd: 0.16, cov: 0, loss: 0.4 });
    expect([pct(lottery.pricing.premium.total, 2), pct(lottery.pricing.riskFree, 2)]).toEqual(['4.14', '-2.13']);
    const noDisasters = disasterLottery(DEFAULT_CENTURY_SEED, lotteryParams(gamma, 0, size)).pricing;
    expect([pct(noDisasters.premium.total, 2), pct(noDisasters.riskFree, 2)]).toEqual(['0.00', '8.69']);
    // (1 − 0.4)^{−4}: "7.7", "almost eight times over"; and its excess over 1 in the approximation, "6.7".
    expect([fixed(0.6 ** -4, 1), fixed(0.6 ** -4 - 1, 1)]).toEqual(['7.7', '6.7']);
  });

  test('intuition: the default century and the share of empty centuries', () => {
    expect(DEFAULT_CENTURY_SEED).toBe(2);
    expect([lottery.century.disasters, lottery.disasterYears]).toEqual([2, [25, 39]]);
    expect(pct(lottery.century.premium, 2)).toBe('3.18');
    expect(pct(emptyCenturyShare(params, CENTURIES), 1)).toBe('17.9');
  });

  test('formalisation: the premium and the needed disaster chance', () => {
    expect(pct(probability * size * (0.6 ** -gamma - 1), 2)).toBe('4.57');
    expect(pct(disasterLottery(DEFAULT_CENTURY_SEED, lotteryParams(gamma, probability, 0.3)).pricing.premium.total, 2)).toBe('1.52');
    const target = annual.moments.mean.re;
    const needed = (b: number) => requiredDisasterProbability(target, lotteryParams(gamma, 0, b))!;
    expect([pct(needed(0.4), 2), pct(needed(0.3), 2)]).toEqual(['2.72', '8.72']);
    expect(fixed(1 / needed(0.3), 0)).toBe('11');
  });

  test('formalisation: the peso problem', () => {
    expect(pct((1 - probability) ** LOTTERY.years, 1)).toBe('18.0');
    const empty = Array.from({ length: CENTURIES }, (_, k) => simulateDisasterCentury(k + 1, params, LOTTERY.years))
      .filter((century) => century.disasters === 0);
    expect(pct(arithmeticMean(empty.map((century) => century.premium)), 2)).toBe('4.81');
  });

  test('formalisation: the annual sample and its four worst years', () => {
    expect([full.years.length, full.years[0], full.years.at(-1)]).toEqual([96, 1930, 2025]);
    expect(full.profile.worstYears.map((t) => full.years[t])).toEqual([1930, 1932, 1933, 2020]);
    // On this sample the sign of g_t is the sign of R^e_t, so weights exist at every γ of the grid.
    expect(full.profile.points.length).toBe(101);
    expect(jg.profile.points.length).toBe(101);
  });

  test('formalisation: the table across γ', () => {
    const gammas = [0, 4, 10, 20, 30];
    expect(gammas.map((g) => fixed(at(full, g).entropy, 4))).toEqual(['0.0862', '0.0740', '0.0541', '0.0243', '0.0062']);
    expect(gammas.map((g) => pct(at(full, g).worstWeight, 1))).toEqual(['4.7', '4.9', '5.0', '5.1', '4.7']);
    expect(gammas.map((g) => fixed(at(full, g).statistic, 2))).toEqual(['14.39', '12.04', '8.63', '4.01', '1.10']);
    const digits = [4, 4, 4, 3, 2];
    expect(gammas.map((g, k) => fixed(at(full, g).pValue, digits[k]))).toEqual(['0.0001', '0.0005', '0.0033', '0.045', '0.29']);
    expect(pct(4 / full.years.length, 1)).toBe('4.2');
  });

  test('formalisation: the estimates, in full and to 2009', () => {
    expect([fixed(full.profile.best.entropy, 1), fixed(full.profile.best.statistic, 1)]).toEqual(['42.8', '42.8']);
    expect([jg.years[0], jg.years.at(-1)]).toEqual([1930, 2009]);
    expect([fixed(jg.profile.best.entropy, 1), fixed(jg.profile.best.statistic, 1)]).toEqual(['35.7', '35.7']);
    expect([fixed(at(jg, 10).statistic, 2), fixed(at(jg, 10).pValue, 3)]).toEqual(['4.85', '0.028']);
  });

  test('formalisation: where the weight goes at γ = 10', () => {
    expect(fixed(yearWeight(full, 10, 1931), 2)).toBe('3.12');
    expect(pct(at(full, 10).weights[full.years.indexOf(1931)], 2)).toBe('3.25');
    expect(pct(1 / full.years.length, 2)).toBe('1.04');
    expect([fixed(yearWeight(full, 10, 1930), 2), fixed(yearWeight(full, 10, 2008), 2)]).toEqual(['2.25', '1.93']);
    expect(fixed(yearWeight(full, 10, 1933), 2)).toBe('0.34');
    // "Then come 1930 and 2008": the three largest weights at γ = 10.
    const order = full.years.map((year, t) => ({ year, w: at(full, 10).weights[t] })).sort((a, b) => b.w - a.w);
    expect(order.slice(0, 3).map((o) => o.year)).toEqual([1931, 1930, 2008]);
  });

  test('playground: the try-this prompts', () => {
    // Towards γ = 43 the weights become almost equal and the test stops rejecting at 5%.
    expect(at(full, 43).entropy).toBeLessThan(1e-4);
    expect([at(full, 10).pValue < 0.05, at(full, 43).pValue < 0.05]).toEqual([true, false]);
    // After 2009 the premium was above its 1930–2009 mean.
    const after = full.sample.re.slice(jg.years.length);
    expect(arithmeticMean(after)).toBeGreaterThan(arithmeticMean(jg.sample.re));
  });

  test('check yourself', () => {
    expect(0.5 ** -4).toBe(16);
    expect(pct(0.99 ** 100, 0)).toBe('37');
  });
});
