import { Line, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { fitAR1 } from '../../lib/finance/predictive';
import { arithmeticMean, sampleVariance } from '../../lib/finance/returns';
import {
  ar1Autocorrelation, ar1Variance, halfLife, sampleAutocorrelation, simulateAR1,
} from '../../lib/stats/var';
import { Button, Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { useValuation } from './persistenceSample';

type Preset = 'default' | 'dp';
const PATH_HEIGHT = 220;
const ACF_HEIGHT = 200;
const MAX_LAG = 240;
// Headroom above 1 keeps the axis title clear of the curves.
const ACF_TOP = 1.2;
const LAGS = Array.from({ length: MAX_LAG + 1 }, (_, k) => k);
export const DEFAULT_AR1 = { phi: 0.98, sigma: 0.04, T: 600, seed: 1 };

const num = (v: number, digits = 3) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const months = (h: number) => (Number.isFinite(h) ? `${h.toFixed(0)} months (${(h / 12).toFixed(1)} years)` : 'never');

/**
 * Chapter 5: a seeded AR(1) path x_{t+1} = mean + φ(x_t − mean) + σ e_{t+1}, its
 * autocorrelation function against φ^k, and the half-life log(1/2)/log φ.
 * The "dp" preset copies φ̂, σ̂, the mean and the length of the shiller-monthly log
 * dividend–price ratio and draws the real series behind the simulated one.
 */
export default function AR1Simulator() {
  const { data, failed } = useValuation();
  const [preset, setPreset] = useState<Preset>('default');
  const [phi, setPhi] = useState(DEFAULT_AR1.phi);
  const [sigma, setSigma] = useState(DEFAULT_AR1.sigma);
  const [seed, setSeed] = useState(DEFAULT_AR1.seed);

  const dpFit = useMemo(() => data && {
    ...fitAR1(data.dp),
    mean: arithmeticMean(data.dp),
    acf: sampleAutocorrelation(data.dp, MAX_LAG),
  }, [data]);

  const showData = preset === 'dp' && data && dpFit;
  const T = showData ? data.dp.length : DEFAULT_AR1.T;
  const mean = showData ? dpFit.mean : 0;
  const times = useMemo(
    () => (showData ? data.years : Array.from({ length: T }, (_, t) => t / 12)),
    [showData, data, T],
  );
  const path = useMemo(() => simulateAR1({ T, phi, sigma, mean, seed }), [T, phi, sigma, mean, seed]);
  const pathFit = useMemo(() => fitAR1(path), [path]);
  const acf = useMemo(() => sampleAutocorrelation(path, MAX_LAG), [path]);
  const theory = LAGS.map((k) => ar1Autocorrelation(phi, k));
  const h = halfLife(phi);
  const sdTheory = Math.sqrt(ar1Variance(phi, sigma));
  const sdSample = Math.sqrt(sampleVariance(path));

  const onPreset = (value: Preset) => {
    setPreset(value);
    if (value === 'dp' && dpFit) {
      setPhi(Number(dpFit.phi.toFixed(3)));
      setSigma(Number(dpFit.residualStd.toFixed(3)));
    } else if (value === 'default') {
      setPhi(DEFAULT_AR1.phi);
      setSigma(DEFAULT_AR1.sigma);
    }
  };

  const [lo, hi] = extent(showData ? [...path, ...data.dp] : path);
  const pad = (hi - lo) * 0.08 || 0.1;
  const bottom = useTweened(lo - pad);
  const top = useTweened(hi + 2 * pad);
  const x0 = times[0];
  const x1 = times[T - 1];
  const step = (x1 - x0) > 80 ? 20 : 10;
  const xTicks = niceTicks(x0, x1, (x1 - x0) / step).filter((t) => t >= x0 && t <= x1);
  const acfLo = Math.min(0, ...acf, ...(showData ? dpFit.acf : []));
  const acfBottom = useTweened(Math.floor(acfLo * 5) / 5);

  const plot = (
    <>
      <PlotFrame
        x={[x0, x1]}
        y={[bottom, top]}
        height={PATH_HEIGHT}
        xTicks={xTicks}
        yTicks={niceTicks(bottom, top, 4)}
        formatY={(v) => num(v, 2)}
        xLabel={showData ? 'year' : 'years since the start'}
        yLabel={showData ? 'log D/P' : 'x'}
      >
        <Line.Segment point1={[x0, mean]} point2={[x1, mean]} color="var(--c-model)" weight={1} opacity={0.6} />
        {showData && (
          <Polyline points={data.dp.map((v, t) => [times[t], v])} color="var(--c-data)" weight={3.5} fillOpacity={0} strokeOpacity={0.55} />
        )}
        <Polyline points={path.map((v, t) => [times[t], v])} color="var(--c-signal)" weight={1.5} fillOpacity={0} />
      </PlotFrame>
      <PlotFrame
        x={[0, MAX_LAG / 12]}
        y={[acfBottom, ACF_TOP]}
        height={ACF_HEIGHT}
        xTicks={[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]}
        yTicks={niceTicks(acfBottom, 1, 4)}
        formatY={(v) => num(v, 1)}
        xLabel="lag k (years)"
        yLabel="autocorrelation"
        baseline={acfBottom < 0 ? 0 : undefined}
      >
        <Line.Segment point1={[0, 0.5]} point2={[MAX_LAG / 12, 0.5]} color="var(--text-muted)" weight={1} opacity={0.4} />
        {h <= MAX_LAG && (
          <>
            <Line.Segment point1={[h / 12, acfBottom]} point2={[h / 12, ACF_TOP]} color="var(--c-model)" weight={1} opacity={0.6} />
            <Label x={h / 12} y={acfBottom} attach={h > MAX_LAG / 2 ? 'nw' : 'ne'} attachDistance={6} size={12} color="var(--c-model)">half-life</Label>
          </>
        )}
        {showData && (
          <Polyline points={dpFit.acf.map((v, k) => [k / 12, v])} color="var(--c-data)" weight={4} fillOpacity={0} strokeOpacity={0.55} />
        )}
        <Polyline points={acf.map((v, k) => [k / 12, v])} color="var(--c-signal)" weight={2} fillOpacity={0} />
        <Polyline points={theory.map((v, k) => [k / 12, v])} color="var(--c-model)" weight={2.5} strokeStyle="dashed" fillOpacity={0} />
      </PlotFrame>
    </>
  );

  return (
    <WidgetFrame
      title="How long does a shock last?"
      ariaLabel={
        `Top: a simulated AR(1) path of ${T} months with persistence ${num(phi)} and shock size ${num(sigma)}, seed ${seed}`
        + `${showData ? ', drawn over the real log dividend–price ratio from shiller-monthly' : ''}.`
        + ` Bottom: its sample autocorrelation up to 20 years, next to the dashed curve phi to the power k.`
        + ` The half-life is ${months(h)}.`
      }
      plotHeight={PATH_HEIGHT + ACF_HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Preset" value={preset} onChange={onPreset} options={[
            { value: 'default', label: 'default example' },
            { value: 'dp', label: 'shiller-monthly dp' },
          ]} />
          <Slider label="Persistence $\phi$" value={phi} min={0} max={0.999} step={0.001} onChange={setPhi} format={(v) => v.toFixed(3)} />
          <Slider label="Shock size $\sigma_\varepsilon$" value={sigma} min={0.005} max={0.1} step={0.001} onChange={setSigma} format={(v) => v.toFixed(3)} />
          <Button onClick={() => setSeed((s) => s + 1)}>Re-roll simulation</Button>
        </>
      }
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--c-signal)' }}>— thin line: simulated</span>
            {showData && <> · <span style={{ color: 'var(--c-data)' }}>▬ thick line: real log D/P</span></>}
            {' '}· <span style={{ color: 'var(--c-model)' }}>– – theory <RichText>{'$\\phi^k$'}</RichText></span>
          </p>
          <dl className="readout-grid">
            <dt>Half-life</dt>
            <dd style={{ color: 'var(--c-model)' }}>{months(h)}</dd>
            <dt><RichText>{'Theory s.d. $\\sigma_\\varepsilon/\\sqrt{1-\\phi^2}$'}</RichText></dt>
            <dd>{num(sdTheory)}</dd>
            <dt>Sample s.d. of this path</dt>
            <dd style={{ color: 'var(--c-signal)' }}>{num(sdSample)}</dd>
            <dt><RichText>{'OLS $\\hat\\phi$ on this path'}</RichText></dt>
            <dd style={{ color: 'var(--c-signal)' }}>{num(pathFit.phi, 4)}</dd>
            {showData && (
              <>
                <dt><RichText>{'OLS $\\hat\\phi$ on real log D/P'}</RichText></dt>
                <dd style={{ color: 'var(--c-data)' }}>{num(dpFit.phi, 4)}</dd>
                <dt><RichText>{'Half-life of that $\\hat\\phi$'}</RichText></dt>
                <dd style={{ color: 'var(--c-data)' }}>{months(halfLife(dpFit.phi))}</dd>
              </>
            )}
            <dt>Seed</dt>
            <dd>{seed}</dd>
          </dl>
          {preset === 'dp' && !data && <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>}
        </>
      }
      caption={
        showData
          ? `Data: shiller-monthly (Shiller (2015), updated online data), ${data.dates[0].slice(0, 7)} to ${data.dates.at(-1)!.slice(0, 7)}, ${T} months. Thick line: the log dividend–price ratio. Thin line: a seeded AR(1) path with the same mean and length. Monthly data; $\\phi$ and $\\sigma_\\varepsilon$ are per month. The faint flat line is the mean, and the grey line marks an autocorrelation of 0.5.`
          : `Simulated (seeded): ${T} months of $x_{t+1} = \\phi x_t + \\varepsilon_{t+1}$ with normal shocks of standard deviation $\\sigma_\\varepsilon$. Monthly data; $\\phi$ and $\\sigma_\\varepsilon$ are per month. Dashed curve: the population autocorrelation $\\phi^k$. The grey line marks 0.5, where the half-life sits.`
      }
    />
  );
}
