import { Line, MovablePoint, Point } from 'mafs';
import { useMemo, useState } from 'react';
import { discoveryCounts } from '../../lib/stats/multipleTesting';
import { Button, Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { clamp, count } from './format';
import { Label, PlotFrame } from './PlotFrame';
import {
  COUNT_RANGE, DEFAULT_COUNT, DEFAULT_SEED, DEFAULT_TRUE_SHARE, MONTHS, Q, RULES, ruleLine, strategySearch,
  TRUE_SHARE_RANGE, TRUE_SHARPE, type Rule,
} from './multipleTestingSample';

const HEIGHT = 300;
const X: [number, number] = [-4.5, 8.5];
const Y: [number, number] = [0, 2.45];
const LINE: [number, number] = [0.5, 6];
/** Vertical bands of the strip plot: strategies without alpha below, with a true alpha above. */
const NULL_BAND: [number, number] = [0.08, 0.92];
const TRUE_BAND: [number, number] = [1.25, 2.05];
const HANDLE_Y = (NULL_BAND[1] + TRUE_BAND[0]) / 2;
const RULE_NAMES: Record<Rule, string> = {
  single: 'single test at 5%', three: 'the bar of 3', bonferroni: 'Bonferroni at 5%', holm: 'Holm at 5%', bhy: 'BHY at 5%',
};

const pct = (v: number) => `${(v * 100).toFixed(0)}%`;
const minus = (v: number, digits: number) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;

/**
 * Chapter 29: a seeded search over many strategies, a few with a true alpha. Each strategy is a point at its
 * t-statistic, in the top row if its alpha is real and in the bottom row if not. A line on |t| splits
 * discoveries (filled) from the rest (hollow); the reader drags it, slides it or snaps it to a rule.
 */
export default function MultipleTesting() {
  const [n, setN] = useState(DEFAULT_COUNT);
  const [share, setShare] = useState(DEFAULT_TRUE_SHARE);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [rule, setRule] = useState<Rule | 'free'>('single');
  const [free, setFree] = useState(1.96);

  const search = useMemo(() => strategySearch(seed, n, share), [seed, n, share]);
  const line = useMemo(() => (rule === 'free' ? free : ruleLine(search.t, rule)), [rule, free, search]);
  const counts = discoveryCounts(search.t, search.isTrue, line);
  const trueCount = search.isTrue.filter(Boolean).length;
  const nullCount = n - trueCount;
  const discoveries = counts.trueDiscoveries + counts.falseDiscoveries;
  const setLineValue = (v: number) => {
    setFree(clamp(Math.round(v * 100) / 100, ...LINE));
    setRule('free');
  };
  const shownLine = clamp(line, X[0], X[1]);

  const plot = (
    <PlotFrame
      x={X}
      y={Y}
      height={HEIGHT}
      xTicks={[-4, -2, 0, 2, 4, 6, 8]}
      yTicks={[]}
      formatX={(v) => minus(v, 0)}
      xLabel={<tspan style={{ fill: 'var(--c-signal)' }}>t-statistic of the strategy's mean return</tspan>}
      marginLeft={14}
    >
      <Line.Segment point1={[-shownLine, 0]} point2={[-shownLine, TRUE_BAND[1]]} color="var(--text)" weight={1.5} style="dashed" />
      <Line.Segment point1={[shownLine, 0]} point2={[shownLine, TRUE_BAND[1] + 0.2]} color="var(--text)" weight={2} />
      {search.t.map((t, i) => {
        const real = search.isTrue[i];
        const [lo, hi] = real ? TRUE_BAND : NULL_BAND;
        const color = real ? 'var(--c-signal)' : 'var(--c-prob)';
        return (
          <Point
            key={i}
            x={clamp(t, X[0] + 0.1, X[1] - 0.1)}
            y={lo + search.jitter[i] * (hi - lo)}
            color={color}
            svgCircleProps={{ r: 2.6, style: Math.abs(t) > line ? { fillOpacity: 0.8 } : { fill: 'none', stroke: color, strokeWidth: 1.2 } }}
          />
        );
      })}
      <Label x={X[0] + 0.15} y={TRUE_BAND[1] + 0.05} attach="ne" attachDistance={2} size={12} color="var(--c-signal)">{`true alpha: ${trueCount}`}</Label>
      <Label x={X[0] + 0.15} y={NULL_BAND[1] + 0.05} attach="ne" attachDistance={2} size={12} color="var(--text-muted)">{`no alpha: ${nullCount}`}</Label>
      <Label x={shownLine} y={Y[1] - 0.06} attach="e" attachDistance={4} size={12} color="var(--text)">{`|t| = ${line.toFixed(2)}`}</Label>
      <MovablePoint point={[shownLine, HANDLE_Y]} constrain={([x]) => [clamp(x, ...LINE), HANDLE_Y]} onMove={([x]) => setLineValue(x)} color="var(--text)" />
    </PlotFrame>
  );

  const lineName = rule === 'free' ? 'a line you set' : RULE_NAMES[rule];
  return (
    <WidgetFrame
      title="A search over many strategies, and where to draw the line"
      ariaLabel={`A strip plot of the t-statistics of ${n} simulated strategies: ${trueCount} with a true alpha in the top row, and ${nullCount} without alpha in the bottom row. A vertical line at |t| = ${line.toFixed(2)}, ${lineName}, gives ${discoveries} discoveries: ${counts.trueDiscoveries} true and ${counts.falseDiscoveries} false, with ${counts.misses} true strategies missed. The false discovery proportion is ${pct(counts.falseDiscoveryProportion)}.`}
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Line $|t|$" value={line} min={LINE[0]} max={LINE[1]} step={0.01} onChange={setLineValue} format={(v) => v.toFixed(2)} color="var(--text)" />
          <Segmented<Rule | 'free'> label="Snap the line to a rule" value={rule} onChange={setRule} options={RULES} />
          <Slider label="Strategies tried $n$" value={n} min={COUNT_RANGE[0]} max={COUNT_RANGE[1]} step={10} onChange={setN} format={count} />
          <Slider label="Share with a true alpha" value={share} min={TRUE_SHARE_RANGE[0]} max={TRUE_SHARE_RANGE[1]} step={0.01} onChange={setShare} format={pct} color="var(--c-signal)" />
          <Button onClick={() => setSeed((s) => s + 1)}>New seed</Button>
        </>
      }
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            ● filled: a discovery, |t| above the line · ○ hollow: not a discovery.{' '}
            <span style={{ color: 'var(--c-signal)' }}>Top row: true alpha</span> · bottom row: no alpha.
          </p>
          <dl className="readout-grid">
            <dt>Line</dt>
            <dd><RichText>{`$|t| = ${line.toFixed(2)}$`}</RichText></dd>
            <dt>Discoveries</dt>
            <dd>{discoveries} of {n}</dd>
            <dt>True: filled, top</dt>
            <dd>{counts.trueDiscoveries} of {trueCount}</dd>
            <dt>False: filled, bottom</dt>
            <dd>{counts.falseDiscoveries} of {nullCount}</dd>
            <dt>Missed: hollow, top</dt>
            <dd>{counts.misses}</dd>
            <dt>False share (FDP)</dt>
            <dd>{discoveries ? pct(counts.falseDiscoveryProportion) : '0% (no discoveries)'}</dd>
            <dt>Expected false</dt>
            <dd>{counts.expectedFalseDiscoveries.toFixed(1)}</dd>
            <dt>Seed</dt>
            <dd>{seed}</dd>
          </dl>
        </>
      }
      caption={`Simulated (seeded): $n$ strategies with ${MONTHS} months of independent normal returns and a volatility of 15% a year. The strategies with a true alpha have a Sharpe ratio of ${TRUE_SHARPE} a year; the others have a mean of zero. $t = \\bar R/(s/\\sqrt T)$, $p_i = 2\\Phi(-|t_i|)$, the expected false count is $n_0 \\times 2\\Phi(-|t|)$ at the line, and Bonferroni, Holm and BHY run at $q = ${Q * 100}\\%$. Points beyond the axis sit at its edge.`}
    />
  );
}
