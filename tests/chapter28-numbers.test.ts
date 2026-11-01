/**
 * Every number in the prose of chapter 28, recomputed from ff25-size-bm-monthly, ff3-monthly and
 * ff30-industry-monthly and from the seeded simulations, through the widgets' helpers and the library.
 * Numbers quoted from Lewellen, Nagel & Shanken (2010) are cited in the prose with their pages and are not
 * recomputed here.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import ff25 from '../src/data/series/ff25-size-bm-monthly.json';
import ff30 from '../src/data/series/ff30-industry-monthly.json';
import gsw from '../src/data/series/gsw-zero-coupon.json';
import type { Series } from '../src/lib/data/series';
import { r2ConfidenceInterval, tradedFactorRestriction } from '../src/lib/finance/skeptical';
import { pca } from '../src/lib/stats/pca';
import { presetPanel } from '../src/components/plots/pcaSample';
import {
  modelR2, RANDOM_FACTORS, RANDOM_SAMPLES, RANDOM_SEED, randomView, skepticalPanel, type Assets, type Model,
  type SkepticalData,
} from '../src/components/plots/skepticalSample';

const data: SkepticalData = {
  ff3: ff3 as unknown as Series<'ff3-monthly'>,
  ff25: ff25 as unknown as Series<'ff25-size-bm-monthly'>,
  ff30: ff30 as unknown as Series<'ff30-industry-monthly'>,
};
const panel = skepticalPanel(data);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
/** A monthly decimal mean in percent a year. */
const yearly = (v: number) => (v * 1200).toFixed(1);
const ff3R2 = { ff25: modelR2(panel, 'ff25', 'ff3'), ff55: modelR2(panel, 'ff55', 'ff3') };
// 200 two-pass draws (55 assets) or 100 bootstrap samples take several seconds each.
const SLOW = 180_000;

describe('chapter 28 prose numbers', () => {
  test('the sample: 758 months, 25 and 55 assets', () => {
    expect([panel.first, panel.last, panel.excess.ff25.length]).toEqual(['1963-07', '2026-08', 758]);
    expect([panel.excess.ff25[0].length, panel.excess.ff55[0].length]).toEqual([25, 55]);
  });

  test('hook and playground: random two-factor models with noise share 0.75', () => {
    expect([RANDOM_SAMPLES, RANDOM_FACTORS, RANDOM_SEED]).toEqual([200, 2, 2010]);
    expect([fixed(ff3R2.ff25.ols, 3), fixed(modelR2(panel, 'ff25', 'capm').ols, 3)]).toEqual(['0.663', '0.078']);
    const view = randomView(panel, 'ff25', 0.75, RANDOM_SEED, ff3R2.ff25);
    expect(fixed(view.fit.median.ols, 3)).toBe('0.613');
    expect(percent(view.fit.shareAbove.ols, 1)).toBe('87.5');
    expect(fixed(ff3R2.ff25.gls, 3)).toBe('0.204');
    expect(fixed(view.fit.median.gls, 3)).toBe('0.120');
  }, SLOW);

  test('try this: noise share 1, and the 55 assets', () => {
    expect(fixed(randomView(panel, 'ff25', 1, RANDOM_SEED, ff3R2.ff25).fit.median.ols, 3)).toBe('0.232');
    const wide = randomView(panel, 'ff55', 0.75, RANDOM_SEED, ff3R2.ff55);
    expect([fixed(wide.fit.median.ols, 3), fixed(ff3R2.ff55.ols, 3)]).toEqual(['0.192', '0.221']);
    expect(percent(wide.beatFF3.ols, 1)).toBe('23.5');
  }, SLOW);

  test('intuition: principal components of the 25 portfolios from 1963-07', () => {
    const X = presetPanel('ff25-1963', data.ff25, gsw as unknown as Series<'gsw-zero-coupon'>).X;
    const fit = pca(X);
    expect(fit.share.slice(0, 3).map((s) => percent(s, 1))).toEqual(['83.2', '6.3', '3.5']);
    // Column i is size group floor(i / 5) and B/M group i % 5.
    const [q1, q2, q3] = fit.loadings;
    expect(q1.every((v) => v > 0)).toBe(true);
    const row = (q: number[], size: number) => q.slice(size * 5, size * 5 + 5).reduce((s, v) => s + v, 0);
    const column = (q: number[], bm: number) => [0, 1, 2, 3, 4].reduce((s, size) => s + q[size * 5 + bm], 0);
    expect(Math.sign(row(q2, 0))).toBe(-Math.sign(row(q2, 4)));
    expect(Math.sign(column(q3, 0))).toBe(-Math.sign(column(q3, 4)));
  });

  test('what our data show: R² and 95% bootstrap intervals', () => {
    const rows: [Assets, Model, string, string][] = [
      ['ff25', 'capm', '0.078 [0.000, 0.536]', '0.061 [0.001, 0.159]'],
      ['ff25', 'ff3', '0.663 [0.367, 0.838]', '0.204 [0.057, 0.340]'],
      ['ff55', 'capm', '0.005 [0.000, 0.202]', '0.011 [0.000, 0.048]'],
      ['ff55', 'ff3', '0.221 [0.035, 0.479]', '0.076 [0.021, 0.143]'],
    ];
    for (const [assets, model, ols, gls] of rows) {
      const show = (weighting: 'ols' | 'gls') => {
        const ci = r2ConfidenceInterval(RANDOM_SEED, panel.excess[assets], panel.factors[model], { weighting });
        return `${fixed(ci.estimate, 3)} [${fixed(ci.lower, 3)}, ${fixed(ci.upper, 3)}]`;
      };
      expect([show('ols'), show('gls')]).toEqual([ols, gls]);
    }
  }, SLOW);

  test('what our data show: traded factors price themselves', () => {
    const run = (assets: Assets, model: Model) => tradedFactorRestriction(panel.excess[assets], panel.factors[model]);
    const capm = run('ff25', 'capm');
    expect([yearly(capm.lambda[0]), yearly(capm.factorMean[0]), yearly(capm.gap[0]), fixed(capm.gapT[0], 2)])
      .toEqual(['-3.9', '7.2', '-11.1', '-2.54']);
    const ff = run('ff25', 'ff3');
    expect(ff.gap.map(yearly)).toEqual(['-0.9', '-0.2', '0.4']);
    expect(ff.gapT.map((t) => fixed(t, 2))).toEqual(['-2.72', '-0.65', '1.55']);
    const wide = run('ff55', 'ff3');
    expect(wide.gap.map(yearly)).toEqual(['-3.3', '-0.8', '-1.7']);
    expect(wide.gapT.map((t) => fixed(t, 2))).toEqual(['-3.60', '-2.13', '-3.59']);
    const zeroBeta = [capm, ff, run('ff55', 'capm'), wide].map((r) => `${yearly(r.zeroBeta)} (${fixed(r.zeroBetaT, 2)})`);
    expect(zeroBeta).toEqual(['13.3 (3.00)', '0.6 (2.76)', '7.7 (2.90)', '3.6 (3.82)']);
  });
});
