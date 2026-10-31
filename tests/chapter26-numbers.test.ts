/**
 * Every number in the prose of chapter 26, recomputed from ff25-size-bm-monthly, ff3-monthly and
 * fred-cay-quarterly through quarterlyPanel, the SDF library and the widgets' helper. Facts taken from
 * Nagel (2013) and Gospodinov, Kan & Robotti (2019) are cited in the prose with their pages and hold no numbers.
 */
import { describe, expect, test } from 'vitest';
import ff3 from '../src/data/series/ff3-monthly.json';
import ff25 from '../src/data/series/ff25-size-bm-monthly.json';
import cay from '../src/data/series/fred-cay-quarterly.json';
import type { Series } from '../src/lib/data/series';
import { quarterlyPanel } from '../src/lib/finance/conditional';
import { maxSharpeSquared, sampleCovariance, sampleMeans } from '../src/lib/finance/portfolio';
import { arithmeticMean } from '../src/lib/finance/returns';
import { linearSdfGmm } from '../src/lib/finance/sdfGmm';
import { annualiseMean } from '../src/lib/stats/moments';
import { ols } from '../src/lib/stats/ols';
import { WINDOWS, type ConditionalData } from '../src/components/plots/conditionalSample';
import { sdfView } from '../src/components/plots/sdfGmmSample';

const data: ConditionalData = {
  ff3: ff3 as unknown as Series<'ff3-monthly'>,
  ff25: ff25 as unknown as Series<'ff25-size-bm-monthly'>,
  cay: cay as unknown as Series<'fred-cay-quarterly'>,
};
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const fixed = (v: number, digits: number) => v.toFixed(digits);
const year = (v: number) => annualiseMean(v, 4);
const meanAbs = (errors: number[]) => arithmeticMean(errors.map((e) => Math.abs(year(e))));
const view = sdfView(data);
const { capm, ccapm, ff3: ff } = view.fits;
const panel = quarterlyPanel(data, WINDOWS.full);
const T = panel.dates.length;
/** Covariance (divisor T) of the columns, ×4. */
const covariance = (rows: number[][]) => sampleCovariance(rows).map((row) => row.map((v) => year((v * (T - 1)) / T)));
const SG = view.names.indexOf('ME1-BM1');

