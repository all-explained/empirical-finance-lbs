/**
 * Every number in the prose of chapter 32 that comes from our simulations, recomputed from the seeded panel
 * through the library and the widget's sample helper. The real-data numbers in the chapter are the paper's,
 * with their pages. If the library changes, this test fails before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import {
  ALPHA_SHARE_RANGE, ALPHA_SHARE_STEP, alphaView, BOOTSTRAPS, DEFAULT_ALPHA_SHARE, DEFAULT_K, DEFAULT_SEED, ipcaWorld, PANEL,
  restrictedView,
} from '../src/components/plots/ipcaSample';
import { famaMacBeth } from '../src/lib/finance/crossSection';
import { ipcaFit } from '../src/lib/finance/ipca';

const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const world = ipcaWorld(DEFAULT_SEED, DEFAULT_ALPHA_SHARE);
/** A slider value the widget can reach: inside the range and on a step. */
const reachable = (share: number) => share >= ALPHA_SHARE_RANGE[0] && share <= ALPHA_SHARE_RANGE[1]
  && Math.abs(share / ALPHA_SHARE_STEP - Math.round(share / ALPHA_SHARE_STEP)) < 1e-9;

describe('chapter 32 prose numbers', () => {
  test('formalisation: the panel, its managed portfolios and the case K = dim z', () => {
    expect([PANEL.N, PANEL.T, PANEL.dimZ, PANEL.K]).toEqual([200, 120, 4, 2]);
    expect([world.managed.returns.length, world.managed.returns[0].length, world.managed.ZtZ.length]).toEqual([120, 4, 120]);
    expect(PANEL.N * PANEL.T).toBe(24000);
    expect(36 + 1).toBe(37);
    const fit = ipcaFit(world.managed, { K: PANEL.dimZ, alpha: false });
    expect(fit.history.objective.length).toBe(1);
    let gap = 0;
    world.panel.Z.forEach((Zt, t) => {
      const [slopes] = famaMacBeth([world.panel.excess[t]], Zt, { intercept: false }).monthly;
      const fitted = fit.gammaBeta.map((row) => row.reduce((sum, v, k) => sum + v * fit.factors[t][k], 0));
      gap = Math.max(gap, ...fitted.map((v, l) => Math.abs(v - slopes[l])));
    });
    expect(gap).toBeLessThan(1e-15);
    expect(BOOTSTRAPS).toBe(200);
  });

  test('playground: the default fit with K = 2 and no alpha', () => {
    expect(DEFAULT_K).toBe(2);
    const { fit, r2, gap } = restrictedView(world, 2);
    expect(fit.history.objective.length).toBe(12);
    expect(gap.length).toBe(11);
    expect([gap[0].toExponential(1), gap[10].toExponential(1)]).toEqual(['3.3e-5', '2.4e-14']);
    const ratios = gap.slice(1, -1).map((g, j) => g / gap[j + 2]);
    expect(ratios.every((r) => ['6', '7', '8'].includes(r.toFixed(0)))).toBe(true);
    const worst = Math.max(...fit.gammaBeta.flatMap((row, l) => row.map((v, k) => Math.abs(v - world.panel.gammaBeta[l][k]))));
    expect(worst.toFixed(2)).toBe('0.13');
    expect([percent(r2.total, 2), percent(r2.predictive, 2)]).toEqual(['8.25', '0.60']);
    expect(alphaView(world, 2, DEFAULT_SEED).test.pValue.toFixed(3)).toBe('0.685');
  });

  test('playground: too few factors, a true alpha, and a spare factor', () => {
    expect(alphaView(world, 1, DEFAULT_SEED).test.pValue.toFixed(3)).toBe('0.020');
    expect([0.004, 0.01].every(reachable)).toBe(true);
    const small = ipcaWorld(DEFAULT_SEED, 0.004);
    expect(alphaView(small, 2, DEFAULT_SEED).test.pValue.toFixed(3)).toBe('0.005');
    const one = ipcaWorld(DEFAULT_SEED, 0.01);
    expect(alphaView(one, 3, DEFAULT_SEED).test.pValue.toFixed(3)).toBe('0.395');
    expect(percent(restrictedView(one, 2).r2.predictive, 2)).toBe('0.01');
    expect(percent(alphaView(one, 2, DEFAULT_SEED).r2.predictive, 2)).toBe('0.29');
  });
});
