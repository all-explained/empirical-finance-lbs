import { Line, Polyline } from 'mafs';
import { useState } from 'react';
import { Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { quarterLabel } from './conditionalSample';
import { clamp, niceTicks } from './format';
import { BASES, useMimickingView, type Base } from './mimickingSample';
import { yearPosition } from './oosSample';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 320;
/** The plot cuts lines at ±4% a quarter, so the two 2020 quarters do not flatten the other 250. */
const LIMIT = 4;
type Mode = 'in' | 'split';
const MODES: { value: Mode; label: string }[] = [
  { value: 'in', label: 'In sample' },
  { value: 'split', label: 'Split sample' },
];
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const signedNum = (v: number, digits = 3) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(digits)}`;
const NOWRAP = { whiteSpace: 'nowrap' } as const;

/**
 * Chapter 33: quarterly consumption growth and its projection on the 25 size–B/M portfolios or on the FF3 factors,
 * with weights from all quarters or from the quarters before a split, and the correlation each achieves.
 */
export default function MimickingPortfolio({ initialBase = 'ff25', initialMode = 'in', initialSplit = 1995 }: { initialBase?: Base; initialMode?: Mode; initialSplit?: number }) {
  const [base, setBase] = useState<Base>(initialBase);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [split, setSplit] = useState(initialSplit);
  const { view, failed } = useMimickingView(base, `${split}-01-01`);
  const fit = view ? (mode === 'in' ? view.inSample : view.split) : null;

  const shown = (v: number) => clamp(v * 100, -LIMIT, LIMIT);
  const bottom = -LIMIT - 0.25;
  // Headroom keeps the line key clear of the highest point.
  const top = LIMIT + 1.5;
  const x0 = 1963.5;
  const x1 = 2026.5;
  const waiting = failed ? 'The data did not load.' : 'Loading the data…';

  const plot = view && fit ? (
    <PlotFrame
      x={[x0, x1]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={niceTicks(x0, x1, 6)}
      yTicks={niceTicks(bottom, top, 5)}
      formatY={(v) => num(v, 1)}
      xLabel="quarter"
      yLabel="% a quarter"
      baseline={0}
      marginLeft={46}
    >
      {mode === 'split' && (
        <>
          <Line.Segment point1={[split, bottom]} point2={[split, top]} color="var(--text-muted)" weight={1.5} opacity={0.7} style="dashed" />
          {/* At the plot's corners, so the labels never meet the tick labels whatever the split date. */}
          <Label x={x0} y={bottom} attach="ne" attachDistance={6} size={12} color="var(--text-muted)">estimate</Label>
          <Label x={x1} y={bottom} attach="nw" attachDistance={6} size={12} color="var(--text-muted)">test</Label>
        </>
      )}
      <Polyline points={view.dates.map((d, t) => [yearPosition(d), shown(view.dc[t])])} color="var(--c-factor)" weight={2.5} fillOpacity={0} />
      <Polyline points={view.dates.map((d, t) => [yearPosition(d), shown(fit.fitted[t])])} color="var(--c-return)" weight={2} strokeStyle="dashed" fillOpacity={0} />
      <Label x={x1 - 1} y={top} attach="sw" attachDistance={8} size={12} color="var(--c-factor)">solid: consumption growth</Label>
      <Label x={x1 - 1} y={top} attach="sw" attachDistance={26} size={12} color="var(--c-return)">dashed: fitted value</Label>
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{waiting}</p>
  );

  const top3 = view && fit
    ? fit.weights.map((w, i) => ({ name: view.names[i], w })).sort((a, b) => Math.abs(b.w) - Math.abs(a.w)).slice(0, 3)
    : [];
  const cut = view && fit
    ? [['$\\Delta c_t$', view.dc], ['fitted', fit.fitted]].flatMap(([name, values]) => (values as number[])
      .map((v, t) => ({ v, t })).filter(({ v }) => Math.abs(v * 100) > LIMIT)
      .map(({ v, t }) => `${name} in ${quarterLabel(view.dates[t])} (${num(v * 100, 1)}%)`))
    : [];
  const baseName = BASES.find((b) => b.value === base)!.label;
  const last = view ? (mode === 'in' ? view.last : quarterLabel(view.dates[view.split.index - 1])) : '';
  const quarters = view ? (mode === 'in' ? view.dates.length : view.split.index) : 0;

  return (
    <WidgetFrame
      title="A traded portfolio that tracks consumption growth"
      ariaLabel={
        view && fit
          ? `Two lines by quarter, ${view.first} to ${view.last}: quarterly consumption growth (solid) and its fitted value from the ${baseName} (dashed), with weights estimated from ${view.first} to ${last}. Correlation over those quarters: ${num(fit.correlation)}.${mode === 'split' ? ` Correlation from ${view.split.label} on, with the same weights: ${num(view.split.laterCorrelation)}.` : ''} Largest weights: ${top3.map((x) => `${x.name} ${signedNum(x.w)}`).join(', ')}.`
          : 'Quarterly consumption growth and its mimicking portfolio. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Base assets" value={base} onChange={setBase} options={BASES.map((b) => ({ ...b, color: 'var(--c-return)' }))} />
          <Segmented label="Weights from" value={mode} onChange={setMode} options={MODES.map((m) => ({ ...m, color: 'var(--c-return)' }))} />
          <Slider label="Split date" value={split} min={1975} max={2015} onChange={setSplit} format={(y) => `${y}-Q1`} />
        </>
      }
      readout={
        view && fit ? (
          <dl className="readout-grid">
            <dt>Weights from</dt>
            <dd><span style={NOWRAP}>{view.first}</span> to <span style={NOWRAP}>{last}</span></dd>
            <dt>Parameters, quarters</dt>
            <dd>{fit.weights.length + 1}, {quarters}</dd>
            <dt>Correlation, estimation quarters</dt>
            <dd style={{ color: 'var(--c-return)' }}>{num(fit.correlation)}</dd>
            {mode === 'split' && (
              <>
                <dt>Correlation from {view.split.label} on</dt>
                <dd style={{ color: 'var(--c-return)' }}>{num(view.split.laterCorrelation)}</dd>
              </>
            )}
            <dt><RichText>{'Largest weights $w$'}</RichText></dt>
            <dd>{top3.map((x) => <span key={x.name} style={{ ...NOWRAP, display: 'block' }}>{x.name} {signedNum(x.w)}</span>)}</dd>
          </dl>
        ) : (
          <p>{waiting}</p>
        )
      }
      caption={`Data: ff25-size-bm-monthly and ff3-monthly (Kenneth French Data Library), compounded into quarterly excess returns, and consumption growth $\\Delta c_t$ from fred-cay-quarterly; ${view ? `${view.first} to ${view.last}, ${view.dates.length} quarters` : '1963-Q3 to 2026-Q2, 252 quarters'}. $\\Delta c_t$ is the change in log real consumption per person over the quarter. OLS of $\\Delta c_t$ on a constant and the excess returns of the base assets, $\\Delta c_t = a + w'R^e_t + \\varepsilon_t$. The dashed line is the fitted value, the mimicking return $w'R^e_t$ plus the constant $a$. Split sample: weights from the quarters before the split date, applied to every quarter. Lines are cut at ±${LIMIT}% a quarter${cut.length ? `; off the scale: ${cut.join(', ')}` : ''}. ME1-BM1 is the smallest-size, lowest-B/M portfolio; ME5-BM5 the biggest, highest-B/M one.`}
    />
  );
}
