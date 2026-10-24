/**
 * Every number in the prose of chapter 16, recomputed from ff25-size-bm-monthly and ff3-monthly
 * through the library and the widgets' sample helper. If the data or the library changes,
 * this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import ff25 from '../src/data/series/ff25-size-bm-monthly.json';
import type { Series } from '../src/lib/data/series';
import { fCritical, factorTest, frontierPicture } from '../src/components/plots/factorTestSample';

const data = { ff3: ff3 as unknown as Series<'ff3-monthly'>, ff25: ff25 as unknown as Series<'ff25-size-bm-monthly'> };
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const capm = factorTest(data, 'capm', '1963-07-01');
const ff = factorTest(data, 'ff3', '1963-07-01');
const SG = capm.names.indexOf('ME1-BM1');
const SV = capm.names.indexOf('ME1-BM5');
const excluding = (t: typeof capm) => t.alpha.filter((a, j) => Math.abs(a) > t.half[j]).length;
const meanAbs = (t: typeof capm) => t.alpha.reduce((sum, a) => sum + Math.abs(a), 0) / t.N;
const scientific = (p: number) => p.toExponential(1);

describe('chapter 16 prose numbers', () => {
  test('hook: CAPM alphas from 1963-07, and the joint verdicts', () => {
    expect([capm.first, capm.last, capm.T, capm.N]).toEqual(['1963-07', '2026-08', 758, 25]);
    expect([percent(capm.alpha[SG], 1), fixed(capm.alphaT[SG], 2)]).toEqual(['-6.3', '-2.94']);
    expect([percent(capm.alpha[SV], 1), fixed(capm.alphaT[SV], 2)]).toEqual(['5.7', '3.17']);
    expect(excluding(capm)).toBe(10);
    expect(25 * 0.05).toBe(1.25);
    expect([percent(meanAbs(capm), 2), percent(meanAbs(ff), 2)]).toEqual(['2.36', '1.04']);
    expect([scientific(capm.grs.pValue), scientific(ff.grs.pValue)]).toEqual(['7.4e-11', '8.3e-9']);
  });

  test('intuition: small growth under the CAPM and FF3', () => {
    expect([percent(capm.alpha[SG], 2), percent(ff.alpha[SG], 2)]).toEqual(['-6.28', '-5.58']);
    expect([percent(capm.half[SG], 2), percent(ff.half[SG], 2)]).toEqual(['4.18', '2.16']);
    expect([fixed(capm.alphaT[SG], 2), fixed(ff.alphaT[SG], 2)]).toEqual(['-2.94', '-5.06']);
    expect([percent(capm.residualVol[SG], 1), percent(ff.residualVol[SG], 1)]).toEqual(['16.8', '8.6']);
  });

  test('formalisation: GRS for FF3, T > N + K, and the Sharpe identity', () => {
    expect([ff.grs.df1, ff.grs.df2]).toEqual([25, 730]);
    expect(fixed(ff.critical5, 2)).toBe('1.52');
    expect([fixed(ff.alphaQuadratic, 3), fixed(ff.grs.sharpeFactors2, 3)]).toEqual(['0.129', '0.036']);
    expect(fixed(ff.grs.statistic, 2)).toBe('3.64');
    expect(25 + 3 + 1).toBe(29);
    expect(factorTest(data, 'capm', '2015-01-01').T).toBe(140);
    const pictures = { capm: frontierPicture(data, 'capm', '1963-07-01', [0.1]), ff3: frontierPicture(data, 'ff3', '1963-07-01', [0.1]) };
    expect([fixed(pictures.capm.sharpeFactors, 2), fixed(pictures.ff3.sharpeFactors, 2)]).toEqual(['0.47', '0.65']);
    expect([fixed(pictures.capm.sharpeAll, 2), fixed(pictures.ff3.sharpeAll, 2)]).toEqual(['1.40', '1.41']);
    for (const t of [capm, ff]) expect(t.alphaQuadratic).toBeCloseTo(t.grs.sharpeAll2 - t.grs.sharpeFactors2, 10);
    expect([fixed(capm.alphaQuadratic, 3), fixed(capm.grs.sharpeAll2, 3), fixed(capm.grs.sharpeFactors2, 3)]).toEqual(['0.146', '0.164', '0.018']);
    expect([fixed(ff.alphaQuadratic, 3), fixed(ff.grs.sharpeAll2, 3), fixed(ff.grs.sharpeFactors2, 3)]).toEqual(['0.129', '0.165', '0.036']);
  });

  test('playground: a short sample, the full sample, and power', () => {
    const short = factorTest(data, 'capm', '2015-01-01');
    expect([short.T, percent(meanAbs(short), 2)]).toEqual([140, '3.18']);
    expect([fixed(short.grs.statistic, 2), fixed(short.critical5, 2), fixed(short.grs.pValue, 3)]).toEqual(['1.52', '1.60', '0.073']);
    expect(excluding(short)).toBe(0);
    const full = { capm: factorTest(data, 'capm', '1926-07-01'), ff3: factorTest(data, 'ff3', '1926-07-01') };
    expect([full.capm.T, fixed(full.capm.grs.statistic, 2), fixed(full.ff3.grs.statistic, 2)]).toEqual([1202, '3.40', '3.37']);
    expect(fixed(frontierPicture(data, 'capm', '2015-01-01', [0.1]).sharpeAll, 2)).toBe('2.19');
    // The smallest α̂'Σ̂_ε⁻¹α̂ that rejects FF3 at 5%: invert GRS at its critical value, SR²_f held fixed.
    const threshold = (T: number) => fCritical(0.05, 25, T - 28) * 25 / (T - 28) * (1 + ff.grs.sharpeFactors2);
    expect(fixed(threshold(758), 3)).toBe('0.054');
    const ratio = threshold(4 * 758) / threshold(758);
    expect(ratio).toBeGreaterThan(0.22);
    expect(ratio).toBeLessThan(0.27);
  });

  test('quiz: degrees of freedom', () => {
    expect([25, 100 - 25 - 3]).toEqual([25, 72]);
  });
});
