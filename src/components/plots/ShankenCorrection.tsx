import { Line, Point } from 'mafs';
import { useEffect, useMemo, useState } from 'react';
import { invCdf } from '../../lib/math/normal';
import { annualiseMean } from '../../lib/stats/moments';
import { Button, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { useFactorData } from './factorTestSample';
import { extent, niceTicks } from './format';
import { Label, PlotFrame } from './PlotFrame';
import {
  DEFAULT_SEED, ff3Shanken, LAMBDA, N, REPLICATIONS, RESIDUAL_SD, TRUE_BETA, twoPassWorld, type World, type WorldOptions,
} from './shankenSample';

const BETA_HEIGHT = 230;
const CI_HEIGHT = 300;
/** Intervals drawn: the first replications. */
const SHOWN = 20;
const Z = invCdf(0.975);

const num = (v: number, digits = 3) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const pctYear = (monthly: number, digits = 2) => `${num(annualiseMean(monthly) * 100, digits)}%`;
const share = (v: number) => `${(v * 100).toFixed(1)}%`;

/**
 * Chapter 18: a seeded one-factor world in which the two-pass estimator runs REPLICATIONS times.
 * Top: the first replication's first-pass betas against the true betas. Bottom: the naive and
 * Shanken-corrected 95% intervals for λ in the first SHOWN replications, next to the true λ.
 * The readout adds the coverage over all replications and the two standard errors of the FF3
 * market premium on the 25 size–B/M portfolios.
 */
export default function ShankenCorrection({ initialSharpe = 0.4, initialT = 600 }: { initialSharpe?: number; initialT?: number }) {
  const { data, failed } = useFactorData();
  const ff3 = useMemo(() => (data ? ff3Shanken(data) : null), [data]);
  const [params, setParams] = useState<WorldOptions>({ sharpe: initialSharpe, T: initialT, seed: DEFAULT_SEED });
  const [sim, setSim] = useState<{ params: WorldOptions; world: World } | null>(null);

  // 200 replications take a second or two: run them once the sliders rest.
  useEffect(() => {
    const id = setTimeout(() => setSim({ params, world: twoPassWorld(params) }), sim ? 200 : 0);
    return () => clearTimeout(id);
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const view = useMemo(() => {
    if (!sim) return null;
    const w = sim.world;
    const intervals = w.lambdaHat.slice(0, SHOWN).map((l, r) => {
      const at = (se: number) => [annualiseMean(l - Z * se) * 100, annualiseMean(l + Z * se) * 100] as const;
      const naive = at(w.naiveSE[r]);
      const corrected = at(w.correctedSE[r]);
      const truth = annualiseMean(LAMBDA) * 100;
      return {
        mid: annualiseMean(l) * 100,
        naive, corrected,
        naiveMiss: truth < naive[0] || truth > naive[1],
        correctedMiss: truth < corrected[0] || truth > corrected[1],
      };
    });
    return { ...sim.params, w, intervals, betaRange: extent([...w.betaHat, ...TRUE_BETA]), ciRange: extent(intervals.flatMap((i) => [...i.naive, ...i.corrected])) };
  }, [sim]);

  const pending = !!sim && sim.params !== params;
  const truth = annualiseMean(LAMBDA) * 100;
  const yLo = useTweened(view ? Math.min(view.betaRange[0], 0.4) : 0.4);
  const yHi = useTweened(view ? Math.max(view.betaRange[1], 1.6) : 1.6);
  const x0 = useTweened(view ? Math.min(view.ciRange[0], truth) : 0);
  const x1 = useTweened(view ? Math.max(view.ciRange[1], truth) : 12);
  const pad = (x1 - x0) * 0.08;

  const plot = view ? (
    <div>
      <PlotFrame
        x={[0.4, 1.6]}
        y={[yLo, yHi]}
        height={BETA_HEIGHT}
        xTicks={[0.5, 0.75, 1, 1.25, 1.5]}
        yTicks={niceTicks(yLo, yHi, 5)}
        formatX={(v) => num(v, 2)}
        formatY={(v) => num(v, 1)}
        xLabel="true beta"
        yLabel="first-pass estimate"
      >
        <Line.Segment point1={[0.4, 0.4]} point2={[1.6, 1.6]} color="var(--text)" weight={1.5} style="dashed" />
        <Label x={1.6} y={yLo} attach="nw" attachDistance={6} size={12} color="var(--text)">dashed: estimate = truth</Label>
        {view.w.betaHat.map((b, i) => (
          <Line.Segment key={`e${i}`} point1={[TRUE_BETA[i], TRUE_BETA[i]]} point2={[TRUE_BETA[i], b]} color="var(--c-error)" weight={1.5} />
        ))}
        {view.w.betaHat.map((b, i) => <Point key={i} x={TRUE_BETA[i]} y={b} color="var(--c-data)" />)}
      </PlotFrame>
      <PlotFrame
        x={[x0 - pad, x1 + pad]}
        y={[0, SHOWN + 1.6]}
        height={CI_HEIGHT}
        xTicks={niceTicks(x0 - pad, x1 + pad, 6)}
        yTicks={[]}
        formatX={(v) => `${num(v, 1)}%`}
        xLabel="premium λ, % a year"
        yLabel={`first ${SHOWN} samples`}
      >
        <Line.Segment point1={[truth, 0]} point2={[truth, SHOWN + 1]} color="var(--text)" weight={1.5} style="dashed" />
        <Label x={truth} y={SHOWN + 1} attach="e" attachDistance={4} size={12} color="var(--text)">true λ</Label>
        {view.intervals.map((iv, r) => {
          const y = SHOWN - r;
          return (
            <g key={r}>
              <Line.Segment point1={[iv.naive[0], y + 0.18]} point2={[iv.naive[1], y + 0.18]} style="dashed" weight={2}
                color={iv.naiveMiss ? 'var(--c-error)' : 'var(--text-muted)'} />
              <Line.Segment point1={[iv.corrected[0], y - 0.18]} point2={[iv.corrected[1], y - 0.18]} weight={3}
                color={iv.correctedMiss ? 'var(--c-error)' : 'var(--c-model)'} />
              <Point x={iv.mid} y={y} color="var(--c-data)" />
              {(iv.naiveMiss || iv.correctedMiss) && (
                <Label x={Math.max(iv.naive[1], iv.corrected[1])} y={y} attach="e" attachDistance={6} size={11} color="var(--c-error)">
                  {iv.correctedMiss ? '✕ both miss' : '✕ naive misses'}
                </Label>
              )}
            </g>
          );
        })}
      </PlotFrame>
    </div>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>Simulating…</p>
  );

  const set = (key: 'sharpe' | 'T') => (value: number) => setParams((p) => ({ ...p, [key]: value }));
  return (
    <WidgetFrame
      title="Estimated betas and the honest interval for the premium"
      ariaLabel={
        view
          ? `A one-factor world with an annual factor Sharpe ratio of ${num(view.sharpe, 1)} and ${view.T} months, run ${REPLICATIONS} times. Top: ${N} first-pass betas around the 45-degree line of the true betas. Bottom: naive and corrected 95% intervals for the premium in the first ${SHOWN} samples, against the true premium of ${pctYear(LAMBDA, 1)} a year. Over all samples, ${share(view.w.naiveCoverage)} of the naive and ${share(view.w.correctedCoverage)} of the corrected intervals contain the truth.`
          : 'First-pass betas and confidence intervals for the premium. The simulation is loading.'
      }
      plotHeight={BETA_HEIGHT + CI_HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Factor Sharpe ratio (a year)" value={params.sharpe} min={0.2} max={5} step={0.1} onChange={set('sharpe')} format={(v) => num(v, 1)} />
          <Slider label="Sample length $T$" value={params.T} min={60} max={1200} step={12} onChange={set('T')} format={(v) => `${v} months`} />
          <Button onClick={() => setParams((p) => ({ ...p, seed: p.seed + 1 }))}>Re-roll simulation</Button>
        </>
      }
      readout={
        view ? (
          <>
            <p style={{ margin: '0 0 0.5rem' }}>
              <span style={{ color: 'var(--c-data)' }}>● estimates</span>
              {' · '}<span style={{ color: 'var(--text-muted)' }}>– – naive interval</span>
              {' · '}<span style={{ color: 'var(--c-model)' }}>━ corrected interval</span>
              {' · '}<span style={{ color: 'var(--c-error)' }}>✕ misses the true λ</span>
              {pending && <> · updating…</>}
            </p>
            <dl className="readout-grid">
              <dt><RichText>{"$c = \\lambda'\\Sigma_f^{-1}\\lambda$ (monthly)"}</RichText></dt>
              <dd>{num(view.w.c)}</dd>
              <dt>Naive standard error, average</dt>
              <dd>{pctYear(view.w.meanNaiveSE, 3)} a year</dd>
              <dt>Corrected standard error, average</dt>
              <dd style={{ color: 'var(--c-model)' }}>{pctYear(view.w.meanCorrectedSE, 3)} a year</dd>
              <dt><RichText>{'True spread of $\\hat\\lambda$ across samples'}</RichText></dt>
              <dd>{pctYear(view.w.sdLambdaHat, 3)} a year</dd>
              <dt>Intervals that contain the true λ (target 95%)</dt>
              <dd>naive {share(view.w.naiveCoverage)}, corrected {share(view.w.correctedCoverage)}</dd>
              <dt><RichText>{`Average $\\hat\\lambda$ (truth ${pctYear(LAMBDA)})`}</RichText></dt>
              <dd>{pctYear(view.w.meanLambdaHat)} a year</dd>
              <dt>Samples, seed</dt>
              <dd>{REPLICATIONS}, {view.seed}</dd>
            </dl>
            <p style={{ margin: '0.75rem 0 0.25rem' }}>
              <strong>Real data:</strong> FF3 on the 25 size–B/M portfolios{ff3 ? `, ${ff3.first} to ${ff3.last} (T = ${ff3.T})` : ''}
            </p>
            {ff3 ? (
              <dl className="readout-grid">
                <dt>Market premium</dt>
                <dd>{pctYear(ff3.lambda[0])} a year</dd>
                <dt>Naive, corrected standard error</dt>
                <dd>{pctYear(ff3.naiveSE[0], 3)}, <span style={{ color: 'var(--c-model)' }}>{pctYear(ff3.correctedSE[0], 3)}</span> a year</dd>
                <dt><RichText>{'$c$ at the estimated premia'}</RichText></dt>
                <dd>{num(ff3.c, 4)}</dd>
              </dl>
            ) : (
              <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
            )}
          </>
        ) : (
          <p>Simulating…</p>
        )
      }
      caption={`Simulated (seeded): one traded factor with a premium of 0.5% a month (6% a year) and the chosen Sharpe ratio, so its volatility is the premium over the monthly Sharpe ratio. ${N} assets with true betas from 0.5 to 1.5, $\\Ret{R^e_{i,t}} = \\beta_i\\Factor{f_t} + \\Err{\\varepsilon_{i,t}}$, residual volatility ${RESIDUAL_SD * 100}% a month, ${REPLICATIONS} samples. Each sample runs the first pass, the OLS second pass without an intercept, and both 95% intervals $\\hat\\lambda \\pm 1.96\\,\\mathrm{se}$. Means and standard errors are annualised (×12). Real data: ff3-monthly and ff25-size-bm-monthly, OLS second pass without an intercept.`}
    />
  );
}
