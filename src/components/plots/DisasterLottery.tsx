import { Polygon, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { Button, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { DEFAULT_CENTURY_SEED, disasterLottery, LOTTERY, LOTTERY_DEFAULTS, lotteryParams } from './disasterSample';
import { extent, niceTicks, percent } from './format';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 300;
const pct = (v: number, digits = 2) => percent(v, digits);
const listYears = (years: number[]) => (years.length ? `year${years.length === 1 ? '' : 's'} ${years.join(', ')}` : 'none');

/**
 * Chapter 39: a seeded century of an economy with rare disasters. The reader sets π_D, b_D and γ; the readout
 * puts the premium and risk-free rate of the closed forms next to the century's sample premium and its disasters.
 */
export default function DisasterLottery() {
  const [probability, setProbability] = useState(LOTTERY_DEFAULTS.probability);
  const [size, setSize] = useState(LOTTERY_DEFAULTS.size);
  const [gamma, setGamma] = useState(LOTTERY_DEFAULTS.gamma);
  const [seed, setSeed] = useState(DEFAULT_CENTURY_SEED);
  const { pricing, century, level, disasterYears } = useMemo(
    () => disasterLottery(seed, lotteryParams(gamma, probability, size)), [seed, gamma, probability, size],
  );

  const points = level.map((v, t) => [t, v] as [number, number]);
  const [lo, hi] = extent(level);
  const pad = (hi - lo) * 0.08 || 0.1;
  // Headroom above the line holds the axis title and, below it, the D markers, so neither touches the line.
  const [bottom, top] = [lo - pad, hi + 4 * pad];
  const yTicks = niceTicks(bottom, top, 4);
  const { premium, riskFree } = pricing;

  const plot = (
    <PlotFrame
      x={[0, LOTTERY.years]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={[0, 20, 40, 60, 80, 100]}
      yTicks={yTicks}
      formatY={(v) => `${Math.round(v * 100)}%`}
      xLabel="year of the century"
      yLabel="log consumption since year 0"
    >
      {disasterYears.map((t) => (
        <Polygon key={t} points={[[t - 1, bottom], [t, bottom], [t, top], [t - 1, top]]} color="var(--c-prob)" fillOpacity={0.25} strokeOpacity={0} weight={0} />
      ))}
      {disasterYears.map((t, k) => (
        <Label key={`d${t}`} x={t - 0.5} y={top} attach="s" attachDistance={22 + 12 * (k % 2)} size={11} color="var(--text-muted)">D</Label>
      ))}
      <Polyline points={points} color="var(--text)" weight={2} fillOpacity={0} />
    </PlotFrame>
  );

  return (
    <WidgetFrame
      title="A century with rare disasters"
      ariaLabel={`A simulated century (seed ${seed}) of log consumption, which grows about 2% a year. Disasters hit with chance ${pct(probability, 1)} a year and take ${Math.round(size * 100)}% of consumption; this century holds ${century.disasters} (${listYears(disasterYears)}), each a shaded band marked D. At risk aversion ${gamma}, the closed forms give a premium of ${pct(premium.total)} and a risk-free rate of ${pct(riskFree)}; the century's sample premium is ${pct(century.premium)}.`}
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Disaster chance $\Prob{\pi_D}$, a year" value={probability} min={0} max={0.1} step={0.001} format={(v) => `${(v * 100).toFixed(1)}%`} color="var(--c-prob)" onChange={setProbability} />
          <Slider label="Disaster size $b_D$" value={size} min={0} max={0.6} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={setSize} />
          <Slider label="Risk aversion $\gamma$" value={gamma} min={0} max={10} step={0.5} format={(v) => v.toFixed(1)} color="var(--c-model)" onChange={setGamma} />
          <Button onClick={() => setSeed((s) => s + 1)}>New century</Button>
        </>
      }
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span>— line: log consumption</span> · <span>shaded band marked D: a disaster year</span>
          </p>
          <dl className="readout-grid">
            <dt>Premium, closed form</dt>
            <dd style={{ color: 'var(--c-model)' }}>{pct(premium.total)}</dd>
            <dt><RichText>{'Risk-free rate $\\Rf{r^f}$, closed form'}</RichText></dt>
            <dd style={{ color: 'var(--c-rf)' }}>{pct(riskFree)}</dd>
            <dt>Premium, this century</dt>
            <dd style={{ color: 'var(--c-data)' }}>{pct(century.premium)}</dd>
            <dt>Disasters, this century</dt>
            <dd>{century.disasters} ({listYears(disasterYears)})</dd>
            <dt>Seed</dt>
            <dd>{seed}</dd>
          </dl>
        </>
      }
      caption={`Simulated (seeded): ${LOTTERY.years} years of power utility with $\\delta = ${LOTTERY.delta}$. In normal years $\\Delta c$ has mean and standard deviation ${LOTTERY.mean * 100}%; a stock has log-return volatility ${LOTTERY.stockSd * 100}% and no covariance with $\\Delta c$, so its whole premium comes from disasters, in which it loses the fraction $b_D$, as consumption does. Premium: $\\log\\mathbb{E}[e^{r - r^f}]$, a year; the century's is $\\log$ of the mean of $e^{r_t - r^f}$.`}
    />
  );
}
