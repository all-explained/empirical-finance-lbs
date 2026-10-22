import { Point, Polyline } from 'mafs';
import { useId, useState, type CSSProperties } from 'react';
import { addedPath, grossGrowth, growthPath, logReturn, repeatedSum, simpleReturn } from '../../lib/finance/returns';
import { Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { extent, money, niceTicks, percent } from './format';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 300;
const inputStyle: CSSProperties = {
  minHeight: 44, width: '100%', boxSizing: 'border-box', padding: '0 0.7rem', borderRadius: 8, font: 'inherit',
  border: '1px solid var(--border)', background: 'var(--bg-inset)', color: 'var(--text)',
};

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
      <label htmlFor={id} className="ctl-label"><RichText>{label}</RichText></label>
      <input id={id} type="number" inputMode="decimal" min={0} step="any" value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}

const logPct = (v: number) => (v === -Infinity ? '−∞' : percent(v, 2));
const signedDollars = (v: number) => `${v < 0 ? '−' : ''}${money(v)}`;

/**
 * Chapter 1: type a starting price, an ending price and a dividend, and see
 * the simple, gross and log return. Then repeat the same move k times:
 * compounding (solid) against simply adding the simple returns (dashed).
 */
export default function ReturnCalculator({ initialP0 = '100', initialP1 = '108', initialD = '2', initialK = 10 }: {
  initialP0?: string; initialP1?: string; initialD?: string; initialK?: number;
}) {
  const [p0, setP0] = useState(initialP0);
  const [p1, setP1] = useState(initialP1);
  const [d, setD] = useState(initialD);
  const [k, setK] = useState(initialK);

  const [P0, P1, D] = [p0, p1, d].map((s) => (s.trim() === '' ? NaN : Number(s)));
  const valid = P0 > 0 && P1 >= 0 && D >= 0 && [P0, P1, D].every(Number.isFinite);

  const fields = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(6.5rem, 1fr))', gap: '0.6rem', width: '100%' }}>
      <NumberField label="Price today $P_t$ (\$)" value={p0} onChange={setP0} />
      <NumberField label="Price next period $P_{t+1}$ (\$)" value={p1} onChange={setP1} />
      <NumberField label="Dividend $D_{t+1}$ (\$)" value={d} onChange={setD} />
    </div>
  );
  const slider = <Slider label="Repeat the move $k$ times" value={k} min={1} max={30} onChange={setK} format={(v) => `${v} period${v === 1 ? '' : 's'}`} />;

  if (!valid) {
    const message = 'Type a price today above zero, and a price next period and a dividend of zero or more.';
    return (
      <WidgetFrame
        title="Return calculator"
        ariaLabel={message}
        plotHeight={HEIGHT}
        plot={<p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{message}</p>}
        controls={<>{fields}{slider}</>}
        readout={<p>{message}</p>}
      />
    );
  }

  const R = simpleReturn(P0, P1, D);
  const gain = simpleReturn(P0, P1);
  const yieldPart = simpleReturn(P0, P0, D);
  const r = logReturn(R);
  const compounded = growthPath(Array.from({ length: k }, () => R), 'simple');
  const added = addedPath(R, k); // the mistake: add simple returns
  const final = compounded[k];
  const viaLogs = growthPath(Array.from({ length: k }, () => r), 'log')[k];
  const [lo, hi] = extent([...compounded, ...added]);
  const pad = Math.max((hi - lo) * 0.08, 0.05);
  const Y: [number, number] = [Math.min(lo - pad, 0), hi + pad];
  const tone = R > 0 ? 'good' : R < 0 ? 'bad' : undefined;

  const plot = (
    <PlotFrame
      x={[0, k]}
      y={Y}
      height={HEIGHT}
      xTicks={niceTicks(0, k, Math.min(k, 6)).filter(Number.isInteger)}
      yTicks={niceTicks(Y[0], Y[1], 4)}
      formatY={signedDollars}
      xLabel="periods"
      yLabel="value of $1"
      marginLeft={56}
    >
      <Polyline points={added.map((v, j) => [j, v] as [number, number])} color="var(--text-muted)" weight={2} strokeStyle="dashed" fillOpacity={0} />
      <Polyline points={compounded.map((v, j) => [j, v] as [number, number])} color="var(--c-return)" weight={2.5} fillOpacity={0} />
      {compounded.map((v, j) => <Point key={j} x={j} y={v} color="var(--c-return)" svgCircleProps={{ r: 3.5 }} />)}
      <Label x={k} y={final} attach="nw" attachDistance={8} size={12} color="var(--c-return)">compounded</Label>
      <Label x={k} y={added[k]} attach={added[k] > final ? 'sw' : 'nw'} attachDistance={8} size={12} color="var(--text-muted)">added</Label>
    </PlotFrame>
  );

  return (
    <WidgetFrame
      title="Return calculator"
      ariaLabel={`A price move from ${money(P0)} to ${money(P1)} with a ${money(D)} dividend is a simple return of ${percent(R, 2)}. Repeated ${k} times, compounding turns $1 into ${money(final)}; adding the simple returns would say ${signedDollars(added[k])}.`}
      plotHeight={HEIGHT}
      plot={plot}
      controls={<>{fields}{slider}</>}
      readout={
        <dl className="readout-grid">
          <dt><RichText>{'Simple return $\\Ret{R_{t+1}}$'}</RichText></dt>
          <dd className={tone}>{percent(R, 2)}</dd>
          <dt>of which price change</dt>
          <dd>{percent(gain, 2)}</dd>
          <dt>of which dividend yield</dt>
          <dd>{percent(yieldPart, 2)}</dd>
          <dt><RichText>{'Gross return $1 + \\Ret{R_{t+1}}$'}</RichText></dt>
          <dd>{grossGrowth([R]).toFixed(4)}</dd>
          <dt><RichText>{'Log return $\\Ret{r_{t+1}}$'}</RichText></dt>
          <dd>{logPct(r)}</dd>
          <dt>{`After ${k} period${k === 1 ? '' : 's'}, $1 becomes`}</dt>
          <dd style={{ color: 'var(--c-return)' }}>{money(final)} ({percent(final - 1, 1)})</dd>
          <dt><RichText>{`Sum of log returns $${k}\\,\\Ret{r}$, then $e^{(\\cdot)}$`}</RichText></dt>
          <dd>{r === -Infinity ? '−∞' : `${percent(repeatedSum(r, k), 1)} → ${money(viaLogs)}`}</dd>
          <dt><RichText>{`Adding simple returns, $1 + ${k}\\,\\Ret{R}$`}</RichText></dt>
          <dd>{signedDollars(added[k])} (wrong)</dd>
        </dl>
      }
      caption="Solid: the same simple return compounded each period. Dashed: what you get if you add the simple returns instead. The gap is the error from adding returns that should be multiplied."
    />
  );
}
