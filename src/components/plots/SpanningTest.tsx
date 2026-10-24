import { Line, Point } from 'mafs';
import { useMemo, useState } from 'react';
import type { FactorName } from '../../lib/finance/factors';
import { arithmeticMean } from '../../lib/finance/returns';
import { annualiseMean } from '../../lib/stats/moments';
import { Segmented, Select } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { FACTORS, SPANNING_SAMPLES, spanningView, useZooData, type SpanningSample } from './zooSample';

const HEIGHT = 330;
const pct = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;

/**
 * Chapter 21: the spanning regression of one factor among FF5 and Mom on the other five. The scatter puts
 * each month's factor return against the part the other factors explain, β̂'f_t; the gap between the mean
 * point and the 45° line is α̂.
 */
export default function SpanningTest({ initialFactor = 'HML' }: { initialFactor?: FactorName }) {
  const [factor, setFactor] = useState<FactorName>(initialFactor);
  const [sample, setSample] = useState<SpanningSample>('full');
  const { data, failed } = useZooData();
  const view = useMemo(() => {
    if (!data) return null;
    const { start, end } = SPANNING_SAMPLES.find((s) => s.value === sample)!;
    return spanningView(data, factor, start, end);
  }, [data, factor, sample]);

  const [lo, hi] = view ? extent([...view.actual, ...view.spanned]) : [-0.1, 0.1];
  const bottom = useTweened(lo);
  const top = useTweened(hi);
  const meanSpanned = view ? arithmeticMean(view.spanned) : 0;
  const meanActual = view ? arithmeticMean(view.actual) : 0;
  const ticks = niceTicks(bottom, top, 5);
  const adds = view ? Math.abs(view.alphaT) > 1.96 : false;

  const plot = view ? (
    <PlotFrame
      x={[bottom, top]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={ticks}
      yTicks={ticks}
      formatX={(v) => pct(v, 0)}
      formatY={(v) => pct(v, 0)}
      xLabel={<tspan style={{ fill: 'var(--c-model)' }}>β̂′f, part the other five explain, % a month</tspan>}
      yLabel={<tspan style={{ fill: 'var(--c-factor)' }}>{`${factor}, % a month`}</tspan>}
      marginLeft={44}
    >
      {view.actual.map((y, t) => (
        <Point key={t} x={view.spanned[t]} y={y} color="var(--c-factor)" svgCircleProps={{ r: 2.2, style: { fillOpacity: 0.45 } }} />
      ))}
      <Line.Segment point1={[bottom, bottom]} point2={[top, top]} color="var(--c-model)" weight={2} style="dashed" />
      <Line.Segment point1={[meanSpanned, meanSpanned]} point2={[meanSpanned, meanActual]} color="var(--c-error)" weight={3} />
      <Point x={meanSpanned} y={meanActual} color="var(--c-error)" svgCircleProps={{ r: 5 }} />
      <Label x={meanSpanned} y={Math.max(meanSpanned, meanActual)} attach="nw" attachDistance={10} size={12} color="var(--c-error)">mean, gap = α̂</Label>
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  return (
    <WidgetFrame
      title="Is this factor spanned by the others?"
      ariaLabel={
        view
          ? `Scatter of ${view.T} monthly returns of ${factor}, ${view.first} to ${view.last}, against the part explained by ${view.base.join(', ')}. A dashed 45-degree line marks full spanning. The mean point sits ${pct(annualiseMean(view.alpha))} a year off the line: alpha has a t-statistic of ${view.alphaT.toFixed(2)} and R squared is ${view.r2.toFixed(2)}, so ${factor} ${adds ? 'adds to' : 'is spanned by'} the other five at the 5% level.`
          : 'Spanning regression scatter. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Select label="Factor to test" value={factor} onChange={setFactor} options={FACTORS.map((f) => ({ value: f, label: f }))} />
          <Segmented label="Sample" value={sample} onChange={setSample} options={SPANNING_SAMPLES.map(({ value, label }) => ({ value, label, color: 'var(--c-factor)' }))} />
        </>
      }
      readout={
        view ? (
          <dl className="readout-grid">
            <dt>Sample</dt>
            <dd>{view.first} to {view.last}, <RichText>{`$T = ${view.T}$`}</RichText></dd>
            <dt>Base factors</dt>
            <dd>{view.base.join(', ')}</dd>
            <dt><RichText>{'$\\Err{\\hat\\alpha}$'}</RichText></dt>
            <dd style={{ color: 'var(--c-error)' }}>{pct(annualiseMean(view.alpha))} a year</dd>
            <dt><RichText>{'$t$-statistic of $\\hat\\alpha$'}</RichText></dt>
            <dd>{view.alphaT.toFixed(2)} (White: {view.alphaTWhite.toFixed(2)})</dd>
            <dt><RichText>{'$R^2$'}</RichText></dt>
            <dd>{view.r2.toFixed(3)}</dd>
            <dt>At 5%</dt>
            <dd>{adds ? `α ≠ 0: ${factor} adds to the other five` : `α = 0 not rejected: ${factor} is spanned`}</dd>
          </dl>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption="Data: ff5-monthly and mom-monthly (Kenneth French Data Library), monthly, from 1963-07, the first month of FF5, to 2026-08. OLS of the chosen factor on a constant and the other five factors. α̂ is the intercept, ×12; the t-statistic uses classical standard errors, with White's in brackets. The x-axis is the fitted value without the intercept, β̂′f; the dashed line is y = x."
    />
  );
}
