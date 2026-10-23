import { Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import type { GoyalWelchPredictorName } from '../../lib/finance/outOfSample';
import { Segmented, Select, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks, percent } from './format';
import { Label, PlotFrame } from './PlotFrame';
import {
  DEFAULT_FIRST_YEAR, FIRST_YEAR_MAX, FIRST_YEAR_MIN, PREDICTORS, race, useRuns, type Frequency,
} from './oosSample';

const HEIGHT = 320;
type OnOff = 'off' | 'on';
// The Segmented label is only an aria-label, so each option names what it does.
const SLOPE_OPTIONS = [{ value: 'off' as const, label: 'any slope' }, { value: 'on' as const, label: 'expected slope sign' }];
const FLOOR_OPTIONS = [{ value: 'off' as const, label: 'negative forecasts' }, { value: 'on' as const, label: 'floor at zero' }];

const signed = (v: number, digits: number) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${Math.abs(v).toFixed(digits)}`;
const tickFormat = (ticks: number[]) => {
  const step = ticks.length > 1 ? ticks[1] - ticks[0] : 1;
  const digits = Math.max(0, -Math.floor(Math.log10(step)));
  return (v: number) => (v === 0 ? '0' : signed(v, digits));
};

/**
 * Chapter 13: the running sum of squared-error gains over the historical mean, one line per
 * Goyal–Welch predictor, from the chosen first forecast year. A line that rises means the
 * predictor beat the mean in that period. One predictor is highlighted; the others are muted.
 */
export default function OOSRace({ initialPredictor = 'dp' }: { initialPredictor?: GoyalWelchPredictorName }) {
  const [highlight, setHighlight] = useState<GoyalWelchPredictorName>(initialPredictor);
  const [frequency, setFrequency] = useState<Frequency>('annual');
  const [firstYear, setFirstYear] = useState(DEFAULT_FIRST_YEAR);
  const [slope, setSlope] = useState<OnOff>('off');
  const [floor, setFloor] = useState<OnOff>('off');
  const { runs, done, failed } = useRuns(frequency, { slope: slope === 'on', floor: floor === 'on' });

  const view = useMemo(() => {
    if (!runs) return null;
    const races = runs.map((run) => race(run, firstYear, frequency));
    const i = PREDICTORS.findIndex((p) => p.key === highlight);
    const [lo, hi] = extent([0, ...races.flatMap((r) => r.gain)]);
    const ahead = races.filter((r) => r.gain.at(-1)! > 0).length;
    return { races, chosen: races[i], predictor: PREDICTORS[i], lo, hi, ahead };
  }, [runs, firstYear, frequency, highlight]);

  const pad = view ? (view.hi - view.lo) * 0.08 : 0.01;
  const bottom = useTweened((view?.lo ?? -0.1) - pad);
  // Extra headroom keeps the axis title clear of the highest line.
  const top = useTweened((view?.hi ?? 0.1) + 3 * pad);
  const x0 = firstYear;
  const x1 = 2026;
  const yTicks = niceTicks(bottom, top, 5);
  const waiting = failed ? 'The data did not load.' : `Computing the real-time forecasts… ${done} of ${PREDICTORS.length} predictors`;

  const plot = view ? (
    <PlotFrame
      x={[x0, x1]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={niceTicks(x0, x1, 6)}
      yTicks={yTicks}
      formatY={tickFormat(yTicks)}
      xLabel="year"
      yLabel="cumulative squared-error gain over the mean"
      baseline={0}
      marginLeft={52}
    >
      {view.races.map((r, i) => PREDICTORS[i].key === highlight ? null : (
        <Polyline key={PREDICTORS[i].key} points={r.x.map((x, t) => [x, r.gain[t]])} color="var(--axis)" weight={1} fillOpacity={0} />
      ))}
      <Polyline points={view.chosen.x.map((x, t) => [x, view.chosen.gain[t]])} color="var(--c-signal)" weight={3} fillOpacity={0} />
      <Label x={view.chosen.x.at(-1)!} y={view.chosen.gain.at(-1)!} attach="w" attachDistance={6} size={13} color="var(--c-signal)">
        {view.predictor.key}
      </Label>
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{waiting}</p>
  );

  const restrictions = [slope === 'on' && 'the slope sign restriction', floor === 'on' && 'the zero floor'].filter(Boolean);
  const cw = view?.chosen.clarkWest;
  return (
    <WidgetFrame
      title="Which predictors beat the historical mean in real time?"
      ariaLabel={
        view
          ? `Line chart of the cumulative squared-error gain over the historical mean for 12 predictors, ${frequency} forecasts from ${view.chosen.first.slice(0, 7)} to ${view.chosen.last.slice(0, 7)}, ${restrictions.length ? `with ${restrictions.join(' and ')}` : 'with no restrictions'}. A rising line means the predictor forecast better than the mean. The highlighted ${view.predictor.name} ends at ${signed(view.chosen.gain.at(-1)!, 3)}, an out-of-sample R squared of ${percent(view.chosen.r2, 2)}. ${view.ahead} of 12 predictors end above zero.`
          : 'Line chart of cumulative squared-error gains of 12 predictors over the historical mean. The forecasts are being computed.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Select label="Highlighted predictor" value={highlight} onChange={setHighlight}
            options={PREDICTORS.map((p) => ({ value: p.key, label: p.name }))} />
          <Segmented label="Data frequency" value={frequency} onChange={setFrequency} options={[
            { value: 'annual', label: 'annual' },
            { value: 'monthly', label: 'monthly' },
          ]} />
          <Slider label="First forecast year" value={firstYear} min={FIRST_YEAR_MIN} max={FIRST_YEAR_MAX} onChange={setFirstYear} />
          <Segmented label="Slope sign restriction" value={slope} onChange={setSlope} options={SLOPE_OPTIONS} />
          <Segmented label="Forecast floor at zero" value={floor} onChange={setFloor} options={FLOOR_OPTIONS} />
        </>
      }
      readout={
        view ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-signal)' }}>thick line: {view.predictor.name}</span> · thin lines: the other 11
            </p>
            <dl className="readout-grid">
              <dt><RichText>{'$R^2_{OS}$'}</RichText></dt>
              <dd className={view.chosen.r2 > 0 ? 'good' : view.chosen.r2 < 0 ? 'bad' : undefined}>{percent(view.chosen.r2, 2)}</dd>
              <dt>Clark–West statistic</dt>
              <dd>{signed(cw!.statistic, 2)}</dd>
              <dt>Its one-sided p-value</dt>
              <dd>{cw!.pValue.toFixed(3)}</dd>
              <dt>Certainty-equivalent gain, per year</dt>
              <dd className={view.chosen.ceGain > 0 ? 'good' : view.chosen.ceGain < 0 ? 'bad' : undefined}>{percent(view.chosen.ceGain, 2)}</dd>
              <dt>Forecasts</dt>
              <dd>{view.chosen.x.length}</dd>
              <dt>Years forecast</dt>
              <dd>{view.chosen.first.slice(0, 4)}–{view.chosen.last.slice(0, 4)}</dd>
              <dt>Predictors ending above zero</dt>
              <dd>{view.ahead} of 12</dd>
            </dl>
          </>
        ) : (
          <p>{waiting}</p>
        )
      }
      caption="Data: goyal-welch-annual and goyal-welch-monthly (Goyal & Welch (2008), with Amit Goyal's update to 2025). Log excess return of the CRSP S&P 500 over the risk-free rate, 1926–2025. At each date the forecast regresses $\Ret{r^e_{s+1}}$ on $\Signal{x_s}$ with only the data known then, from 20 years after the predictor's data begin; the benchmark is the mean return to date. The slope restriction uses the mean when the slope has the wrong sign (signs are our choice, in the predictor list of the chapter); the floor replaces a negative forecast by zero. Certainty-equivalent gain: mean–variance investor with $\gamma = 3$, weight in [0, 1.5], variance from the same past returns, annualised. Point estimates: the Clark–West p-value uses the normal approximation."
    />
  );
}
