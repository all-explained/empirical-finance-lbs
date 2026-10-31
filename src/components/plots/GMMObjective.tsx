import { Point, useTransformContext, vec } from 'mafs';
import { useMemo, useState, type SVGProps } from 'react';
import { gmmObjective, TOY_MEAN, TOY_VARIANCE, type GMMMethod } from '../../lib/stats/gmm';
import { Button, Segmented } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { DEFAULT_SEED, fitToy, objectiveGrid, SAMPLE_T, toySample, type MomentCount } from './gmmSample';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 340;
const MU: [number, number] = [0.3, 0.7];
const VARIANCE: [number, number] = [0.7, 1.3];
const NODES = 48;
/** Shading bands and contour levels sit a factor √10 apart, counted down from the largest value on the grid. */
const BANDS = 8;

const METHOD_LABELS: Record<GMMMethod, string> = {
  'one-step': 'One-step, W = I',
  'two-step': 'Two-step, W = Ŝ⁻¹',
  iterated: 'Iterated',
  cue: 'Continuously updated',
};
const METHOD_TEX: Record<GMMMethod, string> = {
  'one-step': 'one-step GMM with $W = I$',
  'two-step': 'two-step GMM with $W = \\hat S^{-1}$ from the one-step estimate',
  iterated: 'iterated GMM, $W = \\hat S^{-1}$ recomputed until $\\hat\\theta$ stops moving',
  cue: 'continuously updated GMM, $W = \\hat S(\\theta)^{-1}$ at every $\\theta$',
};

const num = (v: number, digits = 3) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const small = (v: number) => (v < 1e-10 ? '0' : v.toPrecision(2));
const nodes = ([lo, hi]: [number, number]) => Array.from({ length: NODES }, (_, i) => lo + ((i + 0.5) * (hi - lo)) / NODES);
const shade = (band: number) => 0.05 + (0.8 * band) / (BANDS - 1);

/** An SVG path whose points are given in data coordinates. Colours go in `style`: Mafs CSS overrides SVG attributes. */
function DataPath({ build, ...svg }: { build: (px: (x: number, y: number) => string) => string } & SVGProps<SVGPathElement>) {
  const { viewTransform, userTransform } = useTransformContext();
  const m = vec.matrixMult(viewTransform, userTransform);
  const px = (x: number, y: number) => vec.transform([x, y], m).map((v) => v.toFixed(1)).join(' ');
  return <path d={build(px)} {...svg} />;
}

type Segment = [[number, number], [number, number]];

/** Marching squares: the segments where the grid surface crosses level, by linear interpolation along cell edges.
 * ponytail: a saddle cell pairs its crossings in edge order; finer grids make that case rare.
 */
function contour(values: number[][], xs: number[], ys: number[], level: number): Segment[] {
  const segments: Segment[] = [];
  for (let i = 0; i + 1 < xs.length; i++) {
    for (let j = 0; j + 1 < ys.length; j++) {
      const corners: [number, number][] = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
      const points: [number, number][] = [];
      corners.forEach(([a, b], k) => {
        const [c, d] = corners[(k + 1) % 4];
        const p = values[a][b] - level;
        const q = values[c][d] - level;
        if (p < 0 === q < 0) return;
        const s = p / (p - q);
        points.push([xs[a] + s * (xs[c] - xs[a]), ys[b] + s * (ys[d] - ys[b])]);
      });
      for (let k = 0; k + 1 < points.length; k += 2) segments.push([points[k], points[k + 1]]);
    }
  }
  return segments;
}

/**
 * Chapters 24 and 25: the GMM objective over θ = (μ, σ²) for the seeded toy sample of gmm.ts, as a heat map
 * with contour lines. A control picks 2 moments (just identified) or 4 (over-identified), starting at
 * initialCount; another picks the weighting, from `methods`. The readout gives θ̂, its standard errors and the objective at the minimum.
 */
