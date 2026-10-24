import { Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { Segmented, Select } from '../ui/controls';
import { WidgetFrame } from '../ui/WidgetFrame';
import { buildView, SORTS, useSortData, WINDOWS, type SortKind, type Window } from './factorModelSample';
import { niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 260;
const pct = (v: number, digits = 1) => `${v < 0 ? '−' : '+'}${Math.abs(v * 100).toFixed(digits)}%`;
const weightText = (w: number) => (w === 0 ? 'not used' : `${w > 0 ? 'long +' : 'short −'}${Math.abs(w) < 0.4 ? '⅓' : '½'}`);
const year = (date: string) => Number(date.slice(0, 4)) + (Number(date.slice(5, 7)) - 1) / 12;

/**
 * Chapter 19 (and 20 with kind="size-momentum"): the six portfolios of a 2×3 sort, the legs of the chosen
 * long–short factor, and the factor rebuilt from those legs against the published one.
 */
export default function FactorBuilder({ kind = 'size-value', initialWindow = 'all' }: { kind?: SortKind; initialWindow?: Window }) {
  const sort = SORTS[kind];
  const factorKeys = Object.keys(sort.factors) as string[];
  const [factor, setFactor] = useState(factorKeys[factorKeys.length > 1 ? 1 : 0]);
  const [window, setWindow] = useState<Window>(initialWindow);
  const { data, failed } = useSortData(kind);
  const view = useMemo(() => (data ? buildView(data, kind, factor, window) : null), [data, kind, factor, window]);
  const spec = (sort.factors as Record<string, { name: string; weights: readonly number[] }>)[factor];

  const grid = (
    <div
      style={{ display: 'grid', gridTemplateColumns: 'auto repeat(3, 1fr)', gap: 4, padding: '0.5rem 0.5rem 0', fontSize: '0.8rem' }}
    >
      <span />
      {sort.second.map((name) => <span key={name} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{name}</span>)}
      {['small', 'big'].map((size, r) => (
        <div key={size} style={{ display: 'contents' }}>
          <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>{size}</span>
          {[0, 1, 2].map((c) => {
            const j = r * 3 + c;
            const w = spec.weights[j];
            return (
              <div
                key={c}
                style={{
                  padding: '0.3rem',
                  borderRadius: 6,
                  textAlign: 'center',
                  border: `2px ${w < 0 ? 'dashed' : 'solid'} ${w === 0 ? 'var(--border)' : 'var(--c-factor)'}`,
                  background: w > 0 ? 'color-mix(in srgb, var(--c-factor) 22%, transparent)' : 'transparent',
                  opacity: w === 0 ? 0.6 : 1,
                }}
              >
                <strong>{sort.legs[j]}</strong> {view ? pct(view.legMean[j]) : ''}
                <br />
                <span>{weightText(w)}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  let chart = <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>;
  if (view) {
    // Wealth of $1 on a log10 axis, so a century of compounding fits.
    const x = [year(view.dates[0]), ...view.dates.map((d) => year(d) + 1 / 12)];
    const ours = view.rebuiltPath.map(Math.log10);
    const theirs = view.publishedPath.map(Math.log10);
    const lo = Math.min(...ours, ...theirs, 0);
    const hi = Math.max(...ours, ...theirs, 0);
    const pad = Math.max((hi - lo) * 0.08, 0.05);
    const yTicks = niceTicks(lo - pad, hi + pad, 5);
    chart = (
      <PlotFrame
        x={[x[0], x.at(-1)!]}
        y={[lo - pad, hi + pad]}
        height={HEIGHT}
        xTicks={niceTicks(x[0], x.at(-1)!, 5).filter((v) => v >= x[0] && v <= x.at(-1)!)}
        yTicks={yTicks}
        formatX={(v) => String(Math.round(v))}
        formatY={(v) => `$${(10 ** v).toPrecision(2).replace(/\.0+$/, '')}`}
        xLabel="year"
        yLabel={<tspan style={{ fill: 'var(--c-factor)' }}>value of $1, log scale</tspan>}
        baseline={0}
        marginLeft={50}
      >
        <Polyline points={x.map((v, t) => [v, theirs[t]])} color="var(--text-muted)" weight={4} strokeStyle="dashed" fillOpacity={0} />
        <Polyline points={x.map((v, t) => [v, ours[t]])} color="var(--c-factor)" weight={2} fillOpacity={0} />
        <Label x={x.at(-1)!} y={ours.at(-1)!} attach="nw" attachDistance={6} size={12} color="var(--c-factor)">{factor}</Label>
      </PlotFrame>
    );
  }

  const plot = (
    <div>
      {grid}
      {chart}
    </div>
  );

  return (
    <WidgetFrame
      title="From six portfolios to one factor"
      ariaLabel={
        view
          ? `A 2 by 3 grid of the six ${kind === 'size-value' ? 'size and book-to-market' : 'size and momentum'} portfolios, with the long and short legs of ${factor} marked, and a line chart of $1 invested in ${factor} from ${view.first} to ${view.last} on a log scale. The rebuilt factor (solid) and the published one (dashed) lie on top of each other: the largest monthly gap is ${(view.gap * 100).toFixed(3)} percentage points. ${factor} averaged ${pct(view.mean)} a year with t-statistic ${view.meanT.toFixed(2)}.`
          : 'Six portfolios and a factor built from them. The data is loading.'
      }
      plotHeight={HEIGHT + 120}
      plot={plot}
      controls={
        <>
          <Segmented label="Factor" value={factor} onChange={setFactor} options={factorKeys.map((k) => ({ value: k, label: k, color: 'var(--c-factor)' }))} />
          <Select label="Sample" value={window} onChange={setWindow} options={WINDOWS.map((w) => ({ value: w.value, label: w.label }))} />
        </>
      }
      readout={
        view ? (
          <>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--c-factor)' }}>solid: rebuilt from the six</span> · dashed: published
            </p>
            <dl className="readout-grid">
              <dt>Sample</dt>
              <dd>{view.first} to {view.last} ({view.T} months)</dd>
              <dt>{factor} ({spec.name})</dt>
              <dd style={{ color: 'var(--c-factor)' }}>mean {pct(view.mean, 2)} a year, t = {view.meanT.toFixed(2)}</dd>
              <dt>Largest gap, rebuilt vs published</dt>
              <dd>{(view.gap * 100).toFixed(3)} points in {view.gapDate}</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ${sort.six} and ${sort.published} (Kenneth French Data Library), ${view ? `${view.first} to ${view.last}` : 'the chosen sample'}. Each leg is a value-weighted portfolio; cells show its mean monthly return ×12. The factor is the equal-weighted average of its long legs minus that of its short legs, rebuilt each month. The chart compounds \\$1 in the factor's monthly return. The gap is the largest absolute monthly difference from the published factor, in percentage points.`}
    />
  );
}
