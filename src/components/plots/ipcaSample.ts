import {
  alphaTest, ipcaFit, ipcaR2, managedPortfolios, simulateIpcaPanel,
  type AlphaTest, type IpcaFit, type ManagedPortfolios, type SimulatedIpcaPanel,
} from '../../lib/finance/ipca';

// Settings that the IPCAFit widget and tests/chapter32-numbers.test.ts share.
export const DEFAULT_SEED = 1;
/** The seeded panel: 200 firms, 120 months, the constant and 3 characteristics, 2 true factors (the library defaults). */
export const PANEL = { N: 200, T: 120, dimZ: 4, K: 2, noise: 0.1 } as const;
export const DEFAULT_ALPHA_SHARE = 0;
export const ALPHA_SHARE_RANGE: [number, number] = [0, 0.02];
export const ALPHA_SHARE_STEP = 0.002;
/** Numbers of factors the widget can fit. */
export const FIT_KS = [1, 2, 3] as const;
export type FitK = (typeof FIT_KS)[number];
export const DEFAULT_K: FitK = 2;
/** Bootstrap samples of the alpha test: the library default, 200 rather than the paper's 1,000. */
export const BOOTSTRAPS = 200;
export const CHARACTERISTICS = ['constant', 'char. 1', 'char. 2', 'char. 3'];

export interface IpcaWorld {
  panel: SimulatedIpcaPanel;
  managed: ManagedPortfolios;
  /** Σ_{i,t} (R^e_{i,t+1})², the raw sum of squares that both R² divide by. */
  squares: number;
}

export function ipcaWorld(seed: number, alphaShare: number): IpcaWorld {
  const panel = simulateIpcaPanel(seed, { ...PANEL, alphaShare });
  return {
    panel,
    managed: managedPortfolios(panel.Z, panel.excess),
    squares: panel.excess.reduce((sum, row) => sum + row.reduce((s, v) => s + v * v, 0), 0),
  };
}

export interface RestrictedView {
  fit: IpcaFit;
  r2: { total: number; predictive: number };
  /**
   * After each ALS iteration but the last: how far the objective lies above its final value, as a share of
   * Σ(R^e)². It is also the final total R² less the total R² of that iteration.
   */
  gap: number[];
}

/** The restricted fit (Γ_α = 0) with K factors. */
export function restrictedView({ panel, managed, squares }: IpcaWorld, K: number): RestrictedView {
  const fit = ipcaFit(managed, { K, alpha: false });
  const { objective } = fit.history;
  const last = objective[objective.length - 1];
  return { fit, r2: ipcaR2(panel, fit), gap: objective.slice(0, -1).map((o) => (o - last) / squares) };
}

export interface AlphaView {
  fit: IpcaFit;
  r2: { total: number; predictive: number };
  test: AlphaTest;
}

/** The unrestricted fit with K factors and its bootstrap test of Γ_α = 0, seeded with the panel's seed. */
export function alphaView({ panel, managed }: IpcaWorld, K: number, seed: number): AlphaView {
  const fit = ipcaFit(managed, { K, alpha: true });
  return { fit, r2: ipcaR2(panel, fit), test: alphaTest(seed, managed, fit, { bootstraps: BOOTSTRAPS }) };
}
