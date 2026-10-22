import { Line, Polygon, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { arithmeticMean, sampleVariance } from '../../lib/finance/returns';
import { cdf, pdf } from '../../lib/math/normal';
import {
  annualiseMean, annualiseVolatility, excessKurtosis, histogram, skewness,
} from '../../lib/stats/moments';
import { Segmented } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { useMarketExcess } from './meanSampling';

type Period = 'all' | 'pre' | 'post';
type View = 'whole' | 'left' | 'right';
const HEIGHT = 320;
const BINS = 40;
const SPLIT = '1947-01-01';
/** The tail views show returns more than ZOOM standard deviations from the mean. */
const ZOOM = 2.5;

const pct = (v: number, digits = 1) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const plain = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const monthYear = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/**
 * Chapter 2: histogram of monthly market excess returns from ff3-monthly, with
 * the normal that has the same mean and volatility. The tail views zoom in on
 * the months beyond ZOOM standard deviations, where the normal is far too thin.
 */
export default function DistributionExplorer() {
  const { data, failed } = useMarketExcess();
  const [period, setPeriod] = useState<Period>('all');
  const [view, setView] = useState<View>('whole');

  const stats = useMemo(() => {
    if (!data) return null;
    const keep = data.dates.map((d) => (period === 'all' ? true : period === 'pre' ? d < SPLIT : d >= SPLIT));
    const dates = data.dates.filter((_, i) => keep[i]);
    const x = data.excess.filter((_, i) => keep[i]);
    const T = x.length;
    const mean = arithmeticMean(x);
    const sd = Math.sqrt(sampleVariance(x));
    const { edges, counts } = histogram(x, BINS);
    const width = edges[1] - edges[0];
    const worst = x.indexOf(Math.min(...x));
    const best = x.indexOf(Math.max(...x));
    return {
      dates, T, mean, sd, edges, counts, width,
      skew: skewness(x), kurt: excessKurtosis(x),
      below: x.filter((v) => v < mean - 3 * sd).length,
      above: x.filter((v) => v > mean + 3 * sd).length,
      // Months a normal with this mean and volatility expects beyond 3σ̂ on each side.
      normalTail: T * cdf(-3),
      worst: { date: dates[worst], value: x[worst], z: (x[worst] - mean) / sd },
      best: { date: dates[best], value: x[best], z: (x[best] - mean) / sd },
    };
  }, [data, period]);

  // Fitted normal in the same units as the bars: expected months per bin.
  const normalCount = (v: number) => (stats ? stats.T * stats.width * pdf((v - stats.mean) / stats.sd) / stats.sd : 0);

  const lo = stats ? stats.edges[0] : -0.3;
  const hi = stats ? stats.edges[BINS] : 0.4;
  const cutLeft = stats ? stats.mean - ZOOM * stats.sd : 0;
  const cutRight = stats ? stats.mean + ZOOM * stats.sd : 0;
  const pad = stats ? stats.width : 0.01;
  const target: [number, number] = view === 'left' ? [lo - pad, cutLeft] : view === 'right' ? [cutRight, hi + pad] : [lo - pad, hi + pad];
  const x0 = useTweened(target[0]);
  const x1 = useTweened(target[1]);
  const bars = stats ? stats.counts.map((c, i) => ({ left: stats.edges[i], right: stats.edges[i + 1], count: c })) : [];
  const shown = bars.filter((b) => b.right > x0 && b.left < x1);
  const tallest = Math.max(1, ...bars.filter((b) => b.left >= target[0] && b.right <= target[1]).map((b) => b.count), normalCount(view === 'left' ? cutLeft : view === 'right' ? cutRight : stats?.mean ?? 0));
  const top = useTweened(tallest * 1.15);
  const curve = stats
    ? Array.from({ length: 201 }, (_, i) => {
      const v = x0 + (x1 - x0) * i / 200;
      return [v, normalCount(v)] as [number, number];
    })
    : [];
  const sigmaLines = stats ? [-3, 3].map((k) => ({ k, at: stats.mean + k * stats.sd })).filter((s) => s.at > x0 && s.at < x1) : [];

  const plot = stats ? (
    <PlotFrame
      x={[x0, x1]}
      y={[0, top]}
      height={HEIGHT}
      xTicks={niceTicks(x0, x1, 6)}
      yTicks={niceTicks(0, top, 4).filter(Number.isInteger)}
      formatX={(v) => pct(v, 0)}
      xLabel="monthly excess return"
      yLabel="months per bin"
    >
      {shown.map((b) => (
        <Polygon
          key={b.left}
          points={[[Math.max(b.left, x0), 0], [Math.min(b.right, x1), 0], [Math.min(b.right, x1), Math.min(b.count, top)], [Math.max(b.left, x0), Math.min(b.count, top)]]}
          color="var(--c-data)" fillOpacity={0.35} weight={1}
        />
      ))}
      <Polyline points={curve} color="var(--c-model)" weight={2.5} strokeStyle="dashed" fillOpacity={0} />
      {sigmaLines.map((s) => (
        <g key={s.k}>
          <Line.Segment point1={[s.at, 0]} point2={[s.at, top]} color="var(--text-muted)" weight={1} style="dashed" />
          <Label x={s.at} y={top * 0.75} attach={s.k < 0 ? 'w' : 'e'} attachDistance={5} size={12} color="var(--text-muted)">{s.k < 0 ? '−3 SD' : '+3 SD'}</Label>
        </g>
      ))}
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const range = stats ? `${monthYear(stats.dates[0])}–${monthYear(stats.dates.at(-1)!)}` : '';
  return (
    <WidgetFrame
      title="Are monthly returns normal?"
      ariaLabel={
        stats
          ? `Histogram of ${stats.T} monthly market excess returns, ${range}, with a dashed normal curve of the same mean and volatility. Skewness ${plain(stats.skew)}, excess kurtosis ${plain(stats.kurt)}. ${stats.below} months fall more than three standard deviations below the mean and ${stats.above} above it; a normal expects ${stats.normalTail.toFixed(1)} on each side.${view === 'whole' ? '' : ` This view zooms in on the ${view} tail.`}`
          : 'Histogram of monthly market excess returns. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Show" value={view} onChange={setView} options={[
            { value: 'whole', label: 'whole' },
            { value: 'left', label: 'left tail' },
            { value: 'right', label: 'right tail' },
          ]} />
          <Segmented label="Sample" value={period} onChange={setPeriod} options={[
            { value: 'all', label: 'all months' },
            { value: 'pre', label: 'before 1947' },
            { value: 'post', label: '1947 on' },
          ]} />
        </>
      }
      readout={
        stats ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-data)' }}>▮ bars: months in each bin</span>
              {' · '}<span style={{ color: 'var(--c-model)' }}>– – dashed: normal with the same mean and volatility</span>
            </p>
            <dl className="readout-grid">
              <dt>Sample</dt>
              <dd>{range}, {stats.T.toLocaleString('en-US')} months</dd>
              <dt><RichText>{'Mean $\\bar R^e$'}</RichText></dt>
              <dd>{pct(annualiseMean(stats.mean))} a year ({pct(stats.mean, 2)} a month)</dd>
              <dt><RichText>{'Volatility $\\hat\\sigma$'}</RichText></dt>
              <dd>{pct(annualiseVolatility(stats.sd))} a year ({pct(stats.sd, 2)} a month)</dd>
              <dt>Skewness (normal: 0)</dt>
              <dd>{plain(stats.skew)}</dd>
              <dt>Excess kurtosis (normal: 0)</dt>
              <dd>{plain(stats.kurt)}</dd>
              <dt><RichText>{'Months below $-3\\hat\\sigma$ / above $+3\\hat\\sigma$'}</RichText></dt>
              <dd>{stats.below} / {stats.above} (a normal expects {stats.normalTail.toFixed(1)} / {stats.normalTail.toFixed(1)})</dd>
              <dt>Worst month</dt>
              <dd className="bad">{monthYear(stats.worst.date)}: {pct(stats.worst.value)} ({plain(stats.worst.z, 1)} SD)</dd>
              <dt>Best month</dt>
              <dd className="good">{monthYear(stats.best.date)}: +{pct(stats.best.value)} (+{plain(stats.best.z, 1)} SD)</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ff3-monthly (Kenneth French Data Library). Excess return = Mkt-RF, the value-weighted US stock market minus the one-month T-bill, in ${BINS} equal bins. Dashed curve: a normal distribution with the sample mean and volatility, scaled to months per bin. SD: one sample standard deviation (the monthly volatility). A year = 12 × the monthly mean; volatility × √12.`}
    />
  );
}
