import { Line, Point, Polygon, Polyline } from 'mafs';
import { useMemo, useState } from 'react';
import { bartlettWeights, overlapMeanVariance } from '../../lib/stats/autocorr';
import { Button, Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { niceTicks } from './format';
import { PlotFrame } from './PlotFrame';
import { DEFAULT_SEED, hacPath, MAX_LAG, SIM_SIGMA, useMonthlyReturns, type Source } from './hacSample';

const ACF_HEIGHT = 220;
const SE_HEIGHT = 190;
const LAG_TICKS = [0, 4, 8, 12, 16, 20, 24];

const pct = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(digits)}%`;
const num = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;

/**
 * Chapter 4: regress overlapping k-month log returns on a constant. Top: the residual
 * autocorrelations with the Bartlett weights of lag length L. Bottom: the Newey–West
 * standard error of the mean, annualised, for every L from 0 to 24.
 */
export default function HACLagExplorer({ initialL = 0 }: { initialL?: number }) {
  const [L, setL] = useState(initialL);
  const [k, setK] = useState<'1' | '12'>('12');
  const [source, setSource] = useState<Source>('data');
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const { r, label, failed } = useMonthlyReturns(source, seed);
  const months = Number(k);
  // Mean and standard errors of a k-month return, scaled to a year.
  const perYear = 12 / months;

  const path = useMemo(() => (r ? hacPath(r, months) : null), [r, months]);
  const trueSE = path && source === 'sim'
    ? Math.sqrt(overlapMeanVariance(months, path.y.length, SIM_SIGMA ** 2)) * perYear
    : null;
  const weights = bartlettWeights(L);

  const rhoLo = path ? Math.min(-0.1, ...path.rho) : -0.1;
  const acfBottom = useTweened(rhoLo - 0.05);
  const seTop = useTweened(path ? Math.max(...path.se, trueSE ?? 0) * perYear * 1.25 : 0.02);

  const plot = path ? (
    <div>
      <PlotFrame
        x={[0, MAX_LAG + 0.7]}
        y={[acfBottom, 1.12]}
        height={ACF_HEIGHT}
        xTicks={LAG_TICKS}
        yTicks={niceTicks(acfBottom, 1, 4)}
        formatY={(v) => num(v, 1)}
        xLabel="lag j (months)"
        yLabel="residual autocorrelation"
        baseline={0}
      >
        {path.rho.slice(1).map((rho, i) => {
          const j = i + 1;
          return (
            <Polygon
              key={`b${j}`}
              points={[[j - 0.35, 0], [j + 0.35, 0], [j + 0.35, rho], [j - 0.35, rho]]}
              color="var(--c-error)"
              fillOpacity={j <= L ? 0.7 : 0.15}
              strokeOpacity={j <= L ? 1 : 0.35}
              weight={1}
            />
          );
        })}
        <Polyline
          points={[...weights.map((w, j) => [j, w] as [number, number]), [L + 1, 0]]}
          color="var(--text)" weight={2} strokeStyle="dashed" fillOpacity={0}
        />
        {weights.map((w, j) => <Point key={`w${j}`} x={j} y={w} color="var(--text)" />)}
      </PlotFrame>
      <PlotFrame
        x={[0, MAX_LAG + 0.7]}
        y={[0, seTop]}
        height={SE_HEIGHT}
        xTicks={LAG_TICKS}
        yTicks={niceTicks(0, seTop, 4)}
        formatY={(v) => pct(v, 1)}
        xLabel="lag length L"
        yLabel="standard error of the mean, per year"
      >
        {trueSE !== null && (
          <Line.Segment point1={[0, trueSE]} point2={[MAX_LAG, trueSE]} color="var(--c-model)" weight={2} style="dashed" />
        )}
        <Polyline points={path.se.map((se, l) => [l, se * perYear] as [number, number])} color="var(--text)" weight={2} fillOpacity={0} />
        <Point x={L} y={path.se[L] * perYear} color="var(--text)" />
        <Point x={0} y={path.se[0] * perYear} color="var(--text-muted)" />
      </PlotFrame>
    </div>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const horizon = months === 1 ? 'one-month' : '12-month';
  return (
    <WidgetFrame
      title="How the lag length L changes the standard error"
      ariaLabel={
        path
          ? `Two charts for ${horizon} log returns, ${label}. Top: residual autocorrelations at lags 1 to 24, from ${num(path.rho[1])} at lag 1 to ${num(path.rho[MAX_LAG])} at lag 24, with Bartlett weights for L = ${L} falling from 1 to 0. Bottom: the Newey–West standard error of the mean return, which is ${pct(path.se[0] * perYear)} a year at L = 0 and ${pct(path.se[L] * perYear)} at L = ${L}.`
          : 'Residual autocorrelations and Newey–West standard errors. The data is loading.'
      }
      plotHeight={ACF_HEIGHT + SE_HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Lag length $L$" value={L} min={0} max={MAX_LAG} onChange={setL} format={(v) => `${v} months`} />
          <Segmented label="Return horizon" value={k} onChange={setK} options={[
            { value: '1', label: '1 month' },
            { value: '12', label: '12 months, overlapping' },
          ]} />
          <Segmented label="Data" value={source} onChange={setSource} options={[
            { value: 'data', label: 'shiller-monthly' },
            { value: 'sim', label: 'simulated (seeded)' },
          ]} />
          <Button onClick={() => { setSource('sim'); setSeed((s) => s + 1); }}>Re-roll simulation</Button>
        </>
      }
      readout={
        path ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-error)' }}>▮ bars: residual autocorrelation (faded beyond L)</span>
              {' · '}<span>– – ● dashed line: Bartlett weights</span>
              {trueSE !== null && <> · <span style={{ color: 'var(--c-model)' }}>– – flat dashed: true standard error</span></>}
            </p>
            <dl className="readout-grid">
              <dt>Mean log return, per year</dt>
              <dd>{pct(path.mean * perYear)}</dd>
              <dt><RichText>{`Standard error at $L = ${L}$`}</RichText></dt>
              <dd>{pct(path.se[L] * perYear)} (t = {num(path.mean / path.se[L], 1)})</dd>
              {L > 0 && (
                <>
                  <dt><RichText>{'Standard error at $L = 0$'}</RichText></dt>
                  <dd>{pct(path.se[0] * perYear)} (t = {num(path.mean / path.se[0], 1)})</dd>
                </>
              )}
              {trueSE !== null && (
                <>
                  <dt>True standard error</dt>
                  <dd style={{ color: 'var(--c-model)' }}>{pct(trueSE)}</dd>
                </>
              )}
              <dt>Autocorrelation at lag 1 and 12</dt>
              <dd style={{ color: 'var(--c-error)' }}>{num(path.rho[1])} and {num(path.rho[12])}</dd>
              <dt>Observations</dt>
              <dd>{path.y.length.toLocaleString('en-US')} {horizon} returns</dd>
              {source === 'sim' && (
                <>
                  <dt>Seed</dt>
                  <dd>{seed}</dd>
                </>
              )}
            </dl>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption={
        source === 'data'
          ? `Data: ${label} (Shiller (2015), updated online data), monthly log returns of the S&P composite with dividends. The ${horizon} returns are regressed on a constant. Newey–West standard errors with $L$ lags; means and standard errors are multiplied by $12/k$ to give a yearly figure.`
          : `Simulated (seeded): 600 independent monthly log returns with mean 0.5% and volatility 4.5%. The ${horizon} returns are regressed on a constant. The flat dashed line is the true standard error of the mean, known here because the returns are independent by construction.`
      }
    />
  );
}