describe('chapter 26 prose numbers', () => {
  test('hook: sample, J tests and first-stage pricing errors', () => {
    expect([view.first, view.last, view.quarters, view.names.length]).toEqual(['1963-Q3', '2026-Q2', 252, 25]);
    expect([fixed(ccapm.J, 1), ccapm.df, fixed(ccapm.pValue, 2)]).toEqual(['13.0', 24, '0.97']);
    expect([fixed(ff.J, 1), ff.df, ff.pValue.toExponential(1)]).toEqual(['67.7', 22, '1.5e-6']);
    expect([fixed(capm.J, 1), capm.df, capm.pValue.toExponential(1)]).toEqual(['91.2', 24, '8.9e-10']);
    expect([ccapm, ff, capm].map((f) => percent(meanAbs(f.firstStage.pricingErrors), 2))).toEqual(['8.35', '0.99', '2.09']);
  });

  test('intuition: the line through the origin is first-stage GMM', () => {
    const fit = ols(view.meanExcess, [view.marketCovariance], { intercept: false });
    expect(fit.coefficients[0]).toBeCloseTo(capm.firstStage.b[0], 10);
    expect([fixed(capm.firstStage.b[0], 2), fixed(capm.firstStage.bSE[0], 2)]).toEqual(['2.91', '0.87']);
    expect(capm.firstStage.b[0] / capm.firstStage.bSE[0]).toBeGreaterThan(3);
    // ME1-BM1 has the largest covariance; moving it onto the line raises the slope and cuts the mean |error|.
    expect(view.marketCovariance.indexOf(Math.max(...view.marketCovariance))).toBe(SG);
    const y = view.meanExcess.map((v, i) => (i === SG ? fit.coefficients[0] * view.marketCovariance[i] : v));
    const moved = ols(y, [view.marketCovariance], { intercept: false });
    expect(moved.coefficients[0]).toBeGreaterThan(fit.coefficients[0]);
    expect(arithmeticMean(moved.residuals.map(Math.abs))).toBeLessThan(arithmeticMean(fit.residuals.map(Math.abs)));
    expect([fixed(Math.min(...view.marketCovariance), 3), fixed(Math.max(...view.marketCovariance), 3)]).toEqual(['0.023', '0.047']);
    expect([percent(Math.min(...view.meanExcess), 1), percent(Math.max(...view.meanExcess), 1)]).toEqual(['5.3', '14.5']);
    expect(fixed(ols(view.meanExcess, [view.marketCovariance]).coefficients[1], 2)).toBe('-0.36');
  });

  test('formalisation: λ = Σ_f b, the market mean, and the SMB split', () => {
    expect([percent(year(capm.firstStage.lambda[0]), 1), percent(year(capm.firstStage.lambdaSE[0]), 1)]).toEqual(['8.4', '2.5']);
    expect(view.marketVariance * capm.firstStage.b[0]).toBeCloseTo(year(capm.firstStage.lambda[0]), 12);
    expect(percent(year(sampleMeans(panel.factors)[0]), 1)).toBe('7.5');
    expect(ff.factorNames).toEqual(['Mkt-RF', 'SMB', 'HML']);
    const [bM, bS, bH] = ff.firstStage.b;
    expect([fixed(bS, 2), fixed(ff.firstStage.bSE[1], 2)]).toEqual(['-0.38', '1.35']);
    expect([fixed(bM, 2), fixed(ff.firstStage.bSE[0], 2)]).toEqual(['3.38', '1.10']);
    expect([percent(year(ff.firstStage.lambda[1]), 2), percent(year(ff.firstStage.lambdaSE[1]), 2)]).toEqual(['1.93', '1.34']);
    expect(Math.abs(bS / ff.firstStage.bSE[1])).toBeLessThan(1.96);
    expect(Math.abs(ff.firstStage.lambda[1] / ff.firstStage.lambdaSE[1])).toBeLessThan(1.96);
    const [, smbRow] = covariance(panel.factors);
    const parts = [smbRow[0] * bM, smbRow[1] * bS, smbRow[2] * bH];
    expect(parts.map((v) => percent(v, 2))).toEqual(['2.74', '-0.43', '-0.38']);
    expect(parts[0] + parts[1] + parts[2]).toBeCloseTo(year(ff.firstStage.lambda[1]), 12);
  });

  test('formalisation: the consumption CAPM loadings and the noise of its SDF', () => {
    expect([fixed(ccapm.firstStage.b[0], 0), fixed(ccapm.firstStage.bSE[0], 0)]).toEqual(['331', '181']);
    const sdDc = Math.sqrt(covariance(panel.dc.map((dc) => [dc]))[0][0] / 4);
    expect(percent(sdDc, 2)).toBe('0.93');
    expect(fixed(ccapm.firstStage.b[0] * sdDc, 1)).toBe('3.1');
    const second = linearSdfGmm(panel.excess, panel.dc.map((dc) => [dc]), { weighting: 'efficient' });
    expect(second.J).toBeCloseTo(ccapm.J, 10);
    expect([fixed(second.b[0], 0), fixed(second.bSE[0], 0)]).toEqual(['177', '66']);
    expect(percent(1 / second.b[0], 2)).toBe('0.57');
  });

  test('formalisation: HJ distances and the no-factor benchmark', () => {
    const sr2 = maxSharpeSquared(sampleMeans(panel.excess), sampleCovariance(panel.excess).map((row) => row.map((v) => (v * (T - 1)) / T)));
    expect([fixed(Math.sqrt(sr2), 2), fixed(2 * Math.sqrt(sr2), 2)]).toEqual(['0.64', '1.28']);
    expect(view.noFactorDistance).toBeCloseTo(Math.sqrt(sr2 / (1 + sr2)), 12);
    expect([view.noFactorDistance, capm.hjDistance, ff.hjDistance, ccapm.hjDistance].map((d) => fixed(d, 3)))
      .toEqual(['0.540', '0.513', '0.488', '0.470']);
  });

  test('playground: bars, weightings and the gaps between models', () => {
    expect([percent(year(capm.firstStage.pricingErrors[SG]), 2), percent(year(ff.firstStage.pricingErrors[SG]), 2)]).toEqual(['-8.24', '-4.37']);
    expect(ccapm.firstStage.pricingErrors.every((e) => e > 0)).toBe(true);
    for (const f of [capm, ccapm, ff]) expect(meanAbs(f.hj.pricingErrors)).toBeGreaterThan(meanAbs(f.firstStage.pricingErrors));
    expect(percent(meanAbs(ff.hj.pricingErrors), 2)).toBe('2.17');
    expect(capm.hjDistance - ccapm.hjDistance).toBeLessThan(0.05);
    expect(fixed(view.noFactorDistance - ccapm.hjDistance, 2)).toBe('0.07');
    expect([fixed(capm.hjDistance - ff.hjDistance, 2), fixed(ff.hjDistance - ccapm.hjDistance, 2)]).toEqual(['0.03', '0.02']);
    expect(Math.round((T / 4) * 10) / 10).toBe(63);
  });

  test('recap: the four distances', () => {
    expect([capm, ff, ccapm].map((f) => fixed(f.hjDistance, 3))).toEqual(['0.513', '0.488', '0.470']);
    expect(fixed(view.noFactorDistance, 3)).toBe('0.540');
  });
});
