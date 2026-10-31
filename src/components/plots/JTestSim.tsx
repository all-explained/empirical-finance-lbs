import { Line, Polygon, Polyline } from 'mafs';
import { useEffect, useMemo, useState } from 'react';
import { arithmeticMean } from '../../lib/finance/returns';
import { chiSquareCdf, chiSquareSurvival } from '../../lib/math/distributions';
import { bisection } from '../../lib/math/rootFind';
import { Segmented, Slider, Button } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { niceTicks } from './format';
import {
  J_CHUNK, J_CHUNKS, J_COUNT, J_DEFAULT_T, J_SAMPLES, J_SEED, jTestChunk, type EfficientMethod, type Tails,
} from './gmmSample';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 300;
const DF = J_COUNT - 2;
const X_MAX = 16;
const BIN = 0.5;
const SIZE = 0.05;
const CRITICAL = bisection((x) => chiSquareSurvival(x, DF) - SIZE, 0, 100);
/** The χ² density as a central difference of its CDF, on a grid that starts just above zero. */
const H = 1e-4;
const DENSITY = Array.from({ length: 161 }, (_, i) => Math.max(H, (X_MAX * i) / 160)).map(
  (x) => [x, (chiSquareCdf(x + H, DF) - chiSquareCdf(x - H, DF)) / (2 * H)] as [number, number],
);

const METHOD_LABEL: Record<EfficientMethod, string> = { 'two-step': 'Two-step', iterated: 'Iterated', cue: 'CUE' };
const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;

interface Params { T: number; method: EfficientMethod; tails: Tails; seed: number }

/**
 * Chapter 25: the J test of the toy model with four moments (2 degrees of freedom), over seeded samples. The
 * histogram of J is drawn against the χ²₂ density it should follow. With normal tails the model is true, so the
 * share above the 5% cut-off is the test's size; with fat tails the fourth-moment condition is false, so the
 * share is its power. The samples run in chunks, and the picture fills as they arrive.
 */
