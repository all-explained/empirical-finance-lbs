import { Line, Polygon, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { Button, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { conditionalWorld, DEFAULT_SEED, WORLD } from './conditionalSample';
import { extent, niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 150;
const YEARS = WORLD.T / 12;
const pct = (v: number, digits = 1) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const signed = (v: number, digits = 2) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(digits)}`;

/** Contiguous runs of months with high > 0, as [start, end] in years, for the shaded "bad times" bands. */
function badTimes(high: number[]): [number, number][] {
  const runs: [number, number][] = [];
  high.forEach((v, t) => {
    if (!(v > 0)) return;
    const last = runs.at(-1);
    if (last && last[1] === t / 12) last[1] = (t + 1) / 12;
    else runs.push([t / 12, (t + 1) / 12]);
  });
  return runs;
}

/**
 * Chapter 22: a seeded world where the conditional CAPM holds every month, E_t[R^e_{i,t+1}] = β_t λ_t,
 * with β_t and λ_t both linear in a state z_t. Top: β_t; bottom: λ_t, with the months when λ_t is above its mean shaded.
 * The readout splits the mean of β_t λ_t into β̄λ̄ and the covariance, and compares the unconditional
 * OLS alpha with the conditional one.
 */
export default function ConditionalBeta({ initialBetaSlope = WORLD.betaSlope, initialLambdaSlope = WORLD.lambdaSlope }: {
  initialBetaSlope?: number; initialLambdaSlope?: number;
}) {
  const [betaSlope, setBetaSlope] = useState(initialBetaSlope);
  // The slider shows the premium's move in % a year per standard deviation of z_t; the library takes a monthly decimal.
  const [lambdaYear, setLambdaYear] = useState(Math.round(initialLambdaSlope * 1200 * 10) / 10);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const w = useMemo(() => conditionalWorld(seed, betaSlope, lambdaYear / 1200), [seed, betaSlope, lambdaYear]);
  // Bad times: months when the premium is above its mean, s_λ·z_t > 0. With s_λ = 0 nothing is shaded.
  const bands = useMemo(() => badTimes(w.z.map((z) => z * lambdaYear)), [w.z, lambdaYear]);

  const [bLo, bHi] = extent(w.beta);
  const [lLo, lHi] = extent(w.lambda);
  const b0 = useTweened(Math.min(bLo, 0.4) - 0.1);
  // Headroom keeps the axis titles clear of the lines.
  const b1 = useTweened(Math.max(bHi, 1.6) + 0.45);
  const l0 = useTweened(Math.min(lLo, 0) - 0.02);
  const l1 = useTweened(Math.max(lHi, 0.12) + 0.06);
  const xTicks = niceTicks(0, YEARS, 5);
  const meanLambda = WORLD.lambda0 * 12;

  const shade = (lo: number, hi: number) => bands.map(([s, e], i) => (
    <Polygon key={i} points={[[s, lo], [e, lo], [e, hi], [s, hi]]} color="var(--c-signal)" fillOpacity={0.14} strokeOpacity={0} weight={0} />
  ));

  const plot = (
    <div>
      <PlotFrame x={[0, YEARS]} y={[b0, b1]} height={HEIGHT} xTicks={xTicks} yTicks={niceTicks(b0, b1, 4)}
        formatY={(v) => num(v, 1)} yLabel="conditional beta βₜ" marginLeft={40}>
        {shade(b0, b1)}
        <Line.Segment point1={[0, w.meanBeta]} point2={[YEARS, w.meanBeta]} color="var(--text)" weight={1.5} style="dashed" opacity={0.7} />
        <Polyline points={w.beta.map((b, t) => [t / 12, b])} color="var(--text)" weight={1.5} fillOpacity={0} />
        <Label x={YEARS} y={w.meanBeta} attach="nw" attachDistance={4} size={12} color="var(--text-muted)">mean β̄</Label>
      </PlotFrame>
      <PlotFrame x={[0, YEARS]} y={[l0, l1]} height={HEIGHT} xTicks={xTicks} yTicks={niceTicks(l0, l1, 4)}
        formatX={(v) => String(v)} formatY={(v) => pct(v, 0)} xLabel="years"
        yLabel={<tspan style={{ fill: 'var(--c-return)' }}>market premium λₜ, % a year</tspan>}
        baseline={l0 < 0 ? 0 : undefined} marginLeft={40}>
        {shade(l0, l1)}
        <Line.Segment point1={[0, meanLambda]} point2={[YEARS, meanLambda]} color="var(--c-return)" weight={1.5} style="dashed" opacity={0.7} />
        <Polyline points={w.lambda.map((l, t) => [t / 12, l])} color="var(--c-return)" weight={1.5} fillOpacity={0} />
      </PlotFrame>
    </div>
  );

  return (
    <WidgetFrame
      title="A conditional CAPM that holds every month"
      ariaLabel={`Two time series over ${YEARS} simulated years, seed ${seed}. Top: the conditional beta, from ${num(bLo)} to ${num(bHi)}, mean ${num(w.meanBeta)}. Bottom: the market premium, from ${pct(lLo)} to ${pct(lHi)} a year. Shaded bands mark the months when the premium is above its mean, the bad times. The average of beta times premium, ${pct(w.meanProduct)} a year, splits into mean beta times mean premium, ${pct(w.product)}, plus their covariance, ${pct(w.covariance, 2)}. The unconditional CAPM alpha is ${pct(w.alphaU, 2)} a year with standard error ${pct(w.alphaUSE, 2)}; the conditional alpha is ${pct(w.alphaC, 2)}.`}
      plotHeight={2 * HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Beta's move with the state $s_\beta$" value={betaSlope} min={-0.6} max={0.6} step={0.05}
            onChange={setBetaSlope} format={(v) => `${signed(v)} per s.d.`} />
          <Slider label="Premium's move with the state $s_\lambda$" value={lambdaYear} min={-6} max={6} step={0.1}
            onChange={setLambdaYear} format={(v) => `${signed(v, 1)}% a year per s.d.`} color="var(--c-return)" />
          <Button onClick={() => setSeed((s) => s + 1)}>New seed</Button>
        </>
      }
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span>— top line: βₜ</span> · <span style={{ color: 'var(--c-return)' }}>— bottom line: λₜ</span> ·{' '}
            <span style={{ color: 'var(--c-signal)' }}>▮ shaded: λₜ above its mean, bad times</span> · – – dashed: means
          </p>
          <dl className="readout-grid">
            <dt><RichText>{'$\\bar\\beta\\,\\bar\\lambda$'}</RichText></dt>
            <dd>{pct(w.product, 2)} a year</dd>
            <dt><RichText>{'$+\\ \\operatorname{Cov}(\\beta_t, \\lambda_t)$'}</RichText></dt>
            <dd>{pct(w.covariance, 2)} a year</dd>
            <dt><RichText>{'$=$ mean of $\\beta_t\\lambda_t$'}</RichText></dt>
            <dd>{pct(w.meanProduct, 2)} a year</dd>
            <dt><RichText>{'Unconditional $\\Err{\\hat\\alpha^u}$ (± 1 s.e.)'}</RichText></dt>
            <dd style={{ color: 'var(--c-error)' }}>{pct(w.alphaU, 2)} ± {pct(w.alphaUSE, 2)} (t = {num(w.alphaUT)})</dd>
            <dt><RichText>{'Conditional alpha (± 1 s.e.)'}</RichText></dt>
            <dd style={{ color: 'var(--c-error)' }}>{pct(w.alphaC, 2)} ± {pct(w.alphaCSE, 2)}</dd>
            <dt><RichText>{'Unconditional $\\hat\\beta^u$, mean $\\bar\\beta$'}</RichText></dt>
            <dd>{num(w.betaU)}, {num(w.meanBeta)}</dd>
            <dt>Months, seed</dt>
            <dd>{WORLD.T}, {seed}</dd>
          </dl>
        </>
      }
      caption={`Simulated (seeded): $T = ${WORLD.T}$ months. State $\\Signal{z_t}$: AR(1) with persistence ${WORLD.stateRho} a month and standard deviation 1. $\\beta_t = 1 + s_\\beta\\Signal{z_t}$, $\\lambda_t = 0.5\\% + s_\\lambda\\Signal{z_t}$ a month, $\\Ret{R^e_{m,t+1}} = \\lambda_t$ + shock (sd 4.5%), $\\Ret{R^e_{i,t+1}} = \\beta_t\\Ret{R^e_{m,t+1}}$ + shock (sd 3%). Means ×12 to annualise. Unconditional alpha: OLS of $\\Ret{R^e_i}$ on a constant and $\\Ret{R^e_m}$, classical s.e. Conditional alpha: the mean of $\\Ret{R^e_{i,t+1}} - \\beta_t\\Ret{R^e_{m,t+1}}$, with the true $\\beta_t$.`}
    />
  );
}
