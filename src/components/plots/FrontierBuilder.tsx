import { Line, Point, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { Button, Select, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { annualMoments, capmSample, frontierView, PERIODS, useCapmData, type Portfolio } from './capmSample';
import { niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 360;
const X_MAX = 0.32;
const Y_MAX = 0.3; // no tick at the top, where it would collide with the axis title
const TARGETS = Array.from({ length: 121 }, (_, i) => (i / 120) * Y_MAX);
type Direction = 'n' | 'e' | 'w' | 'se' | 'sw' | 'nw';
const ASSETS: { id: Portfolio; name: string; code: string; attach: Direction }[] = [
  { id: 'ME1-BM1', name: 'Small growth', code: 'SG', attach: 'e' },
  { id: 'ME1-BM5', name: 'Small value', code: 'SV', attach: 'n' },
  { id: 'ME5-BM1', name: 'Big growth', code: 'BG', attach: 'se' },
  { id: 'ME5-BM5', name: 'Big value', code: 'BV', attach: 'e' },
  { id: 'ME3-BM3', name: 'Middle', code: 'Mid', attach: 'nw' },
];
const DEFAULT_ON = ['ME1-BM1', 'ME1-BM5', 'ME5-BM1', 'ME5-BM5'] as Portfolio[];
const NO_SHIFT = Object.fromEntries(ASSETS.map((a) => [a.id, 0])) as Record<Portfolio, number>;

const pct = (v: number, digits = 1) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const signedPct = (v: number, digits = 0) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const pp = (v: number) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${Math.abs(v * 100).toFixed(1)} pp`;

/**
 * Chapter 7: the mean–variance frontier of a few size–B/M portfolios, the tangency portfolio and
 * the capital market line. Shifting an asset's expected return shows how far the tangency weights swing.
 */
export default function FrontierBuilder() {
  const { data, failed } = useCapmData();
  const [on, setOn] = useState<Portfolio[]>(DEFAULT_ON);
  const [target, setTarget] = useState<Portfolio>('ME1-BM5');
  const [shift, setShift] = useState(NO_SHIFT);

  const moments = useMemo(() => {
    if (!data) return null;
    const s = capmSample(data.ff3, data.ff25, PERIODS.post1963.start);
    return { ...annualMoments(s, ASSETS.map((a) => a.id)), first: s.dates[0].slice(0, 7), last: s.dates.at(-1)!.slice(0, 7) };
  }, [data]);

  const view = useMemo(() => {
    if (!moments) return null;
    const mean = ASSETS.map((a, i) => moments.mean[i] + shift[a.id]);
    const vol = ASSETS.map((_, i) => Math.sqrt(moments.Sigma[i][i]));
    const idx = ASSETS.flatMap((a, i) => (on.includes(a.id) ? [i] : []));
    const result = idx.length
      ? frontierView(idx.map((i) => mean[i]), idx.map((i) => idx.map((k) => moments.Sigma[i][k])), moments.rf, TARGETS)
      : { curve: [], tangency: null };
    return { mean, vol, idx, ...result, curve: result.curve.filter((p) => p.volatility <= X_MAX) };
  }, [moments, on, shift]);

  const toggle = (id: Portfolio) => setOn((list) => (list.includes(id) ? list.filter((x) => x !== id) : ASSETS.map((a) => a.id).filter((x) => x === id || list.includes(x))));
  const t = view?.tangency;
  const tangencyShown = t && t.volatility <= X_MAX && t.mean <= Y_MAX;
  // The CML runs from (0, R^f) with slope SR_max until it leaves the plot.
  const cmlEnd = t && moments ? Math.min(X_MAX, (Y_MAX - moments.rf) / t.sharpe) : 0;
  const targetName = ASSETS.find((a) => a.id === target)!.name.toLowerCase();

  const plot = view && moments ? (
    <PlotFrame
      x={[0, X_MAX]}
      y={[0, Y_MAX]}
      height={HEIGHT}
      xTicks={niceTicks(0, X_MAX, 6)}
      yTicks={niceTicks(0, Y_MAX, 6).filter((v) => v < Y_MAX)}
      formatX={(v) => pct(v, 0)}
      formatY={(v) => pct(v, 0)}
      xLabel="volatility σ, % a year"
      yLabel={<tspan style={{ fill: 'var(--c-return)' }}>expected return, % a year</tspan>}
      marginLeft={44}
    >
      {view.curve.length > 1 && (
        <Polyline points={view.curve.map((p) => [p.volatility, p.mean] as [number, number])} color="var(--c-model)" weight={2.5} fillOpacity={0} />
      )}
      {t && <Line.Segment point1={[0, moments.rf]} point2={[cmlEnd, moments.rf + t.sharpe * cmlEnd]} color="var(--c-model)" weight={2} style="dashed" />}
      <Point x={moments.market.volatility} y={moments.market.mean} color="var(--c-return)" svgCircleProps={{ r: 6, style: { fill: 'none', stroke: 'var(--c-return)', strokeWidth: 2 } }} />
      <Label x={moments.market.volatility} y={moments.market.mean} attach="sw" attachDistance={8} size={12} color="var(--text-muted)">Mkt</Label>
      {ASSETS.map((a, i) => {
        const active = on.includes(a.id);
        return (
          <g key={a.id} opacity={active ? 1 : 0.35}>
            <Point x={view.vol[i]} y={Math.min(view.mean[i], Y_MAX)} color="var(--c-return)" svgCircleProps={{ r: active ? 5 : 4 }} />
            <Label x={view.vol[i]} y={Math.min(view.mean[i], Y_MAX)} attach={a.attach} attachDistance={8} size={12} color="var(--text-muted)">{a.code}</Label>
          </g>
        );
      })}
      <Point x={0} y={moments.rf} color="var(--c-rf)" svgCircleProps={{ r: 5 }} />
      <Label x={0} y={moments.rf} attach="se" attachDistance={8} size={12} color="var(--c-rf)">risk-free</Label>
      {t && tangencyShown && (
        <>
          <Point x={t.volatility} y={t.mean} color="var(--c-model)" svgCircleProps={{ r: 7, strokeWidth: 2 }} />
          <Label x={t.volatility} y={t.mean} attach="nw" attachDistance={10} size={12} color="var(--c-model)">tangency</Label>
        </>
      )}
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const picked = ASSETS.filter((a) => on.includes(a.id));
  return (
    <WidgetFrame
      title="Build the frontier from a few portfolios"
      ariaLabel={
        view && moments
          ? `Expected return against volatility, in percent a year, for ${picked.length ? picked.map((a) => a.name.toLowerCase()).join(', ') : 'no assets'}${picked.length ? ' (dots)' : ''}, the market (ring) and the risk-free rate of ${pct(moments.rf)} on the vertical axis. ${view.curve.length > 1 ? 'A curve shows the minimum-variance frontier of the chosen assets. ' : ''}${t ? `The dashed capital market line starts at the risk-free rate and touches the frontier at the tangency portfolio, with expected return ${pct(t.mean)}, volatility ${pct(t.volatility)} and Sharpe ratio ${t.sharpe.toFixed(2)}.` : 'There is no tangency portfolio for these choices.'}`
          : 'Mean–variance frontier of a few portfolios. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Select label="Asset to move" value={target} onChange={setTarget} options={ASSETS.map((a) => ({ value: a.id, label: `${a.name} (${a.code})` }))} />
          <Slider
            label={`Shift in the expected return of ${targetName}`}
            value={shift[target]}
            min={-0.1}
            max={0.1}
            step={0.005}
            color="var(--c-return)"
            onChange={(v) => setShift((s) => ({ ...s, [target]: v }))}
            format={pp}
          />
          {ASSETS.map((a) => (
            <Button key={a.id} onClick={() => toggle(a.id)}>{on.includes(a.id) ? `Remove ${a.name.toLowerCase()}` : `Add ${a.name.toLowerCase()}`}</Button>
          ))}
          <Button onClick={() => { setOn(DEFAULT_ON); setShift(NO_SHIFT); }}>Reset</Button>
        </>
      }
      readout={
        view && moments ? (
          <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--c-return)' }}>● dots: assets · ○ ring: market</span> ·{' '}
            <span style={{ color: 'var(--c-model)' }}>solid curve: frontier · – – dashed: capital market line</span>
          </p>
          {picked.length === 0 ? (
            <p>Add at least one asset to see a frontier.</p>
          ) : (
            <dl className="readout-grid">
              <dt>Asset: expected return</dt>
              <dd>tangency weight</dd>
              {view.idx.map((i, k) => (
                <FragmentRow
                  key={ASSETS[i].id}
                  label={`${ASSETS[i].name} (${ASSETS[i].code}): ${pct(view.mean[i])}${shift[ASSETS[i].id] ? ` (${pp(shift[ASSETS[i].id])})` : ''}`}
                  weight={t ? t.weights[k] : null}
                />
              ))}
              <dt><RichText>{'Risk-free rate $\\Rf{R^f}$'}</RichText></dt>
              <dd style={{ color: 'var(--c-rf)' }}>{pct(moments.rf)}</dd>
              <dt><RichText>{'Highest Sharpe ratio $SR_{\\max}$'}</RichText></dt>
              <dd style={{ color: 'var(--c-model)' }}>{t ? t.sharpe.toFixed(2) : 'none'}</dd>
              <dt>Tangency: mean, volatility</dt>
              <dd style={{ color: 'var(--c-model)' }}>{t ? `${pct(t.mean)}, ${pct(t.volatility)}${tangencyShown ? '' : ' (off the chart)'}` : 'none: the best portfolio would be short'}</dd>
              <dt>Market: mean, volatility</dt>
              <dd style={{ color: 'var(--c-return)' }}>{pct(moments.market.mean)}, {pct(moments.market.volatility)}</dd>
            </dl>
          )}
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ff25-size-bm-monthly and ff3-monthly (Kenneth French Data Library), ${moments ? `${moments.first} to ${moments.last}` : PERIODS.post1963.label}. Expected returns start at the sample means (×12) and volatilities are sample standard deviations (×√12). Small/big = smallest/largest size quintile; growth/value = lowest/highest book-to-market quintile; Middle = ME3-BM3; Mkt = the market. $\\Rf{R^f}$ = average RF. Weights are shares of the risky portfolio, sum to 100% and may be negative (short sales).`}
    />
  );
}

/** One readout row: label, signed weight and a bar centred on zero (±200% fills the track). */
function FragmentRow({ label, weight }: { label: string; weight: number | null }) {
  const width = weight === null ? 0 : Math.min(Math.abs(weight) / 2, 1) * 50;
  return (
    <>
      <dt>{label}</dt>
      <dd style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ minWidth: '3.6em' }}>{weight === null ? 'none' : signedPct(weight)}</span>
        <span aria-hidden="true" style={{ position: 'relative', width: 64, height: 8, background: 'var(--grid)', borderRadius: 2 }}>
          <span style={{ position: 'absolute', top: 0, bottom: 0, left: weight !== null && weight < 0 ? `${50 - width}%` : '50%', width: `${width}%`, background: 'var(--text-muted)' }} />
        </span>
      </dd>
    </>
  );
}
