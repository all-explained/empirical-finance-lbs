import { Line, Polygon } from 'mafs';
import { Fragment, useEffect, useMemo, useState } from 'react';
import type { OmittedFactorSimulation } from '../../lib/finance/threePass';
import { annualiseMean, histogram } from '../../lib/stats/moments';
import { Button, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { ECONOMY, OMITTED_SEED, omittedEconomy } from './threePassSample';

const PANEL_HEIGHT = 170;
const BINS = 20;

/** Monthly decimal → annual percent, the unit of the plot and the readout. */
const yearly = (v: number) => annualiseMean(v) * 100;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const pct = (v: number) => `${v > 0 ? '+' : ''}${num(v, 2)}%`;

type Estimator = 'twoPass' | 'threePass';
const ESTIMATORS: { key: Estimator; name: string; axis: string }[] = [
  { key: 'twoPass', name: 'Two-pass', axis: 'two-pass estimate, χ alone (% a year)' },
  { key: 'threePass', name: 'Three-pass', axis: 'three-pass estimate, 2 PCs (% a year)' },
];

interface Params { strength: number; correlation: number; seed: number }

/**
 * Chapter 34: the seeded two-factor economy of simulateOmittedFactor. One panel per estimator: the histogram
 * of its estimates of λ_χ across samples, a dashed line at the true premium, a solid line at the mean
 * estimate, and the gap between them (the bias). Both panels share one horizontal axis.
 */
export default function OmittedFactorBias({ initialStrength = 1, initialCorrelation = 0.5 }: {
  initialStrength?: number; initialCorrelation?: number;
}) {
  const [params, setParams] = useState<Params>({ strength: initialStrength, correlation: initialCorrelation, seed: OMITTED_SEED });
  const [sim, setSim] = useState<{ params: Params; result: OmittedFactorSimulation } | null>(null);

  // 100 samples of both estimators take about a second: run them once the slider rests.
  useEffect(() => {
    const id = setTimeout(
      () => setSim({ params, result: omittedEconomy(params.strength, params.correlation, params.seed) }),
      sim ? 250 : 0,
    );
    return () => clearTimeout(id);
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const view = useMemo(() => {
    if (!sim) return null;
    const { result } = sim;
    const panels = ESTIMATORS.map(({ key, name, axis }) => {
      const values = result[key].map(yearly);
      const { edges, counts } = histogram(values, BINS);
      return {
        key, name, axis,
        bars: counts.map((c, i) => ({ left: edges[i], right: edges[i + 1], height: c / (values.length * (edges[i + 1] - edges[i])) })),
        mean: yearly(result.truth) + yearly(result.bias[key]),
        bias: yearly(result.bias[key]),
        rmse: yearly(result.rmse[key]),
      };
    });
    const [lo, hi] = extent([...panels.flatMap((p) => p.bars.flatMap((b) => [b.left, b.right])), yearly(result.truth)]);
    return { ...sim.params, truth: yearly(result.truth), panels, lo, hi, top: Math.max(...panels.flatMap((p) => p.bars.map((b) => b.height))) };
  }, [sim]);

  const pending = !!sim && sim.params !== params;
  const pad = view ? (view.hi - view.lo) * 0.06 : 0;
  const xLo = useTweened(view ? view.lo - pad : 0);
  const xHi = useTweened(view ? view.hi + pad : 12);
  const yTop = useTweened(view ? view.top * 1.45 : 1);

  const plot = view ? (
    <div>
      {view.panels.map((panel) => (
        <PlotFrame
          key={panel.key}
          x={[xLo, xHi]}
          y={[0, yTop]}
          height={PANEL_HEIGHT}
          xTicks={niceTicks(xLo, xHi, 6)}
          yTicks={[]}
          formatX={(v) => num(v, 0)}
          xLabel={panel.axis}
          yLabel="share of samples"
        >
          {panel.bars.map((b, i) => (
            <Polygon key={i} points={[[b.left, 0], [b.right, 0], [b.right, b.height], [b.left, b.height]]}
              color="var(--c-prob)" fillOpacity={0.25} weight={1} />
          ))}
          <Line.Segment point1={[view.truth, 0]} point2={[view.truth, yTop * 0.82]} color="var(--text)" weight={1.5} style="dashed" />
          <Line.Segment point1={[panel.mean, 0]} point2={[panel.mean, yTop * 0.82]} color="var(--c-model)" weight={2.5} />
          <Line.Segment point1={[view.truth, yTop * 0.82]} point2={[panel.mean, yTop * 0.82]} color="var(--c-error)" weight={4} />
          <Label x={xLo} y={yTop} attach="se" attachDistance={6} size={13} color="var(--text)">{panel.name}</Label>
          <Label x={Math.min(view.truth, panel.mean)} y={yTop * 0.82} attach="w" attachDistance={6} size={12} color="var(--text)">
            {panel.mean < view.truth ? 'mean' : 'true'}
          </Label>
          <Label x={Math.max(view.truth, panel.mean)} y={yTop * 0.82} attach="e" attachDistance={6} size={12} color="var(--text)">
            {panel.mean < view.truth ? 'true' : 'mean'}
          </Label>
        </PlotFrame>
      ))}
    </div>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>Simulating…</p>
  );

  const [two, three] = view ? view.panels : [];

  return (
    <WidgetFrame
      title="What the omitted factor does to each estimator"
      ariaLabel={
        view
          ? `Two histograms of ${ECONOMY.samples} seeded samples with an omitted factor of strength ${num(view.strength)} and loading correlation ${num(view.correlation)}. The true premium is ${num(view.truth, 1)}% a year. Two-pass estimates have a mean bias of ${pct(two.bias)} and a root mean squared error of ${num(two.rmse)}%. Three-pass estimates have a mean bias of ${pct(three.bias)} and a root mean squared error of ${num(three.rmse)}%.`
          : 'Histograms of two-pass and three-pass risk premium estimates. The simulation is loading.'
      }
      plotHeight={2 * PANEL_HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Strength of the omitted factor $s$" value={params.strength} min={0} max={2} step={0.1}
            onChange={(strength) => setParams((p) => ({ ...p, strength }))} format={(v) => num(v, 1)} />
          <Slider label="Correlation of its loadings with $\beta_\chi$'s, $c$" value={params.correlation} min={-0.99} max={0.99} step={0.01}
            onChange={(correlation) => setParams((p) => ({ ...p, correlation }))} format={(v) => num(v)} />
          <Button onClick={() => setParams((p) => ({ ...p, seed: p.seed + 1 }))}>New seed</Button>
        </>
      }
      readout={
        view ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span>– – dashed: true premium</span>
              {' · '}<span style={{ color: 'var(--c-model)' }}>│ solid: mean estimate</span>
              {' · '}<span style={{ color: 'var(--c-error)' }}>━ bar: the bias</span>
              {pending && <> · updating…</>}
            </p>
            <dl className="readout-grid">
              <dt><RichText>{'True premium $\\lambda_\\chi$'}</RichText></dt>
              <dd>{num(view.truth, 2)}% a year</dd>
              {view.panels.map((panel) => (
                <Fragment key={panel.key}>
                  <dt>{panel.name}: mean bias</dt>
                  <dd className={Math.abs(panel.bias) > 1 ? 'bad' : undefined}>{pct(panel.bias)} a year</dd>
                  <dt>{panel.name}: root mean squared error</dt>
                  <dd>{num(panel.rmse)}% a year</dd>
                </Fragment>
              ))}
              <dt>Samples, seed</dt>
              <dd>{ECONOMY.samples}, {view.seed}</dd>
            </dl>
          </>
        ) : (
          <p>Simulating…</p>
        )
      }
      caption={`Simulated (seeded) data, annualised (×12). Each sample draws $N = ${ECONOMY.N}$ assets and $T = ${ECONOMY.T}$ months from two independent factors, each with a premium of 0.5% a month and a volatility of 4% a month, plus idiosyncratic noise of 3% a month. Each asset's loading on the first factor is a standard normal draw; its loading on the second is $s$ times another standard normal draw whose correlation with the first, across assets, is $c$. The observed factor $\\Factor{\\chi_t}$ is the first factor itself, with no measurement error. Two-pass: the betas on $\\chi_t$ alone, then an OLS cross-sectional regression with no intercept. Three-pass: two principal components.`}
    />
  );
}
