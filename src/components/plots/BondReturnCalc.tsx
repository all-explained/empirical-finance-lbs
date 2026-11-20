import { Line, Point, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { holdingReturns, returnDecomposition } from '../../lib/finance/bonds';
import { Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useBondView } from './bondSample';
import { percent } from './format';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 300;
const MATURITIES = Array.from({ length: 30 }, (_, i) => i + 1);
/** The Hook's example: the 10-year bond bought at the end of 2021. */
const START_DATE = '2021-12';

const pct = (v: number) => percent(v, 2).replace('+', '');
const signed = (v: number) => percent(v, 2);
const tone = (v: number) => (v < 0 ? 'bad' : v > 0 ? 'good' : undefined);

/**
 * Chapter 40: buy the n-year zero-coupon bond at the end of one month and sell it, as an (n - 1)-year bond, twelve
 * months later. The plot shows the GSW zero curves at purchase and at sale; the readout splits the log return into
 * the yield, the roll-down and the shift with `returnDecomposition`.
 */
export default function BondReturnCalc() {
  const { view, failed } = useBondView();
  const [n, setN] = useState(10);
  // Purchase months are those with a sale month on the curve: the dates of holdingReturns.
  const buys = useMemo(() => (view ? holdingReturns(view.curve, 2).map((h) => h.date) : []), [view]);
  const [k, setK] = useState<number | null>(null);
  const start = Math.max(0, buys.findIndex((d) => d.startsWith(START_DATE)));
  const i = Math.min(k ?? start, Math.max(0, buys.length - 1));

  const controls = (
    <>
      <Slider label="Maturity at purchase $n$" value={n} min={2} max={30} onChange={setN} format={(v) => `${v} years`} color="var(--c-return)" />
      <Slider label="Purchase month" value={i} min={0} max={Math.max(0, buys.length - 1)} onChange={setK} format={() => buys[i]?.slice(0, 7) ?? ''} />
    </>
  );

  if (!view || !buys.length) {
    const message = failed ? 'The data did not load.' : 'Loading the data…';
    return (
      <WidgetFrame
        title="Buy a bond, sell it a year later"
        ariaLabel="The one-year return of a Treasury zero-coupon bond. The data is loading."
        plotHeight={HEIGHT}
        plot={<p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{message}</p>}
        controls={controls}
        readout={<p>{message}</p>}
      />
    );
  }

  const { curve } = view;
  const parts = returnDecomposition(curve, buys[i], n)!;
  const now = curve.y[curve.dates.indexOf(parts.date)];
  const later = curve.y[curve.dates.indexOf(parts.sold)];
  const [bought, sold] = [parts.date.slice(0, 7), parts.sold.slice(0, 7)];
  const top = Math.ceil(Math.max(...now, ...later) * 100 + 0.5) / 100;
  const yTicks = Array.from({ length: Math.floor(top * 100 / (top > 0.06 ? 2 : 1)) + 1 }, (_, j) => j * (top > 0.06 ? 0.02 : 0.01));

  const plot = (
    <PlotFrame
      x={[0, 30]}
      y={[0, top]}
      height={HEIGHT}
      xTicks={[1, 5, 10, 15, 20, 25, 30]}
      yTicks={yTicks}
      formatY={(v) => `${Math.round(v * 100)}%`}
      xLabel="maturity, years"
      yLabel="zero-coupon yield, % a year"
      marginLeft={40}
    >
      <Polyline points={MATURITIES.map((m) => [m, now[m - 1]])} color="var(--c-data)" weight={3} fillOpacity={0} />
      <Polyline points={MATURITIES.map((m) => [m, later[m - 1]])} color="var(--c-data)" weight={2} strokeStyle="dashed" fillOpacity={0} />
      <Line.Segment point1={[n, now[n - 1]]} point2={[n - 1, now[n - 2]]} color="var(--c-return)" weight={2} opacity={0.7} />
      <Line.Segment point1={[n - 1, now[n - 2]]} point2={[n - 1, later[n - 2]]} color="var(--c-return)" weight={2} opacity={0.7} style="dashed" />
      <Point x={n} y={now[n - 1]} color="var(--c-return)" svgCircleProps={{ r: 6 }} />
      <Point x={n - 1} y={later[n - 2]} color="var(--c-return)" svgCircleProps={{ r: 6, style: { fill: 'none', stroke: 'var(--c-return)', strokeWidth: 2.5 } }} />
      <Label x={n} y={now[n - 1]} attach="n" attachDistance={10} size={12} color="var(--c-return)">buy</Label>
      <Label x={n - 1} y={later[n - 2]} attach="s" attachDistance={10} size={12} color="var(--c-return)">sell</Label>
    </PlotFrame>
  );

  return (
    <WidgetFrame
      title="Buy a bond, sell it a year later"
      ariaLabel={`Two zero-coupon yield curves: the solid one at the end of ${bought}, when a ${n}-year bond is bought at a yield of ${pct(parts.yield)}, and the dashed one at the end of ${sold}, when it is sold as a ${n - 1}-year bond at a yield of ${pct(later[n - 2])}. The log return is ${signed(parts.r)}: the yield ${signed(parts.yield)}, the roll-down ${signed(parts.rollDown)} and the shift ${signed(parts.shift)}. The excess return over the 1-year yield is ${signed(parts.rx)}, and the simple return ${signed(parts.simple)}.`}
      plotHeight={HEIGHT}
      plot={plot}
      controls={controls}
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--c-data)', display: 'block' }}>— solid: curve at purchase, {bought}</span>
            <span style={{ color: 'var(--c-data)', display: 'block' }}>– – dashed: curve at sale, {sold}</span>
            <span style={{ color: 'var(--c-return)', display: 'block' }}>● buy at {n} years, ○ sell at {n - 1}</span>
          </p>
          <dl className="readout-grid">
            <dt><RichText>{'Yield $y^{(n)}_t$'}</RichText></dt>
            <dd className={tone(parts.yield)}>{signed(parts.yield)}</dd>
            <dt>+ Roll-down</dt>
            <dd className={tone(parts.rollDown)}>{signed(parts.rollDown)}</dd>
            <dt>+ Shift of the curve</dt>
            <dd className={tone(parts.shift)}>{signed(parts.shift)}</dd>
            <dt><RichText>{'= Log return $\\Ret{r^{(n)}_{t+1}}$'}</RichText></dt>
            <dd className={tone(parts.r)}>{signed(parts.r)}</dd>
            <dt><RichText>{'− 1-year yield $\\Rf{y^{(1)}_t}$'}</RichText></dt>
            <dd>{signed(-now[0])}</dd>
            <dt><RichText>{'= Excess $\\Ret{rx^{(n)}_{t+1}}$'}</RichText></dt>
            <dd className={tone(parts.rx)}>{signed(parts.rx)}</dd>
            <dt>Simple return</dt>
            <dd className={tone(parts.simple)}>{signed(parts.simple)}</dd>
          </dl>
        </>
      }
      caption={`Data: gsw-zero-coupon (Gürkaynak, Sack and Wright, Federal Reserve Board), end of month; purchases from ${buys[0].slice(0, 7)} to ${buys.at(-1)!.slice(0, 7)}, each sold twelve months later. All rates are continuously compounded, in % for the year held. Yield: the return if the yield stayed put. Roll-down: the gain from moving one year down today's curve. Shift: the gain or loss from the move of the curve at n − 1 years. Simple return = e^r − 1.`}
    />
  );
}
