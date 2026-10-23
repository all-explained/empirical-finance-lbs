import { Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { PlotFrame } from './PlotFrame';
import { logLinearRows, usePresentValueData } from './presentValueSample';

type View = 'returns' | 'error';
const HEIGHT = 320;

const pct = (v: number, digits = 0) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${Math.abs(v).toFixed(digits)}`;

/**
 * Chapter 10: the exact annual log return of the S&P composite and its Campbell–Shiller
 * approximation, year by year, with the gap between them. A slider moves the
 * linearisation point away from the sample mean of pd.
 */
export default function LogLinearCheck() {
  const [shift, setShift] = useState(0);
  const [view, setView] = useState<View>('returns');
  const { data, failed } = usePresentValueData();

  const rows = useMemo(() => {
    if (!data) return null;
    const out = logLinearRows(data, shift);
    const abs = out.error.map(Math.abs);
    const worst = abs.indexOf(Math.max(...abs));
    return { ...out, worst, meanAbs: abs.reduce((s, v) => s + v, 0) / abs.length };
  }, [data, shift]);

  const values = rows ? (view === 'returns' ? [...rows.exact, ...rows.approx] : [0, ...rows.error]) : [-0.6, 0.6];
  const [lo, hi] = extent(values);
  const pad = (hi - lo) * 0.06;
  const bottom = useTweened(lo - pad);
  // Extra headroom keeps the axis title clear of the highest point.
  const top = useTweened(hi + 3 * pad);
  const x0 = rows ? rows.years[0] : 1873;
  const x1 = rows ? rows.years.at(-1)! : 2025;

  const plot = rows ? (
    <PlotFrame
      x={[x0, x1]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={niceTicks(x0, x1, 6)}
      yTicks={niceTicks(bottom, top, 6)}
      formatY={(v) => pct(v, view === 'error' && top - bottom < 0.1 ? 1 : 0)}
      xLabel="year"
      yLabel={view === 'returns' ? 'annual log return' : 'error: exact − approximate'}
      baseline={bottom < 0 && top > 0 ? 0 : undefined}
      marginLeft={50}
    >
      {view === 'returns' ? (
        <>
          <Polyline points={rows.years.map((y, i) => [y, rows.exact[i]])} color="var(--c-return)" weight={2} fillOpacity={0} />
          <Polyline points={rows.years.map((y, i) => [y, rows.approx[i]])} color="var(--c-model)" weight={2} strokeStyle="dashed" fillOpacity={0} />
        </>
      ) : (
        <Polyline points={rows.years.map((y, i) => [y, rows.error[i]])} color="var(--c-error)" weight={2} fillOpacity={0} />
      )}
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const where = shift === 0 ? 'at the sample mean' : `${num(shift, 1)} from the sample mean`;
  return (
    <WidgetFrame
      title="How good is the log-linear return?"
      ariaLabel={
        rows
          ? view === 'returns'
            ? `Line chart of the annual log return of the S&P composite from ${x0} to ${x1}. A solid line shows the exact return and a dashed line the Campbell–Shiller approximation, expanded ${where} of the log price–dividend ratio. The largest gap is ${pct(rows.error[rows.worst], 1)}, in ${rows.years[rows.worst]}.`
            : `Line chart of the approximation error, exact minus approximate log return, from ${x0} to ${x1}, expanded ${where} of the log price–dividend ratio. The average absolute error is ${pct(rows.meanAbs, 2)} and the largest is ${pct(rows.error[rows.worst], 1)}, in ${rows.years[rows.worst]}.`
          : 'Exact and approximate annual log returns. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Show" value={view} onChange={setView} options={[
            { value: 'returns', label: 'returns' },
            { value: 'error', label: 'error' },
          ]} />
          <Slider
            label="Expansion point: shift from mean $\overline{pd}$"
            value={shift} min={-1.5} max={1.5} step={0.1} onChange={setShift}
            format={(v) => num(v, 1)}
          />
        </>
      }
      readout={
        rows ? (
          <>
          <p style={{ margin: '0 0 0.5rem' }}>
            {view === 'returns' ? (
              <>
                <span style={{ color: 'var(--c-return)' }}>solid line: exact return</span> ·{' '}
                <span style={{ color: 'var(--c-model)' }}>– – dashed line: approximation</span>
              </>
            ) : (
              <span style={{ color: 'var(--c-error)' }}>solid line: exact − approximate</span>
            )}
          </p>
          <dl className="readout-grid">
            <dt>Expansion point P/D</dt>
            <dd>{Math.exp(rows.point).toFixed(1)} {shift === 0 ? '(sample mean)' : ''}</dd>
            <dt><RichText>{'$\\rho$ and $\\kappa$'}</RichText></dt>
            <dd>{rows.rho.toFixed(3)} and {rows.kappa.toFixed(3)}</dd>
            <dt>Average absolute error</dt>
            <dd style={{ color: 'var(--c-error)' }}>{pct(rows.meanAbs, 2)}</dd>
            <dt>Largest error</dt>
            <dd style={{ color: 'var(--c-error)' }}>{pct(rows.error[rows.worst], 1)} in {rows.years[rows.worst]}</dd>
            <dt>Years</dt>
            <dd>{x0}–{x1}</dd>
          </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption="Data: goyal-welch-annual (Welch and Goyal (2008), with Amit Goyal's update), returns 1873–2025. Index is the year-end S&P composite level and D12 the dividends paid during the year. Exact: $\Ret{r_{t+1}} = \log(1 + e^{pd_{t+1}}) + \Delta d_{t+1} - pd_t$. Approximate: $\kappa + \rho\,pd_{t+1} + \Delta d_{t+1} - pd_t$, with $\rho$ and $\kappa$ set at the expansion point. Total returns, not excess returns."
    />
  );
}
