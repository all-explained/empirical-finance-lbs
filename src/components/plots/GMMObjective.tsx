import { Line, Point, Polygon } from 'mafs';
import { useMemo, useState } from 'react';
import { gmmObjective, TOY_MEAN, TOY_VARIANCE, type GMMMethod } from '../../lib/stats/gmm';
import { Button, Segmented } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { clamp, extent, niceTicks } from './format';
import {
  gridPoints, MU_RANGE, OBJECTIVE_SEED, OBJECTIVE_T, objectiveSample, surface, toyEstimate, VARIANCE_RANGE,
  type MomentCount,
} from './gmmSample';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 330;
/** Contour levels of T × objective. Shading runs on a log scale from the surface's minimum to its maximum. */
const LEVELS = [1, 3, 10, 30, 100, 300, 1000];

const METHOD_LABEL: Record<GMMMethod, string> = {
  'one-step': 'Identity', 'two-step': 'Two-step', iterated: 'Iterated', cue: 'CUE',
};
const METHOD_TEX: Record<GMMMethod, string> = {
  'one-step': 'W = I', 'two-step': 'W = \\hat S(\\hat\\theta_1)^{-1}', iterated: 'W = \\hat S(\\hat\\theta)^{-1}', cue: 'W = \\hat S(\\theta)^{-1}',
};

const num = (v: number, digits = 3) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;

type Point2 = [number, number];

/** Line segments where a grid of node values crosses level (marching squares, with linear interpolation). */
function contour(values: number[][], xs: number[], ys: number[], level: number): [Point2, Point2][] {
  const segments: [Point2, Point2][] = [];
  const at = (i: number, j: number) => Math.min(values[i][j], 1e12);
  for (let i = 0; i + 1 < xs.length; i++) {
    for (let j = 0; j + 1 < ys.length; j++) {
      // Corners in order around the cell, and the edge from each corner to the next.
      const corners: [number, number][] = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
      const crossings: Point2[] = [];
      corners.forEach(([a, b], k) => {
        const [c, d] = corners[(k + 1) % 4];
        const va = at(a, b) - level;
        const vc = at(c, d) - level;
        if ((va < 0) === (vc < 0)) return;
        const s = va / (va - vc);
        crossings.push([xs[a] + s * (xs[c] - xs[a]), ys[b] + s * (ys[d] - ys[b])]);
      });
      for (let k = 0; k + 1 < crossings.length; k += 2) segments.push([crossings[k], crossings[k + 1]]);
    }
  }
  return segments;
}

/**
 * Chapters 24 and 25: the GMM objective T·g_T(θ)'Wg_T(θ) of the toy model over θ = (μ, σ²), on one seeded sample,
 * as a shaded surface with contour lines. The chosen weighting's minimum θ̂ is marked, with the other methods'
 * minima as hollow points and the true θ0 as a cross. With 2 moments the model is just identified and every
 * weighting gives the same θ̂; with 4 the weighting moves the surface and its minimum.
 */
