import { Line, Point, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { Select } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { BEAR_LOOKBACK, crashView, momentumSample, useSeriesData } from './factorModelSample';
import { extent, niceTicks, percent } from './format';
import { PlotFrame } from './PlotFrame';

const HEIGHT = 320;
const WORST = 10;
const SERIES = ['ff3-monthly', 'mom-monthly'] as const;
const monthName = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const signed = (v: number, digits = 1) => percent(v, digits);
const fixed = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;

/**
 * Chapter 20: the worst months of the momentum factor. For the chosen month, $1 compounded in the market
 * excess return and in Mom over the 24 months before it and through it, the bear-market indicator, and
 * the two betas of the bear-market regression on the full sample.
 */
export default function CrashZoom({ initialRank = 0 }: { initialRank?: number }) {
  const { data, failed } = useSeriesData(SERIES);
  const [rank, setRank] = useState(String(initialRank));
  const view = useMemo(
    () => (data ? crashView(momentumSample(data['ff3-monthly'], data['mom-monthly']), WORST, BEAR_LOOKBACK) : null),
    [data],
  );
  const crash = view?.crashes[Number(rank)];
  const n = crash ? crash.window.dates.length : BEAR_LOOKBACK + 1;
  // x runs from -n (the dollar at the start of the window) to 0 (the end of the crash month).
  const xs = Array.from({ length: n + 1 }, (_, i) => i - n);
  const [lo, hi] = crash ? extent([...crash.window.market, ...crash.window.mom, 1]) : [0.5, 1.5];
  const bottom = useTweened(Math.max(0, lo - 0.05));
  const top = useTweened(hi + 0.05);

  const plot = crash ? (
    <PlotFrame
      x={[-n, 0]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={niceTicks(-n, 0, 5).filter(Number.isInteger)}
      yTicks={niceTicks(bottom, top, 5)}
      formatX={(v) => (v === 0 ? 'crash' : `−${-v} mo`)}
      formatY={(v) => `$${v.toFixed(2)}`}
      xLabel="months before the end of the crash month"
      yLabel="value of $1, compounded"
      baseline={1}
      marginLeft={50}
    >
      <Line.Segment point1={[-1, bottom]} point2={[-1, top]} color="var(--text-muted)" opacity={0.4} style="dashed" />
      <Polyline points={xs.map((x, i) => [x, crash.window.market[i]] as [number, number])} color="var(--c-return)" weight={2.5} fillOpacity={0} strokeStyle="dashed" />
      <Polyline points={xs.map((x, i) => [x, crash.window.mom[i]] as [number, number])} color="var(--c-factor)" weight={2.5} fillOpacity={0} />
      <Point x={0} y={crash.window.market[n]} color="var(--c-return)" />
      <Point x={0} y={crash.window.mom[n]} color="var(--c-factor)" />
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const c = view?.regression.coefficients;
  const t = view?.regression.tStats;
  return (
    <WidgetFrame
      title="Momentum's worst months, up close"
      ariaLabel={
        crash && c
          ? `${monthName(crash.date)}, rank ${Number(rank) + 1} of momentum's ${WORST} worst months. Over the ${n - 1} months before it, $1 in the market excess return went to $${crash.window.market[n - 1].toFixed(2)} and $1 in momentum went to $${crash.window.mom[n - 1].toFixed(2)}. In the crash month the market returned ${signed(crash.market)} and momentum ${signed(crash.mom)}. The bear-market indicator was ${crash.bear ?? 'not defined'}. Momentum's market beta is ${fixed(c.beta0)} in normal months and ${fixed(c.beta0 + c.betaB)} after a bear market.`
          : 'The worst months of the momentum factor and the market path before each. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <Select
          label="Crash month (worst first)"
          value={rank}
          onChange={setRank}
          options={(view?.crashes ?? []).map((k, i) => ({ value: String(i), label: `${i + 1}. ${k.date.slice(0, 7)}: Mom ${signed(k.mom)}` }))}
        />
      }
      readout={
        crash && c && t ? (
          <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--c-factor)' }}>── momentum (solid)</span> · <span style={{ color: 'var(--c-return)' }}>- - market (dashed)</span>
          </p>
          <dl className="readout-grid">
            <dt>Crash month</dt>
            <dd>{monthName(crash.date)}</dd>
            <dt><RichText>{'Momentum $WML_t$ that month'}</RichText></dt>
            <dd style={{ color: 'var(--c-factor)' }}>{signed(crash.mom)}</dd>
            <dt><RichText>{'Market $\\Ret{R^e_{m,t}}$ that month'}</RichText></dt>
            <dd style={{ color: 'var(--c-return)' }}>{signed(crash.market)}</dd>
            <dt>Market over the 24 months before</dt>
            <dd>{crash.pastMarket === null ? 'before 1929: not defined' : signed(crash.pastMarket)}</dd>
            <dt><RichText>{'Bear-market indicator $I_{B,t-1}$'}</RichText></dt>
            <dd>{crash.bear === null ? '—' : `${crash.bear} (${crash.bear ? 'bear market' : 'no bear market'})`}</dd>
            <dt><RichText>{'Beta in normal months $\\hat\\beta_0$'}</RichText></dt>
            <dd>{fixed(c.beta0)} (t = {fixed(t.beta0)})</dd>
            <dt><RichText>{'Extra beta after a bear market $\\hat\\beta_B$'}</RichText></dt>
            <dd>{fixed(c.betaB)} (t = {fixed(t.betaB)})</dd>
            <dt><RichText>{'Beta after a bear market $\\hat\\beta_0 + \\hat\\beta_B$'}</RichText></dt>
            <dd>{fixed(c.beta0 + c.betaB)}</dd>
          </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: mom-monthly and ff3-monthly (Kenneth French Data Library), 1927-01 to 2026-08. Momentum = Mom, winners minus losers on the return from t−12 to t−2. Market = Mkt-RF. The lines compound \\$1 over the ${BEAR_LOOKBACK} months before the crash month (left of the dashed vertical line) and through it (the dots). $I_{B,t-1} = 1$ when the market excess return compounded over those ${BEAR_LOOKBACK} months is negative. Betas: OLS of monthly Mom on Mkt-RF, $I_{B,t-1}$ and their product, 1929-01 to 2026-08, White t-statistics. Returns are monthly, not annualised.`}
    />
  );
}
