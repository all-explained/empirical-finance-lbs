import { Line, Point } from 'mafs';
import { useMemo, useState } from 'react';
import { dogTailShares } from '../../lib/finance/news';
import { impliedReturnSlope, longRunCoefficient } from '../../lib/finance/presentValue';
import { Button, Segmented } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { usePresentValueData } from './presentValueSample';
import {
  DEFAULT_SEED, DOG_SAMPLES, PERIOD_OPTIONS, dogDraws, dogInputs, presentValueSample, type Period,
} from './newsSample';

type PhiChoice = 'data' | '0.95' | '0.98' | '0.99';
const HEIGHT = 360;
const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 3) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;

/**
 * Chapter 11: Cochrane's "dog that did not bark". Seeded (b_r, b_d) estimates
 * from samples where returns are not predictable, the identity line
 * b_r = 1 − ρφ + b_d, and the data's estimate with its tail shares.
 */
export default function DogThatDidNotBark() {
  const [period, setPeriod] = useState<Period>('1926');
  const [phiChoice, setPhiChoice] = useState<PhiChoice>('data');
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const { data, failed } = usePresentValueData();
  const sample = useMemo(() => data && presentValueSample(data, period), [data, period]);
  const inputs = useMemo(() => sample && dogInputs(sample), [sample]);
  const phi = inputs ? (phiChoice === 'data' ? inputs.estimates.phi : Number(phiChoice)) : 0.9;
  const draws = useMemo(() => sample && dogDraws(sample, phi, seed), [sample, phi, seed]);
  const tails = draws && sample && inputs ? dogTailShares(draws, inputs.estimates, sample.rho) : null;

  const [xlo, xhi] = draws && inputs ? extent([...draws.map((d) => d.br), inputs.estimates.br]) : [-0.2, 0.4];
  const [ylo, yhi] = draws && inputs ? extent([...draws.map((d) => d.bd), inputs.estimates.bd, 0]) : [-0.3, 0.1];
  const x0 = useTweened(xlo - 0.04 * (xhi - xlo));
  const x1 = useTweened(xhi + 0.04 * (xhi - xlo));
  const y0 = useTweened(ylo - 0.04 * (yhi - ylo));
  const y1 = useTweened(yhi + 0.12 * (yhi - ylo));

  const plot = draws && inputs && sample ? (
    <PlotFrame
      x={[x0, x1]}
      y={[y0, y1]}
      height={HEIGHT}
      xTicks={niceTicks(x0, x1, 5)}
      yTicks={niceTicks(y0, y1, 5)}
      formatX={(v) => num(v, 1)}
      formatY={(v) => num(v, 1)}
      xLabel={<>return slope b<tspan fontSize="0.75em" dy="0.3em">r</tspan></>}
      yLabel={<>dividend-growth slope b<tspan fontSize="0.75em" dy="0.3em">d</tspan></>}
      marginLeft={44}
    >
      {draws.map((d, i) => <Point key={i} x={d.br} y={d.bd} color="var(--c-prob)" opacity={0.45} svgCircleProps={{ r: 1.6 }} />)}
      <Line.Segment
        point1={[impliedReturnSlope(y0, sample.rho, phi), y0]}
        point2={[impliedReturnSlope(y1, sample.rho, phi), y1]}
        color="var(--c-model)" weight={2} style="dashed"
      />
      <Line.Segment point1={[inputs.estimates.br, y0]} point2={[inputs.estimates.br, y1]} color="var(--c-data)" weight={1} style="dashed" />
      <Line.Segment point1={[x0, inputs.estimates.bd]} point2={[x1, inputs.estimates.bd]} color="var(--c-data)" weight={1} style="dashed" />
      <Point x={inputs.estimates.br} y={inputs.estimates.bd} color="var(--c-data)" svgCircleProps={{ r: 6 }} />
      <Label x={inputs.estimates.br} y={inputs.estimates.bd} attach="ne" attachDistance={10} size={13} color="var(--c-data)">data</Label>
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>
      {failed ? 'The data did not load.' : 'Loading the data and simulating…'}
    </p>
  );

  const range = sample ? `${sample.years[1]}–${sample.years.at(-1)}` : '';
  const phiLabel = inputs ? `φ = ${inputs.estimates.phi.toFixed(3)} (data)` : 'φ from the data';
  return (
    <WidgetFrame
      title="The dog that did not bark"
      ariaLabel={
        tails && inputs
          ? `Scatter of ${DOG_SAMPLES} simulated pairs of return and dividend-growth slopes under the null of no return predictability, with persistence ${phi.toFixed(3)}. The data's estimate is b_r = ${num(inputs.estimates.br)} and b_d = ${num(inputs.estimates.bd)}. ${pct(tails.br)} of the draws have a larger return slope, and ${pct(tails.bd)} have a larger dividend-growth slope.`
          : 'Scatter of simulated slope pairs. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Sample" value={period} onChange={setPeriod} options={PERIOD_OPTIONS} />
          <Segmented label="Persistence φ under the null" value={phiChoice} onChange={setPhiChoice} options={[
            { value: 'data', label: phiLabel },
            { value: '0.95', label: 'φ = 0.95' },
            { value: '0.98', label: 'φ = 0.98' },
            { value: '0.99', label: 'φ = 0.99' },
          ]} />
          <Button onClick={() => setSeed((s) => s + 1)}>Re-roll simulation</Button>
        </>
      }
      readout={
        tails && inputs && sample ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span>· grey dots: {DOG_SAMPLES} null samples</span> ·{' '}
              <span style={{ color: 'var(--c-model)' }}>– – dashed line: <RichText>{'$b_r = 1 - \\rho\\phi + b_d$'}</RichText></span> ·{' '}
              <span style={{ color: 'var(--c-data)' }}>● big dot: the data</span>
            </p>
            <dl className="readout-grid">
              <dt><RichText>{'Data: $\\hat b_r$, $\\hat b_d$'}</RichText></dt>
              <dd style={{ color: 'var(--c-data)' }}>{num(inputs.estimates.br)}, {num(inputs.estimates.bd)}</dd>
              <dt><RichText>{'Null: $b_r$, $b_d = \\rho\\phi - 1$'}</RichText></dt>
              <dd>0, {num(sample.rho * phi - 1)}</dd>
              <dt><RichText>{'Draws with $b_r \\ge \\hat b_r$'}</RichText></dt>
              <dd>{pct(tails.br)}</dd>
              <dt><RichText>{'Draws with $b_d \\ge \\hat b_d$'}</RichText></dt>
              <dd>{pct(tails.bd)}</dd>
              <dt><RichText>{'Draws with $b_r/(1-\\rho\\hat\\phi) \\ge$ data'}</RichText></dt>
              <dd>{pct(tails.longRun)} (data {num(longRunCoefficient(inputs.estimates.br, sample.rho, inputs.estimates.phi), 2)})</dd>
              <dt>Seed</dt>
              <dd>{seed}</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Simulated (seeded) under the null of Cochrane (2008): $\\Signal{dp_{t+1}} = \\phi\\,\\Signal{dp_t} + \\varepsilon^{dp}$, $\\Delta d_{t+1} = (\\rho\\phi - 1)\\Signal{dp_t} + \\varepsilon^{d}$, returns from the identity. Each sample has the data's length; shocks use the residual covariance of a VAR(1) in $\\Signal{dp}$ and $\\Delta d$. Data: goyal-welch-annual, returns ${range}.`}
    />
  );
}
