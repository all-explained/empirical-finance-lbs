/**
 * Every number in the prose of chapter 7, recomputed from ff3-monthly and ff25-size-bm-monthly
 * through the library. If the data or the library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import ff3Json from '../src/data/series/ff3-monthly.json';
import ff25Json from '../src/data/series/ff25-size-bm-monthly.json';
import type { Series } from '../src/lib/data/series';
import { arithmeticMean, sampleVariance } from '../src/lib/finance/returns';
import { annualiseMean, annualiseVolatility, meanStandardError } from '../src/lib/stats/moments';
import { annualMoments, capmSample, frontierView, PERIODS, smlView, type Portfolio } from '../src/components/plots/capmSample';

const ff3 = ff3Json as unknown as Series<'ff3-monthly'>;
const ff25 = ff25Json as unknown as Series<'ff25-size-bm-monthly'>;
const post = capmSample(ff3, ff25, PERIODS.post1963.start);
const full = capmSample(ff3, ff25, PERIODS.full.start);
const sml = smlView(post);
const smlFull = smlView(full);
const col = (name: Portfolio) => post.assets.map((row) => row[post.names.indexOf(name)]);
const at = (name: Portfolio) => post.names.indexOf(name);
const pct = (v: number, digits = 1) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const CORNERS: Portfolio[] = ['ME1-BM1', 'ME1-BM5', 'ME5-BM1', 'ME5-BM5'];

describe('chapter 7 prose numbers', () => {
  test('samples', () => {
    expect([post.dates[0], post.dates.at(-1), post.dates.length]).toEqual(['1963-07-01', '2026-08-01', 758]);
    expect(fixed(post.dates.length / 12, 0)).toBe('63'); // "63 years of data"
    expect([full.dates[0], full.dates.at(-1)]).toEqual(['1926-07-01', '2026-08-01']);
  });

  test('hook: small growth against small value, 1963–2026', () => {
    const sg = col('ME1-BM1');
    const sv = col('ME1-BM5');
    expect(pct(annualiseMean(arithmeticMean(sg)))).toBe('4.0');
    expect(pct(annualiseMean(arithmeticMean(sv)))).toBe('13.4');
    expect(pct(annualiseVolatility(Math.sqrt(sampleVariance(sg))))).toBe('27.6');
    expect(pct(annualiseVolatility(Math.sqrt(sampleVariance(sv))))).toBe('21.7');
    const gap = sv.map((v, t) => v - sg[t]);
    const [mean, se] = [annualiseMean(arithmeticMean(gap)), annualiseMean(meanStandardError(gap))];
    expect([pct(mean), pct(se), fixed(mean / se, 0)]).toEqual(['9.4', '1.9', '5']);
  });

  test('frontier widget: four corners, tangency weights and a −2 pp shift', () => {
    const m = annualMoments(post, CORNERS);
    const base = frontierView(m.mean, m.Sigma, m.rf, [])?.tangency;
    expect(base?.weights.map((w) => pct(w, 0))).toEqual(['-117', '149', '79', '-12']);
    expect(fixed(base!.sharpe, 2)).toBe('1.04');
    const shifted = [...m.mean];
    shifted[1] -= 0.02;
    const moved = frontierView(shifted, m.Sigma, m.rf, [])?.tangency;
    expect([pct(moved!.weights[1], 0), fixed(moved!.sharpe, 2)]).toEqual(['126', '0.90']);
    expect(pct(sml.meanSE[at('ME1-BM5')])).toBe('2.7'); // standard error of small value's average
  });

  test('security market line, 1963–2026', () => {
    const sg = at('ME1-BM1');
    const sv = at('ME1-BM5');
    expect([fixed(sml.beta[sg], 2), pct(sml.beta[sg] * sml.premium), pct(sml.alpha[sg]), fixed(sml.alphaT[sg], 2)])
      .toEqual(['1.42', '10.2', '-6.3', '-2.94']);
    expect([fixed(sml.beta[sv], 2), pct(sml.alpha[sv]), fixed(sml.alphaT[sv], 2)]).toEqual(['1.06', '5.7', '3.17']);
    expect([pct(sml.premium), pct(annualiseMean(meanStandardError(post.market)))]).toEqual(['7.2', '1.9']);
    expect(pct(sml.fit.slope)).toBe('-4.3');
    expect([fixed(Math.min(...sml.beta), 2), fixed(Math.max(...sml.beta), 2)]).toEqual(['0.86', '1.42']);
    expect([pct(Math.min(...sml.meanExcess)), pct(Math.max(...sml.meanExcess))]).toEqual(['4.0', '13.4']);
    expect([pct(Math.min(...sml.alpha)), pct(Math.max(...sml.alpha))]).toEqual(['-6.3', '5.7']);
    // In every size group, the value portfolio (BM5) has a higher alpha than the growth portfolio (BM1).
    for (let size = 1; size <= 5; size++) {
      expect(sml.alpha[at(`ME${size}-BM5` as Portfolio)]).toBeGreaterThan(sml.alpha[at(`ME${size}-BM1` as Portfolio)]);
    }
  });

  test('security market line, 1926–2026', () => {
    expect([pct(smlFull.premium), pct(smlFull.fit.slope), pct(smlFull.fit.intercept)]).toEqual(['8.3', '4.8', '4.9']);
    // "The dots move closer to the CAPM line": smaller mean absolute alpha than since 1963.
    const meanAbs = (a: number[]) => arithmeticMean(a.map(Math.abs));
    expect(meanAbs(smlFull.alpha)).toBeLessThan(meanAbs(sml.alpha));
  });
});
