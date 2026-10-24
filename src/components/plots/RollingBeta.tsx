import { Point, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { PlotFrame } from './PlotFrame';
import { FACTORS, quarterBetas, rollingView, SAMPLE, useShortWindowData, type Factor } from './shortWindowSample';

const HEIGHT = 320;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;

/**
 * Chapter 23: the market beta of HML or Mom over time. A line shows rolling betas from monthly data
 * with a window slider; dots show the within-quarter betas from daily data.
 */
export default function RollingBeta({ initialFactor = 'HML', initialWindow = 36 }: { initialFactor?: Factor; initialWindow?: number }) {
  const [factor, setFactor] = useState<Factor>(initialFactor);
  const [window, setWindow] = useState(initialWindow);
  const { data, failed } = useShortWindowData();

  const quarters = useMemo(() => (data ? quarterBetas(data, factor) : null), [data, factor]);
  const rolling = useMemo(() => (data ? rollingView(data, factor, window) : null), [data, factor, window]);

  // The quarterly dots set the range, so the window slider never rescales the plot.
  const [lo, hi] = quarters ? extent(quarters.beta) : [-1, 1];
  const bottom = useTweened(lo - 0.1);
  const top = useTweened(hi + 0.25);
  const x0 = 1964;
  const x1 = 2026.5;
  const name = FACTORS.find((f) => f.value === factor)!.label;

  const plot = quarters && rolling ? (
    <PlotFrame
      x={[x0, x1]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={niceTicks(x0, x1, 6)}
      yTicks={niceTicks(bottom, top, 6)}
      formatY={(v) => num(v, 1)}
      xLabel="year"
      yLabel={`market beta of ${factor}`}
      baseline={0}
      marginLeft={44}
    >
      {quarters.beta.map((b, i) => (
        <Point key={quarters.period[i]} x={quarters.x[i]} y={b} color="var(--text)" svgCircleProps={{ r: 2.5, style: { opacity: 0.5 } }} />
      ))}
      <Polyline points={rolling.x.map((x, i) => [x, rolling.beta[i]])} color="var(--c-data)" weight={2.5} fillOpacity={0} />
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const lowest = quarters ? quarters.beta.indexOf(Math.min(...quarters.beta)) : 0;
  const highest = quarters ? quarters.beta.indexOf(Math.max(...quarters.beta)) : 0;

  return (
    <WidgetFrame
      title="How much does a market beta move?"
      ariaLabel={
        quarters && rolling
          ? `Market beta of ${name} from ${SAMPLE.first} to ${SAMPLE.last}. A line shows ${window}-month rolling betas from monthly returns, with a standard deviation of ${rolling.sigmaBeta.toFixed(2)}. ${quarters.beta.length} dots show betas estimated each quarter from daily returns, from ${num(quarters.beta[lowest])} in ${quarters.period[lowest]} to ${num(quarters.beta[highest])} in ${quarters.period[highest]}, with a standard deviation of ${quarters.sigmaBeta.toFixed(2)}.`
          : 'Rolling and quarterly market betas. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Factor" value={factor} onChange={setFactor} options={FACTORS.map((f) => ({ ...f, color: 'var(--c-factor)' }))} />
          <Slider label="Rolling window" value={window} min={12} max={120} step={6} onChange={setWindow} format={(v) => `${v} months`} color="var(--c-data)" />
        </>
      }
      readout={
        quarters && rolling ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-data)' }}>solid line: {window}-month rolling beta</span> ·{' '}
              <span>● dots: one quarter of daily returns</span>
            </p>
            <dl className="readout-grid">
              <dt><RichText>{`$\\sigma$ of ${window}-month rolling betas`}</RichText></dt>
              <dd style={{ color: 'var(--c-data)' }}>{rolling.sigmaBeta.toFixed(2)}</dd>
              <dt><RichText>{'$\\sigma(\\hat\\beta_{i,q})$ of quarterly betas'}</RichText></dt>
              <dd>{quarters.sigmaBeta.toFixed(2)}</dd>
              <dt><RichText>{'Implied $\\sigma(\\beta_{i,q})$ of true betas'}</RichText></dt>
              <dd>{quarters.sigmaBetaTrue.toFixed(2)}</dd>
              <dt>Average s.e. of one quarterly beta</dt>
              <dd>{quarters.meanBetaSE.toFixed(2)}</dd>
              <dt>Lowest quarter</dt>
              <dd>{num(quarters.beta[lowest])} in {quarters.period[lowest]}</dd>
              <dt>Highest quarter</dt>
              <dd>{num(quarters.beta[highest])} in {quarters.period[highest]}</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ff3-monthly and mom-monthly for the line, ff3-daily and mom-daily for the dots (Kenneth French Data Library), ${SAMPLE.first} to ${SAMPLE.last}. Line: OLS slope of the factor's monthly return on Mkt-RF over the window that ends in each month (windows may start before ${SAMPLE.first}). Dots: one regression per calendar quarter on daily returns, with the market's same-day return, its lag and the average of lags 2–4; the beta is the sum of the three slopes (Lewellen and Nagel (2006), Eq. 7). Implied true σ: √(σ(β̂)² − average squared standard error).`}
    />
  );
}
