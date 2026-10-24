import { Line, Point } from 'mafs';
import { useMemo, useState } from 'react';
import type { FactorModel } from '../../lib/finance/timeSeriesTests';
import { Segmented, Select } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { DEFAULT_START, factorTest, MODELS, STARTS, useFactorData, type Start } from './factorTestSample';
import { extent, niceTicks } from './format';
import { PlotFrame } from './PlotFrame';

const HEIGHT = 320;
const SIZE = ['small', 'ME2', 'ME3', 'ME4', 'big'];
// Portfolio j is ME(⌊j/5⌋+1)-BM(j mod 5 + 1): size groups of five, book-to-market rising inside each.
const xOf = (j: number) => Math.floor(j / 5) * 6 + (j % 5);
const X: [number, number] = [-1, 29];
const pct = (v: number, digits = 1) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const pValue = (p: number) => (p < 0.001 ? `$p = ${p.toExponential(1).replace(/e([+-])(\d+)/, (_, s, d) => ` \\times 10^{${s === '-' ? '-' : ''}${d}}`)}$` : `$p = ${p.toFixed(3)}$`);

/**
 * Chapter 16: the annualised alpha of each of the 25 size–B/M portfolios with its 95% confidence bar,
 * for the CAPM or FF3, and the GRS test that all 25 alphas are zero.
 */
export default function AlphaBars({ initialModel = 'capm', initialStart = DEFAULT_START }: { initialModel?: FactorModel; initialStart?: Start }) {
  const [model, setModel] = useState<FactorModel>(initialModel);
  const [start, setStart] = useState<Start>(initialStart);
  const { data, failed } = useFactorData();

  const tests = useMemo(() => (data ? { capm: factorTest(data, 'capm', start), ff3: factorTest(data, 'ff3', start) } : null), [data, start]);
  const view = tests?.[model];
  // One y range for both models, so switching shows the bars shrink or grow.
  const [lo, hi] = tests
    ? extent([...tests.capm.alpha.flatMap((a, j) => [a - tests.capm.half[j], a + tests.capm.half[j]]), ...tests.ff3.alpha.flatMap((a, j) => [a - tests.ff3.half[j], a + tests.ff3.half[j]]), 0])
    : [-0.1, 0.1];
  const bottom = useTweened(lo - 0.005);
  const top = useTweened(hi + 0.02);
  const mix = useTweened(model === 'ff3' ? 1 : 0);
  const at = (values: 'alpha' | 'half', j: number) => (tests ? tests.capm[values][j] + mix * (tests.ff3[values][j] - tests.capm[values][j]) : 0);

  const plot = tests && view ? (
    <PlotFrame
      x={X}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={SIZE.map((_, g) => g * 6 + 2)}
      yTicks={niceTicks(bottom, top, 6)}
      formatX={(v) => SIZE[(v - 2) / 6]}
      formatY={(v) => pct(v, 0)}
      xLabel="size quintile; growth → value inside each"
      yLabel={<tspan style={{ fill: 'var(--c-error)' }}>alpha, % a year</tspan>}
      baseline={0}
      marginLeft={44}
    >
      {view.alpha.map((_, j) => {
        const a = at('alpha', j);
        const h = at('half', j);
        const excludesZero = Math.abs(view.alpha[j]) > view.half[j];
        return (
          <g key={j}>
            <Line.Segment point1={[xOf(j), a - h]} point2={[xOf(j), a + h]} color="var(--c-error)" weight={3} opacity={0.45} />
            <Point
              x={xOf(j)}
              y={a}
              color="var(--c-error)"
              svgCircleProps={{ r: 4, style: excludesZero ? undefined : { fill: 'none', stroke: 'var(--c-error)', strokeWidth: 1.5 } }}
            />
          </g>
        );
      })}
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const g = view?.grs;
  const rejected = g ? g.pValue < 0.05 : false;
  const significant = view ? view.alpha.filter((a, j) => Math.abs(a) > view.half[j]).length : 0;
  const meanAbs = view ? view.alpha.reduce((sum, a) => sum + Math.abs(a), 0) / view.N : 0;
  const modelName = MODELS.find((m) => m.value === model)!.label;

  return (
    <WidgetFrame
      title="Twenty-five alphas and one joint test"
      ariaLabel={
        view && g
          ? `${modelName} alphas of the 25 size and book-to-market portfolios, ${view.first} to ${view.last}, in percent a year, grouped from small to big stocks with growth to value inside each group. Each dot has a 95% confidence bar. Alphas run from ${pct(Math.min(...view.alpha))} to ${pct(Math.max(...view.alpha))}; ${significant} of 25 bars exclude zero. GRS is ${g.statistic.toFixed(2)} with p-value ${g.pValue.toPrecision(2)}, so the model is ${rejected ? '' : 'not '}rejected at 5%.`
          : 'Alphas of 25 portfolios with confidence bars. The data is loading.'
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
        view && g ? (
          <>
            <p style={{ margin: '0 0 0.5rem', color: 'var(--c-error)' }}>
              ● filled: 95% bar excludes zero · ○ hollow: bar includes zero
            </p>
            <dl className="readout-grid">
              <dt>Sample</dt>
              <dd>{view.first} to {view.last}</dd>
              <dt><RichText>{'$T$, $N$, $K$'}</RichText></dt>
              <dd>{view.T}, {view.N}, {view.K}</dd>
              <dt>GRS statistic</dt>
              <dd>{g.statistic.toFixed(2)} (5% critical value {view.critical5.toFixed(2)})</dd>
              <dt><RichText>{`p-value, $F_{${g.df1},\\,${g.df2}}$`}</RichText></dt>
              <dd className={rejected ? 'bad' : 'good'}><RichText>{`${pValue(g.pValue)}: ${rejected ? 'rejected' : 'not rejected'} at 5%`}</RichText></dd>
              <dt>Bars that exclude zero</dt>
              <dd>{significant} of {view.N}</dd>
              <dt><RichText>{'Average $|\\Err{\\hat\\alpha_i}|$'}</RichText></dt>
              <dd style={{ color: 'var(--c-error)' }}>{pct(meanAbs, 2)} a year</dd>
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ff25-size-bm-monthly and ff3-monthly (Kenneth French Data Library), ${view ? `${view.first} to ${view.last}` : 'from the chosen start to 2026-08'}. Alpha = intercept of the OLS regression of each portfolio's monthly excess return on Mkt-RF (CAPM) or on Mkt-RF, SMB and HML (FF3), ×12. Bars: ±1.96 classical standard errors, ×12. Groups run from the smallest (small) to the largest (big) size quintile; inside each, book-to-market rises from growth (left) to value (right). GRS assumes normal, independent errors.`}
    />
  );
}