export default function JTestSim({ initialT = J_DEFAULT_T }: { initialT?: number }) {
  const [params, setParams] = useState<Params>({ T: initialT, method: 'two-step', tails: 'normal', seed: J_SEED });
  const [run, setRun] = useState<{ params: Params; chunks: ReturnType<typeof jTestChunk>[] }>({ params, chunks: [] });

  // One chunk per timer tick keeps the page responsive while a slow method (CUE at large T) runs.
  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const chunks: ReturnType<typeof jTestChunk>[] = [];
    const next = () => {
      if (cancelled) return;
      chunks.push(jTestChunk(params.seed, chunks.length, params));
      setRun({ params, chunks: [...chunks] });
      if (chunks.length < J_CHUNKS) timer = window.setTimeout(next, 0);
    };
    timer = window.setTimeout(next, run.chunks.length ? 120 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const view = useMemo(() => {
    if (!run.chunks.length) return null;
    const J = run.chunks.flatMap((c) => c.J);
    const bins = Array.from({ length: X_MAX / BIN }, () => 0);
    let beyond = 0;
    for (const j of J) {
      if (j >= X_MAX) beyond++;
      else bins[Math.floor(j / BIN)]++;
    }
    return {
      n: J.length,
      // Equal chunks: the share rejected is the mean of the chunks' shares.
      rejectionRate: arithmeticMean(run.chunks.map((c) => c.rejectionRate)),
      meanJ: arithmeticMean(J),
      beyond: beyond / J.length,
      bars: bins.map((c, i) => ({ left: i * BIN, right: (i + 1) * BIN, height: c / (J.length * BIN) })),
    };
  }, [run]);

  const done = view?.n === J_SAMPLES && run.params === params;
  const top = useTweened(Math.max(0.6, ...(view?.bars.map((b) => b.height * 1.1) ?? [0])));
  const shown = run.params;

  const plot = view ? (
    <PlotFrame
      x={[0, X_MAX]}
      y={[0, top]}
      height={HEIGHT}
      xTicks={niceTicks(0, X_MAX, 8)}
      yTicks={[]}
      formatX={(v) => String(v)}
      xLabel="J statistic"
      yLabel="share of samples per unit of J"
    >
      {view.bars.map((b, i) => {
        const rejected = (b.left + b.right) / 2 > CRITICAL;
        return (
          <Polygon key={i} points={[[b.left, 0], [b.right, 0], [b.right, b.height], [b.left, b.height]]}
            color={rejected ? 'var(--c-error)' : 'var(--c-prob)'} fillOpacity={rejected ? 0.45 : 0.25} weight={1} />
        );
      })}
      <Polyline points={DENSITY} color="var(--c-model)" weight={2.5} fillOpacity={0} />
      <Line.Segment point1={[CRITICAL, 0]} point2={[CRITICAL, top * 0.8]} color="var(--text)" weight={1.5} style="dashed" />
      <Label x={CRITICAL} y={top * 0.8} attach="e" attachDistance={4} size={12} color="var(--text)">5% cut-off {CRITICAL.toFixed(2)}</Label>
      <Label x={2.2} y={0.42} attach="e" attachDistance={4} size={12} color="var(--c-model)">χ²₂ density</Label>
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>Simulating…</p>
  );

  const set = <K extends keyof Params>(key: K) => (value: Params[K]) => setParams((p) => ({ ...p, [key]: value }));
  return (
    <WidgetFrame
      title="How often does the J test reject?"
      ariaLabel={
        view
          ? `Histogram of the J statistic in ${view.n} of ${J_SAMPLES} seeded samples of ${shown.T} draws, ${METHOD_LABEL[shown.method]} GMM, ${shown.tails} tails, against the chi-square density with ${DF} degrees of freedom. ${pct(view.rejectionRate)} of the samples exceed the 5% cut-off ${CRITICAL.toFixed(2)}.`
          : 'Histogram of the J statistic in seeded samples. The simulation is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Sample size $T$" value={params.T} min={50} max={1000} step={50} onChange={set('T')} format={(v) => `${v} draws`} />
          <Segmented label="Estimator" value={params.method}
            options={(['two-step', 'iterated', 'cue'] as const).map((m) => ({ value: m, label: METHOD_LABEL[m] }))}
            onChange={set('method')} />
          <Segmented label="Tails of the data" value={params.tails}
            options={[{ value: 'normal', label: 'Normal: model true' }, { value: 'fat', label: 'Fat: model false' }]}
            onChange={set('tails')} />
          <Button onClick={() => setParams((p) => ({ ...p, seed: p.seed + 1 }))}>Re-roll simulation</Button>
        </>
      }
      readout={
        view ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-prob)' }}>▮ bars: simulated J</span>
              {' · '}<span style={{ color: 'var(--c-error)' }}>▮ darker bars: rejected at 5%</span>
              {' · '}<span style={{ color: 'var(--c-model)' }}>— solid curve: χ²₂ density</span>
              {!done && <> · simulating…</>}
            </p>
            <dl className="readout-grid">
              <dt>{shown.tails === 'normal' ? 'Size (should be 5%)' : 'Power (higher is better)'}</dt>
              <dd>{pct(view.rejectionRate)} rejected at 5%</dd>
              <dt>Samples</dt>
              <dd>{view.n} of {J_SAMPLES}, seed {shown.seed}</dd>
              <dt><RichText>{`Mean $J$ ($\\chi^2_${DF}$ mean: ${DF})`}</RichText></dt>
              <dd>{view.meanJ.toFixed(2)}</dd>
              <dt><RichText>{`$J \\ge ${X_MAX}$, off the plot`}</RichText></dt>
              <dd>{pct(view.beyond)}</dd>
            </dl>
          </>
        ) : (
          <p>Simulating…</p>
        )
      }
      caption={`Simulated (seeded): ${J_SAMPLES} samples, in ${J_CHUNKS} chunks of ${J_CHUNK}, of $T$ draws of the toy model with mean 0.5 and variance 1. Each sample is estimated with all ${J_COUNT} moments, so $J$ has $\\dim g - \\dim\\theta = ${DF}$ degrees of freedom. Normal tails make every moment true. Fat tails (variance 0.5 with probability 0.9 and 5.5 with probability 0.1) keep the mean, the variance and the third moment, but the fourth central moment is 9.75, not $3\\sigma^4 = 3$.`}
    />
  );
}