export default function GMMObjective({ methods = ['one-step', 'two-step'], initialCount = 2, initialMethod }: {
  methods?: GMMMethod[]; initialCount?: MomentCount; initialMethod?: GMMMethod;
}) {
  const [count, setCount] = useState<MomentCount>(initialCount);
  const [method, setMethod] = useState<GMMMethod>(initialMethod ?? methods[0]);
  const [seed, setSeed] = useState(OBJECTIVE_SEED);

  const x = useMemo(() => objectiveSample(seed), [seed]);
  const estimates = useMemo(
    () => Object.fromEntries(methods.map((m) => [m, toyEstimate(x, count, m)])) as Record<GMMMethod, ReturnType<typeof toyEstimate>>,
    [x, count, methods.join()],
  );
  const estimate = estimates[method];
  const mus = useMemo(() => gridPoints(MU_RANGE), []);
  const variances = useMemo(() => gridPoints(VARIANCE_RANGE), []);

  // The shaded cells and the contours are the heavy part of the picture: build them only when the surface changes,
  // so the tweened marker does not re-render them.
  const picture = useMemo(() => {
    const values = surface(x, count, method, estimate).map((row) => row.map((v) => OBJECTIVE_T * v));
    const logs = values.flat().filter(Number.isFinite).map((v) => Math.log(Math.max(v, 1e-6)));
    const [lo, hi] = extent(logs);
    const cells = [];
    for (let i = 0; i + 1 < mus.length; i++) {
      for (let j = 0; j + 1 < variances.length; j++) {
        const mean = (values[i][j] + values[i + 1][j] + values[i + 1][j + 1] + values[i][j + 1]) / 4;
        const shade = clamp((Math.log(Math.max(mean, 1e-6)) - lo) / (hi - lo || 1), 0, 1);
        cells.push(
          <Polygon key={`c${i}-${j}`}
            points={[[mus[i], variances[j]], [mus[i + 1], variances[j]], [mus[i + 1], variances[j + 1]], [mus[i], variances[j + 1]]]}
            color="var(--text)" fillOpacity={0.02 + 0.5 * shade} weight={0} strokeOpacity={0}
            svgPolygonProps={{ shapeRendering: 'crispEdges' }} />,
        );
      }
    }
    const lines = LEVELS.flatMap((level) => contour(values, mus, variances, level).map(([p, q], k) => (
      <Line.Segment key={`l${level}-${k}`} point1={p} point2={q} color="var(--text-muted)" weight={1} />
    )));
    return <>{cells}{lines}</>;
  }, [x, count, method, estimate, mus, variances]);

  const muHat = useTweened(estimate.theta[0]);
  const varHat = useTweened(estimate.theta[1]);
  const inView = (t: number[]) => t[0] >= MU_RANGE[0] && t[0] <= MU_RANGE[1] && t[1] >= VARIANCE_RANGE[0] && t[1] <= VARIANCE_RANGE[1];
  // For the efficient methods this is J.
  const tq = OBJECTIVE_T * gmmObjective(estimate.gT, estimate.W);

  const plot = (
    <PlotFrame
      x={MU_RANGE}
      y={VARIANCE_RANGE}
      height={HEIGHT}
      xTicks={niceTicks(...MU_RANGE, 5)}
      yTicks={niceTicks(...VARIANCE_RANGE, 5)}
      formatX={(v) => num(v, 1)}
      formatY={(v) => num(v, 1)}
      xLabel="mean μ"
      yLabel="variance σ²"
    >
      {picture}
      <Line.Segment point1={[TOY_MEAN - 0.02, TOY_VARIANCE]} point2={[TOY_MEAN + 0.02, TOY_VARIANCE]} color="var(--text)" weight={2} />
      <Line.Segment point1={[TOY_MEAN, TOY_VARIANCE - 0.025]} point2={[TOY_MEAN, TOY_VARIANCE + 0.025]} color="var(--text)" weight={2} />
      <Label x={TOY_MEAN} y={TOY_VARIANCE - 0.03} attach="s" attachDistance={2} size={12} color="var(--text)">true θ₀</Label>
      {methods.filter((m) => m !== method && inView(estimates[m].theta)).map((m) => (
        <Point key={m} x={estimates[m].theta[0]} y={estimates[m].theta[1]} color="var(--c-model)"
          svgCircleProps={{ r: 4, fillOpacity: 0, strokeWidth: 1.5 }} />
      ))}
      {inView([muHat, varHat]) && (
        <>
          <Point x={muHat} y={varHat} color="var(--c-model)" svgCircleProps={{ r: 6 }} />
          <Label x={muHat} y={varHat} attach="nw" attachDistance={8} size={12} color="var(--c-model)">estimate</Label>
        </>
      )}
    </PlotFrame>
  );

  const [mu, variance] = estimate.theta;
  const [seMu, seVar] = estimate.standardErrors;
  return (
    <WidgetFrame
      title="The GMM objective and its minimum"
      ariaLabel={`Shaded surface of T times the GMM objective over the mean and the variance, for ${count} moments and the ${METHOD_LABEL[method]} weighting, on a seeded sample of ${OBJECTIVE_T} draws. The minimum is at mean ${num(mu)} and variance ${num(variance)}; the true values are ${TOY_MEAN} and ${TOY_VARIANCE}. ${count === 2 ? 'With two moments every weighting gives the same minimum.' : `The other weightings put the minimum at ${methods.filter((m) => m !== method).map((m) => `${num(estimates[m].theta[0])}, ${num(estimates[m].theta[1])} (${METHOD_LABEL[m]})`).join('; ')}.`}`}
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Number of moments" value={String(count) as '2' | '4'}
            options={[{ value: '2', label: '2: just identified' }, { value: '4', label: '4: over-identified' }]}
            onChange={(v) => setCount(Number(v) as MomentCount)} />
          <Segmented label="Weighting matrix" value={method}
            options={methods.map((m) => ({ value: m, label: METHOD_LABEL[m] }))}
            onChange={setMethod} />
          <Button onClick={() => setSeed((s) => s + 1)}>Draw a new sample</Button>
        </>
      }
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span>▮ shading: <RichText>{'$T\\,g_T\'Wg_T$'}</RichText>, stronger shading is larger · — contours at {LEVELS.join(', ')}</span>
            {' · '}<span style={{ color: 'var(--c-model)' }}><RichText>{`● estimate $\\hat\\theta$${methods.length > 1 ? ', ○ other weightings' : ''}`}</RichText></span>
            {' · '}<span>+ true θ₀</span>
          </p>
          <dl className="readout-grid">
            <dt>Weighting</dt>
            <dd><RichText>{`${METHOD_LABEL[method]}, $${METHOD_TEX[method]}$`}</RichText></dd>
            <dt><RichText>{'$\\hat\\mu$ (s.e.)'}</RichText></dt>
            <dd style={{ color: 'var(--c-model)' }}>{num(mu)} ({num(seMu)})</dd>
            <dt><RichText>{'$\\hat\\sigma^2$ (s.e.)'}</RichText></dt>
            <dd style={{ color: 'var(--c-model)' }}>{num(variance)} ({num(seVar)})</dd>
            <dt><RichText>{'$T\\,g_T\'Wg_T$ at $\\hat\\theta$'}</RichText></dt>
            <dd>
              {num(tq, 2)}
              {estimate.J !== null && estimate.pValue !== null
                ? <RichText>{` $= J$, $p = ${num(estimate.pValue, 2)}$ ($\\chi^2_{${estimate.df}}$)`}</RichText>
                : count === 2 ? ' (just identified: zero)' : <RichText>{' (not a $J$ statistic: $W \\ne \\hat S^{-1}$)'}</RichText>}
            </dd>
            <dt>Sample</dt>
            <dd>T = {OBJECTIVE_T}, seed {seed}{estimate.converged ? '' : ', search stopped at its cap'}</dd>
          </dl>
        </>
      }
      caption={`Simulated (seeded): $T = ${OBJECTIVE_T}$ normal draws with mean ${TOY_MEAN} and variance ${TOY_VARIANCE}. The moments are, in order, $x_t - \\mu$, $(x_t - \\mu)^2 - \\sigma^2$, $(x_t - \\mu)^3$ and $(x_t - \\mu)^4 - 3\\sigma^4$. Identity is one-step GMM with $W = I$; two-step and iterated GMM fix $W = \\hat S^{-1}$ before each search; CUE lets $\\hat S(\\theta)$ move with $\\theta$, so its surface is not a fixed quadratic form. Standard errors are the sandwich for the identity and $\\tfrac1T(D'\\hat S^{-1}D)^{-1}$ for the others.`}
    />
  );
}
