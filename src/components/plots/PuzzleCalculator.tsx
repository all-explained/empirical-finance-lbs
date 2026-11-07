import { Line, Point, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { impliedRiskFree, impliedTimeDiscount } from '../../lib/finance/consumptionPuzzle';
import { Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { percent } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { DEFAULT_DELTA, HJ_GAMMAS, POSTWAR_START, PUZZLE_SAMPLES, usePuzzleViews, type PuzzleSampleName } from './puzzleSample';

const HEIGHT = 300;
const X: [number, number] = [0, 50];
const Y: [number, number] = [-0.1, 0.8];
const NAMES: Record<PuzzleSampleName, string> = { annual: 'Annual', postwar: 'Postwar', quarterly: 'Quarterly' };

/**
 * Chapter 35: the consumption CAPM with power utility on measured moments. The reader picks γ and δ; the
 * widget shows the risk-free rate they imply against the data, and the δ that would match the data.
 */
export default function PuzzleCalculator() {
  const { views, failed } = usePuzzleViews();
  const [name, setName] = useState<PuzzleSampleName>('annual');
  const [gamma, setGamma] = useState(5);
  const [delta, setDelta] = useState(DEFAULT_DELTA);
  const view = views?.[name];

  const curve = useMemo(() => view && HJ_GAMMAS.map((g) => [
    g, impliedRiskFree(delta, g, view.moments.mean.dc, view.moments.sd.dc),
  ] as [number, number]), [view, delta]);

  const controls = (
    <>
      <Segmented label="Consumption sample" value={name} onChange={setName} options={PUZZLE_SAMPLES.map((s) => ({ value: s, label: NAMES[s] }))} />
      <Slider label="Risk aversion $\gamma$" value={gamma} min={0} max={50} step={1} color="var(--c-model)" onChange={setGamma} />
      <Slider label="Time discount $\delta$, a year" value={delta} min={0.9} max={1} step={0.005} format={(v) => v.toFixed(3)} color="var(--c-model)" onChange={setDelta} />
    </>
  );

  if (!view || !curve) {
    const message = failed ? 'The data did not load.' : 'Loading the data…';
    return (
      <WidgetFrame
        title="The puzzle calculator"
        ariaLabel="The risk-free rate implied by power utility. The data is loading."
        plotHeight={HEIGHT}
        plot={<p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{message}</p>}
        controls={controls}
        readout={<p>{message}</p>}
      />
    );
  }

  const { mean, sd, correlation } = view.moments;
  const riskFree = impliedRiskFree(delta, gamma, mean.dc, sd.dc);
  const matchingDelta = impliedTimeDiscount(mean.rf, gamma, mean.dc, sd.dc);
  const period = `${view.first}–${view.last}`;
  const pct = (v: number) => percent(v, 2);

  return (
    <WidgetFrame
      title="The puzzle calculator"
      ariaLabel={`Risk aversion across, from 0 to 50, and the log real risk-free rate up. A curve shows the rate that power utility implies with time discount ${delta.toFixed(3)} and the ${NAMES[name].toLowerCase()} consumption moments of ${period}. It rises steeply from ${percent(curve[0][1], 1)} at risk aversion 0. A flat line marks the mean real rate in the data, ${pct(mean.rf)}. At risk aversion ${gamma} the model gives ${percent(riskFree, 1)}.`}
      plotHeight={HEIGHT}
      plot={
        <PlotFrame
          x={X}
          y={Y}
          height={HEIGHT}
          xTicks={[0, 10, 20, 30, 40, 50]}
          yTicks={[0, 0.2, 0.4, 0.6, 0.8]}
          formatX={String}
          formatY={(v) => `${Math.round(v * 100)}%`}
          xLabel="risk aversion γ"
          yLabel="risk-free rate rᶠ, a year"
        >
          <Line.Segment point1={[X[0], mean.rf]} point2={[X[1], mean.rf]} color="var(--c-data)" weight={2} />
          <Label x={X[1]} y={mean.rf} attach="nw" attachDistance={6} size={12} color="var(--c-data)">data</Label>
          <Polyline points={curve} color="var(--c-model)" weight={2.5} strokeStyle="dashed" fillOpacity={0} />
          <Point x={gamma} y={riskFree} color="var(--c-model)" />
          <Label x={gamma} y={riskFree} attach="ne" attachDistance={10} size={12} color="var(--c-model)">{`γ = ${gamma}`}</Label>
        </PlotFrame>
      }
      controls={controls}
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--c-data)' }}>— solid line: data</span> ·{' '}
            <span style={{ color: 'var(--c-model)' }}>– – dashed curve and ● dot: model</span>
          </p>
          <dl className="readout-grid">
            <dt><RichText>{'Data: $\\mu_c$, $\\sigma_c$, a year'}</RichText></dt>
            <dd style={{ color: 'var(--c-data)' }}>{pct(mean.dc)}, {pct(sd.dc)} ({period})</dd>
            <dt><RichText>{'Data: $\\operatorname{corr}(\\Delta c, r)$'}</RichText></dt>
            <dd style={{ color: 'var(--c-data)' }}>{correlation.toFixed(3)}</dd>
            <dt><RichText>{'Data: $\\mathbb{E}[r - r^f]$, $\\sigma_i$, a year'}</RichText></dt>
            <dd style={{ color: 'var(--c-data)' }}>{pct(mean.re)}, {pct(sd.r)}</dd>
            <dt><RichText>{'$\\gamma$ the premium needs'}</RichText></dt>
            <dd><RichText>{`${view.gamma.fromCovariance.toFixed(0)} from $\\sigma_{ic}$ · ${view.gamma.fromSharpe.toFixed(1)} from $SR/\\sigma_c$`}</RichText></dd>
            <dt><RichText>{'Risk-free rate $\\Rf{r^f}$, a year'}</RichText></dt>
            <dd><span style={{ color: 'var(--c-model)' }}>model {percent(riskFree, 2)}</span> · <span style={{ color: 'var(--c-data)' }}>data {pct(mean.rf)}</span></dd>
            <dt><RichText>{'$\\delta$ that matches the data'}</RichText></dt>
            <dd className={matchingDelta > 1 ? 'bad' : undefined}>{matchingDelta.toFixed(3)}{matchingDelta > 1 ? ', above 1: patience beyond any saver' : ''} (slider {delta.toFixed(3)})</dd>
          </dl>
        </>
      }
      caption={`Data: real nondurables and services per person from fred-consumption-annual (annual from 1930, postwar from ${POSTWAR_START}) and fred-cay-quarterly (quarterly from 1952), with the CRSP value-weighted return, the T-bill rate and inflation from goyal-welch-annual and goyal-welch-monthly. Log real rates, annualised (quarterly means and $\\sigma_{ic}$ times 4, standard deviations times 2). Model: lognormal power utility, $\\Rf{r^f} = -\\log\\delta + \\gamma\\mu_c - \\tfrac12\\gamma^2\\sigma_c^2$.`}
    />
  );
}
