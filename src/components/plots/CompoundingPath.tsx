import { Polyline } from 'mafs';
import { useEffect, useMemo, useState } from 'react';
import { dateRange, loadSeries, type Series } from '../../lib/data/series';
import {
  arithmeticMean,
  ff3MarketReturns,
  growthPath,
  logReturn,
  meanLogApprox,
  repeatedSum,
  sampleVariance,
} from '../../lib/finance/returns';
import { Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, money, niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';

type Scale = 'linear' | 'log';
type Mode = 'simple' | 'log';
const HEIGHT = 340;
const FIRST_YEAR = 1926;
const LAST_START = 2016; // keep at least ten years in the sample

const monthName = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const yearOf = (iso: string) => Number(iso.slice(0, 4)) + (Number(iso.slice(5, 7)) - 1) / 12;
const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
const perMonth = (v: number) => `${pct(v)} (${(repeatedSum(v, 12) * 100).toFixed(1)}% a year)`;
const dollars = (v: number) => money(v, v >= 100 ? 0 : 2);
const compactDollars = (v: number) =>
  v >= 1e6 ? `$${v / 1e6}M` : v >= 1e3 ? `$${v / 1e3}k` : v >= 1 ? `$${v}` : `$${v.toFixed(2)}`;

/**
 * Chapter 1: one dollar invested in the US stock market and in one-month
 * T-bills, from ff3-monthly (market = Mkt-RF + RF). The dashed line compounds
 * the average return of the chosen kind: the average simple return overshoots,
 * the average log return lands on the true final value.
 */
export default function CompoundingPath({ initialStart = FIRST_YEAR }: { initialStart?: number }) {
  const [series, setSeries] = useState<Series<'ff3-monthly'> | null>(null);
  const [failed, setFailed] = useState(false);
  const [scale, setScale] = useState<Scale>('log');
  const [mode, setMode] = useState<Mode>('simple');
  const [start, setStart] = useState(initialStart);

  useEffect(() => {
    loadSeries('ff3-monthly').then(setSeries, () => setFailed(true));
  }, []);

  const stats = useMemo(() => {
    if (!series) return null;
    const all = ff3MarketReturns(series);
    const from = all.dates.findIndex((d) => d >= `${start}-01-01`);
    const dates = all.dates.slice(from);
    const market = all.market.slice(from);
    const rf = all.rf.slice(from);
    const marketLog = market.map(logReturn);
    const meanSimple = arithmeticMean(market);
    const meanLog = arithmeticMean(marketLog);
    const approx = meanLogApprox(meanSimple, sampleVariance(market));
    const wealth = mode === 'simple' ? growthPath(market, 'simple') : growthPath(marketLog, 'log');
    const bills = mode === 'simple' ? growthPath(rf, 'simple') : growthPath(rf.map(logReturn), 'log');
    const average = mode === 'simple'
      ? growthPath(market.map(() => meanSimple), 'simple')
      : growthPath(market.map(() => meanLog), 'log');
    // The path starts with $1 at the start of the first month.
    const x = [yearOf(dates[0]), ...dates.map((d) => yearOf(d) + 1 / 12)];
    return { dates, meanSimple, meanLog, approx, wealth, bills, average, x };
  }, [series, start, mode]);

  const tf = (v: number) => (scale === 'log' ? Math.log10(v) : v);
  const [lo, hi] = stats ? extent([...stats.wealth, ...stats.bills, ...stats.average]) : [1, 10];
  const linearTop = useTweened(hi * 1.05);
  const logTop = useTweened(Math.ceil(Math.log10(hi) + 0.05));
  const logBottom = useTweened(Math.floor(Math.log10(Math.max(lo, 1e-3))));
  const yRange: [number, number] = scale === 'log' ? [logBottom, logTop] : [0, linearTop];
  const yTicks = scale === 'log'
    ? niceTicks(yRange[0], yRange[1], 6).filter(Number.isInteger)
    : niceTicks(0, yRange[1], 4);
  const xEnd = stats ? stats.x[stats.x.length - 1] : 2027;
  const xStart = stats ? stats.x[0] : start;
  const points = (ys: number[]) => (stats ? stats.x.map((xi, i) => [xi, tf(ys[i])] as [number, number]) : []);

  const range = stats ? { start: stats.dates[0], end: stats.dates[stats.dates.length - 1] } : null;
  const full = series ? dateRange(series) : null;
  const final = stats ? stats.wealth[stats.wealth.length - 1] : 0;
  const billsFinal = stats ? stats.bills[stats.bills.length - 1] : 0;
  const averageFinal = stats ? stats.average[stats.average.length - 1] : 0;

  const plot = stats ? (
    <PlotFrame
      x={[xStart, xEnd]}
      y={yRange}
      height={HEIGHT}
      xTicks={niceTicks(xStart, xEnd, 5)}
      yTicks={yTicks}
      formatX={(t) => String(Math.round(t))}
      xLabel="calendar year"
      formatY={(v) => compactDollars(scale === 'log' ? 10 ** v : v)}
      yLabel={scale === 'log' ? 'value of $1 (log scale)' : 'value of $1'}
      marginLeft={54}
    >
      <Polyline points={points(stats.average)} color="var(--c-return)" weight={2} strokeStyle="dashed" fillOpacity={0} strokeOpacity={0.7} />
      <Polyline points={points(stats.bills)} color="var(--c-rf)" weight={2.5} fillOpacity={0} />
      <Polyline points={points(stats.wealth)} color="var(--c-return)" weight={2.5} fillOpacity={0} />
      <Label x={xEnd} y={tf(final)} attach="nw" attachDistance={6} size={12} color="var(--c-return)">market</Label>
      <Label x={xEnd} y={tf(billsFinal)} attach="nw" attachDistance={6} size={12} color="var(--c-rf)">T-bills</Label>
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const averageName = mode === 'simple' ? 'the average simple return' : 'the average log return';
  return (
    <WidgetFrame
      title="One dollar in stocks and in T-bills"
      ariaLabel={
        stats && range
          ? `From ${monthName(range.start)} to ${monthName(range.end)}, one dollar in the US stock market grows to ${dollars(final)} and one dollar in T-bills grows to ${dollars(billsFinal)}. A dashed line compounds ${averageName} every month and ends at ${dollars(averageFinal)}.`
          : 'Growth of one dollar in the US stock market and in T-bills. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Vertical scale" value={scale} onChange={setScale} options={[
            { value: 'linear', label: 'linear scale' },
            { value: 'log', label: 'log scale' },
          ]} />
          <Segmented label="Kind of return" value={mode} onChange={setMode} options={[
            { value: 'simple', label: 'simple returns' },
            { value: 'log', label: 'log returns' },
          ]} />
          <Slider label="Start year" value={start} min={FIRST_YEAR} max={LAST_START} onChange={setStart} />
        </>
      }
      readout={
        stats ? (
          <dl className="readout-grid">
            <dt>$1 in the market grows to</dt>
            <dd style={{ color: 'var(--c-return)' }}>{dollars(final)}</dd>
            <dt>$1 in T-bills grows to</dt>
            <dd style={{ color: 'var(--c-rf)' }}>{dollars(billsFinal)}</dd>
            <dt><RichText>{'Monthly average simple return $\\Ret{\\bar R}$'}</RichText></dt>
            <dd>{perMonth(stats.meanSimple)}</dd>
            <dt><RichText>{'Monthly average log return $\\Ret{\\bar r}$'}</RichText></dt>
            <dd>{perMonth(stats.meanLog)}</dd>
            <dt><RichText>{'Monthly approximation $\\Ret{\\bar R} - \\hat\\sigma^2/2$'}</RichText></dt>
            <dd>{perMonth(stats.approx)}</dd>
            <dt>Dashed line: {averageName}, compounded</dt>
            <dd>{dollars(averageFinal)}</dd>
          </dl>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={
        range && full
          ? `Data: ff3-monthly (Kenneth French Data Library), ${monthName(full.start)} to ${monthName(full.end)}. Market return = Mkt-RF + RF, the value-weighted US stock market including dividends; T-bills = RF, the one-month Treasury bill. This view: ${monthName(range.start)} to ${monthName(range.end)}, ${stats!.dates.length} months. Returns are nominal and before costs and taxes. "A year" = 12 × the monthly figure.`
          : 'Data: ff3-monthly (Kenneth French Data Library).'
      }
    />
  );
}
