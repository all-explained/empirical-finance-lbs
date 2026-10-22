import { Line, Point } from 'mafs';
import { useMemo, useState } from 'react';
import { forwardSums, predictiveRegression, type PredictiveOptions } from '../../lib/finance/predictive';
import { Button, Segmented, Select, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { PlotFrame } from './PlotFrame';
import { DEFAULT_SEED, usePredictiveSample, type Source } from './predictiveSample';

type Errors = NonNullable<PredictiveOptions['errors']>;
const HEIGHT = 340;
const ERROR_NAMES: Record<Errors, string> = {
  'newey-west': 'Newey–West',
  'hansen-hodrick': 'Hansen–Hodrick',
  classical: 'classical OLS',
};

const years = (k: number) => `${k} year${k === 1 ? '' : 's'}`;
const pct = (v: number, digits = 0) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 3) => (Number.isFinite(v) ? `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}` : 'not available');

/**
 * Chapter 9: the log dividend–price ratio at the end of a year against the log
 * excess return over the next k years, with the OLS line and its residuals.
 * Real data (goyal-welch-annual) or a seeded simulation calibrated to it.
 */
export default function PredictiveRegression({ initialHorizon = 1 }: { initialHorizon?: number }) {
  const [k, setK] = useState(initialHorizon);
  const [source, setSource] = useState<Source>('data');
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [errors, setErrors] = useState<Errors>('newey-west');
  const { sample, failed } = usePredictiveSample(source, seed);

  const view = useMemo(() => {
    if (!sample) return null;
    const y = forwardSums(sample.r, k);
    const x = sample.dp.slice(0, y.length);
    const fit = predictiveRegression(sample.r, sample.dp, k, { errors });
    return { x, y, fit, first: sample.years[0], last: sample.years[y.length - 1] };
  }, [sample, k, errors]);

  const [xLo, xHi] = view ? extent(view.x) : [-4.5, -2.3];
  const [yLo, yHi] = view ? extent(view.y) : [-0.5, 0.5];
  const pad = (yHi - yLo) * 0.06;
  const bottom = useTweened(yLo - pad);
  // Extra headroom keeps the axis title clear of the highest dots.
  const top = useTweened(yHi + 3 * pad);
  const x0 = xLo - 0.05;
  const x1 = xHi + 0.05;
  const line = (x: number) => (view ? view.fit.intercept + view.fit.slope * x : 0);

  const plot = view ? (
    <PlotFrame
      x={[x0, x1]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={niceTicks(x0, x1, 5)}
      yTicks={niceTicks(bottom, top, 6)}
      formatX={(v) => num(v, 1)}
      formatY={(v) => pct(v)}
      xLabel={<tspan style={{ fill: 'var(--c-signal)' }}>dp at the end of year t</tspan>}
      yLabel={`log excess return over the next ${years(k)}`}
      baseline={bottom < 0 && top > 0 ? 0 : undefined}
      marginLeft={52}
    >
      {view.x.map((x, i) => (
        <Line.Segment key={`e${i}`} point1={[x, view.y[i]]} point2={[x, line(x)]} color="var(--c-error)" weight={1} opacity={0.45} />
      ))}
      {view.x.map((x, i) => (
        <Point key={`p${i}`} x={x} y={view.y[i]} color="var(--c-return)" opacity={0.85} svgCircleProps={{ r: 3.5 }} />
      ))}
      <Line.Segment point1={[x0, line(x0)]} point2={[x1, line(x1)]} color="var(--c-model)" weight={2.5} />
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const name = source === 'data' ? 'the goyal-welch-annual data' : `the simulation with seed ${seed}`;
  return (
    <WidgetFrame
      title="Does today's dividend–price ratio forecast returns?"
      ariaLabel={
        view
          ? `Scatter of ${view.x.length} points from ${name}: the log dividend–price ratio at the end of each year from ${view.first} to ${view.last}, against the log excess return over the next ${years(k)}. The fitted line has slope ${num(view.fit.slope)}, ${ERROR_NAMES[errors]} t-statistic ${num(view.fit.tStat, 2)} and R-squared ${pct(view.fit.r2, 1)}. Thin vertical lines show the residuals.`
          : 'Scatter of the dividend–price ratio against future returns. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Horizon $k$" value={k} min={1} max={10} onChange={setK} format={years} />
          <Segmented label="Data" value={source} onChange={setSource} options={[
            { value: 'data', label: 'goyal-welch-annual' },
            { value: 'sim', label: 'simulated (seeded)' },
          ]} />
          <Button onClick={() => { setSource('sim'); setSeed((s) => s + 1); }}>Re-roll simulation</Button>
          <Select label="Standard errors" value={errors} onChange={setErrors} options={[
            { value: 'newey-west', label: 'Newey–West' },
            { value: 'hansen-hodrick', label: 'Hansen–Hodrick' },
            { value: 'classical', label: 'classical OLS (ignores overlap)' },
          ]} />
        </>
      }
      readout={
        view ? (
          <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--c-return)' }}>● dots: returns</span> ·{' '}
            <span style={{ color: 'var(--c-model)' }}>thick line: fitted line</span> ·{' '}
            <span style={{ color: 'var(--c-error)' }}>thin lines: residuals</span>
          </p>
          <dl className="readout-grid">
            <dt><RichText>{'Slope $b_k$'}</RichText></dt>
            <dd style={{ color: 'var(--c-model)' }}>{num(view.fit.slope)}</dd>
            <dt>Standard error ({ERROR_NAMES[errors]})</dt>
            <dd>{num(view.fit.standardError)}</dd>
            <dt><RichText>{'$t$-statistic'}</RichText></dt>
            <dd>{num(view.fit.tStat, 2)}</dd>
            <dt><RichText>{'$R^2$'}</RichText></dt>
            <dd>{pct(view.fit.r2, 1)}</dd>
            <dt>Observations</dt>
            <dd>{view.fit.nobs}</dd>
            <dt>dp years</dt>
            <dd>{view.first}–{view.last}</dd>
            {source === 'sim' && (
              <>
                <dt>Seed</dt>
                <dd>{seed}</dd>
              </>
            )}
          </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={
        source === 'data'
          ? 'Data: goyal-welch-annual (Welch and Goyal (2008), with Amit Goyal\'s update), 1926–2025. $\\Signal{dp_t}$ = log(D12) − log(Index) at the end of year $t$. Return = log(1 + CRSP_SPvw) − log(1 + Rfree), summed over years $t+1$ to $t+k$. Overlapping $k$-year windows; standard errors use $k$ lags.'
          : 'Simulated (seeded): 100 years of an AR(1) $\\Signal{dp_t}$ with the persistence, one-year slope and shock sizes estimated on goyal-welch-annual, 1926–2025, centred on the data\'s mean $\\Signal{dp}$. Return and $\\Signal{dp}$ shocks are independent. Re-roll for a new seed.'
      }
    />
  );
}
