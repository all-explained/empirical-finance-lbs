import { Line, Point, Polygon } from 'mafs';
import { useMemo, useState } from 'react';
import { Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { PlotFrame } from './PlotFrame';
import { usePresentValueData } from './presentValueSample';
import { PERIOD_OPTIONS, presentValueSample, sampleNews, type Period } from './newsSample';

const HEIGHT = 340;
const pct = (v: number, digits = 0) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 3) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${Math.abs(v).toFixed(digits)}`;

/** Diverging stack: positive parts grow up from zero, negative parts down. */
function stack(parts: number[]): [number, number][] {
  let up = 0;
  let down = 0;
  return parts.map((v) => {
    if (v >= 0) { up += v; return [up - v, up]; }
    down += v;
    return [down - v, down];
  });
}

/**
 * Chapter 11: each year's unexpected log return from a VAR(1) in (r, dp) on
 * goyal-welch-annual, split into cash-flow news N_CF and minus discount-rate news −N_DR.
 */
export default function NewsDecomposition() {
  const [period, setPeriod] = useState<Period>('1926');
  const [year, setYear] = useState(2008);
  const { data, failed } = usePresentValueData();
  const news = useMemo(() => data && sampleNews(presentValueSample(data, period)), [data, period]);

  const bars = news ? news.years.map((y, t) => ({
    year: y, total: news.unexpected[t], cf: news.cashFlow[t], dr: -news.discountRate[t],
    stack: stack([news.cashFlow[t], -news.discountRate[t]]),
  })) : [];
  const [lo, hi] = news ? extent(bars.flatMap((b) => [b.stack[0][1], b.stack[1][1]])) : [-0.5, 0.5];
  const pad = (hi - lo) * 0.05;
  const bottom = useTweened(lo - pad);
  const top = useTweened(hi + 3 * pad);
  const first = news?.years[0] ?? 1927;
  const last = news?.years.at(-1) ?? 2025;
  const selected = bars.find((b) => b.year === year) ?? bars.at(-1);

  const plot = news && selected ? (
    <PlotFrame
      x={[first - 1, last + 1]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={niceTicks(first, last, 5)}
      yTicks={niceTicks(bottom, top, 8)}
      formatY={(v) => pct(v)}
      xLabel="year"
      yLabel="news (log points)"
      baseline={0}
    >
      <Line.Segment point1={[selected.year, bottom]} point2={[selected.year, top]} color="var(--text-muted)" weight={1.5} style="dashed" />
      {bars.map((b) => (
        <g key={b.year}>
          <Polygon points={[[b.year - 0.4, b.stack[0][0]], [b.year + 0.4, b.stack[0][0]], [b.year + 0.4, b.stack[0][1]], [b.year - 0.4, b.stack[0][1]]]} color="var(--c-factor)" fillOpacity={0.85} weight={0} />
          <Polygon points={[[b.year - 0.4, b.stack[1][0]], [b.year + 0.4, b.stack[1][0]], [b.year + 0.4, b.stack[1][1]], [b.year - 0.4, b.stack[1][1]]]} color="var(--c-return)" fillOpacity={0.4} weight={0} />
        </g>
      ))}
      {bars.map((b) => <Point key={`u${b.year}`} x={b.year} y={b.total} color="var(--text)" svgCircleProps={{ r: b.year === selected.year ? 3.5 : 1.8 }} />)}
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const range = `${first}–${last}`;
  return (
    <WidgetFrame
      title="Why did the market move this year?"
      ariaLabel={
        news && selected
          ? `Bar chart of each year's unexpected log stock return from ${range}, split into cash-flow news and minus discount-rate news. Cash-flow news has ${pct(news.shares.cashFlow)} of the variance and discount-rate news ${pct(news.shares.discountRate)}. In ${selected.year} the unexpected return was ${pct(selected.total, 1)}: ${pct(selected.cf, 1)} cash-flow news and ${pct(selected.dr, 1)} minus discount-rate news.`
          : 'Bar chart of cash-flow and discount-rate news. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Sample" value={period} onChange={setPeriod} options={PERIOD_OPTIONS} />
          <Slider label="Year" value={selected?.year ?? year} min={first} max={last} onChange={setYear} />
        </>
      }
      readout={
        news && selected ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-factor)' }}>■ solid bars: cash-flow news</span> ·{' '}
              <span style={{ color: 'var(--c-return)' }}>▒ light bars: minus discount-rate news</span> ·{' '}
              <span>● dot: unexpected return (their sum)</span>
            </p>
            <dl className="readout-grid">
              <dt>Unexpected return in {selected.year}</dt>
              <dd>{num(selected.total)}</dd>
              <dt><RichText>{'Cash-flow news $N_{CF}$'}</RichText></dt>
              <dd style={{ color: 'var(--c-factor)' }}>{num(selected.cf)}</dd>
              <dt><RichText>{'Minus discount-rate news $-N_{DR}$'}</RichText></dt>
              <dd style={{ color: 'var(--c-return)' }}>{num(selected.dr)}</dd>
              <dt><RichText>{'Share of variance: $N_{CF}$'}</RichText></dt>
              <dd>{pct(news.shares.cashFlow, 1)}</dd>
              <dt><RichText>{'Share of variance: $N_{DR}$'}</RichText></dt>
              <dd>{pct(news.shares.discountRate, 1)}</dd>
              <dt>Share of variance: −2 × covariance</dt>
              <dd>{pct(news.shares.covariance, 1)}</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: goyal-welch-annual (Welch and Goyal (2008), with Amit Goyal's update), S&P index and dividends, total log returns ${range}. A VAR(1) in $\\Ret{r}$ and $\\Signal{dp}$ gives each year's unexpected return $\\Ret{r_{t+1}} - \\mathbb{E}_t \\Ret{r_{t+1}} = N_{CF} - N_{DR}$, with $\\rho$ at the sample's mean $pd$. Shares of the variance sum to 100%.`}
    />
  );
}
