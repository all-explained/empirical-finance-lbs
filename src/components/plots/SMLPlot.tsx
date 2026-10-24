import { Line, Point } from 'mafs';
import { useMemo, useState } from 'react';
import { factorPanel, type FactorModel } from '../../lib/finance/timeSeriesTests';
import { annualiseMean } from '../../lib/stats/moments';
import { Segmented, Select } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { capmSample, PERIODS, smlView, useCapmData, type Period, type Portfolio } from './capmSample';
import { twoPass } from './famaMacBethSample';
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
 * With `fitted` (Chapter 17): actual against fitted mean excess returns β̂_i'λ̂ from the
 * second-pass OLS regression without an intercept, for the CAPM or FF3.
 */
export default function SMLPlot({ initialPeriod = 'post1963', fitted = false }: { initialPeriod?: Period; fitted?: boolean }) {
  return fitted ? <FittedPlot initialPeriod={initialPeriod} /> : <BetaPlot initialPeriod={initialPeriod} />;
}

function BetaPlot({ initialPeriod }: { initialPeriod: Period }) {
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

function FittedPlot({ initialPeriod }: { initialPeriod: Period }) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [model, setModel] = useState<FactorModel>('capm');
  const [pick, setPick] = useState<Portfolio>('ME1-BM1');
  const { data, failed } = useCapmData();

  const view = useMemo(() => {
    if (!data) return null;
    const panel = factorPanel(data.ff3, data.ff25, { start: PERIODS[period].start, model });
    const fit = twoPass(panel, { intercept: false, weighting: 'ols' });
    return {
      names: panel.names,
      factorNames: panel.factorNames,
      fitted: fit.fitted.map((v) => annualiseMean(v)),
      actual: fit.meanExcess.map((v) => annualiseMean(v)),
      alpha: fit.alpha.map((v) => annualiseMean(v)),
      lambda: fit.lambda.map((v) => annualiseMean(v)),
      r2: fit.r2,
      first: panel.dates[0].slice(0, 7),
      last: panel.dates.at(-1)!.slice(0, 7),
      months: panel.dates.length,
    };
  }, [data, period, model]);

  const [lo, hi] = view ? extent([...view.fitted, ...view.actual, 0]) : [0, 0.16];
  const low = useTweened(lo - 0.01);
  // Headroom keeps the axis title clear of the highest dot.
  const high = useTweened(hi + 0.03);
  const j = view ? view.names.indexOf(pick) : -1;
  const sg = view ? view.names.indexOf('ME1-BM1') : -1;
  const sv = view ? view.names.indexOf('ME1-BM5') : -1;
  const label = model === 'ff3' ? 'FF3' : 'CAPM';

  const plot = view ? (
    <PlotFrame
      x={[low, high]}
      y={[low, high]}
      height={HEIGHT}
      xTicks={niceTicks(low, high, 5)}
      yTicks={niceTicks(low, high, 6)}
      formatX={(v) => pct(v, 0)}
      formatY={(v) => pct(v, 0)}
      xLabel={<tspan style={{ fill: 'var(--c-model)' }}>{`fitted β̂ᵢ′λ̂, ${label}, % a year`}</tspan>}
      yLabel={<tspan style={{ fill: 'var(--c-data)' }}>average excess return, % a year</tspan>}
      baseline={low < 0 && high > 0 ? 0 : undefined}
      marginLeft={44}
    >
      {view.fitted.map((f, i) => (
        <Line.Segment key={`a${i}`} point1={[f, view.actual[i]]} point2={[f, f]} color="var(--c-error)" weight={1.5} opacity={0.6} />
      ))}
      <Line.Segment point1={[low, low]} point2={[high, high]} color="var(--c-model)" weight={2.5} />
      {view.fitted.map((f, i) => (
        <Point key={`p${i}`} x={f} y={view.actual[i]} color="var(--c-data)" opacity={0.9} svgCircleProps={{ r: 4 }} />
      ))}
      <Point x={view.fitted[j]} y={view.actual[j]} color="var(--c-data)" svgCircleProps={{ r: 9, style: { fill: 'none', stroke: 'var(--c-data)', strokeWidth: 2 } }} />
      <Label x={view.fitted[sg]} y={view.actual[sg]} attach="e" attachDistance={10} size={12} color="var(--text-muted)">small growth</Label>
      <Label x={view.fitted[sv]} y={view.actual[sv]} attach="n" attachDistance={10} size={12} color="var(--text-muted)">small value</Label>
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  return (
    <WidgetFrame
      title="Does the model fit average returns?"
      ariaLabel={
        view
          ? `Scatter of the 25 size and book-to-market portfolios, ${view.first} to ${view.last}: ${label} fitted mean excess return from ${pct(Math.min(...view.fitted))} to ${pct(Math.max(...view.fitted))} a year across, actual average excess return from ${pct(Math.min(...view.actual))} to ${pct(Math.max(...view.actual))} up. The solid 45-degree line is a perfect fit. Vertical lines from each dot to it are the pricing errors, from ${pct(Math.min(...view.alpha))} to ${pct(Math.max(...view.alpha))} a year. The cross-sectional R squared is ${num(view.r2)}.`
          : 'Scatter of actual against fitted average excess returns for 25 portfolios. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Model" value={model} onChange={setModel} options={[
            { value: 'capm', label: 'CAPM' },
            { value: 'ff3', label: 'Fama–French 3' },
          ]} />
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
            <span style={{ color: 'var(--c-model)' }}>solid line: fitted = actual</span> ·{' '}
            <span style={{ color: 'var(--c-error)' }}>thin lines: pricing errors</span>
          </p>
          <dl className="readout-grid">
            <dt><RichText>{'Premia $\\hat\\lambda$'}</RichText></dt>
            <dd style={{ color: 'var(--c-model)' }}>{view.factorNames.map((f, k) => `${f} ${pct(view.lambda[k])}`).join(', ')} a year</dd>
            <dt>Cross-sectional R²</dt>
            <dd>{num(view.r2)}</dd>
            <dt>Ringed: {pick}</dt>
            <dd>{describe(pick)}</dd>
            <dt><RichText>{'Fitted $\\Model{\\hat\\beta_i\'\\hat\\lambda}$'}</RichText></dt>
            <dd style={{ color: 'var(--c-model)' }}>{pct(view.fitted[j])}</dd>
            <dt><RichText>{'Actual $\\Data{\\bar R^e_i}$'}</RichText></dt>
            <dd style={{ color: 'var(--c-data)' }}>{pct(view.actual[j])}</dd>
            <dt><RichText>{'Pricing error $\\Err{\\hat\\alpha_i}$'}</RichText></dt>
            <dd style={{ color: 'var(--c-error)' }}>{pct(view.alpha[j])}</dd>
            <dt>Months</dt>
            <dd>{view.months}</dd>
          </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ff25-size-bm-monthly and ff3-monthly (Kenneth French Data Library), ${view ? `${view.first} to ${view.last}` : PERIODS[period].label}. First pass: OLS of each portfolio's monthly excess return on ${model === 'ff3' ? 'Mkt-RF, SMB and HML' : 'Mkt-RF'}. Second pass: OLS of the 25 mean excess returns on the betas, with no intercept. Means ×12 to annualise. R² = 1 − Σα̂² / Σ(R̄ − mean R̄)², so it can be negative. It has no standard error here and is not a test.`}
    />
  );
}
