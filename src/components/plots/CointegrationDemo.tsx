import { Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { Button, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { PlotFrame } from './PlotFrame';
import { DEFAULT_PAIR_SEED, PAIR, PAIR_LEADS, pairCombination, pairSample } from './caySample';

const TOP_HEIGHT = 220;
const BOTTOM_HEIGHT = 190;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;

/**
 * Chapter 14: two seeded trending series x_t and y_t = 0.6 x_t + u_t, and the combination
 * y_t − w x_t. The combination stops trending only near the true weight 0.6.
 */
export default function CointegrationDemo({ initialWeight = 0 }: { initialWeight?: number }) {
  const [w, setW] = useState(initialWeight);
  const [seed, setSeed] = useState(DEFAULT_PAIR_SEED);
  const pair = useMemo(() => pairSample(seed), [seed]);
  const { z, persistence } = useMemo(() => pairCombination(pair, w), [pair, w]);
  const t = pair.x.map((_, i) => i);
  const x1 = PAIR.T - 1;

  const [lo, hi] = extent([...pair.x, ...pair.y]);
  const pad = (hi - lo) * 0.06;
  const top0 = useTweened(lo - pad);
  // Extra headroom keeps the axis title clear of the highest line.
  const top1 = useTweened(hi + 3 * pad);
  const [zLo, zHi] = extent([0, ...z]);
  const zPad = (zHi - zLo) * 0.06;
  const bottom0 = useTweened(zLo - zPad);
  const bottom1 = useTweened(zHi + 4 * zPad);
  const xTicks = niceTicks(0, x1, 6);

  const plot = (
    <>
      <PlotFrame
        x={[0, x1]}
        y={[top0, top1]}
        height={TOP_HEIGHT}
        xTicks={xTicks}
        yTicks={niceTicks(top0, top1, 4)}
        formatY={(v) => num(v, 0)}
        xLabel="period t"
        yLabel="level of each series"
      >
        <Polyline points={t.map((i) => [i, pair.x[i]])} color="var(--text-muted)" weight={1.5} strokeStyle="dashed" fillOpacity={0} />
        <Polyline points={t.map((i) => [i, pair.y[i]])} color="var(--c-data)" weight={2} fillOpacity={0} />
      </PlotFrame>
      <PlotFrame
        x={[0, x1]}
        y={[bottom0, bottom1]}
        height={BOTTOM_HEIGHT}
        xTicks={xTicks}
        yTicks={niceTicks(bottom0, bottom1, 4)}
        formatY={(v) => num(v, 0)}
        xLabel="period t"
        yLabel={<tspan style={{ fill: 'var(--c-signal)' }}>{`y − ${w.toFixed(2)} x`}</tspan>}
        baseline={bottom0 < 0 && bottom1 > 0 ? 0 : undefined}
      >
        <Polyline points={t.map((i) => [i, z[i]])} color="var(--c-signal)" weight={2} fillOpacity={0} />
      </PlotFrame>
    </>
  );

  return (
    <WidgetFrame
      title="Which weight makes two trends cancel?"
      ariaLabel={
        `Top: two simulated series of ${PAIR.T} periods, seed ${seed}. The dashed line x is a random walk, and the solid line y is ${PAIR.beta} times x plus a short-lived gap. Both wander far from where they start.`
        + ` Bottom: the combination y minus ${w.toFixed(2)} times x. Its persistence is ${num(persistence, 3)}; it is lowest near the true weight ${PAIR.beta}, where the combination stays close to a fixed level.`
      }
      plotHeight={TOP_HEIGHT + BOTTOM_HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Weight $w$" value={w} min={0} max={1.2} step={0.05} onChange={setW} format={(v) => v.toFixed(2)} color="var(--c-signal)" />
          <Button onClick={() => setSeed((s) => s + 1)}>New draw</Button>
        </>
      }
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>– – x</span> ·{' '}
            <span style={{ color: 'var(--c-data)' }}>— y</span> ·{' '}
            <span style={{ color: 'var(--c-signal)' }}><RichText>{'— $y_t - w\\,x_t$'}</RichText></span>
          </p>
          <dl className="readout-grid">
            <dt><RichText>{'Persistence of $y_t - w\\,x_t$'}</RichText></dt>
            <dd style={{ color: 'var(--c-signal)' }}>{num(persistence, 3)}</dd>
            <dt>True weight</dt>
            <dd>{PAIR.beta.toFixed(2)}</dd>
            <dt>Dynamic OLS estimate</dt>
            <dd>{num(pair.estimate, 3)}</dd>
            <dt>Seed</dt>
            <dd>{seed}</dd>
          </dl>
        </>
      }
      caption={`Simulated (seeded): ${PAIR.T} periods. $x_t$ is a random walk with normal shocks of size 1; $y_t = ${PAIR.beta}\\,x_t + u_t$, where the gap $u_t$ is an AR(1) with persistence ${PAIR.phi} and shocks of size 1. Persistence is the OLS slope of $y_{t+1} - w\\,x_{t+1}$ on $y_t - w\\,x_t$: near 1 the combination trends, well below 1 it keeps returning to its mean. The dynamic OLS estimate regresses $y_t$ on $x_t$ and on $\\Delta x_t$ with ${PAIR_LEADS} leads and ${PAIR_LEADS} lags.`}
    />
  );
}
