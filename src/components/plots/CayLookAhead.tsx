import { Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { Segmented } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { yearPosition } from './oosSample';
import { Label, PlotFrame } from './PlotFrame';
import { SAMPLE_ENDS, lookAhead, quarterName, useLookAheadData, type SampleEnd } from './caySample';

const HEIGHT = 320;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

/**
 * Chapter 14: cay from one full-sample dynamic OLS against cay re-estimated each quarter with
 * only the data known then, and how well each forecasts next quarter's log excess return.
 */
export default function CayLookAhead({ initialEnd = '1998-07-01' }: { initialEnd?: SampleEnd }) {
  const [end, setEnd] = useState<SampleEnd>(initialEnd);
  const { data, failed } = useLookAheadData();
  const view = useMemo(() => (data ? lookAhead(data, end) : null), [data, end]);

  const [lo, hi] = view ? extent([...view.fullCay, ...view.realCay]) : [-0.1, 0.1];
  const pad = (hi - lo) * 0.08;
  const bottom = useTweened(lo - pad);
  // Extra headroom keeps the axis title clear of the highest line.
  const top = useTweened(hi + 3 * pad);
  const x0 = 1967;
  const x1 = useTweened(view ? yearPosition(view.dates.at(-1)!) + 0.25 : 2026);
  const waiting = failed ? 'The data did not load.' : 'Estimating cay once for each quarter…';

  const plot = view ? (
    <PlotFrame
      x={[x0, x1]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={niceTicks(x0, x1, 6)}
      yTicks={niceTicks(bottom, top, 5)}
      formatY={(v) => num(v, 2)}
      xLabel="quarter"
      yLabel={<tspan style={{ fill: 'var(--c-signal)' }}>cay</tspan>}
      baseline={0}
      marginLeft={52}
    >
      <Polyline points={view.dates.map((d, i) => [yearPosition(d), view.fullCay[i]])} color="var(--c-signal)" weight={1.5} strokeStyle="dashed" fillOpacity={0} />
      <Polyline points={view.dates.map((d, i) => [yearPosition(d), view.realCay[i]])} color="var(--c-signal)" weight={2.5} fillOpacity={0} />
      <Label x={x0 + 1} y={top} attach="se" attachDistance={22} size={12} color="var(--c-signal)">
        dashed: full-sample · solid: real-time
      </Label>
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{waiting}</p>
  );

  const span = view ? `${quarterName(view.dates[0])} to ${quarterName(view.dates.at(-1)!)}` : '';
  return (
    <WidgetFrame
      title="How much of cay's forecast is look-ahead?"
      ariaLabel={
        view
          ? `Two lines of cay by quarter, ${span}. The dashed line uses weights estimated once on the data from ${quarterName(view.start)} to ${quarterName(end)}; the solid line re-estimates the weights each quarter with only the data known then. Next quarter's log excess return on the full-sample cay: slope ${num(view.fullFit.slope)}, t-statistic ${num(view.fullFit.tStat)}, R-squared ${pct(view.fullFit.r2)}. On the real-time cay: slope ${num(view.realFit.slope)}, t-statistic ${num(view.realFit.tStat)}, R-squared ${pct(view.realFit.r2)}.`
          : 'Two lines of cay by quarter, full-sample and real-time. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <Segmented label="Data used for the full-sample weights" value={end} onChange={setEnd}
          options={SAMPLE_ENDS.map((d) => ({ value: d, label: `to ${quarterName(d)}` }))} />
      }
      readout={
        view ? (
          <dl className="readout-grid">
            <dt><RichText>{'Full-sample $\\hat\\theta_n$, $\\hat\\theta_y$'}</RichText></dt>
            <dd>{num(view.omega)}, {num(view.betaY)}</dd>
            <dt>Full-sample: slope, t</dt>
            <dd style={{ color: 'var(--c-signal)' }}>{num(view.fullFit.slope)}, {num(view.fullFit.tStat)}</dd>
            <dt><RichText>{'Full-sample: $R^2$'}</RichText></dt>
            <dd style={{ color: 'var(--c-signal)' }}>{pct(view.fullFit.r2)}</dd>
            <dt>Real-time: slope, t</dt>
            <dd style={{ color: 'var(--c-signal)' }}>{num(view.realFit.slope)}, {num(view.realFit.tStat)}</dd>
            <dt><RichText>{'Real-time: $R^2$'}</RichText></dt>
            <dd style={{ color: 'var(--c-signal)' }}>{pct(view.realFit.r2)}</dd>
            <dt>Forecasts</dt>
            <dd>{view.realFit.nobs}</dd>
          </dl>
        ) : (
          <p>{waiting}</p>
        )
      }
      caption="Data: fred-cay-quarterly (BEA and the Board's Financial Accounts, via FRED) for log real consumption $c_t$, asset wealth $n_t$ and labour income $y_t$ per person, from 1952-Q1; goyal-welch-monthly for returns. Dashed: weights from one dynamic OLS (8 leads and lags) on the data up to the chosen quarter. Solid: weights re-estimated each quarter with the data up to that quarter, from a first window of 62 quarters. Regression: log excess return of the CRSP S&P 500 in quarter $t+1$ on $\Signal{cay_t}$, Newey–West standard errors with 1 lag."
    />
  );
}
