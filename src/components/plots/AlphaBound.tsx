import { Line, Point, Polygon } from 'mafs';
import { Fragment, useMemo, useState } from 'react';
import { alphaBound } from '../../lib/finance/shortWindow';
import { Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { capmAlpha, FACTORS, lambdaNeeded, quarterBetas, SAMPLE, useShortWindowData } from './shortWindowSample';

const HEIGHT = 320;
const WIDTH = 0.36;
const pct = (v: number, digits = 1) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
// Group g starts at x = g × GAP: actual alpha, then the bound, then the average conditional alpha.
const GAP = 4;
const bar = (x: number, height: number): [number, number][] => [[x - WIDTH, 0], [x + WIDTH, 0], [x + WIDTH, height], [x - WIDTH, height]];

/**
 * Chapter 23: for HML and Mom, the unconditional CAPM alpha next to the largest alpha that beta timing
 * can create, σ(β̂_iq) σ(λ_t), and the average conditional alpha from quarterly regressions.
 */
export default function AlphaBound({ initialSigmaLambda = 0.06 }: { initialSigmaLambda?: number }) {
  const [sigmaLambda, setSigmaLambda] = useState(initialSigmaLambda);
  const { data, failed } = useShortWindowData();

  const rows = useMemo(() => (data ? FACTORS.map((f) => ({ ...f, quarters: quarterBetas(data, f.value), capm: capmAlpha(data, f.value) })) : null), [data]);
  const view = rows?.map((r) => {
    const bound = alphaBound(r.quarters.sigmaBeta, sigmaLambda);
    return { ...r, bound, boundTrue: alphaBound(r.quarters.sigmaBetaTrue, sigmaLambda), share: bound / r.capm.alpha, needed: lambdaNeeded(r.capm.alpha, r.quarters.sigmaBeta) };
  });
  // A fixed range, so moving the slider changes only the bound bars.
  const top = 0.16;

  const plot = view ? (
    <PlotFrame
      x={[-0.8, GAP + 2.8]}
      y={[0, top]}
      height={HEIGHT}
      xTicks={[1, GAP + 1]}
      yTicks={niceTicks(0, top, 6)}
      formatX={(v) => (v === 1 ? 'HML' : 'Mom')}
      formatY={(v) => pct(v, 0)}
      yLabel="alpha, % a year"
      baseline={0}
      marginLeft={44}
    >
      {view.map((r, g) => {
        const x = g * GAP;
        const a = r.quarters;
        return (
          <g key={r.value}>
            <Polygon points={bar(x, r.capm.alpha)} color="var(--c-data)" fillOpacity={0.55} weight={2} />
            <Polygon points={bar(x + 1, r.bound)} color="var(--c-model)" fillOpacity={0.15} weight={2} strokeStyle="dashed" />
            <Line.Segment point1={[x + 2, a.alpha - a.alphaHalf]} point2={[x + 2, a.alpha + a.alphaHalf]} color="var(--c-data)" weight={3} opacity={0.6} />
            <Point x={x + 2} y={a.alpha} color="var(--c-data)" svgCircleProps={{ r: 5 }} />
            <Label x={x} y={r.capm.alpha} attach="n" attachDistance={4} size={12}>{pct(r.capm.alpha)}</Label>
            <Label x={x + 1} y={r.bound} attach="n" attachDistance={4} size={12} color="var(--c-model)">{pct(r.bound)}</Label>
            <Label x={x + 2} y={a.alpha + a.alphaHalf} attach="n" attachDistance={4} size={12}>{pct(a.alpha)}</Label>
          </g>
        );
      })}
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  return (
    <WidgetFrame
      title="How much alpha can beta timing create?"
      ariaLabel={
        view
          ? `Bar chart in percent a year, ${SAMPLE.first} to ${SAMPLE.last}, with σ of the market premium set to ${pct(sigmaLambda)} a year. ${view.map((r) => `${r.value}: actual CAPM alpha ${pct(r.capm.alpha)}, largest alpha from beta timing ${pct(r.bound)}, average conditional alpha ${pct(r.quarters.alpha)} with 95% bar from ${pct(r.quarters.alpha - r.quarters.alphaHalf)} to ${pct(r.quarters.alpha + r.quarters.alphaHalf)}.`).join(' ')}`
          : 'Actual alphas and the beta-timing bound. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <Slider
          label="$\sigma(\lambda_t)$, volatility of the market premium"
          value={sigmaLambda} min={0} max={0.2} step={0.005} onChange={setSigmaLambda}
          format={(v) => `${pct(v)} a year`} color="var(--c-model)"
        />
      }
      readout={
        view ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-data)' }}>■ solid bar: actual CAPM alpha</span> ·{' '}
              <span style={{ color: 'var(--c-model)' }}>┄ dashed bar: largest alpha from beta timing</span> ·{' '}
              <span style={{ color: 'var(--c-data)' }}>● dot: average conditional alpha, 95% bar</span>
            </p>
            <dl className="readout-grid">
              {view.map((r) => (
                <Fragment key={r.value}>
                  <dt><RichText>{`${r.value}: bound $\\sigma(\\hat\\beta_{i,q})\\,\\sigma(\\lambda_t)$`}</RichText></dt>
                  <dd style={{ color: 'var(--c-model)' }}>{r.quarters.sigmaBeta.toFixed(2)} × {pct(sigmaLambda)} = {pct(r.bound, 2)} ({pct(r.share, 0)} of the actual alpha)</dd>
                  <dt>{r.value}: actual alpha (s.e.)</dt>
                  <dd style={{ color: 'var(--c-data)' }}>{pct(r.capm.alpha, 2)} ({pct(r.capm.alphaSE, 2)})</dd>
                  <dt><RichText>{`${r.value}: $\\sigma(\\lambda_t)$ the bound needs`}</RichText></dt>
                  <dd>{pct(r.needed)} a year</dd>
                  <dt><RichText>{`${r.value}: bound with implied true $\\sigma(\\beta_{i,q})$`}</RichText></dt>
                  <dd>{r.quarters.sigmaBetaTrue.toFixed(2)} × {pct(sigmaLambda)} = {pct(r.boundTrue, 2)}</dd>
                </Fragment>
              ))}
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ff3-monthly and mom-monthly (actual alpha), ff3-daily and mom-daily (betas and conditional alphas), Kenneth French Data Library, ${SAMPLE.first} to ${SAMPLE.last}. Actual alpha: intercept of the factor's monthly return on Mkt-RF, ×12. Bound: σ of the quarterly betas from daily returns times σ(λ_t), the largest alpha a conditional CAPM can create when beta and the premium are perfectly correlated and market volatility is constant (Lewellen and Nagel (2006)). Conditional alpha: average of the quarterly intercepts, ×21×12, with ±1.96 standard errors from the spread of the quarterly alphas.`}
    />
  );
}
