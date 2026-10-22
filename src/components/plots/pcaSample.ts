import { useEffect, useState } from 'react';
import { betweenDates, loadSeries, type Series } from '../../lib/data/series';
import { ff25Returns, gswYieldChanges, type Panel } from '../../lib/stats/pca';

export type Preset = 'ff25' | 'ff25-1963' | 'gsw';

interface PresetInfo {
  label: string;
  /** Multiply decimals by this for the cloud's axes. */
  scale: number;
  unit: string;
  /** Default pair of series for the two-dimensional cloud (column indices). */
  pair: [number, number];
}

export const PRESETS: Record<Preset, PresetInfo> = {
  ff25: { label: '25 portfolios, 1926–2026', scale: 100, unit: '% a month', pair: [20, 4] },
  'ff25-1963': { label: '25 portfolios, 1963–2026', scale: 100, unit: '% a month', pair: [20, 4] },
  gsw: { label: 'Yield changes, 1985–2026', scale: 10000, unit: 'bp', pair: [1, 9] },
};

/** The panel behind each preset; the chapter's numbers test calls this too. */
export function presetPanel(preset: Preset, ff25: Series<'ff25-size-bm-monthly'>, gsw: Series<'gsw-zero-coupon'>): Panel {
  if (preset === 'gsw') return gswYieldChanges(gsw);
  return ff25Returns(preset === 'ff25' ? ff25 : betweenDates(ff25, '1963-07-01', '2026-08-01'));
}

/** Readable name of column i: "small value (ME1-BM5)" or "10-year". */
export function seriesName(preset: Preset, panel: Panel, i: number): string {
  if (preset === 'gsw') return `${i + 1}-year`;
  const size = Math.floor(i / 5);
  const bm = i % 5;
  const sizeWord = ['smallest', 'small', 'mid', 'large', 'largest'][size];
  const bmWord = ['growth', 'low B/M', 'mid B/M', 'high B/M', 'value'][bm];
  return `${sizeWord} ${bmWord} (${panel.names[i]})`;
}

/** Load both datasets once. */
export function usePcaData(): { data: { ff25: Series<'ff25-size-bm-monthly'>; gsw: Series<'gsw-zero-coupon'> } | null; failed: boolean } {
  const [data, setData] = useState<{ ff25: Series<'ff25-size-bm-monthly'>; gsw: Series<'gsw-zero-coupon'> } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    Promise.all([loadSeries('ff25-size-bm-monthly'), loadSeries('gsw-zero-coupon')])
      .then(([ff25, gsw]) => setData({ ff25, gsw }), () => setFailed(true));
  }, []);
  return { data, failed };
}
