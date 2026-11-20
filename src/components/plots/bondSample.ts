import { useMemo } from 'react';
import type { Series } from '../../lib/data/series';
import {
  forwardRates, gswCurve, holdingReturns, parYields, perfectForesightYield, treasuryCurve, type TreasuryCurve,
  type YieldCurve,
} from '../../lib/finance/bonds';
import { arithmeticMean } from '../../lib/finance/returns';
import { ols } from '../../lib/stats/ols';
import { useSeriesData } from './seriesSample';

const IDS = ['gsw-zero-coupon', 'fred-treasury-monthly'] as const;
export type BondData = { [K in (typeof IDS)[number]]: Series<K> };

/** The three curves of one GSW month, each T × 30, and FRED's constant-maturity curve. */
export interface BondView {
  curve: YieldCurve;
  forwards: number[][];
  /** GSW par yields with semi-annual coupons, the convention of FRED's constant-maturity yields. */
  par: number[][];
  treasury: TreasuryCurve;
}

export function bondView(data: BondData): BondView {
  const curve = gswCurve(data['gsw-zero-coupon']);
  return {
    curve,
    forwards: forwardRates(curve),
    par: parYields(curve, 2),
    treasury: treasuryCurve(data['fred-treasury-monthly']),
  };
}

/** Load both series once and build the curves. Chapters 40 to 42 share it. */
export function useBondView(): { view: BondView | null; failed: boolean } {
  const { data, failed } = useSeriesData(IDS);
  const view = useMemo(() => (data ? bondView(data) : null), [data]);
  return { view, failed };
}

export const CURVE_KINDS = ['zero', 'forward', 'par'] as const;
export type CurveKind = (typeof CURVE_KINDS)[number];

export function curveRows(view: BondView, kind: CurveKind): number[][] {
  return kind === 'zero' ? view.curve.y : kind === 'forward' ? view.forwards : view.par;
}

/** FRED's row for the calendar month of a GSW date, or null: FRED has no rows from 1987-01 to 1993-09. */
export function treasuryRow(treasury: TreasuryCurve, date: string): number[] | null {
  const t = treasury.dates.findIndex((d) => d.slice(0, 7) === date.slice(0, 7));
  return t < 0 ? null : treasury.par[t];
}

/** The 10-year minus the 1-year value of each month of a T × 30 curve. */
export const slopes = (rows: readonly (readonly number[])[]) => rows.map((row) => row[9] - row[0]);

/** Months whose 10-year zero yield is below the 1-year one, as runs of consecutive GSW months. */
export function inversions(curve: YieldCurve): { first: string; last: string; months: number }[] {
  const runs: { first: string; last: string; months: number }[] = [];
  let open = false;
  slopes(curve.y).forEach((slope, t) => {
    if (slope >= 0) { open = false; return; }
    const date = curve.dates[t].slice(0, 7);
    if (open) Object.assign(runs[runs.length - 1], { last: date, months: runs[runs.length - 1].months + 1 });
    else runs.push({ first: date, last: date, months: 1 });
    open = true;
  });
  return runs;
}

/** Hansen–Hodrick lags for overlapping one-year returns observed every month: the eleven months they share. */
export const OVERLAP_LAGS = 11;

export interface MeanExcessReturn {
  n: number;
  months: number;
  mean: number;
  /** Hansen–Hodrick standard error of the mean with OVERLAP_LAGS lags. */
  se: number;
  /** Standard deviation of rx across months. */
  sd: number;
}

/**
 * Mean one-year log excess return of the n-year bond over every purchase month with a sale month. The returns
 * overlap by eleven months, so the standard error is Hansen–Hodrick with eleven lags, the regression of rx on a
 * constant. Limit: with 455 overlapping months the sample holds only about 40 independent years.
 */
export function meanExcessReturn(curve: YieldCurve, n: number): MeanExcessReturn {
  const rx = holdingReturns(curve, n).map((h) => h.rx);
  const mean = arithmeticMean(rx);
  const fit = ols(rx, [], { errors: 'hansen-hodrick', lags: OVERLAP_LAGS });
  const sd = Math.sqrt(rx.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (rx.length - 1));
  return { n, months: rx.length, mean, se: fit.standardErrors[0], sd };
}

/** The n-year yield against the mean one-year yield of the n years that followed, with its mean gap. */
export function hindsight(curve: YieldCurve, n: number) {
  const points = perfectForesightYield(curve, n);
  return { points, meanTermPremium: arithmeticMean(points.map((p) => p.termPremium)) };
}
