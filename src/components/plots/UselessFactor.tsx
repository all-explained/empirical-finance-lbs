import { Line, Polygon } from 'mafs';
import { useEffect, useMemo, useState } from 'react';
import { histogram } from '../../lib/stats/moments';
import { Button, Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import {
  monthlySample, T_CUTOFF, USELESS_SAMPLES, USELESS_SEED, useIdentificationData, uselessView, type UselessView,
} from './identificationSample';
import { Label, PlotFrame } from './PlotFrame';

const T_HEIGHT = 210;
const R2_HEIGHT = 210;
const BINS = 30;

type Kind = 'fm' | 'shanken';
const KINDS: { value: Kind; label: string }[] = [
  { value: 'fm', label: 'Fama–MacBeth t' },
  { value: 'shanken', label: 'Shanken t' },
];

const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const share = (v: number) => `${(v * 100).toFixed(1)}%`;

/** Bars of a density histogram: share of draws per unit of the horizontal axis. */
function densityBars(values: number[]) {
  const { edges, counts } = histogram(values, BINS);
  return counts.map((c, i) => ({ left: edges[i], right: edges[i + 1], height: c / (values.length * (edges[i + 1] - edges[i])) }));
}

interface Params { strength: number; seed: number }

/**
 * Chapter 27: seeded factors f_t = s·m_t + e_t on the real monthly 25 portfolios, each run through the
 * two-pass regression with an intercept. Top: the histogram of the second-pass t-statistic (Fama–MacBeth or
 * Shanken), with the ±1.96 cut-offs. Bottom: the histogram of the cross-sectional R², with the CAPM's R² on
 * the same portfolios. Strength 0 is a useless factor.
 */
export default function UselessFactor({ initialStrength = 0 }: { initialStrength?: number }) {
  const { data, failed } = useIdentificationData();
  const sample = useMemo(() => (data ? monthlySample(data) : null), [data]);
  const [params, setParams] = useState<Params>({ strength: initialStrength, seed: USELESS_SEED });
  const [kind, setKind] = useState<Kind>('fm');
  const [sim, setSim] = useState<{ params: Params; view: UselessView } | null>(null);

  // 200 two-pass regressions take a few seconds: run them once the slider rests.
  useEffect(() => {
    if (!sample) return;
    const id = setTimeout(() => setSim({ params, view: uselessView(sample, params.strength, params.seed) }), sim ? 250 : 0);
    return () => clearTimeout(id);
  }, [sample, params]); // eslint-disable-line react-hooks/exhaustive-deps

  const view = useMemo(() => {
    if (!sim) return null;
    const t = kind === 'fm' ? sim.view.sim.famaMacBethT : sim.view.sim.shankenT;
    return {
      ...sim.params,
      ...sim.view,
      t,
      reject: kind === 'fm' ? sim.view.rejectFM : sim.view.rejectShanken,
      tBars: densityBars(t),
      r2Bars: densityBars(sim.view.sim.r2),
      tRange: extent(t),
      r2Max: Math.max(...sim.view.sim.r2),
    };
  }, [sim, kind]);

  const pending = !!sim && sim.params !== params;
  const kindLabel = kind === 'fm' ? 'Fama–MacBeth' : 'Shanken';
  const tLim = useTweened(view ? Math.max(Math.abs(view.tRange[0]), Math.abs(view.tRange[1]), T_CUTOFF) * 1.08 : 4);
  const r2Hi = useTweened(view && sample ? Math.min(1, Math.max(view.r2Max, sample.capmR2) * 1.08) : 0.5);
  const tTop = useTweened(view ? Math.max(...view.tBars.map((x) => x.height)) * 1.6 : 1);
  const r2Top = useTweened(view ? Math.max(...view.r2Bars.map((x) => x.height)) * 1.6 : 1);

  const plot = view && sample ? (
    <div>
      <PlotFrame
        x={[-tLim, tLim]}
        y={[0, tTop]}
        height={T_HEIGHT}
        xTicks={niceTicks(-tLim, tLim, 6)}
        yTicks={[]}
        formatX={(v) => num(v, 0)}
        xLabel={`${kindLabel} t-statistic of the premium`}
        yLabel="share of draws"
      >
        {view.tBars.map((x, i) => {
          const rejected = Math.abs((x.left + x.right) / 2) > T_CUTOFF;
          return (
            <Polygon key={i} points={[[x.left, 0], [x.right, 0], [x.right, x.height], [x.left, x.height]]}
              color={rejected ? 'var(--c-error)' : 'var(--c-prob)'} fillOpacity={rejected ? 0.45 : 0.25} weight={1} />
          );
        })}
        {[-T_CUTOFF, T_CUTOFF].map((c) => (
          <Line.Segment key={c} point1={[c, 0]} point2={[c, tTop * 0.8]} color="var(--text)" weight={1.5} style="dashed" />
        ))}
        <Label x={T_CUTOFF} y={tTop * 0.8} attach="e" attachDistance={4} size={12} color="var(--text)">±1.96</Label>
      </PlotFrame>
      <PlotFrame
        x={[0, r2Hi]}
        y={[0, r2Top]}
        height={R2_HEIGHT}
        xTicks={niceTicks(0, r2Hi, 6)}
        yTicks={[]}
        formatX={(v) => num(v, 2)}
        xLabel="cross-sectional R² of the second pass"
        yLabel="share of draws"
      >
        {view.r2Bars.map((x, i) => (
          <Polygon key={i} points={[[x.left, 0], [x.right, 0], [x.right, x.height], [x.left, x.height]]}
            color="var(--c-prob)" fillOpacity={0.25} weight={1} />
        ))}
        <Line.Segment point1={[sample.capmR2, 0]} point2={[sample.capmR2, r2Top * 0.8]} color="var(--c-factor)" weight={2.5} style="dashed" />
        <Label x={sample.capmR2} y={r2Top * 0.8} attach="e" attachDistance={4} size={12} color="var(--c-factor)">CAPM</Label>
      </PlotFrame>
    </div>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Simulating…'}</p>
  );

  return (
    <WidgetFrame
      title="A factor that has nothing to do with returns"
      ariaLabel={
        view && sample
          ? `Two histograms of ${USELESS_SAMPLES} seeded factors of strength ${num(view.strength)} on the monthly 25 size–B/M portfolios, ${sample.first} to ${sample.last}. Top: the ${kindLabel} t-statistics of the premium; ${share(view.reject)} lie beyond ±1.96. Bottom: the cross-sectional R²; the median is ${num(view.medianR2, 3)}, and ${share(view.beatCapm)} of draws beat the CAPM's ${num(sample.capmR2, 3)}.`
          : 'Histograms of t-statistics and R² for simulated factors. The simulation is loading.'
      }
      plotHeight={T_HEIGHT + R2_HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Factor strength $s$ (0 is useless)" value={params.strength} min={0} max={1} step={0.05}
            onChange={(strength) => setParams((p) => ({ ...p, strength }))} format={(v) => num(v)} />
          <Segmented label="Standard error of the premium" value={kind} options={KINDS} onChange={setKind} />
          <Button onClick={() => setParams((p) => ({ ...p, seed: p.seed + 1 }))}>Re-roll simulation</Button>
        </>
      }
      readout={
        view && sample ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-prob)' }}>▮ bars: simulated factors</span>
              {' · '}<span style={{ color: 'var(--c-error)' }}>▮ darker bars: |t| &gt; 1.96</span>
              {' · '}<span style={{ color: 'var(--c-factor)' }}>– – dashed: the market (CAPM)</span>
              {pending && <> · updating…</>}
            </p>
            <dl className="readout-grid">
              <dt><RichText>{`Share with $|t| > 1.96$, ${kindLabel} (should be 5%)`}</RichText></dt>
              <dd className={view.strength === 0 && view.reject > 0.1 ? 'bad' : undefined}>{share(view.reject)}</dd>
              <dt>The other standard error</dt>
              <dd>{kind === 'fm' ? `Shanken ${share(view.rejectShanken)}` : `Fama–MacBeth ${share(view.rejectFM)}`}</dd>
              <dt><RichText>{'Median $R^2$'}</RichText></dt>
              <dd>{num(view.medianR2, 3)}</dd>
              <dt><RichText>{`Draws that beat the CAPM's $R^2$ of ${num(sample.capmR2, 3)}`}</RichText></dt>
              <dd>{share(view.beatCapm)}</dd>
              <dt>Draws, seed</dt>
              <dd>{USELESS_SAMPLES}, {view.seed}</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Simulating…'}</p>
        )
      }
      caption={`Real returns, simulated (seeded) factors: ff25-size-bm-monthly minus the risk-free rate of ff3-monthly${sample ? `, ${sample.first} to ${sample.last}` : ''}. Each draw makes $\\Factor{f_t} = s\\,m_t + e_t$, where $m_t$ is the standardised equal-weighted average of the 25 excess returns and $e_t$ is fresh standard normal noise, then runs the first pass and the OLS second pass with an intercept. The CAPM line uses Mkt-RF from ff3-monthly in the same two-pass regression.`}
    />
  );
}
