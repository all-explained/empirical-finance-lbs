import { Line, Point, Polygon } from 'mafs';
import { useMemo, useState } from 'react';
import { arithmeticMean, sampleVariance } from '../../lib/finance/returns';
import { annualiseMean, annualiseVolatility, histogram, meanStandardError } from '../../lib/stats/moments';
import { Button, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import {
  DEFAULT_SEED, MAX_T, SAMPLES, TRUE_MEAN, TRUE_VOL, sampleMoments, simulateSamples, useMarketExcess,
} from './meanSampling';

const HEIGHT = 320;
const BINS = 30;
const X: [number, number] = [-0.25, 0.35]; // fixed, so the narrowing is visible

const pct = (v: number, digits = 1) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const monthYear = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/**
 * Chapter 2: SAMPLES seeded samples of T months from a world with a known mean.
 * The histogram of their sample means narrows like 1/√T; the sample volatility
 * barely moves. Beside it, the real market's mean over its last T months, ±2 s.e.
 */
export default function SamplingErrorMean({ initialT = 600 }: { initialT?: number }) {
  const [T, setT] = useState(initialT);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const { data, failed } = useMarketExcess();
  const samples = useMemo(() => simulateSamples(seed), [seed]);

  const sim = useMemo(() => {
    const { means, vols } = sampleMoments(samples, T);
    const annual = means.map((m) => annualiseMean(m));
    const { edges, counts } = histogram(annual, BINS);
    // Density: percent of samples per percentage point of mean, comparable across T.
    const bars = counts.map((c, i) => ({ left: edges[i], right: edges[i + 1], height: c / (SAMPLES * (edges[i + 1] - edges[i])) }));
    return {
      bars,
      spread: annualiseMean(Math.sqrt(sampleVariance(means))),
      avgSe: annualiseMean(arithmeticMean(samples.map((row) => meanStandardError(row.slice(0, T))))),
      negative: means.filter((m) => m < 0).length / SAMPLES,
      vol: annualiseVolatility(arithmeticMean(vols)),
      volSpread: annualiseVolatility(Math.sqrt(sampleVariance(vols))),
    };
  }, [samples, T]);

  const market = useMemo(() => {
    if (!data) return null;
    const x = data.excess.slice(-T);
    return {
      mean: annualiseMean(arithmeticMean(x)), se: annualiseMean(meanStandardError(x)),
      start: data.dates.at(-T)!, end: data.dates.at(-1)!,
    };
  }, [data, T]);

  const trueMean = annualiseMean(TRUE_MEAN);
  const trueVol = annualiseVolatility(TRUE_VOL);
  const top = useTweened(Math.max(...sim.bars.map((b) => b.height)) * 1.45);
  // Above the tallest bar (69% of the height) and below the axis title.
  const markerY = top * 0.8;
  const years = T / 12;

  const plot = (
    <PlotFrame
      x={X}
      y={[0, top]}
      height={HEIGHT}
      xTicks={niceTicks(X[0], X[1], 6)}
      yTicks={niceTicks(0, top, 4)}
      formatX={(v) => pct(v, 0)}
      formatY={(v) => `${Math.round(v)}%`}
      xLabel="sample mean, % a year"
      yLabel="% per point"
    >
      {sim.bars.map((b, i) => (
        <Polygon
          key={i}
          points={[[b.left, 0], [b.right, 0], [b.right, b.height], [b.left, b.height]]}
          color="var(--c-prob)" fillOpacity={0.25} weight={1}
        />
      ))}
      <Line.Segment point1={[trueMean, 0]} point2={[trueMean, top]} color="var(--c-model)" weight={2} style="dashed" />
      <Label x={trueMean} y={top * 0.95} attach="e" attachDistance={6} size={12} color="var(--c-model)">true mean</Label>
      {market && (
        <>
          <Line.Segment point1={[market.mean - 2 * market.se, markerY]} point2={[market.mean + 2 * market.se, markerY]} color="var(--c-data)" weight={2.5} />
          <Point x={market.mean} y={markerY} color="var(--c-data)" />
          <Label x={market.mean} y={markerY} attach="s" attachDistance={9} size={12} color="var(--c-data)">market</Label>
        </>
      )}
    </PlotFrame>
  );

  return (
    <WidgetFrame
      title="How precise is a sample mean?"
      ariaLabel={`Histogram of the means of ${SAMPLES} simulated samples of ${T} months, in percent a year. The true mean is ${pct(trueMean)}; the sample means spread with a standard deviation of ${pct(sim.spread)}, and ${pct(sim.negative)} of them are below zero.${market ? ` The real market's mean over its last ${T} months is ${pct(market.mean)} a year with a standard error of ${pct(market.se)}.` : ''}`}
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Sample length $T$" value={T} min={60} max={MAX_T} step={12} onChange={setT} format={(v) => `${v} months (${v / 12} years)`} />
          <Button onClick={() => setSeed((s) => s + 1)}>Re-roll simulation</Button>
        </>
      }
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--c-prob)' }}>▮ bars: simulated sample means</span>
            {' · '}<span style={{ color: 'var(--c-model)' }}>– – dashed: true mean</span>
            {' · '}<span style={{ color: 'var(--c-data)' }}>● market ±2 s.e.</span>
          </p>
          <dl className="readout-grid">
            <dt>Sample length</dt>
            <dd>{T} months ({Number.isInteger(years) ? years : years.toFixed(1)} years)</dd>
            <dt>True mean, volatility</dt>
            <dd>{pct(trueMean)}, {pct(trueVol)} a year</dd>
            <dt><RichText>{'Spread (SD) of the means $\\bar R$'}</RichText></dt>
            <dd>{pct(sim.spread)} a year</dd>
            <dt><RichText>{'Average standard error $\\hat\\sigma/\\sqrt{T}$'}</RichText></dt>
            <dd>{pct(sim.avgSe)} a year</dd>
            <dt>Means below zero</dt>
            <dd>{pct(sim.negative)}</dd>
            <dt><RichText>{'Volatility $\\hat\\sigma$: average, spread'}</RichText></dt>
            <dd>{pct(sim.vol)}, {pct(sim.volSpread)} a year</dd>
            <dt>Spread as a share of the truth</dt>
            <dd>mean {pct(sim.spread / trueMean, 0)} · volatility {pct(sim.volSpread / trueVol, 0)}</dd>
            <dt>{market ? `Market, ${monthYear(market.start)}–${monthYear(market.end)}` : 'Market'}</dt>
            <dd style={{ color: 'var(--c-data)' }}>
              {market ? `${pct(market.mean)} a year, s.e. ${pct(market.se)}` : failed ? 'The data did not load.' : 'Loading the data…'}
            </dd>
            <dt>Seed</dt>
            <dd>{seed}</dd>
          </dl>
        </>
      }
      caption={`Simulated (seeded): ${SAMPLES.toLocaleString('en-US')} samples of $T$ monthly excess returns, independent and normal, with mean ${pct(TRUE_MEAN)} and volatility ${pct(TRUE_VOL)} a month. Bars: the percent of the sample means per percentage point of the horizontal axis. Market: the mean excess return over the last $T$ months of ff3-monthly (Kenneth French Data Library${data ? `, ${monthYear(data.dates[0])}–${monthYear(data.dates.at(-1)!)}` : ''}), with a bar of ±2 standard errors. A year = 12 × the monthly mean; volatility × √12.`}
    />
  );
}
