import { Line, useMovable, useTransformContext, vec } from 'mafs';
import { useMemo, useRef, useState } from 'react';
import { arithmeticMean } from '../../lib/finance/returns';
import { ols } from '../../lib/stats/ols';
import { Button, Segmented, Select } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { PlotFrame } from './PlotFrame';
import { DEFAULT_SEED, PORTFOLIO, simulatedSample, useMarketSample, type RegressionSample, type Source } from './regressionSample';

type Errors = 'classical' | 'white';
type Vec = [number, number];
const HEIGHT = 340;
const ERROR_NAMES: Record<Errors, string> = { classical: 'classical', white: 'White' };
const SOURCE_NAMES: Record<Source, string> = {
  data: 'real data: big value',
  even: 'simulated: even noise',
  fan: 'simulated: fanning noise',
};

const pct = (v: number, digits = 0) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 2) => (Number.isFinite(v) ? `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}` : 'not available');
const month = (iso: string) => iso.slice(0, 7);

/** One observation the reader can drag, or move with the arrow keys once focused (Shift: bigger steps). */
function DragDot({ point, onMove, constrain, label }: { point: Vec; onMove: (p: Vec) => void; constrain: (p: Vec) => Vec; label: string }) {
  const ref = useRef<SVGGElement>(null);
  const [focused, setFocused] = useState(false);
  const { dragging } = useMovable({ gestureTarget: ref, onMove, point, constrain });
  const { viewTransform, userTransform } = useTransformContext();
  const [cx, cy] = vec.transform(point, vec.matrixMult(viewTransform, userTransform));
  return (
    <g ref={ref} tabIndex={0} role="button" aria-roledescription="draggable point" aria-label={label} className="mafs-movable-point"
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
      {/* 44px touch target; Mafs's own stylesheet blanks fills, so set them inline. */}
      <circle cx={cx} cy={cy} r={22} style={{ fill: 'transparent' }} />
      {focused && <circle cx={cx} cy={cy} r={9} style={{ fill: 'none', stroke: 'var(--ui-accent)', strokeWidth: 2 }} />}
      <circle cx={cx} cy={cy} r={dragging || focused ? 5.5 : 4} style={{ fill: 'var(--c-data)', fillOpacity: 0.85 }} />
    </g>
  );
}

/**
 * Chapter 3: a scatter of one excess return on the market's, with the OLS line, its residuals, and
 * lines at the slope ± 2 standard errors, classical or White. Every dot can be dragged.
 * Real data (ff25-size-bm-monthly with ff3-monthly) or a seeded simulation with even or fanning noise.
 */
