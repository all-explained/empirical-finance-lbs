import { Line, Point, Polyline } from 'mafs';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ridgePenalty, type AssetSet, type AssetSpace } from '../../lib/finance/shrinkage';
import { annualiseSharpe } from '../../lib/stats/moments';
import { Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { ASSET_SETS, bestIndex, PRIOR_SCALES, SPACES, pathPoint, useShrinkageData, type PathPoint } from './shrinkageSample';

const B_HEIGHT = 230;
const R2_HEIGHT = 190;
const LINES = 5;
const LAST = PRIOR_SCALES.length - 1;

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const power = (k: number) => `10${k < 0 ? '⁻' : ''}${String(Math.abs(k)).split('').map((d) => SUPERSCRIPT[Number(d)]).join('')}`;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
/** 7.7 × 10⁻³ */
const sci = (v: number) => {
  if (v === 0) return '0';
  const k = Math.floor(Math.log10(v));
  return `${(v / 10 ** k).toFixed(1)} × ${power(k)}`;
};

/**
 * Chapter 30: the shrinkage path of the SDF coefficients b̂ on 108 anomaly portfolios or 30 FF portfolios, in
 * the space of assets or of their principal components. Top: the largest b̂ against the total penalty ν₂ + ν₁ (log
 * scale). Bottom: R²_CV against it, with its maximum. The L1 share s gives ν₁ = s(ν₂ + ν₁).
 */
export default function ShrinkagePath() {
  const { data, failed } = useShrinkageData();
  const [set, setSet] = useState<AssetSet>('osap');
  const [space, setSpace] = useState<AssetSpace>('assets');
  const [share, setShare] = useState(0);
  const [marker, setMarker] = useState<number | null>(null);
  const [path, setPath] = useState<{ key: string; points: PathPoint[] } | null>(null);
  const cache = useRef(new Map<string, PathPoint[]>());
  const key = `${set}|${space}|${share}`;

  // A path is 15 points × 4 estimates; with an L1 penalty on 108 assets it takes seconds. Start once the
  // controls rest, then compute one point per task so the page stays responsive, and keep finished paths.
  useEffect(() => {
    if (!data) return;
    const done = cache.current.get(key);
    if (done) { setPath({ key, points: done }); return; }
    const points: PathPoint[] = [];
    let id = 0;
    const step = () => {
      points.push(pathPoint(data[set], PRIOR_SCALES[points.length], share, space));
      setPath({ key, points: [...points] });
      if (points.length < PRIOR_SCALES.length) id = window.setTimeout(step, 0);
      else cache.current.set(key, points);
    };
    id = window.setTimeout(step, 250);
    return () => window.clearTimeout(id);
  }, [data, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const assets = data?.[set];
  // The penalties are known before the path: ν₂ + ν₁ of each prior scale, largest first.
  const penalties = useMemo(() => (assets ? PRIOR_SCALES.map((s) => ridgePenalty(s, assets.Sigma, assets.returns.length)) : []), [assets]);
  const points = path?.points ?? [];
  const pending = !path || path.key !== key || points.length < PRIOR_SCALES.length;
  const best = points.length ? bestIndex(points) : 0;
  const index = Math.min(marker ?? best, points.length - 1);
  const at = points[index];

  const view = useMemo(() => {
    if (!assets || !points.length) return null;
    const names = space === 'pcs' ? assets.names.map((_, j) => `PC${j + 1}`) : assets.names;
    const order = points[best].b.map((v, i) => [Math.abs(v), i]).sort((a, b) => b[0] - a[0]).slice(0, LINES).map(([, i]) => i);
    const lines = order.map((i) => ({ i, name: names[i], xy: points.map((p) => [Math.log10(p.penalty), p.b[i]] as [number, number]) }));
    const ys = lines.flatMap((l) => l.xy.map(([, y]) => y));
    const [bLo, bHi] = [Math.min(0, ...ys), Math.max(0, ...ys)];
    const bSpan = Math.max(1e-6, bHi - bLo);
    const r2 = points.map((p) => p.r2);
    return { names, lines, bLo, bHi, bSpan, r2Lo: Math.min(0, ...r2), r2Hi: Math.max(0, ...r2) };
  }, [assets, points, best, space]);

  const xLo = penalties.length ? Math.log10(penalties[LAST]) : -5;
  const xHi = penalties.length ? Math.log10(penalties[0]) : 0;
  // Headroom in both panels keeps the line numbers and the 'best' label clear of the axis titles.
  const bLo = useTweened(view ? view.bLo - 0.1 * view.bSpan : -1);
  const bHi = useTweened(view ? view.bHi + 0.3 * view.bSpan : 1);
  const r2Lo = useTweened(view ? view.r2Lo - 0.08 * (view.r2Hi - view.r2Lo + 0.1) : -1);
  const r2Hi = useTweened(view ? view.r2Hi + 0.35 * (view.r2Hi - view.r2Lo + 0.1) : 1);
  const xTicks = Array.from({ length: Math.floor(xHi) - Math.ceil(xLo) + 1 }, (_, k) => Math.ceil(xLo) + k);
  const xAt = at ? Math.log10(at.penalty) : 0;
  const spaceWord = space === 'pcs' ? 'principal components' : 'assets';
  const setWord = set === 'osap' ? '108 anomaly portfolios' : '30 FF portfolios';

  const plot = view && at ? (
    <div>
      <PlotFrame
        x={[xLo, xHi]} y={[bLo, bHi]} height={B_HEIGHT}
        xTicks={xTicks} yTicks={niceTicks(bLo, bHi, 4)}
        formatX={power} formatY={(v) => num(v, bHi - bLo < 0.2 ? 3 : bHi - bLo < 4 ? 1 : 0)}
        xLabel="penalty ν₂ + ν₁ (log scale)"
        yLabel={<tspan style={{ fill: 'var(--c-sdf)' }}>SDF coefficient b̂</tspan>}
        baseline={0}
      >
        {view.lines.map((l, k) => (
          <g key={l.i}>
            <Polyline points={l.xy} color="var(--c-sdf)" weight={2} fillOpacity={0} strokeStyle={k % 2 ? 'dashed' : 'solid'} strokeOpacity={1 - 0.15 * k} />
            <Label x={l.xy[l.xy.length - 1][0]} y={l.xy[l.xy.length - 1][1]} attach="e" attachDistance={6} size={12} color="var(--c-sdf)">{String(k + 1)}</Label>
          </g>
        ))}
        <Line.Segment point1={[xAt, bLo]} point2={[xAt, bHi]} color="var(--text)" weight={1.5} style="dashed" />
      </PlotFrame>
      <PlotFrame
        x={[xLo, xHi]} y={[r2Lo, r2Hi]} height={R2_HEIGHT}
        xTicks={xTicks} yTicks={niceTicks(r2Lo, r2Hi, 4)}
        formatX={power} formatY={(v) => num(v, r2Hi - r2Lo < 1 ? 1 : 0)}
        xLabel="penalty ν₂ + ν₁ (log scale)"
        yLabel={<tspan style={{ fill: 'var(--c-model)' }}>R²<tspan baselineShift="sub" fontSize="0.8em">CV</tspan></tspan>}
        baseline={0}
      >
        <Polyline points={points.map((p) => [Math.log10(p.penalty), p.r2] as [number, number])} color="var(--c-model)" weight={2.5} fillOpacity={0} />
        <Point x={Math.log10(points[best].penalty)} y={points[best].r2} color="var(--c-model)" svgCircleProps={{ r: 7, style: { fill: 'none', stroke: 'var(--c-model)', strokeWidth: 2 } }} />
        <Label x={Math.log10(points[best].penalty)} y={points[best].r2} attach="n" attachDistance={10} size={12} color="var(--c-model)">best</Label>
        <Line.Segment point1={[xAt, r2Lo]} point2={[xAt, r2Hi]} color="var(--text)" weight={1.5} style="dashed" />
        <Point x={xAt} y={at.r2} color="var(--text)" svgCircleProps={{ r: 4 }} />
      </PlotFrame>
    </div>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data and computing the path…'}</p>
  );

  return (
    <WidgetFrame
      title="Shrink the SDF and score it out of sample"
      ariaLabel={
        view && at && assets
          ? `Two panels against the penalty on a log scale, for the ${setWord} in the space of ${spaceWord}, with L1 share ${num(share, 1)}. Top: the ${LINES} largest SDF coefficients; they spread apart as the penalty falls and go to zero as it rises. Bottom: the cross-validated R², highest at ${num(points[best].r2, 3)} where the prior scale is ${num(points[best].priorScale, 3)} a month. The dashed marker is at penalty ${sci(at.penalty)}, with R² ${num(at.r2, 3)} and ${at.nonZero} of ${assets.names.length} coefficients not zero.`
          : 'Shrinkage path of SDF coefficients and the cross-validated R². The data is loading.'
      }
      plotHeight={B_HEIGHT + R2_HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Asset set" value={set} options={ASSET_SETS} onChange={setSet} />
          <Segmented label="Space" value={space} options={SPACES} onChange={setSpace} />
          <Slider label="L1 share $s$ (0 is ridge)" value={share} min={0} max={0.9} step={0.1} onChange={(v) => setShare(Math.round(v * 10) / 10)} format={(v) => num(v, 1)} />
          <Slider
            label="Penalty $\nu_2 + \nu_1$" value={LAST - index} min={0} max={LAST} step={1} color="var(--text)"
            onChange={(v) => setMarker(LAST - v)} format={(v) => (penalties.length ? sci(penalties[LAST - v]) : '')}
          />
        </>
      }
      readout={
        view && at && assets ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-sdf)' }}>solid and dashed lines: the {LINES} largest b̂ at the best penalty, numbered at the left</span>
              {' · '}<span style={{ color: 'var(--c-model)' }}>solid curve: cross-validated R² · ○ ring: its maximum</span>
              {' · '}<span>– – marker: the penalty slider</span>
              {pending && <> · computing the path, {path?.key === key ? points.length : 0} of {PRIOR_SCALES.length} points…</>}
            </p>
            <dl className="readout-grid">
              <dt><RichText>{'Penalty $\\nu_2 + \\nu_1$: $\\nu_2$, $\\nu_1$'}</RichText></dt>
              <dd>{sci(at.penalty)}: {sci(at.l2)}, {sci(at.l1)}</dd>
              <dt><RichText>{'Prior scale $SR_{\\text{prior}}$'}</RichText></dt>
              <dd>{num(at.priorScale, 3)} a month ({num(annualiseSharpe(at.priorScale), 2)} a year)</dd>
              <dt><RichText>{'$R^2_{CV}$ at the marker'}</RichText></dt>
              <dd style={{ color: 'var(--c-model)' }}>{num(at.r2, 3)}</dd>
              <dt><RichText>{'Best $R^2_{CV}$ on the grid'}</RichText></dt>
              <dd style={{ color: 'var(--c-model)' }}>{num(points[best].r2, 3)} at {sci(points[best].penalty)}</dd>
              <dt><RichText>{'Coefficients $\\hat b_i$ not zero'}</RichText></dt>
              <dd>{at.nonZero} of {assets.names.length}</dd>
              {view.lines.map((l, k) => (
                <Fragment key={l.i}>
                  <dt>{`b̂ ${k + 1}: ${l.name}`}</dt>
                  <dd style={{ color: 'var(--c-sdf)' }}>{num(at.b[l.i], 3)}</dd>
                </Fragment>
              ))}
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ${set === 'osap' ? 'osap-ls-monthly (Chen and Zimmermann 2022, Open Source Asset Pricing): the 108 long–short anomaly portfolios with no missing month' : "ff25-size-bm-monthly, ff5-monthly and mom-monthly (Kenneth French Data Library): the 25 size–B/M portfolios less RF, with SMB, HML, RMW, CMA and Mom, each rescaled to the market's volatility"}, ${assets ? `${assets.dates[0].slice(0, 7)} to ${assets.dates.at(-1)!.slice(0, 7)}` : ''}, monthly, with the market (Mkt-RF) removed by a full-sample beta. The penalty grid is 15 prior scales $SR_{\\text{prior}}$ from 0.01 to 1.26 a month, $\\nu_2 + \\nu_1 = \\operatorname{tr}\\Sigma/(SR^2_{\\text{prior}}T)$, with $\\nu_1 = s(\\nu_2 + \\nu_1)$. $R^2_{CV}$ uses $K_{CV} = 3$ blocks of consecutive months. PCs are rotated once on the whole sample.`}
    />
  );
}
