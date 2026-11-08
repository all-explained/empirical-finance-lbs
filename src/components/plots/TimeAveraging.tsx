import { Line, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { timeAveragedAutocorrelation, timeAveragedVarianceRatio } from '../../lib/finance/consumptionMeasurement';
import { Button, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { PlotFrame } from './PlotFrame';
import { AVERAGING, averagingSimulation, DEFAULT_AVERAGING_SEED } from './consumptionSample';

const SHOWN = 8;
const HEIGHT = 300;
const MAX_STEPS = 90;

const num = (v: number, digits = 3) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const pct = (v: number) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(1)}%`;

/**
 * Chapter 36: a seeded random walk in log consumption at a fine step, with the average over each period drawn
 * over it. The readout compares the sample and exact first-order autocorrelation of the averaged growth, and its
 * variance against that of point-to-point growth.
 */
export default function TimeAveraging({ initialSteps = MAX_STEPS }: { initialSteps?: number }) {
  const [n, setN] = useState(initialSteps);
  const [seed, setSeed] = useState(DEFAULT_AVERAGING_SEED);
  const sim = useMemo(() => averagingSimulation(seed, n), [seed, n]);

  const path = sim.path.slice(0, SHOWN * n + 1).map((v, s) => [s / n, v] as [number, number]);
  const averages = sim.averages.slice(0, SHOWN);
  const [lo, hi] = extent(path.map(([, v]) => v));
  const pad = (hi - lo) * 0.1 || 0.005;
  const bottom = useTweened(lo - pad);
  const top = useTweened(hi + 2 * pad);

  const plot = (
    <PlotFrame
      x={[0, SHOWN]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={Array.from({ length: SHOWN + 1 }, (_, t) => t)}
      yTicks={niceTicks(bottom, top, 4)}
      formatY={pct}
      xLabel="period (a quarter)"
      yLabel="log consumption"
    >
      <Polyline points={path} color="var(--text)" weight={1} strokeOpacity={0.55} fillOpacity={0} />
      {averages.map((a, t) => (
        <Line.Segment key={t} point1={[t, a]} point2={[t + 1, a]} color="var(--c-data)" weight={3.5} style="dashed" />
      ))}
    </PlotFrame>
  );

  return (
    <WidgetFrame
      title="Averaging a random walk over each period"
      ariaLabel={`A simulated random walk in log consumption (seed ${seed}) with ${n} step${n === 1 ? '' : 's'} a period, over ${SHOWN} periods, and a flat dashed segment at its average in each period. Growth of the averages has sample first-order autocorrelation ${num(sim.autocorrelation, 2)}, against an exact ${num(timeAveragedAutocorrelation(n), 2)}.`}
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Steps a period $n_{\text{avg}}$" value={n} min={1} max={MAX_STEPS} onChange={setN} format={(v) => `${v} step${v === 1 ? '' : 's'}`} color="var(--c-data)" />
          <Button onClick={() => setSeed((s) => s + 1)}>New seed</Button>
        </>
      }
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span>thin line: log consumption at each step</span> ·{' '}
            <span style={{ color: 'var(--c-data)' }}>– – thick dashes: its average over each period</span>
          </p>
          <dl className="readout-grid">
            <dt>First-order autocorrelation of averaged growth, sample</dt>
            <dd style={{ color: 'var(--c-data)' }}>{num(sim.autocorrelation)}</dd>
            <dt><RichText>{'Exact, $(n_{\\text{avg}}^2 - 1)/(2(2n_{\\text{avg}}^2 + 1))$'}</RichText></dt>
            <dd>{num(timeAveragedAutocorrelation(n))}</dd>
            <dt>Variance of averaged over point-to-point growth, sample</dt>
            <dd style={{ color: 'var(--c-data)' }}>{num(sim.varianceRatio)}</dd>
            <dt><RichText>{'Exact, $(2n_{\\text{avg}}^2 + 1)/(3n_{\\text{avg}}^2)$'}</RichText></dt>
            <dd>{num(timeAveragedVarianceRatio(n))}</dd>
            <dt>Seed</dt>
            <dd>{seed}</dd>
          </dl>
        </>
      }
      caption={`Simulated (seeded): a random walk in log consumption with no drift and a volatility of ${AVERAGING.volatility * 100}% a period, ${AVERAGING.periods} periods of $n_{\\text{avg}}$ steps each. The plot shows the first ${SHOWN} periods. The sample statistics use all ${AVERAGING.periods - 1} growth rates.`}
    />
  );
}
