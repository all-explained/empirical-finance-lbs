import { useEffect, useMemo, useState } from 'react';
import { loadSeries, type Series, type SeriesId } from '../../lib/data/series';

/** Run load once and keep its result; null while loading. Pass a module-level function. */
export function useLoaded<T>(load: () => Promise<T>): { data: T | null; failed: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    load().then(setData, () => setFailed(true));
  }, [load]);
  return { data, failed };
}

/** Load a fixed set of series once, keyed by id. Pass a module-level array. */
export function useSeriesData<I extends SeriesId>(ids: readonly I[]): { data: { [K in I]: Series<K> } | null; failed: boolean } {
  return useLoaded(useMemo(() => () => Promise.all(ids.map((id) => loadSeries(id)))
    .then((all) => Object.fromEntries(all.map((s) => [s.id, s])) as { [K in I]: Series<K> }), [ids]));
}
