import { Line, Point } from 'mafs';
import { useMemo, useState } from 'react';
import type { ConditionalModel } from '../../lib/finance/conditional';
import { Segmented } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { MODELS, scaledView, useConditionalData, WINDOWS, type Window } from './conditionalSample';
import { extent, niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 340;
const pct = (v: number, digits = 1) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const FACTORS: Record<ConditionalModel, string> = {
  capm: 'Mkt-RF',
  ff3: 'Mkt-RF, SMB and HML',
  ccapm: 'Δc',
  'scaled-ccapm': 'Δc, cay and cay·Δc',
};

/**
 * Chapter 22: actual against fitted mean excess returns of the 25 size–B/M portfolios in quarterly data,
 * from the two-pass fits of conditionalModelFits (with a constant, as Lettau–Ludvigson do), for the CAPM,
 * FF3, the consumption CAPM and the CCAPM scaled by lagged cay.
 */
export default function ScaledFactors({ initialModel = 'scaled-ccapm', initialWindow = 'll' }: {
  initialModel?: ConditionalModel; initialWindow?: Window;
}) {
  const [model, setModel] = useState<ConditionalModel>(initialModel);
  const [window, setWindow] = useState<Window>(initialWindow);
  const { data, failed } = useConditionalData();
  const view = useMemo(() => (data ? scaledView(data, window) : null), [data, window]);
  const fit = view?.fits[model];

  const [lo, hi] = fit ? extent([...fit.fitted, ...fit.actual]) : [0.02, 0.16];
  const low = useTweened(Math.min(lo, 0.02) - 0.01);
  // Headroom keeps the axis title clear of the highest dot.
  const high = useTweened(hi + 0.03);
  const sg = view ? view.names.indexOf('ME1-BM1') : -1;
  const sv = view ? view.names.indexOf('ME1-BM5') : -1;
  const label = MODELS.find((m) => m.value === model)!.label;

  const plot = view && fit ? (
    <PlotFrame
      x={[low, high]}
      y={[low, high]}
      height={HEIGHT}
      xTicks={niceTicks(low, high, 5)}
      yTicks={niceTicks(low, high, 6)}
      formatX={(v) => pct(v, 0)}
      formatY={(v) => pct(v, 0)}
      xLabel={<tspan style={{ fill: 'var(--c-model)' }}>{`fitted, ${label}, % a year`}</tspan>}
      yLabel={<tspan style={{ fill: 'var(--c-data)' }}>average excess return, % a year</tspan>}
      marginLeft={44}
    >
      {fit.fitted.map((f, i) => (
        <Line.Segment key={`a${i}`} point1={[f, fit.actual[i]]} point2={[f, f]} color="var(--c-error)" weight={1.5} opacity={0.6} />
      ))}
      <Line.Segment point1={[low, low]} point2={[high, high]} color="var(--c-model)" weight={2.5} />
      {fit.fitted.map((f, i) => (
        <Point key={`p${i}`} x={f} y={fit.actual[i]} color="var(--c-data)" opacity={0.9} svgCircleProps={{ r: 4 }} />
      ))}
      <Label x={fit.fitted[sg]} y={fit.actual[sg]} attach="e" attachDistance={10} size={12} color="var(--text-muted)">small growth</Label>
      <Label x={fit.fitted[sv]} y={fit.actual[sv]} attach="n" attachDistance={10} size={12} color="var(--text-muted)">small value</Label>
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  return (
    <WidgetFrame
      title="Which model fits the 25 portfolios?"
      ariaLabel={
        view && fit
          ? `Scatter of the 25 size and book-to-market portfolios in quarterly data, ${view.first} to ${view.last}: ${label} fitted mean excess return from ${pct(Math.min(...fit.fitted))} to ${pct(Math.max(...fit.fitted))} a year across, actual average excess return from ${pct(Math.min(...fit.actual))} to ${pct(Math.max(...fit.actual))} up. The solid 45-degree line is a perfect fit. Vertical lines from each dot to it are the pricing errors, ${pct(fit.meanAbsAlpha, 2)} a year on average in absolute value. The cross-sectional R squared is ${num(fit.r2)}.`
          : 'Scatter of actual against fitted average excess returns for 25 portfolios. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Model" value={model} onChange={setModel} options={MODELS} />
          <Segmented label="Sample" value={window} onChange={setWindow} options={[
            { value: 'll', label: '1963-Q3 to 1998-Q3' },
            { value: 'full', label: `1963-Q3 to ${view?.fits && window === 'full' ? view.last : 'today'}` },
          ]} />
        </>
      }
      readout={
        view && fit ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-data)' }}>● dots: data</span> ·{' '}
              <span style={{ color: 'var(--c-model)' }}>solid line: fitted = actual</span> ·{' '}
              <span style={{ color: 'var(--c-error)' }}>thin lines: pricing errors</span>
            </p>
            <dl className="readout-grid">
              <dt>Cross-sectional R²</dt>
              <dd>{num(fit.r2)}</dd>
              <dt><RichText>{'Mean $|\\Err{\\hat\\alpha_i}|$'}</RichText></dt>
              <dd style={{ color: 'var(--c-error)' }}>{pct(fit.meanAbsAlpha, 2)} a year</dd>
              <dt><RichText>{'Constant $\\hat\\lambda_0$'}</RichText></dt>
              <dd style={{ color: 'var(--c-model)' }}>{pct(fit.lambda0)} a year</dd>
              <dt>Factors</dt>
              <dd>{FACTORS[model]}</dd>
              <dt>Quarters</dt>
              <dd>{view.quarters}, {view.first} to {view.last}</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ff25-size-bm-monthly and ff3-monthly (Kenneth French Data Library), compounded to calendar quarters, and fred-cay-quarterly (BEA and Federal Reserve Z.1 via FRED), ${view ? `${view.first} to ${view.last}` : WINDOWS[window].start.slice(0, 4)}. Δc: growth of log real nondurables and services consumption per person over the return quarter. cay: one dynamic OLS on the whole fred-cay-quarterly sample, lagged one quarter and demeaned, so it uses data from after each date. First pass: OLS of each portfolio's quarterly excess return on ${FACTORS[model]}. Second pass: OLS of the 25 mean excess returns on the betas, with a constant. Means ×4 to annualise. R² is descriptive: no standard errors, not a test.`}
    />
  );
}
