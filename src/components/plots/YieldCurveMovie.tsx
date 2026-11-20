import { Point, Polyline } from 'mafs';
import { useEffect, useState } from 'react';
import { Button, Segmented, Slider } from '../ui/controls';
import { WidgetFrame } from '../ui/WidgetFrame';
import { CURVE_KINDS, curveRows, treasuryRow, useBondView, type CurveKind } from './bondSample';
import { percent } from './format';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 300;
/** Milliseconds per month while the movie plays. */
const TICK = 120;
/** Fixed axis, so the movie never rescales: every GSW curve and every FRED yield since 1985-11 lies inside it. */
const Y_RANGE: [number, number] = [0, 0.12];
const MATURITIES = Array.from({ length: 30 }, (_, i) => i + 1);
const NAMES: Record<CurveKind, string> = { zero: 'Zero', forward: 'Forward', par: 'Par' };
const LONG_NAMES: Record<CurveKind, string> = {
  zero: 'zero-coupon yield',
  forward: 'one-year forward rate',
  par: 'par yield (semi-annual coupons)',
};

const pct = (v: number) => percent(v, 2).replace('+', '');
const pp = (v: number) => `${percent(v, 2).replace('%', '')} pts`;

/**
 * Chapter 40: the GSW curve of one month, as zero-coupon yields, one-year forward rates or par yields, with FRED's
 * constant-maturity par yields as rings on the par view. A play button steps through the months.
 */
export default function YieldCurveMovie() {
  const { view, failed } = useBondView();
  const [kind, setKind] = useState<CurveKind>('zero');
  const [month, setMonth] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const T = view?.curve.dates.length ?? 1;
  // Start on the latest month once the data is in.
  const t = Math.min(month ?? T - 1, T - 1);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setMonth((m) => {
      const next = (m ?? T - 1) + 1;
      if (next >= T) { setPlaying(false); return T - 1; }
      return next;
    }), TICK);
    return () => clearInterval(id);
  }, [playing, T]);

  const stepTo = (m: number) => { setPlaying(false); setMonth(Math.max(0, Math.min(T - 1, m))); };
  const play = () => {
    if (!playing && t >= T - 1) setMonth(0);
    setPlaying((p) => !p);
  };

  const controls = (
    <>
      <Segmented label="Curve" value={kind} onChange={setKind} options={CURVE_KINDS.map((k) => ({ value: k, label: NAMES[k] }))} />
      <Slider label="Month" value={t} min={0} max={T - 1} onChange={stepTo} format={() => view?.curve.dates[t].slice(0, 7) ?? ''} />
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button onClick={() => stepTo(t - 1)} disabled={!view || t === 0}>◀ Back</Button>
        <Button onClick={play} disabled={!view}>{playing ? '❚❚ Pause' : '▶ Play'}</Button>
        <Button onClick={() => stepTo(t + 1)} disabled={!view || t >= T - 1}>Next ▶</Button>
      </div>
    </>
  );

  if (!view) {
    const message = failed ? 'The data did not load.' : 'Loading the data…';
    return (
      <WidgetFrame
        title="The yield curve, month by month"
        ariaLabel="The US Treasury yield curve of one month. The data is loading."
        plotHeight={HEIGHT}
        plot={<p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{message}</p>}
        controls={controls}
        readout={<p>{message}</p>}
      />
    );
  }

  const date = view.curve.dates[t].slice(0, 7);
  const row = curveRows(view, kind)[t];
  const zero = view.curve.y[t];
  const fred = kind === 'par' ? treasuryRow(view.treasury, date) : null;
  const slope = row[9] - row[0];
  const first = view.curve.dates[0].slice(0, 7);
  const last = view.curve.dates[T - 1].slice(0, 7);

  const plot = (
    <PlotFrame
      x={[0, 30]}
      y={Y_RANGE}
      height={HEIGHT}
      xTicks={[1, 5, 10, 15, 20, 25, 30]}
      yTicks={[0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12]}
      formatY={(v) => `${Math.round(v * 100)}%`}
      xLabel="maturity n, years"
      yLabel="rate, % a year"
      marginLeft={40}
    >
      {kind !== 'zero' && (
        <Polyline points={MATURITIES.map((n) => [n, zero[n - 1]])} color="var(--text-muted)" weight={1.5} strokeStyle="dashed" fillOpacity={0} />
      )}
      <Polyline points={MATURITIES.map((n) => [n, row[n - 1]])} color="var(--c-data)" weight={3} fillOpacity={0} />
      {fred && view.treasury.maturities.map((n, i) => (
        <Point key={n} x={n} y={fred[i]} color="var(--text)" svgCircleProps={{ r: 5, style: { fill: 'none', stroke: 'var(--text)', strokeWidth: 2 } }} />
      ))}
      <Label x={30} y={Y_RANGE[1]} attach="sw" attachDistance={6} size={13} color="var(--text-muted)">{date}</Label>
    </PlotFrame>
  );

  const fredNote = kind !== 'par' ? '' : fred
    ? ` Rings: FRED's constant-maturity par yields for the month, 10-year ${pct(fred[5])}.`
    : ' FRED has no yields for this month.';

  return (
    <WidgetFrame
      title="The yield curve, month by month"
      ariaLabel={`The GSW ${LONG_NAMES[kind]} curve at the end of ${date}, for maturities of 1 to 30 years: ${pct(row[0])} at 1 year, ${pct(row[9])} at 10 years and ${pct(row[29])} at 30 years, so the 10-year minus 1-year slope is ${pp(slope)}.${kind === 'zero' ? '' : ' The dashed line is the zero-coupon curve.'}${fredNote}`}
      plotHeight={HEIGHT}
      plot={plot}
      controls={controls}
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--c-data)', display: 'block' }}>— solid: GSW, {NAMES[kind].toLowerCase()} curve</span>
            {kind !== 'zero' && <span className="muted" style={{ display: 'block' }}>– – dashed: GSW, zero curve</span>}
            {kind === 'par' && <span style={{ display: 'block' }}>○ rings: FRED, {fred ? 'monthly average' : 'none this month'}</span>}
          </p>
          <dl className="readout-grid">
            <dt>Month</dt>
            <dd>{date}</dd>
            <dt>1 year</dt>
            <dd>{pct(row[0])}</dd>
            <dt>10 years</dt>
            <dd>{pct(row[9])}</dd>
            <dt>30 years</dt>
            <dd>{pct(row[29])}</dd>
            <dt>Slope, 10y − 1y</dt>
            <dd className={slope < 0 ? 'bad' : undefined}>{pp(slope)}{slope < 0 ? ', inverted' : ''}</dd>
          </dl>
        </>
      }
      caption={`Data: gsw-zero-coupon (Gürkaynak, Sack and Wright, Federal Reserve Board), end of month, ${first} to ${last}, ${T} months, and fred-treasury-monthly (Board H.15 via FRED). Zero: continuously compounded zero-coupon yields. Forward: the one-year rate from n − 1 to n years locked in today. Par: the coupon rate, paid twice a year, at which a GSW-priced bond is worth 1. FRED's constant-maturity yields are par yields with semi-annual coupons, averaged over the month's days, while GSW is observed on the month's last day, so the two can differ; FRED has no months from 1987-01 to 1993-09.`}
    />
  );
}
