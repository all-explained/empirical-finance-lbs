import { Polygon } from 'mafs';
import { useMemo, useState } from 'react';
import { Segmented } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { CHARACTERISTICS, characteristicView, METHODS, type Characteristic, type Method } from './mimickingSample';
import { GRID_MODELS, gridView, useModelData, type GridModel } from './sizeValueSample';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 330;
const SIZE = ['small', '2', '3', '4', 'big'];
const BM = ['growth', '2', '3', '4', 'value'];
type Measure = 'mean' | 'alpha' | 'weights';
const MEASURES: { value: Measure; label: string }[] = [
  { value: 'mean', label: 'Mean excess return' },
  { value: 'alpha', label: 'Alpha' },
  { value: 'weights', label: 'Weights' },
];
const signed = (v: number, digits = 1) => `${v < 0 ? '−' : '+'}${Math.abs(v * 100).toFixed(digits)}`;
const num = (v: number, digits = 2) => `${v < -5e-4 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
/** A weight in percent: +5.0, −2.0, and 0 for a portfolio the view leaves out. */
const weight = (v: number) => (Math.abs(v) < 5e-6 ? '0' : `${v < 0 ? '−' : '+'}${Math.abs(v * 100).toFixed(1)}`);
const pValue = (p: number) => (p < 0.001 ? `$p = ${p.toExponential(1).replace(/e([+-])(\d+)/, (_, s, d) => ` \\times 10^{${s === '-' ? '-' : ''}${d}}`)}$` : `$p = ${p.toFixed(3)}$`);
// Diverging scale: positive cells in the return colour, negative ones in the error colour, more opaque further from zero.
const hue = (v: number) => (v < 0 ? 'var(--c-error)' : 'var(--c-return)');

/**
 * Chapter 19: the 25 size–B/M portfolios as a 5×5 grid, coloured by annualised mean excess return or by the
 * alpha of the CAPM, FF3 or FF5, from 1963-07; the readout gives the GRS test of the chosen model.
 * Chapter 33 starts it at initialMeasure="weights", which adds a view of the weights of a long–short sort and of
 * a cross-sectional slope portfolio on size or B/M; only then does the measure control offer it.
 */
export default function SortGrid({ initialMeasure = 'mean', initialModel = 'capm' }: { initialMeasure?: Measure; initialModel?: GridModel }) {
  const [measure, setMeasure] = useState<Measure>(initialMeasure);
  const [model, setModel] = useState<GridModel>(initialModel);
  const [characteristic, setCharacteristic] = useState<Characteristic>('bm');
  const [method, setMethod] = useState<Method>('sort');
  const withWeights = initialMeasure === 'weights';
  const { data, failed } = useModelData();
  const views = useMemo(
    () => (data ? { capm: gridView(data, 'capm'), ff3: gridView(data, 'ff3'), ff5: gridView(data, 'ff5') } : null),
    [data],
  );
  const weightView = useMemo(() => (data && withWeights ? characteristicView(data) : null), [data, withWeights]);
  const view = views?.[model];
  const chosen = weightView?.portfolios[characteristic];
  const portfolio = chosen?.[method];
  const values = measure === 'weights' ? portfolio?.weights ?? [] : view ? view[measure] : [];
  // One scale per measure across all models, so switching models shows alphas shrink; for weights, one scale
  // across both methods, so switching shows the sort's weight move onto fewer portfolios.
  const scale = measure === 'weights'
    ? chosen ? Math.max(...[...chosen.sort.weights, ...chosen.regression.weights].map(Math.abs)) : 1
    : views ? Math.max(...(measure === 'mean' ? views.capm.mean : [...views.capm.alpha, ...views.ff3.alpha, ...views.ff5.alpha]).map(Math.abs)) : 1;

  const ready = view && (measure !== 'weights' || portfolio);
  const plot = ready ? (
    <PlotFrame
      x={[0, 5]}
      y={[0, 5]}
      height={HEIGHT}
      xTicks={[0.5, 1.5, 2.5, 3.5, 4.5]}
      yTicks={[0.5, 1.5, 2.5, 3.5, 4.5]}
      formatX={(v) => BM[Math.floor(v)]}
      formatY={(v) => SIZE[4 - Math.floor(v)]}
      xLabel="book-to-market quintile"
      marginLeft={46}
    >
      {values.map((v, j) => {
        const col = j % 5;
        const row = 4 - Math.floor(j / 5);
        const strong = measure === 'alpha' && Math.abs(view.alphaT[j]) > 1.96;
        return (
          <g key={j}>
            <Polygon
              points={[[col + 0.03, row + 0.03], [col + 0.97, row + 0.03], [col + 0.97, row + 0.97], [col + 0.03, row + 0.97]]}
              color={hue(v)}
              fillOpacity={0.08 + 0.6 * Math.min(Math.abs(v) / scale, 1)}
              weight={strong ? 2.5 : 0}
            />
            <Label x={col + 0.5} y={row + 0.5} size={13}>{measure === 'weights' ? weight(v) : `${signed(v)}${strong ? '*' : ''}`}</Label>
          </g>
        );
      })}
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const g = view?.grs;
  const rejected = g ? g.pValue < 0.05 : false;
  const modelName = GRID_MODELS.find((m) => m.value === model)!.label;
  const meanAbs = view ? view.alpha.reduce((sum, a) => sum + Math.abs(a), 0) / view.N : 0;
  const what = measure === 'mean' ? 'mean excess return' : `${modelName} alpha`;
  const waiting = <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>;
  const legend = (
    <div style={{ margin: '0 0 0.5rem' }} aria-hidden="true">
      <div style={{ height: 10, borderRadius: 3, background: 'linear-gradient(to right, var(--c-error), transparent, var(--c-return))', opacity: 0.68 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
        <span>{measure === 'weights' ? weight(-scale) : signed(-scale)}%</span><span>0</span><span>{measure === 'weights' ? weight(scale) : signed(scale)}%</span>
      </div>
    </div>
  );
  const measureControl = (
    <Segmented label="Colour by" value={measure} onChange={setMeasure}
      options={MEASURES.slice(0, withWeights ? 3 : 2).map((m) => ({ ...m, color: m.value === 'alpha' ? 'var(--c-error)' : 'var(--c-return)' }))} />
  );

  if (measure === 'weights') {
    const c = CHARACTERISTICS.find((x) => x.value === characteristic)!;
    const methodName = method === 'sort' ? 'long–short sort' : 'cross-sectional slope portfolio';
    return (
      <WidgetFrame
        title="Twenty-five portfolios sorted on size and value"
        ariaLabel={
          weightView && portfolio
            ? `A 5 by 5 grid of the size and book-to-market portfolios, small stocks in the top row and value stocks in the right column. Each cell shows the weight, in percent, of the ${methodName} on ${c.label.toLowerCase()}. Small growth: ${weight(values[0])}%; small value: ${weight(values[4])}%; big growth: ${weight(values[20])}%; big value: ${weight(values[24])}%. From ${weightView.first} to ${weightView.last} it earned ${signed(portfolio.mean, 2)}% a year with a t-statistic of ${num(portfolio.t)}, and its correlation with ${c.factor} is ${num(portfolio.correlation)}.`
            : 'A 5 by 5 grid of the weights of a size or book-to-market portfolio. The data is loading.'
        }
        plotHeight={HEIGHT}
        plot={plot}
        controls={
          <>
            {measureControl}
            <Segmented label="Characteristic" value={characteristic} onChange={setCharacteristic} options={CHARACTERISTICS.map((x) => ({ value: x.value, label: x.label, color: 'var(--c-return)' }))} />
            <Segmented label="Method" value={method} onChange={setMethod} options={METHODS.map((m) => ({ ...m, color: 'var(--c-return)' }))} />
          </>
        }
        readout={
          weightView && portfolio ? (
            <>
              {legend}
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
                <RichText>{`Cells: weight on each portfolio, %. ${method === 'sort' ? 'Top quintile minus bottom, divided by 4.' : "A row of $(Z'Z)^{-1}Z'$."}`}</RichText>
              </p>
              <dl className="readout-grid">
                <dt>Sample</dt>
                <dd><span style={{ whiteSpace: 'nowrap' }}>{weightView.first}</span> to <span style={{ whiteSpace: 'nowrap' }}>{weightView.last}</span></dd>
                <dt>Exposure to size, B/M score</dt>
                <dd>{num(portfolio.exposures[0])}, {num(portfolio.exposures[1])}</dd>
                <dt><RichText>{"Sum of squared weights $w'w$"}</RichText></dt>
                <dd>{num(portfolio.squaredWeights, 3)}</dd>
                <dt>Mean, % a year</dt>
                <dd style={{ color: 'var(--c-return)' }}>{signed(portfolio.mean, 2)}</dd>
                <dt><RichText>{'$t$-statistic'}</RichText></dt>
                <dd>{num(portfolio.t)}</dd>
                <dt>Correlation with {c.factor}</dt>
                <dd>{num(portfolio.correlation, 3)}</dd>
              </dl>
            </>
          ) : waiting
        }
        caption={`Data: ff25-size-bm-monthly and ff3-monthly (Kenneth French Data Library), ${weightView ? `${weightView.first} to ${weightView.last}` : '1963-07 to 2026-08'}. Scores: the B/M quintile minus 3, and 3 minus the size quintile, so small stocks score +2. Sort: equal weights on the five portfolios with score +2 minus the five with score −2, divided by 4 so the exposure to the score is 1. Regression: the row of $(Z'Z)^{-1}Z'$ for the score, with $Z$ the constant and the two scores. Its return each month is the slope of a cross-sectional regression of the 25 excess returns on $Z$. Mean: monthly mean ×12; $t$ = mean over its standard error. SMB and HML are the published factors.`}
      />
    );
  }

  return (
    <WidgetFrame
      title="Twenty-five portfolios sorted on size and value"
      ariaLabel={
        view && g
          ? `A 5 by 5 grid of the size and book-to-market portfolios, ${view.first} to ${view.last}, small stocks in the top row and value stocks in the right column. Each cell shows its ${what} in percent a year. Small growth: ${signed(values[0])}%; small value: ${signed(values[4])}%; big growth: ${signed(values[20])}%; big value: ${signed(values[24])}%. GRS for the ${modelName} is ${g.statistic.toFixed(2)} with p-value ${g.pValue.toPrecision(2)}.`
          : 'A 5 by 5 grid of size and book-to-market portfolios. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          {measureControl}
          <Segmented label="Model" value={model} onChange={setModel} options={GRID_MODELS.map((m) => ({ ...m, color: 'var(--c-factor)' }))} />
        </>
      }
      readout={
        view && g ? (
          <>
            {legend}
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
              {measure === 'mean'
                ? 'Cells: mean excess return, % a year. It does not depend on the model.'
                : 'Cells: alpha, % a year. * and a border: |t| > 1.96.'}
            </p>
            <dl className="readout-grid">
              <dt>Sample</dt>
              <dd>{view.first} to {view.last}</dd>
              <dt><RichText>{'$T$, $N$, $K$'}</RichText></dt>
              <dd>{view.T}, {view.N}, {view.K}</dd>
              <dt>{modelName} GRS</dt>
              <dd>{g.statistic.toFixed(2)} (5% critical value {view.critical5.toFixed(2)})</dd>
              <dt><RichText>{`p-value, $F_{${g.df1},\\,${g.df2}}$`}</RichText></dt>
              <dd className={rejected ? 'bad' : 'good'}><RichText>{`${pValue(g.pValue)}: ${rejected ? 'rejected' : 'not rejected'} at 5%`}</RichText></dd>
              <dt><RichText>{'Average $|\\Err{\\hat\\alpha_i}|$'}</RichText></dt>
              <dd style={{ color: 'var(--c-error)' }}>{(meanAbs * 100).toFixed(2)}% a year</dd>
            </dl>
          </>
        ) : waiting
      }
      caption={`Data: ff25-size-bm-monthly, ff3-monthly and ff5-monthly (Kenneth French Data Library), ${view ? `${view.first} to ${view.last}` : '1963-07 to 2026-08'}, the common sample of the three models. Mean excess return and alpha are monthly values ×12. Alpha is the intercept of the OLS regression of each portfolio's excess return on Mkt-RF (CAPM), on Mkt-RF, SMB and HML (FF3), or on Mkt-RF, SMB, HML, RMW and CMA (FF5); t-statistics use classical standard errors. GRS assumes normal, independent errors.`}
    />
  );
}
