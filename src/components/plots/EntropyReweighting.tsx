import { Line, Point } from 'mafs';
import { useMemo, useState } from 'react';
import { Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { ENTROPY_GAMMAS, ENTROPY_SAMPLES, JG_LAST_YEAR, useEntropyViews, type EntropySampleName } from './disasterSample';
import { percent } from './format';
import { Label, PlotFrame } from './PlotFrame';

const HEIGHT = 300;
const NAMES: Record<EntropySampleName, string> = { full: 'To 2025', jg: `To ${JG_LAST_YEAR}` };
const pct = (v: number, digits = 1) => percent(v, digits).replace('+', '');

/**
 * Chapter 39: the years of the annual sample with their equal weight 1/T and the relative entropy weight π_t
 * that prices the Euler moment at the chosen γ. Weights are drawn as T π_t, so equal weight is 1.
 */
export default function EntropyReweighting() {
  const { views, failed } = useEntropyViews();
  const [name, setName] = useState<EntropySampleName>('full');
  const [gamma, setGamma] = useState(10);
  const view = views?.[name];
  const top = useMemo(() => view && Math.ceil(Math.max(...view.profile.points.flatMap((p) => p.weights)) * view.years.length), [view]);

  const controls = (
    <>
      <Segmented label="Sample" value={name} onChange={setName} options={ENTROPY_SAMPLES.map((s) => ({ value: s, label: NAMES[s] }))} />
      <Slider label="Risk aversion $\gamma$" value={gamma} min={ENTROPY_GAMMAS[0]} max={ENTROPY_GAMMAS.at(-1)!} step={0.5} format={(v) => v.toFixed(1)} color="var(--c-model)" onChange={setGamma} />
    </>
  );

  if (!view || !top) {
    const message = failed ? 'The data did not load.' : 'Loading the data…';
    return (
      <WidgetFrame
        title="How the entropy estimator reweights the years"
        ariaLabel="The weight of each year of the annual sample. The data is loading."
        plotHeight={HEIGHT}
        plot={<p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{message}</p>}
        controls={controls}
        readout={<p>{message}</p>}
      />
    );
  }

  const { years, profile } = view;
  const T = years.length;
  const point = profile.points.find((p) => p.gamma === gamma);
  const worst = profile.worstYears.map((t) => years[t]);
  const period = `${years[0]}–${years.at(-1)}`;
  const largest = point && point.weights.reduce((best, w, t) => (w > point.weights[best] ? t : best), 0);
  const [x0, x1] = [years[0] - 1, years.at(-1)! + 1];

  const plot = (
    <PlotFrame
      x={[x0, x1]}
      y={[0, top]}
      height={HEIGHT}
      xTicks={[1940, 1960, 1980, 2000, 2020].filter((y) => y > x0 && y < x1)}
      yTicks={Array.from({ length: top + 1 }, (_, k) => k)}
      formatY={(v) => `${v}×`}
      xLabel="year"
      yLabel="weight × T (1 = equal weight)"
      marginLeft={36}
    >
      <Line.Segment point1={[x0, 1]} point2={[x1, 1]} color="var(--text)" weight={1.5} style="dashed" />
      {point && years.map((year, t) => (
        <Line.Segment key={year} point1={[year, 1]} point2={[year, T * point.weights[t]]} color="var(--c-prob)" weight={2} />
      ))}
      {point && years.map((year, t) => <Point key={`p${year}`} x={year} y={T * point.weights[t]} color="var(--c-prob)" opacity={0.9} svgCircleProps={{ r: 3 }} />)}
      {profile.worstYears.map((t) => (
        <Label key={`w${t}`} x={years[t]} y={0} attach="n" attachDistance={2} size={11} color="var(--text-muted)">▼</Label>
      ))}
      {!point && (
        <Label x={(x0 + x1) / 2} y={top / 2} attach="n" size={13} color="var(--text-muted)">no weights price the moment at this γ</Label>
      )}
    </PlotFrame>
  );

  return (
    <WidgetFrame
      title="How the entropy estimator reweights the years"
      ariaLabel={point
        ? `Each year of ${period} with its relative entropy weight times ${T}, as a dot on a stem from the dashed equal-weight line at 1, at risk aversion ${gamma}. The largest weight goes to ${years[largest!]}, ${(T * point.weights[largest!]).toFixed(2)} times equal weight. The four years with the largest consumption falls, ${worst.join(', ')}, are marked on the axis and hold ${pct(point.worstWeight)} of the weight, against ${pct(4 / T)} at equal weights. The relative entropy is ${point.entropy.toFixed(4)}.`
        : `Each year of ${period}. At risk aversion ${gamma} no positive weights price the Euler moment, so none are drawn.`}
      plotHeight={HEIGHT}
      plot={plot}
      controls={controls}
      readout={
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span>– – dashed line: equal weight 1/T</span> ·{' '}
            <span style={{ color: 'var(--c-prob)' }}>● dot on a stem: entropy weight <RichText>{'$\\Prob{\\pi_t}$'}</RichText></span> · <span>▼ on the axis: the four largest consumption falls, {worst.join(', ')}</span>
          </p>
          {point ? (
            <dl className="readout-grid">
              <dt><RichText>{'Relative entropy $\\mathit{KL}(\\gamma)$'}</RichText></dt>
              <dd>{point.entropy.toFixed(4)}</dd>
              <dt>Weight on the four ▼ years</dt>
              <dd>{pct(point.worstWeight)} (equal {pct(4 / T)})</dd>
              <dt>Largest weight</dt>
              <dd>{years[largest!]}, {(T * point.weights[largest!]).toFixed(2)}×</dd>
              <dt><RichText>{'Test $\\mathit{LR}(\\gamma)$, $\\chi^2_1$'}</RichText></dt>
              <dd className={point.pValue < 0.05 ? 'bad' : undefined}>{point.statistic.toFixed(2)}, p = {point.pValue.toFixed(3)}{point.pValue < 0.05 ? ', rejected' : ''}</dd>
              <dt><RichText>{'Estimate $\\hat\\gamma$, both criteria'}</RichText></dt>
              <dd>{profile.best.entropy.toFixed(1)}</dd>
            </dl>
          ) : (
            <p className="bad">No weights: at this γ every Euler moment has the same sign, so no positive weights make them average to zero.</p>
          )}
        </>
      }
      caption={`Data: real nondurables and services per person from fred-consumption-annual, with the CRSP value-weighted return, the T-bill rate and inflation from goyal-welch-annual, ${period}, ${T} years. Moment: $g_t(\\gamma) = e^{-\\gamma\\Delta c_t}R^e_t$. Weights: $\\Prob{\\pi_t} \\propto e^{\\ell g_t}$, with $\\ell$ set so that $\\sum_t \\Prob{\\pi_t} g_t = 0$.`}
    />
  );
}