export default function GMMObjective({ methods = ['one-step', 'two-step'], initialCount = 2, title = 'The GMM objective and its minimum' }: {
  methods?: GMMMethod[]; initialCount?: MomentCount; title?: string;
}) {
  const [count, setCount] = useState<MomentCount>(initialCount);
  const [method, setMethod] = useState<GMMMethod>(methods[0]);
  const [seed, setSeed] = useState(DEFAULT_SEED);

  const x = useMemo(() => toySample(seed), [seed]);
  const fit = useMemo(() => fitToy(x, count, method), [x, count, method]);
  const view = useMemo(() => {
    const mu = nodes(MU);
    const variance = nodes(VARIANCE);
    const values = objectiveGrid(x, count, method, fit, mu, variance);
    const flat = values.flat();
    const lo = Math.min(...flat);
    const range = Math.max(...flat) - lo;
    // Band 0 holds the highest values; band BANDS - 1 everything within 10^(-3.5) of the range above the minimum.
    const band = (v: number) => Math.min(BANDS - 1, Math.floor(-2 * Math.log10(Math.max((v - lo) / range, 1e-300))));
    const levels = Array.from({ length: BANDS - 1 }, (_, k) => range * 10 ** (-(k + 1) / 2));
    const dx = (MU[1] - MU[0]) / NODES;
    const dy = (VARIANCE[1] - VARIANCE[0]) / NODES;
    // One rectangle per run of equal bands along μ, collected into one path per band.
    const rects: [number, number, number, number][][] = Array.from({ length: BANDS }, () => []);
    variance.forEach((v, j) => {
      let start = 0;
      for (let i = 1; i <= NODES; i++) {
        if (i < NODES && band(values[i][j]) === band(values[start][j])) continue;
        rects[band(values[start][j])].push([mu[start] - dx / 2, mu[i - 1] + dx / 2, v - dy / 2, v + dy / 2]);
        start = i;
      }
    });
    return { rects, levels, contours: levels.map((level) => contour(values, mu, variance, lo + level)), minimum: lo };
  }, [x, count, method, fit]);

  const [muHat, varHat] = fit.theta;
  const markX = useTweened(muHat);
  const markY = useTweened(varHat);
  const objective = gmmObjective(fit.gT, fit.W);

  const plot = (
    <PlotFrame
      x={MU}
      y={VARIANCE}
      height={HEIGHT}
      xTicks={[0.3, 0.4, 0.5, 0.6, 0.7]}
      yTicks={[0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3]}
      formatX={(v) => v.toFixed(1)}
      formatY={(v) => v.toFixed(1)}
      xLabel="mean μ"
      yLabel="variance σ²"
    >
      {view.rects.map((cells, b) => (
        <DataPath key={`b${b}`} fill="var(--c-data)" fillOpacity={shade(b)} style={{ stroke: 'none', shapeRendering: 'crispEdges' }}
          build={(px) => cells.map(([x0, x1, y0, y1]) => `M${px(x0, y0)}L${px(x1, y0)}L${px(x1, y1)}L${px(x0, y1)}Z`).join('')} />
      ))}
      {view.contours.map((segments, k) => (
        <DataPath key={`c${k}`} fill="none" style={{ stroke: 'var(--text)', strokeOpacity: 0.55, strokeWidth: 1 }}
          build={(px) => segments.map(([a, b]) => `M${px(...a)}L${px(...b)}`).join('')} />
      ))}
      <Point x={TOY_MEAN} y={TOY_VARIANCE} color="var(--text)" svgCircleProps={{ r: 4 }} />
      <Label x={TOY_MEAN} y={TOY_VARIANCE} attach="sw" attachDistance={8} size={12} color="var(--text)">true θ₀</Label>
      <Point x={markX} y={markY} color="var(--c-model)" svgCircleProps={{ r: 6 }} />
      <Label x={markX} y={markY} attach="ne" attachDistance={9} size={13} color="var(--c-model)">minimum</Label>
    </PlotFrame>
  );

  return (
    <WidgetFrame
      title={title}
      ariaLabel={`Heat map of the GMM objective over the mean μ (horizontal, 0.3 to 0.7) and the variance σ² (vertical, 0.7 to 1.3), with ${count} moments and ${METHOD_LABELS[method]}. Stronger shading and inner contours mean a lower objective. The minimum is at μ = ${num(muHat)}, σ² = ${num(varHat)}; the true value is μ = 0.5, σ² = 1.`}
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented<'2' | '4'>
            label="Number of moments"
            value={String(count) as '2' | '4'}
            options={[{ value: '2', label: '2 moments: just identified' }, { value: '4', label: '4 moments: over-identified' }]}
            onChange={(v) => setCount(Number(v) as MomentCount)}
          />
          {methods.length > 1 && (
            <Segmented<GMMMethod>
              label="Weighting matrix"
              value={method}
              options={methods.map((m) => ({ value: m, label: METHOD_LABELS[m] }))}
              onChange={setMethod}
            />
          )}
          <Button onClick={() => setSeed((s) => s + 1)}>New sample</Button>
        </>
      }
      readout={
        <>
          <p>
            <span style={{ color: 'var(--c-model)' }}>● minimum, the estimate</span>{' · '}○ true θ₀{' · '}
            <span aria-hidden="true">
              {Array.from({ length: BANDS }, (_, b) => (
                <span key={b} style={{ display: 'inline-block', width: '0.8em', height: '0.8em', marginRight: 1, verticalAlign: '-0.1em', background: 'var(--c-data)', opacity: shade(b) }} />
              ))}
            </span>
            {' '}objective above its minimum, from {small(view.levels[0])} (faint) down to {small(view.levels.at(-1)!)} (strong), lines a factor √10 apart
          </p>
          <dl className="readout-grid">
            <dt><RichText>{'Estimate $\\hat\\mu$, $\\hat\\sigma^2$'}</RichText></dt>
            <dd style={{ color: 'var(--c-model)' }}>{num(muHat)}, {num(varHat)}</dd>
            <dt>Standard errors</dt>
            <dd>{num(fit.standardErrors[0])}, {num(fit.standardErrors[1])}</dd>
            <dt><RichText>{'Minimum of $g_T\'Wg_T$'}</RichText></dt>
            <dd>{small(objective)}</dd>
            <dt>Sample</dt>
            <dd>T = {SAMPLE_T}, seed {seed}</dd>
          </dl>
        </>
      }
      caption={`Simulated (seeded): $T = ${SAMPLE_T}$ independent normal draws of $x_t$ with mean 0.5 and variance 1. The moments are $x_t - \\mu$ and $(x_t - \\mu)^2 - \\sigma^2$, plus $(x_t - \\mu)^3$ and $(x_t - \\mu)^4 - 3\\sigma^4$ with 4 moments. Shown: ${METHOD_TEX[method]}. Scaling $W$ by a number does not move $\\hat\\theta$, so the contour levels are relative to the range on the grid; only their shape matters. $\\hat S$ uses no lags, because the draws are independent.`}
    />
  );
}
