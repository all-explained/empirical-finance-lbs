import { Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { filterWeightFromKroencke, kroenckeUnfilterParameters } from '../../lib/finance/consumptionMeasurement';
import { Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { extent, niceTicks } from './format';
import { PlotFrame } from './PlotFrame';
import { consumptionMeasures, measureStats, useConsumptionData } from './consumptionSample';

const HEIGHT = 300;
const MAX_WEIGHT = 0.8;
const KROENCKE = [
  { value: filterWeightFromKroencke(kroenckeUnfilterParameters.timeAveraged), name: 'averaging' },
  { value: filterWeightFromKroencke(kroenckeUnfilterParameters.timeAveragedAndFiltered), name: 'averaging + filter' },
];
const PRESETS = [{ value: 0, name: 'as reported' }, ...KROENCKE];

const pct = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const key = (w: number) => w.toFixed(2);

/**
 * Chapter 36: annual consumption growth as NIPA reports it and unfiltered with weight φ,
 * Δc_t = (Δc^NIPA_t − φ Δc^NIPA_{t−1})/(1 − φ), from 1931 to the last year of the data. The readout gives
 * each series' volatility, autocorrelation, correlation with the log real market return and implied γ.
 */
export default function UnfilterConsumption() {
  const { data, failed } = useConsumptionData();
  const [weight, setWeight] = useState(KROENCKE[1].value);
  const view = useMemo(() => {
    if (!data) return null;
    const { annual, unfiltered } = consumptionMeasures(data, weight);
    const years = unfiltered.dates.map((d) => Number(d.slice(0, 4)));
    return { years, annual, unfiltered, stats: { annual: measureStats(annual), unfiltered: measureStats(unfiltered) } };
  }, [data, weight]);

  const [lo, hi] = view ? extent([...view.annual.dc, ...view.unfiltered.dc]) : [-0.1, 0.1];
  const pad = (hi - lo) * 0.08;
  const bottom = useTweened(lo - pad);
  const top = useTweened(hi + 2 * pad);
  const preset = PRESETS.find((p) => key(p.value) === key(weight));

  const plot = view ? (
    <PlotFrame
      x={[view.years[0] - 1, view.years[view.years.length - 1] + 1]}
      y={[bottom, top]}
      height={HEIGHT}
      xTicks={[1940, 1960, 1980, 2000, 2020]}
      yTicks={niceTicks(bottom, top, 5)}
      formatY={(v) => pct(v, 0)}
      xLabel="year"
      yLabel="real consumption growth"
      baseline={0}
    >
      <Polyline points={view.years.map((y, t) => [y, view.unfiltered.dc[t]] as [number, number])} color="var(--c-model)" weight={2} strokeStyle="dashed" fillOpacity={0} />
      <Polyline points={view.years.map((y, t) => [y, view.annual.dc[t]] as [number, number])} color="var(--c-data)" weight={2.5} fillOpacity={0} />
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const s = view?.stats;
  return (
    <WidgetFrame
      title="Undoing the NIPA filter"
      ariaLabel={s
        ? `Annual real consumption growth, ${s.annual.first} to ${s.annual.last}: as measured (solid line) and unfiltered with weight ${key(weight)} (dashed line). Volatility ${pct(s.annual.sd)} against ${pct(s.unfiltered.sd)}; correlation with the market return ${num(s.annual.correlation)} against ${num(s.unfiltered.correlation)}; implied risk aversion ${s.annual.gamma.toFixed(0)} against ${s.unfiltered.gamma.toFixed(0)}.`
        : 'Measured and unfiltered consumption growth. The data is loading.'}
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider
            label="Filter weight $\varphi$"
            value={weight}
            min={0}
            max={MAX_WEIGHT}
            step={0.01}
            onChange={setWeight}
            format={(v) => `${key(v)}${KROENCKE.some((k) => key(k.value) === key(v)) ? ' (Kroencke)' : ''}`}
            color="var(--c-model)"
          />
          <Segmented
            label="Kroencke's recommended weights"
            value={preset ? key(preset.value) : ''}
            options={PRESETS.map((p) => ({ value: key(p.value), label: `${key(p.value)}: ${p.name}` }))}
            onChange={(v) => setWeight(Number(v))}
          />
        </>
      }
      readout={s && (
        <>
          <p style={{ margin: '0 0 0.5rem' }}>
            <span style={{ color: 'var(--c-data)' }}>━ measured (annual averages)</span> ·{' '}
            <span style={{ color: 'var(--c-model)' }}>– – unfiltered, <RichText>{`$\\varphi = ${key(weight)}$`}</RichText></span>
          </p>
          <table className="iter-table">
            <caption style={{ textAlign: 'left', color: 'var(--text-muted)' }}>{s.annual.first}–{s.annual.last}, {s.annual.observations} years</caption>
            <thead>
              <tr><th scope="col" /><th scope="col">Measured</th><th scope="col">Unfiltered</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row" style={{ textAlign: 'left' }}>Volatility</th><td>{pct(s.annual.sd)}</td><td>{pct(s.unfiltered.sd)}</td></tr>
              <tr><th scope="row" style={{ textAlign: 'left' }}>Autocorrelation</th><td>{num(s.annual.autocorrelation)}</td><td>{num(s.unfiltered.autocorrelation)}</td></tr>
              <tr><th scope="row" style={{ textAlign: 'left' }}>Corr. with market</th><td>{num(s.annual.correlation)}</td><td>{num(s.unfiltered.correlation)}</td></tr>
              <tr><th scope="row" style={{ textAlign: 'left' }}><RichText>{'Implied $\\gamma$'}</RichText></th><td>{s.annual.gamma.toFixed(0)}</td><td>{s.unfiltered.gamma.toFixed(0)}</td></tr>
            </tbody>
          </table>
        </>
      )}
      caption={`Data: fred-consumption-annual (real nondurables and services per person) and goyal-welch-annual (CRSP value-weighted return, T-bill rate and inflation)${s ? `, ${s.annual.first}–${s.annual.last}` : ''}. Each year's growth goes with the same year's log real market return. Implied $\\gamma = (\\mathbb{E}[r - r^f] + \\tfrac12\\sigma_i^2)/\\sigma_{ic}$, the lognormal Euler equation of the market.`}
    />
  );
}
