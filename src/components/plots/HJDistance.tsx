import { Polygon } from 'mafs';
import { useState } from 'react';
import type { SdfModel } from '../../lib/finance/sdfGmm';
import { annualiseMean } from '../../lib/stats/moments';
import { arithmeticMean } from '../../lib/finance/returns';
import { Segmented } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { extent, niceTicks } from './format';
import { PlotFrame } from './PlotFrame';
import { MODELS, useSdfView } from './sdfGmmSample';

type Weighting = 'firstStage' | 'hj';
const HEIGHT = 320;
const WEIGHTINGS: { value: Weighting; label: string }[] = [
  { value: 'firstStage', label: 'first stage' },
  { value: 'hj', label: 'HJ' },
];
const SIZE = ['small', 'ME2', 'ME3', 'ME4', 'big'];
// Portfolio j is ME(⌊j/5⌋+1)-BM(j mod 5 + 1): size groups of five, book-to-market rising inside each.
const xOf = (j: number) => Math.floor(j / 5) * 6 + (j % 5);
const X: [number, number] = [-1, 29];
const pct = (v: number, digits = 1) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const pValue = (p: number) => (p < 0.001 ? `$${p.toExponential(1).replace(/e([+-])(\d+)/, (_, s, d) => ` \\times 10^{${s === '-' ? '-' : ''}${d}}`)}$` : p.toFixed(3));
const year = (v: number) => annualiseMean(v, 4);

/**
 * Chapter 26: the 25 pricing errors of the CAPM, the CCAPM and FF3 as SDF models on the quarterly
 * size–B/M portfolios, at the first-stage b̂ or at the HJ-weighted b̂ that defines δ_HJ, with every
 * model's δ_HJ and second-stage J in the readout.
 */
export default function HJDistance({ initialModel = 'capm' }: { initialModel?: SdfModel }) {
  const [model, setModel] = useState<SdfModel>(initialModel);
  const [weighting, setWeighting] = useState<Weighting>('hj');
  const { view, failed } = useSdfView();

  const fit = view?.fits[model][weighting];
  const errors = fit ? fit.pricingErrors.map(year) : [];
  // One y range for every model and weighting, so a switch shows the bars shrink or grow.
  const [lo, hi] = view ? extent([0, ...MODELS.flatMap(({ value }) => WEIGHTINGS.flatMap((w) => view.fits[value][w.value].pricingErrors.map(year)))]) : [-0.1, 0.1];
  const y0 = lo - 0.01;
  const y1 = hi + 0.03; // room for the axis title above the tallest bar
  const modelName = MODELS.find((m) => m.value === model)!.label;
  const weightingName = WEIGHTINGS.find((w) => w.value === weighting)!.label;
  const meanAbs = fit ? arithmeticMean(errors.map(Math.abs)) : NaN;
  const span = view ? `${view.first} to ${view.last}` : '';

  const plot = view && fit ? (
    <PlotFrame
      x={X}
      y={[y0, y1]}
      height={HEIGHT}
      xTicks={SIZE.map((_, g) => g * 6 + 2)}
      yTicks={niceTicks(y0, y1, 6)}
      formatX={(v) => SIZE[(v - 2) / 6]}
      formatY={(v) => pct(v, 0)}
      xLabel="size quintile; growth → value inside each"
      yLabel={<tspan style={{ fill: 'var(--c-error)' }}>pricing error, % a year</tspan>}
      baseline={0}
      marginLeft={44}
    >
      {errors.map((e, j) => (
        <Polygon key={j} points={[[xOf(j) - 0.4, 0], [xOf(j) + 0.4, 0], [xOf(j) + 0.4, e], [xOf(j) - 0.4, e]]}
          color="var(--c-error)" fillOpacity={0.55} weight={1.5} />
      ))}
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  return (
    <WidgetFrame
      title="Three SDFs, one yardstick"
      ariaLabel={
        view && fit
          ? `${modelName} pricing errors of the 25 size and book-to-market portfolios with ${weightingName} weighting, ${span}, in percent a year, grouped from small to big stocks with growth to value inside each group. They run from ${pct(Math.min(...errors))} to ${pct(Math.max(...errors))}, ${pct(meanAbs, 2)} on average in absolute value. Hansen–Jagannathan distances: ${MODELS.map((m) => `${m.label} ${view.fits[m.value].hjDistance.toFixed(3)}`).join(', ')}; no factors ${view.noFactorDistance.toFixed(3)}.`
          : 'Pricing errors of 25 portfolios under three SDF models. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Model" value={model} onChange={setModel} options={MODELS.map((m) => ({ ...m, color: 'var(--c-factor)' }))} />
          <Segmented label="Weighting" value={weighting} onChange={setWeighting} options={WEIGHTINGS} />
        </>
      }
      readout={
        view && fit ? (
          <>
            <dl className="readout-grid">
              <dt><RichText>{`$\\hat b$, ${weightingName}`}</RichText></dt>
              <dd>{fit.b.map((b, k) => `${view.fits[model].factorNames[k]} ${b.toFixed(2)}`).join(', ')}</dd>
              <dt><RichText>{'Mean $|\\Err{\\hat\\alpha_i}|$'}</RichText></dt>
              <dd style={{ color: 'var(--c-error)' }}>{pct(meanAbs, 2)} a year</dd>
            </dl>
            <table className="iter-table" style={{ marginTop: '0.5rem' }}>
              <caption style={{ textAlign: 'left', color: 'var(--text-muted)' }}>Every model, {span}</caption>
              <thead>
                <tr><th scope="col">Model</th><th scope="col"><RichText>{'$\\delta_{\\text{HJ}}$'}</RichText></th><th scope="col"><RichText>{'$J$ (df)'}</RichText></th><th scope="col">p-value</th></tr>
              </thead>
              <tbody>
                {MODELS.map((m) => {
                  const f = view.fits[m.value];
                  const chosen = m.value === model;
                  return (
                    <tr key={m.value} style={{ fontWeight: chosen ? 700 : 400 }}>
                      <th scope="row" style={{ textAlign: 'left' }}>{chosen ? '▸ ' : ''}{m.label}</th>
                      <td>{f.hjDistance.toFixed(3)}</td>
                      <td>{f.J.toFixed(1)} ({f.df})</td>
                      <td><RichText>{pValue(f.pValue)}</RichText></td>
                    </tr>
                  );
                })}
                <tr>
                  <th scope="row" style={{ textAlign: 'left' }}>No factors</th>
                  <td>{view.noFactorDistance.toFixed(3)}</td>
                  <td>–</td>
                  <td>–</td>
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={`Data: ff25-size-bm-monthly and ff3-monthly (Kenneth French Data Library), compounded into quarters, and consumption growth $\\Delta c$ from fred-cay-quarterly; ${span}, ${view?.quarters ?? 252} quarters. SDF $M = 1 - b'\\tilde f$ with $\\tilde f$ = Mkt-RF (CAPM), $\\Delta c$ (CCAPM) or Mkt-RF, SMB, HML (FF3), demeaned. Bars: pricing errors $\\mathbb{E}_T[R^e] - \\mathbb{E}_T[R^e\\tilde f']\\hat b$, ×4, at the first-stage $\\hat b$ (identity weighting) or the HJ $\\hat b$ (weighting $\\mathbb{E}_T[R^eR^{e\\prime}]^{-1}$). $\\delta_{\\text{HJ}}$ is per quarter. $J$: second-stage GMM with $\\hat S$ from the first stage, no lags, against $\\chi^2_{N-K}$. ▸ marks the chosen model.`}
    />
  );
}
