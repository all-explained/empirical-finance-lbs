import { Line, Point, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { horizonSlopes, impliedHorizonSlope } from '../../lib/finance/predictive';
import { Button, Segmented } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { PlotFrame } from './PlotFrame';
import { DEFAULT_SEED, usePredictiveSample, type Source } from './predictiveSample';

type Measure = 'slope' | 'r2';
const HEIGHT = 320;
const HORIZONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const pct = (v: number, digits = 0) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;

/**
 * Chapter 9: the predictive regression of PredictiveRegression run at every
 * horizon from 1 to 10 years. Slopes come with ±2 Newey–West standard errors and
 * the AR(1)-implied curve b1 (1 − φ^k)/(1 − φ); R² is shown on its own.
 */
export default function HorizonCurve({ initialSource = 'data' }: { initialSource?: Source }) {
  const [measure, setMeasure] = useState<Measure>('slope');
  const [source, setSource] = useState<Source>(initialSource);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const { sample, failed } = usePredictiveSample(source, seed);

  const rows = useMemo(() => sample && horizonSlopes(sample.r, sample.dp, HORIZONS).map((row) => ({
    ...row, implied: impliedHorizonSlope(sample.b1, sample.phi, row.k),
  })), [sample]);

  const values = rows
    ? measure === 'slope'
      ? rows.flatMap((row) => [row.slope - 2 * row.standardError, row.slope + 2 * row.standardError, row.implied, 0])
      : [0, ...rows.map((row) => row.r2)]
    : [0, 1];
  const [lo, hi] = extent(values);
  const pad = (hi - lo) * 0.06;
  const bottom = useTweened(lo - pad);
  // Extra headroom keeps the axis title clear of the highest bar.
  const top = useTweened(hi + 3 * pad);
  const estimate = rows ? rows.map((row) => [row.k, measure === 'slope' ? row.slope : row.r2] as [number, number]) : [];
  const last = rows?.at(-1);
  const modelName = source === 'data' ? 'AR(1)-implied slope' : 'true AR(1) slope';

  const plot = rows && last ? (
    <PlotFrame
      x={[0.5, 10.5]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={HORIZONS}
      yTicks={niceTicks(bottom, top, 5)}
      formatY={(v) => (measure === 'slope' ? num(v, 1) : pct(v))}
      xLabel="horizon k (years)"
      yLabel={measure === 'slope' ? 'slope on dp' : 'R² (share of variance explained)'}
      baseline={bottom < 0 && top > 0 ? 0 : undefined}
    >
      {measure === 'slope' && rows.map((row) => (
        <Line.Segment
          key={`ci${row.k}`}
          point1={[row.k, row.slope - 2 * row.standardError]}
          point2={[row.k, row.slope + 2 * row.standardError]}
          color="var(--c-data)" weight={1.5} opacity={0.5}
        />
      ))}
      {measure === 'slope' && (
        <Polyline points={rows.map((row) => [row.k, row.implied])} color="var(--c-model)" weight={2.5} strokeStyle="dashed" fillOpacity={0} />
      )}
      <Polyline points={estimate} color="var(--c-data)" weight={2} fillOpacity={0} />
      {estimate.map(([k, v]) => <Point key={`p${k}`} x={k} y={v} color="var(--c-data)" />)}
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const name = source === 'data' ? 'goyal-welch-annual data' : `simulation with seed ${seed}`;
  return (
    <WidgetFrame
      title="Slopes and R² grow with the horizon"
      ariaLabel={
        rows && last
          ? measure === 'slope'
            ? `Estimated slope on dp at horizons 1 to 10 years for the ${name}, with bars of two Newey–West standard errors. The slope goes from ${num(rows[0].slope)} at one year to ${num(last.slope)} at ten years. A dashed ${modelName} curve goes from ${num(rows[0].implied)} to ${num(last.implied)}.`
            : `R-squared of the predictive regression at horizons 1 to 10 years for the ${name}. It goes from ${pct(rows[0].r2, 1)} at one year to ${pct(last.r2, 1)} at ten years.`
          : 'Slope and R-squared against horizon. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Show" value={measure} onChange={setMeasure} options={[
            { value: 'slope', label: 'slope' },
            { value: 'r2', label: 'R²' },
          ]} />
          <Segmented label="Data" value={source} onChange={setSource} options={[
            { value: 'data', label: 'goyal-welch-annual' },
            { value: 'sim', label: 'simulated (seeded)' },
          ]} />
          <Button onClick={() => { setSource('sim'); setSeed((s) => s + 1); }}>Re-roll simulation</Button>
        </>
      }
      readout={
        rows && last && sample ? (
          <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--c-data)' }}>● solid line: OLS estimate{measure === 'slope' ? ' ±2 standard errors' : ''}</span>
            {measure === 'slope' && <> · <span style={{ color: 'var(--c-model)' }}>– – dashed line: {modelName}</span></>}
          </p>
          <dl className="readout-grid">
            <dt><RichText>{'Persistence $\\phi$ of $\\Signal{dp}$'}</RichText></dt>
            <dd>{num(sample.phi, 3)} {source === 'data' ? '(estimated)' : '(true)'}</dd>
            <dt><RichText>{'Slope at 1 year, $b_1$'}</RichText></dt>
            <dd style={{ color: 'var(--c-data)' }}>{num(rows[0].slope, 3)} (t = {num(rows[0].tStat)})</dd>
            <dt><RichText>{'Slope at 10 years, $b_{10}$'}</RichText></dt>
            <dd style={{ color: 'var(--c-data)' }}>{num(last.slope, 3)} (t = {num(last.tStat)})</dd>
            <dt>{source === 'data' ? 'AR(1)-implied at 10 years' : 'True slope at 10 years'}</dt>
            <dd style={{ color: 'var(--c-model)' }}>{num(last.implied, 3)}</dd>
            <dt><RichText>{'$R^2$ at 1 and 10 years'}</RichText></dt>
            <dd>{pct(rows[0].r2, 1)} and {pct(last.r2, 1)}</dd>
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
          ? 'Data: goyal-welch-annual (Welch and Goyal (2008), with Amit Goyal\'s update), 1926–2025. Solid line and dots: OLS slope of the log excess return over the next $k$ years on $\\Signal{dp_t}$; bars span ±2 Newey–West standard errors with $k$ lags. Dashed line: $b_1(1-\\phi^k)/(1-\\phi)$ with the estimated one-year slope and $\\phi$.'
          : 'Simulated (seeded): 100 years in which the AR(1) story is true, calibrated to goyal-welch-annual, 1926–2025. Dashed line: the true slope $b_1(1-\\phi^k)/(1-\\phi)$. Solid line and dots: what OLS estimates from this one draw; bars span ±2 Newey–West standard errors.'
      }
    />
  );
}
