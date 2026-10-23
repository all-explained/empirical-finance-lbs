import { Line, Polygon } from 'mafs';
import { useEffect, useMemo, useState } from 'react';
import { arithmeticMean } from '../../lib/finance/returns';
import { histogram } from '../../lib/stats/moments';
import {
  biasCorrectedSlope, kendallBias, rejectionRate, stambaughBias, upperCriticalValue,
} from '../../lib/stats/stambaugh';
import { Button, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { DEFAULT_SEED, nullSlopes, SAMPLES, useDataFit } from './stambaughSample';

const B_HEIGHT = 210;
const T_HEIGHT = 210;
const BINS = 40;
const NOMINAL = 1.645;
const SIZE = 0.05;

const num = (v: number, digits = 3) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;

interface Params { T: number; phi: number; corr: number; seed: number }

/** Bars of a density histogram: share of samples per unit of the horizontal axis. */
function densityBars(values: number[]) {
  const { edges, counts } = histogram(values, BINS);
  return counts.map((c, i) => ({ left: edges[i], right: edges[i + 1], height: c / (values.length * (edges[i + 1] - edges[i])) }));
}

/**
 * Chapter 12: many seeded samples of a predictive system in which returns are NOT
 * predictable (b = 0). Top: the histogram of the OLS slope bHat, with the analytic
 * Stambaugh bias. Bottom: the histogram of its t-statistic, with the textbook one-sided
 * 5% cut-off and the simulated one. A preset sets phi, corr(u, v) and T to the estimates
 * on goyal-welch-annual and marks the data's slope and t-statistic.
 */
export default function StambaughBias({ initialPhi = 0.95, initialCorr = 0, initialT = 100, initialPreset = false }: {
  initialPhi?: number; initialCorr?: number; initialT?: number; initialPreset?: boolean;
}) {
  const { fit, failed } = useDataFit();
  const [params, setParams] = useState<Params>({ T: initialT, phi: initialPhi, corr: initialCorr, seed: DEFAULT_SEED });
  const [showData, setShowData] = useState(false);
  const [sim, setSim] = useState<{ params: Params; slopes: ReturnType<typeof nullSlopes> } | null>(null);

  const preset = () => {
    if (!fit) return;
    setParams((p) => ({ ...p, T: fit.T, phi: fit.phiHat, corr: fit.corr }));
    setShowData(true);
  };
  useEffect(() => { if (fit && initialPreset) preset(); }, [fit]); // eslint-disable-line react-hooks/exhaustive-deps

  // The simulation takes up to a second at large T: run it once the sliders rest.
  useEffect(() => {
    if (!fit) return;
    const id = setTimeout(() => setSim({
      params,
      slopes: nullSlopes({ ...params, sigmaU: Math.sqrt(fit.sigmaUU), sigmaV: Math.sqrt(fit.sigmaV2) }),
    }), sim ? 150 : 0);
    return () => clearTimeout(id);
  }, [fit, params]); // eslint-disable-line react-hooks/exhaustive-deps

  const view = useMemo(() => {
    if (!fit || !sim) return null;
    const { T, phi, corr } = sim.params;
    const b = sim.slopes.map((s) => s.bHat);
    const t = sim.slopes.map((s) => s.tStat);
    const sigmaU = Math.sqrt(fit.sigmaUU);
    const sigmaV = Math.sqrt(fit.sigmaV2);
    return {
      ...sim.params,
      bBars: densityBars(b),
      tBars: densityBars(t),
      bRange: extent(b),
      tRange: extent(t),
      bias: stambaughBias(corr * sigmaU * sigmaV, fit.sigmaV2, phi, T),
      meanB: arithmeticMean(b),
      kendall: kendallBias(phi, T),
      meanPhiGap: arithmeticMean(sim.slopes.map((s) => s.phiHat)) - phi,
      critical: upperCriticalValue(t, SIZE),
      size: rejectionRate(t, NOMINAL),
      aboveB: rejectionRate(b, fit.bHat),
      aboveT: rejectionRate(t, fit.tStat),
    };
  }, [fit, sim]);

  const pending = !!sim && sim.params !== params;
  const marks = showData && fit;
  const [bLo, bHi] = view ? view.bRange : [-0.1, 0.1];
  const [tLo, tHi] = view ? view.tRange : [-3, 3];
  const b0 = useTweened(Math.min(bLo, 0, marks ? fit.bHat : 0));
  const b1 = useTweened(Math.max(bHi, 0, marks ? fit.bHat : 0));
  const t0 = useTweened(Math.min(tLo, -NOMINAL));
  const t1 = useTweened(Math.max(tHi, view?.critical ?? 0, marks ? fit.tStat : 0) + 0.2);
  const bTop = useTweened(view ? Math.max(...view.bBars.map((x) => x.height)) * 2 : 1);
  const tTop = useTweened(view ? Math.max(...view.tBars.map((x) => x.height)) * 2 : 1);

  const plot = view && fit ? (
    <div>
      <PlotFrame
        x={[b0, b1]}
        y={[0, bTop]}
        height={B_HEIGHT}
        xTicks={niceTicks(b0, b1, 6)}
        yTicks={[]}
        formatX={(v) => num(v, 2)}
        xLabel="estimated slope in each sample"
        yLabel="share of samples"
      >
        {view.bBars.map((x, i) => (
          <Polygon key={i} points={[[x.left, 0], [x.right, 0], [x.right, x.height], [x.left, x.height]]}
            color="var(--c-prob)" fillOpacity={0.25} weight={1} />
        ))}
        <Line.Segment point1={[0, 0]} point2={[0, bTop * 0.78]} color="var(--text)" weight={1.5} style="dashed" />
        {/* Marker labels sit at staggered heights between the bars (at most half the height) and the y-axis title. */}
        <Label x={0} y={bTop * 0.78} attach="e" attachDistance={4} size={12} color="var(--text)">true b = 0</Label>
        <Line.Segment point1={[view.bias, 0]} point2={[view.bias, bTop * 0.66]} color="var(--c-model)" weight={2.5} />
        <Label x={view.bias} y={bTop * 0.66} attach="e" attachDistance={4} size={12} color="var(--c-model)">theory: 0 + bias</Label>
        {marks && (
          <>
            <Line.Segment point1={[fit.bHat, 0]} point2={[fit.bHat, bTop * 0.54]} color="var(--c-data)" weight={2.5} style="dashed" />
            <Label x={fit.bHat} y={bTop * 0.54} attach="e" attachDistance={4} size={12} color="var(--c-data)">data</Label>
          </>
        )}
      </PlotFrame>
      <PlotFrame
        x={[t0, t1]}
        y={[0, tTop]}
        height={T_HEIGHT}
        xTicks={niceTicks(t0, t1, 6)}
        yTicks={[]}
        formatX={(v) => num(v, 0)}
        xLabel="t-statistic of the slope"
        yLabel="share of samples"
      >
        {view.tBars.map((x, i) => {
          const rejected = (x.left + x.right) / 2 > NOMINAL;
          return (
            <Polygon key={i} points={[[x.left, 0], [x.right, 0], [x.right, x.height], [x.left, x.height]]}
              color={rejected ? 'var(--c-error)' : 'var(--c-prob)'} fillOpacity={rejected ? 0.45 : 0.25} weight={1} />
          );
        })}
        <Line.Segment point1={[NOMINAL, 0]} point2={[NOMINAL, tTop * 0.78]} color="var(--text)" weight={1.5} style="dashed" />
        <Label x={NOMINAL} y={tTop * 0.78} attach="w" attachDistance={4} size={12} color="var(--text)">1.645</Label>
        <Line.Segment point1={[view.critical, 0]} point2={[view.critical, tTop * 0.66]} color="var(--c-model)" weight={2.5} />
        <Label x={view.critical} y={tTop * 0.66} attach="e" attachDistance={4} size={12} color="var(--c-model)">simulated 5%</Label>
        {marks && (
          <>
            <Line.Segment point1={[fit.tStat, 0]} point2={[fit.tStat, tTop * 0.54]} color="var(--c-data)" weight={2.5} style="dashed" />
            <Label x={fit.tStat} y={tTop * 0.54} attach="w" attachDistance={4} size={12} color="var(--c-data)">data</Label>
          </>
        )}
      </PlotFrame>
    </div>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Simulating…'}</p>
  );

  const set = (key: 'T' | 'phi' | 'corr') => (value: number) => setParams((p) => ({ ...p, [key]: value }));
  return (
    <WidgetFrame
      title="How a persistent predictor fools the predictive regression"
      ariaLabel={
        view
          ? `Two histograms of ${SAMPLES} simulated samples of ${view.T} years in which returns are not predictable, with persistence ${num(view.phi, 3)} and shock correlation ${num(view.corr, 2)}. Top: the estimated slopes, averaging ${num(view.meanB)} against a true slope of 0 and an analytic bias of ${num(view.bias)}. Bottom: their t-statistics; ${pct(view.size)} exceed the textbook cut-off 1.645, and the simulated 5% cut-off is ${num(view.critical, 2)}.${marks ? ` The data's slope ${num(fit.bHat)} and t-statistic ${num(fit.tStat, 2)} are marked.` : ''}`
          : 'Histograms of simulated slopes and t-statistics. The simulation is loading.'
      }
      plotHeight={B_HEIGHT + T_HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Persistence $\phi$" value={params.phi} min={0} max={0.999} step={0.001} onChange={set('phi')} format={(v) => num(v, 3)} />
          <Slider label="Shock correlation $\operatorname{corr}(u, v)$" value={params.corr} min={-0.99} max={0.99} step={0.01} onChange={set('corr')} format={(v) => num(v, 2)} />
          <Slider label="Sample length $T$" value={params.T} min={20} max={500} step={1} onChange={set('T')} format={(v) => `${v} years`} />
          <Button onClick={preset} disabled={!fit}>Set to the goyal-welch-annual estimates</Button>
          <Button onClick={() => setParams((p) => ({ ...p, seed: p.seed + 1 }))}>Re-roll simulation</Button>
        </>
      }
      readout={
        view && fit ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-prob)' }}>▮ bars: simulated samples</span>
              {' · '}<span style={{ color: 'var(--c-error)' }}>▮ darker bars: rejected by the textbook test</span>
              {' · '}<span style={{ color: 'var(--c-model)' }}>| solid: theory bias, simulated 5% cut-off</span>
              {marks && <>{' · '}<span style={{ color: 'var(--c-data)' }}>– – dashed: data</span></>}
              {pending && <> · updating…</>}
            </p>
            <dl className="readout-grid">
              <dt><RichText>{'Bias $\\mathbb{E}[\\hat b - b]$, theory'}</RichText></dt>
              <dd style={{ color: 'var(--c-model)' }}>{num(view.bias)}</dd>
              <dt><RichText>{'Mean of $\\hat b$, simulated'}</RichText></dt>
              <dd>{num(view.meanB)}</dd>
              <dt><RichText>{'$\\mathbb{E}[\\hat\\phi - \\phi] \\approx -(1 + 3\\phi)/T$'}</RichText></dt>
              <dd>{num(view.kendall)} (simulated {num(view.meanPhiGap)})</dd>
              <dt><RichText>{'Simulated 5% cut-off for $t$'}</RichText></dt>
              <dd style={{ color: 'var(--c-model)' }}>{num(view.critical, 2)} (textbook 1.645)</dd>
              <dt><RichText>{'Share with $t > 1.645$ (should be 5%)'}</RichText></dt>
              <dd>{pct(view.size)}</dd>
              {marks && (
                <>
                  <dt>Data, dp years {fit.first}–{fit.last}</dt>
                  <dd style={{ color: 'var(--c-data)' }}><RichText>{`$\\hat b$ = ${num(fit.bHat)}, $t$ = ${num(fit.tStat, 2)}`}</RichText></dd>
                  <dt>Samples above the data's slope and t</dt>
                  <dd>{pct(view.aboveB)} and {pct(view.aboveT)}</dd>
                  <dt>Bias-corrected data slope</dt>
                  <dd>{num(biasCorrectedSlope(fit.bHat, fit.phiHat, fit.sigmaUV, fit.sigmaV2, fit.T))}</dd>
                </>
              )}
              <dt>Samples, seed</dt>
              <dd>{SAMPLES.toLocaleString('en-US')}, {view.seed}</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Simulating…'}</p>
        )
      }
      caption={`Simulated (seeded): ${SAMPLES.toLocaleString('en-US')} samples of $T$ years with $\\Ret{r^e_{t+1}} = a + 0 \\cdot \\Signal{x_t} + u_{t+1}$ and $\\Signal{x_{t+1}} = \\phi\\,\\Signal{x_t} + v_{t+1}$, normal shocks, OLS with classical $t$-statistics. The shock sizes $\\sigma_u$ and $\\sigma_v$ are those estimated on goyal-welch-annual${fit ? ` (dp at the end of ${fit.first}–${fit.last}, log excess returns ${fit.first + 1}–${fit.last + 1})` : ''}, so $\\hat b$ is in the data's units. The preset also sets $\\phi$, $\\operatorname{corr}(u, v)$ and $T$ to the data's estimates.`}
    />
  );
}
