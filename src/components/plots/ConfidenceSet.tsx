import { Line, Point } from 'mafs';
import { useEffect, useMemo, useState } from 'react';
import type { FarConfidenceSet, WaldInterval, WeakIdentificationSimulation } from '../../lib/finance/identification';
import { Button, Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { niceTicks } from './format';
import {
  consumptionSets, DC_GRID, useIdentificationData, WEAK, WEAK_GRID, WEAK_SEED, weakWorld,
} from './identificationSample';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 330;
/** Simulated samples drawn as rows. */
const SHOWN = 12;
/** Visible range of the data view, % a quarter. Sets beyond it end in an arrow. */
const DATA_RANGE: [number, number] = [-15, 50];

type Mode = 'sim' | 'data';
const MODES: { value: Mode; label: string }[] = [
  { value: 'sim', label: 'Simulated world' },
  { value: 'data', label: 'Consumption growth' },
];

const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const share = (v: number) => `${(v * 100).toFixed(1)}%`;

/** A GRS-FAR set as text, with ∞ where a run reaches an end of its grid. */
function setText(set: FarConfidenceSet, grid: readonly number[], fmt: (v: number) => string): string {
  if (set.empty) return 'empty';
  const runs = set.intervals.map(([lo, hi]) => `[${lo === grid[0] ? '−∞' : fmt(lo)}, ${hi === grid.at(-1) ? '∞' : fmt(hi)}]`);
  return `${runs.join(' ∪ ')}${set.unbounded ? ' (unbounded)' : ''}`;
}

const waldText = (w: WaldInterval, fmt: (v: number) => string) => `[${fmt(w.lower)}, ${fmt(w.upper)}]`;

/** A horizontal bar for [lo, hi] at height y, clipped to the view, with an arrow where it runs on. */
function Bar({ lo, hi, y, range, open, color, weight, dashed }: {
  lo: number; hi: number; y: number; range: [number, number]; open: [boolean, boolean]; color: string; weight: number; dashed?: boolean;
}) {
  const a = Math.max(lo, range[0]);
  const b = Math.min(hi, range[1]);
  if (a > b) return null;
  return (
    <>
      <Line.Segment point1={[a, y]} point2={[b, y]} color={color} weight={weight} style={dashed ? 'dashed' : 'solid'} />
      {(open[0] || lo < range[0]) && <Label x={a} y={y} attach="w" size={11} color={color}>◀</Label>}
      {(open[1] || hi > range[1]) && <Label x={b} y={y} attach="e" size={11} color={color}>▶</Label>}
    </>
  );
}

interface Params { spread: number; seed: number }

/**
 * Chapter 27: 95% Wald and GRS-FAR confidence sets for the premium λ on one factor. Simulated: a seeded world
 * with a known λ = 1 and evenly spaced betas, the sets of the first SHOWN samples and the coverage over all of
 * them. Data: consumption growth on the quarterly 25 size–B/M portfolios, with the rank test.
 */
export default function ConfidenceSet({ initialSpread = 1 }: { initialSpread?: number }) {
  const { data, failed } = useIdentificationData();
  const real = useMemo(() => (data ? consumptionSets(data) : null), [data]);
  const [mode, setMode] = useState<Mode>('sim');
  const [params, setParams] = useState<Params>({ spread: initialSpread, seed: WEAK_SEED });
  const [sim, setSim] = useState<{ params: Params; world: WeakIdentificationSimulation } | null>(null);

  // 600 samples take about a second: run them once the slider rests.
  useEffect(() => {
    const id = setTimeout(() => setSim({ params, world: weakWorld(params.spread, params.seed) }), sim ? 250 : 0);
    return () => clearTimeout(id);
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const pending = !!sim && sim.params !== params;
  const simRange: [number, number] = [WEAK_GRID[0], WEAK_GRID.at(-1)!];
  const gridOpen = (grid: readonly number[], scale: number) => ([lo, hi]: [number, number]) => ({
    lo: lo * scale, hi: hi * scale, open: [lo === grid[0], hi === grid.at(-1)] as [boolean, boolean],
  });

  const rows = sim ? sim.world.wald.slice(0, SHOWN).map((wald, r) => {
    const far = sim.world.far[r];
    const inFar = far.intervals.some(([lo, hi]) => lo <= WEAK.lambda && WEAK.lambda <= hi);
    return {
      wald,
      waldMiss: WEAK.lambda < wald.shanken.lower || WEAK.lambda > wald.shanken.upper,
      far: far.intervals.map(gridOpen(WEAK_GRID, 1)),
      farMiss: !inFar,
    };
  }) : [];

  const simPlot = sim ? (
    <PlotFrame
      x={[simRange[0] - 0.4, simRange[1] + 0.4]}
      y={[0, SHOWN + 1.6]}
      height={HEIGHT}
      xTicks={niceTicks(simRange[0], simRange[1], 6)}
      yTicks={[]}
      formatX={(v) => num(v, 0)}
      xLabel="premium λ (units of the factor)"
      yLabel={`first ${SHOWN} samples`}
    >
      <Line.Segment point1={[WEAK.lambda, 0]} point2={[WEAK.lambda, SHOWN + 1]} color="var(--text)" weight={1.5} style="dashed" />
      <Label x={WEAK.lambda} y={SHOWN + 1} attach="e" attachDistance={4} size={12} color="var(--text)">true λ = 1</Label>
      {rows.map((row, r) => {
        const y = SHOWN - r;
        return (
          <g key={r}>
            <Bar lo={row.wald.shanken.lower} hi={row.wald.shanken.upper} y={y + 0.2} range={simRange} open={[false, false]}
              color={row.waldMiss ? 'var(--c-error)' : 'var(--text-muted)'} weight={2} dashed />
            {row.far.map((iv, j) => (
              <Bar key={j} lo={iv.lo} hi={iv.hi} y={y - 0.2} range={simRange} open={iv.open}
                color={row.farMiss ? 'var(--c-error)' : 'var(--c-model)'} weight={3.5} />
            ))}
            <Point x={row.wald.lambda} y={y + 0.2} color="var(--c-data)" />
          </g>
        );
      })}
    </PlotFrame>
  ) : null;

  const pctGrid = gridOpen(DC_GRID, 100);
  const dataRows = real ? [
    { name: 'Wald, Fama–MacBeth', bars: [{ lo: real.wald.famaMacBeth.lower * 100, hi: real.wald.famaMacBeth.upper * 100, open: [false, false] as [boolean, boolean] }], dashed: true },
    { name: 'Wald, Shanken', bars: [{ lo: real.wald.shanken.lower * 100, hi: real.wald.shanken.upper * 100, open: [false, false] as [boolean, boolean] }], dashed: true },
    { name: '95% GRS-FAR', bars: real.far95.intervals.map(pctGrid), dashed: false },
    { name: '99% GRS-FAR', bars: real.far99.intervals.map(pctGrid), dashed: false },
  ] : [];
  const dataPlot = real ? (
    <PlotFrame
      x={[DATA_RANGE[0] - 3, DATA_RANGE[1] + 3]}
      y={[0, dataRows.length + 1]}
      height={HEIGHT}
      xTicks={[-10, 0, 10, 20, 30, 40, 50]}
      yTicks={[]}
      formatX={(v) => `${num(v, 0)}%`}
      xLabel="premium λ on consumption growth, % a quarter"
      yLabel="95% and 99% sets"
    >
      <Line.Segment point1={[0, 0]} point2={[0, dataRows.length + 0.7]} color="var(--text)" weight={1} style="dashed" />
      {dataRows.map((row, r) => {
        const y = dataRows.length - r;
        return (
          <g key={row.name}>
            {row.bars.map((b, j) => (
              <Bar key={j} lo={b.lo} hi={b.hi} y={y} range={DATA_RANGE} open={b.open}
                color={row.dashed ? 'var(--text-muted)' : 'var(--c-model)'} weight={row.dashed ? 2.5 : 3.5} dashed={row.dashed} />
            ))}
            <Label x={DATA_RANGE[0]} y={y + 0.3} attach="ne" size={11} color="var(--text)">{row.name}</Label>
          </g>
        );
      })}
      <Point x={real.wald.lambda * 100} y={dataRows.length - 0.5} color="var(--c-data)" />
    </PlotFrame>
  ) : null;

  const plot = (mode === 'sim' ? simPlot : dataPlot) ?? (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed && mode === 'data' ? 'The data did not load.' : 'Computing…'}</p>
  );

  const quarter = (v: number) => `${num(v * 100, 2)}%`;
  const quarterFar = (v: number) => `${num(v * 100, 1)}%`;
  const first = sim?.world.wald[0];
  const firstFar = sim?.world.far[0];

  const ariaLabel = mode === 'sim'
    ? (sim
      ? `95% confidence sets for the premium in the first ${SHOWN} of ${WEAK.samples} simulated samples with a beta spread of ${num(sim.params.spread)} and a true premium of 1. Over all samples the Shanken Wald set contains the truth in ${share(sim.world.coverage.shanken)}, the GRS-FAR set in ${share(sim.world.coverage.far)}.`
      : 'Confidence sets for the premium in simulated samples. The simulation is loading.')
    : (real
      ? `Confidence sets for the premium on consumption growth, quarterly 25 size–B/M portfolios ${real.first} to ${real.last}. The Wald sets are narrow, the 95% GRS-FAR set runs from ${setText(real.far95, DC_GRID, quarterFar)} a quarter, and the 99% GRS-FAR set is ${setText(real.far99, DC_GRID, quarterFar)}.`
      : 'Confidence sets for the premium on consumption growth. The data are loading.');

  return (
    <WidgetFrame
      title="Wald and GRS-FAR confidence sets for the premium"
      ariaLabel={ariaLabel}
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Sample" value={mode} options={MODES} onChange={setMode} />
          {mode === 'sim' && (
            <>
              <Slider label="Beta spread (0: all betas equal)" value={params.spread} min={0} max={1} step={0.05}
                onChange={(spread) => setParams((p) => ({ ...p, spread }))} format={(v) => num(v)} />
              <Button onClick={() => setParams((p) => ({ ...p, seed: p.seed + 1 }))}>Re-roll simulation</Button>
            </>
          )}
        </>
      }
      readout={
        mode === 'sim' ? (
          sim && first && firstFar ? (
            <>
              <p style={{ margin: '0 0 0.5rem' }}>
                <span style={{ color: 'var(--c-data)' }}>● estimate λ̂</span>
                {' · '}<span style={{ color: 'var(--text-muted)' }}>– – Wald (Shanken)</span>
                {' · '}<span style={{ color: 'var(--c-model)' }}>━ GRS-FAR</span>
                {' · '}<span style={{ color: 'var(--c-error)' }}>red: misses the true λ</span>
                {' · '}▶ runs on
                {pending && <> · updating…</>}
              </p>
              <dl className="readout-grid">
                <dt>Betas</dt>
                <dd>{num(sim.world.beta[0])} to {num(sim.world.beta.at(-1)!)}</dd>
                <dt>Sample 1: Wald, Shanken</dt>
                <dd>{waldText(first.shanken, num)}</dd>
                <dt>Sample 1: GRS-FAR</dt>
                <dd>{setText(firstFar, WEAK_GRID, num)}</dd>
                <dt>Sets that contain λ = 1 (target 95%)</dt>
                <dd>
                  Fama–MacBeth {share(sim.world.coverage.famaMacBeth)}, Shanken {share(sim.world.coverage.shanken)},{' '}
                  <span style={{ color: 'var(--c-model)' }}>GRS-FAR {share(sim.world.coverage.far)}</span>
                </dd>
                <dt>Unbounded GRS-FAR sets</dt>
                <dd>{share(sim.world.far.filter((f) => f.unbounded).length / WEAK.samples)}</dd>
                <dt>Samples, seed</dt>
                <dd>{WEAK.samples}, {sim.params.seed}</dd>
              </dl>
            </>
          ) : <p>Simulating…</p>
        ) : real ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-data)' }}>● estimate λ̂</span>
              {' · '}<span style={{ color: 'var(--text-muted)' }}>– – Wald</span>
              {' · '}<span style={{ color: 'var(--c-model)' }}>━ GRS-FAR</span>
              {' · '}◀ ▶ runs on
            </p>
            <dl className="readout-grid">
              <dt><RichText>{'Rank test of $B = 0$'}</RichText></dt>
              <dd>F({real.rank.df1}, {real.rank.df2}) = {num(real.rank.statistic)}, p = {real.rank.pValue.toFixed(3)}</dd>
              <dt><RichText>{'Estimate $\\hat\\lambda$'}</RichText></dt>
              <dd style={{ color: 'var(--c-data)' }}>{quarter(real.wald.lambda)} a quarter</dd>
              <dt>95% Wald, Fama–MacBeth</dt>
              <dd>{waldText(real.wald.famaMacBeth, quarter)}</dd>
              <dt>95% Wald, Shanken</dt>
              <dd>{waldText(real.wald.shanken, quarter)}</dd>
              <dt>95% GRS-FAR</dt>
              <dd style={{ color: 'var(--c-model)' }}>{setText(real.far95, DC_GRID, quarterFar)}</dd>
              <dt>99% GRS-FAR</dt>
              <dd style={{ color: 'var(--c-model)' }}>{setText(real.far99, DC_GRID, quarterFar)}</dd>
              <dt>Coverage</dt>
              <dd>not known: real data have no true λ</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={mode === 'sim'
        ? `Simulated (seeded): $\\Ret{R^e_{i,t}} = \\beta_i(\\lambda + \\Factor{f_t}) + \\Err{\\varepsilon_{i,t}}$ with $\\lambda = 1$, $T = ${WEAK.T}$, $N = ${WEAK.N}$, betas evenly spaced around 1, and standard normal factor and residuals, ${WEAK.samples} samples. Wald: $\\hat\\lambda \\pm 1.96\\,\\mathrm{se}$ from the two-pass regression with an intercept. GRS-FAR: every $\\lambda^{\\circ}$ on a grid from −4 to 6 that the test does not reject at 5%.`
        : `Real data: ff25-size-bm-monthly and ff3-monthly compounded into quarters, minus the risk-free rate, and consumption growth from fred-cay-quarterly${real ? `, return quarters ${real.first} to ${real.last} (${real.quarters} quarters)` : ''}. Two-pass regression with an intercept; GRS-FAR on a grid from −100% to 100% a quarter.`}
    />
  );
}
