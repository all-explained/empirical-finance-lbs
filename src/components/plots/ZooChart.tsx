import { Line, MovablePoint, Point } from 'mafs';
import { useMemo, useState } from 'react';
import type { Construction, ZooWindow } from '../../lib/finance/zoo';
import { Segmented, Slider } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { WidgetFrame } from '../ui/WidgetFrame';
import { clamp } from './format';
import { Label, PlotFrame } from './PlotFrame';
import { CONSTRUCTIONS, useZooData, zooCounts, zooSummaries } from './zooSample';

const HEIGHT = 340;
const X: [number, number] = [1970, 2019];
const Y: [number, number] = [0, 17];
const LINE: [number, number] = [0.5, 8];
const HURDLE = 3;
const WINDOWS: { value: ZooWindow; label: string }[] = [
  { value: 'original', label: 'Original sample' },
  { value: 'post', label: 'After the sample' },
];

/**
 * Chapter 21: each OSAP predictor at its publication year and the t-statistic of its long–short return,
 * in the original paper's sample or after it, with a significance line the reader drags.
 */
export default function ZooChart({ initialLine = 1.96 }: { initialLine?: number }) {
  const [line, setLine] = useState(initialLine);
  const [construction, setConstruction] = useState<Construction>('original');
  const [sample, setSample] = useState<ZooWindow>('original');
  const { data, failed } = useZooData();

  const summaries = useMemo(() => (data ? { original: zooSummaries(data, 'original'), chosen: zooSummaries(data, construction) } : null), [data, construction]);
  const counts = summaries ? zooCounts(summaries.original, summaries.chosen, line) : null;
  const points = summaries ? summaries.chosen.flatMap((s) => (s[sample] ? [{ acronym: s.acronym, year: s.publicationYear, t: s[sample]!.t }] : [])) : [];
  const above = sample === 'original' ? counts?.inSample : counts?.post;
  const windowCount = sample === 'original' ? counts?.total : counts?.withPost;
  const setLineValue = (v: number) => setLine(clamp(Math.round(v * 100) / 100, ...LINE));

  const plot = summaries ? (
    <PlotFrame
      x={X}
      y={Y}
      height={HEIGHT}
      xTicks={[1970, 1980, 1990, 2000, 2010]}
      yTicks={[0, 2, 4, 6, 8, 10, 12, 14, 16]}
      formatY={(v) => String(v)}
      xLabel="year the paper was published"
      yLabel={<tspan style={{ fill: 'var(--c-signal)' }}>t-statistic of the mean long–short return</tspan>}
      marginLeft={36}
    >
      <Line.Segment point1={[X[0], HURDLE]} point2={[X[1], HURDLE]} color="var(--text-muted)" weight={1.5} style="dashed" />
      <Label x={X[0] + 0.5} y={HURDLE} attach="ne" attachDistance={4} size={11} color="var(--text-muted)">t = 3</Label>
      {points.map((p) => {
        const isAbove = Math.abs(p.t) > line;
        return (
          <Point
            key={p.acronym}
            x={p.year}
            y={clamp(p.t, Y[0], Y[1])}
            color="var(--c-signal)"
            svgCircleProps={{ r: 3.5, style: isAbove ? { fillOpacity: 0.75 } : { fill: 'none', stroke: 'var(--c-signal)', strokeWidth: 1.4 } }}
          />
        );
      })}
      <Line.Segment point1={[X[0], line]} point2={[X[1], line]} color="var(--text)" weight={2} />
      <Label x={X[1] - 1.5} y={line} attach="nw" attachDistance={6} size={12} color="var(--text)">{`|t| = ${line.toFixed(2)}`}</Label>
      <MovablePoint point={[X[1] - 1, line]} constrain={([, y]) => [X[1] - 1, clamp(y, ...LINE)]} onMove={([, y]) => setLineValue(y)} color="var(--text)" />
    </PlotFrame>
  ) : (
    <p style={{ padding: '1rem', margin: 0, color: 'var(--text-muted)' }}>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
  );

  const windowName = sample === 'original' ? "in the original papers' samples" : 'after the original samples';
  return (
    <WidgetFrame
      title="The factor zoo and a significance line"
      ariaLabel={
        counts
          ? `${points.length} published predictors from the Open Source Asset Pricing data, each at its publication year, 1973 to 2016, with the t-statistic of its mean long–short return ${windowName}. A horizontal line at |t| = ${line.toFixed(2)} splits them: ${above} of ${windowCount} are above it. A dashed line marks t = 3.`
          : 'Published predictors by year and t-statistic. The data is loading.'
      }
      plotHeight={HEIGHT}
      plot={plot}
      controls={
        <>
          <Slider label="Significance line $|t|$" value={line} min={LINE[0]} max={LINE[1]} step={0.01} onChange={setLineValue} format={(v) => v.toFixed(2)} color="var(--text)" />
          <Segmented label="Window" value={sample} onChange={setSample} options={WINDOWS.map((w) => ({ ...w, color: 'var(--c-signal)' }))} />
          <Segmented label="Portfolio construction" value={construction} onChange={setConstruction} options={CONSTRUCTIONS.map((c) => ({ ...c, color: 'var(--c-signal)' }))} />
        </>
      }
      readout={
        counts ? (
          <>
            <p style={{ margin: '0 0 0.5rem', color: 'var(--c-signal)' }}>● filled: above the line · ○ hollow: below it</p>
            <dl className="readout-grid">
              <dt>Line</dt>
              <dd><RichText>{`$|t| = ${line.toFixed(2)}$`}</RichText></dd>
              <dt>Above, in sample</dt>
              <dd>{counts.inSample} of {counts.total}</dd>
              <dt>Above, after it</dt>
              <dd>{counts.post} of {counts.withPost}</dd>
              <dt>Cross below vs original</dt>
              <dd>{counts.versusOriginal.crossedBelow} of {counts.versusOriginal.common}</dd>
              <dt>Median mean vs original</dt>
              <dd>{counts.versusOriginal.medianMeanRatio === null ? '—' : `${(counts.versusOriginal.medianMeanRatio * 100).toFixed(0)}%`}</dd>
            </dl>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Only the original papers' construction is committed. The value-weighted and no-microcap variants are not, so the last two rows compare it with itself.
            </p>
          </>
        ) : (
          <p>{failed ? 'The data did not load.' : 'Loading the data…'}</p>
        )
      }
      caption="Data: osap-ls-monthly and osap-signals (Chen and Zimmermann 2022, Open Source Asset Pricing, October 2025 release), 1963-01 to 2024-12, 165 predictors with clear evidence in the original paper. The t-statistic is the mean monthly long–short return over its classical standard error, in the paper's own sample (cut to start 1963-01) or in every month after it. The dashed line marks t = 3."
    />
  );
}
