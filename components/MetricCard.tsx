"use client";

import { useId, useState } from "react";
import { formatMetric, metricMeter, metricStatus, type MetricSpec } from "@/lib/workshop";

export function MetricCard({ metric, value }: { metric: MetricSpec; value: number | null }) {
  const status = metricStatus(value, metric);
  const meter = metricMeter(value, metric);
  const [definitionOpen, setDefinitionOpen] = useState(false);
  const definitionId = useId();
  const movedFromBaseline = meter?.baselineAt !== null && meter?.baselineAt !== undefined;
  return (
    <article className={`metric-card status-${status}`} aria-label={`${metric.label}: ${formatMetric(value, metric)}, ${status}`}>
      <div className="metric-topline">
        <span>{metric.label} <button className="metric-info" type="button" aria-label={`${definitionOpen ? "Hide" : "Explain"} ${metric.label}`} aria-expanded={definitionOpen} aria-controls={definitionId} onClick={() => setDefinitionOpen((open) => !open)} onKeyDown={(event) => { if (event.key === "Escape") setDefinitionOpen(false); }}><span aria-hidden="true">i</span></button></span>
        <span className="status-word">{status === "risk" ? "At risk" : status === "observed" ? "Observed" : status[0].toUpperCase() + status.slice(1)}</span>
      </div>
      <strong>{formatMetric(value, metric)}</strong>
      {meter ? (
        <div className="metric-meter" aria-hidden="true">
          <i className="meter-fill" style={{ width: `${meter.fill}%` }} />
          {movedFromBaseline && <i className="meter-baseline" style={{ left: `${meter.baselineAt}%` }} />}
          {meter.thresholdAt !== null && <i className="meter-threshold" style={{ left: `${meter.thresholdAt}%` }} />}
        </div>
      ) : (
        <div className="metric-meter is-empty" aria-hidden="true" />
      )}
      <small>
        {metric.absentComponent && value === null
          ? "Not measurable yet — this component does not exist"
          : metric.threshold === undefined || metric.kind === "observation"
            ? metric.denominator ?? metric.window ?? "60-second window"
            : `Target ${metric.direction === "higher" ? "≥" : metric.direction === "zero" || metric.direction === "equal" ? "=" : "≤"} ${formatMetric(metric.threshold, metric)}`}
        {movedFromBaseline && <span className="meter-legend"> · was {formatMetric(metric.value, metric)}</span>}
      </small>
      {definitionOpen && <div className="metric-definition" id={definitionId} role="note">
        <strong>What this means</strong><p>{metric.definition}</p>
        <span>{metric.provenance.sourceClass.replaceAll("-", " ")}</span>
        {metric.provenance.comparableTo && <p><b>Comparable to:</b> {metric.provenance.comparableTo}</p>}
        {metric.provenance.caveat && <p><b>Caveat:</b> {metric.provenance.caveat}</p>}
      </div>}
    </article>
  );
}
