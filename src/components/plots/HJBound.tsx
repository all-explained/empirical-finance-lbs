import { Point, Polygon, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { impliedRiskFree } from '../../lib/finance/consumptionPuzzle';
import { hjBoundSharpe, hjRegion } from '../../lib/finance/sdf';
import { Button, Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { percent } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { DEFAULT_DELTA, HJ_GAMMAS, POSTWAR_START, powerUtilityPath, PUZZLE_SAMPLES, usePuzzleViews, type PuzzleSampleName } from './puzzleSample';
import { CONSUMPTION, crraMoments, DEFAULT_SEED, marketSharpe, SAMPLE_STARTS, useFF3, type SampleStart } from './sdfSamples';

const HEIGHT = 320;
const X: [number, number] = [0.5, 1.05];
const Y: [number, number] = [0, 1];
const GAMMAS = Array.from({ length: 51 }, (_, g) => g);
const LABELS: Record<SampleStart, string> = { '1926-07-01': '1926–2026', '1963-07-01': '1963–2026', '2000-01-01': '2000–2026' };

/**
 * The Hansen–Jagannathan region σ(M) ≥ E[M] |SR| for the market's Sharpe ratio from ff3-monthly.
 * Default (Chapter 8): ±2 standard errors and a seeded power-utility SDF. `preset="power-utility"`
 * (Chapter 35): the power-utility curve of the measured consumption moments as γ rises.
 */
export default function HJBound({ preset }: { preset?: 'power-utility' }) {
  return preset === 'power-utility' ? <PowerUtilityView /> : <SimulatedView />;
}

function SimulatedView() {
  const { series, failed } = useFF3();
  const [start, setStart] = useState<SampleStart>(SAMPLE_STARTS[0]);
  const [gamma, setGamma] = useState(5);
  const [seed, setSeed] = useState(DEFAULT_SEED);

  const market = useMemo(() => series && marketSharpe(series, start), [series, start]);
  const path = useMemo(() => GAMMAS.map((g) => crraMoments(g, seed)), [seed]);
  const model = path[gamma];
  const sharpe = useTweened(market?.sharpe ?? 0);
  const se = useTweened(market?.standardError ?? 0);

  const bound = (sr: number) => hjRegion(X, sr).map((s, i) => [X[i], s] as [number, number]);
  const line = bound(sharpe);
  const inside = market ? model.maxSharpe >= market.sharpe : false;
  const gammaIn = market ? path.find((m) => m.maxSharpe >= market.sharpe) : undefined;

  const plot = market ? (
    <PlotFrame
      x={X}
      y={Y}
      height={HEIGHT}
      xTicks={[0.5, 0.6, 0.7, 0.8, 0.9, 1]}
      yTicks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
      formatX={(v) => v.toFixed(1)}
      formatY={(v) => v.toFixed(1)}
      xLabel="mean of the SDF, E[M]"
      yLabel="volatility of the SDF, σ(M)"
    >
      <Polygon points={[...line, [X[1], Y[1]], [X[0], Y[1]]]} color="var(--c-data)" fillOpacity={0.22} weight={0} />
      {[-2, 2].map((k) => (
        <Polyline key={k} points={bound(sharpe + k * se)} color="var(--c-data)" weight={1.5} strokeStyle="dashed" fillOpacity={0} />
      ))}
      <Polyline points={line} color="var(--c-data)" weight={2.5} fillOpacity={0} />
      <Label x={1.03} y={0.94} attach="w" size={12} color="var(--c-data)">admissible SDFs</Label>
      <Polyline points={path.map((m) => [m.mean, m.std] as [number, number])} color="var(--c-sdf)" weight={1.5} strokeStyle="dashed" fillOpacity={0} />
      <Point x={model.mean} y={model.std} color="var(--c-sdf)" />
      <Label x={model.mean} y={model.std} attach="ne" attachDistance={10} size={12} color="var(--c-sdf)">{`γ = ${gamma}`}</Label>
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  return (
    <WidgetFrame
      title="The Hansen–Jagannathan bound"
      ariaLabel={
        market
          ? `Mean of the SDF across, volatility up. The shaded region above a line of slope ${market.sharpe.toFixed(2)}, the market's annual Sharpe ratio for ${LABELS[start]}, holds every SDF that can price the market. Dashed lines show the slope plus and minus two standard errors. A power-utility SDF with risk aversion ${gamma} sits at mean ${model.mean.toFixed(2)} and volatility ${model.std.toFixed(2)}, ${inside ? 'inside' : 'outside'} the region.`
          : 'The Hansen–Jagannathan region. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Risk aversion $\gamma$" value={gamma} min={0} max={50} step={1} color="var(--c-sdf)" onChange={setGamma} />
          <Segmented label="Sample" value={start} onChange={setStart} options={SAMPLE_STARTS.map((s) => ({ value: s, label: LABELS[s] }))} />
          <Button onClick={() => setSeed((s) => s + 1)}>Re-roll simulation</Button>
        </>
      }
      readout={
        market ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-data)' }}>— solid line: bound from the market (– – ±2 s.e.)</span> ·{' '}
              <span style={{ color: 'var(--c-sdf)' }}>● dot: power-utility SDF (– – path as γ goes 0 to 50)</span>
            </p>
            <dl className="readout-grid">
              <dt>Market Sharpe ratio, a year</dt>
              <dd style={{ color: 'var(--c-data)' }}>{market.sharpe.toFixed(2)} (s.e. {market.standardError.toFixed(2)}, {market.months} months)</dd>
              <dt><RichText>{'This SDF\'s $\\sigma(\\SDF{M})/\\mathbb{E}[\\SDF{M}]$'}</RichText></dt>
              <dd style={{ color: 'var(--c-sdf)' }}>{model.maxSharpe.toFixed(2)}</dd>
              <dt>Can it price the market?</dt>
              <dd className={inside ? 'good' : 'bad'}>{inside ? 'yes, inside the region' : 'no, below the bound'}</dd>
              <dt><RichText>{'Implied $\\Rf{R^f} = 1/\\mathbb{E}[\\SDF{M}] - 1$'}</RichText></dt>
              <dd style={{ color: 'var(--c-rf)' }}>{percent(model.riskFree, 1)} a year</dd>
              <dt><RichText>{'Lowest $\\gamma$ inside'}</RichText></dt>
              <dd>{gammaIn ? path.indexOf(gammaIn) : 'above 50'}</dd>
              <dt>Seed</dt>
              <dd>{seed}</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ff3-monthly (Kenneth French Data Library), Mkt-RF from ${market ? `${market.start.slice(0, 7)} to ${market.end.slice(0, 7)}` : 'the chosen start'}; Sharpe ratio annualised as $\\sqrt{12}$ times the monthly one. Simulated (seeded): $\\SDF{M} = \\delta G^{-\\gamma}$ with $\\delta = ${CONSUMPTION.delta}$ and ${CONSUMPTION.draws} draws of log consumption growth with mean ${CONSUMPTION.growthMean * 100}% and volatility ${CONSUMPTION.growthVol * 100}% a year, an assumption, not data.`}
    />
  );
}

const PU_Y: [number, number] = [0, 1.2];
const SAMPLE_NAMES: Record<PuzzleSampleName, string> = { annual: 'Annual', postwar: 'Postwar', quarterly: 'Quarterly' };

function PowerUtilityView() {
  const { series, failed: ff3Failed } = useFF3();
  const { views, failed: puzzleFailed } = usePuzzleViews();
  const [name, setName] = useState<PuzzleSampleName>('annual');
  const [gamma, setGamma] = useState(5);

  const market = useMemo(() => series && marketSharpe(series, SAMPLE_STARTS[0]), [series]);
  const view = views?.[name];
  const mean = useTweened(view?.moments.mean.dc ?? 0);
  // useTweened can dip just below its start value on the first frame (GitHub issue 120), so a tween from 0 needs the clamp.
  const sd = Math.max(0, useTweened(view?.moments.sd.dc ?? 0));
  const drawn = useMemo(() => powerUtilityPath(mean, sd, market?.sharpe ?? 0), [mean, sd, market]);
  const exact = useMemo(() => view && market && powerUtilityPath(view.moments.mean.dc, view.moments.sd.dc, market.sharpe), [view, market]);
  const failed = ff3Failed || puzzleFailed;

  if (!market || !view || !exact) {
    const message = failed ? 'The data did not load.' : 'Loading the data…';
    return (
      <WidgetFrame
        title="Power utility against the Hansen–Jagannathan bound"
        ariaLabel="The Hansen–Jagannathan region and the power-utility curve. The data is loading."
        plotHeight={HEIGHT}
        plot={<p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{message}</p>}
        readout={<p>{message}</p>}
      />
    );
  }

  // The dot follows the tweened curve; the readout uses the sample's own moments.
  const point = drawn.path[HJ_GAMMAS.indexOf(gamma)];
  const model = exact.path[HJ_GAMMAS.indexOf(gamma)];
  const ratio = hjBoundSharpe(model.mean, model.sd);
  const inside = ratio >= market.sharpe;
  const [mu, sigma] = [view.moments.mean.dc, view.moments.sd.dc];
  const lowestRiskFree = exact.lowest && impliedRiskFree(DEFAULT_DELTA, exact.lowest.gamma, mu, sigma);
  const period = `${view.first}–${view.last}`;
  const line = hjRegion(X, market.sharpe).map((s, i) => [X[i], s] as [number, number]);

  return (
    <WidgetFrame
      title="Power utility against the Hansen–Jagannathan bound"
      ariaLabel={`Mean of the SDF across, volatility up. The shaded region above a line of slope ${market.sharpe.toFixed(2)}, the market's annual Sharpe ratio from ff3-monthly, holds every SDF that can price the market. A curve shows the power-utility SDF of ${SAMPLE_NAMES[name].toLowerCase()} consumption growth, ${period}, as risk aversion rises from 0 to 50: it starts at mean ${DEFAULT_DELTA} and volatility 0 and climbs to the left. ${exact.lowest ? `It enters the region at risk aversion ${exact.lowest.gamma.toFixed(1)}.` : 'It does not enter the region.'} The dot at risk aversion ${gamma} is ${inside ? 'inside' : 'outside'} the region.`}
      plotHeight={HEIGHT}
      plot={
        <PlotFrame
          x={X}
          y={PU_Y}
          height={HEIGHT}
          xTicks={[0.5, 0.6, 0.7, 0.8, 0.9, 1]}
          yTicks={[0, 0.2, 0.4, 0.6, 0.8, 1, 1.2]}
          formatX={(v) => v.toFixed(1)}
          formatY={(v) => v.toFixed(1)}
          xLabel="mean of the SDF, E[M]"
          yLabel="volatility of the SDF, σ(M)"
        >
          <Polygon points={[...line, [X[1], PU_Y[1]], [X[0], PU_Y[1]]]} color="var(--c-data)" fillOpacity={0.22} weight={0} />
          <Polyline points={line} color="var(--c-data)" weight={2.5} fillOpacity={0} />
          <Label x={1.03} y={0.98} attach="w" size={12} color="var(--c-data)">admissible SDFs</Label>
          <Polyline points={drawn.path.map((m) => [m.mean, m.sd] as [number, number])} color="var(--c-sdf)" weight={2} strokeStyle="dashed" fillOpacity={0} />
          <Point x={point.mean} y={point.sd} color="var(--c-sdf)" />
          <Label x={point.mean} y={point.sd} attach="ne" attachDistance={10} size={12} color="var(--c-sdf)">{`γ = ${gamma}`}</Label>
        </PlotFrame>
      }
      controls={
        <>
          <Slider label="Risk aversion $\gamma$" value={gamma} min={0} max={50} step={1} color="var(--c-sdf)" onChange={setGamma} />
          <Segmented label="Consumption sample" value={name} onChange={setName} options={PUZZLE_SAMPLES.map((s) => ({ value: s, label: SAMPLE_NAMES[s] }))} />
        </>
      }
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--c-data)' }}>— solid line: bound from the market</span> ·{' '}
            <span style={{ color: 'var(--c-sdf)' }}>● dot: power-utility SDF (– – path as γ goes 0 to 50)</span>
          </p>
          <dl className="readout-grid">
            <dt>Market Sharpe ratio, a year</dt>
            <dd style={{ color: 'var(--c-data)' }}>{market.sharpe.toFixed(2)} (s.e. {market.standardError.toFixed(2)})</dd>
            <dt><RichText>{'Consumption growth $\\mu_c$, $\\sigma_c$, a year'}</RichText></dt>
            <dd>{percent(mu, 2)}, {percent(sigma, 2)} ({period})</dd>
            <dt><RichText>{'This SDF\'s $\\sigma(\\SDF{M})/\\mathbb{E}[\\SDF{M}]$'}</RichText></dt>
            <dd style={{ color: 'var(--c-sdf)' }}>{ratio.toFixed(2)}</dd>
            <dt>Can it price the market?</dt>
            <dd className={inside ? 'good' : 'bad'}>{inside ? 'yes, inside the region' : 'no, below the bound'}</dd>
            <dt><RichText>{'Lowest $\\gamma$ that reaches the bound'}</RichText></dt>
            <dd>{exact.lowest ? exact.lowest.gamma.toFixed(1) : 'above 50'}</dd>
            <dt><RichText>{'Its $\\Rf{r^f}$, a year'}</RichText></dt>
            <dd style={{ color: 'var(--c-rf)' }}>{lowestRiskFree !== undefined ? percent(lowestRiskFree, 1) : '—'} (data {percent(view.moments.mean.rf, 2)})</dd>
          </dl>
        </>
      }
      caption={`Data: ff3-monthly (Kenneth French Data Library), Mkt-RF from ${market.start.slice(0, 7)} to ${market.end.slice(0, 7)}, Sharpe ratio annualised as $\\sqrt{12}$ times the monthly one. Consumption: real nondurables and services per person, fred-consumption-annual for the annual samples (1930 on, postwar ${POSTWAR_START} on) and fred-cay-quarterly for the quarterly one, with $\\Rf{r^f}$ from goyal-welch-annual and goyal-welch-monthly. $\\SDF{M} = \\delta e^{-\\gamma \\Delta c}$ with $\\delta = ${DEFAULT_DELTA}$ a year and lognormal $\\Delta c$; moments annualised. Rates are log real rates.`}
    />
  );
}
