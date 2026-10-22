import { Line, Point, Polygon, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { autocorrelations, overlapCorrelation } from '../../lib/stats/autocorr';
import { Button, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { DEFAULT_SEED, overlappingSums, SIM_MONTHS, simulatedLogReturns } from './hacSample';

const K = 12;
const MAX_GAP = 24;
const STRIP = K + MAX_GAP;
const SHOWN_STARTS = 120;
const STRIP_HEIGHT = 210;
const PATH_HEIGHT = 190;

const pct = (v: number, digits = 1) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;

/**
 * Chapter 4: two 12-month windows of seeded monthly returns that start j months apart.
 * Top: the monthly returns, with the shared months shaded. Bottom: every overlapping
 * 12-month return, with windows A and B marked. The readout compares the share of
 * shared months with the sample autocorrelation of the overlapping series.
 */
export default function OverlapDemo({ initialGap = 1 }: { initialGap?: number }) {
  const [j, setJ] = useState(initialGap);
  const [seed, setSeed] = useState(DEFAULT_SEED);

  const sim = useMemo(() => {
    const r = simulatedLogReturns(seed);
    const y = overlappingSums(r, K);
    return { r, y, rho: autocorrelations(y, MAX_GAP) };
  }, [seed]);

  const shared = Math.max(K - j, 0);
  const strip = sim.r.slice(0, STRIP);
  const big = Math.max(...strip.map(Math.abs));
  // Brackets for A and B sit below the bars, so the axis title at the top stays clear.
  const stripTop = big * 1.3;
  const stripBottom = -big * 1.75;
  const inA = (m: number) => m <= K;
  const inB = (m: number) => m > j && m <= j + K;
  const yA = -big * 1.25;
  const yB = -big * 1.55;

  const path = sim.y.slice(0, SHOWN_STARTS);
  const pathLo = Math.min(...path) - 0.04;
  const pathHi = Math.max(...path) + 0.14;

  const plot = (
    <div>
      <PlotFrame
        x={[0.4, STRIP + 0.6]}
        y={[stripBottom, stripTop]}
        height={STRIP_HEIGHT}
        xTicks={[1, 6, 12, 18, 24, 30, 36]}
        yTicks={niceTicks(-big, big, 4)}
        formatY={(v) => pct(v, 0)}
        xLabel="month"
        yLabel="monthly log return"
        baseline={0}
      >
        {shared > 0 && (
          <Polygon
            points={[[j + 0.5, stripBottom], [K + 0.5, stripBottom], [K + 0.5, stripTop], [j + 0.5, stripTop]]}
            color="var(--text)" fillOpacity={0.1} strokeOpacity={0}
          />
        )}
        {strip.map((v, i) => {
          const m = i + 1;
          const windows = Number(inA(m)) + Number(inB(m));
          return (
            <Polygon
              key={`m${m}`}
              points={[[m - 0.35, 0], [m + 0.35, 0], [m + 0.35, v], [m - 0.35, v]]}
              color="var(--c-return)"
              fillOpacity={[0.12, 0.45, 0.85][windows]}
              strokeOpacity={windows ? 1 : 0.3}
              weight={1}
            />
          );
        })}
        <Line.Segment point1={[0.6, yA]} point2={[K + 0.4, yA]} color="var(--text)" weight={3} />
        <Label x={K + 0.4} y={yA} attach="e" attachDistance={4} size={12}>A</Label>
        <Line.Segment point1={[j + 0.6, yB]} point2={[j + K + 0.4, yB]} color="var(--text)" weight={3} style="dashed" />
        <Label x={j + K + 0.4} y={yB} attach="e" attachDistance={4} size={12}>B</Label>
      </PlotFrame>
      <PlotFrame
        x={[0.4, SHOWN_STARTS + 0.6]}
        y={[pathLo, pathHi]}
        height={PATH_HEIGHT}
        xTicks={[1, 20, 40, 60, 80, 100, 120]}
        yTicks={niceTicks(pathLo, pathHi, 4)}
        formatY={(v) => pct(v, 0)}
        xLabel="first month of the window"
        yLabel="12-month log return"
        baseline={pathLo < 0 && pathHi > 0 ? 0 : undefined}
      >
        <Polyline points={path.map((v, i) => [i + 1, v] as [number, number])} color="var(--c-return)" weight={2} fillOpacity={0} />
        <Point x={1} y={sim.y[0]} color="var(--text)" />
        <Label x={1} y={sim.y[0]} attach="n" attachDistance={8} size={12}>A</Label>
        <Point x={1 + j} y={sim.y[j]} color="var(--text)" />
        <Label x={1 + j} y={sim.y[j]} attach="s" attachDistance={8} size={12}>B</Label>
      </PlotFrame>
    </div>
  );

  return (
    <WidgetFrame
      title="Two 12-month returns that share months"
      ariaLabel={`Top: 36 simulated monthly returns (seed ${seed}). Window A covers months 1 to 12 and window B covers months ${j + 1} to ${j + K}, so they share ${shared} months. Bottom: the 12-month return for each starting month from 1 to ${SHOWN_STARTS}, a smooth line, with A at ${pct(sim.y[0])} and B at ${pct(sim.y[j])}.`}
      plotHeight={STRIP_HEIGHT + PATH_HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Gap $j$ between the windows" value={j} min={0} max={MAX_GAP} onChange={setJ} format={(v) => `${v} month${v === 1 ? '' : 's'}`} />
          <Button onClick={() => setSeed((s) => s + 1)}>Re-roll simulation</Button>
        </>
      }
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span>━ A: months 1–12</span> · <span>– – B: months {j + 1}–{j + K}</span> · <span>shaded: shared months</span>
          </p>
          <dl className="readout-grid">
            <dt>Months shared by A and B</dt>
            <dd>{shared} of {K}</dd>
            <dt><RichText>{'Correlation if months are independent, $(12 - j)/12$'}</RichText></dt>
            <dd>{num(overlapCorrelation(K, j))}</dd>
            <dt><RichText>{`Sample autocorrelation at lag $${j}$ (${SIM_MONTHS} months)`}</RichText></dt>
            <dd>{num(sim.rho[j])}</dd>
            <dt>12-month return of A and of B</dt>
            <dd style={{ color: 'var(--c-return)' }}>{pct(sim.y[0])} and {pct(sim.y[j])}</dd>
            <dt>Seed</dt>
            <dd>{seed}</dd>
          </dl>
        </>
      }
      caption={`Simulated (seeded): ${SIM_MONTHS} independent monthly log returns with mean 0.5% and volatility 4.5%. Each 12-month return is the sum of 12 monthly log returns. The sample autocorrelation uses all ${sim.y.length} overlapping 12-month returns of the simulation.`}
    />
  );
}
