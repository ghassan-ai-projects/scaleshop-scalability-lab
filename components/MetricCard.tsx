import { deterministicWave, formatMetric, metricStatus, type MetricSpec } from "@/lib/workshop";

export function MetricCard({ metric, value, seed, paused }: { metric: MetricSpec; value: number | null; seed: number; paused: boolean }) {
  const status = metricStatus(value, metric);
  const wave = deterministicWave(seed);
  return (
    <article className={`metric-card status-${status}`} aria-label={`${metric.label}: ${formatMetric(value, metric)}, ${status}`}>
      <div className="metric-topline">
        <span>{metric.label}</span>
        <span className="status-word">{status === "risk" ? "At risk" : status === "observed" ? "Observed" : status[0].toUpperCase() + status.slice(1)}</span>
      </div>
      <strong>{formatMetric(value, metric)}</strong>
      <div className={`spark-bars ${paused ? "is-paused" : ""}`} aria-hidden="true">
        {wave.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
      </div>
      <small>{metric.threshold === undefined || metric.kind === "observation" ? metric.denominator ?? metric.window ?? "60-second window" : `Target ${metric.direction === "higher" ? "≥" : metric.direction === "zero" || metric.direction === "equal" ? "=" : "≤"} ${formatMetric(metric.threshold, metric)}`}</small>
    </article>
  );
}
