import { Line, Point, Polyline } from 'mafs';
import { useEffect, useMemo, useState } from 'react';
import { localCurvature, maxSurplus } from '../../lib/finance/habit';
import { Button, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { extent, niceTicks } from './format';
import {
  HABIT_SEED, HABIT_YEARS, MONTHS_PER_YEAR, TABLE1_GAMMA, TABLE1_PHI_ANNUAL, habitModel, habitView, type HabitModel,
} from './habitSample';
import { Label, PlotFrame, Sub } from './PlotFrame';

const LEVEL_HEIGHT = 170;
const SURPLUS_HEIGHT = 160;
const PC_HEIGHT = 160;
const X_TICKS = [0, 20, 40, 60, 80, 100];
/** How long the sliders must rest before the model is solved again. */
const SETTLE_MS = 200;

const num = (v: number, digits = 3) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const yearLabel = (v: number) => `year ${v.toFixed(1)}`;
const percentAYear = (v: number) => `${num(v * 100, 2)}%`;

interface Solved { gamma: number; phi: number; model: HabitModel }

/**
 * Chapter 37: a seeded century of the Campbell–Cochrane model, simulated monthly. Top: consumption and its
 * habit, both over the trend e^{μ_c t}. Middle: the surplus ratio S_t with S̄ and S_max. Bottom: the
 * price–consumption ratio P_t/C_t it implies. γ and the annual persistence φ^12 move the model, with δ chosen
 * again so r^f stays at 0.94% a year; a cursor reads the local curvature γ/S_t at one date.
 */
export default function HabitSimulator() {
  const [gamma, setGamma] = useState(TABLE1_GAMMA);
  const [phi, setPhi] = useState(TABLE1_PHI_ANNUAL);
  const [seed, setSeed] = useState(HABIT_SEED);
  const [year, setYear] = useState(HABIT_YEARS);
  const [solved, setSolved] = useState<Solved>(() => ({ gamma, phi, model: habitModel(gamma, phi) }));

  // One solve takes 20–180 ms over the slider ranges, so it runs once the sliders rest.
  useEffect(() => {
    if (solved.gamma === gamma && solved.phi === phi) return;
    const id = setTimeout(() => setSolved({ gamma, phi, model: habitModel(gamma, phi) }), SETTLE_MS);
    return () => clearTimeout(id);
  }, [gamma, phi]); // eslint-disable-line react-hooks/exhaustive-deps

  const { model } = solved;
  const pending = solved.gamma !== gamma || solved.phi !== phi;
  const view = useMemo(() => habitView(model, seed), [model, seed]);
  const { path, years, pcYears } = view;

  const lines = useMemo(() => {
    const trend = (t: number) => Math.exp(-model.params.mean * t);
    return {
      consumption: path.c.map((c, t) => [years[t], Math.exp(c) * trend(t)] as [number, number]),
      habit: path.X.map((x, t) => [years[t], x * trend(t)] as [number, number]),
      surplus: path.S.map((s, t) => [years[t], s] as [number, number]),
      pc: pcYears.map((v, t) => [years[t], v] as [number, number]),
    };
  }, [path, years, pcYears, model]);

  const at = Math.round(year * MONTHS_PER_YEAR);
  const surplusNow = path.S[at];
  const curvatureNow = localCurvature(surplusNow, model.params.gamma);
  const lowest = Math.min(...path.S);
  const riskFree = model.solution.riskFree * MONTHS_PER_YEAR;

  const [levelLo, levelHi] = extent([...lines.habit.map((p) => p[1]), ...lines.consumption.map((p) => p[1])]);
  const levelPad = (levelHi - levelLo) * 0.08;
  const level: [number, number] = [levelLo - levelPad, levelHi + 3 * levelPad];
  const surplusTop = Math.max(model.max, ...path.S) * 1.25;
  const [pcLo, pcHi] = extent(pcYears);
  const pcPad = (pcHi - pcLo) * 0.1 || 1;
  const pcRange: [number, number] = [pcLo - pcPad, pcHi + 3 * pcPad];

  const cursor = (range: [number, number]) => (
    <Line.Segment point1={[year, range[0]]} point2={[year, range[1]]} color="var(--text-muted)" weight={1} opacity={0.7} />
  );

  const plot = (
    <>
      <PlotFrame
        x={[0, HABIT_YEARS]} y={level} height={LEVEL_HEIGHT} xTicks={X_TICKS} yTicks={niceTicks(level[0], level[1], 4)}
        formatY={(v) => num(v, 2)} yLabel="consumption and habit ÷ trend" marginLeft={52}
      >
        <Polyline points={lines.consumption} color="var(--text)" weight={1.5} fillOpacity={0} />
        <Polyline points={lines.habit} color="var(--text-muted)" weight={1.5} strokeStyle="dashed" fillOpacity={0} />
        {cursor(level)}
      </PlotFrame>
      <PlotFrame
        x={[0, HABIT_YEARS]} y={[0, surplusTop]} height={SURPLUS_HEIGHT} xTicks={X_TICKS}
        yTicks={niceTicks(0, surplusTop, 4)} formatY={(v) => num(v, 2)} yLabel={<>surplus ratio <Sub base="S" sub="t" /></>} marginLeft={52}
      >
        <Line.Segment point1={[0, model.steady]} point2={[HABIT_YEARS, model.steady]} color="var(--c-model)" weight={1.5} />
        <Line.Segment point1={[0, model.max]} point2={[HABIT_YEARS, model.max]} color="var(--c-model)" weight={1.5} style="dashed" />
        <Label x={HABIT_YEARS} y={model.max} attach="nw" attachDistance={4} size={12} color="var(--c-model)"><Sub base="S" sub="max" /></Label>
        <Polyline points={lines.surplus} color="var(--text)" weight={1.5} fillOpacity={0} />
        {cursor([0, surplusTop])}
        <Point x={year} y={surplusNow} color="var(--text)" svgCircleProps={{ r: 4 }} />
      </PlotFrame>
      <PlotFrame
        x={[0, HABIT_YEARS]} y={pcRange} height={PC_HEIGHT} xTicks={X_TICKS} yTicks={niceTicks(pcRange[0], pcRange[1], 4)}
        formatY={(v) => num(v, 0)} xLabel="years since the start"
        yLabel={<tspan style={{ fill: 'var(--c-signal)' }}>price–consumption ratio (years)</tspan>} marginLeft={52}
      >
        <Polyline points={lines.pc} color="var(--c-signal)" weight={2} fillOpacity={0} />
        {cursor(pcRange)}
        <Point x={year} y={pcYears[at]} color="var(--c-signal)" svgCircleProps={{ r: 4 }} />
      </PlotFrame>
    </>
  );

  return (
    <WidgetFrame
      title="How a habit turns smooth consumption into swinging prices"
      ariaLabel={
        `Three panels over ${HABIT_YEARS} simulated years with seed ${seed}, γ = ${gamma.toFixed(1)} and φ = ${phi.toFixed(2)} a year.`
        + ' Top: consumption and its habit, both divided by trend growth; the habit trails just below consumption.'
        + ` Middle: the surplus ratio, which falls as low as ${num(lowest)} against a steady state of ${num(model.steady)}.`
        + ` Bottom: the price–consumption ratio, from ${num(Math.min(...pcYears), 1)} to ${num(Math.max(...pcYears), 1)} years.`
        + ` At ${yearLabel(year)} the surplus ratio is ${num(surplusNow)} and the local curvature is ${num(curvatureNow, 1)}.`
      }
      plotHeight={LEVEL_HEIGHT + SURPLUS_HEIGHT + PC_HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Utility curvature $\gamma$" value={gamma} min={1} max={4} step={0.1} onChange={setGamma} format={(v) => v.toFixed(1)} />
          <Slider label="Persistence $\phi^{12}$, a year" value={phi} min={0.7} max={0.95} step={0.01} onChange={setPhi} format={(v) => v.toFixed(2)} />
          <Slider label="Date $t$" value={year} min={0} max={HABIT_YEARS} step={0.5} onChange={setYear} format={yearLabel} />
          <Button onClick={() => setSeed((s) => s + 1)}>New seed</Button>
        </>
      }
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span>— solid: consumption</span> · <span style={{ color: 'var(--text-muted)' }}>– – dashed: habit</span> ·{' '}
            <span style={{ color: 'var(--c-model)' }}>flat lines: <RichText>{'$\\bar S$'}</RichText> and <RichText>{'$S_{\\max}$'}</RichText> (dashed)</span> ·{' '}
            <span style={{ color: 'var(--c-signal)' }}>bottom: <RichText>{'$P_t/C_t$'}</RichText></span>
          </p>
          <dl className="readout-grid">
            <dt><RichText>{'Steady state $\\bar S$'}</RichText></dt>
            <dd style={{ color: 'var(--c-model)' }}>{num(model.steady)}</dd>
            <dt><RichText>{'Upper bound $S_{\\max}$'}</RichText></dt>
            <dd style={{ color: 'var(--c-model)' }}>{num(model.max)}</dd>
            <dt><RichText>{'Its log $s_{\\max}$'}</RichText></dt>
            <dd style={{ color: 'var(--c-model)' }}>{num(maxSurplus(model.params), 2)}</dd>
            <dt><RichText>{'Risk-free rate $\\Rf{r^f}$, a year'}</RichText></dt>
            <dd style={{ color: 'var(--c-rf)' }}>{percentAYear(riskFree)}</dd>
            <dt><RichText>{'$\\delta$ that holds it, a year'}</RichText></dt>
            <dd>{num(model.params.delta ** MONTHS_PER_YEAR)}</dd>
            <dt><RichText>{'$S_t$ at the date'}</RichText></dt>
            <dd>{num(surplusNow)}</dd>
            <dt><RichText>{'Local curvature $\\gamma/S_t$'}</RichText></dt>
            <dd>{num(curvatureNow, 1)}</dd>
            <dt><RichText>{'$P_t/C_t$ at the date, years'}</RichText></dt>
            <dd style={{ color: 'var(--c-signal)' }}>{num(pcYears[at], 1)}</dd>
            <dt><RichText>{'Mean $P_t/C_t$, years'}</RichText></dt>
            <dd style={{ color: 'var(--c-signal)' }}>{num(view.meanPc, 1)}</dd>
            <dt>Seed</dt>
            <dd>{seed}{pending ? ' · solving…' : ''}</dd>
          </dl>
        </>
      }
      caption={`Simulated (seeded): ${HABIT_YEARS} years of monthly consumption growth with the mean and volatility of Campbell and Cochrane's (1999) Table 1, ${percentAYear(model.params.mean * MONTHS_PER_YEAR)} and ${percentAYear(model.params.sd * Math.sqrt(MONTHS_PER_YEAR))} a year. The habit follows the law of motion of $s_t$, and $P_t/C_t$ is the price of a claim to all future consumption, solved on a grid of $s_t$ and read off at each month. $\\delta$ is chosen so that $\\Rf{r^f}$ stays at Table 1's ${percentAYear(riskFree)} a year. Top panel: consumption and habit divided by $e^{\\mu_c t}$, their trend growth.`}
    />
  );
}
