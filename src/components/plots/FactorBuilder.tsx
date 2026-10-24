import { Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { Segmented } from '../ui/controls';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { SORT_SERIES, sortView, useSeriesData, type SortData, type SortKind } from './factorModelSample';
import { extent, money, niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 300;
const COLUMNS: Record<SortKind, string[]> = {
  'size-value': ['growth (low B/M)', 'middle', 'value (high B/M)'],
  'size-momentum': ['losers', 'middle', 'winners'],
};
const SORT_NAME: Record<SortKind, string> = { 'size-value': 'book-to-market', 'size-momentum': 'the return from t−12 to t−2' };
const FIRST: Record<SortKind, string> = { 'size-value': '1926-07', 'size-momentum': '1927-01' };
const pct = (v: number, digits = 1) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const share = (w: number) => (w === 0 ? '0' : `${w > 0 ? '+' : '−'}${Math.abs(w) > 0.4 ? '½' : '⅓'}`);
const yearOf = (iso: string) => Number(iso.slice(0, 4)) + (Number(iso.slice(5, 7)) - 1) / 12;
const compact = (v: number) => (v >= 1e3 ? `$${v / 1e3}k` : v >= 1 ? `$${v}` : `$${v.toFixed(2)}`);

/**
 * Chapters 19 and 20: the six value-weighted portfolios of a 2×3 sort (size by book-to-market, or size by
 * past return), the legs of the chosen factor, and $1 in T-bills plus the rebuilt factor against the
 * published one. kind 'size-value' rebuilds SMB and HML (ff6-size-bm-monthly vs ff3-monthly); kind
 * 'size-momentum' rebuilds WML (ff6-size-mom-monthly vs Mom of mom-monthly).
 */
export default function FactorBuilder({ kind = 'size-value' }: { kind?: SortKind }) {
  const { data, failed } = useSeriesData(SORT_SERIES[kind]);
  const view = useMemo(() => (data ? sortView(kind, data as SortData) : null), [data, kind]);
  const [pick, setPick] = useState(0);
  const factor = view?.factors[pick];
  // The library keys the momentum factor by its code name; on screen it is WML, as in the chapter's formula.
  const name = kind === 'size-momentum' ? 'WML' : factor?.name;

  const x = view ? [yearOf(view.dates[0]), ...view.dates.map((d) => yearOf(d) + 1 / 12)] : [];
  const [lo, hi] = factor ? extent([...factor.growth.rebuilt, ...factor.growth.published].map(Math.log10)) : [0, 1];
  const bottom = useTweened(Math.floor(lo));
  const top = useTweened(Math.ceil(hi + 0.05));
  const points = (ys: number[]) => x.map((xi, i) => [xi, Math.log10(ys[i])] as [number, number]);
  const end = factor ? { rebuilt: factor.growth.rebuilt.at(-1)!, published: factor.growth.published.at(-1)! } : null;

  const plot = view && factor && end ? (
    <PlotFrame
      x={[x[0], x.at(-1)!]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={niceTicks(x[0], x.at(-1)!, 5)}
      yTicks={niceTicks(bottom, top, 6).filter(Number.isInteger)}
      formatX={(v) => String(Math.round(v))}
      formatY={(v) => compact(10 ** v)}
      xLabel="calendar year"
      yLabel="$1 in T-bills + factor (log scale)"
      marginLeft={54}
    >
      <Polyline points={points(factor.growth.rebuilt)} color="var(--c-factor)" weight={6} fillOpacity={0} strokeOpacity={0.35} />
      <Polyline points={points(factor.growth.published)} color="var(--c-factor)" weight={1.5} fillOpacity={0} strokeStyle="dashed" />
      <Label x={x.at(-1)!} y={Math.log10(end.published)} attach="nw" attachDistance={8} size={12} color="var(--c-factor)">
        {`${name} rebuilt (wide) and ${factor.published} published (dashed)`}
      </Label>
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const grid = view && factor ? (
    <table className="sort-grid" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4, marginBottom: '0.75rem', fontSize: '0.85rem', tableLayout: 'fixed' }}>
      <caption style={{ textAlign: 'left', marginBottom: 4, color: 'var(--text-muted)' }}>
        Mean return of each portfolio, % a year, and its weight in {name}
      </caption>
      <thead>
        <tr>
          <th scope="col" style={{ width: '18%' }} />
          {COLUMNS[kind].map((c) => <th key={c} scope="col" style={{ fontWeight: 500 }}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {['small', 'big'].map((row, r) => (
          <tr key={row}>
            <th scope="row" style={{ fontWeight: 500, textAlign: 'left' }}>{row}</th>
            {view.legs.slice(3 * r, 3 * r + 3).map((leg) => {
              const w = factor.weights[leg.name];
              return (
                <td
                  key={leg.name}
                  aria-label={`${row} ${COLUMNS[kind][view.legs.indexOf(leg) % 3]}: mean ${pct(leg.mean)} a year, weight ${share(w)}`}
                  style={{
                    textAlign: 'center',
                    padding: '0.4rem 0.2rem',
                    borderRadius: 6,
                    border: `2px ${w < 0 ? 'dashed' : 'solid'} ${w === 0 ? 'transparent' : 'var(--c-factor)'}`,
                    background: w > 0 ? 'color-mix(in srgb, var(--c-factor) 22%, transparent)' : 'transparent',
                  }}
                >
                  <div>{pct(leg.mean)}</div>
                  <div style={{ fontWeight: 700, color: w === 0 ? 'var(--text-muted)' : 'var(--c-factor)' }}>{share(w)}</div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  ) : null;

  return (
    <WidgetFrame
      title={kind === 'size-value' ? 'Build SMB and HML from six portfolios' : 'Build the momentum factor from six portfolios'}
      ariaLabel={
        view && factor && end
          ? `Six portfolios sorted on size and ${SORT_NAME[kind]}, ${view.dates[0].slice(0, 7)} to ${view.dates.at(-1)!.slice(0, 7)}. ${name} buys the cells marked plus and sells the cells marked minus. One dollar in T-bills plus the rebuilt ${name} grows to ${money(end.rebuilt, 0)}; with the published ${factor.published} it grows to ${money(end.published, 0)}. The largest gap in one month is ${(factor.gap.value * 100).toFixed(2)} percentage points, in ${factor.gap.date.slice(0, 7)}.`
          : 'Six portfolios of a 2×3 sort and a factor rebuilt from them. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        view && view.factors.length > 1 ? (
          <Segmented
            label="Factor"
            value={String(pick)}
            onChange={(v) => setPick(Number(v))}
            options={view.factors.map((f, i) => ({ value: String(i), label: f.name, color: 'var(--c-factor)' }))}
          />
        ) : null
      }
      readout={
        view && factor && end ? (
          <>
            {grid}
            <p style={{ margin: '0 0 0.5rem' }}>Solid cell: bought (+). Dashed cell: sold (−). 0: left out.</p>
            <dl className="readout-grid">
              <dt>Mean of {name} rebuilt</dt>
              <dd style={{ color: 'var(--c-factor)' }}>{pct(factor.mean.rebuilt, 2)} a year (published {pct(factor.mean.published, 2)})</dd>
              <dt>$1 in T-bills + {name} rebuilt</dt>
              <dd>{money(end.rebuilt, 0)}</dd>
              <dt>$1 in T-bills + {factor.published} published</dt>
              <dd>{money(end.published, 0)}</dd>
              <dt>Largest gap in one month</dt>
              <dd>{(factor.gap.value * 100).toFixed(2)} percentage points ({factor.gap.date.slice(0, 7)})</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ${kind === 'size-value' ? 'ff6-size-bm-monthly and ff3-monthly' : 'ff6-size-mom-monthly, mom-monthly and ff3-monthly'} (Kenneth French Data Library), ${FIRST[kind]} to ${view ? view.dates.at(-1)!.slice(0, 7) : '2026-08'}. Six value-weighted portfolios: stocks split at the median size, then at the 30th and 70th NYSE percentiles of ${SORT_NAME[kind]}. ${kind === 'size-value' ? 'SMB = ⅓(small row) − ⅓(big row); HML = ½(small value + big value) − ½(small growth + big growth).' : 'WML = ½(small winners + big winners) − ½(small losers + big losers).'} Lines compound RF + factor monthly. Means are monthly means × 12, before costs.`}
    />
  );
}
