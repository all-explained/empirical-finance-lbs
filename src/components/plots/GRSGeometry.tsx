import { Line, Point, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import type { FactorModel } from '../../lib/finance/timeSeriesTests';
import { Segmented, Select } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { DEFAULT_START, factorTest, frontierPicture, MODELS, STARTS, useFactorData, type Start } from './factorTestSample';
import { niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 340;
const X_MAX = 0.3;
const Y: [number, number] = [-0.05, 0.45];
const SD_GRID = Array.from({ length: 151 }, (_, i) => (i / 150) * X_MAX);
/** Where the gap between the two tangent lines is marked. */
const X_GAP = 0.1;
const pct = (v: number) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(0)}%`;
const SHORT = { 'Mkt-RF': 'Mkt', SMB: 'SMB', HML: 'HML' } as Record<string, string>;

/** Points of one branch inside the plot. */
const branch = (sd: number[], mean: number[]) =>
  sd.flatMap((s, i) => (Number.isFinite(mean[i]) && mean[i] >= Y[0] && mean[i] <= Y[1] ? [[s, mean[i]] as [number, number]] : []));
/** End of a line from the origin with this slope, where it leaves the plot. */
const lineEnd = (slope: number): [number, number] => {
  const x = Math.min(X_MAX, Y[1] / slope);
  return [x, slope * x];
};

/**
 * Chapter 16: the mean–volatility frontier of the factors alone and of the factors plus the 25 test assets,
 * their tangent lines from the origin, and the Sharpe-ratio gap that GRS measures.
 */
export default function GRSGeometry({ initialModel = 'ff3' }: { initialModel?: FactorModel }) {
  const [model, setModel] = useState<FactorModel>(initialModel);
  const [start, setStart] = useState<Start>(DEFAULT_START);
  const { data, failed } = useFactorData();

  const view = useMemo(
    () => (data ? { picture: frontierPicture(data, model, start, SD_GRID), test: factorTest(data, model, start) } : null),
    [data, model, start],
  );
  const srF = useTweened(view?.picture.sharpeFactors ?? 0.5);
  const srAll = useTweened(view?.picture.sharpeAll ?? 1);

  const plot = view ? (() => {
    const { picture: p } = view;
    const factorCurve = [...branch(p.sd, p.factors.lower).reverse(), ...branch(p.sd, p.factors.upper)];
    const allCurve = [...branch(p.sd, p.all.lower).reverse(), ...branch(p.sd, p.all.upper)];
    const endF = lineEnd(srF);
    const endAll = lineEnd(srAll);
    return (
      <PlotFrame
        x={[0, X_MAX]}
        y={Y}
        height={HEIGHT}
        xTicks={niceTicks(0, X_MAX, 6)}
        yTicks={niceTicks(Y[0], Y[1], 6).filter((v) => v < Y[1])}
        formatX={pct}
        formatY={pct}
        xLabel="volatility, % a year"
        yLabel="mean excess return, % a year"
        baseline={0}
        marginLeft={44}
      >
        {allCurve.length > 1 && <Polyline points={allCurve} color="var(--c-return)" weight={2.5} fillOpacity={0} />}
        {factorCurve.length > 1 && <Polyline points={factorCurve} color="var(--c-factor)" weight={2.5} fillOpacity={0} />}
        <Line.Segment point1={[0, 0]} point2={endAll} color="var(--c-return)" weight={2} style="dashed" />
        <Line.Segment point1={[0, 0]} point2={endF} color="var(--c-factor)" weight={2} style="dashed" />
        <Line.Segment point1={[X_GAP, srF * X_GAP]} point2={[X_GAP, srAll * X_GAP]} color="var(--c-error)" weight={4} />
        <Label x={X_GAP} y={(srF + srAll) * X_GAP / 2} attach="e" attachDistance={8} size={12} color="var(--c-error)">gap</Label>
        <Label x={endAll[0]} y={endAll[1]} attach="w" attachDistance={8} size={12} color="var(--c-return)">{`all: ${srAll.toFixed(2)}`}</Label>
        <Label x={endF[0]} y={endF[1]} attach="nw" attachDistance={8} size={12} color="var(--c-factor)">{`factors: ${srF.toFixed(2)}`}</Label>
        {p.assets.map((a, i) => (
          <Point key={i} x={a.sd} y={a.mean} color="var(--c-return)" opacity={0.7} svgCircleProps={{ r: 3 }} />
        ))}
        {p.factorPoints.map((f) => (
          <g key={f.name}>
            <Point x={f.sd} y={f.mean} color="var(--c-factor)" svgCircleProps={{ r: 6, style: { fill: 'none', stroke: 'var(--c-factor)', strokeWidth: 2 } }} />
            <Label x={f.sd} y={f.mean} attach="se" attachDistance={8} size={12} color="var(--c-factor)">{SHORT[f.name]}</Label>
          </g>
        ))}
      </PlotFrame>
    );
  })() : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const t = view?.test;
  const g = t?.grs;
  return (
    <WidgetFrame
      title="The Sharpe ratio the test assets add"
      ariaLabel={
        view && t && g
          ? `Mean excess return against volatility, in percent a year, ${t.first} to ${t.last}. Small dots are the 25 size and book-to-market portfolios; rings are the ${t.K === 1 ? 'market' : 'three factors'}. ${t.K === 1 ? 'The factor set is the market alone, one point,' : 'A curve shows the frontier of the factors alone,'} and its dashed tangent line from the origin has slope ${view.picture.sharpeFactors.toFixed(2)}. A second curve shows the frontier of the factors plus the 25 portfolios, with a steeper dashed tangent line of slope ${view.picture.sharpeAll.toFixed(2)}. A thick vertical bar marks the gap between the two lines. GRS is ${g.statistic.toFixed(2)}.`
          : 'Two mean–volatility frontiers and their tangent lines. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Model" value={model} onChange={setModel} options={MODELS.map((m) => ({ ...m, color: 'var(--c-factor)' }))} />
          <Select label="Sample starts" value={start} onChange={setStart} options={STARTS.map((s) => ({ value: s.value, label: s.label }))} />
        </>
      }
      readout={
        view && t && g ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-factor)' }}>○ rings and curve: factors only</span> ·{' '}
              <span style={{ color: 'var(--c-return)' }}>● dots and curve: factors plus 25 portfolios</span> · – – dashed: tangent lines
            </p>
            <dl className="readout-grid">
              <dt><RichText>{'$SR_f$, a year'}</RichText></dt>
              <dd style={{ color: 'var(--c-factor)' }}>{view.picture.sharpeFactors.toFixed(2)}</dd>
              <dt><RichText>{'$SR_{\\text{all}}$, a year'}</RichText></dt>
              <dd style={{ color: 'var(--c-return)' }}>{view.picture.sharpeAll.toFixed(2)}</dd>
              <dt><RichText>{"$\\Err{\\hat\\alpha}'\\hat\\Sigma_\\varepsilon^{-1}\\Err{\\hat\\alpha}$, a month"}</RichText></dt>
              <dd style={{ color: 'var(--c-error)' }}>{t.alphaQuadratic.toFixed(3)}</dd>
              <dt><RichText>{'$SR^2_{\\text{all}} - SR^2_f$, a month'}</RichText></dt>
              <dd>{g.sharpeAll2.toFixed(3)} − {g.sharpeFactors2.toFixed(3)} = {(g.sharpeAll2 - g.sharpeFactors2).toFixed(3)}</dd>
              <dt>GRS</dt>
              <dd><RichText>{`$\\tfrac{${g.df2}}{${g.df1}} \\times \\tfrac{${t.alphaQuadratic.toFixed(3)}}{1 + ${g.sharpeFactors2.toFixed(3)}} = ${g.statistic.toFixed(2)}$`}</RichText></dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ff25-size-bm-monthly and ff3-monthly (Kenneth French Data Library), ${t ? `${t.first} to ${t.last}` : 'from the chosen start to 2026-08'}. Excess returns; means ×12, volatilities ×√12, Sharpe ratios ×√12. Frontiers and Sharpe ratios use sample moments with divisor $T$, as GRS does. The risk-free asset sits at the origin, so the slope of each tangent line is the highest Sharpe ratio of its set. With the CAPM the factor set is the market alone: one point, no curve.`}
    />
  );
}
