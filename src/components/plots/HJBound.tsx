import { Point, Polygon, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { hjRegion } from '../../lib/finance/sdf';
import { Button, Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { percent } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { CONSUMPTION, crraMoments, DEFAULT_SEED, marketSharpe, SAMPLE_STARTS, useFF3, type SampleStart } from './sdfSamples';

const HEIGHT = 320;
const X: [number, number] = [0.5, 1.05];
const Y: [number, number] = [0, 1];
const GAMMAS = Array.from({ length: 51 }, (_, g) => g);
const LABELS: Record<SampleStart, string> = { '1926-07-01': '1926–2026', '1963-07-01': '1963–2026', '2000-01-01': '2000–2026' };

/**
 * Chapter 8: the Hansen–Jagannathan region σ(M) ≥ E[M] |SR| for the market's Sharpe
 * ratio from ff3-monthly, with ±2 standard errors, and a seeded power-utility SDF.
 */
export default function HJBound() {
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
