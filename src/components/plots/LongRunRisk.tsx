import { Line, Point, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { Button, Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { extent, niceTicks, percent } from './format';
import { PlotFrame } from './PlotFrame';
import {
  CALIBRATION_NAMES, CALIBRATIONS, consumptionCentury, DEFAULT_SEED, modelVarianceRatios, PATH_MONTHS, pricing,
  useLongRunRiskData, VR_HORIZONS, type CalibrationName,
} from './longRunRiskSample';

const PATH_HEIGHT = 220;
const VR_HEIGHT = 220;
const YEARS = Array.from({ length: PATH_MONTHS + 1 }, (_, t) => t / 12);
const LAST = VR_HORIZONS.length - 1;

const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;

/**
 * Chapter 38: a seeded century of consumption in the long-run risks model, with and without the persistent
 * part x_t (same shocks); the variance ratio of annual consumption growth for the model and for the data;
 * and the equity premium, the risk-free rate and the price of long-run risk as φ_x and ψ move.
 */
export default function LongRunRisk() {
  const { view, failed } = useLongRunRiskData();
  const [calibration, setCalibration] = useState<CalibrationName>('bky');
  const [phiX, setPhiX] = useState(CALIBRATIONS.bky.phiX);
  const [psi, setPsi] = useState(CALIBRATIONS.bky.psi);
  const [seed, setSeed] = useState(DEFAULT_SEED);

  const params = useMemo(() => ({ ...CALIBRATIONS[calibration], phiX, psi }), [calibration, phiX, psi]);
  // Consumption does not depend on ψ, so the paths and ratios recompute only when φ_x, the calibration or the seed move.
  const dynamics = useMemo(() => ({ ...CALIBRATIONS[calibration], phiX }), [calibration, phiX]);
  const century = useMemo(() => consumptionCentury(dynamics, seed), [dynamics, seed]);
  const model = useMemo(() => modelVarianceRatios(dynamics), [dynamics]);
  const priced = useMemo(() => pricing(params), [params]);

  const onCalibration = (name: CalibrationName) => {
    setCalibration(name);
    setPhiX(CALIBRATIONS[name].phiX);
    setPsi(CALIBRATIONS[name].psi);
  };

  const [lo, hi] = extent([...century.withX, ...century.withoutX]);
  const pad = (hi - lo) * 0.08 || 0.05;
  const pathY: [number, number] = [lo - pad, hi + pad];
  const top = Math.ceil(Math.max(...model, ...century.ratios, ...(view?.ratios ?? [])) * 2) / 2 + 0.5;
  const vrPoints = (ratios: number[]) => ratios.map((v, i) => [VR_HORIZONS[i], v] as [number, number]);
  const name = CALIBRATION_NAMES[calibration];

  const plot = (
    <>
      <PlotFrame
        x={[0, 100]}
        y={pathY}
        height={PATH_HEIGHT}
        xTicks={[0, 20, 40, 60, 80, 100]}
        yTicks={niceTicks(pathY[0], pathY[1], 4)}
        formatY={(v) => num(v, 2)}
        xLabel="years since the start"
        yLabel="log consumption less trend"
        baseline={0}
      >
        <Polyline points={century.withoutX.map((v, t) => [YEARS[t], v])} color="var(--text-muted)" weight={1.5} strokeStyle="dashed" fillOpacity={0} />
        <Polyline points={century.withX.map((v, t) => [YEARS[t], v])} color="var(--c-signal)" weight={2} fillOpacity={0} />
      </PlotFrame>
      <PlotFrame
        x={[0.5, 10.5]}
        y={[0, top]}
        height={VR_HEIGHT}
        xTicks={VR_HORIZONS}
        yTicks={niceTicks(0, top, 4)}
        formatY={(v) => v.toFixed(1)}
        xLabel="horizon k (years)"
        yLabel="variance ratio VR(k)"
      >
        <Line.Segment point1={[0.5, 1]} point2={[10.5, 1]} color="var(--text-muted)" weight={1} opacity={0.5} />
        <Polyline points={vrPoints(century.ratios)} color="var(--c-model)" weight={1.5} strokeOpacity={0.6} fillOpacity={0} />
        <Polyline points={vrPoints(model)} color="var(--c-model)" weight={2.5} strokeStyle="dashed" fillOpacity={0} />
        {view && (
          <>
            <Polyline points={vrPoints(view.ratios)} color="var(--c-data)" weight={3} fillOpacity={0} />
            {vrPoints(view.ratios).map(([k, v]) => <Point key={k} x={k} y={v} color="var(--c-data)" />)}
          </>
        )}
      </PlotFrame>
    </>
  );

  const gap = century.withX[PATH_MONTHS] - century.withoutX[PATH_MONTHS];

  return (
    <WidgetFrame
      title="A small, persistent part of consumption growth"
      ariaLabel={
        `Top: 100 simulated years of log consumption less its trend, ${name} calibration, persistence of x ${phiX.toFixed(3)} a month, seed ${seed}.`
        + ` The solid line includes the persistent part x, the dashed line uses the same shocks without it; after 100 years they are ${num(Math.abs(gap))} log points apart.`
        + ` Bottom: the variance ratio of annual consumption growth at horizons of 1 to 10 years. At 10 years it is ${num(model[LAST])} for the model,`
        + ` ${num(century.ratios[LAST])} for this simulated century${view ? ` and ${num(view.ratios[LAST])} for the data, ${view.first} to ${view.last}` : ''}.`
      }
      plotHeight={PATH_HEIGHT + VR_HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Calibration" value={calibration} onChange={onCalibration} options={[
            { value: 'bky', label: 'BKY' },
            { value: 'by', label: 'BY' },
          ]} />
          <Slider label="Persistence of $\Signal{x_t}$, $\phi_x$ (a month)" value={phiX} min={0.9} max={0.99} step={0.001} color="var(--c-signal)" onChange={setPhiX} format={(v) => v.toFixed(3)} />
          <Slider label="Elasticity $\psi$" value={psi} min={0.5} max={2.5} step={0.05} onChange={setPsi} format={(v) => v.toFixed(2)} />
          <Button onClick={() => setSeed((s) => s + 1)}>New seed</Button>
        </>
      }
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--c-signal)' }}>— solid: with <RichText>{'$x_t$'}</RichText></span> ·{' '}
            <span style={{ color: 'var(--text-muted)' }}>– – dashed: without</span>
            <br />
            <span style={{ color: 'var(--c-data)' }}>●— data</span> ·{' '}
            <span style={{ color: 'var(--c-model)' }}>– – model, 10,000 years</span> ·{' '}
            <span style={{ color: 'var(--c-model)' }}>— thin: this century</span>
          </p>
          <dl className="readout-grid">
            {priced.kind === 'solved' ? (
              <>
                <dt>Equity premium</dt>
                <dd style={{ color: 'var(--c-return)' }}>{percent(priced.solution.equityPremium.annual, 2)} a year</dd>
                <dt><RichText>{'Risk-free rate $\\Rf{r^f}$'}</RichText></dt>
                <dd style={{ color: 'var(--c-rf)' }}>{percent(priced.solution.riskFree.annual, 2)} a year</dd>
                <dt><RichText>{'Price of long-run risk $\\lambda_e$'}</RichText></dt>
                <dd>{num(priced.solution.pricesOfRisk.e, 1)}</dd>
                <dt><RichText>{'$\\theta_{\\text{EZ}}$; response of $\\Signal{pc_t}$ to $\\Signal{x_t}$, $A_1$'}</RichText></dt>
                <dd>{num(priced.solution.theta, 1)}; {num(priced.solution.consumption.A1, 2)}</dd>
              </>
            ) : (
              <>
                <dt>Prices</dt>
                <dd className="bad">
                  <RichText>{priced.kind === 'psi-one'
                    ? 'none at $\\psi = 1$, where $\\theta_{\\text{EZ}}$ has no value'
                    : 'no finite price: the log-linear solution breaks down here'}</RichText>
                </dd>
              </>
            )}
            <dt><RichText>{'$\\mathit{VR}(10)$: model; this century; data'}</RichText></dt>
            <dd>
              <span style={{ color: 'var(--c-model)' }}>{num(model[LAST])}</span>;{' '}
              <span style={{ color: 'var(--c-model)' }}>{num(century.ratios[LAST])}</span>;{' '}
              <span style={{ color: 'var(--c-data)' }}>{view ? num(view.ratios[LAST]) : failed ? 'did not load' : 'loading…'}</span>
            </dd>
            <dt>Seed</dt>
            <dd>{seed}</dd>
          </dl>
        </>
      }
      caption={
        `Simulated (seeded): the ${name} calibration of the long-run risks model, run in months and added up to years as the data are; the persistence slider replaces its $\\phi_x$, the elasticity slider its $\\psi$, with $\\gamma = 10$. The dashed path uses the same shocks with $\\varphi_e = 0$. The model's variance ratios come from one 10,000-year path. `
        + `Data: real consumption of nondurables and services per person from fred-consumption-annual, over the years it shares with goyal-welch-annual, ${view ? `${view.first} to ${view.last}` : '1930 to 2025'}. Rates are log real rates, 12 times the monthly ones; the premium includes the half variance, as in Bansal, Kiku & Yaron (2012).`
      }
    />
  );
}
