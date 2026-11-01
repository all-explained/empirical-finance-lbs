import { Line, Point, Polygon, Polyline, Vector } from 'mafs';
import { useMemo, useState } from 'react';
import { directionVariance, pca, projectOnDirection, rotatePair } from '../../lib/stats/pca';
import { Button, Segmented, Select, Slider } from '../ui/controls';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useElementWidth, useTweened } from './animation';
import { extent, niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { factorComparison, latentPanel, MAX_K, useLatentData } from './latentSample';
import { PRESETS, presetPanel, seriesName, type Preset } from './pcaSample';

type View = 'cloud' | 'scree' | 'loadings' | 'factors';
const HEIGHT = 380;
// PlotFrame's default margins: the cloud needs them to give both axes the same scale.
const MARGIN_X = 48 + 30;
const MARGIN_Y = 14 + 44;
const SCREE_K = 10;
const STYLES = [
  { weight: 3, style: 'solid' as const, opacity: 1, word: 'thick solid' },
  { weight: 2, style: 'dashed' as const, opacity: 0.9, word: 'dashed' },
  { weight: 1.5, style: 'solid' as const, opacity: 0.55, word: 'thin faint' },
];

const pct = (v: number, digits = 1) => `${Math.abs(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 1) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const FACTOR_LABELS = ['Mkt-RF', 'SMB', 'HML'];

/**
 * Chapter 6: principal components of the 25 size–value portfolios or of monthly
 * yield changes. Three views: a two-series cloud with its principal axes (and the
 * distances the first axis leaves out), a scree plot, and the loadings of the first
 * three components. A rotation slider and a sign flip show what PCA does not pin down.
 * Chapter 31 opens on a fourth view, "factors": the canonical and plain correlations of the first K PCs of
 * the excess returns with Mkt-RF, SMB and HML. Only initialView="factors" offers it and loads ff3-monthly.
 */
export default function PCAExplorer({ initialPreset = 'ff25', initialView = 'cloud' }: { initialPreset?: Preset; initialView?: View }) {
  const withFactors = initialView === 'factors';
  const { data, failed } = useLatentData(withFactors);
  const [preset, setPreset] = useState<Preset>(initialPreset);
  const [view, setView] = useState<View>(initialView);
  const [K, setK] = useState(3);
  const [pair, setPair] = useState<[number, number]>(PRESETS[initialPreset].pair);
  const [degrees, setDegrees] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const sign = useTweened(flipped ? -1 : 1);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const info = PRESETS[preset];
  const omega = (degrees * Math.PI) / 180;

  const panel = useMemo(() => data && presetPanel(preset, data.ff25, data.gsw), [data, preset]);
  const full = useMemo(() => panel && pca(panel.X), [panel]);
  const cloud = useMemo(() => {
    if (!panel) return null;
    const points = panel.X.map((row) => [row[pair[0]] * info.scale, row[pair[1]] * info.scale]);
    return { points, fit: pca(points) };
  }, [panel, pair, info.scale]);

  const changePreset = (next: Preset) => {
    setPreset(next);
    setPair(PRESETS[next].pair);
  };
  // The factors view compares portfolio PCs with equity factors, so it has no yield-change sample.
  const changeView = (next: View) => {
    setView(next);
    if (next === 'factors' && preset === 'gsw') changePreset('ff25-1963');
  };
  const latent = useMemo(() => (data?.ff3 && preset !== 'gsw' ? latentPanel(data.ff3, data.ff25, preset) : null), [data, preset]);
  // The discrete flip, not the tweened sign: H must stay invertible.
  const comparison = useMemo(() => latent && factorComparison(latent, K, omega, flipped), [latent, K, omega, flipped]);

  // Components 1 and 2 after the rotation; 3 onward are unchanged.
  const fullAxes = full && rotatePair(full.loadings[0], full.loadings[1], omega);
  const total = full ? full.values.reduce((s, v) => s + v, 0) : 1;
  const shares = full && fullAxes
    ? [...fullAxes.map((w) => directionVariance(full.covariance, w) / total), ...full.share.slice(2)]
    : [];
  const cloudAxes = cloud && rotatePair(cloud.fit.loadings[0], cloud.fit.loadings[1], omega);
  const cloudTotal = cloud ? cloud.fit.values[0] + cloud.fit.values[1] : 1;
  const cloudVar = cloud && cloudAxes ? cloudAxes.map((w) => directionVariance(cloud.fit.covariance, w)) : [0, 0];

  let plot = <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>;
  if (cloud && cloudAxes && view === 'cloud' && width > 0) {
    const [cx, cy] = cloud.fit.mean;
    const [xLo, xHi] = extent(cloud.points.map(([px]) => px));
    const [yLo, yHi] = extent(cloud.points.map(([, py]) => py));
    const w = Math.max(width - MARGIN_X, 1);
    const h = HEIGHT - MARGIN_Y;
    // One data unit is the same number of pixels across and up, so right angles look right.
    const unit = Math.max((1.06 * (xHi - xLo)) / w, (1.12 * (yHi - yLo)) / h);
    const [mx, my] = [(xLo + xHi) / 2, (yLo + yHi) / 2];
    const x: [number, number] = [mx - (w * unit) / 2, mx + (w * unit) / 2];
    const y: [number, number] = [my - (h * unit) / 2, my + (h * unit) / 2];
    const tips = cloudAxes.map((dir, k) => {
      const length = 2.5 * Math.sqrt(cloudVar[k]);
      return [cx + sign * length * dir[0], cy + sign * length * dir[1]] as [number, number];
    });
    plot = (
      <PlotFrame
        x={x} y={y} height={HEIGHT}
        xTicks={niceTicks(x[0], x[1], 6)} yTicks={niceTicks(y[0], y[1], 5)}
        formatX={(v) => num(v, 0)} formatY={(v) => num(v, 0)}
        xLabel={`${seriesName(preset, panel!, pair[0])}, ${info.unit}`}
        yLabel={`${seriesName(preset, panel!, pair[1])}, ${info.unit}`}
      >
        {cloud.points.map((p, i) => (
          <Line.Segment key={`e${i}`} point1={p as [number, number]} point2={projectOnDirection(p, cloud.fit.mean, cloudAxes[0]) as [number, number]} color="var(--c-error)" weight={1} opacity={0.3} />
        ))}
        {cloud.points.map(([px, py], i) => (
          <Point key={`p${i}`} x={px} y={py} color="var(--c-data)" opacity={0.6} svgCircleProps={{ r: 2.2 }} />
        ))}
        {tips.map((tip, k) => (
          <Line.Segment key={`a${k}`} point1={[2 * cx - tip[0], 2 * cy - tip[1]]} point2={tip} color="var(--c-factor)" weight={STYLES[k].weight - 1} style={STYLES[k].style} />
        ))}
        {tips.map((tip, k) => (
          <Vector key={`v${k}`} tail={[cx, cy]} tip={tip} color="var(--c-factor)" weight={STYLES[k].weight} style={STYLES[k].style} />
        ))}
        {tips.map((tip, k) => (
          <Label key={`l${k}`} x={tip[0]} y={tip[1]} attach="ne" attachDistance={6} color="var(--c-factor)">{`axis ${k + 1}`}</Label>
        ))}
      </PlotFrame>
    );
  } else if (full && view === 'scree') {
    const pcaShares = full.share;
    let running = 0;
    const cumulative = shares.slice(0, SCREE_K).map((s) => (running += s));
    plot = (
      <PlotFrame
        x={[0.4, SCREE_K + 0.6]} y={[0, 1.12]} height={HEIGHT}
        xTicks={Array.from({ length: SCREE_K }, (_, i) => i + 1)} yTicks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        formatY={(v) => pct(v, 0)}
        xLabel="component k"
        yLabel="share of total variance"
      >
        {shares.slice(0, SCREE_K).map((s, i) => (
          <Polygon key={`b${i}`} points={[[i + 0.65, 0], [i + 1.35, 0], [i + 1.35, s], [i + 0.65, s]]} color="var(--c-factor)" fillOpacity={0.45} weight={1.5} />
        ))}
        {degrees !== 0 && [0, 1].map((i) => (
          <Polygon key={`o${i}`} points={[[i + 0.65, 0], [i + 1.35, 0], [i + 1.35, pcaShares[i]], [i + 0.65, pcaShares[i]]]} color="var(--text-muted)" fillOpacity={0} weight={1.5} strokeStyle="dashed" />
        ))}
        <Polyline points={cumulative.map((c, i) => [i + 1, c] as [number, number])} color="var(--text-muted)" weight={1.5} strokeStyle="dashed" fillOpacity={0} />
        {cumulative.map((c, i) => <Point key={`c${i}`} x={i + 1} y={c} color="var(--text-muted)" svgCircleProps={{ r: 3 }} />)}
        {shares.slice(0, 3).map((s, i) => (
          <Label key={`t${i}`} x={i + 1} y={s} attach="n" attachDistance={6} size={12}>{pct(s)}</Label>
        ))}
      </PlotFrame>
    );
  } else if (full && fullAxes && panel && view === 'loadings') {
    const n = full.loadings[0].length;
    const lines = [fullAxes[0], fullAxes[1], full.loadings[2]].map((q) => q.map((v, i) => [i + 1, sign * v] as [number, number]));
    // Portfolios: one line per size group, so a jump between groups is not drawn as a slope.
    const groupSize = preset === 'gsw' ? n : 5;
    const pieces = (points: [number, number][]) => Array.from({ length: n / groupSize }, (_, g) => points.slice(g * groupSize, (g + 1) * groupSize));
    const bound = 1.1 * Math.max(
      ...full.loadings[0].map((v, i) => Math.hypot(v, full.loadings[1][i])),
      ...full.loadings[2].map(Math.abs),
    );
    const isGsw = preset === 'gsw';
    plot = (
      <PlotFrame
        x={[0.5, n + 0.5]} y={[-bound, bound]} height={HEIGHT}
        xTicks={isGsw ? [1, 5, 10, 15, 20, 25, 30] : [3, 8, 13, 18, 23]}
        yTicks={niceTicks(-bound, bound, 6)}
        formatX={(v) => (isGsw ? String(v) : `ME${(v + 2) / 5}`)}
        formatY={(v) => num(v, 1)}
        xLabel={isGsw ? 'maturity (years)' : 'size group; growth → value inside each'}
        yLabel="loading"
        baseline={0}
      >
        {lines.map((points, k) => pieces(points).map((piece, g) => (
          <Polyline key={`q${k}-${g}`} points={piece} color="var(--c-factor)" weight={STYLES[k].weight} strokeStyle={STYLES[k].style} strokeOpacity={STYLES[k].opacity} fillOpacity={0} />
        )))}
        {lines.map((points, k) => points.map(([px, py]) => (
          <Point key={`q${k}-${px}`} x={px} y={py} color="var(--c-factor)" opacity={STYLES[k].opacity} svgCircleProps={{ r: k === 0 ? 3 : 2.2 }} />
        )))}
        {lines.map((points, k) => (
          <Label key={`n${k}`} x={points[n - 1][0]} y={points[n - 1][1]} attach="e" attachDistance={6} size={12} color="var(--c-factor)">{String(k + 1)}</Label>
        ))}
      </PlotFrame>
    );
  } else if (comparison && view === 'factors') {
    plot = (
      <PlotFrame
        x={[0.4, 3.6]} y={[0, 1.12]} height={HEIGHT}
        xTicks={comparison.canonical.map((_, k) => k + 1)} yTicks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        formatY={(v) => num(v, 1)}
        xLabel="canonical pair k"
        yLabel="canonical correlation"
      >
        {comparison.canonical.map((cc, i) => (
          <Polygon key={`c${i}`} points={[[i + 0.65, 0], [i + 1.35, 0], [i + 1.35, cc], [i + 0.65, cc]]} color="var(--c-factor)" fillOpacity={0.45} weight={1.5} />
        ))}
        {comparison.canonical.map((cc, i) => (
          <Label key={`t${i}`} x={i + 1} y={cc} attach="n" attachDistance={6} size={12}>{cc.toFixed(3)}</Label>
        ))}
      </PlotFrame>
    );
  }

  const sample = panel ? `${panel.dates[0].slice(0, 7)} to ${panel.dates.at(-1)!.slice(0, 7)}` : '';
  const latentSampleText = latent ? `${latent.dates[0].slice(0, 7)} to ${latent.dates.at(-1)!.slice(0, 7)}` : '';
  const rotated = K >= 2 && degrees !== 0;
  const ariaLabel = view === 'factors'
    ? comparison
      ? `Bars give the ${comparison.canonical.length} canonical correlations between the first ${K} principal components of the 25 portfolios' excess returns and Mkt-RF, SMB and HML, ${latentSampleText}: ${comparison.canonical.map((cc) => cc.toFixed(3)).join(', ')}.${rotated ? ` Components 1 and 2 are turned by ${degrees} degrees; the bars do not change.` : ''}`
      : 'Principal components explorer. The data is loading.'
    : !panel || !full || !cloud
    ? 'Principal components explorer. The data is loading.'
    : view === 'cloud'
      ? `Scatter of ${cloud.points.length} months: ${seriesName(preset, panel, pair[0])} across and ${seriesName(preset, panel, pair[1])} up, ${info.unit}, ${sample}. Two arrows from the mean show the principal axes${degrees ? `, rotated by ${degrees} degrees` : ''}. Axis 1 carries ${pct(cloudVar[0] / cloudTotal)} of the variance of the pair. Thin lines join each point to axis 1.`
      : view === 'scree'
        ? `Scree plot for the ${info.label}: bars give the share of total variance of components 1 to ${SCREE_K}. Component 1 has ${pct(shares[0])}, component 2 ${pct(shares[1])}, component 3 ${pct(shares[2])}. A dashed line adds them up.`
        : `Loadings of components 1, 2 and 3 on each of the ${full.loadings[0].length} series of the ${info.label}. Component 1 is a ${STYLES[0].word} line, 2 is ${STYLES[1].word}, 3 is ${STYLES[2].word}.${flipped ? ' The signs are flipped.' : ''}`;

  const names = panel ? panel.names.map((_, i) => ({ value: String(i), label: seriesName(preset, panel, i) })) : [];
  const loading = <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>;
  const factorsReadout = comparison && latent ? (
    <>
      <p style={{ margin: '0 0 0.5rem' }}>
        <span style={{ color: 'var(--c-factor)' }}>bars: canonical correlations</span> · <span style={{ color: 'var(--text-muted)' }}>table: plain correlations of each component</span>
      </p>
      <dl className="readout-grid">
        <dt>Sample</dt>
        <dd>{latentSampleText}, {latent.dates.length} months, 25 portfolios in excess of RF</dd>
        <dt>Canonical correlations</dt>
        <dd style={{ color: 'var(--c-factor)' }}>{comparison.canonical.map((cc) => cc.toFixed(3)).join(', ')}</dd>
        <dt>Share of {K === 1 ? 'component 1' : `components 1–${K}`}</dt>
        <dd>{pct(comparison.share)} of total variance</dd>
        <dt>Rotation</dt>
        <dd>{K < 2 ? 'needs K ≥ 2: one component has no plane to turn in' : degrees === 0 ? 'none (PCA)' : `components 1 and 2 turned by ${num(degrees, 0)}°`}</dd>
        <dt>Signs</dt>
        <dd>{flipped ? 'flipped; no canonical correlation changes' : 'as computed'}</dd>
      </dl>
      <table className="iter-table" style={{ marginTop: '0.5rem' }}>
        <caption style={{ textAlign: 'left', color: 'var(--text-muted)' }}>Correlation of each component with each factor</caption>
        <thead>
          <tr><th scope="col">Component</th>{FACTOR_LABELS.map((name) => <th key={name} scope="col">{name}</th>)}</tr>
        </thead>
        <tbody>
          {comparison.correlations.map((row, k) => (
            <tr key={k}><th scope="row" style={{ textAlign: 'left' }}>{k + 1}</th>{row.map((v, j) => <td key={j}>{num(v, 2)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </>
  ) : loading;
  return (
    <WidgetFrame
      title="Principal components: the few directions that matter"
      ariaLabel={ariaLabel}
      plotHeight={HEIGHT}
      plot={<div ref={ref}>{plot}</div>}
      controls={
        <>
          <Select label="Data" value={preset} onChange={changePreset} options={(Object.keys(PRESETS) as Preset[]).filter((p) => view !== 'factors' || p !== 'gsw').map((p) => ({ value: p, label: PRESETS[p].label }))} />
          {/* Cloud (or factors) last: the click-through then ends in the view whose controls follow. */}
          <Segmented label="Show" value={view} onChange={changeView} options={[
            { value: 'scree', label: 'scree' },
            { value: 'loadings', label: 'loadings' },
            { value: 'cloud', label: 'cloud' },
            ...(withFactors ? [{ value: 'factors' as const, label: 'factors' }] : []),
          ]} />
          {view === 'factors' && (
            <Slider label="Components $K$" value={K} min={1} max={MAX_K} step={1} onChange={setK} color="var(--c-factor)" />
          )}
          {view === 'cloud' && names.length > 0 && (
            <>
              <Select label="Across" value={String(pair[0])} onChange={(v) => setPair([Number(v), pair[1]])} options={names} />
              <Select label="Up" value={String(pair[1])} onChange={(v) => setPair([pair[0], Number(v)])} options={names} />
            </>
          )}
          <Slider label="Rotate axes 1 and 2 by $\omega$" value={degrees} min={-90} max={90} step={5} onChange={setDegrees} format={(v) => `${num(v, 0)}°`} color="var(--c-factor)" />
          <Button onClick={() => setFlipped((f) => !f)}>{flipped ? 'Flip the signs back' : 'Flip the signs'}</Button>
        </>
      }
      readout={
        view === 'factors' ? factorsReadout : panel && full && cloud ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              {view === 'cloud' && <><span style={{ color: 'var(--c-data)' }}>● dots: months</span> · <span style={{ color: 'var(--c-factor)' }}>arrows: axis 1 (solid), axis 2 (dashed)</span> · <span style={{ color: 'var(--c-error)' }}>thin lines: distance to axis 1</span></>}
              {view === 'scree' && <><span style={{ color: 'var(--c-factor)' }}>bars: share of each component</span> · <span style={{ color: 'var(--text-muted)' }}>– – dashed line: running total{degrees !== 0 ? '; dashed boxes: shares at ω = 0°' : ''}</span></>}
              {view === 'loadings' && <span style={{ color: 'var(--c-factor)' }}>component 1: {STYLES[0].word} · 2: {STYLES[1].word} · 3: {STYLES[2].word}</span>}
            </p>
            <dl className="readout-grid">
              <dt>Sample</dt>
              <dd>{sample}, {panel.X.length} months, {full.values.length} series</dd>
              {view === 'cloud' ? (
                <>
                  <dt>Axis 1 carries</dt>
                  <dd style={{ color: 'var(--c-factor)' }}>{pct(cloudVar[0] / cloudTotal)} of the pair's variance{degrees !== 0 && ` (most possible: ${pct(cloud.fit.share[0])} at 0°)`}</dd>
                  <dt>Axis 2 carries</dt>
                  <dd>{pct(cloudVar[1] / cloudTotal)}</dd>
                  <dt>Together</dt>
                  <dd>{pct((cloudVar[0] + cloudVar[1]) / cloudTotal)}</dd>
                </>
              ) : (
                <>
                  <dt>Component 1</dt>
                  <dd style={{ color: 'var(--c-factor)' }}>{pct(shares[0])}{degrees !== 0 && ` (PCA: ${pct(full.share[0])})`}</dd>
                  <dt>Component 2</dt>
                  <dd>{pct(shares[1])}{degrees !== 0 && ` (PCA: ${pct(full.share[1])})`}</dd>
                  <dt>1 and 2 together</dt>
                  <dd>{pct(shares[0] + shares[1])}</dd>
                  <dt>First three together</dt>
                  <dd>{pct(shares[0] + shares[1] + shares[2])}</dd>
                </>
              )}
              <dt>Signs</dt>
              <dd>{flipped ? 'flipped; no share changes' : 'as computed'}</dd>
            </dl>
          </>
        ) : loading
      }
      caption={view === 'factors' ? `Data: ff25-size-bm-monthly and ff3-monthly (Kenneth French Data Library), value-weighted monthly returns of the 25 portfolios in excess of RF, ${latentSampleText}, against Mkt-RF, SMB and HML. PCA of the sample covariance matrix of the excess returns; each component is scaled to unit variance. Turning components 1 and 2 by $\\omega$, or flipping the signs, changes the plain correlations but no canonical correlation $\\mathit{cc}_k$.` : `Data: ${preset === 'gsw' ? 'gsw-zero-coupon (Gürkaynak, Sack and Wright (2007)), month-end 1- to 30-year zero-coupon yields, November 1985 to September 2026; PCA of their monthly changes, in basis points' : `ff25-size-bm-monthly (Kenneth French Data Library), value-weighted monthly returns, ${preset === 'ff25' ? 'July 1926' : 'July 1963'} to August 2026`}. PCA of the sample covariance matrix. A component is fixed only up to its sign: flipping it changes no share. Components 1 and 2 together are fixed only up to a rotation $\\omega$ inside their plane: their joint share stays the same.`}
    />
  );
}
