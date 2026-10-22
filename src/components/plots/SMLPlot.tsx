import { Line, Point } from 'mafs';
import { useMemo, useState } from 'react';
import { Segmented, Select } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { capmSample, PERIODS, smlView, useCapmData, type Period, type Portfolio } from './capmSample';
import { extent, niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 340;
const SIZE = ['small', 'size 2', 'size 3', 'size 4', 'big'];
const BM = ['growth', 'B/M 2', 'B/M 3', 'B/M 4', 'value'];
const describe = (name: Portfolio) => {
  const [, me, bm] = name.match(/ME(\d)-BM(\d)/)!.map(Number);
  return `${SIZE[me - 1]}, ${BM[bm - 1]}`;
};
const pct = (v: number, digits = 1) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;

/**
 * Chapter 7: average excess return against CAPM beta for the 25 size–B/M portfolios,
 * with the CAPM line E[R^e_i] = β_i E[R^e_m], the fitted cross-sectional line and the alphas.
 */
export default function SMLPlot({ initialPeriod = 'post1963' }: { initialPeriod?: Period }) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [pick, setPick] = useState<Portfolio>('ME1-BM1');
  const { data, failed } = useCapmData();

  const view = useMemo(() => {
    if (!data) return null;
    const s = capmSample(data.ff3, data.ff25, PERIODS[period].start);
    return { ...smlView(s), names: s.names, first: s.dates[0].slice(0, 7), last: s.dates.at(-1)!.slice(0, 7), months: s.dates.length };
  }, [data, period]);

  const [bLo, bHi] = view ? extent(view.beta) : [0.8, 1.6];
  const [mLo, mHi] = view ? extent([...view.meanExcess, ...view.beta.map((b) => b * view.premium), 0]) : [0, 0.16];
  const x0 = Math.floor(bLo * 10) / 10 - 0.05;
  const x1 = Math.ceil(bHi * 10) / 10 + 0.05;
  const bottom = useTweened(mLo - 0.01);
  // Headroom keeps the axis title clear of the highest dot.
  const top = useTweened(mHi + 0.03);
  const j = view ? view.names.indexOf(pick) : -1;
  const capm = (b: number) => (view ? b * view.premium : 0);
  const fitted = (b: number) => (view ? view.fit.intercept + view.fit.slope * b : 0);
  const sg = view ? view.names.indexOf('ME1-BM1') : -1;
  const sv = view ? view.names.indexOf('ME1-BM5') : -1;

  const plot = view ? (
    <PlotFrame
      x={[x0, x1]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={niceTicks(x0, x1, 5)}
      yTicks={niceTicks(bottom, top, 6)}
      formatX={(v) => num(v, 1)}
      formatY={(v) => pct(v, 0)}
      xLabel="CAPM beta β"
      yLabel={<tspan style={{ fill: 'var(--c-data)' }}>average excess return, % a year</tspan>}
      baseline={bottom < 0 && top > 0 ? 0 : undefined}
      marginLeft={44}
    >
      {view.beta.map((b, i) => (
        <Line.Segment key={`a${i}`} point1={[b, view.meanExcess[i]]} point2={[b, capm(b)]} color="var(--c-error)" weight={1.5} opacity={0.6} />
      ))}
      <Line.Segment point1={[x0, capm(x0)]} point2={[x1, capm(x1)]} color="var(--c-model)" weight={2.5} />
      <Line.Segment point1={[x0, fitted(x0)]} point2={[x1, fitted(x1)]} color="var(--c-model)" weight={2} style="dashed" opacity={0.8} />
      {view.beta.map((b, i) => (
        <Point key={`p${i}`} x={b} y={view.meanExcess[i]} color="var(--c-data)" opacity={0.9} svgCircleProps={{ r: 4 }} />
      ))}
      <Point x={view.beta[j]} y={view.meanExcess[j]} color="var(--c-data)" svgCircleProps={{ r: 9, style: { fill: 'none', stroke: 'var(--c-data)', strokeWidth: 2 } }} />
      <Label x={view.beta[sg]} y={view.meanExcess[sg]} attach="w" attachDistance={10} size={12} color="var(--text-muted)">small growth</Label>
      <Label x={view.beta[sv]} y={view.meanExcess[sv]} attach="n" attachDistance={10} size={12} color="var(--text-muted)">small value</Label>
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  return (
    <WidgetFrame
      title="Does beta line up with average returns?"
      ariaLabel={
        view
          ? `Scatter of the 25 size and book-to-market portfolios, ${view.first} to ${view.last}: CAPM beta from ${num(Math.min(...view.beta))} to ${num(Math.max(...view.beta))} across, average excess return from ${pct(Math.min(...view.meanExcess))} to ${pct(Math.max(...view.meanExcess))} a year up. The solid CAPM line has slope ${pct(view.premium)} per unit of beta and passes through zero. The dashed fitted line has slope ${pct(view.fit.slope)} and intercept ${pct(view.fit.intercept)}. Vertical lines from each dot to the CAPM line are the alphas, from ${pct(Math.min(...view.alpha))} to ${pct(Math.max(...view.alpha))} a year.`
          : 'Scatter of average excess return against beta for 25 portfolios. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Sample" value={period} onChange={setPeriod} options={[
            { value: 'post1963', label: PERIODS.post1963.label },
            { value: 'full', label: PERIODS.full.label },
          ]} />
          <Select label="Ringed portfolio" value={pick} onChange={setPick} options={(view?.names ?? ['ME1-BM1' as Portfolio]).map((name) => ({ value: name, label: `${name}: ${describe(name)}` }))} />
        </>
      }
      readout={
        view ? (
          <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--c-data)' }}>● dots: data</span> ·{' '}
            <span style={{ color: 'var(--c-model)' }}>solid line: CAPM · – – dashed: fitted line</span> ·{' '}
            <span style={{ color: 'var(--c-error)' }}>thin lines: alphas</span>
          </p>
          <dl className="readout-grid">
            <dt><RichText>{'CAPM slope $\\mathbb{E}[R^e_m]$'}</RichText></dt>
            <dd style={{ color: 'var(--c-model)' }}>{pct(view.premium)} a year</dd>
            <dt>Fitted line</dt>
            <dd style={{ color: 'var(--c-model)' }}>{pct(view.fit.intercept)} {view.fit.slope < 0 ? '−' : '+'} {pct(Math.abs(view.fit.slope))} × β</dd>
            <dt>Ringed: {pick}</dt>
            <dd>{describe(pick)}</dd>
            <dt><RichText>{'Its beta $\\hat\\beta_i$'}</RichText></dt>
            <dd>{num(view.beta[j])}</dd>
            <dt><RichText>{'Its average $\\Data{\\bar R^e_i}$ (± 1 s.e.)'}</RichText></dt>
            <dd style={{ color: 'var(--c-data)' }}>{pct(view.meanExcess[j])} ± {pct(view.meanSE[j])}</dd>
            <dt>CAPM prediction</dt>
            <dd style={{ color: 'var(--c-model)' }}>{pct(capm(view.beta[j]))}</dd>
            <dt><RichText>{'Alpha $\\Err{\\hat\\alpha_i}$ ($t$-stat)'}</RichText></dt>
            <dd style={{ color: 'var(--c-error)' }}>{pct(view.alpha[j])} (t = {num(view.alphaT[j])})</dd>
            <dt>Months</dt>
            <dd>{view.months}</dd>
          </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ff25-size-bm-monthly and ff3-monthly (Kenneth French Data Library), ${view ? `${view.first} to ${view.last}` : PERIODS[period].label}. Excess return = portfolio return − RF. Beta and alpha: OLS of each portfolio's monthly excess return on Mkt-RF. Means and alphas ×12 to annualise; classical standard errors. This picture is not a formal test: Chapters 16 and 17 test the CAPM properly.`}
    />
  );
}
