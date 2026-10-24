import { Line, Point, Polygon, Polyline } from 'mafs';
import { useEffect, useMemo, useState } from 'react';
import { arithmeticMean } from '../../lib/finance/returns';
import { factorPanel, type FactorModel } from '../../lib/finance/timeSeriesTests';
import { invCdf } from '../../lib/math/normal';
import { annualiseMean } from '../../lib/stats/moments';
import { Button, Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { usePrefersReducedMotion, useTweened } from './animation';
import { BAND_START, famaMacBethMovie } from './famaMacBethSample';
import { useFactorData } from './factorTestSample';
import { niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';

const START = '1963-07-01';
const CROSS_HEIGHT = 280;
const RUN_HEIGHT = 220;
const PLOT_HEIGHT = CROSS_HEIGHT + RUN_HEIGHT;
/** Milliseconds per month while the movie plays. */
const TICK = 70;
/** The running mean axis, in % a year; early months can leave it and are drawn at its edge. */
const RUN_RANGE: [number, number] = [-0.3, 0.3];
const Z = invCdf(0.975);

const pct = (v: number, digits = 1) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const clamp = (v: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, v));
const decimalYear = (date: string) => Number(date.slice(0, 4)) + (Number(date.slice(5, 7)) - 1) / 12;

/**
 * Chapter 17: each month, the 25 size–B/M portfolios' excess returns against their full-sample
 * market betas with that month's Fama–MacBeth fit, beside the running mean of the market slope λ̂_t
 * with its 95% band. CAPM or FF3; for FF3 the right panel shows the market slope.
 */
export default function FamaMacBethMovie() {
  const [model, setModel] = useState<FactorModel>('capm');
  const { data, failed } = useFactorData();
  const panel = useMemo(() => (data ? factorPanel(data.ff3, data.ff25, { start: START, model }) : null), [data, model]);
  const movie = useMemo(() => (panel ? { ...famaMacBethMovie(panel), dates: panel.dates } : null), [panel]);
  const T = movie?.dates.length ?? 1;
  const [month, setMonth] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = usePrefersReducedMotion();

  // Autoplay once on mount, unless the reader prefers reduced motion.
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(true);
  }, []);
  useEffect(() => { if (reduced) setPlaying(false); }, [reduced]);
  useEffect(() => {
    if (!playing || !movie) return;
    const id = setInterval(() => setMonth((m) => {
      if (m + 1 >= T) { setPlaying(false); return m; }
      return m + 1;
    }), TICK);
    return () => clearInterval(id);
  }, [playing, movie, T]);

  const t = Math.min(month, T - 1);
  // One tween drives the whole frame: dots and fit slide from one month to the next.
  const shown = useTweened(t, playing ? TICK : 400);

  const frame = useMemo(() => {
    if (!movie || !panel) return null;
    const lo = Math.max(0, Math.min(T - 1, Math.floor(shown)));
    const hi = Math.min(T - 1, lo + 1);
    const w = shown - lo;
    const mix = (a: number, b: number) => a + (b - a) * w;
    const returns = panel.excess[lo].map((r, i) => mix(r, panel.excess[hi][i]));
    const fitted = movie.fm.fitted[lo].map((f, i) => mix(f, movie.fm.fitted[hi][i]));
    const slope = mix(movie.fm.monthly[lo][0], movie.fm.monthly[hi][0]);
    const intercept = mix(movie.fm.intercept!.monthly[lo], movie.fm.intercept!.monthly[hi]);
    return { returns, fitted, slope, intercept };
  }, [movie, panel, shown, T]);

  const marketBeta = movie ? movie.beta.map((b) => b[0]) : [0.8, 1.5];
  const x0 = Math.floor(Math.min(...marketBeta) * 10) / 10 - 0.05;
  const x1 = Math.ceil(Math.max(...marketBeta) * 10) / 10 + 0.05;
  const reach = frame ? Math.max(0.1, ...frame.returns.map(Math.abs), ...frame.fitted.map(Math.abs)) : 0.1;
  const yHalf = useTweened(Math.ceil(reach * 20) / 20 + 0.02, 400);

  const years = movie ? movie.dates.map(decimalYear) : [1963.5, 2026.6];
  const runStart = BAND_START - 1;
  const running = movie ? movie.fm.runningMean.map((row) => annualiseMean(row[0])) : [];
  const half = movie ? movie.runningSE.map((se) => (Number.isNaN(se) ? NaN : Z * annualiseMean(se))) : [];
  const upTo = Math.max(runStart, t);
  const runPoints = (offset: (s: number) => number) => years.slice(runStart, upTo + 1)
    .map((year, k) => [year, clamp(running[runStart + k] + offset(runStart + k), RUN_RANGE)] as [number, number]);
  const factorMean = panel ? annualiseMean(arithmeticMean(panel.factors.map((f) => f[0]))) : 0;

  const lambda = movie ? movie.fm.monthly[t] : [0];
  const runMean = running[t] ?? 0;
  const runHalf = half[t];
  const date = movie ? movie.dates[t].slice(0, 7) : '';
  const isFF3 = model === 'ff3';

  const plot = movie && panel && frame ? (
    <>
      <PlotFrame
        x={[x0, x1]}
        y={[-yHalf, yHalf]}
        height={CROSS_HEIGHT}
        xTicks={niceTicks(x0, x1, 5)}
        yTicks={niceTicks(-yHalf, yHalf, 6)}
        formatX={(v) => num(v, 1)}
        formatY={(v) => pct(v, 0)}
        xLabel="market beta β (first pass, whole sample)"
        yLabel={<tspan style={{ fill: 'var(--c-data)' }}>excess return this month</tspan>}
        baseline={0}
        marginLeft={46}
      >
        {marketBeta.map((b, i) => (
          <Line.Segment key={`e${i}`} point1={[b, frame.returns[i]]} point2={[b, frame.fitted[i]]} color="var(--c-error)" weight={1.5} opacity={0.55} />
        ))}
        {!isFF3 && (
          <Line.Segment
            point1={[x0, frame.intercept + frame.slope * x0]}
            point2={[x1, frame.intercept + frame.slope * x1]}
            color="var(--c-model)"
            weight={2.5}
          />
        )}
        {isFF3 && marketBeta.map((b, i) => (
          <Point key={`f${i}`} x={b} y={frame.fitted[i]} color="var(--c-model)" svgCircleProps={{ r: 4, style: { fill: 'none', stroke: 'var(--c-model)', strokeWidth: 2 } }} />
        ))}
        {marketBeta.map((b, i) => (
          <Point key={`p${i}`} x={b} y={frame.returns[i]} color="var(--c-data)" opacity={0.9} svgCircleProps={{ r: 4 }} />
        ))}
        <Label x={x1} y={yHalf} attach="sw" attachDistance={6} size={13} color="var(--text-muted)">{date}</Label>
      </PlotFrame>
      <PlotFrame
        x={[years[0], years.at(-1)!]}
        y={RUN_RANGE}
        height={RUN_HEIGHT}
        xTicks={niceTicks(years[0], years.at(-1)!, 6).filter((v) => v >= years[0] && v <= years.at(-1)!)}
        yTicks={niceTicks(RUN_RANGE[0], RUN_RANGE[1], 6)}
        formatY={(v) => pct(v, 0)}
        xLabel="month"
        yLabel={<tspan style={{ fill: 'var(--c-model)' }}>running mean of λ̂ₜ, % a year</tspan>}
        baseline={0}
        marginLeft={46}
      >
        <Line.Segment point1={[years[0], factorMean]} point2={[years.at(-1)!, factorMean]} color="var(--c-factor)" weight={1.5} style="dashed" />
        {t >= runStart && (
          <Polygon
            points={[...runPoints((s) => half[s]), ...runPoints((s) => -half[s]).reverse()]}
            color="var(--c-model)"
            fillOpacity={0.18}
            strokeOpacity={0}
          />
        )}
        {t >= runStart && <Polyline points={runPoints(() => 0)} color="var(--c-model)" weight={2.5} fillOpacity={0} />}
        <Line.Segment point1={[years[t], RUN_RANGE[0]]} point2={[years[t], RUN_RANGE[1]]} color="var(--text-muted)" weight={1} opacity={0.5} />
      </PlotFrame>
    </>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const stepTo = (m: number) => { setPlaying(false); setMonth(Math.max(0, Math.min(T - 1, m))); };

  return (
    <WidgetFrame
      title="Fama–MacBeth, one month at a time"
      ariaLabel={
        movie
          ? `Top: the excess returns of the 25 size and book-to-market portfolios in ${date}, against their market betas from ${num(Math.min(...marketBeta))} to ${num(Math.max(...marketBeta))}, with that month's ${isFF3 ? 'Fama–French three-factor fitted values' : 'CAPM fitted line'}. The market slope that month is ${pct(lambda[0])}. Bottom: the running mean of the monthly market slopes from ${movie.dates[0].slice(0, 7)} to ${date}, now ${pct(runMean)} a year${runHalf ? ` with a 95% band of plus or minus ${pct(runHalf)}` : ''}, against the dashed average market excess return of ${pct(factorMean)} a year.`
          : 'Fama–MacBeth movie of 25 portfolios. The data is loading.'
      }
      plotHeight={PLOT_HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Model" value={model} onChange={setModel} options={[
            { value: 'capm', label: 'CAPM' },
            { value: 'ff3', label: 'Fama–French 3' },
          ]} />
          <Slider label="Month" value={t} min={0} max={T - 1} onChange={stepTo} format={() => date} />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={() => stepTo(t - 1)} disabled={t === 0}>◀ Step back</Button>
            <Button onClick={() => { if (t >= T - 1) setMonth(0); setPlaying((p) => !p); }}>{playing ? '❚❚ Pause' : '▶ Play'}</Button>
            <Button onClick={() => stepTo(t + 1)} disabled={t >= T - 1}>Step ▶</Button>
          </div>
        </>
      }
      readout={
        movie ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-data)' }}>● dots: this month's returns</span> ·{' '}
              <span style={{ color: 'var(--c-model)' }}>{isFF3 ? '○ rings: FF3 fitted values' : 'line: this month\'s fit'}</span> ·{' '}
              <span style={{ color: 'var(--c-error)' }}>thin lines: residuals</span> ·{' '}
              <span style={{ color: 'var(--c-factor)' }}>– – mean market excess return</span>
            </p>
            <dl className="readout-grid">
              <dt>Month {t + 1} of {T}</dt>
              <dd>{date}</dd>
              <dt>Market excess return, this month</dt>
              <dd>{pct(panel!.factors[t][0])}</dd>
              <dt><RichText>{isFF3 ? 'Slopes $\\hat\\lambda_t$ this month (market, SMB, HML)' : 'Market slope $\\hat\\lambda_t$, this month'}</RichText></dt>
              <dd style={{ color: 'var(--c-model)' }}>{lambda.map((l) => pct(l)).join(', ')}</dd>
              <dt><RichText>{'Intercept $\\hat\\lambda_{0t}$, this month'}</RichText></dt>
              <dd>{pct(movie.fm.intercept!.monthly[t])}</dd>
              <dt>Running mean of the market slope, a year (95% band)</dt>
              <dd style={{ color: 'var(--c-model)' }}>{pct(runMean)}{runHalf ? ` ± ${pct(runHalf)}` : ' (band from month 12)'}</dd>
              <dt>Whole sample, a year (s.e., t)</dt>
              <dd>{pct(annualiseMean(movie.fm.lambda[0]))} ({pct(annualiseMean(movie.fm.se[0]))}, {num(movie.fm.tStats[0])})</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ff25-size-bm-monthly and ff3-monthly (Kenneth French Data Library), ${movie ? `${movie.dates[0].slice(0, 7)} to ${movie.dates.at(-1)!.slice(0, 7)}, ${T} months` : '1963-07 onward'}. First pass: OLS of each portfolio's excess return on ${isFF3 ? 'Mkt-RF, SMB and HML' : 'Mkt-RF'} over the whole sample. Second pass: each month, OLS of the 25 excess returns on a constant and the betas. ${isFF3 ? 'With FF3 the fit uses three betas, so its fitted values do not lie on one line against the market beta; the lower panel shows the market slope. ' : ''}Slopes ×12 to annualise; the band is ±1.96 Fama–MacBeth standard errors, which treat the betas as known.`}
    />
  );
}
