import { Line, MovablePoint, Point } from 'mafs';
import { useState } from 'react';
import { excessReturn, simpleReturn } from '../../lib/finance/returns';
import { price, riskFreeRate, riskPremiumFromCovariance } from '../../lib/finance/sdf';
import { Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { clamp, percent } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { DEFAULT_STATES, PAYOFFS, probabilities, type PayoffName, type TwoStates } from './sdfSamples';

const HEIGHT = 300;
const STEP = 0.05;
const SDF_RANGE: [number, number] = [0.1, 1.8];
const PAYOFF_RANGE: [number, number] = [0.1, 1.8];
const COLUMNS = { bad: 1, good: 2, today: 3 };
const OFFSET = 0.17;

const snap = (v: number, [lo, hi]: [number, number]) => clamp(Math.round(v / STEP) * STEP, lo, hi);
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const replace = (pair: [number, number], s: 0 | 1, v: number): [number, number] => (s === 0 ? [v, pair[1]] : [pair[0], v]);

/**
 * Chapter 8: two states of the world. Drag the SDF and the payoff in each state
 * (or use the sliders) and read off the price P = E[M X] and its risk premium.
 */
export default function SDFExplorer() {
  const [states, setStates] = useState<TwoStates>(DEFAULT_STATES);
  const { prob, sdf, payoff } = states;
  const pi = probabilities(states);

  const p = price(payoff, sdf, pi);
  const rf = riskFreeRate(sdf, pi);
  const meanSdf = price([1, 1], sdf, pi);
  const meanPayoff = price(payoff, [1, 1], pi);
  const riskNeutral = price([meanPayoff, meanPayoff], sdf, pi);
  const expectedReturn = simpleReturn(p, meanPayoff);
  const premium = riskPremiumFromCovariance(sdf, payoff.map((x) => excessReturn(simpleReturn(p, x), rf)), pi);
  const preset = (Object.keys(PAYOFFS) as PayoffName[]).find((name) => PAYOFFS[name].every((x, s) => Math.abs(x - payoff[s]) < 1e-9)) ?? ('' as PayoffName);

  const setSdf = (s: 0 | 1, v: number) => setStates((st) => ({ ...st, sdf: replace(st.sdf, s, snap(v, SDF_RANGE)) }));
  const setPayoff = (s: 0 | 1, v: number) => setStates((st) => ({ ...st, payoff: replace(st.payoff, s, snap(v, PAYOFF_RANGE)) }));

  const stem = (x: number, y: number, color: string, key: string) => (
    <Line.Segment key={key} point1={[x, 0]} point2={[x, y]} color={color} weight={3} opacity={0.6} />
  );

  const plot = (
    <PlotFrame
      x={[0.45, 3.55]}
      y={[0, 2]}
      height={HEIGHT}
      xTicks={[COLUMNS.bad, COLUMNS.good, COLUMNS.today]}
      yTicks={[0, 0.5, 1, 1.5, 2]}
      formatX={(v) => (v === COLUMNS.bad ? 'bad times' : v === COLUMNS.good ? 'good times' : 'today')}
      formatY={(v) => v.toFixed(1)}
      xLabel=""
      yLabel="value in that state"
      marginLeft={38}
    >
      {([0, 1] as const).map((s) => {
        const column = s === 0 ? COLUMNS.bad : COLUMNS.good;
        return [
          stem(column - OFFSET, sdf[s], 'var(--c-sdf)', `ms${s}`),
          stem(column + OFFSET, payoff[s], 'var(--text)', `xs${s}`),
          <Label key={`pi${s}`} x={column} y={2} attach="s" attachDistance={26} size={12} color="var(--c-prob)">
            {`π = ${pi[s].toFixed(2)}`}
          </Label>,
          <Label key={`ml${s}`} x={column - OFFSET} y={sdf[s]} attach="w" attachDistance={12} color="var(--c-sdf)">M</Label>,
          <Label key={`xl${s}`} x={column + OFFSET} y={payoff[s]} attach="e" attachDistance={12} color="var(--text)">X</Label>,
          <MovablePoint
            key={`m${s}`}
            point={[column - OFFSET, sdf[s]]}
            constrain={([, y]) => [column - OFFSET, snap(y, SDF_RANGE)]}
            onMove={([, y]) => setSdf(s, y)}
            color="var(--c-sdf)"
          />,
          <MovablePoint
            key={`x${s}`}
            point={[column + OFFSET, payoff[s]]}
            constrain={([, y]) => [column + OFFSET, snap(y, PAYOFF_RANGE)]}
            onMove={([, y]) => setPayoff(s, y)}
            color="var(--text)"
          />,
        ];
      })}
      <Line.Segment point1={[COLUMNS.today - 0.35, riskNeutral]} point2={[COLUMNS.today + 0.35, riskNeutral]} color="var(--text-muted)" weight={1.5} style="dashed" />
      {stem(COLUMNS.today, p, 'var(--text)', 'price')}
      <Point x={COLUMNS.today} y={p} color="var(--text)" />
      <Label x={COLUMNS.today} y={Math.max(p, riskNeutral)} attach="n" attachDistance={10} size={12} color="var(--text)">
        {`P = ${p.toFixed(3)}`}
      </Label>
    </PlotFrame>
  );

  return (
    <WidgetFrame
      title="Price = E[M × payoff]"
      ariaLabel={`Two states of the world. Bad times have probability ${pi[0].toFixed(2)}, an SDF of ${num(sdf[0])} and a payoff of ${num(payoff[0])}. Good times have an SDF of ${num(sdf[1])} and a payoff of ${num(payoff[1])}. The price today is ${p.toFixed(3)}, against ${riskNeutral.toFixed(3)} if the payoff were discounted at the risk-free rate.`}
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Segmented label="Payoff" value={preset} onChange={(name) => setStates((st) => ({ ...st, payoff: [...PAYOFFS[name]] }))} options={[
            { value: 'stock', label: 'stock' },
            { value: 'bond', label: 'bond' },
            { value: 'insurance', label: 'insurance' },
          ]} />
          <Slider label="Probability of bad times $\Prob{\pi(1)}$" value={prob} min={0.1} max={0.9} step={STEP} color="var(--c-prob)"
            format={(v) => v.toFixed(2)} onChange={(v) => setStates((st) => ({ ...st, prob: v }))} />
          <Slider label="SDF in bad times $\SDF{M_1}$" value={sdf[0]} min={SDF_RANGE[0]} max={SDF_RANGE[1]} step={STEP} color="var(--c-sdf)"
            format={(v) => v.toFixed(2)} onChange={(v) => setSdf(0, v)} />
          <Slider label="SDF in good times $\SDF{M_2}$" value={sdf[1]} min={SDF_RANGE[0]} max={SDF_RANGE[1]} step={STEP} color="var(--c-sdf)"
            format={(v) => v.toFixed(2)} onChange={(v) => setSdf(1, v)} />
          <Slider label="Payoff in bad times $X_1$" value={payoff[0]} min={PAYOFF_RANGE[0]} max={PAYOFF_RANGE[1]} step={STEP} color="var(--text)"
            format={(v) => v.toFixed(2)} onChange={(v) => setPayoff(0, v)} />
          <Slider label="Payoff in good times $X_2$" value={payoff[1]} min={PAYOFF_RANGE[0]} max={PAYOFF_RANGE[1]} step={STEP} color="var(--text)"
            format={(v) => v.toFixed(2)} onChange={(v) => setPayoff(1, v)} />
        </>
      }
      readout={
        <dl className="readout-grid">
          <dt><RichText>{'Mean SDF $\\mathbb{E}[\\SDF{M}]$'}</RichText></dt>
          <dd>{meanSdf.toFixed(3)}</dd>
          <dt><RichText>{'Risk-free rate $\\Rf{R^f} = 1/\\mathbb{E}[\\SDF{M}] - 1$'}</RichText></dt>
          <dd style={{ color: 'var(--c-rf)' }}>{percent(rf, 1)}</dd>
          <dt><RichText>{'Expected payoff $\\mathbb{E}[X]$'}</RichText></dt>
          <dd>{meanPayoff.toFixed(3)}</dd>
          <dt><RichText>{'At the risk-free rate, $\\mathbb{E}[X]/(1+\\Rf{R^f})$ (dashed)'}</RichText></dt>
          <dd>{riskNeutral.toFixed(3)}</dd>
          <dt><RichText>{'Price $P = \\mathbb{E}[\\SDF{M}X]$ (solid)'}</RichText></dt>
          <dd><strong>{p.toFixed(3)}</strong></dd>
          <dt><RichText>{'Expected return $\\mathbb{E}[\\Ret{R}]$'}</RichText></dt>
          <dd style={{ color: 'var(--c-return)' }}>{percent(expectedReturn, 1)}</dd>
          <dt><RichText>{'Risk premium $-(1+\\Rf{R^f})\\operatorname{Cov}(\\SDF{M}, \\Ret{R^e})$'}</RichText></dt>
          <dd className={premium > 5e-4 ? 'good' : premium < -5e-4 ? 'bad' : undefined}>{percent(premium, 1)}</dd>
        </dl>
      }
      caption="Simulated example, no data. Each column is a state of the world one period from now; the last column is today. Drag a point, or use the sliders. Price and premium come from $P = \mathbb{E}[\SDF{M}X]$ and $\mathbb{E}[\Ret{R^e}] = -(1+\Rf{R^f})\operatorname{Cov}(\SDF{M}, \Ret{R^e})$."
    />
  );
}
