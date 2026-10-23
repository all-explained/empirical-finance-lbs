import { Line, Polygon, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { seededSmile, smileVolatility, type SmileParams } from '../../lib/finance/optionBound';
import { Button, Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { DEFAULT_LEVEL, DEFAULT_SEED, flatSmile, FORWARD, MARKET, stripBound } from './optionStripSample';

const SMILE_HEIGHT = 150;
const STRIP_HEIGHT = 260;
const X: [number, number] = [40, 200];
const X_TICKS = [40, 60, 80, 100, 120, 140, 160, 180, 200];
type Shape = 'seeded' | 'flat';

const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;
const visible = (k: number) => k >= X[0] && k <= X[1];

/** y range [0, top] with round ticks that reach above `max`. */
function axis(max: number): { top: number; ticks: number[] } {
  const ticks = niceTicks(0, max, 4);
  const step = ticks[1] - ticks[0];
  const top = Math.ceil((max * 1.08) / step) * step;
  return { top, ticks: niceTicks(0, top, 4) };
}

/**
 * Chapter 15: a seeded volatility smile, the strip of out-of-the-money options it prices
 * (puts left of the forward, calls right of it) and Martin's (2017) lower bound on the
 * expected excess return, with SVIX² and VIX², all from src/lib/finance/optionBound.ts.
 * `initialLevel` is the at-the-money volatility in percent.
 */
export default function OptionStripBound({ initialLevel = Math.round(DEFAULT_LEVEL * 100) }: { initialLevel?: number }) {
  const [levelPct, setLevelPct] = useState(initialLevel);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [shape, setShape] = useState<Shape>('seeded');

  const level = levelPct / 100;
  const target = useMemo(() => (shape === 'flat' ? flatSmile(level) : seededSmile(seed, level)), [shape, seed, level]);
  const result = useMemo(() => stripBound(level, seed, target), [level, seed, target]);

  // The picture morphs between smiles; the readout always shows the target.
  const tLevel = useTweened(target.level);
  const tSkew = useTweened(target.skew);
  const tCurvature = useTweened(target.curvature);
  const drawn = useMemo(() => {
    const smile: SmileParams = { ...target, level: tLevel, skew: tSkew, curvature: tCurvature };
    return { smile, strip: stripBound(tLevel, seed, smile).strip.filter((o) => visible(o.strike)) };
  }, [target, tLevel, tSkew, tCurvature, seed]);

  const targetStrip = result.strip.filter((o) => visible(o.strike));
  const priceAxis = axis(Math.max(...targetStrip.map((o) => o.price)));
  const volAxis = axis(Math.max(...targetStrip.map((o) => smileVolatility(Math.log(o.strike / FORWARD), target))));

  const points = drawn.strip.map((o) => [o.strike, o.price] as [number, number]);
  const firstCall = points.findIndex((_, i) => drawn.strip[i].kind === 'call');
  // put(F) = call(F), so the put curve ends where the call curve starts.
  const puts = points.slice(0, firstCall + 1);
  const calls = points.slice(firstCall);
  const smileLine = drawn.strip.map((o) => [o.strike, smileVolatility(Math.log(o.strike / FORWARD), drawn.smile)] as [number, number]);
  const svix = Math.sqrt(result.svix2);
  const vix = Math.sqrt(result.vix2);

  const plot = (
    <div>
      <PlotFrame
        x={X}
        y={[0, volAxis.top]}
        height={SMILE_HEIGHT}
        xTicks={X_TICKS}
        yTicks={volAxis.ticks}
        formatX={String}
        formatY={(v) => pct(v, 0)}
        yLabel="implied volatility"
      >
        <Line.Segment point1={[FORWARD, 0]} point2={[FORWARD, volAxis.top]} color="var(--axis)" weight={1} style="dashed" />
        <Polyline points={smileLine} color="var(--text)" weight={2} fillOpacity={0} />
      </PlotFrame>
      <PlotFrame
        x={X}
        y={[0, priceAxis.top]}
        height={STRIP_HEIGHT}
        xTicks={X_TICKS}
        yTicks={priceAxis.ticks}
        formatX={String}
        formatY={(v) => v.toFixed(v < 1 && v > 0 ? 1 : 0)}
        xLabel="strike K (index now at 100)"
        yLabel="option price"
      >
        <Polygon points={[[puts[0][0], 0], ...puts, ...calls, [calls.at(-1)![0], 0]]} color="var(--c-prob)" fillOpacity={0.25} weight={0} />
        <Polyline points={puts} color="var(--c-prob)" weight={2.5} strokeStyle="dashed" fillOpacity={0} />
        <Polyline points={calls} color="var(--c-prob)" weight={2.5} fillOpacity={0} />
        <Line.Segment point1={[FORWARD, 0]} point2={[FORWARD, priceAxis.top]} color="var(--axis)" weight={1} style="dashed" />
        <Label x={FORWARD} y={priceAxis.top} attach="se" attachDistance={6} size={12} color="var(--text-muted)">{`forward F = ${FORWARD.toFixed(0)}`}</Label>
        <Label x={X[0] + 6} y={priceAxis.top * 0.55} attach="e" size={12} color="var(--c-prob)">– – puts</Label>
        <Label x={X[1] - 6} y={priceAxis.top * 0.55} attach="w" size={12} color="var(--c-prob)">— calls</Label>
      </PlotFrame>
    </div>
  );

  return (
    <WidgetFrame
      title="The option strip and the bound it implies"
      ariaLabel={`Two panels against the strike, from ${X[0]} to ${X[1]}, with the index at 100 and the forward at ${FORWARD.toFixed(0)}. Top: a ${shape === 'flat' ? 'flat implied volatility' : 'seeded implied-volatility smile, higher at low strikes'}, ${levelPct}% at the money. Bottom: the shaded area under the prices of out-of-the-money puts (dashed, left of the forward) and calls (solid, right of it). It gives SVIX ${pct(svix)}, VIX ${pct(vix)} and a lower bound of ${pct(result.bound)} a year on the expected excess return.`}
      plotHeight={SMILE_HEIGHT + STRIP_HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="At-the-money volatility" value={levelPct} min={10} max={60} step={1} format={(v) => `${v}%`} color="var(--c-prob)" onChange={setLevelPct} />
          <Segmented
            label="Smile"
            value={shape}
            onChange={setShape}
            options={[
              { value: 'seeded', label: 'skewed (seeded)' },
              { value: 'flat', label: 'flat (lognormal)' },
            ]}
          />
          <Button
            onClick={() => {
              setSeed((s) => s + 1);
              setShape('seeded');
            }}
          >
            New draw
          </Button>
        </>
      }
      readout={
        <dl className="readout-grid">
          <dt><RichText>{'Lower bound on $\\mathbb{E}_t[\\Ret{R^e_{t+1}}]$, a year'}</RichText></dt>
          <dd style={{ color: 'var(--c-return)' }}>at least {pct(result.bound, 2)}</dd>
          <dt><RichText>{'$\\mathrm{SVIX}^2$ (variance)'}</RichText></dt>
          <dd style={{ color: 'var(--c-prob)' }}>{result.svix2.toFixed(4)} (SVIX {pct(svix)})</dd>
          <dt><RichText>{'$\\mathrm{VIX}^2$ (entropy)'}</RichText></dt>
          <dd style={{ color: 'var(--c-prob)' }}>{result.vix2.toFixed(4)} (VIX {pct(vix)})</dd>
          <dt>VIX minus SVIX</dt>
          <dd>{`${vix >= svix ? '+' : '−'}${(Math.abs(vix - svix) * 100).toFixed(2)} points`}</dd>
          <dt><RichText>{'Risk-free rate $\\Rf{R^f_t}$'}</RichText></dt>
          <dd style={{ color: 'var(--c-rf)' }}>{pct(MARKET.rfAnnual)} a year</dd>
          <dt>Smile skew, curvature</dt>
          <dd>{`${target.skew.toFixed(3).replace('-', '−')}, ${target.curvature.toFixed(3)}`}</dd>
          <dt>Seed</dt>
          <dd>{shape === 'flat' ? 'none (flat smile)' : seed}</dd>
        </dl>
      }
      caption={`Simulated (seeded), not market data. One-year options on an index at 100 with a risk-free rate of 3% a year. Each price is Black–Scholes at the volatility of the smile $\\sigma(k) = \\max(5\\%,\\ \\text{level} + \\text{skew}\\,k + \\text{curvature}\\,k^2)$, with $k = \\log(K/F)$; a new draw picks a new skew and curvature for a skewed smile. The integrals use strikes from 30 to 300 in steps of 1; the plot shows 40 to 200.`}
    />
  );
}
