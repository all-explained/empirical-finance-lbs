import { Line, Polygon } from 'mafs';
import { useMemo, useState } from 'react';
import { Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { POSTWAR_START, sampleData, sharesAt, usePresentValueData, type Sample } from './presentValueSample';

const HEIGHT = 220;
const BAR = [0.3, 0.7] as const;

const pct = (v: number) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(0)}%`;
const years = (k: number) => `${k} year${k === 1 ? '' : 's'}`;

const PARTS = [
  { key: 'returns', name: 'returns', short: 'r', color: 'var(--c-return)', dashed: false },
  { key: 'dividends', name: 'dividend growth', short: 'Δd', color: 'var(--c-factor)', dashed: true },
  { key: 'future', name: 'future dp ("bubble")', short: 'dp', color: 'var(--c-signal)', dashed: true },
] as const;

/**
 * Chapter 10: Var(dp_t) split into the shares that future returns, future dividend growth
 * and dp k years later carry, at horizons 1 to 20 years. Positive shares stack right of
 * zero and negative shares left of it; the dashed line marks 100%.
 */
export default function VarianceShares({ initialHorizon = 1 }: { initialHorizon?: number }) {
  const [k, setK] = useState(initialHorizon);
  const [sample, setSample] = useState<Sample>('full');
  const { data, failed } = usePresentValueData();

  const view = useMemo(() => {
    if (!data) return null;
    const chosen = sampleData(data, sample);
    const shares = sharesAt(chosen, k);
    let up = 0;
    let down = 0;
    const segments = PARTS.map((part) => {
      const value = shares[part.key];
      const from = value >= 0 ? up : down;
      if (value >= 0) up += value; else down += value;
      return { ...part, value, from, to: from + value };
    });
    return { shares, segments, first: chosen.years[0], last: chosen.years.at(-1)! - k, up, down };
  }, [data, sample, k]);

  const left = useTweened(Math.min(0, view?.down ?? 0) - 0.05);
  const right = useTweened(Math.max(1.1, view?.up ?? 1) + 0.05);
  const sum = view ? view.shares.returns + view.shares.dividends + view.shares.future : 0;

  const plot = view ? (
    <PlotFrame
      x={[left, right]}
      y={[0, 1]}
      height={HEIGHT}
      xTicks={niceTicks(left, right, 6)}
      yTicks={[]}
      formatX={pct}
      xLabel={<>share of Var(<tspan style={{ fill: 'var(--c-signal)' }}>dp</tspan>)</>}
    >
      {view.segments.map((s) => (
        <Polygon
          key={s.key}
          points={[[s.from, BAR[0]], [s.to, BAR[0]], [s.to, BAR[1]], [s.from, BAR[1]]]}
          color={s.color} fillOpacity={0.55} weight={2} strokeStyle={s.dashed ? 'dashed' : 'solid'}
        />
      ))}
      {view.segments.filter((s) => Math.abs(s.value) >= 0.08).map((s) => (
        <Label key={`l${s.key}`} x={(s.from + s.to) / 2} y={(BAR[0] + BAR[1]) / 2} size={13}>{s.short}</Label>
      ))}
      <Line.Segment point1={[1, 0.15]} point2={[1, 0.85]} color="var(--text)" weight={1.5} style="dashed" />
      <Label x={1} y={0.85} attach="n" attachDistance={4} size={12} color="var(--text-muted)">100%</Label>
      <Line.Segment point1={[0, 0]} point2={[0, 1]} color="var(--axis)" weight={1.5} />
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  return (
    <WidgetFrame
      title="Where does the variance of dp come from?"
      ariaLabel={
        view
          ? `Stacked bar of the variance of the log dividend–price ratio, dp at the end of ${view.first} to ${view.last}, at a horizon of ${years(k)}. ${view.segments.map((s) => `The ${s.name} share is ${pct(s.value)}`).join('. ')}. Together they make ${pct(sum)}; a dashed line marks 100%.`
          : 'Stacked bar of the variance shares of the dividend–price ratio. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Horizon $k$" value={k} min={1} max={20} onChange={setK} format={years} />
          <Segmented label="Sample" value={sample} onChange={setSample} options={[
            { value: 'full', label: 'from 1872' },
            { value: 'postwar', label: `from ${POSTWAR_START}` },
          ]} />
        </>
      }
      readout={
        view ? (
          <dl className="readout-grid">
            {view.segments.map((s) => (
              <span key={s.key} style={{ display: 'contents' }}>
                <dt><span style={{ color: s.color }}>{s.dashed ? '▨' : '■'}</span> {s.name} ({s.short})</dt>
                <dd style={{ color: s.color }}>{pct(s.value)}</dd>
              </span>
            ))}
            <dt>Sum (missing part: linearisation error)</dt>
            <dd>{pct(sum)}</dd>
            <dt><RichText>{'$\\rho$ and $\\rho^k$'}</RichText></dt>
            <dd>{view.shares.rho.toFixed(3)} and {(view.shares.rho ** k).toFixed(2)}</dd>
            <dt>dp years used</dt>
            <dd>{view.first}–{view.last}</dd>
          </dl>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption="Data: goyal-welch-annual, S&P composite Index and D12, dp at the end of 1872 (or 1946) to 2025 minus $k$. Each share is a covariance with $\Signal{dp_t}$ over $\operatorname{Var}(\Signal{dp_t})$: $\operatorname{Cov}(dp_t, \sum_j \rho^{j-1} r_{t+j})$ for returns, $-\operatorname{Cov}(dp_t, \sum_j \rho^{j-1} \Delta d_{t+j})$ for dividend growth and $\rho^k \operatorname{Cov}(dp_t, dp_{t+k})$ for future dp, all on the same dates. $\rho$ is set at the mean pd of the chosen sample. Point estimates only: no standard errors."
    />
  );
}
