/**
 * Every number in the prose of chapter 29 that comes from our data or simulations, recomputed through the
 * library and the widgets' sample helpers: the seeded strategy search of multipleTestingSample and the
 * original-sample t-statistics of osap-ls-monthly. Numbers taken from readings (316, t > 3, 2.78, 3.18, 452,
 * 65%, 82%) are cited with their page in the prose.
 */
import { describe, expect, test } from 'vitest';
import osap from '../src/data/series/osap-ls-monthly.json';
import docs from '../src/data/series/osap-signals.json';
import type { Series } from '../src/lib/data/series';
import type { OsapSignals } from '../src/lib/data/osap-signals';
import { countAbove } from '../src/lib/finance/zoo';
import { cdf, invCdf } from '../src/lib/math/normal';
import {
  benjaminiHochbergYekutieli, bonferroni, discoveryCounts, holm, pValues, yekutieliConstant,
} from '../src/lib/stats/multipleTesting';
import { zooSummaries, type ZooData } from '../src/components/plots/zooSample';
import {
  DEFAULT_COUNT, DEFAULT_SEED, DEFAULT_TRUE_SHARE, MONTHS, Q, ruleLine, strategySearch, TRUE_SHARPE, type Rule,
} from '../src/components/plots/multipleTestingSample';

const search = strategySearch(DEFAULT_SEED, DEFAULT_COUNT, DEFAULT_TRUE_SHARE);
const half = strategySearch(DEFAULT_SEED, DEFAULT_COUNT, 0.5);
const none = strategySearch(DEFAULT_SEED, DEFAULT_COUNT, 0);
const at = (s: typeof search, rule: Rule) => discoveryCounts(s.t, s.isTrue, ruleLine(s.t, rule));
const found = (c: ReturnType<typeof at>) => c.trueDiscoveries + c.falseDiscoveries;

const zoo = zooSummaries({ returns: { original: osap as unknown as Series<'osap-ls-monthly'> }, signals: (docs as unknown as OsapSignals).signals } as ZooData, 'original');
const zooT = zoo.map((s) => s.original!.t);
const zooP = pValues(zooT);
const above = (line: number) => countAbove(zoo, line, 'original');

describe('chapter 29 prose numbers', () => {
  test('hook: the seeded search at the textbook line', () => {
    expect([DEFAULT_COUNT, MONTHS / 12, TRUE_SHARPE, Q]).toEqual([300, 50, 0.5, 0.05]);
    expect([search.isTrue.filter(Boolean).length, search.isTrue.filter((r) => !r).length]).toEqual([30, 270]);
    const textbook = at(search, 'single');
    expect([found(textbook), textbook.falseDiscoveries, textbook.trueDiscoveries]).toEqual([40, 12, 28]);
    expect((textbook.falseDiscoveryProportion * 100).toFixed(0)).toBe('30');
  });

  test('intuition: the bar of 3, luck among the nulls and the expected t of a true strategy', () => {
    const textbook = at(search, 'single');
    const three = at(search, 'three');
    expect([three.falseDiscoveries, textbook.misses, three.misses]).toEqual([1, 2, 9]);
    expect(270 * 0.05).toBe(13.5);
    expect(textbook.expectedFalseDiscoveries.toFixed(1)).toBe('13.5');
    expect((TRUE_SHARPE * Math.sqrt(MONTHS / 12)).toFixed(2)).toBe('3.54');
  });

  test('formalisation: expected false discoveries, Bonferroni, Holm and BHY', () => {
    expect(invCdf(0.975).toFixed(2)).toBe('1.96');
    expect((2 * cdf(-3) * 100).toFixed(2)).toBe('0.27');
    expect(at(search, 'three').expectedFalseDiscoveries.toFixed(2)).toBe('0.73');
    // Bonferroni at n = 300: the p-value bar and the |t| it implies.
    expect((Q / DEFAULT_COUNT).toFixed(6)).toBe('0.000167');
    expect(invCdf(1 - Q / DEFAULT_COUNT / 2).toFixed(2)).toBe('3.76');
    const bonf = at(search, 'bonferroni');
    const holmCounts = at(search, 'holm');
    expect([bonf.trueDiscoveries, bonf.falseDiscoveries]).toEqual([12, 0]);
    expect([holmCounts.trueDiscoveries, holmCounts.falseDiscoveries]).toEqual([12, 0]);
    // At a true share of 50%, Holm gains on Bonferroni, and BHY gains on both.
    expect([found(at(half, 'bonferroni')), found(at(half, 'holm')), at(half, 'holm').falseDiscoveries]).toEqual([67, 71, 0]);
    expect(yekutieliConstant(DEFAULT_COUNT).toFixed(2)).toBe('6.28');
    const bhy = at(search, 'bhy');
    expect([bhy.trueDiscoveries, bhy.falseDiscoveries]).toEqual([15, 0]);
    const bhyHalf = at(half, 'bhy');
    expect([bhyHalf.trueDiscoveries, bhyHalf.falseDiscoveries]).toEqual([111, 1]);
  });

  test('playground: the published zoo against each rule', () => {
    expect(zoo.length).toBe(165);
    expect([above(3), above(1.96)]).toEqual([107, 158]);
    const rules = { bonferroni: bonferroni(zooP, Q), holm: holm(zooP, Q), bhy: benjaminiHochbergYekutieli(zooP, Q) };
    expect([rules.bonferroni.count, rules.holm.count, rules.bhy.count]).toEqual([81, 88, 123]);
    expect([rules.bonferroni.tCutoff!.toFixed(2), rules.holm.tCutoff!.toFixed(2), rules.bhy.tCutoff!.toFixed(2)]).toEqual(['3.64', '3.45', '2.73']);
    // The lines the reader drags to in ZooChart reproduce each rule's count.
    expect([above(2.72), above(3.45), above(3.64)]).toEqual([123, 88, 81]);
    expect(165 - 123).toBe(42);
    // A search with no true alpha: every discovery at 1.96 is false, and Bonferroni finds none.
    const textbook = at(none, 'single');
    expect([textbook.falseDiscoveries, textbook.trueDiscoveries, found(at(none, 'bonferroni'))]).toEqual([14, 0, 0]);
  });

  test('check yourself: Bonferroni at n = 500', () => {
    expect(Q / 500).toBeCloseTo(0.0001, 12);
  });
});