export default function RegressionLab({ initialSource = 'data' }: { initialSource?: Source }) {
  const [source, setSource] = useState<Source>(initialSource);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [errors, setErrors] = useState<Errors>('classical');
  const { data, failed } = useMarketSample();

  const base: RegressionSample | null = useMemo(
    () => (source === 'data' ? data : simulatedSample(seed, source === 'fan')),
    [source, seed, data],
  );
  // Dragged positions belong to one sample; a new sample (or Reset) starts from its own points.
  const [moved, setMoved] = useState<{ base: RegressionSample | null; points: Vec[] }>({ base: null, points: [] });
  const points: Vec[] = base ? (moved.base === base ? moved.points : base.x.map((x, t) => [x, base.y[t]])) : [];

  // The axes stay put while the reader drags, so a moved dot is visibly moved.
  const box = useMemo(() => {
    if (!base) return null;
    const [xLo, xHi] = extent(base.x);
    const [yLo, yHi] = extent(base.y);
    const px = (xHi - xLo) * 0.1;
    const py = (yHi - yLo) * 0.1;
    return { x0: xLo - px, x1: xHi + px, y0: yLo - py, y1: yHi + 2 * py };
  }, [base]);

  const fit = useMemo(() => {
    if (points.length < 3) return null;
    const x = points.map((p) => p[0]);
    const y = points.map((p) => p[1]);
    try {
      return { ...ols(y, [x], { errors }), xBar: arithmeticMean(x) };
    } catch {
      return null; // every dot dragged onto one vertical line: no slope exists
    }
  }, [points, errors]);

  const se = useTweened(fit ? fit.standardErrors[1] : 0);

  if (!base || !box) {
    return (
      <WidgetFrame title="How much does a stock move with the market?" ariaLabel="Scatter of a portfolio's excess return against the market's. The data is loading." plotHeight={HEIGHT}
        plot={<p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>}
        readout={<p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>} />
    );
  }

  const { x0, x1, y0, y1 } = box;
  const constrain = ([x, y]: Vec): Vec => [Math.min(Math.max(x, x0), x1), Math.min(Math.max(y, y0), y1)];
  const move = (i: number) => (p: Vec) => setMoved({ base, points: points.map((q, j) => (j === i ? p : q)) });
  const a = fit?.coefficients[0] ?? NaN;
  const b = fit?.coefficients[1] ?? NaN;
  // The dashed lines pivot on the point of means, which the OLS line always passes through.
  const line = (x: number, slope = b) => (fit ? a + b * fit.xBar + slope * (x - fit.xBar) : 0);
  // Endpoints of a line clipped to the plot box, so steep dashed lines stay off the tick labels.
  const ends = (slope = b): [Vec, Vec] => {
    const pivot = line(fit ? fit.xBar : 0);
    const xAt = (y: number) => (fit ? fit.xBar : 0) + (y - pivot) / slope;
    const clip = (x: number): Vec => {
      const y = line(x, slope);
      return y < y0 ? [xAt(y0), y0] : y > y1 ? [xAt(y1), y1] : [x, y];
    };
    return [clip(x0), clip(x1)];
  };
  const isData = source === 'data';
  const period = isData ? `${month(base.dates[0])} to ${month(base.dates.at(-1)!)}` : '';
  const yName = isData ? `${PORTFOLIO} excess return` : 'stock excess return';

  const plot = (
    <PlotFrame
      x={[x0, x1]}
      y={[y0, y1]}
      height={HEIGHT}
      xTicks={niceTicks(x0, x1, 5)}
      yTicks={niceTicks(y0, y1, 6)}
      formatX={(v) => pct(v)}
      formatY={(v) => pct(v)}
      xLabel="market excess return, per month"
      yLabel={`${yName}, per month`}
      baseline={y0 < 0 && y1 > 0 ? 0 : undefined}
    >
      {fit && points.map(([x, y], i) => (
        <Line.Segment key={`e${i}`} point1={[x, y]} point2={[x, line(x)]} color="var(--c-error)" weight={1} opacity={0.5} />
      ))}
      {fit && [b - 2 * se, b + 2 * se].map((slope, i) => (
        <Line.Segment key={`band${i}`} point1={ends(slope)[0]} point2={ends(slope)[1]} color="var(--c-model)" weight={1.5} opacity={0.7} style="dashed" />
      ))}
      {fit && <Line.Segment point1={ends()[0]} point2={ends()[1]} color="var(--c-model)" weight={2.5} />}
      {points.map((p, i) => (
        <DragDot key={i} point={p} onMove={move(i)} constrain={constrain}
          label={`${isData ? month(base.dates[i]) : `Month ${i + 1}`}: market ${pct(p[0], 1)}, ${yName} ${pct(p[1], 1)}. Arrow keys move it.`} />
      ))}
    </PlotFrame>
  );

  const name = isData ? `${PORTFOLIO} from ${period}` : `the simulation with seed ${seed}`;
  return (
    <WidgetFrame
      title="How much does a stock move with the market?"
      ariaLabel={
        fit
          ? `Scatter of ${points.length} months from ${name}: the market excess return across, the ${yName} up. The fitted line has slope ${num(b)} with a ${ERROR_NAMES[errors]} standard error of ${num(fit.standardErrors[1])}; dashed lines show the slope plus and minus two standard errors. R-squared is ${pct(fit.r2, 1)}. Thin vertical lines show the residuals. Every dot can be focused and moved with the arrow keys.`
          : `Scatter of ${points.length} months from ${name}. No line fits: every dot has the same market return.`
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Standard errors" value={errors} onChange={setErrors} options={[
            { value: 'classical', label: 'classical' },
            { value: 'white', label: 'White' },
          ]} />
          <Select label="Data" value={source} onChange={setSource} options={(Object.keys(SOURCE_NAMES) as Source[]).map((value) => ({ value, label: SOURCE_NAMES[value] }))} />
          <Button onClick={() => setMoved({ base: null, points: [] })}>Reset dragged dots</Button>
          <Button onClick={() => { if (isData) setSource('fan'); setSeed((s) => s + 1); }}>Re-roll simulation</Button>
        </>
      }
      readout={
        fit ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-data)' }}>● dots: months</span> ·{' '}
              <span style={{ color: 'var(--c-model)' }}>thick line: OLS fit</span> ·{' '}
              <span style={{ color: 'var(--c-model)' }}>dashed: slope ± 2 se</span> ·{' '}
              <span style={{ color: 'var(--c-error)' }}>thin lines: residuals</span>
            </p>
            <dl className="readout-grid">
              <dt><RichText>{'Intercept $\\hat a$'}</RichText></dt>
              <dd>{pct(a, 2)} a month</dd>
              <dt><RichText>{'Slope (beta) $\\hat\\beta$'}</RichText></dt>
              <dd style={{ color: 'var(--c-model)' }}>{num(b)}</dd>
              <dt><RichText>{`Standard error of $\\hat\\beta$ (${ERROR_NAMES[errors]})`}</RichText></dt>
              <dd>{num(fit.standardErrors[1], 3)}</dd>
              <dt><RichText>{'$t$-statistic for $\\beta = 0$'}</RichText></dt>
              <dd>{num(fit.tStats[1])}</dd>
              <dt><RichText>{'$R^2$'}</RichText></dt>
              <dd>{pct(fit.r2, 1)}</dd>
              <dt>Months</dt>
              <dd>{fit.nobs}{isData ? `, ${period}` : `, seed ${seed}`}</dd>
            </dl>
          </>
        ) : (
          <p>No line fits: every dot has the same market return. Press "Reset dragged dots".</p>
        )
      }
      caption={
        isData
          ? `Data: ff25-size-bm-monthly (portfolio ${PORTFOLIO}: the largest fifth of US stocks by size, highest fifth by book-to-market) and ff3-monthly (Mkt-RF, RF), Kenneth French Data Library, ${period}. Excess return = portfolio return − RF. Returns in percent per month. Drag a dot, or focus it and use the arrow keys.`
          : `Simulated (seeded): ${points.length} months of a market excess return with mean 0.5% and volatility 4.5% a month, and a stock with true $\\beta = 1.2$ and noise of 4% a month on average. ${source === 'fan' ? 'Here the noise is small in calm months and large when the market moves a lot.' : 'Here the noise has the same size every month.'} Both cases use the same random draws. Re-roll for a new seed.`
      }
    />
  );
}
