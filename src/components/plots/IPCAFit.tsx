import { Point, Polyline } from 'mafs';
import { useEffect, useMemo, useState } from 'react';
import { Button, Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import {
  ALPHA_SHARE_RANGE, ALPHA_SHARE_STEP, alphaView, BOOTSTRAPS, CHARACTERISTICS, DEFAULT_ALPHA_SHARE, DEFAULT_K, DEFAULT_SEED,
  FIT_KS, ipcaWorld, PANEL, restrictedView, type AlphaView, type FitK,
} from './ipcaSample';
import { Label, PlotFrame } from './PlotFrame';

const PATH_HEIGHT = 230;
const MAP_HEIGHT = 250;
/** Shading bands of |value|, each 0.2 wide: the columns of Γ_β have unit length, so no entry passes 1. */
const BANDS = 5;
const shade = (band: number) => 0.06 + (0.6 * band) / (BANDS - 1);
const bandOf = (v: number) => Math.min(BANDS - 1, Math.floor(Math.abs(v) / (1 / BANDS)));

const SUBSCRIPT = '₀₁₂₃₄₅₆₇₈₉';
const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const power = (k: number) => `10${k < 0 ? '⁻' : ''}${String(Math.abs(k)).split('').map((d) => SUPERSCRIPT[Number(d)]).join('')}`;
const num = (v: number, digits = 3) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const pct = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
/** 2.4 × 10⁻⁶ */
const sci = (v: number) => {
  if (v === 0) return '0';
  const k = Math.floor(Math.log10(v));
  return `${(v / 10 ** k).toFixed(1)} × ${power(k)}`;
};

interface Params { K: FitK; alphaShare: number; seed: number }
interface Cell { map: 'true' | 'estimate'; row: number; col: number }

const CELL = { width: 40, height: 44 };
const mapStyle = { display: 'grid', gap: 1, alignContent: 'start' } as const;
const titleStyle = { height: 26, fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' } as const;
const headStyle = { height: 22, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' } as const;

/** One heat map of a dim z × K loading matrix: shading by |value| in bands, a sign in every cell, the value on hover or focus. */
function LoadingMap({ name, matrix, hat, active, onSelect }: {
  name: Cell['map']; matrix: number[][]; hat: boolean; active: Cell | null; onSelect: (cell: Cell | null) => void;
}) {
  const K = matrix[0].length;
  const factor = (k: number) => `f${hat ? '\u0302' : ''}${SUBSCRIPT[k + 1]}`;
  return (
    <div style={{ ...mapStyle, gridTemplateColumns: `repeat(${K}, ${CELL.width}px)` }}>
      <div style={{ ...titleStyle, gridColumn: `1 / span ${K}` }}>
        <RichText>{hat ? 'estimate $\\hat\\Gamma_\\beta$' : 'true $\\Gamma_\\beta$'}</RichText>
      </div>
      {matrix[0].map((_, k) => <div key={`h${k}`} style={headStyle}>{factor(k)}</div>)}
      {matrix.map((row, l) => row.map((v, k) => {
        const selected = active?.map === name && active.row === l && active.col === k;
        const label = `${hat ? 'Estimated' : 'True'} loading of ${CHARACTERISTICS[l]} on factor ${k + 1}: ${num(v)}`;
        return (
          <div key={`${l}-${k}`} tabIndex={0} aria-label={label} title={label}
            style={{
              position: 'relative', height: CELL.height, display: 'grid', placeItems: 'center', borderRadius: 3,
              outline: selected ? '2px solid var(--ui-accent)' : 'none', outlineOffset: -2,
            }}
            onMouseEnter={() => onSelect({ map: name, row: l, col: k })} onMouseLeave={() => onSelect(null)}
            onFocus={() => onSelect({ map: name, row: l, col: k })} onBlur={() => onSelect(null)}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: 3, background: 'var(--c-data)', opacity: shade(bandOf(v)) }} />
            <span style={{ position: 'relative', fontWeight: 600, color: 'var(--text)' }}>{v < 0 ? '−' : '+'}</span>
          </div>
        );
      }))}
    </div>
  );
}

/**
 * Chapter 32: instrumented PCA on the seeded panel of simulateIpcaPanel. Top: the ALS objective after each
 * iteration, as its distance above the converged value on a log scale, stepped with a button. Bottom: the true
 * Γ_β next to the restricted estimate as two heat maps. Controls pick the number of fitted factors K, the alpha
 * share of the panel and the seed. The readout gives the iterations, the total and predictive R², and W_α
 * with its bootstrap p-value, computed once the controls rest.
 */
export default function IPCAFit() {
  const [params, setParams] = useState<Params>({ K: DEFAULT_K, alphaShare: DEFAULT_ALPHA_SHARE, seed: DEFAULT_SEED });
  const [shown, setShown] = useState<number | null>(null);
  const [active, setActive] = useState<Cell | null>(null);
  const [alpha, setAlpha] = useState<{ params: Params; view: AlphaView } | null>(null);

  const world = useMemo(() => ipcaWorld(params.seed, params.alphaShare), [params.seed, params.alphaShare]);
  const restricted = useMemo(() => restrictedView(world, params.K), [world, params.K]);
  useEffect(() => setShown(null), [restricted]);

  // 200 bootstrap refits take a second or more: run them once the controls rest.
  useEffect(() => {
    const id = setTimeout(() => setAlpha({ params, view: alphaView(world, params.K, params.seed) }), alpha ? 250 : 0);
    return () => clearTimeout(id);
  }, [world, params]); // eslint-disable-line react-hooks/exhaustive-deps

  const { fit, r2, gap } = restricted;
  const iterations = fit.history.objective.length;
  const step = shown ?? iterations;
  const points = gap.slice(0, step).map((g, j) => [j + 1, g] as const).filter(([, g]) => g > 0).map(([j, g]) => [j, Math.log10(g)] as [number, number]);
  const all = gap.filter((g) => g > 0).map(Math.log10);
  // One spare decade at the top keeps the axis title clear of the first point.
  const yHi = useTweened(all.length ? Math.ceil(Math.max(...all)) + 1 : 0);
  const yLo = useTweened(all.length ? Math.floor(Math.min(...all)) : -1);
  const xHi = Math.max(iterations, 2);
  const yTicks = Array.from({ length: Math.round(yHi) - Math.round(yLo) + 1 }, (_, i) => Math.round(yLo) + i)
    .filter((k, _, ks) => ks.length <= 7 || (k - Math.round(yLo)) % 2 === 0);
  const current = points.at(-1);
  const pending = !alpha || alpha.params !== params;
  const rejected = alpha && alpha.view.test.pValue < 0.05;

  const cell = active && (active.map === 'true' ? world.panel.gammaBeta : fit.gammaBeta)[active.row]?.[active.col];
  const truth = active?.map === 'estimate' && active.col < PANEL.K ? world.panel.gammaBeta[active.row][active.col] : undefined;

  const plot = (
    <div>
      <PlotFrame
        x={[0, xHi]}
        y={[yLo, yHi]}
        height={PATH_HEIGHT}
        xTicks={[0, Math.round(xHi / 2), xHi]}
        yTicks={yTicks}
        formatX={(v) => String(v)}
        formatY={(v) => power(Math.round(v))}
        xLabel="ALS iteration"
        yLabel="objective above its final value"
        marginLeft={56}
      >
        {points.length > 1 && <Polyline points={points} color="var(--c-model)" weight={2.5} fillOpacity={0} />}
        {points.map(([x, y]) => <Point key={x} x={x} y={y} color="var(--c-model)" svgCircleProps={{ r: 3 }} />)}
        {current && (
          <Label x={current[0]} y={current[1]} attach={current[0] > xHi * 0.6 ? 'nw' : 'ne'} attachDistance={8} size={12} color="var(--c-model)">
            {`iteration ${current[0]}`}
          </Label>
        )}
      </PlotFrame>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', padding: '0.6rem 0.4rem', minHeight: MAP_HEIGHT }}>
        <div style={{ ...mapStyle, gridTemplateColumns: 'auto' }}>
          <div style={titleStyle} />
          <div style={headStyle} />
          {CHARACTERISTICS.map((c) => (
            <div key={c} style={{ height: CELL.height, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c}</div>
          ))}
        </div>
        <LoadingMap name="true" matrix={world.panel.gammaBeta} hat={false} active={active} onSelect={setActive} />
        <LoadingMap name="estimate" matrix={fit.gammaBeta} hat active={active} onSelect={setActive} />
      </div>
    </div>
  );

  return (
    <WidgetFrame
      title="Instrumented PCA, fitted by alternating least squares"
      ariaLabel={`Top: the objective of the restricted IPCA fit with ${params.K} factor${params.K > 1 ? 's' : ''} after each alternating-least-squares iteration, as its distance above the final value on a log scale; it converges in ${iterations} iterations. Bottom: heat maps of the true Γβ (4 characteristics by 2 factors) and the estimate (4 by ${params.K}); stronger shading means a larger absolute loading, and each cell shows its sign. Total R² ${pct(r2.total)}, predictive R² ${pct(r2.predictive)}.`}
      plotHeight={PATH_HEIGHT + MAP_HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented<string>
            label="Number of factors K"
            value={String(params.K)}
            options={FIT_KS.map((k) => ({ value: String(k), label: `K = ${k}` }))}
            onChange={(v) => setParams((p) => ({ ...p, K: Number(v) as FitK }))}
          />
          <Slider label="Alpha share of the panel" value={params.alphaShare} min={ALPHA_SHARE_RANGE[0]} max={ALPHA_SHARE_RANGE[1]} step={ALPHA_SHARE_STEP}
            onChange={(alphaShare) => setParams((p) => ({ ...p, alphaShare }))} format={(v) => pct(v, 1)} />
          <Button onClick={() => setShown(step >= iterations ? 1 : step + 1)}>{step >= iterations ? 'Step from iteration 1' : 'Next iteration'}</Button>
          <Button onClick={() => setParams((p) => ({ ...p, seed: p.seed + 1 }))}>New panel</Button>
        </>
      }
      readout={
        <>
          <p>
            <span style={{ color: 'var(--c-model)' }}>●— objective, one dot per iteration</span>{' · '}
            <span aria-hidden="true">
              {Array.from({ length: BANDS }, (_, b) => (
                <span key={b} style={{ display: 'inline-block', width: '0.8em', height: '0.8em', marginRight: 1, verticalAlign: '-0.1em', background: 'var(--c-data)', opacity: shade(b) }} />
              ))}
            </span>
            {' '}|loading| from 0 (faint) to 1 (strong), sign in each cell
          </p>
          <p>
            {cell === undefined || cell === null || !active
              ? 'Hover over or focus a cell to read its value.'
              : `${active.map === 'true' ? 'True' : 'Estimated'} loading of ${CHARACTERISTICS[active.row]} on factor ${active.col + 1}: ${num(cell)}${truth === undefined ? '' : ` (true ${num(truth)})`}`}
          </p>
          <dl className="readout-grid">
            <dt>Iterations to converge</dt>
            <dd>{iterations}{fit.converged ? '' : ' (not converged)'}{shown !== null && <>; showing {step}</>}</dd>
            <dt><RichText>{'$R^2_{\\text{total}}$, with $\\Gamma_\\alpha = 0$'}</RichText></dt>
            <dd style={{ color: 'var(--c-model)' }}>{pct(r2.total)}</dd>
            <dt><RichText>{'$R^2_{\\text{pred}}$, with $\\Gamma_\\alpha = 0$'}</RichText></dt>
            <dd style={{ color: 'var(--c-model)' }}>{pct(r2.predictive)}</dd>
            <dt><RichText>{`$W_\\alpha$; $p$ from ${BOOTSTRAPS} bootstraps`}</RichText></dt>
            <dd>{alpha ? `${sci(alpha.view.test.wAlpha)}; p = ${alpha.view.test.pValue.toFixed(3)}` : 'bootstrapping…'}{alpha && pending && ' (updating…)'}</dd>
            <dt><RichText>{'$\\Gamma_\\alpha = 0$ at 5%'}</RichText></dt>
            <dd className={alpha && !pending ? (rejected ? 'bad' : 'good') : undefined}>{alpha && !pending ? (rejected ? 'rejected' : 'not rejected') : '…'}</dd>
            <dt>Panel seed</dt>
            <dd>{params.seed}</dd>
          </dl>
        </>
      }
      caption={`Simulated (seeded) with simulateIpcaPanel: $N = ${PANEL.N}$ firms, $T = ${PANEL.T}$ months, $\\dim z = ${PANEL.dimZ}$ (a constant and three characteristics, each a persistent AR(1) per firm, rank-transformed every month to $[-0.5, 0.5]$), ${PANEL.K} true factors with monthly volatilities of 5% and 2.5%, and noise of volatility ${PANEL.noise} a month. The alpha share is the part of the panel's sum of squared returns that comes from $z_{it}'\\Gamma_\\alpha$. The objective is shown as a share of $\\sum_{i,t}(R^e_{i,t+1})^2$; its last iteration is zero and so is not drawn. The estimate is the restricted fit, normalised so that $\\hat\\Gamma_\\beta'\\hat\\Gamma_\\beta = I$. A seeded panel shows how the method works, not what it finds in real stocks.`}
    />
  );
}
