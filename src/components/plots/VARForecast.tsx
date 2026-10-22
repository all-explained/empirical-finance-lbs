import { Line, Point, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { Segmented, Select, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { extent, niceTicks } from './format';
import { PlotFrame } from './PlotFrame';
import { monthName, useValuation, valuationForecast, valuationModels, type Model } from './persistenceSample';

const PANEL_HEIGHT = 190;
const WINDOW = 240;
export const ORIGINS = ['2023-06-01', '1999-12-01', '1979-12-01', '1932-06-01'] as const;
type Origin = (typeof ORIGINS)[number];

const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 3) => v.toFixed(digits);

/**
 * Chapter 5: the log dividend–price and log earnings–price ratios from shiller-monthly,
 * stacked, with their joint VAR(1) forecast E_t[z_{t+k}] = mean + A^k (z_t − mean) from a
 * chosen month, the path that really followed, and the forecast of two separate AR(1)s.
 */
export default function VARForecast() {
  const { data, failed } = useValuation();
  const [origin, setOrigin] = useState<Origin>(ORIGINS[0]);
  const [model, setModel] = useState<Model>('var');
  const [k, setK] = useState(120);
  const models = useMemo(() => data && valuationModels(data), [data]);

  const view = useMemo(() => {
    if (!data || !models) return null;
    const t = data.dates.indexOf(origin);
    const start = Math.max(0, t - WINDOW);
    const end = Math.min(data.dates.length - 1, t + WINDOW);
    const step = 1 / 12;
    const forecast = Array.from({ length: k + 1 }, (_, j) => valuationForecast(models, data, t, j, model));
    const mean = model === 'var' ? models.var.mean : [models.dp.mean[0], models.ep.mean[0]];
    return { t, start, end, forecast, mean, x0: data.years[t] - WINDOW * step, x1: data.years[t] + WINDOW * step, step };
  }, [data, models, origin, k, model]);

  const panel = (i: 0 | 1, name: string) => {
    if (!data || !view) return null;
    const series = i === 0 ? data.dp : data.ep;
    const history = series.slice(view.start, view.t + 1).map((v, j) => [data.years[view.start + j], Math.exp(v)] as [number, number]);
    const after = series.slice(view.t, view.end + 1).map((v, j) => [data.years[view.t + j], Math.exp(v)] as [number, number]);
    const forecast = view.forecast.map((z, j) => [data.years[view.t] + j * view.step, Math.exp(z[i])] as [number, number]);
    const level = Math.exp(view.mean[i]);
    const [lo, hi] = extent([...history, ...after, ...forecast].map(([, v]) => v).concat(level));
    const pad = (hi - lo) * 0.1;
    const yLo = Math.max(0, lo - pad);
    const yHi = hi + 2 * pad;
    const xTicks = niceTicks(view.x0, view.x1, 4).filter((x) => x >= view.x0 && x <= view.x1);
    return (
      <PlotFrame
        x={[view.x0, view.x1]}
        y={[yLo, yHi]}
        height={PANEL_HEIGHT}
        xTicks={xTicks}
        yTicks={niceTicks(yLo, yHi, 5)}
        formatY={(v) => pct(v, 0)}
        xLabel="year"
        yLabel={name}
      >
        <Line.Segment point1={[view.x0, level]} point2={[view.x1, level]} color="var(--c-model)" weight={1} opacity={0.5} />
        <Line.Segment point1={[data.years[view.t], yLo]} point2={[data.years[view.t], yHi]} color="var(--text-muted)" weight={1} opacity={0.4} />
        <Polyline points={after} color="var(--c-data)" weight={1.5} fillOpacity={0} strokeOpacity={0.35} />
        <Polyline points={history} color="var(--c-data)" weight={2} fillOpacity={0} />
        <Polyline points={forecast} color="var(--c-model)" weight={2.5} strokeStyle="dashed" fillOpacity={0} />
        <Point x={forecast.at(-1)![0]} y={forecast.at(-1)![1]} color="var(--c-model)" />
      </PlotFrame>
    );
  };

  const end = view?.forecast.at(-1);
  const plot = data && view ? (
    <>
      {panel(0, 'dividend–price ratio D/P')}
      {panel(1, 'earnings–price ratio E/P')}
    </>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );
  const modelName = model === 'var' ? 'joint VAR(1)' : 'two separate AR(1)s';

  return (
    <WidgetFrame
      title="Forecasting two ratios together"
      ariaLabel={
        data && view && end
          ? `Two stacked panels: the dividend–price ratio and the earnings–price ratio from shiller-monthly, 20 years either side of ${monthName(origin)}. A dashed ${modelName} forecast starts at ${pct(Math.exp(data.dp[view.t]))} and ${pct(Math.exp(data.ep[view.t]))} and reaches ${pct(Math.exp(end[0]))} and ${pct(Math.exp(end[1]))} after ${k} months. A faint line shows what really happened.`
          : 'Two stacked panels of valuation ratios and their forecast. The data is loading.'
      }
      plotHeight={2 * PANEL_HEIGHT}
      plot={plot}
      controls={
        <>
          <Select label="Forecast from" value={origin} onChange={setOrigin} options={ORIGINS.map((d) => ({ value: d, label: monthName(d) }))} />
          <Segmented label="Model" value={model} onChange={setModel} options={[
            { value: 'var', label: 'VAR(1)' },
            { value: 'ar', label: 'two AR(1)s' },
          ]} />
          <Slider label="Horizon $k$ (months)" value={k} min={1} max={WINDOW} step={1} onChange={setK} />
        </>
      }
      readout={
        data && view && end && models ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-data)' }}>— solid line: data</span> ·{' '}
              <span style={{ color: 'var(--c-model)' }}>– – dashed line: {modelName} forecast</span>
            </p>
            <dl className="readout-grid">
              <dt>D/P now and in {k} months</dt>
              <dd>{pct(Math.exp(data.dp[view.t]), 2)} → <span style={{ color: 'var(--c-model)' }}>{pct(Math.exp(end[0]), 2)}</span></dd>
              <dt>E/P now and in {k} months</dt>
              <dd>{pct(Math.exp(data.ep[view.t]), 2)} → <span style={{ color: 'var(--c-model)' }}>{pct(Math.exp(end[1]), 2)}</span></dd>
              <dt>Long-run level (D/P, E/P)</dt>
              <dd>{pct(Math.exp(view.mean[0]), 2)}, {pct(Math.exp(view.mean[1]), 2)}</dd>
              {model === 'var' ? (
                <>
                  <dt><RichText>{'VAR matrix $\\hat A$'}</RichText></dt>
                  <dd><RichText>{`$\\begin{pmatrix} ${num(models.var.A[0][0])} & ${num(models.var.A[0][1])} \\\\ ${num(models.var.A[1][0])} & ${num(models.var.A[1][1])} \\end{pmatrix}$`}</RichText></dd>
                </>
              ) : (
                <>
                  <dt><RichText>{'AR(1) $\\hat\\phi$ (D/P, E/P)'}</RichText></dt>
                  <dd>{num(models.dp.A[0][0], 4)}, {num(models.ep.A[0][0], 4)}</dd>
                </>
              )}
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={
        data
          ? `Data: shiller-monthly (Shiller (2015), updated online data), ${data.dates[0].slice(0, 7)} to ${data.dates.at(-1)!.slice(0, 7)}. Monthly log ratios $\\Signal{dp_t}$ and $\\Signal{ep_t}$, plotted as percentages. The VAR(1) and the AR(1)s are fitted by OLS on the full sample, so a forecast from an early month uses later data (in-sample). Thin flat line: the long-run level the forecast returns to. Faint line after the vertical mark: what really happened.`
          : 'Data: shiller-monthly.'
      }
    />
  );
}
