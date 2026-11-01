import { Line, Polygon } from 'mafs';
import { useEffect, useMemo, useState } from 'react';
import type { Weighting } from '../../lib/finance/crossSection';
import { histogram } from '../../lib/stats/moments';
import { Button, Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import {
  ASSETS, modelR2, RANDOM_FACTORS, RANDOM_SAMPLES, RANDOM_SEED, randomView, skepticalPanel, useSkepticalData,
  type Assets, type RandomView,
} from './skepticalSample';

const HEIGHT = 300;
const BINS = 30;
const WEIGHTINGS: { value: Weighting; label: string }[] = [
  { value: 'ols', label: 'OLS R²' },
  { value: 'gls', label: 'GLS R²' },
];

const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const share = (v: number) => `${(v * 100).toFixed(0)}%`;

/** Bars of a density histogram: share of draws per unit of the horizontal axis. */
function densityBars(values: number[]) {
  const { edges, counts } = histogram(values, BINS);
  return counts.map((c, i) => ({ left: edges[i], right: edges[i + 1], height: c / (values.length * (edges[i + 1] - edges[i])) }));
}

interface Params { noise: number; assets: Assets; seed: number }

/**
 * Chapter 28: seeded two-factor models, each factor a random mix of SMB and HML plus a noise share, run through
 * the two-pass regression with an intercept on the real monthly 25 size–B/M portfolios (or those and the 30
 * industries). The histogram shows the OLS or GLS cross-sectional R² of the draws, with the CAPM's and FF3's
 * R² on the same assets marked.
 */
export default function RandomFactorFit({ initialNoise = 0.75 }: { initialNoise?: number }) {
  const { data, failed } = useSkepticalData();
  const panel = useMemo(() => (data ? skepticalPanel(data) : null), [data]);
  const models = useMemo(() => panel && Object.fromEntries(ASSETS.map(({ value }) => [value, {
    capm: modelR2(panel, value, 'capm'),
    ff3: modelR2(panel, value, 'ff3'),
  }])) as Record<Assets, { capm: { ols: number; gls: number }; ff3: { ols: number; gls: number } }>, [panel]);
  const [params, setParams] = useState<Params>({ noise: initialNoise, assets: 'ff25', seed: RANDOM_SEED });
  const [weighting, setWeighting] = useState<Weighting>('ols');
  const [sim, setSim] = useState<{ params: Params; view: RandomView } | null>(null);

  // RANDOM_SAMPLES two-pass regressions take a few seconds: run them once the slider rests.
  useEffect(() => {
    if (!panel || !models) return;
    const id = setTimeout(() => setSim({
      params,
      view: randomView(panel, params.assets, params.noise, params.seed, models[params.assets].ff3),
    }), sim ? 250 : 0);
    return () => clearTimeout(id);
  }, [panel, models, params]); // eslint-disable-line react-hooks/exhaustive-deps

  const view = useMemo(() => {
    if (!sim || !models) return null;
    const r2 = sim.view.fit[weighting];
    const { capm, ff3 } = models[sim.params.assets];
    return {
      ...sim.params,
      bars: densityBars(r2),
      median: sim.view.fit.median[weighting],
      beat: sim.view.beatFF3[weighting],
      max: Math.max(...r2),
      capm: capm[weighting],
      ff3: ff3[weighting],
    };
  }, [sim, models, weighting]);

  const pending = !!sim && sim.params !== params;
  const kind = weighting === 'ols' ? 'OLS' : 'GLS';
  const assetsLabel = view?.assets === 'ff55' ? 'the 25 size–B/M and 30 industry portfolios' : 'the 25 size–B/M portfolios';
  const hi = useTweened(view ? Math.min(1, Math.max(view.max, view.ff3) * 1.1) : 1);
  const top = useTweened(view ? Math.max(...view.bars.map((x) => x.height)) * 1.5 : 1);

  const plot = view && panel ? (
    <PlotFrame
      x={[0, hi]}
      y={[0, top]}
      height={HEIGHT}
      xTicks={niceTicks(0, hi, 6)}
      yTicks={[]}
      formatX={(v) => num(v, 2)}
      xLabel={`${kind} cross-sectional R² of the second pass`}
      yLabel="density of draws"
    >
      {view.bars.map((x, i) => (
        <Polygon key={i} points={[[x.left, 0], [x.right, 0], [x.right, x.height], [x.left, x.height]]}
          color="var(--c-prob)" fillOpacity={0.25} weight={1} />
      ))}
      <Line.Segment point1={[view.capm, 0]} point2={[view.capm, top * 0.9]} color="var(--c-factor)" weight={2.5} style="dashed" />
      <Label x={view.capm} y={top * 0.9} attach="e" attachDistance={4} size={12} color="var(--c-factor)">CAPM</Label>
      <Line.Segment point1={[view.ff3, 0]} point2={[view.ff3, top * 0.75]} color="var(--c-factor)" weight={2.5} />
      <Label x={view.ff3} y={top * 0.75} attach="w" attachDistance={4} size={12} color="var(--c-factor)">FF3</Label>
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Simulating…'}</p>
  );

  return (
    <WidgetFrame
      title="Random factors that fit"
      ariaLabel={
        view && panel
          ? `Histogram of the ${kind} cross-sectional R² of ${RANDOM_SAMPLES} seeded two-factor models with noise share ${num(view.noise)} on ${assetsLabel}, monthly, ${panel.first} to ${panel.last}. The median is ${num(view.median, 3)}; ${share(view.beat)} of draws beat FF3's ${num(view.ff3, 3)}; the CAPM gets ${num(view.capm, 3)}.`
          : 'Histogram of the cross-sectional R² of simulated factors. The simulation is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Noise share $s$ of each factor" value={params.noise} min={0} max={1} step={0.05}
            onChange={(noise) => setParams((p) => ({ ...p, noise }))} format={(v) => num(v)} />
          <Segmented label="Cross-sectional R²" value={weighting} options={WEIGHTINGS} onChange={setWeighting} />
          <Segmented label="Test assets" value={params.assets} options={ASSETS}
            onChange={(assets) => setParams((p) => ({ ...p, assets }))} />
          <Button onClick={() => setParams((p) => ({ ...p, seed: p.seed + 1 }))}>Re-roll simulation</Button>
        </>
      }
      readout={
        view ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-prob)' }}>▮ bars: random two-factor models</span>
              {' · '}<span style={{ color: 'var(--c-factor)' }}>– – dashed: CAPM · — solid: FF3</span>
              {pending && <> · updating…</>}
            </p>
            <dl className="readout-grid">
              <dt><RichText>{`Median ${kind} $R^2$ of the draws`}</RichText></dt>
              <dd>{num(view.median, 3)}</dd>
              <dt><RichText>{`Draws that beat FF3's $R^2$ of ${num(view.ff3, 3)}`}</RichText></dt>
              <dd>{share(view.beat)}</dd>
              <dt><RichText>{`CAPM's $R^2$`}</RichText></dt>
              <dd>{num(view.capm, 3)}</dd>
              <dt>Draws, seed</dt>
              <dd>{RANDOM_SAMPLES}, {view.seed}</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Simulating…'}</p>
        )
      }
      caption={`Real returns, simulated (seeded) factors: ff25-size-bm-monthly and ff30-industry-monthly minus the risk-free rate of ff3-monthly${panel ? `, ${panel.first} to ${panel.last}` : ''}. Each draw builds ${RANDOM_FACTORS} factors $\\Factor{f_t} = \\sqrt{1 - s}\\,g_t + \\sqrt{s}\\,e_t$, where $g_t$ is a random mix of SMB and HML, standardised, and $e_t$ is fresh standard normal noise. It then runs the first pass and the second pass with an intercept. The CAPM and FF3 lines use Mkt-RF, SMB and HML from ff3-monthly in the same two-pass regression.`}
    />
  );
}
